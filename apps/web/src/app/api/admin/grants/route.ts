import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { createGrantSchema } from '@/lib/validation';
import { createGrant, listGrants, logAdminAction } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok(await listGrants());
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const input = createGrantSchema.parse(await req.json());
    const grant = await createGrant(admin, input.email, input.note);
    await logAdminAction({
      action: 'grant.created',
      actor: admin,
      targetType: 'access_grant',
      targetId: grant.id,
      details: { email: input.email, note: input.note },
    });
    return ok(grant, 201);
  });
}
