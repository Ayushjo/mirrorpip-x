import { getSessionUser } from '@/lib/session';
import { sseStream } from '@/lib/sse';
import { getFollowDetail } from '@/lib/services/copy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Live stream of one follow's positions + copy-order log (follow detail page).
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  const { id } = await ctx.params;
  return sseStream(req, () => getFollowDetail(user.id, id));
}
