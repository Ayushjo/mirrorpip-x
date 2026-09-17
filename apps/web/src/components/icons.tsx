import type { SVGProps } from 'react';

// Clean 1.6px line icons (currentColor). Keeps the UI crisp and non-boxy without
// pulling an icon dependency. 24x24 viewBox.
const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  ...props,
});

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3 4 6v6c0 4.5 3.2 7.3 8 9 4.8-1.7 8-4.5 8-9V6l-8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

export const BoltIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const SlidersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M1 14h6M9 8h6M17 16h6" />
  </svg>
);

export const LinkIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 15 15 9" />
    <path d="M11 6.5 13 4.5a4 4 0 0 1 6 6l-2 2" />
    <path d="M13 17.5 11 19.5a4 4 0 0 1-6-6l2-2" />
  </svg>
);

export const ChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20V4M4 20h16" />
    <path d="m7 15 3-4 3 3 4-6" />
  </svg>
);

export const UsersIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
    <path d="M16 5.5a3.2 3.2 0 0 1 0 6M17 20a5.5 5.5 0 0 0-3-4.9" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m5 12 4 4 10-10" />
  </svg>
);

export const ArrowRightIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Tiny inline sparkline from a series of 0..1 values.
export function Sparkline({
  points,
  width = 96,
  height = 28,
  className,
  stroke = 'currentColor',
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
  stroke?: string;
}) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const d = points
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${(i * step).toFixed(1)} ${(height - ((v - min) / range) * height).toFixed(1)}`)
    .join(' ');
  const areaD = `${d} L ${width} ${height} L 0 ${height} Z`;
  const id = `spark-${Math.round(points[0]! * 1000)}-${points.length}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} fill="none">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <path d={d} stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
