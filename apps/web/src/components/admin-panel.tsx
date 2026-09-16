'use client';

import { useCallback, useState } from 'react';
import { Badge, Button, Card, cx, fmtUsd } from './ui';

interface AdminLeader {
  id: string;
  displayName: string;
  bio: string | null;
  status: string;
  account: { label: string; keyLast4: string };
  stats: { followerCount: number; tradeCount: number; totalCopiedUsd: number; winRatePct: number };
}

const statusTone: Record<string, 'up' | 'warn' | 'down' | 'neutral'> = {
  VERIFIED: 'up',
  PENDING: 'warn',
  PAUSED: 'neutral',
  DELISTED: 'down',
};

export function AdminPanel({ initialLeaders, initialKill }: { initialLeaders: AdminLeader[]; initialKill: boolean }) {
  const [leaders, setLeaders] = useState(initialLeaders);
  const [kill, setKill] = useState(initialKill);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/leaders');
    if (res.ok) setLeaders((await res.json()).data);
  }, []);

  async function setStatus(id: string, status: string) {
    setBusy(id);
    try {
      await fetch(`/api/admin/leaders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  async function toggleKill() {
    setBusy('kill');
    try {
      const res = await fetch('/api/admin/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !kill }),
      });
      if (res.ok) setKill((await res.json()).data.enabled);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className={cx('flex items-center justify-between', kill && 'border-down')}>
        <div>
          <div className="flex items-center gap-2 font-semibold">
            Global kill-switch {kill ? <Badge tone="down">ENGAGED</Badge> : <Badge tone="up">Off</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            When engaged, the engine halts all new copy orders immediately across every follower.
          </p>
        </div>
        <Button variant={kill ? 'primary' : 'danger'} onClick={toggleKill} disabled={busy === 'kill'}>
          {kill ? 'Resume copying' : 'Halt everything'}
        </Button>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Leaders</h2>
        {leaders.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted">
            No leader applications yet. Users apply from their Accounts page.
          </Card>
        ) : (
          <div className="space-y-3">
            {leaders.map((l) => (
              <Card key={l.id}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{l.displayName}</span>
                      <Badge tone={statusTone[l.status] ?? 'neutral'}>{l.status}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-faint">
                      {l.account.label} ••••{l.account.keyLast4} · {l.stats.followerCount} followers · {l.stats.tradeCount} trades ·{' '}
                      {fmtUsd(l.stats.totalCopiedUsd, 0)} copied
                    </div>
                    {l.bio && <p className="mt-2 max-w-xl text-sm text-muted">{l.bio}</p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {l.status !== 'VERIFIED' && (
                      <Button onClick={() => setStatus(l.id, 'VERIFIED')} disabled={busy === l.id}>
                        Verify
                      </Button>
                    )}
                    {l.status === 'VERIFIED' && (
                      <Button variant="subtle" onClick={() => setStatus(l.id, 'PAUSED')} disabled={busy === l.id}>
                        Pause
                      </Button>
                    )}
                    <Button variant="ghost" onClick={() => setStatus(l.id, 'DELISTED')} disabled={busy === l.id}>
                      Delist
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
