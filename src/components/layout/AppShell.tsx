"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { ToastViewport } from "@/components/ui/Toast";
import { useAuth } from "@/store/auth";
import { useInboxBadge } from "@/store/inbox-badge";
import { cn } from "@/lib/cn";

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
  const { token, hydrated, hydrate } = useAuth();
  const { init: initBadge, teardown: teardownBadge } = useInboxBadge();

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

  return (
    <div className="flex h-screen overflow-hidden bg-page">
      <Sidebar />

      <main
        className={cn(
          "flex-1 pt-[57px] md:pt-0",
          withPadding ? "overflow-y-auto" : "flex min-h-0 flex-col overflow-hidden",
        )}
      >
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
