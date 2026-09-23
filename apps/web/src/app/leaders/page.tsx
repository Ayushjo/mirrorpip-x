import { listLeaders } from '@/lib/services/copy';
import { Leaderboard, TickingStat } from '@/components/leaderboard';
import { CountIn } from '@/components/landing/motion';
import { Suspense } from 'react';
import { PageHero } from '@/components/page-hero';

export const dynamic = 'force-dynamic';

export default async function LeadersPage() {
  const leaders = await listLeaders();

  const followers = leaders.reduce((n, l) => n + l.stats.followerCount, 0);
  const topRoi = leaders.reduce((m, l) => Math.max(m, l.stats.roiPct), 0);
  const trades = leaders.reduce((n, l) => n + l.stats.tradeCount, 0);

  const stats = [
    { v: <CountIn to={leaders.length} from={0} />, l: 'verified leaders' },
    { v: <CountIn to={followers} from={0} />, l: 'active followers' },
    { v: <TickingStat value={trades} />, l: 'fills mirrored' },
    { v: topRoi > 0 ? `+${topRoi.toFixed(1)}%` : '—', l: 'top ROI' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHero
        eyebrow="Verified traders"
        title="Leaderboard"
        lede="Every trader here is verified on Delta Exchange India. Pick one, set your sizing, and mirror their fills in real time."
        stats={stats}
      />

      <Suspense>
        <Leaderboard leaders={leaders} />
      </Suspense>
    </div>
  );
}
