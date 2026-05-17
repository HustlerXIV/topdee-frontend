"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, API_URL } from "@/lib/api";
import { useAuth } from "@/store/auth";
import { useT } from "@/lib/i18n/useT";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { Sparkles, MessageCircle } from "@/components/ui/Icon";

type Tab = "login" | "register";

function LoginPageInner() {
  const router = useRouter();
  const search = useSearchParams();
  const setSession = useAuth((s) => s.setSession);
  const t = useT();

  const initialTab: Tab =
    search?.get("tab") === "register" ? "register" : "login";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await api.login(email, password);
      setSession(token, {
        name: user.name,
        email: user.email || email,
        workspace: "",
        role: user.role,
        isAdmin: user.isAdmin ?? user.is_platform_admin,
      });
      router.push("/inbox");
    } catch {
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { token, user } = await api.register(tenantName, email, password);
      setSession(token, {
        name: user.name,
        email: user.email || email,
        workspace: tenantName,
        role: user.role,
        isAdmin: user.isAdmin ?? user.is_platform_admin,
      });
      router.push("/onboarding");
    } catch {
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <div className="w-full max-w-md rounded-3xl bg-card p-10 shadow-brand-glow">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-soft text-brand-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-extrabold text-ink">
          {t("auth.welcome")}
        </h2>
        <p className="mt-1 text-sm text-ink-muted">{t("auth.tagline")}</p>

        {/* Tabs */}
        <div className="mt-7 flex gap-1 rounded-xl bg-muted p-1">
          {(["login", "register"] as Tab[]).map((tt) => (
            <button
              key={tt}
              onClick={() => setTab(tt)}
              className={cn(
                "flex-1 rounded-[9px] py-2.5 text-sm font-semibold transition-colors",
                tab === tt
                  ? "bg-card text-brand-600 shadow-sm"
                  : "text-ink-muted hover:text-ink",
              )}
            >
              {tt === "login" ? t("auth.tab.login") : t("auth.tab.register")}
            </button>
          ))}
        </div>

        {tab === "login" ? (
          <form onSubmit={onLogin} className="mt-7 space-y-3">
            <SocialButton
              onClick={() => {
                window.location.href = `${API_URL}/api/v1/auth/google/start`;
              }}
            >
              <img src="https://www.google.com/favicon.ico" width={18} alt="" />{" "}
              {t("auth.google")}
            </SocialButton>
            <Divider>{t("auth.dividerEmail")}</Divider>
            <Input
              type="email"
              required
              placeholder={t("common.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              placeholder={t("common.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-[13px] font-semibold text-brand-600 hover:underline"
              >
                {t("auth.forgot")}
              </Link>
            </div>
            <Button type="submit" fullWidth size="lg" disabled={busy}>
              {busy ? t("auth.signinBusy") : t("auth.signinBtn")}
            </Button>
            <p className="pt-2 text-center text-[13px] text-ink-muted">
              {t("auth.noAccount")}{" "}
              <a
                onClick={() => setTab("register")}
                className="cursor-pointer font-semibold text-brand-600"
              >
                {t("landing.signup")}
              </a>
            </p>
          </form>
        ) : (
          <form onSubmit={onRegister} className="mt-7 space-y-3">
            <SocialButton
              onClick={() => {
                window.location.href = `${API_URL}/api/v1/auth/google/start`;
              }}
            >
              <img src="https://www.google.com/favicon.ico" width={18} alt="" />{" "}
              {t("auth.googleSignup")}
            </SocialButton>
            <Divider>{t("auth.dividerForm")}</Divider>
            <Input
              type="text"
              required
              placeholder={t("auth.workspaceName")}
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
            />
            <Input
              type="email"
              required
              placeholder={t("common.email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              minLength={8}
              placeholder={t("auth.passwordHint")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {/* Privacy Policy checkbox — required before submitting */}
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-line2 bg-muted px-3 py-2.5">
              <input
                type="checkbox"
                required
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-indigo-600"
              />
              <span className="text-[13px] leading-snug text-ink-muted">
                {t('auth.privacyConsentPrefix')}{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  {t('auth.privacyPolicy')}
                </Link>
                {t('auth.privacyConsentSuffix') ? ` ${t('auth.privacyConsentSuffix')}` : ''}
              </span>
            </label>
            <Button type="submit" fullWidth size="lg" disabled={busy || !acceptedPrivacy}>
              {busy ? t("auth.signupBusy") : t("auth.signupBtn")}
            </Button>
            <p className="pt-1 text-center text-[13px] text-ink-muted">
              {t("auth.haveAccount")}{" "}
              <a
                onClick={() => setTab("login")}
                className="cursor-pointer font-semibold text-brand-600"
              >
                {t("auth.tab.login")}
              </a>
            </p>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout>
          <div />
        </AuthLayout>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}

function SocialButton({
  children,
  tone = "neutral",
  onClick,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "line";
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-2.5 rounded-[10px] border px-4 py-3 text-sm font-semibold transition-colors",
        tone === "line"
          ? "border-line bg-line text-white hover:bg-line/90"
          : "border-line2 bg-card text-ink hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2 flex items-center gap-3 text-[13px] text-ink-faint">
      <span className="h-px flex-1 bg-line2" />
      {children}
      <span className="h-px flex-1 bg-line2" />
    </div>
  );
}
