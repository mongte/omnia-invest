'use client';

import { Card } from '@/shared/ui';

interface AccountSummaryCard {
  label: string;
  value: string;
  sub?: string;
  subColor?: 'green' | 'red' | 'muted';
}

const CARDS: AccountSummaryCard[] = [
  {
    label: '총자산',
    value: '112,450,000원',
    sub: '+12,450,000원',
    subColor: 'green',
  },
  {
    label: '현금',
    value: '45,230,000원',
    sub: '투자 가능 금액',
    subColor: 'muted',
  },
  {
    label: '수익률',
    value: '+12.45%',
    sub: '평가손익 +12,450,000원',
    subColor: 'green',
  },
];

const SUB_COLOR_CLASS: Record<NonNullable<AccountSummaryCard['subColor']>, string> = {
  green: 'text-emerald-500',
  red: 'text-red-500',
  muted: 'text-muted-foreground',
};

export function AccountSummary() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {CARDS.map((card) => (
        <Card key={card.label} className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{card.label}</p>
          <p
            className={[
              'text-xl font-bold tracking-tight',
              card.label === '수익률' ? 'text-emerald-500' : 'text-foreground',
            ].join(' ')}
          >
            {card.value}
          </p>
          {card.sub && (
            <p className={['text-xs mt-1', SUB_COLOR_CLASS[card.subColor ?? 'muted']].join(' ')}>
              {card.sub}
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}
