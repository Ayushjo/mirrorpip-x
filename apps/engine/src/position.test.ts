import { describe, it, expect } from 'vitest';
import { applyFill } from './position.js';

describe('applyFill', () => {
  it('opens a long from flat', () => {
    const r = applyFill(null, 'BUY', 2, 100);
    expect(r).toMatchObject({ side: 'LONG', qty: 2, avgEntry: 100, realizedDelta: 0, closed: false });
  });

  it('opens a short from flat', () => {
    const r = applyFill(null, 'SELL', 3, 50);
    expect(r).toMatchObject({ side: 'SHORT', qty: 3, avgEntry: 50, closed: false });
  });

  it('adds to a long with weighted-average entry', () => {
    const r = applyFill({ side: 'LONG', qty: 2, avgEntry: 100 }, 'BUY', 2, 200);
    expect(r.side).toBe('LONG');
    expect(r.qty).toBe(4);
    expect(r.avgEntry).toBe(150); // (100*2 + 200*2)/4
    expect(r.realizedDelta).toBe(0);
  });

  it('reduces a long and books realized profit', () => {
    const r = applyFill({ side: 'LONG', qty: 4, avgEntry: 100 }, 'SELL', 1, 120);
    expect(r.side).toBe('LONG');
    expect(r.qty).toBe(3);
    expect(r.avgEntry).toBe(100); // entry unchanged while reducing
    expect(r.realizedDelta).toBe(20); // (120-100)*1
    expect(r.closed).toBe(false);
  });

  it('closes a long exactly flat and realizes P&L', () => {
    const r = applyFill({ side: 'LONG', qty: 2, avgEntry: 100 }, 'SELL', 2, 90);
    expect(r.qty).toBe(0);
    expect(r.closed).toBe(true);
    expect(r.realizedDelta).toBe(-20); // (90-100)*2 loss
  });

  it('reduces a short and books profit when price falls', () => {
    const r = applyFill({ side: 'SHORT', qty: 3, avgEntry: 100 }, 'BUY', 1, 80);
    expect(r.side).toBe('SHORT');
    expect(r.qty).toBe(2);
    expect(r.realizedDelta).toBe(20); // (100-80)*1
  });

  it('flips a long to a short, realizing on the closed part and re-basing entry', () => {
    const r = applyFill({ side: 'LONG', qty: 2, avgEntry: 100 }, 'SELL', 5, 110);
    expect(r.side).toBe('SHORT');
    expect(r.qty).toBe(3); // 5 - 2
    expect(r.avgEntry).toBe(110); // remainder opens at fill price
    expect(r.realizedDelta).toBe(20); // (110-100)*2 on the closed 2
    expect(r.closed).toBe(false);
  });
});
