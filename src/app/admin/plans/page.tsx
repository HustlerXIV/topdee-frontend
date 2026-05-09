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
import { Input } from '@/components/ui/Input';
import { api, ApiError, type Plan, type PlanInput, type PlanLimits } from '@/lib/api';
import { useUI } from '@/store/ui';
import { Package, Plus, Pencil, Trash2 } from '@/components/ui/Icon';

// ── helpers ─────────────────────────────────────────────────────────────────

const KNOWN_PROVIDERS = ['facebook', 'line', 'instagram', 'shopee', 'lazada'];

function fmtLimit(n: number) {
  return n === -1 ? '∞' : n.toLocaleString();
}

function fmtPrice(price: number, currency: string) {
  if (price === 0) return 'Free';
  return `${price.toLocaleString()} ${currency}/mo`;
}

// ── empty state ──────────────────────────────────────────────────────────────

function emptyLimits(): PlanLimits {
  return {
    channels: { facebook: 1, line: 1 },
    members: 5,
    messages_per_month: 1000,
    knowledge_bases: 3,
    storage_mb: 500,
  };
}

function emptyPlan(): PlanInput {
  return {
    id: '',
    display_name: '',
    description: '',
    price: 0,
    currency: 'THB',
    is_active: true,
    is_public: true,
    is_recommended: false,
    sort_order: 0,
    expiry_days: 0,
    limits: emptyLimits(),
  };
}

// ── Plan Form Modal ──────────────────────────────────────────────────────────

function PlanModal({
  initial,
  onSave,
  onClose,
}: {
  initial: PlanInput | null;
  onSave: (plan: Plan) => void;
  onClose: () => void;
}) {
  const isNew = initial === null;
  const [form, setForm] = useState<PlanInput>(initial ?? emptyPlan());
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Extra channel rows added by the admin beyond the known providers.
  const extraProviders = Object.keys(form.limits.channels).filter(
    (p) => !KNOWN_PROVIDERS.includes(p),
  );
  const [newProvider, setNewProvider] = useState('');

  function setLimit(key: keyof Omit<PlanLimits, 'channels'>, val: string) {
    const n = val === '' ? 0 : parseInt(val, 10);
    setForm((f) => ({ ...f, limits: { ...f.limits, [key]: isNaN(n) ? 0 : n } }));
  }

  function setChannelLimit(provider: string, val: string) {
    const n = val === '' ? 0 : parseInt(val, 10);
    setForm((f) => ({
      ...f,
      limits: {
        ...f.limits,
        channels: { ...f.limits.channels, [provider]: isNaN(n) ? 0 : n },
      },
    }));
  }

  function addProvider() {
    const slug = newProvider.trim().toLowerCase();
    if (!slug || form.limits.channels[slug] !== undefined) return;
    setChannelLimit(slug, '0');
    setNewProvider('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const saved = isNew
        ? await api.admin.createPlan(form)
        : await api.admin.updatePlan(form.id, form);
      onSave(saved);
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : 'save failed');
    } finally {
      setSaving(false);
    }
  }

  const allProviders = [
    ...KNOWN_PROVIDERS.filter((p) => form.limits.channels[p] !== undefined || KNOWN_PROVIDERS.includes(p)),
    ...extraProviders,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl overflow-y-auto max-h-[90vh]">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-line2">
            <h2 className="text-lg font-semibold text-ink">
              {isNew ? 'Create plan' : `Edit "${form.display_name}"`}
            </h2>
          </div>

          <div className="p-6 space-y-5">
            {err && <p className="text-sm text-red-500">{err}</p>}

            {/* Identity */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Plan ID (slug)
                </label>
                <Input
                  value={form.id}
                  onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
                  placeholder="starter"
                  disabled={!isNew}
                  required
                />
                {!isNew && (
                  <p className="mt-1 text-[11px] text-ink-faint">
                    ID is immutable — tenants are assigned by this slug.
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Display name
                </label>
                <Input
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                  placeholder="Starter"
                  required
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[13px] font-medium text-ink">
                Description
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="For small businesses getting started"
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Price
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Currency
                </label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  placeholder="THB"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Sort order
                </label>
                <Input
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-[13px] font-medium text-ink">
                  Expiry days
                </label>
                <Input
                  type="number"
                  min={0}
                  value={form.expiry_days}
                  onChange={(e) => setForm((f) => ({ ...f, expiry_days: parseInt(e.target.value) || 0 }))}
                  placeholder="0 = forever"
                />
                <p className="mt-1 text-[11px] text-ink-faint">0 = no expiry (forever)</p>
              </div>
              <div className="flex flex-col gap-2 pt-5">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-line2"
                  />
                  Active
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) => setForm((f) => ({ ...f, is_public: e.target.checked }))}
                    className="h-4 w-4 rounded border-line2"
                  />
                  Public
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="checkbox"
                    checked={form.is_recommended}
                    onChange={(e) => setForm((f) => ({ ...f, is_recommended: e.target.checked }))}
                    className="h-4 w-4 rounded border-line2"
                  />
                  Recommended ⭐
                </label>
                {!form.is_public && (
                  <p className="text-[11px] text-amber-500">
                    Hidden — only assignable by admin
                  </p>
                )}
                {form.is_recommended && (
                  <p className="text-[11px] text-brand-600">
                    Shows "Popular" badge on the pricing page
                  </p>
                )}
              </div>
            </div>

            {/* Channel limits */}
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">
                Channel limits <span className="font-normal text-ink-faint">(-1 = unlimited)</span>
              </p>
              <div className="rounded-lg border border-line2 divide-y divide-line2">
                {KNOWN_PROVIDERS.map((provider) => (
                  <div key={provider} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-28 text-sm capitalize text-ink">{provider}</span>
                    <Input
                      type="number"
                      min={-1}
                      value={form.limits.channels[provider] ?? 0}
                      onChange={(e) => setChannelLimit(provider, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-xs text-ink-faint">channels</span>
                  </div>
                ))}
                {extraProviders.map((provider) => (
                  <div key={provider} className="flex items-center gap-3 px-4 py-2">
                    <span className="w-28 text-sm capitalize text-ink">{provider}</span>
                    <Input
                      type="number"
                      min={-1}
                      value={form.limits.channels[provider] ?? 0}
                      onChange={(e) => setChannelLimit(provider, e.target.value)}
                      className="w-24"
                    />
                    <span className="text-xs text-ink-faint">channels</span>
                  </div>
                ))}
                {/* Add new provider row */}
                <div className="flex items-center gap-3 px-4 py-2">
                  <Input
                    value={newProvider}
                    onChange={(e) => setNewProvider(e.target.value)}
                    placeholder="instagram, shopee…"
                    className="w-36"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProvider())}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={addProvider}>
                    + Add provider
                  </Button>
                </div>
              </div>
            </div>

            {/* Usage limits */}
            <div>
              <p className="mb-2 text-[13px] font-medium text-ink">
                Usage limits <span className="font-normal text-ink-faint">(-1 = unlimited)</span>
              </p>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { key: 'members', label: 'Team members' },
                    { key: 'messages_per_month', label: 'Messages / month' },
                    { key: 'knowledge_bases', label: 'Knowledge bases' },
                    { key: 'storage_mb', label: 'Storage (MB)' },
                  ] as { key: keyof Omit<PlanLimits, 'channels'>; label: string }[]
                ).map(({ key, label }) => (
                  <div key={key}>
                    <label className="mb-1 block text-[13px] text-ink-faint">{label}</label>
                    <Input
                      type="number"
                      min={-1}
                      value={form.limits[key]}
                      onChange={(e) => setLimit(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-line2 p-4">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : isNew ? 'Create plan' : 'Save changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: Plan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-semibold text-ink">{plan.display_name}</span>
            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-ink-faint">
              {plan.id}
            </span>
            {plan.is_active ? (
              <Badge tone="success">Active</Badge>
            ) : (
              <Badge tone="neutral">Inactive</Badge>
            )}
            {plan.is_recommended && (
              <Badge tone="success">⭐ Recommended</Badge>
            )}
            {!plan.is_public && (
              <Badge tone="warning">Hidden</Badge>
            )}
          </div>
          {plan.description && (
            <p className="mt-1 text-sm text-ink-faint">{plan.description}</p>
          )}
          <p className="mt-1 text-sm font-medium text-brand-600">
            {fmtPrice(plan.price, plan.currency)}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Limits table */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
        {Object.entries(plan.limits.channels).map(([provider, n]) => (
          <div key={provider} className="flex justify-between border-b border-line2 py-1">
            <span className="capitalize text-ink-faint">{provider}</span>
            <span className="font-medium text-ink">{fmtLimit(n)} ch</span>
          </div>
        ))}
        <div className="flex justify-between border-b border-line2 py-1">
          <span className="text-ink-faint">Members</span>
          <span className="font-medium text-ink">{fmtLimit(plan.limits.members)}</span>
        </div>
        <div className="flex justify-between border-b border-line2 py-1">
          <span className="text-ink-faint">Msg/month</span>
          <span className="font-medium text-ink">{fmtLimit(plan.limits.messages_per_month)}</span>
        </div>
        <div className="flex justify-between border-b border-line2 py-1">
          <span className="text-ink-faint">KBs</span>
          <span className="font-medium text-ink">{fmtLimit(plan.limits.knowledge_bases)}</span>
        </div>
        <div className="flex justify-between border-b border-line2 py-1">
          <span className="text-ink-faint">Storage</span>
          <span className="font-medium text-ink">{fmtLimit(plan.limits.storage_mb)} MB</span>
        </div>
      </div>
    </Card>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPlansPage() {
  const showToast = useUI((s) => s.showToast);
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [modal, setModal] = useState<'new' | Plan | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    api.admin
      .plans()
      .then(setPlans)
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 403)) setErr(e.message);
      });
  }, []);

  function handleSaved(saved: Plan) {
    setPlans((prev) => {
      if (!prev) return [saved];
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx === -1) return [...prev, saved].sort((a, b) => a.sort_order - b.sort_order);
      const next = [...prev];
      next[idx] = saved;
      return next;
    });
    setModal(null);
    showToast('Plan saved', 'success');
  }

  async function handleDelete(plan: Plan) {
    if (!confirm(`Delete plan "${plan.display_name}"? This cannot be undone.`)) return;
    setDeleting(plan.id);
    try {
      await api.admin.deletePlan(plan.id);
      setPlans((prev) => prev?.filter((p) => p.id !== plan.id) ?? null);
      showToast('Plan deleted', 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Package className="h-7 w-7" />}
        title="Plans"
        description="Define subscription tiers, limits, and pricing. Tenants are assigned a plan slug by admins."
        action={
          <Button onClick={() => setModal('new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            New plan
          </Button>
        }
      />
      <AdminPageBody>
        {err && <p className="mb-4 text-sm text-red-500">{err}</p>}
        {!plans && !err && <p className="text-sm text-ink-faint">Loading…</p>}

        {plans && plans.length === 0 && (
          <div className="rounded-xl border border-dashed border-line2 p-12 text-center">
            <Package className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
            <p className="text-sm text-ink-faint">No plans yet. Create one to get started.</p>
          </div>
        )}

        <div className="space-y-4">
          {plans?.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() => setModal(plan)}
              onDelete={() => handleDelete(plan)}
            />
          ))}
        </div>
      </AdminPageBody>

      {modal !== null && (
        <PlanModal
          initial={modal === 'new' ? null : modal}
          onSave={handleSaved}
          onClose={() => setModal(null)}
        />
      )}
    </AdminShell>
  );
}
