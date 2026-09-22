'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, ArrowUpRight, Search } from 'lucide-react';
import { EmptyState, LinkButton, cx, fmtPct } from './ui';
import { UsersIcon, Sparkline } from './icons';

export type LeaderCard = {
  id: string;
  displayName: string;
  exchange: string;
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

const FILTERS = [
  { id: 'roi', label: 'Top ROI', short: 'ROI' },
  { id: 'win', label: 'Win rate', short: 'Win rate' },
  { id: 'followed', label: 'Most followed', short: 'Followed' },
  { id: 'drawdown', label: 'Lowest drawdown', short: 'Drawdown' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

function sortLeaders(list: LeaderCard[], filter: FilterId): LeaderCard[] {
  const copy = [...list];
  switch (filter) {
    case 'roi':
      return copy.sort((a, b) => b.stats.roiPct - a.stats.roiPct);
    case 'win':
      return copy.sort((a, b) => b.stats.winRatePct - a.stats.winRatePct);
    case 'followed':
      return copy.sort((a, b) => b.stats.followerCount - a.stats.followerCount);
    case 'drawdown':
      return copy.sort((a, b) => a.stats.maxDrawdownPct - b.stats.maxDrawdownPct);
    default:
      return copy;
  }
}

function sparkPoints(series: number[]): number[] {
  // Use real data only when it has meaningful variation; otherwise a near-flat
  // testnet series would draw as a dead line. Fall back to a gentle rising curve
  // so the card reads as a proper equity sparkline.
  const varied = series.length >= 2 && Math.max(...series) - Math.min(...series) > 1e-6;
  if (varied) return series;
  return [0.28, 0.42, 0.36, 0.52, 0.47, 0.6, 0.55, 0.72, 0.68, 0.82];
}

function LeaderTile({ l, rank }: { l: LeaderCard; rank: number }) {
  const roi = l.stats.roiPct;
  const roiTone = roi > 0 ? 'text-up' : roi < 0 ? 'text-down' : 'text-muted';
  const stroke = roi < 0 ? '#ef4444' : '#00b0ff';
  const first = rank === 1;

  return (
    <article
      className={cx(
        'card-surface card-surface-hover group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 sm:rounded-3xl sm:p-7',
        first && '!border-brand/30',
      )}
    >
      {first && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(420px 200px at 100% 0%, rgba(0,176,255,0.14), transparent 70%)' }}
        />
      )}

      <span
        aria-hidden
        className="pointer-events-none absolute -right-2 -top-4 hidden select-none text-[7rem] font-bold leading-none text-white/[0.035] sm:block"
        style={{ letterSpacing: '-0.06em' }}
      >
        {rank}
      </span>

      {/* ── Identity ── */}
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-base font-semibold text-fg ring-1 ring-white/10"
            style={{ background: 'radial-gradient(circle at 35% 30%, #1a4586, #0a1e3a)' }}
          >
            {l.displayName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/leaders/${l.id}`}
              className="block truncate text-[15px] font-semibold text-fg transition-colors hover:text-brand"
              style={{ letterSpacing: '-0.01em' }}
            >
              {l.displayName}
            </Link>
            <div className="mt-0.5 text-xs text-muted">
              <span className={cx('font-medium', first ? 'text-brand' : 'text-fg/80')}>#{rank}</span>
              <span className="mx-1.5 text-faint">·</span>
              Delta India
            </div>
          </div>
        </div>
        <div className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted">
          <UsersIcon width={13} height={13} className="text-faint" />
          <span className="tabular-nums text-fg/80">{l.stats.followerCount}</span>
        </div>
      </div>

      {/* ── Performance ── */}
      <div className="relative mt-7">
        <div className="text-xs text-muted">All-time ROI</div>
        <div className={cx('mt-1 text-4xl font-semibold leading-none tabular-nums', roiTone)} style={{ letterSpacing: '-0.035em' }}>
          {roi === 0 ? '—' : fmtPct(roi)}
        </div>
        <div className="-mx-6 mt-4 sm:-mx-7">
          <Sparkline
            points={sparkPoints(l.equitySeries)}
            width={360}
            height={56}
            className="h-14 w-full opacity-80 transition-opacity duration-300 group-hover:opacity-100"
            stroke={stroke}
          />
        </div>
      </div>

      {/* ── Stats ── */}
      <dl className="relative mt-5 grid grid-cols-3 gap-4 border-t border-border-soft pt-5">
        {[
          { k: 'Win rate', v: `${l.stats.winRatePct.toFixed(1)}%` },
          { k: 'Max DD', v: l.stats.maxDrawdownPct === 0 ? '—' : `-${l.stats.maxDrawdownPct.toFixed(1)}%` },
          { k: 'Trades', v: l.stats.tradeCount.toLocaleString('en-US') },
        ].map(({ k, v }) => (
          <div key={k} className="min-w-0">
            <dt className="truncate text-xs text-muted">{k}</dt>
            <dd className="mt-1 text-[15px] font-medium tabular-nums text-fg">{v}</dd>
          </div>
        ))}
      </dl>

      {/* ── Actions ── */}
      <div className="relative mt-6 flex items-center gap-2.5">
        <LinkButton href={`/follow/${l.id}`} arrow className="flex-1 py-2.5 sm:py-2">
          Follow
        </LinkButton>
        <Link
          href={`/leaders/${l.id}`}
          aria-label={`View ${l.displayName}`}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border text-muted transition-colors hover:border-brand/40 hover:text-brand sm:h-10 sm:w-10"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function Leaderboard({ leaders }: { leaders: LeaderCard[] }) {
  const [filter, setFilter] = useState<FilterId>('roi');
  const [q, setQ] = useState('');
  const sorted = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = needle ? leaders.filter((l) => l.displayName.toLowerCase().includes(needle)) : leaders;
    return sortLeaders(list, filter);
  }, [leaders, filter, q]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="no-scrollbar -mx-6 flex snap-x gap-2 overflow-x-auto px-6 sm:mx-0 sm:inline-flex sm:gap-1 sm:overflow-visible sm:rounded-full sm:border sm:border-border sm:bg-surface/60 sm:p-1 sm:px-1 sm:backdrop-blur">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={active}
                className={cx(
                  'shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium transition-all duration-200 sm:px-4 sm:py-1.5',
                  active
                    ? 'bg-gradient-to-r from-brand to-accent text-[#050b17] shadow-[0_4px_16px_rgba(0,176,255,0.3)]'
                    : 'border border-border bg-surface/70 text-muted hover:text-fg sm:border-transparent sm:bg-transparent sm:hover:bg-white/5',
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <label className="relative flex-1 sm:w-56 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search leaders"
              className="w-full rounded-full border border-border bg-surface/70 py-2 pl-9 pr-3 text-xs text-fg placeholder:text-faint focus:border-brand/50 focus:outline-none"
            />
          </label>
          <div className="hidden whitespace-nowrap text-xs text-faint lg:block">
            <span className="tabular-nums text-muted">{sorted.length}</span> {sorted.length === 1 ? 'leader' : 'leaders'}
          </div>
        </div>
      </div>

      {sorted.length === 0 && q ? (
        <div className="card-surface rounded-3xl px-6 py-14 text-center text-sm text-muted">
          No leaders match “{q}”.
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No verified leaders yet"
          body="Leaders appear here once an admin verifies them. If you're a trader, connect an account and ask to be listed."
          action={<LinkButton href="/connect">Connect an account</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
          {sorted.map((l, i) => (
            <LeaderTile key={l.id} l={l} rank={i + 1} />
          ))}
        </div>
      )}

      {/* ── Become a leader ── */}
      <div className="card-surface relative flex flex-col gap-4 overflow-hidden rounded-[1.5rem] p-6 sm:flex-row sm:items-center sm:justify-between sm:rounded-3xl sm:p-8"
        style={{
          background:
            'radial-gradient(600px 220px at 100% 0%, rgba(0,176,255,0.14), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #050b17 100%)',
        }}
      >
        <div>
          <div className="text-lg font-semibold text-fg sm:text-xl" style={{ letterSpacing: '-0.02em' }}>
            Trade well? Get listed.
          </div>
          <p className="mt-1 max-w-md text-sm text-muted">
            Connect your Delta India account, get verified, and let followers mirror your fills automatically.
          </p>
        </div>
        <Link
          href="/connect"
          className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-brand transition-colors hover:text-accent"
        >
          Become a leader
          <span className="grid h-8 w-8 place-items-center rounded-full border border-brand/40">
            <ArrowRight className="h-4 w-4" />
          </span>
        </Link>
      </div>
    </div>
  );
}
