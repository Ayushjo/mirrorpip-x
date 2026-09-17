import type { ReactNode } from 'react';
import { cx } from './ui';

// Decorative banner: a lavender gradient base with an optional media image
// layered on top. If the image file is missing it simply 404s and the gradient
// shows — graceful, no broken-image icon (that's why it's a background-image,
// not an <img>). A left-weighted scrim keeps overlaid black text readable.
export const LAVENDER_GRADIENT =
  'radial-gradient(900px 380px at 82% -10%, rgba(43,38,68,0.14), transparent 60%), linear-gradient(160deg, #ecebf4 0%, #f2f0f8 52%, #f5f5f5 100%)';

export function MediaBanner({
  src,
  position = 'center',
  gradient = LAVENDER_GRADIENT,
  className,
  children,
}: {
  src: string;
  position?: string;
  gradient?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cx('relative overflow-hidden rounded-3xl border border-border', className)}
      style={{ background: gradient }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: `url("${src}")`, backgroundSize: 'cover', backgroundPosition: position }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgba(245,245,245,0.92) 0%, rgba(245,245,245,0.5) 46%, rgba(245,245,245,0.06) 78%)',
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
