import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { ArrowRight, TrendingUp, Zap, Database } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] items-center overflow-hidden">
      {/* 배경 그라디언트 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />

      {/* 그리드 패턴 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--foreground)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* 빛나는 원형 장식 */}
      <div className="pointer-events-none absolute -top-40 -right-40 size-[600px] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 size-[400px] rounded-full bg-primary/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="size-3.5" />
            <span>퀀트 기반 투자 분석 플랫폼</span>
          </div>

          {/* 메인 헤드라인 */}
          <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            데이터로 만드는
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              스마트한 투자 결정
            </span>
          </h1>

          {/* 서브 헤드라인 */}
          <p className="mb-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
            코스피 Top200 종목의 퀀트 스코어링부터 가상 투자까지.
            <br className="hidden sm:block" />
            증권사 API 기반 실시간 데이터로 체계적 분석 도구를 경험하세요.
          </p>

          {/* 기능 요약 태그 */}
          <div className="mb-10 flex flex-wrap justify-center gap-3">
            {[
              { icon: TrendingUp, label: '종목 스코어링' },
              { icon: Database, label: '실시간 데이터' },
              { icon: Zap, label: '가상 투자' },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground"
              >
                <Icon className="size-3.5" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* CTA 버튼 */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" className="min-h-[44px] w-full sm:w-auto px-8">
              <Link href="/dashboard">
                대시보드 시작하기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] w-full sm:w-auto"
            >
              <a href="#features">기능 살펴보기</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
