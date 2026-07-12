"use client";

import { useEffect, useState } from "react";
import {
  AppShell,
  PageBody,
  PageHeader,
  useRoleGuard,
} from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useT } from "@/lib/i18n/useT";
import {
  api,
  type ReferralCode,
  type ReferralSettings,
  type ReferralStats,
  type ReferralWallet,
  type WalletTransaction,
  type PayoutRequest,
  type SubmitPayoutRequestBody,
} from "@/lib/api";
import { Copy, Check, Gift, Users, DollarSign, Clock } from "@/components/ui/Icon";
import { useUI } from "@/store/ui";
import { useAuth } from "@/store/auth";
import { Dialog } from "@/components/ui/Dialog";

// ── helpers ──────────────────────────────────────────────────────────

function satangToTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function txnTypeLabel(type: string): { label: string; color: string } {
  if (type === "commission") return { label: "คอมมิชชั่น", color: "text-green-600 dark:text-green-400" };
  if (type === "payout") return { label: "เบิกเงิน", color: "text-red-500 dark:text-red-400" };
  if (type === "credit_applied") return { label: "เครดิตบิล", color: "text-blue-600 dark:text-blue-400" };
  return { label: type, color: "text-ink-muted" };
}

function payoutStatusBadge(status: string) {
  if (status === "pending") return <Badge tone="warning">รอดำเนินการ</Badge>;
  if (status === "approved") return <Badge tone="success">อนุมัติแล้ว</Badge>;
  if (status === "rejected") return <Badge tone="error">ถูกปฏิเสธ</Badge>;
  return <Badge tone="neutral">{status}</Badge>;
}

const THAI_BANKS = [
  "กรุงเทพ (BBL)",
  "กสิกรไทย (KBank)",
  "ไทยพาณิชย์ (SCB)",
  "กรุงไทย (KTB)",
  "ทหารไทยธนชาต (TTB)",
  "กรุงศรีอยุธยา (BAY)",
  "ออมสิน (GSB)",
  "ธ.ก.ส. (BAAC)",
  "ซีไอเอ็มบีไทย (CIMB)",
  "ยูโอบี (UOB)",
  "ทิสโก้ (TISCO)",
  "แลนด์แอนด์เฮ้าส์ (LH Bank)",
  "ไทยเครดิต (TCRB)",
  "อื่นๆ",
];

// ── page ──────────────────────────────────────────────────────────────

export default function ReferralPage() {
  useRoleGuard(["owner"]);

  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const isAdmin = useAuth((s) => s.user?.isAdmin ?? false);

  const [codeData, setCodeData] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>([]);
  const [refSettings, setRefSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Payout dialog state
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [bankSelect, setBankSelect] = useState(""); // dropdown value; "อื่นๆ" triggers custom input
  const [form, setForm] = useState<SubmitPayoutRequestBody>({
    bank_name: "",
    account_number: "",
    account_name: "",
    tax_id: "",
    full_name: "",
    address: "",
    consent_given: false,
  });

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [c, s, w, pr] = await Promise.all([
          api.referral.code(),
          api.referral.stats(),
          api.referral.wallet(),
          api.referral.myPayoutRequests(),
        ]);
        if (!alive) return;
        setCodeData(c);
        setStats(s);
        setWallet(w.wallet);
        setTxns(w.transactions);
        setPayoutRequests(pr);
        // Referral settings live behind an admin-only endpoint — calling it as
        // a normal owner returns 403 and fires the global error toast. Only
        // platform admins can read it, so gate the call on that flag. Normal
        // owners fall back to generic commission copy (see the bullets below).
        if (isAdmin) {
          const rs = await api.adminReferral.settings().catch(() => null);
          if (alive && rs) setRefSettings(rs);
        }
      } catch {
        // The request layer already surfaced a toast for the failing call;
        // swallow here so a single failure doesn't leave an unhandled rejection
        // or wedge the page in its loading state.
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [isAdmin]);

  const shareURL =
    typeof window !== "undefined" && codeData
      ? `${window.location.origin}/login?tab=register&ref=${codeData.id}`
      : "";

  async function copyCode() {
    if (!codeData) return;
    await navigator.clipboard.writeText(codeData.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyLink() {
    if (!shareURL) return;
    await navigator.clipboard.writeText(shareURL);
    showToast(t("referral.copied"), "success");
  }

  function openPayoutDialog() {
    // Pre-fill from the most recent past request so the user doesn't have to
    // re-type bank / tax details. Consent is always reset — they must tick it
    // explicitly for each new request (PDPA audit trail).
    const last = payoutRequests[0] ?? null; // list is newest-first from API
    if (last) {
      const knownBank = THAI_BANKS.includes(last.bank_name);
      setBankSelect(knownBank ? last.bank_name : "อื่นๆ");
      setForm({
        bank_name: last.bank_name,
        account_number: last.account_number,
        account_name: last.account_name,
        tax_id: last.tax_id,
        full_name: last.full_name,
        address: last.address,
        consent_given: false, // always require fresh consent
      });
    } else {
      setBankSelect("");
      setForm({
        bank_name: "",
        account_number: "",
        account_name: "",
        tax_id: "",
        full_name: "",
        address: "",
        consent_given: false,
      });
    }
    setPayoutDialog(true);
  }

  async function submitPayout() {
    if (!form.bank_name || !form.account_number || !form.account_name) {
      showToast("กรุณากรอกข้อมูลบัญชีธนาคารให้ครบ", "error");
      return;
    }
    if (!form.tax_id || !form.full_name || !form.address) {
      showToast("กรุณากรอกข้อมูลภาษีให้ครบ", "error");
      return;
    }
    if (!form.consent_given) {
      showToast("กรุณายินยอมให้เก็บข้อมูลก่อนดำเนินการ", "error");
      return;
    }
    setPayoutBusy(true);
    try {
      const res = await api.referral.submitPayoutRequest(form);
      showToast(res.message, "success");
      // Refresh wallet + payout requests
      const [w, pr] = await Promise.all([
        api.referral.wallet(),
        api.referral.myPayoutRequests(),
      ]);
      setWallet(w.wallet);
      setTxns(w.transactions);
      setPayoutRequests(pr);
      setPayoutDialog(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "เกิดข้อผิดพลาด";
      showToast(msg, "error");
    } finally {
      setPayoutBusy(false);
    }
  }

  const hasPendingRequest = payoutRequests.some((r) => r.status === "pending");

  return (
    <AppShell>
      <PageHeader title={t("nav.referral")} />
      <PageBody>
        {loading ? (
          <div className="py-20 text-center text-sm text-ink-muted">{t("referral.loading")}</div>
        ) : (
          <div className="space-y-6">
            {/* ── Referral Code Card ─────────────────────────────────── */}
            <Card>
              <CardHeader icon={<Gift className="h-5 w-5" />} title={t("referral.code.title")} />
              <div className="px-5 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl border-2 border-brand-200 bg-brand-soft px-6 py-3 font-mono text-2xl font-extrabold tracking-widest text-brand-700 dark:border-brand-700/40 dark:bg-brand-950/30 dark:text-brand-300">
                    {codeData?.id ?? "—"}
                  </div>
                  <button
                    type="button"
                    onClick={copyCode}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-line2 bg-muted text-ink-muted transition-colors hover:bg-brand-soft hover:text-brand-600"
                    title="คัดลอกรหัส"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="mt-4 text-sm font-medium text-ink">{t("referral.shareLink")}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex-1 truncate rounded-lg border border-line2 bg-muted px-3 py-2 font-mono text-[13px] text-ink-muted">
                    {shareURL}
                  </span>
                  <Button variant="outline" size="sm" onClick={copyLink} iconLeft={<Copy className="h-4 w-4" />}>
                    {t("referral.copy")}
                  </Button>
                </div>
                <div className="mt-5 rounded-xl bg-muted p-4 text-sm text-ink-muted">
                  <p className="font-semibold text-ink">{t("referral.howItWorks")}</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>
                      {(() => {
                        const pct = refSettings?.discount_percent ?? 10;
                        const type = refSettings?.discount_type ?? 'first_purchase';
                        if (type === 'duration') {
                          const months = refSettings?.discount_duration_months ?? 1;
                          return `เพื่อนสมัครด้วยรหัสของคุณ → ได้ส่วนลด ${pct}% นาน ${months} เดือน`;
                        }
                        return `เพื่อนสมัครด้วยรหัสของคุณ → ได้ส่วนลด ${pct}% สำหรับการชำระครั้งแรกเท่านั้น`;
                      })()}
                    </li>
                    {/* Commission amounts are only known to platform admins (the
                        settings endpoint is admin-only). For normal owners keep
                        the copy generic rather than stating hardcoded figures. */}
                    {refSettings ? (
                      <>
                        <li>คุณได้รับ {satangToTHB(refSettings.first_commission_amount)} เมื่อเพื่อนชำระครั้งแรก</li>
                        <li>คุณได้รับ {satangToTHB(refSettings.recurring_commission_amount)} ทุกเดือนที่เพื่อนต่ออายุ</li>
                      </>
                    ) : (
                      <>
                        <li>รับคอมมิชชั่นเมื่อเพื่อนชำระเงินครั้งแรก</li>
                        <li>รับคอมมิชชั่นต่อเนื่องทุกเดือนที่เพื่อนต่ออายุ</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </Card>

            {/* ── Stats row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatBox icon={<Users className="h-5 w-5" />} label={t("referral.stat.totalReferrals")} value={String(stats?.total_referrals ?? 0)} />
              <StatBox icon={<DollarSign className="h-5 w-5" />} label={t("referral.stat.totalEarned")} value={satangToTHB(stats?.total_earned ?? 0)} />
              <StatBox
                icon={<DollarSign className="h-5 w-5" />}
                label={t("referral.stat.balance")}
                value={satangToTHB(wallet?.balance ?? 0)}
                action={
                  (wallet?.balance ?? 0) > 0 && !hasPendingRequest ? (
                    <Button size="sm" onClick={openPayoutDialog}>{t("referral.withdraw")}</Button>
                  ) : hasPendingRequest ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <Clock className="h-3.5 w-3.5" /> {t("referral.pending")}
                    </span>
                  ) : undefined
                }
              />
            </div>

            {/* ── Payout requests history ────────────────────────────── */}
            {payoutRequests.length > 0 && (
              <Card>
                <CardHeader icon={<DollarSign className="h-5 w-5" />} title="ประวัติคำขอเบิกเงิน" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                        <th className="px-4 py-2.5 font-medium">จำนวน</th>
                        <th className="px-4 py-2.5 font-medium">ธนาคาร</th>
                        <th className="px-4 py-2.5 font-medium">เลขบัญชี</th>
                        <th className="px-4 py-2.5 font-medium">สถานะ</th>
                        <th className="px-4 py-2.5 font-medium">วันที่ขอ</th>
                        <th className="px-4 py-2.5 font-medium">วันที่อนุมัติ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutRequests.map((r) => (
                        <tr key={r.id} className="border-b border-line2 last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 font-semibold text-ink">{satangToTHB(r.amount)}</td>
                          <td className="px-4 py-3 text-ink">{r.bank_name}</td>
                          <td className="px-4 py-3 font-mono text-ink-muted">{r.account_number}</td>
                          <td className="px-4 py-3">{payoutStatusBadge(r.status)}</td>
                          <td className="px-4 py-3 text-ink-muted">
                            {new Date(r.created_at).toLocaleDateString("th-TH")}
                          </td>
                          <td className="px-4 py-3 text-ink-muted">
                            {r.approved_at ? new Date(r.approved_at).toLocaleDateString("th-TH") : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Referrals table ────────────────────────────────────── */}
            {(stats?.referrals?.length ?? 0) > 0 && (
              <Card>
                <CardHeader icon={<Users className="h-5 w-5" />} title="รายชื่อผู้ที่แนะนำ" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                        <th className="px-4 py-2.5 font-medium">ชื่อร้าน/บริษัท</th>
                        <th className="px-4 py-2.5 font-medium">สถานะ</th>
                        <th className="px-4 py-2.5 font-medium text-right">คอมมิชชั่น</th>
                        <th className="px-4 py-2.5 font-medium text-right">รายได้</th>
                        <th className="px-4 py-2.5 font-medium">วันที่สมัคร</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats?.referrals.map((r) => (
                        <tr key={r.id} className="border-b border-line2 last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium text-ink">{r.referred_tenant_name}</td>
                          <td className="px-4 py-3">
                            <Badge tone={r.status === "active" ? "success" : "neutral"}>
                              {r.status === "active" ? "ใช้งาน" : "หยุดชั่วคราว"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-ink-muted">{r.commission_count} ครั้ง</td>
                          <td className="px-4 py-3 text-right font-semibold text-ink">{satangToTHB(r.total_earned)}</td>
                          <td className="px-4 py-3 text-ink-muted">
                            {new Date(r.created_at).toLocaleDateString("th-TH")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* ── Wallet Transactions ─────────────────────────────────── */}
            {txns.length > 0 && (
              <Card>
                <CardHeader icon={<DollarSign className="h-5 w-5" />} title="ประวัติกระเป๋าเงิน" />
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                        <th className="px-4 py-2.5 font-medium">รายการ</th>
                        <th className="px-4 py-2.5 font-medium">ประเภท</th>
                        <th className="px-4 py-2.5 font-medium text-right">จำนวน</th>
                        <th className="px-4 py-2.5 font-medium">วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txns.map((txn) => {
                        const { label, color } = txnTypeLabel(txn.type);
                        return (
                          <tr key={txn.id} className="border-b border-line2 last:border-0 hover:bg-muted/40">
                            <td className="px-4 py-3 text-ink">{txn.description}</td>
                            <td className={`px-4 py-3 text-sm ${color}`}>{label}</td>
                            <td className={`px-4 py-3 text-right font-semibold tabular-nums ${txn.amount >= 0 ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"}`}>
                              {txn.amount >= 0 ? "+" : ""}{satangToTHB(txn.amount)}
                            </td>
                            <td className="px-4 py-3 text-ink-muted">
                              {new Date(txn.created_at).toLocaleDateString("th-TH")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Empty state */}
            {(stats?.referrals?.length ?? 0) === 0 && txns.length === 0 && (
              <div className="py-16 text-center">
                <Gift className="mx-auto mb-3 h-12 w-12 text-ink-faint" />
                <p className="text-sm font-semibold text-ink">{t("referral.empty.title")}</p>
                <p className="mt-1 text-sm text-ink-muted">{t("referral.empty.desc")}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Payout dialog ─────────────────────────────────────────── */}
        <Dialog
          open={payoutDialog}
          onClose={() => !payoutBusy && setPayoutDialog(false)}
          title="เบิกเงินจากกระเป๋า"
          icon={<DollarSign className="h-5 w-5" />}
          width="max-w-lg"
        >
          <Dialog.Body className="overflow-y-auto max-h-[calc(100svh-16rem)] space-y-5">
            {/* ── Amount banner ── */}
            <div className="flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3.5">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-400 uppercase tracking-wide">จำนวนที่จะเบิก</p>
                <p className="mt-0.5 text-2xl font-extrabold text-green-700 dark:text-green-400 tabular-nums">
                  {satangToTHB(wallet?.balance ?? 0)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* ── 7-day notice ── */}
            <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
              <Clock className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                บริษัทจะดำเนินการโอนเงินเข้าบัญชีของคุณ
                <strong> ภายใน 7 วันทำการ</strong> นับจากวันที่ได้รับคำขอ
              </p>
            </div>

            {/* ── Section: Bank details ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted border-b border-line2 pb-2">
                ข้อมูลบัญชีธนาคาร
              </p>
              <div className="space-y-3">
                {/* Bank picker */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    ธนาคาร <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={bankSelect}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBankSelect(val);
                      if (val !== "อื่นๆ") {
                        setForm((f) => ({ ...f, bank_name: val }));
                      } else {
                        setForm((f) => ({ ...f, bank_name: "" }));
                      }
                    }}
                  >
                    <option value="">— เลือกธนาคาร —</option>
                    {THAI_BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                {/* Custom bank name when "อื่นๆ" is selected */}
                {bankSelect === "อื่นๆ" && (
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                      ระบุชื่อธนาคาร <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      autoFocus
                      placeholder="เช่น ธนาคารอิสลามแห่งประเทศไทย"
                      className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.bank_name}
                      onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                    />
                  </div>
                )}
                {/* Account number + name side by side on sm+ */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                      เลขบัญชี <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="000-0-00000-0"
                      className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.account_number}
                      onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-ink">
                      ชื่อบัญชี <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="ชื่อ-นามสกุล ตามสมุดบัญชี"
                      className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                      value={form.account_name}
                      onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section: Tax / withholding details ── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted border-b border-line2 pb-2">
                ข้อมูลหัก ณ ที่จ่าย
                <span className="ml-2 normal-case font-normal">(จำเป็นตามกฎหมายภาษีไทย)</span>
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    เลขประจำตัวผู้เสียภาษี / เลขบัตรประชาชน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={13}
                    placeholder="1 3 หลัก ไม่มีขีด"
                    className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.tax_id}
                    onChange={(e) => setForm((f) => ({ ...f, tax_id: e.target.value.replace(/\D/g, "").slice(0, 13) }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    ชื่อ-นามสกุล (ตามบัตรประชาชน) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="ชื่อเต็มสำหรับออกหนังสือรับรองการหักภาษี"
                    className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500"
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-ink">
                    ที่อยู่ <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ที่อยู่สำหรับออกหนังสือรับรองการหักภาษี"
                    className="w-full rounded-lg border border-line2 bg-card px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* ── PDPA Consent ── */}
            <label className="flex cursor-pointer gap-3 rounded-xl border border-line2 bg-muted p-4 hover:bg-muted/80 transition-colors">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
                checked={form.consent_given}
                onChange={(e) => setForm((f) => ({ ...f, consent_given: e.target.checked }))}
              />
              <span className="text-sm text-ink leading-relaxed">
                ฉัน<strong>ยินยอม</strong>ให้บริษัทเก็บรวบรวมและใช้ข้อมูลส่วนบุคคล ได้แก่
                ชื่อ-นามสกุล เลขประจำตัว ที่อยู่ และข้อมูลบัญชีธนาคาร
                เพื่อวัตถุประสงค์ในการโอนเงินและการปฏิบัติตามพันธกรณีทางภาษี
                ตาม <strong>พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</strong>{" "}
                บริษัทจะเก็บข้อมูลดังกล่าวเป็นระยะเวลาที่จำเป็นตามกฎหมายเท่านั้น
                <span className="text-red-500"> *</span>
              </span>
            </label>
          </Dialog.Body>

          <Dialog.Footer align="between">
            <Button
              variant="outline"
              onClick={() => setPayoutDialog(false)}
              disabled={payoutBusy}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={submitPayout}
              disabled={payoutBusy || !form.consent_given}
            >
              {payoutBusy ? "กำลังส่งคำขอ…" : "ส่งคำขอเบิกเงิน"}
            </Button>
          </Dialog.Footer>
        </Dialog>
      </PageBody>
    </AppShell>
  );
}

// ── StatBox ─────────────────────────────────────────────────────────

function StatBox({
  icon, label, value, action,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line2 bg-card p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-ink-muted">
          {icon}
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        {action}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
