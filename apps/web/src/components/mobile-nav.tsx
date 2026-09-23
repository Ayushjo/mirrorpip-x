'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronRight, LayoutDashboard, LogOut, Menu, ShieldCheck, Trophy, Wallet, X, HelpCircle, UserRound } from 'lucide-react';
import { signOut } from '@/lib/auth-client';
import { BrandMark } from './icons';
import { cx } from './ui';

type NavLink = { href: string; label: string };
type User = { name: string; email: string } | null;

const ICONS: Record<string, typeof Trophy> = {
  '/leaders': Trophy,
  '/dashboard': LayoutDashboard,
  '/connect': Wallet,
  '/admin': ShieldCheck,
  '/profile': UserRound,
};
const HINTS: Record<string, string> = {
  '/leaders': 'Verified traders to mirror',
  '/dashboard': 'Live copies and P&L',
  '/connect': 'Exchange API keys',
  '/register': 'Two minutes to your first copy',
  '/admin': 'Users, leaders, engine',
  '/profile': 'Photo, details, security',
};

const EASE = [0.22, 1, 0.36, 1] as const;

export function MobileNav({ links, user = null }: { links: NavLink[]; user?: User }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } finally {
      window.location.assign('/');
    }
  }

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fg transition-colors active:bg-white/10"
        aria-label="Open menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {/* Portal to body: the header's backdrop-filter would otherwise trap these
          fixed overlays inside the 64px header as their containing block. */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  key="scrim"
                  className="fixed inset-0 z-[60] bg-[#050b17]/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setOpen(false)}
                />
                <motion.aside
                  key="sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Menu"
                  className="fixed inset-y-0 right-0 z-[70] flex w-[86%] max-w-sm flex-col overflow-hidden border-l border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.7)]"
                  style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                    background:
                      'radial-gradient(520px 260px at 100% 0%, rgba(0,176,255,0.18), transparent 60%), linear-gradient(180deg, #0a1e3a 0%, #050b17 70%)',
                  }}
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 38, mass: 0.9 }}
                >
                  {/* header */}
                  <div className="flex items-center justify-between px-5 pt-5">
                    <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                      <BrandMark className="h-7 w-7" />
                      <span className="text-base font-semibold tracking-tight text-fg">
                        BelieveMe<span className="text-brand">Guys</span>
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-fg active:bg-white/10"
                      aria-label="Close menu"
                      onClick={() => setOpen(false)}
                    >
                      <X className="h-[18px] w-[18px]" />
                    </button>
                  </div>

                  {/* profile card */}
                  {user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.4, ease: EASE }}
                      className="card-surface mx-5 mt-6 flex items-center gap-3 rounded-2xl p-3.5"
                    >
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-base font-bold text-[#050b17]">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-fg">{user.name}</div>
                        <div className="truncate text-xs text-muted">{user.email}</div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-semibold text-up">
                        <span className="h-1.5 w-1.5 rounded-full bg-up" /> Live
                      </span>
                    </motion.div>
                  )}

                  {!user && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.08, duration: 0.4, ease: EASE }}
                      className="card-surface mx-5 mt-6 rounded-2xl p-4"
                    >
                      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand">Trade smarter together</div>
                      <div className="mt-1.5 text-base font-semibold leading-tight text-fg" style={{ letterSpacing: '-0.02em' }}>
                        Your capital, on autopilot.
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">
                        Follow a verified leader and mirror every fill in under a second. Funds never leave your account.
                      </p>
                    </motion.div>
                  )}

                  {/* links */}
                  <nav className="mt-6 flex-1 overflow-y-auto px-3">
                    <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">Navigate</div>
                    <ul className="space-y-1">
                      {[...links, ...(user ? [{ href: '/profile', label: 'Profile' }] : [{ href: '/connect', label: 'Become a leader' }])].map((l, i) => {
                        const Icon = l.label === 'Become a leader' ? Trophy : (ICONS[l.href] ?? ChevronRight);
                        const active = pathname === l.href || pathname.startsWith(l.href + '/');
                        return (
                          <motion.li
                            key={l.href}
                            initial={{ opacity: 0, x: 18 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.12 + i * 0.05, duration: 0.4, ease: EASE }}
                          >
                            <Link
                              href={l.href}
                              onClick={() => setOpen(false)}
                              className={cx(
                                'group relative flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors',
                                active ? 'bg-white/[0.06] text-fg' : 'text-fg/85 active:bg-white/[0.05]',
                              )}
                            >
                              {active && <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand" />}
                              <span
                                className={cx(
                                  'grid h-10 w-10 shrink-0 place-items-center rounded-xl',
                                  active ? 'bg-brand text-[#050b17] shadow-[0_6px_18px_rgba(0,176,255,0.35)]' : 'bg-white/[0.05] text-brand',
                                )}
                              >
                                <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="block text-[15px] font-medium leading-tight">{l.label}</span>
                                {(l.label === 'Become a leader' ? 'Get verified, let followers mirror you' : HINTS[l.href]) && (
                                  <span className="block text-xs text-muted">{l.label === 'Become a leader' ? 'Get verified, let followers mirror you' : HINTS[l.href]}</span>
                                )}
                              </span>
                              <ChevronRight className="h-4 w-4 text-faint transition-transform group-active:translate-x-0.5" />
                            </Link>
                          </motion.li>
                        );
                      })}
                    </ul>

                    <div className="mt-6 px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">More</div>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <Link href="/#how-it-works" onClick={() => setOpen(false)} className="flex items-center gap-3.5 rounded-2xl px-3 py-2.5 text-fg/80 active:bg-white/[0.05]">
                          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.05] text-muted">
                            <HelpCircle className="h-4 w-4" />
                          </span>
                          How it works
                        </Link>
                      </li>
                      <li className="flex gap-4 px-3 py-2 text-xs text-faint">
                        <Link href="/terms" onClick={() => setOpen(false)} className="hover:text-fg">Terms</Link>
                        <Link href="/privacy" onClick={() => setOpen(false)} className="hover:text-fg">Privacy</Link>
                      </li>
                    </ul>
                  </nav>

                  {/* footer */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.22, duration: 0.4, ease: EASE }}
                    className="border-t border-white/10 px-5 py-4"
                  >
                    {user ? (
                      <button
                        type="button"
                        onClick={handleSignOut}
                        disabled={busy}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] py-3 text-sm font-medium text-fg/85 transition-colors active:bg-white/10 disabled:opacity-60"
                      >
                        <LogOut className="h-4 w-4" />
                        {busy ? 'Signing out…' : 'Sign out'}
                      </button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/register"
                          onClick={() => setOpen(false)}
                          className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent py-2.5 pl-5 pr-2 text-sm font-semibold text-[#050b17] shadow-[0_6px_22px_rgba(0,176,255,0.35)]"
                        >
                          Get started
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-[#050b17]">
                            <ArrowRight className="h-4 w-4 text-white" />
                          </span>
                        </Link>
                        <Link
                          href="/login"
                          onClick={() => setOpen(false)}
                          className="grid place-items-center rounded-full border border-white/10 py-2.5 text-sm font-medium text-fg/85 active:bg-white/5"
                        >
                          Sign in
                        </Link>
                      </div>
                    )}
                    <p className="mt-3 text-center text-[10px] text-faint">Trade smarter together · Delta Exchange India</p>
                  </motion.div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  );
}
