'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/useT';
import { type DictKey } from '@/lib/i18n/dictionary';
import { CompactPreferences } from '@/components/PreferencesToggle';
import { UserMenu } from './UserMenu';
import { Icon, type IconName, Shield } from '@/components/ui/Icon';
import { useAuth, type Role } from '@/store/auth';
import { useInboxBadge } from '@/store/inbox-badge';

type Item = {
  href: string;
  icon: IconName;
  labelKey: DictKey;
  /** Roles that can see this item. Omit to show to everyone. */
  roles?: Role[];
};

const primary: Item[] = [
  { href: '/inbox',     icon: 'inbox',     labelKey: 'nav.inbox' },
  { href: '/bot',       icon: 'bot',       labelKey: 'nav.bot' },
  { href: '/knowledge', icon: 'knowledge', labelKey: 'nav.knowledge' },
  { href: '/analytics', icon: 'analytics', labelKey: 'nav.analytics' },
  { href: '/channels',  icon: 'channels',  labelKey: 'nav.channels', roles: ['owner', 'admin'] },
];

const secondary: Item[] = [
  { href: '/team',     icon: 'team',     labelKey: 'nav.team',    roles: ['owner', 'admin'] },
  { href: '/billing',  icon: 'billing',  labelKey: 'nav.billing', roles: ['owner'] },
  { href: '/referral', icon: 'referral', labelKey: 'nav.referral', roles: ['owner'] },
  { href: '/settings', icon: 'settings', labelKey: 'nav.settings' },
];

export function Sidebar() {
  const pathname = usePathname() ?? '';
  const t = useT();
  const { isAdmin, role } = useAuth((s) => ({ isAdmin: s.user?.isAdmin, role: s.user?.role ?? '' }));
  const unreadCount = useInboxBadge((s) => s.count);

  const canSee = (item: Item) =>
    !item.roles || item.roles.includes(role as Role);

  return (
    <aside className="hidden h-screen w-[220px] flex-col border-r border-line2 bg-card md:flex">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <Link href="/inbox" className="flex items-center px-3 pb-4 pt-2">
          <Image
            src="/topdee-light.png"
            alt="TopDee"
            width={2451}
            height={730}
            style={{ height: "36px", width: "auto" }}
            className="block dark:hidden"
            priority
            unoptimized
          />
          <Image
            src="/topdee-dark.png"
            alt="TopDee"
            width={2451}
            height={730}
            style={{ height: "36px", width: "auto" }}
            className="hidden dark:block"
            priority
            unoptimized
          />
        </Link>

        {primary.filter(canSee).map((it) => (
          <SidebarItem
            key={it.href}
            item={it}
            label={t(it.labelKey)}
            active={isActive(pathname, it.href)}
            badge={it.href === '/inbox' && unreadCount > 0 ? String(unreadCount) : undefined}
          />
        ))}

        <div className="my-2 h-px bg-line2" />

        {secondary.filter(canSee).map((it) => (
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
  badge,
}: {
  item: Item;
  label: string;
  active: boolean;
  badge?: string;
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
      {badge && (
        <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold text-white">
          {Number(badge) > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function isActive(pathname: string, href: string) {
  if (href === '/inbox' && pathname === '/inbox') return true;
  return pathname === href || pathname.startsWith(href + '/');
}
