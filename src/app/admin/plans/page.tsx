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
import { Package, Plus, Pencil, Trash2, Info } from '@/components/ui/Icon';

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
    stripe_price_id: '',
    stripe_price_id_yearly: '',
    yearly_price: 0,
    yearly_saving_label: '',
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

            {/* Stripe integration */}
            <div className="rounded-xl border border-line2 p-4 space-y-3">
              <p className="text-[13px] font-semibold text-ink">
                Stripe Price IDs{' '}
                <a
                  href="https://dashboard.stripe.com/products"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-1 text-[12px] font-normal text-brand-600 underline"
                >
                  Open Stripe Dashboard →
                </a>
              </p>
              {/* Price IDs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink">
                    Monthly price ID
                  </label>
                  <Input
                    value={form.stripe_price_id ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, stripe_price_id: e.target.value }))}
                    placeholder="price_monthly…"
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink">
                    Yearly price ID
                  </label>
                  <Input
                    value={form.stripe_price_id_yearly ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, stripe_price_id_yearly: e.target.value }))}
                    placeholder="price_yearly… (optional)"
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Yearly display pricing */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink">
                    Yearly display price
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={form.yearly_price ?? 0}
                    onChange={(e) => setForm((f) => ({ ...f, yearly_price: parseFloat(e.target.value) || 0 }))}
                    placeholder="e.g. 9900"
                  />
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Total charged per year (e.g. ฿9,900). Shown on the billing page.
                  </p>
                </div>
                <div>
                  <label className="mb-1 block text-[13px] font-medium text-ink">
                    Savings badge label
                  </label>
                  <Input
                    value={form.yearly_saving_label ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, yearly_saving_label: e.target.value }))}
                    placeholder="e.g. 2 months free, Save 17%"
                  />
                  <p className="mt-1 text-[11px] text-ink-faint">
                    Badge shown next to the yearly price. Leave empty to hide.
                  </p>
                </div>
              </div>

              <p className="text-[11px] text-ink-faint">
                Leave yearly fields empty to offer monthly billing only. Free plans don't need any.
              </p>
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
              <p className="mb-2 text-[13px] font-medium text-ink">Channel limits</p>
              <div className="rounded-lg border border-line2 divide-y divide-line2">
                {[...KNOWN_PROVIDERS, ...extraProviders].map((provider) => {
                  const val = form.limits.channels[provider] ?? 0;
                  const isUnlimited = val === -1;
                  return (
                    <div key={provider} className="flex items-center gap-3 px-4 py-2">
                      <span className="w-28 text-sm capitalize text-ink">{provider}</span>
                      <Input
                        type="number"
                        min={0}
                        value={isUnlimited ? '' : val}
                        placeholder={isUnlimited ? '∞' : '0'}
                        disabled={isUnlimited}
                        onChange={(e) => setChannelLimit(provider, e.target.value)}
                        className={`w-20 ${isUnlimited ? 'opacity-40' : ''}`}
                      />
                      <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-muted">
                        <input
                          type="checkbox"
                          checked={isUnlimited}
                          onChange={(e) => setChannelLimit(provider, e.target.checked ? '-1' : '0')}
                          className="h-3.5 w-3.5 rounded border-line2"
                        />
                        Unlimited
                      </label>
                    </div>
                  );
                })}
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
              <p className="mb-2 text-[13px] font-medium text-ink">Usage limits</p>
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { key: 'members', label: 'Team members' },
                    { key: 'messages_per_month', label: 'AI messages / month' },
                    { key: 'knowledge_bases', label: 'Knowledge bases' },
                    { key: 'storage_mb', label: 'Storage (MB)' },
                  ] as { key: keyof Omit<PlanLimits, 'channels'>; label: string }[]
                ).map(({ key, label }) => {
                  const isUnlimited = form.limits[key] === -1;
                  return (
                    <div key={key}>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="text-[13px] text-ink-faint">{label}</label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-ink-muted">
                          <input
                            type="checkbox"
                            checked={isUnlimited}
                            onChange={(e) =>
                              setLimit(key, e.target.checked ? '-1' : '0')
                            }
                            className="h-3.5 w-3.5 rounded border-line2"
                          />
                          Unlimited
                        </label>
                      </div>
                      <Input
                        type="number"
                        min={0}
                        value={isUnlimited ? '' : form.limits[key]}
                        placeholder={isUnlimited ? '∞ Unlimited' : '0'}
                        disabled={isUnlimited}
                        onChange={(e) => setLimit(key, e.target.value)}
                        className={isUnlimited ? 'opacity-40' : ''}
                      />
                    </div>
                  );
                })}
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
          {plan.price > 0 && (
            <div className="mt-0.5 space-y-0.5">
              {plan.stripe_price_id ? (
                <p className="font-mono text-[11px] text-ink-faint">
                  Monthly: {plan.stripe_price_id}
                </p>
              ) : (
                <p className="text-[11px] text-amber-500">⚠ No monthly price ID</p>
              )}
              {plan.stripe_price_id_yearly ? (
                <p className="font-mono text-[11px] text-ink-faint">
                  Yearly: {plan.stripe_price_id_yearly}
                </p>
              ) : (
                <p className="text-[11px] text-ink-faint">No yearly price (monthly only)</p>
              )}
            </div>
          )}
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
        {/* ── Stripe setup guide ────────────────────────────────────── */}
        <div className="mb-6 flex gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-1.5">
            <p className="font-semibold">How to connect a plan to Stripe</p>
            <ol className="list-decimal space-y-1 pl-4 text-[13px] leading-relaxed">
              <li>
                Open{' '}
                <a
                  href="https://dashboard.stripe.com/products"
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline underline-offset-2"
                >
                  Stripe Dashboard → Products
                </a>{' '}
                and create a product with a recurring price for each paid plan.
              </li>
              <li>
                Click a price to open it, then copy its <strong>Price ID</strong> — it starts with{' '}
                <code className="rounded bg-blue-100 px-1 py-0.5 font-mono text-[12px] dark:bg-blue-900/40">
                  price_
                </code>.
              </li>
              <li>
                Edit the matching plan below, paste the Price ID into the{' '}
                <strong>Stripe Price ID</strong> field, and save.
              </li>
            </ol>
            <p className="text-[12px] text-blue-600 dark:text-blue-400">
              Free plans don't need a Price ID. Paid plans without one will show an error when a tenant tries to check out.
            </p>
          </div>
        </div>

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
