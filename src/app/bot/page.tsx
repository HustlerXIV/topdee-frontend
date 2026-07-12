"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell, PageBody, PageHeader } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  FormGroup,
  FormRow,
  Input,
  Select,
  Textarea,
} from "@/components/ui/Input";
import { Playground } from "@/components/Playground";
import { api, type BotSettings } from "@/lib/api";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/i18n/useT";
import { Bot, Save, Sliders } from "@/components/ui/Icon";

type Persona = "friendly" | "formal" | "fun" | "concise";
type Mode = "auto" | "suggest" | "manual";
type Lang = "th" | "en" | "mix" | "auto";

const modeOptions: { value: Mode; label: string; description: string }[] = [
  {
    value: "auto",
    label: "AI auto-reply",
    description: "AI sends the answer automatically.",
  },
  {
    value: "suggest",
    label: "AI suggests, team sends",
    description: "AI drafts a reply for your team to approve.",
  },
  {
    value: "manual",
    label: "Team replies manually",
    description: "AI stays silent and your team handles the chat.",
  },
];

export default function BotPage() {
  const t = useT();
  const showToast = useUI((s) => s.showToast);

  const [name, setName] = useState("");
  const [language, setLanguage] = useState<Lang>("th");
  const [persona, setPersona] = useState<Persona>("friendly");
  const [mode, setMode] = useState<Mode>("auto");
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("");
  const [temperature, setTemperature] = useState<string>("0.3");

  // model + temperature have no UI to edit them. Remember what the server
  // actually sent so save() can echo those values back only when they were
  // genuinely loaded — never the local "0.3"/"" fallbacks, which would
  // otherwise pin a possibly-null server value. null = server didn't set one.
  const serverModel = useRef<string | null>(null);
  const serverTemp = useRef<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current settings on mount. The backend always returns a populated
  // object so we can hydrate every field without fallbacks.
  useEffect(() => {
    api.bot
      .get()
      .then(applyFromServer)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function applyFromServer(s: BotSettings) {
    setName(s.name ?? "");
    setLanguage((s.language as Lang) ?? "th");
    setPersona((s.persona as Persona) ?? "friendly");
    setMode((s.mode as Mode) ?? "auto");
    setPrompt(s.system_prompt ?? "");
    setModel(s.model ?? "");
    setTemperature(s.temperature == null ? "0.3" : String(s.temperature));
    serverModel.current = s.model && s.model.trim() ? s.model : null;
    serverTemp.current = s.temperature ?? null;
  }

  async function save() {
    setSaving(true);
    try {
      // Only send the fields the UI actually edits. model/temperature are not
      // editable here, so include them only if the server had a real value —
      // omitting them lets the backend keep its own default instead of us
      // overwriting it with a local fallback.
      const payload: Partial<Omit<BotSettings, "updated_at">> = {
        name: name.trim(),
        language,
        persona,
        mode,
        system_prompt: prompt,
      };
      if (serverModel.current !== null) payload.model = serverModel.current;
      if (serverTemp.current !== null) payload.temperature = serverTemp.current;
      const updated = await api.bot.update(payload);
      applyFromServer(updated);
      showToast(t("bot.toast.saved"), "success");
    } catch {
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageHeader
        icon={<Bot className="h-7 w-7" />}
        title={t("bot.title").replace("🤖 ", "")}
        description={t("bot.sub")}
      />
      <PageBody>
        <Card>
          <CardHeader
            icon={<Sliders className="h-4 w-4" />}
            title={t("bot.persona.section")}
          />

          {loading ? (
            <p className="text-sm text-ink-faint">{t("common.loading")}</p>
          ) : (
            <>
              <FormRow>
                <FormGroup label={t("bot.field.botName")}>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                  />
                </FormGroup>
                <FormGroup label={t("bot.field.lang")}>
                  <Select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Lang)}
                  >
                    <option value="auto">Auto-detect (any language)</option>
                    <option value="th">ภาษาไทย / Thai</option>
                    <option value="en">English</option>
                    <option value="mix">ไทย + English</option>
                  </Select>
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup label={t("bot.field.persona")}>
                  <Select
                    value={persona}
                    onChange={(e) => setPersona(e.target.value as Persona)}
                  >
                    <option value="friendly">
                      {t("onboarding.persona.friendly")}
                    </option>
                    <option value="formal">
                      {t("onboarding.persona.professional")}
                    </option>
                    <option value="fun">Fun · with emoji</option>
                    <option value="concise">Concise</option>
                  </Select>
                </FormGroup>
                <FormGroup label={t("bot.field.mode")}>
                  <Select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as Mode)}
                  >
                    {modeOptions.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        data-description={opt.description}
                      >
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                </FormGroup>
              </FormRow>

              <FormGroup label={t("bot.field.prompt")}>
                <Textarea
                  rows={6}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={8000}
                />
              </FormGroup>

              <Button
                className="mt-2"
                onClick={save}
                disabled={saving}
                iconLeft={<Save className="h-4 w-4" />}
              >
                {saving ? "…" : t("bot.save").replace("💾 ", "")}
              </Button>
            </>
          )}
        </Card>

        <Card>
          <CardHeader
            icon={<Bot className="h-4 w-4" />}
            title={t("bot.test.section")}
          />
          <Playground height={300} />
        </Card>
      </PageBody>
    </AppShell>
  );
}
