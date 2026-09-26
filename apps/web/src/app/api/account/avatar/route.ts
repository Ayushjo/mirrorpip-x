import { randomUUID } from 'node:crypto';
import { prisma } from '@belivemeguys/db';
import { ok, requireUser, route, ApiError } from '@/lib/api';
import { avatarSchema } from '@/lib/validation';
import { isR2Configured, isR2Url, keyFromUrl, uploadObject, deleteObject } from '@/lib/r2';

export const runtime = 'nodejs';

/**
 * Avatar upload/remove. The client crops + resizes to a small square and sends a
 * base64 data URL. When Cloudflare R2 is configured we upload the bytes there and
 * store only the public URL; otherwise we fall back to storing the data URL inline
 * so local dev works with no external setup.
 */
export function POST(req: Request): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const { image } = avatarSchema.parse(await req.json().catch(() => ({})));

    if (!isR2Configured()) {
      await prisma.user.update({ where: { id: user.id }, data: { image } });
      return ok({ url: image });
    }

    const m = /^data:image\/(webp|jpeg|png);base64,(.+)$/s.exec(image);
    if (!m) throw new ApiError(400, 'Unsupported image format.');
    const [, fmt, b64] = m;
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;
    const buf = Buffer.from(b64, 'base64');
    const bytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;

    const url = await uploadObject(`avatars/${user.id}/${randomUUID()}.${ext}`, bytes, `image/${fmt}`);

    const prev = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } });
    await prisma.user.update({ where: { id: user.id }, data: { image: url } });

    // Best-effort cleanup of the previous avatar object.
    const oldKey = prev?.image && isR2Url(prev.image) ? keyFromUrl(prev.image) : null;
    if (oldKey) void deleteObject(oldKey);

    return ok({ url });
  });
}

export function DELETE(): Promise<Response> {
  return route(async () => {
    const user = await requireUser();
    const prev = await prisma.user.findUnique({ where: { id: user.id }, select: { image: true } });
    await prisma.user.update({ where: { id: user.id }, data: { image: null } });
    const oldKey = prev?.image && isR2Url(prev.image) ? keyFromUrl(prev.image) : null;
    if (oldKey) void deleteObject(oldKey);
    return ok({ done: true });
  });
}
