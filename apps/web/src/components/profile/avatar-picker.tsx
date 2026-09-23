'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button, cx } from '../ui';
import { Sheet } from '../sheet';
import { uploadAvatar, removeAvatar, type Focal } from '@/lib/profile-actions';

/** Fired on window whenever the avatar changes, so every avatar on the page updates. */
export const AVATAR_EVENT = 'bmg:avatar';
export function useAvatar(initial: string | null) {
  const [url, setUrl] = useState(initial);
  useEffect(() => {
    const on = (e: Event) => setUrl((e as CustomEvent<string | null>).detail);
    window.addEventListener(AVATAR_EVENT, on);
    return () => window.removeEventListener(AVATAR_EVENT, on);
  }, []);
  return url;
}
const announce = (url: string | null) => window.dispatchEvent(new CustomEvent(AVATAR_EVENT, { detail: url }));

export function Avatar({ src, name, size = 96, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  return (
    <span className={cx('relative inline-grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#1a4586] to-[#0a1e3a] font-semibold text-fg ring-1 ring-white/10', className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Hero avatar: ringed, verified badge, click/hover reveals a camera and opens the picker. */
export function HeroAvatar({ name, initial, verified }: { name: string; initial: string | null; verified: boolean }) {
  const url = useAvatar(initial);
  const [open, setOpen] = useState(false);
  return (
    <>
      <span className="flex flex-col items-center gap-3">
      <button type="button" onClick={() => setOpen(true)} aria-label="Change profile photo" className="group relative rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand">
        <span className="absolute inset-0 -m-3 rounded-full bg-brand/25 blur-2xl" />
        <span className="relative grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand to-accent p-[3px] shadow-[0_16px_50px_rgba(0,176,255,0.35)]">
          <Avatar src={url} name={name} size={90} className="ring-0" />
          <span className="absolute inset-[3px] grid place-items-center rounded-full bg-[#050b17]/60 text-white opacity-0 backdrop-blur-[1px] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            <Camera className="h-6 w-6" />
          </span>
        </span>
        {verified && (
          <span className="absolute -bottom-1 -right-1 grid h-8 w-8 place-items-center rounded-full border-4 border-bg bg-up text-[#050b17]" title="Email verified">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7" /></svg>
          </span>
        )}
      </button>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-accent"><Camera className="h-3 w-3" /> {url ? 'Change photo' : 'Add a photo'}</button>
      </span>
      <AvatarSheet open={open} onClose={() => setOpen(false)} name={name} hasPhoto={!!url} />
    </>
  );
}

export function AvatarSheet({ open, onClose, name, hasPhoto }: { open: boolean; onClose: () => void; name: string; hasPhoto: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [focal, setFocal] = useState<Focal>({ x: 50, y: 50, zoom: 1 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setSrc(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => {
    if (!open) { setFile(null); setSrc(null); setFocal({ x: 50, y: 50, zoom: 1 }); }
  }, [open]);

  const pick = (f?: File) => { if (f && f.type.startsWith('image/')) setFile(f); };

  async function save() {
    if (!file) return;
    setBusy(true);
    const r = await uploadAvatar(file, focal);
    setBusy(false);
    if (r.ok && r.data) {
      toast.success('Photo updated');
      announce(r.data.url);
      router.refresh();
      onClose();
    } else toast.error(r.ok ? 'Could not upload. Try again.' : r.error);
  }
  async function remove() {
    setBusy(true);
    const r = await removeAvatar();
    setBusy(false);
    if (r.ok) { toast.success('Photo removed'); announce(null); router.refresh(); onClose(); } else toast.error(r.error);
  }

  return (
    <Sheet open={open} onClose={onClose} title="Change photo" sub="Drag to reposition · slide to zoom">
      <div className="flex flex-col items-center gap-5">
        {src ? (
          <div
            className="relative h-56 w-56 cursor-grab touch-none overflow-hidden rounded-full ring-4 ring-brand/40 active:cursor-grabbing"
            onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, fx: focal.x, fy: focal.y }; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }}
            onPointerMove={(e) => { if (!drag.current) return; const d = drag.current; setFocal((f) => ({ ...f, x: Math.max(0, Math.min(100, d.fx - ((e.clientX - d.x) / 224) * 100)), y: Math.max(0, Math.min(100, d.fy - ((e.clientY - d.y) / 224) * 100)) })); }}
            onPointerUp={() => (drag.current = null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%`, transform: `scale(${focal.zoom})`, transformOrigin: `${focal.x}% ${focal.y}%` }} />
          </div>
        ) : (
          <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }} className="grid h-56 w-full cursor-pointer place-items-center rounded-3xl border border-dashed border-white/15 bg-[#050b17] text-center transition-colors hover:border-brand/50">
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            <div>
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/[0.05] text-brand"><Upload className="h-5 w-5" /></span>
              <div className="mt-3 text-sm font-medium text-fg">Drop an image or click to choose</div>
              <div className="mt-1 text-xs text-muted">PNG or JPG · square works best</div>
            </div>
          </label>
        )}
        {src && (
          <div className="w-full max-w-xs">
            <input type="range" min={1} max={2.5} step={0.01} value={focal.zoom} onChange={(e) => setFocal((f) => ({ ...f, zoom: Number(e.target.value) }))} aria-label="Zoom" className="w-full accent-[#00b0ff]" />
            <div className="mt-2 flex items-center justify-between text-xs text-muted">
              <button type="button" onClick={() => setFocal({ x: 50, y: 50, zoom: 1 })} className="hover:text-fg">Reset</button>
              <button type="button" onClick={() => { setFile(null); setSrc(null); }} className="hover:text-fg">Choose another</button>
            </div>
          </div>
        )}
        <div className="flex w-full items-center gap-2">
          {hasPhoto ? (
            <Button type="button" variant="subtle" className="flex-1" disabled={busy} onClick={remove}><Trash2 className="h-4 w-4" /> Remove</Button>
          ) : (
            <span className="flex-1 text-center text-xs text-muted">Showing initials “{name.slice(0, 1).toUpperCase()}”</span>
          )}
          <Button type="button" className="flex-1" disabled={!file || busy} onClick={save}>{busy ? 'Saving…' : 'Save photo'}</Button>
        </div>
      </div>
    </Sheet>
  );
}
