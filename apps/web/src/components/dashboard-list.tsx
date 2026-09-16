'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, EmptyState, LinkButton, cx, fmtUsd } from './ui';

interface FollowRow {
  id: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  sizingMode: string;
  sizingValue: number;
  account: { label: string; keyLast4: string };
  leader: { id: string; displayName: string };
  openPnl: number;
  realizedPnl: number;
}

const statusTone = { ACTIVE: 'up', PAUSED: 'warn', STOPPED: 'down' } as const;

export function DashboardList({ initial }: { initial: FollowRow[] }) {
  const [rows, setRows] = useState<FollowRow[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/follows');
    if (res.ok) setRows((await res.json()).data);
  }, []);

  useEffect(() => {
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    try {
      es = new EventSource('/api/follows/stream');
      es.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (Array.isArray(d)) setRows(d);
        } catch {
          /* ignore */
        }
      };
      es.onerror = () => {
        es?.close();
        if (!poll) poll = setInterval(refresh, 5000);
      };
    } catch {
      poll = setInterval(refresh, 5000);
    }
    return () => {
      es?.close();
      if (poll) clearInterval(poll);
    };
  }, [refresh]);

  async function setStatus(id: string, status: 'ACTIVE' | 'PAUSED' | 'STOPPED') {
    setBusyId(id);
    try {
      await fetch(`/api/follows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="You're not following anyone yet"
        body="Browse the leaderboard, pick a verified trader, and start mirroring their trades."
        action={<LinkButton href="/leaders">Browse leaders</LinkButton>}
      />
    );
  }

  const totalOpen = rows.reduce((s, r) => s + r.openPnl, 0);
  const totalRealized = rows.reduce((s, r) => s + r.realizedPnl, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs text-muted">Open P&L (unrealized)</div>
          <div className={cx('mt-1 text-xl font-bold tabular-nums', totalOpen >= 0 ? 'text-up' : 'text-down')}>
            {fmtUsd(totalOpen)}
          </div>
        </Card>
        <Card>
          <div className="text-xs text-muted">Realized P&L</div>
          <div className={cx('mt-1 text-xl font-bold tabular-nums', totalRealized >= 0 ? 'text-up' : 'text-down')}>
            {fmtUsd(totalRealized)}
          </div>
        </Card>
        <Card className="hidden sm:block">
          <div className="text-xs text-muted">Active follows</div>
          <div className="mt-1 text-xl font-bold tabular-nums">{rows.filter((r) => r.status === 'ACTIVE').length}</div>
        </Card>
      </div>

      <div className="space-y-3">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 font-semibold">
                  {r.leader.displayName.slice(0, 1)}
                </div>
                <div>
                  <Link href={`/dashboard/${r.id}`} className="font-semibold hover:text-brand">
                    {r.leader.displayName}
                  </Link>
                  <div className="text-xs text-faint">
                    {r.account.label} · {r.sizingMode.toLowerCase()} ×{r.sizingValue}
                  </div>
                </div>
                <Badge tone={statusTone[r.status]}>{r.status}</Badge>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-muted">Open</div>
                  <div className={cx('font-semibold tabular-nums', r.openPnl >= 0 ? 'text-up' : 'text-down')}>
                    {fmtUsd(r.openPnl)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">Realized</div>
                  <div className={cx('font-semibold tabular-nums', r.realizedPnl >= 0 ? 'text-up' : 'text-down')}>
                    {fmtUsd(r.realizedPnl)}
                  </div>
                </div>

                <div className="flex gap-2">
                  {r.status === 'ACTIVE' ? (
                    <Button variant="subtle" onClick={() => setStatus(r.id, 'PAUSED')} disabled={busyId === r.id}>
                      Pause
                    </Button>
                  ) : (
                    <Button variant="subtle" onClick={() => setStatus(r.id, 'ACTIVE')} disabled={busyId === r.id}>
                      Resume
                    </Button>
                  )}
                  <Button variant="ghost" onClick={() => setStatus(r.id, 'STOPPED')} disabled={busyId === r.id}>
                    Stop
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <p className="text-center text-xs text-faint">Live P&L refreshes every few seconds.</p>
    </div>
  );
}
