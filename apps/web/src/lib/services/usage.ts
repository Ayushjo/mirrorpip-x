import { prisma } from '@mirrorpip/db';

// Product-usage tracking (ported from tradingjournal): a client heartbeat
// opens/reuses a usage session when the last beat is within 30 minutes and
// writes one UsageEvent per beat. Powers the admin engagement view.

const SESSION_GAP_MS = 30 * 60 * 1000;
const HEARTBEAT_SEC = 30;

export interface HeartbeatInput {
  path?: string;
  feature?: string;
  userAgent?: string;
  ended?: boolean;
}

export { featureFromPath } from '../usage-features.js';
import { featureFromPath } from '../usage-features.js';

export async function recordHeartbeat(userId: string, input: HeartbeatInput) {
  const now = new Date();
  const feature = input.feature ?? featureFromPath(input.path);

  const open = await prisma.usageSession.findFirst({
    where: { userId, endedAt: null },
    orderBy: { lastSeenAt: 'desc' },
  });

  let sessionId: string;
  if (open && now.getTime() - open.lastSeenAt.getTime() <= SESSION_GAP_MS) {
    const elapsed = Math.max(
      HEARTBEAT_SEC,
      Math.min(120, Math.round((now.getTime() - open.lastSeenAt.getTime()) / 1000)),
    );
    const updated = await prisma.usageSession.update({
      where: { id: open.id },
      data: {
        lastSeenAt: now,
        durationSec: open.durationSec + (input.ended ? 0 : elapsed),
        pagePath: input.path ?? open.pagePath,
        endedAt: input.ended ? now : null,
      },
    });
    sessionId = updated.id;
  } else {
    if (open) {
      await prisma.usageSession.update({ where: { id: open.id }, data: { endedAt: open.lastSeenAt } });
    }
    const created = await prisma.usageSession.create({
      data: {
        userId,
        startedAt: now,
        lastSeenAt: now,
        durationSec: input.ended ? 0 : HEARTBEAT_SEC,
        pagePath: input.path,
        userAgent: input.userAgent,
        endedAt: input.ended ? now : null,
      },
    });
    sessionId = created.id;
  }

  await prisma.usageEvent.create({
    data: {
      userId,
      sessionId,
      type: input.ended ? 'session_end' : input.path ? 'page_view' : 'heartbeat',
      path: input.path,
      feature,
    },
  });

  return { sessionId };
}
