import type { FillEvent, Side } from '@mirrorpip/exchange';

export interface SizingInput {
  fill: FillEvent;
  sizingMode: 'PROPORTIONAL' | 'FIXED_MARGIN' | 'MULTIPLIER';
  sizingValue: number;
  leaderEquityUsd: number;
  followerEquityUsd: number;
  maxPositionUsd: number | null;
  copyReverse: boolean;
}

export interface SizingResult {
  side: Side;
  qty: number; // pre-rounding; adapter floors to venue lot
  reduceOnly: boolean;
  reason?: string; // set when qty is 0 (skip)
}

/**
 * Pure sizing: translate a leader fill into a follower order size. Venue lot
 * rounding happens in the adapter; here we only compute the intended quantity.
 */
export function computeSize(input: SizingInput): SizingResult {
  const { fill, sizingMode, sizingValue, leaderEquityUsd, followerEquityUsd, maxPositionUsd, copyReverse } = input;

  const side: Side = copyReverse ? (fill.side === 'BUY' ? 'SELL' : 'BUY') : fill.side;
  const price = fill.price > 0 ? fill.price : 0;

  let qty = 0;
  switch (sizingMode) {
    case 'MULTIPLIER':
      qty = fill.qty * sizingValue;
      break;
    case 'FIXED_MARGIN':
      // Spend ~sizingValue USD of notional per leader entry.
      qty = price > 0 ? (sizingValue / price) : 0;
      break;
    case 'PROPORTIONAL':
    default:
      if (leaderEquityUsd <= 0) return { side, qty: 0, reduceOnly: fill.reduceOnly, reason: 'leader equity unknown' };
      qty = fill.qty * (followerEquityUsd / leaderEquityUsd) * sizingValue;
      break;
  }

  // Clamp by max position notional.
  if (maxPositionUsd != null && price > 0) {
    const maxQty = maxPositionUsd / price;
    if (qty > maxQty) qty = maxQty;
  }

  if (!Number.isFinite(qty) || qty <= 0) {
    return { side, qty: 0, reduceOnly: fill.reduceOnly, reason: 'computed size <= 0' };
  }

  return { side, qty, reduceOnly: fill.reduceOnly };
}
