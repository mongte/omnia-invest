'use client';

import { useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, X } from 'lucide-react';
import type { RankingListItem } from '@/shared/api/dashboard';
import { Input } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

interface RankingListProps {
  stocks: RankingListItem[];
  selectedStockId: string;
  onSelectStock: (id: string) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchHint: string | null; // 입력 안내 메시지 (유효하지 않은 쿼리일 때)
  searchResults: RankingListItem[] | null; // null이면 검색 모드 아님
  isSearching: boolean;
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

interface StockItemProps {
  stock: RankingListItem;
  rankBadge: React.ReactNode;
  selectedStockId: string;
  onSelectStock: (id: string) => void;
}

function StockItem({ stock, rankBadge, selectedStockId, onSelectStock }: StockItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelectStock(stock.id)}
      className={cn(
        'w-full text-left px-3 py-2.5 rounded-md transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        selectedStockId === stock.id && 'bg-accent',
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center shrink-0 gap-0.5">
          {rankBadge}
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
                    : 'text-[hsl(var(--chart-down))]',
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
  );
}

export function RankingList({
  stocks,
  selectedStockId,
  onSelectStock,
  onLoadMore,
  hasMore,
  isLoadingMore,
  searchQuery,
  onSearchChange,
  searchHint,
  searchResults,
  isSearching,
}: RankingListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: stocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  // 하단 근접 시 다음 페이지 로드 (검색 모드가 아닐 때만)
  useEffect(() => {
    if (searchResults !== null) return;
    const virtualItems = rowVirtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (lastItem.index >= stocks.length - 10 && hasMore && !isLoadingMore) {
      onLoadMore();
    }
  }, [rowVirtualizer.getVirtualItems(), stocks.length, hasMore, isLoadingMore, onLoadMore, searchResults]);

  return (
    <div className="flex flex-col h-full">
      {/* 검색 인풋 — 스크롤 영역 밖 고정 */}
      <div className="relative shrink-0 mb-2">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="종목명 또는 종목코드 검색"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-8 h-8 text-xs"
        />
        {searchQuery.length > 0 && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="검색어 지우기"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {/* 목록 영역 */}
      {searchHint !== null ? (
        // 입력 안내 메시지 (유효하지 않은 쿼리)
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center px-4">{searchHint}</p>
        </div>
      ) : searchResults !== null ? (
        // 검색 모드
        <div className="flex-1 overflow-auto">
          {isSearching ? (
            // 검색 중 로딩
            <div className="flex justify-center items-center py-8">
              <div className="size-4 rounded-full border-2 border-muted border-t-primary animate-spin" />
            </div>
          ) : searchResults.length === 0 ? (
            // 검색 결과 없음
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <Search className="size-5 opacity-40" />
              <p className="text-sm">검색 결과가 없습니다</p>
            </div>
          ) : (
            // 검색 결과 목록 (score.total 내림차순으로 이미 정렬됨)
            <div className="flex flex-col">
              {searchResults.map((stock, index) => (
                <StockItem
                  key={stock.id}
                  stock={stock}
                  selectedStockId={selectedStockId}
                  onSelectStock={onSelectStock}
                  rankBadge={
                    <span
                      className={cn(
                        'inline-flex items-center justify-center size-6 rounded text-sm font-bold',
                        index < 3
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground',
                      )}
                    >
                      {index + 1}
                    </span>
                  }
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        // 기존 가상화 스크롤 모드
        <div ref={parentRef} className="flex-1 overflow-auto">
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
                  <StockItem
                    stock={stock}
                    selectedStockId={selectedStockId}
                    onSelectStock={onSelectStock}
                    rankBadge={
                      <>
                        <span
                          className={cn(
                            'inline-flex items-center justify-center size-6 rounded text-sm font-bold',
                            index < 3
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground',
                          )}
                        >
                          {index + 1}
                        </span>
                        <RankChangeBadge
                          delta={stock.rankChange?.delta ?? null}
                          previousRank={stock.rankChange?.previousRank ?? null}
                        />
                      </>
                    }
                  />
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
      )}
    </div>
  );
}
