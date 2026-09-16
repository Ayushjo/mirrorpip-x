import { redirect } from 'next/navigation';
import { getSessionUser, isAdmin } from '@/lib/session';
import { getKillSwitch, listLeadersAdmin } from '@/lib/services/copy';
import { AdminPanel } from '@/components/admin-panel';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  if (!(await isAdmin(user))) redirect('/');

  const [leaders, kill] = await Promise.all([listLeadersAdmin(), getKillSwitch()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-[--color-muted]">Verify leaders and control the copy engine.</p>
      </div>
      <AdminPanel initialLeaders={leaders} initialKill={kill} />
    </div>
  );
}
