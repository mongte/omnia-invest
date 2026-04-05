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
  rank: number;
  scoreDescriptions: string[];
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
