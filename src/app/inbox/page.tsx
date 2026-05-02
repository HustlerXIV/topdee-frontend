"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, ChannelDot } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConversations, type Conversation } from "@/store/conversations";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import { User, Tag, Share2, Check, Sparkles, Send as SendIcon } from "@/components/ui/Icon";
import type { ComponentType } from "react";

export default function InboxPage() {
  const t = useT();
  const {
    conversations,
    selectedId,
    filter,
    search,
    select,
    setFilter,
    setSearch,
    appendMessage,
    seedDemo,
  } = useConversations();
  const showToast = useUI((s) => s.showToast);

  useEffect(() => {
    seedDemo();
  }, [seedDemo]);

  const filtered = useMemo(() => {
    return conversations
      .filter((c) => (filter === "all" ? true : c.kind === filter))
      .filter((c) =>
        search.trim() === ""
          ? true
          : c.customerName.toLowerCase().includes(search.toLowerCase()),
      );
  }, [conversations, filter, search]);

  const selected =
    conversations.find((c) => c.id === selectedId) ?? filtered[0];

  return (
    <AppShell withPadding={false}>
      <div className="grid h-screen grid-cols-1 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside className="hidden flex-col border-r border-line2 bg-card md:flex">
          <div className="border-b border-line2 p-3.5">
            <Input
              placeholder={t("inbox.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-page"
            />
          </div>
          <div className="flex overflow-x-auto border-b border-line2 scrollbar-hide">
            {(["all", "ai", "team"] as const).map((tab) => {
              const labelKey =
                tab === "all"
                  ? "inbox.filter.all"
                  : tab === "ai"
                    ? "inbox.filter.ai"
                    : "inbox.filter.team";

              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "shrink-0 border-b-2 px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors",
                    filter === tab
                      ? "border-brand-600 text-brand-600"
                      : "border-transparent text-ink-faint hover:text-ink",
                  )}
                >
                  {t(labelKey)}
                </button>
              );
            })}
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <ConversationRow
                key={c.id}
                conv={c}
                active={c.id === selected?.id}
                onClick={() => select(c.id)}
              />
            ))}
          </div>
        </aside>

        {/* Chat area */}
        {selected ? (
          <ChatArea
            conv={selected}
            onSend={(text) => {
              appendMessage(selected.id, {
                id: "m-" + Date.now(),
                direction: "out",
                author: "agent",
                text,
                time: new Date().toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });
              showToast(t("inbox.toast.sent"), "success");
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            {t("inbox.empty")}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ConversationRow({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-line2 px-4 py-3.5 text-left transition-colors",
        active ? "bg-brand-soft/60" : "hover:bg-muted",
      )}
    >
      <Avatar
        initials={conv.initials}
        tone={conv.avatarTone}
        size="md"
        badge={<ChannelDot channel={conv.channel} />}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">
          {conv.customerName}
        </div>
        <div className="truncate text-[13px] text-ink-faint">
          {conv.preview}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11px] text-ink-faint">{conv.time}</span>
        {conv.unread > 0 && (
          <span className="rounded-full bg-brand-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {conv.unread}
          </span>
        )}
      </div>
    </button>
  );
}

function ChatArea({
  conv,
  onSend,
}: {
  conv: Conversation;
  onSend: (text: string) => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [conv.messages.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <section className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-line2 bg-card px-5 py-3.5">
        <Avatar initials={conv.initials} tone={conv.avatarTone} size="md" />
        <div>
          <h4 className="text-[15px] font-semibold text-ink">
            {conv.customerName}
          </h4>
          <p className="text-xs text-ink-faint">
            <span className="text-emerald-500">●</span>{" "}
            {channelLabel(conv.channel)} ·{" "}
            {conv.online ? t("common.online") : t("common.offline")}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <IconButton title={t("inbox.action.history")} Icon={User} />
          <IconButton title={t("inbox.action.tag")} Icon={Tag} />
          <IconButton title={t("inbox.action.transfer")} Icon={Share2} />
          <IconButton
            title={t("inbox.action.close")}
            Icon={Check}
            tone="danger"
          />
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-page p-5">
        <div className="flex flex-col gap-4">
          {conv.messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex max-w-[75%] gap-2.5",
                m.direction === "out"
                  ? "flex-row-reverse self-end"
                  : "self-start",
              )}
            >
              <Avatar
                size="sm"
                tone={m.author === "ai" ? "ai" : conv.avatarTone}
                initials={m.author === "ai" ? "AI" : conv.initials}
              />
              <div>
                <div
                  className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.direction === "out"
                      ? "rounded-br-md bg-brand-600 text-white"
                      : "rounded-bl-md border border-line2 bg-card text-ink",
                  )}
                >
                  {m.text}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[11px] text-ink-faint",
                    m.direction === "out" && "text-right",
                  )}
                >
                  {m.time}
                  {m.author === "ai" && " · AI ✓✓"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI suggestion */}
      <div className="mx-5 mb-3 flex items-start gap-2.5 rounded-2xl border border-brand-300 bg-brand-soft px-4 py-3 text-[13px] text-brand-700 dark:text-brand-200">
        <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{t("inbox.aiSuggestion.label")}</strong>{" "}
          {t("inbox.aiSuggestion.body")}
        </span>
        <Button size="sm" className="ml-auto whitespace-nowrap">
          {t("inbox.aiSuggestion.use")}
        </Button>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2.5 border-t border-line2 bg-card px-5 py-3.5">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder={t("inbox.input.placeholder")}
          className="max-h-24 flex-1 resize-none rounded-2xl border border-line2 bg-card px-4 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-brand-600"
        />
        <Button onClick={send} iconRight={<SendIcon className="h-4 w-4" />}>
          {t("common.send")}
        </Button>
      </div>
    </section>
  );
}

function IconButton({
  Icon,
  title,
  tone = "default",
}: {
  Icon: ComponentType<{ className?: string }>;
  title: string;
  tone?: "default" | "danger";
}) {
  return (
    <button
      title={title}
      aria-label={title}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-[10px] border border-line2 bg-card text-sm transition-colors hover:bg-muted",
        tone === "danger" ? "text-red-500" : "text-ink-muted",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function channelLabel(c: "line" | "fb" | "ig" | "web") {
  return { line: "LINE OA", fb: "Facebook", ig: "Instagram", web: "Webchat" }[
    c
  ];
}
