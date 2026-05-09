'use client';

import { useEffect, useState } from 'react';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/lib/i18n/useT';
import { api, ApiError, type Plan } from '@/lib/api';
import { useUI } from '@/store/ui';
import {
  CreditCard,
  Plug,
  Bot,
  Users,
  Folder,
  FileText,
  Star,
  AlertTriangle,
  ArrowRight,
} from '@/components/ui/Icon';

const INVOICES = [
  { plan: 'Growth Plan — April 2025', date: '17 Apr 2025', amount: '฿990' },
  { plan: 'Growth Plan — March 2025', date: '17 Mar 2025', amount: '฿990' },
  { plan: 'Starter Plan — February 2025', date: '17 Feb 2025', amount: '฿490' },
];

function fmtPrice(plan: Plan) {
  if (plan.price === 0) return 'Free';
  return `฿${plan.price.toLocaleString()}`;
}

function expiryLabel(plan: Plan) {
  if (plan.expiry_days === 0) return null;
  return `${plan.expiry_days}-day trial`;
}

export default function BillingPage() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const [busy, setBusy] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    api.plans().then(setPlans).catch(() => {});
  }, []);

  async function checkout(plan: string) {
    setBusy(plan);
    try {
      const { url } = await api.billing.checkout(plan);
      window.location.href = url; // Stripe Checkout — full page redirect
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'checkout failed';
      showToast(msg, 'error');
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy('portal');
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'portal failed';
      showToast(msg, 'error');
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon={<CreditCard className="h-7 w-7" />}
        title={t('billing.title').replace('💳 ', '')}
        description={t('billing.sub')}
      />
      <PageBody>
        {/* Current plan */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-plan-gradient p-7 text-white">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">
              {t('billing.currentPlan.label')}
            </div>
            <h3 className="flex items-center gap-1.5 text-xl font-extrabold">
              Growth Plan <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
            </h3>
            <p className="text-sm opacity-90">{t('billing.currentPlan.renew')}</p>

            <div className="mt-4 max-w-xs">
              <div className="mb-1 text-[13px] opacity-80">
                {t('billing.usage.label')}: 6,241 / 10,000
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-white" style={{ width: '62%' }} />
              </div>
              <div className="mt-1 text-xs opacity-70">{t('billing.usage.remaining')}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold">
              ฿990<span className="ml-1 text-base font-medium opacity-80">/mo</span>
            </div>
            <Button
              variant="white"
              className="mt-4 border-2 border-white/40 bg-white/20 text-white hover:bg-white/30"
              onClick={openPortal}
              disabled={busy === 'portal'}
              iconRight={<ArrowRight className="h-4 w-4" />}
            >
              {busy === 'portal' ? '…' : 'Manage subscription'}
            </Button>
          </div>
        </div>

        {/* Plan upgrade grid — clicking a plan kicks off Stripe Checkout. */}
        <Card>
          <CardHeader
            icon={<CreditCard className="h-4 w-4" />}
            title="Change plan"
            description="Upgrade or downgrade — Stripe handles the proration automatically."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            {plans.length === 0 && (
              <p className="col-span-3 text-sm text-ink-faint">Loading plans…</p>
            )}
            {plans.map((p) => {
              const popular = p.is_recommended;
              const trial = expiryLabel(p);
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border-2 bg-page p-5 ${
                    popular ? 'border-brand-600' : 'border-line2'
                  }`}
                >
                  {popular && (
                    <div className="-mt-1 mb-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      <Star className="h-3 w-3 fill-white" /> Popular
                    </div>
                  )}
                  <div className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                    {p.display_name}
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-ink">
                    {fmtPrice(p)}
                    {p.price > 0 && <span className="ml-1 text-sm font-medium text-ink-muted">/mo</span>}
                  </div>
                  {trial && (
                    <p className="mt-0.5 text-[12px] font-medium text-brand-600">{trial}</p>
                  )}
                  <p className="mt-1 text-[13px] text-ink-faint">{p.description}</p>
                  <Button
                    fullWidth
                    variant={popular ? 'primary' : 'outline'}
                    className="mt-4"
                    onClick={() => checkout(p.id)}
                    disabled={busy !== null}
                  >
                    {busy === p.id ? '…' : 'Choose'}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Usage cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={<span className="inline-flex items-center gap-1.5"><Plug className="h-4 w-4" /> Channels</span>}
            value="3 / 4"
            change="1 slot left"
          />
          <StatCard
            label={<span className="inline-flex items-center gap-1.5"><Bot className="h-4 w-4" /> AI Bots</span>}
            value="2 / 3"
            change="1 bot left"
          />
          <StatCard
            label={<span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> Members</span>}
            value="5 / 10"
            change="5 left"
          />
          <StatCard
            label={<span className="inline-flex items-center gap-1.5"><Folder className="h-4 w-4" /> Knowledge</span>}
            value="3.8"
            unit="GB"
            change="of 5 GB"
          />
        </div>

        {/* Payment method */}
        <Card>
          <CardHeader icon={<CreditCard className="h-4 w-4" />} title={t('billing.method.section')} />
          <div className="flex items-center gap-4 rounded-xl border border-line2 bg-page p-4">
            <div className="flex h-9 w-14 items-center justify-center rounded-md bg-gradient-to-br from-slate-900 to-slate-700 text-[10px] font-bold text-white">
              VISA
            </div>
            <div>
              <div className="text-sm font-semibold text-ink">•••• •••• •••• 4242</div>
              <div className="text-xs text-ink-faint">{t('billing.method.expires')} 12/27</div>
            </div>
            <div className="ml-auto">
              <Button variant="outline" size="sm">{t('billing.method.change')}</Button>
            </div>
          </div>
          <div className="mt-3">
            <Button variant="soft" size="sm">{t('billing.method.add')}</Button>
          </div>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader icon={<FileText className="h-4 w-4" />} title={t('billing.invoice.section')} />
          <ul>
            {INVOICES.map((iv, i) => (
              <li
                key={i}
                className="flex items-center gap-3 border-b border-line2 py-3.5 text-sm last:border-b-0"
              >
                <div className="flex-1">
                  <div className="font-semibold text-ink">{iv.plan}</div>
                  <div className="text-xs text-ink-faint">{iv.date}</div>
                </div>
                <div className="font-bold text-ink">{iv.amount}</div>
                <Badge tone="paid">{t('billing.invoice.paid')}</Badge>
                <button className="ml-2 text-[13px] font-semibold text-brand-600">PDF</button>
              </li>
            ))}
          </ul>
        </Card>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="flex-1">{t('billing.cancel.warn')}</span>
          <Button variant="danger" size="sm">
            {t('billing.cancel.btn')}
          </Button>
        </div>
      </PageBody>
    </AppShell>
  );
}
