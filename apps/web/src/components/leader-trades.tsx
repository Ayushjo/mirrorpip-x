'use client';

import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge, Card, EmptyBlock, cx, fmtNum } from './ui';
import { Activity, Inbox } from 'lucide-react';
import { BarChart } from './charts';
import { Reveal } from './reveal';

export type LeaderTrade = {
  id: string;
  symbol: string;
  side: string;
  qty: number;
  price: number;
  reduceOnly: boolean;
  at: string | null;
};

type Side = 'all' | 'BUY' | 'SELL';
const PAGE = 8;

function fmtWhen(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

/** Trade activity + a bounded, expandable fills list. Works for 5 or 5,000 rows. */
export function LeaderTrades({ trades }: { trades: LeaderTrade[] }) {
  const [side, setSide] = useState<Side>('all');
  const [shown, setShown] = useState(PAGE);

  const filtered = useMemo(() => (side === 'all' ? trades : trades.filter((t) => t.side === side)), [trades, side]);
  const visible = filtered.slice(0, shown);
  const remaining = filtered.length - visible.length;

  const activity = useMemo(() => {
    const days: { key: string; label: string; count: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      days.push({ key: d.toDateString(), label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), count: 0 });
    }
    for (const t of trades) {
      if (!t.at) continue;
      const k = new Date(t.at).toDateString();
      const day = days.find((x) => x.key === k);
      if (day) day.count += 1;
    }
    return days.map((d) => ({ label: d.label, value: d.count, sub: `fills · ${d.label}` }));
  }, [trades]);

  const buys = trades.filter((t) => t.side === 'BUY').length;
  const sells = trades.length - buys;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* activity */}
      <Reveal className="lg:col-span-1">
        <Card className="flex h-full flex-col">
          <div className="mb-4">
            <h2 className="text-base font-semibold">Trade activity</h2>
            <p className="text-xs text-muted">Fills per day · last 14 days</p>
          </div>
          {trades.length > 0 ? (
            <BarChart data={activity} height={150} />
          ) : (
            <EmptyBlock className="h-[150px] !py-4" icon={<Activity className="h-5 w-5" />} title="No activity in the last 14 days" />
          )}
          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border-soft pt-4">
            <div>
              <div className="text-xs text-muted">Buys</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-up">{buys}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Sells</div>
              <div className="mt-0.5 text-lg font-semibold tabular-nums text-down">{sells}</div>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* fills */}
      <Reveal delay={0.08} className="lg:col-span-2">
        <Card className="h-full p-0">
          <div className="flex flex-col gap-3 p-5 pb-4 sm:flex-row sm:items-center sm:justify-between sm:p-6 sm:pb-4">
            <div>
              <h2 className="text-base font-semibold">Recent fills</h2>
              <p className="text-xs text-muted">
                {filtered.length === 0 ? 'Nothing captured yet' : `Showing ${visible.length} of ${filtered.length}`}
              </p>
            </div>
            <div className="flex w-fit rounded-full border border-border bg-surface-2 p-0.5 text-xs">
              {(['all', 'BUY', 'SELL'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSide(s);
                    setShown(PAGE);
                  }}
                  className={cx(
                    'rounded-full px-3 py-1 font-medium transition-colors',
                    side === s ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg',
                  )}
                >
                  {s === 'all' ? 'All' : s === 'BUY' ? 'Buys' : 'Sells'}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <EmptyBlock
                icon={<Inbox className="h-5 w-5" />}
                title={trades.length === 0 ? 'No fills captured yet' : `No ${side === 'BUY' ? 'buys' : 'sells'} in the latest fills`}
                body={trades.length === 0 ? 'Fills appear here the moment this leader trades. Follow now to mirror them from the first one.' : 'Try the other side, or All.'}
              />
            </div>
          ) : (
            <>
              {/* mobile rows */}
              <ul className="divide-y divide-border-soft border-t border-border-soft sm:hidden">
                {visible.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className={cx(
                        'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold',
                        t.side === 'BUY' ? 'bg-up/15 text-up' : 'bg-down/15 text-down',
                      )}
                    >
                      {t.side === 'BUY' ? 'B' : 'S'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-fg">
                        {t.symbol}
                        {t.reduceOnly && <span className="text-[10px] font-semibold uppercase text-faint">close</span>}
                      </div>
                      <div className="text-[11px] text-muted">{fmtWhen(t.at)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium tabular-nums text-fg">{fmtNum(t.price, 2)}</div>
                      <div className="text-[11px] tabular-nums text-muted">qty {fmtNum(t.qty)}</div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* desktop table */}
              <div className="hidden px-6 sm:block">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted">
                    <tr className="border-b border-border-soft">
                      <th className="pb-2 font-medium">Time</th>
                      <th className="pb-2 font-medium">Symbol</th>
                      <th className="pb-2 font-medium">Side</th>
                      <th className="pb-2 text-right font-medium">Qty</th>
                      <th className="pb-2 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((t) => (
                      <tr key={t.id} className="border-b border-border-soft transition-colors last:border-0 hover:bg-surface-2/50">
                        <td className="whitespace-nowrap py-2.5 text-muted">{fmtWhen(t.at)}</td>
                        <td className="py-2.5 font-medium">{t.symbol}</td>
                        <td className="py-2.5">
                          <Badge tone={t.side === 'BUY' ? 'up' : 'down'}>
                            {t.reduceOnly ? 'CLOSE ' : ''}
                            {t.side}
                          </Badge>
                        </td>
                        <td className="py-2.5 text-right tabular-nums">{fmtNum(t.qty)}</td>
                        <td className="py-2.5 text-right tabular-nums">{fmtNum(t.price, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-center gap-3 border-t border-border-soft px-5 py-3 sm:px-6">
                {remaining > 0 ? (
                  <button
                    type="button"
                    onClick={() => setShown((n) => n + PAGE)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-brand transition-colors hover:bg-brand/10"
                  >
                    Show {Math.min(PAGE, remaining)} more
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="text-xs text-faint">That&apos;s everything captured so far</span>
                )}
                {shown > PAGE && (
                  <button
                    type="button"
                    onClick={() => setShown(PAGE)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg"
                  >
                    Collapse
                  </button>
                )}
              </div>
            </>
          )}
        </Card>
      </Reveal>
    </div>
  );
}
