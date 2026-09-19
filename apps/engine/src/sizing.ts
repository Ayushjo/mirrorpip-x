import type { FillEvent, Side } from '@belivemeguys/exchange';

export interface SizingInput {
  fill: FillEvent;
  sizingMode: 'PROPORTIONAL' | 'FIXED_MARGIN' | 'MULTIPLIER';
  sizingValue: number;
  leaderEquityUsd: number;
  followerEquityUsd: number;
  maxPositionUsd: number | null;
  copyReverse: boolean;
  /** Base units per leader qty unit (Delta contract_value, 1 for base-unit venues). */
  leaderContractMultiplier?: number;
}

export interface SizingResult {
  side: Side;
  /** Intended quantity in BASE-ASSET units (BTC, ETH, …). The caller divides by
   * the follower venue's contract multiplier to get its order quantity. */
  qty: number;
  reduceOnly: boolean;
  reason?: string; // set when qty is 0 (skip)
}

/**
 * Pure sizing: translate a leader fill into a follower order size expressed in
 * base-asset units, so quantities survive cross-venue copies (e.g. Delta's
 * 0.001-BTC contracts → a base-unit venue) without unit mismatches.
 */
export function computeSize(input: SizingInput): SizingResult {
  const { fill, sizingMode, sizingValue, leaderEquityUsd, followerEquityUsd, maxPositionUsd, copyReverse } = input;
  const leaderMult = fill.contractMultiplier ?? input.leaderContractMultiplier ?? 1;

  const side: Side = copyReverse ? (fill.side === 'BUY' ? 'SELL' : 'BUY') : fill.side;
  const price = fill.price > 0 ? fill.price : 0;

  let qty = 0; // base units
  switch (sizingMode) {
    case 'MULTIPLIER':
      qty = fill.qty * leaderMult * sizingValue;
      break;
    case 'FIXED_MARGIN':
      // Spend ~sizingValue USD of notional per leader entry.
      qty = price > 0 ? sizingValue / price : 0;
      break;
    case 'PROPORTIONAL':
    default:
      if (leaderEquityUsd <= 0) return { side, qty: 0, reduceOnly: fill.reduceOnly, reason: 'leader equity unknown' };
      qty = fill.qty * leaderMult * (followerEquityUsd / leaderEquityUsd) * sizingValue;
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
