/**
 * Auth store — keeps the JWT in a cookie (8-hour max-age) so the rest of the
 * app can subscribe to login state without prop drilling, and so an expired
 * session can no longer masquerade as logged-in: once the cookie's max-age
 * elapses the browser drops it, and we also reject a token whose own `exp`
 * claim has passed on hydrate.
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
import {
  getCookie,
  setCookie,
  deleteCookie,
  isJwtExpired,
  TOKEN_MAX_AGE,
} from '@/lib/cookies';

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
  setUser: (user: User) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;

    // Prefer the cookie. One-time migration: an older session may still have
    // its token in localStorage — move it into the cookie if it's still valid,
    // then clear the localStorage copy so we have a single source of truth.
    let token = getCookie(TOKEN_KEY);
    const legacyToken = window.localStorage.getItem(TOKEN_KEY);
    if (legacyToken) window.localStorage.removeItem(TOKEN_KEY);
    if (!token && legacyToken && !isJwtExpired(legacyToken)) {
      token = legacyToken;
      setCookie(TOKEN_KEY, token, TOKEN_MAX_AGE);
    }

    // An expired token is treated as no session at all.
    if (token && isJwtExpired(token)) {
      deleteCookie(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
      set({ token: null, user: null, hydrated: true });
      return;
    }

    const userRaw = window.localStorage.getItem(USER_KEY);
    let user: User | null = null;
    if (userRaw) {
      try {
        user = JSON.parse(userRaw) as User;
      } catch {
        user = null;
      }
    }
    // Always sync role + is_admin from the live JWT so that an admin flag
    // set after a session was created (or a stale cached value) is never
    // permanently stuck.  The backend re-verifies the signature on every
    // request so there is no security risk in trusting the decoded payload here.
    if (token && user) {
      const claims = decodeClaimsFromToken(token);
      if (!user.role && claims?.role) user = { ...user, role: claims.role };
      if (claims?.isAdmin !== undefined) {
        user = { ...user, isAdmin: claims.isAdmin };
      }
    }
    set({ token, user, hydrated: true });
  },

  setSession: (token, user) => {
    const claims = decodeClaimsFromToken(token);
    if (!user.role && claims?.role) user = { ...user, role: claims.role };
    // Always take is_admin from the JWT — never let a stale caller-supplied
    // value win over what the server actually signed.
    if (claims?.isAdmin !== undefined) {
      user = { ...user, isAdmin: claims.isAdmin };
    }
    if (typeof window !== 'undefined') {
      setCookie(TOKEN_KEY, token, TOKEN_MAX_AGE);
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ token, user });
  },

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      deleteCookie(TOKEN_KEY);
      window.localStorage.removeItem(TOKEN_KEY); // clear any legacy copy too
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
