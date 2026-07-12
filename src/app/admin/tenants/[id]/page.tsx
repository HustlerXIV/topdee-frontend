'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  AdminShell,
  AdminPageBody,
  AdminPageHeader,
} from '@/components/layout/AdminShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select, Textarea, FormGroup, FormRow } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import {
  api,
  ApiError,
  type AdminTenantFull,
  type Plan,
  type Subscription,
  type SubscriptionStatus,
} from '@/lib/api';
import { useUI } from '@/store/ui';
import {
  Building2,
  ArrowLeft,
  Power,
  Trash2,
  Save,
  Calendar,
  CreditCard,
  Sparkles,
} from '@/components/ui/Icon';

const STATUSES: SubscriptionStatus[] = [
  'trialing',
  'active',
  'past_due',
  'canceled',
  'paused',
];

const STATUS_TONE: Record<SubscriptionStatus, 'success' | 'warning' | 'pending' | 'neutral'> = {
  trialing: 'pending',
  active: 'success',
  past_due: 'warning',
  canceled: 'neutral',
  paused: 'neutral',
};

export default function AdminTenantDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const showToast = useUI((s) => s.showToast);

  const [tenant, setTenant] = useState<AdminTenantFull | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [savingSub, setSavingSub] = useState(false);

  // Local edit copy of subscription so the form doesn't ping the API on every keystroke.
  const [subDraft, setSubDraft] = useState<Subscription | null>(null);

  // Load all plans (including hidden ones) for the assignment dropdown — same
  // source the tenants LIST page uses, so this stays in sync with real plans.
  useEffect(() => {
    api.admin.plans().then(setPlans).catch(() => {});
  }, []);

  useEffect(() => {
    api.admin
      .tenant(id)
      .then((t) => {
        setTenant(t);
        setSubDraft(
          t.subscription ?? {
            status: 'active',
            cancel_at_period_end: false,
            admin_notes: '',
          },
        );
      })
      .catch(() => {});
  }, [id]);

  async function patchTenant(patch: { plan?: string; suspended?: boolean }) {
    try {
      const updated = await api.admin.updateTenant(id, patch);
      setTenant(updated);
      showToast('Updated', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'failed', 'error');
    }
  }

  async function saveSubscription() {
    if (!subDraft) return;
    setSavingSub(true);
    try {
      const updated = await api.admin.updateSubscription(id, {
        status: subDraft.status,
        trial_ends_at: subDraft.trial_ends_at || undefined,
        clear_trial_ends_at: !subDraft.trial_ends_at,
        current_period_end: subDraft.current_period_end || undefined,
        clear_current_period_end: !subDraft.current_period_end,
        canceled_at: subDraft.canceled_at || undefined,
        clear_canceled_at: !subDraft.canceled_at,
        cancel_at_period_end: subDraft.cancel_at_period_end,
        admin_notes: subDraft.admin_notes,
      });
      setSubDraft(updated);
      setTenant((t) => (t ? { ...t, subscription: updated } : t));
      showToast('Subscription saved', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'save failed', 'error');
    } finally {
      setSavingSub(false);
    }
  }

  async function extend(days: number) {
    try {
      const sub = await api.admin.extendSubscription(id, days);
      setSubDraft(sub);
      setTenant((t) => (t ? { ...t, subscription: sub } : t));
      showToast(`Extended by ${days} days`, 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'extend failed', 'error');
    }
  }

  async function startTrial(days: number) {
    const end = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    try {
      const sub = await api.admin.updateSubscription(id, {
        status: 'trialing',
        trial_ends_at: end.toISOString(),
        clear_canceled_at: true,
      });
      setSubDraft(sub);
      setTenant((t) => (t ? { ...t, subscription: sub } : t));
      showToast(`${days}-day trial started`, 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'failed', 'error');
    }
  }

  async function cancelNow() {
    if (!confirm('Cancel this subscription immediately?')) return;
    try {
      const sub = await api.admin.updateSubscription(id, {
        status: 'canceled',
        cancel_at_period_end: false,
      });
      setSubDraft(sub);
      setTenant((t) => (t ? { ...t, subscription: sub } : t));
      showToast('Subscription canceled', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'failed', 'error');
    }
  }

  async function deleteTenant() {
    if (!tenant) return;
    if (
      !confirm(
        `Delete "${tenant.name}" and all ${tenant.member_count} member(s) + every KB and message? This cannot be undone.`,
      )
    )
      return;
    try {
      await api.admin.deleteTenant(id);
      router.replace('/admin/tenants');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'delete failed', 'error');
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Building2 className="h-7 w-7" />}
        title={
          <span className="flex items-center gap-3">
            <Link
              href="/admin/tenants"
              className="text-ink-faint hover:text-ink"
              aria-label="Back to tenants"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            {tenant?.name ?? 'Loading…'}
          </span>
        }
        description={
          tenant
            ? `${tenant.member_count} member(s) · created ${new Date(tenant.created_at).toLocaleDateString()}`
            : undefined
        }
        action={
          tenant && (
            <div className="flex gap-2">
              <Button
                variant={tenant.suspended ? 'soft' : 'outline'}
                onClick={() => patchTenant({ suspended: !tenant.suspended })}
                iconLeft={<Power className="h-4 w-4" />}
              >
                {tenant.suspended ? 'Unsuspend' : 'Suspend'}
              </Button>
              <Button
                variant="danger"
                onClick={deleteTenant}
                iconLeft={<Trash2 className="h-4 w-4" />}
              >
                Delete tenant
              </Button>
            </div>
          )
        }
      />
      <AdminPageBody>
        {!tenant && <p className="text-sm text-ink-faint">Loading…</p>}

        {tenant && (
          <>
            {/* Plan */}
            <Card>
              <CardHeader
                icon={<CreditCard className="h-4 w-4" />}
                title="Plan"
                description="Display name shown to the workspace + used for plan-based limits."
              />
              <FormRow>
                <FormGroup label="Plan">
                  <Select
                    value={tenant.plan}
                    onChange={(e) => patchTenant({ plan: e.target.value })}
                  >
                    {/* Keep the tenant's current plan selectable even if it's
                        not in the fetched list (e.g. a deleted/legacy plan),
                        so the browser doesn't silently default to the first. */}
                    {plans.every((p) => p.id !== tenant.plan) && (
                      <option value={tenant.plan}>{tenant.plan}</option>
                    )}
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}{!p.is_public ? ' 🔒' : ''}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
                <FormGroup label="Usage tokens (lifetime)">
                  <Input
                    value={tenant.usage_tokens.toLocaleString()}
                    disabled
                  />
                </FormGroup>
              </FormRow>
            </Card>

            {/* Subscription */}
            {subDraft && (
              <Card>
                <CardHeader
                  icon={<Sparkles className="h-4 w-4" />}
                  title="Subscription"
                  description="Billing state of record. Update after taking payment out-of-band."
                  action={
                    <Badge tone={STATUS_TONE[subDraft.status]}>
                      {subDraft.status}
                    </Badge>
                  }
                />

                {/* Quick actions */}
                <div className="mb-5 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => startTrial(14)}>
                    Start 14-day trial
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => extend(30)}>
                    Extend +30 days
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => extend(7)}>
                    Extend +7 days
                  </Button>
                  <Button size="sm" variant="danger" onClick={cancelNow}>
                    Cancel now
                  </Button>
                </div>

                <FormRow>
                  <FormGroup label="Status">
                    <Select
                      value={subDraft.status}
                      onChange={(e) =>
                        setSubDraft({
                          ...subDraft,
                          status: e.target.value as SubscriptionStatus,
                        })
                      }
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </Select>
                  </FormGroup>
                  <FormGroup
                    label="Cancel at period end"
                    hint="Graceful cancellation — keeps access until current_period_end"
                  >
                    <div className="flex items-center gap-3 pt-1.5">
                      <Toggle
                        checked={subDraft.cancel_at_period_end}
                        onChange={(e) =>
                          setSubDraft({
                            ...subDraft,
                            cancel_at_period_end: e.target.checked,
                          })
                        }
                      />
                      <span className="text-sm text-ink-muted">
                        {subDraft.cancel_at_period_end ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </FormGroup>
                </FormRow>

                <FormRow>
                  <FormGroup
                    label="Trial ends at"
                    hint="Used while status = trialing"
                  >
                    <DateInput
                      value={subDraft.trial_ends_at ?? null}
                      onChange={(v) =>
                        setSubDraft({ ...subDraft, trial_ends_at: v })
                      }
                    />
                  </FormGroup>
                  <FormGroup
                    label="Current period end"
                    hint="Next renewal — past this date the workspace becomes past_due"
                  >
                    <DateInput
                      value={subDraft.current_period_end ?? null}
                      onChange={(v) =>
                        setSubDraft({ ...subDraft, current_period_end: v })
                      }
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup
                  label="Canceled at"
                  hint="When the workspace was actually canceled"
                >
                  <DateInput
                    value={subDraft.canceled_at ?? null}
                    onChange={(v) =>
                      setSubDraft({ ...subDraft, canceled_at: v })
                    }
                  />
                </FormGroup>

                <FormGroup
                  label="Admin notes"
                  hint="Free-text. Examples: 'PromptPay invoice #1234', 'Comp until 2026-01-01'"
                >
                  <Textarea
                    rows={3}
                    value={subDraft.admin_notes}
                    onChange={(e) =>
                      setSubDraft({ ...subDraft, admin_notes: e.target.value })
                    }
                    maxLength={4000}
                  />
                </FormGroup>

                <Button
                  className="mt-2"
                  onClick={saveSubscription}
                  disabled={savingSub}
                  iconLeft={<Save className="h-4 w-4" />}
                >
                  {savingSub ? '…' : 'Save subscription'}
                </Button>

                {/* Computed read-only summary */}
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <SummaryRow
                    label="Days left"
                    value={daysUntil(
                      subDraft.status === 'trialing'
                        ? subDraft.trial_ends_at
                        : subDraft.current_period_end,
                    )}
                  />
                  <SummaryRow
                    label="Last update"
                    value={
                      subDraft.updated_at
                        ? new Date(subDraft.updated_at).toLocaleString()
                        : '—'
                    }
                  />
                </div>
              </Card>
            )}
          </>
        )}
      </AdminPageBody>
    </AdminShell>
  );
}

// ── helpers ─────────────────────────────────────────────────────────────

/**
 * <input type="datetime-local"> + a Clear button. Stores ISO strings in
 * state, since that's what the API takes.
 */
function DateInput({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const local = value ? toLocalInputValue(value) : '';
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-ink-faint" />
      <Input
        type="datetime-local"
        value={local}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value).toISOString() : null)
        }
        className="flex-1"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs font-medium text-ink-muted hover:text-red-500"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // datetime-local wants "YYYY-MM-DDTHH:mm" in *local* time.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function daysUntil(iso: string | null | undefined): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  if (Number.isNaN(ms)) return '—';
  const d = Math.ceil(ms / (24 * 60 * 60 * 1000));
  if (d > 0) return `${d} day${d === 1 ? '' : 's'}`;
  if (d === 0) return 'today';
  return `${-d} day${d === -1 ? '' : 's'} ago (expired)`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line2 bg-page p-3">
      <div className="text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
