'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { UserMenu } from '@/features/auth/ui/user-menu';
import { NAV_LINKS } from './nav-links';

interface AppSidebarProps {
  pathname: string;
  isCollapsed: boolean;
  onToggle: () => void;
  onAuthGatedClick: (href: string) => void;
}

export function AppSidebar({
  pathname,
  isCollapsed,
  onToggle,
  onAuthGatedClick,
}: AppSidebarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending) setPendingHref(null);
  }, [isPending]);

  function handleNavClick(href: string) {
    setPendingHref(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 border-r border-border bg-card h-full transition-all duration-200',
          isCollapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* 로고 영역 */}
        <Link
          href="/"
          className="flex items-center h-14 px-4 border-b border-border overflow-hidden hover:opacity-80 transition-opacity"
          aria-label="랜딩 페이지로 이동"
        >
          <span className="text-lg font-bold tracking-tight text-foreground shrink-0">
            P
          </span>
          <span
            className={cn(
              'text-lg font-bold tracking-tight text-foreground transition-opacity duration-150 overflow-hidden whitespace-nowrap',
              isCollapsed
                ? 'opacity-0 w-0 pointer-events-none'
                : 'opacity-100 delay-150'
            )}
          >
            haros Lab
          </span>
        </Link>

        {/* 토글 버튼 */}
        <div
          className={cn(
            'flex border-b border-border',
            isCollapsed ? 'justify-center' : 'justify-end'
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center justify-center p-2 m-1 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label={isCollapsed ? '사이드바 펼치기' : '사이드바 접기'}
          >
            {isCollapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex flex-col gap-1 p-3 flex-1">
          {NAV_LINKS.map(
            ({ href, label, icon: Icon, disabled, authRequired }) => {
              const isActive =
                !disabled &&
                !authRequired &&
                (pathname === href || pathname.startsWith(href + '/'));
              const isAuthActive =
                authRequired &&
                (pathname === href || pathname.startsWith(href + '/'));

              const isNavigating = pendingHref === href;

              const itemContent = (
                <>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span
                    className={cn(
                      'transition-opacity duration-150 overflow-hidden whitespace-nowrap flex-1',
                      isCollapsed
                        ? 'opacity-0 w-0 pointer-events-none'
                        : 'opacity-100 delay-150'
                    )}
                  >
                    {label}
                  </span>
                  {!isCollapsed && disabled && (
                    <span className="text-xs text-muted-foreground/60 font-normal shrink-0">
                      준비중
                    </span>
                  )}
                </>
              );

              const itemClassName = cn(
                'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
                isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                disabled
                  ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                  : isActive || isAuthActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              );

              let linkEl: React.ReactNode;

              if (disabled) {
                linkEl = (
                  <div
                    key={href}
                    className={itemClassName}
                    aria-label={isCollapsed ? label : undefined}
                    aria-disabled="true"
                  >
                    {itemContent}
                  </div>
                );
              } else if (authRequired) {
                linkEl = (
                  <button
                    key={href}
                    type="button"
                    className={cn(itemClassName, 'w-full text-left')}
                    aria-label={isCollapsed ? label : undefined}
                    onClick={() => onAuthGatedClick(href)}
                  >
                    {itemContent}
                  </button>
                );
              } else {
                linkEl = (
                  <button
                    key={href}
                    type="button"
                    className={cn(itemClassName, 'w-full text-left relative')}
                    aria-label={isCollapsed ? label : undefined}
                    disabled={isPending}
                    onClick={() => handleNavClick(href)}
                  >
                    {itemContent}
                    {isNavigating && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-md bg-accent/80">
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              }

              if (isCollapsed) {
                return (
                  <Tooltip key={href}>
                    <TooltipTrigger asChild>
                      <div>{linkEl}</div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {label}
                      {disabled && ' (준비중)'}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkEl;
            }
          )}
        </nav>

        {/* 하단 사용자 영역 */}
        <div className="border-t border-border p-3 flex flex-col gap-1">
          <div
            className={cn(
              'flex items-center rounded-md py-2',
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            )}
          >
            <UserMenu />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
