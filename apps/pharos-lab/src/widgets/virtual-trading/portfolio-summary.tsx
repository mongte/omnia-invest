'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/ui/dialog';
import { useVirtualPortfolio, useResetPortfolio } from '@/features/virtual-trading/lib/use-virtual-portfolio';
import { useVirtualPositions } from '@/features/virtual-trading/lib/use-virtual-positions';

function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function formatRate(n: number): string {
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
}

export function PortfolioSummary() {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: portfolio, isLoading: pfLoading } = useVirtualPortfolio();
  const { data: positions, isLoading: posLoading } = useVirtualPositions();
  const reset = useResetPortfolio();

  const isLoading = pfLoading || posLoading;

  const marketValue = (positions ?? []).reduce(
    (acc, p) => acc + p.quantity * p.current_price,
    0,
  );
  const cashBalance = portfolio?.cash_balance ?? 0;
  const initialBalance = portfolio?.initial_balance ?? 0;
  const totalAsset = cashBalance + marketValue;
  const profitAmount = totalAsset - initialBalance;
  const profitRate = initialBalance > 0 ? (profitAmount / initialBalance) * 100 : 0;

  const cards = [
    {
      label: '총자산',
      value: isLoading ? null : formatKRW(totalAsset),
      sub: isLoading ? null : formatKRW(profitAmount),
      subColor: profitAmount >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      label: '현금',
      value: isLoading ? null : formatKRW(cashBalance),
      sub: '투자 가능 금액',
      subColor: 'text-muted-foreground',
    },
    {
      label: '수익률',
      value: isLoading ? null : formatRate(profitRate),
      valueColor: profitRate >= 0 ? 'text-emerald-500' : 'text-red-500',
      sub: isLoading ? null : formatKRW(profitAmount) + ' 평가손익',
      subColor: profitAmount >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
  ];

  function handleReset() {
    reset.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
    });
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-muted-foreground">내 가상 포트폴리오</span>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <RefreshCw className="size-3 mr-1" />
          포트폴리오 리셋
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {cards.map((card) => (
          <Card key={card.label} className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
            {isLoading ? (
              <>
                <Skeleton className="h-6 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </>
            ) : (
              <>
                <p className={['text-xl font-bold tracking-tight', card.valueColor ?? 'text-foreground'].join(' ')}>
                  {card.value}
                </p>
                {card.sub && (
                  <p className={['text-xs mt-1', card.subColor].join(' ')}>{card.sub}</p>
                )}
              </>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>포트폴리오 리셋</DialogTitle>
            <DialogDescription>
              모든 포지션, 주문 내역, 자동매매 규칙이 삭제되고 초기 잔고로 복원됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              취소
            </Button>
            <Button
              variant="destructive"
              loading={reset.isPending}
              onClick={handleReset}
            >
              리셋 확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
