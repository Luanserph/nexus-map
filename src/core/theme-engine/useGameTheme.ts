import { createContext, useContext } from 'react';
import type { GameManifest, GameTheme } from '../../types/schema';
import { HUB_DEFAULT_THEME } from './hubTheme';

export interface GameThemeContextValue {
  activeGame: GameManifest | null;
  activeTheme: GameTheme;
  isGameThemeActive: boolean;
  defaultTheme: GameTheme;
}

export const GameThemeContext = createContext<GameThemeContextValue>({
  activeGame: null,
  activeTheme: HUB_DEFAULT_THEME,
  isGameThemeActive: false,
  defaultTheme: HUB_DEFAULT_THEME,
});

export function useGameTheme(): GameThemeContextValue {
  return useContext(GameThemeContext);
}
