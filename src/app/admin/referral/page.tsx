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
  type AdminWalletRow,
} from '@/lib/api';
import { Gift, Settings, Users, DollarSign } from '@/components/ui/Icon';
import { useUI } from '@/store/ui';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { cn } from '@/lib/cn';

// ── helpers ──────────────────────────────────────────────────────────

function satangToTHB(satang: number): string {
  return `฿${(satang / 100).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type Tab = 'settings' | 'referrals' | 'payouts';

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

  // wallets
  const [wallets, setWallets] = useState<AdminWalletRow[]>([]);
  const [walletsLoaded, setWalletsLoaded] = useState(false);
  const [payoutTarget, setPayoutTarget] = useState<AdminWalletRow | null>(null);

  // load settings on mount
  useEffect(() => {
    api.adminReferral.settings().then(setSettings).catch(() => {});
  }, []);

  // lazy load tables on tab switch
  useEffect(() => {
    if (tab === 'referrals' && !referralsLoaded) {
      api.adminReferral
        .referrals()
        .then((r) => {
          setReferrals(r);
          setReferralsLoaded(true);
        })
        .catch(() => {});
    }
    if (tab === 'payouts' && !walletsLoaded) {
      api.adminReferral
        .wallets()
        .then((w) => {
          setWallets(w);
          setWalletsLoaded(true);
        })
        .catch(() => {});
    }
  }, [tab, referralsLoaded, walletsLoaded]);

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

  async function confirmPayout() {
    if (!payoutTarget) return;
    await api.adminReferral.markPayout(payoutTarget.id);
    showToast(`โอนเงิน ${satangToTHB(payoutTarget.balance)} ให้ ${payoutTarget.tenant_name} แล้ว`, 'success');
    setPayoutTarget(null);
    // Refresh wallets
    const w = await api.adminReferral.wallets();
    setWallets(w);
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'settings', label: 'ตั้งค่าโปรแกรม', icon: <Settings className="h-4 w-4" /> },
    { key: 'referrals', label: 'รายการ Referral', icon: <Users className="h-4 w-4" /> },
    { key: 'payouts', label: 'Payout ค้างจ่าย', icon: <DollarSign className="h-4 w-4" /> },
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
                  <SettingsField
                    label="ระยะเวลาส่วนลด (เดือน)"
                    hint="จำนวนเดือนที่ส่วนลดมีผล"
                    value={settings.discount_duration_months.toString()}
                    onChange={(v) =>
                      setSettings({
                        ...settings,
                        discount_duration_months: Math.max(0, parseInt(v) || 0),
                      })
                    }
                  />
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

        {/* ── Payouts tab ────────────────────────────────────────────── */}
        {tab === 'payouts' && (
          <Card>
            <CardHeader
              icon={<DollarSign className="h-5 w-5" />}
              title="กระเป๋าเงินที่รอโอน"
            />
            {!walletsLoaded ? (
              <div className="px-5 pb-5 text-sm text-ink-muted">กำลังโหลด…</div>
            ) : wallets.length === 0 ? (
              <div className="px-5 pb-8 text-center text-sm text-ink-muted">
                ไม่มีรายการรอโอนในขณะนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line2 text-left text-[13px] text-ink-muted">
                      <th className="px-4 py-2.5 font-medium">ร้าน / บริษัท</th>
                      <th className="px-4 py-2.5 font-medium text-right">ยอดคงเหลือ</th>
                      <th className="px-4 py-2.5 font-medium">วิธีจ่าย</th>
                      <th className="px-4 py-2.5 font-medium">อัปเดต</th>
                      <th className="px-4 py-2.5 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {wallets.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b border-line2 last:border-0 hover:bg-muted/40"
                      >
                        <td className="px-4 py-3 font-medium text-ink">
                          {w.tenant_name || w.tenant_id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                          {satangToTHB(w.balance)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={w.payout_type === 'manual' ? 'info' : 'success'}>
                            {w.payout_type === 'manual' ? 'โอนเงิน' : 'เครดิต'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-muted">
                          {w.updated_at
                            ? new Date(w.updated_at).toLocaleDateString('th-TH')
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="soft"
                            onClick={() => setPayoutTarget(w)}
                          >
                            โอนแล้ว ✓
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* ── Payout confirm dialog ────────────────────────────────── */}
        {payoutTarget && (
          <ConfirmDialog
            open
            onClose={() => setPayoutTarget(null)}
            onConfirm={confirmPayout}
            title="ยืนยันการโอนเงิน"
            description={`คุณได้โอนเงิน ${satangToTHB(payoutTarget.balance)} ให้ ${payoutTarget.tenant_name} แล้วใช่ไหม? ยอดคงเหลือจะถูกรีเซ็ตเป็น 0`}
            confirmLabel="ยืนยัน — โอนแล้ว"
          />
        )}
      </AdminPageBody>
    </AdminShell>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

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
