import Link from 'next/link';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

// ─── Small, dependency-free UI kit shared across the app ────────────────────

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_0_0_rgba(255,255,255,0.03)_inset]',
        className,
      )}
    >
      {children}
    </div>
  );
}

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-black font-semibold hover:bg-brand-strong',
  ghost: 'border border-border text-fg hover:bg-surface-2',
  danger: 'bg-down text-white font-semibold hover:opacity-90',
  subtle: 'bg-surface-2 text-fg hover:brightness-125',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50',
        buttonStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  variant = 'primary',
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition',
        buttonStyles[variant],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg placeholder:text-faint outline-none focus:border-brand',
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      className={cx(
        'w-full rounded-xl border border-border bg-bg px-3.5 py-2.5 text-sm text-fg outline-none focus:border-brand',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium text-muted">{children}</label>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

type Tone = 'neutral' | 'brand' | 'up' | 'down' | 'warn';
const badgeTone: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted',
  brand: 'bg-brand-soft text-brand',
  up: 'bg-[rgba(34,197,94,0.12)] text-up',
  down: 'bg-[rgba(244,63,94,0.12)] text-down',
  warn: 'bg-[rgba(245,158,11,0.12)] text-warn',
};

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', badgeTone[tone])}>
      {children}
    </span>
  );
}

export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'up' | 'down' }) {
  return (
    <div>
      <div className="text-xs text-muted">{label}</div>
      <div
        className={cx(
          'mt-0.5 text-lg font-semibold tabular-nums',
          tone === 'up' && 'text-up',
          tone === 'down' && 'text-down',
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <div className="text-base font-semibold">{title}</div>
      <p className="max-w-sm text-sm text-muted">{body}</p>
      {action}
    </Card>
  );
}

// Formatting helpers.
export function fmtUsd(n: number | null | undefined, digits = 2): string {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const s = abs.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return `${n < 0 ? '-' : ''}$${s}`;
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;
}

export function fmtNum(n: number | null | undefined, digits = 4): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { maximumFractionDigits: digits });
}
