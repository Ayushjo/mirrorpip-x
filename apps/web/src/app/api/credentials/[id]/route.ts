import { ok, requireUser, route } from '@/lib/api';
import { deleteCredential } from '@/lib/services/copy';

export const runtime = 'nodejs';

export function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    await deleteCredential(user.id, id);
    return ok({ ok: true });
  });
}
