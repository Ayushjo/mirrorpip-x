import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The DB + exchange packages ship raw TS via workspace exports; let Next
  // transpile them instead of expecting a prebuilt dist.
  transpilePackages: ['@mirrorpip/db', '@mirrorpip/exchange'],
  // Prisma's generated client is a server-only external (Next 15 top-level key).
  serverExternalPackages: ['@prisma/client'],
  // Our code + workspace packages use NodeNext-style ".js" specifiers that point
  // at ".ts" sources. Teach webpack to resolve them so both the app and the
  // transpiled @mirrorpip/* packages build.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default nextConfig;
