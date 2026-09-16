import { headers } from 'next/headers';
import { prisma } from '@mirrorpip/db';
import { auth } from './auth.js';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

/** Resolve the current signed-in user (server-side), or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return null;
    const u = session.user as { id: string; name: string; email: string; role?: string };
    return { id: u.id, name: u.name, email: u.email, role: u.role ?? 'user' };
  } catch {
    // DB/auth transport unavailable — treat as logged-out rather than 500 the
    // whole app (every page reads the session in the root layout).
    return null;
  }
}

/** Admin check: DB role === "admin" OR email in ADMIN_EMAILS. */
export function isAdminEmail(email: string): boolean {
  const admins = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function isAdmin(user: SessionUser | null): Promise<boolean> {
  if (!user) return false;
  if (user.role === 'admin' || isAdminEmail(user.email)) {
    // Self-heal the role so env-based admins get the DB flag too.
    if (user.role !== 'admin') {
      await prisma.user.update({ where: { id: user.id }, data: { role: 'admin' } }).catch(() => undefined);
    }
    return true;
  }
  return false;
}
