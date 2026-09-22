import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/session';
import { getKillSwitch, listLeadersAdmin } from '@/lib/services/copy';
import { getAdminOverview } from '@/lib/services/admin';
import { AdminDashboard } from '@/components/admin-dashboard';
import { PageHero } from '@/components/page-hero';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) redirect('/');

  const [overview, leaders, kill] = await Promise.all([getAdminOverview(), listLeadersAdmin(), getKillSwitch()]);

  return (
    <div className="space-y-6">
      <PageHero
        image="/media/dashboard-banner.webp"
        eyebrow="Control room"
        title="Admin"
        lede="Users, activity, leader verification, access and engine control."
        stats={[
          { v: overview.totals.users.toLocaleString('en-US'), l: 'users' },
          { v: String(overview.totals.activeFollows), l: 'active follows' },
          { v: String(overview.totals.pendingLeaders), l: 'pending leaders' },
          { v: String(overview.activity.copies24h), l: 'copies · 24h' },
        ]}
      />
      <AdminDashboard overview={overview} leaders={leaders} kill={kill} />
    </div>
  );
}
