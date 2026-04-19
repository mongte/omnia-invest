'use client';

import { useRef } from 'react';
import { PortfolioSummary } from '@/widgets/virtual-trading/portfolio-summary';
import { PortfolioTable } from '@/widgets/virtual-trading/portfolio-table';
import { TradeForm } from '@/widgets/virtual-trading/trade-form';
import { AiSignals } from '@/widgets/virtual-trading/ai-signals';
import { EquityChart } from '@/widgets/virtual-trading/equity-chart';
import { AutoTradeRules, type AutoTradeRulesHandle } from '@/widgets/virtual-trading/auto-trade-rules';

function PremiumBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
      ★ Premium Feature
    </span>
  );
}

function WidgetCard({
  title,
  children,
  className,
  noPadding,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={[
        'rounded-lg border border-border bg-card flex flex-col overflow-hidden',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="px-4 pt-3 pb-2 border-b border-border shrink-0">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div className={['flex-1 overflow-auto min-h-0', noPadding ? '' : 'p-3'].join(' ')}>
        {children}
      </div>
    </div>
  );
}

export function VirtualTradingView() {
  const autoRulesRef = useRef<AutoTradeRulesHandle>(null);

  function handleOpenAutoRule(stock: { id: string; name: string; code: string }) {
    autoRulesRef.current?.openSheet(stock);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">가상 투자</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI 시그널 기반 가상 매매 및 포트폴리오 관리
          </p>
        </div>
        <PremiumBadge />
      </div>

      {/* AI 시그널 띠 (전체 폭) */}
      <WidgetCard title="AI 시그널" noPadding>
        <AiSignals onOpenAutoRule={handleOpenAutoRule} />
      </WidgetCard>

      {/* 포트폴리오 요약 */}
      <div className="rounded-lg border border-border bg-card p-4">
        <PortfolioSummary />
      </div>

      {/* 2x2 그리드 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 상단 좌: 포트폴리오 테이블 */}
        <WidgetCard title="포트폴리오" noPadding className="min-h-[280px]">
          <div className="p-3">
            <PortfolioTable />
          </div>
        </WidgetCard>

        {/* 상단 우: 매매 폼 */}
        <WidgetCard title="매매 실행" className="min-h-[280px]">
          <TradeForm />
        </WidgetCard>

        {/* 하단 좌: 자산 커브 */}
        <WidgetCard title="자산 추이 (30일)">
          <EquityChart />
        </WidgetCard>

        {/* 하단 우: 자동매매 규칙 */}
        <WidgetCard title="자동매매 규칙" className="min-h-[280px]">
          <AutoTradeRules ref={autoRulesRef} />
        </WidgetCard>
      </div>

      {/* 면책 문구 */}
      <p className="text-xs text-muted-foreground text-center py-2">
        본 서비스는 투자 참고 정보를 제공하며, 특정 종목의 매수·매도를 권유하지 않습니다.
        투자 판단과 그에 따른 책임은 이용자 본인에게 있습니다.
      </p>
    </div>
  );
}
