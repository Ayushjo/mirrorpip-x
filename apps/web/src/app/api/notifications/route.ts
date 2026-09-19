import { ok, requireUser, route } from '@/lib/api';
import { listNotifications, markNotificationsRead } from '@/lib/services/notify';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    return ok(await listNotifications(user.id));
  });
}

export function POST(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    await markNotificationsRead(user.id);
    return ok({ read: true });
  });
}
