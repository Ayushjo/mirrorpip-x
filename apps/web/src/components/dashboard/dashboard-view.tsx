'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Inbox, Activity, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Badge, Card, EmptyBlock, LinkButton, cx, fmtNum, fmtUsd } from '../ui';
import { AreaChart, BarChart, DrawSparkline, Ring } from '../charts';
import { Reveal } from '../reveal';
import { Section, Menu } from '../section';

/* ─── types ─────────────────────────────────────────────────────────────── */
export type Status = 'ACTIVE' | 'PAUSED' | 'STOPPED';
export interface FollowRow {
  id: string;
  status: Status;
  sizingMode: string;
  sizingValue: number;
  account: { label: string; keyLast4: string };
  leader: { id: string; displayName: string };
  openPnl: number;
  realizedPnl: number;
}
export interface Analytics {
  summary: { totalCopies30d: number; copiesToday: number; filledCount: number; fillRate: number; activeFollows: number; openPnl: number; realizedPnl: number; winRate: number; closedCount: number; wins: number };
  activity: { date: string; count: number }[];
  pnlSeries: { at: string | null; value: number }[];
  byLeader: { name: string; copies: number; openPnl: number; realizedPnl: number }[];
  recent: { id: string; leader: string; symbol: string; side: string; qty: number; status: string; avgPrice: number | null; slippageBps: number | null; at: string | null }[];
}

const RANGES = [
  { id: '24h', label: '24h', ms: 86400e3 },
  { id: '7d', label: '7d', ms: 7 * 86400e3 },
  { id: '30d', label: '30d', ms: 30 * 86400e3 },
  { id: 'all', label: 'All', ms: Infinity },
] as const;
type RangeId = (typeof RANGES)[number]['id'];

const FAILED = new Set(['FAILED', 'ERROR', 'REJECTED']);
const statusTone: Record<string, 'up' | 'down' | 'warn' | 'neutral' | 'brand'> = { FILLED: 'up', PARTIAL: 'brand', SUBMITTED: 'brand', PENDING: 'warn', SKIPPED: 'neutral', FAILED: 'down', ERROR: 'down', REJECTED: 'down' };
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
const clock = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '—');

/* ─── live follows (SSE with poll fallback) ─────────────────────────────── */
function useLiveFollows(initial: FollowRow[]) {
  const [rows, setRows] = useState<FollowRow[]>(initial);
  const refresh = useCallback(async () => {
    const res = await fetch('/api/follows');
    if (res.ok) setRows((await res.json()).data);
  }, []);
  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    try {
      es = new EventSource('/api/follows/stream');
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (Array.isArray(d)) setRows(d);
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        if (!poll) poll = setInterval(refresh, 5000);
      };
    } catch {
      poll = setInterval(refresh, 5000);
    }
    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [refresh]);

  const setStatus = useCallback(
    async (id: string, status: Status, silent = false) => {
      let prev: Status | undefined;
      setRows((rs) => rs.map((r) => (r.id === id ? ((prev = r.status), { ...r, status }) : r)));
      const res = await fetch(`/api/follows/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).catch(() => null);
      if (!res?.ok) {
        if (prev) setRows((rs) => rs.map((r) => (r.id === id ? { ...r, status: prev! } : r)));
        toast.error('Could not update that copy. Please try again.');
        return;
      }
      if (!silent && prev && prev !== status) {
        const was = prev;
        toast.success(status === 'ACTIVE' ? 'Copying resumed' : status === 'PAUSED' ? 'Copying paused' : 'Copy stopped', {
          action: { label: 'Undo', onClick: () => void setStatus(id, was, true) },
        });
      }
      void refresh();
    },
    [refresh],
  );
  return { rows, setStatus };
}

/* ─── view ──────────────────────────────────────────────────────────────── */
export function DashboardView({
  firstName,
  initialFollows,
  analytics,
  now,
}: {
  firstName?: string;
  initialFollows: FollowRow[];
  analytics: Analytics;
  now: number;
}) {
  const { rows, setStatus } = useLiveFollows(initialFollows);
  const [range, setRange] = useState<RangeId>('7d');
  const cutoff = now - RANGES.find((r) => r.id === range)!.ms;
  const inRange = (iso: string | null) => range === 'all' || (!!iso && new Date(iso).getTime() >= cutoff);

  const series = useMemo(() => {
    const all = analytics.pnlSeries;
    const before = [...all].filter((p) => !inRange(p.at)).pop();
    const within = all.filter((p) => inRange(p.at));
    const base = before?.value ?? 0;
    return { points: [{ value: base, at: null }, ...within].map((p) => ({ value: p.value, label: p.at ? new Date(p.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined })), delta: (within.at(-1)?.value ?? base) - base };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics.pnlSeries, range, now]);
  const recent = useMemo(() => analytics.recent.filter((r) => inRange(r.at)), [analytics.recent, range, now]); // eslint-disable-line react-hooks/exhaustive-deps
  const activity = useMemo(
    () =>
      analytics.activity
        .filter((a) => range === 'all' || range === '30d' || new Date(a.date).getTime() >= cutoff - 86400e3)
        .map((a) => {
          const l = new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return { label: l, value: a.count, sub: `copies · ${l}` };
        }),
    [analytics.activity, range, cutoff],
  );

  const open = rows.reduce((n, r) => n + r.openPnl, 0);
  const pnl = series.delta + open;
  const active = rows.filter((r) => r.status === 'ACTIVE').length;
  const copies = range === '24h' ? analytics.summary.copiesToday : range === '7d' ? analytics.activity.slice(-7).reduce((n, a) => n + a.count, 0) : analytics.summary.totalCopies30d;
  const filled = recent.filter((r) => r.status === 'FILLED').length;
  const fillRate = recent.length ? Math.round((filled / recent.length) * 100) : analytics.summary.fillRate;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ── Portfolio hero ── */}
      <section className="relative -mx-6 -mt-10 overflow-hidden px-6 pb-6 pt-12 sm:mx-0 sm:mt-0 sm:rounded-3xl sm:px-10 sm:pb-8 sm:pt-10" style={{ background: 'radial-gradient(800px 320px at 20% -10%, rgba(0,176,255,0.16), transparent 60%), #0a1628' }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{firstName ? `Welcome back, ${firstName}` : 'Your portfolio'}</div>
            <div className="mt-3 text-xs text-muted">P&amp;L · {range === 'all' ? 'all time' : `last ${range}`} <span className="text-faint">(realized + open)</span></div>
            <div className={cx('mt-1 text-[2.75rem] font-semibold leading-none tabular-nums sm:text-6xl', pnl > 0 ? 'text-up' : pnl < 0 ? 'text-down' : 'text-fg')} style={{ letterSpacing: '-0.04em' }}>
              {`${pnl > 0 ? '+' : ''}${fmtUsd(pnl)}`}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className={cx('rounded-full px-2 py-0.5 font-semibold tabular-nums', open >= 0 ? 'bg-up/15 text-up' : 'bg-down/15 text-down')}>{open >= 0 ? '+' : ''}{fmtUsd(open)} open</span>
              <span className="text-muted">{fmtUsd(series.delta)} realized</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-full bg-white/[0.06] p-1">
              {RANGES.map((r) => (
                <button key={r.id} type="button" onClick={() => setRange(r.id)} aria-pressed={range === r.id} className={cx('relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors', range === r.id ? 'text-[#050b17]' : 'text-muted hover:text-fg')}>
                  {range === r.id && <motion.span layoutId="range-pill" className="absolute inset-0 rounded-full bg-gradient-to-r from-brand to-accent" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  <span className="relative">{r.label}</span>
                </button>
              ))}
            </div>
            <div className="hidden sm:block"><LinkButton href="/leaders" variant="ghost" arrow>Find leaders</LinkButton></div>
          </div>
        </div>
        <div className="-mx-6 mt-6 sm:-mx-10">
          {series.points.length >= 2 ? (
            <DrawSparkline key={range} points={series.points.map((p) => p.value)} stroke={series.delta >= 0 ? '#00b0ff' : '#ef4444'} className="h-16 w-full" height={64} />
          ) : (
            <div className="mx-6 h-16 rounded-2xl border border-dashed border-white/10 sm:mx-10" />
          )}
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            [String(active), active === 1 ? 'active copy' : 'active copies'],
            [String(copies), range === 'all' ? 'copies (30d)' : `copies · ${range}`],
            [`${fillRate}%`, 'fill rate'],
            [analytics.summary.closedCount > 0 ? `${Math.round(analytics.summary.winRate)}%` : '—', 'win rate'],
          ].map(([v, l]) => (
            <span key={l} className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 py-2 text-[13px] text-muted">
              <span className="font-semibold tabular-nums text-fg">{v}</span> {l}
            </span>
          ))}
        </div>
      </section>

      {/* ── Row 1: curve + ring ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Section title="Realized P&L" sub={`Cumulative, ${range === 'all' ? 'all time' : `last ${range}`}`} aside={<Badge tone={series.delta >= 0 ? 'up' : 'down'}>{fmtUsd(series.delta)}</Badge>} className="h-full">
            {series.points.length >= 2 ? <AreaChart data={series.points} height={200} /> : <EmptyBlock className="h-[200px]" icon={<Activity className="h-5 w-5" />} title="No closed trades in this range" body="Your curve draws as copied positions close." />}
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center sm:p-8">
            <h2 className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Win rate</h2>
            {analytics.summary.closedCount > 0 ? <Ring pct={analytics.summary.winRate} label="of closed trades" /> : <div className="grid h-[108px] w-[108px] place-items-center rounded-full border-[9px] border-dashed border-white/10 text-xs text-muted">No trades yet</div>}
            <div className="flex gap-6 text-sm">
              <div><div className="font-semibold tabular-nums text-up">{analytics.summary.wins}</div><div className="text-xs text-muted">wins</div></div>
              <div><div className="font-semibold tabular-nums text-down">{Math.max(0, analytics.summary.closedCount - analytics.summary.wins)}</div><div className="text-xs text-muted">losses</div></div>
              <div><div className="font-semibold tabular-nums">{analytics.summary.closedCount}</div><div className="text-xs text-muted">closed</div></div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* ── Row 2: live copies + today feed ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Section title="Live copies" sub="Pause, resume or stop any copy instantly." aside={<span className="inline-flex items-center gap-1.5 text-xs text-muted"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" />Live</span>} className="h-full">
            <CopyCards rows={rows} setStatus={setStatus} />
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section title="Activity" sub={range === '24h' ? 'Today' : `Last ${range === 'all' ? '40' : range}`} aside={<a href="#trades" className="text-xs font-medium text-brand hover:text-accent">View all</a>} className="h-full">
            <Feed items={recent.slice(0, 6)} />
          </Section>
        </Reveal>
      </div>

      {/* ── Row 3: bars + by leader ── */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Section title="Copy activity" sub="Trades mirrored per day" className="h-full">
            {activity.some((a) => a.value > 0) ? <BarChart data={activity} height={150} /> : <EmptyBlock className="h-[150px] !py-4" icon={<Activity className="h-5 w-5" />} title="No copies in this range" />}
          </Section>
        </Reveal>
        <Reveal delay={0.08}>
          <Section title="By leader" sub="Where your copies come from" className="h-full">
            <ByLeader data={analytics.byLeader} />
          </Section>
        </Reveal>
      </div>

      {/* ── Row 4: trades ── */}
      <Reveal>
        <div id="trades" className="scroll-mt-24">
          <Trades rows={recent} />
        </div>
      </Reveal>
    </div>
  );
}

/* ─── copy cards ────────────────────────────────────────────────────────── */
function CopyCards({ rows, setStatus }: { rows: FollowRow[]; setStatus: (id: string, s: Status) => void }) {
  if (rows.length === 0)
    return <EmptyBlock icon={<Users className="h-5 w-5" />} title="You're not copying anyone yet" body="Pick a verified leader and mirror their fills into your account." action={<LinkButton href="/leaders" arrow>Browse leaders</LinkButton>} />;
  return (
    <ul className="space-y-3">
      <AnimatePresence initial={false}>
        {rows.map((r) => {
          const total = Math.abs(r.openPnl) + Math.abs(r.realizedPnl) || 1;
          return (
            <motion.li key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={cx('rounded-2xl bg-[#050b17] p-4 transition-opacity sm:p-5', r.status === 'STOPPED' && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-sm font-bold text-[#050b17]">{r.leader.displayName[0]}</span>
                  <div className="min-w-0">
                    <Link href={`/dashboard/${r.id}`} className="block truncate text-[15px] font-semibold text-fg hover:text-brand">{r.leader.displayName}</Link>
                    <div className="truncate text-xs text-muted">{r.account.label} · {r.sizingMode.toLowerCase()} ×{r.sizingValue}</div>
                  </div>
                </div>
                <Menu items={[{ label: 'View copy detail', href: `/dashboard/${r.id}` }, { label: 'Leader page', href: `/leaders/${r.leader.id}` }, ...(r.status !== 'STOPPED' ? [{ label: 'Stop copying', danger: true, onClick: () => setStatus(r.id, 'STOPPED') }] : [])]} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                {[['Open P&L', r.openPnl], ['Realized', r.realizedPnl]].map(([k, v]) => (
                  <div key={k as string}>
                    <div className="text-xs text-muted">{k}</div>
                    <div className={cx('mt-0.5 text-lg font-semibold tabular-nums', (v as number) >= 0 ? 'text-up' : 'text-down')}>{(v as number) > 0 ? '+' : ''}{fmtUsd(v as number)}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.span className="h-full bg-brand" animate={{ width: `${(Math.abs(r.realizedPnl) / total) * 100}%` }} />
                <motion.span className={cx('h-full', r.openPnl >= 0 ? 'bg-up' : 'bg-down')} animate={{ width: `${(Math.abs(r.openPnl) / total) * 100}%` }} />
              </div>

              <div className="mt-4 inline-flex w-full rounded-full bg-white/[0.05] p-1 sm:w-auto">
                {(['ACTIVE', 'PAUSED', 'STOPPED'] as const).map((s) => {
                  const on = r.status === s;
                  return (
                    <button key={s} type="button" onClick={() => !on && setStatus(r.id, s)} aria-pressed={on} className={cx('relative flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors sm:flex-none', on ? (s === 'STOPPED' ? 'text-white' : 'text-[#050b17]') : 'text-muted hover:text-fg')}>
                      {on && <motion.span layoutId={`seg-${r.id}`} className={cx('absolute inset-0 rounded-full', s === 'ACTIVE' ? 'bg-up' : s === 'PAUSED' ? 'bg-warn' : 'bg-down')} transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                      <span className="relative inline-flex items-center gap-1.5">
                        {s === 'ACTIVE' && on && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#050b17]" />}
                        {s === 'ACTIVE' ? 'Active' : s === 'PAUSED' ? 'Paused' : 'Stopped'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}

/* ─── activity feed ─────────────────────────────────────────────────────── */
function Feed({ items }: { items: Analytics['recent'] }) {
  if (items.length === 0) return <EmptyBlock icon={<Inbox className="h-5 w-5" />} title="Quiet for now" body="Copied fills appear here as leaders trade." />;
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute bottom-2 left-[5px] top-2 w-px bg-white/10" />
      {items.map((t, i) => (
        <motion.li key={t.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="relative">
          <span className={cx('absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[#0b1a33]', FAILED.has(t.status) ? 'bg-down' : t.status === 'FILLED' ? 'bg-up' : 'bg-warn')} />
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate font-medium text-fg">{t.symbol} · <span className={t.side === 'BUY' ? 'text-up' : 'text-down'}>{t.side === 'BUY' ? 'Buy' : 'Sell'}</span></span>
            <span className="shrink-0 text-[11px] text-faint" suppressHydrationWarning>{clock(t.at)}</span>
          </div>
          <div className="text-xs text-muted">{t.leader} · qty {fmtNum(t.qty)} · {t.status.toLowerCase()}</div>
        </motion.li>
      ))}
    </ol>
  );
}

/* ─── by leader ─────────────────────────────────────────────────────────── */
function ByLeader({ data }: { data: Analytics['byLeader'] }) {
  if (data.length === 0) return <EmptyBlock className="!py-6" icon={<Users className="h-5 w-5" />} title="No leaders yet" />;
  const max = Math.max(1, ...data.map((l) => l.copies));
  return (
    <div className="space-y-4">
      {data.slice(0, 5).map((l) => (
        <div key={l.name} className="flex items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/[0.08] text-xs font-semibold">{l.name[0]}</span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2 text-sm"><span className="truncate font-medium">{l.name}</span><span className="shrink-0 text-xs tabular-nums text-muted">{l.copies} copies</span></div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-brand to-accent" initial={{ width: 0 }} whileInView={{ width: `${(l.copies / max) * 100}%` }} viewport={{ once: true }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
            </div>
          </div>
          <span className={cx('shrink-0 text-sm font-semibold tabular-nums', l.realizedPnl >= 0 ? 'text-up' : 'text-down')}>{fmtUsd(l.realizedPnl)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── trades table ──────────────────────────────────────────────────────── */
function Trades({ rows }: { rows: Analytics['recent'] }) {
  const [st, setSt] = useState<'all' | 'filled' | 'failed'>('all');
  const [leader, setLeader] = useState('all');
  const [shown, setShown] = useState(8);
  const leaders = useMemo(() => [...new Set(rows.map((r) => r.leader))], [rows]);
  const list = rows.filter((r) => (st === 'all' || (st === 'filled' ? r.status === 'FILLED' : FAILED.has(r.status))) && (leader === 'all' || r.leader === leader));
  const visible = list.slice(0, shown);
  return (
    <Section
      title="Copied trades"
      sub={`${visible.length} of ${list.length}`}
      aside={
        <div className="flex flex-wrap items-center justify-end gap-2">
          {leaders.length > 1 && (
            <select value={leader} onChange={(e) => { setLeader(e.target.value); setShown(8); }} className="rounded-full border border-white/10 bg-[#050b17] px-3 py-1.5 text-xs text-fg outline-none">
              <option value="all">All leaders</option>
              {leaders.map((l) => <option key={l}>{l}</option>)}
            </select>
          )}
          <div className="inline-flex rounded-full bg-white/[0.06] p-0.5 text-xs">
            {(['all', 'filled', 'failed'] as const).map((s) => (
              <button key={s} type="button" onClick={() => { setSt(s); setShown(8); }} className={cx('rounded-full px-3 py-1 font-medium capitalize transition-colors', st === s ? 'bg-[#0b1a33] text-fg shadow-sm' : 'text-muted hover:text-fg')}>{s}</button>
            ))}
          </div>
        </div>
      }
    >
      {visible.length === 0 ? (
        <EmptyBlock icon={<Inbox className="h-5 w-5" />} title="No trades match" body="Try another range, status or leader." />
      ) : (
        <>
          <ul className="-mx-2 divide-y divide-white/5 sm:hidden">
            {visible.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-2 py-3">
                <span className={cx('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold', t.side === 'BUY' ? 'bg-up/15 text-up' : 'bg-down/15 text-down')}>{t.side === 'BUY' ? 'B' : 'S'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-fg">{t.symbol}</div>
                  <div className="truncate text-[11px] text-muted" suppressHydrationWarning>{t.leader} · {when(t.at)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm tabular-nums text-fg">{t.avgPrice != null ? fmtNum(t.avgPrice, 2) : '—'}</div>
                  <Badge tone={statusTone[t.status] ?? 'neutral'}>{t.status}</Badge>
                </div>
              </li>
            ))}
          </ul>
          <table className="hidden w-full text-sm sm:table">
            <thead className="text-left text-xs text-muted">
              <tr className="border-b border-white/5">
                <th className="pb-2 font-medium">Time</th><th className="pb-2 font-medium">Leader</th><th className="pb-2 font-medium">Symbol</th><th className="pb-2 font-medium">Side</th>
                <th className="pb-2 text-right font-medium">Qty</th><th className="pb-2 text-right font-medium">Price</th><th className="pb-2 text-right font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => (
                <tr key={t.id} className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]">
                  <td className="whitespace-nowrap py-2.5 text-muted" suppressHydrationWarning>{when(t.at)}</td>
                  <td className="py-2.5">{t.leader}</td>
                  <td className="py-2.5 font-medium">{t.symbol}</td>
                  <td className="py-2.5"><Badge tone={t.side === 'BUY' ? 'up' : 'down'}>{t.side}</Badge></td>
                  <td className="py-2.5 text-right tabular-nums">{fmtNum(t.qty)}</td>
                  <td className="py-2.5 text-right tabular-nums">{t.avgPrice != null ? fmtNum(t.avgPrice, 2) : '—'}</td>
                  <td className="py-2.5 text-right"><Badge tone={statusTone[t.status] ?? 'neutral'}>{t.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length > shown && (
            <div className="mt-4 flex justify-center">
              <button type="button" onClick={() => setShown((n) => n + 8)} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10">
                Show {Math.min(8, list.length - shown)} more <ChevronDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

/* ─── first run ─────────────────────────────────────────────────────────── */
export function FirstRun({ firstName, hasCredential }: { firstName?: string; hasCredential: boolean }) {
  const steps = [
    { n: 1, t: 'Connect your exchange', d: 'Add a trade-only Delta India key. Withdrawals stay off.', href: '/connect', cta: 'Connect account', done: hasCredential },
    { n: 2, t: 'Pick a verified leader', d: 'Compare ROI, win rate and drawdown on the leaderboard.', href: '/leaders', cta: 'Browse leaders', done: false },
    { n: 3, t: 'Mirror on autopilot', d: 'Set sizing and a daily cap. Every fill copies in under a second.', href: '/leaders', cta: 'Start copying', done: false },
  ];
  const next = steps.find((s) => !s.done)!;
  return (
    <section className="relative -mx-6 -mt-10 overflow-hidden px-6 pb-10 pt-14 sm:mx-0 sm:mt-0 sm:rounded-3xl sm:p-12" style={{ background: 'radial-gradient(800px 400px at 80% 0%, rgba(0,176,255,0.16), transparent 60%), #0a1628' }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</div>
      <h1 className="mt-3 max-w-xl text-[2.4rem] leading-[1.02] text-fg sm:text-5xl" style={{ letterSpacing: '-0.035em', fontWeight: 600 }}>Three steps to your first copy.</h1>
      <p className="mt-3 max-w-md text-[15px] text-muted">Your dashboard fills with live P&amp;L, fills and analytics as soon as you&rsquo;re copying.</p>
      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {steps.map((s) => {
          const isNext = s === next;
          return (
            <Link key={s.n} href={s.href} className={cx('card-surface card-surface-hover group block p-5', isNext && 'ring-1 ring-brand/50')}>
              <div className="flex items-center justify-between">
                <span className={cx('grid h-8 w-8 place-items-center rounded-full text-xs font-bold', s.done ? 'bg-up text-[#050b17]' : isNext ? 'bg-brand text-[#050b17]' : 'bg-white/10 text-fg')}>{s.done ? '✓' : s.n}</span>
                <ArrowRight className="h-4 w-4 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
              </div>
              <div className={cx('mt-4 text-[15px] font-semibold', s.done ? 'text-muted line-through' : 'text-fg')}>{s.t}</div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{s.d}</p>
              {isNext && <div className="mt-4 text-xs font-semibold text-brand">{s.cta} →</div>}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
