import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The DB + exchange packages ship raw TS via workspace exports; let Next
  // transpile them instead of expecting a prebuilt dist.
  transpilePackages: ['@mirrorpip/db', '@mirrorpip/exchange'],
  // Prisma's generated client is a server-only external (Next 15 top-level key).
  serverExternalPackages: ['@prisma/client'],
};

export default nextConfig;
