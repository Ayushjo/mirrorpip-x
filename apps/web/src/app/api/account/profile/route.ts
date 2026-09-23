import { prisma } from '@belivemeguys/db';
import { ok, requireUser, route } from '@/lib/api';
import { profileSchema } from '@/lib/validation';
import { geocodeUserIfNeeded } from '@/lib/geocode';

export const runtime = 'nodejs';

/**
 * Save editable profile fields from /profile: identity (name, bio), location &
 * contact, and — if the user owns one — their leader profile (display name, bio,
 * leaderboard visibility). Location edits re-trigger geocoding for the admin map.
 */
export function PATCH(req: Request): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const input = profileSchema.parse(await req.json().catch(() => ({})));

    const current = await prisma.user.findUnique({
      where: { id: user.id },
      select: { country: true, city: true, postalCode: true },
    });
    const locationChanged =
      (input.country || '') !== (current?.country ?? '') ||
      (input.city || '') !== (current?.city ?? '') ||
      (input.postalCode || '') !== (current?.postalCode ?? '');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        name: input.name,
        bio: input.bio || null,
        country: input.country || null,
        city: input.city || null,
        postalCode: input.postalCode || null,
        phone: input.phone || null,
        // Clear the geocode gate so the location re-resolves below.
        ...(locationChanged ? { locationUpdatedAt: null } : {}),
      },
    });

    if (input.leader) {
      const leader = await prisma.leader.findFirst({ where: { userId: user.id }, select: { id: true } });
      if (leader) {
        await prisma.leader.update({
          where: { id: leader.id },
          data: {
            displayName: input.leader.displayName,
            bio: input.leader.bio || null,
            listed: input.leader.listed,
          },
        });
      }
    }

    if (locationChanged) void geocodeUserIfNeeded(user.id);
    return ok({ done: true });
  });
}
