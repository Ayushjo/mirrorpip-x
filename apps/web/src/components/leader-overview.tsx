'use client';

import { Badge, Card, EmptyBlock, cx, fmtPct, fmtUsd } from './ui';
import { UsersIcon, SlidersIcon, BoltIcon, ChartIcon } from './icons';
import { AreaChart, Ring } from './charts';
import { CountUp } from './count-up';
import { Reveal } from './reveal';

type Stats = {
  roiPct: number;
  winRatePct: number;
  maxDrawdownPct: number;
  totalCopiedUsd: number;
  tradeCount: number;
  followerCount: number;
};

/** Stat tiles + equity curve + win-rate ring, in the dashboard's visual system. */
export function LeaderOverview({ stats: s, equity, hasShape }: { stats: Stats; equity: number[]; hasShape: boolean }) {
  const tiles: Array<{ I: typeof ChartIcon; label: string; value: React.ReactNode; tone?: 'up' | 'down'; delay: number }> = [
    { I: ChartIcon, label: 'All-time ROI', value: s.roiPct === 0 ? '—' : fmtPct(s.roiPct), tone: s.roiPct > 0 ? 'up' : s.roiPct < 0 ? 'down' : undefined, delay: 0 },
    { I: BoltIcon, label: 'Win rate', value: <CountUp value={s.winRatePct} format={(n) => `${n.toFixed(1)}%`} />, delay: 0.05 },
    { I: SlidersIcon, label: 'Max drawdown', value: s.maxDrawdownPct === 0 ? '—' : `-${s.maxDrawdownPct.toFixed(1)}%`, tone: s.maxDrawdownPct > 0 ? 'down' : undefined, delay: 0.1 },
    { I: ChartIcon, label: 'Trades', value: <CountUp value={s.tradeCount} format={(n) => String(Math.round(n))} />, delay: 0.15 },
    { I: UsersIcon, label: 'Followers', value: <CountUp value={s.followerCount} format={(n) => String(Math.round(n))} />, delay: 0.2 },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {tiles.map((t, i) => (
          <Reveal key={t.label} delay={t.delay} className={cx(i === 0 && 'col-span-2 sm:col-span-1')}>
            <div className="card-surface card-surface-hover group h-full rounded-2xl p-4 sm:p-5">
              <div className="mb-2 text-brand transition-transform duration-300 group-hover:scale-110">
                <t.I width={18} height={18} />
              </div>
              <div className="text-xs text-muted">{t.label}</div>
              <div className={cx('mt-0.5 text-xl font-semibold tabular-nums sm:text-2xl', t.tone === 'up' && 'text-up', t.tone === 'down' && 'text-down')}>
                {t.value}
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2">
          <Card className="h-full">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Equity curve</h2>
                <p className="text-xs text-muted">Cumulative performance, all time</p>
              </div>
              {s.roiPct !== 0 && <Badge tone={s.roiPct > 0 ? 'up' : 'down'}>{fmtPct(s.roiPct)}</Badge>}
            </div>
            {hasShape ? (
              <AreaChart data={equity.map((v) => ({ value: v }))} height={200} zeroBaseline={false} valueFormat={(v) => fmtUsd(v, 0)} />
            ) : (
              <EmptyBlock
                className="h-[200px]"
                icon={<ChartIcon width={22} height={22} />}
                title="Equity curve builds as this leader trades"
                body="Samples are recorded on every sync. The first few fills will draw the line here."
              />
            )}
          </Card>
        </Reveal>
        <Reveal delay={0.1}>
          <Card className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <h2 className="text-base font-semibold">Win rate</h2>
            {s.tradeCount > 0 ? (
              <Ring pct={s.winRatePct} label="of closed trades" />
            ) : (
              <div className="grid h-[108px] w-[108px] place-items-center rounded-full border-[9px] border-dashed border-white/10 text-xs text-muted">No trades yet</div>
            )}
            <div className="flex gap-6 text-sm">
              <div>
                <div className="font-semibold tabular-nums">{s.tradeCount}</div>
                <div className="text-xs text-muted">trades</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums">{fmtUsd(s.totalCopiedUsd, 0)}</div>
                <div className="text-xs text-muted">copied</div>
              </div>
              <div>
                <div className="font-semibold tabular-nums">{s.followerCount}</div>
                <div className="text-xs text-muted">followers</div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </>
  );
}
