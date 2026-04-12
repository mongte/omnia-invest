'use client';

import { useState, useEffect } from 'react';
import { MOCK_STOCKS } from '@/shared/lib/mock-data';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

type TradeType = 'buy' | 'sell';

const STOCK_SUGGESTIONS = MOCK_STOCKS.map((s) => ({ id: s.id, code: s.code, name: s.name, price: s.price }));

function formatNumber(n: number): string {
  return n.toLocaleString('ko-KR');
}

interface ToastState {
  visible: boolean;
  message: string;
}

export function TradeForm() {
  const [tradeType, setTradeType] = useState<TradeType>('buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStock, setSelectedStock] = useState(STOCK_SUGGESTIONS[0]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [quantity, setQuantity] = useState('10');
  const [price, setPrice] = useState(String(STOCK_SUGGESTIONS[0].price));
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSuggestions = STOCK_SUGGESTIONS.filter(
    (s) =>
      s.name.includes(searchQuery) || s.code.includes(searchQuery)
  );

  const totalAmount = Number(price.replace(/,/g, '')) * Number(quantity) || 0;

  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => setToast({ visible: false, message: '' }), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  function handleSelectStock(s: typeof STOCK_SUGGESTIONS[number]) {
    setSelectedStock(s);
    setSearchQuery(s.name);
    setPrice(String(s.price));
    setShowSuggestions(false);
  }

  function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const action = tradeType === 'buy' ? '매수' : '매도';
      setToast({
        visible: true,
        message: `${selectedStock.name} ${Number(quantity).toLocaleString('ko-KR')}주 ${action} 주문이 접수되었습니다.`,
      });
      setIsSubmitting(false);
    }, 500);
  }

  const isBuy = tradeType === 'buy';

  return (
    <div className="flex flex-col gap-4 relative">
      {/* Toast */}
      {toast.visible && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-foreground text-background text-xs px-4 py-2 rounded-md shadow-lg animate-in fade-in slide-in-from-top-2">
          {toast.message}
        </div>
      )}

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
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder="종목명 또는 종목코드"
          className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-popover border border-border rounded-md shadow-md overflow-hidden">
            {filteredSuggestions.map((s) => (
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

      {/* 가격 */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">주문 가격</label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
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
        loading={isSubmitting}
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
