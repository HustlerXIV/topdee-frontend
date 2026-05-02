'use client';

import { useEffect, type ReactNode } from 'react';
import { usePreferences } from '@/store/preferences';

/**
 * Mounts at the root layout. Runs hydrate() on first client paint so the
 * locale/theme state matches localStorage before the rest of the tree
 * subscribes.
 *
 * Use it together with <ThemeBootScript /> in <head> to avoid a white-flash
 * for users who picked dark mode previously.
 */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const hydrate = usePreferences((s) => s.hydrate);
  const hydrated = usePreferences((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  return <>{children}</>;
}

/**
 * Small inline script that runs before React hydration to apply the saved
 * theme class. Without this, dark-mode users see a flash of light theme
 * for a few hundred ms while React loads.
 *
 * Render inside <head> via dangerouslySetInnerHTML.
 */
export const themeBootScript = `(function(){try{var t=localStorage.getItem('topdee_theme');var d=t==='dark'||(!t&&window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(_){}})();`;
