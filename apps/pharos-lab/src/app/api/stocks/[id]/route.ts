/**
 * GET /api/stocks/[id]
 *
 * 특정 종목의 상세 데이터를 조회하여 반환합니다.
 * score, ranking_history, disclosures, ohlcv를 포함합니다.
 *
 * Path params:
 *   - id: 종목 ID
 *
 * Query params:
 *   - days: ranking_history, ohlcv 조회 일수 (기본값: 30)
 *   - ohlcvDays: ohlcv 전용 조회 일수 (기본값: 90, days보다 우선)
 *   - disclosureLimit: 공시 최대 조회 수 (기본값: 20)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/shared/api/supabase-server';
import type { DisclosureEvent, DisclosureType, OHLCVData, RankingHistory } from '@/entities/stock/types';
import type { RankingListItem } from '@/shared/api/dashboard';

const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

type Importance = 'high' | 'medium' | 'low';

function toDisclosureType(raw: string): DisclosureType {
  const valid: DisclosureType[] = [
    'earnings', 'dividend', 'capital', 'buyback', 'ownership',
    'contract', 'litigation', 'ir', 'governance', 'warning',
    'issuance', 'audit', 'other',
  ];
  return (valid as string[]).includes(raw) ? (raw as DisclosureType) : 'other';
}

function toImportance(raw: string): Importance {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'low';
}

interface StockDetailResponse {
  stock: RankingListItem;
  disclosures: DisclosureEvent[];
  ohlcv: OHLCVData[];
  rankingHistory: RankingHistory[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: stockId } = await params;

  if (!stockId) {
    return NextResponse.json({ error: 'Stock ID is required' }, { status: 400 });
  }

  const { searchParams } = request.nextUrl;
  const days = parseInt(searchParams.get('days') ?? '30', 10);
  const ohlcvDays = parseInt(searchParams.get('ohlcvDays') ?? '90', 10);
  const disclosureLimit = parseInt(searchParams.get('disclosureLimit') ?? '20', 10);

  try {
    const supabase = getSupabaseServer();

    // 병렬로 stock 정보, score, ranking_history, disclosures, ohlcv 조회
    const [stockResult, scoreResult, rankingResult, disclosureResult, ohlcvResult] =
      await Promise.all([
        supabase
          .from('stocks')
          .select('id, code, name, price, change, change_rate, rank')
          .eq('id', stockId)
          .maybeSingle(),
        supabase
          .from('stock_scores')
          .select('fundamental, momentum, disclosure, institutional, total, score_descriptions')
          .eq('stock_id', stockId)
          .order('scored_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('ranking_history')
          .select('rank_date, rank')
          .eq('stock_id', stockId)
          .order('rank_date', { ascending: true })
          .limit(days),
        supabase
          .from('disclosures')
          .select('id, stock_id, disclosure_date, title, type, importance')
          .eq('stock_id', stockId)
          .order('disclosure_date', { ascending: false })
          .limit(disclosureLimit),
        supabase
          .from('ohlcv')
          .select('trade_date, open, high, low, close, volume')
          .eq('stock_id', stockId)
          .order('trade_date', { ascending: true })
          .limit(ohlcvDays),
      ]);

    if (stockResult.error) {
      console.error(`[GET /api/stocks/${stockId}] stock error:`, stockResult.error.message);
      return NextResponse.json({ error: 'Failed to fetch stock' }, { status: 500 });
    }
    if (!stockResult.data) {
      return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
    }
    if (scoreResult.error) {
      console.error(`[GET /api/stocks/${stockId}] score error:`, scoreResult.error.message);
      return NextResponse.json({ error: 'Failed to fetch stock score' }, { status: 500 });
    }
    if (rankingResult.error) {
      console.error(`[GET /api/stocks/${stockId}] ranking error:`, rankingResult.error.message);
      return NextResponse.json({ error: 'Failed to fetch ranking history' }, { status: 500 });
    }
    if (disclosureResult.error) {
      console.error(
        `[GET /api/stocks/${stockId}] disclosure error:`,
        disclosureResult.error.message,
      );
      return NextResponse.json({ error: 'Failed to fetch disclosures' }, { status: 500 });
    }
    if (ohlcvResult.error) {
      console.error(`[GET /api/stocks/${stockId}] ohlcv error:`, ohlcvResult.error.message);
      return NextResponse.json({ error: 'Failed to fetch OHLCV' }, { status: 500 });
    }

    const stockRow = stockResult.data;
    const scoreRow = scoreResult.data;

    const stock: RankingListItem = {
      id: stockRow.id,
      code: stockRow.code,
      name: stockRow.name,
      price: stockRow.price,
      change: stockRow.change,
      changeRate: stockRow.change_rate,
      rank: stockRow.rank,
      score: scoreRow
        ? {
            fundamental: scoreRow.fundamental,
            momentum: scoreRow.momentum,
            disclosure: scoreRow.disclosure,
            institutional: scoreRow.institutional,
            total: scoreRow.total,
          }
        : {
            fundamental: 0,
            momentum: 0,
            disclosure: 0,
            institutional: 0,
            total: 0,
          },
      rankChange: null,
      volume: null,
      scoreDescriptions: (scoreRow?.score_descriptions as string[] | null) ?? null,
    };

    const disclosures: DisclosureEvent[] = (disclosureResult.data ?? []).map((row) => ({
      id: row.id,
      stockId: row.stock_id,
      date: row.disclosure_date,
      title: row.title,
      type: toDisclosureType(row.type),
      importance: toImportance(row.importance),
    }));

    const ohlcv: OHLCVData[] = (ohlcvResult.data ?? []).map((row) => ({
      time: row.trade_date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    }));

    const rankingHistory: RankingHistory[] = (rankingResult.data ?? []).map((row) => ({
      date: row.rank_date,
      [stockId]: row.rank,
    }));

    const response: StockDetailResponse = {
      stock,
      disclosures,
      ohlcv,
      rankingHistory,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[GET /api/stocks/${stockId}] unexpected error:`, message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
