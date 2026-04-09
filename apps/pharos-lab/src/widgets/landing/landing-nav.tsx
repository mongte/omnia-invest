import Link from 'next/link';
import { Button } from '@/shared/ui/button';
import { BarChart3 } from 'lucide-react';

export function LandingNav() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary">
            <BarChart3 className="size-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Pharos Lab
          </span>
          <span className="border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full">
            Beta
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            기능
          </a>
          <a
            href="#data"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            데이터
          </a>
          <a
            href="#preview"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            미리보기
          </a>
        </nav>

        <Button asChild size="sm">
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
      </div>
    </header>
  );
}
