export type Decision = 'BUY_MORE' | 'HOLD' | 'SELL_PARTIAL';

export interface DecisionInput {
  pharosScore: number | null;
  profitRate: number;
  ma20Position: 'above' | 'below' | 'unknown';
  holdingDays: number;
}

export interface DecisionResult {
  decision: Decision;
  reason: string;
  color: 'green' | 'blue' | 'red' | 'gray';
  lowConfidence: boolean;
}

const PHAROS_STRONG = 65;
const PHAROS_WEAK = 40;
const PROFIT_DIPS_THRESHOLD = -5;
const PROFIT_LOSS_THRESHOLD = -10;
const PROFIT_TAKE_LONG = 10;
const PROFIT_TAKE_SHORT = 15;
const LONG_HELD_DAYS = 30;

export function getDecision(params: DecisionInput): DecisionResult {
  const { pharosScore, profitRate, ma20Position, holdingDays } = params;

  const lowConfidence = pharosScore == null || ma20Position === 'unknown';

  if (pharosScore == null || isNaN(pharosScore)) {
    return {
      decision: 'HOLD',
      reason: 'pharos 스코어 없음 · 판단 불가',
      color: 'gray',
      lowConfidence: true,
    };
  }

  const longHeld = holdingDays >= LONG_HELD_DAYS;

  if (pharosScore >= PHAROS_STRONG && ma20Position === 'above' && profitRate > PROFIT_DIPS_THRESHOLD) {
    return {
      decision: 'BUY_MORE',
      reason: 'pharos 강세 + MA 상단 유지',
      color: 'green',
      lowConfidence,
    };
  }

  if (pharosScore >= PHAROS_STRONG && ma20Position === 'below' && profitRate < PROFIT_DIPS_THRESHOLD) {
    return {
      decision: 'BUY_MORE',
      reason: 'pharos 강세 · 단기 조정 구간',
      color: 'blue',
      lowConfidence,
    };
  }

  if (pharosScore < PHAROS_WEAK && profitRate > (longHeld ? PROFIT_TAKE_LONG : PROFIT_TAKE_SHORT)) {
    return {
      decision: 'SELL_PARTIAL',
      reason: '수익 실현 구간 · pharos 약세',
      color: 'red',
      lowConfidence,
    };
  }

  if (pharosScore < PHAROS_WEAK && profitRate < PROFIT_LOSS_THRESHOLD) {
    return {
      decision: 'SELL_PARTIAL',
      reason: 'pharos 약세 · 손실 확대 구간',
      color: 'red',
      lowConfidence,
    };
  }

  return {
    decision: 'HOLD',
    reason: '뚜렷한 신호 없음 · 보유 유지',
    color: 'gray',
    lowConfidence,
  };
}

export const DECISION_LABEL: Record<Decision, string> = {
  BUY_MORE: '긍정 신호',
  HOLD: '보유 유지',
  SELL_PARTIAL: '분할매도 참고',
};

export const DECISION_BADGE_CLASS: Record<Decision, string> = {
  BUY_MORE: 'bg-green-500/20 text-green-400 border-green-500/30',
  HOLD: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  SELL_PARTIAL: 'bg-red-500/20 text-red-400 border-red-500/30',
};
