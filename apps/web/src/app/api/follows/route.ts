import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { createFollowSchema } from '@/lib/validation';
import { createFollow, listFollows } from '@/lib/services/copy';
import { assertAccess } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    return ok(await listFollows(user.id));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    await assertAccess(user);
    const input = createFollowSchema.parse(await req.json());
    return ok(await createFollow(user.id, input), 201);
  });
}
