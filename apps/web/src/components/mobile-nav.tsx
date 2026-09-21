'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Menu, X } from 'lucide-react';

export function MobileNav({
  links,
  authed = false,
}: {
  links: Array<{ href: string; label: string }>;
  authed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-fg"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Portal to body: the header has a backdrop-filter, which would otherwise
          trap these fixed overlays inside the 64px header as their containing block. */}
      {mounted && open &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="fixed right-0 top-0 z-[70] flex h-full w-[82%] max-w-xs flex-col border-l border-border bg-[rgba(5,11,23,0.99)] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between border-b border-border-soft px-5 py-4">
              <span className="text-sm font-medium text-muted">Menu</span>
              <button
                type="button"
                className="grid h-9 w-9 place-items-center rounded-full border border-border bg-surface text-fg"
                aria-label="Close menu"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-xl px-3 py-3 text-base font-medium text-fg hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
              {!authed && (
                <div className="mt-auto flex flex-col gap-2 pt-4">
                  <Link
                    href="/login"
                    className="rounded-xl border border-border px-3 py-3 text-center text-base font-medium text-fg hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-full bg-gradient-to-r from-brand to-accent px-3 py-3 text-center text-base font-semibold text-[#050b17]"
                    onClick={() => setOpen(false)}
                  >
                    Get started
                  </Link>
                </div>
              )}
            </nav>
          </div>
          </>,
          document.body,
        )}
    </div>
  );
}
