import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { MapMarker } from '../../types/schema';
import { decodeHtmlEntities } from '../utils/text';
import { DICTIONARIES } from './dictionaries';
import type { Locale, TranslationKey } from './dictionaries';
import { I18nContext } from './useI18n';
import type { I18nContextValue } from './useI18n';

const STORAGE_KEY_LOCALE = 'nexus-maps:locale';

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_LOCALE);
    if (saved === 'pt-BR' || saved === 'en-US' || saved === 'es-ES') {
      return saved;
    }
  } catch {
    // Ignore storage errors
  }
  return 'pt-BR';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY_LOCALE, next);
      document.documentElement.lang = next;
    } catch {
      // Ignore storage errors
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return DICTIONARIES[locale][key] ?? DICTIONARIES['pt-BR'][key] ?? key;
    },
    [locale]
  );

  const resolveMarkerTitle = useCallback(
    (marker: MapMarker): string => {
      return decodeHtmlEntities(
        marker.translations?.[locale]?.title ?? marker.title
      );
    },
    [locale]
  );

  const resolveMarkerDescription = useCallback(
    (marker: MapMarker): string => {
      return decodeHtmlEntities(
        marker.translations?.[locale]?.description ?? marker.description
      );
    },
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      resolveMarkerTitle,
      resolveMarkerDescription,
    }),
    [locale, setLocale, t, resolveMarkerTitle, resolveMarkerDescription]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
