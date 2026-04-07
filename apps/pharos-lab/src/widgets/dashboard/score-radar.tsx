'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import type { StockScore } from '@/entities/stock';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';

interface ScoreRadarStock {
  name: string;
  score: StockScore;
  scoreDescriptions?: string[] | null;
}

interface ScoreRadarProps {
  stock: ScoreRadarStock;
}

const SCORE_LABELS: Record<keyof Omit<StockScore, 'total'>, string> = {
  fundamental: '펀더멘털',
  momentum: '모멘텀',
  disclosure: '공시활동',
  institutional: '기관관심',
};

type SignalValue =
  | 'strong_buy'
  | 'buy'
  | 'hold'
  | 'sell'
  | 'sell_wait'
  | 'strong_sell';

interface SignalActionConfig {
  label: string;
  className: string;
}

interface SignalConfig {
  noPosition: SignalActionConfig;
  withPosition: SignalActionConfig;
}

const SIGNAL_CONFIG: Record<SignalValue, SignalConfig> = {
  strong_buy: {
    noPosition: { label: '강력 매수', className: 'bg-emerald-600 text-white' },
    withPosition: { label: '보유', className: 'bg-blue-500 text-white' },
  },
  buy: {
    noPosition: { label: '매수', className: 'bg-green-500 text-white' },
    withPosition: { label: '보유', className: 'bg-blue-500 text-white' },
  },
  hold: {
    noPosition: { label: '관망', className: 'bg-muted text-muted-foreground' },
    withPosition: { label: '보유', className: 'bg-blue-500 text-white' },
  },
  sell_wait: {
    noPosition: { label: '관망', className: 'bg-muted text-muted-foreground' },
    withPosition: { label: '매도', className: 'bg-orange-500 text-white' },
  },
  sell: {
    noPosition: { label: '관망', className: 'bg-muted text-muted-foreground' },
    withPosition: { label: '매도', className: 'bg-orange-500 text-white' },
  },
  strong_sell: {
    noPosition: { label: '관망', className: 'bg-muted text-muted-foreground' },
    withPosition: { label: '강력 매도', className: 'bg-red-600 text-white' },
  },
};

interface DescriptionField {
  label: string;
  value: string;
  subtitle: string | null;
  isSignal: boolean;
}

interface Interpretation {
  text: string;
  color: 'green' | 'red' | 'muted';
}

const INTERPRET_STYLES: Record<Interpretation['color'], string> = {
  green: 'bg-green-500/15 text-green-600 dark:text-green-400',
  red: 'bg-red-500/15 text-red-600 dark:text-red-400',
  muted: 'bg-muted text-muted-foreground',
};

function interpretValue(label: string, value: string): Interpretation | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;

  if (label === '팩터') {
    if (num >= 60) return { text: '양호', color: 'green' };
    if (num >= 30) return { text: '보통', color: 'muted' };
    return { text: '약함', color: 'red' };
  }

  if (label === '타이밍') {
    const clamped = Math.min(Math.max(num, 0), 100);
    if (clamped >= 60) return { text: '매수 타이밍', color: 'green' };
    if (clamped >= 40) return { text: '중립', color: 'muted' };
    return { text: '매도 타이밍', color: 'red' };
  }

  if (label === 'ML확률') {
    if (num >= 0.65) return { text: '강한 상승', color: 'green' };
    if (num >= 0.55) return { text: '상승 예측', color: 'green' };
    if (num >= 0.45) return { text: '중립', color: 'muted' };
    if (num >= 0.35) return { text: '하락 예측', color: 'red' };
    return { text: '강한 하락', color: 'red' };
  }

  return null;
}

const FIELD_SUBTITLE: Record<string, string> = {
  팩터: '밸류에이션 + 수익성 기반 펀더멘털 점수',
  타이밍: 'RSI·MACD·볼린저밴드 기반 기술적 타이밍',
  ML확률: 'AI 예측 향후 5일 상승 확률',
};

function isSignalValue(value: string): value is SignalValue {
  return value in SIGNAL_CONFIG;
}

function parseDescriptions(descriptions: string[]): DescriptionField[] {
  return descriptions.map((desc) => {
    const colonIndex = desc.indexOf(':');
    if (colonIndex === -1) {
      return { label: desc, value: '', subtitle: null, isSignal: false };
    }
    const label = desc.slice(0, colonIndex).trim();
    const value = desc.slice(colonIndex + 1).trim();
    const isSignal = label === '시그널' && isSignalValue(value);
    const subtitle = FIELD_SUBTITLE[label] ?? null;
    return { label, value, subtitle, isSignal };
  });
}

function SignalBadge({ value }: { value: string }) {
  if (!isSignalValue(value)) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
        {value}
      </span>
    );
  }
  const config = SIGNAL_CONFIG[value];
  return (
    <div className="flex items-center gap-1">
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full cursor-default ${config.noPosition.className}`}
            >
              {config.noPosition.label}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>비보유시</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full cursor-default ${config.withPosition.className}`}
            >
              {config.withPosition.label}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>보유시</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}

export function ScoreRadar({ stock }: ScoreRadarProps) {
  const data = [
    { subject: '펀더멘털', value: stock.score.fundamental, fullMark: 100 },
    { subject: '모멘텀', value: stock.score.momentum, fullMark: 100 },
    { subject: '공시활동', value: stock.score.disclosure, fullMark: 100 },
    { subject: '기관관심', value: stock.score.institutional, fullMark: 100 },
  ];

  const parsedDescriptions = parseDescriptions(stock.scoreDescriptions ?? []);

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-3 h-full">
        <div className="w-full">
          <ResponsiveContainer width="100%" height={180}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              />
              <Radar
                name={stock.name}
                dataKey="value"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.25}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {(
            Object.keys(SCORE_LABELS) as Array<
              keyof typeof SCORE_LABELS
            >
          ).map((key) => (
            <div key={key} className="flex items-center justify-between px-2 py-1 rounded bg-muted/50">
              <span className="text-xs text-muted-foreground">
                {SCORE_LABELS[key]}
              </span>
              <span className="text-xs font-semibold text-foreground">
                {stock.score[key]}
              </span>
            </div>
          ))}
        </div>

        {parsedDescriptions.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1">
            {parsedDescriptions.map((field, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-2.5 py-2 rounded-md bg-muted/60 border border-border/50"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">{field.label}</span>
                  {field.subtitle && (
                    <span className="text-[10px] text-muted-foreground/60 leading-tight">
                      {field.subtitle}
                    </span>
                  )}
                </div>
                {field.value && (
                  field.isSignal ? (
                    <SignalBadge value={field.value} />
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {(() => {
                        const interp = interpretValue(field.label, field.value);
                        return interp ? (
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${INTERPRET_STYLES[interp.color]}`}>
                            {interp.text}
                          </span>
                        ) : null;
                      })()}
                      <span className="text-xs font-semibold text-foreground tabular-nums">
                        {field.value}
                      </span>
                    </div>
                  )
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
