'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cx } from '../ui';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Olymptrade-style reveal: the block starts 35% below its resting place at
 * opacity 0 and eases up over 0.6s once it enters the viewport. A failsafe
 * shows it regardless after 2.5s so nothing is ever left hidden.
 */
export function Rise({
  children,
  delay = 0,
  className,
  amount = 0.2,
  as = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  amount?: number;
  as?: 'div' | 'section' | 'li';
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount });
  const [failsafe, setFailsafe] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFailsafe(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const show = inView || failsafe;
  const Tag = (motion as unknown as Record<string, typeof motion.div>)[as] ?? motion.div;
  return (
    <Tag
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: '35%' }}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: '35%' }}
      transition={{ duration: reduce ? 0 : 0.6, delay: inView && !reduce ? delay : 0, ease: EASE_OUT }}
    >
      {children}
    </Tag>
  );
}

/** Breathing blurred light behind hero objects (10s alternate scale 1 ↔ 0.75). */
export function Light({ className, color = 'rgba(0,176,255,1)' }: { className?: string; color?: string }) {
  return (
    <div
      aria-hidden
      className={cx('light-breathe pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full', className)}
      style={{
        width: 'min(80vw, 900px)',
        height: 'min(60vh, 520px)',
        filter: 'blur(120px)',
        background: `radial-gradient(50% 50%, ${color} 0%, rgba(96,165,255,0.85) 45%, rgba(0,176,255,0) 100%)`,
      }}
    />
  );
}

/** Green-arrow style text link with a pulsing chevron. */
export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={cx('group inline-flex items-center gap-0.5 text-[15px] font-medium text-brand transition-colors hover:text-accent', className)}
    >
      {children}
      <span className="relative inline-flex h-4 w-4 items-center">
        <ChevronRight className="chevron-pulse absolute h-4 w-4" strokeWidth={2.5} />
      </span>
    </Link>
  );
}

/** Rounded "bar chart" silhouettes rising behind the hero. */
export function Bars({ className }: { className?: string }) {
  const bars = [0.28, 0.52, 0.42, 0.66, 0.6, 0.82, 0.74, 0.96, 0.9, 1];
  return (
    <div aria-hidden className={cx('pointer-events-none absolute inset-0 flex items-end justify-center gap-[2.2%] px-[4%]', className)}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-[8%] rounded-t-[2.5rem] bg-[#0b1a33]"
          style={{ height: `${h * 100}%`, opacity: 0.55 + (i % 3) * 0.12 }}
        />
      ))}
    </div>
  );
}

/** Section heading in the Olymptrade voice: big, tight, centered, with optional muted second line. */
export function H2({ children, sub, className }: { children: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('text-center', className)}>
      <h2 className="mx-auto max-w-3xl text-[2rem] leading-[1.05] text-fg sm:text-[2.75rem] lg:text-[3.5rem]" style={{ letterSpacing: '-0.03em', fontWeight: 600 }}>
        {children}
      </h2>
      {sub && <p className="mx-auto mt-4 max-w-2xl text-[15px] text-muted sm:text-base">{sub}</p>}
    </div>
  );
}
