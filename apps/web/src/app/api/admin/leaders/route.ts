import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { registerLeaderSchema } from '@/lib/validation';
import { listLeadersAdmin, registerLeader } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok(await listLeadersAdmin());
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const input = registerLeaderSchema.parse(await req.json());
    return ok(await registerLeader(input), 201);
  });
}
