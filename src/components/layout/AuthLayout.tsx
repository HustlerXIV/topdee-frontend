'use client';

import { type ReactNode } from 'react';
import { CompactPreferences } from '@/components/PreferencesToggle';

/**
 * Centered card layout for landing/login/onboarding.
 * Auth gradient flips light/dark via the .bg-auth-gradient CSS rule.
 *
 * Hosts a small preference widget at the top-right so users can pick
 * language + theme even before they sign in.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-auth-gradient flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute right-4 top-4">
        <div className="rounded-xl bg-card/80 backdrop-blur">
          <CompactPreferences />
        </div>
      </div>
      {children}
    </div>
  );
}
