'use client';

import { useEffect, useState } from 'react';
import {
  AdminShell,
  AdminPageBody,
  AdminPageHeader,
} from '@/components/layout/AdminShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import Link from 'next/link';
import { api, ApiError, type AdminTenant, type Plan } from '@/lib/api';
import { useUI } from '@/store/ui';
import { Building2, Search, Trash2, Power, ArrowRight } from '@/components/ui/Icon';

export default function AdminTenantsPage() {
  const showToast = useUI((s) => s.showToast);
  const [q, setQ] = useState('');
  const [tenants, setTenants] = useState<AdminTenant[] | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Load all plans (including hidden ones) for the assignment dropdown.
  useEffect(() => {
    api.admin.plans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      api.admin
        .tenants(q)
        .then((rows) => {
          if (!cancelled) setTenants(rows);
        })
        .catch((e) => {
          if (!cancelled && !(e instanceof ApiError && e.status === 401))
            setErr(e.message);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q]);

  async function patchTenant(
    id: string,
    patch: { plan?: string; suspended?: boolean },
  ) {
    setBusyId(id);
    try {
      const res = await api.admin.updateTenant(id, patch);
      setTenants((prev) =>
        prev ? prev.map((t) => (t.id === id ? res : t)) : prev,
      );
      showToast('Updated', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'update failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function deleteTenant(t: AdminTenant) {
    if (
      !confirm(
        `Delete "${t.name}" and all ${t.member_count} member(s) + every KB and message? This cannot be undone.`,
      )
    )
      return;
    try {
      await api.admin.deleteTenant(t.id);
      setTenants((prev) => (prev ? prev.filter((x) => x.id !== t.id) : prev));
      showToast('Tenant deleted', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'delete failed', 'error');
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Building2 className="h-7 w-7" />}
        title="Tenants"
        description="Every workspace on the platform — search, change plan, suspend, delete."
      />
      <AdminPageBody>
        <Card>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-line2 bg-page px-3">
            <Search className="h-4 w-4 text-ink-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by tenant name…"
              className="flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
          </div>

          {err && <p className="text-sm text-red-500">{err}</p>}
          {!tenants && !err && (
            <p className="text-sm text-ink-faint">Loading…</p>
          )}
          {tenants && tenants.length === 0 && (
            <p className="text-sm text-ink-faint">No tenants match.</p>
          )}

          {tenants && tenants.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-ink">
                <thead className="bg-page">
                  <tr>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Tenant</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Plan</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-right">Members</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-right">Tokens</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Status</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id}>
                      <td className="border-b border-line2 px-3 py-2.5">
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-ink-faint">
                          {new Date(t.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="border-b border-line2 px-3 py-2.5">
                        <Select
                          value={t.plan}
                          onChange={(e) => patchTenant(t.id, { plan: e.target.value })}
                          className="w-40"
                          disabled={busyId === t.id}
                        >
                          {/* If the tenant is on a plan not in the list (e.g. deleted), show it */}
                          {plans.every((p) => p.id !== t.plan) && (
                            <option value={t.plan}>{t.plan}</option>
                          )}
                          {plans.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.display_name}{!p.is_public ? ' 🔒' : ''}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="border-b border-line2 px-3 py-2.5 text-right">
                        {t.member_count}
                      </td>
                      <td className="border-b border-line2 px-3 py-2.5 text-right text-ink-muted">
                        {t.usage_tokens.toLocaleString()}
                      </td>
                      <td className="border-b border-line2 px-3 py-2.5">
                        {t.suspended ? (
                          <Badge tone="warning">Suspended</Badge>
                        ) : (
                          <Badge tone="success">Active</Badge>
                        )}
                      </td>
                      <td className="border-b border-line2 px-3 py-2.5">
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/tenants/${t.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              iconRight={<ArrowRight className="h-3.5 w-3.5" />}
                            >
                              Manage
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant={t.suspended ? 'soft' : 'outline'}
                            onClick={() =>
                              patchTenant(t.id, { suspended: !t.suspended })
                            }
                            disabled={busyId === t.id}
                            iconLeft={<Power className="h-3.5 w-3.5" />}
                          >
                            {t.suspended ? 'Unsuspend' : 'Suspend'}
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => deleteTenant(t)}
                            iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AdminPageBody>
    </AdminShell>
  );
}
