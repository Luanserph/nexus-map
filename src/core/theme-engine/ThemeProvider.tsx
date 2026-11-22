import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { GameManifest, GameTheme } from '../../types/schema';
import { DEFAULT_FONT_DISPLAY, HUB_DEFAULT_THEME } from './hubTheme';
import { GameThemeContext } from './useGameTheme';

export interface ThemeProviderProps {
  activeGame: GameManifest | null;
  children: ReactNode;
}

function applyThemeToRoot(theme: GameTheme, themeKey: string) {
  const root = document.documentElement;

  root.dataset.gameTheme = themeKey;
  root.dataset.bgPattern = theme.backgroundPattern;

  root.style.setProperty('--accent-primary', theme.accentPrimary);
  root.style.setProperty('--accent-secondary', theme.accentSecondary);
  root.style.setProperty('--accent-glow', theme.accentGlow);
  root.style.setProperty('--glass-tint', theme.glassTint);
  root.style.setProperty('--glass-bg', theme.glassTint);
  root.style.setProperty('--surface-base', theme.surfaceBase);
  root.style.setProperty(
    '--nexus-font-display',
    theme.fontDisplay ?? DEFAULT_FONT_DISPLAY
  );
}

export function ThemeProvider({ activeGame, children }: ThemeProviderProps) {
  const activeTheme = activeGame?.theme ?? HUB_DEFAULT_THEME;
  const themeKey = activeGame?.slug ?? 'hub-default';

  useEffect(() => {
    applyThemeToRoot(activeTheme, themeKey);
  }, [activeTheme, themeKey]);

  const contextValue = useMemo(
    () => ({
      activeGame,
      activeTheme,
      isGameThemeActive: activeGame !== null,
      defaultTheme: HUB_DEFAULT_THEME,
    }),
    [activeGame, activeTheme]
  );

  return (
    <GameThemeContext.Provider value={contextValue}>
      {children}
    </GameThemeContext.Provider>
  );
}
