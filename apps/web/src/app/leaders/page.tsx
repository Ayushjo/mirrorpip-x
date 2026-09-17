import Link from 'next/link';
import { listLeaders } from '@/lib/services/copy';
import { Badge, Card, EmptyState, LinkButton, fmtPct, fmtUsd } from '@/components/ui';
import { UsersIcon, ArrowRightIcon, Sparkline } from '@/components/icons';
import { MediaBanner } from '@/components/media-banner';

export const dynamic = 'force-dynamic';

function series(seed: number, n = 28): number[] {
  const out: number[] = [];
  let v = 0.45;
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((i + seed) * 0.8) * 0.09;
    v = Math.max(0.05, Math.min(0.97, v + wobble * 0.5 + 0.011));
    out.push(v);
  }
  return out;
}

const FILTERS = ['Top ROI', 'Win rate', 'Most followed', 'Lowest drawdown'];

export default async function LeadersPage() {
  const leaders = await listLeaders();

  return (
    <div className="space-y-6">
      <MediaBanner src="/media/leaderboard-hero.png" position="right center">
        <div className="p-8 sm:p-10">
          <h1 className="max-w-lg text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
            Leaderboard
          </h1>
          <p className="mt-2 max-w-md text-sm text-black/60">
            Verified traders you can mirror, ranked by 30-day performance.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {FILTERS.map((f, i) => (
              <span
                key={f}
                className={
                  i === 0
                    ? 'rounded-full bg-black px-3.5 py-1.5 text-xs font-medium text-white'
                    : 'rounded-full border border-border bg-white/70 px-3.5 py-1.5 text-xs text-muted backdrop-blur'
                }
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </MediaBanner>

      {leaders.length === 0 ? (
        <EmptyState
          title="No verified leaders yet"
          body="Leaders appear here once an admin verifies them. If you're a trader, connect an account and ask to be listed."
          action={<LinkButton href="/connect">Connect an account</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {leaders.map((l, i) => (
            <Link key={l.id} href={`/leaders/${l.id}`}>
              <Card className="group h-full transition hover:border-brand">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-lg font-semibold">
                      {l.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-semibold">{l.displayName}</div>
                      <div className="text-xs text-faint">Delta India · #{i + 1}</div>
                    </div>
                  </div>
                  <Badge tone="brand">
                    <span className="inline-flex items-center gap-1">
                      <UsersIcon width={12} height={12} />
                      {l.stats.followerCount}
                    </span>
                  </Badge>
                </div>

                <div className="mt-4">
                  <Sparkline points={series(i + 1)} width={300} height={44} className="w-full text-brand" stroke="var(--color-brand)" />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border-soft pt-3 text-sm">
                  <div>
                    <div className="text-xs text-muted">Win rate</div>
                    <div className="font-semibold tabular-nums">{l.stats.winRatePct.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">30d ROI</div>
                    <div className="font-semibold tabular-nums text-up">
                      {l.stats.roiPct === 0 ? '—' : fmtPct(l.stats.roiPct)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Copied</div>
                    <div className="font-semibold tabular-nums">{fmtUsd(l.stats.totalCopiedUsd, 0)}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end text-sm font-medium text-brand">
                  Follow <ArrowRightIcon width={16} height={16} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
