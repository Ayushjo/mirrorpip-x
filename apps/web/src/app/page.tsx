import { getSessionUser } from '@/lib/session';
import { LinkButton } from '@/components/ui';
import { Marquee } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

const HERO_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4';
const CARD_IMG =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85';
const USECASE_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4';

const EXCHANGES: Array<[string, React.CSSProperties]> = [
  ['Delta Exchange', { fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '-0.02em', fontSize: 16 }],
  ['BYBIT', { fontFamily: 'Arial, sans-serif', fontWeight: 900, letterSpacing: '0.08em', fontSize: 14, textTransform: 'uppercase' }],
  ['Binance', { fontFamily: '"Trebuchet MS", sans-serif', fontWeight: 600, letterSpacing: '0.01em', fontSize: 16, fontStyle: 'italic' }],
  ['COINDCX', { fontFamily: '"Courier New", monospace', fontWeight: 700, letterSpacing: '0.12em', fontSize: 13, textTransform: 'uppercase' }],
  ['TradingView', { fontFamily: 'Palatino, "Book Antiqua", serif', fontWeight: 400, letterSpacing: '-0.01em', fontSize: 17 }],
  ['MetaTrader', { fontFamily: 'Impact, "Arial Narrow", sans-serif', fontWeight: 400, letterSpacing: '0.04em', fontSize: 15 }],
  ['CoinSwitch', { fontFamily: 'Verdana, sans-serif', fontWeight: 700, letterSpacing: '-0.03em', fontSize: 14 }],
];

function MarqueeRow({ items }: { items: Array<[string, React.CSSProperties]> }) {
  return (
    <Marquee className="w-full">
      {items.map(([name, style], i) => (
        <span key={i} className="mx-8 shrink-0 whitespace-nowrap text-black/55" style={style}>
          {name}
        </span>
      ))}
    </Marquee>
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
          {/* readability scrim so the black hero text stays legible */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(245,245,245,0.9) 0%, rgba(245,245,245,0.55) 42%, rgba(245,245,245,0.05) 72%)',
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

            <div className="mt-auto w-full max-w-lg pt-16">
              <div className="mb-2 text-xs text-black/40">Works with your exchange</div>
              <MarqueeRow items={EXCHANGES} />
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
          {/* wide image card */}
          <div
            className="relative flex min-h-80 flex-col justify-between overflow-hidden rounded-2xl border border-border p-7 sm:col-span-2 lg:col-span-2"
            style={{ backgroundImage: `url("${CARD_IMG}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.55))' }}
            />
            <div className="relative text-2xl font-medium leading-snug text-black" style={{ letterSpacing: '-0.02em' }}>
              Returns that mirror the best.
            </div>
            <p className="relative max-w-xs text-base text-black/70">
              Every fill a leader makes is sized to your account and placed within a second — you hold the exact same
              positions, proportionally.
            </p>
          </div>
          {/* ink cards */}
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

      {/* ── Backed by / trusted ──────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-4">
          <p className="text-base leading-relaxed text-black/70">
            Built on the rails traders
            <br />
            already trust.
          </p>
          <div className="md:col-span-3">
            <MarqueeRow items={EXCHANGES} />
          </div>
        </div>
      </section>

      {/* ── Use cases ────────────────────────────────────────────────── */}
      <section>
        <div className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          <div className="md:pr-12 md:pt-2">
            <div className="mb-2 text-sm text-black/60">MirrorPip in practice</div>
            <h2 className="mb-6 text-5xl leading-none text-black sm:text-6xl" style={{ letterSpacing: '-0.04em' }}>
              Use modes
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-black/60">
              Whether you’re a follower who wants hands-off returns or a trader who wants a following, MirrorPip has a
              mode for you.
            </p>
          </div>
          <div className="relative min-h-[560px] overflow-hidden rounded-3xl border border-border">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={USECASE_VIDEO}
              autoPlay
              muted
              loop
              playsInline
            />
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, rgba(245,245,245,0.82) 0%, rgba(245,245,245,0.35) 40%, transparent 75%)' }}
            />
            <div className="relative z-10 p-10 sm:p-12">
              <h3 className="mb-5 text-4xl leading-tight text-black sm:text-5xl" style={{ letterSpacing: '-0.03em' }}>
                Follow
              </h3>
              <p className="mb-8 max-w-md text-base text-black/70">
                Pick a verified leader, set your sizing and risk limits, and let the engine mirror their every move into
                your account — pause or stop whenever you want.
              </p>
              <a href={primaryHref} className="group inline-flex items-center gap-3 text-base font-medium text-black">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-white/80 backdrop-blur transition-colors group-hover:bg-white">
                  <ArrowRight className="h-4 w-4 text-black" />
                </span>
                Get started
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section>
        <div
          className="flex flex-col items-center gap-5 rounded-3xl p-14 text-center"
          style={{ background: 'url("/media/cta-band.png") center/cover no-repeat, #2B2644' }}
        >
          <h2 className="text-3xl text-white sm:text-4xl" style={{ letterSpacing: '-0.03em' }}>
            Ready to trade on autopilot?
          </h2>
          <p className="max-w-md text-base text-white/60">Connect an account and start mirroring a leader in two minutes.</p>
          <LinkButton href={primaryHref} arrow variant="ghost" className="mt-1 text-base">
            {user ? 'Browse leaders' : 'Create your account'}
          </LinkButton>
        </div>
      </section>
    </div>
  );
}
