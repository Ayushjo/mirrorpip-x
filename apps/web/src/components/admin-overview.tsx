'use client';

import { useState } from 'react';
import { Badge, Button, Card, Input } from './ui';

export interface OverviewData {
  totals: {
    users: number;
    verifiedUsers: number;
    signups7d: number;
    signups30d: number;
    pendingLeaders: number;
    verifiedLeaders: number;
    activeFollows: number;
    credentialsTotal: number;
    credentialsInvalid: number;
  };
  activity: { dau: number; wau: number; sessionsToday: number; copies24h: number; copiesFailed24h: number };
  maintenance: { enabled: boolean; message: string };
  betaMode: boolean;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    country: string | null;
    city: string | null;
    intendedRole: string | null;
    emailVerified: boolean;
    createdAt: string;
  }>;
  recentAudit: Array<{ id: string; action: string; actorEmail: string; targetType: string | null; createdAt: string }>;
}

export function AdminOverview({ initial }: { initial: OverviewData }) {
  const [data, setData] = useState(initial);
  const [maintMessage, setMaintMessage] = useState(initial.maintenance.message);
  const [busy, setBusy] = useState(false);

  const t = data.totals;
  const a = data.activity;

  const stats = [
    { label: 'Users', value: t.users, sub: `${t.verifiedUsers} verified · +${t.signups7d} this week` },
    { label: 'DAU / WAU', value: `${a.dau} / ${a.wau}`, sub: `${a.sessionsToday} sessions today` },
    { label: 'Active follows', value: t.activeFollows, sub: `${a.copies24h} copies filled 24h · ${a.copiesFailed24h} failed` },
    { label: 'Leaders', value: t.verifiedLeaders, sub: `${t.pendingLeaders} pending approval` },
    { label: 'Connected accounts', value: t.credentialsTotal, sub: `${t.credentialsInvalid} invalid`, tone: t.credentialsInvalid > 0 ? 'down' : undefined },
  ] as const;

  async function postSetting(body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const { data: d } = await res.json();
        setData((prev) => ({ ...prev, maintenance: d.maintenance, betaMode: d.betaMode }));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <div className="text-xs text-muted">{s.label}</div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${'tone' in s && s.tone === 'down' ? 'text-down' : ''}`}>{s.value}</div>
            <div className="mt-1 text-[11px] text-faint">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-base font-semibold">Recent signups</h3>
          {data.recentUsers.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No users yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <span className="font-medium">{u.name}</span>
                    <span className="ml-2 text-xs text-muted">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-faint">
                    {u.intendedRole && <Badge tone="brand">{u.intendedRole}</Badge>}
                    {[u.city, u.country].filter(Boolean).join(', ') || '—'}
                    <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    {!u.emailVerified && <Badge tone="warn">unverified</Badge>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="mb-4 text-base font-semibold">Recent admin actions</h3>
          {data.recentAudit.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No admin actions yet.</p>
          ) : (
            <div className="space-y-2.5">
              {data.recentAudit.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-mono text-xs">{r.action}</span>
                  <span className="text-xs text-faint">
                    {r.actorEmail} · {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 text-base font-semibold">Maintenance mode</h3>
          <p className="mb-4 text-sm text-muted">Shows a sitewide banner. Copying is unaffected — use the kill-switch for that.</p>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={maintMessage}
              onChange={(e) => setMaintMessage(e.target.value)}
              placeholder="Banner message (optional)"
              className="max-w-xs"
            />
            <Button
              variant={data.maintenance.enabled ? 'primary' : 'danger'}
              disabled={busy}
              onClick={() => postSetting({ maintenance: { enabled: !data.maintenance.enabled, message: maintMessage } })}
            >
              {data.maintenance.enabled ? 'Disable banner' : 'Enable banner'}
            </Button>
            {data.maintenance.enabled && <Badge tone="warn">Live</Badge>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-base font-semibold">Beta gate</h3>
          <p className="mb-4 text-sm text-muted">
            When on, only invited emails (Access tab) can connect accounts, follow leaders, or apply as leader.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={data.betaMode ? 'primary' : 'danger'}
              disabled={busy}
              onClick={() => postSetting({ betaMode: !data.betaMode })}
            >
              {data.betaMode ? 'Disable beta gate' : 'Enable beta gate'}
            </Button>
            {data.betaMode && <Badge tone="warn">Invite-only</Badge>}
          </div>
        </Card>
      </div>
    </div>
  );
}
