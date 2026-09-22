import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/session';
import { getFollowDetail } from '@/lib/services/copy';
import { Badge } from '@/components/ui';
import { PageHero } from '@/components/page-hero';
import { ArrowLeft } from 'lucide-react';
import { FollowDetail } from '@/components/follow-detail';

export const dynamic = 'force-dynamic';

export default async function FollowDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect('/login');

  const detail = await getFollowDetail(user.id, id).catch(() => null);
  if (!detail) notFound();

  return (
    <div className="space-y-8">
      <PageHero
        compact
        back={
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
        }
        eyebrow="Copy detail"
        title={detail.leader.displayName}
        lede={
          <span className="inline-flex flex-wrap items-center justify-center gap-2">
            <span>
              Copying into {detail.account.label} (••••{detail.account.keyLast4}) · {detail.sizingMode.toLowerCase()} ×{detail.sizingValue}
            </span>
            <Badge tone={detail.status === 'ACTIVE' ? 'up' : detail.status === 'PAUSED' ? 'warn' : 'down'}>{detail.status}</Badge>
          </span>
        }
      />

      <FollowDetail initial={detail} />
    </div>
  );
}
