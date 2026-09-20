import Redis from 'ioredis';

// Lazily-created shared Redis client. Reused across HMR reloads in dev. Returns
// null when REDIS_URL isn't set, so callers transparently fall back to their
// in-memory cache. All errors are swallowed — Redis is an optional accelerator,
// never a hard dependency of a request.
const g = globalThis as unknown as { __redis?: Redis | null };

export function getRedis(): Redis | null {
  if (g.__redis !== undefined) return g.__redis;
  const url = process.env.REDIS_URL || process.env.REDIS_PUBLIC_URL;
  if (!url) {
    g.__redis = null;
    return null;
  }
  try {
    const client = new Redis(url, {
      maxRetriesPerRequest: 2,
      enableOfflineQueue: false, // fail fast instead of queueing when down
      connectTimeout: 4000,
      lazyConnect: false,
    });
    client.on('error', () => {
      /* swallow — cache helper falls back to memory/loader */
    });
    g.__redis = client;
  } catch {
    g.__redis = null;
  }
  return g.__redis;
}
