import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { applyLeaderSchema } from '@/lib/validation';
import { applyAsLeader } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const input = applyLeaderSchema.parse(await req.json());
    return ok(await applyAsLeader(user.id, input), 201);
  });
}
