'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button, Field, Input } from '@/components/ui';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({ email, type: 'forget-password' });
      if (res.error) {
        toast.error(res.error.message ?? 'Could not send the code. Please try again.');
        return;
      }
      setStep('reset');
    } catch {
      toast.error('Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await authClient.emailOtp.resetPassword({ email, otp, password });
      if (res.error) {
        toast.error(res.error.message ?? 'Reset failed — check the code and try again.');
        return;
      }
      router.push('/login');
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm py-10">
      <h1 className="text-4xl leading-tight tracking-tight text-fg" style={{ letterSpacing: '-0.03em' }}>
        {step === 'email' ? 'Reset your password' : 'Choose a new password'}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {step === 'email'
          ? "Enter your account email and we'll send a 6-digit reset code."
          : `Enter the code sent to ${email} and pick a new password.`}
      </p>

      {step === 'email' ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <Field label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          </Field>
          <Button type="submit" arrow className="w-full justify-center" disabled={busy || !email.includes('@')}>
            {busy ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      ) : (
        <form onSubmit={reset} className="mt-8 space-y-4">
          <Field label="Reset code">
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
          <Field label="New password" hint="At least 8 characters.">
            <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" />
          </Field>
          <Button type="submit" arrow className="w-full justify-center" disabled={busy || otp.length !== 6 || password.length < 8}>
            {busy ? 'Resetting…' : 'Reset password'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-sm text-muted">
        Remembered it?{' '}
        <Link href="/login" className="font-medium text-fg underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
