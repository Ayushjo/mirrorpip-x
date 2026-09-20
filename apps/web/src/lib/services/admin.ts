import { prisma, Prisma } from '@belivemeguys/db';
import type { SessionUser } from '../session.js';
import { cached, bust } from '../cache.js';

// ─── Audit trail ──────────────────────────────────────────────────────────────

export async function logAdminAction(input: {
  action: string;
  actor: SessionUser;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await prisma.adminAuditLog
    .create({
      data: {
        action: input.action,
        actorId: input.actor.id,
        actorEmail: input.actor.email,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    })
    .catch(() => undefined); // auditing must never break the admin action itself
}

export async function listAuditLog(take = 100) {
  const rows = await prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorEmail: r.actorEmail,
    targetType: r.targetType,
    targetId: r.targetId,
    details: r.details,
    createdAt: r.createdAt.toISOString(),
  }));
}

// ─── System settings (maintenance mode, beta gate) ────────────────────────────

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  return ((row?.value as T | undefined) ?? fallback);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { key },
    update: { value: value as Prisma.InputJsonValue },
    create: { key, value: value as Prisma.InputJsonValue },
  });
  // Bust the cached read for this setting immediately (maintenance banner etc.).
  await bust(`bmg:setting:${key}`);
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

// Cached (Redis + memory) because the root layout reads it on every navigation.
// setSetting('maintenance', …) busts 'bmg:setting:maintenance'; also self-expires in 15s.
export const getMaintenanceMode = () =>
  cached('bmg:setting:maintenance', 15, () => getSetting<MaintenanceMode>('maintenance', { enabled: false, message: '' }));
export const setMaintenanceMode = (m: MaintenanceMode) => setSetting('maintenance', m);

export const getBetaMode = () => getSetting<{ enabled: boolean }>('betaMode', { enabled: false });
export const setBetaMode = (enabled: boolean) => setSetting('betaMode', { enabled });

// ─── Access grants (invite/beta gating) ───────────────────────────────────────

export async function hasAccessGrant(email: string): Promise<boolean> {
  const grant = await prisma.accessGrant.findFirst({ where: { email: { equals: email, mode: 'insensitive' }, revokedAt: null } });
  return Boolean(grant);
}

/** When beta mode is on, non-admin users need an active grant to connect/follow/lead. */
export async function assertAccess(user: SessionUser): Promise<void> {
  const beta = await getBetaMode();
  if (!beta.enabled) return;
  const { isAdmin } = await import('../session.js');
  if (await isAdmin(user)) return;
  if (!(await hasAccessGrant(user.email))) {
    throw new (await import('../api.js')).ApiError(
      403,
      'BelieveMeGuys is in private beta — you need an invite to use this feature.',
      'BETA_GATE',
    );
  }
}

export async function listGrants() {
  const rows = await prisma.accessGrant.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return rows.map((g) => ({
    id: g.id,
    email: g.email,
    note: g.note,
    grantedByEmail: g.grantedByEmail,
    revokedAt: g.revokedAt?.toISOString() ?? null,
    createdAt: g.createdAt.toISOString(),
  }));
}

export async function createGrant(actor: SessionUser, email: string, note: string) {
  const existing = await prisma.accessGrant.findFirst({
    where: { email: { equals: email, mode: 'insensitive' }, revokedAt: null },
  });
  if (existing) {
    const { ApiError } = await import('../api.js');
    throw new ApiError(409, 'An active grant already exists for that email.');
  }
  try {
    const grant = await prisma.accessGrant.create({
      data: { email: email.toLowerCase(), note, grantedBy: actor.id, grantedByEmail: actor.email },
    });
    return { id: grant.id };
  } catch (err) {
    // Partial unique index on lower(email) where revokedAt is null — a
    // concurrent create lost the race, so report the same conflict.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const { ApiError } = await import('../api.js');
      throw new ApiError(409, 'An active grant already exists for that email.');
    }
    throw err;
  }
}

export async function revokeGrant(id: string) {
  await prisma.accessGrant.update({ where: { id }, data: { revokedAt: new Date() } });
}

// ─── Overview metrics ─────────────────────────────────────────────────────────

export async function getAdminOverview() {
  const now = new Date();
  const d1 = new Date(now.getTime() - 24 * 3600e3);
  const d7 = new Date(now.getTime() - 7 * 86400e3);
  const d14 = new Date(now.getTime() - 14 * 86400e3);
  const d30 = new Date(now.getTime() - 30 * 86400e3);

  const [
    totalUsers,
    verifiedUsers,
    signups7d,
    signups30d,
    pendingLeaders,
    verifiedLeaders,
    activeFollows,
    credentialsTotal,
    credentialsInvalid,
    copies24h,
    copiesFailed24h,
    dau,
    wau,
    sessionsToday,
    openExposure,
    copiedVolume,
    equityPoints,
    geoUsers,
    failedCopies,
    dauTrendRows,
    connectedUsers,
    followingUsers,
    featureRows,
    recentUsers,
    recentAudit,
    maintenance,
    betaMode,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.leader.count({ where: { status: 'PENDING' } }),
    prisma.leader.count({ where: { status: 'VERIFIED' } }),
    prisma.follow.count({ where: { status: 'ACTIVE' } }),
    prisma.exchangeCredential.count(),
    prisma.exchangeCredential.count({ where: { status: 'INVALID' } }),
    prisma.copyOrder.count({ where: { requestedAt: { gte: d1 }, status: 'FILLED' } }),
    prisma.copyOrder.count({ where: { requestedAt: { gte: d1 }, status: { in: ['REJECTED', 'SKIPPED'] } } }),
    prisma.usageSession.groupBy({ by: ['userId'], where: { lastSeenAt: { gte: d1 } } }).then((r) => r.length),
    prisma.usageSession.groupBy({ by: ['userId'], where: { lastSeenAt: { gte: d7 } } }).then((r) => r.length),
    prisma.usageSession.count({ where: { startedAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } } }),
    // Money-at-risk: live follower exposure, platform-wide copied turnover, leader AUM.
    prisma.copyPosition.aggregate({ where: { closedAt: null, qty: { gt: 0 } }, _sum: { unrealizedPnl: true }, _count: true }),
    prisma.leaderStat.aggregate({ where: { window: 'all' }, _sum: { totalCopiedUsd: true } }),
    prisma.leaderEquityPoint.findMany({ orderBy: { ts: 'desc' }, distinct: ['leaderId'], select: { equityUsd: true } }),
    // Geo distribution for the admin user map (lat/lng filled by signup geocoding).
    prisma.user.findMany({ where: { lat: { not: null }, lng: { not: null } }, select: { lat: true, lng: true, city: true, country: true } }),
    // Failed/skipped copy orders (last 24h) — the "why" behind the failure count.
    prisma.copyOrder.findMany({
      where: { requestedAt: { gte: d1 }, OR: [{ status: { in: ['REJECTED', 'SKIPPED'] } }, { error: { not: null } }] },
      orderBy: { requestedAt: 'desc' },
      take: 12,
      include: { follow: { select: { leader: { select: { displayName: true } } } } },
    }),
    // Per-day distinct active users over the last 14 days (for the DAU sparkline).
    prisma.$queryRaw<Array<{ d: Date; c: number }>>`
      SELECT date_trunc('day', "lastSeenAt") AS d, count(distinct "userId")::int AS c
      FROM usage_session
      WHERE "lastSeenAt" >= ${d14}
      GROUP BY 1 ORDER BY 1`,
    // Onboarding funnel: distinct users who connected an account / are actively following.
    prisma.exchangeCredential.groupBy({ by: ['userId'] }).then((r) => r.length),
    prisma.follow.groupBy({ by: ['followerUserId'], where: { status: 'ACTIVE' } }).then((r) => r.length),
    // Feature adoption over the last 30 days (coarse, privacy-safe buckets).
    prisma.usageEvent.groupBy({ by: ['feature'], where: { feature: { not: null }, createdAt: { gte: d30 } }, _count: true }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, country: true, city: true, createdAt: true, intendedRole: true, emailVerified: true },
    }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    getMaintenanceMode(),
    getBetaMode(),
  ]);

  // Cluster nearby users (~1° buckets) so the map shows one weighted dot per area.
  const geoBuckets = new Map<string, { lat: number; lng: number; city: string | null; country: string | null; count: number }>();
  for (const g of geoUsers) {
    if (g.lat == null || g.lng == null) continue;
    const key = `${Math.round(g.lat)}|${Math.round(g.lng)}`;
    const existing = geoBuckets.get(key);
    if (existing) existing.count += 1;
    else geoBuckets.set(key, { lat: g.lat, lng: g.lng, city: g.city, country: g.country, count: 1 });
  }
  const geoPoints = Array.from(geoBuckets.values()).sort((a, b) => b.count - a.count);

  // Build a dense 14-day DAU series (fill missing days with 0) for the sparkline.
  const trendByDay = new Map<string, number>();
  for (const row of dauTrendRows) trendByDay.set(new Date(row.d).toISOString().slice(0, 10), Number(row.c));
  const dauTrend: number[] = [];
  for (let i = 13; i >= 0; i--) {
    const key = new Date(now.getTime() - i * 86400e3).toISOString().slice(0, 10);
    dauTrend.push(trendByDay.get(key) ?? 0);
  }

  return {
    totals: {
      users: totalUsers,
      verifiedUsers,
      signups7d,
      signups30d,
      pendingLeaders,
      verifiedLeaders,
      activeFollows,
      credentialsTotal,
      credentialsInvalid,
    },
    activity: { dau, wau, sessionsToday, copies24h, copiesFailed24h, dauTrend },
    money: {
      openPositions: openExposure._count,
      openUnrealizedUsd: Number(openExposure._sum.unrealizedPnl ?? 0),
      copiedVolumeUsd: Number(copiedVolume._sum.totalCopiedUsd ?? 0),
      aumUsd: equityPoints.reduce((sum, p) => sum + Number(p.equityUsd), 0),
    },
    geoPoints,
    funnel: { signedUp: totalUsers, verified: verifiedUsers, connected: connectedUsers, following: followingUsers },
    featureAdoption: featureRows
      .map((r) => ({ feature: r.feature as string, count: r._count }))
      .sort((a, b) => b.count - a.count),
    recentFailedCopies: failedCopies.map((c) => ({
      id: c.id,
      symbol: c.symbol,
      side: c.side,
      status: c.status,
      exchange: c.exchange,
      leader: c.follow.leader.displayName,
      error: c.error,
      requestedAt: c.requestedAt.toISOString(),
    })),
    maintenance,
    betaMode: betaMode.enabled,
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      country: u.country,
      city: u.city,
      intendedRole: u.intendedRole,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
    })),
    recentAudit: recentAudit.map((r) => ({
      id: r.id,
      action: r.action,
      actorEmail: r.actorEmail,
      targetType: r.targetType,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

// ─── Users admin ──────────────────────────────────────────────────────────────

export async function listUsers(search?: string) {
  const users = await prisma.user.findMany({
    where: search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } },
          ],
        }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      _count: { select: { sessions: true } },
    },
  });

  const ids = users.map((u) => u.id);
  const [credCounts, followCounts, lastSeen, providers] = await Promise.all([
    prisma.exchangeCredential.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _count: true }),
    prisma.follow.groupBy({ by: ['followerUserId'], where: { followerUserId: { in: ids } }, _count: true }),
    prisma.usageSession.groupBy({ by: ['userId'], where: { userId: { in: ids } }, _max: { lastSeenAt: true } }),
    prisma.account.findMany({ where: { userId: { in: ids } }, select: { userId: true, providerId: true } }),
  ]);
  const creds = new Map(credCounts.map((c) => [c.userId, c._count]));
  const follows = new Map(followCounts.map((f) => [f.followerUserId, f._count]));
  const seen = new Map(lastSeen.map((s) => [s.userId, s._max.lastSeenAt]));
  const providerBy = new Map<string, string[]>();
  for (const a of providers) providerBy.set(a.userId, [...(providerBy.get(a.userId) ?? []), a.providerId]);
  const leaders = await prisma.leader.findMany({ where: { userId: { in: ids } }, select: { userId: true, status: true } });
  const leaderBy = new Map(leaders.map((l) => [l.userId, l.status]));

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    country: u.country,
    city: u.city,
    postalCode: u.postalCode,
    intendedRole: u.intendedRole,
    referralCode: u.referralCode,
    tosAcceptedAt: u.tosAcceptedAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    lastSeenAt: seen.get(u.id)?.toISOString() ?? null,
    credentials: creds.get(u.id) ?? 0,
    follows: follows.get(u.id) ?? 0,
    leaderStatus: leaderBy.get(u.id) ?? null,
    sessions: u._count.sessions,
    authProviders: providerBy.get(u.id) ?? [],
  }));
}

/**
 * Admin emergency stop for one user: pauses all their ACTIVE follows so the
 * engine stops copying into their accounts on the next fill. Mirrors the
 * watcher's ACTIVE→PAUSED pattern; the global kill-switch remains for platform-wide halts.
 */
export async function stopUserCopying(actor: SessionUser, userId: string) {
  const { count } = await prisma.follow.updateMany({
    where: { followerUserId: userId, status: 'ACTIVE' },
    data: { status: 'PAUSED', pausedAt: new Date() },
  });
  await logAdminAction({
    action: 'user.copying_stopped',
    actor,
    targetType: 'user',
    targetId: userId,
    details: { pausedFollows: count },
  });
  return { paused: count };
}

export async function getUserDossier(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { _count: { select: { sessions: true } } },
  });
  if (!user) return null;

  const [credentials, follows, leader, usageSessions, events, notifications, accounts] = await Promise.all([
    prisma.exchangeCredential.findMany({
      where: { userId },
      select: { id: true, exchange: true, label: true, status: true, keyLast4: true, lastError: true, verifiedAt: true, createdAt: true },
    }),
    prisma.follow.findMany({
      where: { followerUserId: userId },
      include: { leader: { select: { displayName: true } }, _count: { select: { copyOrders: true } } },
    }),
    prisma.leader.findFirst({
      where: { userId },
      include: { _count: { select: { follows: true, fills: true } } },
    }),
    prisma.usageSession.findMany({ where: { userId }, orderBy: { lastSeenAt: 'desc' }, take: 10 }),
    prisma.usageEvent.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
    prisma.account.findMany({ where: { userId }, select: { providerId: true } }),
  ]);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      country: user.country,
      city: user.city,
      postalCode: user.postalCode,
      phone: user.phone,
      intendedRole: user.intendedRole,
      referralCode: user.referralCode,
      tosAcceptedAt: user.tosAcceptedAt?.toISOString() ?? null,
      riskDisclosureAcceptedAt: user.riskDisclosureAcceptedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      sessions: user._count.sessions,
      unreadNotifications: notifications,
      authProviders: accounts.map((a) => a.providerId),
    },
    credentials: credentials.map((c) => ({
      id: c.id,
      exchange: c.exchange,
      label: c.label,
      status: c.status,
      keyLast4: c.keyLast4,
      lastError: c.lastError,
      verifiedAt: c.verifiedAt?.toISOString() ?? null,
      createdAt: c.createdAt.toISOString(),
    })),
    follows: follows.map((f) => ({
      id: f.id,
      leader: f.leader.displayName,
      status: f.status,
      sizingMode: f.sizingMode,
      copyOrders: f._count.copyOrders,
      startedAt: f.startedAt.toISOString(),
    })),
    leader: leader
      ? { id: leader.id, displayName: leader.displayName, status: leader.status, followers: leader._count.follows, fills: leader._count.fills }
      : null,
    recentSessions: usageSessions.map((s) => ({
      id: s.id,
      startedAt: s.startedAt.toISOString(),
      lastSeenAt: s.lastSeenAt.toISOString(),
      durationSec: s.durationSec,
      pagePath: s.pagePath,
    })),
    recentEvents: events.map((e) => ({
      id: e.id,
      type: e.type,
      path: e.path,
      feature: e.feature,
      createdAt: e.createdAt.toISOString(),
    })),
  };
}
