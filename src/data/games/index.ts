import type {
  GameManifest,
  GameProgressSummary,
  GuidedRoute,
  HubGameEntry,
  MapMarker,
  MapRegion,
} from '../../types/schema';

/**
 * Auto-discovery via Vite import.meta.glob:
 * - `manifest.json` stays eager (tiny metadata needed to render Hub cards & counters).
 * - `markers.json`, `regions.json` and `guides.json` are lazy-loaded per game on demand
 *   so the initial Hub bundle stays < 500 KB instead of bundling all ~50,000 pins upfront.
 */
const manifestModules = import.meta.glob<{ default: GameManifest }>(
  './*/manifest.json',
  { eager: true }
);

const markerLoaders = import.meta.glob<{ default: MapMarker[] }>(
  './*/markers.json',
  { eager: false }
);

const regionLoaders = import.meta.glob<{ default: MapRegion[] }>(
  './*/regions.json',
  { eager: false }
);

const guideLoaders = import.meta.glob<{ default: GuidedRoute[] }>(
  './*/guides.json',
  { eager: false }
);

function extractSlugFromGlobPath(globPath: string): string {
  const parts = globPath.split('/');
  return parts[1] ?? '';
}

export const GAME_MANIFESTS: GameManifest[] = Object.values(manifestModules)
  .map((mod) => mod.default)
  .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

const markerLoaderBySlug: Record<string, () => Promise<{ default: MapMarker[] }>> = {};
for (const [globPath, loader] of Object.entries(markerLoaders)) {
  const slug = extractSlugFromGlobPath(globPath);
  if (slug) markerLoaderBySlug[slug] = loader;
}

const regionLoaderBySlug: Record<string, () => Promise<{ default: MapRegion[] }>> = {};
for (const [globPath, loader] of Object.entries(regionLoaders)) {
  const slug = extractSlugFromGlobPath(globPath);
  if (slug) regionLoaderBySlug[slug] = loader;
}

const guideLoaderBySlug: Record<string, () => Promise<{ default: GuidedRoute[] }>> = {};
for (const [globPath, loader] of Object.entries(guideLoaders)) {
  const slug = extractSlugFromGlobPath(globPath);
  if (slug) guideLoaderBySlug[slug] = loader;
}

// In-memory session caches so re-opening the same game or switching layers is instant
const markersCache = new Map<string, MapMarker[]>();
const regionsCache = new Map<string, MapRegion[]>();
const guidesCache = new Map<string, GuidedRoute[]>();

export async function loadMarkersByGameSlug(slug: string): Promise<MapMarker[]> {
  const cached = markersCache.get(slug);
  if (cached) return cached;

  const loader = markerLoaderBySlug[slug];
  if (!loader) return [];

  const mod = await loader();
  const data = (mod.default ?? []) as MapMarker[];
  markersCache.set(slug, data);
  return data;
}

export async function loadRegionsByGameSlug(slug: string): Promise<MapRegion[]> {
  const cached = regionsCache.get(slug);
  if (cached) return cached;

  const loader = regionLoaderBySlug[slug];
  if (!loader) return [];

  const mod = await loader();
  const data = (mod.default ?? []) as MapRegion[];
  regionsCache.set(slug, data);
  return data;
}

export async function loadGuidesByGameSlug(slug: string): Promise<GuidedRoute[]> {
  const cached = guidesCache.get(slug);
  if (cached) return cached;

  const loader = guideLoaderBySlug[slug];
  if (!loader) return [];

  const mod = await loader();
  const data = (mod.default ?? []) as GuidedRoute[];
  guidesCache.set(slug, data);
  return data;
}

export function getCachedMarkersByGameSlug(slug: string): MapMarker[] {
  return markersCache.get(slug) ?? [];
}

export function getCachedRegionsByGameSlug(slug: string): MapRegion[] {
  return regionsCache.get(slug) ?? [];
}

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

/**
 * Returns the pre-calculated total pins count from the manifest without loading markers.json.
 */
export function getTotalPinsCount(manifest: GameManifest): number {
  if (typeof manifest.totalPins === 'number' && manifest.totalPins >= 0) {
    return manifest.totalPins;
  }
  return manifest.maps.reduce((sum, mapLayer) => sum + (mapLayer.pinsCount ?? 0), 0);
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
