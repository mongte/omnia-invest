'use client';

import { useEffect, useRef, useState } from 'react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  description: string;
}

const STATS: StatItem[] = [
  {
    value: 50,
    suffix: '+',
    label: '분석 종목',
    description: '코스피 Top50 종목',
  },
  {
    value: 12500,
    suffix: '+',
    label: '일봉 데이터',
    description: 'OHLCV 누적 건수',
  },
  {
    value: 600,
    suffix: '+',
    label: '공시 데이터',
    description: 'OpenDART 수집',
  },
  {
    value: 2,
    suffix: '회',
    label: '일일 갱신',
    description: '자동 데이터 업데이트',
  },
];

interface CountUpNumberProps {
  target: number;
  suffix: string;
  isVisible: boolean;
}

function CountUpNumber({ target, suffix, isVisible }: CountUpNumberProps) {
  const [current, setCurrent] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isVisible || hasAnimated.current) return;
    hasAnimated.current = true;

    const duration = 1500;
    const startTime = performance.now();

    function easeOutQuad(t: number): number {
      return t * (2 - t);
    }

    function step(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuad(progress);
      const value = Math.floor(easedProgress * target);
      setCurrent(value);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    }

    requestAnimationFrame(step);
  }, [isVisible, target]);

  return (
    <span>
      {current.toLocaleString('ko-KR')}
      {suffix}
    </span>
  );
}

export function DataStatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <section
      id="data"
      ref={sectionRef}
      className="border-y border-border/40 bg-secondary/20 py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* 섹션 헤더 */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            실제 데이터로 구동됩니다
          </h2>
          <p className="text-lg text-muted-foreground">
            매일 자동 수집되는 실제 시장 데이터를 기반으로 분석합니다.
          </p>
        </div>

        {/* 통계 그리드 */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="mb-2 text-4xl font-bold tabular-nums text-primary sm:text-5xl">
                <CountUpNumber
                  target={stat.value}
                  suffix={stat.suffix}
                  isVisible={isVisible}
                />
              </div>
              <div className="mb-1 text-base font-semibold text-foreground">
                {stat.label}
              </div>
              <div className="text-sm text-muted-foreground">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
