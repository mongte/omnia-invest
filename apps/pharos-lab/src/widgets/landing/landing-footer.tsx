import Link from 'next/link';
import { BarChart3 } from 'lucide-react';

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary">
              <BarChart3 className="size-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">
              Pharos Lab
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              대시보드
            </Link>
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              기능 소개
            </a>
            <a
              href="#data"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              데이터 현황
            </a>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              © {currentYear} Pharos Lab. 퀀트 기반 투자 분석 플랫폼.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/50">
              본 서비스는 투자 참고 정보 제공이 목적이며, 특정 종목의 매수·매도를 권유하지 않습니다.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
