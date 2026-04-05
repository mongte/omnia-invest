import Link from 'next/link';
import { User } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { NAV_LINKS } from './nav-links';

interface AppSidebarProps {
  pathname: string;
}

export function AppSidebar({ pathname }: AppSidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card h-full">
      <div className="flex items-center h-14 px-4 border-b border-border">
        <span className="text-lg font-bold tracking-tight text-foreground">
          Pharos Lab
        </span>
      </div>
      <nav className="flex flex-col gap-1 p-3 flex-1">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
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
      <div className="border-t border-border p-3">
        <button
          type="button"
          className="flex items-center gap-3 w-full rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label="사용자 메뉴"
        >
          <span className="inline-flex items-center justify-center rounded-full size-6 bg-secondary shrink-0">
            <User className="size-3.5" aria-hidden="true" />
          </span>
          <span>사용자</span>
        </button>
      </div>
    </aside>
  );
}
