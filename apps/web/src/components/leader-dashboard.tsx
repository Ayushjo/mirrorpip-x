'use client';

import Link from 'next/link';
import { Badge, Card, cx, fmtNum, fmtPct, fmtUsd } from './ui';
import { UsersIcon, ChartIcon, BoltIcon, ArrowRightIcon } from './icons';
import { AreaChart } from './charts';
import { CountUp } from './count-up';
import { Reveal } from './reveal';

interface LeaderData {
  id: string;
  displayName: string;
  status: string;
  stats: {
    roiPct: number;
    winRatePct: number;
    maxDrawdownPct: number;
    totalCopiedUsd: number;
    tradeCount: number;
    followerCount: number;
  };
  equitySeries: number[];
  latestEquity: number | null;
  followers: number;
  recentFills: {
    id: string;
    symbol: string;
    side: string;
    qty: number;
    price: number;
    reduceOnly: boolean;
    at: string | null;
  }[];
}

const statusTone: Record<string, 'up' | 'warn' | 'down' | 'neutral'> = {
  VERIFIED: 'up',
  PENDING: 'warn',
  PAUSED: 'warn',
  DELISTED: 'down',
};

export function LeaderDashboard({ leaders }: { leaders: LeaderData[] }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-ink text-white">
          <ChartIcon width={13} height={13} />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">Your leader {leaders.length > 1 ? 'accounts' : 'account'}</h2>
      </div>

      {leaders.map((l, idx) => {
        const tiles = [
          { icon: UsersIcon, label: 'Followers', value: <CountUp value={l.followers} format={(n) => String(Math.round(n))} /> },
          { icon: ChartIcon, label: 'Copied volume', value: <CountUp value={l.stats.totalCopiedUsd} format={(n) => fmtUsd(n, 0)} /> },
          {
            icon: ChartIcon,
            label: 'Equity (latest)',
            value: l.latestEquity != null ? <CountUp value={l.latestEquity} format={(n) => fmtUsd(n, 0)} /> : '—',
          },
          {
            icon: ChartIcon,
            label: 'ROI',
            value: l.stats.roiPct === 0 ? '—' : fmtPct(l.stats.roiPct),
            tone: l.stats.roiPct > 0 ? ('up' as const) : l.stats.roiPct < 0 ? ('down' as const) : undefined,
          },
          { icon: BoltIcon, label: 'Win rate', value: `${l.stats.winRatePct.toFixed(0)}%` },
        ];

        return (
          <Reveal key={l.id} delay={idx * 0.08}>
            <Card className="overflow-hidden">
              {/* header */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-lg font-semibold text-white">
                    {l.displayName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{l.displayName}</h3>
                      <Badge tone={statusTone[l.status] ?? 'neutral'}>{l.status}</Badge>
                    </div>
                    <div className="text-xs text-faint">Delta Exchange India · your copied-from account</div>
                  </div>
                </div>
                <Link
                  href={`/leaders/${l.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-[#ececec]"
                >
                  Public page <ArrowRightIcon width={15} height={15} />
                </Link>
              </div>

              {/* tiles */}
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {tiles.map((t) => (
                  <div key={t.label} className="rounded-xl border border-border-soft bg-bg/40 p-3.5">
                    <div className="mb-1.5 text-brand">
                      <t.icon width={16} height={16} />
                    </div>
                    <div className="text-[11px] text-muted">{t.label}</div>
                    <div className={cx('mt-0.5 text-lg font-semibold tabular-nums', t.tone === 'up' && 'text-up', t.tone === 'down' && 'text-down')}>
                      {t.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* equity curve */}
              <div className="mt-6">
                <div className="mb-2 text-xs text-muted">
                  {l.equitySeries.length >= 2 ? 'Equity curve' : 'Equity curve (collecting samples…)'}
                </div>
                <AreaChart
                  data={l.equitySeries.map((v) => ({ value: v }))}
                  height={160}
                  valueFormat={(v) => fmtUsd(v, 0)}
                  zeroBaseline={false}
                  emptyLabel="Equity curve builds as the engine samples your balance"
                />
              </div>

              {/* recent fills */}
              <div className="mt-6">
                <div className="mb-3 text-sm font-semibold">Recent fills</div>
                {l.recentFills.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted">No fills captured yet.</p>
                ) : (
                  <div className="-mx-2 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-sm">
                      <thead className="text-left text-xs text-muted">
                        <tr className="border-b border-border-soft">
                          <th className="px-2 pb-2 font-medium">Time</th>
                          <th className="px-2 pb-2 font-medium">Symbol</th>
                          <th className="px-2 pb-2 font-medium">Side</th>
                          <th className="px-2 pb-2 text-right font-medium">Qty</th>
                          <th className="px-2 pb-2 text-right font-medium">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {l.recentFills.map((f) => (
                          <tr key={f.id} className="border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/50">
                            <td className="whitespace-nowrap px-2 py-2.5 text-muted" suppressHydrationWarning>
                              {f.at ? new Date(f.at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-2 py-2.5 font-medium">{f.symbol}</td>
                            <td className="px-2 py-2.5">
                              <Badge tone={f.side === 'BUY' ? 'up' : 'down'}>
                                {f.reduceOnly ? 'CLOSE ' : ''}
                                {f.side}
                              </Badge>
                            </td>
                            <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(f.qty)}</td>
                            <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(f.price, 2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </Reveal>
        );
      })}
    </div>
  );
}
