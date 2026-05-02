'use client';

import { usePreferences } from '@/store/preferences';
import { translate, type DictKey } from './dictionary';

/**
 * `useT()` returns a translator bound to the current locale.
 *
 *   const t = useT();
 *   <h1>{t('inbox.filter.all')}</h1>
 *
 * Falls back to the key itself if a translation is missing, which is fine
 * for development — strings appear literally so it's obvious what to add.
 */
export function useT() {
  const locale = usePreferences((s) => s.locale);
  return (key: DictKey) => translate(key, locale);
}
