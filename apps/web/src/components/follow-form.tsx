'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Card, Field, Input, Select, cx } from './ui';

interface Cred {
  id: string;
  label: string;
  keyLast4: string;
  exchange: string;
}

const SIZING = [
  { value: 'PROPORTIONAL', label: 'Proportional', hint: 'Scale by your equity vs the leader’s. Value is a multiplier (1 = same %).' },
  { value: 'MULTIPLIER', label: 'Multiplier', hint: 'Copy the leader’s quantity × your value.' },
  { value: 'FIXED_MARGIN', label: 'Fixed notional', hint: 'Spend a fixed USD notional per leader entry (value = USD).' },
] as const;

export function FollowForm({ leaderId, leaderName, leaderExchange, creds }: { leaderId: string; leaderName: string; leaderExchange: string; creds: Cred[] }) {
  const router = useRouter();
  const [credentialId, setCredentialId] = useState(creds[0]?.id ?? '');
  const [sizingMode, setSizingMode] = useState<'PROPORTIONAL' | 'MULTIPLIER' | 'FIXED_MARGIN'>('PROPORTIONAL');
  const [sizingValue, setSizingValue] = useState('1');
  const [maxPositionUsd, setMaxPositionUsd] = useState('');
  const [dailyLossLimitUsd, setDailyLossLimitUsd] = useState('');
  const [copyReverse, setCopyReverse] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const activeSizing = SIZING.find((s) => s.value === sizingMode)!;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderId,
          credentialId,
          sizingMode,
          sizingValue: Number(sizingValue),
          maxPositionUsd: maxPositionUsd ? Number(maxPositionUsd) : null,
          dailyLossLimitUsd: dailyLossLimitUsd ? Number(dailyLossLimitUsd) : null,
          copyReverse,
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Could not start following.');
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (creds.length === 0) {
    return (
      <Card className="py-10 text-center">
        <p className="text-sm text-muted">You need a connected account before you can follow a leader.</p>
        <div className="mt-4">
          <Button onClick={() => router.push('/connect')}>Connect an account</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-5">
        <Field label="Copy into account" hint="Trades are translated to your account's exchange automatically.">
          <Select value={credentialId} onChange={(e) => setCredentialId(e.target.value)}>
            {creds.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} (••••{c.keyLast4}) · {c.exchange}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Sizing method" hint={activeSizing.hint}>
          <div className="grid grid-cols-3 gap-2">
            {SIZING.map((s) => (
              <button
                type="button"
                key={s.value}
                onClick={() => setSizingMode(s.value)}
                className={cx(
                  'rounded-xl border px-3 py-2.5 text-sm transition',
                  sizingMode === s.value
                    ? 'border-brand bg-brand-soft text-brand'
                    : 'border-border text-muted hover:text-fg',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={sizingMode === 'FIXED_MARGIN' ? 'Notional per trade (USD)' : 'Sizing value'}>
          <Input
            type="number"
            step="any"
            min="0"
            value={sizingValue}
            onChange={(e) => setSizingValue(e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Max position (USD)" hint="Optional cap per position.">
            <Input type="number" step="any" min="0" value={maxPositionUsd} onChange={(e) => setMaxPositionUsd(e.target.value)} placeholder="No cap" />
          </Field>
          <Field label="Daily loss limit (USD)" hint="Auto-pause after this realized loss.">
            <Input type="number" step="any" min="0" value={dailyLossLimitUsd} onChange={(e) => setDailyLossLimitUsd(e.target.value)} placeholder="No limit" />
          </Field>
        </div>

        <label className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm">
          <input type="checkbox" checked={copyReverse} onChange={(e) => setCopyReverse(e.target.checked)} className="h-4 w-4 accent-brand" />
          <span>
            <span className="font-medium">Reverse copy</span>
            <span className="ml-2 text-muted">Do the opposite of this leader (short when they go long).</span>
          </span>
        </label>

        <div className="rounded-xl border border-border-soft bg-surface-2 px-4 py-3 text-sm text-muted">
          <strong className="text-fg">What will be copied:</strong> every fill {leaderName} makes after you start on{' '}
          {leaderExchange} — mapped to the matching contract on your account's exchange, sized with your method above
          {copyReverse ? ', reversed' : ''}
          {maxPositionUsd ? `, capped at $${maxPositionUsd} per position` : ''}
          {dailyLossLimitUsd ? `, auto-paused after $${dailyLossLimitUsd} daily loss` : ''}. Instruments your exchange
          doesn't list are skipped. Past trades are not backfilled.
        </div>

        {error && <p className="rounded-lg bg-down/12 px-3 py-2 text-sm text-down">{error}</p>}

        <Button type="submit" className="w-full" disabled={busy || !credentialId}>
          {busy ? 'Starting…' : `Start following ${leaderName}`}
        </Button>
        <p className="text-center text-xs text-faint">
          Only trades placed after you start are copied. You can pause or stop anytime.
        </p>
      </form>
    </Card>
  );
}
