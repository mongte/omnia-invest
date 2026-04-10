/**
 * 대시보드용 Supabase 데이터 페칭 함수 (Server Component용)
 *
 * 이 파일의 모든 함수는 서버 사이드에서 호출 가능한 async 함수입니다.
 * 클라이언트 사이드 동적 페칭은 dashboard-client.ts를 사용하세요.
 */

import { supabase } from './supabase';
import { fetchRankMaps } from './ranking-utils';
import type {
  StockData,
  DisclosureEvent,
  OHLCVData,
  RankingHistory,
  LlmSummaryData,
  LlmSentiment,
  DisclosureType,
  RankChange,
} from '@/entities/stock/types';

// ---------------------------------------------------------------------------
// 반환 타입 정의
// ---------------------------------------------------------------------------

export interface RankingListItem
  extends Pick<StockData, 'id' | 'code' | 'name' | 'price' | 'change' | 'changeRate' | 'rank'> {
  score: StockData['score'];
  /** 전일 대비 순위 변동 정보. null이면 이력 없음 */
  rankChange: RankChange | null;
  /** 최신 거래일 거래량. null이면 OHLCV 없음 */
  volume: number | null;
  /** 점수 설명 배열 (시그널, 팩터, 타이밍, ML확률 등) */
  scoreDescriptions: string[] | null;
}

/** 공시 호재/악재/중립 판정 */
export type DisclosureSentiment = 'positive' | 'negative' | 'neutral';

/**
 * 공시의 type 기반으로 호재/악재/중립을 판정합니다.
 * - 호재(positive): earnings, dividend, buyback, contract, ir
 * - 악재(negative): capital, issuance, litigation, warning
 * - 중립(neutral): governance, ownership, audit, other
 */
export function getDisclosureSentiment(
  type: DisclosureType,
  _importance: DisclosureEvent['importance'],
): DisclosureSentiment {
  switch (type) {
    case 'earnings':
    case 'dividend':
    case 'buyback':
    case 'contract':
    case 'ir':
      return 'positive';
    case 'capital':
    case 'issuance':
    case 'litigation':
    case 'warning':
      return 'negative';
    default:
      return 'neutral';
  }
}

export interface StockDetail {
  stock: RankingListItem;
  disclosures: DisclosureEvent[];
  llmSummaries: LlmSummaryData[];
  ohlcv: OHLCVData[];
  rankingHistory: RankingHistory[];
}

// ---------------------------------------------------------------------------
// 내부 유틸리티
// ---------------------------------------------------------------------------

function toDisclosureType(raw: string): DisclosureType {
  const valid: DisclosureType[] = [
    'earnings', 'dividend', 'capital', 'buyback', 'ownership',
    'contract', 'litigation', 'ir', 'governance', 'warning',
    'issuance', 'audit', 'other',
  ];
  return (valid as string[]).includes(raw) ? (raw as DisclosureType) : 'other';
}

function toImportance(raw: string): 'high' | 'medium' | 'low' {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'low';
}

function toLlmSentiment(raw: string): LlmSentiment {
  if (raw === 'positive' || raw === 'negative' || raw === 'neutral') return raw;
  return 'neutral';
}

// ---------------------------------------------------------------------------
// 초기 랭킹 목록 조회
// ---------------------------------------------------------------------------

export interface PaginatedRankingList {
  items: RankingListItem[];
  hasMore: boolean;
}

/**
 * 상위 N개 종목 랭킹 목록을 조회합니다.
 * stocks 테이블과 stock_scores 테이블을 조인합니다.
 *
 * @param limit - 조회할 상위 종목 수 (기본값: 50)
 * @param offset - 조회 시작 오프셋 (기본값: 0)
 */
export async function fetchRankingList(
  limit = 50,
  offset = 0,
): Promise<PaginatedRankingList> {
  // stock_scores.total 내림차순 정렬 후 range로 페이지 조회
  const { data: scores, error: scoresError } = await supabase
    .from('stock_scores')
    .select('stock_id, fundamental, momentum, disclosure, institutional, total, score_descriptions')
    .order('total', { ascending: false })
    .range(offset, offset + limit - 1);

  if (scoresError) {
    throw new Error(`[dashboard] fetchRankingList scores: ${scoresError.message}`);
  }
  if (!scores || scores.length === 0) {
    return { items: [], hasMore: false };
  }

  const stockIds = scores.map((s) => s.stock_id);

  // stocks 정보, 순위 맵(최신+직전), 최신 거래량을 병렬 조회
  const [stocksResult, rankMaps, ohlcvResult] = await Promise.all([
    supabase
      .from('stocks')
      .select('id, code, name, price, change, change_rate, rank')
      .in('id', stockIds),
    fetchRankMaps(supabase, stockIds),
    supabase
      .from('ohlcv')
      .select('stock_id, volume')
      .in('stock_id', stockIds)
      .order('trade_date', { ascending: false })
      .limit(stockIds.length),
  ]);

  if (stocksResult.error) {
    throw new Error(`[dashboard] fetchRankingList stocks: ${stocksResult.error.message}`);
  }

  const stockMap = new Map(
    (stocksResult.data ?? []).map((s) => [s.id, s]),
  );

  // 최신 거래량 맵 구성 (stock_id별 첫 번째 = 최신)
  const volumeMap = new Map<string, number>();
  for (const row of ohlcvResult.data ?? []) {
    if (!volumeMap.has(row.stock_id)) {
      volumeMap.set(row.stock_id, row.volume);
    }
  }

  // scores 순서 유지 (total 내림차순) + stockMap에 없는 항목 제외
  const result: RankingListItem[] = [];
  for (const score of scores) {
    const stockRow = stockMap.get(score.stock_id);
    if (!stockRow) continue;

    const prevRank = rankMaps.prevRankMap.get(score.stock_id) ?? null;
    const currentRank = rankMaps.currentRankMap.get(score.stock_id) ?? null;
    const delta =
      prevRank !== null && currentRank !== null ? prevRank - currentRank : null;

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
      rankChange:
        prevRank !== null
          ? { previousRank: prevRank, delta }
          : null,
      volume: volumeMap.get(score.stock_id) ?? null,
      scoreDescriptions: score.score_descriptions ?? null,
    });
  }

  return { items: result, hasMore: scores.length === limit };
}

// ---------------------------------------------------------------------------
// 종목 랭킹 검색
// ---------------------------------------------------------------------------

/**
 * 종목명 또는 종목코드로 검색하여 RankingListItem[] 형태로 반환합니다.
 *
 * @param query - 검색 쿼리 (종목명 또는 종목코드)
 * @returns 매칭된 종목 목록 (total 내림차순, 최대 20개)
 */
export async function fetchRankingSearch(query: string): Promise<RankingListItem[]> {
  if (query.trim() === '') return [];

  // 1. stocks 테이블에서 name/code ilike 필터로 매칭된 종목 조회
  const { data: matchedStocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, code, name, price, change, change_rate, rank')
    .or(`name.ilike.%${query}%,code.ilike.%${query}%`);

  if (stocksError) {
    throw new Error(`[dashboard] fetchRankingSearch stocks: ${stocksError.message}`);
  }
  if (!matchedStocks || matchedStocks.length === 0) return [];

  const stockIds = matchedStocks.map((s) => s.id);

  // 2. stock_scores, rankMaps, 최신 거래량을 병렬 조회
  const [scoresResult, rankMaps, ohlcvResult] = await Promise.all([
    supabase
      .from('stock_scores')
      .select('stock_id, fundamental, momentum, disclosure, institutional, total, score_descriptions')
      .in('stock_id', stockIds),
    fetchRankMaps(supabase, stockIds),
    supabase
      .from('ohlcv')
      .select('stock_id, volume')
      .in('stock_id', stockIds)
      .order('trade_date', { ascending: false })
      .limit(stockIds.length),
  ]);

  if (scoresResult.error) {
    throw new Error(`[dashboard] fetchRankingSearch scores: ${scoresResult.error.message}`);
  }

  const scoreMap = new Map(
    (scoresResult.data ?? []).map((s) => [s.stock_id, s]),
  );

  const volumeMap = new Map<string, number>();
  for (const row of ohlcvResult.data ?? []) {
    if (!volumeMap.has(row.stock_id)) {
      volumeMap.set(row.stock_id, row.volume);
    }
  }

  const stockMap = new Map(matchedStocks.map((s) => [s.id, s]));

  // 3. score가 있는 종목만 RankingListItem으로 변환
  const result: RankingListItem[] = [];
  for (const stockId of stockIds) {
    const stockRow = stockMap.get(stockId);
    const score = scoreMap.get(stockId);
    if (!stockRow || !score) continue;

    const prevRank = rankMaps.prevRankMap.get(stockId) ?? null;
    const currentRank = rankMaps.currentRankMap.get(stockId) ?? null;
    const delta =
      prevRank !== null && currentRank !== null ? prevRank - currentRank : null;

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
      rankChange:
        prevRank !== null
          ? { previousRank: prevRank, delta }
          : null,
      volume: volumeMap.get(stockId) ?? null,
      scoreDescriptions: score.score_descriptions ?? null,
    });
  }

  // 4. total 내림차순 정렬 후 최대 20개 반환
  return result
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 20);
}

// ---------------------------------------------------------------------------
// 종목별 상세 데이터 조회
// ---------------------------------------------------------------------------

/**
 * 종목의 점수 및 설명을 조회합니다.
 */
export async function fetchStockScore(
  stockId: string,
): Promise<StockData['score'] & { scoreDescriptions: string[] | null }> {
  const { data, error } = await supabase
    .from('stock_scores')
    .select(
      'fundamental, momentum, disclosure, institutional, total, score_descriptions',
    )
    .eq('stock_id', stockId)
    .order('scored_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[dashboard] fetchStockScore: ${error.message}`);
  }

  if (!data) {
    return {
      fundamental: 0,
      momentum: 0,
      disclosure: 0,
      institutional: 0,
      total: 0,
      scoreDescriptions: null,
    };
  }

  return {
    fundamental: data.fundamental,
    momentum: data.momentum,
    disclosure: data.disclosure,
    institutional: data.institutional,
    total: data.total,
    scoreDescriptions: data.score_descriptions,
  };
}

/**
 * 종목의 순위 이력을 조회합니다.
 * RankingHistory[]는 { date, [stockId]: rank } 형태로 변환됩니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param days - 조회할 일수 (기본값: 30)
 */
export async function fetchRankingHistory(
  stockId: string,
  days = 30,
): Promise<RankingHistory[]> {
  const { data, error } = await supabase
    .from('ranking_history')
    .select('rank_date, rank')
    .eq('stock_id', stockId)
    .order('rank_date', { ascending: true })
    .limit(days);

  if (error) {
    throw new Error(`[dashboard] fetchRankingHistory: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    date: row.rank_date,
    [stockId]: row.rank,
  }));
}

/**
 * 종목의 공시 목록을 조회합니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param limit - 최대 조회 수 (기본값: 100)
 */
export async function fetchDisclosures(
  stockId: string,
  limit = 100,
): Promise<DisclosureEvent[]> {
  const { data, error } = await supabase
    .from('disclosures')
    .select('id, stock_id, disclosure_date, title, type, importance')
    .eq('stock_id', stockId)
    .order('disclosure_date', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`[dashboard] fetchDisclosures: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    stockId: row.stock_id,
    date: row.disclosure_date,
    title: row.title,
    type: toDisclosureType(row.type),
    importance: toImportance(row.importance),
  }));
}

/**
 * 공시 ID 목록에 해당하는 LLM 요약 목록을 조회합니다.
 *
 * @param disclosureIds - 조회할 공시 ID 목록
 */
export async function fetchLlmSummaries(
  disclosureIds: string[],
): Promise<LlmSummaryData[]> {
  if (disclosureIds.length === 0) return [];

  const { data, error } = await supabase
    .from('llm_summaries')
    .select('id, disclosure_id, points, sentiment, impact, model, created_at')
    .in('disclosure_id', disclosureIds);

  if (error) {
    throw new Error(`[dashboard] fetchLlmSummaries: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    disclosureId: row.disclosure_id,
    points: row.points,
    sentiment: toLlmSentiment(row.sentiment),
    impact: row.impact,
    model: row.model,
    createdAt: row.created_at,
  }));
}

/**
 * 종목의 OHLCV 데이터를 조회합니다.
 * public.ohlcv 테이블을 사용합니다.
 *
 * @param stockId - 조회할 종목 ID
 * @param days - 조회할 일수 (기본값: 365)
 */
export async function fetchOhlcv(stockId: string, days = 365): Promise<OHLCVData[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('ohlcv')
    .select('trade_date, open, high, low, close, volume')
    .eq('stock_id', stockId)
    .gte('trade_date', fromDateStr)
    .order('trade_date', { ascending: true });

  if (error) {
    throw new Error(`[dashboard] fetchOhlcv: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    time: row.trade_date,
    open: row.open,
    high: row.high,
    low: row.low,
    close: row.close,
    volume: row.volume,
  }));
}

/**
 * 특정 종목의 모든 상세 데이터를 병렬로 조회합니다.
 * 점수, 순위 이력, 공시, LLM 요약, OHLCV를 한 번에 가져옵니다.
 *
 * @param stockId - 조회할 종목 ID
 */
export async function fetchStockDetail(stockId: string): Promise<StockDetail> {
  const [scoreResult, rankingResult, disclosuresResult, ohlcvResult] =
    await Promise.allSettled([
      fetchStockScore(stockId),
      fetchRankingHistory(stockId),
      fetchDisclosures(stockId),
      fetchOhlcv(stockId),
    ]);

  const scoreData =
    scoreResult.status === 'fulfilled'
      ? scoreResult.value
      : { fundamental: 0, momentum: 0, disclosure: 0, institutional: 0, total: 0, scoreDescriptions: null };
  const rankingHistory = rankingResult.status === 'fulfilled' ? rankingResult.value : [];
  const disclosures = disclosuresResult.status === 'fulfilled' ? disclosuresResult.value : [];
  const ohlcv = ohlcvResult.status === 'fulfilled' ? ohlcvResult.value : [];

  const disclosureIds = disclosures.map((d) => d.id);
  const llmSummaries = await fetchLlmSummaries(disclosureIds);

  const { data: stockRow, error: stockError } = await supabase
    .from('stocks')
    .select('id, code, name, price, change, change_rate, rank')
    .eq('id', stockId)
    .maybeSingle();

  if (stockError) {
    throw new Error(`[dashboard] fetchStockDetail stocks: ${stockError.message}`);
  }
  if (!stockRow) {
    throw new Error(`[dashboard] fetchStockDetail: stock not found (${stockId})`);
  }

  // 최신 거래량 조회
  const { data: latestOhlcv } = await supabase
    .from('ohlcv')
    .select('volume')
    .eq('stock_id', stockId)
    .order('trade_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stock: RankingListItem = {
    id: stockRow.id,
    code: stockRow.code,
    name: stockRow.name,
    price: stockRow.price,
    change: stockRow.change,
    changeRate: stockRow.change_rate,
    rank: stockRow.rank,
    score: {
      fundamental: scoreData.fundamental,
      momentum: scoreData.momentum,
      disclosure: scoreData.disclosure,
      institutional: scoreData.institutional,
      total: scoreData.total,
    },
    rankChange: null,
    volume: latestOhlcv?.volume ?? null,
    scoreDescriptions: scoreData.scoreDescriptions ?? null,
  };

  return {
    stock,
    disclosures,
    llmSummaries,
    ohlcv,
    rankingHistory,
  };
}
