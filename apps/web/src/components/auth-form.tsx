'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Button, Field, Input } from './ui';
import { CheckIcon } from './icons';

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const bucket = Math.min(4, score);
  const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  const colors = ['#d1293d', '#d1293d', '#b97b1a', '#1a7f4b', '#1a7f4b'];
  return { score: bucket, label: labels[bucket]!, color: colors[bucket]! };
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';
  const googleEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
  const [oauthError, setOauthError] = useState<string | null>(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'oauth') {
      setOauthError('Google sign-in was cancelled or could not be completed. Please try again or use email and password.');
    }
  }, []);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const canSubmit = isRegister
    ? name.trim().length > 1 && email.includes('@') && strength.score >= 2 && agreeTos && agreeRisk
    : email.includes('@') && password.length >= 8;

  async function signInWithGoogle() {
    setError(null);
    setBusy(true);
    try {
      const result = await signIn.social({ provider: 'google', callbackURL: '/dashboard', errorCallbackURL: '/login?error=oauth' });
      if (result?.error) setError('Google sign-in could not be completed. Please try again.');
    } catch {
      setError('Google sign-in could not be completed. Please try again.');
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
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
        setError(msg);
        return;
      }
      if (isRegister) {
        router.push(`/verify?email=${encodeURIComponent(email)}`);
        return;
      }
      // Full navigation so the server layout re-renders with the fresh session
      // (avatar/nav correct immediately — no stale menu until a manual refresh).
      window.location.assign('/dashboard');
    } catch {
      setError('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-4xl leading-tight tracking-tight text-black" style={{ letterSpacing: '-0.03em' }}>
        {isRegister ? 'Create your account' : 'Welcome back'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isRegister ? 'Start copying verified traders in minutes.' : 'Sign in to your dashboard.'}
      </p>

      {googleEnabled && (
        <>
          <Button type="button" className="mt-8 w-full justify-center" disabled={busy} onClick={signInWithGoogle}>
            Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-faint"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        </>
      )}

      <form onSubmit={submit} className={googleEnabled ? 'space-y-4' : 'mt-8 space-y-4'}>
        {isRegister && (
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jordan Trader" autoComplete="name" />
          </Field>
        )}
        <Field label="Email">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>

        {isRegister && (
          <Field label="Referral code (optional)">
            <Input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} placeholder="FRIEND-123" />
          </Field>
        )}

        <Field label="Password" hint={isRegister ? '8+ characters with upper & lower case and a number.' : undefined}>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-faint hover:text-black"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {isRegister && password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: strength.score > i ? strength.color : '#e5e5e5' }} />
                ))}
              </div>
              <div className="mt-1 text-xs" style={{ color: strength.color }}>{strength.label}</div>
            </div>
          )}
        </Field>

        {isRegister && (
          <div className="space-y-2.5">
            <label className="flex items-start gap-2.5 text-xs text-muted">
              <input type="checkbox" checked={agreeTos} onChange={(e) => setAgreeTos(e.target.checked)} className="mt-0.5" required />
              <span>
                I accept the <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-xs text-muted">
              <input type="checkbox" checked={agreeRisk} onChange={(e) => setAgreeRisk(e.target.checked)} className="mt-0.5" required />
              <span>I understand copy-trading involves substantial risk of loss and past leader performance does not guarantee future results.</span>
            </label>
          </div>
        )}

        {!isRegister && (
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-muted underline-offset-4 hover:text-black hover:underline">
              Forgot password?
            </Link>
          </div>
        )}

        {(error || oauthError) && <p className="rounded-lg bg-[rgba(209,41,61,0.08)] px-3 py-2 text-sm text-down">{error ?? oauthError}</p>}

        <Button type="submit" arrow className="w-full justify-center" disabled={busy || !canSubmit}>
          {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-faint">
        <span className="inline-flex items-center gap-1">
          <CheckIcon width={13} height={13} /> Non-custodial
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckIcon width={13} height={13} /> Encrypted keys
        </span>
        <span className="inline-flex items-center gap-1">
          <CheckIcon width={13} height={13} /> Cancel anytime
        </span>
      </div>

      <p className="mt-6 text-sm text-muted">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link href={isRegister ? '/login' : '/register'} className="font-medium text-black underline-offset-4 hover:underline">
          {isRegister ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </div>
  );
}
