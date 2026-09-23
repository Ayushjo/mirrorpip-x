import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { prisma } from '@belivemeguys/db';
import { getSessionUser, isAdmin } from '@/lib/session';
import { listCredentials, listFollows } from '@/lib/services/copy';
import { PageHero } from '@/components/page-hero';
import { Badge } from '@/components/ui';
import { ProfileShell } from '@/components/profile/profile-shell';
import { CopyEmail } from '@/components/profile/copy-email';
import { HeroAvatar } from '@/components/profile/avatar-picker';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  const [follows, creds, admin, leader] = await Promise.all([
    listFollows(user.id),
    listCredentials(user.id),
    isAdmin(user),
    prisma.leader.findFirst({
      where: { userId: user.id },
      select: { id: true, displayName: true, bio: true, status: true, listed: true },
    }),
  ]);
  const active = follows.filter((f) => f.status === 'ACTIVE');
  const leadersFollowed = new Set(follows.map((f) => f.leader.id)).size;
  const leaderCred = creds.find((c) => c.isLeader);
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHero
        compact
        eyebrow="Your account"
        title={user.name}
        above={<HeroAvatar name={user.name} initial={user.image} verified={user.emailVerified} />}
        lede={
          <span className="block">
            <span className="flex flex-wrap items-center justify-center gap-2">
              {leaderCred ? <Badge tone={leaderCred.leaderStatus === 'VERIFIED' ? 'brand' : 'warn'}>Leader · {(leaderCred.leaderStatus ?? 'pending').toLowerCase()}</Badge> : <Badge tone="neutral">Follower</Badge>}
              {admin && <Badge tone="up">Admin</Badge>}
              <CopyEmail email={user.email} />
            </span>
          </span>
        }
        stats={[
          { v: String(active.length), l: active.length === 1 ? 'active copy' : 'active copies' },
          { v: String(leadersFollowed), l: leadersFollowed === 1 ? 'leader followed' : 'leaders followed' },
          { v: String(creds.length), l: creds.length === 1 ? 'connected account' : 'connected accounts' },
          { v: memberSince, l: 'member since' },
        ]}
      />

      <Suspense>
        <ProfileShell
          emailVerified={user.emailVerified}
          data={{
            name: user.name,
            email: user.email,
            image: user.image,
            bio: user.bio ?? '',
            country: user.country ?? '',
            city: user.city ?? '',
            postalCode: user.postalCode ?? '',
            phone: user.phone ?? '',
            leader: leader
              ? { id: leader.id, displayName: leader.displayName, bio: leader.bio ?? '', status: leader.status, listed: leader.listed }
              : null,
          }}
        />
      </Suspense>
    </div>
  );
}
