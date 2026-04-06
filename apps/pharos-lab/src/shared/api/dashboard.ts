/**
 * 대시보드용 Supabase 데이터 페칭 함수 (Server Component용)
 *
 * 이 파일의 모든 함수는 서버 사이드에서 호출 가능한 async 함수입니다.
 * 클라이언트 사이드 동적 페칭은 dashboard-client.ts를 사용하세요.
 */

import { supabase } from './supabase';
import type {
  StockData,
  DisclosureEvent,
  OHLCVData,
  RankingHistory,
  LlmSummaryData,
  LlmSentiment,
  DisclosureType,
} from '@/entities/stock/types';

// ---------------------------------------------------------------------------
// 반환 타입 정의
// ---------------------------------------------------------------------------

export interface RankingListItem
  extends Pick<StockData, 'id' | 'code' | 'name' | 'price' | 'change' | 'changeRate' | 'rank'> {
  score: StockData['score'];
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
  if (raw === 'earnings' || raw === 'ownership') return raw;
  return 'other';
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

/**
 * 상위 N개 종목 랭킹 목록을 조회합니다.
 * stocks 테이블과 stock_scores 테이블을 조인합니다.
 *
 * @param limit - 조회할 상위 종목 수 (기본값: 50)
 */
export async function fetchRankingList(limit = 50): Promise<RankingListItem[]> {
  const { data: stocks, error: stocksError } = await supabase
    .from('stocks')
    .select('id, code, name, price, change, change_rate, rank')
    .not('rank', 'is', null)
    .order('rank', { ascending: true })
    .limit(limit);

  if (stocksError) {
    throw new Error(`[dashboard] fetchRankingList stocks: ${stocksError.message}`);
  }
  if (!stocks || stocks.length === 0) {
    return [];
  }

  const stockIds = stocks.map((s) => s.id);

  const { data: scores, error: scoresError } = await supabase
    .from('stock_scores')
    .select('stock_id, fundamental, momentum, disclosure, institutional, total, score_descriptions')
    .in('stock_id', stockIds);

  if (scoresError) {
    throw new Error(`[dashboard] fetchRankingList scores: ${scoresError.message}`);
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

  return stocks.map((s) => ({
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
 * @param limit - 최대 조회 수 (기본값: 20)
 */
export async function fetchDisclosures(
  stockId: string,
  limit = 20,
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
 * @param days - 조회할 일수 (기본값: 90)
 */
export async function fetchOhlcv(stockId: string, days = 90): Promise<OHLCVData[]> {
  const { data, error } = await supabase
    .from('ohlcv')
    .select('trade_date, open, high, low, close, volume')
    .eq('stock_id', stockId)
    .order('trade_date', { ascending: true })
    .limit(days);

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
  const [scoreData, rankingHistory, disclosures, ohlcv] = await Promise.all([
    fetchStockScore(stockId),
    fetchRankingHistory(stockId),
    fetchDisclosures(stockId),
    fetchOhlcv(stockId),
  ]);

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
  };

  return {
    stock,
    disclosures,
    llmSummaries,
    ohlcv,
    rankingHistory,
  };
}
