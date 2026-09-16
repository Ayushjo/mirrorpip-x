import Link from 'next/link';
import { listLeaders } from '@/lib/services/copy';
import { Badge, Card, EmptyState, LinkButton, fmtPct, fmtUsd } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function LeadersPage() {
  const leaders = await listLeaders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-muted">Verified traders you can mirror. Stats update as they trade.</p>
      </div>

      {leaders.length === 0 ? (
        <EmptyState
          title="No verified leaders yet"
          body="Leaders appear here once an admin verifies them. If you're a trader, connect an account and ask to be listed."
          action={<LinkButton href="/connect">Connect an account</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l) => (
            <Link key={l.id} href={`/leaders/${l.id}`}>
              <Card className="h-full transition hover:border-brand">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-lg font-semibold">
                      {l.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{l.displayName}</div>
                      <div className="text-xs text-faint">Delta India</div>
                    </div>
                  </div>
                  <Badge tone="brand">{l.stats.followerCount} following</Badge>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-xs text-muted">Win rate</div>
                    <div className="font-semibold tabular-nums">{l.stats.winRatePct.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Trades</div>
                    <div className="font-semibold tabular-nums">{l.stats.tradeCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Copied</div>
                    <div className="font-semibold tabular-nums">{fmtUsd(l.stats.totalCopiedUsd, 0)}</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border-soft pt-3">
                  <span className="text-xs text-muted">
                    ROI {l.stats.roiPct === 0 ? '—' : fmtPct(l.stats.roiPct)}
                  </span>
                  <span className="text-sm font-medium text-brand">Follow →</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
