import { describe, it, expect } from 'vitest';
import { computeSize } from './sizing.js';
import type { FillEvent } from '@belivemeguys/exchange';

const fill = (over: Partial<FillEvent> = {}): FillEvent => ({
  externalId: 'f1',
  symbol: 'BTCUSD',
  side: 'BUY',
  qty: 10,
  price: 100,
  reduceOnly: false,
  timestamp: new Date(),
  ...over,
});

const base = {
  fill: fill(),
  sizingMode: 'PROPORTIONAL' as const,
  sizingValue: 1,
  leaderEquityUsd: 1000,
  followerEquityUsd: 500,
  maxPositionUsd: null,
  copyReverse: false,
};

describe('computeSize', () => {
  it('PROPORTIONAL scales by equity ratio', () => {
    const r = computeSize(base);
    expect(r.side).toBe('BUY');
    expect(r.qty).toBeCloseTo(5); // 10 * (500/1000) * 1
  });

  it('PROPORTIONAL applies the sizing multiplier', () => {
    expect(computeSize({ ...base, sizingValue: 2 }).qty).toBeCloseTo(10);
  });

  it('PROPORTIONAL skips when leader equity is unknown', () => {
    const r = computeSize({ ...base, leaderEquityUsd: 0 });
    expect(r.qty).toBe(0);
    expect(r.reason).toMatch(/leader equity/);
  });

  it('MULTIPLIER copies leader qty times value', () => {
    expect(computeSize({ ...base, sizingMode: 'MULTIPLIER', sizingValue: 0.5 }).qty).toBeCloseTo(5);
  });

  it('converts contract-quantity fills to base units via contractMultiplier', () => {
    // Delta-style fill: 10 contracts × 0.001 BTC each → 0.01 BTC base units.
    const r = computeSize({
      ...base,
      sizingMode: 'MULTIPLIER',
      sizingValue: 1,
      fill: fill({ qty: 10, contractMultiplier: 0.001 }),
    });
    expect(r.qty).toBeCloseTo(0.01);
  });

  it('FIXED_MARGIN sizes by notional / price', () => {
    expect(computeSize({ ...base, sizingMode: 'FIXED_MARGIN', sizingValue: 250 }).qty).toBeCloseTo(2.5);
  });

  it('clamps to maxPositionUsd', () => {
    // proportional wants 5 @ price 100 = $500 notional; cap at $200 → 2
    const r = computeSize({ ...base, maxPositionUsd: 200 });
    expect(r.qty).toBeCloseTo(2);
  });

  it('reverses side when copyReverse is set', () => {
    expect(computeSize({ ...base, copyReverse: true }).side).toBe('SELL');
    expect(computeSize({ ...base, fill: fill({ side: 'SELL' }), copyReverse: true }).side).toBe('BUY');
  });

  it('propagates reduceOnly from the leader fill', () => {
    expect(computeSize({ ...base, fill: fill({ reduceOnly: true }) }).reduceOnly).toBe(true);
  });

  it('returns zero size for a non-positive computed quantity', () => {
    const r = computeSize({ ...base, followerEquityUsd: 0 });
    expect(r.qty).toBe(0);
    expect(r.reason).toBeDefined();
  });
});
