import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { HubShell } from './components/hub';
import { I18nProvider } from './core/i18n';

const MapWorkspace = lazy(() =>
  import('./components/map-ui/MapWorkspace').then((mod) => ({
    default: mod.MapWorkspace,
  }))
);
import { useHashRoute } from './core/router/useHashRoute';
import {
  getLastVisitedGame,
  initProgressStorageSync,
  saveLastVisitedGame,
  useAllGamesProgress,
} from './core/storage';
import type { LastVisitedRecord } from './core/storage';
import { ThemeProvider } from './core/theme-engine';
import { buildHubEntries } from './data/games';

export function App() {
  const { route, navigateToHub, navigateToGame } = useHashRoute();
  const progressBySlug = useAllGamesProgress();
  const [lastVisited, setLastVisited] = useState<LastVisitedRecord | null>(() =>
    getLastVisitedGame()
  );

  const hubGames = useMemo(
    () => buildHubEntries(progressBySlug),
    [progressBySlug]
  );

  const activeGameEntry =
    route.view === 'map'
      ? hubGames.find((entry) => entry.manifest.slug === route.gameSlug)
      : undefined;

  const handleOpenGame = useCallback(
    (slug: string, layerId?: string) => {
      saveLastVisitedGame(slug, layerId);
      setLastVisited({ gameSlug: slug, mapId: layerId, visitedAt: Date.now() });
      navigateToGame(slug, layerId);
    },
    [navigateToGame]
  );

  // Hydrate & sync progress natively in Tauri (AppData/progress.json) or localStorage mirror on Web
  useEffect(() => {
    return initProgressStorageSync();
  }, []);

  // Persist direct hash visits (e.g. bookmark / refresh on #/map/elden-ring)
  useEffect(() => {
    if (route.view === 'map' && activeGameEntry) {
      const targetLayer = route.layerId ?? activeGameEntry.manifest.maps[0]?.id;
      saveLastVisitedGame(activeGameEntry.manifest.slug, targetLayer);
    }
  }, [route, activeGameEntry]);

  return (
    <I18nProvider>
      <ThemeProvider activeGame={activeGameEntry?.manifest ?? null}>
        {activeGameEntry ? (
          <Suspense
            fallback={
              <div className="flex min-h-svh items-center justify-center bg-[var(--surface-base)] font-mono text-xs text-[var(--text-secondary)]">
                Carregando motor de mapa...
              </div>
            }
          >
            <MapWorkspace
              key={activeGameEntry.manifest.slug}
              entry={activeGameEntry}
              activeLayerId={route.view === 'map' ? route.layerId : undefined}
              onSelectLayer={(layerId) =>
                handleOpenGame(activeGameEntry.manifest.slug, layerId)
              }
              onBackToHub={() => {
                setLastVisited(getLastVisitedGame());
                navigateToHub();
              }}
            />
          </Suspense>
        ) : (
          <HubShell
            games={hubGames}
            lastVisited={lastVisited}
            onOpenGame={handleOpenGame}
          />
        )}
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
