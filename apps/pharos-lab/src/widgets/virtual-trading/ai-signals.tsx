'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';
import { fetchRankingListClient } from '@/shared/api/dashboard-client';
import type { RankingListItem } from '@/shared/api/dashboard';

interface AiSignalsProps {
  onOpenAutoRule?: (stock: { id: string; name: string; code: string }) => void;
}

function SignalCard({
  item,
  onOpenAutoRule,
}: {
  item: RankingListItem;
  onOpenAutoRule?: AiSignalsProps['onOpenAutoRule'];
}) {
  const isPositive = item.changeRate >= 0;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-r border-border last:border-r-0 shrink-0 w-64">
      <div
        className={[
          'flex items-center justify-center size-8 rounded-full shrink-0',
          isPositive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500',
        ].join(' ')}
      >
        {isPositive ? (
          <TrendingUp className="size-4" aria-hidden="true" />
        ) : (
          <TrendingDown className="size-4" aria-hidden="true" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-foreground truncate">{item.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">{item.code}</span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-foreground">{item.price.toLocaleString('ko-KR')}원</span>
          <span
            className={[
              'text-xs font-medium',
              isPositive ? 'text-emerald-500' : 'text-red-500',
            ].join(' ')}
          >
            {isPositive ? '+' : ''}
            {item.changeRate.toFixed(2)}%
          </span>
          <span className="text-xs text-muted-foreground ml-auto">점수 {item.score.total}</span>
        </div>
      </div>
      {onOpenAutoRule && (
        <button
          type="button"
          onClick={() =>
            onOpenAutoRule({ id: item.id, name: item.name, code: item.code })
          }
          className="shrink-0 px-2 py-1 text-xs border border-border rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
        >
          규칙
        </button>
      )}
    </div>
  );
}

export function AiSignals({ onOpenAutoRule }: AiSignalsProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ranking-list-signals'],
    queryFn: () => fetchRankingListClient(5, 0),
    staleTime: 5 * 60 * 1000,
  });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
        <span className="text-xs font-semibold text-muted-foreground">데일리 추천 랭킹 상위 5</span>
        <span className="text-xs text-muted-foreground">(참고용, 투자 권유 아님)</span>
      </div>
      <div className="flex overflow-x-auto">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="shrink-0 w-64 px-4 py-3 border-r border-border last:border-r-0">
              <Skeleton className="h-8 w-full" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center w-full py-6 text-sm text-muted-foreground">
            데이터 없음
          </div>
        ) : (
          items.map((item) => (
            <SignalCard key={item.id} item={item} onOpenAutoRule={onOpenAutoRule} />
          ))
        )}
      </div>
    </div>
  );
}
