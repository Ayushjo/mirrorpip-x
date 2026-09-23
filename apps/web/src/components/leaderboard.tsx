'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, Search, X, GitCompareArrows } from 'lucide-react';
import { EmptyBlock, EmptyState, LinkButton, cx, fmtPct, fmtUsd } from './ui';
import { UsersIcon } from './icons';
import { Tilt } from './landing/magnetic';
import { CountIn } from './landing/motion';
import { DrawSparkline } from './charts';

export type LeaderCard = {
  id: string;
  displayName: string;
  exchange: string;
  createdAt?: string | null;
  stats: {
    roiPct: number;
    winRatePct: number;
    maxDrawdownPct: number;
    totalCopiedUsd: number;
    tradeCount: number;
    followerCount: number;
  };
  equitySeries: number[];
};

const SORTS = [
  { id: 'roi', label: 'Top ROI', key: 'roi' },
  { id: 'win', label: 'Win rate', key: 'win' },
  { id: 'followed', label: 'Most followed', key: 'followers' },
  { id: 'drawdown', label: 'Lowest drawdown', key: 'dd' },
] as const;
type SortId = (typeof SORTS)[number]['id'];
const isSort = (v: string | null): v is SortId => !!v && SORTS.some((s) => s.id === v);

const QUICK = [
  { id: 'positive', label: 'Positive ROI', test: (l: LeaderCard) => l.stats.roiPct > 0 },
  { id: 'followed', label: '≥10 followers', test: (l: LeaderCard) => l.stats.followerCount >= 10 },
  { id: 'lowdd', label: 'Low drawdown', test: (l: LeaderCard) => l.stats.maxDrawdownPct < 5 },
] as const;
type QuickId = (typeof QUICK)[number]['id'];

function sortLeaders(list: LeaderCard[], sort: SortId): LeaderCard[] {
  const c = [...list];
  switch (sort) {
    case 'roi': return c.sort((a, b) => b.stats.roiPct - a.stats.roiPct);
    case 'win': return c.sort((a, b) => b.stats.winRatePct - a.stats.winRatePct);
    case 'followed': return c.sort((a, b) => b.stats.followerCount - a.stats.followerCount);
    case 'drawdown': return c.sort((a, b) => a.stats.maxDrawdownPct - b.stats.maxDrawdownPct);
  }
}

function sparkPoints(series: number[]): number[] {
  const varied = series.length >= 2 && Math.max(...series) - Math.min(...series) > 1e-6;
  if (varied) return series;
  return [0.28, 0.42, 0.36, 0.52, 0.47, 0.6, 0.55, 0.72, 0.68, 0.82];
}

const isNew = (l: LeaderCard) => !!l.createdAt && Date.now() - new Date(l.createdAt).getTime() < 7 * 86400e3;

/* ─── Hero stat that slowly ticks (live feel) ──────────────────────────── */
export function TickingStat({ value, every = 6000 }: { value: number; every?: number }) {
  const [n, setN] = useState(value);
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v < value + 12 ? v + 1 : v)), every);
    return () => clearInterval(id);
  }, [value, every]);
  return <CountIn to={n} from={Math.max(0, value - 12)} />;
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q) return <>{text}</>;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-brand/25 px-0.5 text-fg">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function whyFollow(l: LeaderCard) {
  const w = l.stats.winRatePct;
  const dd = l.stats.maxDrawdownPct;
  if (l.stats.tradeCount === 0) return 'New listing — no fills captured yet.';
  const risk = dd === 0 ? 'no recorded drawdown' : dd < 5 ? `only ${dd.toFixed(1)}% max drawdown` : `${dd.toFixed(1)}% max drawdown`;
  return `Wins ${w.toFixed(0)}% of trades with ${risk}.`;
}

/* ─── Leader tile ──────────────────────────────────────────────────────── */
function LeaderTile({
  l, rank, sort, q, selected, onSelect, compact = false,
}: {
  l: LeaderCard; rank: number; sort: SortId; q: string; selected: boolean; onSelect: () => void; compact?: boolean;
}) {
  const roi = l.stats.roiPct;
  const roiTone = roi > 0 ? 'text-up' : roi < 0 ? 'text-down' : 'text-muted';
  const stroke = roi < 0 ? '#ef4444' : '#00b0ff';
  const first = rank === 1;
  const stat = (key: string, label: string, v: string) => {
    const active = SORTS.find((s) => s.id === sort)?.key === key;
    return (
      <div key={key} className="min-w-0">
        <dt className={cx('truncate text-xs', active ? 'text-brand' : 'text-muted')}>
          {label}
          {active && <span className="ml-1 text-[9px]">▲</span>}
        </dt>
        <dd className={cx('mt-1 text-[15px] font-medium tabular-nums', active ? 'text-fg' : 'text-fg/90')}>{v}</dd>
      </div>
    );
  };

  return (
    <Tilt className="tilt-host relative h-full [&>article]:h-full">
      <article
        className={cx(
          'card-surface card-surface-hover group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 sm:rounded-3xl',
          compact ? 'sm:p-6' : 'sm:p-7',
          first && '!border-brand/30',
          selected && 'ring-2 ring-brand/60',
        )}
      >
        {first && <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(420px 200px at 100% 0%, rgba(0,176,255,0.14), transparent 70%)' }} />}
        <span aria-hidden className="pointer-events-none absolute -right-2 -top-4 hidden select-none text-[7rem] font-bold leading-none text-white/[0.035] sm:block" style={{ letterSpacing: '-0.06em' }}>{rank}</span>

        {/* compare toggle */}
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          aria-label={selected ? 'Remove from compare' : 'Add to compare'}
          className={cx(
            'absolute right-5 top-5 z-10 grid h-7 w-7 place-items-center rounded-full border text-[11px] transition-all',
            selected ? 'border-brand bg-brand text-[#050b17]' : 'border-white/15 bg-[#050b17]/60 text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100',
          )}
        >
          {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : <GitCompareArrows className="h-3.5 w-3.5" />}
        </button>

        <div className="relative flex items-center justify-between gap-3 pr-8">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-semibold text-fg ring-1 ring-white/10" style={{ background: 'radial-gradient(circle at 35% 30%, #1a4586, #0a1e3a)' }}>
              {l.displayName.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <Link href={`/leaders/${l.id}`} className="block truncate text-[15px] font-semibold text-fg transition-colors hover:text-brand" style={{ letterSpacing: '-0.01em' }}>
                <Highlight text={l.displayName} q={q} />
              </Link>
              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                <span className={cx('font-medium', first ? 'text-brand' : 'text-fg/80')}>#{rank}</span>
                <span className="text-faint">·</span>
                Delta India
                {isNew(l) && <span className="ml-1 rounded-full bg-up/15 px-1.5 py-0.5 text-[10px] font-semibold text-up">New</span>}
              </div>
            </div>
          </div>
          <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
            <UsersIcon width={13} height={13} className="text-faint" />
            <span className="tabular-nums text-fg/80">{l.stats.followerCount}</span>
          </div>
        </div>

        <div className="relative mt-6">
          <div className={cx('text-xs', sort === 'roi' ? 'text-brand' : 'text-muted')}>All-time ROI{sort === 'roi' && <span className="ml-1 text-[9px]">▲</span>}</div>
          <div className={cx('mt-1 font-semibold leading-none tabular-nums', roiTone, compact ? 'text-3xl' : 'text-4xl')} style={{ letterSpacing: '-0.035em' }}>
            {roi === 0 ? '—' : fmtPct(roi)}
          </div>
          <div className="-mx-6 mt-4 sm:-mx-7">
            <DrawSparkline points={sparkPoints(l.equitySeries)} stroke={stroke} className="h-14 w-full opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
          </div>
        </div>

        <dl className="relative mt-5 grid grid-cols-3 gap-4 border-t border-border-soft pt-5">
          {stat('win', 'Win rate', `${l.stats.winRatePct.toFixed(1)}%`)}
          {stat('dd', 'Max DD', l.stats.maxDrawdownPct === 0 ? '—' : `-${l.stats.maxDrawdownPct.toFixed(1)}%`)}
          {stat('trades', 'Trades', l.stats.tradeCount.toLocaleString('en-US'))}
        </dl>

        <p className="relative mt-4 text-xs leading-relaxed text-muted sm:max-h-0 sm:overflow-hidden sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:mt-4 sm:group-hover:max-h-12 sm:group-hover:opacity-100 max-sm:mt-3">
          {whyFollow(l)}
        </p>

        <div className="relative mt-5 flex items-center gap-2.5">
          <LinkButton href={`/follow/${l.id}`} arrow magnetic className="flex-1 py-2.5 sm:py-2">Follow</LinkButton>
          <Link href={`/leaders/${l.id}`} aria-label={`View ${l.displayName}`} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-muted transition-colors hover:border-brand/40 hover:text-brand sm:h-10 sm:w-10">
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </Tilt>
  );
}

/* ─── Podium ───────────────────────────────────────────────────────────── */
function Podium({ top, sort, q, selected, toggle }: { top: LeaderCard[]; sort: SortId; q: string; selected: Set<string>; toggle: (id: string) => void }) {
  // Visual order 2 · 1 · 3 on desktop; natural order on mobile.
  const order = top.length === 3 ? [top[1]!, top[0]!, top[2]!] : top;
  return (
    <div className="no-scrollbar -mx-6 flex snap-x scroll-px-6 gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:items-end sm:overflow-visible sm:px-0 sm:pb-0">
      {order.map((l) => {
        const rank = top.indexOf(l) + 1;
        return (
          <motion.div
            key={l.id}
            layout
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className={cx('w-[82vw] shrink-0 snap-start sm:w-auto', rank === 1 ? 'sm:-mt-6' : 'sm:mt-0')}
          >
            <div className="mb-3 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
              <span className={cx('grid h-6 w-6 place-items-center rounded-full text-[11px]', rank === 1 ? 'bg-gradient-to-br from-brand to-accent text-[#050b17]' : 'bg-white/10 text-fg')}>{rank}</span>
              {rank === 1 ? 'Top leader' : rank === 2 ? 'Runner-up' : 'Third'}
            </div>
            <LeaderTile l={l} rank={rank} sort={sort} q={q} selected={selected.has(l.id)} onSelect={() => toggle(l.id)} compact={rank !== 1} />
          </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Compare drawer ───────────────────────────────────────────────────── */
function CompareDrawer({ items, onClose, onRemove }: { items: LeaderCard[]; onClose: () => void; onRemove: (id: string) => void }) {
  const rows: { k: string; f: (l: LeaderCard) => ReactNode; best?: (ls: LeaderCard[]) => string | undefined }[] = [
    { k: 'All-time ROI', f: (l) => <span className={l.stats.roiPct > 0 ? 'text-up' : l.stats.roiPct < 0 ? 'text-down' : ''}>{l.stats.roiPct === 0 ? '—' : fmtPct(l.stats.roiPct)}</span>, best: (ls) => [...ls].sort((a, b) => b.stats.roiPct - a.stats.roiPct)[0]?.id },
    { k: 'Win rate', f: (l) => `${l.stats.winRatePct.toFixed(1)}%`, best: (ls) => [...ls].sort((a, b) => b.stats.winRatePct - a.stats.winRatePct)[0]?.id },
    { k: 'Max drawdown', f: (l) => (l.stats.maxDrawdownPct === 0 ? '—' : `-${l.stats.maxDrawdownPct.toFixed(1)}%`), best: (ls) => [...ls].sort((a, b) => a.stats.maxDrawdownPct - b.stats.maxDrawdownPct)[0]?.id },
    { k: 'Followers', f: (l) => l.stats.followerCount, best: (ls) => [...ls].sort((a, b) => b.stats.followerCount - a.stats.followerCount)[0]?.id },
    { k: 'Trades', f: (l) => l.stats.tradeCount.toLocaleString('en-US') },
    { k: 'Copied volume', f: (l) => fmtUsd(l.stats.totalCopiedUsd, 0) },
  ];
  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} className="fixed inset-x-0 bottom-0 z-50 max-h-[85svh] overflow-y-auto rounded-t-[2rem] border-t border-white/10 bg-[#0b1a33] shadow-[0_-30px_80px_rgba(0,0,0,0.7)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8 sm:py-7">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Compare leaders</div>
            <div className="text-xs text-muted">Best value in each row is highlighted.</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close compare" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-muted hover:text-fg"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr>
                <th className="w-40 pb-3 text-left text-xs font-medium text-muted" />
                {items.map((l) => (
                  <th key={l.id} className="pb-3 text-left">
                    <div className="flex items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#1a4586] to-[#0a1e3a] text-sm font-semibold text-fg ring-1 ring-white/10">{l.displayName[0]}</span>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-fg">{l.displayName}</div>
                        <button type="button" onClick={() => onRemove(l.id)} className="text-[11px] text-muted hover:text-down">Remove</button>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 text-xs text-muted">Equity</td>
                {items.map((l) => (
                  <td key={l.id} className="py-2 pr-4">
                    <DrawSparkline points={sparkPoints(l.equitySeries)} stroke={l.stats.roiPct < 0 ? '#ef4444' : '#00b0ff'} className="h-10 w-full" height={40} />
                  </td>
                ))}
              </tr>
              {rows.map((r) => {
                const best = r.best?.(items);
                return (
                  <tr key={r.k} className="border-t border-white/5">
                    <td className="py-2.5 text-xs text-muted">{r.k}</td>
                    {items.map((l) => (
                      <td key={l.id} className={cx('py-2.5 pr-4 font-medium tabular-nums', best === l.id ? 'text-fg' : 'text-fg/70')}>
                        <span className={cx(best === l.id && 'rounded-md bg-brand/15 px-1.5 py-0.5')}>{r.f(l)}</span>
                      </td>
                    ))}
                  </tr>
                );
              })}
              <tr className="border-t border-white/5">
                <td />
                {items.map((l) => (
                  <td key={l.id} className="pt-4 pr-4"><LinkButton href={`/follow/${l.id}`} arrow className="w-full">Follow</LinkButton></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Leaderboard ──────────────────────────────────────────────────────── */
export function Leaderboard({ leaders }: { leaders: LeaderCard[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const initial = params.get('sort');
  const [sort, setSortState] = useState<SortId>(isSort(initial) ? initial : 'roi');
  const [q, setQ] = useState('');
  const [quick, setQuick] = useState<Set<QuickId>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  const setSort = (s: SortId) => {
    setSortState(s);
    const sp = new URLSearchParams(params.toString());
    if (s === 'roi') sp.delete('sort'); else sp.set('sort', s);
    router.replace(sp.toString() ? `?${sp}` : '?', { scroll: false });
  };
  useEffect(() => {
    const p = params.get('sort');
    if (isSort(p) && p !== sort) setSortState(p);
    if (!p && sort !== 'roi') setSortState('roi');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const toggleQuick = (id: QuickId) => setQuick((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleSelect = (id: string) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else if (n.size < 3) n.add(id);
    return n;
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leaders.filter((l) => (!needle || l.displayName.toLowerCase().includes(needle)) && [...quick].every((id) => QUICK.find((f) => f.id === id)!.test(l)));
  }, [leaders, q, quick]);
  const sorted = useMemo(() => sortLeaders(filtered, sort), [filtered, sort]);
  const showPodium = !q && quick.size === 0 && sorted.length >= 3;
  const top = showPodium ? sorted.slice(0, 3) : [];
  const rest = showPodium ? sorted.slice(3) : sorted;
  const compareItems = leaders.filter((l) => selected.has(l.id));

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="no-scrollbar -mx-6 flex snap-x gap-2 overflow-x-auto px-6 sm:mx-0 sm:inline-flex sm:gap-1 sm:overflow-visible sm:rounded-full sm:border sm:border-border sm:bg-surface/60 sm:p-1 sm:px-1 sm:backdrop-blur">
            {SORTS.map((f) => {
              const active = sort === f.id;
              return (
                <button key={f.id} type="button" onClick={() => setSort(f.id)} aria-pressed={active} className={cx('shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-1.5', active ? 'bg-gradient-to-r from-brand to-accent text-[#050b17] shadow-[0_4px_16px_rgba(0,176,255,0.3)]' : 'border border-border bg-surface/70 text-muted hover:text-fg sm:border-transparent sm:bg-transparent sm:hover:bg-white/5')}>
                  {f.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <label className="relative flex-1 sm:w-56 sm:flex-none">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leaders" className="w-full rounded-full border border-border bg-surface/70 py-2 pl-9 pr-8 text-xs text-fg placeholder:text-faint focus:border-brand/50 focus:outline-none" />
              {q && <button type="button" onClick={() => setQ('')} aria-label="Clear search" className="absolute right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-faint hover:text-fg"><X className="h-3 w-3" /></button>}
            </label>
            <div className="hidden whitespace-nowrap text-xs text-faint lg:block"><span className="tabular-nums text-muted">{sorted.length}</span> {sorted.length === 1 ? 'leader' : 'leaders'}</div>
          </div>
        </div>
        <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:px-0">
          {QUICK.map((f) => {
            const on = quick.has(f.id);
            const n = leaders.filter(f.test).length;
            return (
              <button key={f.id} type="button" onClick={() => toggleQuick(f.id)} aria-pressed={on} className={cx('inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors', on ? 'border-brand/50 bg-brand/15 text-fg' : 'border-border text-muted hover:text-fg')}>
                {on && <Check className="h-3 w-3 text-brand" strokeWidth={3} />}
                {f.label}
                <span className={cx('rounded-full px-1.5 text-[10px] tabular-nums', on ? 'bg-brand/20 text-brand' : 'bg-white/[0.06] text-faint')}>{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {sorted.length === 0 && (q || quick.size > 0) ? (
        <EmptyBlock icon={<Search className="h-5 w-5" />} title="No leaders match" body="Try clearing the search or a filter." action={<button type="button" onClick={() => { setQ(''); setQuick(new Set()); }} className="rounded-full border border-brand/40 px-4 py-1.5 text-xs font-medium text-brand hover:bg-brand/10">Clear all</button>} />
      ) : sorted.length === 0 ? (
        <EmptyState title="No verified leaders yet" body="Leaders appear here once an admin verifies them. If you're a trader, connect an account and ask to be listed." action={<LinkButton href="/connect">Connect an account</LinkButton>} />
      ) : (
        <>
          {showPodium && <Podium top={top} sort={sort} q={q} selected={selected} toggle={toggleSelect} />}
          {rest.length > 0 && (
            <>
              {showPodium && <div className="pt-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Everyone else</div>}
              <motion.div layout className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                {rest.map((l, i) => (
                  <motion.div key={l.id} layout transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
                    <LeaderTile l={l} rank={(showPodium ? 3 : 0) + i + 1} sort={sort} q={q} selected={selected.has(l.id)} onSelect={() => toggleSelect(l.id)} />
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </>
      )}

      {/* become a leader */}
      <div className="card-surface relative flex flex-col gap-4 overflow-hidden rounded-[1.5rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-8" style={{ background: 'radial-gradient(600px 220px at 100% 0%, rgba(0,176,255,0.14), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #050b17 100%)' }}>
        <div>
          <div className="text-lg font-semibold text-fg sm:text-xl" style={{ letterSpacing: '-0.02em' }}>Trade well? Get listed.</div>
          <p className="mt-1 max-w-md text-sm text-muted">Connect your Delta India account, get verified, and let followers mirror your fills automatically.</p>
        </div>
        <Link href="/connect" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-accent">
          Become a leader
          <span className="grid h-8 w-8 place-items-center rounded-full border border-brand/40"><ArrowRight className="h-4 w-4" /></span>
        </Link>
      </div>

      {/* compare bar + drawer */}
      <AnimatePresence>
        {selected.size > 0 && !open && (
          <motion.div key="bar" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-[#0b1a33]/95 py-2 pl-4 pr-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
              <div className="flex -space-x-2">
                {compareItems.map((l) => <span key={l.id} className="grid h-7 w-7 place-items-center rounded-full border-2 border-[#0b1a33] bg-gradient-to-br from-brand to-accent text-[11px] font-bold text-[#050b17]">{l.displayName[0]}</span>)}
              </div>
              <span className="text-xs text-muted">{selected.size} of 3 selected</span>
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs text-faint hover:text-fg">Clear</button>
              <button type="button" onClick={() => setOpen(true)} disabled={selected.size < 2} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand to-accent px-4 py-2 text-xs font-semibold text-[#050b17] disabled:opacity-40">
                <GitCompareArrows className="h-3.5 w-3.5" /> Compare
              </button>
            </div>
          </motion.div>
        )}
        {open && compareItems.length >= 2 && (
          <motion.div key="scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-[#050b17]/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
        )}
        {open && compareItems.length >= 2 && (
          <CompareDrawer key="drawer" items={compareItems} onClose={() => setOpen(false)} onRemove={(id) => { toggleSelect(id); if (selected.size <= 2) setOpen(false); }} />
        )}
      </AnimatePresence>
    </div>
  );
}
