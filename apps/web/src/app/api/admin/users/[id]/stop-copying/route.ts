import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { stopUserCopying } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    return ok(await stopUserCopying(admin, id));
  });
}
