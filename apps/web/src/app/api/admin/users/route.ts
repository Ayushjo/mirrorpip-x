import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { listUsers } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(req: NextRequest): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const search = req.nextUrl.searchParams.get('q')?.slice(0, 100);
    return ok(await listUsers(search || undefined));
  });
}
