import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from './icons';

// Full-bleed auth split (Neon-style): the coin hero fills one entire half of the
// viewport edge-to-edge; the form sits on the other half. Fixed over everything
// (incl. the nav) so it's a true full-screen experience. The hero image and its
// caption are overridable so each auth page (login, register, verify) can set its
// own art while sharing the layout.
export function AuthShell({
  children,
  image = '/media/auth-hero.webp',
  title = (
    <>
      Your capital,
      <br />
      on autopilot.
    </>
  ),
  subtitle = 'Copy verified leaders, keep custody of your funds, and pause anytime.',
}: {
  children: ReactNode;
  image?: string;
  title?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 bg-bg lg:grid-cols-2">
      {/* Image half — full bleed, full height */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{
          background:
            'radial-gradient(1000px 700px at 70% 20%, rgba(0,176,255,0.20), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #08203f 55%, #050b17 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        {/* bottom scrim so the caption stays readable over any hero art */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: 'linear-gradient(to top, rgba(5,11,23,0.95) 0%, rgba(5,11,23,0.6) 40%, transparent 100%)' }}
        />
        <div className="absolute bottom-0 left-0 z-10 p-12">
          <div className="text-4xl font-medium leading-tight text-fg" style={{ letterSpacing: '-0.035em' }}>
            {title}
          </div>
          <p className="mt-3 max-w-sm text-base text-muted">{subtitle}</p>
        </div>
      </div>

      {/* Form half — a scroll container with the form vertically centered via
          auto margins (not flex centering, which clips the top when the form is
          taller than the viewport on phones). */}
      <div
        className="relative flex flex-col overflow-y-auto px-6 pb-10 pt-6 sm:px-10"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          background:
            'radial-gradient(520px 260px at 50% -10%, rgba(0,176,255,0.14), transparent 65%), #050b17',
        }}
      >
        <Link href="/" className="flex w-fit items-center gap-2 text-fg">
          <BrandMark className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">
            BelieveMe<span className="text-brand">Guys</span>
          </span>
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10">{children}</div>
      </div>
    </div>
  );
}
