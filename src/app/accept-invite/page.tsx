'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useT } from '@/lib/i18n/useT';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input, FormGroup } from '@/components/ui/Input';
import { Sparkles } from '@/components/ui/Icon';

/**
 * Public accept-invite page — recipient lands here from the invite link with
 * ?token=... in the URL. We first fetch invite metadata (invited email +
 * workspace name) so the user knows exactly which invite they're accepting,
 * then let them set a name + password to finish joining.
 */
function AcceptInviteInner() {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const setSession = useAuth((s) => s.setSession);

  const token = search?.get('token') ?? '';

  // Invite metadata fetched from the server
  const [info, setInfo] = useState<{
    email: string;
    workspace_name: string;
    inviter_email: string;
    expires_at: string;
  } | null>(null);
  const [infoErr, setInfoErr] = useState<string | null>(null);
  const [infoLoading, setInfoLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch invite info as soon as we have a token
  useEffect(() => {
    if (!token) {
      setInfoLoading(false);
      return;
    }
    api.inviteInfo(token)
      .then(setInfo)
      .catch((e) => setInfoErr(e instanceof ApiError ? e.message : 'Invalid or expired invite link'))
      .finally(() => setInfoLoading(false));
  }, [token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await api.acceptInvite({ token, name, password });
      setSession(res.token, {
        name: res.user.name,
        email: res.user.email,
        workspace: '',
        role: res.user.role,
        isAdmin: res.user.is_platform_admin,
      });
      router.replace('/inbox');
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Accept failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-extrabold text-ink">Join the workspace</h2>

        {/* ── No token ── */}
        {!token && (
          <p className="mt-6 rounded-[10px] bg-yellow-100 p-4 text-sm text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
            This link is missing a token. Ask your inviter to send a fresh one.
          </p>
        )}

        {/* ── Loading ── */}
        {token && infoLoading && (
          <p className="mt-6 text-sm text-ink-faint">Verifying invite…</p>
        )}

        {/* ── Invalid / expired ── */}
        {token && !infoLoading && infoErr && (
          <p className="mt-6 rounded-[10px] bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {infoErr}
          </p>
        )}

        {/* ── Valid invite ── */}
        {token && !infoLoading && info && (
          <>
            {/* Invite summary — makes it crystal-clear who this invite is for */}
            <div className="mt-5 rounded-xl border border-line2 bg-muted px-4 py-3 text-sm space-y-1">
              <p className="text-ink-faint">Invited email</p>
              <p className="font-semibold text-ink">{info.email}</p>
              <p className="mt-1 text-ink-faint">Workspace</p>
              <p className="font-semibold text-ink">{info.workspace_name}</p>
              {info.inviter_email && (
                <>
                  <p className="mt-1 text-ink-faint">Invited by</p>
                  <p className="font-semibold text-ink">{info.inviter_email}</p>
                </>
              )}
              <p className="pt-1 text-xs text-ink-faint">Expires {info.expires_at}</p>
            </div>

            <p className="mt-5 text-sm text-ink-muted">
              Set a display name and password to finish joining.
            </p>

            <form onSubmit={onSubmit} className="mt-4 space-y-3">
              <FormGroup label={t('common.name')}>
                <Input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Somying Suksai"
                />
              </FormGroup>
              <FormGroup label={t('auth.passwordHint')}>
                <Input
                  required
                  minLength={8}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </FormGroup>
              {err && <p className="text-sm text-red-500">{err}</p>}
              <Button type="submit" fullWidth size="lg" disabled={busy}>
                {busy ? '…' : 'Join workspace →'}
              </Button>
            </form>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AuthLayout><div /></AuthLayout>}>
      <AcceptInviteInner />
    </Suspense>
  );
}
