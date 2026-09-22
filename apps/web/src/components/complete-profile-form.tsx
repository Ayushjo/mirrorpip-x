'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { COUNTRIES } from '@/lib/countries';
import { Button, Checkbox, Field, Input, Select, cx } from '@/components/ui';
import { Users, TrendingUp, Layers } from 'lucide-react';

function flag(code: string) {
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

const ROLES = [
  { id: 'follower', label: 'Copy leaders', hint: 'Mirror verified traders', Icon: Users },
  { id: 'leader', label: 'Lead', hint: 'Share my trades', Icon: TrendingUp },
  { id: 'both', label: 'Both', hint: 'Copy and lead', Icon: Layers },
] as const;

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
    <form onSubmit={submit} className="space-y-6">
      <section className="card-surface rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-[#050b17]">1</span>
          <h2 className="text-sm font-semibold text-fg">Where you&rsquo;re based</h2>
        </div>
        <div className="space-y-4">
          <Field label="Country">
            <Select value={country} onChange={(e) => setCountry(e.target.value)} required autoComplete="country">
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {`${flag(c.code)}\u2003${c.name}`}
                </option>
              ))}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="PIN / ZIP code" hint={pinHint ? `Detected: ${pinHint}` : 'City and country autofill from this'}>
              <Input
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
                placeholder="400001"
                autoComplete="postal-code"
                inputMode="numeric"
              />
            </Field>
            <Field label="City">
              <Input value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Mumbai" autoComplete="address-level2" />
            </Field>
          </div>
          <Field label="Phone (optional)">
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" autoComplete="tel" />
          </Field>
        </div>
      </section>

      <section className="card-surface rounded-3xl p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-[#050b17]">2</span>
          <h2 className="text-sm font-semibold text-fg">How you&rsquo;ll use BelieveMeGuys</h2>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {ROLES.map(({ id, label, hint, Icon }) => {
            const active = intendedRole === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setIntendedRole(id)}
                aria-pressed={active}
                className={cx(
                  'flex flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-all sm:p-4',
                  active ? 'border-brand/50 bg-brand/[0.08] shadow-[0_0_0_1px_rgba(0,176,255,0.2)]' : 'border-border bg-surface/60 hover:border-white/15',
                )}
              >
                <span className={cx('grid h-8 w-8 place-items-center rounded-lg', active ? 'bg-brand text-[#050b17]' : 'bg-white/[0.05] text-brand')}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-medium leading-tight text-fg">{label}</span>
                <span className="text-[11px] leading-tight text-muted">{hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      {needsConsent && (
        <section className="card-surface rounded-3xl p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-xs font-bold text-[#050b17]">3</span>
            <h2 className="text-sm font-semibold text-fg">Terms and risk</h2>
          </div>
          <div className="space-y-2">
            <Checkbox checked={agreeTos} onChange={setAgreeTos}>
              I accept the{' '}
              <Link href="/terms" className="font-medium text-fg underline underline-offset-2">Terms</Link> and{' '}
              <Link href="/privacy" className="font-medium text-fg underline underline-offset-2">Privacy Policy</Link>.
            </Checkbox>
            <Checkbox checked={agreeRisk} onChange={setAgreeRisk}>
              I understand copy-trading involves substantial risk of loss and past leader performance does not guarantee
              future results.
            </Checkbox>
          </div>
        </section>
      )}

      <Button type="submit" arrow className="w-full justify-center py-2.5" disabled={busy || !canSubmit}>
        {busy ? 'Saving…' : 'Continue to dashboard'}
      </Button>
    </form>
  );
}
