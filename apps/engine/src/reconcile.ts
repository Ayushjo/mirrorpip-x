import { prisma } from '@mirrorpip/db';
import { getExchange } from '@mirrorpip/exchange';
import { log } from './log.js';

/**
 * Mark open copy positions to market and refresh unrealized P&L, then recompute
 * leader leaderboard stats. Uses public mark prices (no auth) so it's cheap and
 * safe to run frequently.
 */
export async function reconcile(): Promise<void> {
  await markPositions();
  await recomputeLeaderStats();
}

async function markPositions(): Promise<void> {
  const open = await prisma.copyPosition.findMany({ where: { closedAt: null, qty: { gt: 0 } } });
  if (open.length === 0) return;

  // Mark price per symbol, fetched once (default Delta India adapter).
  const exchange = getExchange('DELTA_INDIA');
  const symbols = [...new Set(open.map((p) => p.symbol))];
  const marks = new Map<string, number | null>();
  await Promise.all(
    symbols.map(async (s) => {
      marks.set(s, await exchange.getMarkPrice(s).catch(() => null));
    }),
  );

  for (const pos of open) {
    const mark = marks.get(pos.symbol);
    if (mark == null) continue;
    const qty = Number(pos.qty);
    const entry = Number(pos.avgEntry);
    const unrealized = pos.side === 'LONG' ? (mark - entry) * qty : (entry - mark) * qty;
    await prisma.copyPosition
      .update({ where: { id: pos.id }, data: { markPrice: mark, unrealizedPnl: unrealized } })
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

    // ROI / drawdown need an equity-curve history we don't yet track — left at 0
    // until that pipeline lands, rather than shown as a fabricated figure.
    await prisma.leaderStat
      .upsert({
        where: { leaderId_window: { leaderId: leader.id, window: 'all' } },
        update: { followerCount, tradeCount, totalCopiedUsd, winRatePct },
        create: { leaderId: leader.id, window: 'all', followerCount, tradeCount, totalCopiedUsd, winRatePct },
      })
      .catch((err) => log.warn('leader stat upsert failed', { leaderId: leader.id, err: String(err) }));
  }
}
