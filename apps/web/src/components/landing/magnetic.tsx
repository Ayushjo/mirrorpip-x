'use client';

import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';

/** True only after mount, on fine-pointer devices without reduced motion — so SSR and first client render match. */
function useFinePointer() {
  const reduce = useReducedMotion();
  const [ok, setOk] = useState(false);
  useEffect(() => {
    setOk(!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, [reduce]);
  return ok;
}

/** Wraps a control so it leans toward the pointer (±6px). No-op on touch / reduced motion. */
export function Magnetic({ children, strength = 6 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });
  const enabled = useFinePointer();
  return (
    <motion.div
      ref={ref}
      className="inline-block"
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * strength * 2);
        y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** Card wrapper: tilts ≤4° toward the pointer with a following light spot. Desktop only. */
export function Tilt({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const lx = useMotionValue(50);
  const ly = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 180, damping: 20 });
  const sry = useSpring(ry, { stiffness: 180, damping: 20 });
  const enabled = useFinePointer();
  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX: srx, rotateY: sry, transformPerspective: 1200, transformStyle: 'preserve-3d' }}
      onPointerMove={(e) => {
        if (!enabled || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        ry.set((px - 0.5) * 8);
        rx.set((0.5 - py) * 8);
        lx.set(px * 100);
        ly.set(py * 100);
        ref.current.style.setProperty('--lx', `${px * 100}%`);
        ref.current.style.setProperty('--ly', `${py * 100}%`);
      }}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
      }}
    >
      {children}
      {enabled && (
        <span
          aria-hidden
          className="tilt-spot pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300"
        />
      )}
    </motion.div>
  );
}
