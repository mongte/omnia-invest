'use client';

import type { DisclosureEvent, DisclosureType } from '@/entities/stock';
import type { DisclosureSentiment } from '@/shared/api/dashboard';
import { getDisclosureSentiment } from '@/shared/api/dashboard';
import { cn } from '@/shared/lib/utils';

interface DisclosureTimelineProps {
  disclosures: DisclosureEvent[];
  selectedDisclosureId: string | null;
  onSelectDisclosure: (id: string) => void;
  /** 공시 클릭 시 차트 스크롤을 요청하는 콜백 */
  onScrollToDisclosure?: (id: string) => void;
}

const TYPE_LABEL: Record<DisclosureType, string> = {
  earnings: '실적',
  ownership: '지분변동',
  other: '기타',
};

const SENTIMENT_CONFIG: Record<
  DisclosureSentiment,
  { label: string; color: string; dot: string }
> = {
  positive: {
    label: '호재',
    color: 'text-green-500',
    dot: 'bg-green-500',
  },
  negative: {
    label: '악재',
    color: 'text-[hsl(var(--chart-down))]',
    dot: 'bg-[hsl(var(--chart-down))]',
  },
  neutral: {
    label: '중립',
    color: 'text-muted-foreground',
    dot: 'bg-muted-foreground',
  },
};

const IMPORTANCE_RING: Record<DisclosureEvent['importance'], string> = {
  high: 'ring-2 ring-offset-1 ring-offset-card',
  medium: '',
  low: 'opacity-60',
};

export function DisclosureTimeline({
  disclosures,
  selectedDisclosureId,
  onSelectDisclosure,
  onScrollToDisclosure,
}: DisclosureTimelineProps) {
  function handleSelect(id: string) {
    onSelectDisclosure(id);
    onScrollToDisclosure?.(id);
  }

  return (
    <div className="flex flex-col overflow-auto">
      {disclosures.map((disc, idx) => {
        const sentiment = getDisclosureSentiment(disc.type, disc.importance);
        const sentimentConfig = SENTIMENT_CONFIG[sentiment];
        const isSelected = disc.id === selectedDisclosureId;
        const isLast = idx === disclosures.length - 1;

        return (
          <div key={disc.id} className="flex gap-3">
            {/* 타임라인 라인 */}
            <div className="flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => handleSelect(disc.id)}
                className={cn(
                  'size-2.5 rounded-full mt-1.5 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  sentimentConfig.dot,
                  IMPORTANCE_RING[disc.importance],
                  isSelected && 'scale-125'
                )}
                aria-label={`${disc.title} 공시 선택`}
              />
              {!isLast && (
                <div className="w-px flex-1 bg-border mt-1 mb-1" />
              )}
            </div>

            {/* 내용 */}
            <button
              type="button"
              onClick={() => handleSelect(disc.id)}
              className={cn(
                'flex-1 text-left pb-3 rounded-sm transition-colors hover:bg-accent/30 px-1 -mx-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                isSelected && 'bg-accent/30'
              )}
            >
              <p className="text-xs text-muted-foreground">{disc.date}</p>
              <p
                className={cn(
                  'text-sm mt-0.5 leading-snug',
                  isSelected ? 'text-foreground font-medium' : 'text-foreground/80'
                )}
              >
                {disc.title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={cn('text-xs font-semibold inline-block', sentimentConfig.color)}
                >
                  {sentimentConfig.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABEL[disc.type]}
                </span>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
