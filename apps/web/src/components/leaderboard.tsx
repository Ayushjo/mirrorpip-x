'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Badge, Card, EmptyState, LinkButton, fmtPct, fmtUsd } from './ui';
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
  { id: 'roi', label: 'Top ROI' },
  { id: 'win', label: 'Win rate' },
  { id: 'followed', label: 'Most followed' },
  { id: 'drawdown', label: 'Lowest drawdown' },
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
  if (series.length >= 2) return series;
  // Flat placeholder when no equity history yet — still draws a calm line.
  return [0.45, 0.46, 0.455, 0.47, 0.465, 0.48];
}

export function Leaderboard({ leaders }: { leaders: LeaderCard[] }) {
  const [filter, setFilter] = useState<FilterId>('roi');
  const sorted = useMemo(() => sortLeaders(leaders, filter), [leaders, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={
              filter === f.id
                ? 'rounded-full bg-black px-3.5 py-1.5 text-xs font-medium text-white'
                : 'rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs text-muted backdrop-blur transition-colors hover:text-black'
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No verified leaders yet"
          body="Leaders appear here once an admin verifies them. If you're a trader, connect an account and ask to be listed."
          action={<LinkButton href="/connect">Connect an account</LinkButton>}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {sorted.map((l, i) => (
            <Card
              key={l.id}
              className="group flex h-full flex-col p-0 transition-all duration-300 hover:-translate-y-1 hover:border-black/12 hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)]"
            >
              <div
                className="relative overflow-hidden rounded-t-2xl px-6 pt-6"
                style={{ background: 'linear-gradient(160deg, #efedf6, #f7f6fb)' }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="grid h-12 w-12 place-items-center rounded-full text-lg font-medium text-black ring-1 ring-black/5"
                      style={{ background: 'radial-gradient(circle at 35% 30%, #ffffff, #e2ddf1)' }}
                    >
                      {l.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <Link href={`/leaders/${l.id}`} className="font-medium hover:text-black">
                        {l.displayName}
                      </Link>
                      <div className="flex items-center gap-1.5 text-xs text-faint">
                        <span className="rounded bg-black/5 px-1.5 py-0.5 font-medium text-black/60">#{i + 1}</span>
                        Delta India
                      </div>
                    </div>
                  </div>
                  <Badge tone="brand">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon width={12} height={12} />
                      {l.stats.followerCount}
                    </span>
                  </Badge>
                </div>
                <div className="-mx-2 mt-3">
                  <Sparkline
                    points={sparkPoints(l.equitySeries)}
                    width={520}
                    height={72}
                    className="w-full text-black"
                    stroke="#2B2644"
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted">Win rate</div>
                    <div className="mt-0.5 font-medium tabular-nums">{l.stats.winRatePct.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">30d ROI</div>
                    <div className="mt-0.5 font-medium tabular-nums text-up">
                      {l.stats.roiPct === 0 ? '—' : fmtPct(l.stats.roiPct)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Max DD</div>
                    <div className="mt-0.5 font-medium tabular-nums">
                      {l.stats.maxDrawdownPct === 0 ? '—' : `-${l.stats.maxDrawdownPct.toFixed(1)}%`}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-2">
                  <LinkButton href={`/follow/${l.id}`} arrow className="flex-1">
                    Follow
                  </LinkButton>
                  <LinkButton href={`/leaders/${l.id}`} variant="ghost">
                    View
                  </LinkButton>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
