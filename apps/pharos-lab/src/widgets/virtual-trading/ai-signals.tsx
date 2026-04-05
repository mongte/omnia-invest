'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { ISeriesMarkersPluginApi, Time } from 'lightweight-charts';
import { MOCK_AI_SIGNALS, generateOHLCVData } from '@/shared/lib/mock-data';
import type { AiSignal } from '@/shared/lib/mock-data';

type IChartApi = Awaited<
  ReturnType<(typeof import('lightweight-charts'))['createChart']>
>;

const OHLCV = generateOHLCVData('samsung');

function ConfidenceBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  );
}

export function AiSignals() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  const scrollToDate = useCallback((date: string) => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().scrollToPosition(0, false);
    chartRef.current.timeScale().setVisibleRange({
      from: date as Time,
      to: date as Time,
    });
    // 해당 날짜 전후 10 bar 보이게
    const idx = OHLCV.findIndex((d) => d.time === date);
    if (idx >= 0) {
      const fromDate = OHLCV[Math.max(0, idx - 10)]?.time as Time;
      const toDate = OHLCV[Math.min(OHLCV.length - 1, idx + 10)]?.time as Time;
      if (fromDate && toDate) {
        chartRef.current.timeScale().setVisibleRange({ from: fromDate, to: toDate });
      }
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    let cleanup: (() => void) | undefined;

    void import('lightweight-charts').then(({ createChart, CandlestickSeries, createSeriesMarkers }) => {
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
        rightPriceScale: { borderColor: 'hsl(217.2 32.6% 17.5%)' },
        timeScale: {
          borderColor: 'hsl(217.2 32.6% 17.5%)',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
        width: container.clientWidth,
        height: container.clientHeight || 260,
      });

      chartRef.current = chart;

      const candleSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });

      candleSeries.setData(
        OHLCV.map((d) => ({
          time: d.time as Time,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        }))
      );

      const markersPlugin = createSeriesMarkers(candleSeries, []);
      markersRef.current = markersPlugin;

      markersPlugin.setMarkers(
        MOCK_AI_SIGNALS.map((sig) => ({
          time: sig.date as Time,
          position: sig.type === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
          color: sig.type === 'buy' ? '#22c55e' : '#ef4444',
          shape: sig.type === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
          text: '',
          id: sig.id,
        }))
      );

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener('resize', handleResize);

      cleanup = () => {
        window.removeEventListener('resize', handleResize);
        chart.remove();
        chartRef.current = null;
        markersRef.current = null;
      };
    });

    return () => cleanup?.();
  }, []);

  function handleSignalClick(signal: AiSignal) {
    setSelectedSignalId(signal.id);
    scrollToDate(signal.date);
  }

  return (
    <div className="flex gap-3 h-full min-h-[260px]">
      {/* 차트 영역 */}
      <div className="flex-1 min-w-0">
        <div ref={containerRef} className="w-full h-full min-h-[260px]" aria-label="AI 시그널 캔들스틱 차트" />
      </div>

      {/* 시그널 테이블 */}
      <div className="w-52 shrink-0 flex flex-col gap-1 overflow-y-auto">
        <p className="text-xs font-semibold text-muted-foreground mb-1">시그널 목록</p>
        {MOCK_AI_SIGNALS.map((sig) => (
          <button
            key={sig.id}
            type="button"
            onClick={() => handleSignalClick(sig)}
            className={[
              'text-left rounded-md px-2 py-2 border transition-colors',
              selectedSignalId === sig.id
                ? 'border-primary bg-accent'
                : 'border-border hover:bg-accent/50',
            ].join(' ')}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">{sig.date}</span>
              <span
                className={[
                  'text-xs font-semibold',
                  sig.type === 'buy' ? 'text-emerald-500' : 'text-red-500',
                ].join(' ')}
              >
                {sig.type === 'buy' ? '▲ 매수' : '▼ 매도'}
              </span>
            </div>
            <div className="text-xs text-foreground mb-1">
              {sig.price.toLocaleString('ko-KR')}원
            </div>
            <ConfidenceBar value={sig.confidence} />
          </button>
        ))}
      </div>
    </div>
  );
}
