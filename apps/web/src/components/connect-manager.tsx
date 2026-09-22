'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, Field, Input, Select, cx, fmtUsd } from './ui';
import { ShieldIcon, LinkIcon, CheckIcon, UsersIcon } from './icons';

// Our servers call the exchange from these fixed egress IPs (Railway static
// outbound IPs, shared regional pool — same set for web + engine). If a user
// enables IP whitelisting on their Delta key, they must allow all of them.
// Overridable via env in case the region/pool ever changes.
const WHITELIST_IPS = (
  process.env.NEXT_PUBLIC_DELTA_WHITELIST_IPS ?? '208.77.246.240,208.77.246.241,208.77.246.242'
)
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

interface Credential {
  id: string;
  exchange: string;
  label: string;
  keyLast4: string;
  baseCurrency: string;
  tradeCurrency: string;
  status: string;
  isLeader: boolean;
  leaderStatus: string | null;
  equityUsd: number | null;
  lastError?: string | null;
}

interface ExchangeOption {
  id: string;
  displayName: string;
  availability: 'ACTIVE' | 'DISABLED' | 'COMING_SOON';
  message?: string;
  supportedCurrencies: Array<'USDT' | 'INR'>;
  credentialInstructions: string;
}

export function ConnectManager({ initial, exchanges }: { initial: Credential[]; exchanges: ExchangeOption[] }) {
  const [creds, setCreds] = useState<Credential[]>(initial);
  const [label, setLabel] = useState('My account');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [exchangeId, setExchangeId] = useState('DELTA_INDIA');
  const selected = exchanges.find((exchange) => exchange.id === exchangeId)!;
  const [tradeCurrency, setTradeCurrency] = useState<'USDT' | 'INR'>('USDT');
  const [busy, setBusy] = useState(false);

  const [applyId, setApplyId] = useState<string | null>(null);
  const [applyName, setApplyName] = useState('');

  async function copyText(text: string, msg = 'Copied') {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(msg);
    } catch {
      toast.error('Could not copy — copy it manually.');
    }
  }

  async function refresh() {
    const res = await fetch('/api/credentials');
    if (res.ok) setCreds((await res.json()).data);
  }

  async function apply(id: string) {
    const res = await fetch('/api/leaders/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credentialId: id, displayName: applyName }),
    });
    const body = await res.json();
    if (!res.ok) {
      toast.error(body.error ?? 'Could not submit application.');
      return;
    }
    toast.success('Applied to be a leader — an admin will review it shortly.');
    setApplyId(null);
    setApplyName('');
    await refresh();
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchange: exchangeId, tradeCurrency, settings: {}, label, apiKey, apiSecret }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast.error(body.error ?? 'Could not connect that account.');
        return;
      }
      toast.success('Account connected and verified.');
      setApiKey('');
      setApiSecret('');
      setLabel('My account');
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/credentials/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error((await res.json()).error ?? 'Could not remove that account.');
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-6">
      <div className="no-scrollbar -mx-6 flex snap-x gap-3 overflow-x-auto px-6 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {exchanges.map((exchange) => (
          <button key={exchange.id} type="button" disabled={exchange.availability !== 'ACTIVE'} onClick={() => { setExchangeId(exchange.id); setTradeCurrency(exchange.supportedCurrencies[0] ?? 'USDT'); }} className={cx('w-[68vw] shrink-0 snap-start rounded-2xl border p-5 text-left transition sm:w-auto', exchange.id === exchangeId ? 'border-brand bg-brand-soft/50' : 'border-border bg-surface', exchange.availability !== 'ACTIVE' && 'cursor-not-allowed opacity-45')}>
            <div className="font-medium">{exchange.displayName}</div>
            <div className="mt-1 text-xs text-muted">{exchange.message ?? exchange.supportedCurrencies.join(' / ')}</div>
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
      <div className="min-w-0">
        <Card>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
              <LinkIcon />
            </div>
            <h2 className="text-base font-semibold">Connect a {selected?.displayName} account</h2>
          </div>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border-soft bg-surface-2 px-3.5 py-3 text-xs text-muted">
            <span className="mt-0.5 text-brand">
              <ShieldIcon width={16} height={16} />
            </span>
            <span>
              {selected?.credentialInstructions} We verify it with a read-only account call, encrypt it with AES-256-GCM,
              and never show the secret again.
            </span>
          </div>

          {WHITELIST_IPS.length > 0 && (
            <div className="mt-4 rounded-xl border border-brand/25 bg-brand-soft/40 px-4 py-3.5">
              <div className="flex items-center gap-2 text-sm font-medium text-fg">
                <ShieldIcon width={16} height={16} className="text-brand" />
                Optional: restrict your key by IP
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                On Delta, you can turn on <strong className="font-medium text-fg">IP Whitelisting</strong> for your API
                key. If you do, add <strong className="font-medium text-fg">all</strong> of these addresses — our servers
                place your trades from them:
              </p>
              <div className="mt-3 space-y-1.5">
                {WHITELIST_IPS.map((ip) => (
                  <button
                    key={ip}
                    type="button"
                    onClick={() => copyText(ip, `Copied ${ip}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2 text-left font-mono text-sm text-fg transition-colors hover:border-brand/40"
                  >
                    <span>{ip}</span>
                    <span className="font-sans text-xs text-muted">Copy</span>
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => copyText(WHITELIST_IPS.join(', '), 'Copied all IPs')}
                  className="text-xs font-medium text-accent transition-colors hover:text-brand"
                >
                  Copy all
                </button>
                <span className="text-xs text-faint">Leaving the allowlist empty also works.</span>
              </div>
            </div>
          )}

          <form onSubmit={add} className="mt-5 space-y-4">
            <Field label="Label">
              <Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} required />
            </Field>
            {selected?.supportedCurrencies.length > 1 && (
              <Field label="Trading currency">
                <Select value={tradeCurrency} onChange={(e) => setTradeCurrency(e.target.value as 'USDT' | 'INR')}>
                  {selected.supportedCurrencies.map((currency) => <option key={currency}>{currency}</option>)}
                </Select>
              </Field>
            )}
            <Field label="API key">
              <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} required placeholder="exchange API key" autoComplete="off" />
            </Field>
            <Field label="API secret" hint="Stored AES-256-GCM encrypted. Never displayed after this.">
              <Input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                required
                placeholder="exchange API secret"
                autoComplete="off"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Verifying with exchange…' : 'Connect account'}
            </Button>
          </form>
        </Card>
      </div>

      <div className="min-w-0">
        <Card className="mb-4 border-brand/20 bg-brand-soft/40">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface text-brand">
              <UsersIcon width={18} height={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-fg">Become a leader</h2>
              <p className="mt-1 text-sm text-muted">
                Connect an account, apply below, and an admin verifies you before you appear on the leaderboard. Status
                shows as Pending or Verified on each account.
              </p>
            </div>
          </div>
        </Card>
        <h2 className="mb-3 px-0 text-base font-semibold">Connected accounts</h2>
        {creds.length === 0 ? (
          <EmptyState
           
            title="No accounts connected"
            body="Connect your first exchange account above. Your keys are encrypted and can never withdraw funds."
          />
        ) : (
          <div className="space-y-3">
            {creds.map((c) => (
              <Card key={c.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-muted">
                      <LinkIcon width={18} height={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium">{c.label}</span>
                        <Badge tone={c.status === 'ACTIVE' ? 'up' : 'down'}>{c.status}</Badge>
                        {c.leaderStatus === 'PENDING' && <Badge tone="warn">Pending</Badge>}
                        {c.leaderStatus === 'VERIFIED' && <Badge tone="brand">Verified leader</Badge>}
                        {c.leaderStatus === 'PAUSED' && <Badge tone="neutral">Leader paused</Badge>}
                        {c.leaderStatus === 'DELISTED' && <Badge tone="down">Delisted</Badge>}
                      </div>
                      <div className="mt-1 text-xs text-faint">
                        {exchanges.find((exchange) => exchange.id === c.exchange)?.displayName ?? c.exchange} · {c.tradeCurrency} · key ••••{c.keyLast4}
                        {c.equityUsd != null && <> · {fmtUsd(c.equityUsd)}</>}
                      </div>
                      {c.lastError && <div className="mt-1 text-xs text-down">Reconnect required: {c.lastError}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 border-t border-border-soft pt-3 sm:border-0 sm:pt-0">
                    {!c.leaderStatus && c.status === 'ACTIVE' && (
                      <button
                        onClick={() => setApplyId(applyId === c.id ? null : c.id)}
                        className="flex-1 whitespace-nowrap rounded-full border border-brand/30 px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10 sm:flex-none"
                      >
                        Become a leader
                      </button>
                    )}
                    <button
                      onClick={() => remove(c.id)}
                      className="flex-1 whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-xs text-muted hover:border-down/40 hover:text-down sm:flex-none"
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
    </div>
  );
}
