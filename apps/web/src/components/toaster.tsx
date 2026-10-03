'use client';

import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';

/** App-wide toast host, themed to the brand tokens. Import `toast` from 'sonner' anywhere. */
export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === 'light' ? 'light' : 'dark'}
      position="top-center"
      offset={72}
      mobileOffset={{ top: 76 }}
      duration={3800}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            '!rounded-2xl !border !border-border !bg-raised/95 !text-fg !shadow-[0_18px_44px_rgba(0,0,0,0.5)] light:!elev-pop !backdrop-blur-xl !font-sans',
          title: '!text-sm !font-semibold',
          description: '!text-xs !text-muted',
          success: '[&_[data-icon]]:!text-up-fg',
          error: '[&_[data-icon]]:!text-down-fg',
          info: '[&_[data-icon]]:!text-brand-fg',
          warning: '[&_[data-icon]]:!text-warn-fg',
          closeButton: '!border-border !bg-surface-2 !text-muted hover:!text-fg',
          actionButton: '!rounded-full !bg-brand !text-on-brand !font-semibold',
        },
      }}
    />
  );
}
