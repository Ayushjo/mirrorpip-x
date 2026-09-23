import { z } from 'zod';

export const connectCredentialSchema = z.object({
  // BYBIT is reserved in the schema enum but has no adapter — reject it here.
  exchange: z.literal('DELTA_INDIA').default('DELTA_INDIA'),
  tradeCurrency: z.enum(['USDT', 'INR']).default('USDT'),
  settings: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  label: z.string().trim().min(1).max(40).default('My account'),
  apiKey: z.string().trim().min(8, 'API key looks too short.').max(200),
  apiSecret: z.string().trim().min(8, 'API secret looks too short.').max(400),
});
export type ConnectCredentialInput = z.infer<typeof connectCredentialSchema>;

export const createFollowSchema = z.object({
  leaderId: z.string().min(1),
  credentialId: z.string().min(1),
  sizingMode: z.enum(['PROPORTIONAL', 'FIXED_MARGIN', 'MULTIPLIER']).default('PROPORTIONAL'),
  sizingValue: z.number().positive().max(1000).default(1),
  maxPositionUsd: z.number().positive().max(10_000_000).nullable().optional(),
  dailyLossLimitUsd: z.number().positive().max(10_000_000).nullable().optional(),
  copyReverse: z.boolean().default(false),
});
export type CreateFollowInput = z.infer<typeof createFollowSchema>;

export const updateFollowSchema = z.object({
  status: z.enum(['ACTIVE', 'PAUSED', 'STOPPED']).optional(),
  sizingMode: z.enum(['PROPORTIONAL', 'FIXED_MARGIN', 'MULTIPLIER']).optional(),
  sizingValue: z.number().positive().max(1000).optional(),
  maxPositionUsd: z.number().positive().max(10_000_000).nullable().optional(),
  dailyLossLimitUsd: z.number().positive().max(10_000_000).nullable().optional(),
  copyReverse: z.boolean().optional(),
});
export type UpdateFollowInput = z.infer<typeof updateFollowSchema>;

export const registerLeaderSchema = z.object({
  credentialId: z.string().min(1),
  displayName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional(),
});
export type RegisterLeaderInput = z.infer<typeof registerLeaderSchema>;

// A user applying to have one of their own accounts listed as a leader.
export const applyLeaderSchema = z.object({
  credentialId: z.string().min(1),
  displayName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(500).optional(),
});
export type ApplyLeaderInput = z.infer<typeof applyLeaderSchema>;

export const leaderStatusSchema = z.object({
  status: z.enum(['PENDING', 'VERIFIED', 'PAUSED', 'DELISTED']),
});

export const killSwitchSchema = z.object({ enabled: z.boolean() });

export const heartbeatSchema = z.object({
  path: z.string().max(200).optional(),
  feature: z.string().max(64).optional(),
  clientId: z.string().max(64).optional(),
  type: z.enum(['page_view', 'heartbeat', 'session_end']).optional(),
  ended: z.boolean().default(false),
});
export type HeartbeatInput = z.infer<typeof heartbeatSchema>;

export const createGrantSchema = z.object({
  email: z.string().trim().email().max(200),
  note: z.string().trim().max(300).default(''),
});
export type CreateGrantInput = z.infer<typeof createGrantSchema>;

export const maintenanceSchema = z.object({
  enabled: z.boolean(),
  message: z.string().trim().max(300).default(''),
});

export const betaModeSchema = z.object({ enabled: z.boolean() });

export const consentSchema = z.object({
  // Optional: users who already accepted at signup finish only their location here.
  agreeTos: z.boolean().optional().default(false),
  agreeRisk: z.boolean().optional().default(false),
  country: z.string().trim().length(2).optional(),
  city: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  phone: z.string().trim().max(30).optional(),
  intendedRole: z.enum(['follower', 'leader', 'both']).optional(),
});

// Editable profile fields from /profile. `country` allows '' (cleared select).
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(40),
  bio: z.string().trim().max(160).optional().default(''),
  country: z.union([z.string().trim().length(2), z.literal('')]).optional().default(''),
  city: z.string().trim().max(100).optional().default(''),
  postalCode: z.string().trim().max(20).optional().default(''),
  phone: z.string().trim().max(30).optional().default(''),
  leader: z
    .object({
      displayName: z.string().trim().min(2).max(60),
      bio: z.string().trim().max(160).optional().default(''),
      listed: z.boolean(),
    })
    .nullish(),
});

// A cropped avatar as a small base64 data URL produced client-side.
export const avatarSchema = z.object({
  image: z
    .string()
    .regex(/^data:image\/(webp|png|jpeg);base64,/, 'Expected a base64 image data URL.')
    .max(120_000, 'Image is too large.'),
});
