'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, LinkButton, cx, fmtUsd } from './ui';
import { ChartIcon, BoltIcon } from './icons';

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

export function DashboardList({
  initial,
  todayCopies = 0,
}: {
  initial: FollowRow[];
  todayCopies?: number;
}) {
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
      const res = await fetch(`/api/follows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast.error('Could not update that copy. Please try again.');
      } else {
        toast.success(status === 'ACTIVE' ? 'Copying resumed.' : status === 'PAUSED' ? 'Copying paused.' : 'Copy stopped.');
      }
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-10">
            <EmptyState
              title="You're not following anyone yet"
              body="Browse the leaderboard, pick a verified trader, and start mirroring their trades."
              action={<LinkButton href="/leaders">Browse leaders</LinkButton>}
            />
          </div>
          <div
            className="relative min-h-56 overflow-hidden"
            style={{
              background:
                'radial-gradient(500px 280px at 60% 30%, rgba(0,176,255,0.15), transparent 55%), linear-gradient(160deg, #0a1e3a, #050b17)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/media/halo-object.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
          </div>
        </div>
      </div>
    );
  }

  const totalOpen = rows.reduce((s, r) => s + r.openPnl, 0);
  const totalRealized = rows.reduce((s, r) => s + r.realizedPnl, 0);
  const active = rows.filter((r) => r.status === 'ACTIVE').length;
  const openRisk = Math.abs(totalOpen);

  const summary = [
    { I: BoltIcon, label: "Today's copies", value: String(todayCopies), tone: null as boolean | null },
    { I: ChartIcon, label: 'Open risk (abs. P&L)', value: fmtUsd(openRisk), tone: null },
    { I: ChartIcon, label: 'Open P&L', value: fmtUsd(totalOpen), tone: totalOpen >= 0 },
    { I: ChartIcon, label: 'Realized P&L', value: fmtUsd(totalRealized), tone: totalRealized >= 0 },
    { I: BoltIcon, label: 'Active follows', value: String(active), tone: null },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {summary.map((c) => (
          <Card key={c.label}>
            <div className="mb-2 text-brand">
              <c.I width={18} height={18} />
            </div>
            <div className="text-xs text-muted">{c.label}</div>
            <div
              className={cx(
                'mt-0.5 text-xl font-bold tabular-nums',
                c.tone === true ? 'text-up' : c.tone === false ? 'text-down' : '',
              )}
            >
              {c.value}
            </div>
          </Card>
        ))}
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

              <div className="flex w-full flex-wrap items-center justify-between gap-4 sm:w-auto sm:flex-nowrap sm:justify-end sm:gap-6">
                <div className="flex items-center gap-5 sm:gap-6">
                  <div>
                    <div className="text-xs text-muted">Open</div>
                    <div className={cx('font-semibold tabular-nums', r.openPnl >= 0 ? 'text-up' : 'text-down')}>
                      {fmtUsd(r.openPnl)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Realized</div>
                    <div className={cx('font-semibold tabular-nums', r.realizedPnl >= 0 ? 'text-up' : 'text-down')}>
                      {fmtUsd(r.realizedPnl)}
                    </div>
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
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-faint">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" /> Live — updates stream in as trades copy
      </p>
    </div>
  );
}
