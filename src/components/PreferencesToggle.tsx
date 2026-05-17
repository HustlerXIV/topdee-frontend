'use client';

import { usePreferences, type Locale, type Theme } from '@/store/preferences';
import { useT } from '@/lib/i18n/useT';
import { cn } from '@/lib/cn';
import { Sun, Moon, type IconName, Icon } from '@/components/ui/Icon';

/**
 * Compact toggle pair (language + theme) used in the sidebar footer.
 * Single row, segmented buttons.
 */
export function CompactPreferences({ className }: { className?: string }) {
  const t = useT();
  const { locale, theme, setLocale, toggleTheme } = usePreferences();

  return (
    <div className={cn('flex items-center gap-1.5 px-2 py-2', className)}>
      <Segmented
        options={[
          { value: 'th', label: 'TH' },
          { value: 'en', label: 'EN' },
        ]}
        value={locale}
        onChange={(v) => setLocale(v as Locale)}
        ariaLabel={t('settings.appearance.lang')}
      />
      <button
        type="button"
        onClick={toggleTheme}
        title={t('settings.appearance.theme')}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-line2 bg-card text-ink-muted transition-colors hover:bg-muted md:h-8 md:w-8"
        aria-label={t('settings.appearance.theme')}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
}

/**
 * Wider, labelled version used inside the Settings → Account → Appearance card.
 */
export function PreferencesPanel() {
  const t = useT();
  const { locale, theme, setLocale, setTheme } = usePreferences();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-[10px] bg-page p-4">
        <div>
          <div className="text-sm font-semibold text-ink">
            {t('settings.appearance.lang')}
          </div>
          <div className="text-xs text-ink-faint">
            {t('common.lang.th')} · {t('common.lang.en')}
          </div>
        </div>
        <Segmented
          options={[
            { value: 'th', label: t('common.lang.th') },
            { value: 'en', label: t('common.lang.en') },
          ]}
          value={locale}
          onChange={(v) => setLocale(v as Locale)}
          ariaLabel={t('settings.appearance.lang')}
        />
      </div>
      <div className="flex items-center justify-between gap-3 rounded-[10px] bg-page p-4">
        <div>
          <div className="text-sm font-semibold text-ink">
            {t('settings.appearance.theme')}
          </div>
          <div className="text-xs text-ink-faint">
            {t('common.theme.light')} · {t('common.theme.dark')}
          </div>
        </div>
        <Segmented
          options={[
            { value: 'light', label: t('common.theme.light'), iconName: 'light' },
            { value: 'dark', label: t('common.theme.dark'), iconName: 'dark' },
          ]}
          value={theme}
          onChange={(v) => setTheme(v as Theme)}
          ariaLabel={t('settings.appearance.theme')}
        />
      </div>
    </div>
  );
}

function Segmented({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: string; label: string; iconName?: IconName }[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="inline-flex rounded-[10px] border border-line2 bg-card p-0.5"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold transition-colors md:px-3 md:py-1.5 md:text-[13px]',
              active
                ? 'bg-brand-soft text-brand-600'
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {opt.iconName && <Icon name={opt.iconName} className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
