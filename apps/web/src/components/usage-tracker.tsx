'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { featureFromPath } from '@/lib/usage-features';

const INTERVAL_MS = 30_000;

async function sendHeartbeat(path: string, ended = false) {
  try {
    await fetch('/api/usage/heartbeat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, feature: featureFromPath(path), ended }),
      keepalive: ended,
    });
  } catch {
    // analytics must never break the app
  }
}

/** Visibility-aware product usage tracker. Mounted in the root layout for signed-in users. */
export function UsageTracker() {
  const pathname = usePathname();
  const pathRef = useRef(pathname);

  useEffect(() => {
    pathRef.current = pathname;
    if (document.visibilityState === 'visible') {
      void sendHeartbeat(pathname, false);
    }
  }, [pathname]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') void sendHeartbeat(pathRef.current, false);
    };
    const id = window.setInterval(tick, INTERVAL_MS);

    const onVis = () => {
      void sendHeartbeat(pathRef.current, document.visibilityState === 'hidden');
    };
    const onUnload = () => void sendHeartbeat(pathRef.current, true);

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', onUnload);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', onUnload);
    };
  }, []);

  return null;
}
