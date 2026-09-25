'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Field, Input, Select, cx } from '../ui';
import { Section, Toggle } from '../section';
import { COUNTRIES } from '@/lib/countries';
import { updateProfile } from '@/lib/profile-actions';
import { Avatar, useAvatar } from './avatar-picker';
import { FieldError } from '../password-field';

export type IdentityData = {
  name: string;
  email: string;
  image: string | null;
  bio: string;
  country: string;
  city: string;
  postalCode: string;
  phone: string;
  leader: { id: string; displayName: string; bio: string; status: string; listed: boolean } | null;
};

const flag = (code: string) => String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
const BIO_MAX = 160;

function SavedTick({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.span initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="absolute right-0 top-0 inline-flex items-center gap-1 text-[11px] font-medium text-up">
          <Check className="h-3 w-3" strokeWidth={3} /> Saved
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export type SavedProfile = { name: string; bio: string; country: string; city: string; postalCode: string; phone: string };

export function IdentityPanel({ data, onSaved }: { data: IdentityData; onSaved?: (v: SavedProfile) => void }) {
  const router = useRouter();
  const initial = useMemo(() => ({
    name: data.name, bio: data.bio, country: data.country, city: data.city, postalCode: data.postalCode, phone: data.phone,
    leaderName: data.leader?.displayName ?? '', leaderBio: data.leader?.bio ?? '', listed: data.leader?.listed ?? true,
  }), [data]);
  const [f, setF] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const avatar = useAvatar(data.image);
  const [ticks, setTicks] = useState<Set<string>>(new Set());
  const dirty = JSON.stringify(f) !== JSON.stringify(saved);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((s) => ({ ...s, [k]: v }));
  const errors = {
    name: f.name.trim().length < 2 ? 'Name is too short.' : null,
    bio: f.bio.length > BIO_MAX ? `Keep it under ${BIO_MAX} characters.` : null,
    leaderName: data.leader && f.leaderName.trim().length < 2 ? 'Public name is too short.' : null,
  };
  const valid = !errors.name && !errors.bio && !errors.leaderName;

  const save = useCallback(async () => {
    if (!valid || busy) return;
    const changed = new Set(Object.keys(f).filter((k) => f[k as keyof typeof f] !== saved[k as keyof typeof saved]));
    setBusy(true);
    const r = await updateProfile({ name: f.name.trim(), bio: f.bio.trim(), country: f.country, city: f.city.trim(), postalCode: f.postalCode.trim(), phone: f.phone.trim(), leader: data.leader ? { displayName: f.leaderName.trim(), bio: f.leaderBio.trim(), listed: f.listed } : null });
    setBusy(false);
    if (r.ok) {
      setSaved(f);
      setTicks(changed);
      setTimeout(() => setTicks(new Set()), 2200);
      onSaved?.({ name: f.name, bio: f.bio, country: f.country, city: f.city, postalCode: f.postalCode, phone: f.phone });
      toast.success('Profile saved');
      router.refresh();
    } else toast.error(r.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, saved, valid, busy, data.leader, onSaved, router]);

  // ⌘S / Ctrl+S saves; warn before leaving with unsaved edits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty) void save();
      }
    };
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('beforeunload', onLeave);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('beforeunload', onLeave); };
  }, [dirty, save]);

  return (
    <div className="space-y-5">
      <Section id="public" title="Public profile" sub="How you appear across BelieveMeGuys. Change your photo from the avatar above.">
        <div>
          <div className="space-y-4">
            <div className="relative"><SavedTick show={ticks.has('name')} />
            <Field label="Display name">
              <Input value={f.name} onChange={(e) => set('name', e.target.value)} maxLength={40} aria-invalid={!!errors.name} />
              <FieldError msg={errors.name} />
            </Field>
            </div>
            <div className="relative"><SavedTick show={ticks.has('bio')} />
            <Field label="Bio">
              <textarea value={f.bio} onChange={(e) => set('bio', e.target.value)} rows={3} placeholder="A line about how you trade or what you copy." className="w-full resize-none rounded-2xl border border-transparent bg-[#050b17] px-4 py-3 text-sm text-fg placeholder:text-faint outline-none transition focus:border-brand/60 focus:shadow-[0_0_0_4px_rgba(0,176,255,0.14)]" />
              <div className="mt-1.5 flex items-center justify-between text-[11px]">
                <FieldError msg={errors.bio} />
                <span className={cx('ml-auto tabular-nums', f.bio.length > BIO_MAX ? 'text-down' : 'text-faint')}>{f.bio.length}/{BIO_MAX}</span>
              </div>
            </Field>
            </div>
          </div>
        </div>

        {/* live preview */}
        <div className="mt-6 rounded-2xl bg-[#050b17] p-4">
          <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-faint">Preview</div>
          <div className="flex items-center gap-3">
            <Avatar src={avatar} name={f.name || data.name} size={44} />
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold text-fg">{f.name || 'Your name'}</div>
              <div className="truncate text-xs text-muted">{f.bio || 'Your bio shows here.'}</div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="location" title="Location & contact" sub="Required for compliance. Never shown publicly.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Country">
            <Select value={f.country} onChange={(e) => set('country', e.target.value)}>
              <option value="">Select country…</option>
              {COUNTRIES.map((c) => <option key={c.code} value={c.code} suppressHydrationWarning>{`${flag(c.code)} ${c.name}`}</option>)}
            </Select>
          </Field>
          <div className="relative"><SavedTick show={ticks.has('city')} /><Field label="City"><Input value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Mumbai" /></Field></div>
          <div className="relative"><SavedTick show={ticks.has('postalCode')} /><Field label="PIN / ZIP"><Input value={f.postalCode} onChange={(e) => set('postalCode', e.target.value)} placeholder="400001" inputMode="numeric" /></Field></div>
          <div className="relative"><SavedTick show={ticks.has('phone')} /><Field label="Phone"><Input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" /></Field></div>
        </div>
      </Section>

      {data.leader && (
        <Section id="leader" title="Leader profile" sub="What followers see on the leaderboard and your public page.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-[#050b17] px-4 py-3">
              <div>
                <div className="text-sm font-medium text-fg">Show on leaderboard</div>
                <div className="text-xs text-muted">{data.leader.status === 'VERIFIED' ? 'Verified · visible to everyone when on' : `Status: ${data.leader.status.toLowerCase()}`}</div>
              </div>
              <Toggle on={f.listed} onChange={(v) => set('listed', v)} label="Show on leaderboard" />
            </div>
            <Field label="Public display name">
              <Input value={f.leaderName} onChange={(e) => set('leaderName', e.target.value)} maxLength={60} aria-invalid={!!errors.leaderName} />
              <FieldError msg={errors.leaderName} />
            </Field>
            <Field label="Leader bio">
              <textarea value={f.leaderBio} onChange={(e) => set('leaderBio', e.target.value)} rows={3} placeholder="Your strategy in a sentence or two." className="w-full resize-none rounded-2xl border border-transparent bg-[#050b17] px-4 py-3 text-sm text-fg placeholder:text-faint outline-none transition focus:border-brand/60 focus:shadow-[0_0_0_4px_rgba(0,176,255,0.14)]" />
            </Field>
            <Link href={`/leaders/${data.leader.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-accent">View public page <ArrowUpRight className="h-4 w-4" /></Link>
          </div>
        </Section>
      )}

      {/* sticky save bar */}
      <AnimatePresence>
        {dirty && (
          <motion.div key="save" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="flex w-full max-w-md items-center gap-3 rounded-full border border-white/10 bg-[#0b1a33]/95 py-2 pl-5 pr-2 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
              <span className="flex-1 text-xs text-muted"><span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-warn" />Unsaved changes</span>
              <button type="button" onClick={() => setF(saved)} className="text-xs text-faint hover:text-fg">Discard</button>
              <Button type="button" onClick={save} disabled={busy || !valid} className="px-4 py-2 text-xs">
                {busy ? 'Saving…' : <span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5" strokeWidth={3} /> Save</span>}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
