export interface StockScore {
  fundamental: number;
  momentum: number;
  disclosure: number;
  institutional: number;
  total: number;
}

/** 순위 변동 정보 */
export interface RankChange {
  /** 이전 순위. null이면 신규 진입 */
  previousRank: number | null;
  /** delta = previousRank - currentRank. 양수=상승, 음수=하락, 0=유지, null=신규 */
  delta: number | null;
}

export interface StockData {
  id: string;
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  score: StockScore;
  /** DB: stocks.rank — null 가능 */
  rank: number | null;
  /** DB: stock_scores.score_descriptions — null 가능 */
  scoreDescriptions: string[] | null;
}

export type DisclosureType =
  | 'earnings'   // 실적/보고서
  | 'dividend'   // 배당
  | 'capital'    // 유상증자/CB 등
  | 'buyback'    // 자기주식취득
  | 'ownership'  // 지분변동
  | 'contract'   // 계약체결
  | 'litigation' // 소송/제재
  | 'ir'         // IR/공정공시
  | 'governance' // 주주총회/이사회
  | 'warning'    // 관리종목/투자경고
  | 'issuance'   // 증권발행
  | 'audit'      // 감사보고서
  | 'other';

export interface DisclosureEvent {
  id: string;
  stockId: string;
  date: string;
  title: string;
  type: DisclosureType;
  importance: 'high' | 'medium' | 'low';
}

export interface OHLCVData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface RankingHistory {
  date: string;
  [stockId: string]: number | string;
}

export type LlmSentiment = 'positive' | 'negative' | 'neutral';

/**
 * LLM이 공시 원문을 분석하여 생성한 요약 데이터.
 * DB 테이블: public.llm_summaries
 */
export interface LlmSummaryData {
  id: string;
  disclosureId: string;
  points: string[];
  sentiment: LlmSentiment;
  impact: string;
  model: string;
  createdAt: string;
}
