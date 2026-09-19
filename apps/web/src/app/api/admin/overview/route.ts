import { ok, requireAdmin, route } from '@/lib/api';
import { getAdminOverview } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok(await getAdminOverview());
  });
}
