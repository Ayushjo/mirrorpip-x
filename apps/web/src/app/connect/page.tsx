import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { listCredentials } from '@/lib/services/copy';
import { ConnectManager } from '@/components/connect-manager';

export const dynamic = 'force-dynamic';

export default async function ConnectPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const creds = await listCredentials(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Connected accounts</h1>
        <p className="mt-1 text-sm text-[--color-muted]">Manage the exchange accounts you use to follow leaders.</p>
      </div>
      <ConnectManager initial={creds} />
    </div>
  );
}
