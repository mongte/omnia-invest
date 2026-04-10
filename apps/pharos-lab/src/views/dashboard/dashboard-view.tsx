'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  RankingList,
  ScoreRadar,
  DisclosureTimeline,
  PriceChart,
} from '@/widgets/dashboard';
import type { PriceChartHandle } from '@/widgets/dashboard/price-chart';
import { Skeleton, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/shared/ui';
import { HelpCircle } from 'lucide-react';
import type { RankingListItem, PaginatedRankingList } from '@/shared/api/dashboard';
import {
  fetchStockDetailClient,
  fetchRankingListClient,
  fetchRankingSearchClient,
} from '@/shared/api/dashboard-client';

const PAGE_SIZE = 50;

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
  tooltip?: React.ReactNode;
}

function WidgetCard({
  title,
  children,
  className,
  isLoading,
  error,
  loadingSkeleton,
  tooltip,
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
        <div className="flex items-center gap-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {tooltip && (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-72">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // 차트 스크롤 연동용 ref
  const priceChartRef = useRef<PriceChartHandle>(null);

  // ---------------------------------------------------------------------------
  // 검색어 유효성 검사
  // ---------------------------------------------------------------------------

  type SearchHint =
    | { type: 'whitespace'; message: string }
    | { type: 'special-only'; message: string }
    | { type: 'too-short'; message: string }
    | { type: 'valid' };

  function getSearchHint(query: string): SearchHint {
    if (query.length === 0) return { type: 'valid' };
    if (query.trim().length === 0) {
      return { type: 'whitespace', message: '공백으로는 검색할 수 없습니다' };
    }
    const trimmed = query.trim();
    // 한글, 영문, 숫자가 하나도 없으면 특수문자만
    if (!/[가-힣a-zA-Z0-9]/.test(trimmed)) {
      return { type: 'special-only', message: '종목명 또는 종목코드를 입력해주세요' };
    }
    if (trimmed.length < 2) {
      return { type: 'too-short', message: '두 글자 이상 입력하면 검색됩니다' };
    }
    return { type: 'valid' };
  }

  const searchHint = getSearchHint(searchQuery);
  const isQueryValid = searchHint.type === 'valid' && searchQuery.trim().length >= 2;

  // 검색어 debounce (300ms) — 유효한 쿼리만 반영
  useEffect(() => {
    if (!isQueryValid) {
      setDebouncedQuery('');
      return;
    }
    const timer = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery, isQueryValid]);

  // 검색 useQuery
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['stocks', 'search', debouncedQuery],
    queryFn: () => fetchRankingSearchClient(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  // 랭킹 목록 무한 스크롤 — initialData로 서버 SSR 데이터 즉시 표시
  const {
    data: rankingData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['stocks', 'ranking'],
    queryFn: ({ pageParam }: { pageParam: number }) =>
      fetchRankingListClient(PAGE_SIZE, pageParam),
    initialPageParam: 0 as number,
    getNextPageParam: (lastPage: PaginatedRankingList, allPages: PaginatedRankingList[]) =>
      lastPage.hasMore ? allPages.length * PAGE_SIZE : undefined,
    initialData: {
      pages: [{ items: initialStocks, hasMore: initialStocks.length === PAGE_SIZE }],
      pageParams: [0],
    },
  });

  const allStocksRaw = rankingData?.pages.flatMap((page) => page.items) ?? initialStocks;
  const seenIds = new Set<string>();
  const allStocks = allStocksRaw.filter((s) => {
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  });

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

  // 에러 메시지 변환
  const detailError = detailQueryError
    ? detailQueryError instanceof Error
      ? detailQueryError.message
      : '데이터를 불러올 수 없습니다.'
    : null;

  function handleSelectStock(id: string) {
    setSelectedStockId(id);
    setSelectedDisclosureId(null);
  }

  /** 공시 선택 + 차트 스크롤 연동 */
  function handleScrollToDisclosure(disclosureId: string) {
    priceChartRef.current?.scrollToDisclosure(disclosureId);
  }

  // 현재 선택된 종목 정보: 상세 데이터 우선, 없으면 allStocks에서 조회
  const displayStock =
    detailData?.stock ??
    allStocks.find((s) => s.id === selectedStockId) ??
    allStocks[0] ??
    null;

  const disclosures = detailData?.disclosures ?? [];
  const ohlcv = detailData?.ohlcv ?? [];

  const displayStockName = displayStock?.name ?? '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-[3fr_7fr] gap-4 h-full md:grid-rows-[7fr_3fr]">
      {/* ① 종목 랭킹 — 좌상단 */}
      <WidgetCard
        title="종목 랭킹"
        tooltip={
          <div className="space-y-1.5">
            <p className="font-medium text-xs">종합 점수 기반 순위</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-3">
              <li>펀더멘털 (30%) — PER·PBR·ROE·매출성장률</li>
              <li>타이밍 (30%) — RSI·MACD·볼린저밴드·이격도</li>
              <li>ML 예측 (40%) — 5거래일 상승 확률</li>
            </ul>
            <p className="text-xs text-muted-foreground/80 border-t border-border/50 pt-1">
              0~100점, 높을수록 매수 유리
            </p>
          </div>
        }
        isLoading={allStocks.length === 0}
        loadingSkeleton={<RankingListSkeleton />}
      >
        <RankingList
          stocks={allStocks}
          selectedStockId={selectedStockId}
          onSelectStock={handleSelectStock}
          onLoadMore={fetchNextPage}
          hasMore={hasNextPage ?? false}
          isLoadingMore={isFetchingNextPage}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          searchHint={searchHint.type !== 'valid' ? searchHint.message : null}
          searchResults={isQueryValid ? (searchResults ?? []) : null}
          isSearching={isQueryValid && (searchQuery.trim() !== debouncedQuery || isSearching)}
        />
      </WidgetCard>

      {/* ② 스코어 분석 — 우상단 */}
      <WidgetCard
        title={`${displayStockName} 스코어 분석`}
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<ScoreRadarSkeleton />}
      >
        {displayStock ? (
          <ScoreRadar
            stock={{
              ...displayStock,
              scoreDescriptions:
                detailData?.stock.scoreDescriptions ??
                displayStock.scoreDescriptions ??
                null,
            }}
          />
        ) : null}
      </WidgetCard>

      {/* ③ 공시 타임라인 — 좌하단 */}
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
          onScrollToDisclosure={handleScrollToDisclosure}
        />
      </WidgetCard>

      {/* ④ 주가 차트 — 우하단 */}
      <WidgetCard
        title={`${displayStockName} 주가 차트`}
        isLoading={isLoadingDetail}
        error={detailError}
        loadingSkeleton={<PriceChartSkeleton />}
      >
        <PriceChart
          ref={priceChartRef}
          ohlcv={ohlcv}
          disclosures={disclosures}
          selectedDisclosureId={selectedDisclosureId}
          onSelectDisclosure={setSelectedDisclosureId}
        />
      </WidgetCard>
    </div>
  );
}
