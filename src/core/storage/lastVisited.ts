const STORAGE_KEY_LAST_VISITED = 'nexus-maps:last-visited';

export interface LastVisitedRecord {
  gameSlug: string;
  mapId?: string;
  visitedAt: number;
}

export function getLastVisitedGame(): LastVisitedRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_VISITED);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastVisitedRecord>;
    if (typeof parsed.gameSlug === 'string' && parsed.gameSlug.length > 0) {
      return {
        gameSlug: parsed.gameSlug,
        mapId: typeof parsed.mapId === 'string' ? parsed.mapId : undefined,
        visitedAt:
          typeof parsed.visitedAt === 'number' ? parsed.visitedAt : Date.now(),
      };
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

export function saveLastVisitedGame(gameSlug: string, mapId?: string): void {
  try {
    const record: LastVisitedRecord = {
      gameSlug,
      mapId,
      visitedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_LAST_VISITED, JSON.stringify(record));
  } catch {
    // Ignore storage errors
  }
}
