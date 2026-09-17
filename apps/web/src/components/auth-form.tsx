'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Button, Field, Input } from './ui';
import { CheckIcon } from './icons';

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === 'register';

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = isRegister
        ? await signUp.email({ name, email, password })
        : await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message ?? 'Something went wrong. Please try again.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
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

      <button
        type="button"
        className="mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-black/15 bg-white px-6 py-2.5 text-sm font-medium text-black transition-colors hover:bg-[#ececec]"
      >
        <GoogleIcon /> Continue with Google
      </button>

      <div className="my-5 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-border" /> or continue with email <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {isRegister && (
          <Field label="Name">
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
        <Field label="Password" hint={isRegister ? 'At least 8 characters.' : undefined}>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="••••••••"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
          />
        </Field>

        {error && <p className="rounded-lg bg-[rgba(209,41,61,0.08)] px-3 py-2 text-sm text-down">{error}</p>}

        <Button type="submit" arrow className="w-full justify-center" disabled={busy}>
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
