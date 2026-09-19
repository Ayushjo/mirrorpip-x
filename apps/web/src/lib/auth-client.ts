'use client';

import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

// No baseURL → the client calls the current origin, which is correct whether
// running on :3000 locally, behind a preview port, or in production.
export const authClient = createAuthClient({ plugins: [emailOTPClient()] });

export const { signIn, signUp, signOut, useSession, emailOtp } = authClient;
