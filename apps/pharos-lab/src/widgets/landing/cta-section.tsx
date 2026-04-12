import { LinkButton } from '@/shared/ui/link-button';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="relative overflow-hidden py-24">
      {/* 배경 그라디언트 */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background" />

      {/* 장식 원형 */}
      <div className="pointer-events-none absolute -top-20 left-1/2 size-[400px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
          <Sparkles className="size-3.5" />
          <span>무료로 시작하세요</span>
        </div>

        <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
          지금 바로 퀀트 분석을
          <br />
          <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
            시작하세요
          </span>
        </h2>

        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
          데이터 기반의 투자 결정. 코스피 Top200 종목의 퀀트 스코어를 지금
          바로 확인하세요.
        </p>

        <LinkButton href="/dashboard" size="lg" className="min-h-[48px] px-10 text-base">
          대시보드 시작하기
          <ArrowRight className="ml-2 size-5" />
        </LinkButton>
      </div>
    </section>
  );
}
