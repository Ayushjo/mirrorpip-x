'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

// Tasteful scroll-reveal: fade + rise as the element enters the viewport, once.
// Always renders the SAME element (motion.div) on server and client — reduced
// motion only shortens the transition, it never changes the DOM structure, so
// there is no hydration mismatch. A safety timer guarantees content is never
// left hidden if the IntersectionObserver misses (e.g. fast momentum scroll).
export function Reveal({
  children,
  delay = 0,
  y = 14,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });
  const [failsafe, setFailsafe] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFailsafe(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const show = inView || failsafe;
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y }}
      transition={{ duration: reduce ? 0 : 0.6, delay: inView && !reduce ? delay : 0, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
