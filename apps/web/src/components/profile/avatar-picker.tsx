'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Trash2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button, cx } from '../ui';
import { uploadAvatar, removeAvatar, type Focal } from '@/lib/profile-actions';

export function Avatar({ src, name, size = 96, className }: { src?: string | null; name: string; size?: number; className?: string }) {
  return (
    <span className={cx('relative inline-grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#1a4586] to-[#0a1e3a] font-semibold text-fg ring-1 ring-white/10', className)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/** Avatar with a gradient ring, "Change photo" opens the picker sheet. */
export function AvatarPicker({ name, initial, onChange }: { name: string; initial: string | null; onChange?: (url: string | null) => void }) {
  const [url, setUrl] = useState<string | null>(initial);
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col items-center gap-3">
        <span className="rounded-full bg-gradient-to-br from-brand to-accent p-[3px] shadow-[0_16px_50px_rgba(0,176,255,0.3)]">
          <Avatar src={url} name={name} size={96} className="ring-4 ring-[#0b1a33]" />
        </span>
        <div className="flex items-center gap-3 text-xs">
          <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 font-medium text-brand hover:text-accent"><Camera className="h-3.5 w-3.5" /> Change photo</button>
          {url && (
            <button type="button" onClick={async () => { const r = await removeAvatar(); if (r.ok) { setUrl(null); onChange?.(null); toast.success('Photo removed'); } }} className="inline-flex items-center gap-1 text-faint hover:text-down"><Trash2 className="h-3.5 w-3.5" /> Remove</button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {open && <PickerSheet name={name} onClose={() => setOpen(false)} onDone={(u) => { setUrl(u); onChange?.(u); setOpen(false); }} />}
      </AnimatePresence>
    </>
  );
}

function PickerSheet({ name, onClose, onDone }: { name: string; onClose: () => void; onDone: (url: string) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [focal, setFocal] = useState<Focal>({ x: 50, y: 50, zoom: 1 });
  const [busy, setBusy] = useState(false);
  const drag = useRef<{ x: number; y: number; fx: number; fy: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) return;
    const u = URL.createObjectURL(file);
    setSrc(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);

  const pick = (f?: File) => { if (f && f.type.startsWith('image/')) setFile(f); };

  async function save() {
    if (!file) return;
    setBusy(true);
    const r = await uploadAvatar(file, focal);
    setBusy(false);
    if (r.ok && r.data) { toast.success('Photo updated'); onDone(r.data.url); } else toast.error('Could not upload. Try again.');
  }

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-[#050b17]/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div role="dialog" aria-modal="true" aria-label="Change photo" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', stiffness: 320, damping: 34 }} className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-lg rounded-t-[2rem] border-t border-white/10 bg-[#0b1a33] p-6 shadow-[0_-30px_80px_rgba(0,0,0,0.7)] sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem] sm:border" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-fg" style={{ letterSpacing: '-0.02em' }}>Change photo</div>
            <div className="text-xs text-muted">Drag to reposition · pinch or slide to zoom</div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-muted hover:text-fg"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-5">
          {src ? (
            <div
              className="relative h-56 w-56 cursor-grab touch-none overflow-hidden rounded-full ring-4 ring-brand/40 active:cursor-grabbing"
              onPointerDown={(e) => { drag.current = { x: e.clientX, y: e.clientY, fx: focal.x, fy: focal.y }; (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
              onPointerMove={(e) => { if (!drag.current) return; const d = drag.current; setFocal((f) => ({ ...f, x: Math.max(0, Math.min(100, d.fx - ((e.clientX - d.x) / 224) * 100)), y: Math.max(0, Math.min(100, d.fy - ((e.clientY - d.y) / 224) * 100)) })); }}
              onPointerUp={() => (drag.current = null)}
            >
              <img src={src} alt="" draggable={false} className="h-full w-full select-none object-cover" style={{ objectPosition: `${focal.x}% ${focal.y}%`, transform: `scale(${focal.zoom})`, transformOrigin: `${focal.x}% ${focal.y}%` }} />
            </div>
          ) : (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
              className="grid h-56 w-full cursor-pointer place-items-center rounded-3xl border border-dashed border-white/15 bg-[#050b17] text-center transition-colors hover:border-brand/50"
            >
              <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
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
            <Button type="button" variant="subtle" className="flex-1" onClick={() => { const initials = name.slice(0, 1).toUpperCase(); toast.success(`Using initials “${initials}”`); onDone(''); }}>Use initials</Button>
            <Button type="button" className="flex-1" disabled={!file || busy} onClick={save}>{busy ? 'Uploading…' : 'Save photo'}</Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
