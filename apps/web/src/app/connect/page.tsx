import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { listCredentials } from '@/lib/services/copy';
import { ConnectManager } from '@/components/connect-manager';
import { MediaBanner } from '@/components/media-banner';
import { exchangeRegistry } from '@belivemeguys/exchange';

export const dynamic = 'force-dynamic';

export default async function ConnectPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const creds = await listCredentials(user.id);

  return (
    <div className="space-y-6">
      <MediaBanner src="/media/connect-hero.png" position="right center">
        <div className="p-8 sm:p-10">
          <h1 className="text-3xl text-black sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Connected accounts
          </h1>
          <p className="mt-2 max-w-md text-sm text-black/60">
            Manage the exchange accounts you use to follow leaders. Keys are encrypted; withdrawals are never possible.
          </p>
        </div>
      </MediaBanner>
      <ConnectManager initial={creds} exchanges={exchangeRegistry} />
    </div>
  );
}
