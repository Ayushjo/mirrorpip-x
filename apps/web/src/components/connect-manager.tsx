'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, ClipboardPaste, Copy, Loader2, Plus, ShieldCheck, TriangleAlert, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Card, Field, Input, Select, cx, fmtUsd } from './ui';
import { Sheet } from './sheet';
import { Menu } from './section';
import { FieldError } from './password-field';
import { renameCredential } from '@/lib/account-actions';

// Our servers call the exchange from these fixed egress IPs (Railway static
// outbound IPs, shared regional pool — same set for web + engine). If a user
// enables IP whitelisting on their Delta key, they must allow all of them.
const WHITELIST_IPS = (process.env.NEXT_PUBLIC_DELTA_WHITELIST_IPS ?? '208.77.246.240,208.77.246.241,208.77.246.242')
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
  lastCheckedAt?: string | null;
}
interface ExchangeOption {
  id: string;
  displayName: string;
  availability: 'ACTIVE' | 'DISABLED' | 'COMING_SOON';
  message?: string;
  supportedCurrencies: Array<'USDT' | 'INR'>;
  credentialInstructions: string;
}

const MARK: Record<string, { m: string; tone: string }> = {
  DELTA_INDIA: { m: 'Δ', tone: 'from-brand to-accent' },
  BINANCE: { m: '◈', tone: 'from-[#f0b90b] to-[#f8d12f]' },
  BYBIT: { m: 'B', tone: 'from-[#f7a600] to-[#ffc107]' },
  COINSWITCH: { m: 'C', tone: 'from-[#2b2b2b] to-[#3a3a3a]' },
  SHARK: { m: 'S', tone: 'from-[#2b2b2b] to-[#3a3a3a]' },
};
const markOf = (id: string) => MARK[id] ?? { m: id[0] ?? '?', tone: 'from-[#2b2b2b] to-[#3a3a3a]' };

async function copyText(text: string, msg = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(msg);
  } catch {
    toast.error('Could not copy — copy it manually.');
  }
}

/** "3m ago" — computed after mount so server and client markup match. */
function useAgo(iso?: string | null) {
  const [s, setS] = useState<string | null>(null);
  useEffect(() => {
    if (!iso) return;
    const f = () => {
      const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
      setS(m < 1 ? 'just now' : m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`);
    };
    f();
    const id = setInterval(f, 60000);
    return () => clearInterval(id);
  }, [iso]);
  return s;
}

/* ─── wallet card ───────────────────────────────────────────────────────── */
function WalletCard({ c, exchangeName, onRename, onApply, onRemove, onReconnect }: { c: Credential; exchangeName: string; onRename: () => void; onApply: () => void; onRemove: () => void; onReconnect: () => void }) {
  const ago = useAgo(c.lastCheckedAt);
  const unhealthy = Boolean(c.lastError) || c.status !== 'ACTIVE';
  const mk = markOf(c.exchange);
  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="vcard vcard-flat relative flex h-60 w-[82vw] max-w-[22rem] shrink-0 snap-start flex-col justify-between overflow-visible rounded-[1.75rem] p-5 sm:w-auto sm:max-w-none">
      <div className="vcard-sheen pointer-events-none absolute inset-0 rounded-[1.75rem]" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={cx('grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-lg font-bold text-[#050b17]', mk.tone)}>{mk.m}</span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold text-fg">{c.label}</div>
            <div className="text-xs text-muted">{exchangeName} · {c.tradeCurrency}</div>
          </div>
        </div>
        <Menu
          items={[
            { label: 'Rename', onClick: onRename },
            ...(c.isLeader ? [] : c.status === 'ACTIVE' ? [{ label: 'Apply as leader', onClick: onApply }] : []),
            ...(unhealthy ? [{ label: 'Reconnect', onClick: onReconnect }] : []),
            { label: 'Remove account', danger: true, onClick: onRemove },
          ]}
        />
      </div>

      <div className="relative">
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">Equity</div>
        <div className="mt-1 text-3xl font-semibold tabular-nums text-fg" style={{ letterSpacing: '-0.03em' }}>{c.equityUsd != null ? fmtUsd(c.equityUsd) : '—'}</div>
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div>
          <div className="font-mono text-sm tracking-[0.2em] text-white/60">•••• {c.keyLast4}</div>
          <div className={cx('mt-1.5 inline-flex items-center gap-1.5 text-[11px]', unhealthy ? 'text-warn' : 'text-up')} suppressHydrationWarning>
            <span className={cx('h-1.5 w-1.5 rounded-full', unhealthy ? 'bg-warn' : 'bg-up shadow-[0_0_8px_rgba(16,185,129,0.8)]')} />
            {unhealthy ? 'Reconnect required' : `Healthy${ago ? ` · checked ${ago}` : ''}`}
          </div>
        </div>
        {c.leaderStatus ? (
          <span className={cx('rounded-full px-2 py-0.5 text-[10px] font-semibold', c.leaderStatus === 'VERIFIED' ? 'bg-brand/20 text-brand' : c.leaderStatus === 'PENDING' ? 'bg-warn/15 text-warn' : 'bg-white/10 text-muted')}>
            {c.leaderStatus === 'VERIFIED' ? 'Leader' : c.leaderStatus === 'PENDING' ? 'Leader · pending' : `Leader · ${c.leaderStatus.toLowerCase()}`}
          </span>
        ) : unhealthy ? (
          <button type="button" onClick={onReconnect} className="rounded-full bg-warn/15 px-2.5 py-1 text-[11px] font-semibold text-warn hover:bg-warn/25">Reconnect</button>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ─── connect wizard ────────────────────────────────────────────────────── */
function ConnectWizard({ open, onClose, exchanges, prefill, onDone }: { open: boolean; onClose: () => void; exchanges: ExchangeOption[]; prefill?: { label: string; exchange: string } | null; onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [exchangeId, setExchangeId] = useState('DELTA_INDIA');
  const [label, setLabel] = useState('My account');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [tradeCurrency, setTradeCurrency] = useState<'USDT' | 'INR'>('USDT');
  const [state, setState] = useState<'idle' | 'verifying' | 'done'>('idle');
  const [err, setErr] = useState<string | null>(null);
  const [help, setHelp] = useState(false);
  const selected = exchanges.find((e) => e.id === exchangeId)!;

  useEffect(() => {
    if (!open) return;
    setStep(prefill ? 1 : 0);
    setExchangeId(prefill?.exchange ?? 'DELTA_INDIA');
    setLabel(prefill?.label ?? 'My account');
    setApiKey('');
    setApiSecret('');
    setState('idle');
    setErr(null);
  }, [open, prefill]);

  const paste = async (set: (v: string) => void) => {
    try {
      set((await navigator.clipboard.readText()).trim());
    } catch {
      toast.error('Clipboard blocked — paste manually.');
    }
  };

  async function verify() {
    setStep(2);
    setState('verifying');
    setErr(null);
    try {
      const res = await fetch('/api/credentials', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exchange: exchangeId, tradeCurrency, settings: {}, label, apiKey, apiSecret }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(body.error ?? 'Could not connect that account.');
        setState('idle');
        setStep(1);
        return;
      }
      setState('done');
      toast.success('Account connected and verified');
      setTimeout(() => {
        onDone();
        onClose();
      }, 900);
    } catch {
      setErr('Could not reach the server. Please try again.');
      setState('idle');
      setStep(1);
    }
  }

  const keysOk = label.trim().length > 0 && apiKey.trim().length >= 8 && apiSecret.trim().length >= 8;
  const STEPS = ['Exchange', 'API key', 'Verify'];

  return (
    <Sheet open={open} onClose={() => state !== 'verifying' && onClose()} title={prefill ? `Reconnect ${prefill.label}` : 'Connect an exchange'} sub="Trade-only keys. Withdrawals are never possible.">
      {/* step dots */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors', i < step || state === 'done' ? 'bg-up text-[#050b17]' : i === step ? 'bg-brand text-[#050b17]' : 'bg-white/10 text-muted')}>{i < step || state === 'done' ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}</span>
            <span className={cx('hidden text-xs sm:inline', i === step ? 'text-fg' : 'text-muted')}>{s}</span>
            {i < STEPS.length - 1 && <span className={cx('h-px flex-1', i < step ? 'bg-up/60' : 'bg-white/10')} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {step === 0 && (
          <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
            {exchanges.map((e) => {
              const on = e.id === exchangeId;
              const disabled = e.availability !== 'ACTIVE';
              const mk = markOf(e.id);
              return (
                <button key={e.id} type="button" disabled={disabled} onClick={() => { setExchangeId(e.id); setTradeCurrency(e.supportedCurrencies[0] ?? 'USDT'); }} className={cx('flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors', on ? 'border-brand/60 bg-brand/[0.08]' : 'border-white/10 bg-[#050b17] hover:border-white/20', disabled && 'cursor-not-allowed opacity-50')}>
                  <span className={cx('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br font-bold', mk.tone, disabled ? 'text-white/50' : 'text-[#050b17]')}>{mk.m}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-fg">{e.displayName}</div>
                    <div className="text-xs text-muted">{e.message ?? e.supportedCurrencies.join(' / ')}</div>
                  </div>
                  <span className={cx('grid h-5 w-5 place-items-center rounded-full border', on ? 'border-brand bg-brand text-[#050b17]' : 'border-white/20')}>{on && <Check className="h-3 w-3" strokeWidth={3} />}</span>
                </button>
              );
            })}
            <Button type="button" arrow className="mt-4 w-full justify-center" disabled={selected.availability !== 'ACTIVE'} onClick={() => setStep(1)}>Continue</Button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={(e) => { e.preventDefault(); if (keysOk) void verify(); }} className="space-y-4">
            <div className="rounded-2xl bg-[#050b17]">
              <button type="button" onClick={() => setHelp((v) => !v)} className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-fg">
                Where do I find my API key?
                <ChevronDown className={cx('h-4 w-4 text-muted transition-transform', help && 'rotate-180')} />
              </button>
              <AnimatePresence initial={false}>
                {help && (
                  <motion.ol initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-2 overflow-hidden px-4 pb-4 text-xs text-muted">
                    {['Open Delta Exchange India → Account → API Keys.', 'Create a new key. Enable Read and Trading. Keep Withdrawals OFF.', `Optional: restrict by IP — add ${WHITELIST_IPS.join(', ')}.`, 'Copy the key and secret and paste them below.'].map((t, i) => (
                      <li key={i} className="flex gap-2"><span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-white/10 text-[10px] font-semibold text-fg">{i + 1}</span>{t}</li>
                    ))}
                  </motion.ol>
                )}
              </AnimatePresence>
            </div>
            <Field label="Label"><Input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={40} /></Field>
            {selected.supportedCurrencies.length > 1 && (
              <Field label="Trading currency">
                <Select value={tradeCurrency} onChange={(e) => setTradeCurrency(e.target.value as 'USDT' | 'INR')}>{selected.supportedCurrencies.map((c) => <option key={c}>{c}</option>)}</Select>
              </Field>
            )}
            {([['API key', apiKey, setApiKey, false], ['API secret', apiSecret, setApiSecret, true]] as const).map(([l, v, set, secret]) => (
              <Field key={l} label={l}>
                <div className="relative">
                  <Input type={secret ? 'password' : 'text'} value={v} onChange={(e) => { set(e.target.value); setErr(null); }} placeholder={`Paste your ${l.toLowerCase()}`} autoComplete="off" className="pr-24 font-mono" />
                  <button type="button" onClick={() => paste(set)} className="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-muted hover:text-fg"><ClipboardPaste className="h-3 w-3" /> Paste</button>
                </div>
              </Field>
            ))}
            <FieldError msg={err} />
            <p className="text-[11px] text-faint">Encrypted with AES-256-GCM. The secret is never shown again.</p>
            <div className="flex gap-2">
              {!prefill && <Button type="button" variant="subtle" onClick={() => setStep(0)}>Back</Button>}
              <Button type="submit" arrow className="flex-1 justify-center" disabled={!keysOk}>Verify & connect</Button>
            </div>
          </motion.form>
        )}

        {step === 2 && (
          <motion.div key="s2" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-8 text-center">
            <div className="relative grid h-20 w-20 place-items-center">
              {state === 'done' ? (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }} className="grid h-20 w-20 place-items-center rounded-full bg-up text-[#050b17]"><Check className="h-9 w-9" strokeWidth={3} /></motion.span>
              ) : (
                <>
                  <span className="pulse-ring absolute h-20 w-20 rounded-full border border-brand/40" />
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-brand/15 text-brand"><Loader2 className="h-7 w-7 animate-spin" /></span>
                </>
              )}
            </div>
            <div className="mt-5 text-base font-semibold text-fg">{state === 'done' ? 'Connected' : `Verifying with ${selected.displayName}…`}</div>
            <div className="mt-1 text-sm text-muted">{state === 'done' ? `${label} is ready to copy leaders.` : 'Checking permissions and reading your balance.'}</div>
            {state !== 'done' && <div className="skeleton mt-6 h-1.5 w-48 rounded-full" />}
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

/* ─── manager ───────────────────────────────────────────────────────────── */
export function ConnectManager({ initial, exchanges }: { initial: Credential[]; exchanges: ExchangeOption[] }) {
  const [creds, setCreds] = useState<Credential[]>(initial);
  const [wizard, setWizard] = useState<{ open: boolean; prefill: { label: string; exchange: string } | null }>({ open: false, prefill: null });
  const [apply, setApply] = useState<Credential | null>(null);
  const [applyName, setApplyName] = useState('');
  const [remove, setRemove] = useState<Credential | null>(null);
  const [typed, setTyped] = useState('');
  const [rename, setRename] = useState<Credential | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [busy, setBusy] = useState(false);
  const nameOf = (id: string) => exchanges.find((e) => e.id === id)?.displayName ?? id;

  async function refresh() {
    const res = await fetch('/api/credentials');
    if (res.ok) setCreds((await res.json()).data);
  }

  async function doApply() {
    if (!apply) return;
    setBusy(true);
    const res = await fetch('/api/leaders/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credentialId: apply.id, displayName: applyName.trim() }) });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return toast.error(body.error ?? 'Could not submit application.');
    toast.success('Applied — an admin will review it shortly.');
    setApply(null);
    setApplyName('');
    await refresh();
  }
  async function doRemove() {
    if (!remove) return;
    setBusy(true);
    const res = await fetch(`/api/credentials/${remove.id}`, { method: 'DELETE' });
    setBusy(false);
    if (!res.ok) return toast.error((await res.json().catch(() => ({}))).error ?? 'Could not remove that account.');
    toast.success(`${remove.label} removed`);
    setRemove(null);
    setTyped('');
    await refresh();
  }
  async function doRename() {
    if (!rename) return;
    setBusy(true);
    const r = await renameCredential(rename.id, newLabel.trim());
    setBusy(false);
    if (!r.ok) return toast.error(r.error);
    setCreds((cs) => cs.map((c) => (c.id === rename.id ? { ...c, label: newLabel.trim() } : c)));
    toast.success('Renamed');
    setRename(null);
  }

  return (
    <div className="space-y-8">
      {/* wallet */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Your accounts</h2>
            <p className="text-sm text-muted">{creds.length === 0 ? 'Nothing connected yet.' : `${creds.length} connected · keys encrypted at rest`}</p>
          </div>
          {creds.length > 0 && (
            <Button type="button" onClick={() => setWizard({ open: true, prefill: null })} className="shrink-0">
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Connect account</span><span className="sm:hidden">Connect</span>
            </Button>
          )}
        </div>

        {creds.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="vcard relative grid h-48 w-80 max-w-full place-items-center overflow-hidden rounded-[1.75rem] border-dashed opacity-80 [transform:none!important]">
              <div className="vcard-sheen pointer-events-none absolute inset-0" />
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand to-accent text-2xl font-bold text-[#050b17]">Δ</span>
            </div>
            <div className="mt-6 text-lg font-semibold text-fg">Connect your first exchange</div>
            <p className="mt-1 max-w-sm text-sm text-muted">Add a trade-only Delta India key to start copying leaders. It takes about two minutes.</p>
            <Button type="button" arrow className="mt-5" onClick={() => setWizard({ open: true, prefill: null })}>Connect account</Button>
          </div>
        ) : (
          <div className="no-scrollbar -mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            <AnimatePresence initial={false}>
              {creds.map((c) => (
                <WalletCard
                  key={c.id}
                  c={c}
                  exchangeName={nameOf(c.exchange)}
                  onRename={() => { setRename(c); setNewLabel(c.label); }}
                  onApply={() => { setApply(c); setApplyName(''); }}
                  onRemove={() => { setRemove(c); setTyped(''); }}
                  onReconnect={() => setWizard({ open: true, prefill: { label: c.label, exchange: c.exchange } })}
                />
              ))}
            </AnimatePresence>
            <button type="button" onClick={() => setWizard({ open: true, prefill: null })} className="group grid h-60 w-[60vw] max-w-[16rem] shrink-0 snap-start place-items-center rounded-[1.75rem] border border-dashed border-white/15 text-muted transition-colors hover:border-brand/50 hover:text-brand sm:w-auto sm:max-w-none">
              <span className="flex flex-col items-center gap-2 text-sm font-medium">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] transition-colors group-hover:bg-brand/15"><Plus className="h-5 w-5" /></span>
                Add account
              </span>
            </button>
          </div>
        )}
      </section>

      {/* info row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand"><Users className="h-4 w-4" /></span>
            <div>
              <div className="text-base font-semibold text-fg">Become a leader</div>
              <p className="mt-1 text-sm text-muted">Apply from any connected account&rsquo;s menu. An admin verifies you before you appear on the leaderboard.</p>
              <Link href="/leaders" className="mt-3 inline-block text-xs font-medium text-brand hover:text-accent">See the leaderboard →</Link>
            </div>
          </div>
        </Card>
        {WHITELIST_IPS.length > 0 && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-muted"><ShieldCheck className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-base font-semibold text-fg">Restrict your key by IP <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-muted">Optional</span></div>
                <p className="mt-1 text-sm text-muted">If you whitelist IPs on Delta, allow all of these.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {WHITELIST_IPS.map((ip) => (
                    <button key={ip} type="button" onClick={() => copyText(ip, `Copied ${ip}`)} className="inline-flex items-center gap-1.5 rounded-full bg-[#050b17] px-3 py-1.5 font-mono text-xs text-fg hover:text-brand"><Copy className="h-3 w-3" />{ip}</button>
                  ))}
                  <button type="button" onClick={() => copyText(WHITELIST_IPS.join(', '), 'Copied all IPs')} className="rounded-full px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10">Copy all</button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <ConnectWizard open={wizard.open} prefill={wizard.prefill} exchanges={exchanges} onClose={() => setWizard({ open: false, prefill: null })} onDone={refresh} />

      <Sheet open={!!apply} onClose={() => setApply(null)} title="Apply to become a leader" sub={apply ? `Using ${apply.label} · ${nameOf(apply.exchange)}` : undefined}>
        <form onSubmit={(e) => { e.preventDefault(); void doApply(); }} className="space-y-4">
          <Field label="Public leader name" hint="Shown on the leaderboard. 2–60 characters."><Input value={applyName} onChange={(e) => setApplyName(e.target.value)} maxLength={60} placeholder="e.g. Nova Swing" autoFocus /></Field>
          <ul className="space-y-1.5 text-xs text-muted">
            {['Followers mirror your fills automatically.', 'You keep trading exactly as you do today.', 'An admin reviews your account before listing.'].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-up" strokeWidth={3} />{t}</li>)}
          </ul>
          <Button type="submit" arrow className="w-full justify-center" disabled={busy || applyName.trim().length < 2}>{busy ? 'Submitting…' : 'Submit application'}</Button>
        </form>
      </Sheet>

      <Sheet open={!!rename} onClose={() => setRename(null)} title="Rename account" width="max-w-md">
        <form onSubmit={(e) => { e.preventDefault(); void doRename(); }} className="space-y-4">
          <Field label="Label"><Input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={40} autoFocus /></Field>
          <Button type="submit" className="w-full justify-center" disabled={busy || newLabel.trim().length === 0 || newLabel.trim() === rename?.label}>{busy ? 'Saving…' : 'Save'}</Button>
        </form>
      </Sheet>

      <Sheet open={!!remove} onClose={() => setRemove(null)} title={`Remove ${remove?.label ?? 'account'}?`} sub="Its API key is wiped from our servers." tone="danger" width="max-w-md">
        <div className="space-y-4">
          <div className="flex gap-2 rounded-2xl bg-warn/10 p-3 text-xs text-warn"><TriangleAlert className="h-4 w-4 shrink-0" />Copies using this account stop immediately. Open positions stay open on your exchange.{remove?.isLeader ? ' Your leader profile is removed.' : ''}</div>
          <Field label={`Type “${remove?.label ?? ''}” to confirm`}><Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" /></Field>
          <button type="button" disabled={busy || typed.trim() !== remove?.label} onClick={() => void doRemove()} className="w-full rounded-full bg-down py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-30">{busy ? 'Removing…' : 'Remove account'}</button>
        </div>
      </Sheet>
    </div>
  );
}
