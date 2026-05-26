'use client';

// Channels page — manage external account connections (Facebook pages,
// Instagram Business Accounts, LINE Official Accounts). The backend supports
// many connections per provider, capped by the workspace's plan tier.
//
// Flows wired up here:
//
//   • LIST    — GET /channels returns { connections, limits, used }
//   • LINE    — paste channel_id/secret/access_token (no OAuth on LINE)
//   • FB      — OAuth: start → redirect to Facebook → callback bounces back
//               here with ?fb_oauth=ok&state=... → list pages → pick → connect
//   • IG      — OAuth: start → redirect to Meta → callback bounces back
//               here with ?ig_oauth=ok&state=... → list IG accounts → pick → connect
//   • DELETE  — disconnect by connection id

import { useEffect, useMemo, useState } from 'react';
import { AppShell, PageBody, PageHeader, useRoleGuard } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormGroup, Input } from '@/components/ui/Input';
import {
  api,
  ApiError,
  type ChannelConnection,
  type ChannelsResponse,
} from '@/lib/api';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/cn';
import {
  Plug,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  Copy,
  X as XIcon,
} from '@/components/ui/Icon';

type ProviderKey = 'facebook' | 'instagram' | 'line' | 'web';

type ProviderSpec = {
  id: ProviderKey;
  name: string;
  Logo: typeof MessageCircle;
  bg: string;
  fg: string;
};

const PROVIDERS: ProviderSpec[] = [
  {
    id: 'facebook',
    name: 'Facebook Messenger',
    Logo: Facebook,
    bg: 'bg-fb-soft dark:bg-sky-900/40',
    fg: 'text-fb dark:text-sky-300',
  },
  {
    id: 'instagram',
    name: 'Instagram Direct',
    Logo: Instagram,
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    fg: 'text-pink-600 dark:text-pink-300',
  },
  {
    id: 'line',
    name: 'LINE Official Account',
    Logo: MessageCircle,
    bg: 'bg-line-soft dark:bg-emerald-900/40',
    fg: 'text-line dark:text-emerald-300',
  },
  {
    id: 'web',
    name: 'Website Chat Widget',
    Logo: Globe,
    bg: 'bg-violet-50 dark:bg-violet-900/30',
    fg: 'text-violet-600 dark:text-violet-300',
  },
];

export default function ChannelsPage() {
  useRoleGuard(['owner', 'admin']);
  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [data, setData] = useState<ChannelsResponse | null>(null);
  // Which provider's inline panel is open: null | 'facebook' | 'instagram' | 'line'
  const [openProvider, setOpenProvider] = useState<ProviderKey | null>(null);
  // FB OAuth state token (set when Meta redirects back with ?fb_oauth=ok)
  const [pickerState, setPickerState] = useState<string | null>(null);
  // IG OAuth state token (set when Meta redirects back with ?ig_oauth=ok)
  const [igPickerState, setIGPickerState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [igBusy, setIGBusy] = useState(false);
  // Stores the embed code after a web widget connection is created
  const [webEmbedCode, setWebEmbedCode] = useState<string | null>(null);
  // Total-mode "Connect a channel" picker modal visibility.
  const [showProviderPicker, setShowProviderPicker] = useState(false);

  // ── Mode awareness ─────────────────────────────────────────────────────
  // In "total" mode the customer chooses any provider mix up to a single
  // cap; in "per_provider" mode each provider has its own cap (legacy UX).
  const isTotalMode = data?.channel_limit_mode === 'total';
  const totalCap = data?.total ?? -1;
  const totalUsed = data?.total_used ?? 0;
  const totalAtLimit = totalCap !== -1 && totalUsed >= totalCap;

  // ── Load connections on mount, and react to OAuth redirect query params.
  // We read window.location directly instead of useSearchParams so the page
  // doesn't need to be wrapped in <Suspense> (Next 14 app-router quirk).
  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    const fbOauth = search.get('fb_oauth');
    const igOauth = search.get('ig_oauth');
    const oauthState = search.get('state');

    if (fbOauth === 'ok' && oauthState) {
      setPickerState(oauthState);
      setOpenProvider('facebook');
      window.history.replaceState({}, '', '/channels');
    } else if (fbOauth === 'error') {
      showToast(`Facebook connect failed: ${search.get('reason') ?? 'unknown'}`, 'default');
      window.history.replaceState({}, '', '/channels');
    } else if (igOauth === 'ok' && oauthState) {
      setIGPickerState(oauthState);
      setOpenProvider('instagram');
      window.history.replaceState({}, '', '/channels');
    } else if (igOauth === 'error') {
      showToast(`Instagram connect failed: ${search.get('reason') ?? 'unknown'}`, 'default');
      window.history.replaceState({}, '', '/channels');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    try {
      setData(await api.channels.list());
    } catch { }
  }

  async function startFacebookOAuth() {
    setBusy(true);
    try {
      const resp = await api.channels.facebook.oauthStart();
      window.location.href = resp.login_url;
    } catch (e) {
      setBusy(false);
      showToast(e instanceof ApiError ? e.message : 'connect failed', 'default');
    }
  }

  async function startInstagramOAuth() {
    setIGBusy(true);
    try {
      const resp = await api.channels.instagram.oauthStart();
      window.location.href = resp.login_url;
    } catch (e) {
      setIGBusy(false);
      showToast(e instanceof ApiError ? e.message : 'connect failed', 'default');
    }
  }

  async function disconnect(conn: ChannelConnection) {
    if (!confirm(`Disconnect "${conn.display_name}"?`)) return;
    try {
      await api.channels.disconnect(conn.id);
      await refresh();
      showToast(t('common.disconnect'), 'success');
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : 'failed', 'default');
    }
  }

  function closePanel() {
    setOpenProvider(null);
    setPickerState(null);
    setIGPickerState(null);
    setWebEmbedCode(null);
  }

  // Start the connect flow for a provider — shared by per-provider section
  // buttons and the total-mode picker modal so behavior stays in sync.
  function startConnect(providerId: ProviderKey) {
    if (providerId === 'facebook') startFacebookOAuth();
    else if (providerId === 'instagram') startInstagramOAuth();
    else if (providerId === 'line') setOpenProvider('line');
    else if (providerId === 'web') setOpenProvider('web');
  }

  // Group connections by provider.
  const byProvider = useMemo(() => {
    const out: Record<string, ChannelConnection[]> = { facebook: [], instagram: [], line: [] };
    for (const c of data?.connections ?? []) {
      (out[c.provider] ??= []).push(c);
    }
    return out;
  }, [data]);

  return (
    <AppShell>
      <PageHeader
        icon={<Plug className="h-7 w-7" />}
        title={t('channels.title').replace('📡 ', '')}
        description={t('channels.sub')}
      />
      <PageBody>
        <div className="space-y-6">
          {/* ── Total-mode header ──────────────────────────────────────
              In "total" mode there's a single cap across all providers,
              so we show one usage gauge + a "+ Connect a channel" button
              that opens a picker modal. */}
          {isTotalMode && data && (
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-ink">Channels</h2>
                  <p className="text-xs text-ink-faint">
                    {totalUsed}
                    {totalCap !== -1 ? ` / ${totalCap}` : ''} channels connected
                    {totalCap === -1 && ' (unlimited)'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant={totalAtLimit ? 'outline' : 'primary'}
                  onClick={() => {
                    if (totalAtLimit) {
                      showToast(
                        `Plan limit reached (${totalUsed}/${totalCap}). Upgrade to add more.`,
                        'default',
                      );
                      return;
                    }
                    setShowProviderPicker(true);
                  }}
                  disabled={busy || igBusy}
                >
                  + Connect a channel
                </Button>
              </div>
            </Card>
          )}

          {PROVIDERS.map((p) => {
            const conns = byProvider[p.id] ?? [];
            const used = data?.used?.[p.id] ?? 0;
            // Use 0 as fallback (not 1): a missing key means the provider
            // is not on this plan. While data is still loading (data===null),
            // the optional-chain returns undefined → 0 → we hide the section,
            // but we show a skeleton instead (see below).
            const limit = data?.limits?.[p.id] ?? 0;

            // Hide providers that the plan doesn't include (limit === 0),
            // but only once the API response has arrived. While loading we
            // render all sections as skeletons so there's no layout shift.
            if (data !== null && limit === 0) return null;

            // In total mode, "at limit" is governed by the shared total
            // cap, not the per-provider number. In per-provider mode it's
            // the legacy check.
            const atLimit = isTotalMode
              ? totalAtLimit
              : used >= limit && limit !== -1;

            // The inline panel rendered inside this provider's section.
            let inlinePanel: React.ReactNode = null;
            if (openProvider === p.id) {
              if (p.id === 'facebook' && pickerState) {
                inlinePanel = (
                  <FacebookPagePicker
                    state={pickerState}
                    onClose={closePanel}
                    onDone={(n) => {
                      closePanel();
                      refresh();
                      showToast(`${n} Facebook page${n === 1 ? '' : 's'} connected`, 'success');
                    }}
                  />
                );
              } else if (p.id === 'instagram' && igPickerState) {
                inlinePanel = (
                  <InstagramAccountPicker
                    state={igPickerState}
                    onClose={closePanel}
                    onDone={(n) => {
                      closePanel();
                      refresh();
                      showToast(`${n} Instagram account${n === 1 ? '' : 's'} connected`, 'success');
                    }}
                  />
                );
              } else if (p.id === 'line') {
                inlinePanel = (
                  <ConnectLine
                    onClose={closePanel}
                    onDone={(conn) => {
                      closePanel();
                      refresh();
                      if (conn.webhook_url && navigator.clipboard) {
                        navigator.clipboard.writeText(conn.webhook_url).then(
                          () => showToast('LINE connected — webhook URL copied to clipboard', 'success'),
                          () => showToast('LINE connected', 'success'),
                        );
                      } else {
                        showToast('LINE connected', 'success');
                      }
                    }}
                  />
                );
              } else if (p.id === 'web') {
                inlinePanel = (
                  <ConnectWeb
                    embedCode={webEmbedCode}
                    existingConns={conns}
                    onClose={closePanel}
                    onConnect={async (opts) => {
                      try {
                        const r = await api.channels.web.connect(opts);
                        setWebEmbedCode(r.embed_code);
                        refresh();
                        showToast('Website widget created!', 'success');
                      } catch (e) {
                        showToast(e instanceof ApiError ? e.message : 'connect failed', 'default');
                      }
                    }}
                  />
                );
              }
            }

            return (
              <ProviderSection
                key={p.id}
                spec={p}
                connections={conns}
                used={used}
                limit={limit}
                isTotalMode={isTotalMode}
                onDisconnect={disconnect}
                onConnect={() => {
                  if (atLimit) {
                    const msg = isTotalMode
                      ? `Plan limit reached (${totalUsed}/${totalCap}). Upgrade to add more.`
                      : `Plan limit reached (${used}/${limit}). Upgrade to add more.`;
                    showToast(msg, 'default');
                    return;
                  }
                  startConnect(p.id);
                }}
                connectBusy={(p.id === 'facebook' && busy) || (p.id === 'instagram' && igBusy)}
                inlinePanel={inlinePanel}
              />
            );
          })}
        </div>

        {/* ── Total-mode picker modal ─────────────────────────────────
            Lives at the page root so backdrop covers the whole viewport. */}
        {showProviderPicker && (
          <ChannelPickerModal
            providers={PROVIDERS.filter((p) => (data?.limits?.[p.id] ?? 0) !== 0)}
            used={data?.used ?? {}}
            totalUsed={totalUsed}
            totalCap={totalCap}
            onClose={() => setShowProviderPicker(false)}
            onPick={(id) => {
              setShowProviderPicker(false);
              startConnect(id);
            }}
          />
        )}
      </PageBody>
    </AppShell>
  );
}

// ── ChannelPickerModal ─────────────────────────────────────────────────
// Total-mode entry point. Lists every provider the plan allows; clicking
// one routes to its existing connect flow. Per-provider visibility is still
// driven by `limits[provider] !== 0` so admins can hide providers on a tier
// even while using the total-cap model.

function ChannelPickerModal({
  providers,
  used,
  totalUsed,
  totalCap,
  onClose,
  onPick,
}: {
  providers: ProviderSpec[];
  used: Record<string, number>;
  totalUsed: number;
  totalCap: number;
  onClose: () => void;
  onPick: (id: ProviderKey) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-line2 p-4">
          <div>
            <h2 className="text-base font-bold text-ink">Connect a channel</h2>
            <p className="text-xs text-ink-faint">
              Choose any channel — {totalUsed}
              {totalCap !== -1 ? ` / ${totalCap}` : ''} used
              {totalCap === -1 && ' (unlimited)'}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        </div>

        {providers.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-faint">
            No channels available on your plan. Contact support to add one.
          </div>
        ) : (
          <ul className="space-y-2 p-4">
            {providers.map((p) => {
              const Logo = p.Logo;
              const usedHere = used[p.id] ?? 0;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onPick(p.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-line2 bg-card p-3 text-left transition-colors hover:bg-page"
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                        p.bg,
                        p.fg,
                      )}
                    >
                      <Logo className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-bold text-ink">{p.name}</div>
                      <div className="truncate text-[11px] text-ink-faint">
                        {usedHere > 0
                          ? `${usedHere} connected`
                          : 'Not connected yet'}
                      </div>
                    </div>
                    <span className="shrink-0 text-[12px] font-semibold text-brand-600">
                      Connect →
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── ProviderSection ────────────────────────────────────────────────────

function ProviderSection({
  spec,
  connections,
  used,
  limit,
  isTotalMode,
  onConnect,
  onDisconnect,
  connectBusy,
  inlinePanel,
}: {
  spec: ProviderSpec;
  connections: ChannelConnection[];
  used: number;
  limit: number;
  /** When true, the page is in total-cap mode — the per-section Connect
   *  button is suppressed in favor of the unified picker modal at the top.
   *  Empty sections are also hidden to keep the page clean. */
  isTotalMode?: boolean;
  onConnect: () => void;
  onDisconnect: (c: ChannelConnection) => void;
  connectBusy?: boolean;
  inlinePanel?: React.ReactNode;
}) {
  const t = useT();
  const Logo = spec.Logo;
  const atLimit = limit !== -1 && used >= limit;

  // In total-cap mode, hide entire sections that have no connections and
  // no open inline panel — the customer adds them via the top-level picker
  // instead. Sections with active connections still render so they can be
  // managed/disconnected.
  if (isTotalMode && connections.length === 0 && !inlinePanel) {
    return null;
  }

  return (
    <section>
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', spec.bg, spec.fg)}>
            <Logo className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-ink">{spec.name}</h2>
            <p className="text-xs text-ink-faint">
              {isTotalMode
                ? `${used} ${t('common.connected').toLowerCase()}`
                : `${used}${limit !== -1 ? ` / ${limit}` : ''} ${t('common.connected').toLowerCase()}`}
            </p>
          </div>
        </div>
        {!isTotalMode && (
          <Button
            size="sm"
            variant={atLimit ? 'outline' : 'primary'}
            onClick={onConnect}
            disabled={connectBusy}
            className="shrink-0"
          >
            {connectBusy ? '…' : `+ ${t('common.connect')}`}
          </Button>
        )}
      </div>

      {connections.length === 0 && !inlinePanel ? (
        <div className="rounded-2xl border border-dashed border-line2 bg-card p-6 text-center text-sm text-ink-faint">
          {t('common.notConnected')}
        </div>
      ) : connections.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {connections.map((c) => (
            <ConnectionCard key={c.id} conn={c} onDisconnect={() => onDisconnect(c)} />
          ))}
        </div>
      ) : null}

      {/* Inline picker/form — rendered inside this section's box */}
      {inlinePanel && <div className="mt-3">{inlinePanel}</div>}
    </section>
  );
}

// ── ConnectionCard ─────────────────────────────────────────────────────

function ConnectionCard({
  conn,
  onDisconnect,
}: {
  conn: ChannelConnection;
  onDisconnect: () => void;
}) {
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const ok = conn.status === 'active';
  const showWebhook = conn.provider === 'line' && !!conn.webhook_url;
  return (
    <div className="flex flex-col rounded-2xl border border-line2 bg-card p-4 transition-shadow hover:shadow-card-hover">
      {/* Name + status badge */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-ink">{conn.display_name || conn.external_id}</h3>
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">{conn.external_id}</p>
        </div>
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            ok
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300',
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', ok ? 'bg-emerald-500' : 'bg-red-500')} />
          {ok ? t('common.connected') : conn.status}
        </span>
      </div>
      {conn.error && <p className="mt-2 text-xs text-red-500">{conn.error}</p>}

      {/* Webhook URL — stacks vertically on mobile, side-by-side on wider screens */}
      {showWebhook && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] font-medium text-ink-faint">Webhook URL</div>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="min-w-0 flex-1 overflow-hidden rounded-md border border-line2 bg-page px-2 py-1.5">
              <code className="block truncate text-[11px] text-ink">{conn.webhook_url}</code>
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(conn.webhook_url).then(
                  () => showToast('Webhook URL copied', 'success'),
                  () => showToast('Copy failed', 'default'),
                )
              }
              className="shrink-0 self-stretch rounded-md border border-line2 px-3 py-1.5 text-[11px] font-bold text-brand-600 hover:bg-brand-soft/40 sm:self-auto"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Disconnect */}
      <div className="mt-auto pt-3">
        <Button size="sm" variant="danger" fullWidth onClick={onDisconnect}>
          {t('common.disconnect')}
        </Button>
      </div>
    </div>
  );
}

// ── Connect LINE (manual) ──────────────────────────────────────────────

function ConnectLine({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: (conn: ChannelConnection) => void;
}) {
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const [channelId, setChannelId] = useState('');
  const [secret, setSecret] = useState('');
  const [busy, setBusy] = useState(false);
  const [template, setTemplate] = useState<string>('/webhooks/line/{channel_id}');

  useEffect(() => {
    api.channels
      .webhookUrlTemplate('line')
      .then((r) => setTemplate(r.template))
      .catch(() => {});
  }, []);

  const previewUrl = template.replace('{channel_id}', channelId.trim() || 'YOUR_CHANNEL_ID');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const conn = await api.channels.connectLine({
        channel_id: channelId.trim(),
        channel_secret: secret.trim(),
      });
      onDone(conn);
    } catch { } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<MessageCircle className="h-4 w-4 text-line" />}
        title={t('channels.connect.line')}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />

      {/* Step 1 */}
      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">1</span>
          <span className="text-sm font-bold text-ink">Paste from LINE Developers</span>
        </div>
        <p className="mb-3 ml-7 text-[12px] text-ink-faint">
          LINE Developers console → your Messaging API channel → Basic settings.
          We'll handle the access token for you — no need to issue one manually.
        </p>
        <form onSubmit={submit} className="ml-7 space-y-3">
          <FormGroup label="Channel ID">
            <Input
              required
              value={channelId}
              onChange={(e) => setChannelId(e.target.value)}
              placeholder="1234567890"
            />
          </FormGroup>
          <FormGroup label="Channel secret">
            <Input
              required
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••••••••••"
            />
          </FormGroup>
          <Button type="submit" disabled={busy || !channelId || !secret}>
            {busy ? '…' : t('common.connect')}
          </Button>
        </form>
      </div>

      {/* Step 2 — webhook URL */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">2</span>
          <span className="text-sm font-bold text-ink">Paste this URL back into LINE</span>
        </div>
        <p className="mb-3 ml-7 text-[12px] text-ink-faint">
          LINE Developers → Messaging API → <span className="font-medium">Webhook URL</span>.
          Paste the URL below, hit Update, then turn <span className="font-medium">Use webhook</span> ON.
        </p>
        {/* URL row: stacks on mobile, side-by-side on sm+ */}
        <div className="ml-7 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
          <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-line2 bg-page px-3 py-2">
            <code className="block truncate text-[12px] text-ink">{previewUrl}</code>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() =>
              navigator.clipboard.writeText(previewUrl).then(
                () => showToast('Webhook URL copied', 'success'),
                () => showToast('Copy failed', 'default'),
              )
            }
          >
            Copy
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Connect Web Widget ─────────────────────────────────────────────────

function ConnectWeb({
  embedCode,
  existingConns,
  onClose,
  onConnect,
}: {
  embedCode: string | null;
  existingConns: ChannelConnection[];
  onClose: () => void;
  onConnect: (opts: { display_name?: string; bot_name?: string; greeting_message?: string }) => Promise<void>;
}) {
  const showToast = useUI((s) => s.showToast);
  const [displayName, setDisplayName] = useState('');
  const [botName, setBotName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [busy, setBusy] = useState(false);

  // If the tenant already has web connections, show their embed codes.
  const existingWeb = existingConns.filter((c) => c.provider === 'web');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onConnect({ display_name: displayName.trim() || undefined, bot_name: botName.trim() || undefined, greeting_message: greeting.trim() || undefined });
    } finally {
      setBusy(false);
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).then(
      () => showToast('Embed code copied!', 'success'),
      () => showToast('Copy failed', 'default'),
    );
  }

  return (
    <Card>
      <CardHeader
        icon={<Globe className="h-4 w-4 text-violet-600" />}
        title="Website Chat Widget"
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />

      {/* Show newly-created embed code */}
      {embedCode && (
        <div className="mb-5 rounded-xl border border-violet-200 bg-violet-50 p-4 dark:border-violet-800/40 dark:bg-violet-950/30">
          <p className="mb-2 text-sm font-semibold text-violet-800 dark:text-violet-300">
            ✓ Widget created — paste this snippet before <code className="text-xs">&lt;/body&gt;</code> on your site:
          </p>
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-violet-200 bg-white px-3 py-2 dark:border-violet-700 dark:bg-violet-900/20">
              <code className="block truncate text-[12px] text-ink">{embedCode}</code>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => copyCode(embedCode)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
            </Button>
          </div>
        </div>
      )}

      {/* Show embed codes of existing connections */}
      {existingWeb.length > 0 && !embedCode && (
        <div className="mb-5 space-y-3">
          <p className="text-sm font-semibold text-ink">Existing widgets</p>
          {existingWeb.map((c) => {
            const code = `<script src="${window.location.origin}/widget.js" data-widget-id="${c.external_id}"></script>`;
            return (
              <div key={c.id} className="rounded-xl border border-line2 bg-page p-3">
                <p className="mb-1.5 text-xs font-semibold text-ink">{c.display_name}</p>
                <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                  <div className="min-w-0 flex-1 overflow-hidden rounded-lg border border-line2 bg-card px-3 py-2">
                    <code className="block truncate text-[11px] text-ink">{code}</code>
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => copyCode(code)}>
                    <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create new widget form */}
      <form onSubmit={submit} className="space-y-3">
        <p className="text-sm font-semibold text-ink">Create a new widget</p>
        <FormGroup label="Widget name (internal)">
          <Input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="My Website"
          />
        </FormGroup>
        <FormGroup label="Bot display name (shown to visitors)">
          <Input
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            placeholder="Aria"
          />
        </FormGroup>
        <FormGroup label="Greeting message">
          <Input
            value={greeting}
            onChange={(e) => setGreeting(e.target.value)}
            placeholder="Hi! How can I help you today?"
          />
        </FormGroup>
        <Button type="submit" disabled={busy}>
          {busy ? '…' : 'Create widget'}
        </Button>
      </form>
    </Card>
  );
}

// ── Shared picker item ─────────────────────────────────────────────────

function PickerItem({
  label,
  sub,
  checked,
  onToggle,
}: {
  label: string;
  sub: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
        checked
          ? 'border-brand-400 bg-brand-soft/50 dark:border-brand-500'
          : 'border-line2 bg-card hover:bg-page',
      )}
    >
      <div className="min-w-0">
        <div className="truncate text-sm font-bold text-ink">{label}</div>
        <div className="truncate text-[11px] text-ink-faint">{sub}</div>
      </div>
      <span
        className={cn(
          'ml-3 h-5 w-5 shrink-0 rounded border-2',
          checked ? 'border-brand-500 bg-brand-500' : 'border-line2',
        )}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="h-full w-full" fill="none">
            <path d="M3 8.5l3.5 3L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

// ── Facebook page picker ───────────────────────────────────────────────

function FacebookPagePicker({
  state,
  onClose,
  onDone,
}: {
  state: string;
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const [pages, setPages] = useState<{ id: string; name: string; category?: string }[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.channels.facebook.oauthPages(state).then((r) => {
      if (!cancelled) setPages(r.pages);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [state]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function submit() {
    if (picked.size === 0) return;
    setBusy(true);
    try {
      const r = await api.channels.facebook.oauthConnect(state, [...picked]);
      onDone(r.connections.length);
    } catch {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<Facebook className="h-4 w-4 text-fb" />}
        title="Choose Facebook pages to connect"
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />
      {!pages && <p className="text-sm text-ink-faint">Loading pages…</p>}
      {pages && pages.length === 0 && (
        <p className="text-sm text-ink-faint">
          No pages found. Make sure you grant access to at least one page.
        </p>
      )}
      {pages && pages.length > 0 && (
        <ul className="space-y-2">
          {pages.map((p) => (
            <li key={p.id}>
              <PickerItem
                label={p.name}
                sub={p.category ?? p.id}
                checked={picked.has(p.id)}
                onToggle={() => toggle(p.id)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={busy || picked.size === 0}>
          {busy ? '…' : `Connect ${picked.size || ''}`}
        </Button>
      </div>
    </Card>
  );
}

// ── Instagram account picker ───────────────────────────────────────────

function InstagramAccountPicker({
  state,
  onClose,
  onDone,
}: {
  state: string;
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const [accounts, setAccounts] = useState<{ igid: string; name: string; username?: string }[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.channels.instagram.oauthAccounts(state).then((r) => {
      if (!cancelled) setAccounts(r.accounts);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [state]);

  function toggle(igid: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      next.has(igid) ? next.delete(igid) : next.add(igid);
      return next;
    });
  }

  async function submit() {
    if (picked.size === 0) return;
    setBusy(true);
    try {
      const r = await api.channels.instagram.oauthConnect(state, [...picked]);
      onDone(r.connections.length);
    } catch {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<Instagram className="h-4 w-4 text-pink-500" />}
        title="Choose Instagram accounts to connect"
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />
      {!accounts && <p className="text-sm text-ink-faint">Loading accounts…</p>}
      {accounts && accounts.length === 0 && (
        <p className="text-sm text-ink-faint">
          No Instagram Business Accounts found. Make sure your Instagram is a Business or Creator
          account linked to a Facebook Page you manage.
        </p>
      )}
      {accounts && accounts.length > 0 && (
        <ul className="space-y-2">
          {accounts.map((a) => (
            <li key={a.igid}>
              <PickerItem
                label={a.name}
                sub={a.username ? `@${a.username}` : a.igid}
                checked={picked.has(a.igid)}
                onToggle={() => toggle(a.igid)}
              />
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={submit} disabled={busy || picked.size === 0}>
          {busy ? '…' : `Connect ${picked.size || ''}`}
        </Button>
      </div>
    </Card>
  );
}
