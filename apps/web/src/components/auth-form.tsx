'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { Button, Card, Field, Input } from './ui';

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
    <div className="mx-auto max-w-md pt-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-1 text-sm text-[--color-muted]">
          {isRegister ? 'Start copying verified traders in minutes.' : 'Sign in to your dashboard.'}
        </p>
      </div>
      <Card>
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

          {error && <p className="rounded-lg bg-[rgba(244,63,94,0.1)] px-3 py-2 text-sm text-[--color-down]">{error}</p>}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>
      </Card>
      <p className="mt-4 text-center text-sm text-[--color-muted]">
        {isRegister ? 'Already have an account? ' : "Don't have an account? "}
        <Link href={isRegister ? '/login' : '/register'} className="text-[--color-brand] hover:brightness-125">
          {isRegister ? 'Sign in' : 'Sign up'}
        </Link>
      </p>
    </div>
  );
}
