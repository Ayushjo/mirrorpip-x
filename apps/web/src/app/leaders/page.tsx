import { listLeaders } from '@/lib/services/copy';
import { Leaderboard } from '@/components/leaderboard';
import { PageHero } from '@/components/page-hero';

export const dynamic = 'force-dynamic';

export default async function LeadersPage() {
  const leaders = await listLeaders();

  const followers = leaders.reduce((n, l) => n + l.stats.followerCount, 0);
  const topRoi = leaders.reduce((m, l) => Math.max(m, l.stats.roiPct), 0);
  const trades = leaders.reduce((n, l) => n + l.stats.tradeCount, 0);

  const stats = [
    { v: String(leaders.length), l: 'verified leaders' },
    { v: followers.toLocaleString('en-US'), l: 'active followers' },
    { v: trades.toLocaleString('en-US'), l: 'fills mirrored' },
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

      <Leaderboard leaders={leaders} />
    </div>
  );
}
