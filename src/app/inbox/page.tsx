"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar, ChannelDot } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useConversations, type Conversation } from "@/store/conversations";
import { useAuth } from "@/store/auth";
import { API_URL, ApiError, type MessageAttachment } from "@/lib/api";
import { useUI } from "@/store/ui";
import { useT } from "@/lib/i18n/useT";
import { cn } from "@/lib/cn";
import {
  User,
  Tag,
  Share2,
  Check,
  Sparkles,
  Send as SendIcon,
  X,
  UserCheck,
} from "@/components/ui/Icon";
import type { ComponentType } from "react";

export default function InboxPage() {
  const t = useT();
  const {
    conversations,
    selectedId,
    filter,
    search,
    loading,
    error,
    select,
    setFilter,
    setSearch,
    refresh,
    loadMessages,
    sendMessage,
    resolveHandoff,
  } = useConversations();
  const user = useAuth((s) => s.user);
  const showToast = useUI((s) => s.showToast);
  const agentName = accountDisplayName(user?.name, user?.email);
  const agentInitial = accountInitial(agentName);

  // Initial load + refresh-on-focus + polling. Polling is paused while the
  // tab is hidden so we don't burn the user's battery in the background.
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

    // Poll the conversation list every 5s for fresh customer messages.
    // The active conversation's messages are also re-fetched (force=true)
    // so the chat box updates in near-real-time without a WebSocket.
    let timer: ReturnType<typeof setInterval> | null = null;
    const startPolling = () => {
      if (timer) return;
      timer = setInterval(() => {
        refresh();
        const id = useConversations.getState().selectedId;
        if (id) loadMessages(id, true);
      }, 5000);
    };
    const stopPolling = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.hidden) stopPolling();
      else startPolling();
    };
    if (!document.hidden) startPolling();
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      stopPolling();
    };
  }, [refresh, loadMessages]);

  // Always force-fetch on selection — a stale `loaded=true` flag from
  // earlier could otherwise leave the chat box empty even though the
  // server has messages. Cheap call (server caps at 500 messages).
  useEffect(() => {
    if (selectedId) loadMessages(selectedId, true);
  }, [selectedId, loadMessages]);

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
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside className="hidden min-h-0 flex-col border-r border-line2 bg-card md:flex">
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
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading && conversations.length === 0 && (
              <div className="p-6 text-center text-xs text-ink-faint">
                Loading…
              </div>
            )}
            {error && <div className="p-4 text-xs text-red-500">{error}</div>}
            {!loading && filtered.length === 0 && (
              <div className="p-6 text-center text-[13px] text-ink-faint">
                No conversations yet. Send a message to your connected LINE OA
                from your phone — it'll show up here.
              </div>
            )}
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
            agentName={agentName}
            agentInitial={agentInitial}
            onSend={async (text) => {
              try {
                await sendMessage(selected.id, text);
                showToast(t("inbox.toast.sent"), "success");
              } catch (e) {
                const msg =
                  e instanceof ApiError
                    ? e.message
                    : e instanceof Error
                      ? e.message
                      : "send failed";
                showToast(msg, "default");
              }
            }}
            onResolveHandoff={async () => {
              try {
                await resolveHandoff(selected.id);
                showToast(t("inbox.toast.resolved"), "success");
              } catch {
                showToast("Failed to resolve handoff", "default");
              }
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
  const t = useT();
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 border-b border-line2 px-4 py-3.5 text-left transition-colors",
        active ? "bg-brand-soft/60" : "hover:bg-muted",
        conv.needsHuman && !active && "bg-orange-50 dark:bg-orange-950/20",
      )}
    >
      <Avatar
        initials={conv.initials}
        tone={conv.avatarTone}
        size="md"
        badge={<ChannelDot channel={conv.channel} />}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 truncate">
          <span className="truncate text-sm font-semibold text-ink">
            {conv.customerName}
          </span>
          {conv.needsHuman && (
            <span className="shrink-0 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {t("inbox.handoff.badge")}
            </span>
          )}
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
  agentName,
  agentInitial,
  onSend,
  onResolveHandoff,
}: {
  conv: Conversation;
  agentName: string;
  agentInitial: string;
  onSend: (text: string) => void;
  onResolveHandoff: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const visibleMessages = conv.messages.filter(
    (m) => m.author !== "suggestion",
  );
  const latestSuggestion = [...conv.messages]
    .reverse()
    .find((m) => m.author === "suggestion");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [visibleMessages.length]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-line2 bg-card px-5 py-3.5">
        <Avatar
          initials={conv.initials}
          tone={conv.avatarTone}
          size="md"
          badge={<ChannelDot channel={conv.channel} />}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-[15px] font-semibold text-ink">
              {conv.customerName}
            </h4>
            <ChannelPill channel={conv.channel} />
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            <span className="text-emerald-500">●</span>{" "}
            {conv.online ? t("common.online") : t("common.offline")}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {/* <IconButton title={t("inbox.action.history")} Icon={User} />
          <IconButton title={t("inbox.action.tag")} Icon={Tag} />
          <IconButton title={t("inbox.action.transfer")} Icon={Share2} /> */}
          {conv.needsHuman && (
            <button
              onClick={onResolveHandoff}
              title={t("inbox.handoff.resolve")}
              className="flex items-center gap-1.5 rounded-[10px] border border-orange-300 bg-orange-50 px-3 py-1.5 text-[12px] font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
            >
              <UserCheck className="h-3.5 w-3.5" />
              {t("inbox.handoff.resolve")}
            </button>
          )}
          {/* <IconButton
            title={t("inbox.action.close")}
            Icon={Check}
            tone="danger"
          /> */}
        </div>
      </header>

      {/* Handoff banner */}
      {conv.needsHuman && (
        <div className="flex items-center gap-2.5 border-b border-orange-200 bg-orange-50 px-5 py-2.5 text-[13px] text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
          <UserCheck className="h-4 w-4 flex-shrink-0" />
          <span>{t("inbox.handoff.banner")}</span>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-page p-5"
      >
        {visibleMessages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-2xl border border-line2 bg-card px-5 py-4 text-center text-sm text-ink-faint">
              {conv.loaded ? (
                <>No messages yet in this conversation.</>
              ) : (
                <>Loading messages…</>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-4">
          {visibleMessages.map((m) => (
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
                tone={
                  m.author === "ai"
                    ? "ai"
                    : m.author === "agent"
                      ? "gray"
                      : conv.avatarTone
                }
                initials={
                  m.author === "ai"
                    ? "AI"
                    : m.author === "agent"
                      ? agentInitial
                      : conv.initials
                }
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
                  {!(m.attachments.length > 0 && m.text === "[Image]") && (
                    <div>{m.text}</div>
                  )}
                  {m.attachments
                    .filter((a) => a.type === "image" && a.url)
                    .map((a, index) => (
                      <AttachmentImage
                        key={a.id ?? a.url ?? index}
                        attachment={a}
                        compact={m.text !== "[Image]"}
                        onOpen={(src, alt) => setPreviewImage({ src, alt })}
                      />
                    ))}
                </div>
                <div
                  className={cn(
                    "mt-1 text-[11px] text-ink-faint",
                    m.direction === "out" && "text-right",
                  )}
                >
                  {m.time}
                  {m.author === "agent" && ` · ${agentName}`}
                  {m.author === "ai" && " · AI ✓✓"}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {latestSuggestion && (
        <div className="mx-5 mb-3 flex items-center gap-2.5 rounded-2xl border border-brand-300 bg-brand-soft px-4 py-3 text-[13px] text-brand-700 dark:text-brand-200">
          <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            <strong>{t("inbox.aiSuggestion.label")}</strong>{" "}
            {latestSuggestion.text}
          </span>
          <Button
            size="sm"
            className="ml-auto whitespace-nowrap"
            onClick={() => setDraft(latestSuggestion.text)}
          >
            {t("inbox.aiSuggestion.use")}
          </Button>
        </div>
      )}

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

      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            aria-label="Close image preview"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[92vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}

function accountInitial(value?: string): string {
  const trimmed = value?.trim();
  return trimmed?.[0]?.toUpperCase() ?? "A";
}

function accountDisplayName(name?: string, email?: string): string {
  const trimmedName = name?.trim();
  if (trimmedName) return trimmedName;
  const trimmedEmail = email?.trim();
  if (trimmedEmail) return trimmedEmail;
  return "Admin";
}

function AttachmentImage({
  attachment,
  compact,
  onOpen,
}: {
  attachment: MessageAttachment;
  compact?: boolean;
  onOpen?: (src: string, alt: string) => void;
}) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const rawUrl = attachment.url ?? "";
  const src = rawUrl.startsWith("/api/") ? `${API_URL}${rawUrl}` : rawUrl;
  const needsAuth = rawUrl.startsWith("/api/") || src.startsWith(API_URL);

  useEffect(() => {
    if (!src || !needsAuth) return;
    let cancelled = false;
    let nextObjectUrl: string | null = null;
    const token =
      typeof window === "undefined"
        ? null
        : window.localStorage.getItem("topdee_token");

    fetch(src, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
      .then((res) => {
        if (!res.ok) throw new Error("image load failed");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        nextObjectUrl = URL.createObjectURL(blob);
        setObjectUrl(nextObjectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl);
    };
  }, [needsAuth, src]);

  if (failed) {
    return (
      <div className={cn(compact && "mt-2", "text-xs opacity-80")}>
        Image could not be loaded.
      </div>
    );
  }

  const displaySrc = needsAuth ? objectUrl : src;
  if (!displaySrc) {
    return (
      <div className={cn(compact && "mt-2", "text-xs opacity-80")}>
        Loading image...
      </div>
    );
  }

  const alt = attachment.name || "Customer upload";

  return (
    <button
      type="button"
      onClick={() => onOpen?.(displaySrc, alt)}
      className={cn(
        compact && "mt-2",
        "block overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-brand-300",
      )}
      title="Open image"
    >
      <img
        src={displaySrc}
        alt={alt}
        className="max-h-72 max-w-full object-contain transition-transform hover:scale-[1.01]"
      />
    </button>
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

// ChannelPill — small color-coded label that lives next to the customer
// name in the chat header. Makes it impossible to miss which platform
// you're replying on (LINE pricing, FB Messenger, etc. behave differently
// so it's worth keeping front-of-mind).
function ChannelPill({ channel }: { channel: "line" | "fb" | "ig" | "web" }) {
  const map = {
    line: {
      label: "LINE OA",
      classes:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    fb: {
      label: "Facebook",
      classes: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
    },
    ig: {
      label: "Instagram",
      classes:
        "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
    },
    web: {
      label: "Webchat",
      classes: "bg-brand-soft text-brand-700 dark:text-brand-200",
    },
  } as const;
  const m = map[channel];
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold",
        m.classes,
      )}
    >
      {m.label}
    </span>
  );
}
