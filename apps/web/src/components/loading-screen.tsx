import { BrandMark } from './icons';
import { cx } from './ui';

/**
 * Route-level loading state. A pulsing brand mark up top, then a skeleton that
 * roughly matches the page shape (hero + tiles + a content card) so the page
 * settles in place instead of jumping.
 */
export function LoadingScreen({ compact = false }: { compact?: boolean }) {
  return (
    <div className="animate-in space-y-6 sm:space-y-8" aria-busy="true" aria-label="Loading">
      {/* hero */}
      <div className={cx('skeleton relative -mx-6 -mt-10 overflow-hidden rounded-b-[2rem] sm:mx-0 sm:mt-0 sm:rounded-3xl', compact ? 'h-40' : 'h-64 sm:h-72')}>
        <div className="absolute inset-0 grid place-items-center">
          <div className="relative grid place-items-center">
            <span className="pulse-ring absolute h-16 w-16 rounded-full border border-brand/40" />
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#050b17]/70 shadow-[0_8px_30px_rgba(0,176,255,0.25)] ring-1 ring-brand/30 backdrop-blur">
              <BrandMark className="h-8 w-8" />
            </span>
          </div>
        </div>
      </div>

      {/* stat tiles */}
      {!compact && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" style={{ animationDelay: `${i * 90}ms` }} />
          ))}
        </div>
      )}

      {/* content */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="skeleton h-56 rounded-3xl lg:col-span-2" />
        <div className="skeleton h-56 rounded-3xl" />
      </div>
    </div>
  );
}
