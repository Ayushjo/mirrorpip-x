import type { ReactNode } from 'react';

// Split auth layout: form on the left, the brushed-coin hero on the right.
// Drop the generated image at apps/web/public/media/auth-hero.png.
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-[calc(100vh-9rem)] items-center gap-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">{children}</div>

      <div
        className="relative hidden overflow-hidden rounded-3xl border border-border lg:block"
        style={{
          minHeight: 660,
          background: 'linear-gradient(160deg, #ecebf4 0%, #f2f0f8 50%, #f5f5f5 100%)',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/media/auth-hero.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute bottom-0 left-0 p-10">
          <div className="text-3xl font-medium leading-tight text-black" style={{ letterSpacing: '-0.03em' }}>
            Your capital,
            <br />
            on autopilot.
          </div>
          <p className="mt-2 max-w-xs text-sm text-black/60">
            Copy verified leaders, keep custody of your funds, and pause anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
