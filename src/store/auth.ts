/**
 * Auth store — wraps the JWT in localStorage so the rest of the app can
 * subscribe to login state without prop drilling.
 *
 * The Go backend returns { token, user } from /auth/login, /auth/register,
 * and /auth/accept-invite. The user object includes the role, which we
 * persist locally so the UI can gate things like the team-invite form
 * without round-tripping the API just to know who's logged in.
 *
 * If `role` is missing on a hydrated session (e.g. an old token cached
 * from before role-based auth shipped), `decodeRoleFromToken` falls back
 * to parsing it out of the JWT payload directly.
 */
import { create } from 'zustand';

const TOKEN_KEY = 'topdee_token';
const USER_KEY = 'topdee_user';

export type Role = 'owner' | 'admin' | 'agent' | 'viewer' | '';

export type User = {
  name?: string;
  email: string;
  workspace: string; // tenant_name set during register/onboarding
  role?: Role;
  isAdmin?: boolean; // platform-wide admin (Topdee staff)
};

type AuthState = {
  token: string | null;
  user: User | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const userRaw = window.localStorage.getItem(USER_KEY);
    let user: User | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as User;
      } catch {
        user = null;
      }
    }
    // Backfill role + is_admin from the JWT if missing on the cached user.
    if (token && user) {
      const claims = decodeClaimsFromToken(token);
      if (!user.role && claims?.role) user = { ...user, role: claims.role };
      if (user.isAdmin === undefined && claims?.isAdmin !== undefined) {
        user = { ...user, isAdmin: claims.isAdmin };
      }
    }
    set({ token, user, hydrated: true });
  },

  setSession: (token, user) => {
    const claims = decodeClaimsFromToken(token);
    if (!user.role && claims?.role) user = { ...user, role: claims.role };
    if (user.isAdmin === undefined && claims?.isAdmin !== undefined) {
      user = { ...user, isAdmin: claims.isAdmin };
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null });
  },
}));

/**
 * Pull `role` + `is_admin` claims out of a JWT without verifying its
 * signature — we don't need to (the backend re-verifies on every request);
 * we just need to know what to render for.
 */
function decodeClaimsFromToken(
  token: string,
): { role?: Role; isAdmin?: boolean } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    const out: { role?: Role; isAdmin?: boolean } = {};
    if (
      payload?.role === 'owner' ||
      payload?.role === 'admin' ||
      payload?.role === 'agent' ||
      payload?.role === 'viewer'
    ) {
      out.role = payload.role;
    }
    if (typeof payload?.is_admin === 'boolean') out.isAdmin = payload.is_admin;
    return out;
  } catch {
    return null;
  }
}
