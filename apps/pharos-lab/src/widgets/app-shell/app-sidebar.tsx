'use client';

import Link from 'next/link';
import { User, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { NAV_LINKS } from './nav-links';

interface AppSidebarProps {
  pathname: string;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ pathname, isCollapsed, onToggle }: AppSidebarProps) {
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
        <div className={cn('flex border-b border-border', isCollapsed ? 'justify-center' : 'justify-end')}>
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
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');

            const linkEl = (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center rounded-md py-2 text-sm font-medium transition-colors',
                  isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
                aria-label={isCollapsed ? label : undefined}
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                <span
                  className={cn(
                    'transition-opacity duration-150 overflow-hidden whitespace-nowrap',
                    isCollapsed
                      ? 'opacity-0 w-0 pointer-events-none'
                      : 'opacity-100 delay-150'
                  )}
                >
                  {label}
                </span>
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkEl;
          })}
        </nav>

        {/* 하단 영역 */}
        <div className="border-t border-border p-3 flex flex-col gap-1">
          {/* 사용자 버튼 */}
          <button
            type="button"
            className={cn(
              'flex items-center rounded-md py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full',
              isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'
            )}
            aria-label="사용자 메뉴"
          >
            <span className="inline-flex items-center justify-center rounded-full size-6 bg-secondary shrink-0">
              <User className="size-3.5" aria-hidden="true" />
            </span>
            <span
              className={cn(
                'transition-opacity duration-150 overflow-hidden whitespace-nowrap',
                isCollapsed
                  ? 'opacity-0 w-0 pointer-events-none'
                  : 'opacity-100 delay-150'
              )}
            >
              사용자
            </span>
          </button>

        </div>
      </aside>
    </TooltipProvider>
  );
}
