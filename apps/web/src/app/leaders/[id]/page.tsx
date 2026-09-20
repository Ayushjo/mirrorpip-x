import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeaderPublic } from '@/lib/services/copy';
import { getSessionUser } from '@/lib/session';
import { Badge, Card, LinkButton, fmtNum, fmtPct } from '@/components/ui';
import { ChartIcon, UsersIcon, ShieldIcon, SlidersIcon, ArrowRightIcon } from '@/components/icons';
import { AreaChart } from '@/components/charts';

export const dynamic = 'force-dynamic';

export default async function LeaderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const leader = await getLeaderPublic(id).catch(() => null);
  if (!leader) notFound();

  const s = leader.stats;
  const followHref = user ? `/follow/${leader.id}` : '/register';
  const followLabel = user ? 'Follow this leader' : 'Sign up to follow';
  const tiles = [
    { I: ChartIcon, label: 'Win rate', value: `${s.winRatePct.toFixed(1)}%` },
    { I: ChartIcon, label: '30d ROI', value: s.roiPct === 0 ? '—' : fmtPct(s.roiPct), up: s.roiPct > 0 },
    {
      I: SlidersIcon,
      label: 'Max drawdown',
      value: s.maxDrawdownPct === 0 ? '—' : `-${s.maxDrawdownPct.toFixed(1)}%`,
      down: true,
    },
    { I: UsersIcon, label: 'Followers', value: String(s.followerCount) },
  ];

  return (
    <div className="space-y-6 pb-24">
      <Link href="/leaders" className="text-sm text-muted hover:text-fg">
        ← Leaderboard
      </Link>

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
          <LinkButton href={followHref} className="hidden px-6 py-3 sm:inline-flex">
            {followLabel} <ArrowRightIcon />
          </LinkButton>
        </div>
        {leader.bio && <p className="relative mt-5 max-w-2xl text-sm text-muted">{leader.bio}</p>}
        <div className="relative mt-6">
          <div className="mb-2 text-xs text-muted">Equity curve</div>
          <AreaChart
            data={leader.equitySeries.map((v) => ({ value: v }))}
            height={150}
            zeroBaseline={false}
            emptyLabel="Equity curve builds as this leader trades"
          />
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label}>
            <div className="mb-2 text-brand">
              <t.I width={18} height={18} />
            </div>
            <div className="text-xs text-muted">{t.label}</div>
            <div
              className={`mt-0.5 text-lg font-semibold tabular-nums ${t.up ? 'text-up' : t.down && t.value !== '—' ? 'text-down' : ''}`}
            >
              {t.value}
            </div>
          </Card>
        ))}
      </div>

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

      {/* Sticky follow CTA */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[rgba(245,245,245,0.92)] px-4 py-3 backdrop-blur-xl sm:hidden">
        <LinkButton href={followHref} className="w-full justify-center px-6 py-3">
          {followLabel} <ArrowRightIcon />
        </LinkButton>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-30 hidden justify-center sm:flex">
        <div className="pointer-events-auto rounded-full border border-border bg-white/95 p-1.5 shadow-lg backdrop-blur">
          <LinkButton href={followHref} className="px-6 py-2.5">
            {followLabel} <ArrowRightIcon />
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
