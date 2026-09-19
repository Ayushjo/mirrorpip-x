import { prisma, Prisma } from '@belivemeguys/db';
import type { SessionUser } from '../session.js';

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
}

export interface MaintenanceMode {
  enabled: boolean;
  message: string;
}

export const getMaintenanceMode = () => getSetting<MaintenanceMode>('maintenance', { enabled: false, message: '' });
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
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, country: true, city: true, createdAt: true, intendedRole: true, emailVerified: true },
    }),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    getMaintenanceMode(),
    getBetaMode(),
  ]);

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
    activity: { dau, wau, sessionsToday, copies24h, copiesFailed24h },
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
