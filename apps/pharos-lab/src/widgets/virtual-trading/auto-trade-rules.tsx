'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Plus, X, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Skeleton } from '@/shared/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { useAutoRules, useCreateRule, useCancelRule } from '@/features/virtual-trading/lib/use-auto-rules';
import { usePlaceOrder } from '@/features/virtual-trading/lib/use-virtual-orders';
import { searchStocksForHolding } from '@/shared/api/holdings';
import { upsertEquitySnapshot } from '@/shared/api/virtual-equity';
import { useAuthStore } from '@/entities/user';
import type { StockSearchResult } from '@/shared/api/holdings';
import type { AutoRuleWithStock } from '@/shared/api/auto-trade-rules';

type RuleType = 'take_profit' | 'stop_loss' | 'limit_buy' | 'signal_buy' | 'signal_sell';
type TriggerSignal = 'strong_buy' | 'strong_sell';

const RULE_TYPE_LABELS: Record<RuleType, string> = {
  take_profit: '익절 (Take Profit)',
  stop_loss: '손절 (Stop Loss)',
  limit_buy: '지정가 매수',
  signal_buy: '시그널 매수',
  signal_sell: '시그널 매도',
};

const SIGNAL_LABELS: Record<TriggerSignal, string> = {
  strong_buy: 'Strong Buy',
  strong_sell: 'Strong Sell',
};

const PRICE_RULE_TYPES: RuleType[] = ['take_profit', 'stop_loss', 'limit_buy'];

function formatKRW(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

function RuleCard({
  rule,
  onCancel,
  isCancelling,
}: {
  rule: AutoRuleWithStock;
  onCancel: (id: string) => void;
  isCancelling: boolean;
}) {
  const isPriceRule = PRICE_RULE_TYPES.includes(rule.rule_type as RuleType);

  return (
    <div className="flex items-start gap-3 rounded-md border border-border p-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">{rule.stock_name}</span>
          <span className="text-xs text-muted-foreground">{rule.stock_code}</span>
          <span className="ml-auto text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
            {RULE_TYPE_LABELS[rule.rule_type as RuleType] ?? rule.rule_type}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          수량: <span className="text-foreground">{rule.quantity.toLocaleString('ko-KR')}주</span>
          {isPriceRule && rule.trigger_price != null && (
            <> · 기준가: <span className="text-foreground">{formatKRW(rule.trigger_price)}</span></>
          )}
          {!isPriceRule && rule.trigger_signal && (
            <> · 시그널: <span className="text-foreground">{SIGNAL_LABELS[rule.trigger_signal as TriggerSignal] ?? rule.trigger_signal}</span></>
          )}
        </div>
      </div>
      <button
        type="button"
        disabled={isCancelling}
        onClick={() => onCancel(rule.id)}
        className="shrink-0 p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
        aria-label="규칙 취소"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

interface CreateRuleFormProps {
  initialStock?: { id: string; name: string; code: string } | null;
  onClose: () => void;
}

function CreateRuleForm({ initialStock, onClose }: CreateRuleFormProps) {
  const [ruleType, setRuleType] = useState<RuleType>('take_profit');
  const [searchQuery, setSearchQuery] = useState(initialStock?.name ?? '');
  const [selectedStock, setSelectedStock] = useState<(StockSearchResult & { id: string }) | null>(
    initialStock ? { ...initialStock, price: 0 } : null,
  );
  const [suggestions, setSuggestions] = useState<StockSearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [triggerPrice, setTriggerPrice] = useState('');
  const [triggerSignal, setTriggerSignal] = useState<TriggerSignal>('strong_buy');
  const [quantity, setQuantity] = useState('10');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const createRule = useCreateRule();
  const isPriceRule = PRICE_RULE_TYPES.includes(ruleType);

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
    setTriggerPrice(String(s.price));
    setShowSuggestions(false);
  }

  function handleSubmit() {
    if (!selectedStock || !quantity) return;
    createRule.mutate(
      {
        stockId: selectedStock.id,
        ruleType,
        quantity: Number(quantity),
        triggerPrice: isPriceRule ? Number(triggerPrice) || null : null,
        triggerSignal: !isPriceRule ? triggerSignal : null,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {/* 규칙 유형 */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">규칙 유형</label>
        <select
          value={ruleType}
          onChange={(e) => setRuleType(e.target.value as RuleType)}
          className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {(Object.entries(RULE_TYPE_LABELS) as [RuleType, string][]).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {/* 종목 검색 */}
      <div className="relative">
        <label className="text-xs text-muted-foreground mb-1 block">종목 검색</label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (selectedStock && e.target.value !== selectedStock.name) setSelectedStock(null);
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
                <span className="font-medium text-foreground">{s.name}</span>
                <span className="text-muted-foreground">{s.code}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 기준가 (가격형 규칙) */}
      {isPriceRule && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">기준가 (원)</label>
          <input
            type="number"
            value={triggerPrice}
            onChange={(e) => setTriggerPrice(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="0"
          />
        </div>
      )}

      {/* 트리거 시그널 (시그널형 규칙) */}
      {!isPriceRule && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">트리거 시그널</label>
          <select
            value={triggerSignal}
            onChange={(e) => setTriggerSignal(e.target.value as TriggerSignal)}
            className="w-full px-3 py-2 text-sm bg-input border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(Object.entries(SIGNAL_LABELS) as [TriggerSignal, string][]).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
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

      <Button
        type="button"
        loading={createRule.isPending}
        disabled={!selectedStock || createRule.isPending}
        onClick={handleSubmit}
        className="w-full"
      >
        규칙 등록
      </Button>
    </div>
  );
}

export interface AutoTradeRulesHandle {
  openSheet: (stock?: { id: string; name: string; code: string }) => void;
}

export const AutoTradeRules = forwardRef<AutoTradeRulesHandle>(function AutoTradeRules(_props, ref) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetStock, setSheetStock] = useState<{ id: string; name: string; code: string } | null>(null);
  const [checkingRules, setCheckingRules] = useState(false);

  const { data: rules, isLoading } = useAutoRules();
  const cancelRule = useCancelRule();
  const placeOrder = usePlaceOrder();
  const { user } = useAuthStore();

  useImperativeHandle(ref, () => ({
    openSheet(stock) {
      setSheetStock(stock ?? null);
      setSheetOpen(true);
    },
  }));

  function handleCancel(id: string) {
    cancelRule.mutate(id);
  }

  async function handleCheckRules() {
    if (!rules || rules.length === 0 || !user) return;
    setCheckingRules(true);
    try {
      await upsertEquitySnapshot(user.id);

      let triggered = 0;
      for (const rule of rules) {
        const isPriceRule = PRICE_RULE_TYPES.includes(rule.rule_type as RuleType);
        if (!isPriceRule) continue;
        if (rule.trigger_price == null) continue;

        const currentPrice = rule.trigger_price;
        let shouldTrigger = false;

        if (rule.rule_type === 'take_profit' || rule.rule_type === 'stop_loss') {
          shouldTrigger = true;
        } else if (rule.rule_type === 'limit_buy') {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          const side: 'buy' | 'sell' =
            rule.rule_type === 'limit_buy' || rule.rule_type === 'stop_loss'
              ? 'buy'
              : 'sell';

          try {
            await placeOrder.mutateAsync({
              stockId: rule.stock_id ?? '',
              side,
              price: currentPrice,
              quantity: rule.quantity,
            });
            await cancelRule.mutateAsync(rule.id);
            triggered++;
          } catch {
            // 개별 규칙 체결 실패는 계속 진행
          }
        }
      }
      toast.success(`규칙 체크 완료. ${triggered}개 체결.`);
    } catch (err) {
      if (err instanceof Error) toast.error(err.message);
    } finally {
      setCheckingRules(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">활성 규칙 {rules?.length ?? 0}개</span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            loading={checkingRules}
            onClick={() => void handleCheckRules()}
          >
            <Zap className="size-3 mr-1" />
            지금 체크
          </Button>
          <Button
            size="sm"
            className="text-xs"
            onClick={() => {
              setSheetStock(null);
              setSheetOpen(true);
            }}
          >
            <Plus className="size-3 mr-1" />
            규칙 추가
          </Button>
        </div>
      </div>

      {/* 규칙 목록 */}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !rules || rules.length === 0 ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          등록된 자동매매 규칙 없음
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onCancel={handleCancel}
              isCancelling={cancelRule.isPending}
            />
          ))}
        </div>
      )}

      {/* 규칙 생성 Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>자동매매 규칙 만들기</SheetTitle>
          </SheetHeader>
          <CreateRuleForm
            initialStock={sheetStock}
            onClose={() => setSheetOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
});
