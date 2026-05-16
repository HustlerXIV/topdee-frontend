'use client';

// Handles the browser redirect from the backend after Google OAuth completes.
//
// The backend redirects to:
//   /auth/google/callback?token=JWT[&new=true]   — success
//   /auth/google/callback?error=reason            — failure
//
// This page reads those params, saves the session, and sends the user to the
// right place (onboarding for new accounts, inbox for returning ones).

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useAuth } from '@/store/auth';
import { fetchMe, ApiError } from '@/lib/api';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Sparkles } from '@/components/ui/Icon';

function GoogleCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setSession = useAuth((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = params?.get('token');
    const isNew = params?.get('new') === 'true';
    const err = params?.get('error');

    if (err) {
      const messages: Record<string, string> = {
        state_mismatch: 'Security check failed. Please try again.',
        missing_code: 'Google did not return an authorisation code.',
        no_email: 'Your Google account does not have a verified email.',
        access_denied: 'You cancelled the Google sign-in.',
      };
      setError(messages[err] ?? `Sign-in failed: ${err}`);
      return;
    }

    if (!token) {
      setError('No token received. Please try again.');
      return;
    }

    // Fetch the user profile using the token so we can populate the auth store.
    fetchMe(token)
      .then((user) => {
        setSession(token, {
          name: user.name ?? '',
          email: user.email ?? '',
          workspace: '',
          role: user.role ?? 'owner',
          isAdmin: user.is_platform_admin ?? false,
        });
        router.replace(isNew ? '/onboarding' : '/inbox');
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e.message : 'Failed to load profile.');
      });
  }, [params, setSession, router]);

  if (error) {
    return (
      <AuthLayout>
        <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow text-center">
          <div className="mb-4 text-4xl">😕</div>
          <h2 className="text-xl font-bold text-ink mb-2">Sign-in failed</h2>
          <p className="text-sm text-ink-muted mb-6">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
          >
            Back to login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow text-center">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-soft text-brand-600 animate-pulse">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-ink mb-1">Signing you in…</h2>
        <p className="text-sm text-ink-muted">Just a moment</p>
      </div>
    </AuthLayout>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <AuthLayout>
        <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow" />
      </AuthLayout>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}
