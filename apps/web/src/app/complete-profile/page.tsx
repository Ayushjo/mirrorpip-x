'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { Button, Field, Input, Select } from '@/components/ui';

/** Shown to signed-in users missing ToS/risk consent (e.g. OAuth signups). */
export default function CompleteProfilePage() {
  const router = useRouter();
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [intendedRole, setIntendedRole] = useState('');
  const [agreeTos, setAgreeTos] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const canSubmit = agreeTos && agreeRisk && country.length === 2 && city.trim().length > 0 && postalCode.trim().length > 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/account/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          agreeTos,
          agreeRisk,
          country,
          city: city.trim(),
          postalCode: postalCode.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(intendedRole ? { intendedRole } : {}),
        }),
      });
      if (!res.ok) {
        setError(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not save. Please try again.');
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
    <div className="mx-auto w-full max-w-sm py-10">
      <h1 className="text-4xl leading-tight tracking-tight text-black" style={{ letterSpacing: '-0.03em' }}>
        One last step
      </h1>
      <p className="mt-2 text-sm text-muted">
        Before you use BelieveMeGuys, tell us where you're based and accept the terms — required for compliance.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <Field label="Country">
          <Select value={country} onChange={(e) => setCountry(e.target.value)} required>
            <option value="">Select country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" autoComplete="address-level2" />
          </Field>
          <Field label="PIN / ZIP code">
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required placeholder="400001" autoComplete="postal-code" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone (optional)">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91…" autoComplete="tel" />
          </Field>
          <Field label="I want to…">
            <Select value={intendedRole} onChange={(e) => setIntendedRole(e.target.value)}>
              <option value="">Choose…</option>
              <option value="follower">Copy verified leaders</option>
              <option value="leader">Lead and share my trades</option>
              <option value="both">Both</option>
            </Select>
          </Field>
        </div>

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

        {error && <p className="rounded-lg bg-[rgba(209,41,61,0.08)] px-3 py-2 text-sm text-down">{error}</p>}

        <Button type="submit" arrow className="w-full justify-center" disabled={busy || !canSubmit}>
          {busy ? 'Saving…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
