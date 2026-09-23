'use client';

import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useMotionValueEvent } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cx } from '../ui';

/* ─── shared ───────────────────────────────────────────────────────────── */

const SYMBOLS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'XRPUSD', 'BNBUSD'];
const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(Math.random() * xs.length)]!;

/** Runs `fn` every `ms` while the element is on screen (and motion is allowed). */
function useTicker(ref: React.RefObject<HTMLElement | null>, ms: number, fn: () => void, enabled = true) {
  const inView = useInView(ref, { amount: 0.2 });
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!inView || reduce || !enabled) return;
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, reduce, ms, enabled]);
  return inView;
}

/** Catmull-Rom → cubic bezier path for a smooth line. */
function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0]!.x} ${pts[0]!.y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

type Fill = { id: number; sym: string; side: 'Buy' | 'Sell'; ms: number; qty: string };
let fillId = 1;
/** Fixed rows for SSR/hydration; randomness only starts on the client ticker. */
const SEED_FILLS: Fill[] = [
  { id: -1, sym: 'BTCUSD', side: 'Buy', ms: 620, qty: '1.00' },
  { id: -2, sym: 'ETHUSD', side: 'Sell', ms: 810, qty: '0.60' },
  { id: -3, sym: 'SOLUSD', side: 'Buy', ms: 470, qty: '1.40' },
];
const mkFill = (): Fill => ({
  id: fillId++,
  sym: pick(SYMBOLS),
  side: Math.random() > 0.45 ? 'Buy' : 'Sell',
  ms: Math.round(rnd(320, 980)),
  qty: (rnd(0.05, 2.5)).toFixed(2),
});

/* ─── Live phone ───────────────────────────────────────────────────────── */

export function LivePhone({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [series, setSeries] = useState<number[]>(() =>
    [40, 44, 41, 47, 45, 52, 49, 55, 53, 58, 56, 61, 59, 64, 62, 66, 63, 69, 67, 72, 70, 74, 71, 76, 74, 79, 77, 82],
  );
  const [equity, setEquity] = useState(12480.5);
  const [fills, setFills] = useState<Fill[]>(() => [SEED_FILLS[0]!]);

  useTicker(ref, 1400, () => {
    setSeries((s) => {
      const last = s[s.length - 1]!;
      const next = Math.max(15, Math.min(90, last + rnd(-6, 8)));
      return [...s.slice(1), next];
    });
    setEquity((e) => Math.max(11000, e + rnd(-38, 62)));
    if (Math.random() > 0.35) setFills((f) => [mkFill(), ...f].slice(0, 2));
  });

  const w = 260;
  const h = 110;
  const pts = useMemo(() => series.map((v, i) => ({ x: (i / (series.length - 1)) * w, y: h - (v / 100) * h })), [series]);
  const d = smoothPath(pts);
  const last = pts[pts.length - 1]!;
  const up = series[series.length - 1]! >= series[0]!;
  const weekPct = ((series[series.length - 1]! - series[0]!) / 10).toFixed(1);

  return (
    <div ref={ref} className={cx('relative mx-auto w-[280px] sm:w-[320px]', className)}>
      <div className="rounded-[3rem] border border-white/10 bg-[#0b1a33] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-[2.5rem] bg-[#050b17]">
          <div className="flex items-center justify-between px-6 pt-4 text-[10px] text-muted">
            <span>9:41</span>
            <span className="h-1.5 w-16 rounded-full bg-white/10" />
            <span>●●●</span>
          </div>
          <div className="mt-3 flex items-center justify-between px-5">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-[#050b17]">L</span>
              <div>
                <div className="text-[12px] font-semibold text-fg">Leo Live Delta</div>
                <div className="text-[10px] text-muted">#1 · Delta India</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-up/15 px-2 py-0.5 text-[10px] font-semibold text-up">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-up" /> Copying
            </span>
          </div>
          <div className="px-5 pt-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Your equity</div>
            <div className="mt-0.5 text-[26px] font-semibold leading-none tabular-nums text-fg" style={{ letterSpacing: '-0.03em' }}>
              ${Math.floor(equity).toLocaleString('en-US')}
              <span className="text-muted">.{String(Math.round((equity % 1) * 100)).padStart(2, '0')}</span>
            </div>
            <div className={cx('mt-1 text-[11px] font-medium', up ? 'text-up' : 'text-down')}>
              {up ? '+' : ''}
              {weekPct}% this week
            </div>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-28 w-full" fill="none">
            <defs>
              <linearGradient id="lp-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={up ? '#00b0ff' : '#ef4444'} stopOpacity="0.35" />
                <stop offset="100%" stopColor={up ? '#00b0ff' : '#ef4444'} stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#lp-g)" animate={{ d: `${d} L ${w} ${h} L 0 ${h} Z` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            <motion.path d={d} stroke={up ? '#00b0ff' : '#ef4444'} strokeWidth="2" strokeLinecap="round" animate={{ d }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            <motion.circle r="3.5" fill={up ? '#00b0ff' : '#ef4444'} animate={{ cx: last.x, cy: last.y }} transition={{ duration: 0.8, ease: 'easeOut' }} />
            <motion.circle r="8" fill={up ? '#00b0ff' : '#ef4444'} opacity="0.25" animate={{ cx: last.x, cy: last.y, r: [6, 12, 6], opacity: [0.3, 0, 0.3] }} transition={{ cx: { duration: 0.8 }, cy: { duration: 0.8 }, r: { duration: 1.6, repeat: Infinity }, opacity: { duration: 1.6, repeat: Infinity } }} />
          </svg>
          <div className="mx-4 mb-4 h-[76px] overflow-hidden">
            <AnimatePresence initial={false}>
              {fills.slice(0, 1).map((f) => (
                <motion.div
                  key={f.id}
                  initial={{ y: 24, opacity: 0, scale: 0.98 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -24, opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-2xl bg-[#0b1a33] p-3"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-fg">
                      {f.sym} · <span className={f.side === 'Buy' ? 'text-up' : 'text-down'}>{f.side}</span>
                    </span>
                    <span className="text-muted">{(f.ms / 1000).toFixed(1)}s ago</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px]">
                    <span className="text-muted">
                      Leader {f.qty} → You {(Number(f.qty) * 0.25).toFixed(2)}
                    </span>
                    <motion.span initial={{ scale: 1 }} animate={{ scale: [1, 1.18, 1] }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-full bg-up/15 px-2 py-0.5 font-semibold text-up">Filled</motion.span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-around border-t border-white/5 px-4 py-3 text-[9px] text-muted">
            {['Copies', 'Leaders', 'Accounts', 'Alerts'].map((t, i) => (
              <span key={t} className={cx('flex flex-col items-center gap-1', i === 0 && 'text-brand')}>
                <span className={cx('h-4 w-4 rounded-md', i === 0 ? 'bg-brand' : 'bg-white/10')} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Fills feed (24/7 engine card) ───────────────────────────────────── */

export function FillsFeed({ rows = 3, className }: { rows?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [fills, setFills] = useState<Fill[]>(() => SEED_FILLS);
  useTicker(ref, 1300, () => setFills((f) => [mkFill(), ...f].slice(0, rows + 1)));
  return (
    <div ref={ref} className={cx('space-y-2', className)}>
      <AnimatePresence initial={false}>
        {fills.slice(0, rows).map((f, i) => (
          <motion.div
            key={f.id}
            layout
            initial={{ y: -18, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1 - i * 0.28, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-between rounded-2xl bg-[#050b17] px-4 py-3 text-sm"
          >
            <span className="text-fg">
              {f.sym} · <span className={f.side === 'Buy' ? 'text-up' : 'text-down'}>{f.side}</span> · {(f.ms / 1000).toFixed(1)}s
            </span>
            <motion.span initial={{ scale: 1 }} animate={{ scale: i === 0 ? [1, 1.18, 1] : 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="rounded-full bg-up/15 px-2 py-0.5 text-xs font-semibold text-up">Filled</motion.span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ─── Live leaderboard (rows reorder) ──────────────────────────────────── */

type Row = { id: string; name: string; roi: number; followers: number; prev: number };

export function LiveLeaderboard({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>([
    { id: 'a', name: 'Leo Live Delta', roi: 18.4, followers: 128, prev: 0 },
    { id: 'b', name: 'HERO', roi: 17.1, followers: 74, prev: 1 },
    { id: 'c', name: 'Leo Trader', roi: 16.2, followers: 41, prev: 2 },
    { id: 'd', name: 'Nova Swing', roi: 15.4, followers: 33, prev: 3 },
    { id: 'e', name: 'Quant Ria', roi: 14.6, followers: 27, prev: 4 },
  ]);
  useTicker(ref, 1500, () =>
    setRows((rs) => {
      const withIdx = rs.map((r, i) => ({ ...r, prev: i }));
      // one or two leaders get a real move so ranks actually swap
      const movers = new Set([Math.floor(Math.random() * rs.length), Math.floor(Math.random() * rs.length)]);
      return withIdx
        .map((r, i) => ({
          ...r,
          roi: Math.max(4, +(r.roi + (movers.has(i) ? rnd(-3.2, 3.8) : rnd(-0.4, 0.5))).toFixed(1)),
          followers: r.followers + (Math.random() > 0.4 ? Math.round(rnd(1, 6)) : 0),
        }))
        .sort((a, b) => b.roi - a.roi);
    }),
  );
  return (
    <div ref={ref} className={cx('space-y-2', className)}>
      {rows.map((r, i) => {
        const delta = r.prev - i; // + moved up, - moved down
        return (
        <motion.div
          key={r.id}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          animate={{ backgroundColor: delta > 0 ? 'rgba(16,185,129,0.14)' : delta < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(5,11,23,0.8)' }}
          className={cx('flex items-center justify-between rounded-2xl px-4 py-3 backdrop-blur', i === 0 && 'ring-1 ring-brand/40')}
        >
          <div className="flex items-center gap-3">
            <motion.span
              layout
              className={cx(
                'grid h-8 w-8 place-items-center rounded-full text-xs font-bold',
                i === 0 ? 'bg-gradient-to-br from-brand to-accent text-[#050b17] shadow-[0_6px_16px_rgba(0,176,255,0.4)]' : 'bg-white/10 text-fg',
              )}
            >
              {i + 1}
            </motion.span>
            <span className="text-sm font-medium text-fg">{r.name}</span>
            <AnimatePresence>
              {delta !== 0 && (
                <motion.span
                  key={`${r.id}-${r.prev}-${i}`}
                  initial={{ opacity: 0, y: delta > 0 ? 6 : -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={cx('text-[11px] font-semibold', delta > 0 ? 'text-up' : 'text-down')}
                >
                  {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="tabular-nums text-muted">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={r.followers} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="inline-block">
                  {r.followers}
                </motion.span>
              </AnimatePresence>{' '}
              followers
            </span>
            <span className="w-14 text-right font-semibold tabular-nums text-up">+{r.roi.toFixed(1)}%</span>
          </div>
        </motion.div>
        );
      })}
    </div>
  );
}

/* ─── Live trade chart (explainer card) ────────────────────────────────── */

export function LiveTradeChart({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const W = 420;
  const H = 220;
  const [series, setSeries] = useState<number[]>(() =>
    [50, 46, 52, 58, 55, 61, 66, 60, 54, 49, 44, 48, 53, 59, 64, 70, 66, 61, 57, 62, 68, 73, 69, 64, 60, 66],
  );
  const [price, setPrice] = useState(81332.5);
  const [marker, setMarker] = useState<{ id: number; up: boolean; x: number; y: number } | null>(null);

  useTicker(ref, 520, () => {
    setSeries((s) => {
      const last = s[s.length - 1]!;
      const next = Math.max(18, Math.min(85, last + rnd(-9, 9)));
      const arr = [...s.slice(1), next];
      if (Math.random() > 0.6) {
        const i = arr.length - 1;
        setMarker({ id: Date.now(), up: next >= last, x: (i / (arr.length - 1)) * W, y: H - (next / 100) * H });
      }
      return arr;
    });
    setPrice((p) => +(p + rnd(-60, 70)).toFixed(1));
  });

  const pts = useMemo(() => series.map((v, i) => ({ x: (i / (series.length - 1)) * W, y: H - (v / 100) * H })), [series]);
  const d = smoothPath(pts);
  const last = pts[pts.length - 1]!;
  const up = series[series.length - 1]! >= series[series.length - 2]!;

  return (
    <div ref={ref} className={cx('relative h-72', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full overflow-visible" fill="none">
        <line x1={last.x} y1="0" x2={last.x} y2={H} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 6" />
        <motion.line x1="0" x2={W} stroke="rgba(255,255,255,0.2)" animate={{ y1: last.y, y2: last.y }} transition={{ duration: 0.35 }} />
        <motion.path d={d} stroke="#00b0ff" strokeWidth="2.5" strokeLinecap="round" animate={{ d }} transition={{ duration: 0.35, ease: 'easeOut' }} />
        <motion.circle r="4.5" fill="#fff" animate={{ cx: last.x, cy: last.y }} transition={{ duration: 0.35 }} />
        <AnimatePresence>
          {marker && (
            <motion.g key={marker.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} style={{ transformOrigin: `${marker.x}px ${marker.y}px` }}>
              <circle cx={marker.x} cy={marker.y} r="10" fill={marker.up ? '#10b981' : '#ef4444'} opacity="0.25" />
              <circle cx={marker.x} cy={marker.y} r="5" fill={marker.up ? '#10b981' : '#ef4444'} />
            </motion.g>
          )}
        </AnimatePresence>
      </svg>
      <AnimatePresence mode="wait">
        <motion.div
          key={marker?.id ?? 'idle'}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -10, opacity: 0 }}
          className={cx(
            'absolute left-[38%] top-[4%] flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-[#050b17]',
            marker && !marker.up ? 'bg-down shadow-[0_10px_30px_rgba(239,68,68,0.4)]' : 'bg-up shadow-[0_10px_30px_rgba(16,185,129,0.4)]',
          )}
        >
          $10.00
          <span className="grid h-6 w-6 place-items-center rounded-full bg-[#050b17] text-white">{marker && !marker.up ? '↘' : '↗'}</span>
        </motion.div>
      </AnimatePresence>
      <motion.div
        className="absolute right-0 rounded-full bg-white px-3 py-1 text-xs font-semibold tabular-nums text-[#050b17]"
        animate={{ top: `${(last.y / H) * 100}%`, y: '-50%' }}
        transition={{ duration: 0.35 }}
      >
        {price.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </motion.div>
      <div className="absolute bottom-0 left-[12%] flex gap-2">
        {[['Amount', '$10'], ['Multiplier', '1x']].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-[#050b17] px-5 py-3 text-center">
            <div className="text-[11px] text-muted">{k}</div>
            <div className="text-base font-semibold text-fg">{v}</div>
          </div>
        ))}
      </div>
      <div className={cx('absolute left-0 top-0 text-xs font-medium', up ? 'text-up' : 'text-down')}>{up ? '▲ Up' : '▼ Down'}</div>
    </div>
  );
}

/* ─── $1 → $10 looping counter ─────────────────────────────────────────── */

export function LoopCounter({ from = 1, to = 10, className }: { from?: number; to?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(from);
  const [hold, setHold] = useState(false);
  useTicker(ref, hold ? 1800 : 260, () => {
    setN((v) => {
      if (v >= to) {
        setHold(false);
        return from;
      }
      const next = v + 1;
      if (next >= to) setHold(true);
      return next;
    });
  });
  return (
    <div ref={ref} className={cx('relative flex items-center justify-center', className)}>
      <span className="metal text-[7rem] font-semibold leading-none tabular-nums sm:text-[9rem]" style={{ letterSpacing: '-0.06em' }}>
        $
      </span>
      <span className="relative inline-block h-[7rem] w-[1.4em] overflow-hidden text-[7rem] leading-none sm:h-[9rem] sm:text-[9rem]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={n}
            initial={{ y: '60%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-60%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="metal absolute inset-0 font-semibold tabular-nums"
            style={{ letterSpacing: '-0.06em' }}
          >
            {n}
          </motion.span>
        </AnimatePresence>
      </span>
    </div>
  );
}

/* ─── Sizing bars: leader size → your proportional size ────────────────── */

export function SizingBars({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pairs, setPairs] = useState(() => [1.0, 0.6, 1.4, 0.8].map((v, i) => ({ id: -1 - i, v })));
  useTicker(ref, 1600, () => setPairs((p) => [...p.slice(1), { id: Date.now(), v: +rnd(0.4, 1.6).toFixed(1) }]));
  return (
    <div ref={ref} className={cx('flex items-end justify-center gap-4', className)}>
      {pairs.map(({ id, v }) => (
        <motion.div key={id} layout initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-center gap-2">
          <div className="flex items-end gap-1">
            <motion.div className="w-7 rounded-t-xl bg-white/15 sm:w-9" animate={{ height: v * 110 }} transition={{ type: 'spring', stiffness: 220, damping: 22 }} />
            <motion.div className="w-7 rounded-t-xl bg-gradient-to-t from-brand/40 to-brand sm:w-9" animate={{ height: v * 110 * 0.25 }} transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.15 }} />
          </div>
          <div className="text-[10px] tabular-nums text-muted">
            {v.toFixed(1)} → <span className="text-brand">{(v * 0.25).toFixed(2)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Help chat loop ───────────────────────────────────────────────────── */

const CHAT: { who: 'u' | 'a'; t: string }[] = [
  { who: 'u', t: 'How do I set a daily loss cap?' },
  { who: 'a', t: 'Open the copy, tap Risk, set the cap. Done!' },
  { who: 'u', t: 'Can I pause a leader for the weekend?' },
  { who: 'a', t: 'Yes — Pause keeps your settings, Stop closes the copy.' },
  { who: 'u', t: 'Do you ever hold my funds?' },
  { who: 'a', t: 'Never. Trade-only keys, withdrawals stay disabled.' },
];

export function HelpChat({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(2);
  const [typing, setTyping] = useState(false);
  useTicker(ref, typing ? 900 : 2200, () => {
    if (!typing) {
      setTyping(true);
      return;
    }
    setTyping(false);
    setN((v) => (v >= CHAT.length ? 2 : v + 1));
  });
  const shown = CHAT.slice(Math.max(0, n - 3), n);
  return (
    <div ref={ref} className={cx('flex h-[230px] flex-col justify-end gap-2 overflow-hidden', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {shown.map((m, i) => (
          <motion.div
            key={`${n}-${i}-${m.t}`}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={cx(
              'w-fit max-w-[88%] rounded-3xl px-4 py-3 text-sm',
              m.who === 'u' ? 'mr-auto rounded-bl-md bg-[#050b17] text-fg' : 'ml-auto rounded-br-md bg-brand font-medium text-[#050b17]',
            )}
          >
            {m.t}
          </motion.div>
        ))}
        {typing && (
          <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={cx('flex w-fit gap-1 rounded-3xl px-4 py-3', CHAT[n % CHAT.length]?.who === 'u' ? 'mr-auto bg-[#050b17]' : 'ml-auto bg-brand')}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-current opacity-60" animate={{ y: [0, -4, 0] }} transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Pause / resume demo ──────────────────────────────────────────────── */

export function PauseDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(true);
  const [toast, setToast] = useState<{ id: number; on: boolean } | null>(null);
  useTicker(ref, 2600, () => {
    setOn((v) => {
      const next = !v;
      setToast({ id: Date.now(), on: next });
      return next;
    });
  });
  return (
    <div ref={ref} className={cx('w-full max-w-sm space-y-3', className)}>
      <div className="flex items-center justify-between rounded-2xl bg-[#050b17] px-4 py-3.5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-bold text-[#050b17]">L</span>
          <div>
            <div className="text-sm font-medium text-fg">Leo Live Delta</div>
            <div className={cx('flex items-center gap-1.5 text-[11px]', on ? 'text-up' : 'text-muted')}>
              <span className={cx('h-1.5 w-1.5 rounded-full', on ? 'animate-pulse bg-up' : 'bg-white/30')} />
              {on ? 'Copying live' : 'Paused'}
            </div>
          </div>
        </div>
        {/* toggle */}
        <button type="button" aria-pressed={on} onClick={() => { setOn(!on); setToast({ id: Date.now(), on: !on }); }} className={cx('relative h-8 w-14 rounded-full transition-colors', on ? 'bg-up' : 'bg-white/15')}>
          <motion.span layout transition={{ type: 'spring', stiffness: 500, damping: 32 }} className={cx('absolute top-1 h-6 w-6 rounded-full bg-white shadow', on ? 'left-7' : 'left-1')} />
        </button>
      </div>
      <div className="h-[64px]">
        <AnimatePresence mode="wait">
          {toast && (
            <motion.div key={toast.id} initial={{ y: 14, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-3 rounded-2xl bg-[#050b17] px-4 py-3">
              <span className={cx('grid h-9 w-9 place-items-center rounded-xl text-[#050b17]', toast.on ? 'bg-up' : 'bg-brand')}>{toast.on ? '▶' : '⏸'}</span>
              <div className="flex-1 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-fg">{toast.on ? 'Copying resumed' : 'Copying paused'}</span>
                  <span className="text-xs text-muted">just now</span>
                </div>
                <div className="text-xs text-muted">{toast.on ? 'Next fill will be mirrored' : 'Open positions stay untouched'}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Risk limits demo: animated sliders ───────────────────────────────── */

const RISK_STEPS = [
  { amount: 10, mult: 1, cap: 50 },
  { amount: 25, mult: 1.5, cap: 100 },
  { amount: 50, mult: 2, cap: 150 },
  { amount: 20, mult: 0.5, cap: 40 },
];

export function RiskDemo({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  useTicker(ref, 2000, () => setI((v) => (v + 1) % RISK_STEPS.length));
  const st = RISK_STEPS[i]!;
  const rows = [
    { k: 'Amount per copy', v: `$${st.amount}`, pct: st.amount / 60 },
    { k: 'Multiplier', v: `${st.mult}x`, pct: st.mult / 2.5 },
    { k: 'Daily loss cap', v: `$${st.cap}`, pct: st.cap / 180 },
  ];
  const risk = Math.round((st.amount * st.mult) / 1.2);
  return (
    <div ref={ref} className={cx('w-full max-w-sm rounded-2xl bg-[#050b17] p-4', className)}>
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.k}>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted">{r.k}</span>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span key={r.v} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} className="font-semibold tabular-nums text-fg">
                  {r.v}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="relative mt-2 h-2 rounded-full bg-white/10">
              <motion.div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand to-accent" animate={{ width: `${Math.min(100, r.pct * 100)}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
              <motion.span className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-brand bg-[#050b17]" animate={{ left: `calc(${Math.min(100, r.pct * 100)}% - 8px)` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[12px]">
        <span className="text-muted">Max risk per trade</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-up/15 px-2 py-0.5 font-semibold text-up">
          <span className="h-1.5 w-1.5 rounded-full bg-up" /> ${risk} · protected
        </span>
      </div>
    </div>
  );
}

/* ─── Fills marquee ────────────────────────────────────────────────────── */
const NAMES = ['Fay', 'Arjun', 'Riya', 'Kabir', 'Sana', 'Dev', 'Meera', 'Ishaan'];
const MARQUEE_SEED = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  sym: SYMBOLS[i % SYMBOLS.length]!,
  side: i % 3 === 0 ? 'Sell' : 'Buy',
  ms: 420 + (i * 137) % 500,
  who: NAMES[i % NAMES.length]!,
}));

export function FillsMarquee({ className }: { className?: string }) {
  const items = [...MARQUEE_SEED, ...MARQUEE_SEED];
  return (
    <div aria-hidden className={cx('group relative overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]', className)}>
      <div className="marquee-track slow gap-3 group-hover:[animation-play-state:paused]">
        {items.map((f, i) => (
          <span key={i} className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 text-[13px] text-muted">
            <span className={cx('h-1.5 w-1.5 rounded-full', f.side === 'Buy' ? 'bg-up' : 'bg-down')} />
            <span className="font-medium text-fg">{f.sym}</span> · {f.side} · mirrored in {(f.ms / 1000).toFixed(1)}s
            <span className="text-faint">→ {f.who}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Sticky CTA after the hero ────────────────────────────────────────── */
export function StickyCta({ href, label }: { href: string; label: string }) {
  const { scrollY } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => {
    const nearEnd = y + window.innerHeight > document.body.scrollHeight - 900;
    setShow(y > 700 && !nearEnd);
  });
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4 sm:inset-x-auto sm:right-6 sm:justify-end"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-accent py-2.5 pl-5 pr-2 text-sm font-semibold text-[#050b17] shadow-[0_18px_50px_rgba(0,176,255,0.45)]"
          >
            {label}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#050b17]">
              <ArrowRight className="h-4 w-4 text-white" />
            </span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
