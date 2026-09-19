import { prisma } from '@mirrorpip/db';
import { getExchange, type InstrumentInfo } from '@mirrorpip/exchange';
import { toApiCreds } from './creds.js';
import { fanoutLeaderFill } from './fanout.js';
import { curveStats, WINDOWS } from './stats.js';
import { log } from './log.js';

/**
 * Mark open copy positions to market and refresh unrealized P&L, then recompute
 * leader leaderboard stats. Uses public mark prices (no auth) so it's cheap and
 * safe to run frequently.
 */
export async function reconcile(): Promise<void> {
  await markPositions();
  await recomputeLeaderStats();
  await retryMissingCopies();
}

/**
 * Retry sweep: persisted leader fills (last 24h) that have an ACTIVE follow
 * with NO CopyOrder — i.e. the original fan-out died on a transient failure
 * (instrument catalog down, network blip) before an order row could be
 * claimed. fanoutLeaderFill is idempotent, so replaying is safe: existing
 * orders bail on the clientOrderId check, only the missing ones get placed.
 */
async function retryMissingCopies(): Promise<void> {
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
  const PAGE = 200;
  // Cursor-paginate the whole window (newest first) so a burst of complete
  // fills can't starve an older missing one out of the page.
  let cursor: { exchTs: Date; id: string } | undefined;

  for (;;) {
    const fills = await prisma.leaderFill.findMany({
      where: {
        exchTs: { gte: cutoff },
        leader: { status: 'VERIFIED', follows: { some: { status: 'ACTIVE' } } },
        ...(cursor
          ? { OR: [{ exchTs: { lt: cursor.exchTs } }, { exchTs: cursor.exchTs, id: { lt: cursor.id } }] }
          : {}),
      },
      include: { leader: { include: { follows: { where: { status: 'ACTIVE' } } } } },
      orderBy: [{ exchTs: 'desc' }, { id: 'desc' }],
      take: PAGE,
    });
    if (fills.length === 0) break;

    for (const fill of fills) {
      const pending = fill.leader.follows.filter((f) => f.startedAt <= fill.exchTs);
      if (pending.length === 0) continue;

      // Rebuild a FillEvent with canonical instrument metadata so cross-venue
      // resolution works on retry. A thrown lookup is transient — skip this
      // fill for now rather than replay without metadata, which cross-venue
      // followers would permanently record as SKIPPED.
      const exchange = getExchange(fill.leader.exchange);
      let inst: InstrumentInfo | null = null;
      try {
        inst = exchange.getInstrument ? await exchange.getInstrument(fill.symbol) : null;
      } catch (err) {
        log.warn('leader instrument lookup failed; fill stays pending', { leaderFillId: fill.id, err: String(err) });
        continue;
      }

      for (const follow of pending) {
        const existing = await prisma.copyOrder.findFirst({
          where: { followId: follow.id, leaderFillId: fill.id },
          select: { id: true },
        });
        if (existing) continue; // PENDING/SUBMITTED/FILLED/SKIPPED/FAILED are all claimed
        log.info('retrying fill that produced no copy order', { leaderFillId: fill.id, followId: follow.id });
        await fanoutLeaderFill(fill.leader, {
          externalId: fill.externalId,
          symbol: fill.symbol,
          side: fill.side,
          qty: Number(fill.qty),
          price: Number(fill.price),
          reduceOnly: fill.reduceOnly,
          timestamp: fill.exchTs,
          baseAsset: inst?.baseAsset,
          quoteAsset: inst?.quoteCurrency,
          contractMultiplier: inst?.contractMultiplier,
        });
      }
    }

    const last = fills[fills.length - 1];
    if (fills.length < PAGE || !last) break;
    cursor = { exchTs: last.exchTs, id: last.id };
  }
}

async function markPositions(): Promise<void> {
  const open = await prisma.copyPosition.findMany({
    where: { closedAt: null, qty: { gt: 0 } },
    include: { follow: { select: { credential: { select: { exchange: true } } } } },
  });
  if (open.length === 0) return;

  // Fetch once per venue+symbol; contracts are intentionally never translated.
  const keys = [...new Set(open.map((p) => `${p.follow.credential.exchange}:${p.symbol}`))];
  const marks = new Map<string, { price: number | null; multiplier: number }>();
  await Promise.all(
    keys.map(async (key) => {
      const separator = key.indexOf(':');
      const exchangeId = key.slice(0, separator);
      const symbol = key.slice(separator + 1);
      const exchange = getExchange(exchangeId);
      const [price, instrument] = await Promise.all([
        exchange.getMarkPrice(symbol).catch(() => null),
        exchange.getInstrument?.(symbol).catch(() => null) ?? Promise.resolve(null),
      ]);
      marks.set(key, { price, multiplier: instrument?.contractMultiplier ?? 1 });
    }),
  );

  for (const pos of open) {
    const mark = marks.get(`${pos.follow.credential.exchange}:${pos.symbol}`);
    if (!mark || mark.price == null) continue;
    const qty = Number(pos.qty);
    const entry = Number(pos.avgEntry);
    const unrealized =
      (pos.side === 'LONG' ? mark.price - entry : entry - mark.price) * qty * mark.multiplier;
    await prisma.copyPosition
      .update({ where: { id: pos.id }, data: { markPrice: mark.price, unrealizedPnl: unrealized } })
      .catch(() => undefined);
  }
}

async function recomputeLeaderStats(): Promise<void> {
  const leaders = await prisma.leader.findMany({ where: { status: { in: ['VERIFIED', 'PAUSED'] } } });

  for (const leader of leaders) {
    const [followerCount, tradeCount, copyAgg, closedPositions] = await Promise.all([
      prisma.follow.count({ where: { leaderId: leader.id, status: 'ACTIVE' } }),
      prisma.leaderFill.count({ where: { leaderId: leader.id } }),
      prisma.copyOrder.findMany({
        where: { follow: { leaderId: leader.id }, status: { in: ['FILLED', 'PARTIAL'] } },
        select: { filledQty: true, avgPrice: true },
      }),
      prisma.copyPosition.findMany({
        where: { follow: { leaderId: leader.id }, closedAt: { not: null } },
        select: { realizedPnl: true },
      }),
    ]);

    const totalCopiedUsd = copyAgg.reduce((sum, o) => sum + Number(o.filledQty) * Number(o.avgPrice ?? 0), 0);
    const wins = closedPositions.filter((p) => Number(p.realizedPnl) > 0).length;
    const winRatePct = closedPositions.length > 0 ? (wins / closedPositions.length) * 100 : 0;

    // Snapshot the leader's current account equity so ROI/drawdown become real.
    try {
      const cred = await prisma.exchangeCredential.findUnique({ where: { id: leader.credentialId } });
      if (cred) {
        const { equityUsd } = await getExchange(leader.exchange).getAccount(toApiCreds(cred));
        if (Number.isFinite(equityUsd)) {
          await prisma.leaderEquityPoint.create({ data: { leaderId: leader.id, equityUsd } });
        }
      }
    } catch (err) {
      log.debug('equity snapshot failed', { leaderId: leader.id, err: String(err) });
    }

    // Compute ROI + drawdown per window from the equity curve.
    const points = (
      await prisma.leaderEquityPoint.findMany({
        where: { leaderId: leader.id },
        orderBy: { ts: 'asc' },
        select: { equityUsd: true, ts: true },
      })
    ).map((p) => ({ equityUsd: Number(p.equityUsd), ts: p.ts }));

    for (const [window, span] of Object.entries(WINDOWS)) {
      const { roiPct, maxDrawdownPct } = curveStats(points, span ? Date.now() - span : 0);
      await prisma.leaderStat
        .upsert({
          where: { leaderId_window: { leaderId: leader.id, window } },
          update: { followerCount, tradeCount, totalCopiedUsd, winRatePct, roiPct, maxDrawdownPct },
          create: { leaderId: leader.id, window, followerCount, tradeCount, totalCopiedUsd, winRatePct, roiPct, maxDrawdownPct },
        })
        .catch((err) => log.warn('leader stat upsert failed', { leaderId: leader.id, window, err: String(err) }));
    }
  }
}
