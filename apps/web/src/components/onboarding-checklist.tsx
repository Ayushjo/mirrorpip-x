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

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <div className="text-base font-medium text-fg">Finish setting up</div>
          <p className="mt-0.5 text-sm text-muted">A couple of steps and you&rsquo;ll be copying live.</p>
        </div>
        <span className="text-xs font-medium text-muted tabular-nums">
          {doneCount}/{steps.length} done
        </span>
      </div>
      <ol className="divide-y divide-border">
        {steps.map((s, i) => {
          const isActive = s.key === activeKey;
          return (
            <li key={s.key} className="flex items-center gap-4 px-6 py-4">
              <span
                className={cx(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-medium',
                  s.done
                    ? 'border-transparent bg-up/15 text-up'
                    : isActive
                      ? 'border-transparent bg-brand text-white'
                      : 'border-border bg-surface text-muted',
                )}
              >
                {s.done ? <CheckIcon width={16} height={16} /> : i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cx('flex items-center gap-2 text-sm font-medium', s.done ? 'text-muted line-through' : 'text-fg')}>
                  <s.Icon width={15} height={15} className={s.done ? 'text-up' : 'text-muted'} />
                  {s.title}
                </div>
                <p className="mt-0.5 text-xs text-muted">{s.body}</p>
              </div>
              {!s.done && (
                <LinkButton href={s.href} variant={isActive ? 'primary' : 'subtle'} className="shrink-0">
                  {s.cta}
                </LinkButton>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
