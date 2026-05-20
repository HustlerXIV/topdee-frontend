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
  X as XIcon,
} from '@/components/ui/Icon';

type ProviderKey = 'facebook' | 'instagram' | 'line';

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
          {PROVIDERS.map((p) => {
            const conns = byProvider[p.id] ?? [];
            const used = data?.used?.[p.id] ?? 0;
            const limit = data?.limits?.[p.id] ?? 1;
            const atLimit = used >= limit;

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
              }
            }

            return (
              <ProviderSection
                key={p.id}
                spec={p}
                connections={conns}
                used={used}
                limit={limit}
                onDisconnect={disconnect}
                onConnect={() => {
                  if (atLimit) {
                    showToast(`Plan limit reached (${used}/${limit}). Upgrade to add more.`, 'default');
                    return;
                  }
                  if (p.id === 'facebook') startFacebookOAuth();
                  else if (p.id === 'instagram') startInstagramOAuth();
                  else if (p.id === 'line') setOpenProvider('line');
                }}
                connectBusy={(p.id === 'facebook' && busy) || (p.id === 'instagram' && igBusy)}
                inlinePanel={inlinePanel}
              />
            );
          })}
        </div>
      </PageBody>
    </AppShell>
  );
}

// ── ProviderSection ────────────────────────────────────────────────────

function ProviderSection({
  spec,
  connections,
  used,
  limit,
  onConnect,
  onDisconnect,
  connectBusy,
  inlinePanel,
}: {
  spec: ProviderSpec;
  connections: ChannelConnection[];
  used: number;
  limit: number;
  onConnect: () => void;
  onDisconnect: (c: ChannelConnection) => void;
  connectBusy?: boolean;
  inlinePanel?: React.ReactNode;
}) {
  const t = useT();
  const Logo = spec.Logo;
  const atLimit = used >= limit;
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
              {used} / {limit} {t('common.connected').toLowerCase()}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant={atLimit ? 'outline' : 'primary'}
          onClick={onConnect}
          disabled={connectBusy}
          className="shrink-0"
        >
          {connectBusy ? '…' : `+ ${t('common.connect')}`}
        </Button>
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
