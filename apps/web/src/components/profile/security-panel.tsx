'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Laptop, Smartphone, Tablet, KeyRound, ShieldCheck, LogIn, LogOut, UserPen, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button, EmptyBlock, Field, cx } from '../ui';
import { Section } from '../section';
import { PasswordField, passwordStrength } from '../password-field';
import { changePassword, listSessions, revokeSession, signOutOtherSessions, getSignInMethods, listActivity, type SessionRow, type SignInMethods, type ActivityRow } from '@/lib/profile-actions';

const DeviceIcon = ({ d }: { d: SessionRow['device'] }) => (d === 'mobile' ? <Smartphone className="h-4 w-4" /> : d === 'tablet' ? <Tablet className="h-4 w-4" /> : <Laptop className="h-4 w-4" />);

const ACT_ICON = { signin: LogIn, signout: LogOut, password: KeyRound, profile: UserPen, key: Link2 } as const;
function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}

function ScoreCard({ emailVerified, others, google, onJump }: { emailVerified: boolean; others: number; google: boolean; onJump: (id: string) => void }) {
  const items = [
    { ok: true, pts: 35, label: 'Password set', fix: null as string | null },
    { ok: emailVerified, pts: 20, label: emailVerified ? 'Email verified' : 'Verify your email', fix: null },
    { ok: others === 0, pts: 15, label: others === 0 ? 'No other active sessions' : `Review ${others} other session${others === 1 ? '' : 's'}`, fix: 'sessions' },
    { ok: google, pts: 10, label: google ? 'Backup sign-in method linked' : 'Link Google as a backup sign-in', fix: 'methods' },
    { ok: false, pts: 20, label: 'Turn on two-factor (coming soon)', fix: null },
  ];
  const score = items.reduce((n, i) => n + (i.ok ? i.pts : 0), 0);
  const tone = score >= 80 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444';
  const recs = items.filter((i) => !i.ok);
  return (
    <div className="card-surface flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
      <div className="relative grid h-28 w-28 shrink-0 place-items-center self-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" /><motion.circle cx="18" cy="18" r="15.5" fill="none" stroke={tone} strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: '0 97.4' }} animate={{ strokeDasharray: `${(score / 100) * 97.4} 97.4` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} /></svg>
        <div className="text-center"><div className="text-2xl font-semibold tabular-nums text-fg">{score}</div><div className="text-[10px] uppercase tracking-[0.14em] text-muted">of 100</div></div>
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Security score · <span style={{ color: tone }}>{score >= 80 ? 'Strong' : score >= 55 ? 'Good' : 'Needs work'}</span></h2>
        <p className="mt-1 text-sm text-muted">{recs.length ? 'A few quick wins to lock your account down.' : 'Everything we check looks good.'}</p>
        <ul className="mt-4 space-y-1.5">
          {recs.slice(0, 3).map((r) => (
            <li key={r.label}>
              <button type="button" disabled={!r.fix} onClick={() => r.fix && onJump(r.fix)} className={cx('flex w-full items-center justify-between gap-3 rounded-xl bg-[#050b17] px-3 py-2 text-left text-sm', r.fix ? 'text-fg hover:text-brand' : 'cursor-default text-muted')}>
                <span className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-warn" />{r.label}</span>
                <span className="shrink-0 text-xs text-up">+{r.pts}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function SecurityPanel({ email, emailVerified = false }: { email: string; emailVerified?: boolean }) {
  const [activity, setActivity] = useState<ActivityRow[] | null>(null);
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [methods, setMethods] = useState<SignInMethods | null>(null);
  useEffect(() => { listSessions().then((r) => r.ok && setSessions(r.data ?? [])); getSignInMethods().then((r) => r.ok && setMethods(r.data ?? null)); listActivity().then((r) => r.ok && setActivity(r.data ?? [])); }, []);
  const jump = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
      <ScoreCard emailVerified={emailVerified} others={(sessions ?? []).filter((x) => !x.current).length} google={!!methods?.google.connected} onJump={jump} />
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
        id="sessions"
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
        <Section id="methods" title="Sign-in methods" sub="Ways you can access this account.">
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
      <Section title="Recent activity" sub="The last few things that happened on your account.">
        {!activity ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-2xl" />)}</div>
        ) : (
          <ol className="relative space-y-4 pl-6">
            <span className="absolute bottom-3 left-[11px] top-3 w-px bg-white/10" />
            {activity.map((a, i) => {
              const I = ACT_ICON[a.kind];
              return (
                <motion.li key={a.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative flex items-start justify-between gap-3">
                  <span className="absolute -left-6 top-0 grid h-6 w-6 place-items-center rounded-full bg-[#0b1a33] text-brand ring-1 ring-white/10"><I className="h-3 w-3" /></span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-fg">{a.title}</div>
                    <div className="truncate text-xs text-muted">{a.detail}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-faint">{ago(a.at)}</span>
                </motion.li>
              );
            })}
          </ol>
        )}
      </Section>
    </div>
  );
}
