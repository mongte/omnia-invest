'use client';

import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { fetchStockDetailClient } from '@/shared/api/dashboard-client';
import { useHoldings, useDeleteHolding } from '@/features/holdings/lib/use-holdings';
import { PortfolioSummary } from '@/widgets/my-stocks/portfolio-summary';
import { HoldingsTable } from '@/widgets/my-stocks/holdings-table';
import { AddHoldingForm } from '@/widgets/my-stocks/add-holding-form';
import { HoldingDetailPanel } from '@/widgets/my-stocks/holding-detail-panel';
import type { HoldingWithStock } from '@/shared/api/holdings';

export function MyStocksView() {
  const { data: holdings = [], isLoading } = useHoldings();
  const { mutate: deleteHolding } = useDeleteHolding();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HoldingWithStock | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HoldingWithStock | null>(null);

  const selectedHolding = holdings.find((h) => h.id === selectedId) ?? null;

  // 선택된 종목의 OHLCV 데이터 fetch (view에서 담당, widget은 prop으로 받음)
  const { data: stockDetail } = useQuery({
    queryKey: ['stock-detail', selectedHolding?.stock_id],
    queryFn: () => fetchStockDetailClient(selectedHolding!.stock_id),
    enabled: !!selectedHolding,
  });

  const handleAdd = useCallback(() => {
    setEditTarget(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((holding: HoldingWithStock) => {
    setEditTarget(holding);
    setFormOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((holding: HoldingWithStock) => {
    setDeleteTarget(holding);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteHolding(deleteTarget.id, {
      onSuccess: () => {
        toast.success('삭제됨');
        if (selectedId === deleteTarget.id) setSelectedId(null);
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('저장에 실패했습니다. 다시 시도해주세요.');
        setDeleteTarget(null);
      },
    });
  }, [deleteTarget, deleteHolding, selectedId]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 요약 카드 */}
      <PortfolioSummary holdings={holdings} />

      {/* 테이블 헤더 액션 */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">보유 종목</h2>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-1.5 h-4 w-4" />
          보유 종목 추가
        </Button>
      </div>

      {/* 보유 종목 테이블 */}
      <HoldingsTable
        holdings={holdings}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onAdd={handleAdd}
      />

      {/* 상세 패널 */}
      {selectedHolding && (
        <HoldingDetailPanel
          holding={selectedHolding}
          ohlcv={stockDetail?.ohlcv ?? []}
        />
      )}

      {/* 추가/수정 폼 */}
      <AddHoldingForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editTarget={editTarget}
      />

      {/* 삭제 확인 Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>보유 정보 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {deleteTarget?.stock_name}
            </span>{' '}
            보유 정보를 삭제할까요?
          </p>
          <DialogFooter className="mt-2 gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
