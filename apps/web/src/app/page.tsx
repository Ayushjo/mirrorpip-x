import { getSessionUser } from '@/lib/session';
import { LinkButton } from '@/components/ui';
import { ShieldIcon, SlidersIcon, ChartIcon, BoltIcon } from '@/components/icons';
import { Reveal } from '@/components/reveal';
import { ArrowRight } from 'lucide-react';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';
const CARD_IMG = '/media/meet-card.webp';
const FOLLOW_VIDEO = '/media/follow-temple.mp4';
const LEAD_VIDEO = '/media/lighthouse.mp4';

const STEPS = [
  {
    n: '01',
    title: 'Connect your exchange',
    body: 'Link a trade-only Delta India API key. Withdrawal stays off — your funds never leave your account.',
    image: '/media/variant-a.webp',
  },
  {
    n: '02',
    title: 'Pick a verified leader',
    body: 'Browse the leaderboard, check ROI and drawdown, then set sizing and risk limits that fit you.',
    image: '/media/variant-b.webp',
  },
  {
    n: '03',
    title: 'Mirror on autopilot',
    body: 'When they fill, the engine sizes and places your copy within a second. Pause or stop anytime.',
    image: '/media/variant-c.webp',
  },
] as const;

const TRUST_SIDE = [
  {
    title: 'Live on Delta India',
    body: 'First venue is Delta Exchange India — the rails you already use, with a kill-switch if anything goes sideways.',
    Icon: ChartIcon,
  },
  {
    title: 'You stay in control',
    body: 'Pause a follow, stop copying, or flip the admin kill-switch. The engine honours it on the next sync.',
    Icon: SlidersIcon,
  },
] as const;

function ModeCard({
  title,
  body,
  href,
  cta,
  video,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
  video: string;
}) {
  return (
    <div className="group relative min-h-[520px] overflow-hidden rounded-3xl border border-border transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)]">
      <video
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
        src={video}
        autoPlay
        muted
        loop
        playsInline
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(5,11,23,0.82) 0%, rgba(5,11,23,0.35) 40%, transparent 75%)',
        }}
      />
      <div className="relative z-10 p-10 sm:p-12">
        <h3 className="mb-5 text-4xl leading-tight text-fg sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
          {title}
        </h3>
        <p className="mb-8 max-w-md text-base text-muted">{body}</p>
        <a href={href} className="group inline-flex items-center gap-3 text-base font-medium text-fg">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-surface/80 backdrop-blur transition-colors group-hover:bg-surface">
            <ArrowRight className="h-4 w-4 text-fg" />
          </span>
          {cta}
        </a>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();
  const primaryHref = user ? '/leaders' : '/register';

  return (
    <div className="flex flex-col gap-16 pb-8 sm:gap-24">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-2">
        <div
          className="relative overflow-hidden rounded-3xl border border-border"
          style={{
            minHeight: 'clamp(560px, 76vh, 760px)',
            background:
              'radial-gradient(1200px 480px at 78% -8%, rgba(0,176,255,0.18), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #050b17 46%, #08203f 100%)',
          }}
        >
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src={HERO_VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,11,23,0.55) 0%, rgba(5,11,23,0.35) 45%, rgba(5,11,23,0.85) 100%), linear-gradient(90deg, rgba(5,11,23,0.9) 0%, rgba(5,11,23,0.55) 45%, rgba(5,11,23,0.15) 78%)',
            }}
          />
          <div className="animate-in relative z-10 flex h-full flex-col items-start justify-start p-6 pt-14 sm:p-14 sm:pt-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-up" /> Live on Delta Exchange India
            </div>
            <h1 className="max-w-2xl text-4xl leading-[1.05] text-fg sm:text-6xl lg:text-7xl" style={{ letterSpacing: '-0.04em' }}>
              Your capital,
              <br />
              on autopilot.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-fg/70 sm:mt-5 sm:text-lg">
              Connect your exchange, follow a verified leader, and every trade they make is mirrored into your account in
              real time — while your funds never leave your custody.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3 sm:mt-8">
              <LinkButton href={primaryHref} arrow className="text-base">
                {user ? 'Browse leaders' : 'Start copying'}
              </LinkButton>
              <LinkButton href="/leaders" variant="ghost" className="text-base">
                See the leaderboard
              </LinkButton>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-10 sm:pt-16">
              {['Trade-only API keys', 'No withdrawal access', 'Pause anytime'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-border bg-surface/75 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet BelieveMeGuys ───────────────────────────────────────────── */}
      <section>
        <Reveal className="mb-14 grid grid-cols-1 items-start gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-tight text-fg sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Meet BelieveMeGuys.
            </h2>
            <div className="mt-8">
              <LinkButton href={primaryHref} arrow>
                Discover it
              </LinkButton>
            </div>
          </div>
          <p className="text-2xl leading-relaxed text-muted sm:text-3xl" style={{ letterSpacing: '-0.01em' }}>
            A copy-trading engine that watches verified leaders and mirrors their trades into your own exchange account —
            automatically, in real time.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-border p-7 sm:col-span-2 lg:col-span-2"
            style={{ backgroundImage: `url("${CARD_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(5,11,23,0.72), rgba(5,11,23,0.5) 45%, rgba(5,11,23,0.88))',
              }}
            />
            <div className="relative text-2xl font-medium leading-snug text-fg" style={{ letterSpacing: '-0.02em' }}>
              Returns that mirror the best.
            </div>
            <p className="relative max-w-xs text-base text-fg/75">
              Every fill a leader makes is sized to your account and placed within a second — you hold the exact same
              positions, proportionally.
            </p>
          </div>
          {[
            { t: 'You keep custody, always.', d: 'Trade-only API keys. The engine can place orders but never withdraw a cent.', Icon: ShieldIcon },
            { t: 'Fully automated.', d: 'No screens to watch. It runs in the background and mirrors trades for you, 24/7.', Icon: BoltIcon },
          ].map(({ t, d, Icon }) => (
            <div
              key={t}
              className="flex flex-col gap-5 rounded-2xl border border-border p-7 sm:min-h-80 sm:justify-between sm:gap-0"
              style={{ background: '#0a1e3a' }}
            >
              <div>
                <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="text-2xl font-medium leading-snug text-white" style={{ letterSpacing: '-0.02em' }}>
                  {t}
                </div>
              </div>
              <p className="text-base text-white/60">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 text-sm text-muted">Three steps</div>
            <h2 className="text-4xl leading-tight text-fg sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              How it works
            </h2>
          </div>
          <p className="max-w-md text-base text-muted">
            From a blank account to live mirrored positions — without ever handing over custody.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {STEPS.map(({ n, title, body, image }, i) => (
            <Reveal key={n} delay={i * 0.12}>
              <div className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)]">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-7">
                  <span className="mb-3 text-xs font-medium text-muted">{n}</span>
                  <h3 className="mb-3 text-xl text-fg" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10 grid grid-cols-1 items-end gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-muted">Built for real money discipline</div>
            <h2 className="text-4xl leading-tight text-fg sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Trust, without the fake logos.
            </h2>
          </div>
          <p className="max-w-md text-base text-muted md:justify-self-end">
            First exchange is Delta Exchange India. We only ask for trade permission — never withdrawal — and encrypt
            every key at rest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl border border-border lg:col-span-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/custody.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-right" />
            {/* mobile: flat vertical darken (text is full-width over the art) */}
            <div
              className="absolute inset-0 lg:hidden"
              style={{
                background:
                  'linear-gradient(180deg, rgba(5,11,23,0.9) 0%, rgba(5,11,23,0.78) 55%, rgba(5,11,23,0.72) 100%)',
              }}
            />
            {/* desktop: left-weighted so the shield art stays visible on the right */}
            <div
              className="absolute inset-0 hidden lg:block"
              style={{
                background:
                  'linear-gradient(90deg, rgba(5,11,23,0.94) 0%, rgba(5,11,23,0.72) 38%, rgba(5,11,23,0.08) 68%)',
              }}
            />
            <div className="relative z-10 flex h-full max-w-md flex-col justify-center p-8 sm:p-12">
              <span className="mb-5 grid h-11 w-11 place-items-center rounded-2xl bg-surface/80 text-brand backdrop-blur">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <h3 className="mb-3 text-3xl text-fg" style={{ letterSpacing: '-0.03em' }}>
                You keep custody
              </h3>
              <p className="text-base leading-relaxed text-muted">
                Trade-enabled, withdrawal-disabled keys only. Secrets are AES-256-GCM encrypted at rest — and never shown
                back to the client.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-cols-1">
            {TRUST_SIDE.map(({ title, body, Icon }) => (
              <div
                key={title}
                className="rounded-3xl border border-border bg-surface p-8 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)]"
              >
                <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mb-3 text-xl text-fg" style={{ letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use modes ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10 max-w-2xl">
          <div className="mb-2 text-sm text-muted">BelieveMeGuys in practice</div>
          <h2 className="mb-4 text-5xl leading-none text-fg sm:text-6xl" style={{ letterSpacing: '-0.04em' }}>
            Use modes
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-muted">
            Whether you’re a follower who wants hands-off returns or a trader who wants a following, BelieveMeGuys has a mode
            for you.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Reveal>
            <ModeCard
              title="Follow"
              body="Pick a verified leader, set your sizing and risk limits, and let the engine mirror their every move into your account — pause or stop whenever you want."
              href={primaryHref}
              cta="Get started"
              video={FOLLOW_VIDEO}
            />
          </Reveal>
          <Reveal delay={0.12}>
            <ModeCard
              title="Lead"
              body="Connect your exchange, get verified, and let followers mirror your fills automatically — you keep trading as usual, with the engine doing the rest."
              href="/connect"
              cta="Become a leader"
              video={LEAD_VIDEO}
            />
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section>
        <Reveal
          className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl p-14 text-center"
        >
        <div className="pointer-events-none absolute inset-0" style={{ background: '#0a1e3a' }} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/cta-band.webp"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(700px 320px at 50% 120%, rgba(0,176,255,0.18), transparent 60%), linear-gradient(180deg, rgba(5,11,23,0.82) 0%, rgba(10,30,58,0.72) 100%)',
            }}
          />
          <h2 className="relative text-3xl text-white sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Ready to trade on autopilot?
          </h2>
          <p className="relative max-w-md text-base text-white/70">
            Connect an account and start mirroring a leader in two minutes.
          </p>
          <LinkButton href={primaryHref} arrow variant="ghost" className="relative mt-1 text-base">
            {user ? 'Browse leaders' : 'Create your account'}
          </LinkButton>
        </Reveal>
      </section>
    </div>
  );
}
