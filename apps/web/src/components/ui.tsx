import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

// ─── UI kit — light premium fintech (Halo-style) ────────────────────────────

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('card-surface p-6', className)}>{children}</div>;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

const buttonStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-brand to-accent text-[#050b17] font-semibold shadow-[0_4px_20px_rgba(0,176,255,0.35)] hover:shadow-[0_6px_28px_rgba(0,176,255,0.5)]',
  ghost: 'border border-brand/40 bg-transparent text-brand hover:bg-brand/10',
  danger: 'bg-(--color-down) text-white hover:opacity-90',
  subtle: 'bg-surface-2 text-fg hover:bg-[#163a70]',
};

// The signature CTA: blue gradient pill with a trailing arrow-circle. The circle
// is deep navy with a white arrow so it reads clearly both on the blue gradient
// (primary) and on dark backgrounds (ghost) — a subtle ring keeps it visible.
function ArrowCircle() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-[#050b17] ring-1 ring-white/15">
      <ArrowRight className="h-4 w-4 text-white" strokeWidth={2.25} />
    </span>
  );
}

export function Button({
  variant = 'primary',
  arrow = false,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; arrow?: boolean }) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        arrow ? 'py-2 pl-6 pr-2' : 'px-6 py-2.5',
        'text-sm',
        buttonStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
      {arrow && <ArrowCircle />}
    </button>
  );
}

export function LinkButton({
  href,
  variant = 'primary',
  arrow = false,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  arrow?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-200',
        arrow ? 'py-2 pl-6 pr-2' : 'px-6 py-2.5',
        'text-sm',
        buttonStyles[variant],
        className,
      )}
    >
      {children}
      {arrow && <ArrowCircle />}
    </Link>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'w-full rounded-2xl border border-transparent bg-[#050b17] px-4 py-3 text-sm text-fg placeholder:text-faint outline-none transition focus:border-brand/60',
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
        // appearance-none + a custom chevron so the control matches the rounded
        // inputs instead of showing the platform's native (double-arrow) select UI.
        'w-full appearance-none rounded-2xl border border-transparent bg-[#050b17] bg-no-repeat px-4 py-3 pr-10 text-sm text-fg outline-none transition focus:border-brand/60',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.75rem center',
        backgroundSize: '16px',
      }}
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
  brand: 'bg-brand/15 text-accent',
  up: 'bg-up/15 text-up',
  down: 'bg-down/15 text-down',
  warn: 'bg-warn/15 text-warn',
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
          'mt-0.5 text-lg font-medium tabular-nums',
          tone === 'up' && 'text-up',
          tone === 'down' && 'text-down',
        )}
      >
        {value}
      </div>
    </div>
  );
}

export function EmptyState({ title, body, action, className }: { title: string; body: string; action?: ReactNode; className?: string }) {
  return (
    <div
      className={cx('card-surface relative flex flex-col items-center gap-4 overflow-hidden px-6 py-16 text-center', className)}
      style={{
        background:
          'radial-gradient(600px 260px at 50% -10%, rgba(0,176,255,0.12), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #050b17 60%, #0a1e3a 100%)',
      }}
    >
      <div
        className="h-28 w-28 rounded-full border border-border shadow-sm"
        style={{
          backgroundImage: 'url("/media/halo-object.webp"), radial-gradient(circle at 50% 40%, #102d5b, #0a1e3a)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="mt-1 text-xl font-medium tracking-tight">{title}</div>
      <p className="max-w-sm text-sm leading-relaxed text-muted">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
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

/**
 * Custom checkbox: a real button with role="checkbox" so it renders identically
 * on iOS/Android, has a proper 44px tap target, and never fights native
 * `required` validation. Links inside the label don't toggle it.
 */
export function Checkbox({
  checked,
  onChange,
  children,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className={cx(
        'group flex cursor-pointer select-none items-start gap-3 rounded-xl border px-3.5 py-3 text-left text-xs leading-relaxed transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50',
        checked ? 'border-brand/40 bg-brand/[0.07] text-fg' : 'border-border bg-surface/60 text-muted hover:border-white/15',
        className,
      )}
    >
      <span
        className={cx(
          'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-all duration-200',
          checked ? 'border-brand bg-brand text-[#050b17] shadow-[0_2px_10px_rgba(0,176,255,0.45)]' : 'border-white/20 bg-transparent',
        )}
      >
        <Check className={cx('h-3.5 w-3.5 transition-transform', checked ? 'scale-100' : 'scale-0')} strokeWidth={3} />
      </span>
      <span onClick={(e) => (e.target as HTMLElement).closest('a') && e.stopPropagation()}>{children}</span>
    </div>
  );
}

/** Compact in-card empty state: icon disc, title, one line, optional action. */
export function EmptyBlock({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 px-6 py-10 text-center', className)}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-brand">{icon}</span>
      <div className="text-sm font-semibold text-fg">{title}</div>
      {body && <p className="max-w-xs text-xs leading-relaxed text-muted">{body}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
