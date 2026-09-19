import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { heartbeatSchema } from '@/lib/validation';
import { recordHeartbeat } from '@/lib/services/usage';

export const runtime = 'nodejs';

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const input = heartbeatSchema.parse(await req.json().catch(() => ({})));
    return ok(
      await recordHeartbeat(user.id, {
        ...input,
        userAgent: req.headers.get('user-agent')?.slice(0, 300),
      }),
    );
  });
}
