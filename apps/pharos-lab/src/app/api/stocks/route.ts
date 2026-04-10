/**
 * GET /api/stocks
 *
 * 랭킹 목록을 조회하여 반환합니다.
 * Supabase service_role key를 서버에서만 사용하여 보안을 강화합니다.
 *
 * Query params:
 *   - limit: 조회할 상위 종목 수 (기본값: 50)
 *   - offset: 조회 시작 오프셋 (기본값: 0)
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/shared/api/supabase-server';
import { fetchRankMaps } from '@/shared/api/ranking-utils';
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

  const offsetParam = searchParams.get('offset');
  const offset = offsetParam !== null ? parseInt(offsetParam, 10) : 0;

  if (isNaN(offset) || offset < 0) {
    return NextResponse.json(
      { error: 'Invalid offset parameter' },
      { status: 400 },
    );
  }

  try {
    const supabase = getSupabaseServer();

    // stock_scores.total 내림차순 정렬 후 range로 페이지 조회
    const { data: scores, error: scoresError } = await supabase
      .from('stock_scores')
      .select('stock_id, fundamental, momentum, disclosure, institutional, total, score_descriptions')
      .order('total', { ascending: false })
      .range(offset, offset + limit - 1);

    if (scoresError) {
      console.error('[GET /api/stocks] scores error:', scoresError.message);
      return NextResponse.json(
        { error: 'Failed to fetch stock scores' },
        { status: 500 },
      );
    }

    if (!scores || scores.length === 0) {
      return NextResponse.json({ items: [], hasMore: false }, {
        headers: { 'Cache-Control': CACHE_CONTROL },
      });
    }

    const stockIds = scores.map((s) => s.stock_id);

    const [stocksResult, rankMaps] = await Promise.all([
      supabase
        .from('stocks')
        .select('id, code, name, price, change, change_rate, rank')
        .in('id', stockIds),
      fetchRankMaps(supabase, stockIds),
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

    // scores 순서(total 내림차순) 유지
    const result: RankingListItem[] = [];
    for (const score of scores) {
      const stockRow = stockMap.get(score.stock_id);
      if (!stockRow) continue;

      const prevRank = rankMaps.prevRankMap.get(score.stock_id) ?? null;
      const currentRank = rankMaps.currentRankMap.get(score.stock_id) ?? null;
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
        scoreDescriptions: (score.score_descriptions as string[] | null) ?? null,
      });
    }

    return NextResponse.json({ items: result, hasMore: scores.length === limit }, {
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
