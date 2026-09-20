import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';

// Load the monorepo-root .env regardless of where the engine is launched from.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });

import { prisma } from '@belivemeguys/db';
import { syncWatchers, stopAllWatchers, watcherCount } from './watchers.js';
import { reconcile } from './reconcile.js';
import { pruneUsage } from './prune.js';
import { log } from './log.js';

const SYNC_MS = Number(process.env.ENGINE_SYNC_INTERVAL_MS ?? 5000);
const RECONCILE_MS = Number(process.env.ENGINE_RECONCILE_INTERVAL_MS ?? 30_000);
const PRUNE_MS = Number(process.env.ENGINE_PRUNE_INTERVAL_MS ?? 6 * 3600_000);

function requireEnv(): void {
  const missing = ['DATABASE_URL', 'CREDENTIAL_ENCRYPTION_KEY'].filter((k) => !process.env[k]);
  if (missing.length > 0) {
    log.error('missing required env — engine cannot start', { missing });
    process.exit(1);
  }
}

async function safe(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (err) {
    log.error(`${name} loop error`, { err: String(err) });
  }
}

async function main(): Promise<void> {
  requireEnv();
  log.info('copy engine starting', { syncMs: SYNC_MS, reconcileMs: RECONCILE_MS });

  await safe('initial-sync', syncWatchers);

  const syncTimer = setInterval(() => void safe('sync', syncWatchers), SYNC_MS);
  const reconcileTimer = setInterval(() => void safe('reconcile', reconcile), RECONCILE_MS);
  const pruneTimer = setInterval(() => void safe('prune', pruneUsage), PRUNE_MS);
  const heartbeat = setInterval(() => log.info('heartbeat', { liveWatchers: watcherCount() }), 60_000);
  // Run one prune shortly after boot so retention takes effect without waiting a full cycle.
  setTimeout(() => void safe('prune', pruneUsage), 10_000);

  const shutdown = async (sig: string): Promise<void> => {
    log.info('shutting down', { sig });
    clearInterval(syncTimer);
    clearInterval(reconcileTimer);
    clearInterval(pruneTimer);
    clearInterval(heartbeat);
    stopAllWatchers();
    await prisma.$disconnect().catch(() => undefined);
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

main().catch((err) => {
  log.error('fatal', { err: String(err) });
  process.exit(1);
});
