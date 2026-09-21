'use client';

import { useEffect, useState } from 'react';
import { Badge, Button, Card, Input } from './ui';

interface Grant {
  id: string;
  email: string;
  note: string;
  grantedByEmail: string;
  revokedAt: string | null;
  createdAt: string;
}

interface AuditItem {
  id: string;
  action: string;
  actorEmail: string;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
  createdAt: string;
}

export function AdminAccess() {
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch('/api/admin/grants');
    if (res.ok) setGrants((await res.json()).data);
  };
  useEffect(() => void load(), []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/grants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, note }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? `Could not create grant (${res.status}).`);
        return;
      }
      setEmail('');
      setNote('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/admin/grants/${id}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-1 text-base font-semibold">Invite a user</h3>
        <p className="mb-4 text-sm text-muted">
          Grants let an email through the beta gate. Only take effect while the gate is enabled on the Overview tab.
        </p>
        <form onSubmit={create} className="flex flex-wrap gap-2">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@example.com" className="max-w-xs" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional)" className="max-w-xs" />
          <Button type="submit" disabled={busy}>Grant access</Button>
        </form>
        {error && <p className="mt-3 rounded-lg bg-down/12 px-3 py-2 text-sm text-down">{error}</p>}
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border-soft text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Note</th>
              <th className="px-4 py-3 font-medium">Granted by</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(grants ?? []).map((g) => (
              <tr key={g.id} className="border-b border-border-soft last:border-0">
                <td className="px-4 py-3 font-medium">{g.email}</td>
                <td className="px-4 py-3 text-xs text-muted">{g.note || '—'}</td>
                <td className="px-4 py-3 text-xs text-muted">{g.grantedByEmail}</td>
                <td className="px-4 py-3">{g.revokedAt ? <Badge tone="down">revoked</Badge> : <Badge tone="up">active</Badge>}</td>
                <td className="px-4 py-3 text-xs text-muted" suppressHydrationWarning>{new Date(g.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  {!g.revokedAt && (
                    <Button variant="ghost" className="!px-2.5 !py-1 text-xs" disabled={busy} onClick={() => revoke(g.id)}>
                      Revoke
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {grants && grants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">No grants yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function AdminAudit() {
  const [rows, setRows] = useState<AuditItem[] | null>(null);
  useEffect(() => {
    fetch('/api/admin/audit')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setRows(j.data))
      .catch(() => undefined);
  }, []);

  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border-soft text-left text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Actor</th>
            <th className="px-4 py-3 font-medium">Target</th>
            <th className="px-4 py-3 font-medium">When</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r) => (
            <tr key={r.id} className="border-b border-border-soft last:border-0">
              <td className="px-4 py-3 font-mono text-xs">{r.action}</td>
              <td className="px-4 py-3 text-xs text-muted">{r.actorEmail}</td>
              <td className="px-4 py-3 text-xs text-muted">
                {r.targetType ? `${r.targetType} ${r.targetId?.slice(0, 8) ?? ''}` : '—'}
              </td>
              <td className="px-4 py-3 text-xs text-muted" suppressHydrationWarning>{new Date(r.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {rows && rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">No admin actions recorded yet.</td>
            </tr>
          )}
          {!rows && (
            <tr>
              <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted">Loading…</td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
