'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { cx } from './ui';

const OPTIONS = [
  { value: 'system', label: 'System', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
] as const;

function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

/** Header control: sun/moon button opening System / Light / Dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const Icon = mounted && resolvedTheme === 'light' ? Sun : Moon;
  return (
    <details className={cx('group relative', className)}>
      <summary
        aria-label="Theme"
        className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full border border-border bg-tint/[0.04] text-muted transition-colors hover:bg-tint/10 hover:text-fg [&::-webkit-details-marker]:hidden"
      >
        <Icon className="h-[18px] w-[18px]" />
      </summary>
      <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-border bg-raised p-1.5 elev-float">
        {OPTIONS.map(({ value, label, Icon: I }) => {
          const on = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={(e) => {
                (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
                setTheme(value);
              }}
              className={cx('flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-tint/[0.06]', on ? 'text-fg' : 'text-muted')}
            >
              <I className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {on && <Check className="h-4 w-4 text-brand-fg" />}
            </button>
          );
        })}
      </div>
    </details>
  );
}

/** Inline 3-way segmented control (mobile drawer, profile). */
export function ThemeSegmented({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  return (
    <div role="radiogroup" aria-label="Theme" className={cx('grid grid-cols-3 gap-1 rounded-2xl bg-tint/[0.05] p-1', className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const on = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(value)}
            className={cx(
              'flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-semibold transition-colors',
              on ? 'bg-raised text-fg shadow-sm ring-1 ring-tint/10' : 'text-muted hover:text-fg',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
