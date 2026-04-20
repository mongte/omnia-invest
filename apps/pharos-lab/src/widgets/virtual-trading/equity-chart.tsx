'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/shared/ui/skeleton';
import { useEquityCurve } from '@/features/virtual-trading/lib/use-equity-curve';

function formatBillion(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(2)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`;
  return n.toLocaleString('ko-KR');
}

function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function EquityChart() {
  const { data, isLoading } = useEquityCurve(30);

  if (isLoading) {
    return <Skeleton className="w-full h-[200px]" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        거래 기록이 없습니다
      </div>
    );
  }

  const chartData = data.map((s) => ({
    date: s.snapshot_date,
    equity: s.total_equity,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
          width={50}
        />
        <Tooltip
          formatter={(val) => {
            const display = typeof val === 'number' ? formatKRW(val) : String(val ?? '');
            return [display, '총자산'];
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
  );
}
