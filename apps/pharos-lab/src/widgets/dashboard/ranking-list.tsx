'use client';

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { RankingListItem } from '@/shared/api/dashboard';
import { cn } from '@/shared/lib/utils';

interface RankingListProps {
  stocks: RankingListItem[];
  selectedStockId: string;
  onSelectStock: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 75
      ? 'from-green-500 to-emerald-400'
      : score >= 55
        ? 'from-blue-500 to-cyan-400'
        : 'from-orange-500 to-yellow-400';

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full bg-gradient-to-r', color)}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-sm font-medium text-foreground w-7 text-right shrink-0 tabular-nums">
        {score}
      </span>
    </div>
  );
}

interface RankChangeBadgeProps {
  delta: number | null;
  previousRank: number | null;
}

function RankChangeBadge({ delta, previousRank }: RankChangeBadgeProps) {
  // 이력 없음 = 신규 진입
  if (previousRank === null) {
    return (
      <span className="text-xs font-bold px-1 py-0.5 rounded bg-primary/20 text-primary shrink-0">
        NEW
      </span>
    );
  }

  if (delta === null || delta === 0) {
    return (
      <span className="text-xs font-medium text-muted-foreground shrink-0">
        →
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="text-xs font-bold text-green-500 shrink-0">
        △{delta}
      </span>
    );
  }

  return (
    <span className="text-xs font-bold text-[hsl(var(--chart-down))] shrink-0">
      ▽{Math.abs(delta)}
    </span>
  );
}

export function RankingList({
  stocks,
  selectedStockId,
  onSelectStock,
  onLoadMore,
  hasMore,
  isLoadingMore,
}: RankingListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: stocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  // 하단 근접 시 다음 페이지 로드
  useEffect(() => {
    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= stocks.length - 10 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), stocks.length, hasMore, isLoadingMore, onLoadMore]);

  return (
    <div ref={parentRef} className="overflow-auto h-full">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const stock = stocks[virtualRow.index];
          const index = virtualRow.index;
          return (
            <div
              key={stock.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <button
                type="button"
                onClick={() => onSelectStock(stock.id)}
                className={cn(
                  'w-full h-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  selectedStockId === stock.id && 'bg-accent'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center shrink-0 gap-0.5">
                    <span
                      className={cn(
                        'inline-flex items-center justify-center size-6 rounded text-sm font-bold',
                        index < 3
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {index + 1}
                    </span>
                    <RankChangeBadge
                      delta={stock.rankChange?.delta ?? null}
                      previousRank={stock.rankChange?.previousRank ?? null}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {stock.name}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {stock.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-sm font-medium text-foreground tabular-nums">
                          {stock.price.toLocaleString()}
                        </span>
                        <span
                          className={cn(
                            'text-sm font-medium tabular-nums',
                            stock.changeRate >= 0
                              ? 'text-[hsl(var(--chart-up))]'
                              : 'text-[hsl(var(--chart-down))]'
                          )}
                        >
                          {stock.changeRate >= 0 ? '+' : ''}
                          {stock.changeRate.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {stock.volume != null && (
                        <span className="text-xs text-muted-foreground">
                          거래량 {stock.volume.toLocaleString()}
                        </span>
                      )}
                      {stock.rank != null && (
                        <span className="text-xs text-muted-foreground">
                          거래량순위 {stock.rank}위
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <ScoreBar score={stock.score.total} />
                    </div>
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
      {isLoadingMore && (
        <div className="flex justify-center py-3">
          <div className="size-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
        </div>
      )}
    </div>
  );
}
