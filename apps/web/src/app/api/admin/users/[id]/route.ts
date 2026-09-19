import type { NextRequest } from 'next/server';
import { ApiError, ok, requireAdmin, route } from '@/lib/api';
import { getUserDossier } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const { id } = await ctx.params;
    const dossier = await getUserDossier(id);
    if (!dossier) throw new ApiError(404, 'User not found.');
    return ok(dossier);
  });
}
