/**
 * 대시보드용 클라이언트 사이드 동적 데이터 페칭 함수
 *
 * 이 파일의 함수는 클라이언트 컴포넌트(use client)에서 사용합니다.
 * Server Component에서는 dashboard.ts를 사용하세요.
 *
 * 모든 함수는 Supabase 클라이언트를 직접 사용하므로
 * NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 필요합니다.
 */

import type { DisclosureEvent, OHLCVData, LlmSummaryData, RankingHistory } from '@/entities/stock/types';
import type { PaginatedRankingList, RankingListItem, StockDetail } from './dashboard';
import {
  fetchRankingList,
  fetchRankingSearch,
  fetchStockDetail,
  fetchDisclosures,
  fetchLlmSummaries,
  fetchOhlcv,
  fetchRankingHistory,
} from './dashboard';

// ---------------------------------------------------------------------------
// 클라이언트 사이드 동적 페칭 함수
// ---------------------------------------------------------------------------

/**
 * 종목 선택 시 해당 종목의 상세 데이터를 동적으로 조회합니다.
 * 공시, LLM 요약, OHLCV, 순위 이력을 병렬로 가져옵니다.
 *
 * @param stockId - 선택된 종목 ID
 */
export async function fetchStockDetailClient(stockId: string): Promise<StockDetail> {
  return fetchStockDetail(stockId);
}

/**
 * 공시 목록을 클라이언트 사이드에서 동적으로 조회합니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param limit - 최대 조회 수 (기본값: 100)
 */
export async function fetchDisclosuresClient(
  stockId: string,
  limit = 100,
): Promise<DisclosureEvent[]> {
  return fetchDisclosures(stockId, limit);
}

/**
 * 공시 ID 목록에 해당하는 LLM 요약을 클라이언트 사이드에서 조회합니다.
 *
 * @param disclosureIds - 조회할 공시 ID 목록
 */
export async function fetchLlmSummariesClient(
  disclosureIds: string[],
): Promise<LlmSummaryData[]> {
  return fetchLlmSummaries(disclosureIds);
}

/**
 * OHLCV 데이터를 클라이언트 사이드에서 동적으로 조회합니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param days - 조회할 일수 (기본값: 365)
 */
export async function fetchOhlcvClient(stockId: string, days = 365): Promise<OHLCVData[]> {
  return fetchOhlcv(stockId, days);
}

/**
 * 순위 이력을 클라이언트 사이드에서 동적으로 조회합니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param days - 조회할 일수 (기본값: 30)
 */
export async function fetchRankingHistoryClient(
  stockId: string,
  days = 30,
): Promise<RankingHistory[]> {
  return fetchRankingHistory(stockId, days);
}

/**
 * 랭킹 목록을 클라이언트 사이드에서 새로 고침합니다.
 *
 * @param limit - 조회할 상위 종목 수 (기본값: 50)
 */
export async function fetchRankingListClient(
  limit = 50,
  offset = 0,
): Promise<PaginatedRankingList> {
  return fetchRankingList(limit, offset);
}

/**
 * 종목명 또는 종목코드로 랭킹 목록을 검색합니다.
 *
 * @param query - 검색 쿼리 (종목명 또는 종목코드)
 */
export async function fetchRankingSearchClient(query: string): Promise<RankingListItem[]> {
  return fetchRankingSearch(query);
}
