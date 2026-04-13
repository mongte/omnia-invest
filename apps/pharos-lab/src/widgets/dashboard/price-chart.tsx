'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { ISeriesMarkersPluginApi, SeriesMarkerShape, Time } from 'lightweight-charts';
import type { OHLCVData, DisclosureEvent, DisclosureType } from '@/entities/stock';
import { getDisclosureSentiment } from '@/shared/api/dashboard';

interface PriceChartProps {
  ohlcv: OHLCVData[];
  disclosures: DisclosureEvent[];
  selectedDisclosureId: string | null;
  onSelectDisclosure: (id: string) => void;
  /** 매수가 수평 점선 표시 (optional) */
  avgPrice?: number;
}

export interface PriceChartHandle {
  /** 특정 공시 날짜로 차트를 스크롤합니다 */
  scrollToDisclosure: (disclosureId: string) => void;
}

const MARKER_TYPE_LABEL: Record<DisclosureType, string> = {
  earnings: '실적',
  dividend: '배당',
  capital: '증자',
  buyback: '자사주',
  ownership: '지분',
  contract: '계약',
  litigation: '소송',
  ir: 'IR',
  governance: '주총',
  warning: '경고',
  issuance: '발행',
  audit: '감사',
  other: '기타',
};

/** 공시 sentiment → 마커 색상 */
function getMarkerColor(disc: DisclosureEvent, isSelected: boolean): string {
  if (isSelected) return '#60a5fa';
  const sentiment = getDisclosureSentiment(disc.type, disc.importance);
  if (sentiment === 'positive') return '#22c55e';
  if (sentiment === 'negative') return '#ef4444';
  return '#9ca3af';
}

/** 공시 sentiment → 마커 모양 */
function getMarkerShape(disc: DisclosureEvent): SeriesMarkerShape {
  const sentiment = getDisclosureSentiment(disc.type, disc.importance);
  if (sentiment === 'positive') return 'arrowUp';
  if (sentiment === 'negative') return 'arrowDown';
  return 'circle';
}

/** 마커 배열 생성 헬퍼 */
function buildMarkers(
  disclosures: DisclosureEvent[],
  selectedDisclosureId: string | null,
) {
  return disclosures
    .filter(
      (disc) =>
        getDisclosureSentiment(disc.type, disc.importance) !== 'neutral' ||
        disc.id === selectedDisclosureId,
    )
    .map((disc) => {
      const selected = disc.id === selectedDisclosureId;
      return {
        time: disc.date as Time,
        position: 'aboveBar' as const,
        color: getMarkerColor(disc, selected),
        shape: getMarkerShape(disc),
        text: selected ? (MARKER_TYPE_LABEL[disc.type] ?? '') : '',
        size: selected ? 2 : 1,
        id: disc.id,
      };
    });
}

type IChartApi = Awaited<typeof import('lightweight-charts')>['createChart'] extends (
  ...args: Parameters<Awaited<typeof import('lightweight-charts')>['createChart']>
) => infer R
  ? R
  : never;

type CreateSeriesMarkersFn = Awaited<typeof import('lightweight-charts')>['createSeriesMarkers'];

export const PriceChart = forwardRef<PriceChartHandle, PriceChartProps>(
  function PriceChart(
    { ohlcv, disclosures, selectedDisclosureId, onSelectDisclosure, avgPrice },
    ref
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const createSeriesMarkersRef = useRef<CreateSeriesMarkersFn | null>(null);
  const seriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null);
  const onSelectRef = useRef(onSelectDisclosure);
  onSelectRef.current = onSelectDisclosure;

  // 현재 선택 ID를 ref로 유지 (handleClick에서 최신값 참조)
  const selectedIdRef = useRef(selectedDisclosureId);
  selectedIdRef.current = selectedDisclosureId;

  // ohlcv 날짜 → index 맵 (스크롤 계산용)
  const ohlcvDateIndexRef = useRef<Map<string, number>>(new Map());

  // disclosures를 ref로도 유지 (scrollToDisclosure 콜백 안정성)
  const disclosuresRef = useRef(disclosures);
  disclosuresRef.current = disclosures;

  const scrollToDisclosure = useCallback(
    (disclosureId: string) => {
      const disc = disclosuresRef.current.find((d) => d.id === disclosureId);
      if (!disc || !chartRef.current) return;

      const dateIndex = ohlcvDateIndexRef.current.get(disc.date);
      if (dateIndex === undefined) return;

      const totalBars = ohlcvDateIndexRef.current.size;
      const barsFromEnd = totalBars - 1 - dateIndex;

      // 현재 보이는 바 수를 기준으로 가운데 배치
      const timeScale = chartRef.current.timeScale();
      const visibleRange = timeScale.getVisibleLogicalRange();
      const visibleBars = visibleRange
        ? Math.round(visibleRange.to - visibleRange.from)
        : 50;
      const halfVisible = Math.round(visibleBars / 2);
      const offset = -(barsFromEnd - halfVisible);
      timeScale.scrollToPosition(offset, true);
    },
    [],
  );

  // 외부에서 scrollToDisclosure 호출 가능하도록 ref 노출
  useImperativeHandle(ref, () => ({ scrollToDisclosure }), [scrollToDisclosure]);

  // useEffect #1: 차트 생성 (ohlcv / disclosures 변경 시에만)
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;

    void import('lightweight-charts').then(
      ({ createChart, CandlestickSeries, createSeriesMarkers, LineStyle }) => {
        if (cancelled || !containerRef.current) return;

        createSeriesMarkersRef.current = createSeriesMarkers;
        const container = containerRef.current;
        const chart = createChart(container, {
          layout: {
            background: { color: 'transparent' },
            textColor: 'hsl(215 20.2% 65.1%)',
            fontSize: 11,
          },
          grid: {
            vertLines: { color: 'hsl(217.2 32.6% 17.5%)' },
            horzLines: { color: 'hsl(217.2 32.6% 17.5%)' },
          },
          crosshair: { mode: 1 },
          rightPriceScale: {
            borderColor: 'hsl(217.2 32.6% 17.5%)',
          },
          timeScale: {
            borderColor: 'hsl(217.2 32.6% 17.5%)',
            timeVisible: true,
            secondsVisible: false,
          },
          handleScroll: { mouseWheel: true, pressedMouseMove: true },
          handleScale: { mouseWheel: true, pinch: true },
        });

        chartRef.current = chart;

        const series = chart.addSeries(CandlestickSeries, {
          upColor: 'hsl(142 71% 45%)',
          downColor: 'hsl(0 72% 51%)',
          borderUpColor: 'hsl(142 71% 45%)',
          borderDownColor: 'hsl(0 72% 51%)',
          wickUpColor: 'hsl(142 71% 45%)',
          wickDownColor: 'hsl(0 72% 51%)',
        });
        seriesRef.current = series;

        // ohlcv 날짜 인덱스 맵 구성
        const dateIndexMap = new Map<string, number>();
        ohlcv.forEach((d, i) => dateIndexMap.set(d.time, i));
        ohlcvDateIndexRef.current = dateIndexMap;

        series.setData(
          ohlcv.map((d) => ({
            time: d.time as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );

        // 매수가 점선
        if (avgPrice && avgPrice > 0) {
          series.createPriceLine({
            price: avgPrice,
            color: '#f59e0b',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: '매수가',
          });
        }

        // 초기 마커 생성
        const markers = buildMarkers(disclosures, selectedIdRef.current);
        const markersPlugin = createSeriesMarkers(series, markers);
        markersPluginRef.current = markersPlugin;

        // 마커 클릭 이벤트: 공시 선택 + 가운데 스크롤
        const handleClick = (param: import('lightweight-charts').MouseEventParams) => {
          if (typeof param.hoveredObjectId === 'string' && param.hoveredObjectId !== '') {
            onSelectRef.current(param.hoveredObjectId);
            scrollToDisclosure(param.hoveredObjectId);
          }
        };
        chart.subscribeClick(handleClick);

        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
          if (container) {
            chart.resize(container.clientWidth, container.clientHeight);
          }
        });
        resizeObserver.observe(container);

        cleanup = () => {
          chart.unsubscribeClick(handleClick);
          resizeObserver.disconnect();
          chart.remove();
          chartRef.current = null;
          markersPluginRef.current = null;
          seriesRef.current = null;
          createSeriesMarkersRef.current = null;
        };
      }
    );

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [ohlcv, disclosures, scrollToDisclosure, avgPrice]);

  // useEffect #2: 마커만 업데이트 (선택 변경 시 — 차트 재생성 없이)
  useEffect(() => {
    if (!markersPluginRef.current) return;
    const markers = buildMarkers(disclosures, selectedDisclosureId);
    markersPluginRef.current.setMarkers(markers);
  }, [selectedDisclosureId, disclosures]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[200px]"
      aria-label="주가 캔들스틱 차트"
    />
  );
});
