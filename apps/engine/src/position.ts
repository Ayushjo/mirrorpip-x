// Pure position math — no DB, so it can be unit-tested. Given the current net
// position for a symbol and an incoming fill, compute the new position and any
// realized P&L booked on the closed quantity. This is money-path logic; keep it
// pure and covered.

export type Dir = 'LONG' | 'SHORT';

export interface PosState {
  side: Dir;
  qty: number; // always positive
  avgEntry: number;
}

export interface FillResult {
  side: Dir;
  qty: number; // always positive; 0 = flat
  avgEntry: number;
  realizedDelta: number; // P&L realized by this fill (on the reduced quantity)
  closed: boolean; // true when the position went flat
}

/**
 * Apply a fill to a position.
 * - Same direction (or flat): add, weighted-average the entry, no realized P&L.
 * - Opposite direction: reduce/close/flip, realize P&L on the closed quantity.
 */
export function applyFill(
  current: PosState | null,
  side: 'BUY' | 'SELL',
  qty: number,
  price: number,
): FillResult {
  const signed = side === 'BUY' ? qty : -qty;

  if (!current || current.qty === 0) {
    return {
      side: signed >= 0 ? 'LONG' : 'SHORT',
      qty: Math.abs(signed),
      avgEntry: price,
      realizedDelta: 0,
      closed: false,
    };
  }

  const curSigned = current.side === 'LONG' ? current.qty : -current.qty;
  const newSigned = curSigned + signed;
  const avgEntry = current.avgEntry;

  // Same direction → add and weighted-average the entry.
  if (Math.sign(curSigned) === Math.sign(signed)) {
    const totalAbs = Math.abs(curSigned) + Math.abs(signed);
    const newEntry = (avgEntry * Math.abs(curSigned) + price * Math.abs(signed)) / totalAbs;
    return {
      side: newSigned >= 0 ? 'LONG' : 'SHORT',
      qty: Math.abs(newSigned),
      avgEntry: newEntry,
      realizedDelta: 0,
      closed: false,
    };
  }

  // Opposite direction → reduce / close / flip, realizing P&L on the closed qty.
  const closedQty = Math.min(Math.abs(curSigned), Math.abs(signed));
  const realizedDelta = curSigned > 0 ? (price - avgEntry) * closedQty : (avgEntry - price) * closedQty;
  // Entry stays the same while reducing; on a flip the remainder opens at `price`.
  const flipped = Math.sign(newSigned) !== 0 && Math.sign(newSigned) !== Math.sign(curSigned);
  const newEntry = flipped ? price : avgEntry;
  return {
    side: newSigned >= 0 ? 'LONG' : 'SHORT',
    qty: Math.abs(newSigned),
    avgEntry: newEntry,
    realizedDelta,
    closed: newSigned === 0,
  };
}
