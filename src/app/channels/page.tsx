'use client';

// Channels page — manage external account connections (Facebook pages,
// LINE Official Accounts). The backend now supports many connections per
// provider, capped by the workspace's plan tier.
//
// Flows wired up here:
//
//   • LIST    — GET /channels returns { connections, limits, used }
//   • LINE    — paste channel_id/secret/access_token (no OAuth on LINE)
//   • FB      — OAuth: start → redirect to Facebook → callback bounces back
//               here with ?fb_oauth=ok&state=... → list pages → pick → connect
//   • DELETE  — disconnect by connection id

import { useEffect, useMemo, useState } from 'react';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormGroup, FormRow, Input } from '@/components/ui/Input';
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
  X as XIcon,
} from '@/components/ui/Icon';

type ProviderKey = 'facebook' | 'line';

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
    id: 'line',
    name: 'LINE Official Account',
    Logo: MessageCircle,
    bg: 'bg-line-soft dark:bg-emerald-900/40',
    fg: 'text-line dark:text-emerald-300',
  },
];

export default function ChannelsPage() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [data, setData] = useState<ChannelsResponse | null>(null);
  const [openLine, setOpenLine] = useState(false);
  // Holds the OAuth state token while we show the page picker. Null when no
  // picker is open.
  const [pickerState, setPickerState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ── Load connections on mount, and react to OAuth redirect query params.
  // We read window.location directly instead of useSearchParams so the page
  // doesn't need to be wrapped in <Suspense> (Next 14 app-router quirk).
  useEffect(() => {
    refresh();
    if (typeof window === 'undefined') return;
    const search = new URLSearchParams(window.location.search);
    const fbOauth = search.get('fb_oauth');
    const oauthState = search.get('state');
    if (fbOauth === 'ok' && oauthState) {
      setPickerState(oauthState);
      // Strip the query string so a subsequent refresh won't re-trigger the picker.
      window.history.replaceState({}, '', '/channels');
    } else if (fbOauth === 'error') {
      const reason = search.get('reason') ?? 'unknown';
      showToast(`Facebook connect failed: ${reason}`, 'default');
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
      // Full-page redirect to Facebook. After the user authorizes, the FB
      // callback redirects them back to /channels?fb_oauth=ok&state=...
      window.location.href = resp.login_url;
    } catch (e) {
      setBusy(false);
      const msg = e instanceof ApiError ? e.message : 'connect failed';
      showToast(msg, 'default');
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

  // Group connections by provider so we render one section per provider with
  // its own "+ Connect" button and limit indicator.
  const byProvider = useMemo(() => {
    const out: Record<string, ChannelConnection[]> = { facebook: [], line: [] };
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
                    showToast(
                      `Plan limit reached (${used}/${limit}). Upgrade to add more.`,
                      'default',
                    );
                    return;
                  }
                  if (p.id === 'facebook') startFacebookOAuth();
                  if (p.id === 'line') setOpenLine(true);
                }}
                connectBusy={p.id === 'facebook' && busy}
              />
            );
          })}
        </div>

        {openLine && (
          <ConnectLine
            onClose={() => setOpenLine(false)}
            onDone={(conn) => {
              setOpenLine(false);
              refresh();
              // Auto-copy the webhook URL — the user's next step is to paste
              // it into LINE, so optimize for that flow.
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
        )}
        {pickerState && (
          <FacebookPagePicker
            state={pickerState}
            onClose={() => setPickerState(null)}
            onDone={(n) => {
              setPickerState(null);
              refresh();
              showToast(`${n} Facebook page${n === 1 ? '' : 's'} connected`, 'success');
            }}
          />
        )}
      </PageBody>
    </AppShell>
  );
}

// ── ProviderSection ────────────────────────────────────────────────────
//
// Renders one provider's header (name + usage badge + connect button) and
// the list of connections beneath. Empty state shows a hint card.

function ProviderSection({
  spec,
  connections,
  used,
  limit,
  onConnect,
  onDisconnect,
  connectBusy,
}: {
  spec: ProviderSpec;
  connections: ChannelConnection[];
  used: number;
  limit: number;
  onConnect: () => void;
  onDisconnect: (c: ChannelConnection) => void;
  connectBusy?: boolean;
}) {
  const t = useT();
  const Logo = spec.Logo;
  const atLimit = used >= limit;
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', spec.bg, spec.fg)}>
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
        >
          {connectBusy ? '…' : `+ ${t('common.connect')}`}
        </Button>
      </div>

      {connections.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line2 bg-card p-6 text-center text-sm text-ink-faint">
          {t('common.notConnected')}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {connections.map((c) => (
            <ConnectionCard key={c.id} conn={c} onDisconnect={() => onDisconnect(c)} />
          ))}
        </div>
      )}
    </section>
  );
}

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
  // LINE customers will want to re-copy this from time to time when they
  // re-configure their channel. Surface it on the card so they don't have
  // to re-run the connect flow.
  const showWebhook = conn.provider === 'line' && !!conn.webhook_url;
  return (
    <div className="rounded-2xl border border-line2 bg-card p-4 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold text-ink">{conn.display_name || conn.external_id}</h3>
          <p className="mt-0.5 truncate text-[11px] text-ink-faint">{conn.external_id}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
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
      {showWebhook && (
        <div className="mt-3">
          <div className="mb-1 text-[11px] font-medium text-ink-faint">Webhook URL</div>
          <div className="flex items-stretch gap-2">
            <code className="flex-1 truncate rounded-md border border-line2 bg-page px-2 py-1.5 text-[11px] text-ink">
              {conn.webhook_url}
            </code>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard.writeText(conn.webhook_url).then(
                  () => showToast('Webhook URL copied', 'success'),
                  () => showToast('Copy failed', 'default'),
                )
              }
              className="rounded-md border border-line2 px-2 py-1 text-[11px] font-bold text-brand-600 hover:bg-brand-soft/40"
            >
              Copy
            </button>
          </div>
        </div>
      )}
      <div className="mt-3">
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
  // Live URL preview: the backend tells us the template, we substitute the
  // channel id the user is typing. Renders the same URL the connection will
  // get assigned when they save.
  const [template, setTemplate] = useState<string>('/webhooks/line/{channel_id}');

  useEffect(() => {
    api.channels
      .webhookUrlTemplate('line')
      .then((r) => setTemplate(r.template))
      .catch(() => {});
  }, []);

  const previewUrl = template.replace(
    '{channel_id}',
    channelId.trim() || 'YOUR_CHANNEL_ID',
  );

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

  function copy(text: string, label = 'URL') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`${label} copied`, 'success');
    });
  }

  return (
    <Card className="mt-6">
      <CardHeader
        icon={<MessageCircle className="h-4 w-4 text-line" />}
        title={t('channels.connect.line')}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />

      {/* Step 1 — get values from LINE */}
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
        <div className="ml-7 flex items-stretch gap-2">
          <code className="flex-1 truncate rounded-lg border border-line2 bg-page px-3 py-2 text-[12px] text-ink">
            {previewUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copy(previewUrl, 'Webhook URL')}
          >
            Copy
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ── Facebook page picker ───────────────────────────────────────────────
//
// Shown after the OAuth callback redirected the browser back here with
// ?fb_oauth=ok&state=.... Lists the user's manageable pages so they can
// choose which ones to connect (subject to plan limits).

function FacebookPagePicker({
  state,
  onClose,
  onDone,
}: {
  state: string;
  onClose: () => void;
  onDone: (count: number) => void;
}) {
  const t = useT();
  const [pages, setPages] = useState<{ id: string; name: string; category?: string }[] | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api.channels.facebook
      .oauthPages(state)
      .then((r) => {
        if (!cancelled) setPages(r.pages);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [state]);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
    <Card className="mt-6">
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
          No pages found on this Facebook account. Make sure you grant access to at least one page.
        </p>
      )}
      {pages && pages.length > 0 && (
        <ul className="space-y-2">
          {pages.map((p) => {
            const on = picked.has(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => toggle(p.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors',
                    on
                      ? 'border-brand-400 bg-brand-soft/50 dark:border-brand-500'
                      : 'border-line2 bg-card hover:bg-page',
                  )}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-ink">{p.name}</div>
                    <div className="truncate text-[11px] text-ink-faint">
                      {p.category ?? p.id}
                    </div>
                  </div>
                  <span
                    className={cn(
                      'h-5 w-5 shrink-0 rounded border-2',
                      on
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-line2',
                    )}
                  >
                    {on && (
                      <svg viewBox="0 0 16 16" className="h-full w-full" fill="none">
                        <path
                          d="M3 8.5l3.5 3L13 5"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={busy || picked.size === 0}>
          {busy ? '…' : `Connect ${picked.size || ''}`}
        </Button>
      </div>
    </Card>
  );
}
