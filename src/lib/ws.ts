/**
 * Singleton WebSocket manager with automatic reconnect.
 *
 * Usage:
 *   const unsub = wsManager.subscribe((event) => { ... });
 *   wsManager.connect(token);   // call once after login
 *   wsManager.disconnect();     // call on logout
 *   unsub();                    // stop receiving events
 */

const WS_BASE =
  typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_WS_URL ||
        (window.location.protocol === 'https:' ? 'wss' : 'ws') +
          '://' +
          (process.env.NEXT_PUBLIC_API_HOST || window.location.host.replace(/:\d+$/, ':8080')) +
          '/ws')
    : '';

type WSEvent = {
  type: string;
  [key: string]: unknown;
};

type Listener = (event: WSEvent) => void;

class WSManager {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private listeners = new Set<Listener>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retryDelay = 2000;
  private intentionallyClosed = false;

  connect(token: string) {
    this.token = token;
    this.intentionallyClosed = false;
    this.open();
  }

  disconnect() {
    this.intentionallyClosed = true;
    this.token = null;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private open() {
    if (!this.token || !WS_BASE || typeof window === 'undefined') return;
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;

    const url = `${WS_BASE}?token=${encodeURIComponent(this.token)}`;
    const sock = new WebSocket(url);
    this.socket = sock;

    sock.onopen = () => {
      this.retryDelay = 2000; // reset backoff on success
    };

    sock.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as WSEvent;
        this.listeners.forEach((fn) => fn(data));
      } catch {
        // ignore malformed frames
      }
    };

    sock.onclose = () => {
      this.socket = null;
      if (!this.intentionallyClosed && this.token) {
        // Exponential backoff, cap at 30 s
        this.retryTimer = setTimeout(() => {
          this.retryDelay = Math.min(this.retryDelay * 1.5, 30_000);
          this.open();
        }, this.retryDelay);
      }
    };

    sock.onerror = () => {
      sock.close();
    };
  }
}

export const wsManager = new WSManager();
