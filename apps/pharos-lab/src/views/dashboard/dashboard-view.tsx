'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import {
  RankingList,
  ScoreRadar,
  RankingChart,
  DisclosureTimeline,
  LlmSummary,
  PriceChart,
} from '@/widgets/dashboard';
import { Skeleton } from '@/shared/ui';
import type { RankingListItem } from '@/shared/api/dashboard';
import {
  fetchStockDetailClient,
  fetchRankingHistoryClient,
} from '@/shared/api/dashboard-client';
import type { RankingHistory } from '@/entities/stock';

interface DashboardViewProps {
  initialStocks: RankingListItem[];
}

// ---------------------------------------------------------------------------
// Query key 팩토리
// ---------------------------------------------------------------------------

const stockKeys = {
  detail: (stockId: string) => ['stock', stockId, 'detail'] as const,
  rankingHistory: (stockId: string) => ['stock', stockId, 'rankingHistory'] as const,
};

// ---------------------------------------------------------------------------
// WidgetCard — 로딩/에러 상태 지원
// ---------------------------------------------------------------------------

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  loadingSkeleton?: React.ReactNode;
}

function WidgetCard({
  title,
  children,
  className,
  isLoading,
  error,
  loadingSkeleton,
}: WidgetCardProps) {
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
      <div className="flex-1 overflow-auto p-3 min-h-0">
        {error ? (
          <WidgetError message={error} />
        ) : isLoading && loadingSkeleton ? (
          loadingSkeleton
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// WidgetError — 에러 폴백 UI
// ---------------------------------------------------------------------------

function WidgetError({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center gap-2">
      <div className="size-10 rounded-full bg-destructive/10 flex items-center justify-center">
        <svg
          className="size-5 text-destructive"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <p className="text-sm text-destructive font-medium">데이터 로드 실패</p>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 스켈레톤 프리셋 — 위젯별
// ---------------------------------------------------------------------------

function RankingListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 px-3 py-2.5">
          <Skeleton className="size-5 rounded shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex justify-between gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16 shrink-0" />
            </div>
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ScoreRadarSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-[180px] w-full rounded-lg" />
      <div className="grid grid-cols-2 gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-7 rounded" />
        ))}
      </div>
      <div className="flex flex-col gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

function RankingChartSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-5 w-8 rounded" />
        ))}
      </div>
      <Skeleton className="flex-1 min-h-[160px] rounded-lg" />
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-16" />
        ))}
      </div>
    </div>
  );
}

function DisclosureTimelineSkeleton() {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 pb-3">
          <div className="flex flex-col items-center shrink-0">
            <Skeleton className="size-2.5 rounded-full mt-1.5" />
            {i < 4 && <Skeleton className="w-px flex-1 mt-1" />}
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LlmSummarySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between gap-2">
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-5 w-12 shrink-0 rounded" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-3 w-16" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
      <Skeleton className="h-16 w-full rounded-md mt-auto" />
    </div>
  );
}

function PriceChartSkeleton() {
  return <Skeleton className="w-full h-full min-h-[200px] rounded-lg" />;
}

// ---------------------------------------------------------------------------
// DashboardView
// ---------------------------------------------------------------------------

export function DashboardView({ initialStocks }: DashboardViewProps) {
  const defaultStockId = initialStocks[0]?.id ?? '';

  const [selectedStockId, setSelectedStockId] = useState<string>(defaultStockId);
  const [selectedDisclosureId, setSelectedDisclosureId] = useState<string | null>(null);

  // 선택 종목 상세 데이터 — useQuery로 전환
  // initialData를 활용하여 초기 종목은 서버 props 데이터를 즉시 표시
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    error: detailQueryError,
  } = useQuery({
    queryKey: stockKeys.detail(selectedStockId),
    queryFn: () => fetchStockDetailClient(selectedStockId),
    enabled: !!selectedStockId,
    staleTime: 5 * 60 * 1000, // 5분: 동일 종목 재클릭 시 네트워크 요청 없음
  });

  // 상위 5종목 랭킹 이력 — useQueries로 전환
  const top5 = useMemo(() => initialStocks.slice(0, 5), [initialStocks]);

  const rankingHistoryQueries = useQueries({
    queries: top5.map((stock) => ({
      queryKey: stockKeys.rankingHistory(stock.id),
      queryFn: () => fetchRankingHistoryClient(stock.id, 30),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // 랭킹 이력 날짜별 병합 (useQueries 결과 집계)
  const rankingHistory = useMemo<RankingHistory[]>(() => {
    const allLoaded = rankingHistoryQueries.every((q) => q.data !== undefined);
    if (!allLoaded) return [];

    const mergedMap = new Map<string, RankingHistory>();
    rankingHistoryQueries.forEach((query, idx) => {
      const stockId = top5[idx]?.id;
      if (!stockId || !query.data) return;
      query.data.forEach((row) => {
        const existing = mergedMap.get(row.date) ?? { date: row.date };
        existing[stockId] = row[stockId] as number;
        mergedMap.set(row.date, existing);
      });
    });
    return Array.from(mergedMap.values()).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [rankingHistoryQueries, top5]);

  const isLoadingRanking = rankingHistoryQueries.some((q) => q.isLoading);
  const rankingQueryError = rankingHistoryQueries.find((q) => q.error)?.error;

  // 에러 메시지 변환
  const detailError = detailQueryError
    ? detailQueryError instanceof Error
      ? detailQueryError.message
      : '데이터를 불러올 수 없습니다.'
    : null;

  const rankingError = rankingQueryError
    ? rankingQueryError instanceof Error
      ? rankingQueryError.message
      : '랭킹 이력을 불러올 수 없습니다.'
    : null;

  function handleSelectStock(id: string) {
    setSelectedStockId(id);
    setSelectedDisclosureId(null);
  }

  // 현재 선택된 종목 정보: 상세 데이터 우선, 없으면 initialStocks에서 조회
  const displayStock =
    detailData?.stock ??
    initialStocks.find((s) => s.id === selectedStockId) ??
    initialStocks[0] ??
    null;

  const disclosures = detailData?.disclosures ?? [];
  const ohlcv = detailData?.ohlcv ?? [];
  const llmSummaries = detailData?.llmSummaries ?? [];

  // 선택된 공시에 해당하는 LLM 요약 찾기
  const selectedDisclosure = selectedDisclosureId
    ? (disclosures.find((d) => d.id === selectedDisclosureId) ?? null)
    : null;
  const selectedSummary = selectedDisclosureId
    ? (llmSummaries.find((s) => s.disclosureId === selectedDisclosureId) ?? null)
    : null;

  const displayStockName = displayStock?.name ?? '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 h-full auto-rows-[minmax(280px,auto)]">
      {/* ① 종목 랭킹 리스트 — 좌상단, 2행 span */}
      <WidgetCard
        title="스코어 기반 종목 랭킹"
        className="md:row-span-2"
        isLoading={initialStocks.length === 0}
        loadingSkeleton={<RankingListSkeleton />}
      >
        <RankingList
          stocks={initialStocks}
          selectedStockId={selectedStockId}
          onSelectStock={handleSelectStock}
        />
      </WidgetCard>

      {/* ② 스코어 설명 패널 — 우상단 */}
      <WidgetCard
        title={`${displayStockName} 스코어 분석`}
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<ScoreRadarSkeleton />}
      >
        {displayStock ? <ScoreRadar stock={displayStock} /> : null}
      </WidgetCard>

      {/* ③ 랭킹 변동 차트 — 우상단 */}
      <WidgetCard
        title="데일리 랭킹 변동"
        isLoading={isLoadingRanking}
        error={rankingError}
        loadingSkeleton={<RankingChartSkeleton />}
      >
        <RankingChart data={rankingHistory} stocks={initialStocks} />
      </WidgetCard>

      {/* ④ 종목 타임라인 — 좌하단 */}
      <WidgetCard
        title={`${displayStockName} 공시 타임라인`}
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<DisclosureTimelineSkeleton />}
      >
        <DisclosureTimeline
          disclosures={disclosures}
          selectedDisclosureId={selectedDisclosureId}
          onSelectDisclosure={setSelectedDisclosureId}
        />
      </WidgetCard>

      {/* ⑤ LLM 이슈 요약 패널 — 중하단 */}
      <WidgetCard
        title="AI 공시 요약"
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<LlmSummarySkeleton />}
      >
        <LlmSummary disclosure={selectedDisclosure} summary={selectedSummary} />
      </WidgetCard>

      {/* ⑥ 주가 차트 + 공시 오버레이 — 우하단 */}
      <WidgetCard
        title={`${displayStockName} 주가 차트`}
        className="col-span-3"
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<PriceChartSkeleton />}
      >
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
