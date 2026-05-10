/**
 * Inbox badge store — tracks the number of conversations where the customer
 * spoke last (i.e., needs a reply). Updated in real-time via WebSocket and
 * re-fetched on demand.
 *
 * "Unread" here means: conversations waiting for team/AI reply.
 * The backend counts conversations whose last message role is "user".
 */
import { create } from 'zustand';
import { api } from '@/lib/api';
import { wsManager } from '@/lib/ws';

type State = {
  count: number;
  /** Connect WebSocket + fetch initial count. Call once after login. */
  init: (token: string) => void;
  /** Refetch count from the API (e.g., after navigating to /inbox). */
  refresh: () => Promise<void>;
  /** Set count directly (from WS event). */
  setCount: (n: number) => void;
  /** Tear down the WS subscription. Call on logout. */
  teardown: () => void;
};

let unsubWS: (() => void) | null = null;

export const useInboxBadge = create<State>((set, get) => ({
  count: 0,

  init: (token: string) => {
    // Connect (or reconnect) the WebSocket with the current token.
    wsManager.connect(token);

    // Subscribe to inbox_update events.
    if (unsubWS) unsubWS();
    unsubWS = wsManager.subscribe((event) => {
      if (event.type === 'inbox_update' && typeof event.count === 'number') {
        set({ count: event.count });
      }
    });

    // Fetch the initial count.
    get().refresh();
  },

  refresh: async () => {
    try {
      const data = await api.inbox.unreadCount();
      set({ count: data.count });
    } catch {
      // Non-fatal — badge just stays at last known value.
    }
  },

  setCount: (count) => set({ count }),

  teardown: () => {
    if (unsubWS) {
      unsubWS();
      unsubWS = null;
    }
    wsManager.disconnect();
    set({ count: 0 });
  },
}));
