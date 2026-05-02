'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/cn';
import { LogOut } from '@/components/ui/Icon';

/**
 * Compact user pill for the sidebar footer.
 *
 *   [avatar]  email           [logout]
 *             role badge
 *
 * Single click on the door icon signs the user out, clears the JWT from
 * localStorage, and bounces them to /login.
 */
export function UserMenu({ className }: { className?: string }) {
  const router = useRouter();
  const t = useT();
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);

  if (!user) return null;

  const display = user.email || '—';
  const initial = display.slice(0, 1).toUpperCase();

  function onLogout() {
    logout();
    router.replace('/login');
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2.5 border-t border-line2 px-3 py-2.5',
        className,
      )}
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-bold text-brand-600">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold text-ink" title={display}>
          {display}
        </div>
        {user.role && (
          <div className="text-[11px] uppercase tracking-wider text-ink-faint">
            {user.role}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onLogout}
        title={t('settings.logout.btn')}
        aria-label={t('settings.logout.btn')}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-line2 bg-card text-ink-muted transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:hover:border-red-900/40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
