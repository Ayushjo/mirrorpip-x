import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeaderPublic } from '@/lib/services/copy';
import { getSessionUser } from '@/lib/session';
import { Badge, Card, LinkButton, fmtNum, fmtPct, fmtUsd } from '@/components/ui';
import { ChartIcon, UsersIcon, ShieldIcon, SlidersIcon, ArrowRightIcon, Sparkline } from '@/components/icons';

export const dynamic = 'force-dynamic';

function series(seed: number, n = 60): number[] {
  const out: number[] = [];
  let v = 0.4;
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((i + seed) * 0.5) * 0.06 + Math.cos((i + seed) * 0.17) * 0.04;
    v = Math.max(0.04, Math.min(0.98, v + wobble * 0.4 + 0.009));
    out.push(v);
  }
  return out;
}

export default async function LeaderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const leader = await getLeaderPublic(id).catch(() => null);
  if (!leader) notFound();

  const s = leader.stats;
  const tiles = [
    { I: ChartIcon, label: 'Win rate', value: `${s.winRatePct.toFixed(1)}%` },
    { I: ChartIcon, label: '30d ROI', value: s.roiPct === 0 ? '—' : fmtPct(s.roiPct), up: s.roiPct > 0 },
    { I: SlidersIcon, label: 'Max drawdown', value: s.maxDrawdownPct === 0 ? '—' : `-${s.maxDrawdownPct.toFixed(1)}%`, down: true },
    { I: UsersIcon, label: 'Followers', value: String(s.followerCount) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/leaders" className="text-sm text-muted hover:text-fg">
        ← Leaderboard
      </Link>

      {/* Header + equity curve */}
      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-2xl font-bold">
              {leader.displayName.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{leader.displayName}</h1>
              <div className="mt-1.5 flex items-center gap-2">
                <Badge tone="brand">
                  <span className="inline-flex items-center gap-1">
                    <ShieldIcon width={12} height={12} /> Verified
                  </span>
                </Badge>
                <span className="text-xs text-faint">Delta Exchange India</span>
              </div>
            </div>
          </div>
          {user ? (
            <LinkButton href={`/follow/${leader.id}`} className="px-6 py-3">
              Follow this leader <ArrowRightIcon />
            </LinkButton>
          ) : (
            <LinkButton href="/register" className="px-6 py-3">
              Sign up to follow <ArrowRightIcon />
            </LinkButton>
          )}
        </div>
        {leader.bio && <p className="relative mt-5 max-w-2xl text-sm text-muted">{leader.bio}</p>}
        <div className="relative mt-6">
          <div className="mb-2 text-xs text-muted">30-day equity curve</div>
          <Sparkline points={series(1)} width={1000} height={120} className="w-full text-brand" stroke="var(--color-brand)" />
        </div>
      </Card>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <div className="mb-2 text-brand">
              <t.I width={18} height={18} />
            </div>
            <div className="text-xs text-muted">{t.label}</div>
            <div className={`mt-0.5 text-lg font-semibold tabular-nums ${t.up ? 'text-up' : t.down && t.value !== '—' ? 'text-down' : ''}`}>
              {t.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent trades */}
      <Card>
        <h2 className="mb-4 text-base font-semibold">Recent trades</h2>
        {leader.recentTrades.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No trades captured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border-soft">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {leader.recentTrades.map((t) => (
                  <tr key={t.id} className="border-b border-border-soft last:border-0">
                    <td className="py-2.5 text-muted">{t.at ? new Date(t.at).toLocaleString() : '—'}</td>
                    <td className="py-2.5 font-medium">{t.symbol}</td>
                    <td className="py-2.5">
                      <Badge tone={t.side === 'BUY' ? 'up' : 'down'}>
                        {t.reduceOnly ? 'CLOSE ' : ''}
                        {t.side}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{fmtNum(t.qty)}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtNum(t.price, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
