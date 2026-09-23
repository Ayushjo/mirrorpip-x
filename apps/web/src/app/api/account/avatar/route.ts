import { prisma } from '@belivemeguys/db';
import { ok, requireUser, route } from '@/lib/api';
import { avatarSchema } from '@/lib/validation';

export const runtime = 'nodejs';

/**
 * Avatar upload/remove. The client crops + resizes to a small square and sends a
 * base64 data URL, which we store inline in `user.image` (no external blob store).
 */
export function POST(req: Request): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const { image } = avatarSchema.parse(await req.json().catch(() => ({})));
    await prisma.user.update({ where: { id: user.id }, data: { image } });
    return ok({ url: image });
  });
}

export function DELETE(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    await prisma.user.update({ where: { id: user.id }, data: { image: null } });
    return ok({ done: true });
  });
}
