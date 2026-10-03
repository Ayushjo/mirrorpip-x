'use client';

import type { ReactNode } from 'react';
import { ThemeProvider as NextThemes } from 'next-themes';

/**
 * Sets `data-theme` (light | dark) on <html> before first paint, following the
 * device setting until the user picks one (remembered in localStorage).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemes attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange storageKey="bmg-theme">
      {children}
    </NextThemes>
  );
}
