'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Button, Field, Input } from '@/components/ui';
import { AuthShell } from '@/components/auth-shell';

const RESEND_COOLDOWN_SEC = 30;
// Demo-only: when enabled, the typed code is ignored and the real server code is
// fetched so any 6 digits verify. MUST stay off outside demos (see /api/demo/otp).
const DEMO_OTP_BYPASS = process.env.NEXT_PUBLIC_DEMO_OTP_BYPASS === 'true';

function VerifyForm() {
  const params = useSearchParams();
  const email = params.get('email') ?? '';
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Refs (not state) so `verify` stays referentially stable — otherwise it would
  // be re-created whenever `busy` toggles, re-triggering the auto-submit effect
  // and re-posting the same (wrong) code in a loop (the "flickering error" bug).
  const busyRef = useRef(false);
  const submittedFor = useRef<string | null>(null);

  const verify = useCallback(
    async (code: string) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);
      try {
        let otpToUse = code;
        if (DEMO_OTP_BYPASS) {
          try {
            const r = await fetch(`/api/demo/otp?email=${encodeURIComponent(email)}`);
            if (r.ok) {
              const j = (await r.json()) as { data?: { otp?: string | null } };
              if (j.data?.otp) otpToUse = j.data.otp;
            }
          } catch {
            /* fall back to the typed code */
          }
        }
        const res = await authClient.emailOtp.verifyEmail({ email, otp: otpToUse });
        if (res.error) {
          // Leave submittedFor set to this code so the auto-submit effect won't
          // immediately retry it; the user edits the code to try again.
          setError(res.error.message ?? 'That code did not work. Check it and try again.');
          return;
        }
        // New signups always need the profile step next — go straight there with a
        // full navigation so the header/session render fresh (no dashboard flash,
        // no stale account menu).
        window.location.assign('/complete-profile');
      } catch {
        setError('Could not reach the server. Please try again.');
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [email],
  );

  // Auto-submit as soon as a full 6-digit code is entered or pasted (once per code).
  useEffect(() => {
    if (otp.length === 6 && submittedFor.current !== otp) {
      submittedFor.current = otp;
      void verify(otp);
    }
  }, [otp, verify]);

  // Resend cooldown countdown.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    void verify(otp);
  }

  async function resend() {
    if (cooldown > 0) return;
    setError(null);
    setInfo(null);
    setCooldown(RESEND_COOLDOWN_SEC);
    try {
      const res = await authClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
      if (res.error) {
        setCooldown(0);
        setError(res.error.message ?? 'Could not resend the code. Try again in a moment.');
        return;
      }
      setInfo('A new code is on its way.');
    } catch {
      setCooldown(0);
      setError('Could not resend the code. Try again in a moment.');
    }
  }

  return (
    <div className="w-full">
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
        {cooldown > 0 ? (
          <span className="text-faint">Resend code in {cooldown}s</span>
        ) : (
          <button type="button" onClick={resend} className="font-medium text-black underline-offset-4 hover:underline">
            Resend code
          </button>
        )}
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
    <AuthShell
      image="/media/verify-hero.png"
      title={
        <>
          Almost
          <br />
          there.
        </>
      }
      subtitle="Confirm your email with the 6-digit code and your account is live."
    >
      <Suspense>
        <VerifyForm />
      </Suspense>
    </AuthShell>
  );
}
