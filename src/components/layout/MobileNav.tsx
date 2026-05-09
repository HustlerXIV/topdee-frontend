'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/useT';
import { type DictKey } from '@/lib/i18n/dictionary';
import { Icon, type IconName, Shield, Menu, X } from '@/components/ui/Icon';
import { UserMenu } from './UserMenu';
import { CompactPreferences } from '@/components/PreferencesToggle';
import { useAuth } from '@/store/auth';

const primary: { href: string; icon: IconName; labelKey: DictKey; badge?: string }[] = [
  { href: '/inbox', icon: 'inbox', labelKey: 'nav.inbox', badge: '12' },
  { href: '/bot', icon: 'bot', labelKey: 'nav.bot' },
  { href: '/knowledge', icon: 'knowledge', labelKey: 'nav.knowledge' },
  { href: '/analytics', icon: 'analytics', labelKey: 'nav.analytics' },
  { href: '/channels', icon: 'channels', labelKey: 'nav.channels' },
];

const secondary: { href: string; icon: IconName; labelKey: DictKey }[] = [
  { href: '/team', icon: 'team', labelKey: 'nav.team' },
  { href: '/billing', icon: 'billing', labelKey: 'nav.billing' },
  { href: '/settings', icon: 'settings', labelKey: 'nav.settings' },
];

function isActive(pathname: string, href: string) {
  if (href === '/inbox' && pathname === '/inbox') return true;
  return pathname === href || pathname.startsWith(href + '/');
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? '';
  const t = useT();
  const isAdmin = useAuth((s) => s.user?.isAdmin);

  // Lock body scroll while menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Fixed top bar (mobile only) ───────────────────────────── */}
      <div
        className="fixed inset-x-0 top-0 z-30 flex items-center justify-between border-b border-line2 bg-card px-4 md:hidden"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', paddingBottom: '12px' }}
      >
        <Link href="/inbox" className="text-base font-extrabold tracking-tight text-brand-600">
          TopDee
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-muted hover:text-ink"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* ── Full-screen overlay menu ───────────────────────────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-card md:hidden">
          {/* Header */}
          <div
            className="flex shrink-0 items-center justify-between border-b border-line2 px-4"
            style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)', paddingBottom: '12px' }}
          >
            <Link
              href="/inbox"
              onClick={() => setOpen(false)}
              className="text-base font-extrabold tracking-tight text-brand-600"
            >
              TopDee
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-muted hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav items */}
          <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {primary.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(pathname, it.href)
                    ? 'bg-brand-soft font-semibold text-brand-600'
                    : 'text-ink-muted hover:bg-muted hover:text-ink',
                )}
              >
                <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
                <span>{t(it.labelKey)}</span>
                {it.badge && (
                  <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
                    {it.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="my-2 h-px bg-line2" />

            {secondary.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive(pathname, it.href)
                    ? 'bg-brand-soft font-semibold text-brand-600'
                    : 'text-ink-muted hover:bg-muted hover:text-ink',
                )}
              >
                <Icon name={it.icon} className="h-[18px] w-[18px] shrink-0" />
                <span>{t(it.labelKey)}</span>
              </Link>
            ))}

            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
              >
                <Shield className="h-[18px] w-[18px]" />
                Platform Admin
              </Link>
            )}
          </div>

          {/* Footer: user pill + preferences (mirrors desktop sidebar) */}
          <UserMenu />
          <div className="border-t border-line2">
            <CompactPreferences />
          </div>
        </div>
      )}
    </>
  );
}
