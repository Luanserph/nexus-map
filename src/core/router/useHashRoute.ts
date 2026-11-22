import { useCallback, useEffect, useState } from 'react';

export type AppRoute =
  | { view: 'hub' }
  | { view: 'map'; gameSlug: string; layerId?: string };

function parseHash(rawHash: string): AppRoute {
  const normalized = rawHash.replace(/^#\/?/, '').trim();
  if (!normalized) {
    return { view: 'hub' };
  }

  const segments = normalized.split('/').filter(Boolean);
  if (segments[0] === 'map' && segments[1]) {
    return {
      view: 'map',
      gameSlug: decodeURIComponent(segments[1]),
      layerId: segments[2] ? decodeURIComponent(segments[2]) : undefined,
    };
  }

  return { view: 'hub' };
}

function buildHash(route: AppRoute): string {
  if (route.view === 'hub') {
    return '#/';
  }

  const slug = encodeURIComponent(route.gameSlug);
  if (route.layerId) {
    return `#/map/${slug}/${encodeURIComponent(route.layerId)}`;
  }
  return `#/map/${slug}`;
}

export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(() =>
    parseHash(window.location.hash)
  );

  useEffect(() => {
    function handleHashChange() {
      setRoute(parseHash(window.location.hash));
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateToHub = useCallback(() => {
    const targetHash = buildHash({ view: 'hub' });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute({ view: 'hub' });
    }
  }, []);

  const navigateToGame = useCallback((gameSlug: string, layerId?: string) => {
    const targetHash = buildHash({ view: 'map', gameSlug, layerId });
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    } else {
      setRoute({ view: 'map', gameSlug, layerId });
    }
  }, []);

  return {
    route,
    navigateToHub,
    navigateToGame,
  };
}
