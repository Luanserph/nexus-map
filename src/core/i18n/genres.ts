import type { Locale } from './dictionaries';

const GENRE_ALIASES: Record<string, string> = {
  action: 'action',
  acao: 'action',
  accion: 'action',
  'action rpg': 'action-rpg',
  rpg: 'rpg',
  soulslike: 'soulslike',
  'open world': 'open-world',
  'mundo aberto': 'open-world',
  'mundo abierto': 'open-world',
  'sci-fi': 'sci-fi',
  'ficcao cientifica': 'sci-fi',
  metroidvania: 'metroidvania',
  indie: 'indie',
  adventure: 'adventure',
  aventura: 'adventure',
  shooter: 'shooter',
  strategy: 'strategy',
  estrategia: 'strategy',
};

const GENRE_LABELS: Record<string, Record<Locale, string>> = {
  action: { 'pt-BR': 'Ação', 'en-US': 'Action', 'es-ES': 'Acción' },
  'action-rpg': { 'pt-BR': 'Action RPG', 'en-US': 'Action RPG', 'es-ES': 'Action RPG' },
  rpg: { 'pt-BR': 'RPG', 'en-US': 'RPG', 'es-ES': 'RPG' },
  soulslike: { 'pt-BR': 'Soulslike', 'en-US': 'Soulslike', 'es-ES': 'Soulslike' },
  'open-world': { 'pt-BR': 'Mundo Aberto', 'en-US': 'Open World', 'es-ES': 'Mundo Abierto' },
  'sci-fi': { 'pt-BR': 'Sci-Fi', 'en-US': 'Sci-Fi', 'es-ES': 'Sci-Fi' },
  metroidvania: { 'pt-BR': 'Metroidvania', 'en-US': 'Metroidvania', 'es-ES': 'Metroidvania' },
  indie: { 'pt-BR': 'Indie', 'en-US': 'Indie', 'es-ES': 'Indie' },
  adventure: { 'pt-BR': 'Aventura', 'en-US': 'Adventure', 'es-ES': 'Aventura' },
  shooter: { 'pt-BR': 'Shooter', 'en-US': 'Shooter', 'es-ES': 'Shooter' },
  strategy: { 'pt-BR': 'Estratégia', 'en-US': 'Strategy', 'es-ES': 'Estrategia' },
};

function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Normalizes raw manifest genre strings into canonical IDs (e.g. "Action" and "Ação" -> "action").
 */
export function normalizeGenreKey(raw: string): string {
  const clean = stripAccents(raw);
  return GENRE_ALIASES[clean] ?? clean;
}

/**
 * Translates a canonical genre key (or raw genre string) into the active locale.
 */
export function getGenreLabel(rawOrKey: string, locale: Locale): string {
  const key = normalizeGenreKey(rawOrKey);
  return GENRE_LABELS[key]?.[locale] ?? rawOrKey;
}
