'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { useUI } from '@/store/ui';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Sparkles } from '@/components/ui/Icon';

export default function ForgotPasswordPage() {
  // showToast is still used for non-404 unexpected errors
  const showToast = useUI((s) => s.showToast);

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  // When the backend returns 404 we show an inline prompt to register instead
  const [notFound, setNotFound] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setNotFound(false);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // Show inline prompt — toast already fired from api.ts, but we also
        // flip the flag so the card shows a register nudge.
        setNotFound(true);
      }
      // All other errors: toast already shown by api.ts request()
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

        {sent ? (
          <>
            <h2 className="text-2xl font-extrabold text-ink">Check your inbox</h2>
            <p className="mt-3 text-sm text-ink-muted leading-relaxed">
              A reset link has been sent to{' '}
              <span className="font-semibold text-ink">{email}</span>. It expires in 1 hour.
            </p>
            <p className="mt-4 text-sm text-ink-muted">
              Didn't receive it? Check your spam folder, or{' '}
              <button
                className="font-semibold text-brand-600 hover:underline"
                onClick={() => setSent(false)}
              >
                try again
              </button>
              .
            </p>
            <div className="mt-6">
              <Link href="/login">
                <Button fullWidth variant="outline">Back to login</Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-extrabold text-ink">Forgot password?</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Enter your email and we'll send you a reset link.
            </p>

            <form onSubmit={onSubmit} className="mt-7 space-y-3">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setNotFound(false); }}
                autoFocus
              />
              <Button type="submit" fullWidth size="lg" disabled={busy}>
                {busy ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            {/* Shown when the backend says the email isn't registered */}
            {notFound && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300">
                No account found for <strong>{email}</strong>.{' '}
                <Link href="/login?tab=register" className="font-semibold underline underline-offset-2">
                  Register here →
                </Link>
              </div>
            )}

            <p className="mt-5 text-center text-[13px] text-ink-muted">
              Remember it?{' '}
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
