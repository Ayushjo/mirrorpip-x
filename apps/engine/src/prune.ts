import { prisma } from '@belivemeguys/db';
import { log } from './log.js';

// How long product-usage rows are kept. Generous by default (anti-bloat only,
// not a data policy) — tune with USAGE_RETENTION_DAYS.
const RETENTION_DAYS = Number(process.env.USAGE_RETENTION_DAYS ?? 540);

/**
 * Periodic retention sweep: delete usage events/sessions older than the retention
 * window so these append-only tables stay bounded. Ranged deleteMany on the
 * indexed timestamp columns; safe to run repeatedly and cheap when nothing ages out.
 */
export async function pruneUsage(): Promise<void> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86400e3);
  const events = await prisma.usageEvent.deleteMany({ where: { createdAt: { lt: cutoff } } });
  const sessions = await prisma.usageSession.deleteMany({
    where: { OR: [{ endedAt: { lt: cutoff } }, { endedAt: null, lastSeenAt: { lt: cutoff } }] },
  });
  if (events.count > 0 || sessions.count > 0) {
    log.info('pruned usage data', { retentionDays: RETENTION_DAYS, events: events.count, sessions: sessions.count });
  }
}
