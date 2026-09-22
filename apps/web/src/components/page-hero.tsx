import type { ReactNode } from 'react';
import { cx } from './ui';

export type HeroStat = { v: string; l: string };

/**
 * The page-top hero used on Leaderboard, Dashboard, Accounts and Admin.
 * Full-bleed under the header on phones, a framed card from `sm` up. Eyebrow
 * rule + headline + lede, an optional action, and a hairline stat strip.
 */
export function PageHero({
  image,
  position = 'right center',
  eyebrow,
  title,
  lede,
  stats,
  action,
  back,
  className,
}: {
  image: string;
  position?: string;
  eyebrow: string;
  title: ReactNode;
  lede?: ReactNode;
  stats?: HeroStat[];
  action?: ReactNode;
  back?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('-mx-6 -mt-10 sm:mx-0 sm:mt-0', className)}>
      <div
        className="relative overflow-hidden rounded-b-[2rem] border-b border-border sm:rounded-3xl sm:border"
        style={{
          background:
            'radial-gradient(900px 380px at 82% -10%, rgba(0,176,255,0.18), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #08203f 52%, #050b17 100%)',
        }}
      >
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `url("${image}")`, backgroundSize: 'cover', backgroundPosition: position }}
        />
        <div
          className="absolute inset-0 sm:hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(5,11,23,0.6) 0%, rgba(5,11,23,0.8) 45%, rgba(5,11,23,0.96) 100%)',
          }}
        />
        <div
          className="absolute inset-0 hidden sm:block"
          style={{
            background:
              'linear-gradient(90deg, rgba(5,11,23,0.94) 0%, rgba(5,11,23,0.72) 40%, rgba(5,11,23,0.15) 70%), linear-gradient(180deg, transparent 50%, rgba(5,11,23,0.85) 100%)',
          }}
        />

        <div className="relative z-10 flex flex-col px-6 pb-6 pt-14 sm:p-10 sm:pt-10 lg:p-12 lg:pt-10">
          {back && <div className="mb-5">{back}</div>}
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand sm:text-xs">
                <span className="h-px w-6 bg-brand" />
                {eyebrow}
              </div>
              <h1
                className="max-w-2xl text-[2.6rem] leading-[0.96] text-fg sm:text-5xl sm:leading-[1.02] lg:text-6xl"
                style={{ letterSpacing: '-0.04em' }}
              >
                {title}
              </h1>
              {lede && <p className="mt-3 max-w-md text-[15px] leading-relaxed text-fg/70 sm:text-base">{lede}</p>}
            </div>
            {action && <div className="hidden shrink-0 sm:block">{action}</div>}
          </div>
          {action && <div className="mt-6 sm:hidden">{action}</div>}

          {stats && stats.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-y-5 border-t border-white/10 pt-5 sm:mt-10 sm:flex sm:gap-10 sm:border-t-0 sm:pt-0 lg:mt-12">
              {stats.map(({ v, l }) => (
                <div key={l}>
                  <div className="text-2xl font-semibold leading-none text-fg sm:text-3xl" style={{ letterSpacing: '-0.03em' }}>
                    {v}
                  </div>
                  <div className="mt-1.5 text-[11px] text-muted sm:text-xs">{l}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
