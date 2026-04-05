'use client';

import { useState } from 'react';
import {
  RankingList,
  ScoreRadar,
  RankingChart,
  DisclosureTimeline,
  LlmSummary,
  PriceChart,
} from '@/widgets/dashboard';
import {
  MOCK_STOCKS,
  RANKING_HISTORY,
  getDisclosuresByStock,
  generateOHLCVData,
  MOCK_LLM_SUMMARIES,
} from '@/shared/lib/mock-data';

function WidgetCard({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
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
      <div className="flex-1 overflow-auto p-3 min-h-0">{children}</div>
    </div>
  );
}

export function DashboardView() {
  const [selectedStockId, setSelectedStockId] = useState<string>('samsung');
  const [selectedDisclosureId, setSelectedDisclosureId] = useState<
    string | null
  >(null);

  const selectedStock =
    MOCK_STOCKS.find((s) => s.id === selectedStockId) ?? MOCK_STOCKS[0];
  const disclosures = getDisclosuresByStock(selectedStockId);
  const ohlcv = generateOHLCVData(selectedStockId);
  const selectedDisclosure = selectedDisclosureId
    ? disclosures.find((d) => d.id === selectedDisclosureId) ?? null
    : null;
  const selectedSummary = selectedDisclosureId
    ? (MOCK_LLM_SUMMARIES[selectedDisclosureId] ?? null)
    : null;

  function handleSelectStock(id: string) {
    setSelectedStockId(id);
    setSelectedDisclosureId(null);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-[minmax(280px,auto)]">
      {/* ① 종목 랭킹 리스트 — 좌상단, 2행 span */}
      <WidgetCard
        title="스코어 기반 종목 랭킹"
        className="md:row-span-2"
      >
        <RankingList
          stocks={MOCK_STOCKS}
          selectedStockId={selectedStockId}
          onSelectStock={handleSelectStock}
        />
      </WidgetCard>

      {/* ② 스코어 설명 패널 — 우상단 */}
      <WidgetCard title={`${selectedStock.name} 스코어 분석`}>
        <ScoreRadar stock={selectedStock} />
      </WidgetCard>

      {/* ③ 랭킹 변동 차트 — 우상단 */}
      <WidgetCard title="데일리 랭킹 변동">
        <RankingChart data={RANKING_HISTORY} stocks={MOCK_STOCKS} />
      </WidgetCard>

      {/* ④ 종목 타임라인 — 좌하단 */}
      <WidgetCard title={`${selectedStock.name} 공시 타임라인`}>
        <DisclosureTimeline
          disclosures={disclosures}
          selectedDisclosureId={selectedDisclosureId}
          onSelectDisclosure={setSelectedDisclosureId}
        />
      </WidgetCard>

      {/* ⑤ LLM 이슈 요약 패널 — 중하단 */}
      <WidgetCard title="AI 공시 요약">
        <LlmSummary
          disclosure={selectedDisclosure}
          summary={selectedSummary}
        />
      </WidgetCard>

      {/* ⑥ 주가 차트 + 공시 오버레이 — 우하단 */}
      <WidgetCard title={`${selectedStock.name} 주가 차트`} className="col-span-3">
        <PriceChart
          ohlcv={ohlcv}
          disclosures={disclosures}
          selectedDisclosureId={selectedDisclosureId}
          onSelectDisclosure={setSelectedDisclosureId}
        />
      </WidgetCard>
    </div>
  );
}
