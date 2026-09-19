'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Input } from './ui';

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  country: string | null;
  city: string | null;
  postalCode: string | null;
  intendedRole: string | null;
  referralCode: string | null;
  tosAcceptedAt: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  credentials: number;
  follows: number;
  leaderStatus: string | null;
  sessions: number;
  authProviders: string[];
}

interface Dossier {
  user: UserRow & { phone: string | null; riskDisclosureAcceptedAt: string | null; unreadNotifications: number };
  credentials: Array<{ id: string; exchange: string; label: string; status: string; keyLast4: string; lastError: string | null; verifiedAt: string | null }>;
  follows: Array<{ id: string; leader: string; status: string; sizingMode: string; copyOrders: number; startedAt: string }>;
  leader: { id: string; displayName: string; status: string; followers: number; fills: number } | null;
  recentSessions: Array<{ id: string; startedAt: string; lastSeenAt: string; durationSec: number; pagePath: string | null }>;
  recentEvents: Array<{ id: string; type: string; path: string | null; feature: string | null; createdAt: string }>;
}

export function AdminUsers() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState('');
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/users${search ? `?q=${encodeURIComponent(search)}` : ''}`, { signal: ctrl.signal });
        if (res.ok) setUsers((await res.json()).data);
      } catch (err) {
        if (!(err instanceof DOMException && err.name === 'AbortError')) throw err;
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [search]);

  async function openDossier(id: string) {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) setDossier((await res.json()).data);
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="max-w-sm" />
      {!users ? (
        <Card className="py-10 text-center text-sm text-muted">Loading…</Card>
      ) : users.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted">No users found.</Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-border-soft text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Intent</th>
                <th className="px-4 py-3 font-medium">Accounts</th>
                <th className="px-4 py-3 font-medium">Follows</th>
                <th className="px-4 py-3 font-medium">Leader</th>
                <th className="px-4 py-3 font-medium">Last seen</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-soft last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {u.name} {u.role === 'admin' && <Badge tone="brand">admin</Badge>}
                    </div>
                    <div className="text-xs text-muted">
                      {u.email} {!u.emailVerified && <span className="text-warn">(unverified)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {[u.city, u.country].filter(Boolean).join(', ') || '—'}
                    {u.postalCode && <div className="text-faint">{u.postalCode}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{u.intendedRole ?? '—'}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{u.credentials}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{u.follows}</td>
                  <td className="px-4 py-3">{u.leaderStatus ? <Badge tone={u.leaderStatus === 'VERIFIED' ? 'up' : 'warn'}>{u.leaderStatus}</Badge> : '—'}</td>
                  <td className="px-4 py-3 text-xs text-muted">{u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleString() : 'never'}</td>
                  <td className="px-4 py-3 text-xs text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="subtle" className="!px-2.5 !py-1 text-xs" disabled={loadingId === u.id} onClick={() => openDossier(u.id)}>
                      {loadingId === u.id ? 'Loading…' : 'Details'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {dossier && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={() => setDossier(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">{dossier.user.name}</h3>
                <p className="text-sm text-muted">{dossier.user.email}</p>
              </div>
              <Button variant="ghost" className="!px-3 !py-1 text-xs" onClick={() => setDossier(null)}>Close</Button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted">Location</dt>
              <dd>{[dossier.user.city, dossier.user.postalCode, dossier.user.country].filter(Boolean).join(', ') || '—'}</dd>
              <dt className="text-muted">Phone</dt>
              <dd>{dossier.user.phone ?? '—'}</dd>
              <dt className="text-muted">Intent</dt>
              <dd>{dossier.user.intendedRole ?? '—'}</dd>
              <dt className="text-muted">Referral</dt>
              <dd>{dossier.user.referralCode ?? '—'}</dd>
              <dt className="text-muted">ToS accepted</dt>
              <dd>{dossier.user.tosAcceptedAt ? new Date(dossier.user.tosAcceptedAt).toLocaleDateString() : '—'}</dd>
              <dt className="text-muted">Risk accepted</dt>
              <dd>{dossier.user.riskDisclosureAcceptedAt ? new Date(dossier.user.riskDisclosureAcceptedAt).toLocaleDateString() : '—'}</dd>
              <dt className="text-muted">Auth providers</dt>
              <dd>{dossier.user.authProviders.join(', ') || '—'}</dd>
            </dl>

            <h4 className="mt-6 text-sm font-semibold">Exchange accounts</h4>
            {dossier.credentials.length === 0 ? (
              <p className="mt-1 text-xs text-muted">None connected.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs">
                {dossier.credentials.map((c) => (
                  <li key={c.id} className="flex justify-between rounded-lg bg-[#f6f6f6] px-3 py-2">
                    <span>
                      {c.label} <span className="text-faint">••••{c.keyLast4} · {c.exchange}</span>
                    </span>
                    <Badge tone={c.status === 'ACTIVE' ? 'up' : 'down'}>{c.status}</Badge>
                  </li>
                ))}
              </ul>
            )}

            <h4 className="mt-6 text-sm font-semibold">Follows</h4>
            {dossier.follows.length === 0 ? (
              <p className="mt-1 text-xs text-muted">Not following anyone.</p>
            ) : (
              <ul className="mt-2 space-y-1.5 text-xs">
                {dossier.follows.map((f) => (
                  <li key={f.id} className="flex justify-between rounded-lg bg-[#f6f6f6] px-3 py-2">
                    <span>{f.leader} · {f.sizingMode} · {f.copyOrders} orders</span>
                    <Badge tone={f.status === 'ACTIVE' ? 'up' : 'neutral'}>{f.status}</Badge>
                  </li>
                ))}
              </ul>
            )}

            {dossier.leader && (
              <>
                <h4 className="mt-6 text-sm font-semibold">Leader profile</h4>
                <p className="mt-1 text-xs text-muted">
                  {dossier.leader.displayName} — {dossier.leader.status} · {dossier.leader.followers} followers · {dossier.leader.fills} fills
                </p>
              </>
            )}

            <h4 className="mt-6 text-sm font-semibold">Recent activity</h4>
            {dossier.recentEvents.length === 0 ? (
              <p className="mt-1 text-xs text-muted">No tracked activity.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-xs">
                {dossier.recentEvents.slice(0, 15).map((e) => (
                  <li key={e.id} className="flex justify-between text-muted">
                    <span>{e.type} {e.path ?? ''}</span>
                    <span className="text-faint">{new Date(e.createdAt).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
