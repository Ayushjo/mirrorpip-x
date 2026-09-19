import { prisma, type Leader } from '@belivemeguys/db';
import { ExchangeAuthError, type FillStream, getExchange } from '@belivemeguys/exchange';
import { toApiCreds } from './creds.js';
import { fanoutLeaderFill } from './fanout.js';
import { log } from './log.js';

interface Watcher {
  stream: FillStream | null;
  starting: boolean;
  failUntil: number; // backoff: don't retry before this timestamp
  credentialId: string;
}

const watchers = new Map<string, Watcher>();
const BACKOFF_MS = 10_000;

/**
 * Reconcile the set of live WebSocket watchers with the DB: one watcher per
 * VERIFIED leader that has at least one ACTIVE follower. Starts new ones, stops
 * stale ones, and honours a per-leader backoff after a transport failure.
 */
export async function syncWatchers(): Promise<void> {
  const leaders = await prisma.leader.findMany({
    where: { status: 'VERIFIED', follows: { some: { status: 'ACTIVE' } } },
  });
  const wanted = new Set(leaders.map((l) => l.id));

  // Stop watchers no longer wanted.
  for (const [leaderId, w] of watchers) {
    if (!wanted.has(leaderId)) {
      w.stream?.close();
      watchers.delete(leaderId);
      log.info('stopped leader watcher', { leaderId });
    }
  }

  // Start/refresh wanted watchers.
  for (const leader of leaders) {
    const existing = watchers.get(leader.id);
    if (existing && (existing.stream || existing.starting || Date.now() < existing.failUntil)) continue;
    // Restart if the credential changed.
    if (existing && existing.credentialId !== leader.credentialId) {
      existing.stream?.close();
      watchers.delete(leader.id);
    }
    await startWatcher(leader);
  }
}

async function startWatcher(leader: Leader): Promise<void> {
  const state: Watcher = watchers.get(leader.id) ?? { stream: null, starting: false, failUntil: 0, credentialId: leader.credentialId };
  state.starting = true;
  state.credentialId = leader.credentialId;
  watchers.set(leader.id, state);

  try {
    const cred = await prisma.exchangeCredential.findUnique({ where: { id: leader.credentialId } });
    if (!cred) throw new Error('leader credential missing');

    const exchange = getExchange(leader.exchange);
    const stream = await exchange.streamFills(toApiCreds(cred), {
      onFill: (fill) => {
        fanoutLeaderFill(leader, fill).catch((err) => log.error('fanout threw', { leaderId: leader.id, err: String(err) }));
      },
      onError: (err) => {
        log.warn('leader watcher error — will reconnect', { leaderId: leader.id, err: err.message });
        const w = watchers.get(leader.id);
        if (w) {
          w.stream?.close();
          w.stream = null;
          w.starting = false;
          w.failUntil = Date.now() + BACKOFF_MS;
        }
      },
    });

    state.stream = stream;
    state.starting = false;
    state.failUntil = 0;
    log.info('started leader watcher', { leaderId: leader.id, displayName: leader.displayName });

    // Backfill: replay recent fills so anything placed while we were disconnected
    // is copied. fanout is idempotent (unique fill + clientOrderId) and copy-from-now
    // skips fills older than each follow, so replay is safe.
    exchange
      .getRecentFills(toApiCreds(cred), 50)
      .then((fills) => Promise.allSettled(fills.map((f) => fanoutLeaderFill(leader, f))))
      .catch((err) => log.debug('backfill failed', { leaderId: leader.id, err: String(err) }));
  } catch (err) {
    if (err instanceof ExchangeAuthError) {
      await prisma.$transaction([
        prisma.exchangeCredential.update({ where: { id: leader.credentialId }, data: { status: 'INVALID', lastError: 'Credentials were rejected. Reconnect this account.' } }),
        prisma.follow.updateMany({ where: { leaderId: leader.id, status: 'ACTIVE' }, data: { status: 'PAUSED', pausedAt: new Date() } }),
        prisma.notification.create({
          data: {
            userId: leader.userId,
            kind: 'credential.invalid',
            title: 'Your leader account connection was rejected',
            body: `The API credentials for "${leader.displayName}" were rejected by the exchange, so copying paused. Reconnect the account to resume.`,
            href: '/connect',
          },
        }),
      ]).catch(() => undefined);
    }
    state.stream = null;
    state.starting = false;
    state.failUntil = Date.now() + BACKOFF_MS;
    log.error('failed to start leader watcher', { leaderId: leader.id, err: String(err) });
  }
}

export function stopAllWatchers(): void {
  for (const [, w] of watchers) w.stream?.close();
  watchers.clear();
}

export function watcherCount(): number {
  let live = 0;
  for (const [, w] of watchers) if (w.stream) live++;
  return live;
}
