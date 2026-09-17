import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { listLeaders } from '@/lib/services/copy';
import { Badge, Card, LinkButton, cx, fmtUsd } from '@/components/ui';
import {
  ShieldIcon,
  BoltIcon,
  SlidersIcon,
  LinkIcon,
  ChartIcon,
  UsersIcon,
  ArrowRightIcon,
  Sparkline,
} from '@/components/icons';

// Deterministic upward-trending series for demo sparklines.
function series(seed: number, n = 24): number[] {
  const out: number[] = [];
  let v = 0.4;
  for (let i = 0; i < n; i++) {
    const wobble = Math.sin((i + seed) * 0.7) * 0.08 + (Math.sin(seed * 3.1) + 1) * 0.004 * i;
    v = Math.max(0.05, Math.min(0.98, v + wobble * 0.5 + 0.012));
    out.push(v);
  }
  return out;
}

export default async function LandingPage() {
  const user = await getSessionUser();
  const leaders = await listLeaders().catch(() => []);
  const primaryHref = user ? '/leaders' : '/register';

  return (
    <div className="space-y-28">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="grid items-center gap-12 pt-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-in">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Live on Delta Exchange India
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Copy the best crypto traders,{' '}
            <span className="bg-gradient-to-r from-brand to-[#38bdf8] bg-clip-text text-transparent">
              automatically.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
            Connect your own exchange account, pick a verified leader, and every trade they make is mirrored into your
            account in real time. Your funds never leave your exchange.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <LinkButton href={primaryHref} className="px-6 py-3 text-base">
              {user ? 'Browse leaders' : 'Start copying free'}
              <ArrowRightIcon />
            </LinkButton>
            <Link href="/leaders" className="rounded-xl px-5 py-3 text-sm text-muted hover:text-fg">
              See the leaderboard →
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-faint">
            <span className="inline-flex items-center gap-1.5">
              <ShieldIcon width={15} height={15} /> You keep custody
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BoltIcon width={15} height={15} /> Sub-second mirroring
            </span>
            <span className="inline-flex items-center gap-1.5">
              <SlidersIcon width={15} height={15} /> Risk limits on every follow
            </span>
          </div>
        </div>

        {/* Hero product card */}
        <div className="animate-in relative">
          <div className="pointer-events-none absolute -inset-6 rounded-[32px] bg-gradient-to-br from-brand/20 to-transparent blur-2xl" />
          <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 font-semibold">A</div>
                <div>
                  <div className="text-sm font-semibold">Aarav Mehta</div>
                  <div className="text-xs text-faint">You’re copying · Proportional ×1</div>
                </div>
              </div>
              <Badge tone="up">+42.1%</Badge>
            </div>
            <div className="mt-5 flex items-end justify-between">
              <div>
                <div className="text-xs text-muted">30-day equity</div>
                <div className="text-2xl font-bold tabular-nums text-up">+$4,912.65</div>
              </div>
              <Sparkline points={series(2, 40)} width={150} height={52} className="text-up" stroke="var(--color-up)" />
            </div>
            <div className="mt-5 space-y-2 border-t border-border-soft pt-4">
              {[
                ['BTCUSD', 'BUY', '+$820.40'],
                ['ETHUSD', 'BUY', '+$318.10'],
                ['SOLUSD', 'SELL', '-$44.20'],
              ].map(([sym, side, pnl]) => (
                <div key={sym} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge tone={side === 'BUY' ? 'up' : 'down'}>{side}</Badge>
                    <span className="font-medium">{sym}</span>
                  </div>
                  <span className={cx('tabular-nums', pnl.startsWith('-') ? 'text-down' : 'text-up')}>{pnl}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted">
          Three steps from connected account to fully automated copying.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {[
            { n: '01', I: LinkIcon, t: 'Connect your account', d: 'Add a trade-enabled, withdrawal-disabled API key. It’s encrypted at rest and never shown again.' },
            { n: '02', I: SlidersIcon, t: 'Pick a leader', d: 'Browse verified traders with transparent stats. Choose your sizing and set risk limits.' },
            { n: '03', I: BoltIcon, t: 'We mirror the trades', d: 'When your leader trades, the engine places the equivalent order in your account within a second.' },
          ].map((s) => (
            <Card key={s.n} className="relative">
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
                <s.I />
              </div>
              <div className="text-xs font-bold text-faint">{s.n}</div>
              <div className="mt-1 text-base font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { I: ShieldIcon, t: 'You keep custody', d: 'API keys only — orders yes, withdrawals never.' },
            { I: BoltIcon, t: 'Real-time engine', d: 'A live WebSocket watches each leader and fans out in milliseconds.' },
            { I: SlidersIcon, t: 'Risk controls', d: 'Proportional sizing, max position, and a daily loss limit.' },
            { I: ChartIcon, t: 'Transparent stats', d: 'Real ROI and drawdown from a live equity curve — nothing faked.' },
          ].map((f) => (
            <Card key={f.t}>
              <div className="mb-3 text-brand">
                <f.I />
              </div>
              <div className="text-sm font-semibold">{f.t}</div>
              <p className="mt-1.5 text-xs text-muted">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ── Top leaders ──────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Top leaders</h2>
            <p className="mt-1 text-sm text-muted">Verified traders you can mirror today.</p>
          </div>
          <Link href="/leaders" className="text-sm text-brand hover:brightness-125">
            View all →
          </Link>
        </div>
        {leaders.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted">
            No verified leaders yet — connect an account and apply to be the first.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.slice(0, 6).map((l, i) => (
              <Link key={l.id} href={`/leaders/${l.id}`}>
                <Card className="h-full transition hover:border-brand">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 font-semibold">
                        {l.displayName.slice(0, 1)}
                      </div>
                      <div className="font-semibold">{l.displayName}</div>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs text-muted">
                      <UsersIcon width={13} height={13} />
                      {l.stats.followerCount}
                    </span>
                  </div>
                  <div className="mt-4">
                    <Sparkline points={series(i + 3)} width={260} height={40} className="w-full text-brand" stroke="var(--color-brand)" />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border-soft pt-3 text-sm">
                    <div>
                      <div className="text-xs text-muted">Win rate</div>
                      <div className="font-semibold tabular-nums">{l.stats.winRatePct.toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">Volume copied</div>
                      <div className="font-semibold tabular-nums">{fmtUsd(l.stats.totalCopiedUsd, 0)}</div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section>
        <Card className="relative overflow-hidden py-16 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-[#38bdf8]/10" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Ready to trade on autopilot?</h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted">
              It takes two minutes to connect an account and start mirroring a leader.
            </p>
            <div className="mt-7 flex justify-center">
              <LinkButton href={primaryHref} className="px-6 py-3 text-base">
                {user ? 'Browse leaders' : 'Create your free account'}
                <ArrowRightIcon />
              </LinkButton>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
