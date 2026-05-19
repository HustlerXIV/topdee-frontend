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
  type ReferralStats,
  type ReferralWallet,
  type WalletTransaction,
} from "@/lib/api";
import { Copy, Check, Gift, Users, DollarSign } from "@/components/ui/Icon";
import { useUI } from "@/store/ui";
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

// ── page ──────────────────────────────────────────────────────────────

export default function ReferralPage() {
  useRoleGuard(["owner"]);

  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [codeData, setCodeData] = useState<ReferralCode | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [txns, setTxns] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutType, setPayoutType] = useState<"manual" | "credit">("manual");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const [c, s, w] = await Promise.all([
          api.referral.code(),
          api.referral.stats(),
          api.referral.wallet(),
        ]);
        if (!alive) return;
        setCodeData(c);
        setStats(s);
        setWallet(w.wallet);
        setTxns(w.transactions);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, []);

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
    showToast("ลิงก์ถูกคัดลอกแล้ว", "success");
  }

  async function requestPayout() {
    setPayoutBusy(true);
    try {
      const res = await api.referral.requestPayout(payoutType);
      showToast(res.message, "success");
      // Refresh wallet state
      const w = await api.referral.wallet();
      setWallet(w.wallet);
      setTxns(w.transactions);
      setPayoutDialog(false);
    } finally {
      setPayoutBusy(false);
    }
  }

  return (
    <AppShell>
      <PageHeader title={t("nav.referral")} />
      <PageBody>
        {loading ? (
          <div className="py-20 text-center text-sm text-ink-muted">
            กำลังโหลด…
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── Referral Code Card ─────────────────────────────────── */}
            <Card>
              <CardHeader
                icon={<Gift className="h-5 w-5" />}
                title="รหัสแนะนำของฉัน"
              />

              <div className="px-5 pb-5">
                {/* Code pill + copy */}
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
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {/* Shareable link */}
                <p className="mt-4 text-sm font-medium text-ink">
                  ลิงก์สำหรับแชร์
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="flex-1 truncate rounded-lg border border-line2 bg-muted px-3 py-2 font-mono text-[13px] text-ink-muted">
                    {shareURL}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyLink}
                    iconLeft={<Copy className="h-4 w-4" />}
                  >
                    คัดลอก
                  </Button>
                </div>

                {/* How it works */}
                <div className="mt-5 rounded-xl bg-muted p-4 text-sm text-ink-muted">
                  <p className="font-semibold text-ink">วิธีการทำงาน</p>
                  <ul className="mt-2 space-y-1 list-disc list-inside">
                    <li>เพื่อนสมัครด้วยรหัสของคุณ → ได้ส่วนลด 10% นาน 1 ปี</li>
                    <li>คุณได้รับ ฿100 เมื่อเพื่อนชำระครั้งแรก</li>
                    <li>คุณได้รับ ฿50 ทุกเดือนที่เพื่อนต่ออายุ</li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* ── Stats row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <StatBox
                icon={<Users className="h-5 w-5" />}
                label="ผู้ที่แนะนำทั้งหมด"
                value={String(stats?.total_referrals ?? 0)}
              />
              <StatBox
                icon={<DollarSign className="h-5 w-5" />}
                label="รายได้รวม"
                value={satangToTHB(stats?.total_earned ?? 0)}
              />
              <StatBox
                icon={<DollarSign className="h-5 w-5" />}
                label="ยอดคงเหลือในกระเป๋า"
                value={satangToTHB(wallet?.balance ?? 0)}
                action={
                  (wallet?.balance ?? 0) > 0 ? (
                    <Button
                      size="sm"
                      onClick={() => setPayoutDialog(true)}
                    >
                      เบิกเงิน
                    </Button>
                  ) : undefined
                }
              />
            </div>

            {/* ── Referrals table ────────────────────────────────────── */}
            {(stats?.referrals?.length ?? 0) > 0 && (
              <Card>
                <CardHeader
                  icon={<Users className="h-5 w-5" />}
                  title="รายชื่อผู้ที่แนะนำ"
                />
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
                        <tr
                          key={r.id}
                          className="border-b border-line2 last:border-0 hover:bg-muted/40"
                        >
                          <td className="px-4 py-3 font-medium text-ink">
                            {r.referred_tenant_name}
                          </td>
                          <td className="px-4 py-3">
                            <Badge
                              tone={r.status === "active" ? "success" : "neutral"}
                            >
                              {r.status === "active" ? "ใช้งาน" : "หยุดชั่วคราว"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right text-ink-muted">
                            {r.commission_count} ครั้ง
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-ink">
                            {satangToTHB(r.total_earned)}
                          </td>
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
                <CardHeader
                  icon={<DollarSign className="h-5 w-5" />}
                  title="ประวัติกระเป๋าเงิน"
                />
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
                          <tr
                            key={txn.id}
                            className="border-b border-line2 last:border-0 hover:bg-muted/40"
                          >
                            <td className="px-4 py-3 text-ink">
                              {txn.description}
                            </td>
                            <td className={`px-4 py-3 text-sm ${color}`}>
                              {label}
                            </td>
                            <td
                              className={`px-4 py-3 text-right font-semibold tabular-nums ${
                                txn.amount >= 0
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-500 dark:text-red-400"
                              }`}
                            >
                              {txn.amount >= 0 ? "+" : ""}
                              {satangToTHB(txn.amount)}
                            </td>
                            <td className="px-4 py-3 text-ink-muted">
                              {new Date(txn.created_at).toLocaleDateString(
                                "th-TH",
                              )}
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
                <p className="text-sm font-semibold text-ink">
                  ยังไม่มีผู้สมัครจากรหัสของคุณ
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  แชร์รหัสหรือลิงก์ด้านบนให้เพื่อนเพื่อเริ่มรับคอมมิชชั่น
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Payout dialog ─────────────────────────────────────────── */}
        {payoutDialog && (
          <Dialog
            open
            onClose={() => setPayoutDialog(false)}
            title="เบิกเงินจากกระเป๋า"
          >
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                ยอดคงเหลือ:{" "}
                <strong className="text-ink">
                  {satangToTHB(wallet?.balance ?? 0)}
                </strong>
              </p>

              <div className="space-y-2">
                <p className="text-sm font-medium text-ink">วิธีรับเงิน</p>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line2 p-3 hover:bg-muted">
                  <input
                    type="radio"
                    name="ptype"
                    value="manual"
                    checked={payoutType === "manual"}
                    onChange={() => setPayoutType("manual")}
                    className="accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">โอนเงิน (PromptPay / โอน)</p>
                    <p className="text-xs text-ink-muted">
                      แอดมินจะติดต่อกลับเพื่อโอนเงิน
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line2 p-3 hover:bg-muted">
                  <input
                    type="radio"
                    name="ptype"
                    value="credit"
                    checked={payoutType === "credit"}
                    onChange={() => setPayoutType("credit")}
                    className="accent-indigo-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-ink">หักจากบิลถัดไป</p>
                    <p className="text-xs text-ink-muted">
                      เครดิตจะถูกหักออกจากใบแจ้งหนี้งวดถัดไปโดยอัตโนมัติ
                    </p>
                  </div>
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setPayoutDialog(false)}
                  disabled={payoutBusy}
                >
                  ยกเลิก
                </Button>
                <Button
                  className="flex-1"
                  onClick={requestPayout}
                  disabled={payoutBusy}
                >
                  {payoutBusy ? "กำลังดำเนินการ…" : "ยืนยันเบิกเงิน"}
                </Button>
              </div>
            </div>
          </Dialog>
        )}
      </PageBody>
    </AppShell>
  );
}

// ── StatBox ─────────────────────────────────────────────────────────

function StatBox({
  icon,
  label,
  value,
  action,
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
