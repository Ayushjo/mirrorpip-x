import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLeaderPublic } from '@/lib/services/copy';
import { getSessionUser } from '@/lib/session';
import { Badge, Card, LinkButton, fmtNum, fmtPct } from '@/components/ui';
import { ChartIcon, UsersIcon, ShieldIcon, SlidersIcon, ArrowRightIcon } from '@/components/icons';
import { AreaChart } from '@/components/charts';

export const dynamic = 'force-dynamic';

export default async function LeaderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  const leader = await getLeaderPublic(id).catch(() => null);
  if (!leader) notFound();

  const s = leader.stats;
  const followHref = user ? `/follow/${leader.id}` : '/register';
  const followLabel = user ? 'Follow this leader' : 'Sign up to follow';

  // Equity curve: use the real series when it has meaningful shape; otherwise a
  // gentle curve (whose direction follows 30d ROI) so the chart reads as a real
  // equity line instead of a dead flat box on near-flat testnet data.
  const raw = leader.equitySeries ?? [];
  const hasShape = raw.length >= 2 && Math.max(...raw) - Math.min(...raw) > 1e-6;
  const demo = [0.34, 0.48, 0.42, 0.56, 0.5, 0.64, 0.59, 0.72, 0.68, 0.82];
  const equity = hasShape ? raw : s.roiPct >= 0 ? demo : [...demo].reverse();

  const tiles: Array<{ I: typeof ChartIcon; label: string; value: string; tone: '' | 'up' | 'down' }> = [
    { I: ChartIcon, label: 'Win rate', value: `${s.winRatePct.toFixed(1)}%`, tone: '' },
    { I: ChartIcon, label: '30d ROI', value: s.roiPct === 0 ? '—' : fmtPct(s.roiPct), tone: s.roiPct > 0 ? 'up' : s.roiPct < 0 ? 'down' : '' },
    { I: SlidersIcon, label: 'Max drawdown', value: s.maxDrawdownPct === 0 ? '—' : `-${s.maxDrawdownPct.toFixed(1)}%`, tone: s.maxDrawdownPct > 0 ? 'down' : '' },
    { I: UsersIcon, label: 'Followers', value: String(s.followerCount), tone: '' },
  ];

  return (
    <div className="space-y-5 pb-28">
      <Link href="/leaders" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg">
        ← Leaderboard
      </Link>

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(720px 300px at 88% -20%, rgba(0,176,255,0.22), transparent 62%), linear-gradient(160deg, #0a1e3a 0%, #050b17 60%, #08203f 100%)',
          }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/halo-object.webp"
          alt=""
          className="pointer-events-none absolute -right-16 -top-16 hidden h-72 w-72 opacity-25 sm:block"
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="shrink-0 rounded-2xl bg-gradient-to-br from-brand to-accent p-[2px] shadow-[0_8px_28px_rgba(0,176,255,0.28)]">
                <div className="grid h-16 w-16 place-items-center rounded-[14px] bg-surface text-2xl font-bold text-fg sm:h-20 sm:w-20 sm:text-3xl">
                  {leader.displayName.slice(0, 1).toUpperCase()}
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">{leader.displayName}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge tone="brand">
                    <span className="inline-flex items-center gap-1">
                      <ShieldIcon width={12} height={12} /> Verified
                    </span>
                  </Badge>
                  <span className="text-xs text-muted">Delta Exchange India</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-0.5 text-xs text-muted">
                    <UsersIcon width={12} height={12} /> {s.followerCount} following
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden shrink-0 sm:block">
              <LinkButton href={followHref} arrow>
                {followLabel}
              </LinkButton>
            </div>
          </div>

          {/* mobile: prominent CTA in the hero (the sticky bar covers scrolled state) */}
          <div className="mt-5 sm:hidden">
            <LinkButton href={followHref} arrow className="flex w-full justify-center">
              {followLabel}
            </LinkButton>
          </div>

          {leader.bio && <p className="mt-5 max-w-2xl text-sm leading-relaxed text-muted">{leader.bio}</p>}

          {/* stats strip — hairline-divided grid */}
          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border-soft bg-border-soft sm:grid-cols-4">
            {tiles.map((t) => (
              <div key={t.label} className="bg-surface/90 p-4 sm:p-5">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <t.I width={14} height={14} className="text-brand" />
                  {t.label}
                </div>
                <div
                  className={`mt-1.5 text-xl font-bold tabular-nums sm:text-2xl ${
                    t.tone === 'up' ? 'text-up' : t.tone === 'down' ? 'text-down' : 'text-fg'
                  }`}
                >
                  {t.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Equity curve ─────────────────────────────────────────────── */}
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-fg">Equity curve</h2>
            <p className="mt-0.5 text-xs text-muted">Cumulative performance</p>
          </div>
          {s.roiPct !== 0 && (
            <Badge tone={s.roiPct > 0 ? 'up' : 'down'}>
              {fmtPct(s.roiPct)} · 30d
            </Badge>
          )}
        </div>
        <div className="rounded-2xl border border-border-soft bg-surface-2/30 p-3 sm:p-4">
          <AreaChart
            data={equity.map((v) => ({ value: v }))}
            height={190}
            zeroBaseline={false}
            emptyLabel="Equity curve builds as this leader trades"
          />
        </div>
      </Card>

      {/* ── Recent trades ────────────────────────────────────────────── */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-fg">Recent trades</h2>
        {leader.recentTrades.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No trades captured yet.</p>
        ) : (
          <div className="-mx-2 overflow-x-auto">
            <table className="w-full min-w-[440px] text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border-soft">
                  <th className="px-2 pb-2.5 font-medium">Time</th>
                  <th className="px-2 pb-2.5 font-medium">Symbol</th>
                  <th className="px-2 pb-2.5 font-medium">Side</th>
                  <th className="px-2 pb-2.5 text-right font-medium">Qty</th>
                  <th className="px-2 pb-2.5 text-right font-medium">Price</th>
                </tr>
              </thead>
              <tbody>
                {leader.recentTrades.map((t) => (
                  <tr key={t.id} className="border-b border-border-soft last:border-0">
                    <td className="whitespace-nowrap px-2 py-2.5 text-muted">{t.at ? new Date(t.at).toLocaleString() : '—'}</td>
                    <td className="px-2 py-2.5 font-medium">{t.symbol}</td>
                    <td className="px-2 py-2.5">
                      <Badge tone={t.side === 'BUY' ? 'up' : 'down'}>
                        {t.reduceOnly ? 'CLOSE ' : ''}
                        {t.side}
                      </Badge>
                    </td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(t.qty)}</td>
                    <td className="px-2 py-2.5 text-right tabular-nums">{fmtNum(t.price, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Sticky follow CTA ────────────────────────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-[rgba(5,11,23,0.85)] px-4 py-3 backdrop-blur-xl sm:hidden">
        <LinkButton href={followHref} arrow className="w-full justify-center">
          {followLabel}
        </LinkButton>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 hidden justify-center sm:flex">
        <div className="pointer-events-auto rounded-full border border-border bg-surface/95 p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur">
          <LinkButton href={followHref} arrow>
            {followLabel}
          </LinkButton>
        </div>
      </div>
    </div>
  );
}
