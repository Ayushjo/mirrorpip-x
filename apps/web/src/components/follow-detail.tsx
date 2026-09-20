'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge, Card, cx, fmtNum, fmtUsd } from './ui';

interface Position {
  id: string;
  symbol: string;
  side: string;
  qty: number;
  avgEntry: number;
  markPrice: number | null;
  unrealizedPnl: number;
  realizedPnl: number;
  closedAt: string | null;
}
interface Order {
  id: string;
  symbol: string;
  side: string;
  qty: number;
  status: string;
  filledQty: number;
  avgPrice: number | null;
  slippageBps: number | null;
  error: string | null;
  at: string | null;
}
interface Detail {
  id: string;
  status: string;
  leader: { displayName: string };
  account: { label: string; keyLast4: string };
  positions: Position[];
  orders: Order[];
}

const orderTone: Record<string, 'up' | 'down' | 'warn' | 'neutral'> = {
  FILLED: 'up',
  PARTIAL: 'warn',
  PENDING: 'neutral',
  SUBMITTED: 'neutral',
  REJECTED: 'down',
  SKIPPED: 'warn',
};

export function FollowDetail({ initial }: { initial: Detail }) {
  const [d, setD] = useState<Detail>(initial);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/follows/${initial.id}`);
    if (res.ok) setD((await res.json()).data);
  }, [initial.id]);

  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    try {
      es = new EventSource(`/api/follows/${initial.id}/stream`);
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (d && d.id) setD(d);
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        es?.close();
        if (!poll) poll = setInterval(refresh, 4000);
      };
    } catch {
      poll = setInterval(refresh, 4000);
    }
    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [refresh, initial.id]);

  const openPositions = d.positions.filter((p) => !p.closedAt);

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 text-base font-semibold">Open positions</h2>
        {openPositions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No open positions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border-soft">
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Entry</th>
                  <th className="pb-2 text-right font-medium">Mark</th>
                  <th className="pb-2 text-right font-medium">Unrealized</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map((p) => (
                  <tr key={p.id} className="border-b border-border-soft last:border-0">
                    <td className="py-2.5 font-medium">{p.symbol}</td>
                    <td className="py-2.5">
                      <Badge tone={p.side === 'LONG' ? 'up' : 'down'}>{p.side}</Badge>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{fmtNum(p.qty)}</td>
                    <td className="py-2.5 text-right tabular-nums">{fmtNum(p.avgEntry, 2)}</td>
                    <td className="py-2.5 text-right tabular-nums">{p.markPrice != null ? fmtNum(p.markPrice, 2) : '—'}</td>
                    <td className={cx('py-2.5 text-right font-medium tabular-nums', p.unrealizedPnl >= 0 ? 'text-up' : 'text-down')}>
                      {fmtUsd(p.unrealizedPnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="mb-4 text-base font-semibold">Copy order log</h2>
        {d.orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No copy orders yet. They appear when your leader trades.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted">
                <tr className="border-b border-border-soft">
                  <th className="pb-2 font-medium">Time</th>
                  <th className="pb-2 font-medium">Symbol</th>
                  <th className="pb-2 font-medium">Side</th>
                  <th className="pb-2 text-right font-medium">Qty</th>
                  <th className="pb-2 text-right font-medium">Fill</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {d.orders.map((o) => (
                  <tr key={o.id} className="border-b border-border-soft last:border-0">
                    <td className="py-2.5 text-muted" suppressHydrationWarning>{o.at ? new Date(o.at).toLocaleTimeString() : '—'}</td>
                    <td className="py-2.5 font-medium">{o.symbol}</td>
                    <td className="py-2.5">
                      <Badge tone={o.side === 'BUY' ? 'up' : 'down'}>{o.side}</Badge>
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{fmtNum(o.qty)}</td>
                    <td className="py-2.5 text-right tabular-nums">{o.avgPrice != null ? fmtNum(o.avgPrice, 2) : '—'}</td>
                    <td className="py-2.5">
                      <Badge tone={orderTone[o.status] ?? 'neutral'}>{o.status}</Badge>
                      {o.error && <span className="ml-2 text-xs text-faint" title={o.error}>ⓘ</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
