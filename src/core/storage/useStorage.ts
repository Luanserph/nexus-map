import { useEffect, useState } from 'react';
import type {
  CustomRouteRecord,
  GameProgressSummary,
  UserNoteRecord,
} from '../../types/schema';
import { db, subscribeStorage } from './db';

function formatRelativeTime(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Agora mesmo';
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Ontem';
  return `Há ${diffDays} dias`;
}

/**
 * Live IndexedDB summary for all games (used on Hub cards).
 */
export function useAllGamesProgress(): Record<string, GameProgressSummary> {
  const [progressMap, setProgressMap] = useState<
    Record<string, GameProgressSummary>
  >({});

  useEffect(() => {
    let active = true;

    async function load() {
      const allFound = await db.foundMarkers.toArray();
      if (!active) return;

      const byGame: Record<
        string,
        { count: number; latestFoundAt?: number }
      > = {};

      for (const rec of allFound) {
        const current = byGame[rec.gameSlug] ?? { count: 0 };
        current.count += 1;
        if (!current.latestFoundAt || rec.foundAt > current.latestFoundAt) {
          current.latestFoundAt = rec.foundAt;
        }
        byGame[rec.gameSlug] = current;
      }

      const next: Record<string, GameProgressSummary> = {};
      for (const [slug, stats] of Object.entries(byGame)) {
        next[slug] = {
          gameSlug: slug,
          foundMarkersCount: stats.count,
          lastVisitedAt: formatRelativeTime(stats.latestFoundAt),
        };
      }

      setProgressMap(next);
    }

    void load();
    const unsubscribe = subscribeStorage(() => {
      void load();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return progressMap;
}

export interface GameMapStorageState {
  foundMarkerIds: Set<string>;
  checkedChecklistKeys: Set<string>;
  notes: UserNoteRecord[];
  routes: CustomRouteRecord[];
  isLoaded: boolean;
}

/**
 * Live IndexedDB state for the active game & map layer.
 */
export function useGameMapStorage(
  gameSlug: string,
  mapId: string
): GameMapStorageState {
  const [state, setState] = useState<GameMapStorageState>({
    foundMarkerIds: new Set<string>(),
    checkedChecklistKeys: new Set<string>(),
    notes: [],
    routes: [],
    isLoaded: false,
  });

  useEffect(() => {
    let active = true;

    async function load() {
      const [foundRows, checklistRows, noteRows, routeRows] = await Promise.all([
        db.foundMarkers.where('gameSlug').equals(gameSlug).toArray(),
        db.checklistItems.where('gameSlug').equals(gameSlug).toArray(),
        db.userNotes
          .where('[gameSlug+mapId]')
          .equals([gameSlug, mapId])
          .sortBy('createdAt'),
        db.customRoutes
          .where('[gameSlug+mapId]')
          .equals([gameSlug, mapId])
          .sortBy('createdAt'),
      ]);

      if (!active) return;

      setState({
        foundMarkerIds: new Set(foundRows.map((row) => row.markerId)),
        checkedChecklistKeys: new Set(
          checklistRows.map((row) => `${row.markerId}:${row.itemId}`)
        ),
        notes: noteRows,
        routes: routeRows,
        isLoaded: true,
      });
    }

    void load();
    const unsubscribe = subscribeStorage(() => {
      void load();
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [gameSlug, mapId]);

  return state;
}
