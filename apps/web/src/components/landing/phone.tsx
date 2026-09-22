import { cx } from '../ui';

/** CSS phone mockup showing a leader being copied. Pure markup + SVG, no images. */
export function Phone({ className }: { className?: string }) {
  const pts = [22, 30, 26, 38, 34, 46, 41, 52, 48, 60, 55, 66, 62, 72, 70, 78];
  const w = 260;
  const h = 120;
  const step = w / (pts.length - 1);
  const d = pts.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${h - (v / 100) * h}`).join(' ');
  return (
    <div className={cx('relative mx-auto w-[280px] sm:w-[320px]', className)}>
      <div className="rounded-[3rem] border border-white/10 bg-[#0b1a33] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.6)]">
        <div className="overflow-hidden rounded-[2.5rem] bg-[#050b17]">
          {/* status bar */}
          <div className="flex items-center justify-between px-6 pt-4 text-[10px] text-muted">
            <span>9:41</span>
            <span className="h-1.5 w-16 rounded-full bg-white/10" />
            <span>●●●</span>
          </div>
          {/* header */}
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
          {/* equity */}
          <div className="px-5 pt-4">
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Your equity</div>
            <div className="mt-0.5 text-[26px] font-semibold leading-none text-fg" style={{ letterSpacing: '-0.03em' }}>
              $12,480<span className="text-muted">.50</span>
            </div>
            <div className="mt-1 text-[11px] font-medium text-up">+4.2% this week</div>
          </div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-28 w-full" fill="none">
            <defs>
              <linearGradient id="ph-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#00b0ff" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#00b0ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${d} L ${w} ${h} L 0 ${h} Z`} fill="url(#ph-g)" />
            <path d={d} stroke="#00b0ff" strokeWidth="2" strokeLinecap="round" />
            <circle cx={w} cy={h - (pts[pts.length - 1]! / 100) * h} r="3.5" fill="#00b0ff" />
          </svg>
          {/* mirrored fill */}
          <div className="mx-4 mb-4 rounded-2xl bg-[#0b1a33] p-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-fg">BTCUSD · Buy</span>
              <span className="text-muted">0.8s ago</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              <span className="text-muted">Leader 1.0 → You 0.25</span>
              <span className="rounded-full bg-up/15 px-2 py-0.5 font-semibold text-up">Filled</span>
            </div>
          </div>
          {/* tab bar */}
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
