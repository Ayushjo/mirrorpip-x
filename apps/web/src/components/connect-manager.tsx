'use client';

import { useState } from 'react';
import { Badge, Button, Card, Field, Input, cx, fmtUsd } from './ui';

interface Credential {
  id: string;
  exchange: string;
  label: string;
  keyLast4: string;
  baseCurrency: string;
  status: string;
  isLeader: boolean;
  equityUsd: number | null;
}

export function ConnectManager({ initial }: { initial: Credential[] }) {
  const [creds, setCreds] = useState<Credential[]>(initial);
  const [label, setLabel] = useState('My account');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [applyId, setApplyId] = useState<string | null>(null);
  const [applyName, setApplyName] = useState('');

  async function apply(id: string) {
    setError(null);
    setMsg(null);
    const res = await fetch('/api/leaders/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: id, displayName: applyName }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Could not submit application.');
      return;
    }
    setMsg('Applied to be a leader — an admin will review it shortly.');
    setApplyId(null);
    setApplyName('');
    await refresh();
  }

  async function refresh() {
    const res = await fetch('/api/credentials');
    if (res.ok) setCreds((await res.json()).data);
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setBusy(true);
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange: 'DELTA_INDIA', label, apiKey, apiSecret }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? 'Could not connect that account.');
        return;
      }
      setMsg('Account connected and verified.');
      setApiKey('');
      setApiSecret('');
      setLabel('My account');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      setError((await res.json()).error ?? 'Could not remove that account.');
      return;
    }
    await refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div>
        <Card>
          <h2 className="text-base font-semibold">Connect a Delta India account</h2>
          <p className="mt-1 text-sm text-muted">
            Create an API key in Delta with <span className="text-fg">Trading enabled</span> and{' '}
            <span className="text-fg">Withdrawals disabled</span>. We verify it, encrypt it, and never show it
            again.
          </p>
          <form onSubmit={add} className="mt-5 space-y-4">
            <Field label="Label">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} required />
            </Field>
            <Field label="API key">
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} required placeholder="delta api key" autoComplete="off" />
            </Field>
            <Field label="API secret" hint="Stored AES-256-GCM encrypted. Never displayed after this.">
              <Input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
                placeholder="delta api secret"
                autoComplete="off"
              />
            </Field>
            {error && <p className="rounded-lg bg-[rgba(244,63,94,0.1)] px-3 py-2 text-sm text-down">{error}</p>}
            {msg && <p className="rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand">{msg}</p>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Verifying with exchange…' : 'Connect account'}
            </Button>
          </form>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-base font-semibold">Connected accounts</h2>
        {creds.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted">No accounts connected yet.</Card>
        ) : (
          <div className="space-y-3">
            {creds.map((c) => (
              <Card key={c.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.label}</span>
                      <Badge tone={c.status === 'ACTIVE' ? 'up' : 'down'}>{c.status}</Badge>
                      {c.isLeader && <Badge tone="brand">Leader</Badge>}
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      Delta India · key ••••{c.keyLast4}
                      {c.equityUsd != null && <> · {fmtUsd(c.equityUsd)}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!c.isLeader && c.status === 'ACTIVE' && (
                      <button
                        onClick={() => setApplyId(applyId === c.id ? null : c.id)}
                        className="rounded-lg px-3 py-1.5 text-xs text-brand hover:bg-brand-soft"
                      >
                        Become a leader
                      </button>
                    )}
                    <button
                      onClick={() => remove(c.id)}
                      className={cx('rounded-lg px-3 py-1.5 text-xs text-down hover:bg-[rgba(244,63,94,0.1)]')}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {applyId === c.id && (
                  <div className="mt-3 flex gap-2 border-t border-border-soft pt-3">
                    <Input
                      value={applyName}
                      onChange={(e) => setApplyName(e.target.value)}
                      placeholder="Public leader name"
                      maxLength={60}
                    />
                    <Button onClick={() => apply(c.id)} disabled={applyName.trim().length < 2} className="shrink-0">
                      Apply
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
