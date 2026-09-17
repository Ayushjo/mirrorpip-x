import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { listFollows } from '@/lib/services/copy';
import { LinkButton } from '@/components/ui';
import { MediaBanner } from '@/components/media-banner';
import { DashboardList } from '@/components/dashboard-list';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const follows = await listFollows(user.id);

  return (
    <div className="space-y-6">
      <MediaBanner src="/media/dashboard-banner.png" position="right center">
        <div className="flex flex-wrap items-center justify-between gap-4 p-8">
          <div>
            <h1 className="text-3xl text-black" style={{ letterSpacing: '-0.03em' }}>
              Dashboard
            </h1>
            <p className="mt-1.5 text-sm text-black/60">Your active copies and live P&L.</p>
          </div>
          <LinkButton href="/leaders" variant="ghost" arrow>
            Find leaders
          </LinkButton>
        </div>
      </MediaBanner>
      <DashboardList
        initial={follows.map((f) => ({
          id: f.id,
          status: f.status as 'ACTIVE' | 'PAUSED' | 'STOPPED',
          sizingMode: f.sizingMode,
          sizingValue: f.sizingValue,
          account: f.account,
          leader: { id: f.leader.id, displayName: f.leader.displayName },
          openPnl: f.openPnl,
          realizedPnl: f.realizedPnl,
        }))}
      />
    </div>
  );
}
