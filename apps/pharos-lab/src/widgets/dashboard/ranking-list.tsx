'use client';

import type { RankingListItem } from '@/shared/api/dashboard';
import { cn } from '@/shared/lib/utils';

interface RankingListProps {
  stocks: RankingListItem[];
  selectedStockId: string;
  onSelectStock: (id: string) => void;
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
      <span className="text-xs font-medium text-foreground w-6 text-right shrink-0">
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
      <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-primary/20 text-primary shrink-0">
        NEW
      </span>
    );
  }

  if (delta === null || delta === 0) {
    return (
      <span className="text-[10px] font-medium text-muted-foreground shrink-0">
        →
      </span>
    );
  }

  if (delta > 0) {
    return (
      <span className="text-[10px] font-bold text-green-500 shrink-0">
        △{delta}
      </span>
    );
  }

  return (
    <span className="text-[10px] font-bold text-[hsl(var(--chart-down))] shrink-0">
      ▽{Math.abs(delta)}
    </span>
  );
}

export function RankingList({
  stocks,
  selectedStockId,
  onSelectStock,
}: RankingListProps) {
  return (
    <div className="flex flex-col gap-1 overflow-auto">
      {stocks.map((stock, index) => (
        <button
          key={stock.id}
          type="button"
          onClick={() => onSelectStock(stock.id)}
          className={cn(
            'w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            selectedStockId === stock.id && 'bg-accent'
          )}
        >
          <div className="flex items-center gap-2">
            {/* 스코어 순위 (리스트 순서 기반) */}
            <div className="flex flex-col items-center shrink-0 gap-0.5">
              <span
                className={cn(
                  'inline-flex items-center justify-center size-5 rounded text-xs font-bold',
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
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {stock.code}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-xs font-medium text-foreground">
                    {stock.price.toLocaleString()}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-medium',
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
                  <span className="text-[10px] text-muted-foreground">
                    거래량 {stock.volume.toLocaleString()}
                  </span>
                )}
                {stock.rank != null && (
                  <span className="text-[10px] text-muted-foreground">
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
      ))}
    </div>
  );
}
