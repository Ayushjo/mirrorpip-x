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
    // First consent wins: don't overwrite previously-recorded acceptance
    // timestamps (the audit trail should reflect when the user first agreed).
    await prisma.user.update({
      where: { id: user.id },
      data: {
        tosAcceptedAt: user.tosAcceptedAt ?? now,
        riskDisclosureAcceptedAt: user.riskDisclosureAcceptedAt ?? now,
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
