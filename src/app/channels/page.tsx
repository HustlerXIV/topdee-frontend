'use client';

import { useEffect, useState } from 'react';
import { AppShell, PageBody, PageHeader } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { FormGroup, FormRow, Input } from '@/components/ui/Input';
import { api, ApiError, type ChannelStatus } from '@/lib/api';
import { useUI } from '@/store/ui';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/cn';
import {
  Plug,
  Plus,
  MessageCircle,
  Facebook,
  Instagram,
  Globe,
  X as XIcon,
  type IconName,
} from '@/components/ui/Icon';
import { Icon } from '@/components/ui/Icon';

type CardSpec = {
  id: 'line' | 'fb' | 'ig' | 'web';
  name: string;
  Logo: typeof MessageCircle;
  bg: string;
  fg: string;
  stat1?: { value: string; label: string };
  stat2?: { value: string; label: string };
};

function buildCards(t: (k: any) => string): CardSpec[] {
  return [
    { id: 'line', name: 'LINE Official Account', Logo: MessageCircle, bg: 'bg-line-soft dark:bg-emerald-900/40', fg: 'text-line dark:text-emerald-300', stat1: { value: '2,231', label: t('channels.stats.month') }, stat2: { value: '1.8k', label: t('channels.stats.followers') } },
    { id: 'fb', name: 'Facebook Messenger', Logo: Facebook, bg: 'bg-fb-soft dark:bg-sky-900/40', fg: 'text-fb dark:text-sky-300', stat1: { value: '847', label: t('channels.stats.month') }, stat2: { value: '5.2k', label: t('channels.stats.likes') } },
    { id: 'ig', name: 'Instagram DM', Logo: Instagram, bg: 'bg-ig-soft dark:bg-pink-900/40', fg: 'text-ig dark:text-pink-300', stat1: { value: '462', label: t('channels.stats.month') }, stat2: { value: '3.1k', label: t('channels.stats.followers') } },
    { id: 'web', name: 'Webchat Widget', Logo: Globe, bg: 'bg-web-soft dark:bg-brand-soft', fg: 'text-web dark:text-brand-200' },
  ];
}

export default function ChannelsPage() {
  const t = useT();
  const CARDS = buildCards(t);
  const showToast = useUI((s) => s.showToast);
  const [status, setStatus] = useState<ChannelStatus | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [openConnect, setOpenConnect] = useState<'fb' | 'line' | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setStatus(await api.channels.get());
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 401)) {
        setErr(e instanceof Error ? e.message : 'failed');
      }
    }
  }

  function isConnected(id: CardSpec['id']) {
    if (id === 'fb') return !!status?.facebook?.connected;
    if (id === 'line') return !!status?.line?.connected;
    return false; // ig + web not yet supported by backend
  }

  return (
    <AppShell>
      <PageHeader
        icon={<Plug className="h-7 w-7" />}
        title={t('channels.title').replace('📡 ', '')}
        description={t('channels.sub')}
      />
      <PageBody>
        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((c) => {
            const connected = isConnected(c.id);
            const Logo = c.Logo;
            return (
              <article
                key={c.id}
                className={cn(
                  'rounded-2xl border bg-card p-6 transition-shadow hover:shadow-card-hover',
                  connected ? 'border-emerald-200 dark:border-emerald-700/40' : 'border-line2',
                )}
              >
                <div
                  className={cn(
                    'mb-4 flex h-12 w-12 items-center justify-center rounded-xl',
                    c.bg,
                    c.fg,
                  )}
                >
                  <Logo className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-ink">{c.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-[13px] font-semibold">
                  {connected ? (
                    <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">{t('common.connected')}</span>
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 rounded-full bg-ink-faint" />
                      <span className="text-ink-faint">{t('common.notConnected')}</span>
                    </>
                  )}
                </div>

                {connected && c.stat1 && (
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <Stat value={c.stat1.value} label={c.stat1.label} />
                    {c.stat2 && <Stat value={c.stat2.value} label={c.stat2.label} />}
                  </div>
                )}
                {!connected && c.id === 'web' && (
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-faint">
                    {t('channels.web.desc')}
                  </p>
                )}

                <div className="mt-4 flex gap-2">
                  {connected ? (
                    <>
                      <Button variant="outline" fullWidth size="sm">
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="danger"
                        fullWidth
                        size="sm"
                        onClick={async () => {
                          if (!confirm('Disconnect?')) return;
                          if (c.id === 'fb') await api.channels.disconnectFacebook();
                          if (c.id === 'line') await api.channels.disconnectLine();
                          await refresh();
                          showToast(t('common.disconnect'), 'success');
                        }}
                      >
                        {t('common.disconnect')}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="primary"
                      fullWidth
                      size="sm"
                      onClick={() => {
                        if (c.id === 'fb' || c.id === 'line') setOpenConnect(c.id);
                        else showToast('Coming soon', 'default');
                      }}
                    >
                      + {t('common.connect')}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}

          {/* Add new channel card */}
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-brand-300 bg-brand-soft/40 p-6 text-center transition-colors hover:bg-brand-soft/60">
            <Plus className="h-8 w-8 text-brand-600" />
            <div className="mt-3 font-bold text-brand-600">{t('channels.add.title')}</div>
            <div className="mt-1 text-[13px] text-ink-faint">{t('channels.add.desc')}</div>
          </div>
        </div>

        {openConnect === 'fb' && (
          <ConnectFacebook
            onClose={() => setOpenConnect(null)}
            onDone={() => {
              setOpenConnect(null);
              refresh();
              showToast('เชื่อมต่อ Facebook สำเร็จ', 'success');
            }}
          />
        )}
        {openConnect === 'line' && (
          <ConnectLine
            onClose={() => setOpenConnect(null)}
            onDone={() => {
              setOpenConnect(null);
              refresh();
              showToast('เชื่อมต่อ LINE สำเร็จ', 'success');
            }}
          />
        )}
      </PageBody>
    </AppShell>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg bg-page p-2.5 text-center">
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-[11px] text-ink-faint">{label}</div>
    </div>
  );
}

function ConnectFacebook({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [pageId, setPageId] = useState('');
  const [pageName, setPageName] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.channels.connectFacebook({
        page_id: pageId,
        page_name: pageName,
        page_access_token: token,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'connect failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader
        icon={<Facebook className="h-4 w-4 text-fb" />}
        title={t('channels.connect.fb')}
        action={
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <XIcon className="h-4 w-4" />
          </Button>
        }
      />
      <p className="mb-4 text-[13px] text-ink-muted">
        Meta developer console → Messenger → Settings → Generate token, then paste Page ID + Access Token below.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <FormRow>
          <FormGroup label="Page ID">
            <Input required value={pageId} onChange={(e) => setPageId(e.target.value)} />
          </FormGroup>
          <FormGroup label={`Page name (${t('common.optional')})`}>
            <Input value={pageName} onChange={(e) => setPageName(e.target.value)} />
          </FormGroup>
        </FormRow>
        <FormGroup label="Page access token">
          <Input
            required
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
        </FormGroup>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? '…' : t('common.connect')}
        </Button>
      </form>
    </Card>
  );
}

function ConnectLine({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
  const [channelId, setChannelId] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.channels.connectLine({
        channel_id: channelId,
        channel_secret: secret,
        channel_access_token: token,
      });
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'connect failed');
    } finally {
      setBusy(false);
    }
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
      <p className="mb-4 text-[13px] text-ink-muted">
        LINE developer console → Messaging API → copy Channel ID, Secret, and Access Token here.
      </p>
      <form onSubmit={submit} className="space-y-4">
        <FormGroup label="Channel ID">
          <Input required value={channelId} onChange={(e) => setChannelId(e.target.value)} />
        </FormGroup>
        <FormRow>
          <FormGroup label="Channel secret">
            <Input
              required
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Channel access token">
            <Input
              required
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </FormGroup>
        </FormRow>
        {err && <p className="text-sm text-red-500">{err}</p>}
        <Button type="submit" disabled={busy}>
          {busy ? '…' : t('common.connect')}
        </Button>
      </form>
    </Card>
  );
}
