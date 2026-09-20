import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import {
  countTodayCopies,
  listCredentials,
  listFollows,
  getFollowerAnalytics,
  getLeaderAnalytics,
} from '@/lib/services/copy';
import { LinkButton } from '@/components/ui';
import { MediaBanner } from '@/components/media-banner';
import { DashboardList } from '@/components/dashboard-list';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { FollowerAnalytics } from '@/components/follower-analytics';
import { LeaderDashboard } from '@/components/leader-dashboard';
import { Reveal } from '@/components/reveal';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const [follows, todayCopies, creds, analytics, leaderAnalytics] = await Promise.all([
    listFollows(user.id),
    countTodayCopies(user.id),
    listCredentials(user.id),
    getFollowerAnalytics(user.id),
    getLeaderAnalytics(user.id),
  ]);
  const hasCredential = creds.length > 0;
  const hasFollow = follows.some((f) => f.status === 'ACTIVE');
  const isLeaderApplied = creds.some((c) => Boolean(c.leaderStatus));
  const firstName = user.name?.split(' ')[0];

  return (
    <div className="space-y-8">
      <Reveal>
        <MediaBanner src="/media/dashboard-banner.png" position="right center">
          <div className="flex flex-wrap items-center justify-between gap-4 p-8">
            <div>
              <h1 className="text-3xl text-black" style={{ letterSpacing: '-0.03em' }}>
                {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
              </h1>
              <p className="mt-1.5 text-sm text-black/60">Your active copies, live P&amp;L and full trade history.</p>
            </div>
            <LinkButton href="/leaders" variant="ghost" arrow>
              Find leaders
            </LinkButton>
          </div>
        </MediaBanner>
      </Reveal>

      <OnboardingChecklist
        hasCredential={hasCredential}
        hasFollow={hasFollow}
        isLeaderApplied={isLeaderApplied}
        intendedRole={user.intendedRole}
      />

      {leaderAnalytics && leaderAnalytics.length > 0 && <LeaderDashboard leaders={leaderAnalytics} />}

      <section className="space-y-4">
        <Reveal>
          <h2 className="text-lg font-semibold tracking-tight">Live copies</h2>
        </Reveal>
        <DashboardList
          todayCopies={todayCopies}
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
      </section>

      <section className="space-y-4">
        <Reveal>
          <h2 className="text-lg font-semibold tracking-tight">Performance</h2>
        </Reveal>
        <FollowerAnalytics data={analytics} />
      </section>
    </div>
  );
}
