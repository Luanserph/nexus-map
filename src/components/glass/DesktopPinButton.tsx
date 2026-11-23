import { Pin, PinOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NeonButton } from './NeonButton';

function isTauriDesktop(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export interface DesktopPinButtonProps {
  compact?: boolean;
}

/**
 * Discreet "Always on Top" toggle button rendered ONLY inside the Tauri desktop app.
 * Uses dynamic import so web/Vercel builds stay 100% decoupled.
 */
export function DesktopPinButton({ compact = false }: DesktopPinButtonProps) {
  const [isPinned, setIsPinned] = useState(false);
  const [busy, setBusy] = useState(false);

  const isDesktop = isTauriDesktop();

  useEffect(() => {
    if (!isDesktop) return;
    let cancelled = false;
    import('@tauri-apps/api/window')
      .then(({ getCurrentWindow }) => getCurrentWindow().isAlwaysOnTop())
      .then((value) => {
        if (!cancelled) setIsPinned(Boolean(value));
      })
      .catch(() => {
        // ignore outside Tauri runtime
      });
    return () => {
      cancelled = true;
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const next = !isPinned;
      await getCurrentWindow().setAlwaysOnTop(next);
      setIsPinned(next);
    } catch {
      // ignore
    } finally {
      setBusy(false);
    }
  }

  const label = isPinned ? 'Fixado no topo (Alt+M)' : 'Sempre no topo (Alt+M)';

  return (
    <NeonButton
      size="sm"
      variant="glass"
      active={isPinned}
      disabled={busy}
      onClick={() => void handleToggle()}
      title={label}
      aria-label={label}
      leftIcon={
        isPinned ? (
          <Pin className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
        ) : (
          <PinOff className="h-3.5 w-3.5" />
        )
      }
    >
      {!compact && <span className="hidden xl:inline">{isPinned ? 'No Topo' : 'Fixar'}</span>}
    </NeonButton>
  );
}
