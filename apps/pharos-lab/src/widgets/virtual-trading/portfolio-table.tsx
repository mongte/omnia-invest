'use client';

import { useState } from 'react';
import { Skeleton } from '@/shared/ui/skeleton';
import { useVirtualPositions } from '@/features/virtual-trading/lib/use-virtual-positions';
import { usePlaceOrder } from '@/features/virtual-trading/lib/use-virtual-orders';
import type { VirtualPositionWithStock } from '@/shared/api/virtual-positions';

type SortKey = 'stock_name' | 'quantity' | 'avg_cost' | 'current_price' | 'profit_rate' | 'eval_amount';
type SortDir = 'asc' | 'desc';

interface PositionRow extends VirtualPositionWithStock {
  profit_rate: number;
  eval_amount: number;
  profit_amount: number;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'stock_name', label: '종목명' },
  { key: 'quantity', label: '수량' },
  { key: 'avg_cost', label: '평균단가' },
  { key: 'current_price', label: '현재가' },
  { key: 'profit_rate', label: '손익률' },
  { key: 'eval_amount', label: '평가액' },
];

function formatPrice(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

function toRow(p: VirtualPositionWithStock): PositionRow {
  const eval_amount = p.quantity * p.current_price;
  const cost = p.quantity * p.avg_cost;
  const profit_amount = eval_amount - cost;
  const profit_rate = cost > 0 ? (profit_amount / cost) * 100 : 0;
  return { ...p, eval_amount, profit_rate, profit_amount };
}

interface SellInlineProps {
  position: PositionRow;
  onClose: () => void;
}

function SellInline({ position, onClose }: SellInlineProps) {
  const [qty, setQty] = useState('1');
  const placeOrder = usePlaceOrder();

  function handleSell() {
    const quantity = Number(qty);
    if (!quantity || quantity < 1) return;
    placeOrder.mutate(
      {
        stockId: position.stock_id,
        side: 'sell',
        price: position.current_price,
        quantity,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        type="number"
        min="1"
        max={position.quantity}
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-16 px-2 py-1 text-xs bg-input border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        type="button"
        disabled={placeOrder.isPending}
        onClick={handleSell}
        className="px-2 py-1 text-xs font-medium bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
      >
        {placeOrder.isPending ? '처리중' : '매도'}
      </button>
      <button
        type="button"
        onClick={onClose}
        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        취소
      </button>
    </div>
  );
}

export function PortfolioTable() {
  const { data: positions, isLoading } = useVirtualPositions();
  const [sortKey, setSortKey] = useState<SortKey>('profit_rate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [sellingId, setSellingId] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const rows = (positions ?? []).map(toRow);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        보유 종목 없음
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    }
    if (typeof av === 'number' && typeof bv === 'number') {
      return sortDir === 'asc' ? av - bv : bv - av;
    }
    return 0;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                onClick={() => handleSort(col.key)}
              >
                <span className="flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key && (
                    <span className="text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>
            ))}
            <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
              매도
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.id}
              className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors"
            >
              <td className="px-3 py-2 font-medium text-foreground">
                <div>{row.stock_name}</div>
                <div className="text-xs text-muted-foreground">{row.stock_code}</div>
                {sellingId === row.id && (
                  <SellInline position={row} onClose={() => setSellingId(null)} />
                )}
              </td>
              <td className="px-3 py-2 text-right">{row.quantity.toLocaleString('ko-KR')}</td>
              <td className="px-3 py-2 text-right">{formatPrice(row.avg_cost)}</td>
              <td className="px-3 py-2 text-right">{formatPrice(row.current_price)}</td>
              <td
                className={[
                  'px-3 py-2 text-right font-medium',
                  row.profit_rate >= 0 ? 'text-emerald-500' : 'text-red-500',
                ].join(' ')}
              >
                {row.profit_rate >= 0 ? '+' : ''}
                {row.profit_rate.toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-right">{formatPrice(row.eval_amount)}</td>
              <td className="px-3 py-2">
                {sellingId !== row.id && (
                  <button
                    type="button"
                    onClick={() => setSellingId(row.id)}
                    className="px-2 py-1 text-xs font-medium border border-red-500 text-red-500 rounded hover:bg-red-500/10 transition-colors"
                  >
                    매도
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
