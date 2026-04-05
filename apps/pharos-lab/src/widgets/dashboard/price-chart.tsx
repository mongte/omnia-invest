'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ISeriesMarkersPluginApi, Time } from 'lightweight-charts';
import type { OHLCVData, DisclosureEvent } from '@/entities/stock';

interface PriceChartProps {
  ohlcv: OHLCVData[];
  disclosures: DisclosureEvent[];
  selectedDisclosureId: string | null;
  onSelectDisclosure: (id: string) => void;
}

const IMPORTANCE_COLORS: Record<DisclosureEvent['importance'], string> = {
  high: '#ef4444',
  medium: '#eab308',
  low: '#6b7280',
};

type IChartApi = Awaited<typeof import('lightweight-charts')>['createChart'] extends (
  ...args: Parameters<Awaited<typeof import('lightweight-charts')>['createChart']>
) => infer R
  ? R
  : never;

export function PriceChart({
  ohlcv,
  disclosures,
  selectedDisclosureId,
  onSelectDisclosure,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const onSelectRef = useRef(onSelectDisclosure);
  onSelectRef.current = onSelectDisclosure;

  const scrollToDisclosure = useCallback(
    (disclosureId: string) => {
      const disc = disclosures.find((d) => d.id === disclosureId);
      if (!disc || !chartRef.current) return;
      chartRef.current.timeScale().scrollToPosition(0, false);
      chartRef.current.timeScale().scrollToRealTime();
    },
    [disclosures]
  );

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

        series.setData(
          ohlcv.map((d) => ({
            time: d.time as import('lightweight-charts').Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          }))
        );

        // 공시 마커 생성
        const markers = disclosures.map((disc) => ({
          time: disc.date as import('lightweight-charts').Time,
          position: 'aboveBar' as const,
          color: IMPORTANCE_COLORS[disc.importance],
          shape: 'arrowDown' as const,
          text: disc.id === selectedDisclosureId ? '▼' : '',
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

  // 마커 업데이트 (공시 선택 변경 시)
  useEffect(() => {
    if (!markersPluginRef.current) return;

    const markers = disclosures.map((disc) => ({
      time: disc.date as import('lightweight-charts').Time,
      position: 'aboveBar' as const,
      color:
        disc.id === selectedDisclosureId
          ? '#60a5fa'
          : IMPORTANCE_COLORS[disc.importance],
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
}
