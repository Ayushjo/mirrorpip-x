import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { listLeaders } from '@/lib/services/copy';
import { Badge, Card, LinkButton, fmtUsd } from '@/components/ui';

export default async function LandingPage() {
  const user = await getSessionUser();
  const leaders = await listLeaders().catch(() => []);
  const primaryHref = user ? '/leaders' : '/register';

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="animate-in pt-8 text-center">
        <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          Live on Delta Exchange India
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-6xl">
          Copy the best crypto traders,
          <span className="text-brand"> automatically.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          Connect your own exchange account, pick a verified leader, and every trade they make is mirrored into your
          account in real time. Your funds never leave your exchange.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <LinkButton href={primaryHref} className="px-6 py-3 text-base">
            {user ? 'Browse leaders' : 'Start copying free'}
          </LinkButton>
          <Link href="/leaders" className="rounded-xl px-5 py-3 text-sm text-muted hover:text-fg">
            See the leaderboard →
          </Link>
        </div>

        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-4 text-left">
          {[
            { k: 'Custody', v: 'You keep it', s: 'API keys only — no withdrawals' },
            { k: 'Latency', v: 'Real-time', s: 'Live WebSocket order mirroring' },
            { k: 'Control', v: 'Pause anytime', s: 'Risk limits on every follow' },
          ].map((x) => (
            <Card key={x.k} className="p-4">
              <div className="text-xs text-muted">{x.k}</div>
              <div className="mt-1 text-lg font-bold">{x.v}</div>
              <div className="mt-0.5 text-xs text-faint">{x.s}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            {
              n: '01',
              t: 'Connect your account',
              d: 'Add a trade-enabled, withdrawal-disabled API key from your exchange. We encrypt it at rest — it is never shown again.',
            },
            {
              n: '02',
              t: 'Pick a leader',
              d: 'Browse verified traders with transparent stats. Choose your sizing (proportional, fixed, or a multiplier) and set risk limits.',
            },
            {
              n: '03',
              t: 'We mirror the trades',
              d: 'When your leader trades, the engine places the equivalent order in your account within a second — and tracks your live P&L.',
            },
          ].map((s) => (
            <Card key={s.n}>
              <div className="text-sm font-bold text-brand">{s.n}</div>
              <div className="mt-2 text-base font-semibold">{s.t}</div>
              <p className="mt-2 text-sm text-muted">{s.d}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Leaders preview */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Top leaders</h2>
          <Link href="/leaders" className="text-sm text-brand hover:brightness-125">
            View all →
          </Link>
        </div>
        {leaders.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted">
            No verified leaders yet — check back soon.
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {leaders.slice(0, 6).map((l) => (
              <Link key={l.id} href={`/leaders/${l.id}`}>
                <Card className="transition hover:border-brand">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 font-semibold">
                        {l.displayName.slice(0, 1)}
                      </div>
                      <div className="font-semibold">{l.displayName}</div>
                    </div>
                    <Badge tone="brand">{l.stats.followerCount} following</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
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

      {/* CTA */}
      <section>
        <Card className="flex flex-col items-center gap-4 bg-gradient-to-b from-surface to-brand-soft py-14 text-center">
          <h2 className="text-2xl font-bold">Ready to trade on autopilot?</h2>
          <p className="max-w-md text-sm text-muted">
            It takes two minutes to connect an account and start mirroring a leader.
          </p>
          <LinkButton href={primaryHref} className="px-6 py-3 text-base">
            {user ? 'Browse leaders' : 'Create your free account'}
          </LinkButton>
        </Card>
      </section>
    </div>
  );
}
