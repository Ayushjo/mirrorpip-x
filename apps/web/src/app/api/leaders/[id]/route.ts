import { ok, route } from '@/lib/api';
import { getLeaderPublic } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function GET(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const { id } = await ctx.params;
    return ok(await getLeaderPublic(id));
  });
}
