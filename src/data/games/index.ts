import type { GameManifest, HubGameEntry, MapMarker } from '../../types/schema';
import cyberpunkManifest from './cyberpunk-2077/manifest.json';
import cyberpunkMarkers from './cyberpunk-2077/markers.json';
import eldenRingManifest from './elden-ring/manifest.json';
import eldenRingMarkers from './elden-ring/markers.json';
import hollowKnightManifest from './hollow-knight/manifest.json';
import hollowKnightMarkers from './hollow-knight/markers.json';

export const GAME_MANIFESTS: GameManifest[] = [
  eldenRingManifest as GameManifest,
  cyberpunkManifest as GameManifest,
  hollowKnightManifest as GameManifest,
];

const markersBySlug: Record<string, MapMarker[]> = {
  'elden-ring': eldenRingMarkers as unknown as MapMarker[],
  'cyberpunk-2077': cyberpunkMarkers as unknown as MapMarker[],
  'hollow-knight': hollowKnightMarkers as unknown as MapMarker[],
};

/**
 * Mocked local progress for Etapa 1-3 (replaced by Dexie.js IndexedDB store in Etapa 4).
 */
const mockProgressBySlug: Record<string, HubGameEntry['progress']> = {
  'elden-ring': {
    gameSlug: 'elden-ring',
    foundMarkersCount: 1436,
    lastVisitedAt: 'Há 2 horas',
    activeLayerId: 'surface',
  },
  'cyberpunk-2077': {
    gameSlug: 'cyberpunk-2077',
    foundMarkersCount: 1860,
    lastVisitedAt: 'Ontem',
    activeLayerId: 'dogtown',
  },
  'hollow-knight': {
    gameSlug: 'hollow-knight',
    foundMarkersCount: 0,
    activeLayerId: 'hallownest',
  },
};

export const HUB_GAMES: HubGameEntry[] = GAME_MANIFESTS.map((manifest) => ({
  manifest,
  progress: mockProgressBySlug[manifest.slug] ?? {
    gameSlug: manifest.slug,
    foundMarkersCount: 0,
    activeLayerId: manifest.maps[0]?.id,
  },
}));

export function getGameManifestBySlug(slug: string): GameManifest | undefined {
  return GAME_MANIFESTS.find((manifest) => manifest.slug === slug);
}

export function getHubGameBySlug(slug: string): HubGameEntry | undefined {
  return HUB_GAMES.find((entry) => entry.manifest.slug === slug);
}

export function getMarkersByGameSlug(slug: string): MapMarker[] {
  return markersBySlug[slug] ?? [];
}

export function getMarkersByMap(slug: string, mapId: string): MapMarker[] {
  return getMarkersByGameSlug(slug).filter((marker) => marker.mapId === mapId);
}

export function getTotalPinsCount(manifest: GameManifest): number {
  return manifest.maps.reduce((sum, mapLayer) => sum + mapLayer.pinsCount, 0);
}

export function getAllGenres(games: HubGameEntry[]): string[] {
  const genreSet = new Set<string>();
  for (const entry of games) {
    for (const genre of entry.manifest.genres) {
      genreSet.add(genre);
    }
  }
  return Array.from(genreSet).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export function getCompletionPercent(entry: HubGameEntry): number {
  const totalPins = getTotalPinsCount(entry.manifest);
  if (totalPins <= 0) return 0;
  return Math.min(100, Math.round((entry.progress.foundMarkersCount / totalPins) * 100));
}

export function getGameStatus(entry: HubGameEntry): 'in-progress' | 'completed' | 'not-started' {
  const percent = getCompletionPercent(entry);
  if (percent >= 100) return 'completed';
  if (percent > 0) return 'in-progress';
  return 'not-started';
}
