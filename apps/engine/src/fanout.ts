import { prisma, type Follow, type ExchangeCredential, type Leader } from '@mirrorpip/db';
import { type FillEvent, getExchange } from '@mirrorpip/exchange';
import { toApiCreds } from './creds.js';
import { computeSize } from './sizing.js';
import { applyFill } from './position.js';
import { isKillSwitchOn } from './killswitch.js';
import { log } from './log.js';

type FollowWithCred = Follow & { credential: ExchangeCredential };

/** Deterministic idempotency key: one copy order per (follow, leader fill). */
function clientOrderId(exchange: string, followId: string, fillExternalId: string): string {
  // This full internal key stays in our DB. Each adapter converts it to its
  // venue's permitted length/characters at the API boundary.
  return `mpx:${exchange}:${followId}:${fillExternalId}`;
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
        quoteCurrency: fill.quoteCurrency ?? null,
        nativePrice: fill.nativePrice ?? null,
        priceUsd: fill.priceUsd ?? null,
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

  // Re-read leader status: the caller's object may be stale (a watcher loaded
  // it before an admin pause, or the reconcile sweep paged it minutes ago).
  const liveLeader = await prisma.leader.findUnique({ where: { id: leader.id }, select: { status: true } });
  if (liveLeader?.status !== 'VERIFIED') {
    log.warn('leader not verified — skipping fan-out', { leaderId: leader.id, status: liveLeader?.status, fill: fill.externalId });
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
  // Copy-from-now: never copy a fill that happened before the follow started.
  // This also makes reconnect backfill safe — replaying recent leader fills can't
  // open positions the follower never opted into.
  if (follow.startedAt.getTime() > fill.timestamp.getTime()) return;

  const coid = clientOrderId(follow.credential.exchange, follow.id, fill.externalId);

  // USD limits must never be evaluated against an INR-labelled price. INR
  // adapters populate priceUsd only when their short-lived FX quote is fresh.
  if (fill.quoteCurrency === 'INR' && (fill.priceUsd == null || fill.priceUsd <= 0)) {
    await recordSkip(follow.id, leaderFillId, coid, fill, 'INR/USD conversion quote unavailable or stale', fill.side, follow.credential.exchange);
    return;
  }

  // Idempotency: bail if we already created a copy order for this pair.
  const existing = await prisma.copyOrder.findUnique({ where: { clientOrderId: coid } });
  if (existing) return;

  const exchange = getExchange(follow.credential.exchange);

  // Resolve the follower venue's instrument by canonical identity so a
  // leader fill from another exchange (e.g. Shark BTCUSDT → Delta BTCUSD)
  // lands on the right contract. Falls back to the leader symbol for venues
  // without resolveInstrument.
  let followerInstrument;
  try {
    followerInstrument = exchange.resolveInstrument
      ? await exchange.resolveInstrument(fill)
      : exchange.getInstrument
        ? await exchange.getInstrument(fill.symbol)
        : null;
  } catch (err) {
    // Transient resolution failure (venue catalog endpoint down): do NOT
    // claim the idempotency key — the reconcile pass will retry this fill.
    log.warn('instrument resolution failed; leaving fill for retry', { followId: follow.id, symbol: fill.symbol, err: String(err) });
    return;
  }
  if (!followerInstrument) {
    await recordSkip(follow.id, leaderFillId, coid, fill, `no matching instrument on ${follow.credential.exchange}`, fill.side, follow.credential.exchange);
    return;
  }
  const followerMult = followerInstrument.contractMultiplier || 1;

  // Daily-loss guard: halt this follow if realized losses breach the limit.
  if (follow.dailyLossLimitUsd != null) {
    const agg = await prisma.copyPosition.aggregate({
      where: { followId: follow.id },
      _sum: { realizedPnl: true },
    });
    const realized = Number(agg._sum.realizedPnl ?? 0);
    if (realized <= -Math.abs(Number(follow.dailyLossLimitUsd))) {
      await recordSkip(follow.id, leaderFillId, coid, fill, 'daily loss limit reached', fill.side, follow.credential.exchange);
      return;
    }
  }

  // Follower equity for proportional sizing.
  let followerEquityUsd = 0;
  try {
    followerEquityUsd = (await exchange.getAccount(toApiCreds(follow.credential))).equityUsd;
  } catch (err) {
    await recordSkip(follow.id, leaderFillId, coid, fill, `follower account read failed: ${String(err)}`, fill.side, follow.credential.exchange);
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

  // sized.qty is in base units — convert to the follower venue's qty units.
  const orderQty = sized.qty / followerMult;

  if (sized.qty <= 0) {
    await recordSkip(follow.id, leaderFillId, coid, fill, sized.reason ?? 'size zero', sized.side, follow.credential.exchange);
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
        symbol: followerInstrument.symbol,
        side: sized.side,
        qty: orderQty,
        status: 'PENDING',
      },
    });
  } catch {
    return; // unique violation → another worker/tick already claimed it
  }

  try {
    const result = await exchange.placeMarketOrder(toApiCreds(follow.credential), {
      symbol: followerInstrument.symbol,
      side: sized.side,
      qty: orderQty,
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
      await applyToPosition(
        follow.id,
        followerInstrument.symbol,
        sized.side,
        result.filledQty,
        result.avgPrice ?? fill.price,
        followerMult,
      );
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
  exchange: 'DELTA_INDIA' | 'SHARK' | 'PI42' | 'MUDREX' | 'BYBIT' = 'DELTA_INDIA',
): Promise<void> {
  await prisma.copyOrder
    .create({
      data: {
        followId,
        leaderFillId,
        exchange,
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
  contractMultiplier: number,
): Promise<void> {
  const existing = await prisma.copyPosition.findUnique({ where: { followId_symbol: { followId, symbol } } });
  const current =
    existing && Number(existing.qty) !== 0
      ? { side: existing.side as 'LONG' | 'SHORT', qty: Number(existing.qty), avgEntry: Number(existing.avgEntry) }
      : null;

  const r = applyFill(current, side, qty, price, contractMultiplier);

  await prisma.copyPosition.upsert({
    where: { followId_symbol: { followId, symbol } },
    update: {
      side: r.side,
      qty: r.qty,
      avgEntry: r.avgEntry,
      realizedPnl: r.realizedDelta !== 0 ? { increment: r.realizedDelta } : undefined,
      closedAt: r.closed ? new Date() : null,
    },
    create: { followId, symbol, side: r.side, qty: r.qty, avgEntry: r.avgEntry },
  });
}
