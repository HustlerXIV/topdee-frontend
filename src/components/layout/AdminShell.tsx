'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { ToastViewport } from '@/components/ui/Toast';
import { CompactPreferences } from '@/components/PreferencesToggle';
import { UserMenu } from './UserMenu';
import {
  Shield,
  BarChart3,
  Building2,
  Users,
  ArrowLeft,
} from '@/components/ui/Icon';
import { cn } from '@/lib/cn';

/**
 * Layout for the platform-admin section. Distinct shell from AppShell so
 * staff can tell at a glance they're in the admin area, not in a tenant
 * dashboard.
 *
 * Auth guard: kicks non-admins back to /inbox. Hydration-aware so the
 * redirect doesn't flash before the JWT has loaded from localStorage.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { token, user, hydrated, hydrate } = useAuth();

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) router.replace('/login');
    else if (!user?.isAdmin) router.replace('/inbox');
  }, [hydrated, token, user, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
      <ToastViewport />
    </div>
  );
}

const NAV = [
  { href: '/admin', icon: BarChart3, label: 'Overview', exact: true },
  { href: '/admin/tenants', icon: Building2, label: 'Tenants' },
  { href: '/admin/users', icon: Users, label: 'Users' },
];

function AdminSidebar() {
  const pathname = usePathname() ?? '';
  return (
    <aside className="hidden h-screen w-[220px] flex-col border-r border-line2 bg-card md:flex">
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        <div className="flex items-center gap-2 px-3 pb-4 pt-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-300">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-base font-extrabold tracking-tight text-red-600 dark:text-red-400">
            Admin
          </span>
        </div>

        {NAV.map((it) => {
          const Icon = it.icon;
          const active = it.exact
            ? pathname === it.href
            : pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-red-50 font-semibold text-red-600 dark:bg-red-950/30 dark:text-red-300'
                  : 'text-ink-muted hover:bg-muted hover:text-ink',
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {it.label}
            </Link>
          );
        })}

        <div className="my-2 h-px bg-line2" />

        <Link
          href="/inbox"
          className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
          Back to workspace
        </Link>
      </div>

      <UserMenu />
      <div className="border-t border-line2">
        <CompactPreferences />
      </div>
    </aside>
  );
}

export function AdminPageHeader({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-6 md:px-8">
      <div>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-ink">
          {icon && <span className="text-red-600 dark:text-red-400">{icon}</span>}
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}

export function AdminPageBody({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-24 pt-6 md:px-8">{children}</div>;
}
