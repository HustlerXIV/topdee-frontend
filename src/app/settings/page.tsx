"use client";

import { useState } from "react";
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
} from "@/components/ui/Icon";
import { useAuth } from "@/store/auth";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/i18n/useT";
import { type DictKey } from "@/lib/i18n/dictionary";
import { cn } from "@/lib/cn";

type Tab = "workspace" | "account" | "notify" | "api";

const TABS: { id: Tab; labelKey: DictKey }[] = [
  { id: "workspace", labelKey: "settings.tab.workspace" },
  { id: "account", labelKey: "settings.tab.account" },
  { id: "notify", labelKey: "settings.tab.notify" },
  { id: "api", labelKey: "settings.tab.api" },
];

export default function SettingsPage() {
  const router = useRouter();
  const t = useT();
  const showToast = useUI((s) => s.showToast);
  const logout = useAuth((s) => s.logout);
  const user = useAuth((s) => s.user);
  const [tab, setTab] = useState<Tab>("workspace");

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
              <CardHeader icon={<Building2 className="h-4 w-4" />} title={t("settings.workspace.section")} />
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-plan-gradient text-white">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div>
                  <div className="mb-1.5 text-sm font-semibold">
                    โลโก้ร้าน / Logo
                  </div>
                  <Button variant="outline" size="sm">
                    {t("common.edit")}
                  </Button>
                </div>
              </div>
              <FormRow>
                <FormGroup label="Workspace name">
                  <Input defaultValue={user?.workspace || "StyleHub Shop"} />
                </FormGroup>
                <FormGroup label="Timezone">
                  <Select defaultValue="bangkok">
                    <option value="bangkok">Asia/Bangkok (UTC+7)</option>
                  </Select>
                </FormGroup>
              </FormRow>
              <FormRow>
                <FormGroup label="Website">
                  <Input defaultValue="https://stylehub.co.th" />
                </FormGroup>
                <FormGroup label="Business type">
                  <Select defaultValue="ecommerce">
                    <option value="ecommerce">E-commerce</option>
                    <option value="food">Food & Beverage</option>
                    <option value="service">Service</option>
                  </Select>
                </FormGroup>
              </FormRow>
              <Button
                onClick={() => showToast(t("settings.toast.saved"), "success")}
              >
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </Card>

            <BusinessHoursCard />
          </>
        )}

        {tab === "account" && (
          <>
            <Card>
              <CardHeader icon={<Palette className="h-4 w-4" />} title={t("settings.appearance.section")} />
              <PreferencesPanel />
            </Card>

            <Card>
              <CardHeader icon={<User className="h-4 w-4" />} title={t("settings.account.section")} />
              <div className="mb-5 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-2xl font-bold text-brand-600">
                  {(user?.email || "U").slice(0, 1).toUpperCase()}
                </div>
                <Button variant="outline" size="sm">
                  {t("common.edit")}
                </Button>
              </div>
              <FormRow>
                <FormGroup label={t("common.name")}>
                  <Input defaultValue="Win Chayutphon" />
                </FormGroup>
                <FormGroup label={t("common.email")}>
                  <Input defaultValue={user?.email || ""} />
                </FormGroup>
              </FormRow>
              <Button
                onClick={() => showToast(t("settings.toast.saved"), "success")}
              >
                <Save className="h-4 w-4" /> {t("common.save")}
              </Button>
            </Card>

            <Card>
              <CardHeader icon={<Lock className="h-4 w-4" />} title={t("settings.password.section")} />
              <FormGroup label="Current password" className="mb-4">
                <Input type="password" placeholder="••••••••" />
              </FormGroup>
              <FormRow>
                <FormGroup label="New password">
                  <Input type="password" placeholder="••••••••" />
                </FormGroup>
                <FormGroup label="Confirm password">
                  <Input type="password" placeholder="••••••••" />
                </FormGroup>
              </FormRow>
              <Button>{t("settings.password.section")}</Button>
            </Card>

            <Card>
              <CardHeader icon={<LogOut className="h-4 w-4" />} title={t("settings.logout.section")} />
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
            <CardHeader icon={<Bell className="h-4 w-4" />} title={t("settings.notify.section")} />
            <div className="space-y-4">
              <NotifyRow
                title="New chat received"
                desc="Notify on every new customer message"
                defaultChecked
              />
              <NotifyRow
                title="AI couldn't answer"
                desc="Notify when AI requests a human"
                defaultChecked
              />
              <NotifyRow
                title="Daily summary"
                desc="Get a daily volume + performance digest"
              />
              <NotifyRow
                title="Quota warning"
                desc="Warn when usage exceeds 80%"
                defaultChecked
              />
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
              <Button variant="danger" iconLeft={<Trash2 className="h-4 w-4" />}>
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
  defaultChecked,
}: {
  title: string;
  desc: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] bg-page p-4">
      <div>
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-ink-faint">{desc}</div>
      </div>
      <Toggle defaultChecked={defaultChecked} />
    </div>
  );
}
