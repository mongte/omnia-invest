'use client';

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export interface LineDataPoint {
  label: string;
  [key: string]: string | number;
}

interface LineConfig {
  key: string;
  color?: string;
  name?: string;
}

interface LineChartProps {
  data?: LineDataPoint[];
  lines?: LineConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
}

const DEFAULT_DATA: LineDataPoint[] = [
  { label: '1월', value: 65000 },
  { label: '2월', value: 68000 },
  { label: '3월', value: 67000 },
  { label: '4월', value: 72000 },
  { label: '5월', value: 75000 },
  { label: '6월', value: 73000 },
];

const DEFAULT_LINES: LineConfig[] = [
  { key: 'value', color: 'hsl(217.2 91.2% 59.8%)', name: '주가' },
];

export function LineChart({
  data = DEFAULT_DATA,
  lines = DEFAULT_LINES,
  height = 300,
  className,
  showLegend = false,
  showGrid = true,
}: LineChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
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
            tickFormatter={(v: number) => v.toLocaleString()}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222.2 84% 4.9%)',
              border: '1px solid hsl(217.2 32.6% 17.5%)',
              borderRadius: '6px',
              color: 'hsl(210 40% 98%)',
            }}
          />
          {showLegend && <Legend />}
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color ?? 'hsl(217.2 91.2% 59.8%)'}
              name={line.name ?? line.key}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
