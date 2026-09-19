'use client';

import { useState } from 'react';
import { AdminTabs, type AdminTab } from './admin-tabs';
import { AdminOverview, type OverviewData } from './admin-overview';
import { AdminUsers } from './admin-users';
import { AdminPanel } from './admin-panel';
import { AdminAccess, AdminAudit } from './admin-access';

interface AdminLeader {
  id: string;
  displayName: string;
  bio: string | null;
  status: string;
  account: { label: string; keyLast4: string };
  stats: { followerCount: number; tradeCount: number; totalCopiedUsd: number; winRatePct: number };
}

export function AdminDashboard({
  overview,
  leaders,
  kill,
}: {
  overview: OverviewData;
  leaders: AdminLeader[];
  kill: boolean;
}) {
  const [tab, setTab] = useState<AdminTab>('overview');

  return (
    <div className="space-y-6">
      <AdminTabs tab={tab} onChange={setTab} pendingLeaders={overview.totals.pendingLeaders} />
      {tab === 'overview' && <AdminOverview initial={overview} />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'leaders' && <AdminPanel initialLeaders={leaders} initialKill={kill} />}
      {tab === 'audit' && <AdminAudit />}
      {tab === 'access' && <AdminAccess />}
    </div>
  );
}
