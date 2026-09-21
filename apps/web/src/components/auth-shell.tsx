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
        <div className="absolute bottom-0 left-0 p-12">
          <div className="text-4xl font-medium leading-tight text-fg" style={{ letterSpacing: '-0.035em' }}>
            {title}
          </div>
          <p className="mt-3 max-w-sm text-base text-muted">{subtitle}</p>
        </div>
      </div>

      {/* Form half */}
      <div className="relative flex items-center justify-center overflow-y-auto px-6 py-16">
        <Link href="/" className="absolute left-6 top-6 flex items-center gap-2 text-fg">
          <BrandMark className="h-7 w-7" />
          <span className="text-lg font-medium tracking-tight">BelieveMeGuys</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
