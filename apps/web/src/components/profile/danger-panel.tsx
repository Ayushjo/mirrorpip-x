'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, Input, cx } from '../ui';
import { requestDataExport, deleteAccount } from '@/lib/profile-actions';

export function DangerPanel({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  return (
    <div className="space-y-5">
      <Card className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Your data</h2>
        <p className="mt-1 text-sm text-muted">Get a copy of your account, copies and order history as JSON.</p>
        <button type="button" disabled={exporting} onClick={async () => { setExporting(true); const r = await requestDataExport(); setExporting(false); if (r.ok) toast.success('We’ll email you a download link shortly.'); }} className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-fg hover:border-brand/40 hover:text-brand disabled:opacity-60">
          <Download className="h-4 w-4" /> {exporting ? 'Preparing…' : 'Export my data'}
        </button>
      </Card>

      <Card className="border !border-down/30 p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-down/15 text-down"><Trash2 className="h-4 w-4" /></span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Delete account</h2>
            <p className="mt-1 text-sm text-muted">Stops every copy, removes your exchange keys, and erases your profile. This cannot be undone.</p>
            <button type="button" onClick={() => setOpen(true)} className="mt-5 rounded-full bg-down/15 px-4 py-2 text-sm font-semibold text-down hover:bg-down/25">Delete my account…</button>
          </div>
        </div>
      </Card>

      <AnimatePresence>{open && <DeleteModal email={email} onClose={() => setOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function DeleteModal({ email, onClose }: { email: string; onClose: () => void }) {
  const [typed, setTyped] = useState('');
  const [hold, setHold] = useState(0);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | null>(null);
  const armed = typed.trim().toLowerCase() === email.toLowerCase();
  const HOLD_MS = 2500;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const start = () => {
    if (!armed || busy) return;
    const t0 = performance.now();
    const tick = () => {
      const p = Math.min(1, (performance.now() - t0) / HOLD_MS);
      setHold(p);
      if (p >= 1) { void fire(); return; }
      timer.current = requestAnimationFrame(tick);
    };
    timer.current = requestAnimationFrame(tick);
  };
  const stop = () => { if (timer.current) cancelAnimationFrame(timer.current); timer.current = null; if (!busy) setHold(0); };
  async function fire() {
    setBusy(true);
    const r = await deleteAccount(typed);
    setBusy(false);
    if (r.ok) { toast.success('Account deletion requested. Check your email to confirm.'); onClose(); } else toast.error(r.error);
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#050b17]/75 backdrop-blur-sm" onClick={onClose} />
      <motion.div role="dialog" aria-modal="true" aria-label="Delete account" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-md rounded-t-[2rem] border-t border-down/30 bg-[#0b1a33] p-6 shadow-[0_-30px_80px_rgba(0,0,0,0.7)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:border" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Delete your account?</div>
            <div className="mt-1 text-sm text-muted">This is permanent. Here’s what happens:</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-muted hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {['Every active copy is stopped immediately. Open positions stay open on your exchange.', 'Your exchange API keys are wiped from our servers.', 'Your leader profile (if any) is removed from the leaderboard.', 'Order history and analytics are deleted after 30 days.'].map((t) => (
            <li key={t} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-down" />{t}</li>
          ))}
        </ul>
        <div className="mt-5">
          <div className="mb-1.5 text-xs font-medium text-muted">Type <span className="text-fg">{email}</span> to confirm</div>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={email} autoComplete="off" />
        </div>
        <button
          type="button"
          disabled={!armed || busy}
          onPointerDown={start}
          onPointerUp={stop}
          onPointerLeave={stop}
          onPointerCancel={stop}
          className={cx('relative mt-4 w-full select-none overflow-hidden rounded-full py-3 text-sm font-semibold transition-colors', armed ? 'bg-down/20 text-down' : 'bg-white/[0.05] text-faint')}
        >
          <motion.span className="absolute inset-y-0 left-0 bg-down" animate={{ width: `${hold * 100}%` }} transition={{ duration: 0 }} />
          <span className={cx('relative', hold > 0.5 && 'text-white')}>{busy ? 'Deleting…' : hold > 0 ? 'Keep holding…' : 'Hold to delete'}</span>
        </button>
        <div className="mt-2 text-center text-[11px] text-faint">Press and hold for 2.5 seconds</div>
      </motion.div>
    </>
  );
}
