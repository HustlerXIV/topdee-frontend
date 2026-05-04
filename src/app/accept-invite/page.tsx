'use client';

import { Suspense, useState } from 'react';
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
 * ?token=... in the URL. They set a name + password and are dropped into
 * the workspace as a freshly-created member.
 */
function AcceptInviteInner() {
  const router = useRouter();
  const search = useSearchParams();
  const t = useT();
  const setSession = useAuth((s) => s.setSession);

  const token = search?.get('token') ?? '';

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setErr('Missing invite token');
      return;
    }
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
      setErr(e instanceof ApiError ? e.message : 'accept failed');
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
        <p className="mt-1 text-sm text-ink-muted">
          Set your name and a password to finish accepting the invite.
        </p>

        {!token && (
          <p className="mt-6 rounded-[10px] bg-yellow-100 p-4 text-sm text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200">
            This link is missing a token. Ask your inviter to send a fresh one.
          </p>
        )}

        {token && (
          <form onSubmit={onSubmit} className="mt-7 space-y-3">
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
