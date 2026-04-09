import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/shared/types/supabase';

export interface RankMaps {
  /** 최신 기록일 기준 종목별 스코어 순위 */
  currentRankMap: Map<string, number>;
  /** 직전 기록일 기준 종목별 스코어 순위 */
  prevRankMap: Map<string, number>;
}

/**
 * 주어진 stockIds에 대해 최신 및 직전 기록일의 스코어 순위를 반환합니다.
 *
 * 알고리즘 (4-step):
 * 1. ranking_history 최신 rank_date 조회
 * 2. 그보다 이전인 가장 최신 rank_date 조회
 * 3. 최신 날짜 rank 조회 → currentRankMap
 * 4. 직전 날짜 rank 조회 → prevRankMap
 *
 * 주의: stocks.rank는 거래량 순위이므로 delta 계산에 사용하지 않음.
 */
export async function fetchRankMaps(
  supabase: SupabaseClient<Database>,
  stockIds: string[],
): Promise<RankMaps> {
  if (stockIds.length === 0) {
    return { currentRankMap: new Map(), prevRankMap: new Map() };
  }

  // Step 1: 최신 날짜
  const { data: latestRow } = await supabase
    .from('ranking_history')
    .select('rank_date')
    .order('rank_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestRow) {
    return { currentRankMap: new Map(), prevRankMap: new Map() };
  }

  // Step 2: 직전 날짜
  const { data: prevDateRow } = await supabase
    .from('ranking_history')
    .select('rank_date')
    .lt('rank_date', latestRow.rank_date)
    .order('rank_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Step 3 & 4: 두 날짜의 rank를 병렬 조회
  const [currentRows, prevRows] = await Promise.all([
    supabase
      .from('ranking_history')
      .select('stock_id, rank')
      .in('stock_id', stockIds)
      .eq('rank_date', latestRow.rank_date),
    prevDateRow
      ? supabase
          .from('ranking_history')
          .select('stock_id, rank')
          .in('stock_id', stockIds)
          .eq('rank_date', prevDateRow.rank_date)
      : Promise.resolve({ data: [] }),
  ]);

  const currentRankMap = new Map<string, number>();
  for (const row of currentRows.data ?? []) {
    currentRankMap.set(row.stock_id, row.rank);
  }

  const prevRankMap = new Map<string, number>();
  for (const row of (prevRows as { data: Array<{ stock_id: string; rank: number }> | null }).data ?? []) {
    prevRankMap.set(row.stock_id, row.rank);
  }

  return { currentRankMap, prevRankMap };
}
