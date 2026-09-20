import { prisma } from '@belivemeguys/db';
import { decryptSecret, encryptSecret, fingerprintApiKey, getExchange, getExchangeRegistryItem, last4, ExchangeAuthError } from '@belivemeguys/exchange';
import { ApiError } from '../api.js';
import { cached } from '../cache.js';
import { dec, decOr0, iso } from '../serialize.js';
import type {
  ConnectCredentialInput,
  CreateFollowInput,
  UpdateFollowInput,
  RegisterLeaderInput,
  ApplyLeaderInput,
} from '../validation.js';

const MAX_CREDENTIALS_PER_USER = 8;

// ─── Credentials ───────────────────────────────────────────────────────────

export async function addCredential(userId: string, input: ConnectCredentialInput) {
  const count = await prisma.exchangeCredential.count({ where: { userId } });
  if (count >= MAX_CREDENTIALS_PER_USER) {
    throw new ApiError(409, `You can connect up to ${MAX_CREDENTIALS_PER_USER} accounts.`);
  }

  const exchange = getExchange(input.exchange);
  const registry = getExchangeRegistryItem(input.exchange);
  if (!registry || registry.availability !== 'ACTIVE') throw new ApiError(409, 'That exchange is not available.');
  if (!registry.supportedCurrencies.includes(input.tradeCurrency)) throw new ApiError(400, `${input.tradeCurrency} is not supported for ${registry.displayName}.`);
  const apiKeyFingerprint = fingerprintApiKey(input.exchange, input.apiKey);
  const existingCredentials = await prisma.exchangeCredential.findMany({
    where: { exchange: input.exchange, status: { not: 'REVOKED' } },
    select: { apiKeyFingerprint: true, apiKeyEnc: true },
  });
  const duplicate = existingCredentials.some((credential) =>
    credential.apiKeyFingerprint === apiKeyFingerprint ||
    (!credential.apiKeyFingerprint && decryptSecret(credential.apiKeyEnc).trim() === input.apiKey.trim()),
  );
  if (duplicate) throw new ApiError(409, 'This exchange API key is already connected.', 'DUPLICATE_EXCHANGE_ACCOUNT');
  let verified;
  try {
    verified = await exchange.verify({ apiKey: input.apiKey, apiSecret: input.apiSecret, tradeCurrency: input.tradeCurrency, settings: input.settings });
  } catch (err) {
    if (err instanceof ExchangeAuthError) throw new ApiError(400, 'Those API keys were rejected by the exchange. Check the key, secret, and that it has trade permission.');
    throw new ApiError(502, `Could not reach the exchange to verify the key: ${String(err)}`);
  }
  if (!verified.canTrade) throw new ApiError(400, 'This API key does not have trading permission. Enable read and trading access, with withdrawals disabled.');

  let cred;
  try {
    cred = await prisma.exchangeCredential.create({
      data: {
        userId,
        exchange: input.exchange,
        label: input.label,
        apiKeyEnc: encryptSecret(input.apiKey),
        apiSecretEnc: encryptSecret(input.apiSecret),
        keyLast4: last4(input.apiKey),
        apiKeyFingerprint,
        baseCurrency: verified.baseCurrency,
        tradeCurrency: input.tradeCurrency,
        settings: input.settings,
        status: 'ACTIVE',
        verifiedAt: new Date(),
        lastCheckedAt: new Date(),
      },
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      throw new ApiError(409, 'This exchange API key is already connected.', 'DUPLICATE_EXCHANGE_ACCOUNT');
    }
    throw error;
  }
  return serializeCredential(cred, verified.equityUsd);
}

export async function listCredentials(userId: string) {
  const creds = await prisma.exchangeCredential.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { leaderProfile: { select: { id: true, status: true } } },
  });
  return creds.map((c) => serializeCredential(c));
}

export async function deleteCredential(userId: string, id: string) {
  const cred = await prisma.exchangeCredential.findFirst({
    where: { id, userId },
    include: { leaderProfile: true, follows: { where: { status: 'ACTIVE' } } },
  });
  if (!cred) throw new ApiError(404, 'Account not found.');
  if (cred.leaderProfile) throw new ApiError(409, 'This account is registered as a leader. Delist it first.');
  if (cred.follows.length > 0) throw new ApiError(409, 'Stop your active follows on this account before removing it.');
  await prisma.exchangeCredential.delete({ where: { id } });
}

function serializeCredential(
  c: {
    id: string;
    exchange: string;
    label: string;
    keyLast4: string;
    baseCurrency: string;
    tradeCurrency: string;
    status: string;
    verifiedAt: Date | null;
    lastCheckedAt?: Date | null;
    lastError?: string | null;
    createdAt: Date;
    leaderProfile?: { id: string; status?: string } | null;
  },
  equityUsd?: number,
) {
  return {
    id: c.id,
    exchange: c.exchange,
    label: c.label,
    keyLast4: c.keyLast4,
    baseCurrency: c.baseCurrency,
    tradeCurrency: c.tradeCurrency,
    status: c.status,
    isLeader: Boolean(c.leaderProfile),
    leaderStatus: c.leaderProfile?.status ?? null,
    verifiedAt: iso(c.verifiedAt),
    lastCheckedAt: iso(c.lastCheckedAt ?? null),
    lastError: c.lastError ?? null,
    createdAt: iso(c.createdAt),
    equityUsd: equityUsd ?? null,
  };
}

// ─── Leaderboard (public) ─────────────────────────────────────────────────────

// The public leaderboard changes slowly (stats recompute on the engine's cadence),
// so cache the serialized result in Redis (shared across instances) + memory.
// Repeat /leaders loads become a cache hit instead of a multi-round-trip Neon query.
export async function listLeaders() {
  return cached('bmg:leaderboard:v1', 15, async () => {
    const leaders = await prisma.leader.findMany({
      where: { status: 'VERIFIED' },
      include: {
        stats: { where: { window: 'all' } },
        equityPoints: { orderBy: { ts: 'desc' }, take: 60 },
      },
      orderBy: { createdAt: 'desc' },
    });
    return leaders.map(serializeLeaderCard);
  });
}

export async function getLeaderPublic(id: string) {
  const leader = await prisma.leader.findFirst({
    where: { id, status: { in: ['VERIFIED', 'PAUSED'] } },
    include: {
      stats: { where: { window: 'all' } },
      equityPoints: { orderBy: { ts: 'desc' }, take: 90 },
      fills: { orderBy: { exchTs: 'desc' }, take: 20 },
    },
  });
  if (!leader) throw new ApiError(404, 'Leader not found.');
  return {
    ...serializeLeaderCard(leader),
    bio: leader.bio,
    recentTrades: leader.fills.map((f) => ({
      id: f.id,
      symbol: f.symbol,
      side: f.side,
      qty: decOr0(f.qty),
      price: decOr0(f.price),
      reduceOnly: f.reduceOnly,
      at: iso(f.exchTs),
    })),
  };
}

function serializeLeaderCard(l: {
  id: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  status: string;
  exchange: string;
  stats: Array<{ roiPct: unknown; winRatePct: unknown; maxDrawdownPct: unknown; totalCopiedUsd: unknown; tradeCount: number; followerCount: number }>;
  equityPoints?: Array<{ equityUsd: unknown }>;
}) {
  const s = l.stats[0];
  const equitySeries = (l.equityPoints ?? [])
    .slice()
    .reverse()
    .map((p) => decOr0(p.equityUsd));
  return {
    id: l.id,
    displayName: l.displayName,
    avatarUrl: l.avatarUrl,
    status: l.status,
    exchange: l.exchange,
    stats: {
      roiPct: dec(s?.roiPct) ?? 0,
      winRatePct: dec(s?.winRatePct) ?? 0,
      maxDrawdownPct: dec(s?.maxDrawdownPct) ?? 0,
      totalCopiedUsd: dec(s?.totalCopiedUsd) ?? 0,
      tradeCount: s?.tradeCount ?? 0,
      followerCount: s?.followerCount ?? 0,
    },
    equitySeries,
  };
}

// ─── Follows ──────────────────────────────────────────────────────────────────

export async function createFollow(userId: string, input: CreateFollowInput) {
  const [leader, cred] = await Promise.all([
    prisma.leader.findUnique({ where: { id: input.leaderId } }),
    prisma.exchangeCredential.findFirst({ where: { id: input.credentialId, userId } }),
  ]);
  if (!leader || leader.status !== 'VERIFIED') throw new ApiError(404, 'Leader not available.');
  if (!cred) throw new ApiError(404, 'Connected account not found.');
  if (cred.status !== 'ACTIVE') throw new ApiError(409, 'That account is not active.');
  // Cross-venue follows are allowed: the engine resolves each fill to the
  // follower venue's instrument by canonical base/quote and converts contract
  // quantities to base units. Instruments the venue doesn't list are skipped
  // per-fill (recorded on the CopyOrder), not blocked here.
  if (leader.credentialId === cred.id) throw new ApiError(409, 'You cannot follow yourself with the same account.');

  const existing = await prisma.follow.findUnique({
    where: { followerUserId_leaderId: { followerUserId: userId, leaderId: leader.id } },
  });
  if (existing && existing.status !== 'STOPPED') throw new ApiError(409, 'You already follow this leader.');

  const data = {
    credentialId: cred.id,
    sizingMode: input.sizingMode,
    sizingValue: input.sizingValue,
    maxPositionUsd: input.maxPositionUsd ?? null,
    dailyLossLimitUsd: input.dailyLossLimitUsd ?? null,
    copyReverse: input.copyReverse,
    status: 'ACTIVE' as const,
    startedAt: new Date(),
    pausedAt: null,
    stoppedAt: null,
  };

  const follow = existing
    ? await prisma.follow.update({ where: { id: existing.id }, data })
    : await prisma.follow.create({ data: { followerUserId: userId, leaderId: leader.id, ...data } });

  return { id: follow.id };
}

export async function listFollows(userId: string) {
  const follows = await prisma.follow.findMany({
    where: { followerUserId: userId, status: { not: 'STOPPED' } },
    include: {
      leader: { include: { stats: { where: { window: 'all' } } } },
      credential: { select: { label: true, keyLast4: true, exchange: true } },
      copyPositions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return follows.map((f) => ({
    id: f.id,
    status: f.status,
    sizingMode: f.sizingMode,
    sizingValue: decOr0(f.sizingValue),
    maxPositionUsd: dec(f.maxPositionUsd),
    dailyLossLimitUsd: dec(f.dailyLossLimitUsd),
    copyReverse: f.copyReverse,
    account: { label: f.credential.label, keyLast4: f.credential.keyLast4, exchange: f.credential.exchange },
    leader: serializeLeaderCard(f.leader),
    openPnl: f.copyPositions.filter((p) => !p.closedAt).reduce((s, p) => s + decOr0(p.unrealizedPnl), 0),
    realizedPnl: f.copyPositions.reduce((s, p) => s + decOr0(p.realizedPnl), 0),
    startedAt: iso(f.startedAt),
  }));
}

export async function getFollowDetail(userId: string, id: string) {
  const follow = await prisma.follow.findFirst({
    where: { id, followerUserId: userId },
    include: {
      leader: { include: { stats: { where: { window: 'all' } } } },
      credential: { select: { label: true, keyLast4: true, exchange: true } },
      copyPositions: { orderBy: { updatedAt: 'desc' } },
      copyOrders: { orderBy: { requestedAt: 'desc' }, take: 50 },
    },
  });
  if (!follow) throw new ApiError(404, 'Follow not found.');
  return {
    id: follow.id,
    status: follow.status,
    sizingMode: follow.sizingMode,
    sizingValue: decOr0(follow.sizingValue),
    maxPositionUsd: dec(follow.maxPositionUsd),
    dailyLossLimitUsd: dec(follow.dailyLossLimitUsd),
    copyReverse: follow.copyReverse,
    account: { label: follow.credential.label, keyLast4: follow.credential.keyLast4, exchange: follow.credential.exchange },
    leader: serializeLeaderCard(follow.leader),
    positions: follow.copyPositions.map((p) => ({
      id: p.id,
      symbol: p.symbol,
      side: p.side,
      qty: decOr0(p.qty),
      avgEntry: decOr0(p.avgEntry),
      markPrice: dec(p.markPrice),
      unrealizedPnl: decOr0(p.unrealizedPnl),
      realizedPnl: decOr0(p.realizedPnl),
      closedAt: iso(p.closedAt),
    })),
    orders: follow.copyOrders.map((o) => ({
      id: o.id,
      symbol: o.symbol,
      side: o.side,
      qty: decOr0(o.qty),
      status: o.status,
      filledQty: decOr0(o.filledQty),
      avgPrice: dec(o.avgPrice),
      slippageBps: dec(o.slippageBps),
      error: o.error,
      at: iso(o.requestedAt),
    })),
  };
}

export async function updateFollow(userId: string, id: string, input: UpdateFollowInput) {
  const follow = await prisma.follow.findFirst({ where: { id, followerUserId: userId } });
  if (!follow) throw new ApiError(404, 'Follow not found.');

  const data: Record<string, unknown> = {};
  if (input.status) {
    data.status = input.status;
    data.pausedAt = input.status === 'PAUSED' ? new Date() : null;
    data.stoppedAt = input.status === 'STOPPED' ? new Date() : null;
  }
  if (input.sizingMode) data.sizingMode = input.sizingMode;
  if (input.sizingValue !== undefined) data.sizingValue = input.sizingValue;
  if (input.maxPositionUsd !== undefined) data.maxPositionUsd = input.maxPositionUsd;
  if (input.dailyLossLimitUsd !== undefined) data.dailyLossLimitUsd = input.dailyLossLimitUsd;
  if (input.copyReverse !== undefined) data.copyReverse = input.copyReverse;

  await prisma.follow.update({ where: { id }, data });
  return { id };
}

// A user applies to list one of their own accounts as a leader (PENDING until
// an admin verifies). Ownership of the credential is enforced.
export async function applyAsLeader(userId: string, input: ApplyLeaderInput) {
  const cred = await prisma.exchangeCredential.findFirst({
    where: { id: input.credentialId, userId },
    include: { leaderProfile: true },
  });
  if (!cred) throw new ApiError(404, 'Connected account not found.');
  if (cred.leaderProfile) throw new ApiError(409, 'That account is already listed as a leader.');

  const leader = await prisma.leader.create({
    data: {
      userId,
      credentialId: cred.id,
      exchange: cred.exchange,
      displayName: input.displayName,
      bio: input.bio ?? null,
      status: 'PENDING',
    },
  });
  return { id: leader.id, status: leader.status };
}


/** Count copy orders for a follower since local midnight (for dashboard summary). */
export async function countTodayCopies(userId: string) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return prisma.copyOrder.count({
    where: {
      follow: { followerUserId: userId },
      requestedAt: { gte: start },
      status: { in: ['FILLED', 'SUBMITTED', 'PARTIAL'] },
    },
  });
}

const DAY_MS = 86_400_000;

/**
 * Rich analytics for the follower dashboard: 30-day copy history, fill/win
 * rates, a 14-day activity series, a cumulative-realized-P&L series (from closed
 * positions), a per-leader breakdown, and the most recent copies. All derived
 * from data we already store (CopyOrder / CopyPosition), no new tables.
 */
export async function getFollowerAnalytics(userId: string) {
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const from30 = new Date(now.getTime() - 30 * DAY_MS);

  const [orders, positions, follows] = await Promise.all([
    prisma.copyOrder.findMany({
      where: { follow: { followerUserId: userId }, requestedAt: { gte: from30 } },
      include: { follow: { select: { leader: { select: { displayName: true } } } } },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.copyPosition.findMany({
      where: { follow: { followerUserId: userId } },
      include: { follow: { select: { leader: { select: { displayName: true } } } } },
    }),
    prisma.follow.findMany({
      where: { followerUserId: userId, status: { not: 'STOPPED' } },
      select: { status: true },
    }),
  ]);

  const filled = orders.filter((o) => o.status === 'FILLED' || o.status === 'PARTIAL');
  const copiesToday = orders.filter((o) => o.requestedAt >= dayStart).length;
  const activeFollows = follows.filter((f) => f.status === 'ACTIVE').length;
  const openPnl = positions.filter((p) => !p.closedAt).reduce((s, p) => s + decOr0(p.unrealizedPnl), 0);
  const realizedPnl = positions.reduce((s, p) => s + decOr0(p.realizedPnl), 0);
  const closed = positions.filter((p) => p.closedAt);
  const wins = closed.filter((p) => decOr0(p.realizedPnl) > 0).length;

  // 14-day activity — copies placed per day (oldest→newest).
  const activity = Array.from({ length: 14 }, (_, i) => {
    const day = new Date(now.getTime() - (13 - i) * DAY_MS);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day.getTime() + DAY_MS);
    return {
      date: day.toISOString(),
      count: orders.filter((o) => o.requestedAt >= day && o.requestedAt < next).length,
    };
  });

  // Cumulative realized P&L, in the order positions closed.
  const closedSorted = closed
    .slice()
    .sort((a, b) => (a.closedAt!.getTime() - b.closedAt!.getTime()));
  let cum = 0;
  const pnlSeries = closedSorted.map((p) => {
    cum += decOr0(p.realizedPnl);
    return { at: iso(p.closedAt), value: Number(cum.toFixed(2)) };
  });

  // Per-leader breakdown.
  const byLeaderMap = new Map<string, { name: string; copies: number; openPnl: number; realizedPnl: number }>();
  const bump = (name: string) => {
    const e = byLeaderMap.get(name) ?? { name, copies: 0, openPnl: 0, realizedPnl: 0 };
    byLeaderMap.set(name, e);
    return e;
  };
  for (const p of positions) {
    const e = bump(p.follow.leader.displayName);
    e.openPnl += p.closedAt ? 0 : decOr0(p.unrealizedPnl);
    e.realizedPnl += decOr0(p.realizedPnl);
  }
  for (const o of orders) bump(o.follow.leader.displayName).copies += 1;
  const byLeader = [...byLeaderMap.values()]
    .map((e) => ({ ...e, openPnl: Number(e.openPnl.toFixed(2)), realizedPnl: Number(e.realizedPnl.toFixed(2)) }))
    .sort((a, b) => b.copies - a.copies || b.realizedPnl - a.realizedPnl);

  const recent = orders.slice(0, 40).map((o) => ({
    id: o.id,
    leader: o.follow.leader.displayName,
    symbol: o.symbol,
    side: o.side,
    qty: decOr0(o.qty),
    status: o.status,
    avgPrice: dec(o.avgPrice),
    slippageBps: dec(o.slippageBps),
    at: iso(o.requestedAt),
  }));

  return {
    summary: {
      totalCopies30d: orders.length,
      copiesToday,
      filledCount: filled.length,
      fillRate: orders.length ? Number(((filled.length / orders.length) * 100).toFixed(1)) : 0,
      activeFollows,
      openPnl: Number(openPnl.toFixed(2)),
      realizedPnl: Number(realizedPnl.toFixed(2)),
      winRate: closed.length ? Number(((wins / closed.length) * 100).toFixed(1)) : 0,
      closedCount: closed.length,
      wins,
    },
    activity,
    pnlSeries,
    byLeader,
    recent,
  };
}

/**
 * Analytics for a user who runs one or more leader accounts: equity curve,
 * follower count, copied volume and recent fills per leader profile they own.
 * Returns null when the user is not a leader.
 */
export async function getLeaderAnalytics(userId: string) {
  const leaders = await prisma.leader.findMany({
    where: { userId },
    include: {
      stats: { where: { window: 'all' } },
      equityPoints: { orderBy: { ts: 'desc' }, take: 90 },
      fills: { orderBy: { exchTs: 'desc' }, take: 15 },
      _count: { select: { follows: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (leaders.length === 0) return null;
  return leaders.map((l) => {
    const s = l.stats[0];
    const equitySeries = (l.equityPoints ?? []).slice().reverse().map((p) => decOr0(p.equityUsd));
    return {
      id: l.id,
      displayName: l.displayName,
      status: l.status,
      stats: {
        roiPct: dec(s?.roiPct) ?? 0,
        winRatePct: dec(s?.winRatePct) ?? 0,
        maxDrawdownPct: dec(s?.maxDrawdownPct) ?? 0,
        totalCopiedUsd: dec(s?.totalCopiedUsd) ?? 0,
        tradeCount: s?.tradeCount ?? 0,
        followerCount: s?.followerCount ?? 0,
      },
      equitySeries,
      latestEquity: equitySeries.length ? equitySeries[equitySeries.length - 1] : null,
      followers: l._count.follows,
      recentFills: l.fills.map((f) => ({
        id: f.id,
        symbol: f.symbol,
        side: f.side,
        qty: decOr0(f.qty),
        price: decOr0(f.priceUsd ?? f.price),
        reduceOnly: f.reduceOnly,
        at: iso(f.exchTs),
      })),
    };
  });
}

// ─── Admin ──────────────────────────────────────────────────────────────────

export async function registerLeader(input: RegisterLeaderInput) {
  const cred = await prisma.exchangeCredential.findUnique({ where: { id: input.credentialId }, include: { leaderProfile: true } });
  if (!cred) throw new ApiError(404, 'Credential not found.');
  if (cred.leaderProfile) throw new ApiError(409, 'That account is already a leader.');

  const leader = await prisma.leader.create({
    data: {
      userId: cred.userId,
      credentialId: cred.id,
      exchange: cred.exchange,
      displayName: input.displayName,
      bio: input.bio ?? null,
      status: 'PENDING',
    },
  });
  return { id: leader.id };
}

export async function listLeadersAdmin() {
  const leaders = await prisma.leader.findMany({
    include: { stats: { where: { window: 'all' } }, credential: { select: { label: true, keyLast4: true, userId: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return leaders.map((l) => ({
    ...serializeLeaderCard(l),
    bio: l.bio,
    account: { label: l.credential.label, keyLast4: l.credential.keyLast4 },
  }));
}

export async function setLeaderStatus(id: string, status: 'PENDING' | 'VERIFIED' | 'PAUSED' | 'DELISTED') {
  const leader = await prisma.leader.findUnique({ where: { id } });
  if (!leader) throw new ApiError(404, 'Leader not found.');
  await prisma.leader.update({ where: { id }, data: { status } });
  return { id, status, userId: leader.userId, displayName: leader.displayName };
}

export async function getKillSwitch(): Promise<boolean> {
  const row = await prisma.systemSetting.findUnique({ where: { key: 'killSwitch' } });
  return Boolean((row?.value as { enabled?: boolean } | undefined)?.enabled);
}

export async function setKillSwitch(enabled: boolean): Promise<boolean> {
  await prisma.systemSetting.upsert({
    where: { key: 'killSwitch' },
    update: { value: { enabled } },
    create: { key: 'killSwitch', value: { enabled } },
  });
  return enabled;
}
