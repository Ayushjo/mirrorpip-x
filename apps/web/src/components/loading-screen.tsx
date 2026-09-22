import { BrandMark } from './icons';
import { cx } from './ui';

/**
 * Route-level loading state: a big brand lockup (mark + wordmark) over a
 * breathing light, a slim progress bar, then a skeleton in the page's shape so
 * content settles into place instead of jumping.
 */
export function LoadingScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="animate-in space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading">
      <div
        className={cx(
          'relative -mx-6 -mt-10 flex flex-col items-center justify-center overflow-hidden px-6 text-center sm:mx-0 sm:mt-0 sm:rounded-3xl',
          compact ? 'h-56 sm:h-64' : 'h-72 sm:h-80',
        )}
        style={{ background: 'radial-gradient(60% 70% at 50% 40%, rgba(0,176,255,0.16), transparent 70%), #0a1628' }}
      >
        <div className="pulse-ring absolute h-40 w-40 rounded-full border border-brand/30 sm:h-52 sm:w-52" />
        <div className="relative flex items-center gap-3 sm:gap-4">
          <span className="brand-in grid h-14 w-14 place-items-center rounded-2xl bg-[#050b17]/70 shadow-[0_12px_40px_rgba(0,176,255,0.35)] ring-1 ring-brand/30 backdrop-blur sm:h-[4.5rem] sm:w-[4.5rem]">
            <BrandMark className="h-9 w-9 sm:h-11 sm:w-11" />
          </span>
          <span
            className="brand-in text-[1.9rem] font-semibold leading-none text-fg sm:text-[2.6rem] lg:text-[3rem]"
            style={{ letterSpacing: '-0.035em', animationDelay: '0.12s' }}
          >
            BelieveMe<span className="text-brand">Guys</span>
          </span>
        </div>
        <div className="brand-in mt-6 text-[11px] font-medium uppercase tracking-[0.22em] text-muted" style={{ animationDelay: '0.24s' }}>
          Trade smarter together
        </div>
        <div className="brand-in relative mt-5 h-1 w-40 overflow-hidden rounded-full bg-white/10 sm:w-56" style={{ animationDelay: '0.3s' }}>
          <span className="brand-bar absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-brand to-accent" />
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-56 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-56 rounded-3xl" />
      </div>
    </div>
  );
}
