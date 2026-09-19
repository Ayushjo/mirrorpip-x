import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getSessionUser, isAdmin, type SessionUser } from './session.js';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function fail(status: number, message: string): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Resolve the current user or throw a 401. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, 'You must be signed in.');
  return user;
}

/** Resolve the current admin user or throw 401/403. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (!(await isAdmin(user))) throw new ApiError(403, 'Admin access required.');
  return user;
}

/** Wrap a route handler so thrown ApiError/ZodError become clean JSON responses. */
export function route(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return fn().catch((err: unknown) => {
    if (err instanceof ApiError) return NextResponse.json({ error: err.message, ...(err.code ? { code: err.code } : {}) }, { status: err.status });
    if (err instanceof ZodError) {
      return fail(400, err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
    }
    console.error('[api] unhandled error', err);
    return fail(500, 'Something went wrong.');
  });
}
