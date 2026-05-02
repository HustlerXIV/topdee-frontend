'use client';

import { useEffect, useState } from 'react';
import {
  AdminShell,
  AdminPageBody,
  AdminPageHeader,
} from '@/components/layout/AdminShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { api, ApiError, type AdminMetrics } from '@/lib/api';
import {
  Shield,
  Building2,
  Users,
  MessageSquare,
  BookOpen,
} from '@/components/ui/Icon';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .metrics()
      .then(setMetrics)
      .catch((e) => {
        if (!(e instanceof ApiError && (e.status === 401 || e.status === 403))) {
          setErr(e.message);
        }
      });
  }, []);

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Shield className="h-7 w-7" />}
        title="Platform overview"
        description="Cross-tenant view of every workspace, user, and resource on the platform."
      />
      <AdminPageBody>
        {err && <p className="mb-3 text-sm text-red-500">{err}</p>}
        {!metrics && !err && (
          <p className="text-sm text-ink-faint">Loading…</p>
        )}

        {metrics && (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" /> Tenants
                  </span>
                }
                value={metrics.tenants.total.toLocaleString()}
                change={`${metrics.tenants.suspended} suspended`}
              />
              <StatCard
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" /> Users
                  </span>
                }
                value={metrics.users.total.toLocaleString()}
                change={`${metrics.users.admins} admin · ${metrics.users.suspended} suspended`}
              />
              <StatCard
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" /> Messages
                  </span>
                }
                value={metrics.messages.total.toLocaleString()}
              />
              <StatCard
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" /> Knowledge
                  </span>
                }
                value={metrics.knowledge_bases.total.toLocaleString()}
                change={`${metrics.knowledge_bases.chunks.toLocaleString()} chunks`}
              />
            </div>

            <Card>
              <CardHeader title="Tenants by plan" />
              {Object.keys(metrics.tenants.by_plan).length === 0 ? (
                <p className="text-sm text-ink-faint">No data</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(metrics.tenants.by_plan)
                    .sort((a, b) => b[1] - a[1])
                    .map(([plan, n]) => {
                      const pct =
                        metrics.tenants.total > 0
                          ? (n / metrics.tenants.total) * 100
                          : 0;
                      return (
                        <li key={plan}>
                          <div className="mb-1 flex justify-between text-[13px] text-ink">
                            <span className="capitalize">{plan || '(unset)'}</span>
                            <strong>
                              {n.toLocaleString()} ({pct.toFixed(0)}%)
                            </strong>
                          </div>
                          <div className="h-2 rounded-full bg-line2">
                            <div
                              className="h-full rounded-full bg-brand-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </Card>
          </>
        )}
      </AdminPageBody>
    </AdminShell>
  );
}
