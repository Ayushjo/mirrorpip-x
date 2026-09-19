import type { NextRequest } from 'next/server';
import { ok, requireUser, route } from '@/lib/api';
import { connectCredentialSchema } from '@/lib/validation';
import { addCredential, listCredentials } from '@/lib/services/copy';
import { assertAccess } from '@/lib/services/admin';

export const runtime = 'nodejs';

export function GET(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    return ok(await listCredentials(user.id));
  });
}

export function POST(req: NextRequest): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    await assertAccess(user);
    const input = connectCredentialSchema.parse(await req.json());
    return ok(await addCredential(user.id, input), 201);
  });
}
