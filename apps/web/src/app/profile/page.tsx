import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldCheck } from 'lucide-react';
import { prisma } from '@belivemeguys/db';
import { getSessionUser, isAdmin } from '@/lib/session';
import { listCredentials, listFollows } from '@/lib/services/copy';
import { PageHero } from '@/components/page-hero';
import { Badge } from '@/components/ui';
import { ProfileShell } from '@/components/profile/profile-shell';
import { CopyEmail } from '@/components/profile/copy-email';

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
        above={
          <span className="relative">
            <span className="absolute inset-0 -m-3 rounded-full bg-brand/25 blur-2xl" />
            <span className="relative grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-brand to-accent p-[3px] shadow-[0_16px_50px_rgba(0,176,255,0.35)]">
              <span className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-[#0b1a33] text-3xl font-bold text-fg">
                {user.image ? <img src={user.image} alt="" className="h-full w-full object-cover" /> : user.name.slice(0, 1).toUpperCase()}
              </span>
            </span>
            {user.emailVerified && (
              <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-4 border-bg bg-up text-[#050b17]" title="Email verified">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
            )}
          </span>
        }
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
