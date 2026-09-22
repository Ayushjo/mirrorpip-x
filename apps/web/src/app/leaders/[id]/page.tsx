import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getLeaderPublic } from '@/lib/services/copy';
import { getSessionUser } from '@/lib/session';
import { Badge, LinkButton } from '@/components/ui';
import { UsersIcon, ShieldIcon, SlidersIcon, BoltIcon } from '@/components/icons';
import { LeaderOverview } from '@/components/leader-overview';
import { Reveal } from '@/components/reveal';
import { PageHero } from '@/components/page-hero';
import { LeaderTrades } from '@/components/leader-trades';

export const dynamic = 'force-dynamic';

export default async function LeaderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const leader = await getLeaderPublic(id).catch(() => null);
  if (!leader) notFound();

  const s = leader.stats;
  const followHref = user ? `/follow/${leader.id}` : '/register';
  const followLabel = user ? 'Follow this leader' : 'Sign up to follow';

  // Equity curve: real series when it has shape; otherwise a gentle curve whose
  // direction follows ROI so the chart never renders as a dead flat box.
  const raw = leader.equitySeries ?? [];
  const hasShape = raw.length >= 2 && Math.max(...raw) - Math.min(...raw) > 1e-6;
  const demo = [0.34, 0.48, 0.42, 0.56, 0.5, 0.64, 0.59, 0.72, 0.68, 0.82];
  const equity = hasShape ? raw : s.roiPct >= 0 ? demo : [...demo].reverse();

  const HOW = [
    { Icon: SlidersIcon, t: 'You set the size', d: 'Fixed amount or multiplier, with a max position and daily loss cap.' },
    { Icon: BoltIcon, t: 'Fills mirror in under a second', d: 'Every order this leader fills lands in your account, proportionally sized.' },
    { Icon: ShieldIcon, t: 'You keep custody', d: 'Trade-only API keys. Pause or stop copying any time.' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <PageHero
        image="/media/leaderboard-hero.webp"
        eyebrow="Verified leader"
        back={
          <Link href="/leaders" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
            <ArrowLeft className="h-3.5 w-3.5" />
            Leaderboard
          </Link>
        }
        title={
          <span className="flex items-center gap-4">
            <span className="shrink-0 rounded-2xl bg-gradient-to-br from-brand to-accent p-[2px] shadow-[0_8px_28px_rgba(0,176,255,0.28)]">
              <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-surface text-2xl font-bold text-fg sm:h-16 sm:w-16">
                {leader.displayName.slice(0, 1).toUpperCase()}
              </span>
            </span>
            <span className="truncate">{leader.displayName}</span>
          </span>
        }
        lede={
          <span className="block">
            <span className="flex flex-wrap items-center gap-2">
              <Badge tone="brand">
                <span className="inline-flex items-center gap-1">
                  <ShieldIcon width={12} height={12} /> Verified
                </span>
              </Badge>
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-up" /> Delta Exchange India
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <UsersIcon width={12} height={12} /> {s.followerCount} following
              </span>
            </span>
            {leader.bio && <span className="mt-3 block">{leader.bio}</span>}
          </span>
        }
        action={
          <LinkButton href={followHref} arrow>
            {followLabel}
          </LinkButton>
        }
      />

      <LeaderOverview stats={s} equity={equity} hasShape={hasShape} />

      {/* ── Activity + fills ─────────────────────────────────────────── */}
      <LeaderTrades trades={leader.recentTrades} />

      {/* ── Copy this leader ─────────────────────────────────────────── */}
      <Reveal>
        <div
          className="relative overflow-hidden rounded-3xl border border-border"
          style={{
            background:
              'radial-gradient(700px 300px at 100% 0%, rgba(0,176,255,0.16), transparent 62%), linear-gradient(160deg, #0a1e3a 0%, #050b17 100%)',
          }}
        >
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <h2 className="text-2xl text-fg sm:text-3xl" style={{ letterSpacing: '-0.03em' }}>
                Copy {leader.displayName}
              </h2>
              <p className="mt-1.5 max-w-lg text-sm text-muted">
                Set your sizing and risk limits once. The engine mirrors every fill from then on.
              </p>
              <ul className="mt-6 grid gap-4 sm:grid-cols-3">
                {HOW.map(({ Icon, t, d }) => (
                  <li key={t} className="flex gap-3 sm:block">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface-2 text-brand sm:mb-3">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium text-fg">{t}</div>
                      <div className="mt-0.5 text-xs leading-relaxed text-muted">{d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="hidden sm:block">
              <LinkButton href={followHref} arrow className="text-base">
                {followLabel}
              </LinkButton>
            </div>
          </div>
        </div>
      </Reveal>

    </div>
  );
}
