import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { revokeGrant, logAdminAction } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    await revokeGrant(id);
    await logAdminAction({ action: 'grant.revoked', actor: admin, targetType: 'access_grant', targetId: id });
    return ok({ id });
  });
}
