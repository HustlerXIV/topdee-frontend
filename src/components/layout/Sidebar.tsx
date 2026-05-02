'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/useT';
import { type DictKey } from '@/lib/i18n/dictionary';
import { CompactPreferences } from '@/components/PreferencesToggle';
import { UserMenu } from './UserMenu';
import { Icon, type IconName, Shield } from '@/components/ui/Icon';
import { useAuth } from '@/store/auth';

type Item = {
  href: string;
  icon: IconName;
  labelKey: DictKey;
  badge?: string;
};

const primary: Item[] = [
  { href: '/inbox', icon: 'inbox', labelKey: 'nav.inbox', badge: '12' },
  { href: '/bot', icon: 'bot', labelKey: 'nav.bot' },
  { href: '/knowledge', icon: 'knowledge', labelKey: 'nav.knowledge' },
  { href: '/analytics', icon: 'analytics', labelKey: 'nav.analytics' },
  { href: '/channels', icon: 'channels', labelKey: 'nav.channels' },
];

const secondary: Item[] = [
  { href: '/team', icon: 'team', labelKey: 'nav.team' },
  { href: '/billing', icon: 'billing', labelKey: 'nav.billing' },
  { href: '/settings', icon: 'settings', labelKey: 'nav.settings' },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const t = useT();
  const isAdmin = useAuth((s) => s.user?.isAdmin);

  return (
    <aside className="hidden h-screen w-[220px] flex-col border-r border-line2 bg-card md:flex">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Link
          href="/inbox"
          className="px-3 pb-4 pt-2 text-base font-extrabold tracking-tight text-brand-600"
        >
          TopDee
        </Link>

        {primary.map((it) => (
          <SidebarItem
            key={it.href}
            item={it}
            label={t(it.labelKey)}
            active={isActive(pathname, it.href)}
          />
        ))}

        <div className="my-2 h-px bg-line2" />

        {secondary.map((it) => (
          <SidebarItem
            key={it.href}
            item={it}
            label={t(it.labelKey)}
            active={isActive(pathname, it.href)}
          />
        ))}

        {/* Admin-only shortcut into the platform-admin shell. */}
        {isAdmin && (
          <Link
            href="/admin"
            className="mt-2 flex items-center gap-3 rounded-[10px] border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
          >
            <Shield className="h-[18px] w-[18px]" />
            Platform Admin
          </Link>
        )}
      </div>

      {/* Footer: user pill (with logout) + preferences toggle */}
      <UserMenu />
      <div className="border-t border-line2">
        <CompactPreferences />
      </div>
    </aside>
  );
}

function SidebarItem({
  item,
  label,
  active,
}: {
  item: Item;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-soft font-semibold text-brand-600'
          : 'text-ink-muted hover:bg-muted hover:text-ink',
      )}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
      <span>{label}</span>
      {item.badge && (
        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === '/inbox' && pathname === '/inbox') return true;
  return pathname === href || pathname.startsWith(href + '/');
}
