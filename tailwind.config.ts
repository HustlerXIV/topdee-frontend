import type { Config } from 'tailwindcss';

/**
 * Design tokens — split into two layers:
 *
 *  1. Brand/channel palette: stays the same in light & dark.
 *  2. Surface/text/border tokens: come from CSS variables defined in
 *     globals.css so flipping `.dark` on <html> retints the whole UI.
 *
 *  Using `rgb(var(--token) / <alpha-value>)` lets you keep using
 *  Tailwind opacity modifiers (e.g. bg-card/40) on the semantic colors.
 */
const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Brand & channel (theme-independent) ─────────────────────
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#6c47ff',
          700: '#5b21b6',
          800: '#4c1d95',
          900: '#3b0764',
        },
        line: { DEFAULT: '#06a63e', soft: '#e6f9ef' },
        fb: { DEFAULT: '#1877f2', soft: '#e8f0ff' },
        ig: { DEFAULT: '#e1306c', soft: '#fff0f5' },
        web: { DEFAULT: '#6c47ff', soft: '#f0f4ff' },

        // ── Semantic (theme-aware via CSS vars) ─────────────────────
        // Page / card / muted surfaces
        page: 'rgb(var(--bg-page) / <alpha-value>)',
        card: 'rgb(var(--bg-card) / <alpha-value>)',
        elevated: 'rgb(var(--bg-elevated) / <alpha-value>)',
        muted: 'rgb(var(--bg-muted) / <alpha-value>)',

        // Borders
        line2: 'rgb(var(--border) / <alpha-value>)',     // default border
        'line2-strong': 'rgb(var(--border-strong) / <alpha-value>)',

        // Text
        ink: 'rgb(var(--text-strong) / <alpha-value>)',  // primary text
        'ink-muted': 'rgb(var(--text-muted) / <alpha-value>)',
        'ink-faint': 'rgb(var(--text-faint) / <alpha-value>)',
        'ink-invert': 'rgb(var(--text-invert) / <alpha-value>)',

        // Soft brand for cards/badges (slightly different in dark)
        'brand-soft': 'rgb(var(--brand-soft) / <alpha-value>)',
        'brand-softer': 'rgb(var(--brand-softer) / <alpha-value>)',

        // Surface tokens kept from before for backward compat
        surface: {
          page: 'rgb(var(--bg-page) / <alpha-value>)',
          card: 'rgb(var(--bg-card) / <alpha-value>)',
          subtle: 'rgb(var(--bg-muted) / <alpha-value>)',
          muted: 'rgb(var(--bg-muted) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: [
          'Segoe UI',
          'system-ui',
          '-apple-system',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.08)',
        'brand-glow': '0 8px 40px rgba(108,71,255,0.12)',
        'brand-strong': '0 12px 40px rgba(108,71,255,0.10)',
      },
      backgroundImage: {
        'brand-gradient':
          'linear-gradient(135deg, #6c47ff 0%, #a78bfa 50%, #38bdf8 100%)',
        'brand-soft-gradient': 'linear-gradient(135deg,#f0f4ff 0%,#faf5ff 100%)',
        'brand-soft-gradient-dark':
          'linear-gradient(135deg,#1e1b3b 0%,#241a3f 100%)',
        'plan-gradient': 'linear-gradient(135deg,#6c47ff,#a78bfa)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        backdropIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        dialogIn: {
          '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease',
        backdropIn: 'backdropIn 0.15s ease',
        dialogIn: 'dialogIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      },
    },
  },
  plugins: [],
};

export default config;
