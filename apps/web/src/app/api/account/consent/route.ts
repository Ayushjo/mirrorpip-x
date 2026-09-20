import { prisma } from '@belivemeguys/db';
import { ok, requireUser, route, ApiError } from '@/lib/api';
import { consentSchema } from '@/lib/validation';
import { geocodeUserIfNeeded } from '@/lib/geocode';

export const runtime = 'nodejs';

/**
 * Completes onboarding: records ToS + risk consent (OAuth signups and, now,
 * the compulsory post-verification profile step) and the user's location/role.
 * Consent checkboxes are only required from users who haven't already accepted
 * (email signups accept at registration, then finish location here).
 */
export function POST(req: Request): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const input = consentSchema.parse(await req.json().catch(() => ({})));

    const existing = await prisma.user.findUnique({
      where: { id: user.id },
      select: { tosAcceptedAt: true, riskDisclosureAcceptedAt: true },
    });
    const alreadyConsented = Boolean(existing?.tosAcceptedAt && existing?.riskDisclosureAcceptedAt);
    if (!alreadyConsented && (!input.agreeTos || !input.agreeRisk)) {
      throw new ApiError(400, 'Both consents are required to continue.');
    }

    const now = new Date();
    // First consent wins, atomically: conditional updateMany means concurrent
    // first-consent requests can't overwrite the true acceptance timestamp.
    if (input.agreeTos) {
      await prisma.user.updateMany({ where: { id: user.id, tosAcceptedAt: null }, data: { tosAcceptedAt: now } });
    }
    if (input.agreeRisk) {
      await prisma.user.updateMany({ where: { id: user.id, riskDisclosureAcceptedAt: null }, data: { riskDisclosureAcceptedAt: now } });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.country ? { country: input.country } : {}),
        ...(input.city ? { city: input.city } : {}),
        ...(input.postalCode ? { postalCode: input.postalCode } : {}),
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.intendedRole ? { intendedRole: input.intendedRole } : {}),
      },
    });
    // Location was just filled in — geocode for the admin map (best-effort).
    if (input.city || input.postalCode || input.country) {
      void geocodeUserIfNeeded(user.id);
    }
    return ok({ done: true });
  });
}
