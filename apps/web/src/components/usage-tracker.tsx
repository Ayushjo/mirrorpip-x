'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { featureFromPath } from '@/lib/usage-features';

const INTERVAL_MS = 30_000;

type BeatType = 'page_view' | 'heartbeat' | 'session_end';

async function sendHeartbeat(path: string, clientId: string, type: BeatType) {
  const ended = type === 'session_end';
  try {
    await fetch('/api/usage/heartbeat', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, clientId, type, feature: featureFromPath(path), ended }),
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
  // Stable id per mounted tracker (i.e. per tab) so concurrent tabs keep
  // separate UsageSession rows and hiding one tab can't end another's.
  const clientIdRef = useRef<string | null>(null);
  if (!clientIdRef.current) clientIdRef.current = crypto.randomUUID();
  const endedRef = useRef(false);

  useEffect(() => {
    pathRef.current = pathname;
    if (document.visibilityState === 'visible') {
      void sendHeartbeat(pathname, clientIdRef.current!, 'page_view');
    }
  }, [pathname]);

  useEffect(() => {
    const clientId = clientIdRef.current!;
    const sendEnd = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      void sendHeartbeat(pathRef.current, clientId, 'session_end');
    };

    const tick = () => {
      if (document.visibilityState === 'visible') {
        endedRef.current = false;
        void sendHeartbeat(pathRef.current, clientId, 'heartbeat');
      }
    };
    const id = window.setInterval(tick, INTERVAL_MS);

    const onVis = () => {
      if (document.visibilityState === 'hidden') sendEnd();
      else {
        endedRef.current = false;
        void sendHeartbeat(pathRef.current, clientId, 'heartbeat');
      }
    };

    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', sendEnd);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', sendEnd);
    };
  }, []);

  return null;
}
