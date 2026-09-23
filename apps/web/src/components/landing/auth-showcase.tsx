'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { Light } from './motion';
import { LivePhone, OrbitNotes } from './live';

const PROOFS = ['Fills mirrored in under a second', 'Trade-only keys, withdrawals off', 'Pause or stop any time', 'Verified leaders only'];

/** Left half of the auth split: live phone, orbiting notes, rotating proof line. */
export function AuthShowcase({ title, subtitle }: { title: ReactNode; subtitle: string }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setI((v) => (v + 1) % PROOFS.length), 3200);
    return () => clearInterval(id);
  }, [reduce]);
  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden p-12">
      <div className="relative flex flex-1 items-center justify-center">
        <Light className="!top-[55%]" />
        <OrbitNotes className="!block" />
        <div className="scale-90 xl:scale-100">
          <LivePhone />
        </div>
      </div>
      <div className="relative z-10">
        <div className="text-4xl font-medium leading-tight text-fg" style={{ letterSpacing: '-0.035em', fontWeight: 600 }}>{title}</div>
        <p className="mt-3 max-w-sm text-base text-muted">{subtitle}</p>
        <div className="mt-5 h-6 overflow-hidden text-sm font-medium text-brand">
          <AnimatePresence mode="wait">
            <motion.div key={i} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} transition={{ duration: 0.4 }} className="inline-flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-up" /> {PROOFS[i]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
