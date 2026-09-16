import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getLeaderPublic, listCredentials } from '@/lib/services/copy';
import { Card } from '@/components/ui';
import { FollowForm } from '@/components/follow-form';

export const dynamic = 'force-dynamic';

export default async function FollowPage({ params }: { params: Promise<{ leaderId: string }> }) {
  const { leaderId } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const [leader, creds] = await Promise.all([
    getLeaderPublic(leaderId).catch(() => null),
    listCredentials(user.id),
  ]);
  if (!leader) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Link href={`/leaders/${leader.id}`} className="text-sm text-muted hover:text-fg">
        ← {leader.displayName}
      </Link>
      <div>
        <h1 className="text-2xl font-bold">Follow {leader.displayName}</h1>
        <p className="mt-1 text-sm text-muted">Choose how their trades are sized into your account.</p>
      </div>

      <Card className="bg-surface-2 text-sm text-muted">
        <strong className="text-fg">Heads up:</strong> copy-trading carries real risk. Start small, set a
        daily loss limit, and never copy with funds you can’t afford to lose.
      </Card>

      <FollowForm
        leaderId={leader.id}
        leaderName={leader.displayName}
        creds={creds.map((c) => ({ id: c.id, label: c.label, keyLast4: c.keyLast4 }))}
      />
    </div>
  );
}
