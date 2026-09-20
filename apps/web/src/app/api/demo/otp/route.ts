import type { NextRequest } from 'next/server';
import { prisma } from '@belivemeguys/db';
import { ApiError, ok, route } from '@/lib/api';

export const runtime = 'nodejs';

/**
 * DEMO-ONLY backdoor: returns the current email-verification OTP for an address so
 * the verify screen can accept any typed code during a live demo. Guarded by the
 * DEMO_OTP_BYPASS env flag — it 404s (and this whole path is inert) unless the flag
 * is explicitly "true". DO NOT enable in production; delete when the demo is over.
 */
export function GET(req: NextRequest): Promise<Response> {
  return route(async () => {
    if (process.env.DEMO_OTP_BYPASS !== 'true') throw new ApiError(404, 'Not found.');
    const email = req.nextUrl.searchParams.get('email')?.trim();
    if (!email) throw new ApiError(400, 'email is required.');
    // better-auth lowercases the email in the verification identifier, so match
    // case-insensitively — otherwise a typed "Foo@x.com" misses "foo@x.com".
    const row = await prisma.verification.findFirst({
      where: { identifier: { contains: email, mode: 'insensitive' } },
      orderBy: { createdAt: 'desc' },
    });
    // Stored as "<otp>:<attempts>" — pull the first 6-digit run.
    const otp = row?.value?.match(/\d{6}/)?.[0] ?? null;
    return ok({ otp });
  });
}
