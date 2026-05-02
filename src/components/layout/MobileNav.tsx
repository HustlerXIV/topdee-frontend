'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n/useT';
import { type DictKey } from '@/lib/i18n/dictionary';
import { Icon, type IconName } from '@/components/ui/Icon';

const items: { href: string; icon: IconName; labelKey: DictKey }[] = [
  { href: '/inbox', icon: 'inbox', labelKey: 'nav.inbox' },
  { href: '/bot', icon: 'bot', labelKey: 'nav.bot' },
  { href: '/analytics', icon: 'analytics', labelKey: 'nav.analytics' },
  { href: '/channels', icon: 'channels', labelKey: 'nav.channels' },
  { href: '/settings', icon: 'settings', labelKey: 'nav.settings' },
];

export function MobileNav() {
  const pathname = usePathname() ?? '';
  const t = useT();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-line2 bg-card pb-[env(safe-area-inset-bottom,6px)] pt-1.5 md:hidden">
      {items.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + '/');
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 px-1 py-1.5 text-[10px] font-medium',
              active ? 'text-brand-600' : 'text-ink-faint',
            )}
          >
            <Icon name={it.icon} className="h-5 w-5" />
            {t(it.labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
