'use client';

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from 'recharts';
import { HelpCircle } from 'lucide-react';
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

const FIELD_HELP: Record<string, { title: string; description: string; calculation: string }> = {
  시그널: {
    title: '매매 시그널',
    description: '팩터·타이밍·ML확률을 종합하여 산출한 최종 매매 판단입니다.',
    calculation: '비보유 시와 보유 시 행동이 다릅니다. strong_buy~strong_sell 6단계로 나뉩니다.',
  },
  팩터: {
    title: '펀더멘털 팩터 점수',
    description: 'PER, PBR, ROE, 영업이익률 등 밸류에이션과 수익성 지표를 종합한 점수입니다.',
    calculation: '0~100점. 60점 이상 양호, 30~60 보통, 30 미만 약함.',
  },
  타이밍: {
    title: '기술적 타이밍 점수',
    description: 'RSI, MACD, 볼린저밴드 등 기술적 지표로 현재 매수/매도 적기를 판단합니다.',
    calculation: '0~100점. 60 이상 매수 타이밍, 40~60 중립, 40 미만 매도 타이밍.',
  },
  ML확률: {
    title: 'AI 상승 확률',
    description: '머신러닝 모델이 예측한 향후 5거래일 내 주가 상승 확률입니다.',
    calculation: '0~1. 0.65 이상 강한 상승, 0.55~0.65 상승 예측, 0.45~0.55 중립, 0.35 미만 강한 하락.',
  },
};

const GRID_HELP: Record<keyof Omit<StockScore, 'total'>, { title: string; description: string }> = {
  fundamental: {
    title: '펀더멘털',
    description: 'PER·PBR·ROE·영업이익률 기반 가치 평가 종합 점수 (0~100)',
  },
  momentum: {
    title: '모멘텀',
    description: '가격 추세, 거래량 변화, 이동평균선 기반 추세 강도 (0~100)',
  },
  disclosure: {
    title: '공시활동',
    description: '최근 공시 빈도와 호재/악재 비율로 산출한 공시 건전성 점수 (0~100)',
  },
  institutional: {
    title: '기관관심',
    description: '기관·외국인 순매수 추이와 지분율 변동 기반 관심도 점수 (0~100)',
  },
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
            <div key={key} className="flex items-center justify-between px-2.5 py-1.5 rounded bg-muted/50">
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  {SCORE_LABELS[key]}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-56">
                    <div className="space-y-1">
                      <p className="font-medium text-xs">{GRID_HELP[key].title}</p>
                      <p className="text-xs text-muted-foreground">{GRID_HELP[key].description}</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="text-sm font-semibold text-foreground">
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
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">{field.label}</span>
                    {FIELD_HELP[field.label] && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="size-3.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-64">
                          <div className="space-y-1">
                            <p className="font-medium text-sm">{FIELD_HELP[field.label].title}</p>
                            <p className="text-xs text-muted-foreground">{FIELD_HELP[field.label].description}</p>
                            <p className="text-xs text-muted-foreground/80 border-t border-border/50 pt-1">{FIELD_HELP[field.label].calculation}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  {field.subtitle && (
                    <span className="text-xs text-muted-foreground/60 leading-tight">
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
                          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${INTERPRET_STYLES[interp.color]}`}>
                            {interp.text}
                          </span>
                        ) : null;
                      })()}
                      <span className="text-sm font-semibold text-foreground tabular-nums">
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
