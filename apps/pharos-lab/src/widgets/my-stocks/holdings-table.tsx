'use client';

import { Briefcase } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import type { HoldingWithStock } from '@/shared/api/holdings';
import { getDecision, DECISION_LABEL, DECISION_BADGE_CLASS } from '@/features/holdings/lib/decision-algorithm';

function calcHoldingDays(purchasedAt: string | null): number {
  if (!purchasedAt) return 0;
  const diff = Date.now() - new Date(purchasedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

interface HoldingsTableProps {
  holdings: HoldingWithStock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onEdit: (holding: HoldingWithStock) => void;
  onDelete: (holding: HoldingWithStock) => void;
  onAdd: () => void;
}

export function HoldingsTable({
  holdings,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onAdd,
}: HoldingsTableProps) {
  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <Briefcase className="mb-3 h-10 w-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          보유 종목이 없습니다
        </p>
        <p className="mt-1 text-xs text-muted-foreground/70">
          첫 보유 종목을 추가해보세요
        </p>
        <Button className="mt-4" size="sm" onClick={onAdd}>
          + 추가
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">종목</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">수량</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">매수가</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">현재가</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">손익률</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">신호</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">관리</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const profitRate =
                h.avg_price > 0
                  ? ((h.current_price - h.avg_price) / h.avg_price) * 100
                  : 0;

              const holdingDays = calcHoldingDays(h.purchased_at);

              const { decision, lowConfidence } = getDecision({
                pharosScore: h.pharos_score,
                profitRate,
                ma20Position: 'unknown',
                holdingDays,
              });

              const isSelected = h.id === selectedId;

              return (
                <tr
                  key={h.id}
                  className={`cursor-pointer border-b border-border/50 transition-colors hover:bg-muted/20 ${
                    isSelected ? 'bg-muted/40' : ''
                  }`}
                  onClick={() => onSelect(h.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium">{h.stock_name}</div>
                    <div className="text-xs text-muted-foreground">{h.stock_code}</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {h.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {h.avg_price.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {h.current_price.toLocaleString()}
                  </td>
                  <td
                    className={`px-4 py-3 text-right tabular-nums font-medium ${
                      profitRate > 0
                        ? 'text-red-400'
                        : profitRate < 0
                          ? 'text-blue-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    {profitRate >= 0 ? '+' : ''}
                    {profitRate.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-medium ${DECISION_BADGE_CLASS[decision]}`}
                    >
                      {DECISION_LABEL[decision]}
                      {lowConfidence && (
                        <span className="ml-1 text-zinc-500" title="데이터 부족">
                          ⚠
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div
                      className="flex items-center justify-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => onEdit(h)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                        onClick={() => onDelete(h)}
                      >
                        삭제
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
