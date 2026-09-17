'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Button, Field, Input } from './ui';
import { CheckIcon } from './icons';

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

      <form onSubmit={submit} className="mt-8 space-y-4">
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
