import Link from 'next/link';
import { getSessionUser } from '@/lib/session';
import { LinkButton } from '@/components/ui';
import { Rise, Light, TextLink, Bars, H2 } from '@/components/landing/motion';
import { Phone } from '@/components/landing/phone';
import { ArrowRight, Plus } from 'lucide-react';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';

const CHIPS = ['🔐 Trade-only keys', '🚫 No withdrawal access', '⏸️ Pause anytime', '🏅 Verified leaders', '⚡ <1s mirroring', '🇮🇳 Delta India'];

const VENUES = [
  { name: 'Delta India', sub: 'Live · USDT & INR', live: true },
  { name: 'USDT', sub: 'Settlement', live: true },
  { name: 'INR', sub: 'Local currency', live: true },
  { name: 'Binance', sub: 'Coming soon', live: false },
  { name: 'Bybit', sub: 'Coming soon', live: false },
  { name: 'CoinSwitch', sub: 'Coming soon', live: false },
];

function Card({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return <div className={`ocard relative overflow-hidden ${hover ? 'ocard-hover' : ''} ${className}`}>{children}</div>;
}

function CardTitle({ a, b, center = true }: { a: string; b?: string; center?: boolean }) {
  return (
    <h3 className={`text-[1.4rem] leading-[1.15] sm:text-[1.65rem] ${center ? 'text-center' : ''}`} style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>
      <span className="text-fg">{a}</span>
      {b && <span className="text-muted"> {b}</span>}
    </h3>
  );
}

export default async function LandingPage() {
  const user = await getSessionUser();
  const primaryHref = user ? '/leaders' : '/register';

  return (
    <div className="-mx-6 -mt-10 overflow-x-clip pb-4 sm:-mt-10">
      {/* ── 1. Hero ─────────────────────────────────────────────────── */}
      <section className="relative min-h-[92svh] overflow-hidden">
        <Bars className="opacity-90" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-bg to-transparent" />
        <div className="relative mx-auto flex min-h-[92svh] max-w-6xl flex-col items-center justify-end px-6 pb-8 text-center sm:pb-12">
          {/* object */}
          <div className="relative mb-[-4rem] h-[46vh] w-full max-w-3xl sm:mb-[-6rem] sm:h-[56vh]">
            <Light className="!top-[60%]" />
            <video
              className="absolute inset-0 h-full w-full object-cover"
              style={{ WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 45%, #000 45%, transparent 75%)', maskImage: 'radial-gradient(ellipse 60% 70% at 50% 45%, #000 45%, transparent 75%)' }}
              src={HERO_VIDEO}
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
          <Rise>
            <h1 className="relative text-[2.75rem] leading-[1] text-fg sm:text-[3.5rem] lg:text-[4.25rem]" style={{ letterSpacing: '-0.035em', fontWeight: 600 }}>
              Your capital,
              <br />
              on autopilot
            </h1>
          </Rise>
          <Rise delay={0.08} className="mt-7 flex flex-col items-center gap-4">
            <LinkButton href={primaryHref} className="px-7 py-3 text-base">
              {user ? 'Browse leaders' : 'Start copying for $0'}
            </LinkButton>
            <TextLink href="/leaders">See the leaderboard</TextLink>
          </Rise>
          <Rise delay={0.16} className="mt-10 w-full">
            <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 sm:mx-0 sm:flex-wrap sm:justify-center sm:px-0">
              {CHIPS.map((c) => (
                <span key={c} className="shrink-0 rounded-xl bg-white/[0.06] px-3.5 py-2 text-[13px] font-medium text-fg backdrop-blur">
                  {c}
                </span>
              ))}
            </div>
          </Rise>
        </div>
      </section>

      {/* ── 2. Spotlight number ─────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-20 text-center sm:pt-28">
        <div className="relative mx-auto flex h-[38vh] min-h-[240px] items-end justify-center sm:h-[48vh]">
          <Light className="!top-[70%]" color="rgba(0,176,255,1)" />
          <Rise>
            <div className="metal text-[9rem] font-semibold leading-none sm:text-[15rem] lg:text-[18rem]" style={{ letterSpacing: '-0.06em' }}>
              &lt;1s
            </div>
          </Rise>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent" />
        </div>
        <Rise className="mt-6">
          <H2 sub="Every order a leader fills is sized to your account and placed within a second, on rails you already use.">
            Every fill mirrored in under a second,
            <br className="hidden sm:block" /> and that&rsquo;s just the beginning.
          </H2>
          <div className="mt-6 flex items-center justify-center gap-8">
            <TextLink href="/#how">Learn more</TextLink>
            <TextLink href="/leaders">Leaderboard</TextLink>
          </div>
        </Rise>
      </section>

      {/* ── 3. Platform + phone ─────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-28 text-center sm:pt-40">
        <Rise>
          <H2>A modern copy-trading platform</H2>
        </Rise>
        <Rise delay={0.1} className="relative mt-12">
          <Light className="!top-[55%] opacity-70" />
          <Phone />
          <div className="relative -mt-10 mx-auto flex w-fit max-w-[92vw] items-center gap-4 rounded-[1.75rem] bg-gradient-to-r from-brand to-accent p-3 pr-6 text-left text-[#050b17] shadow-[0_20px_60px_rgba(0,176,255,0.35)] sm:-mt-12">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#050b17]/10 text-2xl">📈</div>
            <div>
              <div className="text-lg font-semibold leading-tight" style={{ letterSpacing: '-0.02em' }}>
                Your leaders, your account
              </div>
              <Link href="/leaders" className="mt-0.5 inline-flex items-center text-sm font-semibold">
                Browse leaders <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </Rise>
      </section>

      {/* ── 4. Statement ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-32 text-center sm:py-44">
        <Rise>
          <p className="text-[2.6rem] leading-[1.02] text-fg sm:text-[4rem] lg:text-[5.25rem]" style={{ letterSpacing: '-0.04em', fontWeight: 600 }}>
            Discover the perfect blend of <span className="text-brand">custody</span>, <span className="text-brand">speed</span> and{' '}
            <span className="text-brand">control</span>
          </p>
        </Rise>
      </section>

      {/* ── 5. Bento ─────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl px-6">
        <Rise>
          <H2>
            Copy with guardrails
            <br className="hidden sm:block" /> built in
          </H2>
        </Rise>
        <div className="mt-12 grid gap-4 sm:gap-5">
          <Rise>
            <Card className="grid min-h-[420px] items-center gap-8 p-8 sm:grid-cols-2 sm:p-14">
              <div className="relative z-10 text-center sm:text-left">
                <CardTitle a="Verified leaders" b="ranked by real fills" center={false} />
                <div className="mt-6 flex flex-col items-center gap-3 sm:items-start">
                  <LinkButton href="/leaders" className="px-6 py-2.5">
                    Browse leaders
                  </LinkButton>
                  <TextLink href="/leaders">Learn more</TextLink>
                </div>
              </div>
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/leaderboard-hero.webp" alt="" className="absolute -right-24 -top-32 hidden h-[560px] w-[560px] object-cover opacity-70 [mask-image:radial-gradient(circle,#000_40%,transparent_72%)] sm:block" />
                <div className="relative space-y-2">
                  {[
                    { n: 'Leo Live Delta', r: '+18.4%', f: 128 },
                    { n: 'HERO', r: '+11.2%', f: 74 },
                    { n: 'Leo Trader', r: '+6.9%', f: 41 },
                  ].map((l, i) => (
                    <div key={l.n} className="flex items-center justify-between rounded-2xl bg-[#050b17]/70 px-4 py-3 backdrop-blur">
                      <div className="flex items-center gap-3">
                        <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-[#050b17]">{i + 1}</span>
                        <span className="text-sm font-medium text-fg">{l.n}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted">{l.f} followers</span>
                        <span className="font-semibold text-up">{l.r}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Rise>

          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Rise>
              <Card className="min-h-[440px] p-8 sm:p-10">
                <CardTitle a="Trade-only keys" b="so funds never leave your account" />
                <div className="mt-3 text-center"><TextLink href="/connect">Learn more</TextLink></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/custody.webp" alt="" className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%] w-full object-cover object-top [mask-image:linear-gradient(to_top,#000_60%,transparent)]" />
              </Card>
            </Rise>
            <Rise delay={0.08}>
              <Card className="min-h-[440px] p-8 sm:p-10">
                <CardTitle a="Risk limits" b="you set, the engine honours" />
                <div className="mt-3 text-center"><TextLink href="/leaders">Learn more</TextLink></div>
                <div className="absolute inset-x-8 bottom-10 grid grid-cols-3 gap-3 sm:inset-x-14">
                  {[['Amount', '$10'], ['Multiplier', '1x'], ['Daily cap', '$50']].map(([k, v]) => (
                    <div key={k} className="rounded-2xl bg-[#050b17] p-4 text-center">
                      <div className="text-[11px] text-muted">{k}</div>
                      <div className="mt-1 text-lg font-semibold text-fg">{v}</div>
                    </div>
                  ))}
                </div>
              </Card>
            </Rise>
            <Rise>
              <Card className="min-h-[440px] p-8 sm:p-10">
                <CardTitle a="Pause or stop" b="on your terms, any time" />
                <div className="absolute inset-x-6 bottom-10 sm:inset-x-12">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#050b17] px-4 py-3.5">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-[#050b17]">⏸</span>
                    <div className="flex-1 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-fg">Copying paused</span>
                        <span className="text-xs text-muted">9:41 AM</span>
                      </div>
                      <div className="text-xs text-muted">Resume whenever you&rsquo;re ready</div>
                    </div>
                  </div>
                </div>
              </Card>
            </Rise>
            <Rise delay={0.08}>
              <Card className="min-h-[440px] p-8 sm:p-10">
                <CardTitle a="Negative balance protection" b="so you only risk your copy amount" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/halo-object.webp" alt="" className="pointer-events-none absolute left-1/2 top-[52%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_30px_60px_rgba(0,176,255,0.35)]" />
              </Card>
            </Rise>
          </div>
        </div>
      </section>

      {/* ── 6. Explainer ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-24 sm:pt-32">
        <Rise>
          <Card hover={false} className="grid items-center gap-10 p-8 sm:grid-cols-2 sm:p-14">
            <div className="relative h-72">
              <svg viewBox="0 0 420 220" className="absolute inset-0 h-full w-full" fill="none">
                <path d="M0 140 C 40 100, 60 180, 100 120 S 160 40, 200 110 S 260 200, 300 130 S 360 60, 420 90" stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="300" y1="0" x2="300" y2="220" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 6" />
                <line x1="0" y1="130" x2="420" y2="130" stroke="rgba(255,255,255,0.2)" />
                <circle cx="300" cy="130" r="4" fill="#fff" />
              </svg>
              <div className="absolute left-[38%] top-[8%] flex items-center gap-2 rounded-full bg-up px-3 py-1.5 text-sm font-semibold text-[#050b17] shadow-[0_10px_30px_rgba(16,185,129,0.4)]">
                $10.00 <span className="grid h-6 w-6 place-items-center rounded-full bg-[#050b17] text-white">↗</span>
              </div>
              <div className="absolute right-0 top-[54%] rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#050b17]">81,332.5</div>
              <div className="absolute bottom-0 left-[20%] flex gap-2">
                {[['Amount', '$10'], ['Multiplier', '1x']].map(([k, v]) => (
                  <div key={k} className="rounded-2xl bg-[#050b17] px-5 py-3 text-center">
                    <div className="text-[11px] text-muted">{k}</div>
                    <div className="text-base font-semibold text-fg">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-[1.75rem] leading-tight text-fg sm:text-[2.1rem]" style={{ letterSpacing: '-0.025em', fontWeight: 600 }}>
                You choose
                <br />
                the <span className="text-brand">sizing and risk limits</span>
                <br />
                of every copy
              </h3>
              <p className="mt-4 text-[15px] text-muted sm:text-base">
                Fixed, proportional or multiplied. Start from as little as $10 with a daily loss cap you set.
              </p>
            </div>
          </Card>
        </Rise>
      </section>

      {/* ── 7. Trust ─────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pt-32 text-center sm:pt-44">
        <Rise>
          <H2>
            Built on Delta Exchange India,
            <br className="hidden sm:block" /> encrypted end to end
          </H2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {['AES-256-GCM at rest', 'Withdrawal disabled', 'Admin kill-switch', 'Verified leaders only', 'Real-time engine'].map((b) => (
              <span key={b} className="rounded-full border border-white/10 px-4 py-2 text-[13px] font-medium text-muted">{b}</span>
            ))}
          </div>
          <div className="mt-6"><TextLink href="/privacy">Learn more</TextLink></div>
        </Rise>
        <Rise delay={0.1} className="relative mt-4 h-[380px] sm:h-[520px]">
          <Light className="!top-[65%]" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/halo-object.webp" alt="" className="absolute left-1/2 top-1/2 h-[90%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_60px_120px_rgba(0,176,255,0.35)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent" />
        </Rise>
      </section>

      {/* ── 8. On your way ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-28 sm:pt-36">
        <Rise>
          <H2>
            On your way
            <br /> to confident copying
          </H2>
        </Rise>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
          {[
            { a: 'Connect', b: 'in two minutes', img: '/media/variant-a.webp', href: '/connect', cta: 'Connect account' },
            { a: 'Pick a leader', b: 'you can actually verify', img: '/media/variant-b.webp', href: '/leaders', cta: 'See leaders' },
            { a: 'Mirror', b: 'on autopilot, 24/7', img: '/media/variant-c.webp', href: primaryHref, cta: 'Start copying' },
            { a: 'Track everything', b: 'live, in one dashboard', img: '/media/dashboard-banner.webp', href: '/dashboard', cta: 'Open dashboard' },
          ].map((c, i) => (
            <Rise key={c.a} delay={(i % 2) * 0.08}>
              <Card className="min-h-[460px] p-8 sm:p-10">
                <CardTitle a={c.a} b={c.b} />
                <div className="mt-3 text-center"><TextLink href={c.href}>{c.cta}</TextLink></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt="" className="pointer-events-none absolute inset-x-0 bottom-0 h-[64%] w-full object-cover [mask-image:linear-gradient(to_top,#000_55%,transparent)]" />
              </Card>
            </Rise>
          ))}
        </div>
      </section>

      {/* ── 9. Venues fan ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl overflow-hidden px-6 pt-32 text-center sm:pt-44">
        <Rise>
          <H2>
            <span className="text-brand">Works with</span>
            <br /> the venues you already use
          </H2>
          <div className="mt-4"><TextLink href="/connect">Connect an account</TextLink></div>
        </Rise>
        <Rise delay={0.1} className="fan mt-14 flex justify-center gap-[-1rem] sm:mt-20">
          <div className="flex -space-x-12 sm:-space-x-8">
            {VENUES.map((v, i) => (
              <div
                key={v.name}
                className="fan-card ocard grid h-56 w-40 shrink-0 place-items-center !rounded-[1.75rem] border border-white/5 sm:h-64 sm:w-48"
                style={{ zIndex: VENUES.length - i }}
              >
                <div className="text-center">
                  <div className={`text-lg font-semibold ${v.live ? 'text-fg' : 'text-muted'}`}>{v.name}</div>
                  <div className={`mt-1 text-[11px] ${v.live ? 'text-up' : 'text-faint'}`}>{v.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Rise>
      </section>

      {/* ── 10. Smooth experience ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-32 sm:pt-44">
        <Rise>
          <H2>Smooth copying experience</H2>
        </Rise>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Rise>
            <Card className="min-h-[420px] p-8 sm:p-10">
              <CardTitle a="Start from $10" b="per copy" />
              <div className="absolute left-1/2 top-[58%] -translate-x-1/2 -translate-y-1/2">
                <div className="metal text-[7rem] font-semibold leading-none sm:text-[9rem]" style={{ letterSpacing: '-0.06em' }}>$10</div>
              </div>
            </Card>
          </Rise>
          <Rise delay={0.08}>
            <Card className="min-h-[420px] p-8 sm:p-10">
              <CardTitle a="24/7 engine" b="that never sleeps" />
              <div className="absolute inset-x-8 bottom-10 space-y-2 sm:inset-x-12">
                {['BTCUSD · Buy · 0.6s', 'ETHUSD · Sell · 0.8s', 'SOLUSD · Buy · 0.5s'].map((t, i) => (
                  <div key={t} className="flex items-center justify-between rounded-2xl bg-[#050b17] px-4 py-3 text-sm" style={{ opacity: 1 - i * 0.28 }}>
                    <span className="text-fg">{t}</span>
                    <span className="rounded-full bg-up/15 px-2 py-0.5 text-xs font-semibold text-up">Filled</span>
                  </div>
                ))}
              </div>
            </Card>
          </Rise>
          <Rise>
            <Card className="min-h-[420px] p-8 sm:p-10">
              <CardTitle a="Sized to your account" b="proportionally, every time" />
              <div className="absolute inset-x-10 bottom-12 flex items-end justify-center gap-3 sm:inset-x-16">
                {[100, 25, 60, 40, 80].map((h, i) => (
                  <div key={i} className="w-12 rounded-t-2xl bg-gradient-to-t from-brand/40 to-brand" style={{ height: `${h * 1.6}px` }} />
                ))}
              </div>
            </Card>
          </Rise>
          <Rise delay={0.08}>
            <Card className="min-h-[420px] p-8 sm:p-10">
              <CardTitle a="Help when you need it" b="from real humans" />
              <div className="absolute inset-x-8 bottom-10 sm:inset-x-12">
                <div className="mr-auto w-fit rounded-3xl rounded-bl-md bg-[#050b17] px-4 py-3 text-sm text-fg">How do I set a daily loss cap?</div>
                <div className="ml-auto mt-2 w-fit rounded-3xl rounded-br-md bg-brand px-4 py-3 text-sm font-medium text-[#050b17]">Open the copy, tap Risk, set the cap. Done!</div>
              </div>
            </Card>
          </Rise>
        </div>
      </section>

      {/* ── 11. Community globe ───────────────────────────────────────── */}
      <section className="relative mt-32 sm:mt-44">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/world-map.webp" alt="" className="pointer-events-none absolute inset-x-0 top-0 h-full w-full object-cover opacity-40 [mask-image:radial-gradient(ellipse_60%_70%_at_50%_50%,#000_30%,transparent_75%)]" />
        <div className="relative mx-auto max-w-6xl px-6 py-32 text-center sm:py-44">
          <Rise>
            <H2>
              Traders copying
              <br /> from 40+ countries
            </H2>
            <div className="mt-8 flex items-center justify-center">
              {['A', 'R', 'K', 'S', 'M', 'J'].map((l, i) => (
                <span key={l} className="-ml-3 grid h-16 w-16 place-items-center rounded-full border-4 border-bg bg-gradient-to-br from-[#163a70] to-[#0a1e3a] text-lg font-semibold text-fg first:ml-0 sm:h-20 sm:w-20" style={{ zIndex: i }}>
                  {l}
                </span>
              ))}
              <span className="-ml-3 grid h-16 w-16 place-items-center rounded-full border-4 border-bg bg-brand text-[#050b17] sm:h-20 sm:w-20" style={{ zIndex: 10 }}>
                <Plus className="h-8 w-8" strokeWidth={2.5} />
              </span>
            </div>
            <div className="mt-6"><TextLink href="/register">Join the community</TextLink></div>
          </Rise>
        </div>
      </section>

      {/* ── 12. Testimonial + milestones ─────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-8 sm:pt-16">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
          <Rise>
            <Card hover={false} className="flex min-h-[460px] flex-col items-center justify-between p-10 text-center">
              <div>
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-lg font-semibold text-fg">F</span>
                <div className="mt-2 text-sm text-muted">Fay, follower since 2026</div>
              </div>
              <div>
                <div className="text-2xl text-fg" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>My stats</div>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
                  I follow two leaders with a fixed $50 per copy. The engine mirrors them faster than I could tap, and my keys never left my exchange.
                </p>
              </div>
              <div className="flex gap-1.5">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 rounded-full ${i === 0 ? 'w-8 bg-fg' : 'w-1.5 bg-white/20'}`} />)}</div>
            </Card>
          </Rise>
          <Rise delay={0.08}>
            <Card hover={false} className="relative min-h-[460px] p-10 text-center">
              <div className="text-2xl text-fg" style={{ letterSpacing: '-0.02em', fontWeight: 600 }}>Milestones</div>
              <div className="relative mx-auto mt-6 h-56">
                <Light className="!top-[70%] opacity-80" />
                <div className="metal text-[9rem] font-semibold leading-none sm:text-[11rem]" style={{ letterSpacing: '-0.06em' }}>26</div>
              </div>
              <div className="mt-2 flex items-start justify-center gap-6 text-xs">
                {[['2025', 'Engine live on Delta'], ['2026', 'Verified leaderboard'], ['Next', 'More venues']].map(([y, t], i) => (
                  <div key={y} className={i === 1 ? 'text-fg' : 'text-faint'}>
                    <span className={`rounded-full px-3 py-1 font-semibold ${i === 1 ? 'bg-white text-[#050b17]' : 'bg-white/10'}`}>{y}</span>
                    <div className="mt-2 max-w-[8rem]">{t}</div>
                  </div>
                ))}
              </div>
            </Card>
          </Rise>
        </div>
      </section>

      {/* ── 13. CTA band ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pt-5">
        <Rise>
          <Link
            href={primaryHref}
            className="ocard-hover group flex min-h-[160px] items-center justify-center rounded-[2rem] bg-gradient-to-r from-[#0a4f8f] via-brand to-accent px-6 text-center sm:min-h-[200px] sm:rounded-[3rem]"
          >
            <span className="text-[2rem] leading-none text-[#050b17] sm:text-[3rem]" style={{ letterSpacing: '-0.03em', fontWeight: 600 }}>
              Start copying confidently
            </span>
          </Link>
        </Rise>
      </section>
    </div>
  );
}
