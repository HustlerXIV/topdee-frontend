'use client';

import { useState } from 'react';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/lib/i18n/useT';
import { BarChart3, MessageSquare, Bot, Zap, Smile } from '@/components/ui/Icon';

const DAYS = [
  { label: 'Mon 11', height: 55, op: 0.5 },
  { label: 'Tue 12', height: 70, op: 0.6 },
  { label: 'Wed 13', height: 45, op: 0.5 },
  { label: 'Thu 14', height: 85, op: 1 },
  { label: 'Fri 15', height: 100, op: 1 },
  { label: 'Sat 16', height: 78, op: 0.8 },
  { label: 'Sun 17', height: 60, op: 0.6 },
];

const TOP = [
  { th: 'ราคาสินค้า', en: 'Product pricing', pct: 34 },
  { th: 'วิธีสั่งซื้อ', en: 'How to order', pct: 28 },
  { th: 'ระยะเวลาจัดส่ง', en: 'Shipping time', pct: 19 },
  { th: 'นโยบายคืนสินค้า', en: 'Return policy', pct: 11 },
  { th: 'โปรโมชั่น', en: 'Promotions', pct: 8 },
];

export default function AnalyticsPage() {
  const t = useT();
  const [range, setRange] = useState('30d');
  // Resolve TH/EN copy for the top-questions list. Simpler than a per-row dict
  // entry for these prototype labels.
  const isTh = t('common.lang.th') === 'ไทย';

  return (
    <AppShell>
      <PageHeader
        icon={<BarChart3 className="h-7 w-7" />}
        title={t('analytics.title').replace('📊 ', '')}
        description={t('analytics.sub')}
        action={
          <Select value={range} onChange={(e) => setRange(e.target.value)} className="w-44">
            <option value="30d">{t('analytics.range.30d')}</option>
            <option value="7d">{t('analytics.range.7d')}</option>
            <option value="month">{t('analytics.range.month')}</option>
          </Select>
        }
      />
      <PageBody>
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {t('analytics.kpi.totalChats').replace('💬 ', '')}
              </span>
            }
            value="3,847"
            change="↑ 24%"
            changeTone="up"
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Bot className="h-4 w-4" />
                {t('analytics.kpi.aiResolved').replace('🤖 ', '')}
              </span>
            }
            value="72%"
            change="↑ 8%"
            changeTone="up"
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Zap className="h-4 w-4" />
                {t('analytics.kpi.avgTime').replace('⚡ ', '')}
              </span>
            }
            value="1.2"
            unit={t('analytics.kpi.minutes')}
            change="↓ 45%"
            changeTone="up"
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Smile className="h-4 w-4" />
                {t('analytics.kpi.satisfaction').replace('😊 ', '')}
              </span>
            }
            value="4.8"
            unit="/5"
            change="↑ 0.3"
            changeTone="up"
          />
        </div>

        <Card>
          <CardHeader title={t('analytics.bar.title')} />
          <div className="flex h-40 items-end gap-2">
            {DAYS.map((d) => (
              <div
                key={d.label}
                className="flex-1 rounded-t-md bg-brand-600 transition-opacity hover:opacity-80"
                style={{ height: `${d.height}%`, opacity: d.op }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {DAYS.map((d) => (
              <div key={d.label} className="flex-1 text-center text-[11px] text-ink-faint">
                {d.label}
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader title={t('analytics.pie.title')} />
            <div className="mt-3 flex items-center gap-6">
              <div
                className="h-24 w-24 flex-shrink-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(#6c47ff 0% 58%, #38bdf8 58% 80%, #f59e0b 80% 92%, #475569 92% 100%)',
                }}
              />
              <ul className="space-y-2 text-[13px] text-ink">
                <Legend color="bg-brand-600" label="LINE OA — 58%" />
                <Legend color="bg-sky-400" label="Facebook — 22%" />
                <Legend color="bg-amber-500" label="Instagram — 12%" />
                <Legend color="bg-line2-strong" label="Webchat — 8%" />
              </ul>
            </div>
          </Card>
          <Card>
            <CardHeader title={t('analytics.top.title')} />
            <div className="space-y-3">
              {TOP.map((row, i) => (
                <div key={row.en}>
                  <div className="mb-1 flex justify-between text-[13px] text-ink">
                    <span>{isTh ? row.th : row.en}</span>
                    <strong>{row.pct}%</strong>
                  </div>
                  <div className="h-2 rounded-full bg-line2">
                    <div
                      className={`h-full rounded-full ${
                        i < 2 ? 'bg-brand-600' : i < 4 ? 'bg-brand-400' : 'bg-brand-300'
                      }`}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </PageBody>
    </AppShell>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {label}
    </li>
  );
}
