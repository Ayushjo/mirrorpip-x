import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { killSwitchSchema } from '@/lib/validation';
import { getKillSwitch, setKillSwitch } from '@/lib/services/copy';
import { logAdminAction } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok({ enabled: await getKillSwitch() });
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const { enabled } = killSwitchSchema.parse(await req.json());
    const result = await setKillSwitch(enabled);
    await logAdminAction({
      action: enabled ? 'kill_switch.enabled' : 'kill_switch.disabled',
      actor: admin,
      targetType: 'system_setting',
      targetId: 'killSwitch',
    });
    return ok({ enabled: result });
  });
}
