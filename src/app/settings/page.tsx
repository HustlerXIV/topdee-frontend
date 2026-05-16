"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell, PageBody, PageHeader } from "@/components/layout/AppShell";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormGroup, FormRow, Input, Select } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { PreferencesPanel } from "@/components/PreferencesToggle";
import { BusinessHoursCard } from "@/components/BusinessHoursCard";
import {
  Settings as SettingsIcon,
  Building2,
  ShoppingBag,
  Save,
  Palette,
  User,
  Lock,
  LogOut,
  Bell,
  Key,
  Eye,
  Copy,
  Plus,
  Trash2,
  Upload,
} from "@/components/ui/Icon";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/i18n/useT";
import { type DictKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";
import { api, ApiError } from "@/lib/api";

type Tab = "workspace" | "account" | "notify" | "api";

const TABS: { id: Tab; labelKey: DictKey }[] = [
  { id: "workspace", labelKey: "settings.tab.workspace" },
  { id: "account", labelKey: "settings.tab.account" },
  { id: "notify", labelKey: "settings.tab.notify" },
  // { id: "api", labelKey: "settings.tab.api" },
];

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const logout = useAuth((s) => s.logout);
  const setUser = useAuth((s) => s.setUser);
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState<Tab>("workspace");
  const [loading, setLoading] = useState(true);
  const [savingWorkspace, setSavingWorkspace] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(user?.workspace || "");
  const [timezone, setTimezone] = useState("Asia/Bangkok");
  const [website, setWebsite] = useState("");
  const [businessType, setBusinessType] = useState("ecommerce");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [notif, setNotif] = useState({
    new_chat: true,
    ai_cant_answer: true,
    quota_warning: true,
    daily_summary: false,
  });
  const [accountName, setAccountName] = useState(user?.name || "");
  const [accountEmail, setAccountEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    api.settings
      .get()
      .then((s) => {
        setAccountName(s.account.name || "");
        setAccountEmail(s.account.email || "");
        setWorkspaceName(s.workspace.name || "");
        setTimezone(s.workspace.timezone || "Asia/Bangkok");
        setWebsite(s.workspace.website || "");
        setBusinessType(s.workspace.business_type || "ecommerce");
        setLogoUrl(s.workspace.logo_url || "");
        if (s.notification) {
          setNotif({
            new_chat: s.notification.new_chat,
            ai_cant_answer: s.notification.ai_cant_answer,
            quota_warning: s.notification.quota_warning,
            daily_summary: s.notification.daily_summary,
          });
        }
        if (user) {
          setUser({
            ...user,
            name: s.account.name,
            email: s.account.email,
            workspace: s.workspace.name,
            role: (s.account.role as typeof user.role) || user.role,
          });
        }
      })
      .catch((e) => {
        if (!(e instanceof ApiError && e.status === 401)) {
          showToast(
            e instanceof Error ? e.message : "settings load failed",
            "error",
          );
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveWorkspace() {
    setSavingWorkspace(true);
    try {
      const saved = await api.settings.updateWorkspace({
        name: workspaceName.trim(),
        timezone,
        website: website.trim(),
        business_type: businessType,
      });
      setWorkspaceName(saved.name);
      setTimezone(saved.timezone);
      setWebsite(saved.website || "");
      setBusinessType(saved.business_type || "ecommerce");
      if (user) setUser({ ...user, workspace: saved.name });
      showToast(t("settings.toast.saved"), "success");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "save failed", "error");
    } finally {
      setSavingWorkspace(false);
    }
  }

  async function saveAccount() {
    setSavingAccount(true);
    try {
      const saved = await api.settings.updateAccount({
        name: accountName.trim(),
        email: accountEmail.trim(),
      });
      setAccountName(saved.name || "");
      setAccountEmail(saved.email || "");
      if (user) setUser({ ...user, name: saved.name, email: saved.email });
      showToast(t("settings.toast.saved"), "success");
    } catch (e) {
      showToast(e instanceof ApiError ? e.message : "save failed", "error");
    } finally {
      setSavingAccount(false);
    }
  }

  async function savePassword() {
    if (newPassword !== confirmPassword) {
      showToast("Password confirmation does not match", "error");
      return;
    }
    setSavingPassword(true);
    try {
      await api.settings.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Password changed", "success");
    } catch (e) {
      showToast(
        e instanceof ApiError ? e.message : "password change failed",
        "error",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function toggleNotif(key: keyof typeof notif, value: boolean) {
    const next = { ...notif, [key]: value };
    setNotif(next);
    try {
      await api.settings.updateNotifications(next);
    } catch (e) {
      // Roll back on failure
      setNotif(notif);
      showToast(e instanceof ApiError ? e.message : "save failed", "error");
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const { logo_url } = await api.settings.uploadLogo(file);
      setLogoUrl(logo_url);
      showToast("โลโก้อัปโหลดแล้ว / Logo uploaded", "success");
    } catch (err) {
      showToast(
        err instanceof ApiError ? err.message : "upload failed",
        "error",
      );
    } finally {
      setUploadingLogo(false);
      // Reset input so the same file can be re-selected if needed.
      e.target.value = "";
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon={<SettingsIcon className="h-7 w-7" />}
        title={t("settings.title").replace("⚙️ ", "")}
        description={t("settings.sub")}
      />
      <PageBody>
        {/* Tab nav */}
        <div className="mb-6 flex flex-wrap gap-1.5">
          {TABS.map((tt) => (
            <button
              key={tt.id}
              onClick={() => setTab(tt.id)}
              className={cn(
                "rounded-lg border-[1.5px] px-4 py-2 text-sm font-medium transition-colors",
                tab === tt.id
                  ? "border-brand-300 bg-brand-soft text-brand-600"
                  : "border-transparent text-ink-muted hover:bg-muted",
              )}
            >
              {t(tt.labelKey)}
            </button>
          ))}
        </div>

        {tab === "workspace" && (
          <>
            <Card>
              <CardHeader
                icon={<Building2 className="h-4 w-4" />}
                title={t("settings.workspace.section")}
              />
              {/* Logo upload */}
              <div className="mb-5 flex items-center gap-4">
                <label
                  className={cn(
                    "group relative flex h-[72px] w-[72px] flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl transition-opacity",
                    uploadingLogo
                      ? "opacity-60 pointer-events-none"
                      : "hover:opacity-80",
                    logoUrl ? "bg-muted" : "bg-plan-gradient",
                  )}
                  title="Click to change logo"
                >
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt="Workspace logo"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ShoppingBag className="h-8 w-8 text-white" />
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={handleLogoChange}
                    disabled={uploadingLogo}
                  />
                </label>
                <div>
                  <div className="mb-1 text-sm font-semibold">
                    โลโก้ร้าน / Logo
                  </div>
                  <div className="mb-2 text-xs text-ink-faint">
                    JPEG, PNG หรือ WebP · สูงสุด 5 MB · แนะนำ 256×256 px
                  </div>
                  <label
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-line2 bg-card px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-muted",
                      uploadingLogo && "pointer-events-none opacity-60",
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingLogo
                      ? "กำลังอัปโหลด…"
                      : "เปลี่ยนโลโก้ / Change logo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleLogoChange}
                      disabled={uploadingLogo}
                    />
                  </label>
                </div>
              </div>
              <FormRow>
                <FormGroup label="Workspace name">
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    disabled={loading}
                  />
                </FormGroup>
                <FormGroup label="Timezone">
                  <Select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    disabled={loading}
                  >
                    <option value="Asia/Bangkok">Asia/Bangkok (UTC+7)</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Singapore">
                      Asia/Singapore (UTC+8)
                    </option>
                    <option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</option>
                  </Select>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup label="Website">
                  <Input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    disabled={loading}
                  />
                </FormGroup>
                <FormGroup label="Business type">
                  <Select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    disabled={loading}
                  >
                    <option value="ecommerce">E-commerce</option>
                    <option value="food">Food & Beverage</option>
                    <option value="service">Service</option>
                    <option value="realestate">Real Estate</option>
                    <option value="health">Health & Beauty</option>
                    <option value="other">Other</option>
                  </Select>
                </FormGroup>
              </FormRow>
              <Button
                onClick={saveWorkspace}
                disabled={loading || savingWorkspace}
              >
                <Save className="h-4 w-4" />{" "}
                {savingWorkspace ? "…" : t("common.save")}
              </Button>
            </Card>

            <BusinessHoursCard />
          </>
        )}

        {tab === "account" && (
          <>
            <Card>
              <CardHeader
                icon={<Palette className="h-4 w-4" />}
                title={t("settings.appearance.section")}
              />
              <PreferencesPanel />
            </Card>

            <Card>
              <CardHeader
                icon={<User className="h-4 w-4" />}
                title={t("settings.account.section")}
              />
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand-600">
                  {(user?.email || "U").slice(0, 1).toUpperCase()}
                </div>
              </div>
              <FormRow>
                <FormGroup label={t("common.name")}>
                  <Input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    disabled={loading}
                  />
                </FormGroup>
                <FormGroup label={t("common.email")}>
                  <Input
                    type="email"
                    value={accountEmail}
                    onChange={(e) => setAccountEmail(e.target.value)}
                    disabled={loading}
                  />
                </FormGroup>
              </FormRow>
              <Button onClick={saveAccount} disabled={loading || savingAccount}>
                <Save className="h-4 w-4" />{" "}
                {savingAccount ? "…" : t("common.save")}
              </Button>
            </Card>

            <Card>
              <CardHeader
                icon={<Lock className="h-4 w-4" />}
                title={t("settings.password.section")}
              />
              <FormGroup label="Current password" className="mb-4">
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </FormGroup>
              <FormRow>
                <FormGroup label="New password">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </FormGroup>
                <FormGroup label="Confirm password">
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </FormGroup>
              </FormRow>
              <Button
                onClick={savePassword}
                disabled={
                  savingPassword ||
                  !currentPassword ||
                  !newPassword ||
                  !confirmPassword
                }
              >
                {savingPassword ? "…" : t("settings.password.section")}
              </Button>
            </Card>

            <Card>
              <CardHeader
                icon={<LogOut className="h-4 w-4" />}
                title={t("settings.logout.section")}
              />
              <p className="mb-3 text-sm text-ink-muted">
                {t("settings.logout.desc")}
              </p>
              <Button
                variant="danger"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                {t("settings.logout.btn")}
              </Button>
            </Card>
          </>
        )}

        {tab === "notify" && (
          <Card>
            <CardHeader
              icon={<Bell className="h-4 w-4" />}
              title={t("settings.notify.section")}
            />
            <p className="mb-4 text-sm text-ink-muted">
              These preferences apply only to <strong>your account</strong>.
              Each team member can configure their own.
            </p>
            <div className="space-y-4">
              <NotifyRow
                title="New chat received"
                desc="Notify when a new customer conversation starts"
                checked={notif.new_chat}
                onChange={(v) => toggleNotif("new_chat", v)}
              />
              <NotifyRow
                title="AI couldn't answer"
                desc="Notify when AI flags a conversation for human handoff"
                checked={notif.ai_cant_answer}
                onChange={(v) => toggleNotif("ai_cant_answer", v)}
              />
              <NotifyRow
                title="Quota warning"
                desc="Warn when monthly AI usage exceeds 80% (Owner only)"
                checked={notif.quota_warning}
                onChange={(v) => toggleNotif("quota_warning", v)}
              />
              {/* <NotifyRow
                title="Daily summary"
                desc="Get a daily volume + performance digest"
                checked={notif.daily_summary}
                onChange={(v) => toggleNotif("daily_summary", v)}
              /> */}
            </div>
          </Card>
        )}

        {tab === "api" && (
          <Card>
            <CardHeader
              icon={<Key className="h-4 w-4" />}
              title={t("settings.api.section")}
              description="Used to integrate TopDee with other systems. Keep keys secret."
            />
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 p-4 font-mono text-[13px] text-sky-300">
              <span>
                sk_live_
                <span className="text-yellow-300">••••••••••••••••••</span>
                abc4xyz
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-slate-700 text-slate-300 hover:bg-slate-600"
                  iconLeft={<Eye className="h-4 w-4" />}
                >
                  Show
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-slate-700 text-slate-300 hover:bg-slate-600"
                  iconLeft={<Copy className="h-4 w-4" />}
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" iconLeft={<Plus className="h-4 w-4" />}>
                New key
              </Button>
              <Button
                variant="danger"
                iconLeft={<Trash2 className="h-4 w-4" />}
              >
                Revoke
              </Button>
            </div>
          </Card>
        )}
      </PageBody>
    </AppShell>
  );
}

function NotifyRow({
  title,
  desc,
  checked,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-page p-4">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-ink-faint">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </div>
  );
}
