'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { MOCK_EQUITY_CURVE, MOCK_BACKTEST_TRADES } from '@/shared/lib/mock-data';

type Strategy = 'ma-crossover' | 'volume-surge' | 'score-threshold';

const STRATEGY_LABELS: Record<Strategy, string> = {
  'ma-crossover': '이동평균 크로스오버',
  'volume-surge': '거래량 급등',
  'score-threshold': '스코어 임계값',
};

const PERFORMANCE = {
  totalReturn: '+18.3%',
  maxDrawdown: '-7.2%',
  winRate: '64%',
  tradeCount: '23회',
};

function formatBillion(n: number): string {
  return `${(n / 100000000).toFixed(2)}억`;
}

function formatPrice(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function BacktestChart() {
  const [strategy, setStrategy] = useState<Strategy>('ma-crossover');
  const [startDate, setStartDate] = useState('2026-01-02');
  const [endDate, setEndDate] = useState('2026-04-03');
  const [initialCapital, setInitialCapital] = useState('100000000');
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  function handleRun() {
    setIsLoading(true);
    setShowResult(false);
    setTimeout(() => {
      setIsLoading(false);
      setShowResult(true);
    }, 1500);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 입력 폼 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">전략 선택</label>
          <select
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as Strategy)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(Object.entries(STRATEGY_LABELS) as [Strategy, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">시작일</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">종료일</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">초기 자금</label>
          <input
            type="number"
            value={initialCapital}
            onChange={(e) => setInitialCapital(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleRun}
        disabled={isLoading}
        className="w-full py-2 rounded-md text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? '백테스트 실행 중...' : '백테스트 실행'}
      </button>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">전략 시뮬레이션 중...</p>
        </div>
      )}

      {/* 결과 */}
      {showResult && (
        <div className="flex flex-col gap-4">
          {/* 성과 지표 */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: '총수익률', value: PERFORMANCE.totalReturn, color: 'text-emerald-500' },
              { label: '최대낙폭', value: PERFORMANCE.maxDrawdown, color: 'text-red-500' },
              { label: '승률', value: PERFORMANCE.winRate, color: 'text-foreground' },
              { label: '거래횟수', value: PERFORMANCE.tradeCount, color: 'text-foreground' },
            ].map((item) => (
              <div key={item.label} className="bg-accent/40 rounded-md px-3 py-2">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className={['text-lg font-bold', item.color].join(' ')}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* 에퀴티 커브 */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">에퀴티 커브</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MOCK_EQUITY_CURVE} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="hsl(217.2 32.6% 17.5%)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(215 20.2% 65.1%)' }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(215 20.2% 65.1%)' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatBillion}
                  width={45}
                />
                <Tooltip
                  formatter={(val) => {
                    const display = typeof val === 'number' ? formatBillion(val) : String(val ?? '');
                    return [display, '자산'];
                  }}
                  contentStyle={{
                    background: 'hsl(222.2 84% 4.9%)',
                    border: '1px solid hsl(217.2 32.6% 17.5%)',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#equityGrad)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 거래 로그 */}
          <div>
            <p className="text-xs text-muted-foreground mb-1">거래 로그</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  {['날짜', '유형', '종목', '가격', '수익'].map((h) => (
                    <th key={h} className="px-2 py-1 text-left text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_BACKTEST_TRADES.map((trade) => (
                  <tr key={trade.id} className="border-b border-border last:border-0">
                    <td className="px-2 py-1 text-muted-foreground">{trade.date}</td>
                    <td
                      className={[
                        'px-2 py-1 font-medium',
                        trade.type === 'buy' ? 'text-emerald-500' : 'text-red-500',
                      ].join(' ')}
                    >
                      {trade.type === 'buy' ? '매수' : '매도'}
                    </td>
                    <td className="px-2 py-1">{trade.stock}</td>
                    <td className="px-2 py-1">{formatPrice(trade.price)}</td>
                    <td
                      className={[
                        'px-2 py-1',
                        trade.profit > 0 ? 'text-emerald-500' : trade.profit < 0 ? 'text-red-500' : 'text-muted-foreground',
                      ].join(' ')}
                    >
                      {trade.profit > 0 ? '+' : ''}{formatPrice(trade.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
