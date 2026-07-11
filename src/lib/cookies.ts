/**
 * Tiny cookie helpers + JWT expiry check.
 *
 * The auth token is stored in a first-party cookie (not httpOnly, because the
 * API client reads it in JS to set the `Authorization: Bearer` header) with an
 * 8-hour max-age. When the cookie's max-age elapses the browser drops it on its
 * own, so a stale session can no longer masquerade as logged-in.
 */

const isBrowser = () => typeof window !== 'undefined';

/** 8 hours, in seconds — keep in sync with backend JWT_TTL_HOURS. */
export const TOKEN_MAX_AGE = 8 * 60 * 60;

export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (!isBrowser()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax${secure}`;
}

export function getCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const prefix = `${name}=`;
  const row = document.cookie
    .split('; ')
    .find((r) => r.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : null;
}

export function deleteCookie(name: string): void {
  if (!isBrowser()) return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

/**
 * Returns true if the JWT's `exp` claim is in the past (or the token is
 * malformed). Signature is NOT verified — the backend does that on every
 * request; we only need to know whether it's worth sending at all.
 */
export function isJwtExpired(token: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 3) return true;
  try {
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')),
    );
    if (typeof payload?.exp !== 'number') return false; // no exp = don't force-expire
    // exp is in seconds since epoch.
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}
