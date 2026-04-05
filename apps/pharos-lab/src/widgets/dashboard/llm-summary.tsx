'use client';

import type { DisclosureEvent } from '@/entities/stock';
import { cn } from '@/shared/lib/utils';

interface LlmSummaryData {
  points: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  impact: string;
}

interface LlmSummaryProps {
  disclosure: DisclosureEvent | null;
  summary: LlmSummaryData | null;
}

const SENTIMENT_CONFIG = {
  positive: {
    label: '긍정',
    className: 'bg-[hsl(var(--chart-up))]/20 text-[hsl(var(--chart-up))]',
  },
  negative: {
    label: '부정',
    className: 'bg-[hsl(var(--chart-down))]/20 text-[hsl(var(--chart-down))]',
  },
  neutral: {
    label: '중립',
    className: 'bg-muted text-muted-foreground',
  },
};

export function LlmSummary({ disclosure, summary }: LlmSummaryProps) {
  if (!disclosure || !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center">
        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-3">
          <svg
            className="size-5 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
            />
          </svg>
        </div>
        <p className="text-sm text-muted-foreground">
          공시를 선택하면 AI 요약이 표시됩니다
        </p>
      </div>
    );
  }

  const sentimentConfig = SENTIMENT_CONFIG[summary.sentiment];

  return (
    <div className="flex flex-col gap-3 h-full overflow-auto">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground leading-snug line-clamp-2">
          {disclosure.title}
        </p>
        <span
          className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0',
            sentimentConfig.className
          )}
        >
          {sentimentConfig.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-muted-foreground">핵심 포인트</p>
        {summary.points.map((point, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-primary text-xs mt-0.5 shrink-0">•</span>
            <p className="text-xs text-foreground/90 leading-relaxed">{point}</p>
          </div>
        ))}
      </div>

      <div className="rounded-md bg-muted/50 p-2.5 mt-auto">
        <p className="text-xs font-medium text-muted-foreground mb-1">영향 평가</p>
        <p className="text-xs text-foreground/80 leading-relaxed">
          {summary.impact}
        </p>
      </div>
    </div>
  );
}
