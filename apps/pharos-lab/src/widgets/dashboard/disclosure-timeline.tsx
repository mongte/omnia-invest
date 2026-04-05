'use client';

import type { DisclosureEvent, DisclosureType } from '@/entities/stock';
import { cn } from '@/shared/lib/utils';

interface DisclosureTimelineProps {
  disclosures: DisclosureEvent[];
  selectedDisclosureId: string | null;
  onSelectDisclosure: (id: string) => void;
}

const TYPE_CONFIG: Record<
  DisclosureType,
  { label: string; color: string; dot: string }
> = {
  earnings: {
    label: '실적',
    color: 'text-[hsl(var(--chart-down))]',
    dot: 'bg-[hsl(var(--chart-down))]',
  },
  ownership: {
    label: '지분변동',
    color: 'text-yellow-400',
    dot: 'bg-yellow-400',
  },
  other: {
    label: '기타',
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
}: DisclosureTimelineProps) {
  return (
    <div className="flex flex-col overflow-auto">
      {disclosures.map((disc, idx) => {
        const config = TYPE_CONFIG[disc.type];
        const isSelected = disc.id === selectedDisclosureId;
        const isLast = idx === disclosures.length - 1;

        return (
          <div key={disc.id} className="flex gap-3">
            {/* 타임라인 라인 */}
            <div className="flex flex-col items-center shrink-0">
              <button
                type="button"
                onClick={() => onSelectDisclosure(disc.id)}
                className={cn(
                  'size-2.5 rounded-full mt-1.5 shrink-0 transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  config.dot,
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
              onClick={() => onSelectDisclosure(disc.id)}
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
              <span
                className={cn('text-xs font-medium mt-0.5 inline-block', config.color)}
              >
                {config.label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
