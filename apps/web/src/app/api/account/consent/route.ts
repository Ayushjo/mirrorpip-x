import { prisma } from '@mirrorpip/db';
import { ok, requireUser, route, ApiError } from '@/lib/api';
import { consentSchema } from '@/lib/validation';

export const runtime = 'nodejs';

/** Records ToS + risk consent server-side (OAuth signups skip the signup form). */
export function POST(req: Request): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const input = consentSchema.parse(await req.json().catch(() => ({})));
    if (!input.agreeTos || !input.agreeRisk) {
      throw new ApiError(400, 'Both consents are required to continue.');
    }
    const now = new Date();
    // First consent wins, atomically: conditional updateMany means concurrent
    // first-consent requests can't overwrite the true acceptance timestamp.
    await prisma.user.updateMany({ where: { id: user.id, tosAcceptedAt: null }, data: { tosAcceptedAt: now } });
    await prisma.user.updateMany({ where: { id: user.id, riskDisclosureAcceptedAt: null }, data: { riskDisclosureAcceptedAt: now } });
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
    return ok({ done: true });
  });
}
