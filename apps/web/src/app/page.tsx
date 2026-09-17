import { getSessionUser } from '@/lib/session';
import { LinkButton } from '@/components/ui';
import { ShieldIcon, BoltIcon, LinkIcon, SlidersIcon, UsersIcon, ChartIcon } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';
const CARD_IMG =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85';
const USECASE_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4';
const LEAD_VIDEO = '/media/lighthouse.mp4';

const STEPS = [
  {
    n: '01',
    title: 'Connect your exchange',
    body: 'Link a trade-only Delta India API key. Withdrawal stays off — your funds never leave your account.',
    Icon: LinkIcon,
  },
  {
    n: '02',
    title: 'Pick a verified leader',
    body: 'Browse the leaderboard, check ROI and drawdown, then set sizing and risk limits that fit you.',
    Icon: UsersIcon,
  },
  {
    n: '03',
    title: 'Mirror on autopilot',
    body: 'When they fill, the engine sizes and places your copy within a second. Pause or stop anytime.',
    Icon: BoltIcon,
  },
] as const;

const TRUST = [
  {
    title: 'You keep custody',
    body: 'Trade-enabled, withdrawal-disabled keys only. Secrets are AES-256-GCM encrypted at rest.',
    Icon: ShieldIcon,
  },
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
    <div className="relative min-h-[520px] overflow-hidden rounded-3xl border border-border">
      <video className="absolute inset-0 h-full w-full object-cover" src={video} autoPlay muted loop playsInline />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(245,245,245,0.82) 0%, rgba(245,245,245,0.35) 40%, transparent 75%)',
        }}
      />
      <div className="relative z-10 p-10 sm:p-12">
        <h3 className="mb-5 text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
          {title}
        </h3>
        <p className="mb-8 max-w-md text-base text-black/70">{body}</p>
        <a href={href} className="group inline-flex items-center gap-3 text-base font-medium text-black">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur transition-colors group-hover:bg-white">
            <ArrowRight className="h-4 w-4 text-black" />
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
    <div className="flex flex-col gap-24 pb-8">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-2">
        <div
          className="relative overflow-hidden rounded-3xl border border-border"
          style={{
            minHeight: 'clamp(560px, 76vh, 760px)',
            background:
              'radial-gradient(1200px 480px at 78% -8%, rgba(43,38,68,0.16), transparent 60%), linear-gradient(160deg, #ecebf4 0%, #f5f5f5 46%, #e9eef7 100%)',
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
                'linear-gradient(90deg, rgba(245,245,245,0.92) 0%, rgba(245,245,245,0.62) 40%, rgba(245,245,245,0.08) 72%)',
            }}
          />
          <div className="animate-in relative z-10 flex h-full flex-col items-start justify-start p-8 pt-20 sm:p-14 sm:pt-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-up" /> Live on Delta Exchange India
            </div>
            <h1 className="max-w-2xl text-5xl leading-[1.02] text-black sm:text-7xl" style={{ letterSpacing: '-0.04em' }}>
              Your capital,
              <br />
              on autopilot.
            </h1>
            <p
              className="mt-5 max-w-md text-base leading-relaxed text-black/65 sm:text-lg"
              style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}
            >
              Connect your exchange, follow a verified leader, and every trade they make is mirrored into your account in
              real time — while your funds never leave your custody.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton href={primaryHref} arrow className="text-base">
                {user ? 'Browse leaders' : 'Start copying'}
              </LinkButton>
              <LinkButton href="/leaders" variant="ghost" className="text-base">
                See the leaderboard
              </LinkButton>
            </div>

            <div className="mt-auto flex flex-wrap gap-2 pt-16">
              {['Trade-only API keys', 'No withdrawal access', 'Pause anytime'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-black/10 bg-white/75 px-3.5 py-1.5 text-xs font-medium text-black/65 backdrop-blur"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Meet MirrorPip ───────────────────────────────────────────── */}
      <section>
        <div className="mb-14 grid grid-cols-1 items-start gap-12 md:grid-cols-2">
          <div>
            <h2 className="text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Meet MirrorPip.
            </h2>
            <div className="mt-8">
              <LinkButton href={primaryHref} arrow>
                Discover it
              </LinkButton>
            </div>
          </div>
          <p className="text-2xl leading-relaxed text-black/70 sm:text-3xl" style={{ letterSpacing: '-0.01em' }}>
            A copy-trading engine that watches verified leaders and mirrors their trades into your own exchange account —
            automatically, in real time.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-border p-7 sm:col-span-2 lg:col-span-2"
            style={{ backgroundImage: `url("${CARD_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.55))',
              }}
            />
            <div className="relative text-2xl font-medium leading-snug text-black" style={{ letterSpacing: '-0.02em' }}>
              Returns that mirror the best.
            </div>
            <p className="relative max-w-xs text-base text-black/70">
              Every fill a leader makes is sized to your account and placed within a second — you hold the exact same
              positions, proportionally.
            </p>
          </div>
          {[
            ['You keep custody, always.', 'Trade-only API keys. The engine can place orders but never withdraw a cent.'],
            ['Fully automated.', 'No screens to watch. It runs in the background and mirrors trades for you, 24/7.'],
          ].map(([t, d]) => (
            <div key={t} className="flex min-h-80 flex-col justify-between rounded-2xl p-7" style={{ background: '#2B2644' }}>
              <div className="whitespace-pre-line text-2xl font-medium leading-snug text-white" style={{ letterSpacing: '-0.02em' }}>
                {t}
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
            <div className="mb-2 text-sm text-black/60">Three steps</div>
            <h2 className="text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              How it works
            </h2>
          </div>
          <p className="max-w-md text-base text-black/60">
            From a blank account to live mirrored positions — without ever handing over custody.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:col-span-3">
            {STEPS.map(({ n, title, body, Icon }) => (
              <div
                key={n}
                className="flex flex-col rounded-3xl border border-border bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.02)]"
              >
                <div className="mb-6 flex items-center justify-between">
                  <span className="text-xs font-medium text-black/40">{n}</span>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#efeef4] text-ink">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>
                <h3 className="mb-3 text-xl text-black" style={{ letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-sm leading-relaxed text-black/60">{body}</p>
              </div>
            ))}
          </div>

          <div
            className="relative min-h-72 overflow-hidden rounded-3xl border border-border lg:col-span-2"
            style={{
              background:
                'radial-gradient(600px 320px at 70% 20%, rgba(43,38,68,0.12), transparent 55%), linear-gradient(160deg, #ecebf4, #f5f5f5)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/halo-object.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(245,245,245,0.15) 0%, rgba(245,245,245,0.55) 70%, rgba(245,245,245,0.85) 100%)',
              }}
            />
            <div className="relative z-10 flex h-full flex-col justify-end p-8">
              <div className="text-2xl font-medium text-black" style={{ letterSpacing: '-0.02em' }}>
                Your keys stay linked to you.
              </div>
              <p className="mt-2 max-w-xs text-sm text-black/60">
                The halo mark is the product idea in one shape — connection without custody.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10 grid grid-cols-1 items-end gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 text-sm text-black/60">Built for real money discipline</div>
            <h2 className="text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Trust, without the fake logos.
            </h2>
          </div>
          <p className="max-w-md text-base text-black/60 md:justify-self-end">
            First exchange is Delta Exchange India. We only ask for trade permission — never withdrawal — and encrypt
            every key at rest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TRUST.map(({ title, body, Icon }) => (
            <div key={title} className="rounded-3xl border border-border bg-white p-8">
              <span className="mb-6 grid h-11 w-11 place-items-center rounded-2xl bg-[#efeef4] text-ink">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mb-3 text-xl text-black" style={{ letterSpacing: '-0.02em' }}>
                {title}
              </h3>
              <p className="text-sm leading-relaxed text-black/60">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use modes ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-10 max-w-2xl">
          <div className="mb-2 text-sm text-black/60">MirrorPip in practice</div>
          <h2 className="mb-4 text-5xl leading-none text-black sm:text-6xl" style={{ letterSpacing: '-0.04em' }}>
            Use modes
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-black/60">
            Whether you’re a follower who wants hands-off returns or a trader who wants a following, MirrorPip has a mode
            for you.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ModeCard
            title="Follow"
            body="Pick a verified leader, set your sizing and risk limits, and let the engine mirror their every move into your account — pause or stop whenever you want."
            href={primaryHref}
            cta="Get started"
            video={USECASE_VIDEO}
          />
          <ModeCard
            title="Lead"
            body="Connect your exchange, get verified, and let followers mirror your fills automatically — you keep trading as usual, with the engine doing the rest."
            href="/connect"
            cta="Become a leader"
            video={LEAD_VIDEO}
          />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section>
        <div
          className="relative flex flex-col items-center gap-5 overflow-hidden rounded-3xl p-14 text-center"
          style={{ background: '#2B2644' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/cta-band.png"
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-[#2B2644]/45" />
          <h2 className="relative text-3xl text-white sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Ready to trade on autopilot?
          </h2>
          <p className="relative max-w-md text-base text-white/70">
            Connect an account and start mirroring a leader in two minutes.
          </p>
          <LinkButton href={primaryHref} arrow variant="ghost" className="relative mt-1 text-base">
            {user ? 'Browse leaders' : 'Create your account'}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
