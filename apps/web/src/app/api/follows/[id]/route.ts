import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { updateFollowSchema } from '@/lib/validation';
import { getFollowDetail, updateFollow } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    return ok(await getFollowDetail(user.id, id));
  });
}

export function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const input = updateFollowSchema.parse(await req.json());
    return ok(await updateFollow(user.id, id, input));
  });
}
