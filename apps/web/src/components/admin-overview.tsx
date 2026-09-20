'use client';

import { useState } from 'react';
import { Badge, Button, Card, Input, fmtUsd } from './ui';
import { Sparkline } from './icons';
import { AdminUserMap, type GeoPoint } from './admin-user-map';

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
  activity: { dau: number; wau: number; sessionsToday: number; copies24h: number; copiesFailed24h: number; dauTrend: number[] };
  money: { openPositions: number; openUnrealizedUsd: number; copiedVolumeUsd: number; aumUsd: number };
  funnel: { signedUp: number; verified: number; connected: number; following: number };
  featureAdoption: Array<{ feature: string; count: number }>;
  geoPoints: GeoPoint[];
  recentFailedCopies: Array<{
    id: string;
    symbol: string;
    side: string;
    status: string;
    exchange: string;
    leader: string;
    error: string | null;
    requestedAt: string;
  }>;
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
  const m = data.money;
  const f = data.funnel;
  const funnelSteps = [
    { label: 'Signed up', value: f.signedUp },
    { label: 'Verified email', value: f.verified },
    { label: 'Connected account', value: f.connected },
    { label: 'Following a leader', value: f.following },
  ];
  const funnelMax = Math.max(f.signedUp, 1);

  const moneyStats = [
    { label: 'Leader AUM', value: fmtUsd(m.aumUsd, 0), sub: 'Latest equity across leaders' },
    { label: 'Copied volume', value: fmtUsd(m.copiedVolumeUsd, 0), sub: 'Total mirrored turnover' },
    { label: 'Open positions', value: m.openPositions, sub: 'Live follower positions' },
    {
      label: 'Open unrealized P&L',
      value: fmtUsd(m.openUnrealizedUsd),
      sub: 'Across all open copies',
      tone: m.openUnrealizedUsd < 0 ? ('down' as const) : ('up' as const),
    },
  ];

  const stats = [
    { label: 'Users', value: t.users, sub: `${t.verifiedUsers} verified · +${t.signups7d} this week` },
    { label: 'DAU / WAU', value: `${a.dau} / ${a.wau}`, sub: `${a.sessionsToday} sessions today`, spark: a.dauTrend },
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
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs text-muted">{s.label}</div>
              {'spark' in s && s.spark.some((v) => v > 0) && (
                <Sparkline points={s.spark} width={72} height={22} className="text-ink" stroke="#6d5fd0" />
              )}
            </div>
            <div className={`mt-1 text-2xl font-semibold tabular-nums ${'tone' in s && s.tone === 'down' ? 'text-down' : ''}`}>{s.value}</div>
            <div className="mt-1 text-[11px] text-faint">{s.sub}</div>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted">Money at risk</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {moneyStats.map((s) => (
            <Card key={s.label}>
              <div className="text-xs text-muted">{s.label}</div>
              <div
                className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone === 'down' ? 'text-down' : s.tone === 'up' ? 'text-up' : ''}`}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[11px] text-faint">{s.sub}</div>
            </Card>
          ))}
        </div>
      </div>

      <AdminUserMap points={data.geoPoints} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 text-base font-semibold">Onboarding funnel</h3>
          <p className="mb-4 text-sm text-muted">How far users get, from signup to copying.</p>
          <div className="space-y-3">
            {funnelSteps.map((s, i) => {
              const pct = Math.round((s.value / funnelMax) * 100);
              return (
                <div key={s.label}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-black">{s.label}</span>
                    <span className="tabular-nums text-muted">
                      {s.value}
                      {i > 0 && <span className="ml-1.5 text-faint">({pct}%)</span>}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#efeef4]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max(pct, 2)}%`, background: '#6d5fd0' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-base font-semibold">Feature adoption</h3>
          <p className="mb-4 text-sm text-muted">Tracked page/feature events over the last 30 days.</p>
          {data.featureAdoption.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No activity yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {data.featureAdoption.map((row) => (
                <li key={row.feature} className="flex items-center justify-between gap-3 text-sm">
                  <span className="capitalize text-black">{row.feature}</span>
                  <span className="tabular-nums text-muted">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h3 className="mb-1 text-base font-semibold">Recent failed copies</h3>
        <p className="mb-4 text-sm text-muted">Skipped or rejected copy orders in the last 24h — the reason behind the failure count.</p>
        {data.recentFailedCopies.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No failed copies in the last 24h. 🎉</p>
        ) : (
          <div className="space-y-2.5">
            {data.recentFailedCopies.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 border-b border-border-soft pb-2.5 text-sm last:border-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Badge tone={c.status === 'REJECTED' ? 'down' : 'warn'}>{c.status.toLowerCase()}</Badge>
                  <span className="font-medium">{c.symbol}</span>
                  <span className="text-xs text-muted">{c.side.toLowerCase()} · {c.leader}</span>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <span className="truncate text-xs text-down" title={c.error ?? ''}>{c.error ?? '—'}</span>
                  <span className="shrink-0 text-xs text-faint">{new Date(c.requestedAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

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
