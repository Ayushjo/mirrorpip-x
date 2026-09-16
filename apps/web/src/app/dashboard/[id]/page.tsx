import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getFollowDetail } from '@/lib/services/copy';
import { Badge, Card } from '@/components/ui';
import { FollowDetail } from '@/components/follow-detail';

export const dynamic = 'force-dynamic';

export default async function FollowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const detail = await getFollowDetail(user.id, id).catch(() => null);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm text-muted hover:text-fg">
        ← Dashboard
      </Link>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{detail.leader.displayName}</h1>
            <p className="mt-1 text-sm text-muted">
              Copying into {detail.account.label} (••••{detail.account.keyLast4}) · {detail.sizingMode.toLowerCase()} ×
              {detail.sizingValue}
            </p>
          </div>
          <Badge tone={detail.status === 'ACTIVE' ? 'up' : detail.status === 'PAUSED' ? 'warn' : 'down'}>
            {detail.status}
          </Badge>
        </div>
      </Card>

      <FollowDetail initial={detail} />
    </div>
  );
}
