export interface StockScore {
  fundamental: number;
  momentum: number;
  disclosure: number;
  institutional: number;
  total: number;
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

export type DisclosureType = 'earnings' | 'ownership' | 'other';

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
