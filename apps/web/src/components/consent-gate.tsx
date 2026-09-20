'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Routes reachable without a completed profile (auth pages + the gate itself).
const OPEN_PATHS = ['/complete-profile', '/login', '/register', '/verify', '/forgot-password', '/terms', '/privacy'];

/**
 * Signed-in users who haven't finished onboarding are sent to /complete-profile.
 * This covers two cases: missing ToS/risk consent (first-time OAuth signups never
 * see the registration checkboxes) and a missing address (email signups now defer
 * location to a compulsory post-verification step).
 */
export function OnboardingGate({ needsOnboarding }: { needsOnboarding: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!needsOnboarding) return;
    if (!OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      router.replace('/complete-profile');
    }
  }, [needsOnboarding, pathname, router]);

  return null;
}
