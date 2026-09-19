import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { emailOTP } from 'better-auth/plugins';
import { prisma } from '@mirrorpip/db';
import { sendEmail, verificationOtpEmail, resetPasswordOtpEmail, welcomeEmail } from './email.js';
import { geocodeUserIfNeeded } from './geocode.js';

// Email + password auth backed by our Prisma models (user/session/account/
// verification). Email verification is required via 6-digit OTP; without
// RESEND_API_KEY the OTP is printed to the server console so local dev still
// works.
// Origins allowed to call the auth endpoints. In prod this is the deployed
// app URL; in dev we also allow common localhost ports (incl. preview ports).
const trustedOrigins = Array.from(
  new Set(
    [
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.TRUSTED_ORIGINS?.split(',') ?? []),
      ...(process.env.NODE_ENV !== 'production'
        ? ['http://localhost:3000', 'http://localhost:3100', 'http://localhost:3009']
        : []),
    ]
      .map((o) => o?.trim())
      .filter((o): o is string => Boolean(o)),
  ),
);

const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
if (process.env.NODE_ENV === 'production' && googleEnabled && (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET)) {
  throw new Error('Google authentication is enabled, but GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is missing.');
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
  },
  emailVerification: {
    autoSignInAfterVerification: true,
    afterEmailVerification: async (user: { id: string; email: string; name?: string | null }) => {
      try {
        await sendEmail({ to: user.email, ...welcomeEmail(user.name ?? '') });
      } catch (err) {
        console.error('[auth] welcome email failed', { userId: user.id, err: String(err) });
      }
    },
  },
  socialProviders: googleEnabled && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: false,
      trustedProviders: [],
    },
  },
  user: {
    additionalFields: {
      role: { type: 'string', required: false, defaultValue: 'user', input: false },
      country: { type: 'string', required: false, input: true },
      city: { type: 'string', required: false, input: true },
      postalCode: { type: 'string', required: false, input: true },
      phone: { type: 'string', required: false, input: true },
      intendedRole: { type: 'string', required: false, input: true },
      referralCode: { type: 'string', required: false, input: true },
      tosAcceptedAt: { type: 'date', required: false, input: true },
      riskDisclosureAcceptedAt: { type: 'date', required: false, input: true },
      lat: { type: 'number', required: false, input: false },
      lng: { type: 'number', required: false, input: false },
      locationUpdatedAt: { type: 'date', required: false, input: false },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Consent timestamps are compliance records — mint them server-side.
          // Clients only signal that the boxes were checked; a truthy value is
          // replaced with the server clock so forged dates can't be stored.
          // Social signups send neither flag: they stay null and the consent
          // gate (/complete-profile) collects them before app use.
          const u = user as typeof user & { tosAcceptedAt?: Date | null; riskDisclosureAcceptedAt?: Date | null };
          return {
            data: {
              ...u,
              tosAcceptedAt: u.tosAcceptedAt ? new Date() : null,
              riskDisclosureAcceptedAt: u.riskDisclosureAcceptedAt ? new Date() : null,
            },
          };
        },
        after: async (user) => {
          void geocodeUserIfNeeded(user.id).catch((err) => {
            console.warn('[auth] post-signup geocode failed', { userId: user.id, err: String(err) });
          });
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  plugins: [
    nextCookies(),
    emailOTP({
      otpLength: 6,
      expiresIn: 60 * 10,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const mail = type === 'forget-password' ? resetPasswordOtpEmail(otp) : verificationOtpEmail(otp);
        await sendEmail({ to: email, ...mail });
      },
    }),
  ],
});

export type Auth = typeof auth;
