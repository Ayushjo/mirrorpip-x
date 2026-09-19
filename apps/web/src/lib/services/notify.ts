import { prisma } from '@mirrorpip/db';
import type { Prisma } from '@mirrorpip/db';

export interface NotifyInput {
  kind: string;
  title: string;
  body?: string;
  href?: string;
}

export async function notifyUser(userId: string, input: NotifyInput): Promise<void> {
  await prisma.notification
    .create({ data: { userId, kind: input.kind, title: input.title, body: input.body ?? null, href: input.href ?? null } })
    .catch(() => undefined); // notifications must never break the calling flow
}

/** Notify every admin user (role=admin or ADMIN_EMAILS allowlist). */
export async function notifyAdmins(input: NotifyInput): Promise<void> {
  const emails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const admins = await prisma.user.findMany({
    where: { OR: [{ role: 'admin' }, { email: { in: emails, mode: 'insensitive' } }] },
    select: { id: true },
  });
  await Promise.all(admins.map((a) => notifyUser(a.id, input)));
}

export async function listNotifications(userId: string) {
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);
  return {
    unread,
    items: items.map((n) => ({
      id: n.id,
      kind: n.kind,
      title: n.title,
      body: n.body,
      href: n.href,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  const where: Prisma.NotificationWhereInput = { userId, readAt: null };
  if (ids?.length) where.id = { in: ids };
  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
}
