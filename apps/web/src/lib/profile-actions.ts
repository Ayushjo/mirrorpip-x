/**
 * Profile actions — UI contract only.
 * Every function resolves after a short delay so the UI can show real loading /
 * success states. Replace bodies with fetch() calls; keep the signatures.
 */
const wait = (ms = 600) => new Promise((r) => setTimeout(r, ms));
export type Result<T = undefined> = { ok: true; data?: T } | { ok: false; error: string };

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
  // TODO(api): PATCH /api/account/profile with `input`
  await wait();
  void input;
  return { ok: true };
}

export type Focal = { x: number; y: number; zoom: number };
export async function uploadAvatar(blob: Blob, focal: Focal): Promise<Result<{ url: string }>> {
  // TODO(api): POST /api/account/avatar (multipart: file, focal) → { url }
  await wait(900);
  void focal;
  return { ok: true, data: { url: URL.createObjectURL(blob) } };
}
export async function removeAvatar(): Promise<Result> {
  // TODO(api): DELETE /api/account/avatar
  await wait();
  return { ok: true };
}

export async function changePassword(input: { current: string; next: string }): Promise<Result> {
  // TODO(api): POST /api/account/password (better-auth changePassword)
  await wait(800);
  void input;
  return { ok: true };
}

export type SessionRow = { id: string; device: 'desktop' | 'mobile' | 'tablet'; browser: string; location: string; lastActive: string; current: boolean };
export async function listSessions(): Promise<Result<SessionRow[]>> {
  // TODO(api): GET /api/account/sessions (better-auth listSessions + UA parse)
  await wait(300);
  return {
    ok: true,
    data: [
      { id: 's1', device: 'desktop', browser: 'Chrome · macOS', location: 'Raipur, IN', lastActive: 'Now', current: true },
      { id: 's2', device: 'mobile', browser: 'Safari · iPhone', location: 'Raipur, IN', lastActive: '2 h ago', current: false },
      { id: 's3', device: 'desktop', browser: 'Brave · Windows', location: 'Mumbai, IN', lastActive: '3 d ago', current: false },
    ],
  };
}
export async function revokeSession(id: string): Promise<Result> {
  // TODO(api): DELETE /api/account/sessions/:id
  await wait(400);
  void id;
  return { ok: true };
}
export async function signOutOtherSessions(): Promise<Result> {
  // TODO(api): POST /api/account/sessions/revoke-others
  await wait(600);
  return { ok: true };
}

export type SignInMethods = { password: boolean; google: { connected: boolean; email?: string } };
export async function getSignInMethods(): Promise<Result<SignInMethods>> {
  // TODO(api): GET /api/account/methods (accounts table providerId)
  await wait(200);
  return { ok: true, data: { password: true, google: { connected: false } } };
}

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
