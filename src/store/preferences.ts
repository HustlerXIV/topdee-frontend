/**
 * Preferences store — locale + theme.
 *
 * Both values are persisted to localStorage so a refresh keeps the user's
 * pick. Theme also flips a class on <html> so Tailwind's dark variants kick
 * in (see PreferencesProvider).
 *
 * Default: locale = 'th', theme = 'light'. We can't read system theme during
 * SSR without a flicker, so we honor the OS preference only on the very first
 * client visit (when there's nothing in localStorage yet).
 */
import { create } from 'zustand';

export type Locale = 'th' | 'en';
export type Theme = 'light' | 'dark';

const LOCALE_KEY = 'topdee_locale';
const THEME_KEY = 'topdee_theme';

type State = {
  locale: Locale;
  theme: Theme;
  hydrated: boolean;
  hydrate: () => void;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const usePreferences = create<State>((set, get) => ({
  locale: 'th',
  theme: 'light',
  hydrated: false,

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const storedLocale = window.localStorage.getItem(LOCALE_KEY) as Locale | null;
    const storedTheme = window.localStorage.getItem(THEME_KEY) as Theme | null;

    // First-visit fallback to OS preference for theme only.
    const osPrefersDark =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    const locale: Locale = storedLocale === 'en' || storedLocale === 'th' ? storedLocale : 'th';
    const theme: Theme =
      storedTheme === 'dark' || storedTheme === 'light'
        ? storedTheme
        : osPrefersDark
        ? 'dark'
        : 'light';

    applyTheme(theme);
    set({ locale, theme, hydrated: true });
  },

  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_KEY, locale);
    }
    set({ locale });
  },

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_KEY, theme);
    }
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
