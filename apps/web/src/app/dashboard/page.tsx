import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import {
  listCredentials,
  listFollows,
  getFollowerAnalytics,
  getLeaderAnalytics,
} from '@/lib/services/copy';
import { OnboardingChecklist } from '@/components/onboarding-checklist';
import { LeaderDashboard } from '@/components/leader-dashboard';
import { DashboardView, FirstRun } from '@/components/dashboard/dashboard-view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const [follows, creds, analytics, leaderAnalytics] = await Promise.all([
    listFollows(user.id),
    listCredentials(user.id),
    getFollowerAnalytics(user.id),
    getLeaderAnalytics(user.id),
  ]);
  const hasCredential = creds.length > 0;
  const hasFollow = follows.some((f) => f.status === 'ACTIVE');
  const isLeaderApplied = creds.some((c) => Boolean(c.leaderStatus));
  const firstName = user.name?.split(' ')[0];

  const firstRun = !hasCredential && follows.length === 0;
  const rows = follows.map((f) => ({
    id: f.id,
    status: f.status as 'ACTIVE' | 'PAUSED' | 'STOPPED',
    sizingMode: f.sizingMode,
    sizingValue: f.sizingValue,
    account: f.account,
    leader: { id: f.leader.id, displayName: f.leader.displayName },
    openPnl: f.openPnl,
    realizedPnl: f.realizedPnl,
  }));

  return (
    <div className="space-y-6 sm:space-y-8">
      {firstRun ? (
        <FirstRun firstName={firstName} hasCredential={hasCredential} />
      ) : (
        <>
          <DashboardView firstName={firstName} initialFollows={rows} analytics={analytics} now={Date.now()} />
          <OnboardingChecklist hasCredential={hasCredential} hasFollow={hasFollow} isLeaderApplied={isLeaderApplied} intendedRole={user.intendedRole} />
        </>
      )}
      {leaderAnalytics && leaderAnalytics.length > 0 && <LeaderDashboard leaders={leaderAnalytics} />}
    </div>
  );
}
