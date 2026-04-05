'use client';

import { useEffect, useRef } from 'react';
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type CandlestickData,
  type Time,
  ColorType,
} from 'lightweight-charts';

export interface CandlestickDataPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CandlestickChartProps {
  data?: CandlestickDataPoint[];
  height?: number;
  className?: string;
}

const DEFAULT_DATA: CandlestickDataPoint[] = [
  { time: '2024-01-01', open: 70000, high: 72000, low: 69000, close: 71500 },
  { time: '2024-01-02', open: 71500, high: 73000, low: 70500, close: 72000 },
  { time: '2024-01-03', open: 72000, high: 74000, low: 71000, close: 73500 },
  { time: '2024-01-04', open: 73500, high: 75000, low: 72500, close: 74000 },
  { time: '2024-01-05', open: 74000, high: 74500, low: 71000, close: 72000 },
];

export function CandlestickChart({
  data = DEFAULT_DATA,
  height = 300,
  className,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'hsl(215 20.2% 65.1%)',
      },
      grid: {
        vertLines: { color: 'hsl(217.2 32.6% 17.5%)' },
        horzLines: { color: 'hsl(217.2 32.6% 17.5%)' },
      },
      width: containerRef.current.clientWidth,
      height,
      timeScale: {
        borderColor: 'hsl(217.2 32.6% 17.5%)',
      },
      rightPriceScale: {
        borderColor: 'hsl(217.2 32.6% 17.5%)',
      },
    });

    chartRef.current = chart;

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: 'hsl(142 71% 45%)',
      downColor: 'hsl(0 72% 51%)',
      borderUpColor: 'hsl(142 71% 45%)',
      borderDownColor: 'hsl(0 72% 51%)',
      wickUpColor: 'hsl(142 71% 45%)',
      wickDownColor: 'hsl(0 72% 51%)',
    });

    const chartData: CandlestickData<Time>[] = data.map((d) => ({
      time: d.time as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeries.setData(chartData);
    chart.timeScale().fitContent();

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartRef.current = null;
    };
  }, [data, height]);

  return <div ref={containerRef} className={className} style={{ height }} />;
}
