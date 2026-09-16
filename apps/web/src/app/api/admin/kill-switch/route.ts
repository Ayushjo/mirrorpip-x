import type { NextRequest } from 'next/server';
import { ok, requireAdmin, route } from '@/lib/api';
import { killSwitchSchema } from '@/lib/validation';
import { getKillSwitch, setKillSwitch } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    return ok({ enabled: await getKillSwitch() });
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    await requireAdmin();
    const { enabled } = killSwitchSchema.parse(await req.json());
    return ok({ enabled: await setKillSwitch(enabled) });
  });
}
