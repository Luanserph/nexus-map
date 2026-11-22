import { useMemo } from 'react';
import { HubShell } from './components/hub';
import { MapWorkspace } from './components/map-ui';
import { I18nProvider } from './core/i18n';
import { useHashRoute } from './core/router/useHashRoute';
import { useAllGamesProgress } from './core/storage';
import { ThemeProvider } from './core/theme-engine';
import { buildHubEntries } from './data/games';

export function App() {
  const { route, navigateToHub, navigateToGame } = useHashRoute();
  const progressBySlug = useAllGamesProgress();

  const hubGames = useMemo(
    () => buildHubEntries(progressBySlug),
    [progressBySlug]
  );

  const activeGameEntry =
    route.view === 'map'
      ? hubGames.find((entry) => entry.manifest.slug === route.gameSlug)
      : undefined;

  return (
    <I18nProvider>
      <ThemeProvider activeGame={activeGameEntry?.manifest ?? null}>
        {activeGameEntry ? (
          <MapWorkspace
            key={activeGameEntry.manifest.slug}
            entry={activeGameEntry}
            activeLayerId={route.view === 'map' ? route.layerId : undefined}
            onSelectLayer={(layerId) =>
              navigateToGame(activeGameEntry.manifest.slug, layerId)
            }
            onBackToHub={navigateToHub}
          />
        ) : (
          <HubShell games={hubGames} onOpenGame={navigateToGame} />
        )}
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
