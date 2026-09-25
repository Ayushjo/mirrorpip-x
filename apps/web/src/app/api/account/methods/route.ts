import { prisma } from '@belivemeguys/db';
import { ok, requireUser, route } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * Which sign-in methods are linked to this account. `credential` = email/password,
 * `google` = the Google social provider (better-auth Account.providerId).
 */
export function GET(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const accounts = await prisma.account.findMany({
      where: { userId: user.id },
      select: { providerId: true },
    });
    const providers = new Set(accounts.map((a) => a.providerId));
    return ok({
      password: providers.has('credential'),
      google: { connected: providers.has('google') },
    });
  });
}
