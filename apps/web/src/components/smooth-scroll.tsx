'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

// App-wide smooth (momentum) scrolling via Lenis. Uses native scroll under the
// hood, so position:sticky and the browser's scroll position keep working.
// Disabled entirely for users who prefer reduced motion.
export function SmoothScroll() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      duration: 1.05,
      lerp: 0.1,
      smoothWheel: true,
      // smoothly scroll to in-page #anchor links (e.g. "How it works")
      anchors: true,
    });

    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return null;
}
