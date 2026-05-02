'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, ApiError, type BusinessHours, type DayHours } from '@/lib/api';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FormGroup, FormRow, Input, Select, Textarea } from '@/components/ui/Input';
import { Toggle } from '@/components/ui/Toggle';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import { usePreferences } from '@/store/preferences';
import { cn } from '@/lib/cn';
import {
  Clock,
  Save,
  Building2,
  ShoppingBag,
  Moon,
  XCircle,
} from '@/components/ui/Icon';
import type { ComponentType } from 'react';

// Day labels for the 7-row table. Indexed Sun..Sat to match the API.
const DAYS: { th: string; en: string; short: string }[] = [
  { th: 'อาทิตย์', en: 'Sunday',    short: 'Sun' },
  { th: 'จันทร์',  en: 'Monday',    short: 'Mon' },
  { th: 'อังคาร',  en: 'Tuesday',   short: 'Tue' },
  { th: 'พุธ',     en: 'Wednesday', short: 'Wed' },
  { th: 'พฤหัส',   en: 'Thursday',  short: 'Thu' },
  { th: 'ศุกร์',   en: 'Friday',    short: 'Fri' },
  { th: 'เสาร์',   en: 'Saturday',  short: 'Sat' },
];

// A pragmatic short-list of timezones. Add more as the product expands beyond
// SEA — the backend will accept any IANA name.
const TIMEZONES = [
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Jakarta',
  'Asia/Ho_Chi_Minh',
  'Asia/Manila',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/London',
  'America/New_York',
  'America/Los_Angeles',
];

type PresetSpec = {
  id: string;
  Icon: ComponentType<{ className?: string }>;
  labelTh: string;
  labelEn: string;
  apply: (days: DayHours[]) => DayHours[];
};

const PRESETS: PresetSpec[] = [
  { id: 'business', Icon: Building2,   labelTh: 'จ.–ศ. 9:00–18:00',     labelEn: 'Mon–Fri 9–6',    apply: setBusinessWeek },
  { id: 'shop',     Icon: ShoppingBag, labelTh: 'ทุกวัน 10:00–20:00',    labelEn: 'Every day 10–8', apply: setShopHours },
  { id: 'always',   Icon: Moon,        labelTh: '24/7',                  labelEn: '24/7',           apply: setAlwaysOpen },
  { id: 'closed',   Icon: XCircle,     labelTh: 'ปิดทุกวัน',             labelEn: 'Closed all week', apply: setAllClosed },
];

export function BusinessHoursCard() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const isTh = usePreferences((s) => s.locale) === 'th';

  const [hours, setHours] = useState<BusinessHours | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.businessHours
      .get()
      .then(setHours)
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) setErr(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  function patchDay(idx: number, patch: Partial<DayHours>) {
    setHours((prev) => {
      if (!prev) return prev;
      const days = prev.days.slice();
      days[idx] = { ...days[idx], ...patch };
      return { ...prev, days };
    });
  }

  function applyPreset(presetId: string) {
    setHours((prev) => {
      if (!prev) return prev;
      const preset = PRESETS.find((p) => p.id === presetId);
      if (!preset) return prev;
      return { ...prev, days: preset.apply(prev.days) };
    });
  }

  async function save() {
    if (!hours) return;
    setErr(null);
    setSaving(true);
    try {
      const updated = await api.businessHours.update({
        timezone: hours.timezone,
        out_of_hours_message: hours.out_of_hours_message,
        days: hours.days,
      });
      setHours(updated);
      showToast(t('settings.toast.saved'), 'success');
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : 'save failed';
      setErr(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  }

  // Live "open / closed right now" indicator for the workspace timezone.
  const status = useMemo(() => computeStatus(hours), [hours]);

  return (
    <Card>
      <CardHeader
        icon={<Clock className="h-4 w-4" />}
        title={isTh ? 'เวลาทำการ' : 'Business hours'}
        description={
          isTh
            ? 'AI จะแจ้งลูกค้านอกเวลาทำการว่าเราจะตอบกลับเมื่อไร'
            : "AI will let customers know when you're back outside these hours."
        }
        action={
          status && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
                status.open
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                  : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  status.open ? 'bg-emerald-500' : 'bg-slate-400',
                )}
              />
              {status.open ? (isTh ? 'เปิดอยู่' : 'Open') : (isTh ? 'ปิด' : 'Closed')}
            </span>
          )
        }
      />

      {loading || !hours ? (
        <p className="text-sm text-ink-faint">{t('common.loading')}</p>
      ) : (
        <>
          {/* Quick-set presets */}
          <div className="mb-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => {
              const PIcon = p.Icon;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line2 bg-card px-3 py-1.5 text-[12px] font-semibold text-ink-muted transition-colors hover:border-brand-300 hover:bg-brand-soft hover:text-brand-600"
                >
                  <PIcon className="h-3.5 w-3.5" />
                  {isTh ? p.labelTh : p.labelEn}
                </button>
              );
            })}
          </div>

          {/* 7-day table */}
          <div className="space-y-2">
            {hours.days.map((d, i) => (
              <DayRow
                key={i}
                day={d}
                label={isTh ? DAYS[i].th : DAYS[i].en}
                short={DAYS[i].short}
                onChange={(patch) => patchDay(i, patch)}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <FormGroup label={isTh ? 'โซนเวลา' : 'Timezone'}>
              <Select
                value={hours.timezone}
                onChange={(e) => setHours({ ...hours, timezone: e.target.value })}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup
              label={isTh ? 'ข้อความนอกเวลาทำการ' : 'After-hours message'}
              hint={isTh ? 'AI จะใช้ข้อความนี้บอกลูกค้าเมื่ออยู่นอกเวลา' : "AI uses this when the shop is closed"}
            >
              <Textarea
                rows={2}
                value={hours.out_of_hours_message}
                onChange={(e) =>
                  setHours({ ...hours, out_of_hours_message: e.target.value })
                }
                maxLength={1000}
              />
            </FormGroup>
          </div>

          {err && <p className="mt-3 text-sm text-red-500">{err}</p>}

          <Button
            className="mt-5"
            onClick={save}
            disabled={saving}
            iconLeft={!saving ? <Save className="h-4 w-4" /> : undefined}
          >
            {saving ? '…' : t('common.save')}
          </Button>
        </>
      )}
    </Card>
  );
}

// ── Row ────────────────────────────────────────────────────────────────

function DayRow({
  day,
  label,
  short,
  onChange,
}: {
  day: DayHours;
  label: string;
  short: string;
  onChange: (patch: Partial<DayHours>) => void;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-xl border border-line2 bg-page px-4 py-3 transition-opacity',
        !day.enabled && 'opacity-60',
      )}
    >
      <Toggle
        checked={day.enabled}
        onChange={(e) => onChange({ enabled: e.target.checked })}
      />
      <div className="w-24 shrink-0">
        <div className="text-sm font-semibold text-ink">{label}</div>
        <div className="text-[11px] text-ink-faint">{short}</div>
      </div>

      {day.enabled ? (
        <div className="flex items-center gap-2">
          <Input
            type="time"
            value={day.open}
            onChange={(e) => onChange({ open: e.target.value })}
            className="w-32"
          />
          <span className="text-ink-faint">–</span>
          <Input
            type="time"
            value={day.close}
            onChange={(e) => onChange({ close: e.target.value })}
            className="w-32"
          />
          <span className="ml-2 text-[12px] text-ink-faint">
            {durationLabel(day.open, day.close)}
          </span>
        </div>
      ) : (
        <span className="text-[13px] text-ink-faint">— ปิดทำการ / Closed —</span>
      )}
    </div>
  );
}

function durationLabel(open: string, close: string): string {
  const [oh, om] = open.split(':').map(Number);
  const [ch, cm] = close.split(':').map(Number);
  if (
    Number.isNaN(oh) || Number.isNaN(om) || Number.isNaN(ch) || Number.isNaN(cm)
  )
    return '';
  const mins = ch * 60 + cm - (oh * 60 + om);
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Live status (purely client-side; the AI prompt computes its own) ───

function computeStatus(hours: BusinessHours | null): { open: boolean } | null {
  if (!hours) return null;
  // Approximate "now in tenant tz" via Intl. We don't need second-level accuracy
  // — this is just a green/grey dot for the UI. The backend authority is what
  // gets used in the AI prompt.
  let now: Date;
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: hours.timezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
    const parts = fmt.formatToParts(new Date()).reduce<Record<string, string>>(
      (acc, p) => ((acc[p.type] = p.value), acc),
      {},
    );
    const weekdayMap: Record<string, number> = {
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
    };
    const weekday = weekdayMap[parts.weekday] ?? 0;
    const hm = `${parts.hour}:${parts.minute}`;
    const day = hours.days[weekday];
    if (!day || !day.enabled) return { open: false };
    return { open: hm >= day.open && hm < day.close };
  } catch {
    now = new Date();
    const day = hours.days[now.getDay()];
    if (!day?.enabled) return { open: false };
    const hm = now.toTimeString().slice(0, 5);
    return { open: hm >= day.open && hm < day.close };
  }
}

// ── Preset helpers ─────────────────────────────────────────────────────

function setBusinessWeek(_days: DayHours[]): DayHours[] {
  // Mon–Fri 09:00–18:00, Sat/Sun closed.
  return [
    { enabled: false, open: '10:00', close: '17:00' }, // Sun
    { enabled: true, open: '09:00', close: '18:00' },  // Mon
    { enabled: true, open: '09:00', close: '18:00' },
    { enabled: true, open: '09:00', close: '18:00' },
    { enabled: true, open: '09:00', close: '18:00' },
    { enabled: true, open: '09:00', close: '18:00' },
    { enabled: false, open: '10:00', close: '17:00' }, // Sat
  ];
}

function setShopHours(_days: DayHours[]): DayHours[] {
  // Every day 10:00–20:00.
  return Array.from({ length: 7 }, () => ({
    enabled: true,
    open: '10:00',
    close: '20:00',
  }));
}

function setAlwaysOpen(_days: DayHours[]): DayHours[] {
  return Array.from({ length: 7 }, () => ({
    enabled: true,
    open: '00:00',
    close: '23:59',
  }));
}

function setAllClosed(days: DayHours[]): DayHours[] {
  return days.map((d) => ({ ...d, enabled: false }));
}
