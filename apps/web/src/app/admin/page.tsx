import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/session';
import { getKillSwitch, listLeadersAdmin } from '@/lib/services/copy';
import { getAdminOverview } from '@/lib/services/admin';
import { AdminDashboard } from '@/components/admin-dashboard';
import { MediaBanner } from '@/components/media-banner';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) redirect('/');

  const [overview, leaders, kill] = await Promise.all([getAdminOverview(), listLeadersAdmin(), getKillSwitch()]);

  return (
    <div className="space-y-6">
      <MediaBanner src="/media/dashboard-banner.webp" position="right center">
        <div className="p-8 sm:p-10">
          <h1 className="text-3xl text-fg sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Admin
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">
            Users, activity, leader verification, access and engine control.
          </p>
        </div>
      </MediaBanner>
      <AdminDashboard overview={overview} leaders={leaders} kill={kill} />
    </div>
  );
}
