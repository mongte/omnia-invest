'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import { searchStocksForHolding } from '@/shared/api/holdings';
import type { StockSearchResult } from '@/shared/api/holdings';
import { usePlaceOrder } from '@/features/virtual-trading/lib/use-virtual-orders';

type TradeType = 'buy' | 'sell';

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function TradeForm() {
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quantity, setQuantity] = useState('10');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeOrder = usePlaceOrder();
  const isBuy = tradeType === 'buy';

  const price = selectedStock?.price ?? 0;
  const totalAmount = price * (Number(quantity) || 0);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(() => {
      void searchStocksForHolding(searchQuery).then((res) => {
        setSuggestions(res);
        setShowSuggestions(true);
      });
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  function handleSelectStock(s: StockSearchResult) {
    setSelectedStock(s);
    setSearchQuery(s.name);
    setShowSuggestions(false);
  }

  function handleSubmit() {
    if (!selectedStock || !quantity) return;
    placeOrder.mutate({
      stockId: selectedStock.id,
      side: tradeType,
      price: selectedStock.price,
      quantity: Number(quantity),
    });
  }

  return (
    <div className="flex flex-col gap-4 relative">
      {/* 매수/매도 토글 */}
      <div className="flex rounded-md overflow-hidden border border-border">
        <button
          type="button"
          onClick={() => setTradeType('buy')}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            isBuy
              ? 'bg-emerald-500 text-white'
              : 'bg-card text-muted-foreground hover:bg-accent',
          ].join(' ')}
        >
          매수
        </button>
        <button
          type="button"
          onClick={() => setTradeType('sell')}
          className={[
            'flex-1 py-2 text-sm font-medium transition-colors',
            !isBuy
              ? 'bg-red-500 text-white'
              : 'bg-card text-muted-foreground hover:bg-accent',
          ].join(' ')}
        >
          매도
        </button>
      </div>

      {/* 종목 검색 */}
      <div className="relative">
        <label className="text-xs text-muted-foreground mb-1 block">종목 검색</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedStock && e.target.value !== selectedStock.name) {
              setSelectedStock(null);
            }
          }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="종목명 또는 종목코드"
          className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                onMouseDown={() => handleSelectStock(s)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <span>
                  <span className="font-medium text-foreground">{s.name}</span>
                  <span className="text-muted-foreground ml-2">{s.code}</span>
                </span>
                <span className="text-foreground">{formatNumber(s.price)}원</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 현재가 표시 */}
      {selectedStock && (
        <div className="text-xs text-muted-foreground">
          현재가: <span className="text-foreground font-medium">{formatNumber(selectedStock.price)}원</span>
        </div>
      )}

      {/* 수량 */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">수량</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          min="1"
          className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* 주문 미리보기 */}
      <div className="bg-accent/40 rounded-md px-3 py-2 text-sm">
        <span className="text-muted-foreground">예상 금액: </span>
        <span className="font-semibold text-foreground">{formatNumber(totalAmount)}원</span>
      </div>

      {/* 제출 버튼 */}
      <Button
        type="button"
        loading={placeOrder.isPending}
        disabled={!selectedStock || placeOrder.isPending}
        onClick={handleSubmit}
        className={cn(
          'w-full py-2.5 text-sm font-semibold text-white',
          isBuy ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'
        )}
      >
        {isBuy ? '매수 주문' : '매도 주문'}
      </Button>
    </div>
  );
}
