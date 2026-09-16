import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { prisma } from '@mirrorpip/db';

// Email + password auth backed by our Prisma models (user/session/account/
// verification). Email verification is off for the MVP so signups are instant;
// enable it before a public launch.
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
