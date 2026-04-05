'use client';

import {
  RadarChart as RechartsRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface RadarDataPoint {
  subject: string;
  [key: string]: string | number;
}

interface RadarConfig {
  key: string;
  color?: string;
  name?: string;
}

interface RadarChartProps {
  data?: RadarDataPoint[];
  radars?: RadarConfig[];
  height?: number;
  className?: string;
  showLegend?: boolean;
  domain?: [number, number];
}

const DEFAULT_DATA: RadarDataPoint[] = [
  { subject: '수익성', score: 82 },
  { subject: '안정성', score: 75 },
  { subject: '성장성', score: 68 },
  { subject: '밸류에이션', score: 90 },
  { subject: '모멘텀', score: 55 },
  { subject: '퀄리티', score: 78 },
];

const DEFAULT_RADARS: RadarConfig[] = [
  { key: 'score', color: 'hsl(217.2 91.2% 59.8%)', name: '스코어' },
];

export function RadarChart({
  data = DEFAULT_DATA,
  radars = DEFAULT_RADARS,
  height = 300,
  className,
  showLegend = false,
  domain = [0, 100],
}: RadarChartProps) {
  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="hsl(217.2 32.6% 17.5%)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={domain}
            tick={{ fill: 'hsl(215 20.2% 65.1%)', fontSize: 10 }}
            axisLine={false}
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
          {radars.map((radar) => (
            <Radar
              key={radar.key}
              name={radar.name ?? radar.key}
              dataKey={radar.key}
              stroke={radar.color ?? 'hsl(217.2 91.2% 59.8%)'}
              fill={radar.color ?? 'hsl(217.2 91.2% 59.8%)'}
              fillOpacity={0.2}
              dot={false}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
