import { describe, it, expect } from 'vitest';
import { curveStats } from './stats.js';

const p = (equityUsd: number, ageMs: number) => ({ equityUsd, ts: new Date(Date.now() - ageMs) });

describe('curveStats', () => {
  it('returns zeros for fewer than 2 points', () => {
    expect(curveStats([])).toEqual({ roiPct: 0, maxDrawdownPct: 0 });
    expect(curveStats([p(100, 0)])).toEqual({ roiPct: 0, maxDrawdownPct: 0 });
  });

  it('computes first→last ROI', () => {
    const r = curveStats([p(100, 3000), p(150, 0)]);
    expect(r.roiPct).toBeCloseTo(50);
  });

  it('computes max peak-to-trough drawdown', () => {
    // 100 → 120 (peak) → 90 (trough) → 110 : DD = (120-90)/120 = 25%
    const r = curveStats([p(100, 4000), p(120, 3000), p(90, 2000), p(110, 1000)]);
    expect(r.maxDrawdownPct).toBeCloseTo(25);
  });

  it('honours the since window', () => {
    const pts = [p(100, 40 * 24 * 3600 * 1000), p(200, 0)]; // first point 40 days old
    const since = Date.now() - 7 * 24 * 3600 * 1000; // last 7 days only
    const r = curveStats(pts, since); // only the 200 point qualifies → <2 points
    expect(r).toEqual({ roiPct: 0, maxDrawdownPct: 0 });
  });
});
