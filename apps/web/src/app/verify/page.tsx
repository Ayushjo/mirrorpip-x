'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button, Field, Input } from '@/components/ui';

function VerifyForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await authClient.emailOtp.verifyEmail({ email, otp });
      if (res.error) {
        setError(res.error.message ?? 'That code did not work. Check it and try again.');
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

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      setInfo('A new code is on its way.');
    } catch {
      setError('Could not resend the code. Try again in a moment.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm py-10">
      <h1 className="text-4xl leading-tight tracking-tight text-black" style={{ letterSpacing: '-0.03em' }}>
        Check your email
      </h1>
      <p className="mt-2 text-sm text-muted">
        We sent a 6-digit code to <span className="font-medium text-black">{email || 'your email'}</span>. Enter it below to
        activate your account.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Verification code">
          <Input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            placeholder="123456"
            className="text-center text-2xl tracking-[0.5em]"
          />
        </Field>
        {error && <p className="rounded-lg bg-[rgba(209,41,61,0.08)] px-3 py-2 text-sm text-down">{error}</p>}
        {info && <p className="rounded-lg bg-[#e7f3ec] px-3 py-2 text-sm text-up">{info}</p>}
        <Button type="submit" arrow className="w-full justify-center" disabled={busy || otp.length !== 6}>
          {busy ? 'Verifying…' : 'Verify and continue'}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        Didn't get it?{' '}
        <button type="button" onClick={resend} className="font-medium text-black underline-offset-4 hover:underline">
          Resend code
        </button>
      </p>
      <p className="mt-2 text-sm text-muted">
        Wrong email?{' '}
        <Link href="/register" className="font-medium text-black underline-offset-4 hover:underline">
          Start over
        </Link>
      </p>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
