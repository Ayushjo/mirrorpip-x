import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoIcon } from './icons';

// Full-bleed auth split (Neon-style): the coin hero fills one entire half of the
// viewport edge-to-edge; the form sits on the other half. Fixed over everything
// (incl. the nav) so it's a true full-screen experience.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid grid-cols-1 bg-[#f5f5f5] lg:grid-cols-2">
      {/* Image half — full bleed, full height */}
      <div
        className="relative hidden overflow-hidden lg:block"
        style={{
          background:
            'radial-gradient(1000px 700px at 70% 20%, rgba(43,38,68,0.16), transparent 60%), linear-gradient(160deg, #ecebf4 0%, #f2f0f8 55%, #e9eef7 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/media/auth-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute bottom-0 left-0 p-12">
          <div className="text-4xl font-medium leading-tight text-black" style={{ letterSpacing: '-0.035em' }}>
            Your capital,
            <br />
            on autopilot.
          </div>
          <p className="mt-3 max-w-sm text-base text-black/60">
            Copy verified leaders, keep custody of your funds, and pause anytime.
          </p>
        </div>
      </div>

      {/* Form half */}
      <div className="relative flex items-center justify-center overflow-y-auto px-6 py-16">
        <Link href="/" className="absolute left-6 top-6 flex items-center gap-2 text-black">
          <LogoIcon className="h-6 w-6" />
          <span className="text-lg font-medium tracking-tight">MirrorPip</span>
        </Link>
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
