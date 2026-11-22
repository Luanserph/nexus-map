import { HubShell } from './components/hub';
import { MapWorkspace } from './components/map-ui';
import { useHashRoute } from './core/router/useHashRoute';
import { ThemeProvider } from './core/theme-engine';
import { getHubGameBySlug } from './data/games';

export function App() {
  const { route, navigateToHub, navigateToGame } = useHashRoute();

  const activeGameEntry =
    route.view === 'map' ? getHubGameBySlug(route.gameSlug) : undefined;

  return (
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
        <HubShell onOpenGame={navigateToGame} />
      )}
    </ThemeProvider>
  );
}

export default App;
