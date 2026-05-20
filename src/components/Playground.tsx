'use client';

import { useEffect, useRef, useState } from 'react';
import {
  api,
  ApiError,
  type Message,
  type PlaygroundConversationSummary,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useT } from '@/lib/i18n/useT';
import { usePreferences } from '@/store/preferences';
import { cn } from '@/lib/cn';
import { Bot, RotateCcw, Sparkles } from '@/components/ui/Icon';

type Turn = {
  role: 'user' | 'ai' | 'notice';
  content: string;
  sources?: string[];
};

const ACTIVE_KEY = 'topdee_playground_conv';

/**
 * Embedded test chat. Persists conversations server-side (channel=dashboard),
 * remembers the active conversation_id in localStorage so a refresh keeps the
 * same thread, and exposes a picker so admins can re-open past test sessions.
 */
export function Playground({ height = 360 }: { height?: number }) {
  const t = useT();
  const locale = usePreferences((s) => s.locale);
  const isTh = locale === 'th';

  const [conversations, setConversations] = useState<PlaygroundConversationSummary[]>([]);
  const [conversationId, setConversationIdRaw] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Wraps the setter to also persist to localStorage so a refresh re-opens
  // the same test thread.
  function setConversationId(id: string | null) {
    setConversationIdRaw(id);
    if (typeof window === 'undefined') return;
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  }

  // First load: list past conversations, then either restore the
  // localStorage-pinned one or auto-pick the most recent.
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoadingHistory(true);
      try {
        const list = await api.playground.list();
        if (cancelled) return;
        setConversations(list);

        const saved =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(ACTIVE_KEY)
            : null;
        const target =
          (saved && list.find((c) => c.id === saved)?.id) ?? list[0]?.id ?? null;

        if (target) {
          await openConversation(target);
        } else {
          setConversationIdRaw(null);
          setTurns([]);
        }
      } catch { } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to the bottom whenever new turns arrive.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [turns]);

  /** Hydrate the visible chat with a server-stored conversation. */
  async function openConversation(id: string) {
    setConversationId(id);
    try {
      const msgs = await api.playground.conversation(id);
      setTurns(messagesToTurns(msgs));
    } catch { }
  }

  function startNew() {
    setConversationId(null);
    setTurns([]);
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const message = input.trim();
    if (!message || busy) return;

    setBusy(true);
    setInput('');
    setTurns((tr) => [...tr, { role: 'user', content: message }]);

    try {
      const res = await api.playground.send(message, conversationId ?? undefined);
      setConversationId(res.conversation_id);
      if (res.reply.trim()) {
        setTurns((tr) => [...tr, { role: 'ai', content: res.reply, sources: res.sources }]);
      } else {
        setTurns((tr) => [
          ...tr,
          {
            role: 'notice',
            content: isTh
              ? 'โหมดตอบด้วยทีมเปิดอยู่ AI จะไม่ตอบอัตโนมัติ'
              : 'Team manual reply mode is on. AI will not answer automatically.',
          },
        ]);
      }

      // Refresh the picker so the new (or updated) conversation surfaces.
      // No await — fire-and-forget; failures here aren't user-blocking.
      api.playground
        .list()
        .then(setConversations)
        .catch(() => {});
    } catch (err: unknown) {
      // 402 = subscription expired — show a targeted notice instead of
      // swallowing the error silently.
      const is402 = err instanceof ApiError && err.status === 402;
      if (is402) {
        setTurns((tr) => [
          ...tr,
          {
            role: 'notice' as const,
            content: isTh
              ? 'แพ็กเกจหมดอายุแล้ว — กรุณาต่ออายุเพื่อใช้งาน AI Playground ต่อ'
              : 'Your subscription has expired — please renew to continue using the AI Playground.',
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line2 bg-card">
      {/* Header — picker + "new" button */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line2 px-3 py-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-brand-600" />
          {isTh ? 'Playground' : 'Test playground'}
        </div>
        <select
          value={conversationId ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '') startNew();
            else openConversation(v);
          }}
          className="ml-auto max-w-[260px] truncate rounded-md border border-line2 bg-card px-2 py-1.5 text-xs text-ink outline-none focus:border-brand-600"
          aria-label="Conversation"
        >
          <option value="">
            {isTh ? '+ บทสนทนาใหม่' : '+ New conversation'}
          </option>
          {conversations.map((c) => (
            <option key={c.id} value={c.id}>
              {formatConversationLabel(c, isTh)}
            </option>
          ))}
        </select>
        <button
          onClick={startNew}
          className="rounded-md border border-line2 bg-card px-2.5 py-1 text-xs font-medium text-ink-muted hover:bg-muted"
        >
          ↻ {isTh ? 'ใหม่' : 'New'}
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{ height }}
        className="flex flex-col gap-3 overflow-y-auto bg-page p-4"
      >
        {loadingHistory && (
          <p className="my-auto text-center text-sm text-ink-faint">
            {t('common.loading')}
          </p>
        )}
        {!loadingHistory && turns.length === 0 && (
          <p className="my-auto text-center text-sm text-ink-faint">
            {isTh
              ? 'พิมพ์ทดสอบเพื่อดูว่า AI ตอบยังไงโดยใช้ข้อมูลของคุณ — ระบบจะบันทึกประวัติให้อัตโนมัติ'
              : 'Send a test message — the conversation is saved automatically.'}
          </p>
        )}
        {turns.map((tr, i) => (
          <div
            key={i}
            className={cn(
              'flex max-w-[85%] gap-2',
              tr.role === 'user' ? 'flex-row-reverse self-end' : 'self-start',
            )}
          >
            <div
              className={cn(
                'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold',
                tr.role === 'user'
                  ? 'bg-brand-600 text-white'
                  : tr.role === 'notice'
                    ? 'bg-muted text-ink-muted'
                    : 'bg-brand-soft text-brand-600',
              )}
            >
              {tr.role === 'user' ? (
                isTh ? 'คุณ' : 'You'
              ) : tr.role === 'notice' ? (
                'i'
              ) : (
                <Bot className="h-3.5 w-3.5" />
              )}
            </div>
            <div
              className={cn(
                'rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                tr.role === 'user'
                  ? 'rounded-br-md bg-brand-600 text-white'
                  : tr.role === 'notice'
                    ? 'rounded-bl-md border border-line2 bg-muted text-ink-muted'
                  : 'rounded-bl-md border border-line2 bg-card text-ink',
              )}
            >
              <div className="whitespace-pre-wrap">{tr.content}</div>
              {tr.sources && tr.sources.length > 0 && (
                <div className="mt-1.5 text-[11px] text-ink-faint">
                  Sources: {tr.sources.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="self-start rounded-2xl bg-card px-3 py-2 text-sm text-ink-faint">
            {isTh ? 'กำลังคิด…' : 'Thinking…'}
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-line2 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTh ? 'พิมพ์ทดสอบ...' : 'Type a test message...'}
            disabled={busy}
            className="flex-1 rounded-[10px] border border-line2 bg-card px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-brand-600"
          />
          <Button type="submit" disabled={busy || !input.trim()}>
            {t('common.send')}
          </Button>
        </div>
      </form>
    </div>
  );
}

/**
 * Convert raw Message rows from the backend into the lighter Turn shape
 * the chat UI renders. We collapse "human" and "ai" roles to a single
 * "ai" bucket because the playground only ever has the bot replying.
 */
function messagesToTurns(msgs: Message[]): Turn[] {
  return msgs.map((m) => ({
    role: m.role === 'user' ? 'user' : 'ai',
    content: m.content,
  }));
}

function formatConversationLabel(c: PlaygroundConversationSummary, isTh: boolean): string {
  const when = new Date(c.last_message_at);
  const date = when.toLocaleString(isTh ? 'th-TH' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const preview = (c.preview || '').slice(0, 40).trim();
  if (preview) return `${date} · ${preview}${preview.length === 40 ? '…' : ''}`;
  return `${date} · (${c.message_count})`;
}
