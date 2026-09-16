import { ok, route } from '@/lib/api';
import { listLeaders } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => ok(await listLeaders()));
}
