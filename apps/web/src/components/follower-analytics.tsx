'use client';

import { useMemo, useState } from 'react';
import { Badge, Card, EmptyState, LinkButton, cx, fmtUsd, fmtNum } from './ui';
import { ChartIcon, BoltIcon, UsersIcon, CheckIcon } from './icons';
import { AreaChart, BarChart, Ring } from './charts';
import { CountUp } from './count-up';
import { Reveal } from './reveal';

interface Analytics {
  summary: {
    totalCopies30d: number;
    copiesToday: number;
    filledCount: number;
    fillRate: number;
    activeFollows: number;
    openPnl: number;
    realizedPnl: number;
    winRate: number;
    closedCount: number;
    wins: number;
  };
  activity: { date: string; count: number }[];
  pnlSeries: { at: string | null; value: number }[];
  byLeader: { name: string; copies: number; openPnl: number; realizedPnl: number }[];
  recent: {
    id: string;
    leader: string;
    symbol: string;
    side: string;
    qty: number;
    status: string;
    avgPrice: number | null;
    slippageBps: number | null;
    at: string | null;
  }[];
}

const statusTone: Record<string, 'up' | 'down' | 'warn' | 'neutral' | 'brand'> = {
  FILLED: 'up',
  PARTIAL: 'brand',
  SUBMITTED: 'brand',
  PENDING: 'warn',
  SKIPPED: 'neutral',
  FAILED: 'down',
  ERROR: 'down',
  REJECTED: 'down',
};

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
  delay = 0,
}: {
  icon: (p: { width?: number; height?: number }) => React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'up' | 'down';
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <div className="group rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-black/15 hover:shadow-[0_8px_30px_rgba(0,0,0,0.05)]">
        <div className="mb-2 text-brand transition-transform duration-300 group-hover:scale-110">
          <Icon width={18} height={18} />
        </div>
        <div className="text-xs text-muted">{label}</div>
        <div className={cx('mt-0.5 text-2xl font-semibold tabular-nums', tone === 'up' && 'text-up', tone === 'down' && 'text-down')}>
          {value}
        </div>
      </div>
    </Reveal>
  );
}

export function FollowerAnalytics({ data }: { data: Analytics }) {
  const [range, setRange] = useState<'today' | '30d'>('30d');
  const s = data.summary;

  const hasAnything = s.totalCopies30d > 0 || data.pnlSeries.length > 0 || data.byLeader.length > 0;

  const activityData = useMemo(
    () =>
      data.activity.map((a) => {
        const d = new Date(a.date);
        return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: a.count, sub: `copies · ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` };
      }),
    [data.activity],
  );

  const pnlData = useMemo(
    () =>
      data.pnlSeries.map((p) => ({
        value: p.value,
        label: p.at ? new Date(p.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined,
      })),
    [data.pnlSeries],
  );

  const recentFiltered = useMemo(() => {
    if (range === '30d') return data.recent;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return data.recent.filter((r) => r.at && new Date(r.at) >= start);
  }, [data.recent, range]);

  const maxLeaderCopies = Math.max(1, ...data.byLeader.map((l) => l.copies));

  if (!hasAnything) {
    return (
      <EmptyState
        title="Your performance shows up here"
        body="Once you connect an account and follow a leader, this space fills with your live P&L curve, copy activity, win rate and full trade history."
        action={<LinkButton href="/leaders">Browse leaders</LinkButton>}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* headline analytics stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={BoltIcon} label="Copies (30d)" value={<CountUp value={s.totalCopies30d} format={(n) => String(Math.round(n))} />} delay={0} />
        <StatCard icon={CheckIcon} label="Fill rate" value={<CountUp value={s.fillRate} format={(n) => `${n.toFixed(0)}%`} />} delay={0.05} />
        <StatCard icon={ChartIcon} label="Win rate" value={<CountUp value={s.winRate} format={(n) => `${n.toFixed(0)}%`} />} delay={0.1} />
        <StatCard
          icon={ChartIcon}
          label="Realized P&L"
          value={<CountUp value={s.realizedPnl} format={(n) => fmtUsd(n)} />}
          tone={s.realizedPnl >= 0 ? 'up' : 'down'}
          delay={0.15}
        />
        <StatCard
          icon={ChartIcon}
          label="Open P&L"
          value={<CountUp value={s.openPnl} format={(n) => fmtUsd(n)} />}
          tone={s.openPnl >= 0 ? 'up' : 'down'}
          delay={0.2}
        />
      </div>

      {/* P&L curve + win-rate ring */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Cumulative realized P&L</h2>
                <p className="text-xs text-muted">Across every closed copied position</p>
              </div>
              <Badge tone={s.realizedPnl >= 0 ? 'up' : 'down'}>{fmtUsd(s.realizedPnl)}</Badge>
            </div>
            <AreaChart data={pnlData} height={200} />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-base font-semibold">Win rate</h2>
            <Ring pct={s.winRate} label="of closed trades" />
            <div className="flex gap-6 text-sm">
              <div>
                <div className="font-semibold tabular-nums text-up">{s.wins}</div>
                <div className="text-xs text-muted">wins</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums text-down">{Math.max(0, s.closedCount - s.wins)}</div>
                <div className="text-xs text-muted">losses</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums">{s.closedCount}</div>
                <div className="text-xs text-muted">closed</div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>

      {/* activity + by leader */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal>
          <Card className="h-full">
            <div className="mb-4">
              <h2 className="text-base font-semibold">Copy activity</h2>
              <p className="text-xs text-muted">Trades mirrored per day · last 14 days</p>
            </div>
            <BarChart data={activityData} height={150} />
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="h-full">
            <div className="mb-4">
              <h2 className="text-base font-semibold">By leader</h2>
              <p className="text-xs text-muted">Where your copies come from</p>
            </div>
            {data.byLeader.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No leaders yet.</p>
            ) : (
              <div className="space-y-3">
                {data.byLeader.slice(0, 5).map((l) => (
                  <div key={l.name} className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-semibold">
                      {l.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{l.name}</span>
                        <span className="shrink-0 text-xs text-muted tabular-nums">{l.copies} copies</span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-ink transition-all duration-700"
                          style={{ width: `${(l.copies / maxLeaderCopies) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className={cx('shrink-0 text-sm font-semibold tabular-nums', l.realizedPnl >= 0 ? 'text-up' : 'text-down')}>
                      {fmtUsd(l.realizedPnl)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Reveal>
      </div>

      {/* history table */}
      <Reveal>
        <Card>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">Copied trades</h2>
              <p className="text-xs text-muted">
                {range === 'today' ? 'Today' : 'Last 30 days'} · {recentFiltered.length} shown
              </p>
            </div>
            <div className="flex rounded-full border border-border bg-surface-2 p-0.5 text-xs">
              {(['today', '30d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={cx(
                    'rounded-full px-3 py-1 font-medium transition-colors',
                    range === r ? 'bg-white text-black shadow-sm' : 'text-muted hover:text-black',
                  )}
                >
                  {r === 'today' ? 'Today' : '30 days'}
                </button>
              ))}
            </div>
          </div>
          {recentFiltered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted">
              {range === 'today' ? 'No copies yet today.' : 'No copies in the last 30 days.'}
            </p>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr className="border-b border-border-soft">
                    <th className="px-2 pb-2 font-medium">Time</th>
                    <th className="px-2 pb-2 font-medium">Leader</th>
                    <th className="px-2 pb-2 font-medium">Symbol</th>
                    <th className="px-2 pb-2 font-medium">Side</th>
                    <th className="px-2 pb-2 text-right font-medium">Qty</th>
                    <th className="px-2 pb-2 text-right font-medium">Price</th>
                    <th className="px-2 pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentFiltered.map((t) => (
                    <tr key={t.id} className="border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/50">
                      <td className="whitespace-nowrap px-2 py-2.5 text-muted">
                        {t.at ? new Date(t.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-2 py-2.5">{t.leader}</td>
                      <td className="px-2 py-2.5 font-medium">{t.symbol}</td>
                      <td className="px-2 py-2.5">
                        <Badge tone={t.side === 'BUY' ? 'up' : 'down'}>{t.side}</Badge>
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(t.qty)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{t.avgPrice != null ? fmtNum(t.avgPrice, 2) : '—'}</td>
                      <td className="px-2 py-2.5 text-right">
                        <Badge tone={statusTone[t.status] ?? 'neutral'}>{t.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
