'use client';

import { useState } from 'react';
import { MOCK_PORTFOLIO } from '@/shared/lib/mock-data';
import type { PortfolioHolding } from '@/shared/lib/mock-data';

type SortKey = keyof Pick<PortfolioHolding, 'name' | 'quantity' | 'avgPrice' | 'currentPrice' | 'profitRate' | 'evalAmount'>;
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '종목명' },
  { key: 'quantity', label: '수량' },
  { key: 'avgPrice', label: '평균단가' },
  { key: 'currentPrice', label: '현재가' },
  { key: 'profitRate', label: '손익률' },
  { key: 'evalAmount', label: '평가액' },
];

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

function formatPrice(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function PortfolioTable() {
  const [sortKey, setSortKey] = useState<SortKey>('profitRate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...MOCK_PORTFOLIO].sort((a, b) => {
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
          </tr>
        </thead>
        <tbody>
          {sorted.map((holding) => (
            <tr key={holding.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
              <td className="px-3 py-2 font-medium text-foreground">
                <div>{holding.name}</div>
                <div className="text-xs text-muted-foreground">{holding.code}</div>
              </td>
              <td className="px-3 py-2 text-right">{formatNumber(holding.quantity)}</td>
              <td className="px-3 py-2 text-right">{formatPrice(holding.avgPrice)}</td>
              <td className="px-3 py-2 text-right">{formatPrice(holding.currentPrice)}</td>
              <td
                className={[
                  'px-3 py-2 text-right font-medium',
                  holding.profitRate >= 0 ? 'text-emerald-500' : 'text-red-500',
                ].join(' ')}
              >
                {holding.profitRate >= 0 ? '+' : ''}{holding.profitRate.toFixed(2)}%
              </td>
              <td className="px-3 py-2 text-right">{formatPrice(holding.evalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
