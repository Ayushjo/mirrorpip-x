import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { betaModeSchema, maintenanceSchema } from '@/lib/validation';
import { getBetaMode, getMaintenanceMode, logAdminAction, setBetaMode, setMaintenanceMode } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const [maintenance, betaMode] = await Promise.all([getMaintenanceMode(), getBetaMode()]);
    return ok({ maintenance, betaMode: betaMode.enabled });
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const admin = await requireAdmin();
    const body = (await req.json()) as Record<string, unknown>;
    if ('betaMode' in body) {
      const { enabled } = betaModeSchema.parse({ enabled: body.betaMode });
      await setBetaMode(enabled);
      await logAdminAction({
        action: enabled ? 'beta_mode.enabled' : 'beta_mode.disabled',
        actor: admin,
        targetType: 'system_setting',
        targetId: 'betaMode',
      });
    }
    if ('maintenance' in body) {
      const m = maintenanceSchema.parse(body.maintenance);
      await setMaintenanceMode(m);
      await logAdminAction({
        action: m.enabled ? 'maintenance.enabled' : 'maintenance.disabled',
        actor: admin,
        targetType: 'system_setting',
        targetId: 'maintenance',
        details: { message: m.message },
      });
    }
    const [maintenance, betaMode] = await Promise.all([getMaintenanceMode(), getBetaMode()]);
    return ok({ maintenance, betaMode: betaMode.enabled });
  });
}
