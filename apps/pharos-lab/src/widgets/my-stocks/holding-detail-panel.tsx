'use client';

import { useMemo } from 'react';
import type { HoldingWithStock } from '@/shared/api/holdings';
import type { OHLCVData } from '@/entities/stock';
import { PriceChart } from '@/widgets/dashboard/price-chart';
import {
  getDecision,
  DECISION_LABEL,
  DECISION_BADGE_CLASS,
} from '@/features/holdings/lib/decision-algorithm';

interface HoldingDetailPanelProps {
  holding: HoldingWithStock;
  ohlcv: OHLCVData[];
}

function calcHoldingDays(purchasedAt: string | null): number {
  if (!purchasedAt) return 0;
  const diff = Date.now() - new Date(purchasedAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function calcMA20Position(ohlcv: OHLCVData[]): 'above' | 'below' | 'unknown' {
  if (ohlcv.length < 20) return 'unknown';
  const last20 = ohlcv.slice(-20);
  const ma20 = last20.reduce((sum, d) => sum + d.close, 0) / 20;
  const lastClose = ohlcv[ohlcv.length - 1].close;
  return lastClose >= ma20 ? 'above' : 'below';
}

export function HoldingDetailPanel({ holding, ohlcv }: HoldingDetailPanelProps) {
  const profitRate =
    holding.avg_price > 0
      ? ((holding.current_price - holding.avg_price) / holding.avg_price) * 100
      : 0;

  const holdingDays = calcHoldingDays(holding.purchased_at);
  const ma20Position = useMemo(() => calcMA20Position(ohlcv), [ohlcv]);

  const result = getDecision({
    pharosScore: holding.pharos_score,
    profitRate,
    ma20Position,
    holdingDays,
  });

  const profitColor =
    profitRate > 0 ? 'text-red-400' : profitRate < 0 ? 'text-blue-400' : 'text-zinc-400';

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
      {/* 종목 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{holding.stock_name}</h3>
          <p className="text-xs text-muted-foreground">{holding.stock_code}</p>
        </div>
        <div className="text-right">
          <p className={`text-lg font-bold tabular-nums ${profitColor}`}>
            {profitRate >= 0 ? '+' : ''}
            {profitRate.toFixed(2)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {holding.avg_price.toLocaleString()} → {holding.current_price.toLocaleString()}원
          </p>
        </div>
      </div>

      {/* pharos 스코어 바 */}
      {holding.pharos_score !== null && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>pharos 스코어</span>
            <span className="font-medium text-foreground">{holding.pharos_score}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-amber-500 transition-all"
              style={{ width: `${holding.pharos_score}%` }}
            />
          </div>
        </div>
      )}

      {/* 차트 */}
      <div className="h-48 w-full">
        {ohlcv.length > 0 ? (
          <PriceChart
            ohlcv={ohlcv}
            disclosures={[]}
            selectedDisclosureId={null}
            onSelectDisclosure={() => undefined}
            avgPrice={holding.avg_price}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            차트 데이터 없음
          </div>
        )}
      </div>

      {/* 판단 카드 */}
      <div className="rounded-md border border-border bg-muted/20 p-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${DECISION_BADGE_CLASS[result.decision]}`}
          >
            {DECISION_LABEL[result.decision]}
          </span>
          {result.lowConfidence && (
            <span className="text-xs text-yellow-500">⚠ MA 데이터 부족 · 신뢰도 낮음</span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{result.reason}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>pharos: {holding.pharos_score ?? '-'}</span>
          <span>MA: {ma20Position === 'above' ? '상단' : ma20Position === 'below' ? '하단' : '데이터 부족'}</span>
          <span>
            수익: {profitRate >= 0 ? '+' : ''}
            {profitRate.toFixed(1)}%
          </span>
          <span>보유: {holdingDays}일</span>
        </div>
      </div>

      {/* 면책 고지 */}
      <p className="text-xs text-muted-foreground/60">
        본 정보는 투자 참고용이며 특정 종목의 매수·매도를 권유하지 않습니다.
        현재가 기준: 17:30 KST · 실시간 아님
      </p>
    </div>
  );
}
