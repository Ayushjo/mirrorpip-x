'use client';

import { useMemo, useState, type InputHTMLAttributes } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Eye, EyeOff, Lock } from 'lucide-react';
import { Input, cx } from './ui';

export function passwordStrength(pw: string) {
  const rules = [
    { ok: pw.length >= 8, label: '8+ characters' },
    { ok: /[A-Z]/.test(pw) && /[a-z]/.test(pw), label: 'Upper & lower case' },
    { ok: /[0-9]/.test(pw), label: 'A number' },
  ];
  let score = rules.filter((r) => r.ok).length;
  if (pw.length >= 12) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const bucket = Math.min(4, score);
  const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Very strong'];
  // CSS vars so the meter follows the theme; `color` fills the bar, `textColor` is the contrast-safe label.
  const colors = ['var(--color-down)', 'var(--color-down)', 'var(--color-warn)', 'var(--color-up)', 'var(--color-up)'];
  const textColors = ['var(--color-down-fg)', 'var(--color-down-fg)', 'var(--color-warn-fg)', 'var(--color-up-fg)', 'var(--color-up-fg)'];
  return { rules, score: bucket, label: labels[bucket]!, color: colors[bucket]!, textColor: textColors[bucket]!, valid: rules.every((r) => r.ok) };
}

/** Inline field error with a small shake. */
export function FieldError({ msg }: { msg?: string | null }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {msg && (
        <motion.p key={msg} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0, x: reduce ? 0 : [0, -6, 6, -4, 4, 0] }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="mt-1.5 text-xs text-down-fg" role="alert">
          {msg}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Password input with eye toggle, caps-lock hint and optional strength rules. */
export function PasswordField({
  value,
  onChange,
  showStrength = false,
  error,
  ...rest
}: { value: string; onChange: (v: string) => void; showStrength?: boolean; error?: string | null } & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const strength = useMemo(() => passwordStrength(value), [value]);
  return (
    <div>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={(e) => setCaps(e.getModifierState?.('CapsLock') ?? false)}
          placeholder="••••••••"
          className="pr-12"
          aria-invalid={!!error}
          {...rest}
        />
        <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-faint transition-colors hover:bg-tint/[0.06] hover:text-fg">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <AnimatePresence>
        {caps && (
          <motion.p key="caps" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-1.5 inline-flex items-center gap-1 text-xs text-warn-fg">
            <Lock className="h-3 w-3" /> Caps Lock is on
          </motion.p>
        )}
      </AnimatePresence>
      <FieldError msg={error} />
      {showStrength && value.length > 0 && (
        <div className="mt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-tint/10">
            <motion.div className="h-full rounded-full transition-colors duration-300" style={{ backgroundColor: strength.color }} animate={{ width: `${(strength.score / 4) * 100}%` }} transition={{ type: 'spring', stiffness: 180, damping: 22 }} />
          </div>
          <div className="mt-2 text-xs" style={{ color: strength.textColor }}>{strength.label}</div>
          <ul className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
            {strength.rules.map((r) => (
              <li key={r.label} className={cx('inline-flex items-center gap-1.5 transition-colors', r.ok ? 'text-up-fg' : 'text-faint')}>
                <span className={cx('grid h-4 w-4 place-items-center rounded-full border transition-all', r.ok ? 'border-up bg-up text-on-brand' : 'border-border')}>{r.ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
                {r.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
