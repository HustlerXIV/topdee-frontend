'use client';

import { useEffect, useState } from 'react';
import {
  AdminShell,
  AdminPageBody,
  AdminPageHeader,
} from '@/components/layout/AdminShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import {
  api,
  type ReferralSettings,
  type AdminReferralRow,
  type AdminPayoutRequestRow,
} from '@/lib/api';
import { Gift, Settings, Users, DollarSign, Clock } from '@/components/ui/Icon';
import { useUI } from '@/store/ui';
import { Dialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

// ── helpers ──────────────────────────────────────────────────────────

function satangToTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Tab = 'settings' | 'referrals' | 'payout-requests';
type PayoutStatusFilter = 'all' | 'pending' | 'approved' | 'rejected';

// ── Page ─────────────────────────────────────────────────────────────

export default function AdminReferralPage() {
  const showToast = useUI((s) => s.showToast);
  const [tab, setTab] = useState<Tab>('settings');

  // settings
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [settingsBusy, setSettingsBusy] = useState(false);

  // referrals
  const [referrals, setReferrals] = useState<AdminReferralRow[]>([]);
  const [referralsLoaded, setReferralsLoaded] = useState(false);

  // payout requests
  const [payoutRequests, setPayoutRequests] = useState<AdminPayoutRequestRow[]>([]);
  const [payoutRequestsLoaded, setPayoutRequestsLoaded] = useState(false);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<PayoutStatusFilter>('pending');
  const [approveBusy, setApproveBusy] = useState<string | null>(null); // id of request being approved
  const [rejectBusy, setRejectBusy] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<AdminPayoutRequestRow | null>(null);

  // load settings on mount
  useEffect(() => {
    api.adminReferral.settings().then(setSettings).catch(() => {});
  }, []);

  // lazy load tables on tab switch
  useEffect(() => {
    if (tab === 'referrals' && !referralsLoaded) {
      api.adminReferral
        .referrals()
        .then((r) => { setReferrals(r); setReferralsLoaded(true); })
        .catch(() => {});
    }
    if (tab === 'payout-requests' && !payoutRequestsLoaded) {
      api.adminReferral
        .payoutRequests()
        .then((r) => { setPayoutRequests(r); setPayoutRequestsLoaded(true); })
        .catch(() => {});
    }
  }, [tab, referralsLoaded, payoutRequestsLoaded]);

  async function saveSettings() {
    if (!settings) return;
    setSettingsBusy(true);
    try {
      const updated = await api.adminReferral.updateSettings(settings);
      setSettings(updated);
      showToast('บันทึกการตั้งค่าแล้ว', 'success');
    } finally {
      setSettingsBusy(false);
    }
  }

  async function approveRequest(id: string) {
    setApproveBusy(id);
    try {
      await api.adminReferral.approvePayoutRequest(id);
      showToast('อนุมัติคำขอแล้ว', 'success');
      const updated = await api.adminReferral.payoutRequests();
      setPayoutRequests(updated);
      setDetailRow(null);
    } finally {
      setApproveBusy(null);
    }
  }

  async function rejectRequest(id: string) {
    setRejectBusy(id);
    try {
      await api.adminReferral.rejectPayoutRequest(id);
      showToast('ปฏิเสธคำขอและคืนเงินแล้ว', 'success');
      const updated = await api.adminReferral.payoutRequests();
      setPayoutRequests(updated);
      setDetailRow(null);
    } finally {
      setRejectBusy(null);
    }
  }

  const pendingCount = payoutRequests.filter((r) => r.status === 'pending').length;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'ตั้งค่าโปรแกรม', icon: <Settings className="h-4 w-4" /> },
    { key: 'referrals', label: 'รายการ Referral', icon: <Users className="h-4 w-4" /> },
    {
      key: 'payout-requests',
      label: `คำขอเบิกเงิน${pendingCount > 0 ? ` (${pendingCount})` : ''}`,
      icon: <Clock className="h-4 w-4" />,
    },
  ];

  return (
    <AdminShell>
      <AdminPageHeader
        icon={<Gift className="h-7 w-7" />}
        title="Referral Programme"
        description="Configure commission rates, view referrals, and process payouts."
      />
      <AdminPageBody>
        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 rounded-[9px] px-4 py-2 text-sm font-semibold transition-colors',
                tab === t.key
                  ? 'bg-card text-brand-600 shadow-sm'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Settings tab ─────────────────────────────────────────── */}
        {tab === 'settings' && (
          <Card>
            <CardHeader
              icon={<Settings className="h-5 w-5" />}
              title="การตั้งค่าโปรแกรมแนะนำ"
            />
            {!settings ? (
              <div className="px-5 pb-5 text-sm text-ink-muted">กำลังโหลด…</div>
            ) : (
              <div className="px-5 pb-5 space-y-5">
                {/* Enable / disable */}
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) =>
                      setSettings({ ...settings, enabled: e.target.checked })
                    }
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="text-sm font-medium text-ink">
                    เปิดใช้งานโปรแกรมแนะนำ (Referral Programme)
                  </span>
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <SettingsField
                    label="คอมมิชชั่นครั้งแรก (บาท)"
                    hint="จ่ายเมื่อผู้ที่ถูกแนะนำชำระเงินครั้งแรก"
                    value={(settings.first_commission_amount / 100).toString()}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        first_commission_amount: Math.round(parseFloat(v) * 100) || 0,
                      })
                    }
                  />
                  <SettingsField
                    label="คอมมิชชั่นรายเดือน (บาท)"
                    hint="จ่ายทุกเดือนที่ผู้ที่ถูกแนะนำต่ออายุ"
                    value={(settings.recurring_commission_amount / 100).toString()}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        recurring_commission_amount:
                          Math.round(parseFloat(v) * 100) || 0,
                      })
                    }
                  />
                  <SettingsField
                    label="ส่วนลดผู้สมัครใหม่ (%)"
                    hint="ส่วนลดที่ผู้ที่ถูกแนะนำได้รับ"
                    value={settings.discount_percent.toString()}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        discount_percent: Math.min(100, Math.max(0, parseInt(v) || 0)),
                      })
                    }
                  />
                  <div>
                    <p className="mb-1 text-sm font-medium text-ink">ประเภทส่วนลด</p>
                    <div className="flex flex-col gap-2">
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          name="discount_type"
                          value="first_purchase"
                          checked={(settings.discount_type || 'first_purchase') === 'first_purchase'}
                          onChange={() => setSettings({ ...settings, discount_type: 'first_purchase' })}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <span className="text-sm text-ink">
                          <span className="font-medium">ครั้งแรกเท่านั้น</span>
                          <span className="ml-1 text-ink-muted">— ส่วนลดหมดอายุทันทีหลังชำระครั้งแรก</span>
                        </span>
                      </label>
                      <label className="flex cursor-pointer items-start gap-2">
                        <input
                          type="radio"
                          name="discount_type"
                          value="duration"
                          checked={settings.discount_type === 'duration'}
                          onChange={() => setSettings({ ...settings, discount_type: 'duration' })}
                          className="mt-0.5 accent-indigo-600"
                        />
                        <span className="text-sm text-ink">
                          <span className="font-medium">ตามระยะเวลา</span>
                          <span className="ml-1 text-ink-muted">— ส่วนลดมีผลตามจำนวนเดือนที่กำหนด (รวมการต่ออายุ)</span>
                        </span>
                      </label>
                    </div>
                    <p className="mt-1 text-[12px] text-ink-muted">ส่งผลกับผู้สมัครใหม่เท่านั้น ไม่กระทบผู้ใช้ปัจจุบัน</p>
                  </div>
                  {settings.discount_type === 'duration' && (
                    <SettingsField
                      label="ระยะเวลาส่วนลด (เดือน)"
                      hint="จำนวนเดือนที่ส่วนลดมีผล (เฉพาะโหมดตามระยะเวลา)"
                      value={settings.discount_duration_months.toString()}
                      onChange={(v) =>
                        setSettings({
                          ...settings,
                          discount_duration_months: Math.max(1, parseInt(v) || 1),
                        })
                      }
                    />
                  )}
                </div>

                {/* Default payout type */}
                <div>
                  <p className="mb-2 text-sm font-medium text-ink">
                    วิธีเบิกเงินเริ่มต้น
                  </p>
                  <div className="flex gap-3">
                    {(['manual', 'credit'] as const).map((pt) => (
                      <label
                        key={pt}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <input
                          type="radio"
                          name="default_payout"
                          value={pt}
                          checked={settings.default_payout_type === pt}
                          onChange={() =>
                            setSettings({
                              ...settings,
                              default_payout_type: pt,
                            })
                          }
                          className="accent-indigo-600"
                        />
                        <span className="text-sm text-ink">
                          {pt === 'manual' ? 'โอนเงิน (PromptPay)' : 'เครดิตบิล'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={saveSettings} disabled={settingsBusy}>
                  {settingsBusy ? 'กำลังบันทึก…' : 'บันทึกการตั้งค่า'}
                </Button>
              </div>
            )}
          </Card>
        )}

        {/* ── Referrals tab ──────────────────────────────────────────── */}
        {tab === 'referrals' && (
          <Card>
            <CardHeader
              icon={<Users className="h-5 w-5" />}
              title="รายการ Referral ทั้งหมด"
            />
            {!referralsLoaded ? (
              <div className="px-5 pb-5 text-sm text-ink-muted">กำลังโหลด…</div>
            ) : referrals.length === 0 ? (
              <div className="px-5 pb-8 text-center text-sm text-ink-muted">
                ยังไม่มีรายการ referral
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                      <th className="px-4 py-2.5 font-medium">รหัส</th>
                      <th className="px-4 py-2.5 font-medium">ผู้แนะนำ</th>
                      <th className="px-4 py-2.5 font-medium">ผู้ถูกแนะนำ</th>
                      <th className="px-4 py-2.5 font-medium">สถานะ</th>
                      <th className="px-4 py-2.5 font-medium text-right">คอมมิชชั่น</th>
                      <th className="px-4 py-2.5 font-medium text-right">รายได้</th>
                      <th className="px-4 py-2.5 font-medium">วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {referrals.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b border-line2 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-bold text-ink">
                          {r.code}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {r.referrer_tenant_name || r.referrer_tenant_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-ink">
                          {r.referred_tenant_name}
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            tone={r.status === 'active' ? 'success' : 'neutral'}
                          >
                            {r.status === 'active' ? 'ใช้งาน' : 'หยุดชั่วคราว'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-ink-muted">
                          {r.commission_count} ครั้ง
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">
                          {satangToTHB(r.total_earned)}
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {new Date(r.created_at).toLocaleDateString('th-TH')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── Payout Requests tab ────────────────────────────────────── */}
        {tab === 'payout-requests' && (
          <Card>
            <CardHeader
              icon={<Clock className="h-5 w-5" />}
              title="คำขอเบิกเงิน"
            />
            {/* Status filter pills */}
            <div className="px-4 pb-3 flex flex-wrap gap-2 border-b border-line2">
              {(
                [
                  { key: 'all',      label: 'ทั้งหมด' },
                  { key: 'pending',  label: `รอดำเนินการ${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
                  { key: 'approved', label: 'อนุมัติแล้ว' },
                  { key: 'rejected', label: 'ถูกปฏิเสธ' },
                ] as { key: PayoutStatusFilter; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPayoutStatusFilter(key)}
                  className={cn(
                    'rounded-full px-3.5 py-1 text-xs font-semibold transition-colors',
                    payoutStatusFilter === key
                      ? 'bg-brand-600 text-white'
                      : 'bg-muted text-ink-muted hover:text-ink',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {!payoutRequestsLoaded ? (
              <div className="px-5 py-5 text-sm text-ink-muted">กำลังโหลด…</div>
            ) : (() => {
              const filtered = payoutRequests.filter(
                (r) => payoutStatusFilter === 'all' || r.status === payoutStatusFilter,
              );
              return filtered.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-ink-muted">
                  ไม่มีคำขอในสถานะนี้
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                        <th className="px-4 py-2.5 font-medium">ร้าน / บริษัท</th>
                        <th className="px-4 py-2.5 font-medium text-right">จำนวน</th>
                        <th className="px-4 py-2.5 font-medium">ธนาคาร</th>
                        <th className="px-4 py-2.5 font-medium">เลขบัญชี</th>
                        <th className="px-4 py-2.5 font-medium">สถานะ</th>
                        <th className="px-4 py-2.5 font-medium">วันที่ขอ</th>
                        <th className="px-4 py-2.5 font-medium" />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id} className="border-b border-line2 last:border-0 hover:bg-muted/40">
                          <td className="px-4 py-3 font-medium text-ink">
                            {r.tenant_name || r.tenant_id.slice(0, 8)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400 tabular-nums">
                            {satangToTHB(r.amount)}
                          </td>
                          <td className="px-4 py-3 text-ink">{r.bank_name}</td>
                          <td className="px-4 py-3 font-mono text-ink-muted">{r.account_number}</td>
                          <td className="px-4 py-3">
                            {r.status === 'pending' && <Badge tone="warning">รอดำเนินการ</Badge>}
                            {r.status === 'approved' && <Badge tone="success">อนุมัติแล้ว</Badge>}
                            {r.status === 'rejected' && <Badge tone="error">ถูกปฏิเสธ</Badge>}
                          </td>
                          <td className="px-4 py-3 text-ink-muted">
                            {new Date(r.created_at).toLocaleDateString('th-TH')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="sm" variant="soft" onClick={() => setDetailRow(r)}>
                              ดูรายละเอียด
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </Card>
        )}

        {/* ── Payout request detail dialog ─────────────────────────── */}
        <Dialog
          open={!!detailRow}
          onClose={() => setDetailRow(null)}
          title="รายละเอียดคำขอเบิกเงิน"
          icon={<DollarSign className="h-5 w-5" />}
          width="max-w-lg"
        >
          {detailRow && (
            <>
              <Dialog.Body className="space-y-4 overflow-y-auto max-h-[calc(100svh-16rem)]">
                {/* Amount banner */}
                <div className="flex items-center justify-between rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700 dark:text-green-400">จำนวนที่ขอเบิก</p>
                    <p className="mt-0.5 text-xl font-extrabold tabular-nums text-green-700 dark:text-green-400">
                      {satangToTHB(detailRow.amount)}
                    </p>
                  </div>
                  <div>
                    {detailRow.status === 'pending' && <Badge tone="warning">รอดำเนินการ</Badge>}
                    {detailRow.status === 'approved' && <Badge tone="success">อนุมัติแล้ว</Badge>}
                    {detailRow.status === 'rejected' && <Badge tone="error">ถูกปฏิเสธ</Badge>}
                  </div>
                </div>

                {/* Bank details */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted border-b border-line2 pb-1.5">
                    ข้อมูลบัญชีธนาคาร
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Row label="ร้าน / บริษัท" value={detailRow.tenant_name} />
                    <Row label="วันที่ขอ" value={new Date(detailRow.created_at).toLocaleDateString('th-TH')} />
                    <Row label="ธนาคาร" value={detailRow.bank_name} />
                    <Row label="เลขบัญชี" value={detailRow.account_number} />
                    <Row label="ชื่อบัญชี" value={detailRow.account_name} />
                  </div>
                </div>

                {/* Tax details */}
                <div>
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-muted border-b border-line2 pb-1.5">
                    ข้อมูลหัก ณ ที่จ่าย
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Row label="เลขประจำตัวผู้เสียภาษี" value={detailRow.tax_id} />
                    <Row label="ชื่อ-นามสกุล" value={detailRow.full_name} />
                  </div>
                  <div className="mt-3">
                    <Row label="ที่อยู่" value={detailRow.address} />
                  </div>
                </div>

                {/* PDPA */}
                <div className="rounded-xl border border-line2 bg-muted px-4 py-3">
                  <Row
                    label="ยินยอม PDPA"
                    value={
                      detailRow.consent_given
                        ? `✓ ยินยอมแล้ว (${new Date(detailRow.consent_at).toLocaleString('th-TH')})`
                        : '✗ ยังไม่ยินยอม'
                    }
                  />
                </div>
              </Dialog.Body>

              <Dialog.Footer align="between">
                <Button variant="outline" onClick={() => setDetailRow(null)}>
                  ปิด
                </Button>
                {detailRow.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      disabled={rejectBusy === detailRow.id}
                      onClick={() => rejectRequest(detailRow.id)}
                    >
                      {rejectBusy === detailRow.id ? 'กำลังปฏิเสธ…' : 'ปฏิเสธและคืนเงิน'}
                    </Button>
                    <Button
                      disabled={approveBusy === detailRow.id}
                      onClick={() => approveRequest(detailRow.id)}
                    >
                      {approveBusy === detailRow.id ? 'กำลังอนุมัติ…' : 'อนุมัติ ✓'}
                    </Button>
                  </div>
                )}
              </Dialog.Footer>
            </>
          )}
        </Dialog>

      </AdminPageBody>
    </AdminShell>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-ink break-all">{value || '—'}</p>
    </div>
  );
}

function SettingsField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>
    </div>
  );
}
