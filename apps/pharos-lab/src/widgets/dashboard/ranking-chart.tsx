'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { RankingHistory } from '@/entities/stock';
import type { RankingListItem } from '@/shared/api/dashboard';
import { cn } from '@/shared/lib/utils';

interface RankingChartProps {
  data: RankingHistory[];
  stocks: RankingListItem[];
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const PERIOD_OPTIONS = ['일', '주', '월'] as const;
type Period = (typeof PERIOD_OPTIONS)[number];

interface TooltipPayload {
  dataKey: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  stocks: RankingListItem[];
}

function CustomTooltip({ active, payload, label, stocks }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const sorted = [...payload].sort((a, b) => a.value - b.value);

  return (
    <div className="rounded-md border border-border bg-popover p-2 shadow-md text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {sorted.map((entry) => {
        const stock = stocks.find((s) => s.id === entry.dataKey);
        return (
          <div key={entry.dataKey} className="flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-foreground">
              {stock?.name ?? entry.dataKey}
            </span>
            <span className="ml-auto text-muted-foreground">{entry.value}위</span>
          </div>
        );
      })}
    </div>
  );
}

export function RankingChart({ data, stocks }: RankingChartProps) {
  const [period, setPeriod] = useState<Period>('일');
  const topStocks = stocks.slice(0, 5);

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex gap-1">
        {PERIOD_OPTIONS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className={cn(
              'px-2 py-0.5 text-xs rounded transition-colors',
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.5}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              reversed
              domain={[1, 10]}
              ticks={[1, 3, 5, 7, 10]}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip stocks={topStocks} />}
            />
            {topStocks.map((stock, i) => (
              <Line
                key={stock.id}
                type="monotone"
                dataKey={stock.id}
                stroke={CHART_COLORS[i]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {topStocks.map((stock, i) => (
          <div key={stock.id} className="flex items-center gap-1">
            <span
              className="size-1.5 rounded-full shrink-0"
              style={{ backgroundColor: CHART_COLORS[i] }}
            />
            <span className="text-xs text-muted-foreground">{stock.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
