import type { Locale } from './dictionaries';

const GENRE_ALIASES: Record<string, string> = {
  action: 'action',
  acao: 'action',
  accion: 'action',
  'action rpg': 'action-rpg',
  'action-rpg': 'action-rpg',
  rpg: 'rpg',
  jrpg: 'jrpg',
  mmorpg: 'mmorpg',
  soulslike: 'soulslike',
  'open world': 'open-world',
  'open-world': 'open-world',
  'mundo aberto': 'open-world',
  'mundo abierto': 'open-world',
  'sci-fi': 'sci-fi',
  'ficcao cientifica': 'sci-fi',
  'ciencia ficcion': 'sci-fi',
  metroidvania: 'metroidvania',
  indie: 'indie',
  adventure: 'adventure',
  aventura: 'adventure',
  shooter: 'shooter',
  fps: 'fps',
  strategy: 'strategy',
  estrategia: 'strategy',
  'beat em up': 'beat-em-up',
  'beat-em-up': 'beat-em-up',
  classic: 'classic',
  classico: 'classic',
  clasico: 'classic',
  'co-op': 'co-op',
  coop: 'co-op',
  comedy: 'comedy',
  comedia: 'comedy',
  racing: 'racing',
  corrida: 'racing',
  carreras: 'racing',
  'dungeon crawler': 'dungeon-crawler',
  'dungeon-crawler': 'dungeon-crawler',
  exploration: 'exploration',
  exploracao: 'exploration',
  exploracion: 'exploration',
  'dark fantasy': 'dark-fantasy',
  'dark-fantasy': 'dark-fantasy',
  'fantasia sombria': 'dark-fantasy',
  'fantasia oscura': 'dark-fantasy',
  'hack and slash': 'hack-and-slash',
  'hack-and-slash': 'hack-and-slash',
  platformer: 'platformer',
  plataforma: 'platformer',
  plataformas: 'platformer',
  sandbox: 'sandbox',
  simulation: 'simulation',
  simulacao: 'simulation',
  simulacion: 'simulation',
  survival: 'survival',
  sobrevivencia: 'survival',
  supervivencia: 'survival',
  'survival horror': 'survival-horror',
  'survival-horror': 'survival-horror',
  stealth: 'stealth',
  furtividade: 'stealth',
  sigilo: 'stealth',
  tactical: 'tactical',
  tatico: 'tactical',
  tactico: 'tactical',
  'psychological horror': 'psychological-horror',
  'psychological-horror': 'psychological-horror',
  'terror psicologico': 'psychological-horror',
  zombies: 'zombies',
};

const GENRE_LABELS: Record<string, Record<Locale, string>> = {
  action: { 'pt-BR': 'Ação', 'en-US': 'Action', 'es-ES': 'Acción' },
  'action-rpg': { 'pt-BR': 'Action RPG', 'en-US': 'Action RPG', 'es-ES': 'Action RPG' },
  rpg: { 'pt-BR': 'RPG', 'en-US': 'RPG', 'es-ES': 'RPG' },
  jrpg: { 'pt-BR': 'JRPG', 'en-US': 'JRPG', 'es-ES': 'JRPG' },
  mmorpg: { 'pt-BR': 'MMORPG', 'en-US': 'MMORPG', 'es-ES': 'MMORPG' },
  soulslike: { 'pt-BR': 'Soulslike', 'en-US': 'Soulslike', 'es-ES': 'Soulslike' },
  'open-world': { 'pt-BR': 'Mundo Aberto', 'en-US': 'Open World', 'es-ES': 'Mundo Abierto' },
  'sci-fi': { 'pt-BR': 'Ficção Científica', 'en-US': 'Sci-Fi', 'es-ES': 'Ciencia Ficción' },
  metroidvania: { 'pt-BR': 'Metroidvania', 'en-US': 'Metroidvania', 'es-ES': 'Metroidvania' },
  indie: { 'pt-BR': 'Indie', 'en-US': 'Indie', 'es-ES': 'Indie' },
  adventure: { 'pt-BR': 'Aventura', 'en-US': 'Adventure', 'es-ES': 'Aventura' },
  shooter: { 'pt-BR': 'Shooter', 'en-US': 'Shooter', 'es-ES': 'Shooter' },
  fps: { 'pt-BR': 'FPS', 'en-US': 'FPS', 'es-ES': 'FPS' },
  strategy: { 'pt-BR': 'Estratégia', 'en-US': 'Strategy', 'es-ES': 'Estrategia' },
  'beat-em-up': { 'pt-BR': 'Beat em Up', 'en-US': 'Beat em Up', 'es-ES': 'Beat em Up' },
  classic: { 'pt-BR': 'Clássico', 'en-US': 'Classic', 'es-ES': 'Clásico' },
  'co-op': { 'pt-BR': 'Co-op', 'en-US': 'Co-op', 'es-ES': 'Co-op' },
  comedy: { 'pt-BR': 'Comédia', 'en-US': 'Comedy', 'es-ES': 'Comedia' },
  racing: { 'pt-BR': 'Corrida', 'en-US': 'Racing', 'es-ES': 'Carreras' },
  'dungeon-crawler': {
    'pt-BR': 'Dungeon Crawler',
    'en-US': 'Dungeon Crawler',
    'es-ES': 'Dungeon Crawler',
  },
  exploration: { 'pt-BR': 'Exploração', 'en-US': 'Exploration', 'es-ES': 'Exploración' },
  'dark-fantasy': {
    'pt-BR': 'Fantasia Sombria',
    'en-US': 'Dark Fantasy',
    'es-ES': 'Fantasía Oscura',
  },
  'hack-and-slash': {
    'pt-BR': 'Hack and Slash',
    'en-US': 'Hack and Slash',
    'es-ES': 'Hack and Slash',
  },
  platformer: { 'pt-BR': 'Plataforma', 'en-US': 'Platformer', 'es-ES': 'Plataformas' },
  sandbox: { 'pt-BR': 'Sandbox', 'en-US': 'Sandbox', 'es-ES': 'Sandbox' },
  simulation: { 'pt-BR': 'Simulação', 'en-US': 'Simulation', 'es-ES': 'Simulación' },
  survival: { 'pt-BR': 'Sobrevivência', 'en-US': 'Survival', 'es-ES': 'Supervivencia' },
  'survival-horror': {
    'pt-BR': 'Survival Horror',
    'en-US': 'Survival Horror',
    'es-ES': 'Survival Horror',
  },
  stealth: { 'pt-BR': 'Stealth', 'en-US': 'Stealth', 'es-ES': 'Sigilo' },
  tactical: { 'pt-BR': 'Tático', 'en-US': 'Tactical', 'es-ES': 'Táctico' },
  'psychological-horror': {
    'pt-BR': 'Terror Psicológico',
    'en-US': 'Psychological Horror',
    'es-ES': 'Terror Psicológico',
  },
  zombies: { 'pt-BR': 'Zombies', 'en-US': 'Zombies', 'es-ES': 'Zombies' },
};

const UPPERCASE_ACRONYMS = new Set(['rpg', 'jrpg', 'mmorpg', 'fps', 'tps', 'rts', 'moba']);

function stripAccents(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function formatFallbackGenre(raw: string): string {
  return raw
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase();
      if (UPPERCASE_ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Normalizes raw manifest genre strings into canonical IDs (e.g. "Action" and "Ação" -> "action").
 */
export function normalizeGenreKey(raw: string): string {
  const clean = stripAccents(raw);
  return GENRE_ALIASES[clean] ?? clean;
}

/**
 * Translates a canonical genre key (or raw genre string) into the active locale,
 * always returning properly accented and capitalized display names.
 */
export function getGenreLabel(rawOrKey: string, locale: Locale): string {
  const key = normalizeGenreKey(rawOrKey);
  return GENRE_LABELS[key]?.[locale] ?? formatFallbackGenre(rawOrKey);
}
