import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

// ─── UI kit — light premium fintech (Halo-style) ────────────────────────────

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-2xl border border-border bg-surface p-6', className)}>{children}</div>;
}

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'subtle';

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-black text-white hover:bg-gray-800',
  ghost: 'border border-black/15 bg-white text-black hover:bg-[#ececec]',
  danger: 'bg-[--color-down] text-white hover:opacity-90',
  subtle: 'bg-[#ececec] text-black hover:bg-[#e2e2e2]',
};

// The signature Halo CTA: black pill with a trailing white arrow-circle.
function ArrowCircle() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-full bg-white">
      <ArrowRight className="h-4 w-4 text-black" strokeWidth={2} />
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
        'w-full rounded-xl border border-black/12 bg-white px-4 py-2.5 text-sm text-black placeholder:text-faint outline-none transition focus:border-black',
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
        'w-full rounded-xl border border-black/12 bg-white px-4 py-2.5 text-sm text-black outline-none transition focus:border-black',
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
  neutral: 'bg-[#ececec] text-muted',
  brand: 'bg-[#ecebf2] text-ink',
  up: 'bg-[#e7f3ec] text-up',
  down: 'bg-[#fbe9eb] text-down',
  warn: 'bg-[#fbf1e3] text-warn',
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

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="flex flex-col items-center gap-3 py-14 text-center">
      <div
        className="mb-1 h-20 w-20 rounded-full border border-border"
        style={{
          backgroundImage: 'url("/media/halo-object.png"), radial-gradient(circle at 50% 42%, #e7e3f3, #f5f5f5)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div className="text-base font-medium">{title}</div>
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
