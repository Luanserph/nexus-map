import type { GameTheme } from '../../types/schema';

export const DEFAULT_FONT_DISPLAY = "'Space Grotesk', system-ui, sans-serif";

export const HUB_DEFAULT_THEME: GameTheme = {
  accentPrimary: '#00F0FF',
  accentSecondary: '#FF2A85',
  accentGlow: 'rgba(0, 240, 255, 0.32)',
  glassTint: 'rgba(13, 17, 24, 0.72)',
  surfaceBase: '#07090D',
  fontDisplay: DEFAULT_FONT_DISPLAY,
  backgroundPattern: 'tactical-grid',
  badgeStyle: 'minimal',
};
