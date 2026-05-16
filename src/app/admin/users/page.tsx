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
import { Select } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import {
  api,
  ApiError,
  type Member,
  type Role,
  type AdminTenant,
} from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useUI } from '@/store/ui';
import { Users, Search, Trash2, Shield } from '@/components/ui/Icon';

const ROLES: Role[] = ['owner', 'admin', 'agent', 'viewer'];

export default function AdminUsersPage() {
  const showToast = useUI((s) => s.showToast);
  const myId = useAuth((s) => s.user?.email); // we don't have id in store; email is unique anyway

  const [users, setUsers] = useState<Member[] | null>(null);
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [q, setQ] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [suspendedOnly, setSuspendedOnly] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Tenant list — once.
  useEffect(() => {
    api.admin
      .tenants()
      .then(setTenants)
      .catch(() => {});
  }, []);

  // Users list — debounced on filter changes.
  useEffect(() => {
    let cancelled = false;
    const handle = setTimeout(() => {
      api.admin
        .users({
          tenant_id: tenantFilter || undefined,
          q: q || undefined,
          suspended: suspendedOnly || undefined,
        })
        .then((rows) => {
          if (!cancelled) setUsers(rows);
        })
        .catch(() => {});
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [q, tenantFilter, suspendedOnly]);

  const tenantNameById = (id: string) =>
    tenants.find((t) => t.id === id)?.name ?? id.slice(0, 8);

  async function patchUser(
    u: Member,
    patch: { role?: Role; suspended?: boolean; is_platform_admin?: boolean },
  ) {
    setBusyId(u.id);
    try {
      const updated = await api.admin.updateUser(u.id, patch);
      setUsers((prev) =>
        prev ? prev.map((x) => (x.id === u.id ? updated : x)) : prev,
      );
      showToast('Updated', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'update failed', 'error');
    } finally {
      setBusyId(null);
    }
  }

  async function removeUser(u: Member) {
    if (!confirm(`Delete ${u.email}?`)) return;
    try {
      await api.admin.deleteUser(u.id);
      setUsers((prev) => (prev ? prev.filter((x) => x.id !== u.id) : prev));
      showToast('User deleted', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'delete failed', 'error');
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Users className="h-7 w-7" />}
        title="Users"
        description="Every account across every workspace. Filter, suspend, change roles, promote to platform admin."
      />
      <AdminPageBody>
        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl border border-line2 bg-page px-3">
              <Search className="h-4 w-4 text-ink-faint" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by email or name…"
                className="flex-1 bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint"
              />
            </div>
            <Select
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
              className="w-56"
            >
              <option value="">All tenants</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-ink">
              <Toggle
                checked={suspendedOnly}
                onChange={(e) => setSuspendedOnly(e.target.checked)}
              />
              Suspended only
            </label>
          </div>

          {!users && <p className="text-sm text-ink-faint">Loading…</p>}
          {users && users.length === 0 && (
            <p className="text-sm text-ink-faint">No users match.</p>
          )}

          {users && users.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] text-ink">
                <thead className="bg-page">
                  <tr>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">User</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Tenant</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Role</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-center">Admin</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-left">Status</th>
                    <th className="border-b border-line2 px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u.email === myId;
                    return (
                      <tr key={u.id}>
                        <td className="border-b border-line2 px-3 py-2.5">
                          <div className="font-semibold">{u.name || u.email}</div>
                          <div className="text-xs text-ink-faint">{u.email}</div>
                        </td>
                        <td className="border-b border-line2 px-3 py-2.5 text-ink-muted">
                          {tenantNameById(u.tenant_id)}
                        </td>
                        <td className="border-b border-line2 px-3 py-2.5">
                          <Select
                            value={u.role}
                            onChange={(e) =>
                              patchUser(u, { role: e.target.value as Role })
                            }
                            className="w-28"
                            disabled={busyId === u.id}
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </Select>
                        </td>
                        <td className="border-b border-line2 px-3 py-2.5 text-center">
                          <button
                            type="button"
                            disabled={busyId === u.id || isMe}
                            onClick={() =>
                              patchUser(u, {
                                is_platform_admin: !u.is_platform_admin,
                              })
                            }
                            title={
                              isMe
                                ? "Can't toggle your own admin flag"
                                : 'Toggle platform admin'
                            }
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors hover:bg-muted disabled:opacity-50"
                          >
                            {u.is_platform_admin ? (
                              <>
                                <Shield className="h-3.5 w-3.5 text-red-600" />
                                <span className="text-red-600">Yes</span>
                              </>
                            ) : (
                              <span className="text-ink-faint">—</span>
                            )}
                          </button>
                        </td>
                        <td className="border-b border-line2 px-3 py-2.5">
                          {u.suspended ? (
                            <Badge tone="warning">Suspended</Badge>
                          ) : (
                            <Badge tone="success">Active</Badge>
                          )}
                        </td>
                        <td className="border-b border-line2 px-3 py-2.5">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant={u.suspended ? 'soft' : 'outline'}
                              onClick={() =>
                                patchUser(u, { suspended: !u.suspended })
                              }
                              disabled={busyId === u.id || isMe}
                            >
                              {u.suspended ? 'Unsuspend' : 'Suspend'}
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => removeUser(u)}
                              disabled={isMe}
                              iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </AdminPageBody>
    </AdminShell>
  );
}
