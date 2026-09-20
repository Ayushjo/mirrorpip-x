import { getRedis } from './redis.js';

// Two-tier cache: Redis (shared across instances, survives restarts) with an
// in-process memory tier in front for zero-latency repeat hits and as a fallback
// when Redis is unavailable. Values are JSON-serialized, so cache plain
// serialized data (numbers/strings), not Prisma Decimal/Date objects.
type MemEntry = { value: string; expiresAt: number };
const g = globalThis as unknown as { __memCache?: Map<string, MemEntry> };
const mem: Map<string, MemEntry> = (g.__memCache ??= new Map());

export async function cached<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();

  // 1. In-process memory (fastest).
  const m = mem.get(key);
  if (m && m.expiresAt > now) {
    try {
      return JSON.parse(m.value) as T;
    } catch {
      /* fall through */
    }
  }

  // 2. Redis (shared).
  const redis = getRedis();
  if (redis) {
    try {
      const hit = await redis.get(key);
      if (hit != null) {
        mem.set(key, { value: hit, expiresAt: now + ttlSeconds * 1000 });
        return JSON.parse(hit) as T;
      }
    } catch {
      /* fall through to loader */
    }
  }

  // 3. Miss — load, then populate both tiers.
  const value = await loader();
  const serialized = JSON.stringify(value);
  mem.set(key, { value: serialized, expiresAt: now + ttlSeconds * 1000 });
  if (redis) {
    try {
      await redis.set(key, serialized, 'EX', ttlSeconds);
    } catch {
      /* memory tier still holds it */
    }
  }
  return value;
}

/** Invalidate a key in both tiers (call after a write that changes it). */
export async function bust(key: string): Promise<void> {
  mem.delete(key);
  const redis = getRedis();
  if (redis) {
    try {
      await redis.del(key);
    } catch {
      /* ignore */
    }
  }
}
