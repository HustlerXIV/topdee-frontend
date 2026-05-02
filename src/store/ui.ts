/**
 * UI store — small bag of cross-page UI state.
 * Right now: toast queue (single live toast at a time) + sidebar collapse flag.
 */
import { create } from 'zustand';

export type Toast = {
  id: number;
  message: string;
  tone?: 'default' | 'success' | 'error';
};

type UIState = {
  toast: Toast | null;
  showToast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: () => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

let nextId = 1;

export const useUI = create<UIState>((set, get) => ({
  toast: null,
  showToast: (message, tone = 'default') => {
    const id = nextId++;
    set({ toast: { id, message, tone } });
    // Auto-dismiss after 2.4s if no other toast superseded it.
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null });
      }, 2400);
    }
  },
  dismissToast: () => set({ toast: null }),

  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
