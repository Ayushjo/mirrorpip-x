import { prisma, type Follow, type ExchangeCredential, type Leader } from '@belivemeguys/db';
import { type FillEvent, getExchange } from '@belivemeguys/exchange';
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
    .catch(async (err) => {
      // Concurrent identical fills (Delta can deliver the same fill on more than
      // one WS frame) race the upsert: both see no row and INSERT, one hits the
      // unique (leaderId, externalId). Recover by loading the row the winner
      // wrote and continuing — downstream copy orders are idempotent per
      // (follow, fill), so a second fan-out is deduped rather than duplicated.
      if ((err as { code?: string })?.code === 'P2002') {
        return prisma.leaderFill.findUnique({
          where: { leaderId_externalId: { leaderId: leader.id, externalId: fill.externalId } },
        });
      }
      log.error('failed to persist leader fill', { leaderId: leader.id, err: String(err) });
      return null;
    });
  if (!leaderFill) return;

  // 2. Load active follows for this leader.
  const follows = (await prisma.follow.findMany({
    where: { leaderId: leader.id, status: 'ACTIVE' },
    include: { credential: true },
  })) as FollowWithCred[];

  // Suppression claims: if fan-out is halted (kill-switch or the leader was
  // paused/delisted after the caller loaded it), record a terminal SKIPPED
  // order per eligible follow instead of leaving the fill unclaimed — the
  // reconcile sweep treats unclaimed fills as retryable, and a paused-period
  // fill must never execute late when the halt lifts.
  let haltReason: string | null = null;
  if (await isKillSwitchOn()) haltReason = 'kill-switch on';
  else {
    const liveLeader = await prisma.leader.findUnique({ where: { id: leader.id }, select: { status: true } });
    if (liveLeader?.status !== 'VERIFIED') haltReason = `leader not verified (status: ${liveLeader?.status ?? 'deleted'})`;
  }
  if (haltReason) {
    log.warn('fan-out halted — claiming skips', { leaderId: leader.id, fill: fill.externalId, haltReason });
    for (const follow of follows) {
      if (follow.startedAt.getTime() > fill.timestamp.getTime()) continue;
      const coid = clientOrderId(follow.credential.exchange, follow.id, fill.externalId);
      await recordSkip(follow.id, leaderFill.id, coid, fill, haltReason, fill.side, follow.credential.exchange);
    }
    return;
  }
  if (follows.length === 0) return;

  // 3. Leader equity (for proportional sizing). Prefer the equity the engine
  //    already polls (~every 30s) — a fast local DB read — to avoid a cross-region
  //    Delta round-trip on the hot path. Fall back to a live read only if there's
  //    no recent point. A slightly stale leader equity is fine for the sizing ratio.
  let leaderEquityUsd = 0;
  const recentPoint = await prisma.leaderEquityPoint.findFirst({
    where: { leaderId: leader.id, ts: { gte: new Date(Date.now() - 90_000) } },
    orderBy: { ts: 'desc' },
    select: { equityUsd: true },
  });
  if (recentPoint) {
    leaderEquityUsd = Number(recentPoint.equityUsd);
  } else {
    try {
      const exchange = getExchange(leader.exchange);
      const leaderCred = await prisma.exchangeCredential.findUnique({ where: { id: leader.credentialId } });
      if (leaderCred) leaderEquityUsd = (await exchange.getAccount(toApiCreds(leaderCred))).equityUsd;
    } catch (err) {
      log.warn('could not read leader equity; proportional follows may skip', { err: String(err) });
    }
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

  // Final leader-status gate immediately before claiming + submitting: an
  // admin pause committed while account/risk lookups were in flight must stop
  // this order. (The external API call itself can't be made atomic with the
  // check — this narrows the window to the claim→submit step.)
  const liveLeader = await prisma.leader.findUnique({ where: { id: leader.id }, select: { status: true } });
  if (liveLeader?.status !== 'VERIFIED') {
    await recordSkip(follow.id, leaderFillId, coid, fill, 'leader paused before order submit', fill.side, follow.credential.exchange);
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
  exchange: 'DELTA_INDIA' | 'BYBIT' = 'DELTA_INDIA',
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
