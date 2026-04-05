import type {
  StockData,
  DisclosureEvent,
  OHLCVData,
  RankingHistory,
} from '@/entities/stock';

export const MOCK_STOCKS: StockData[] = [
  {
    id: 'samsung',
    code: '005930',
    name: '삼성전자',
    price: 71500,
    change: 1200,
    changeRate: 1.71,
    rank: 1,
    score: {
      fundamental: 82,
      momentum: 71,
      disclosure: 65,
      institutional: 88,
      total: 79,
    },
    scoreDescriptions: [
      'PER 8.2로 업종 평균 대비 저평가',
      '최근 20일 상승 추세',
      '기관 순매수 5거래일 연속',
      '2분기 실적 기대치 상회 가능성',
    ],
  },
  {
    id: 'skhynix',
    code: '000660',
    name: 'SK하이닉스',
    price: 185000,
    change: -2500,
    changeRate: -1.33,
    rank: 2,
    score: {
      fundamental: 75,
      momentum: 84,
      disclosure: 72,
      institutional: 80,
      total: 78,
    },
    scoreDescriptions: [
      'HBM3E 양산 확대로 수익성 개선',
      '외국인 순매수 지속',
      '목표주가 상향 조정 잇달아',
      '메모리 사이클 상승 구간 진입',
    ],
  },
  {
    id: 'lgenergy',
    code: '373220',
    name: 'LG에너지솔루션',
    price: 312000,
    change: 4500,
    changeRate: 1.46,
    rank: 3,
    score: {
      fundamental: 68,
      momentum: 76,
      disclosure: 58,
      institutional: 72,
      total: 70,
    },
    scoreDescriptions: [
      'EV 배터리 수주 잔고 증가',
      'GM·혼다와 합작법인 수익화 본격화',
      '원자재 가격 안정화 수혜',
    ],
  },
  {
    id: 'hyundai',
    code: '005380',
    name: '현대차',
    price: 235000,
    change: 3000,
    changeRate: 1.29,
    rank: 4,
    score: {
      fundamental: 71,
      momentum: 62,
      disclosure: 80,
      institutional: 65,
      total: 69,
    },
    scoreDescriptions: [
      '글로벌 판매량 호조',
      '수소차 사업 모멘텀',
      '배당 수익률 매력',
    ],
  },
  {
    id: 'naver',
    code: '035420',
    name: 'NAVER',
    price: 158500,
    change: -1000,
    changeRate: -0.63,
    rank: 5,
    score: {
      fundamental: 64,
      momentum: 58,
      disclosure: 75,
      institutional: 60,
      total: 64,
    },
    scoreDescriptions: [
      'AI 검색 시장 점유율 방어',
      '웹툰·커머스 글로벌 확장',
      '광고 경기 회복 기대',
    ],
  },
  {
    id: 'kakao',
    code: '035720',
    name: '카카오',
    price: 38200,
    change: 600,
    changeRate: 1.60,
    rank: 6,
    score: {
      fundamental: 55,
      momentum: 67,
      disclosure: 60,
      institutional: 52,
      total: 58,
    },
    scoreDescriptions: [
      '플랫폼 규제 불확실성 해소 기대',
      '카카오페이 수익화 가속',
    ],
  },
  {
    id: 'posco',
    code: '005490',
    name: 'POSCO홀딩스',
    price: 328000,
    change: 5000,
    changeRate: 1.55,
    rank: 7,
    score: {
      fundamental: 73,
      momentum: 69,
      disclosure: 62,
      institutional: 70,
      total: 69,
    },
    scoreDescriptions: [
      '리튬·니켈 2차전지 소재 성장',
      '철강 업황 점진적 회복',
    ],
  },
  {
    id: 'celltrion',
    code: '068270',
    name: '셀트리온',
    price: 143500,
    change: -2000,
    changeRate: -1.37,
    rank: 8,
    score: {
      fundamental: 60,
      momentum: 55,
      disclosure: 70,
      institutional: 58,
      total: 61,
    },
    scoreDescriptions: [
      '바이오시밀러 미국 시장 점유율 확대',
      '3분기 실적 개선 전망',
    ],
  },
  {
    id: 'kb',
    code: '105560',
    name: 'KB금융',
    price: 82400,
    change: 900,
    changeRate: 1.10,
    rank: 9,
    score: {
      fundamental: 78,
      momentum: 60,
      disclosure: 68,
      institutional: 74,
      total: 70,
    },
    scoreDescriptions: [
      '금리 환경 수혜, NIM 개선',
      '밸류업 정책 수혜주',
      '높은 배당 수익률',
    ],
  },
  {
    id: 'shinhan',
    code: '055550',
    name: '신한지주',
    price: 55800,
    change: 400,
    changeRate: 0.72,
    rank: 10,
    score: {
      fundamental: 76,
      momentum: 57,
      disclosure: 66,
      institutional: 71,
      total: 67,
    },
    scoreDescriptions: [
      '해외 사업 성장성 부각',
      '안정적 배당 정책',
    ],
  },
];

export const MOCK_DISCLOSURES: DisclosureEvent[] = [
  {
    id: 'disc-1',
    stockId: 'samsung',
    date: '2026-04-02',
    title: '2026년 1분기 잠정실적 발표',
    type: 'earnings',
    importance: 'high',
  },
  {
    id: 'disc-2',
    stockId: 'samsung',
    date: '2026-03-28',
    title: '자기주식 취득 결정',
    type: 'other',
    importance: 'medium',
  },
  {
    id: 'disc-3',
    stockId: 'samsung',
    date: '2026-03-20',
    title: '주요주주 지분 변동 공시',
    type: 'ownership',
    importance: 'medium',
  },
  {
    id: 'disc-4',
    stockId: 'samsung',
    date: '2026-03-15',
    title: '임원 퇴직 공시',
    type: 'other',
    importance: 'low',
  },
  {
    id: 'disc-5',
    stockId: 'samsung',
    date: '2026-03-10',
    title: 'HBM4 양산 투자 계획 발표',
    type: 'other',
    importance: 'high',
  },
  {
    id: 'disc-6',
    stockId: 'samsung',
    date: '2026-03-05',
    title: '2025년 4분기 실적 발표',
    type: 'earnings',
    importance: 'high',
  },
  {
    id: 'disc-7',
    stockId: 'samsung',
    date: '2026-02-28',
    title: '배당 결정 공시',
    type: 'other',
    importance: 'medium',
  },
];

function generateStockDisclosures(stockId: string): DisclosureEvent[] {
  return MOCK_DISCLOSURES.map((d) => ({ ...d, stockId }));
}

export function getDisclosuresByStock(stockId: string): DisclosureEvent[] {
  if (stockId === 'samsung') return MOCK_DISCLOSURES;
  return generateStockDisclosures(stockId);
}

export const MOCK_LLM_SUMMARIES: Record<
  string,
  { points: string[]; sentiment: 'positive' | 'negative' | 'neutral'; impact: string }
> = {
  'disc-1': {
    points: [
      '영업이익 6.6조원으로 시장 컨센서스 6.1조원 대비 8.2% 상회',
      'HBM3E 출하 증가로 반도체 부문 매출 QoQ +15% 개선',
      '파운드리 부문 가동률 회복세, 연간 흑자 전환 가시화',
    ],
    sentiment: 'positive',
    impact:
      '단기 주가 상승 모멘텀 제공. 2분기 실적 가이던스 상향 가능성으로 추가 매수세 유입 기대.',
  },
  'disc-2': {
    points: [
      '자사주 1조원 규모 취득 결정, 주당 가치 제고 효과',
      '3개월에 걸친 시장 매입 방식으로 수급 안정화 기대',
      '주주환원 정책 강화 신호로 해석',
    ],
    sentiment: 'positive',
    impact: '단기 수급 지지 효과. 장기 주주환원 정책의 일환으로 긍정적 시그널.',
  },
  'disc-3': {
    points: [
      '국민연금 지분율 0.3%p 감소, 8.9% → 8.6%',
      '연초 이후 지속적인 비중 축소 패턴',
      '외국인 순매수로 수급 공백 일부 상쇄',
    ],
    sentiment: 'negative',
    impact: '단기 수급 부담 요인이나 실적 모멘텀이 더 강한 영향을 미칠 전망.',
  },
  'disc-4': {
    points: [
      'DS부문 임원 교체, 조직 슬림화 일환',
      '신임 임원 AI 반도체 전문가 출신',
      '조직 변화로 의사결정 속도 개선 기대',
    ],
    sentiment: 'neutral',
    impact: '즉각적인 주가 영향은 제한적. 중장기 전략 방향성 확인 필요.',
  },
  'disc-5': {
    points: [
      'HBM4 생산 라인 증설에 15조원 투자 결정',
      '2027년 양산 목표, 엔비디아 공급 확대 기대',
      'AI 메모리 시장 주도권 확보 전략 가속화',
    ],
    sentiment: 'positive',
    impact: '중장기 성장 스토리 강화. AI 인프라 투자 사이클 수혜 기대.',
  },
  'disc-6': {
    points: [
      '4분기 영업이익 2.8조원, 전분기 대비 흑자 전환',
      'DRAM 가격 상승 본격화로 실적 회복 시작',
      '2026년 연간 영업이익 25조원 이상 전망',
    ],
    sentiment: 'positive',
    impact: '실적 바닥 확인 및 회복 사이클 진입 신호. 기관 목표주가 일제 상향.',
  },
  'disc-7': {
    points: [
      '주당 배당금 1,444원, 전년 대비 20% 증가',
      '배당 성향 40%로 상향, 주주환원 정책 강화',
      '특별배당 500원 추가 지급 결정',
    ],
    sentiment: 'positive',
    impact: '배당 투자자 유입으로 수급 개선. 주가 하방 지지선 역할 기대.',
  },
};

export function generateOHLCVData(stockId: string): OHLCVData[] {
  const stock = MOCK_STOCKS.find((s) => s.id === stockId);
  const basePrice = stock?.price ?? 70000;
  const data: OHLCVData[] = [];

  let currentPrice = basePrice * 0.85;
  const startDate = new Date('2025-12-05');

  for (let i = 0; i < 90; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const trend = i / 90;
    const volatility = currentPrice * 0.02;
    const open = currentPrice + (Math.random() - 0.48 + trend * 0.01) * volatility;
    const close =
      open + (Math.random() - 0.45 + trend * 0.015) * volatility;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;

    data.push({
      time: date.toISOString().split('T')[0],
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume: Math.round(1000000 + Math.random() * 5000000),
    });

    currentPrice = close;
  }

  return data;
}

export const RANKING_HISTORY: RankingHistory[] = (() => {
  const stocks = ['samsung', 'skhynix', 'lgenergy', 'hyundai', 'naver'];
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date('2026-03-29');
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  const baseRanks: Record<string, number[]> = {
    samsung: [2, 1, 1, 1, 2, 1, 1],
    skhynix: [1, 2, 3, 2, 1, 2, 2],
    lgenergy: [3, 3, 2, 3, 3, 3, 3],
    hyundai: [4, 5, 4, 4, 4, 4, 4],
    naver: [5, 4, 5, 5, 5, 5, 5],
  };

  return dates.map((date, i) => {
    const entry: RankingHistory = { date };
    stocks.forEach((id) => {
      entry[id] = baseRanks[id][i];
    });
    return entry;
  });
})();

// ─── 가상 투자 Mock 데이터 ───────────────────────────────────────────────────

export interface PortfolioHolding {
  id: string;
  code: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  profitRate: number;
  evalAmount: number;
}

export interface AiSignal {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  price: number;
  confidence: number;
}

export interface BacktestTrade {
  id: string;
  date: string;
  type: 'buy' | 'sell';
  stock: string;
  price: number;
  quantity: number;
  profit: number;
}

export interface EquityPoint {
  date: string;
  equity: number;
}

export const MOCK_PORTFOLIO: PortfolioHolding[] = [
  {
    id: 'ph-1',
    code: '005930',
    name: '삼성전자',
    quantity: 200,
    avgPrice: 64000,
    currentPrice: 71500,
    profitRate: 11.72,
    evalAmount: 14300000,
  },
  {
    id: 'ph-2',
    code: '000660',
    name: 'SK하이닉스',
    quantity: 30,
    avgPrice: 172000,
    currentPrice: 185000,
    profitRate: 7.56,
    evalAmount: 5550000,
  },
  {
    id: 'ph-3',
    code: '373220',
    name: 'LG에너지솔루션',
    quantity: 10,
    avgPrice: 320000,
    currentPrice: 312000,
    profitRate: -2.5,
    evalAmount: 3120000,
  },
  {
    id: 'ph-4',
    code: '005380',
    name: '현대차',
    quantity: 15,
    avgPrice: 220000,
    currentPrice: 235000,
    profitRate: 6.82,
    evalAmount: 3525000,
  },
  {
    id: 'ph-5',
    code: '035420',
    name: 'NAVER',
    quantity: 5,
    avgPrice: 175000,
    currentPrice: 158500,
    profitRate: -9.43,
    evalAmount: 792500,
  },
];

export const MOCK_AI_SIGNALS: AiSignal[] = [
  { id: 'sig-1', date: '2025-12-18', type: 'buy', price: 61500, confidence: 87 },
  { id: 'sig-2', date: '2026-01-15', type: 'buy', price: 65200, confidence: 72 },
  { id: 'sig-3', date: '2026-02-10', type: 'sell', price: 74800, confidence: 81 },
  { id: 'sig-4', date: '2026-02-28', type: 'sell', price: 71200, confidence: 65 },
  { id: 'sig-5', date: '2026-03-20', type: 'buy', price: 68900, confidence: 79 },
];

export const MOCK_EQUITY_CURVE: EquityPoint[] = (() => {
  const points: EquityPoint[] = [];
  const startDate = new Date('2026-01-02');
  let equity = 100000000;
  for (let i = 0; i < 63; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;
    const change = (Math.random() - 0.44) * 0.012;
    equity = Math.round(equity * (1 + change));
    points.push({ date: date.toISOString().split('T')[0], equity });
  }
  points[points.length - 1].equity = 118300000;
  return points;
})();

export const MOCK_BACKTEST_TRADES: BacktestTrade[] = [
  { id: 'bt-1', date: '2026-01-08', type: 'buy', stock: '삼성전자', price: 62000, quantity: 100, profit: 0 },
  { id: 'bt-2', date: '2026-01-28', type: 'sell', stock: '삼성전자', price: 68500, quantity: 100, profit: 650000 },
  { id: 'bt-3', date: '2026-02-05', type: 'buy', stock: 'SK하이닉스', price: 168000, quantity: 20, profit: 0 },
  { id: 'bt-4', date: '2026-02-25', type: 'sell', stock: 'SK하이닉스', price: 182000, quantity: 20, profit: 280000 },
  { id: 'bt-5', date: '2026-03-10', type: 'buy', stock: '현대차', price: 228000, quantity: 15, profit: 0 },
];
