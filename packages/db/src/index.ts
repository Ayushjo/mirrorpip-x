import { PrismaClient } from '../generated/client/index.js';

// Single shared Prisma client. In dev, reuse across HMR reloads to avoid
// exhausting the connection pool.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Re-export the generated types + enums so consumers import everything from
// "@mirrorpip/db" and never reach into the generated folder directly.
export * from '../generated/client/index.js';
