'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/shared/ui/sheet';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { useUpsertHolding } from '@/features/holdings/lib/use-holdings';
import { searchStocksForHolding, type StockSearchResult } from '@/shared/api/holdings';
import type { HoldingWithStock } from '@/shared/api/holdings';

interface AddHoldingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editTarget?: HoldingWithStock | null;
}

export function AddHoldingForm({ open, onOpenChange, editTarget }: AddHoldingFormProps) {
  const isEdit = !!editTarget;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quantity, setQuantity] = useState('');
  const [avgPrice, setAvgPrice] = useState('');
  const [purchasedAt, setPurchasedAt] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const { mutate: upsert, isPending } = useUpsertHolding();

  const { data: searchResults = [] } = useQuery({
    queryKey: ['stock-search', searchQuery],
    queryFn: () => searchStocksForHolding(searchQuery),
    enabled: searchQuery.trim().length >= 1 && !selectedStock,
  });

  // 수정 모드일 때 기존 값으로 초기화
  useEffect(() => {
    if (editTarget && open) {
      setSelectedStock({
        id: editTarget.stock_id,
        name: editTarget.stock_name,
        code: editTarget.stock_code,
        price: editTarget.current_price,
      });
      setSearchQuery(editTarget.stock_name);
      setQuantity(String(editTarget.quantity));
      setAvgPrice(String(editTarget.avg_price));
      setPurchasedAt(editTarget.purchased_at ?? '');
    } else if (!open) {
      // 닫힐 때 초기화
      setSearchQuery('');
      setSelectedStock(null);
      setQuantity('');
      setAvgPrice('');
      setPurchasedAt('');
    }
  }, [editTarget, open]);

  // 외부 클릭 시 suggestion 닫기
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelectStock(s: StockSearchResult) {
    setSelectedStock(s);
    setSearchQuery(s.name);
    setShowSuggestions(false);
    if (!avgPrice) setAvgPrice(String(s.price));
  }

  function handleSearchChange(value: string) {
    setSearchQuery(value);
    setSelectedStock(null);
    setShowSuggestions(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedStock) {
      toast.error('종목을 선택해주세요.');
      return;
    }

    const qty = parseInt(quantity, 10);
    const price = parseInt(avgPrice.replace(/,/g, ''), 10);

    if (!qty || qty <= 0) {
      toast.error('수량을 올바르게 입력해주세요.');
      return;
    }
    if (!price || price <= 0) {
      toast.error('매수가를 올바르게 입력해주세요.');
      return;
    }

    upsert(
      {
        stock_id: selectedStock.id,
        quantity: qty,
        avg_price: price,
        purchased_at: purchasedAt || null,
      },
      {
        onSuccess: () => {
          toast.success(isEdit ? '수정됨' : '추가됨');
          onOpenChange(false);
        },
        onError: () => {
          toast.error('저장에 실패했습니다. 다시 시도해주세요.');
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEdit ? '보유 정보 수정' : '보유 종목 추가'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          {/* 종목 검색 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">종목</label>
            <div className="relative" ref={searchRef}>
              <Input
                placeholder="종목명 또는 코드 입력"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                disabled={isEdit}
              />
              {showSuggestions && searchResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                  {searchResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                      onMouseDown={() => handleSelectStock(s)}
                    >
                      <span>
                        <span className="font-medium">{s.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{s.code}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {s.price.toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 수량 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">수량 (주)</label>
            <Input
              type="number"
              min="1"
              placeholder="예: 10"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* 매수가 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">매수가 (원)</label>
            <Input
              type="number"
              min="1"
              placeholder="예: 75000"
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
            />
          </div>

          {/* 매수일 */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">매수일 (선택)</label>
            <Input
              type="date"
              value={purchasedAt}
              onChange={(e) => setPurchasedAt(e.target.value)}
            />
          </div>

          <Button type="submit" className="mt-2" disabled={isPending}>
            {isPending ? '저장 중...' : isEdit ? '수정' : '추가'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
