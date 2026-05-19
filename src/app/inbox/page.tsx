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
  Sparkles,
  Send as SendIcon,
  X,
  UserCheck,
  ArrowLeft,
  Smile,
  Zap,
  File,
  MessageCircle,
  Clock,
  User,
  ChevronRight,
} from "@/components/ui/Icon";
import type { ComponentType, ReactNode } from "react";

export default function InboxPage() {
  const t = useT();
  const {
    conversations,
    selectedId,
    filter,
    search,
    loading,
    select,
    setFilter,
    setSearch,
    refresh,
    loadMessages,
    sendMessage,
    sendImage,
    resolveHandoff,
  } = useConversations();
  const user = useAuth((s) => s.user);
  const showToast = useUI((s) => s.showToast);
  const agentName = accountDisplayName(user?.name, user?.email);
  const agentInitial = accountInitial(agentName);

  // Mobile view: 'list' shows the conversation list, 'chat' shows the chat area
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Initial load + refresh-on-focus + polling. Polling is paused while the
  // tab is hidden so we don't burn the user's battery in the background.
  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);

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
      <div className="grid flex-1 min-h-0 grid-cols-1 md:grid-cols-[300px_1fr]">
        {/* Conversation list */}
        <aside
          className={cn(
            "min-h-0 flex-col border-r border-line2 bg-card",
            mobileView === "list" ? "flex" : "hidden",
            "md:flex",
          )}
        >
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
                onClick={() => {
                  select(c.id);
                  setMobileView("chat");
                }}
              />
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <div
          className={cn(
            mobileView === "chat" ? "flex" : "hidden",
            "min-h-0 flex-col md:flex",
          )}
        >
          {selected ? (
            <ChatArea
              conv={selected}
              agentName={agentName}
              agentInitial={agentInitial}
              onBack={() => setMobileView("list")}
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
              onSendImage={async (file) => {
                try {
                  await sendImage(selected.id, file);
                } catch (e) {
                  const msg =
                    e instanceof ApiError
                      ? e.message
                      : e instanceof Error
                        ? e.message
                        : "image send failed";
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
      </div>
    </AppShell>
  );
}

// ─── Conversation row ─────────────────────────────────────────────────────────

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

// ─── Chat area ────────────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "สวัสดีครับ/ค่ะ ยินดีให้บริการเสมอนะครับ/ค่ะ 😊",
  "ขอโทษสำหรับความไม่สะดวกนะครับ/ค่ะ ทางเราจะรีบดำเนินการให้เร็วที่สุดครับ/ค่ะ",
  "กรุณารอสักครู่นะครับ/ค่ะ ทีมงานกำลังตรวจสอบให้ครับ/ค่ะ",
  "ขอบคุณที่ติดต่อมานะครับ/ค่ะ มีอะไรให้ช่วยเหลืออีกไหมครับ/ค่ะ",
  "ได้รับเรื่องแล้วนะครับ/ค่ะ จะดำเนินการและแจ้งกลับภายใน 24 ชั่วโมงครับ/ค่ะ",
];

const EMOJI_LIST = [
  "😀","😊","😂","🥰","😍","🤔","😢","😮","😅","🙏",
  "👍","👎","❤️","🔥","✅","⚠️","🎉","💬","📞","📧",
  "⭐","💡","🛒","📦","🚀","✨","💯","🤝","👋","🕐",
];

function ChatArea({
  conv,
  agentName,
  agentInitial,
  onBack,
  onSend,
  onSendImage,
  onResolveHandoff,
}: {
  conv: Conversation;
  agentName: string;
  agentInitial: string;
  onBack: () => void;
  onSend: (text: string) => void;
  onSendImage: (file: File) => void;
  onResolveHandoff: () => void;
}) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const [previewImage, setPreviewImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [dismissedSuggestionId, setDismissedSuggestionId] = useState<
    string | null
  >(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 96) + "px";
  }, [draft]);

  const visibleMessages = conv.messages.filter(
    (m) => m.author !== "suggestion",
  );
  const latestSuggestion = [...conv.messages]
    .reverse()
    .find((m) => m.author === "suggestion");

  const latestSuggestionIdx = latestSuggestion
    ? conv.messages.findIndex((m) => m.id === latestSuggestion.id)
    : -1;
  const agentRepliedAfterSuggestion =
    latestSuggestionIdx !== -1 &&
    conv.messages
      .slice(latestSuggestionIdx + 1)
      .some((m) => m.author === "agent");
  const showSuggestionBanner =
    !!latestSuggestion &&
    latestSuggestion.id !== dismissedSuggestionId &&
    !agentRepliedAfterSuggestion;

  useEffect(() => {
    setDismissedSuggestionId(null);
    setShowEmoji(false);
    setShowQuickReply(false);
  }, [conv.id]);

  // Scroll to bottom on initial load, conversation switch, and new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  }, [visibleMessages.length, conv.id, conv.loaded]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
    setShowEmoji(false);
    setShowQuickReply(false);
    if (latestSuggestion) setDismissedSuggestionId(latestSuggestion.id);
  }

  function insertEmoji(emoji: string) {
    setDraft((d) => d + emoji);
    setShowEmoji(false);
    textareaRef.current?.focus();
  }

  function insertQuickReply(text: string) {
    setDraft(text);
    setShowQuickReply(false);
    textareaRef.current?.focus();
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2.5 border-b border-line2 bg-card px-3 py-3 md:gap-3 md:px-5 md:py-3.5">
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-muted md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar
          initials={conv.initials}
          tone={conv.avatarTone}
          size="md"
          badge={<ChannelDot channel={conv.channel} />}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-[15px] font-semibold text-ink">
              {conv.customerName}
            </h4>
            <ChannelPill channel={conv.channel} label={conv.channelName} />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {conv.needsHuman && (
            <button
              onClick={onResolveHandoff}
              title={t("inbox.handoff.resolve")}
              className="flex items-center gap-1.5 rounded-[10px] border border-orange-300 bg-orange-50 px-2 py-1.5 text-[12px] font-semibold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300 md:px-3"
            >
              <UserCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden md:inline">{t("inbox.handoff.resolve")}</span>
            </button>
          )}
        </div>
      </header>

      {/* Handoff banner */}
      {conv.needsHuman && (
        <div className="flex items-center gap-2.5 border-b border-orange-200 bg-orange-50 px-5 py-2.5 text-[13px] text-orange-700 dark:border-orange-800 dark:bg-orange-950/30 dark:text-orange-300">
          <UserCheck className="h-4 w-4 flex-shrink-0" />
          <span>{t("inbox.handoff.banner")}</span>
        </div>
      )}

      {/* Content row: messages + context panel */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Main chat column */}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
                          ? (m.senderName?.[0]?.toUpperCase() ?? agentInitial)
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
                      {m.text && !(m.attachments.length > 0 && m.text === "[Image]") && (
                        <MarkdownText
                          text={m.text}
                          isOutbound={m.direction === "out"}
                        />
                      )}
                      {m.attachments
                        .filter((a) => a.type === "image" && a.url)
                        .map((a, index) => (
                          <AttachmentImage
                            key={a.id ?? a.url ?? index}
                            attachment={a}
                            compact={!!m.text && m.text !== "[Image]"}
                            onOpen={(src, alt) =>
                              setPreviewImage({ src, alt })
                            }
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
                      {m.author === "agent" &&
                        ` · ${m.senderName ?? agentName}`}
                      {m.author === "ai" && " · AI ✓✓"}
                    </div>
                  </div>
                </div>
              ))}
              {/* Scroll anchor — always at the bottom of the message list */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* AI suggestion banner */}
          {showSuggestionBanner && (
            <div className="mx-5 mb-3 flex items-center gap-2.5 rounded-2xl border border-brand-300 bg-brand-soft px-4 py-3 text-[13px] text-brand-700 dark:text-brand-200">
              <Sparkles className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                <strong>{t("inbox.aiSuggestion.label")}</strong>{" "}
                {latestSuggestion.text}
              </span>
              <Button
                size="sm"
                className="ml-auto whitespace-nowrap"
                onClick={() => {
                  setDraft(latestSuggestion.text);
                  setDismissedSuggestionId(latestSuggestion.id);
                }}
              >
                {t("inbox.aiSuggestion.use")}
              </Button>
            </div>
          )}

          {/* Emoji picker popover */}
          {showEmoji && (
            <div className="mx-3 mb-2 rounded-2xl border border-line2 bg-card p-3 shadow-lg md:mx-5">
              <div className="grid grid-cols-10 gap-1">
                {EMOJI_LIST.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => insertEmoji(emoji)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick reply popover */}
          {showQuickReply && (
            <div className="mx-3 mb-2 rounded-2xl border border-line2 bg-card shadow-lg md:mx-5">
              <div className="border-b border-line2 px-4 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Quick Replies
                </p>
              </div>
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => insertQuickReply(qr)}
                  className="flex w-full items-start gap-2.5 border-b border-line2 px-4 py-2.5 text-left text-[13px] text-ink transition-colors last:border-0 hover:bg-muted"
                >
                  <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                  {qr}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="border-t border-line2 bg-card px-3 py-3 md:px-5 md:py-3.5">
            {/* Tool row */}
            <div className="mb-2 flex items-center gap-1">
              <ToolButton
                title="Emoji"
                active={showEmoji}
                onClick={() => {
                  setShowEmoji((v) => !v);
                  setShowQuickReply(false);
                }}
              >
                <Smile className="h-4 w-4" />
              </ToolButton>
              <ToolButton
                title="Attach file"
                onClick={() => fileInputRef.current?.click()}
              >
                <File className="h-4 w-4" />
              </ToolButton>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onSendImage(file);
                  }
                  e.target.value = "";
                }}
              />
              <div className="mx-1 h-4 w-px bg-line2" />
              <ToolButton
                title="Quick replies"
                active={showQuickReply}
                onClick={() => {
                  setShowQuickReply((v) => !v);
                  setShowEmoji(false);
                }}
              >
                <Zap className="h-4 w-4" />
              </ToolButton>
            </div>
            {/* Textarea + send */}
            <div className="flex items-end gap-2 md:gap-2.5">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={2}
                placeholder={t("inbox.input.placeholder")}
                className="flex-1 resize-none overflow-y-auto rounded-2xl border border-line2 bg-page px-4 py-2.5 text-sm leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-brand-600"
                style={{ minHeight: "2.75rem", maxHeight: "6rem" }}
              />
              <Button
                onClick={send}
                iconRight={<SendIcon className="h-4 w-4" />}
              >
                <span className="hidden sm:inline">{t("common.send")}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Customer context panel — desktop only */}
        <CustomerContextPanel conv={conv} agentName={agentName} />
      </div>

      {/* Image preview lightbox */}
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

// ─── Customer context panel ───────────────────────────────────────────────────

function CustomerContextPanel({
  conv,
  agentName,
}: {
  conv: Conversation;
  agentName: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState({
    conversation: true,
    handledBy: true,
    channel: true,
  });

  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  const visibleMessages = conv.messages.filter(
    (m) => m.author !== "suggestion",
  );
  const firstMessage = visibleMessages[0];
  const customerMessages = visibleMessages.filter(
    (m) => m.author === "customer",
  );
  const agentMessages = visibleMessages.filter(
    (m) => m.author === "agent" || m.author === "ai",
  );

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-l border-line2 bg-card transition-[width] xl:flex",
        collapsed ? "w-10 overflow-hidden" : "w-[220px] overflow-y-auto",
      )}
    >
      {/* Panel toggle — always visible */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-line2 px-2 py-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expand context panel" : "Collapse context panel"}
          className="flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-muted hover:text-ink"
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 transition-transform",
              !collapsed && "rotate-180",
            )}
          />
        </button>
      </div>

      {/* Content — hidden when collapsed */}
      {!collapsed && (
        <>
          {/* Customer info */}
          <div className="flex flex-col items-center border-b border-line2 px-4 py-5 text-center">
            <Avatar
              initials={conv.initials}
              tone={conv.avatarTone}
              size="lg"
              badge={<ChannelDot channel={conv.channel} />}
            />
            <h3 className="mt-3 text-[13px] font-semibold leading-snug text-ink">
              {conv.customerName}
            </h3>
            <ChannelPill channel={conv.channel} label={conv.channelName} />
          </div>

          {/* Stats */}
          <ContextSection
            label="Conversation"
            open={openSections.conversation}
            onToggle={() => toggleSection("conversation")}
          >
            <ContextRow
              icon={<MessageCircle className="h-3.5 w-3.5" />}
              label="Messages"
              value={String(visibleMessages.length)}
            />
            <ContextRow
              icon={<User className="h-3.5 w-3.5" />}
              label="From customer"
              value={String(customerMessages.length)}
            />
            <ContextRow
              icon={<UserCheck className="h-3.5 w-3.5" />}
              label="Replies sent"
              value={String(agentMessages.length)}
            />
            {firstMessage && (
              <ContextRow
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Started"
                value={firstMessage.time}
              />
            )}
            <ContextRow
              icon={<Clock className="h-3.5 w-3.5" />}
              label="Last message"
              value={conv.time}
            />
          </ContextSection>

          {/* Handled by */}
          <ContextSection
            label="Handled by"
            open={openSections.handledBy}
            onToggle={() => toggleSection("handledBy")}
          >
            <ContextRow
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Mode"
              value={conv.kind === "ai" ? "AI Agent" : "Human Agent"}
            />
            {conv.needsHuman && (
              <div className="rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">
                ⚠️ Awaiting human reply
              </div>
            )}
          </ContextSection>

          {/* Channel */}
          <ContextSection
            label="Channel"
            open={openSections.channel}
            onToggle={() => toggleSection("channel")}
            last
          >
            <ContextRow
              icon={<ChannelDot channel={conv.channel} />}
              label="Platform"
              value={conv.channelName}
            />
          </ContextSection>
        </>
      )}
    </aside>
  );
}

function ContextSection({
  label,
  open,
  onToggle,
  last = false,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={cn(!last && "border-b border-line2")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 text-ink-faint transition-transform",
            open && "rotate-90",
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-2 px-4 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

function ContextRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="shrink-0 text-ink-faint">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-ink-faint">{label}</span>
      <span className="shrink-0 font-medium text-ink">{value}</span>
    </div>
  );
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

/** Lightweight markdown renderer — no external deps. Handles the common
 * cases AI messages produce: bold, italic, inline code, bullet lists,
 * numbered lists, and line breaks. */
function MarkdownText({
  text,
  isOutbound,
}: {
  text: string;
  isOutbound: boolean;
}) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listKey = 0;

  function flushList() {
    if (listItems.length === 0) return;
    const key = `list-${listKey++}`;
    if (listType === "ul") {
      nodes.push(
        <ul key={key} className="my-1 ml-4 list-disc space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item, isOutbound)}</li>
          ))}
        </ul>,
      );
    } else {
      nodes.push(
        <ol key={key} className="my-1 ml-4 list-decimal space-y-0.5">
          {listItems.map((item, i) => (
            <li key={i}>{parseInline(item, isOutbound)}</li>
          ))}
        </ol>,
      );
    }
    listItems = [];
    listType = null;
  }

  lines.forEach((line, idx) => {
    const ulMatch = line.match(/^[\*\-]\s+(.+)/);
    const olMatch = line.match(/^\d+\.\s+(.+)/);
    const h3Match = line.match(/^###\s+(.+)/);
    const h2Match = line.match(/^##\s+(.+)/);
    const h1Match = line.match(/^#\s+(.+)/);

    if (ulMatch) {
      if (listType && listType !== "ul") flushList();
      listType = "ul";
      listItems.push(ulMatch[1]);
    } else if (olMatch) {
      if (listType && listType !== "ol") flushList();
      listType = "ol";
      listItems.push(olMatch[1]);
    } else {
      flushList();
      if (h1Match || h2Match || h3Match) {
        const content = (h1Match ?? h2Match ?? h3Match)![1];
        nodes.push(
          <p key={idx} className="font-semibold">
            {parseInline(content, isOutbound)}
          </p>,
        );
      } else if (line.trim() === "") {
        if (nodes.length > 0) nodes.push(<br key={`br-${idx}`} />);
      } else {
        nodes.push(
          <p key={idx}>{parseInline(line, isOutbound)}</p>,
        );
      }
    }
  });

  flushList();

  return <div className="space-y-0.5">{nodes}</div>;
}

function parseInline(text: string, isOutbound: boolean): ReactNode[] {
  const result: ReactNode[] = [];
  // Matches **bold**, *italic*, `code`
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      result.push(text.slice(lastIndex, match.index));
    }
    if (match[2] !== undefined) {
      result.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      result.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4] !== undefined) {
      result.push(
        <code
          key={key++}
          className={cn(
            "rounded px-1 py-0.5 font-mono text-xs",
            isOutbound
              ? "bg-white/20 text-white"
              : "bg-muted text-ink",
          )}
        >
          {match[4]}
        </code>,
      );
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    result.push(text.slice(lastIndex));
  }

  return result;
}

// ─── Attachment image ─────────────────────────────────────────────────────────

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

// ─── Tool button ──────────────────────────────────────────────────────────────

function ToolButton({
  children,
  title,
  active,
  onClick,
}: {
  children: ReactNode;
  title: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg transition-colors",
        active
          ? "bg-brand-soft text-brand-600"
          : "text-ink-faint hover:bg-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function ChannelPill({
  channel,
  label,
}: {
  channel: "line" | "fb" | "ig" | "web";
  label?: string;
}) {
  const map = {
    line: {
      label: "LINE OA",
      classes:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    fb: {
      label: "Facebook",
      classes:
        "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
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
      {label ?? m.label}
    </span>
  );
}
