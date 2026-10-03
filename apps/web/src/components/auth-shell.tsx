import type { ReactNode } from 'react';
import Link from 'next/link';
import { BrandMark } from './icons';
import { AuthShowcase } from './landing/auth-showcase';

// Full-bleed auth split: the live-phone showcase fills one half of the viewport
// (lg+), the form sits on the other. Fixed over everything (incl. the nav) so
// it's a true full-screen experience. The showcase is a night island — it stays
// dark in light mode; the form half follows the theme. Title/subtitle are
// overridable per page (login, register, verify).
export function AuthShell({
  children,
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
  title?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 bg-bg lg:grid-cols-2">
      {/* Showcase half — live phone + orbiting notes (lg+) */}
      <div
        data-theme="dark"
        className="relative hidden overflow-hidden lg:block"
        style={{ background: 'radial-gradient(1000px 700px at 70% 20%, rgba(0,176,255,0.14), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #08203f 55%, #050b17 100%)' }}
      >
        <AuthShowcase title={title} subtitle={subtitle} />
      </div>

      {/* Form half — a scroll container with the form vertically centered via
          auto margins (not flex centering, which clips the top when the form is
          taller than the viewport on phones). */}
      <div
        className="relative flex flex-col overflow-y-auto px-6 pb-10 pt-6 sm:px-10"
        style={{
          paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
          background:
            'radial-gradient(520px 260px at 50% -10%, rgba(0,176,255,0.14), transparent 65%), var(--color-bg)',
        }}
      >
        <Link href="/" className="flex w-fit items-center gap-2 text-fg">
          <BrandMark className="h-7 w-7" />
          <span className="text-lg font-semibold tracking-tight">
            BelieveMe<span className="text-brand-fg">Guys</span>
          </span>
        </Link>
        <div className="mx-auto my-auto w-full max-w-sm py-10">{children}</div>
      </div>
    </div>
  );
}
