'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/countries';
import { Button, Field, Input, Select } from '@/components/ui';

type PostalHit = { city: string | null; state: string | null; country: string | null; countryCode: string | null };

/**
 * Compulsory onboarding step: collects location + role (and, for OAuth signups
 * that never saw the register checkboxes, ToS/risk consent). Rendered by the
 * server page which decides whether consent is still needed.
 */
export function CompleteProfileForm({
  needsConsent,
  defaultRole = '',
}: {
  needsConsent: boolean;
  defaultRole?: string;
}) {
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [intendedRole, setIntendedRole] = useState(defaultRole);
  const [agreeTos, setAgreeTos] = useState(false);
  const [agreeRisk, setAgreeRisk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pinHint, setPinHint] = useState<string | null>(null);
  // Tracks the city we auto-filled so a new PIN can replace it, but we never
  // clobber a value the user typed themselves.
  const autoCityRef = useRef<string>('');

  // Debounced PIN/ZIP → city + country autofill so the address matches the code.
  useEffect(() => {
    const code = postalCode.trim();
    if (code.length < 5) {
      setPinHint(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geo/postal?code=${encodeURIComponent(code)}`, { signal: ctrl.signal });
        if (!res.ok) return;
        const { data } = (await res.json()) as { data: PostalHit };
        if (!data?.city && !data?.countryCode) {
          setPinHint(null);
          return;
        }
        // Country: fill if empty and the code is a known 2-letter ISO we list.
        if (data.countryCode && data.countryCode.length === 2 && COUNTRIES.some((c) => c.code === data.countryCode)) {
          setCountry((prev) => prev || data.countryCode!);
        }
        // City: fill if empty, or if the current value is one we auto-filled.
        if (data.city) {
          setCity((prev) => {
            if (!prev || prev === autoCityRef.current) {
              autoCityRef.current = data.city!;
              return data.city!;
            }
            return prev;
          });
        }
        setPinHint([data.city, data.country].filter(Boolean).join(', ') || null);
      } catch {
        /* ignore lookup failures — the user can type manually */
      }
    }, 450);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [postalCode]);

  const locationOk = country.length === 2 && city.trim().length > 0 && postalCode.trim().length > 0;
  const consentOk = needsConsent ? agreeTos && agreeRisk : true;
  const canSubmit = locationOk && consentOk;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    try {
      const res = await fetch('/api/account/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...(needsConsent ? { agreeTos, agreeRisk } : {}),
          country,
          city: city.trim(),
          postalCode: postalCode.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(intendedRole ? { intendedRole } : {}),
        }),
      });
      if (!res.ok) {
        toast.error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? 'Could not save. Please try again.');
        return;
      }
      // Full navigation so the dashboard renders fresh with the completed profile
      // (checklist + header correct immediately).
      window.location.assign('/dashboard');
    } catch {
      toast.error('Could not reach the server. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <Field label="Country">
        <Select value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="country">
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
        <Field label="PIN / ZIP code" hint={pinHint ? `Detected: ${pinHint}` : 'City & country autofill from your PIN'}>
          <Input
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            required
            placeholder="400001"
            autoComplete="postal-code"
            inputMode="numeric"
          />
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

      {needsConsent && (
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

      <Button type="submit" arrow className="w-full justify-center" disabled={busy || !canSubmit}>
        {busy ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  );
}
