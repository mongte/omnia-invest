'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/shared/ui/sheet';
import { cn } from '@/shared/lib/utils';
import { useAuthGate } from '@/features/auth/lib/use-auth-gate';
import { NAV_LINKS } from './nav-links';

export function MobileNav() {
  const pathname = usePathname();
  const { guardedNavigate } = useAuthGate();
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleAuthGatedClick = (href: string) => {
    closeRef.current?.click(); // Sheet 닫기
    guardedNavigate(href);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
          aria-label="메뉴 열기"
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetClose ref={closeRef} className="hidden" />
        <SheetHeader className="h-14 flex-row items-center px-4 border-b border-border">
          <SheetTitle asChild>
            <Link
              href="/"
              className="text-lg font-bold tracking-tight hover:opacity-80 transition-opacity"
              aria-label="랜딩 페이지로 이동"
            >
              Pharos Lab
            </Link>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3">
          {NAV_LINKS.map(({ href, label, icon: Icon, disabled, authRequired }) => {
            const isActive =
              !disabled &&
              !authRequired &&
              (pathname === href || pathname.startsWith(href + '/'));

            if (disabled) {
              return (
                <div
                  key={href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                    'opacity-50 cursor-not-allowed text-muted-foreground'
                  )}
                  aria-disabled="true"
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1">{label}</span>
                  <span className="text-xs text-muted-foreground/60 font-normal">
                    준비중
                  </span>
                </div>
              );
            }

            if (authRequired) {
              return (
                <button
                  key={href}
                  type="button"
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors w-full text-left',
                    pathname === href || pathname.startsWith(href + '/')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  onClick={() => handleAuthGatedClick(href)}
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {label}
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
