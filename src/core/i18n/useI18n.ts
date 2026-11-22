import { createContext, useContext } from 'react';
import type { MapMarker } from '../../types/schema';
import { DICTIONARIES } from './dictionaries';
import type { Locale, TranslationKey } from './dictionaries';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey) => string;
  resolveMarkerTitle: (marker: MapMarker) => string;
  resolveMarkerDescription: (marker: MapMarker) => string;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: 'pt-BR',
  setLocale: () => {},
  t: (key) => DICTIONARIES['pt-BR'][key],
  resolveMarkerTitle: (marker) => marker.title,
  resolveMarkerDescription: (marker) => marker.description,
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
