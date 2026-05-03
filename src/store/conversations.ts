/**
 * Conversations store — drives the Inbox page UI from the backend's
 * /inbox endpoints (real LINE / Facebook / … conversations). Messages
 * for a conversation are loaded lazily on first selection and cached
 * here so re-selecting is instant.
 */
import { create } from 'zustand';
import { api, ApiError, type InboxConversation, type Message } from '@/lib/api';

export type Channel = 'line' | 'fb' | 'ig' | 'web';
export type ConvKind = 'ai' | 'team';

export type ConvMessage = {
  id: string;
  direction: 'in' | 'out';
  author: 'customer' | 'ai' | 'agent';
  text: string;
  time: string; // already formatted for display
};

export type Conversation = {
  id: string;
  customerName: string;
  initials: string;
  avatarTone: 'purple' | 'blue' | 'pink' | 'yellow' | 'green' | 'gray';
  channel: Channel;
  preview: string;
  time: string;
  unread: number;
  kind: ConvKind;
  online?: boolean;
  messages: ConvMessage[];
  /** Whether messages[] has been fetched (vs just loaded from the list). */
  loaded?: boolean;
};

type ConvFilter = 'all' | 'ai' | 'team';

type State = {
  conversations: Conversation[];
  selectedId: string | null;
  filter: ConvFilter;
  search: string;
  loading: boolean;
  error: string | null;
  select: (id: string) => void;
  setFilter: (f: ConvFilter) => void;
  setSearch: (s: string) => void;
  appendMessage: (id: string, msg: ConvMessage) => void;
  /** Fetch the conversation list. Idempotent — safe to call repeatedly. */
  refresh: () => Promise<void>;
  /** Load messages for one conversation. Cached after first call;
   * pass `force=true` to bypass the cache (used by the polling loop and
   * after a successful send). */
  loadMessages: (id: string, force?: boolean) => Promise<void>;
  /** Send a manual reply through the platform's push API. Throws on
   * failure so callers can show a toast. */
  sendMessage: (id: string, text: string) => Promise<void>;
};

// ── Mappers ──────────────────────────────────────────────────────────
//
// Backend uses provider names ("facebook" / "line"). The UI store uses
// short tags ("fb" / "line" / "ig" / "web") that match the existing
// ChannelDot + i18n. Map between them here so the rest of the app
// doesn't need to know.

const CHANNEL_FROM_API: Record<string, Channel> = {
  line: 'line',
  facebook: 'fb',
  fb: 'fb',
  instagram: 'ig',
  ig: 'ig',
  web: 'web',
  webchat: 'web',
};

const TONES: Conversation['avatarTone'][] = [
  'purple',
  'blue',
  'pink',
  'yellow',
  'green',
  'gray',
];

/** Stable per-customer avatar tone — same user always gets the same color. */
function toneFor(seed: string): Conversation['avatarTone'] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TONES[Math.abs(h) % TONES.length];
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  // Most "LINE User abcd12" style names — take the last token's first char.
  return parts[parts.length - 1][0]?.toUpperCase() ?? '?';
}

/** "5 min", "2 ชม.", "yesterday" — quick relative format without a heavy
 * dep. Falls back to localized hh:mm for very fresh times. */
function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const diffSec = Math.max(0, (Date.now() - t) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} h`;
  return `${Math.floor(diffSec / 86400)} d`;
}

/** Strip the provider prefix our backend uses for conversation_id. We can
 * keep using the full id to call /messages, but tone/initials shouldn't
 * change just because the customer changed channels. */
function customerKey(c: InboxConversation): string {
  return c.external_user_id || c.id;
}

/** Last sender's role determines whether the row gets the "ai" or "team"
 * tab tag. AI replies → "ai"; human agent replies → "team"; if the
 * customer was the last to speak, classify by *whether* an AI ever
 * replied — but with what we have we just split on last_sender_role. */
function kindFor(role: InboxConversation['last_sender_role']): ConvKind {
  return role === 'human' ? 'team' : 'ai';
}

function fromApiList(rows: InboxConversation[]): Conversation[] {
  return rows.map((r) => ({
    id: r.id,
    customerName: r.customer_name,
    initials: initialsFor(r.customer_name),
    avatarTone: toneFor(customerKey(r)),
    channel: CHANNEL_FROM_API[r.channel] ?? 'web',
    preview: r.preview,
    time: relativeTime(r.last_message_at),
    unread: 0, // no read-tracking yet on the backend
    kind: kindFor(r.last_sender_role),
    messages: [],
    loaded: false,
  }));
}

/** Format a server timestamp as a short hh:mm — used for individual
 * messages inside a conversation. */
function shortTime(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fromApiMessages(msgs: Message[]): ConvMessage[] {
  return msgs.map((m) => {
    const isOutbound = m.role === 'ai' || m.role === 'human';
    return {
      id: m.id,
      direction: isOutbound ? 'out' : 'in',
      author: m.role === 'ai' ? 'ai' : m.role === 'human' ? 'agent' : 'customer',
      text: m.content,
      time: shortTime(m.created_at),
    };
  });
}

// ── Store ────────────────────────────────────────────────────────────

export const useConversations = create<State>((set, get) => ({
  conversations: [],
  selectedId: null,
  filter: 'all',
  search: '',
  loading: false,
  error: null,

  select: (id) => set({ selectedId: id }),
  setFilter: (filter) => set({ filter }),
  setSearch: (search) => set({ search }),

  appendMessage: (id, msg) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [...c.messages, msg],
              preview: msg.text,
              time: 'just now',
            }
          : c,
      ),
    })),

  refresh: async () => {
    set({ loading: true, error: null });
    try {
      const rows = await api.inbox.list();
      const fresh = fromApiList(rows);
      // Preserve already-loaded messages across refreshes — only the
      // metadata (preview, time, unread) changes. Match by id.
      set((s) => {
        const prev = new Map(s.conversations.map((c) => [c.id, c]));
        const merged = fresh.map((c) => {
          const old = prev.get(c.id);
          if (old?.loaded) {
            return { ...c, messages: old.messages, loaded: true };
          }
          return c;
        });
        return {
          conversations: merged,
          selectedId: s.selectedId ?? merged[0]?.id ?? null,
          loading: false,
        };
      });
    } catch (e) {
      // 401 means session expired — leave the user to the global redirect
      // logic instead of showing a noisy error here.
      if (e instanceof ApiError && e.status === 401) {
        set({ loading: false });
        return;
      }
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'failed',
      });
    }
  },

  loadMessages: async (id, force = false) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    if (conv.loaded && !force) return;
    try {
      const msgs = await api.inbox.messages(id);
      const mapped = fromApiMessages(msgs);
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id ? { ...c, messages: mapped, loaded: true } : c,
        ),
      }));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return;
      set({ error: e instanceof Error ? e.message : 'failed to load messages' });
    }
  },

  sendMessage: async (id, text) => {
    // Optimistic append — the message shows up in the bubble list
    // immediately, with a placeholder id we'll replace once the server
    // confirms. If the send fails, we roll the optimistic message back
    // out so the user sees an accurate transcript.
    const tempId = 'tmp-' + Date.now();
    const optimistic: ConvMessage = {
      id: tempId,
      direction: 'out',
      author: 'agent',
      text,
      time: new Date().toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [...c.messages, optimistic],
              preview: text,
              time: 'just now',
            }
          : c,
      ),
    }));

    try {
      const saved = await api.inbox.send(id, text);
      // Replace the temp message with the canonical server one.
      set((s) => ({
        conversations: s.conversations.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            messages: c.messages.map((m) =>
              m.id === tempId
                ? {
                    id: saved.id,
                    direction: 'out',
                    author: 'agent',
                    text: saved.content,
                    time: shortTime(saved.created_at),
                  }
                : m,
            ),
          };
        }),
      }));
    } catch (e) {
      // Roll back the optimistic append.
      set((s) => ({
        conversations: s.conversations.map((c) =>
          c.id === id
            ? { ...c, messages: c.messages.filter((m) => m.id !== tempId) }
            : c,
        ),
      }));
      throw e;
    }
  },
}));
