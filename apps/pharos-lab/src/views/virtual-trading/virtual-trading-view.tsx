'use client';

import {
  AccountSummary,
  PortfolioTable,
  TradeForm,
  AiSignals,
  BacktestChart,
} from '@/widgets/virtual-trading';

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

      {/* 상단: 계좌 요약 */}
      <AccountSummary />

      {/* 중단: 포트폴리오 + 매매 폼 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <WidgetCard title="포트폴리오" className="lg:col-span-2" noPadding>
          <div className="p-3">
            <PortfolioTable />
          </div>
        </WidgetCard>
        <WidgetCard title="매매 실행">
          <TradeForm />
        </WidgetCard>
      </div>

      {/* 하단: AI 시그널 + 백테스팅 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WidgetCard title="AI 매수/매도 시그널" className="min-h-[340px]" noPadding>
          <div className="p-3 h-full">
            <AiSignals />
          </div>
        </WidgetCard>
        <WidgetCard title="백테스팅" className="overflow-visible">
          <BacktestChart />
        </WidgetCard>
      </div>
    </div>
  );
}
