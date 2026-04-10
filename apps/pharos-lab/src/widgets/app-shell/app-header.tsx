import Link from 'next/link';
import { MobileNav } from './mobile-nav';
import { UserMenu } from '@/features/auth/ui/user-menu';

export function AppHeader() {
  return (
    <>
      {/* 모바일 헤더 */}
      <header className="flex items-center h-14 px-4 border-b border-border bg-card shrink-0 md:hidden">
        <MobileNav />
        <Link
          href="/"
          className="ml-3 text-base font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          aria-label="랜딩 페이지로 이동"
        >
          Pharos Lab
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <UserMenu />
        </div>
      </header>

      {/* 데스크탑 상단 바 */}
      <header className="hidden md:flex items-center h-12 px-4 border-b border-border bg-card shrink-0 justify-end">
        <UserMenu />
      </header>
    </>
  );
}
