'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { cx } from '../ui';

const POSTER = '/media/demo-film-poster.webp';
const SRC = '/media/demo-film.mp4'; // 1600×900
const SRC_SM = '/media/demo-film-sm.mp4'; // 960×540, for phones

/**
 * Landing-page product film. Nothing downloads until it scrolls into view (preload
 * "none"); then it autoplays muted + looped and pauses again when scrolled away.
 * Reduced-motion users (or a blocked autoplay, e.g. iOS Low Power Mode) get the
 * poster with a play button instead. Sound and pause are always one tap away.
 */
export function DemoFilm({ className }: { className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const userPaused = useRef(false);
  const heardSound = useRef(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Pick the cut here rather than via <source media>, which some browsers ignore.
    // preload="none" means nothing is fetched until play().
    v.src = window.matchMedia('(max-width: 640px)').matches ? SRC_SM : SRC;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e) return;
        if (e.isIntersecting && !userPaused.current) v.play().catch(() => setPlaying(false));
        else if (!e.isIntersecting) v.pause();
      },
      { threshold: 0.4 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      void v.play().catch(() => undefined);
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !v.muted;
    v.muted = next;
    setMuted(next);
    // First time sound goes on, start from the top so the edit plays as scored.
    if (!next && !heardSound.current) {
      heardSound.current = true;
      v.currentTime = 0;
    }
    if (!next && v.paused) {
      userPaused.current = false;
      void v.play().catch(() => undefined);
    }
  };

  return (
    <div className={cx('relative mx-auto w-full max-w-5xl', className)}>
      <div aria-hidden className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-brand/15 blur-[70px] sm:-inset-10" />
      <div className="relative rounded-[1.25rem] bg-gradient-to-br from-brand/50 via-white/10 to-accent/30 p-[2px] shadow-[0_40px_120px_rgba(0,0,0,0.6)] sm:rounded-[2rem]">
        <div className="group relative overflow-hidden rounded-[calc(1.25rem-2px)] bg-bg sm:rounded-[calc(2rem-2px)]">
          <video
            ref={ref}
            className="block aspect-video w-full"
            poster={POSTER}
            muted
            loop
            playsInline
            preload="none"
            aria-label="BelieveMeGuys product film: a verified leader's trade copied into your account"
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress(v.currentTime / v.duration);
            }}
          />

          {/* big play affordance whenever it isn't playing */}
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause video' : 'Play video'}
            className={cx(
              'absolute inset-0 grid place-items-center transition-opacity duration-300',
              playing ? 'pointer-events-none opacity-0' : 'bg-bg/30 opacity-100',
            )}
          >
            <span className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-[#050b17] shadow-[0_12px_40px_rgba(0,176,255,0.5)] transition-transform hover:scale-110 sm:h-20 sm:w-20">
              <Play className="ml-1 h-5 w-5 fill-current sm:h-7 sm:w-7" />
            </span>
          </button>

          {/* controls */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-2 sm:p-4">
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? 'Pause video' : 'Play video'}
              className="grid h-8 w-8 place-items-center rounded-full bg-[#050b17]/70 text-fg backdrop-blur transition-colors hover:bg-[#050b17]/90 sm:h-10 sm:w-10"
            >
              {playing ? <Pause className="h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" /> : <Play className="ml-0.5 h-3.5 w-3.5 fill-current sm:h-4 sm:w-4" />}
            </button>
            <button
              type="button"
              onClick={toggleSound}
              aria-label={muted ? 'Turn sound on' : 'Mute'}
              aria-pressed={!muted}
              className="inline-flex h-8 w-8 items-center justify-center gap-2 rounded-full bg-[#050b17]/70 text-sm font-semibold text-fg backdrop-blur transition-colors hover:bg-[#050b17]/90 sm:h-10 sm:w-auto sm:px-4"
            >
              {muted ? <VolumeX className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Volume2 className="h-3.5 w-3.5 text-brand sm:h-4 sm:w-4" />}
              <span className="hidden sm:inline">{muted ? 'Sound on' : 'Sound off'}</span>
            </button>
          </div>

          <div aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10">
            <div className="h-full bg-gradient-to-r from-brand to-accent" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
