import { Card } from './ui';

export interface GeoPoint {
  lat: number;
  lng: number;
  city: string | null;
  country: string | null;
  count: number;
}

// Equirectangular projection into a 360×180 viewBox: x = lng+180, y = 90-lat.
const VB_W = 360;
const VB_H = 180;
const ACCENT = '#00b0ff';

function project(lat: number, lng: number): { x: number; y: number } {
  return { x: lng + 180, y: 90 - lat };
}

function radiusFor(count: number): number {
  return 2.2 + Math.min(6, Math.log2(count + 1) * 1.8);
}

/**
 * Admin user-location map. Plots real signup coordinates (geocoded from
 * city/postal at signup) as glowing points on a lavender equirectangular panel.
 * A world silhouette at /media/world-map.webp enhances it when present; without it
 * the graticule keeps the panel legible. Not a gimmick — every dot is real data.
 */
export function AdminUserMap({ points }: { points: GeoPoint[] }) {
  const totalMapped = points.reduce((s, p) => s + p.count, 0);
  const graticuleLng = [-120, -60, 0, 60, 120]; // vertical meridians
  const graticuleLat = [-60, -30, 0, 30, 60]; // horizontal parallels
  const top = points.slice(0, 6);

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h3 className="text-base font-semibold text-fg">Where your users are</h3>
          <p className="mt-0.5 text-sm text-muted">Geocoded from signup location.</p>
        </div>
        <span className="text-xs font-medium text-muted tabular-nums">
          {totalMapped} mapped · {points.length} {points.length === 1 ? 'area' : 'areas'}
        </span>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        {/* Map panel */}
        <div className="relative m-6 overflow-hidden rounded-2xl border border-border-soft">
          <div
            className="relative w-full"
            style={{
              paddingBottom: '50%',
              background:
                'radial-gradient(600px 320px at 60% 10%, rgba(0,176,255,0.12), transparent 60%), linear-gradient(160deg, #0a1e3a 0%, #08203f 60%, #050b17 100%)',
            }}
          >
            {/* Optional real-continents backdrop; degrades gracefully if absent. */}
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage: 'url("/media/world-map.webp")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <svg
              viewBox={`0 0 ${VB_W} ${VB_H}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              <defs>
                <radialGradient id="userGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                </radialGradient>
              </defs>
              {/* Graticule */}
              {graticuleLng.map((lng) => (
                <line key={`v${lng}`} x1={lng + 180} y1={0} x2={lng + 180} y2={VB_H} stroke="#7fd4ff" strokeOpacity="0.10" strokeWidth="0.5" />
              ))}
              {graticuleLat.map((lat) => (
                <line key={`h${lat}`} x1={0} y1={90 - lat} x2={VB_W} y2={90 - lat} stroke="#7fd4ff" strokeOpacity="0.10" strokeWidth="0.5" />
              ))}
              {/* Points: soft glow halo + solid core */}
              {points.map((p, i) => {
                const { x, y } = project(p.lat, p.lng);
                const r = radiusFor(p.count);
                const label = `${[p.city, p.country].filter(Boolean).join(', ') || 'Unknown'} · ${p.count} user${p.count === 1 ? '' : 's'}`;
                return (
                  <g key={i}>
                    <title>{label}</title>
                    <circle cx={x} cy={y} r={r * 2.4} fill="url(#userGlow)" />
                    <circle cx={x} cy={y} r={r} fill={ACCENT} stroke="#ffffff" strokeWidth="0.6" />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Top locations */}
        <div className="border-t border-border px-6 py-4 lg:border-l lg:border-t-0">
          <div className="mb-3 text-xs font-medium text-muted">Top locations</div>
          {top.length === 0 ? (
            <p className="text-sm text-muted">No geocoded users yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {top.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <span className="inline-flex items-center gap-2 truncate">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: ACCENT }} />
                    <span className="truncate text-fg">{[p.city, p.country].filter(Boolean).join(', ') || 'Unknown'}</span>
                  </span>
                  <span className="shrink-0 text-xs font-medium text-muted tabular-nums">{p.count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}
