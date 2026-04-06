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

export function RankingList({
  stocks,
  selectedStockId,
  onSelectStock,
}: RankingListProps) {
  return (
    <div className="flex flex-col gap-1 overflow-auto">
      {stocks.map((stock) => (
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
            <span
              className={cn(
                'inline-flex items-center justify-center size-5 rounded text-xs font-bold shrink-0',
                (stock.rank ?? 0) <= 3
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {stock.rank ?? '-'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {stock.name}
                </span>
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
              <div className="mt-1.5">
                <ScoreBar score={stock.score.total} />
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
