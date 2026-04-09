'use client';

import { cn } from '@/shared/lib/utils';

interface MarketTabItem {
  label: string;
  value: string;
  disabled?: boolean;
}

const MARKET_TABS: MarketTabItem[] = [
  { label: '한국', value: 'korea' },
  { label: '외국', value: 'foreign', disabled: true },
];

export function MarketTab() {
  const activeValue = 'korea';

  return (
    <div className="flex h-10 items-end gap-1 border-b border-border px-4 md:px-6 shrink-0">
      {MARKET_TABS.map(({ label, value, disabled }) => {
        const isActive = value === activeValue && !disabled;

        if (disabled) {
          return (
            <div
              key={value}
              className="relative flex items-center gap-1.5 px-3 pb-2 text-sm font-medium opacity-50 cursor-not-allowed text-muted-foreground"
              aria-disabled="true"
            >
              <span>{label}</span>
              <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground leading-none">
                Soon
              </span>
            </div>
          );
        }

        return (
          <button
            key={value}
            type="button"
            className={cn(
              'relative flex items-center px-3 pb-2 text-sm font-medium transition-colors',
              isActive
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-t-full'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
