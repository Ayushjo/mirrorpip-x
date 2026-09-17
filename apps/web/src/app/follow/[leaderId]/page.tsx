import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getLeaderPublic, listCredentials } from '@/lib/services/copy';
import { Badge, Card, fmtPct, fmtUsd } from '@/components/ui';
import { ShieldIcon, Sparkline } from '@/components/icons';
import { FollowForm } from '@/components/follow-form';

export const dynamic = 'force-dynamic';

function sparkPoints(series: number[]): number[] {
  if (series.length >= 2) return series;
  return [0.45, 0.46, 0.455, 0.47, 0.465, 0.48];
}

export default async function FollowPage({ params }: { params: Promise<{ leaderId: string }> }) {
  const { leaderId } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [leader, creds] = await Promise.all([
    getLeaderPublic(leaderId).catch(() => null),
    listCredentials(user.id),
  ]);
  if (!leader) notFound();
  const s = leader.stats;

  return (
    <div className="space-y-6">
      <Link href={`/leaders/${leader.id}`} className="text-sm text-muted hover:text-black">
        ← {leader.displayName}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div>
          <h1 className="text-3xl tracking-tight text-black sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Follow {leader.displayName}
          </h1>
          <p className="mt-2 text-sm text-muted">Choose how their trades are sized into your account.</p>
          <div className="mt-6">
            <FollowForm
              leaderId={leader.id}
              leaderName={leader.displayName}
              creds={creds.map((c) => ({ id: c.id, label: c.label, keyLast4: c.keyLast4 }))}
            />
          </div>
        </div>

        {/* Leader summary + risk */}
        <div className="space-y-4">
          <Card className="p-0">
            <div className="rounded-t-2xl px-6 pt-6" style={{ background: 'linear-gradient(160deg, #efedf6, #f7f6fb)' }}>
              <div className="flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-full text-lg font-medium text-black ring-1 ring-black/5"
                  style={{ background: 'radial-gradient(circle at 35% 30%, #ffffff, #e2ddf1)' }}
                >
                  {leader.displayName.slice(0, 1)}
                </div>
                <div>
                  <div className="font-medium">{leader.displayName}</div>
                  <Badge tone="brand">
                    <span className="inline-flex items-center gap-1">
                      <ShieldIcon width={12} height={12} /> Verified
                    </span>
                  </Badge>
                </div>
              </div>
              <div className="-mx-2 mt-3">
                <Sparkline points={sparkPoints(leader.equitySeries)} width={520} height={64} className="w-full text-black" stroke="#2B2644" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-6 text-sm">
              <div>
                <div className="text-xs text-muted">Win rate</div>
                <div className="mt-0.5 font-medium tabular-nums">{s.winRatePct.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-xs text-muted">30d ROI</div>
                <div className="mt-0.5 font-medium tabular-nums text-up">{s.roiPct === 0 ? '—' : fmtPct(s.roiPct)}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Followers</div>
                <div className="mt-0.5 font-medium tabular-nums">{s.followerCount}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Copied</div>
                <div className="mt-0.5 font-medium tabular-nums">{fmtUsd(s.totalCopiedUsd, 0)}</div>
              </div>
            </div>
          </Card>

          <Card className="bg-surface-2 text-sm text-muted">
            <strong className="text-black">Heads up:</strong> copy-trading carries real risk. Start small, set a daily
            loss limit, and never copy with funds you can’t afford to lose.
          </Card>
        </div>
      </div>
    </div>
  );
}
