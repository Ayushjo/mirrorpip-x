'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRound, ShieldCheck, AlertTriangle } from 'lucide-react';
import { cx } from '../ui';
import { IdentityPanel, type IdentityData } from './identity-panel';
import { SecurityPanel } from './security-panel';
import { DangerPanel } from './danger-panel';

const TABS = [
  { id: 'profile', label: 'Profile', hint: 'Name, photo, bio, location', Icon: UserRound },
  { id: 'security', label: 'Security', hint: 'Password, sessions, sign-in', Icon: ShieldCheck },
  { id: 'danger', label: 'Danger zone', hint: 'Export or delete', Icon: AlertTriangle },
] as const;
type TabId = (typeof TABS)[number]['id'];
const isTab = (v: string | null): v is TabId => !!v && TABS.some((t) => t.id === v);

export function ProfileShell({ data }: { data: IdentityData }) {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('tab');
  const tab: TabId = isTab(raw) ? raw : 'profile';
  const setTab = (t: TabId) => {
    const sp = new URLSearchParams(params.toString());
    if (t === 'profile') sp.delete('tab'); else sp.set('tab', t);
    router.replace(sp.toString() ? `?${sp}` : '?', { scroll: false });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
      {/* rail / pills */}
      <nav aria-label="Profile sections" className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-1 lg:self-start lg:overflow-visible lg:px-0">
        {TABS.map(({ id, label, hint, Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'relative flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors lg:w-full lg:px-4 lg:py-3',
                active ? 'bg-white/[0.06] text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg',
                id === 'danger' && active && 'text-down',
              )}
            >
              {active && <motion.span layoutId="profile-tab-bar" className={cx('absolute left-0 top-1/2 hidden h-6 w-1 -translate-y-1/2 rounded-r-full lg:block', id === 'danger' ? 'bg-down' : 'bg-brand')} />}
              <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', active ? (id === 'danger' ? 'bg-down/15 text-down' : 'bg-brand text-[#050b17]') : 'bg-white/[0.05] text-brand', id === 'danger' && !active && 'text-down/70')}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block whitespace-nowrap text-sm font-medium">{label}</span>
                <span className="hidden text-xs text-muted lg:block">{hint}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {tab === 'profile' && <IdentityPanel data={data} />}
            {tab === 'security' && <SecurityPanel email={data.email} />}
            {tab === 'danger' && <DangerPanel email={data.email} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
