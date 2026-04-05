'use client';

import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

export interface BarDataPoint {
  label: string;
  value: number;
  [key: string]: string | number;
}

interface BarConfig {
  key: string;
  color?: string;
  name?: string;
}

interface BarChartProps {
  data?: BarDataPoint[];
  bars?: BarConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  colorByValue?: boolean;
}

const DEFAULT_DATA: BarDataPoint[] = [
  { label: '삼성전자', value: 85 },
  { label: 'SK하이닉스', value: 72 },
  { label: 'LG에너지솔루션', value: 68 },
  { label: 'NAVER', value: 55 },
  { label: '카카오', value: 42 },
];

const DEFAULT_BARS: BarConfig[] = [
  { key: 'value', color: 'hsl(217.2 91.2% 59.8%)', name: '스코어' },
];

export function BarChart({
  data = DEFAULT_DATA,
  bars = DEFAULT_BARS,
  height = 300,
  className,
  showLegend = false,
  showGrid = true,
  colorByValue = false,
}: BarChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(217.2 32.6% 17.5%)"
              vertical={false}
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
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)',
              borderRadius: '6px',
              color: 'hsl(210 40% 98%)',
            }}
            cursor={{ fill: 'hsl(217.2 32.6% 17.5% / 0.3)' }}
          />
          {showLegend && <Legend />}
          {bars.map((bar) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name ?? bar.key}
              fill={bar.color ?? 'hsl(217.2 91.2% 59.8%)'}
              radius={[4, 4, 0, 0]}
            >
              {colorByValue &&
                data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.value >= 0
                        ? 'hsl(142 71% 45%)'
                        : 'hsl(0 72% 51%)'
                    }
                  />
                ))}
            </Bar>
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
