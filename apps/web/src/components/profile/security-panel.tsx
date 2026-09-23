'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Laptop, Smartphone, Tablet, KeyRound, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, EmptyBlock, Field, cx } from '../ui';
import { PasswordField, passwordStrength } from '../password-field';
import { changePassword, listSessions, revokeSession, signOutOtherSessions, getSignInMethods, type SessionRow, type SignInMethods } from '@/lib/profile-actions';

function Section({ title, sub, children, aside }: { title: string; sub?: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>{title}</h2>
          {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
        </div>
        {aside}
      </div>
      {children}
    </Card>
  );
}

const DeviceIcon = ({ d }: { d: SessionRow['device'] }) => (d === 'mobile' ? <Smartphone className="h-4 w-4" /> : d === 'tablet' ? <Tablet className="h-4 w-4" /> : <Laptop className="h-4 w-4" />);

export function SecurityPanel({ email }: { email: string }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [methods, setMethods] = useState<SignInMethods | null>(null);
  useEffect(() => { listSessions().then((r) => r.ok && setSessions(r.data ?? [])); getSignInMethods().then((r) => r.ok && setMethods(r.data ?? null)); }, []);

  const strength = passwordStrength(next);
  const mismatch = confirm.length > 0 && confirm !== next;
  const can = cur.length >= 8 && strength.valid && confirm === next;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!can) return;
    setBusy(true);
    const r = await changePassword({ current: cur, next });
    setBusy(false);
    if (r.ok) { setDone(true); toast.success('Password updated'); setCur(''); setNext(''); setConfirm(''); setTimeout(() => setDone(false), 1800); } else toast.error(r.error);
  }

  return (
    <div className="space-y-5">
      <Section title="Password" sub="Use at least 8 characters with upper and lower case and a number.">
        <form onSubmit={submit} className="grid gap-4 sm:max-w-md">
          <Field label="Current password"><PasswordField value={cur} onChange={setCur} autoComplete="current-password" /></Field>
          <Field label="New password"><PasswordField value={next} onChange={setNext} autoComplete="new-password" showStrength /></Field>
          <Field label="Confirm new password"><PasswordField value={confirm} onChange={setConfirm} autoComplete="new-password" error={mismatch ? 'Passwords don’t match.' : null} /></Field>
          <div>
            <Button type="submit" arrow={!busy && !done} disabled={busy || !can} className={cx('transition-all', done && '!bg-up !shadow-none')}>
              {done ? <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" strokeWidth={3} /> Updated</span> : busy ? 'Updating…' : 'Update password'}
            </Button>
          </div>
        </form>
      </Section>

      <Section
        title="Sessions"
        sub="Devices currently signed in to your account."
        aside={sessions && sessions.length > 1 && (
          <button type="button" onClick={async () => { const r = await signOutOtherSessions(); if (r.ok) { setSessions((s) => (s ?? []).filter((x) => x.current)); toast.success('Signed out other devices'); } }} className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-muted hover:border-down/40 hover:text-down">
            Sign out others
          </button>
        )}
      >
        {!sessions ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
        ) : (
          <ul className="space-y-2">
            <AnimatePresence initial={false}>
              {sessions.map((s) => (
                <motion.li key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }} transition={{ duration: 0.3 }} className="flex items-center gap-3 rounded-2xl bg-[#050b17] px-4 py-3">
                  <span className={cx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', s.current ? 'bg-brand/15 text-brand' : 'bg-white/[0.05] text-muted')}><DeviceIcon d={s.device} /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-medium text-fg">
                      <span className="truncate">{s.browser}</span>
                      {s.current && <span className="rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-semibold text-up">This device</span>}
                    </div>
                    <div className="text-xs text-muted">{s.location} · {s.lastActive}</div>
                  </div>
                  {!s.current && (
                    <button type="button" onClick={async () => { const r = await revokeSession(s.id); if (r.ok) setSessions((x) => (x ?? []).filter((y) => y.id !== s.id)); }} className="shrink-0 text-xs text-faint hover:text-down">Sign out</button>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Sign-in methods" sub="Ways you can access this account.">
          <ul className="space-y-2">
            <li className="flex items-center gap-3 rounded-2xl bg-[#050b17] px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.05] text-brand"><KeyRound className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1"><div className="text-sm font-medium text-fg">Email & password</div><div className="truncate text-xs text-muted">{email}</div></div>
              <span className="inline-flex items-center gap-1 text-xs text-up"><Check className="h-3.5 w-3.5" strokeWidth={3} /> On</span>
            </li>
            <li className="flex items-center gap-3 rounded-2xl bg-[#050b17] px-4 py-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-[#050b17] text-sm font-bold">G</span>
              <div className="min-w-0 flex-1"><div className="text-sm font-medium text-fg">Google</div><div className="text-xs text-muted">{methods?.google.connected ? methods.google.email ?? 'Connected' : 'Not connected'}</div></div>
              <button type="button" onClick={() => toast.info('Google linking is coming soon.')} className="text-xs font-medium text-brand hover:text-accent">{methods?.google.connected ? 'Disconnect' : 'Connect'}</button>
            </li>
          </ul>
        </Section>
        <Section title="Two-factor authentication" sub="Add a second step at sign-in.">
          <EmptyBlock icon={<ShieldCheck className="h-5 w-5" />} title="Coming soon" body="Authenticator-app 2FA is on the roadmap. You’ll be able to enable it here." />
        </Section>
      </div>
    </div>
  );
}
