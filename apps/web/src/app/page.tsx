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

const HERO_STATS = [
  { v: '<1s', l: 'mirror latency' },
  { v: '0', l: 'withdrawal access' },
  { v: '24/7', l: 'on autopilot' },
] as const;

/* Section eyebrow — on mobile a small blue rule + tracked caps label (editorial
   feel); on sm+ it falls back to the original quiet muted line. */
function Eyebrow({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand sm:mb-2 sm:text-sm sm:font-normal sm:normal-case sm:tracking-normal sm:text-muted">
      <span className="h-px w-6 bg-brand sm:hidden" />
      {children}
    </div>
  );
}

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
    <div className="group relative min-h-[440px] overflow-hidden rounded-[1.75rem] border border-border transition-shadow duration-300 hover:shadow-[0_24px_60px_rgba(0,0,0,0.10)] sm:min-h-[520px] sm:rounded-3xl">
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
      {/* mobile: darken the foot so the CTA sits on solid ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-40 sm:hidden"
        style={{ background: 'linear-gradient(180deg, transparent, rgba(5,11,23,0.7))' }}
      />
      <div className="relative z-10 flex h-full min-h-[440px] flex-col p-6 sm:block sm:min-h-0 sm:p-10 md:p-12">
        <h3
          className="mb-3 text-[2.5rem] leading-none text-fg sm:mb-5 sm:text-4xl sm:leading-tight md:text-5xl"
          style={{ letterSpacing: '-0.03em' }}
        >
          {title}
        </h3>
        <p className="mb-6 max-w-md text-[15px] leading-relaxed text-fg/75 sm:mb-8 sm:text-base sm:text-muted">
          {body}
        </p>
        <a
          href={href}
          className="group mt-auto inline-flex items-center gap-3 text-base font-medium text-fg sm:mt-0"
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-brand text-[#050b17] shadow-[0_6px_20px_rgba(0,176,255,0.35)] transition-colors sm:h-9 sm:w-9 sm:bg-surface/80 sm:text-fg sm:shadow-none sm:backdrop-blur sm:group-hover:bg-surface">
            <ArrowRight className="h-4 w-4" />
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
    <div className="flex flex-col gap-14 pb-8 sm:gap-24">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      {/* Mobile: full-bleed under the header, rounded foot, content anchored
          low so the video breathes at the top. sm+: original framed card. */}
      <section className="-mx-6 -mt-10 sm:mx-0 sm:mt-0 sm:pt-2">
        <div
          className="relative min-h-[min(86svh,720px)] overflow-hidden rounded-b-[2.25rem] border-b border-border sm:min-h-[clamp(560px,76vh,760px)] sm:rounded-3xl sm:border"
          style={{
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
          {/* desktop overlay (unchanged) */}
          <div
            className="absolute inset-0 hidden sm:block"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,11,23,0.55) 0%, rgba(5,11,23,0.35) 45%, rgba(5,11,23,0.85) 100%), linear-gradient(90deg, rgba(5,11,23,0.9) 0%, rgba(5,11,23,0.55) 45%, rgba(5,11,23,0.15) 78%)',
            }}
          />
          {/* mobile overlay: clear at the top, solid navy at the foot */}
          <div
            className="absolute inset-0 sm:hidden"
            style={{
              background:
                'linear-gradient(180deg, rgba(5,11,23,0.55) 0%, rgba(5,11,23,0.25) 30%, rgba(5,11,23,0.8) 58%, rgba(5,11,23,0.97) 100%)',
            }}
          />
          <div className="animate-in relative z-10 flex h-full min-h-[min(86svh,720px)] flex-col items-start justify-end px-6 pb-6 pt-20 sm:min-h-0 sm:justify-start sm:p-14 sm:pt-28">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-[#050b17]/70 px-3 py-1.5 text-[11px] font-medium text-fg/85 backdrop-blur sm:border-border sm:bg-surface/70 sm:py-1 sm:text-xs sm:font-normal sm:text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-up opacity-75 sm:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-up" />
              </span>
              Live on Delta Exchange India
            </div>
            <h1
              className="max-w-2xl text-[2.9rem] leading-[0.96] text-fg sm:text-6xl sm:leading-[1.05] lg:text-7xl"
              style={{ letterSpacing: '-0.04em' }}
            >
              Your capital,
              <br />
              <span className="bg-gradient-to-r from-brand to-accent bg-clip-text text-transparent sm:bg-none sm:text-fg">
                on autopilot.
              </span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg/70 sm:mt-5 sm:text-lg">
              Connect your exchange, follow a verified leader, and every trade they make is mirrored into your account in
              real time — while your funds never leave your custody.
            </p>
            <div className="mt-7 flex w-full flex-col gap-2.5 sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
              <LinkButton href={primaryHref} arrow className="w-full py-2.5 text-base sm:w-auto sm:py-2">
                {user ? 'Browse leaders' : 'Start copying'}
              </LinkButton>
              <LinkButton href="/leaders" variant="ghost" className="w-full py-3 text-base sm:w-auto sm:py-2.5">
                See the leaderboard
              </LinkButton>
            </div>

            {/* mobile: proof strip */}
            <div className="mt-7 grid w-full grid-cols-3 divide-x divide-white/10 border-t border-white/10 pt-4 sm:hidden">
              {HERO_STATS.map(({ v, l }) => (
                <div key={l} className="px-3 first:pl-0 last:pr-0">
                  <div className="text-xl font-semibold leading-none text-fg" style={{ letterSpacing: '-0.02em' }}>
                    {v}
                  </div>
                  <div className="mt-1.5 text-[11px] leading-tight text-muted">{l}</div>
                </div>
              ))}
            </div>

            {/* sm+: original chips */}
            <div className="mt-auto hidden flex-wrap gap-2 pt-10 sm:flex sm:pt-16">
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
        <Reveal className="mb-8 grid grid-cols-1 items-start gap-5 sm:mb-14 sm:gap-12 md:grid-cols-2">
          <div>
            <div className="sm:hidden">
              <Eyebrow>The engine</Eyebrow>
            </div>
            <h2 className="text-[2.1rem] leading-[1.02] text-fg sm:text-4xl sm:leading-tight md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Meet BelieveMeGuys.
            </h2>
            <div className="mt-8 hidden sm:block">
              <LinkButton href={primaryHref} arrow>
                Discover it
              </LinkButton>
            </div>
          </div>
          <div>
            <p className="text-lg leading-relaxed text-muted sm:text-2xl md:text-3xl" style={{ letterSpacing: '-0.01em' }}>
              A copy-trading engine that watches verified leaders and mirrors their trades into your own exchange account —
              automatically, in real time.
            </p>
            <div className="mt-5 sm:hidden">
              <LinkButton href={primaryHref} arrow>
                Discover it
              </LinkButton>
            </div>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <div
            className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-[1.5rem] border border-border p-6 sm:col-span-2 sm:min-h-80 sm:rounded-2xl sm:p-7 lg:col-span-2"
            style={{ backgroundImage: `url("${CARD_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(5,11,23,0.72), rgba(5,11,23,0.5) 45%, rgba(5,11,23,0.88))',
              }}
            />
            <div className="relative text-[1.65rem] font-medium leading-[1.1] text-fg sm:text-2xl sm:leading-snug" style={{ letterSpacing: '-0.02em' }}>
              Returns that mirror the best.
            </div>
            <p className="relative max-w-xs text-[15px] leading-relaxed text-fg/75 sm:text-base">
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
              className="flex items-start gap-4 rounded-[1.5rem] border border-border p-5 sm:min-h-80 sm:flex-col sm:justify-between sm:gap-0 sm:rounded-2xl sm:p-7"
              style={{ background: '#0a1e3a' }}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-brand sm:mb-5">
                <Icon className="h-5 w-5" />
              </span>
              <div className="flex-1 sm:contents">
                <div className="text-lg font-medium leading-snug text-white sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>
                  {t}
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-white/60 sm:mt-0 sm:text-base">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section id="how-it-works">
        <div className="mb-6 flex flex-col gap-3 sm:mb-10 sm:gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Three steps</Eyebrow>
            <h2 className="text-[2.1rem] leading-[1.02] text-fg sm:text-4xl sm:leading-tight md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              How it works
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-muted sm:text-base">
            From a blank account to live mirrored positions — without ever handing over custody.
          </p>
        </div>

        {/* mobile: edge-to-edge snap carousel; md+: original 3-col grid */}
        <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 pb-1 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0">
          {STEPS.map(({ n, title, body, image }, i) => (
            <Reveal key={n} delay={i * 0.12} className="w-[80vw] max-w-[330px] shrink-0 snap-start md:w-auto md:max-w-none">
              <div className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_18px_44px_rgba(0,0,0,0.07)] sm:rounded-3xl">
                <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                  />
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-[#050b17]/70 px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-fg backdrop-blur md:hidden">
                    {n}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-7">
                  <span className="mb-3 hidden text-xs font-medium text-muted md:block">{n}</span>
                  <h3 className="mb-2 text-xl text-fg sm:mb-3" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-faint md:hidden">
          <span className="h-px w-5 bg-border" />
          Swipe to explore
          <ArrowRight className="h-3 w-3" />
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 grid grid-cols-1 items-end gap-3 sm:mb-10 sm:gap-6 md:grid-cols-2">
          <div>
            <Eyebrow>Built for real money discipline</Eyebrow>
            <h2 className="text-[2.1rem] leading-[1.02] text-fg sm:text-4xl sm:leading-tight md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              Trust, without the fake logos.
            </h2>
          </div>
          <p className="max-w-md text-[15px] text-muted sm:text-base md:justify-self-end">
            First exchange is Delta Exchange India. We only ask for trade permission — never withdrawal — and encrypt
            every key at rest.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-5">
          <div className="relative min-h-[340px] overflow-hidden rounded-[1.5rem] border border-border sm:min-h-[360px] sm:rounded-3xl lg:col-span-3">
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
            <div className="relative z-10 flex h-full min-h-[340px] max-w-md flex-col justify-end p-6 sm:min-h-0 sm:justify-center sm:p-12">
              <span className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-surface/80 text-brand backdrop-blur sm:mb-5">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <h3 className="mb-2 text-[1.75rem] leading-none text-fg sm:mb-3 sm:text-3xl" style={{ letterSpacing: '-0.03em' }}>
                You keep custody
              </h3>
              <p className="text-[15px] leading-relaxed text-muted sm:text-base">
                Trade-enabled, withdrawal-disabled keys only. Secrets are AES-256-GCM encrypted at rest — and never shown
                back to the client.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:col-span-2 lg:grid-cols-1">
            {TRUST_SIDE.map(({ title, body, Icon }) => (
              <div
                key={title}
                className="flex items-start gap-4 rounded-[1.5rem] border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-1 hover:border-border hover:shadow-[0_16px_40px_rgba(0,0,0,0.06)] sm:block sm:rounded-3xl sm:p-8"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-brand sm:mb-6">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="mb-1.5 text-lg text-fg sm:mb-3 sm:text-xl" style={{ letterSpacing: '-0.02em' }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Use modes ────────────────────────────────────────────────── */}
      <section>
        <div className="mb-6 max-w-2xl sm:mb-10">
          <Eyebrow>BelieveMeGuys in practice</Eyebrow>
          <h2 className="mb-3 text-[2.6rem] leading-none text-fg sm:mb-4 sm:text-5xl md:text-6xl" style={{ letterSpacing: '-0.04em' }}>
            Use modes
          </h2>
          <p className="max-w-lg text-[15px] leading-relaxed text-muted sm:text-base">
            Whether you’re a follower who wants hands-off returns or a trader who wants a following, BelieveMeGuys has a mode
            for you.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
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
        <Reveal className="relative flex flex-col items-center gap-4 overflow-hidden rounded-[1.75rem] px-6 py-12 text-center sm:gap-5 sm:rounded-3xl sm:p-14">
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
          <h2 className="relative text-[2rem] leading-[1.02] text-white sm:text-3xl sm:leading-tight md:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Ready to trade on autopilot?
          </h2>
          <p className="relative max-w-md text-[15px] text-white/70 sm:text-base">
            Connect an account and start mirroring a leader in two minutes.
          </p>
          <div className="relative mt-2 w-full sm:hidden">
            <LinkButton href={primaryHref} arrow className="w-full py-2.5 text-base">
              {user ? 'Browse leaders' : 'Create your account'}
            </LinkButton>
          </div>
          <div className="relative mt-1 hidden sm:block">
            <LinkButton href={primaryHref} arrow variant="ghost" className="text-base">
              {user ? 'Browse leaders' : 'Create your account'}
            </LinkButton>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
