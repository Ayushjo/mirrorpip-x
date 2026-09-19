'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

// Routes reachable without recorded consent (auth pages + the gate itself).
const OPEN_PATHS = ['/complete-profile', '/login', '/register', '/verify', '/forgot-password', '/terms', '/privacy'];

/**
 * Signed-in users without ToS/risk consent (e.g. first-time OAuth signups,
 * which never see the registration checkboxes) are sent to /complete-profile.
 */
export function ConsentGate({ needsConsent }: { needsConsent: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!needsConsent) return;
    if (!OPEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      router.replace('/complete-profile');
    }
  }, [needsConsent, pathname, router]);

  return null;
}
