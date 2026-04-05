'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { StockData } from '@/entities/stock';

interface ScoreRadarProps {
  stock: StockData;
}

const SCORE_LABELS: Record<keyof Omit<StockData['score'], 'total'>, string> = {
  fundamental: '펀더멘털',
  momentum: '모멘텀',
  disclosure: '공시활동',
  institutional: '기관관심',
};

export function ScoreRadar({ stock }: ScoreRadarProps) {
  const data = [
    { subject: '펀더멘털', value: stock.score.fundamental, fullMark: 100 },
    { subject: '모멘텀', value: stock.score.momentum, fullMark: 100 },
    { subject: '공시활동', value: stock.score.disclosure, fullMark: 100 },
    { subject: '기관관심', value: stock.score.institutional, fullMark: 100 },
  ];

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="h-[180px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            />
            <Radar
              name={stock.name}
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {(
          Object.keys(SCORE_LABELS) as Array<
            keyof typeof SCORE_LABELS
          >
        ).map((key) => (
          <div key={key} className="flex items-center justify-between px-2 py-1 rounded bg-muted/50">
            <span className="text-xs text-muted-foreground">
              {SCORE_LABELS[key]}
            </span>
            <span className="text-xs font-semibold text-foreground">
              {stock.score[key]}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1 mt-1">
        {stock.scoreDescriptions.slice(0, 3).map((desc, i) => (
          <p key={i} className="text-xs text-muted-foreground leading-relaxed">
            <span className="text-primary mr-1">•</span>
            {desc}
          </p>
        ))}
      </div>
    </div>
  );
}
