import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { listCredentials } from '@/lib/services/copy';
import { ConnectManager } from '@/components/connect-manager';
import { PageHero } from '@/components/page-hero';
import { Reveal } from '@/components/reveal';
import { exchangeRegistry } from '@belivemeguys/exchange';

export const dynamic = 'force-dynamic';

export default async function ConnectPage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const creds = await listCredentials(user.id);

  return (
    <div className="space-y-6">
      <PageHero
        image="/media/connect-hero.webp"
        eyebrow="Exchange keys"
        title="Connected accounts"
        lede="Manage the exchange accounts you use to follow leaders. Keys are encrypted at rest; withdrawals are never possible."
        stats={[
          { v: String(creds.length), l: creds.length === 1 ? 'account linked' : 'accounts linked' },
          { v: String(creds.filter((c) => c.status === 'VERIFIED' || c.verifiedAt).length), l: 'verified' },
          { v: String(creds.filter((c) => Boolean(c.leaderStatus)).length), l: 'leader profiles' },
          { v: 'AES-256', l: 'key encryption' },
        ]}
      />
      <Reveal delay={0.1}>
        <ConnectManager initial={creds} exchanges={exchangeRegistry} />
      </Reveal>
    </div>
  );
}
