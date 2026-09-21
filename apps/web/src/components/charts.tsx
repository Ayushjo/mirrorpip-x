'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useMemo, useRef, useState } from 'react';
import { cx, fmtUsd } from './ui';

// ─── Lightweight, in-theme SVG charts with tasteful motion ──────────────────
// No chart library: responsive SVG (viewBox + w-full), brand colors, framer-
// motion draw-in, and a hover tooltip positioned in percentage space so it
// tracks the scaled SVG. All guard empty/'<2 point' data gracefully.

function ChartEmpty({ height, label }: { height: number; label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-2xl border border-dashed border-border text-xs text-faint"
      style={{ height }}
    >
      {label}
    </div>
  );
}

const EASE = [0.22, 1, 0.36, 1] as const;

/** Cumulative P&L / equity-style area chart. Colors by overall direction. */
export function AreaChart({
  data,
  height = 200,
  valueFormat = (v: number) => fmtUsd(v),
  emptyLabel = 'P&L chart appears once trades close',
  zeroBaseline = true,
  className,
}: {
  data: { label?: string; value: number }[];
  height?: number;
  valueFormat?: (v: number) => string;
  emptyLabel?: string;
  // true (P&L): anchor the fill to $0. false (equity): auto-scale to show shape.
  zeroBaseline?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8%' });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);

  const W = 760;
  const H = height;
  const pad = 10;

  const geo = useMemo(() => {
    if (data.length < 2) return null;
    const values = data.map((d) => d.value);
    const dataMin = Math.min(...values);
    const dataMax = Math.max(...values);
    let min: number;
    let max: number;
    if (zeroBaseline) {
      min = Math.min(dataMin, 0);
      max = Math.max(dataMax, 0);
    } else {
      // auto-scale with a little headroom so a near-flat curve still shows shape
      const padY = (dataMax - dataMin) * 0.12 || Math.abs(dataMax) * 0.05 || 1;
      min = dataMin - padY;
      max = dataMax + padY;
    }
    const range = max - min || 1;
    const x = (i: number) => pad + (i / (data.length - 1)) * (W - 2 * pad);
    const y = (v: number) => pad + (1 - (v - min) / range) * (H - 2 * pad);
    const line = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(2)} ${y(d.value).toFixed(2)}`).join(' ');
    const area = `${line} L ${x(data.length - 1).toFixed(2)} ${(H - pad).toFixed(2)} L ${x(0).toFixed(2)} ${(H - pad).toFixed(2)} Z`;
    const showZero = min <= 0 && max >= 0;
    const zeroY = y(0);
    const up = values[values.length - 1]! >= (values[0] ?? 0);
    return { x, y, line, area, zeroY, showZero, up, min, max };
  }, [data, H, zeroBaseline]);

  if (!geo) return <ChartEmpty height={H} label={emptyLabel} />;

  const color = geo.up ? 'var(--color-up)' : 'var(--color-down)';
  const gid = `area-grad-${geo.up ? 'u' : 'd'}`;

  const hx = hover !== null ? (geo.x(hover) / W) * 100 : 0;
  const hy = hover !== null ? (geo.y(data[hover]!.value) / H) * 100 : 0;

  return (
    <div ref={ref} className={cx('relative w-full', className)} style={{ height: H }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* zero baseline (only when 0 is within range) */}
        {geo.showZero && (
          <line x1={0} x2={W} y1={geo.zeroY} y2={geo.zeroY} stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        )}
        <motion.path
          d={geo.area}
          fill={`url(#${gid})`}
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: reduce ? 0 : 0.8, delay: 0.2 }}
        />
        <motion.path
          d={geo.line}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : {}}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
        />
        {hover !== null && (
          <line x1={geo.x(hover)} x2={geo.x(hover)} y1={0} y2={H} stroke={color} strokeWidth="1" strokeOpacity="0.35" vectorEffect="non-scaling-stroke" />
        )}
      </svg>
      {/* hover surface + tooltip + dot in percentage space so they track the scaled svg */}
      <div
        className="absolute inset-0"
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const frac = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
          setHover(Math.round(frac * (data.length - 1)));
        }}
      />
      {hover !== null && (
        <>
          <div
            className="pointer-events-none absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface"
            style={{ left: `${hx}%`, top: `${hy}%`, background: color }}
          />
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+8px)] whitespace-nowrap rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${Math.min(92, Math.max(8, hx))}%`, top: `${hy}%` }}
          >
            <div className="font-semibold tabular-nums" style={{ color }}>
              {valueFormat(data[hover]!.value)}
            </div>
            {data[hover]!.label && <div className="text-faint">{data[hover]!.label}</div>}
          </div>
        </>
      )}
    </div>
  );
}

/** Activity bar chart (e.g. copies per day). Bars grow in, hover shows count. */
export function BarChart({
  data,
  height = 140,
  className,
}: {
  data: { label: string; value: number; sub?: string }[];
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8%' });
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) return <ChartEmpty height={height} label="No activity yet" />;

  return (
    <div ref={ref} className={cx('relative', className)}>
      <div className="flex items-end gap-1.5" style={{ height }}>
        {data.map((d, i) => {
          const h = d.value === 0 ? 2 : Math.max(4, (d.value / max) * (height - 8));
          const active = hover === i;
          return (
            <div
              key={i}
              className="group relative flex flex-1 items-end justify-center"
              style={{ height }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((v) => (v === i ? null : v))}
            >
              <motion.div
                className={cx('w-full max-w-[22px] rounded-t-[5px] transition-colors', active ? 'bg-brand' : 'bg-brand/30')}
                style={{ height: h, transformOrigin: 'bottom' }}
                initial={{ scaleY: 0 }}
                animate={inView ? { scaleY: 1 } : {}}
                transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : i * 0.03, ease: EASE }}
              />
              {active && (
                <div className="pointer-events-none absolute bottom-full z-10 mb-1.5 -translate-x-0 whitespace-nowrap rounded-lg border border-border bg-surface px-2 py-1 text-xs shadow-lg">
                  <span className="font-semibold tabular-nums">{d.value}</span>{' '}
                  <span className="text-faint">{d.sub ?? d.label}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Win-rate ring — animated sweep with the % in the center. */
export function Ring({
  pct,
  size = 108,
  label,
  sublabel,
}: {
  pct: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8%' });
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const color = clamped >= 50 ? 'var(--color-up)' : clamped > 0 ? 'var(--color-warn)' : 'var(--color-faint)';

  return (
    <div ref={ref} className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="9" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={inView ? { strokeDashoffset: c - (clamped / 100) * c } : {}}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
        />
      </svg>
      <div className="absolute grid place-items-center text-center">
        <div className="text-xl font-semibold tabular-nums" style={{ color }}>
          {clamped.toFixed(0)}%
        </div>
        {label && <div className="text-[11px] text-muted">{label}</div>}
        {sublabel && <div className="text-[10px] text-faint">{sublabel}</div>}
      </div>
    </div>
  );
}
