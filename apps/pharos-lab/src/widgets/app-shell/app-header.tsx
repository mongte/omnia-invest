import { User } from 'lucide-react';
import { MobileNav } from './mobile-nav';

export function AppHeader() {
  return (
    <header className="flex items-center h-14 px-4 border-b border-border bg-card shrink-0 md:hidden">
      <MobileNav />
      <span className="ml-3 text-base font-bold tracking-tight text-foreground md:hidden">
        Pharos Lab
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-full size-8 bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          aria-label="사용자 메뉴"
        >
          <User className="size-4" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
