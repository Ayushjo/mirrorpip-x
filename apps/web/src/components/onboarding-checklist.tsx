'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Card, LinkButton, cx } from './ui';
import { CheckIcon, LinkIcon, UsersIcon, ChartIcon } from './icons';

type Step = {
  key: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  done: boolean;
  Icon: (p: { width?: number; height?: number; className?: string }) => React.ReactNode;
};

/**
 * Guided first-run checklist shown on the dashboard until the user has connected
 * an account and started copying. Steps are tailored by intendedRole — would-be
 * leaders get a "become a leader" step. Renders nothing once everything is done.
 */
export function OnboardingChecklist({
  hasCredential,
  hasFollow,
  isLeaderApplied,
  intendedRole,
}: {
  hasCredential: boolean;
  hasFollow: boolean;
  isLeaderApplied: boolean;
  intendedRole: string | null;
}) {
  const wantsToLead = intendedRole === 'leader' || intendedRole === 'both';

  const steps: Step[] = [
    {
      key: 'connect',
      title: 'Connect your exchange',
      body: 'Add a trade-only Delta India API key. Withdrawals are never possible.',
      href: '/connect',
      cta: 'Connect account',
      done: hasCredential,
      Icon: LinkIcon,
    },
    ...(wantsToLead
      ? [
          {
            key: 'lead',
            title: 'Apply to become a leader',
            body: 'Submit your account for verification so others can copy your trades.',
            href: '/connect',
            cta: 'Apply as leader',
            done: isLeaderApplied,
            Icon: ChartIcon,
          } as Step,
        ]
      : []),
    {
      key: 'follow',
      title: 'Follow a verified leader',
      body: 'Pick a leader from the leaderboard and every trade mirrors into your account.',
      href: '/leaders',
      cta: 'Browse leaders',
      done: hasFollow,
      Icon: UsersIcon,
    },
  ];

  const allDone = steps.every((s) => s.done);
  if (allDone) return null;

  const doneCount = steps.filter((s) => s.done).length;
  // The first not-yet-done step is the one we actively nudge.
  const activeKey = steps.find((s) => !s.done)?.key;
  const next = steps.find((s) => !s.done)!;
  return <Checklist steps={steps} doneCount={doneCount} activeKey={activeKey} next={next} />;
}

function Checklist({ steps, doneCount, activeKey, next }: { steps: Step[]; doneCount: number; activeKey?: string; next: Step }) {
  // Once any step is done, collapse to a slim progress strip by default.
  const [open, setOpen] = useState(doneCount === 0);
  const pct = Math.round((doneCount / steps.length) * 100);
  if (!open)
    return (
      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="relative grid h-11 w-11 shrink-0 place-items-center">
            <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" /><circle cx="18" cy="18" r="15" fill="none" stroke="#00b0ff" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${(pct / 100) * 94.2} 94.2`} /></svg>
            <span className="text-[11px] font-semibold tabular-nums text-fg">{doneCount}/{steps.length}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-fg">Almost set up</div>
            <Link href={next.href} className="truncate text-xs text-brand hover:text-accent">Next: {next.title} →</Link>
          </div>
          <button type="button" onClick={() => setOpen(true)} aria-label="Show all steps" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-white/[0.06] hover:text-fg"><ChevronDown className="h-4 w-4" /></button>
        </div>
      </Card>
    );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>
            Finish setting up
          </div>
          <p className="mt-0.5 text-sm text-muted">A couple of steps and you&rsquo;ll be copying live.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {doneCount > 0 && <button type="button" onClick={() => setOpen(false)} aria-label="Collapse" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/[0.06] hover:text-fg"><ChevronDown className="h-4 w-4 rotate-180" /></button>}
        <div className="flex shrink-0 items-center gap-1.5">
          {steps.map((s) => (
            <span
              key={s.key}
              className={cx('h-1.5 rounded-full transition-all', s.done ? 'w-5 bg-up' : s.key === activeKey ? 'w-5 bg-brand' : 'w-1.5 bg-white/15')}
            />
          ))}
        </div>
        </div>
      </div>

      <ol className="relative mt-6 space-y-1 sm:grid sm:grid-cols-3 sm:gap-4 sm:space-y-0">
        {/* vertical connector (mobile) */}
        <span className="absolute bottom-6 left-[15px] top-4 w-px bg-white/10 sm:hidden" />
        {steps.map((s, i) => {
          const isActive = s.key === activeKey;
          return (
            <li
              key={s.key}
              className={cx(
                'relative flex gap-4 py-3 sm:flex-col sm:gap-3 sm:rounded-2xl sm:border sm:p-4',
                isActive ? 'sm:border-brand/35 sm:bg-brand/[0.05]' : 'sm:border-border-soft sm:bg-transparent',
              )}
            >
              <span
                className={cx(
                  'relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ring-4 ring-[#0a1c37]',
                  s.done
                    ? 'bg-up text-[#050b17]'
                    : isActive
                      ? 'bg-brand text-[#050b17] shadow-[0_4px_14px_rgba(0,176,255,0.4)]'
                      : 'border border-white/15 bg-[#0a1c37] text-muted',
                )}
              >
                {s.done ? <CheckIcon width={14} height={14} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1 pt-1 sm:pt-0">
                <div className={cx('flex items-center gap-2 text-sm font-medium leading-tight', s.done ? 'text-muted line-through' : 'text-fg')}>
                  <s.Icon width={14} height={14} className={s.done ? 'text-up' : isActive ? 'text-brand' : 'text-faint'} />
                  {s.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted">{s.body}</p>
                {!s.done && (
                  <div className="mt-3">
                    <LinkButton
                      href={s.href}
                      variant={isActive ? 'primary' : 'subtle'}
                      arrow={isActive}
                      className="py-1.5 pl-4 text-xs"
                    >
                      {s.cta}
                    </LinkButton>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
