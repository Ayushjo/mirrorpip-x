import { z } from 'zod';

export const connectCredentialSchema = z.object({
  exchange: z.enum(['DELTA_INDIA']).default('DELTA_INDIA'),
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
