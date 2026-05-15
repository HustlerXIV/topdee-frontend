'use client';

import { useEffect, useState, useCallback } from 'react';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Card, CardHeader } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/lib/i18n/useT';
import { api, ApiError, type AnalyticsStats, type DailyStat } from '@/lib/api';
import { useUI } from '@/store/ui';
import {
  BarChart3,
  MessageSquare,
  Bot,
  Users,
  UserCheck,
} from '@/components/ui/Icon';

// ── helpers ──────────────────────────────────────────────────────────

type Range = '7d' | '30d' | 'month';

/** Fill every day in the window with a count (0 if no data). */
function fillDailyGaps(daily: DailyStat[], days: number): DailyStat[] {
  const map = new Map(daily.map((d) => [d.date, d.count]));
  const result: DailyStat[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: map.get(key) ?? 0 });
  }
  return result;
}

/** Short label for a YYYY-MM-DD string — "Mon 5", "Tue 6", etc. */
function dayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Month label for longer ranges — "May 1" etc. */
function shortDateLabel(iso: string, days: number): string {
  if (days <= 7) return dayLabel(iso);
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Colour per channel */
const CHANNEL_COLORS: Record<string, string> = {
  line:      'bg-green-500',
  facebook:  'bg-blue-500',
  instagram: 'bg-pink-500',
  webchat:   'bg-brand-500',
};
const CHANNEL_TEXT: Record<string, string> = {
  line:      'text-green-600 dark:text-green-400',
  facebook:  'text-blue-600 dark:text-blue-400',
  instagram: 'text-pink-600 dark:text-pink-400',
  webchat:   'text-brand-600',
};
function channelColor(ch: string) {
  return CHANNEL_COLORS[ch.toLowerCase()] ?? 'bg-slate-400';
}
function channelTextColor(ch: string) {
  return CHANNEL_TEXT[ch.toLowerCase()] ?? 'text-ink-muted';
}

/** % change badge text */
function changeBadge(current: number, prev: number): { label: string; tone: 'up' | 'down' | 'flat' | 'new' } {
  if (prev === 0) return { label: '—', tone: 'new' };
  const delta = Math.round(((current - prev) / prev) * 100);
  if (delta === 0) return { label: '±0%', tone: 'flat' };
  return {
    label: `${delta > 0 ? '↑' : '↓'} ${Math.abs(delta)}%`,
    tone: delta > 0 ? 'up' : 'down',
  };
}

const toneClass: Record<string, string> = {
  up:   'text-green-600 dark:text-green-400',
  down: 'text-red-500 dark:text-red-400',
  flat: 'text-ink-faint',
  new:  'text-ink-faint',
};

// ── component ─────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [range, setRange] = useState<Range>('7d');
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(
    (r: Range) => {
      setLoading(true);
      api
        .analytics(r)
        .then(setStats)
        .catch((e) => showToast(e instanceof ApiError ? e.message : 'Failed to load stats', 'error'))
        .finally(() => setLoading(false));
    },
    [showToast],
  );

  useEffect(() => {
    load(range);
  }, [range, load]);

  // ── Bar chart data ──────────────────────────────────────────────
  const days = stats?.days_in_range ?? (range === '30d' ? 30 : range === 'month' ? new Date().getDate() : 7);
  const filled = stats ? fillDailyGaps(stats.daily, days) : [];
  const maxCount = filled.reduce((m, d) => Math.max(m, d.count), 1);

  // ── KPI deltas ──────────────────────────────────────────────────
  const convDelta   = changeBadge(stats?.total_conversations ?? 0, stats?.prev_total_conversations ?? 0);
  const aiDelta     = changeBadge(stats?.ai_resolved_pct ?? 0,     stats?.prev_ai_resolved_pct ?? 0);
  const custDelta   = changeBadge(stats?.unique_customers ?? 0,    stats?.prev_unique_customers ?? 0);

  // ── Resolution breakdown ────────────────────────────────────────
  const totalConvs = stats?.total_conversations ?? 0;
  const aiCount    = stats?.ai_resolved_count ?? 0;
  const humanCount = stats?.human_takeovers ?? 0;
  const otherCount = Math.max(0, totalConvs - aiCount - humanCount);

  return (
    <AppShell>
      <PageHeader
        icon={<BarChart3 className="h-7 w-7" />}
        title={t('analytics.title').replace('📊 ', '')}
        description={t('analytics.sub2')}
        action={
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="w-44"
          >
            <option value="7d">{t('analytics.range.7d')}</option>
            <option value="30d">{t('analytics.range.30d')}</option>
            <option value="month">{t('analytics.range.month')}</option>
          </Select>
        }
      />
      <PageBody>
        {/* ── KPI cards ─────────────────────────────────────────── */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {t('analytics.kpi.totalConvs').replace('💬 ', '')}
              </span>
            }
            value={loading ? '…' : (stats?.total_conversations ?? 0).toLocaleString()}
            change={loading ? '' : convDelta.label}
            changeTone={convDelta.tone === 'up' ? 'up' : convDelta.tone === 'down' ? 'down' : undefined}
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Bot className="h-4 w-4" />
                {t('analytics.kpi.aiResolved2').replace('🤖 ', '')}
              </span>
            }
            value={loading ? '…' : `${stats?.ai_resolved_pct ?? 0}%`}
            change={loading ? '' : aiDelta.label}
            changeTone={aiDelta.tone === 'up' ? 'up' : aiDelta.tone === 'down' ? 'down' : undefined}
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="h-4 w-4" />
                {t('analytics.kpi.humanTakeover').replace('👤 ', '')}
              </span>
            }
            value={loading ? '…' : (stats?.human_takeovers ?? 0).toLocaleString()}
            change={loading ? '' : `${totalConvs > 0 ? Math.round((humanCount / totalConvs) * 100) : 0}% of total`}
          />
          <StatCard
            label={
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {t('analytics.kpi.uniqueCustomers').replace('👥 ', '')}
              </span>
            }
            value={loading ? '…' : (stats?.unique_customers ?? 0).toLocaleString()}
            change={loading ? '' : custDelta.label}
            changeTone={custDelta.tone === 'up' ? 'up' : custDelta.tone === 'down' ? 'down' : undefined}
          />
        </div>

        {/* ── Conversations per day bar chart ───────────────────── */}
        <Card>
          <CardHeader title={t('analytics.bar.title')} />
          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-ink-faint">
              {t('analytics.loading')}
            </div>
          ) : filled.length === 0 || maxCount === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-ink-faint">
              {t('analytics.noData')}
            </div>
          ) : (
            <>
              <div className="flex h-40 items-end gap-1">
                {filled.map((d) => {
                  const heightPct = maxCount > 0 ? Math.max(4, (d.count / maxCount) * 100) : 4;
                  return (
                    <div key={d.date} className="group relative flex flex-1 flex-col items-center">
                      {/* Tooltip */}
                      <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-line2 bg-card px-2 py-0.5 text-[11px] font-semibold text-ink opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        {d.count}
                      </div>
                      <div
                        className={`w-full rounded-t-md transition-opacity hover:opacity-80 ${
                          d.count === 0 ? 'bg-muted' : 'bg-brand-600'
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* X-axis labels — only show every nth to avoid crowding */}
              <div className="mt-2 flex gap-1">
                {filled.map((d, i) => {
                  // Show all labels for 7d; every 5th for 30d+
                  const show = days <= 7 || i === 0 || i === filled.length - 1 || (i + 1) % 5 === 0;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 text-center text-[10px] text-ink-faint"
                    >
                      {show ? shortDateLabel(d.date, days) : ''}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* ── Channel breakdown + Resolution summary ────────────── */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Channel breakdown */}
          <Card>
            <CardHeader title={t('analytics.pie.title')} />
            {loading ? (
              <p className="text-sm text-ink-faint">{t('analytics.loading')}</p>
            ) : !stats || stats.channel_breakdown.length === 0 ? (
              <p className="text-sm text-ink-faint">{t('analytics.noData')}</p>
            ) : (
              <div className="mt-3 space-y-3">
                {stats.channel_breakdown.map((ch) => {
                  const label =
                    ch.channel === 'line'
                      ? t('analytics.channel.line')
                      : ch.channel === 'facebook'
                        ? t('analytics.channel.facebook')
                        : ch.channel.charAt(0).toUpperCase() + ch.channel.slice(1);
                  return (
                    <div key={ch.channel}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className={`flex items-center gap-2 font-medium ${channelTextColor(ch.channel)}`}>
                          <span className={`h-2.5 w-2.5 rounded-full ${channelColor(ch.channel)}`} />
                          {label}
                        </span>
                        <span className="font-semibold text-ink">
                          {ch.count.toLocaleString()}
                          <span className="ml-1 font-normal text-ink-faint">({ch.pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${channelColor(ch.channel)}`}
                          style={{ width: `${ch.pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Resolution summary */}
          <Card>
            <CardHeader title={t('analytics.resolution.title')} />
            {loading ? (
              <p className="text-sm text-ink-faint">{t('analytics.loading')}</p>
            ) : totalConvs === 0 ? (
              <p className="text-sm text-ink-faint">{t('analytics.noData')}</p>
            ) : (
              <div className="mt-3 space-y-4">
                {/* AI resolved */}
                <ResolutionRow
                  label={t('analytics.kpi.aiResolved2').replace('🤖 ', '')}
                  description={t('analytics.resolution.aiDesc')}
                  count={aiCount}
                  total={totalConvs}
                  barClass="bg-brand-500"
                  labelClass="text-brand-600 dark:text-brand-400"
                />
                {/* Human takeovers */}
                <ResolutionRow
                  label={t('analytics.kpi.humanTakeover').replace('👤 ', '')}
                  description={t('analytics.resolution.humanDesc')}
                  count={humanCount}
                  total={totalConvs}
                  barClass="bg-amber-500"
                  labelClass="text-amber-600 dark:text-amber-400"
                />
                {/* Unanswered */}
                {otherCount > 0 && (
                  <ResolutionRow
                    label={t('analytics.resolution.unanswered')}
                    description=""
                    count={otherCount}
                    total={totalConvs}
                    barClass="bg-slate-400"
                    labelClass="text-ink-muted"
                  />
                )}

                {/* Comparison to previous period */}
                {stats && (stats.prev_ai_resolved_pct > 0 || stats.prev_total_conversations > 0) && (
                  <div className="mt-4 border-t border-line2 pt-3 text-[12px] text-ink-faint">
                    <span className="mr-1">vs. prev period:</span>
                    <span className={toneClass[aiDelta.tone]}>
                      AI {aiDelta.label}
                    </span>
                    <span className="mx-2">·</span>
                    <span className={toneClass[convDelta.tone]}>
                      Convs {convDelta.label}
                    </span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </PageBody>
    </AppShell>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function ResolutionRow({
  label,
  description,
  count,
  total,
  barClass,
  labelClass,
}: {
  label: string;
  description: string;
  count: number;
  total: number;
  barClass: string;
  labelClass: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-2 text-[13px]">
        <div>
          <span className={`font-semibold ${labelClass}`}>{label}</span>
          {description && (
            <span className="ml-1.5 text-ink-faint">{description}</span>
          )}
        </div>
        <span className="shrink-0 font-semibold text-ink">
          {count.toLocaleString()}
          <span className="ml-1 font-normal text-ink-faint">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
