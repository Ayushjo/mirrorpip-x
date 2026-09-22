import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import {
  countTodayCopies,
  listCredentials,
  listFollows,
  getFollowerAnalytics,
  getLeaderAnalytics,
} from '@/lib/services/copy';
import { LinkButton, fmtUsd } from '@/components/ui';
import { PageHero } from '@/components/page-hero';
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
      <PageHero
        image="/media/dashboard-banner.webp"
        eyebrow={firstName ? `Welcome back, ${firstName}` : 'Your account'}
        title="Dashboard"
        lede="Your active copies, live P&L and full trade history in one place."
        action={
          <LinkButton href="/leaders" variant="ghost" arrow>
            Find leaders
          </LinkButton>
        }
        stats={[
          { v: String(follows.filter((f) => f.status === 'ACTIVE').length), l: 'active copies' },
          { v: String(todayCopies), l: "today's copies" },
          { v: String(creds.length), l: creds.length === 1 ? 'connected account' : 'connected accounts' },
          { v: fmtUsd(follows.reduce((n, f) => n + f.realizedPnl, 0)), l: 'realized P&L' },
        ]}
      />

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
