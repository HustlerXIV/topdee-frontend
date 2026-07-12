"use client";

import { useEffect, useState } from "react";
import { AppShell, PageBody, PageHeader, useRoleGuard } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { useT } from "@/lib/i18n/useT";
import {
  api,
  ApiError,
  type BillingInfo,
  type Plan,
  type PaymentMethod,
  type Invoice,
} from "@/lib/api";
import { useUI } from "@/store/ui";
import {
  CreditCard,
  Plug,
  Bot,
  Users,
  Folder,
  Star,
  AlertTriangle,
  ArrowRight,
  Trash2,
  QrCode,
  Gift,
} from "@/components/ui/Icon";
import { Dialog, ConfirmDialog } from "@/components/ui/Dialog";

// ── helpers ──────────────────────────────────────────────────────────

type Interval = "month" | "year";

// Returns the effective interval for a plan — falls back to 'month' when the
// user picked 'year' but the plan has no yearly price ID.
function effectiveInterval(plan: Plan, interval: Interval): Interval {
  if (interval === "year" && !plan.stripe_price_id_yearly) return "month";
  return interval;
}

function planPrice(plan: Plan, interval: Interval) {
  if (plan.price === 0) return null; // handled separately with t()
  const eff = effectiveInterval(plan, interval);
  if (eff === "year") {
    const yp = plan.yearly_price ?? 0;
    return yp > 0 ? `฿${yp.toLocaleString()}` : "—";
  }
  return `฿${plan.price.toLocaleString()}`;
}

function planPriceSuffix(plan: Plan, interval: Interval) {
  if (plan.price === 0) return "";
  return effectiveInterval(plan, interval) === "year" ? "/yr" : "/mo";
}

function planHasInterval(plan: Plan, interval: Interval) {
  if (interval === "month") return !!plan.stripe_price_id;
  return !!plan.stripe_price_id_yearly;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type BadgeTone =
  | "default"
  | "paid"
  | "pending"
  | "error"
  | "success"
  | "neutral"
  | "warning";

function subStatusBadge(status?: string) {
  if (!status) return null;
  const tone: BadgeTone =
    status === "active"
      ? "paid"
      : status === "trialing"
        ? "default"
        : status === "past_due"
          ? "pending"
          : "error";
  const label =
    status === "active"
      ? "Active"
      : status === "trialing"
        ? "Trial"
        : status === "past_due"
          ? "Past due"
          : status === "paused"
            ? "Paused"
            : status === "canceled"
              ? "Canceled"
              : status;
  return <Badge tone={tone}>{label}</Badge>;
}

function fmtLimit(n: number, unit: string, unlimited: string) {
  if (n === -1) return `${unlimited} ${unit}`;
  if (n === 0) return null; // not included
  return `${n.toLocaleString()} ${unit}`;
}

function planFeatures(p: Plan, unlimited: string) {
  const items: string[] = [];

  const msg = fmtLimit(
    p.limits?.messages_per_month ?? 0,
    "AI messages/mo",
    unlimited,
  );
  if (msg) items.push(msg);

  const members = fmtLimit(p.limits?.members ?? 0, "team members", unlimited);
  if (members) items.push(members);

  const kb = fmtLimit(
    p.limits?.knowledge_bases ?? 0,
    "knowledge bases",
    unlimited,
  );
  if (kb) items.push(kb);

  const storage = p.limits?.storage_mb;
  if (storage && storage !== 0) {
    items.push(
      storage === -1
        ? `${unlimited} storage`
        : `${storage >= 1024 ? `${Math.round(storage / 1024)} GB` : `${storage} MB`} storage`,
    );
  }

  // Channel connections — either the explicit total cap (in "total" mode)
  // or the sum of per-provider caps (legacy mode).
  if (p.limits?.channel_limit_mode === 'total') {
    const total = p.limits.total_channels ?? 0;
    if (total === -1) {
      items.push(`${unlimited} channel connections (any mix)`);
    } else if (total > 0) {
      items.push(`${total} channel connection${total !== 1 ? "s" : ""} (any mix)`);
    }
  } else if (p.limits?.channels) {
    const total = Object.values(p.limits.channels).reduce((a, b) => a + b, 0);
    const hasUnlimited = Object.values(p.limits.channels).some((v) => v === -1);
    if (hasUnlimited) items.push(`${unlimited} channel connections`);
    else if (total > 0)
      items.push(`${total} channel connection${total !== 1 ? "s" : ""}`);
  }

  return items;
}

function usagePct(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

// Card brand → simple label + colour
function brandLabel(brand: string) {
  return brand.charAt(0).toUpperCase() + brand.slice(1);
}
function brandBg(brand: string) {
  const map: Record<string, string> = {
    visa: "from-blue-900 to-blue-700",
    mastercard: "from-red-800 to-orange-600",
    amex: "from-sky-800 to-sky-600",
    unionpay: "from-red-700 to-red-500",
  };
  return map[brand.toLowerCase()] ?? "from-slate-800 to-slate-600";
}

// ── component ─────────────────────────────────────────────────────────

export default function BillingPage() {
  useRoleGuard(['owner']);
  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [info, setInfo] = useState<BillingInfo | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [interval, setInterval] = useState<Interval>("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [busyPP, setBusyPP] = useState<string | null>(null); // PromptPay checkout loading
  const [removingCard, setRemovingCard] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [paymentDialog, setPaymentDialog] = useState<Plan | null>(null);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [removeCardDialog, setRemoveCardDialog] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.billing.info().then(setInfo),
      api.plans().then(setPlans),
      api.billing.paymentMethods().then((r) => setCards(r.payment_methods)),
      api.billing.invoices().then((r) => setInvoices(r.invoices)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Handle Stripe redirect back
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const sessionId = params.get("session_id");
    if (status === "success") {
      window.history.replaceState({}, "", "/billing");
      // Sync the checkout session directly from Stripe so the plan updates
      // immediately — this works even if webhooks aren't configured yet.
      (sessionId ? api.syncCheckoutSession(sessionId) : Promise.resolve())
        .catch(() => {})
        .finally(() => {
          Promise.all([
            api.billing.info().then(setInfo),
            api.billing
              .paymentMethods()
              .then((r) => setCards(r.payment_methods)),
          ])
            .catch(() => {})
            .finally(() =>
              showToast(
                "Payment successful — your plan has been updated!",
                "success",
              ),
            );
        });
    } else if (status === "cancel") {
      showToast("Checkout cancelled — no charge was made.", "default");
      window.history.replaceState({}, "", "/billing");
    }
  }, [showToast]);

  async function checkout(planId: string) {
    setBusy(planId);
    try {
      const p = plans.find((x) => x.id === planId);
      // If yearly selected but plan has no yearly price, fall back to monthly.
      const eff = p ? effectiveInterval(p, interval) : interval;
      const { url } = await api.billing.checkout(planId, eff);
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Checkout failed", "error");
      setBusy(null);
    }
  }

  async function promptPayCheckout(planId: string) {
    setBusyPP(planId);
    try {
      const p = plans.find((x) => x.id === planId);
      const eff = p ? effectiveInterval(p, interval) : interval;
      const { url } = await api.billing.promptPayCheckout(planId, eff);
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "PromptPay checkout failed", "error");
      setBusyPP(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const { url } = await api.billing.portal();
      window.location.href = url;
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Portal failed", "error");
      setBusy(null);
    }
  }

  async function cancelPlan() {
    setCanceling(true);
    setCancelDialog(false);
    try {
      await api.billing.cancel();
      setInfo((prev) =>
        prev && prev.subscription
          ? { ...prev, subscription: { ...prev.subscription, cancel_at_period_end: true } }
          : prev,
      );
      showToast(
        `Subscription will cancel on ${fmtDate(sub?.current_period_end)}. You keep access until then.`,
        "success",
      );
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Cancel failed", "error");
    } finally {
      setCanceling(false);
    }
  }

  async function reactivatePlan() {
    setReactivating(true);
    try {
      await api.billing.reactivate();
      setInfo((prev) =>
        prev && prev.subscription
          ? {
              ...prev,
              subscription: {
                ...prev.subscription,
                cancel_at_period_end: false,
              },
            }
          : prev,
      );
      showToast(
        "Subscription reactivated — it will renew normally.",
        "success",
      );
    } catch (e) {
      showToast(
        e instanceof ApiError ? e.message : "Reactivate failed",
        "error",
      );
    } finally {
      setReactivating(false);
    }
  }

  async function removeCard(id: string) {
    setRemoveCardDialog(null);
    setRemovingCard(id);
    try {
      await api.billing.removePaymentMethod(id);
      setCards((prev) => prev.filter((c) => c.id !== id));
      showToast(t("billing.method.remove"), "success");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "Remove failed", "error");
    } finally {
      setRemovingCard(null);
    }
  }

  const sub = info?.subscription;
  const plan = info?.plan;
  const usage = info?.usage;
  const discountPct = info?.referral_discount_percent ?? 0;
  const discountExpiresAt = info?.referral_discount_expires_at;

  const msgLimit = plan?.limits?.messages_per_month ?? 0; // -1 = unlimited
  const memberLimit = plan?.limits?.members ?? 0; // -1 = unlimited
  // Channel cap — mirror planFeatures() above:
  //  • total mode → the explicit `total_channels` cap
  //  • per-provider → sum of the per-provider caps, but any -1 (unlimited)
  //    poisons a plain sum, so surface unlimited instead of a bogus number.
  // Result convention: -1 = unlimited, 0 = none/unknown, >0 = finite cap.
  const chanLimit = (() => {
    const lim = plan?.limits;
    if (!lim) return 0;
    if (lim.channel_limit_mode === 'total') {
      return lim.total_channels ?? 0; // -1 unlimited, 0 none, >0 cap
    }
    const vals = Object.values(lim.channels ?? {});
    if (vals.some((v) => v === -1)) return -1; // unlimited
    return vals.reduce((a, b) => (b > 0 ? a + b : a), 0);
  })();
  const msgPct = usagePct(usage?.messages_this_month ?? 0, msgLimit);
  // Show usage bar only when there is a real finite cap (> 0 and not -1)
  const msgLimitFinite = msgLimit > 0;

  const isFree = !plan || plan.price === 0;
  const isActive = sub?.status === "active" || sub?.status === "trialing";
  const isPastDue = sub?.status === "past_due";
  // Show cancel section whenever there is a live subscription — even if the
  // subscription sub-document hasn't synced yet (status still null/missing).
  const hasLiveSub = info?.has_subscription && sub?.status !== "canceled";

  const unlimited = t("billing.stat.unlimited");

  return (
    <AppShell>
      <PageHeader
        icon={<CreditCard className="h-7 w-7" />}
        title={t("billing.title").replace("💳 ", "")}
        description={t("billing.sub")}
      />
      <PageBody>
        {/* ── Usage stats ───────────────────────────────────────────── */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Plug className="h-4 w-4" /> {t("billing.stat.channels")}
              </span>
            }
            value={
              loading
                ? "…"
                : chanLimit > 0
                  ? `${usage?.channels ?? 0} / ${chanLimit}`
                  : String(usage?.channels ?? 0)
            }
            change={
              chanLimit > 0
                ? t("billing.stat.slotsLeft").replace(
                    "{n}",
                    String(Math.max(0, chanLimit - (usage?.channels ?? 0))),
                  )
                : unlimited
            }
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" /> {t("billing.stat.members")}
              </span>
            }
            value={
              loading
                ? "…"
                : memberLimit > 0
                  ? `${usage?.members ?? 0} / ${memberLimit}`
                  : String(usage?.members ?? 0)
            }
            change={
              memberLimit > 0
                ? t("billing.stat.left").replace(
                    "{n}",
                    String(Math.max(0, memberLimit - (usage?.members ?? 0))),
                  )
                : unlimited
            }
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Bot className="h-4 w-4" /> {t("billing.stat.aiMessages")}
              </span>
            }
            value={
              loading
                ? "…"
                : msgLimitFinite
                  ? `${(usage?.messages_this_month ?? 0).toLocaleString()} / ${msgLimit.toLocaleString()}`
                  : (usage?.messages_this_month ?? 0).toLocaleString()
            }
            change={
              msgLimitFinite
                ? t("billing.stat.thisMonth")
                : msgLimit === -1
                  ? unlimited
                  : t("billing.stat.thisMonth")
            }
          />
        </div>

        {/* ── Current plan banner ────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-plan-gradient p-7 text-white">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">
              {t("billing.currentPlan.label")}
            </div>
            <h3 className="flex items-center gap-2 text-xl font-extrabold">
              {loading ? "…" : (plan?.display_name ?? plan?.id ?? "—")}
              {!isFree && isActive && (
                <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
              )}
              {sub?.status && subStatusBadge(sub.status)}
            </h3>
            {sub?.current_period_end && isActive && (
              <p className="text-sm opacity-90">
                {sub.cancel_at_period_end
                  ? t("billing.currentPlan.cancels").replace(
                      "{date}",
                      fmtDate(sub.current_period_end),
                    )
                  : t("billing.currentPlan.renews").replace(
                      "{date}",
                      fmtDate(sub.current_period_end),
                    )}
              </p>
            )}
            {sub?.trial_ends_at && sub.status === "trialing" && (
              <p className="text-sm opacity-90">
                {t("billing.currentPlan.trial").replace(
                  "{date}",
                  fmtDate(sub.trial_ends_at),
                )}
              </p>
            )}
            {isPastDue && (
              <p className="mt-1 text-sm font-semibold text-red-300">
                ⚠ {t("billing.pastDue.msg")}
              </p>
            )}
            {msgLimitFinite ? (
              <div className="mt-4 max-w-xs">
                <div className="mb-1 text-[13px] opacity-80">
                  {t("billing.usage.label")}:{" "}
                  {(usage?.messages_this_month ?? 0).toLocaleString()} /{" "}
                  {msgLimit.toLocaleString()}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white transition-all"
                    style={{ width: `${msgPct}%` }}
                  />
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {Math.max(
                    0,
                    msgLimit - (usage?.messages_this_month ?? 0),
                  ).toLocaleString()}{" "}
                  {t("billing.usage.remaining")} · {msgPct}% used
                </div>
              </div>
            ) : msgLimit === -1 ? (
              <div className="mt-3 text-[13px] opacity-80">
                {t("billing.usage.label")}:{" "}
                {(usage?.messages_this_month ?? 0).toLocaleString()} ·{" "}
                <span className="font-semibold">{unlimited}</span>
              </div>
            ) : null}
          </div>
          <div className="text-right">
            <div className="text-4xl font-extrabold">
              {loading
                ? "…"
                : plan
                  ? plan.price === 0
                    ? t("billing.price.free")
                    : `฿${plan.price.toLocaleString()}`
                  : "—"}
              {plan && plan.price > 0 && (
                <span className="ml-1 text-base font-medium opacity-80">
                  /mo
                </span>
              )}
            </div>
            {info?.has_subscription && (
              <Button
                variant="white"
                className="mt-4 border-2 border-white/40 bg-white/20 text-white hover:bg-white/30"
                onClick={openPortal}
                disabled={busy === "portal"}
                iconRight={<ArrowRight className="h-4 w-4" />}
              >
                {busy === "portal" ? "…" : t("billing.manage")}
              </Button>
            )}
          </div>
        </div>

        {/* ── Past-due warning ─────────────────────────────────────── */}
        {isPastDue && (
          <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">{t("billing.pastDue.msg")}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={openPortal}
              disabled={busy === "portal"}
            >
              {busy === "portal" ? "…" : t("billing.pastDue.fix")}
            </Button>
          </div>
        )}

        {/* ── Referral discount notice ──────────────────────────────── */}
        {discountPct > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800/40 dark:bg-green-950/30 dark:text-green-300">
            <Gift className="h-4 w-4 shrink-0" />
            <span>
              {discountExpiresAt
                ? t("billing.referral.discountActive")
                    .replace("{pct}", String(discountPct))
                    .replace("{date}", fmtDate(discountExpiresAt))
                : t("billing.referral.discountNoDate")
                    .replace("{pct}", String(discountPct))}
            </span>
          </div>
        )}

        {/* ── Plan upgrade grid ─────────────────────────────────────── */}
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardHeader
                icon={<CreditCard className="h-4 w-4" />}
                title={t("billing.plans.title")}
                description={t("billing.plans.desc")}
              />
            </div>
            {/* Monthly / Yearly toggle */}
            <div className="flex items-center gap-1 rounded-xl border border-line2 bg-muted p-1 text-sm">
              <button
                onClick={() => setInterval("month")}
                className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  interval === "month"
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t("billing.plans.monthly")}
              </button>
              <button
                onClick={() => setInterval("year")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors ${
                  interval === "year"
                    ? "bg-card text-ink shadow-sm"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {t("billing.plans.yearly")}
                {plans.some((p) => p.yearly_saving_label) && (
                  <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                    {t("billing.plans.saveMore")}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {loading && (
              <p className="col-span-3 text-sm text-ink-faint">
                {t("billing.plans.loading")}
              </p>
            )}
            {!loading && plans.length === 0 && (
              <p className="col-span-3 text-sm text-ink-faint">
                {t("billing.plans.empty")}
              </p>
            )}
            {plans.map((p) => {
              const popular = p.is_recommended;
              const isCurrent = plan?.id === p.id;
              // Use effective interval: if yearly selected but plan has no
              // yearly price, fall back to monthly so the plan is still selectable.
              const eff = effectiveInterval(p, interval);
              const hasYearly = planHasInterval(p, "year");
              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border-2 bg-page p-5 ${
                    isCurrent
                      ? "border-green-500 ring-1 ring-green-500/40"
                      : popular
                        ? "border-brand-600"
                        : "border-line2"
                  }`}
                >
                  {popular && !isCurrent && (
                    <div className="-mt-1 mb-2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      <Star className="h-3 w-3 fill-white" />{" "}
                      {t("billing.plans.popular")}
                    </div>
                  )}
                  {isCurrent && (
                    <div className="-mt-1 mb-2 inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                      ✓ {t("billing.plans.current")}
                    </div>
                  )}
                  <div className="text-sm font-semibold uppercase tracking-wider text-ink-muted">
                    {p.display_name}
                  </div>
                  <div className="mt-1 text-3xl font-extrabold text-ink">
                    {p.price === 0
                      ? t("billing.price.free")
                      : discountPct > 0
                        ? (() => {
                            const raw = eff === "year"
                              ? (p.yearly_price ?? p.price * 12)
                              : p.price;
                            const discounted = Math.floor(raw * (100 - discountPct) / 100);
                            return `฿${discounted.toLocaleString()}`;
                          })()
                        : planPrice(p, interval)}
                    {p.price > 0 && (
                      <span className="ml-1 text-sm font-medium text-ink-muted">
                        {planPriceSuffix(p, interval)}
                      </span>
                    )}
                  </div>
                  {discountPct > 0 && p.price > 0 && (
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="text-[12px] text-ink-faint line-through">
                        {planPrice(p, interval)}
                      </span>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-400">
                        Referral -{discountPct}%
                      </span>
                    </div>
                  )}
                  {/* Yearly billing note */}
                  {interval === "year" && p.price > 0 && hasYearly && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {p.yearly_saving_label && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {p.yearly_saving_label}
                        </span>
                      )}
                      <span className="text-[12px] text-ink-faint">
                        ฿{(p.yearly_price ?? p.price * 12).toLocaleString()}{" "}
                        {t("billing.plans.billedAnnually")}
                      </span>
                    </div>
                  )}
                  {/* Fallback note: yearly selected but plan is monthly-only */}
                  {interval === "year" && p.price > 0 && !hasYearly && (
                    <p className="mt-0.5 text-[12px] text-ink-faint">
                      {t("billing.plans.noYearly")} —{" "}
                      {t("billing.plans.monthly").toLowerCase()}
                    </p>
                  )}
                  <p className="mt-1 text-[13px] text-ink-faint">
                    {p.description}
                  </p>

                  {/* ── Plan feature list ── */}
                  {planFeatures(p, unlimited).length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-line2 pt-3">
                      {planFeatures(p, unlimited).map((feat) => (
                        <li
                          key={feat}
                          className="flex items-start gap-2 text-[13px] text-ink"
                        >
                          <span className="mt-px text-green-500">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Button
                    fullWidth
                    variant={
                      isCurrent ? "soft" : popular ? "primary" : "outline"
                    }
                    className="mt-4"
                    onClick={() => {
                      if (!isCurrent && p.price > 0) setPaymentDialog(p);
                    }}
                    disabled={busy !== null || busyPP !== null || isCurrent || p.price === 0}
                  >
                    {isCurrent
                      ? t("billing.plans.current")
                      : p.price === 0
                        ? t("billing.plans.free")
                        : t("billing.plans.choose")}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>

        {/* ── Saved payment methods ─────────────────────────────────── */}
        <Card>
          <CardHeader
            icon={<CreditCard className="h-4 w-4" />}
            title={t("billing.method.title")}
            description={t("billing.method.desc")}
          />
          {loading && (
            <p className="text-sm text-ink-faint">
              {t("billing.method.loading")}
            </p>
          )}

          {!loading && cards.length === 0 && (
            <p className="text-sm text-ink-faint">
              {t("billing.method.empty")}
            </p>
          )}

          {cards.length > 0 && (
            <ul className="space-y-3">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="flex items-center gap-4 rounded-xl border border-line2 bg-page p-3"
                >
                  {/* Card chip */}
                  <div
                    className={`flex h-9 w-14 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${brandBg(card.brand)} text-[10px] font-bold uppercase text-white`}
                  >
                    {brandLabel(card.brand)}
                  </div>
                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                      •••• •••• •••• {card.last4}
                      {card.is_default && (
                        <Badge tone="success">
                          {t("billing.method.default")}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-ink-faint">
                      {t("billing.method.expires")}{" "}
                      {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                    </div>
                  </div>
                  {/* Actions */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600"
                    onClick={() => setRemoveCardDialog(card.id)}
                    disabled={removingCard === card.id}
                  >
                    {removingCard === card.id ? (
                      "…"
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openPortal}
              disabled={busy === "portal"}
            >
              {busy === "portal" ? "…" : t("billing.method.addChange")}
            </Button>
          </div>
        </Card>

        {/* ── Expired callout ───────────────────────────────────────── */}
        {sub?.status === "canceled" && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300">
            <Folder className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1">
              {t("billing.expired.msg").replace(
                "{date}",
                fmtDate(sub.canceled_at ?? sub.current_period_end),
              )}
            </span>
          </div>
        )}

        {/* ── Payment history ───────────────────────────────────────── */}
        {(invoices.length > 0 || loading) && (
          <Card>
            <CardHeader
              icon={<Folder className="h-4 w-4" />}
              title={t("billing.invoice.section")}
              description={t("billing.invoice.desc")}
            />
            {loading && (
              <p className="text-sm text-ink-faint">
                {t("billing.method.loading")}
              </p>
            )}
            {!loading && invoices.length === 0 && (
              <p className="text-sm text-ink-faint">
                {t("billing.invoice.empty")}
              </p>
            )}
            {invoices.length > 0 && (
              <ul className="divide-y divide-line2">
                {invoices.map((inv) => {
                  const amount = (inv.amount_paid / 100).toLocaleString(
                    undefined,
                    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                  );
                  const currency = inv.currency.toUpperCase();
                  const isPromptPay = inv.source === "promptpay";
                  const statusTone =
                    inv.status === "paid"
                      ? "success"
                      : inv.status === "open"
                        ? "warning"
                        : "neutral";
                  return (
                    <li
                      key={inv.id}
                      className="flex flex-wrap items-center gap-3 py-3 text-sm"
                    >
                      {/* PromptPay QR icon */}
                      {isPromptPay && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#003F8A]/20 bg-[#003F8A]/10 text-[#003F8A] dark:border-blue-400/20 dark:bg-blue-950/30 dark:text-blue-300">
                          <QrCode className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">
                            {currency} {amount}
                          </span>
                          <Badge tone={statusTone as "success" | "warning" | "neutral"}>
                            {inv.status === "paid" ? t("billing.invoice.paid") : inv.status}
                          </Badge>
                          {isPromptPay && (
                            <span className="rounded-full border border-[#003F8A]/20 bg-[#003F8A]/10 px-2 py-0.5 text-[10px] font-bold text-[#003F8A] dark:border-blue-400/20 dark:bg-blue-950/30 dark:text-blue-300">
                              PromptPay
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 text-xs text-ink-faint">
                          {/* Description (PromptPay) or invoice number + period (card) */}
                          {isPromptPay && inv.description && (
                            <span>{inv.description}</span>
                          )}
                          {!isPromptPay && inv.number && (
                            <span className="mr-2">{inv.number}</span>
                          )}
                          {!isPromptPay && inv.period_start && inv.period_end && (
                            <span>{inv.period_start} → {inv.period_end}</span>
                          )}
                          <span className="ml-2 opacity-70">{inv.created_at}</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        {inv.invoice_url && (
                          <a
                            href={inv.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-brand-600 underline underline-offset-2 hover:text-brand-700"
                          >
                            {isPromptPay ? "Receipt" : "View"}
                          </a>
                        )}
                        {!isPromptPay && inv.pdf_url && (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-medium text-ink-muted underline underline-offset-2 hover:text-ink"
                          >
                            PDF
                          </a>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        )}

        {/* ── Cancel / Reactivate section ──────────────────────────── */}
        {(!isFree || hasLiveSub) && (isActive || hasLiveSub) && (
          <div
            className={`mb-6 rounded-2xl border p-5 ${
              sub?.cancel_at_period_end
                ? "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30"
                : "border-line2 bg-page"
            }`}
          >
            {sub?.cancel_at_period_end ? (
              /* ── Already scheduled to cancel ── */
              <div className="flex flex-wrap items-start gap-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    {t("billing.cancel.scheduled").replace(
                      "{date}",
                      fmtDate(sub.current_period_end),
                    )}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    {t("billing.cancel.scheduledDesc")
                      .replace("{plan}", plan?.display_name ?? "")
                      .replace("{date}", fmtDate(sub.current_period_end))}
                  </p>
                  {/* PromptPay renewal hint — shown when there is no Stripe
                      recurring subscription (PromptPay is always cancel_at_period_end) */}
                  {!info?.has_subscription && (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-amber-600 dark:text-amber-400">
                      <QrCode className="h-3.5 w-3.5 shrink-0" />
                      {t("billing.promptpay.renew")}
                    </p>
                  )}
                </div>
                {/* Only show the "Reactivate" button for card subscriptions */}
                {info?.has_subscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={reactivatePlan}
                    disabled={reactivating}
                  >
                    {reactivating ? "…" : t("billing.cancel.undo")}
                  </Button>
                )}
              </div>
            ) : (
              /* ── Active, offer cancel ── */
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-ink">
                    {t("billing.cancel.title")}
                  </p>
                  <p className="text-sm text-ink-faint">
                    {t("billing.cancel.desc")
                      .replace("{plan}", plan?.display_name ?? "")
                      .replace("{date}", fmtDate(sub?.current_period_end))}
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setCancelDialog(true)}
                  disabled={canceling}
                >
                  {canceling
                    ? t("billing.cancel.canceling")
                    : t("billing.cancel.btn")}
                </Button>
              </div>
            )}
          </div>
        )}
        {/* ── Payment method picker ─────────────────────────────────── */}
        <PaymentMethodDialog
          plan={paymentDialog}
          interval={interval}
          discountPct={discountPct}
          onClose={() => setPaymentDialog(null)}
          onCard={(planId) => {
            setPaymentDialog(null);
            checkout(planId);
          }}
          onPromptPay={(planId) => {
            setPaymentDialog(null);
            promptPayCheckout(planId);
          }}
          busyCard={busy}
          busyPP={busyPP}
          t={t}
        />

        {/* ── Confirm dialogs ───────────────────────────────────────── */}
        <ConfirmDialog
          open={cancelDialog}
          onClose={() => setCancelDialog(false)}
          onConfirm={cancelPlan}
          loading={canceling}
          variant="danger"
          title={t("billing.cancel.title")}
          description={
            t("billing.cancel.desc")
              .replace("{plan}", plan?.display_name ?? "")
              .replace("{date}", fmtDate(sub?.current_period_end))
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          confirmLabel={t("billing.cancel.btn")}
          cancelLabel={t("billing.cancel.keep")}
        />

        <ConfirmDialog
          open={removeCardDialog !== null}
          onClose={() => setRemoveCardDialog(null)}
          onConfirm={() => removeCardDialog && removeCard(removeCardDialog)}
          loading={removingCard !== null}
          variant="warning"
          title={t("billing.method.remove")}
          description={t("billing.method.removeConfirm")}
          icon={<Trash2 className="h-5 w-5" />}
          confirmLabel={t("billing.method.remove")}
        />
      </PageBody>
    </AppShell>
  );
}

// ── PaymentMethodDialog ───────────────────────────────────────────────────────

function PaymentMethodDialog({
  plan,
  interval,
  discountPct = 0,
  onClose,
  onCard,
  onPromptPay,
  busyCard,
  busyPP,
  t,
}: {
  plan: Plan | null;
  interval: Interval;
  discountPct?: number;
  onClose: () => void;
  onCard: (planId: string) => void;
  onPromptPay: (planId: string) => void;
  busyCard: string | null;
  busyPP: string | null;
  t: (key: string) => string;
}) {
  if (!plan) return null;

  // Compute effective price label for this interval
  const eff: Interval =
    interval === "year" && plan.stripe_price_id_yearly ? "year" : "month";
  const rawPrice = eff === "year"
    ? (plan.yearly_price ?? plan.price * 12)
    : plan.price;
  const discountedPrice = discountPct > 0
    ? Math.floor(rawPrice * (100 - discountPct) / 100)
    : rawPrice;
  const suffix = eff === "year" ? "/yr" : "/mo";
  const priceLabel =
    plan.price === 0
      ? t("billing.price.free")
      : discountPct > 0
        ? `฿${rawPrice.toLocaleString()} → ฿${discountedPrice.toLocaleString()}${suffix} (Referral -${discountPct}%)`
        : `฿${rawPrice.toLocaleString()}${suffix}`;

  const anyBusy = busyCard !== null || busyPP !== null;

  return (
    <Dialog
      open={!!plan}
      onClose={onClose}
      title={t("billing.payMethod.title")}
      description={`${t("billing.payMethod.for")}: ${plan.display_name} — ${priceLabel}`}
      icon={<CreditCard className="h-5 w-5" />}
      width="max-w-sm"
    >
      <Dialog.Body className="space-y-3 pb-6">
        {/* ── Card option ── */}
        <button
          type="button"
          onClick={() => onCard(plan.id)}
          disabled={anyBusy}
          className="group flex w-full items-start gap-4 rounded-xl border-2 border-line2 bg-page p-4 text-left transition-all hover:border-brand-400 hover:bg-brand-softer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">
                {t("billing.payMethod.card.title")}
              </span>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-950/50 dark:text-green-400">
                {t("billing.payMethod.card.badge")}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {t("billing.payMethod.card.desc")}
            </p>
          </div>
          {busyCard === plan.id ? (
            <span className="shrink-0 text-sm text-ink-faint">…</span>
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
          )}
        </button>

        {/* ── PromptPay option ── */}
        <button
          type="button"
          onClick={() => onPromptPay(plan.id)}
          disabled={anyBusy}
          className="group flex w-full items-start gap-4 rounded-xl border-2 border-line2 bg-page p-4 text-left transition-all hover:border-[#003F8A]/40 hover:bg-[#003F8A]/5 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:border-blue-400/40 dark:hover:bg-blue-950/20"
        >
          {/* Icon */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#003F8A]/20 bg-[#003F8A]/10 text-[#003F8A] dark:border-blue-400/20 dark:bg-blue-950/30 dark:text-blue-300">
            <QrCode className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink">
                {t("billing.payMethod.pp.title")}
              </span>
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                {t("billing.payMethod.pp.badge")}
              </span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-muted">
              {t("billing.payMethod.pp.desc")}
            </p>
          </div>
          {busyPP === plan.id ? (
            <span className="shrink-0 text-sm text-ink-faint">…</span>
          ) : (
            <ArrowRight className="h-4 w-4 shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-[#003F8A] dark:group-hover:text-blue-400" />
          )}
        </button>
      </Dialog.Body>
    </Dialog>
  );
}
