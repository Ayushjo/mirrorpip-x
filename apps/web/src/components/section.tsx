'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Card, cx } from './ui';

/** Titled card used across Profile / Accounts / Dashboard. */
export function Section({ id, title, sub, aside, children, className }: { id?: string; title: ReactNode; sub?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cx('scroll-mt-28 p-6 sm:p-8', className)}>
      <div id={id} className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

export function Toggle({ on, onChange, label, disabled }: { on: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={() => onChange(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50', on ? 'bg-up' : 'bg-white/15')}>
      <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={cx('absolute top-1 h-5 w-5 rounded-full bg-white shadow', on ? 'left-6' : 'left-1')} />
    </button>
  );
}

/** Small overflow ("…") menu. */
export function Menu({ items, label = 'More' }: { items: { label: string; onClick?: () => void; href?: string; danger?: boolean }[]; label?: string }) {
  return (
    <details className="group relative">
      <summary aria-label={label} className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full text-muted transition-colors hover:bg-white/[0.06] hover:text-fg [&::-webkit-details-marker]:hidden">
        <span className="text-lg leading-none">⋯</span>
      </summary>
      <div className="absolute right-0 z-30 mt-1 w-48 rounded-2xl border border-white/10 bg-[#0b1a33] p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {items.map((it) =>
          it.href ? (
            <a key={it.label} href={it.href} className={cx('block rounded-xl px-3 py-2 text-sm hover:bg-white/[0.06]', it.danger ? 'text-down' : 'text-fg')}>{it.label}</a>
          ) : (
            <button
              key={it.label}
              type="button"
              onClick={(e) => { (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open'); it.onClick?.(); }}
              className={cx('block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/[0.06]', it.danger ? 'text-down' : 'text-fg')}
            >
              {it.label}
            </button>
          ),
        )}
      </div>
    </details>
  );
}
