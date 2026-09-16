import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeaderPublic } from '@/lib/services/copy';
import { getSessionUser } from '@/lib/session';
import { Badge, Card, LinkButton, Stat, fmtNum, fmtPct, fmtUsd } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function LeaderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const leader = await getLeaderPublic(id).catch(() => null);
  if (!leader) notFound();

  return (
    <div className="space-y-6">
      <Link href="/leaders" className="text-sm text-muted hover:text-fg">
        ← Leaderboard
      </Link>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-2 text-2xl font-bold">
              {leader.displayName.slice(0, 1)}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{leader.displayName}</h1>
              <div className="mt-1 flex items-center gap-2">
                <Badge tone="brand">Verified</Badge>
                <span className="text-xs text-faint">Delta Exchange India</span>
              </div>
            </div>
          </div>
          {user ? (
            <LinkButton href={`/follow/${leader.id}`} className="px-6 py-3">
              Follow this leader
            </LinkButton>
          ) : (
            <LinkButton href="/register" className="px-6 py-3">
              Sign up to follow
            </LinkButton>
          )}
        </div>
        {leader.bio && <p className="mt-5 max-w-2xl text-sm text-muted">{leader.bio}</p>}
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <Stat label="Win rate" value={`${leader.stats.winRatePct.toFixed(1)}%`} />
        </Card>
        <Card>
          <Stat label="Followers" value={leader.stats.followerCount} />
        </Card>
        <Card>
          <Stat label="Trades" value={leader.stats.tradeCount} />
        </Card>
        <Card>
          <Stat label="Volume copied" value={fmtUsd(leader.stats.totalCopiedUsd, 0)} />
        </Card>
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
        {leader.stats.roiPct === 0 && (
          <p className="mt-3 text-xs text-faint">
            ROI and drawdown are shown once enough equity history is recorded — we don't display estimated figures.
          </p>
        )}
      </Card>
    </div>
  );
}
