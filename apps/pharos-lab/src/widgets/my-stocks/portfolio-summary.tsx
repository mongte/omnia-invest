'use client';

import type { HoldingWithStock } from '@/shared/api/holdings';

interface PortfolioSummaryProps {
  holdings: HoldingWithStock[];
}

export function PortfolioSummary({ holdings }: PortfolioSummaryProps) {
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.avg_price * h.quantity,
    0,
  );
  const totalValuation = holdings.reduce(
    (sum, h) => sum + h.current_price * h.quantity,
    0,
  );
  const totalProfitRate =
    totalInvested > 0
      ? ((totalValuation - totalInvested) / totalInvested) * 100
      : 0;
  const profitAmount = totalValuation - totalInvested;

  const formatKRW = (value: number) =>
    new Intl.NumberFormat('ko-KR').format(Math.round(value));

  const rateColor =
    totalProfitRate > 0
      ? 'text-red-400'
      : totalProfitRate < 0
        ? 'text-blue-400'
        : 'text-zinc-400';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <SummaryCard
        label="총 투자금액"
        value={`${formatKRW(totalInvested)}원`}
      />
      <SummaryCard
        label="현재 평가금액"
        value={`${formatKRW(totalValuation)}원`}
        subtext="17:30 KST 기준 · 실시간 아님"
      />
      <SummaryCard
        label="평가 손익"
        value={`${profitAmount >= 0 ? '+' : ''}${formatKRW(profitAmount)}원`}
        valueClassName={rateColor}
      />
      <SummaryCard
        label="총 수익률"
        value={`${totalProfitRate >= 0 ? '+' : ''}${totalProfitRate.toFixed(2)}%`}
        valueClassName={rateColor}
        subtext={`${holdings.length}종목`}
      />
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  valueClassName?: string;
  subtext?: string;
}

function SummaryCard({ label, value, valueClassName, subtext }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${valueClassName ?? ''}`}>
        {value}
      </p>
      {subtext && <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}
