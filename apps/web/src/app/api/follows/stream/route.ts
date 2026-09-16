import { getSessionUser } from '@/lib/session';
import { sseStream } from '@/lib/sse';
import { listFollows } from '@/lib/services/copy';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Live stream of the signed-in user's follows (dashboard list).
export async function GET(req: Request): Promise<Response> {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });
  return sseStream(req, () => listFollows(user.id));
}
