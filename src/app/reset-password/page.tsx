'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useUI } from '@/store/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles } from '@/components/ui/Icon';

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const showToast = useUI((s) => s.showToast);

  const token = params?.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Show a clear error if someone lands here without a token.
  if (!token) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow text-center">
          <h2 className="text-2xl font-extrabold text-ink">Invalid link</h2>
          <p className="mt-3 text-sm text-ink-muted">
            This password-reset link is missing its token. Please request a new one.
          </p>
          <div className="mt-6">
            <Link href="/forgot-password">
              <Button fullWidth>Request new link</Button>
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      showToast('Passwords do not match.', 'default');
      return;
    }
    if (password.length < 8) {
      showToast('Password must be at least 8 characters.', 'default');
      return;
    }
    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
      showToast('Password updated — please log in.', 'default');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : 'Something went wrong — please request a new link.',
        'default',
      );
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

        {done ? (
          <>
            <h2 className="text-2xl font-extrabold text-ink">Password updated!</h2>
            <p className="mt-3 text-sm text-ink-muted">
              Your password has been changed. Redirecting you to login…
            </p>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-ink">Set new password</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Choose a strong password with at least 8 characters.
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-3">
              <Input
                type="password"
                required
                minLength={8}
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              <Input
                type="password"
                required
                minLength={8}
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
              <Button type="submit" fullWidth size="lg" disabled={busy}>
                {busy ? 'Saving…' : 'Reset password'}
              </Button>
            </form>

            <p className="mt-5 text-center text-[13px] text-ink-muted">
              <Link href="/login" className="font-semibold text-brand-600 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLayout><div /></AuthLayout>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
