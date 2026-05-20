"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ToastViewport } from "@/components/ui/Toast";
import { useAuth, type Role } from "@/store/auth";
import { useInboxBadge } from "@/store/inbox-badge";
import { cn } from "@/lib/cn";
import { api } from "@/lib/api";

/**
 * Role guard hook — redirects to /inbox when the current user's role is not
 * in `allowedRoles`. Call this at the top of any page that should be
 * restricted (e.g. channels, billing, team).
 */
export function useRoleGuard(allowedRoles: Role[]) {
  const router = useRouter();
  const { user, hydrated } = useAuth();
  useEffect(() => {
    if (!hydrated) return;
    const role = user?.role ?? '';
    if (role && !allowedRoles.includes(role)) {
      router.replace('/inbox');
    }
  }, [hydrated, user, router, allowedRoles]);
}

/**
 * Wraps the dashboard pages: sidebar (desktop) + main content + bottom nav (mobile).
 * Also handles the auth guard — redirects to /login when there's no token.
 */
export function AppShell({
  children,
  withPadding = true,
}: {
  children: ReactNode;
  withPadding?: boolean;
}) {
  const router = useRouter();
  const { token, user, hydrated, hydrate } = useAuth();
  const { init: initBadge, teardown: teardownBadge } = useInboxBadge();
  const [subscriptionLapsed, setSubscriptionLapsed] = useState(false);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (hydrated && !token) {
      teardownBadge();
      router.replace("/login");
    }
  }, [hydrated, token, router, teardownBadge]);

  // Connect WebSocket and fetch initial unread count once we have a token.
  useEffect(() => {
    if (token) initBadge(token);
  }, [token, initBadge]);

  // Check subscription status once for owner — drives the expiry banner.
  // Only owners can act on this (renew/upgrade), so no need to show it to
  // agents/viewers. Errors are silently swallowed — never break the shell.
  useEffect(() => {
    if (!token || user?.role !== "owner") return;
    api.billing.info().then((info) => {
      const s = info.subscription?.status;
      if (s === "past_due" || s === "canceled" || s === "paused") {
        setSubscriptionLapsed(true);
      }
    }).catch(() => {});
  }, [token, user?.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <Sidebar />

      <main
        className={cn(
          "flex-1 pt-mobile-nav md:pt-0",
          withPadding ? "overflow-y-auto" : "flex min-h-0 flex-col overflow-hidden",
        )}
      >
        {/* Subscription expiry banner — shown only to owners */}
        {subscriptionLapsed && (
          <div className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-800 dark:bg-amber-950/50">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>แพ็กเกจของคุณหมดอายุแล้ว</strong>
              {" — "}AI จะไม่ตอบกลับลูกค้าจนกว่าจะต่ออายุ ทีมงานยังสามารถตอบผ่าน Inbox ได้ตามปกติ
            </p>
            <a
              href="/billing"
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              ต่ออายุ
            </a>
          </div>
        )}
        {children}
      </main>

      <MobileNav />
      <ToastViewport />
    </div>
  );
}

export function PageHeader({
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
          {icon && <span className="text-brand-600">{icon}</span>}
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

export function PageBody({ children }: { children: ReactNode }) {
  return <div className="px-6 pb-8 pt-6 md:px-8">{children}</div>;
}
