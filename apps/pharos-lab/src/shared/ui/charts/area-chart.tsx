'use client';

import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface AreaDataPoint {
  label: string;
  [key: string]: string | number;
}

interface AreaConfig {
  key: string;
  color?: string;
  name?: string;
}

interface AreaChartProps {
  data?: AreaDataPoint[];
  areas?: AreaConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  stacked?: boolean;
}

const DEFAULT_DATA: AreaDataPoint[] = [
  { label: '1월', portfolio: 10000000, benchmark: 10000000 },
  { label: '2월', portfolio: 10250000, benchmark: 10100000 },
  { label: '3월', portfolio: 10180000, benchmark: 10050000 },
  { label: '4월', portfolio: 10520000, benchmark: 10200000 },
  { label: '5월', portfolio: 10780000, benchmark: 10310000 },
  { label: '6월', portfolio: 10650000, benchmark: 10280000 },
];

const DEFAULT_AREAS: AreaConfig[] = [
  { key: 'portfolio', color: 'hsl(217.2 91.2% 59.8%)', name: '포트폴리오' },
  { key: 'benchmark', color: 'hsl(215 20.2% 65.1%)', name: '벤치마크' },
];

export function AreaChart({
  data = DEFAULT_DATA,
  areas = DEFAULT_AREAS,
  height = 300,
  className,
  showLegend = false,
  showGrid = true,
  stacked = false,
}: AreaChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <defs>
            {areas.map((area) => (
              <linearGradient
                key={`gradient-${area.key}`}
                id={`gradient-${area.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={area.color ?? 'hsl(217.2 91.2% 59.8%)'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={area.color ?? 'hsl(217.2 91.2% 59.8%)'}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(217.2 32.6% 17.5%)"
            />
          )}
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }}
            axisLine={{ stroke: 'hsl(217.2 32.6% 17.5%)' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v / 10000).toFixed(0) + '만'}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)',
              borderRadius: '6px',
              color: 'hsl(210 40% 98%)',
            }}
            formatter={(value: unknown) =>
              typeof value === 'number'
                ? value.toLocaleString() + '원'
                : String(value)
            }
          />
          {showLegend && <Legend />}
          {areas.map((area) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name ?? area.key}
              stroke={area.color ?? 'hsl(217.2 91.2% 59.8%)'}
              fill={`url(#gradient-${area.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              stackId={stacked ? 'stack' : undefined}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
