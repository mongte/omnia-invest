/**
 * GET /api/stocks
 *
 * 랭킹 목록을 조회하여 반환합니다.
 * Supabase service_role key를 서버에서만 사용하여 보안을 강화합니다.
 *
 * Query params:
 *   - limit: 조회할 상위 종목 수 (기본값: 50)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/shared/api/supabase-server';
import type { RankingListItem } from '@/shared/api/dashboard';
import type { RankChange } from '@/entities/stock/types';

const CACHE_CONTROL = 'public, s-maxage=300, stale-while-revalidate=600';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const limitParam = searchParams.get('limit');
  const limit = limitParam !== null ? parseInt(limitParam, 10) : 50;

  if (isNaN(limit) || limit <= 0) {
    return NextResponse.json(
      { error: 'Invalid limit parameter' },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();

    // stock_scores.total 내림차순 정렬 후 상위 N개 stock_id 획득
    const { data: scores, error: scoresError } = await supabase
      .from('stock_scores')
      .select('stock_id, fundamental, momentum, disclosure, institutional, total, score_descriptions')
      .order('total', { ascending: false })
      .limit(limit);

    if (scoresError) {
      console.error('[GET /api/stocks] scores error:', scoresError.message);
      return NextResponse.json(
        { error: 'Failed to fetch stock scores' },
        { status: 500 },
      );
    }

    if (!scores || scores.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': CACHE_CONTROL },
      });
    }

    const stockIds = scores.map((s) => s.stock_id);

    const [stocksResult, historyResult] = await Promise.all([
      supabase
        .from('stocks')
        .select('id, code, name, price, change, change_rate, rank')
        .in('id', stockIds),
      supabase
        .from('ranking_history')
        .select('stock_id, rank_date, rank')
        .in('stock_id', stockIds)
        .order('rank_date', { ascending: false })
        .limit(stockIds.length * 2),
    ]);

    if (stocksResult.error) {
      console.error('[GET /api/stocks] stocks error:', stocksResult.error.message);
      return NextResponse.json(
        { error: 'Failed to fetch stocks' },
        { status: 500 },
      );
    }

    const stockMap = new Map(
      (stocksResult.data ?? []).map((s) => [s.id, s]),
    );

    // 전일 순위 맵 구성
    const historyRows = historyResult.data ?? [];
    const byStock = new Map<string, Array<{ rank_date: string; rank: number }>>();
    for (const row of historyRows) {
      const existing = byStock.get(row.stock_id) ?? [];
      existing.push({ rank_date: row.rank_date, rank: row.rank });
      byStock.set(row.stock_id, existing);
    }
    const prevRankMap = new Map<string, number | null>();
    for (const [stockId, rows] of byStock.entries()) {
      rows.sort((a, b) => (a.rank_date > b.rank_date ? -1 : 1));
      prevRankMap.set(stockId, rows[1]?.rank ?? null);
    }

    // scores 순서(total 내림차순) 유지
    const result: RankingListItem[] = [];
    for (const score of scores) {
      const stockRow = stockMap.get(score.stock_id);
      if (!stockRow) continue;

      const prevRank = prevRankMap.get(score.stock_id) ?? null;
      const currentRank = stockRow.rank;
      const delta =
        prevRank !== null && currentRank !== null ? prevRank - currentRank : null;
      const rankChange: RankChange | null =
        prevRank !== null ? { previousRank: prevRank, delta } : null;

      result.push({
        id: stockRow.id,
        code: stockRow.code,
        name: stockRow.name,
        price: stockRow.price,
        change: stockRow.change,
        changeRate: stockRow.change_rate,
        rank: stockRow.rank,
        score: {
          fundamental: score.fundamental,
          momentum: score.momentum,
          disclosure: score.disclosure,
          institutional: score.institutional,
          total: score.total,
        },
        rankChange,
        volume: null,
        scoreDescriptions: score.score_descriptions ?? null,
      });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': CACHE_CONTROL },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[GET /api/stocks] unexpected error:', message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
