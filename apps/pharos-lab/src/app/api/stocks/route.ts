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

    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('id, code, name, price, change, change_rate, rank')
      .not('rank', 'is', null)
      .order('rank', { ascending: true })
      .limit(limit);

    if (stocksError) {
      console.error('[GET /api/stocks] stocks error:', stocksError.message);
      return NextResponse.json(
        { error: 'Failed to fetch stocks' },
        { status: 500 },
      );
    }

    if (!stocks || stocks.length === 0) {
      return NextResponse.json([], {
        headers: { 'Cache-Control': CACHE_CONTROL },
      });
    }

    const stockIds = stocks.map((s) => s.id);

    const { data: scores, error: scoresError } = await supabase
      .from('stock_scores')
      .select('stock_id, fundamental, momentum, disclosure, institutional, total')
      .in('stock_id', stockIds);

    if (scoresError) {
      console.error('[GET /api/stocks] scores error:', scoresError.message);
      return NextResponse.json(
        { error: 'Failed to fetch stock scores' },
        { status: 500 },
      );
    }

    const scoreMap = new Map(
      (scores ?? []).map((s) => [
        s.stock_id,
        {
          fundamental: s.fundamental,
          momentum: s.momentum,
          disclosure: s.disclosure,
          institutional: s.institutional,
          total: s.total,
        },
      ]),
    );

    const result: RankingListItem[] = stocks.map((s) => ({
      id: s.id,
      code: s.code,
      name: s.name,
      price: s.price,
      change: s.change,
      changeRate: s.change_rate,
      rank: s.rank,
      score: scoreMap.get(s.id) ?? {
        fundamental: 0,
        momentum: 0,
        disclosure: 0,
        institutional: 0,
        total: 0,
      },
    }));

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
