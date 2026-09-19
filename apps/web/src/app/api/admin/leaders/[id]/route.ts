import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { leaderStatusSchema } from '@/lib/validation';
import { setLeaderStatus } from '@/lib/services/copy';
import { logAdminAction } from '@/lib/services/admin';
import { notifyUser } from '@/lib/services/notify';

export const runtime = 'nodejs';

export function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { status } = leaderStatusSchema.parse(await req.json());
    const result = await setLeaderStatus(id, status);

    await logAdminAction({
      action: `leader.${status.toLowerCase()}`,
      actor: admin,
      targetType: 'leader',
      targetId: id,
      details: { displayName: result.displayName },
    });
    if (status === 'VERIFIED') {
      void notifyUser(result.userId, {
        kind: 'leader.verified',
        title: 'Your leader application was approved',
        body: `${result.displayName} is now live on the leaderboard and can be followed.`,
        href: `/leaders/${result.id}`,
      });
    }

    return ok(result);
  });
}
