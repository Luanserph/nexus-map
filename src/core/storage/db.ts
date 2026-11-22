import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  CustomRouteRecord,
  FoundMarkerRecord,
  MarkerChecklistRecord,
  UserNoteRecord,
} from '../../types/schema';

export class NexusMapsDB extends Dexie {
  foundMarkers!: Table<FoundMarkerRecord, string>;
  userNotes!: Table<UserNoteRecord, string>;
  customRoutes!: Table<CustomRouteRecord, string>;
  checklistItems!: Table<MarkerChecklistRecord, string>;

  constructor() {
    super('NexusMapsDB');

    this.version(1).stores({
      foundMarkers: 'id, gameSlug, markerId, foundAt',
      userNotes: 'id, gameSlug, mapId, [gameSlug+mapId], createdAt',
      customRoutes: 'id, gameSlug, mapId, [gameSlug+mapId], createdAt',
    });

    this.version(2).stores({
      foundMarkers: 'id, gameSlug, markerId, foundAt',
      userNotes: 'id, gameSlug, mapId, [gameSlug+mapId], createdAt',
      customRoutes: 'id, gameSlug, mapId, [gameSlug+mapId], createdAt',
      checklistItems: 'id, gameSlug, markerId, [gameSlug+markerId], checkedAt',
    });
  }
}

export const db = new NexusMapsDB();

type StorageListener = () => void;
const listeners = new Set<StorageListener>();

export function subscribeStorage(listener: StorageListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyStorageChanged(): void {
  for (const listener of listeners) {
    listener();
  }
}
