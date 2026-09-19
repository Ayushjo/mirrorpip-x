import { prisma, Prisma } from '@mirrorpip/db';
import { featureFromPath } from '../usage-features.js';

// Product-usage tracking (ported from tradingjournal): a client heartbeat
// opens/reuses a usage session when the last beat is within 30 minutes.
// Sessions are per browser tab (clientId) so one tab can't end another's.
const SESSION_GAP_MS = 30 * 60 * 1000;
const MAX_ELAPSED_SEC = 120;

export type HeartbeatEventType = 'page_view' | 'heartbeat' | 'session_end';

export interface HeartbeatInput {
  path?: string;
  feature?: string;
  clientId?: string;
  type?: HeartbeatEventType;
  userAgent?: string;
  ended?: boolean;
}

export async function recordHeartbeat(userId: string, input: HeartbeatInput) {
  const now = new Date();
  const feature = input.feature ?? featureFromPath(input.path);
  const eventType: HeartbeatEventType = input.ended ? 'session_end' : input.type === 'page_view' ? 'page_view' : 'heartbeat';

  const open = await prisma.usageSession.findFirst({
    where: { userId, clientId: input.clientId ?? null, endedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });

  let sessionId: string;
  if (open && now.getTime() - open.lastSeenAt.getTime() <= SESSION_GAP_MS) {
    const elapsed = input.ended
      ? 0
      : Math.min(MAX_ELAPSED_SEC, Math.max(0, Math.round((now.getTime() - open.lastSeenAt.getTime()) / 1000)));
    const updated = await prisma.usageSession.update({
      where: { id: open.id },
      data: {
        lastSeenAt: now,
        durationSec: { increment: elapsed },
        pagePath: input.path ?? open.pagePath,
        endedAt: input.ended ? now : null,
      },
    });
    sessionId = updated.id;
  } else {
    if (open) {
      await prisma.usageSession.update({ where: { id: open.id }, data: { endedAt: open.lastSeenAt } });
    }
    try {
      const created = await prisma.usageSession.create({
        data: {
          userId,
          clientId: input.clientId ?? null,
          startedAt: now,
          lastSeenAt: now,
          durationSec: 0,
          pagePath: input.path,
          userAgent: input.userAgent,
          endedAt: input.ended ? now : null,
        },
      });
      sessionId = created.id;
    } catch (err) {
      // Unique index "one open session per (user, tab)": a racing first-beat
      // already created it (e.g. StrictMode double-mount) — reuse that row.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const winner = await prisma.usageSession.findFirst({
          where: { userId, clientId: input.clientId ?? null, endedAt: null },
          orderBy: { lastSeenAt: 'desc' },
        });
        if (!winner) throw err;
        sessionId = winner.id;
      } else {
        throw err;
      }
    }
  }

  // Events are meaningful moments (navigation, session end) — interval ticks
  // only update session duration, they don't mint events. A duplicate
  // page_view for the same path within a few seconds (double-mount, retry) is
  // dropped so admin "recent activity" stays a real navigation history.
  if (eventType !== 'heartbeat') {
    const dupe =
      eventType === 'page_view'
        ? await prisma.usageEvent.findFirst({
            where: {
              userId,
              sessionId,
              type: 'page_view',
              path: input.path ?? null,
              createdAt: { gte: new Date(now.getTime() - 5000) },
            },
          })
        : null;
    if (!dupe) {
      await prisma.usageEvent.create({
        data: { userId, sessionId, type: eventType, path: input.path, feature },
      });
    }
  }

  return { sessionId };
}
