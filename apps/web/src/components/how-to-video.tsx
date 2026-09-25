'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Play } from 'lucide-react';
import { Button, Card, cx } from './ui';

const POSTER = '/media/connect-howto-poster';
const SRC = '/media/connect-howto.mp4';

// Chapter start times (seconds) in the recording. Re-check after re-recording.
const CHAPTERS = [
  { at: 0, t: 'Open Delta Exchange India', d: 'Account → API Keys' },
  { at: 14, t: 'Create a trade-only key', d: 'Read + Trading on · Withdrawals OFF' },
  { at: 32, t: 'Whitelist our IPs', d: 'Optional — copy them from the card below' },
  { at: 45, t: 'Paste into Connect', d: 'Key + secret, verified in seconds' },
];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/**
 * "How to create your key" — cinematic player with chapter navigation.
 * Collapses to a slim strip when the user already has accounts (`compact`).
 */
export function HowToVideo({ compact, onConnect }: { compact: boolean; onConnect: () => void }) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(!compact);
  const [started, setStarted] = useState(false);
  const [duration, setDuration] = useState(62);
  const [time, setTime] = useState(0);
  const ref = useRef<HTMLVideoElement>(null);

  const active = CHAPTERS.reduce((acc, c, i) => (time >= c.at - 0.5 ? i : acc), 0);

  const start = (at = 0) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = at;
    setStarted(true);
    void v.play();
  };
  const seek = (at: number) => (started ? start(at) : start(at));

  useEffect(() => {
    if (!open) ref.current?.pause();
  }, [open]);

  if (!open)
    return (
      <Card className="p-4 sm:p-5">
        <button type="button" onClick={() => setOpen(true)} className="flex w-full items-center gap-4 text-left">
          <span className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-[#050b17] shadow-[0_6px_20px_rgba(0,176,255,0.35)]">
            <Play className="ml-0.5 h-4 w-4 fill-current" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-fg">New here? Watch how to create your key</span>
            <span className="block text-xs text-muted">Trade-only Delta key, start to finish · {fmt(duration)}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
        </button>
      </Card>
    );

  return (
    <Card className="overflow-hidden !p-0 max-sm:-mx-6 max-sm:rounded-none">
      <div className="grid lg:grid-cols-[1.5fr_1fr]">
        {/* media */}
        <div className="relative min-w-0 p-4 sm:p-6 lg:pr-0">
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 -z-0 h-3/5 w-3/4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/20 blur-[80px]" />
          <div className="relative rounded-[1.25rem] bg-gradient-to-br from-brand/50 via-white/10 to-accent/30 p-[2px] sm:rounded-[1.75rem]">
            <div className="relative overflow-hidden rounded-[calc(1.25rem-2px)] bg-[#050b17] sm:rounded-[calc(1.75rem-2px)]">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={ref}
                className="aspect-video w-full"
                controls={started}
                playsInline
                preload="metadata"
                poster={`${POSTER}.jpg`}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 62)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onEnded={() => setStarted(false)}
              >
                <source src={SRC} type="video/mp4" />
              </video>

              {/* idle overlay */}
              <AnimatePresence>
                {!started && (
                  <motion.button
                    key="idle"
                    type="button"
                    onClick={() => start(0)}
                    aria-label="Play video"
                    initial={false}
                    exit={{ opacity: 0 }}
                    className="group absolute inset-0 grid place-items-center"
                    style={{ background: 'radial-gradient(80% 70% at 50% 50%, rgba(5,11,23,0.35), rgba(5,11,23,0.78))' }}
                  >
                    <span className="relative grid place-items-center">
                      {!reduce && <span className="pulse-ring absolute h-16 w-16 rounded-full border border-brand/50" />}
                      <span className="grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-[#050b17] shadow-[0_12px_40px_rgba(0,176,255,0.5)] transition-transform group-hover:scale-110">
                        <Play className="ml-1 h-6 w-6 fill-current" />
                      </span>
                    </span>
                    <span className="absolute bottom-3 right-3 rounded-full bg-[#050b17]/80 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-fg backdrop-blur">{fmt(duration)}</span>
                    <span className="absolute bottom-3 left-3 text-left">
                      <span className="block text-sm font-semibold text-fg">How to create your key</span>
                      <span className="block text-[11px] text-white/70">Delta India · trade-only · withdrawals off</span>
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
          {/* chapter progress */}
          <div className="relative mt-3 flex gap-1.5">
            {CHAPTERS.map((c, i) => {
              const end = CHAPTERS[i + 1]?.at ?? duration;
              const p = Math.max(0, Math.min(1, (time - c.at) / (end - c.at)));
              return (
                <button key={c.at} type="button" aria-label={`Chapter ${i + 1}: ${c.t}`} onClick={() => seek(c.at)} className="group h-3 flex-1">
                  <span className="block h-1 overflow-hidden rounded-full bg-white/10 transition-colors group-hover:bg-white/20">
                    <span className="block h-full rounded-full bg-gradient-to-r from-brand to-accent" style={{ width: `${p * 100}%` }} />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* chapters + CTA */}
        <div className="flex min-w-0 flex-col p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-fg" style={{ letterSpacing: '-0.01em' }}>How to create your key</h2>
              <p className="mt-1 text-sm text-muted">Follow along — click a step to jump there.</p>
            </div>
            {compact && (
              <button type="button" onClick={() => setOpen(false)} aria-label="Collapse" className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-white/[0.06] hover:text-fg">
                <ChevronDown className="h-4 w-4 rotate-180" />
              </button>
            )}
          </div>
          <ol className="mt-4 flex-1 space-y-1">
            {CHAPTERS.map((c, i) => {
              const on = started && active === i;
              return (
                <li key={c.at}>
                  <button type="button" onClick={() => seek(c.at)} className={cx('flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors', on ? 'bg-brand/[0.08]' : 'hover:bg-white/[0.04]')}>
                    <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors', on ? 'bg-brand text-[#050b17]' : 'bg-white/[0.06] text-muted')}>
                      {on ? <Play className="ml-px h-3 w-3 fill-current" /> : i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cx('block text-sm font-medium leading-tight', on ? 'text-brand' : 'text-fg')}>{c.t}</span>
                      <span className="block truncate text-xs text-muted">{c.d}</span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-faint">{fmt(c.at)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 border-t border-white/5 pt-4">
            <Button type="button" arrow onClick={onConnect} className="w-full justify-center max-sm:py-2.5">Got my key — connect it</Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
