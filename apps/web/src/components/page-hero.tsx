import type { ReactNode } from 'react';
import { cx } from './ui';
import { Light, Words } from './landing/motion';

export type HeroStat = { v: ReactNode; l: string };

/**
 * Page-top hero in the landing's voice: centered, big, tight headline over a
 * breathing light, muted lede, optional action, and stats as quiet pills.
 * `image` (optional) floats a masked object above the headline.
 */
export function PageHero({
  image,
  eyebrow,
  title,
  lede,
  stats,
  action,
  back,
  above,
  className,
  compact = false,
}: {
  image?: string;
  position?: string;
  eyebrow?: string;
  title: ReactNode;
  lede?: ReactNode;
  stats?: HeroStat[];
  action?: ReactNode;
  back?: ReactNode;
  above?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <section className={cx('relative -mx-6 -mt-10 overflow-hidden px-6 text-center', compact ? 'pb-6 pt-12 sm:pt-16' : 'pb-8 pt-14 sm:pb-12 sm:pt-20', className)}>
      <Light className={cx('!top-[28%] opacity-[0.28]', compact && 'opacity-20')} />
      <div className="relative mx-auto max-w-4xl">
        {back && <div className="mb-6 flex justify-center">{back}</div>}
        {image && (
          <div className="relative mx-auto mb-[-2.5rem] h-40 w-full max-w-md sm:mb-[-3.5rem] sm:h-56">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt=""
              className="hero-float absolute left-1/2 top-1/2 h-[130%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 object-contain [mask-image:radial-gradient(ellipse_44%_46%_at_50%_50%,#000_45%,transparent_76%)]"
            />
          </div>
        )}
        {above && <div className="mb-5 flex justify-center">{above}</div>}
        {eyebrow && (
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand sm:text-xs">{eyebrow}</div>
        )}
        <h1
          className={cx('mx-auto text-fg', compact ? 'text-[2.2rem] sm:text-[2.75rem]' : 'text-[2.6rem] sm:text-[3.25rem] lg:text-[3.75rem]')}
          style={{ letterSpacing: '-0.035em', lineHeight: 1.02, fontWeight: 600 }}
        >
          {typeof title === 'string' ? <Words text={title} stagger={0.05} /> : title}
        </h1>
        {lede && <div className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted sm:text-base">{lede}</div>}
        {action && <div className="mt-7 flex justify-center">{action}</div>}
        {stats && stats.length > 0 && (
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {stats.map(({ v, l }) => (
              <span key={l} className="inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-3.5 py-2 text-[13px] text-muted backdrop-blur">
                <span className="font-semibold text-fg">{v}</span> {l}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
