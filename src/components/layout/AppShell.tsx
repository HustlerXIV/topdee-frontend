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
import { useT } from "@/lib/i18n/useT";

/**
 * Role guard hook — redirects to /inbox when the current user's role is not
 * in `allowedRoles`. Call this at the top of any page that should be
 * restricted (e.g. channels, billing, team).
 *
 * An empty/unknown role is treated as NOT allowed (redirect) once we have a
 * hydrated session with a real user/token — a legit token missing its role
 * claim still shouldn't silently pass a role-gated page (the backend
 * re-checks anyway). We never redirect before hydration or when there's no
 * session (AppShell handles the /login bounce). /inbox itself is unguarded,
 * so redirecting there is always safe.
 */
export function useRoleGuard(allowedRoles: Role[]) {
  const router = useRouter();
  const { user, token, hydrated } = useAuth();
  // Depend on a stable string, not the array literal, to avoid effect churn
  // from a fresh `allowedRoles` array being passed on every render.
  const allowedKey = allowedRoles.join(',');
  useEffect(() => {
    if (!hydrated) return;
    if (!token || !user) return; // no session yet — not our job to redirect
    const role = user.role ?? '';
    if (!allowedRoles.includes(role)) {
      router.replace('/inbox');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, token, user, router, allowedKey]);
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
  const t = useT();
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
              <strong>{t("banner.lapsed.title")}</strong>
              {t("banner.lapsed.detail")}
            </p>
            <a
              href="/billing"
              className="shrink-0 rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              {t("banner.lapsed.renew")}
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
