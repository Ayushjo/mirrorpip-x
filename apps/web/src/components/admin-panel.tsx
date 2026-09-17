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
  const [confirmKill, setConfirmKill] = useState(false);

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
      setConfirmKill(false);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className={cx('flex flex-wrap items-center justify-between gap-4', kill && 'border-down')}>
        <div>
          <div className="flex items-center gap-2 font-semibold">
            Global kill-switch {kill ? <Badge tone="down">ENGAGED</Badge> : <Badge tone="up">Off</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            When engaged, the engine halts all new copy orders immediately across every follower.
          </p>
          {confirmKill && (
            <p className="mt-2 text-sm text-down">
              {kill
                ? 'Resume copying for everyone?'
                : 'This will stop every new copy order until you turn it off. Continue?'}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {confirmKill ? (
            <>
              <Button variant="ghost" onClick={() => setConfirmKill(false)} disabled={busy === 'kill'}>
                Cancel
              </Button>
              <Button variant={kill ? 'primary' : 'danger'} onClick={toggleKill} disabled={busy === 'kill'}>
                {kill ? 'Yes, resume' : 'Yes, halt everything'}
              </Button>
            </>
          ) : (
            <Button variant={kill ? 'primary' : 'danger'} onClick={() => setConfirmKill(true)} disabled={busy === 'kill'}>
              {kill ? 'Resume copying' : 'Halt everything'}
            </Button>
          )}
        </div>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold">Leaders</h2>
        {leaders.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted">
            No leader applications yet. Users apply from their Accounts page.
          </Card>
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full text-sm">
              <thead className="border-b border-border-soft text-left text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Leader</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Account</th>
                  <th className="px-4 py-3 text-right font-medium">Followers</th>
                  <th className="px-4 py-3 text-right font-medium">Trades</th>
                  <th className="px-4 py-3 text-right font-medium">Copied</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((l) => (
                  <tr key={l.id} className="border-b border-border-soft last:border-0">
                    <td className="px-4 py-3">
                      <div className="font-medium">{l.displayName}</div>
                      {l.bio && <div className="mt-0.5 max-w-xs truncate text-xs text-faint">{l.bio}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[l.status] ?? 'neutral'}>{l.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {l.account.label} ••••{l.account.keyLast4}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.stats.followerCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{l.stats.tradeCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fmtUsd(l.stats.totalCopiedUsd, 0)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {l.status !== 'VERIFIED' && (
                          <Button onClick={() => setStatus(l.id, 'VERIFIED')} disabled={busy === l.id} className="!px-2.5 !py-1 text-xs">
                            Verify
                          </Button>
                        )}
                        {l.status === 'VERIFIED' && (
                          <Button
                            variant="subtle"
                            onClick={() => setStatus(l.id, 'PAUSED')}
                            disabled={busy === l.id}
                            className="!px-2.5 !py-1 text-xs"
                          >
                            Pause
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          onClick={() => setStatus(l.id, 'DELISTED')}
                          disabled={busy === l.id}
                          className="!px-2.5 !py-1 text-xs"
                        >
                          Delist
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
