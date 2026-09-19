import { prisma } from '@belivemeguys/db';

// Global kill-switch, stored as a SystemSetting row so admins can flip it from
// the web app. Cached briefly so a hot fan-out loop doesn't hammer the DB.
let cached: { value: boolean; at: number } | null = null;
const TTL_MS = 2000;

export async function isKillSwitchOn(): Promise<boolean> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  const row = await prisma.systemSetting.findUnique({ where: { key: 'killSwitch' } }).catch(() => null);
  const enabled = Boolean((row?.value as { enabled?: boolean } | undefined)?.enabled);
  cached = { value: enabled, at: Date.now() };
  return enabled;
}
