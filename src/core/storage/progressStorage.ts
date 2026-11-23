import type { NexusBackupPayload } from '../../types/schema';
import { exportBackupPayload, importBackupJson } from './actions';
import { subscribeStorage } from './db';

const PROGRESS_FILENAME = 'progress.json';
const LOCAL_MIRROR_KEY = 'nexus_maps_progress_mirror';
const SAVE_DEBOUNCE_MS = 500;

function isTauriRuntime(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

function writeLocalMirror(json: string): void {
  try {
    window.localStorage.setItem(LOCAL_MIRROR_KEY, json);
  } catch {
    // QuotaExceededError or private browsing — IndexedDB remains primary
  }
}

function readLocalMirror(): string | null {
  try {
    return window.localStorage.getItem(LOCAL_MIRROR_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the current Nexus Maps progress snapshot:
 * - In Tauri Desktop: writes `progress.json` to `BaseDirectory.AppData` AND mirrors to `localStorage`.
 * - On Web/Vercel: mirrors to `localStorage` alongside IndexedDB.
 */
export async function saveProgressSnapshot(): Promise<void> {
  const payload: NexusBackupPayload = await exportBackupPayload();
  const serialized = JSON.stringify(payload, null, 2);

  writeLocalMirror(serialized);

  if (!isTauriRuntime()) return;

  try {
    const { BaseDirectory, mkdir, writeTextFile } = await import(
      '@tauri-apps/plugin-fs'
    );
    await mkdir('', { baseDir: BaseDirectory.AppData, recursive: true });
    await writeTextFile(PROGRESS_FILENAME, serialized, {
      baseDir: BaseDirectory.AppData,
    });
  } catch (err) {
    console.warn('[progressStorage] Falha ao gravar progress.json nativo:', err);
  }
}

/**
 * Hydrates IndexedDB from native `AppData/progress.json` (in Tauri) or `localStorage` fallback.
 */
export async function loadProgressSnapshot(): Promise<boolean> {
  if (isTauriRuntime()) {
    try {
      const { BaseDirectory, exists, readTextFile } = await import(
        '@tauri-apps/plugin-fs'
      );
      const hasFile = await exists(PROGRESS_FILENAME, {
        baseDir: BaseDirectory.AppData,
      });
      if (hasFile) {
        const raw = await readTextFile(PROGRESS_FILENAME, {
          baseDir: BaseDirectory.AppData,
        });
        if (raw && raw.trim().startsWith('{')) {
          await importBackupJson(raw, 'merge');
          writeLocalMirror(raw);
          return true;
        }
      }
    } catch (err) {
      console.warn('[progressStorage] Falha ao ler progress.json nativo:', err);
    }
  }

  // Fallback: restore from localStorage mirror if IndexedDB is currently empty
  const mirror = readLocalMirror();
  if (mirror && mirror.trim().startsWith('{')) {
    try {
      const current = await exportBackupPayload();
      const isEmpty =
        current.foundMarkers.length === 0 &&
        current.userNotes.length === 0 &&
        current.customRoutes.length === 0;
      if (isEmpty) {
        await importBackupJson(mirror, 'merge');
        return true;
      }
    } catch {
      // ignore corrupt mirror
    }
  }

  return false;
}

/**
 * Initializes unified progress persistence with 500ms debounced auto-save.
 * Returns a cleanup function suitable for React `useEffect`.
 */
export function initProgressStorageSync(): () => void {
  let timer: number | null = null;
  let isHydrating = true;

  void loadProgressSnapshot().finally(() => {
    isHydrating = false;
  });

  const unsubscribe = subscribeStorage(() => {
    if (isHydrating) return;
    if (timer !== null) {
      window.clearTimeout(timer);
    }
    timer = window.setTimeout(() => {
      timer = null;
      void saveProgressSnapshot();
    }, SAVE_DEBOUNCE_MS);
  });

  return () => {
    unsubscribe();
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };
}
