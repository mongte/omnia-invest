'use client';

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef } from 'react';
import type { ISeriesMarkersPluginApi, Time } from 'lightweight-charts';
import type { OHLCVData, DisclosureEvent } from '@/entities/stock';
import { getDisclosureSentiment } from '@/shared/api/dashboard';

interface PriceChartProps {
  ohlcv: OHLCVData[];
  disclosures: DisclosureEvent[];
  selectedDisclosureId: string | null;
  onSelectDisclosure: (id: string) => void;
}

export interface PriceChartHandle {
  /** 특정 공시 날짜로 차트를 스크롤합니다 */
  scrollToDisclosure: (disclosureId: string) => void;
}

/** 공시 sentiment → 마커 색상 */
function getMarkerColor(disc: DisclosureEvent, isSelected: boolean): string {
  if (isSelected) return '#60a5fa';
  const sentiment = getDisclosureSentiment(disc.type, disc.importance);
  if (sentiment === 'positive') return '#22c55e';
  if (sentiment === 'negative') return '#ef4444';
  return '#6b7280';
}

type IChartApi = Awaited<typeof import('lightweight-charts')>['createChart'] extends (
  ...args: Parameters<Awaited<typeof import('lightweight-charts')>['createChart']>
) => infer R
  ? R
  : never;

export const PriceChart = forwardRef<PriceChartHandle, PriceChartProps>(
  function PriceChart(
    { ohlcv, disclosures, selectedDisclosureId, onSelectDisclosure },
    ref
  ) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const onSelectRef = useRef(onSelectDisclosure);
  onSelectRef.current = onSelectDisclosure;

  // ohlcv 날짜 → index 맵 (스크롤 계산용)
  const ohlcvDateIndexRef = useRef<Map<string, number>>(new Map());

  const scrollToDisclosure = useCallback(
    (disclosureId: string) => {
      const disc = disclosures.find((d) => d.id === disclosureId);
      if (!disc || !chartRef.current) return;

      const dateIndex = ohlcvDateIndexRef.current.get(disc.date);
      if (dateIndex === undefined) return;

      // 전체 ohlcv 길이 기준으로 끝에서 몇 칸 앞인지 계산
      const totalBars = ohlcvDateIndexRef.current.size;
      // scrollToPosition: 양수 = 오른쪽(최신), 음수 = 왼쪽(과거)
      // 0 = 마지막 바가 오른쪽 끝에 정렬된 기준
      const barsFromEnd = totalBars - 1 - dateIndex;
      const offset = -(barsFromEnd - 5); // 해당 날짜를 차트 우측에서 5칸 여유 두고 표시
      chartRef.current.timeScale().scrollToPosition(offset, true);
    },
    [disclosures]
  );

  // 외부에서 scrollToDisclosure 호출 가능하도록 ref 노출
  useImperativeHandle(ref, () => ({ scrollToDisclosure }), [scrollToDisclosure]);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    void import('lightweight-charts').then(
      ({ createChart, CandlestickSeries, createSeriesMarkers }) => {
        if (!containerRef.current) return;

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

        // ohlcv 날짜 인덱스 맵 구성
        const dateIndexMap = new Map<string, number>();
        ohlcv.forEach((d, i) => dateIndexMap.set(d.time, i));
        ohlcvDateIndexRef.current = dateIndexMap;

        series.setData(
          ohlcv.map((d) => ({
            time: d.time as import('lightweight-charts').Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );

        // 공시 마커 생성 (호재/악재/중립 색상)
        const markers = disclosures.map((disc) => ({
          time: disc.date as import('lightweight-charts').Time,
          position: 'aboveBar' as const,
          color: getMarkerColor(disc, disc.id === selectedDisclosureId),
          shape: 'arrowDown' as const,
          text: '',
          id: disc.id,
        }));

        const markersPlugin = createSeriesMarkers(series, markers);
        markersPluginRef.current = markersPlugin;

        chart.timeScale().fitContent();

        const resizeObserver = new ResizeObserver(() => {
          if (container) {
            chart.resize(container.clientWidth, container.clientHeight);
          }
        });
        resizeObserver.observe(container);

        cleanup = () => {
          resizeObserver.disconnect();
          chart.remove();
          chartRef.current = null;
          markersPluginRef.current = null;
        };
      }
    );

    return () => {
      cleanup?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ohlcv]);

  // 마커 업데이트 (공시 선택 변경 시 — 호재/악재/중립/선택 색상)
  useEffect(() => {
    if (!markersPluginRef.current) return;

    const markers = disclosures.map((disc) => ({
      time: disc.date as import('lightweight-charts').Time,
      position: 'aboveBar' as const,
      color: getMarkerColor(disc, disc.id === selectedDisclosureId),
      shape: 'arrowDown' as const,
      text: '',
      id: disc.id,
    }));

    markersPluginRef.current.setMarkers(markers);
  }, [disclosures, selectedDisclosureId]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full min-h-[200px]"
      aria-label="주가 캔들스틱 차트"
    />
  );
});
