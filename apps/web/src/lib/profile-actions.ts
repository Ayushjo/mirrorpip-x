'use client';

/**
 * Profile actions — wired to the real backend.
 * - Profile/avatar/methods go through /api/account/* routes.
 * - Password + sessions go through the better-auth client (mounted at /api/auth).
 * - Data export + account deletion are intentionally still stubs (out of scope).
 */
import { authClient } from './auth-client';

export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

async function apiJson<T = unknown>(url: string, init?: RequestInit): Promise<Result<T>> {
  try {
    const res = await fetch(url, { credentials: 'include', ...init });
    const body = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;
    if (!res.ok) return { ok: false, error: body?.error ?? 'Something went wrong. Please try again.' };
    return { ok: true, data: body?.data };
  } catch {
    return { ok: false, error: 'Could not reach the server. Please try again.' };
  }
}

// ── Profile ──────────────────────────────────────────────────────────────────
export type ProfileInput = {
  name: string;
  bio: string;
  country: string;
  city: string;
  postalCode: string;
  phone: string;
  leader?: { displayName: string; bio: string; listed: boolean } | null;
};
export async function updateProfile(input: ProfileInput): Promise<Result> {
  return apiJson('/api/account/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

// ── Avatar ───────────────────────────────────────────────────────────────────
export type Focal = { x: number; y: number; zoom: number };

/**
 * Reproduce the picker's CSS (object-cover + object-position `x%/y%` + scale(zoom)
 * about that same origin) onto a square canvas, then encode a small WebP data URL.
 */
async function cropToDataUrl(blob: Blob, focal: Focal, size = 256): Promise<string> {
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('decode failed'));
      i.src = url;
    });
    const B = size;
    const W = img.naturalWidth || 1;
    const H = img.naturalHeight || 1;
    const cover = Math.max(B / W, B / H);
    const drawW = W * cover;
    const drawH = H * cover;
    const offX = (B - drawW) * (focal.x / 100);
    const offY = (B - drawH) * (focal.y / 100);
    const ox = B * (focal.x / 100);
    const oy = B * (focal.y / 100);

    const canvas = document.createElement('canvas');
    canvas.width = B;
    canvas.height = B;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.fillStyle = '#0a1e3a';
    ctx.fillRect(0, 0, B, B);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(focal.zoom, focal.zoom);
    ctx.translate(-ox, -oy);
    ctx.drawImage(img, offX, offY, drawW, drawH);
    ctx.restore();
    return canvas.toDataURL('image/webp', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function uploadAvatar(blob: Blob, focal: Focal): Promise<Result<{ url: string }>> {
  let image: string;
  try {
    image = await cropToDataUrl(blob, focal);
  } catch {
    return { ok: false, error: 'Could not process that image.' };
  }
  return apiJson<{ url: string }>('/api/account/avatar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  });
}
export async function removeAvatar(): Promise<Result> {
  return apiJson('/api/account/avatar', { method: 'DELETE' });
}

// ── Password (better-auth) ─────────────────────────────────────────────────────
export async function changePassword(input: { current: string; next: string }): Promise<Result> {
  try {
    const { error } = await authClient.changePassword({
      currentPassword: input.current,
      newPassword: input.next,
      revokeOtherSessions: false,
    });
    if (error) return { ok: false, error: error.message ?? 'Could not change password.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not change password. Please try again.' };
  }
}

// ── Sessions (better-auth) ─────────────────────────────────────────────────────
export type SessionRow = { id: string; device: 'desktop' | 'mobile' | 'tablet'; browser: string; location: string; lastActive: string; current: boolean };

function parseUA(ua?: string | null): { device: SessionRow['device']; browser: string } {
  const s = ua ?? '';
  const device: SessionRow['device'] = /iPad|Tablet/i.test(s) ? 'tablet' : /Mobi|Android|iPhone/i.test(s) ? 'mobile' : 'desktop';
  const browser = /Edg/i.test(s) ? 'Edge' : /OPR|Opera/i.test(s) ? 'Opera' : /Brave/i.test(s) ? 'Brave' : /Chrome/i.test(s) ? 'Chrome' : /Firefox/i.test(s) ? 'Firefox' : /Safari/i.test(s) ? 'Safari' : 'Browser';
  const os = /Windows/i.test(s) ? 'Windows' : /Mac OS|Macintosh/i.test(s) ? 'macOS' : /Android/i.test(s) ? 'Android' : /iPhone|iPad|iOS/i.test(s) ? 'iOS' : /Linux/i.test(s) ? 'Linux' : '';
  return { device, browser: os ? `${browser} · ${os}` : browser };
}
function relTime(d?: string | Date | null): string {
  if (!d) return '—';
  const t = new Date(d).getTime();
  const diff = Date.now() - t;
  if (diff < 60_000) return 'Now';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.floor(h / 24);
  return `${days} d ago`;
}

export async function listSessions(): Promise<Result<SessionRow[]>> {
  try {
    const [list, cur] = await Promise.all([authClient.listSessions(), authClient.getSession()]);
    if (list.error) return { ok: false, error: list.error.message ?? 'Could not load sessions.' };
    const currentToken = cur.data?.session?.token;
    const rows: SessionRow[] = (list.data ?? []).map((s) => {
      const { device, browser } = parseUA(s.userAgent);
      return {
        id: s.token,
        device,
        browser,
        location: '—',
        lastActive: relTime(s.updatedAt ?? s.createdAt),
        current: s.token === currentToken,
      };
    });
    rows.sort((a, b) => Number(b.current) - Number(a.current));
    return { ok: true, data: rows };
  } catch {
    return { ok: false, error: 'Could not load sessions.' };
  }
}
export async function revokeSession(id: string): Promise<Result> {
  try {
    const { error } = await authClient.revokeSession({ token: id });
    if (error) return { ok: false, error: error.message ?? 'Could not sign out that session.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not sign out that session.' };
  }
}
export async function signOutOtherSessions(): Promise<Result> {
  try {
    const { error } = await authClient.revokeOtherSessions();
    if (error) return { ok: false, error: error.message ?? 'Could not sign out other sessions.' };
    return { ok: true };
  } catch {
    return { ok: false, error: 'Could not sign out other sessions.' };
  }
}

// ── Sign-in methods ────────────────────────────────────────────────────────────
export type SignInMethods = { password: boolean; google: { connected: boolean; email?: string } };
export async function getSignInMethods(): Promise<Result<SignInMethods>> {
  return apiJson<SignInMethods>('/api/account/methods');
}

// ── Still stubs (out of current scope) ─────────────────────────────────────────
const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
export async function requestDataExport(): Promise<Result> {
  // TODO(api): POST /api/account/export → emails a download link
  await wait(700);
  return { ok: true };
}
export async function deleteAccount(confirmEmail: string): Promise<Result> {
  // TODO(api): DELETE /api/account (requires confirmEmail === session email)
  await wait(900);
  void confirmEmail;
  return { ok: true };
}

export type ActivityRow = { id: string; kind: 'signin' | 'password' | 'profile' | 'key' | 'signout'; title: string; detail: string; at: string };
export async function listActivity(): Promise<Result<ActivityRow[]>> {
  // TODO(api): GET /api/account/activity (sessions + audit log, newest first, limit 5)
  await new Promise((r) => setTimeout(r, 250));
  const h = (n: number) => new Date(Date.now() - n * 3600e3).toISOString();
  return {
    ok: true,
    data: [
      { id: 'a1', kind: 'signin', title: 'Signed in', detail: 'Chrome · macOS · Raipur, IN', at: h(0.2) },
      { id: 'a2', kind: 'profile', title: 'Profile updated', detail: 'Display name and bio', at: h(5) },
      { id: 'a3', kind: 'key', title: 'Exchange key connected', detail: 'Delta India · ••••xk9G', at: h(30) },
      { id: 'a4', kind: 'signin', title: 'Signed in', detail: 'Safari · iPhone · Raipur, IN', at: h(52) },
      { id: 'a5', kind: 'password', title: 'Password changed', detail: 'From this device', at: h(200) },
    ],
  };
}
