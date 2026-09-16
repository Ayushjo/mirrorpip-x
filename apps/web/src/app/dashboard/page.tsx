import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { listFollows } from '@/lib/services/copy';
import { LinkButton } from '@/components/ui';
import { DashboardList } from '@/components/dashboard-list';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const follows = await listFollows(user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Your active copies and live P&L.</p>
        </div>
        <LinkButton href="/leaders" variant="ghost">
          Find leaders
        </LinkButton>
      </div>
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
