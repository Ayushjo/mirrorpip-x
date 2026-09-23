'use client';

import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { cx } from './ui';

/**
 * One modal primitive for the app: bottom sheet on phones, centred dialog from
 * `sm` up. Handles scrim, Escape, body scroll lock and safe-area padding.
 */
export function Sheet({
  open,
  onClose,
  title,
  sub,
  children,
  tone = 'default',
  width = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  tone?: 'default' | 'danger';
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#050b17]/75 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            key="sheet"
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className={cx(
              'fixed inset-x-0 bottom-0 z-[70] mx-auto max-h-[92svh] w-full overflow-y-auto rounded-t-[2rem] border-t bg-[#0b1a33] p-6 shadow-[0_-30px_80px_rgba(0,0,0,0.7)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:border',
              width,
              tone === 'danger' ? 'border-down/30' : 'border-white/10',
            )}
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>{title}</div>
                {sub && <div className="mt-1 text-sm text-muted">{sub}</div>}
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-muted hover:text-fg">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-5">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
