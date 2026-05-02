/**
 * `cn` — tiny class-name combiner.
 * Keeps the bundle small (no clsx/tailwind-merge dependency).
 * Pass strings, falsy values get dropped.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
