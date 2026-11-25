import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

const PRELOAD_RELOAD_KEY = 'nexus-maps:preload-reload-at';
const PRELOAD_RELOAD_COOLDOWN_MS = 15_000;

/**
 * Recovers once from stale Vite/PWA chunk errors after a new deployment,
 * guarded by a sessionStorage cooldown to prevent infinite reload loops.
 */
function triggerSafePreloadReload(): void {
  try {
    const lastReloadAt = Number(sessionStorage.getItem(PRELOAD_RELOAD_KEY) ?? '0');
    if (Date.now() - lastReloadAt < PRELOAD_RELOAD_COOLDOWN_MS) {
      return;
    }
    sessionStorage.setItem(PRELOAD_RELOAD_KEY, String(Date.now()));
  } catch {
    // Ignore storage access errors in private contexts
  }
  window.location.reload();
}

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  triggerSafePreloadReload();
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
