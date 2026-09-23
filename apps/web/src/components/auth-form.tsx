'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, EyeOff, Loader2, Lock, ShieldCheck, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import { signIn, signUp } from '@/lib/auth-client';
import { Button, Checkbox, Field, Input, cx } from './ui';
import { Words } from './landing/motion';

const EMAIL_KEY = 'bmg:lastEmail';
const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

function passwordStrength(pw: string) {
  const rules = [
    { ok: pw.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw), label: 'Upper & lower case' },
    { ok: /[0-9]/.test(pw), label: 'A number' },
  ];
  let score = rules.filter((r) => r.ok).length;
  if (pw.length >= 12) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const bucket = Math.min(4, score);
  const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['#ef4444', '#ef4444', '#f59e0b', '#10b981', '#10b981'];
  return { rules, score: bucket, label: labels[bucket]!, color: colors[bucket]!, valid: rules.every((r) => r.ok) };
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.3 14.6 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12S6.6 21.7 12 21.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/** Inline field error with a small shake. */
function FieldError({ msg }: { msg?: string | null }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {msg && (
        <motion.p
          key={msg}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0, x: reduce ? 0 : [0, -6, 6, -4, 4, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-1.5 text-xs text-down"
          role="alert"
        >
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const params = useSearchParams();
  const isRegister = mode === 'register';
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [caps, setCaps] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverErr, setServerErr] = useState<{ field: 'email' | 'password'; msg: string } | null>(null);
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';

  // Remember the last sign-in email (never the password).
  useEffect(() => {
    if (isRegister || email) return;
    try {
      const last = localStorage.getItem(EMAIL_KEY);
      if (last) setEmail(last);
    } catch {}
  }, [isRegister, email]);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'oauth') {
      toast.error('Google sign-in was cancelled or could not be completed. Please try again or use email and password.');
    }
  }, []);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const stepTwo = !isRegister || (name.trim().length > 1 && emailOk(email));
  const errors = {
    name: isRegister && touched.name && name.trim().length < 2 ? 'Please enter your name.' : null,
    email: touched.email && !emailOk(email) ? 'That email doesn’t look right.' : serverErr?.field === 'email' ? serverErr.msg : null,
    password: isRegister
      ? touched.password && password.length > 0 && !strength.valid ? 'Meet the three rules below.' : null
      : serverErr?.field === 'password' ? serverErr.msg : touched.password && password.length < 8 ? 'Password is at least 8 characters.' : null,
  };
  const canSubmit = isRegister
    ? name.trim().length > 1 && emailOk(email) && strength.valid && agreeTos && agreeRisk
    : emailOk(email) && password.length >= 8;

  async function signInWithGoogle() {
    setBusy(true);
    try {
      const result = await signIn.social({ provider: 'google', callbackURL: '/dashboard', errorCallbackURL: '/login?error=oauth' });
      if (result?.error) toast.error('Google sign-in could not be completed. Please try again.');
    } catch {
      toast.error('Google sign-in could not be completed. Please try again.');
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    setServerErr(null);
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = isRegister
        ? await signUp.email({
            name,
            email,
            password,
            ...(referralCode.trim() ? { referralCode: referralCode.trim() } : {}),
            tosAcceptedAt: new Date().toISOString(),
            riskDisclosureAcceptedAt: new Date().toISOString(),
          } as Parameters<typeof signUp.email>[0])
        : await signIn.email({ email, password });
      if (res.error) {
        const msg = res.error.message ?? 'Something went wrong. Please try again.';
        if (/verif/i.test(msg) || (res.error as { code?: string }).code === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify?email=${encodeURIComponent(email)}`);
          return;
        }
        // Credential/validation errors go inline; everything else toasts.
        if (/password|credential|invalid/i.test(msg)) setServerErr({ field: 'password', msg: isRegister ? msg : 'Wrong email or password.' });
        else if (/email|exists|already/i.test(msg)) setServerErr({ field: 'email', msg });
        else toast.error(msg);
        return;
      }
      try {
        localStorage.setItem(EMAIL_KEY, email);
      } catch {}
      setDone(true);
      if (isRegister) {
        setTimeout(() => router.push(`/verify?email=${encodeURIComponent(email)}`), 500);
        return;
      }
      setTimeout(() => window.location.assign('/dashboard'), 500);
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      if (!done) setBusy(false);
    }
  }

  const switchHref = `${isRegister ? '/login' : '/register'}${emailOk(email) ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl leading-tight text-fg sm:text-4xl" style={{ letterSpacing: '-0.03em', fontWeight: 600 }}>
        <Words text={isRegister ? 'Create your account' : 'Welcome back'} stagger={0.05} />
      </h1>
      <p className="mt-2 text-sm text-muted">{isRegister ? 'Start copying verified traders in minutes.' : 'Sign in to your dashboard.'}</p>

      {googleEnabled && (
        <>
          <button
            type="button"
            disabled={busy}
            onClick={signInWithGoogle}
            className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white px-6 py-2.5 text-sm font-semibold text-[#050b17] transition-colors hover:bg-[#f3f6ff] disabled:opacity-60"
          >
            <GoogleMark /> Continue with Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-faint">
            <span className="h-px flex-1 bg-border" />
            or continue with email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} noValidate className={googleEnabled ? 'space-y-4' : 'mt-8 space-y-4'}>
        {isRegister && (
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => setTouched((t) => ({ ...t, name: true }))} placeholder="Jordan Trader" autoComplete="name" aria-invalid={!!errors.name} />
            <FieldError msg={errors.name} />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setServerErr(null); }}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
          <FieldError msg={errors.email} />
        </Field>

        {/* Step-lite: the rest reveals once name + email are valid on sign-up. */}
        <AnimatePresence initial={false}>
          {stepTwo && (
            <motion.div key="step2" initial={isRegister ? { opacity: 0, y: 16, height: 0 } : false} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="space-y-4 overflow-hidden">
              {isRegister && (
                <Field label="Referral code (optional)">
                  <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="FRIEND-123" />
                </Field>
              )}

              <Field label="Password">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setServerErr(null); }}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                    onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
                    placeholder="••••••••"
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    className="pr-12"
                    aria-invalid={!!errors.password}
                  />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint transition-colors hover:bg-white/[0.06] hover:text-fg">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <AnimatePresence>
                  {caps && (
                    <motion.p key="caps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1.5 inline-flex items-center gap-1 text-xs text-warn">
                      <Lock className="h-3 w-3" /> Caps Lock is on
                    </motion.p>
                  )}
                </AnimatePresence>
                <FieldError msg={errors.password} />
                {isRegister && password.length > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div className="h-full rounded-full" animate={{ width: `${(strength.score / 4) * 100}%`, backgroundColor: strength.color }} transition={{ type: 'spring', stiffness: 180, damping: 22 }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span style={{ color: strength.color }}>{strength.label}</span>
                    </div>
                    <ul className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                      {strength.rules.map((r) => (
                        <li key={r.label} className={cx('inline-flex items-center gap-1.5 transition-colors', r.ok ? 'text-up' : 'text-faint')}>
                          <span className={cx('grid h-4 w-4 place-items-center rounded-full border transition-all', r.ok ? 'border-up bg-up text-[#050b17]' : 'border-white/15')}>
                            {r.ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                          </span>
                          {r.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Field>

              {isRegister && (
                <div className="space-y-2">
                  <Checkbox checked={agreeTos} onChange={setAgreeTos}>
                    I accept the <Link href="/terms" className="font-medium text-fg underline underline-offset-2">Terms</Link> and{' '}
                    <Link href="/privacy" className="font-medium text-fg underline underline-offset-2">Privacy Policy</Link>.
                  </Checkbox>
                  <Checkbox checked={agreeRisk} onChange={setAgreeRisk}>
                    I understand copy-trading involves substantial risk of loss and past leader performance does not guarantee future results.
                  </Checkbox>
                </div>
              )}

              {!isRegister && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-xs text-muted underline-offset-4 hover:text-fg hover:underline">Forgot password?</Link>
                </div>
              )}

              <Button type="submit" arrow={!busy && !done} className={cx('w-full justify-center py-2.5 transition-all', done && '!bg-up !shadow-none')} disabled={busy || !canSubmit}>
                {done ? (
                  <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" strokeWidth={3} /> {isRegister ? 'Account created' : 'Signed in'}</span>
                ) : busy ? (
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {isRegister ? 'Creating account…' : 'Signing in…'}</span>
                ) : isRegister ? 'Create account' : 'Sign in'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        {isRegister && !stepTwo && (
          <p className="text-xs text-faint">Enter your name and email to continue.</p>
        )}
      </form>

      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { I: Lock, t: 'Non-custodial' },
          { I: ShieldCheck, t: 'Encrypted keys' },
          { I: Undo2, t: 'Cancel anytime' },
        ].map(({ I, t }, i) => (
          <motion.div key={t} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-2 rounded-xl bg-white/[0.04] px-2.5 py-2 text-[11px] text-muted">
            <I className="h-3.5 w-3.5 shrink-0 text-brand" />
            <span className="truncate">{t}</span>
          </motion.div>
        ))}
      </div>

      <p className="mt-6 text-sm text-muted">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link href={switchHref} className="font-medium text-fg underline-offset-4 hover:underline">{isRegister ? 'Sign in' : 'Sign up'}</Link>
      </p>
    </div>
  );
}
