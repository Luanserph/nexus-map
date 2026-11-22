import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISSED_STORAGE_KEY = 'nexus_pwa_banner_dismissed';

function detectStandaloneOrTauri(): boolean {
  if (typeof window === 'undefined') return false;

  // Running inside Tauri desktop shell
  if ('__TAURI_INTERNALS__' in window) {
    return true;
  }

  // Running as an installed PWA (Chrome/Edge/Android/Desktop)
  if (window.matchMedia?.('(display-mode: standalone)').matches) {
    return true;
  }

  // Running as an installed iOS Safari Home Screen Web App
  const nav = window.navigator as Navigator & { standalone?: boolean };
  if (nav.standalone === true) {
    return true;
  }

  return false;
}

function readDismissedFlag(): boolean {
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export interface UsePwaInstallResult {
  /** True when running in a standard web browser (not installed PWA and not Tauri). */
  canShowInstallUi: boolean;
  /** True when the dismissible reminder banner should be visible. */
  canShowBanner: boolean;
  /** True when the browser provided a native beforeinstallprompt event. */
  hasNativePrompt: boolean;
  /** Triggers the native prompt if available, otherwise returns 'manual' for fallback instructions. */
  triggerInstall: () => Promise<'accepted' | 'dismissed' | 'manual'>;
  /** Dismisses the reminder banner and persists the choice in localStorage. */
  dismissBanner: () => void;
}

export function usePwaInstall(): UsePwaInstallResult {
  const [isInstalledOrDesktop, setIsInstalledOrDesktop] = useState<boolean>(() =>
    detectStandaloneOrTauri()
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() =>
    readDismissedFlag()
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalledOrDesktop(true);
    };

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleDisplayModeChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        setIsInstalledOrDesktop(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    mediaQuery?.addEventListener?.('change', handleDisplayModeChange);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      mediaQuery?.removeEventListener?.('change', handleDisplayModeChange);
    };
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      window.localStorage.setItem(DISMISSED_STORAGE_KEY, '1');
    } catch {
      // ignore storage errors in restricted contexts
    }
  }, []);

  const triggerInstall = useCallback(async (): Promise<
    'accepted' | 'dismissed' | 'manual'
  > => {
    if (!deferredPrompt) {
      return 'manual';
    }

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setIsInstalledOrDesktop(true);
    }
    return outcome;
  }, [deferredPrompt]);

  const canShowInstallUi = !isInstalledOrDesktop;
  const canShowBanner = canShowInstallUi && !isBannerDismissed;

  return {
    canShowInstallUi,
    canShowBanner,
    hasNativePrompt: Boolean(deferredPrompt),
    triggerInstall,
    dismissBanner,
  };
}
