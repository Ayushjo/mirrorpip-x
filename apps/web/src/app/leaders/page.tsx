import { listLeaders } from '@/lib/services/copy';
import { MediaBanner } from '@/components/media-banner';
import { Leaderboard } from '@/components/leaderboard';

export const dynamic = 'force-dynamic';

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
            Verified traders you can mirror — sort by ROI, win rate, followers, or drawdown.
          </p>
        </div>
      </MediaBanner>

      <Leaderboard leaders={leaders} />
    </div>
  );
}
