'use client';

import { Toaster as Sonner } from 'sonner';

/** App-wide toast host, themed to the brand tokens. Import `toast` from 'sonner' anywhere. */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={72}
      mobileOffset={{ top: 76 }}
      duration={3800}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            '!rounded-2xl !border !border-white/10 !bg-[#0b2040]/95 !text-fg !shadow-[0_18px_44px_rgba(0,0,0,0.5)] !backdrop-blur-xl !font-sans',
          title: '!text-sm !font-semibold',
          description: '!text-xs !text-muted',
          success: '[&_[data-icon]]:!text-up',
          error: '[&_[data-icon]]:!text-down',
          info: '[&_[data-icon]]:!text-brand',
          warning: '[&_[data-icon]]:!text-warn',
          closeButton: '!border-white/10 !bg-[#102d5b] !text-muted hover:!text-fg',
          actionButton: '!rounded-full !bg-brand !text-[#050b17] !font-semibold',
        },
      }}
    />
  );
}
