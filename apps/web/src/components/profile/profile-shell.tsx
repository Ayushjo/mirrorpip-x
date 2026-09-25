'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { UserRound, ShieldCheck, AlertTriangle, Check } from 'lucide-react';
import { cx } from '../ui';
import { IdentityPanel, type IdentityData, type SavedProfile } from './identity-panel';
import { SecurityPanel } from './security-panel';
import { DangerPanel } from './danger-panel';
import { useAvatar } from './avatar-picker';

const TABS = [
  { id: 'profile', label: 'Profile', hint: 'Name, bio, location', Icon: UserRound },
  { id: 'security', label: 'Security', hint: 'Password, sessions, sign-in', Icon: ShieldCheck },
  { id: 'danger', label: 'Danger zone', hint: 'Export or delete', Icon: AlertTriangle },
] as const;
type TabId = (typeof TABS)[number]['id'];
const isTab = (v: string | null): v is TabId => !!v && TABS.some((t) => t.id === v);

/** Which section anchor is on screen (for the rail sub-links). */
function useSpy(ids: string[], enabled: boolean) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!enabled) return;
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (vis) setActive(vis.target.id);
    }, { rootMargin: '-20% 0px -60% 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids.join(','), enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return active;
}

export function ProfileShell({ data, emailVerified = false }: { data: IdentityData; emailVerified?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get('tab');
  const tab: TabId = isTab(raw) ? raw : 'profile';
  const setTab = (t: TabId) => {
    const sp = new URLSearchParams(params.toString());
    if (t === 'profile') sp.delete('tab'); else sp.set('tab', t);
    router.replace(sp.toString() ? `?${sp}` : '?', { scroll: false });
  };

  const avatar = useAvatar(data.image);
  const [p, setP] = useState<SavedProfile>({ name: data.name, bio: data.bio, country: data.country, city: data.city, postalCode: data.postalCode, phone: data.phone });
  const checks = [
    { k: 'photo', label: 'Add a photo', done: !!avatar, anchor: 'photo' },
    { k: 'bio', label: 'Write a bio', done: p.bio.trim().length > 0, anchor: 'public' },
    { k: 'location', label: 'Set your location', done: !!(p.country && p.city && p.postalCode), anchor: 'location' },
    { k: 'phone', label: 'Add a phone number', done: p.phone.trim().length > 0, anchor: 'location' },
    { k: 'verified', label: 'Verify your email', done: emailVerified, anchor: 'public' },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);
  const subs = [{ id: 'public', label: 'Public profile' }, { id: 'location', label: 'Location & contact' }, ...(data.leader ? [{ id: 'leader', label: 'Leader profile' }] : [])];
  const spy = useSpy(subs.map((s) => s.id), tab === 'profile');

  const jump = (anchor: string) => {
    if (anchor === 'photo') {
      document.querySelector<HTMLButtonElement>('[aria-label="Change profile photo"]')?.click();
      return;
    }
    if (tab !== 'profile') setTab('profile');
    setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), tab === 'profile' ? 0 : 400);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-10">
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <nav aria-label="Profile sections" className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-0">
          {TABS.map(({ id, label, hint, Icon }) => {
            const active = tab === id;
            return (
              <div key={id} className="shrink-0 lg:w-full">
                <button
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={active ? 'page' : undefined}
                  className={cx('relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-left transition-colors lg:w-full lg:px-4 lg:py-3', active ? 'bg-white/[0.06] text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg', id === 'danger' && active && 'text-down')}
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
                {id === 'profile' && active && (
                  <ul className="ml-[3.25rem] mt-1 hidden space-y-0.5 border-l border-white/10 lg:block">
                    {subs.map((s) => (
                      <li key={s.id}>
                        <button type="button" onClick={() => jump(s.id)} className={cx('-ml-px block border-l py-1 pl-3 text-xs transition-colors', spy === s.id ? 'border-brand text-fg' : 'border-transparent text-muted hover:text-fg')}>{s.label}</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* completion */}
        {pct < 100 && (
          <div className="card-surface hidden p-5 lg:block">
            <div className="flex items-center gap-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90"><circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" /><motion.circle cx="18" cy="18" r="15" fill="none" stroke="#00b0ff" strokeWidth="3" strokeLinecap="round" initial={false} animate={{ strokeDasharray: `${(pct / 100) * 94.2} 94.2` }} transition={{ duration: 0.6 }} /></svg>
                <span className="text-[11px] font-semibold tabular-nums text-fg">{pct}%</span>
              </div>
              <div>
                <div className="text-sm font-semibold text-fg">Profile {pct}% complete</div>
                <div className="text-xs text-muted">A full profile builds trust.</div>
              </div>
            </div>
            <ul className="mt-4 space-y-1">
              {checks.map((c) => (
                <li key={c.k}>
                  <button type="button" disabled={c.done || c.k === 'verified'} onClick={() => jump(c.anchor)} className={cx('flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs transition-colors', c.done ? 'text-muted' : 'text-fg hover:bg-white/[0.04]')}>
                    <span className={cx('grid h-4 w-4 shrink-0 place-items-center rounded-full border', c.done ? 'border-up bg-up text-[#050b17]' : 'border-white/20')}>{c.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}</span>
                    <span className={cx(c.done && 'line-through')}>{c.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {tab === 'profile' && <IdentityPanel data={data} onSaved={setP} />}
            {tab === 'security' && <SecurityPanel email={data.email} emailVerified={emailVerified} />}
            {tab === 'danger' && <DangerPanel email={data.email} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
