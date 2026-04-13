import { describe, it, expect } from 'vitest';
import { getDecision } from './decision-algorithm';

describe('getDecision', () => {
  // BUY_MORE cases
  it('pharos >= 65 + MA 위 + 수익 > -5 → BUY_MORE (green)', () => {
    const result = getDecision({
      pharosScore: 70,
      profitRate: 5,
      ma20Position: 'above',
      holdingDays: 10,
    });
    expect(result.decision).toBe('BUY_MORE');
    expect(result.color).toBe('green');
    expect(result.lowConfidence).toBe(false);
  });

  it('pharos >= 65 + MA 아래 + 손실 < -5 → BUY_MORE (blue, 단기 조정)', () => {
    const result = getDecision({
      pharosScore: 80,
      profitRate: -8,
      ma20Position: 'below',
      holdingDays: 5,
    });
    expect(result.decision).toBe('BUY_MORE');
    expect(result.color).toBe('blue');
  });

  // SELL_PARTIAL cases
  it('pharos < 40 + 수익 > 15% (단기) → SELL_PARTIAL', () => {
    const result = getDecision({
      pharosScore: 30,
      profitRate: 20,
      ma20Position: 'above',
      holdingDays: 10,
    });
    expect(result.decision).toBe('SELL_PARTIAL');
    expect(result.color).toBe('red');
  });

  it('pharos < 40 + 수익 > 10% (장기 30일+) → SELL_PARTIAL', () => {
    const result = getDecision({
      pharosScore: 35,
      profitRate: 12,
      ma20Position: 'above',
      holdingDays: 45,
    });
    expect(result.decision).toBe('SELL_PARTIAL');
  });

  it('pharos < 40 + 손실 < -10% → SELL_PARTIAL', () => {
    const result = getDecision({
      pharosScore: 20,
      profitRate: -15,
      ma20Position: 'below',
      holdingDays: 20,
    });
    expect(result.decision).toBe('SELL_PARTIAL');
  });

  // HOLD case
  it('중간 신호 (pharos 50, 소폭 수익) → HOLD', () => {
    const result = getDecision({
      pharosScore: 50,
      profitRate: 3,
      ma20Position: 'above',
      holdingDays: 15,
    });
    expect(result.decision).toBe('HOLD');
    expect(result.color).toBe('gray');
  });

  // Edge cases
  it('pharosScore null → HOLD + lowConfidence true', () => {
    const result = getDecision({
      pharosScore: null,
      profitRate: 10,
      ma20Position: 'above',
      holdingDays: 20,
    });
    expect(result.decision).toBe('HOLD');
    expect(result.lowConfidence).toBe(true);
  });

  it('ma20Position unknown → lowConfidence true', () => {
    const result = getDecision({
      pharosScore: 70,
      profitRate: 5,
      ma20Position: 'unknown',
      holdingDays: 10,
    });
    expect(result.lowConfidence).toBe(true);
  });
});
