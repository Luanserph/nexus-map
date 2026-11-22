import type {
  GameManifest,
  GameProgressSummary,
  HubGameEntry,
  MapMarker,
} from '../../types/schema';
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

export function buildHubEntries(
  progressBySlug: Record<string, GameProgressSummary>
): HubGameEntry[] {
  return GAME_MANIFESTS.map((manifest) => ({
    manifest,
    progress: progressBySlug[manifest.slug] ?? {
      gameSlug: manifest.slug,
      foundMarkersCount: 0,
      activeLayerId: manifest.maps[0]?.id,
    },
  }));
}

export function getGameManifestBySlug(slug: string): GameManifest | undefined {
  return GAME_MANIFESTS.find((manifest) => manifest.slug === slug);
}

export function getMarkersByGameSlug(slug: string): MapMarker[] {
  return markersBySlug[slug] ?? [];
}

export function getMarkersByMap(slug: string, mapId: string): MapMarker[] {
  return getMarkersByGameSlug(slug).filter((marker) => marker.mapId === mapId);
}

/**
 * Returns the real cataloged markers count for progress tracking (falls back to manifest total).
 */
export function getTotalPinsCount(manifest: GameManifest): number {
  const catalogedCount = getMarkersByGameSlug(manifest.slug).length;
  if (catalogedCount > 0) return catalogedCount;
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
  return Math.min(
    100,
    Math.round((entry.progress.foundMarkersCount / totalPins) * 100)
  );
}

export function getGameStatus(
  entry: HubGameEntry
): 'in-progress' | 'completed' | 'not-started' {
  const percent = getCompletionPercent(entry);
  if (percent >= 100) return 'completed';
  if (percent > 0) return 'in-progress';
  return 'not-started';
}
