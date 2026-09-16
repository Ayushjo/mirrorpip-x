import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { leaderStatusSchema } from '@/lib/validation';
import { setLeaderStatus } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const { id } = await ctx.params;
    const { status } = leaderStatusSchema.parse(await req.json());
    return ok(await setLeaderStatus(id, status));
  });
}
