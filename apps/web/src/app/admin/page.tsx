import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/session';
import { getKillSwitch, listLeadersAdmin } from '@/lib/services/copy';
import { AdminPanel } from '@/components/admin-panel';
import { MediaBanner } from '@/components/media-banner';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) redirect('/');

  const [leaders, kill] = await Promise.all([listLeadersAdmin(), getKillSwitch()]);

  return (
    <div className="space-y-6">
      <MediaBanner src="/media/dashboard-banner.png" position="right center">
        <div className="p-8 sm:p-10">
          <h1 className="text-3xl text-black sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Admin
          </h1>
          <p className="mt-2 max-w-md text-sm text-black/60">Verify leaders and control the copy engine.</p>
        </div>
      </MediaBanner>
      <AdminPanel initialLeaders={leaders} initialKill={kill} />
    </div>
  );
}
