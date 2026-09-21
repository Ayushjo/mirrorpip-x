'use client';

import { cx } from './ui';

export type AdminTab = 'overview' | 'users' | 'leaders' | 'audit' | 'access';

const TABS: Array<{ id: AdminTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'users', label: 'Users' },
  { id: 'leaders', label: 'Leaders' },
  { id: 'audit', label: 'Audit' },
  { id: 'access', label: 'Access' },
];

export function AdminTabs({ tab, onChange, pendingLeaders }: { tab: AdminTab; onChange: (t: AdminTab) => void; pendingLeaders: number }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-full border border-border bg-surface p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cx(
            'relative shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors sm:px-4',
            tab === t.id ? 'bg-brand text-white' : 'text-muted hover:text-fg',
          )}
        >
          {t.label}
          {t.id === 'leaders' && pendingLeaders > 0 && (
            <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-warn px-1 text-[10px] font-bold text-white">
              {pendingLeaders}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
