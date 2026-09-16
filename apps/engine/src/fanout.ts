import { prisma, type Follow, type ExchangeCredential, type Leader } from '@mirrorpip/db';
import { type FillEvent, getExchange } from '@mirrorpip/exchange';
import { toApiCreds } from './creds.js';
import { computeSize } from './sizing.js';
import { isKillSwitchOn } from './killswitch.js';
import { log } from './log.js';

type FollowWithCred = Follow & { credential: ExchangeCredential };

/** Deterministic idempotency key: one copy order per (follow, leader fill). */
function clientOrderId(followId: string, fillExternalId: string): string {
  // Delta client_order_id has a length cap; keep it short but unique.
  return `mpx_${followId.slice(-8)}_${fillExternalId.slice(-16)}`;
}

/**
 * Fan a single leader fill out to every active follower. Persists the LeaderFill
 * (idempotent), then for each active follow computes size, places the order, and
 * records a CopyOrder + updates the CopyPosition. Never throws to the caller —
 * per-follower failures are isolated and recorded on the CopyOrder.
 */
export async function fanoutLeaderFill(leader: Leader, fill: FillEvent): Promise<void> {
  // 1. Persist the leader fill idempotently (unique on leaderId+externalId).
  const leaderFill = await prisma.leaderFill
    .upsert({
      where: { leaderId_externalId: { leaderId: leader.id, externalId: fill.externalId } },
      update: {},
      create: {
        leaderId: leader.id,
        exchange: leader.exchange,
        externalId: fill.externalId,
        symbol: fill.symbol,
        side: fill.side,
        qty: fill.qty,
        price: fill.price,
        reduceOnly: fill.reduceOnly,
        leaderPositionKey: fill.positionKey ?? null,
        exchTs: fill.timestamp,
      },
    })
    .catch((err) => {
      log.error('failed to persist leader fill', { leaderId: leader.id, err: String(err) });
      return null;
    });
  if (!leaderFill) return;

  if (await isKillSwitchOn()) {
    log.warn('kill-switch on — skipping fan-out', { leaderId: leader.id, fill: fill.externalId });
    return;
  }

  // 2. Load active follows for this leader.
  const follows = (await prisma.follow.findMany({
    where: { leaderId: leader.id, status: 'ACTIVE' },
    include: { credential: true },
  })) as FollowWithCred[];
  if (follows.length === 0) return;

  // 3. Leader equity (for proportional sizing) — fetched once.
  const exchange = getExchange(leader.exchange);
  let leaderEquityUsd = 0;
  try {
    const leaderCred = await prisma.exchangeCredential.findUnique({ where: { id: leader.credentialId } });
    if (leaderCred) leaderEquityUsd = (await exchange.getAccount(toApiCreds(leaderCred))).equityUsd;
  } catch (err) {
    log.warn('could not read leader equity; proportional follows may skip', { err: String(err) });
  }

  // 4. Fan out (isolated per follower).
  await Promise.allSettled(
    follows.map((follow) => copyToFollower(follow, leader, leaderFill.id, fill, leaderEquityUsd)),
  );
}

async function copyToFollower(
  follow: FollowWithCred,
  leader: Leader,
  leaderFillId: string,
  fill: FillEvent,
  leaderEquityUsd: number,
): Promise<void> {
  const coid = clientOrderId(follow.id, fill.externalId);

  // Idempotency: bail if we already created a copy order for this pair.
  const existing = await prisma.copyOrder.findUnique({ where: { clientOrderId: coid } });
  if (existing) return;

  const exchange = getExchange(follow.credential.exchange);

  // Daily-loss guard: halt this follow if realized losses breach the limit.
  if (follow.dailyLossLimitUsd != null) {
    const agg = await prisma.copyPosition.aggregate({
      where: { followId: follow.id },
      _sum: { realizedPnl: true },
    });
    const realized = Number(agg._sum.realizedPnl ?? 0);
    if (realized <= -Math.abs(Number(follow.dailyLossLimitUsd))) {
      await recordSkip(follow.id, leaderFillId, coid, fill, 'daily loss limit reached');
      return;
    }
  }

  // Follower equity for proportional sizing.
  let followerEquityUsd = 0;
  try {
    followerEquityUsd = (await exchange.getAccount(toApiCreds(follow.credential))).equityUsd;
  } catch (err) {
    await recordSkip(follow.id, leaderFillId, coid, fill, `follower account read failed: ${String(err)}`);
    return;
  }

  const sized = computeSize({
    fill,
    sizingMode: follow.sizingMode,
    sizingValue: Number(follow.sizingValue),
    leaderEquityUsd,
    followerEquityUsd,
    maxPositionUsd: follow.maxPositionUsd != null ? Number(follow.maxPositionUsd) : null,
    copyReverse: follow.copyReverse,
  });

  if (sized.qty <= 0) {
    await recordSkip(follow.id, leaderFillId, coid, fill, sized.reason ?? 'size zero', sized.side);
    return;
  }

  // Record PENDING first (claims the idempotency key), then place.
  let order;
  try {
    order = await prisma.copyOrder.create({
      data: {
        followId: follow.id,
        leaderFillId,
        exchange: follow.credential.exchange,
        clientOrderId: coid,
        symbol: fill.symbol,
        side: sized.side,
        qty: sized.qty,
        status: 'PENDING',
      },
    });
  } catch {
    return; // unique violation → another worker/tick already claimed it
  }

  try {
    const result = await exchange.placeMarketOrder(toApiCreds(follow.credential), {
      symbol: fill.symbol,
      side: sized.side,
      qty: sized.qty,
      reduceOnly: sized.reduceOnly,
      clientOrderId: coid,
    });

    const slippageBps =
      result.avgPrice && fill.price > 0
        ? ((result.avgPrice - fill.price) / fill.price) * 10_000 * (sized.side === 'BUY' ? 1 : -1)
        : null;

    await prisma.copyOrder.update({
      where: { id: order.id },
      data: {
        status: result.status,
        filledQty: result.filledQty,
        avgPrice: result.avgPrice,
        exchOrderId: result.exchOrderId || null,
        slippageBps,
        filledAt: result.status === 'FILLED' || result.status === 'PARTIAL' ? new Date() : null,
      },
    });

    if (result.filledQty > 0) {
      await applyToPosition(follow.id, fill.symbol, sized.side, result.filledQty, result.avgPrice ?? fill.price);
    }

    log.info('copied fill', {
      leaderId: leader.id,
      followId: follow.id,
      symbol: fill.symbol,
      side: sized.side,
      qty: result.filledQty,
      status: result.status,
    });
  } catch (err) {
    await prisma.copyOrder.update({
      where: { id: order.id },
      data: { status: 'REJECTED', error: String(err).slice(0, 500) },
    });
    log.error('copy order failed', { followId: follow.id, err: String(err) });
  }
}

async function recordSkip(
  followId: string,
  leaderFillId: string,
  coid: string,
  fill: FillEvent,
  reason: string,
  side: 'BUY' | 'SELL' = fill.side,
): Promise<void> {
  await prisma.copyOrder
    .create({
      data: {
        followId,
        leaderFillId,
        clientOrderId: coid,
        symbol: fill.symbol,
        side,
        qty: 0,
        status: 'SKIPPED',
        error: reason,
      },
    })
    .catch(() => undefined);
}

/**
 * Update the follow's net position for a symbol after a fill. Adds to an
 * existing same-direction position (weighted avg entry), reduces/closes on the
 * opposite side, and books realized P&L on the reduced quantity.
 */
async function applyToPosition(
  followId: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  qty: number,
  price: number,
): Promise<void> {
  const signed = side === 'BUY' ? qty : -qty;
  const existing = await prisma.copyPosition.findUnique({ where: { followId_symbol: { followId, symbol } } });

  if (!existing || Number(existing.qty) === 0) {
    await prisma.copyPosition.upsert({
      where: { followId_symbol: { followId, symbol } },
      update: {
        side: signed >= 0 ? 'LONG' : 'SHORT',
        qty: Math.abs(signed),
        avgEntry: price,
        closedAt: null,
      },
      create: {
        followId,
        symbol,
        side: signed >= 0 ? 'LONG' : 'SHORT',
        qty: Math.abs(signed),
        avgEntry: price,
      },
    });
    return;
  }

  const curSigned = existing.side === 'LONG' ? Number(existing.qty) : -Number(existing.qty);
  const newSigned = curSigned + signed;
  const avgEntry = Number(existing.avgEntry);
  let realizedDelta = 0;

  if (Math.sign(curSigned) === Math.sign(signed) || curSigned === 0) {
    // Adding to the position — weighted average entry.
    const totalAbs = Math.abs(curSigned) + Math.abs(signed);
    const newEntry = totalAbs > 0 ? (avgEntry * Math.abs(curSigned) + price * Math.abs(signed)) / totalAbs : price;
    await prisma.copyPosition.update({
      where: { followId_symbol: { followId, symbol } },
      data: { qty: Math.abs(newSigned), avgEntry: newEntry, side: newSigned >= 0 ? 'LONG' : 'SHORT' },
    });
  } else {
    // Reducing / flipping — realize P&L on the closed quantity.
    const closedQty = Math.min(Math.abs(curSigned), Math.abs(signed));
    realizedDelta = curSigned > 0 ? (price - avgEntry) * closedQty : (avgEntry - price) * closedQty;
    const newEntry = Math.sign(newSigned) === Math.sign(curSigned) || newSigned === 0 ? avgEntry : price;
    await prisma.copyPosition.update({
      where: { followId_symbol: { followId, symbol } },
      data: {
        qty: Math.abs(newSigned),
        avgEntry: newEntry,
        side: newSigned >= 0 ? 'LONG' : 'SHORT',
        realizedPnl: { increment: realizedDelta },
        closedAt: newSigned === 0 ? new Date() : null,
      },
    });
  }
}
