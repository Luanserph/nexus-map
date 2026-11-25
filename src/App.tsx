import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { HubShell } from './components/hub';
import { I18nProvider } from './core/i18n';

const CHUNK_RELOAD_KEY = 'nexus-maps:preload-reload-at';
const CHUNK_RELOAD_COOLDOWN_MS = 15_000;

function importMapWorkspaceWithRecovery() {
  return import('./components/map-ui/MapWorkspace')
    .then((mod) => ({ default: mod.MapWorkspace }))
    .catch((error: unknown) => {
      try {
        const lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) ?? '0');
        if (Date.now() - lastReloadAt >= CHUNK_RELOAD_COOLDOWN_MS) {
          sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          window.location.reload();
          return new Promise<{ default: typeof import('./components/map-ui/MapWorkspace').MapWorkspace }>(
            () => {}
          );
        }
      } catch {
        // Ignore sessionStorage restrictions
      }
      throw error;
    });
}

const MapWorkspace = lazy(importMapWorkspaceWithRecovery);

interface MapErrorBoundaryProps {
  onBackToHub: () => void;
  children: ReactNode;
}

interface MapErrorBoundaryState {
  hasError: boolean;
}

class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-[var(--surface-base)] px-4 text-center text-[var(--text-primary)]">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Não foi possível carregar o motor do mapa.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cursor-pointer rounded-lg border border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/15 px-3.5 py-1.5 font-mono text-xs text-[var(--accent-primary)] transition-colors hover:bg-[var(--accent-primary)]/25"
            >
              Recarregar
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onBackToHub();
              }}
              className="cursor-pointer rounded-lg border border-white/15 bg-white/[0.05] px-3.5 py-1.5 font-mono text-xs text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              Voltar ao Hub
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
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
          <MapErrorBoundary
            key={activeGameEntry.manifest.slug}
            onBackToHub={() => {
              setLastVisited(getLastVisitedGame());
              navigateToHub();
            }}
          >
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
          </MapErrorBoundary>
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
