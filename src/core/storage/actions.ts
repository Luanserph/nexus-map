import type {
  CustomRouteRecord,
  FoundMarkerRecord,
  MarkerChecklistRecord,
  NexusBackupPayload,
  UserContributionRecord,
  UserNoteRecord,
} from '../../types/schema';
import { db, notifyStorageChanged } from './db';

function makeFoundKey(gameSlug: string, markerId: string): string {
  return `${gameSlug}:${markerId}`;
}

function makeChecklistKey(
  gameSlug: string,
  markerId: string,
  itemId: string
): string {
  return `${gameSlug}:${markerId}:${itemId}`;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function toggleMarkerFound(
  gameSlug: string,
  markerId: string
): Promise<boolean> {
  const id = makeFoundKey(gameSlug, markerId);
  const existing = await db.foundMarkers.get(id);

  if (existing) {
    await db.foundMarkers.delete(id);
    notifyStorageChanged();
    return false;
  }

  const record: FoundMarkerRecord = {
    id,
    gameSlug,
    markerId,
    foundAt: Date.now(),
  };
  await db.foundMarkers.put(record);
  notifyStorageChanged();
  return true;
}

export async function setMarkerFound(
  gameSlug: string,
  markerId: string,
  found: boolean
): Promise<void> {
  const id = makeFoundKey(gameSlug, markerId);
  if (found) {
    await db.foundMarkers.put({
      id,
      gameSlug,
      markerId,
      foundAt: Date.now(),
    });
  } else {
    await db.foundMarkers.delete(id);
  }
  notifyStorageChanged();
}

export async function saveUserNote(
  input: Omit<UserNoteRecord, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: number;
  }
): Promise<UserNoteRecord> {
  const record: UserNoteRecord = {
    id: input.id ?? generateId('note'),
    gameSlug: input.gameSlug,
    mapId: input.mapId,
    title: input.title.trim() || 'Nota pessoal',
    content: input.content.trim(),
    coords: input.coords,
    createdAt: input.createdAt ?? Date.now(),
  };

  await db.userNotes.put(record);
  notifyStorageChanged();
  return record;
}

export async function deleteUserNote(id: string): Promise<void> {
  await db.userNotes.delete(id);
  notifyStorageChanged();
}

export async function saveCustomRoute(
  input: Omit<CustomRouteRecord, 'id' | 'createdAt'> & {
    id?: string;
    createdAt?: number;
  }
): Promise<CustomRouteRecord> {
  const record: CustomRouteRecord = {
    id: input.id ?? generateId('route'),
    gameSlug: input.gameSlug,
    mapId: input.mapId,
    name: input.name.trim() || 'Rota personalizada',
    color: input.color,
    points: input.points,
    createdAt: input.createdAt ?? Date.now(),
  };

  await db.customRoutes.put(record);
  notifyStorageChanged();
  return record;
}

export async function deleteCustomRoute(id: string): Promise<void> {
  await db.customRoutes.delete(id);
  notifyStorageChanged();
}

export async function toggleChecklistItem(
  gameSlug: string,
  markerId: string,
  itemId: string
): Promise<boolean> {
  const id = makeChecklistKey(gameSlug, markerId, itemId);
  const existing = await db.checklistItems.get(id);

  if (existing) {
    await db.checklistItems.delete(id);
    notifyStorageChanged();
    return false;
  }

  const record: MarkerChecklistRecord = {
    id,
    gameSlug,
    markerId,
    itemId,
    checkedAt: Date.now(),
  };
  await db.checklistItems.put(record);
  notifyStorageChanged();
  return true;
}

export async function saveUserContribution(input: {
  gameSlug: string;
  markerId: string;
  imageDataUrl?: string;
  requirementNote?: string;
}): Promise<UserContributionRecord> {
  const record: UserContributionRecord = {
    id: generateId('contrib'),
    gameSlug: input.gameSlug,
    markerId: input.markerId,
    imageDataUrl: input.imageDataUrl,
    requirementNote: input.requirementNote?.trim() || undefined,
    createdAt: Date.now(),
  };

  await db.userContributions.put(record);
  notifyStorageChanged();
  return record;
}

export async function deleteUserContribution(id: string): Promise<void> {
  await db.userContributions.delete(id);
  notifyStorageChanged();
}

export async function exportBackupPayload(): Promise<NexusBackupPayload> {
  const [
    foundMarkers,
    userNotes,
    customRoutes,
    checklistItems,
    userContributions,
  ] = await Promise.all([
    db.foundMarkers.toArray(),
    db.userNotes.toArray(),
    db.customRoutes.toArray(),
    db.checklistItems.toArray(),
    db.userContributions.toArray(),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    foundMarkers,
    userNotes,
    customRoutes,
    checklistItems,
    userContributions,
  };
}

export async function downloadBackupFile(): Promise<NexusBackupPayload> {
  const payload = await exportBackupPayload();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStamp = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `nexus-maps-backup-${dateStamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  return payload;
}

export async function importBackupJson(
  rawJson: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{
  foundMarkers: number;
  userNotes: number;
  customRoutes: number;
  userContributions: number;
}> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error('Arquivo JSON inválido.');
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Estrutura de backup inválida.');
  }

  const candidate = parsed as Partial<NexusBackupPayload>;
  const foundMarkers = Array.isArray(candidate.foundMarkers)
    ? candidate.foundMarkers.filter(
        (item): item is FoundMarkerRecord =>
          Boolean(
            item &&
              typeof item.gameSlug === 'string' &&
              typeof item.markerId === 'string'
          )
      )
    : [];

  const userNotes = Array.isArray(candidate.userNotes)
    ? candidate.userNotes.filter(
        (item): item is UserNoteRecord =>
          Boolean(
            item &&
              typeof item.id === 'string' &&
              typeof item.gameSlug === 'string' &&
              typeof item.mapId === 'string' &&
              Array.isArray(item.coords) &&
              item.coords.length === 2
          )
      )
    : [];

  const customRoutes = Array.isArray(candidate.customRoutes)
    ? candidate.customRoutes.filter(
        (item): item is CustomRouteRecord =>
          Boolean(
            item &&
              typeof item.id === 'string' &&
              typeof item.gameSlug === 'string' &&
              typeof item.mapId === 'string' &&
              Array.isArray(item.points)
          )
      )
    : [];

  const normalizedFound: FoundMarkerRecord[] = foundMarkers.map((item) => ({
    id: item.id || makeFoundKey(item.gameSlug, item.markerId),
    gameSlug: item.gameSlug,
    markerId: item.markerId,
    foundAt: typeof item.foundAt === 'number' ? item.foundAt : Date.now(),
  }));

  const checklistItems = Array.isArray(candidate.checklistItems)
    ? candidate.checklistItems.filter(
        (item): item is MarkerChecklistRecord =>
          Boolean(
            item &&
              typeof item.gameSlug === 'string' &&
              typeof item.markerId === 'string' &&
              typeof item.itemId === 'string'
          )
      )
    : [];

  const normalizedChecklist: MarkerChecklistRecord[] = checklistItems.map(
    (item) => ({
      id: item.id || makeChecklistKey(item.gameSlug, item.markerId, item.itemId),
      gameSlug: item.gameSlug,
      markerId: item.markerId,
      itemId: item.itemId,
      checkedAt: typeof item.checkedAt === 'number' ? item.checkedAt : Date.now(),
    })
  );

  const userContributions = Array.isArray(candidate.userContributions)
    ? candidate.userContributions.filter(
        (item): item is UserContributionRecord =>
          Boolean(
            item &&
              typeof item.id === 'string' &&
              typeof item.gameSlug === 'string' &&
              typeof item.markerId === 'string'
          )
      )
    : [];

  await db.transaction(
    'rw',
    [
      db.foundMarkers,
      db.userNotes,
      db.customRoutes,
      db.checklistItems,
      db.userContributions,
    ],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.foundMarkers.clear(),
          db.userNotes.clear(),
          db.customRoutes.clear(),
          db.checklistItems.clear(),
          db.userContributions.clear(),
        ]);
      }

      if (normalizedFound.length > 0) {
        await db.foundMarkers.bulkPut(normalizedFound);
      }
      if (userNotes.length > 0) {
        await db.userNotes.bulkPut(userNotes);
      }
      if (customRoutes.length > 0) {
        await db.customRoutes.bulkPut(customRoutes);
      }
      if (normalizedChecklist.length > 0) {
        await db.checklistItems.bulkPut(normalizedChecklist);
      }
      if (userContributions.length > 0) {
        await db.userContributions.bulkPut(userContributions);
      }
    }
  );

  notifyStorageChanged();

  return {
    foundMarkers: normalizedFound.length,
    userNotes: userNotes.length,
    customRoutes: customRoutes.length,
    userContributions: userContributions.length,
  };
}
