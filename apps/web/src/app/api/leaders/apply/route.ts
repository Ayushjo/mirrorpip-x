import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { applyLeaderSchema } from '@/lib/validation';
import { applyAsLeader } from '@/lib/services/copy';
import { assertAccess } from '@/lib/services/admin';
import { notifyAdmins } from '@/lib/services/notify';

export const runtime = 'nodejs';

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    await assertAccess(user);
    const input = applyLeaderSchema.parse(await req.json());
    const leader = await applyAsLeader(user.id, input);
    void notifyAdmins({
      kind: 'leader.application',
      title: 'New leader application',
      body: `${user.name} (${user.email}) applied as "${input.displayName}".`,
      href: '/admin',
    });
    return ok(leader, 201);
  });
}
