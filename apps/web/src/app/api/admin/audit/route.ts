import { ok, requireAdmin, route } from '@/lib/api';
import { listAuditLog } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok(await listAuditLog());
  });
}
