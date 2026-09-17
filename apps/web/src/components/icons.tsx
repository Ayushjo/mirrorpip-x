import type { ReactNode, SVGProps } from 'react';
import {
  ShieldCheck,
  Zap,
  SlidersHorizontal,
  Link2,
  TrendingUp,
  Users,
  Check,
  ArrowRight,
  type LucideProps,
} from 'lucide-react';

// lucide-react is the only icon library (per the design spec). We alias the
// names used across the app to lucide equivalents so pages need no changes.
const wrap =
  (Cmp: (p: LucideProps) => ReactNode) =>
  (p: LucideProps) =>
    <Cmp strokeWidth={1.75} {...p} />;

export const ShieldIcon = wrap(ShieldCheck);
export const BoltIcon = wrap(Zap);
export const SlidersIcon = wrap(SlidersHorizontal);
export const LinkIcon = wrap(Link2);
export const ChartIcon = wrap(TrendingUp);
export const UsersIcon = wrap(Users);
export const CheckIcon = wrap(Check);
export const ArrowRightIcon = wrap(ArrowRight);

// Brand mark — two interlocking rounded squares ("halo"). currentColor.
export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 256 256" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M 128.005 191.173 C 128.448 156.208 156.93 128 192 128 L 192 64 L 128 64 C 128 99.346 99.346 128 64 128 L 64 192 L 128 192 Z M 192 256 L 64 256 C 28.654 256 0 227.346 0 192 L 0 64 L 64 64 L 64 0 L 192 0 C 227.346 0 256 28.654 256 64 L 256 192 L 192 192 Z" />
    </svg>
  );
}

// Seamless infinite marquee. Renders `children` twice on one track.
export function Marquee({ children, slow, className }: { children: ReactNode; slow?: boolean; className?: string }) {
  return (
    <div className={`overflow-hidden ${className ?? ''}`}>
      <div className={`marquee-track ${slow ? 'slow' : ''}`}>
        <div className="flex items-center">{children}</div>
        <div className="flex items-center" aria-hidden>
          {children}
        </div>
      </div>
    </div>
  );
}

// Tiny inline sparkline from a series of numbers.
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
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${id})`} />
      <path d={d} stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
