import Link from 'next/link';
import { listLeaders } from '@/lib/services/copy';
import { Badge, Card, EmptyState, LinkButton, fmtPct, fmtUsd } from '@/components/ui';
import { UsersIcon, Sparkline } from '@/components/icons';
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
        <div className="grid gap-5 sm:grid-cols-2">
          {leaders.map((l, i) => (
            <Card key={l.id} className="group flex h-full flex-col p-0">
              {/* header with gradient + equity curve */}
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
                  <Sparkline points={series(i + 1)} width={520} height={72} className="w-full text-black" stroke="#2B2644" />
                </div>
              </div>

              {/* stats + CTA */}
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
                    <div className="text-xs text-muted">Copied</div>
                    <div className="mt-0.5 font-medium tabular-nums">{fmtUsd(l.stats.totalCopiedUsd, 0)}</div>
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
