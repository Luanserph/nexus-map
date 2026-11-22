import L from 'leaflet';
import type { GameTheme } from '../../types/schema';

export interface TacticalTileLayerOptions extends L.GridLayerOptions {
  tileUrlTemplate?: string;
  theme: GameTheme;
  mapId: string;
}

function drawFallbackCanvasTile(
  canvas: HTMLCanvasElement,
  coords: L.Coords,
  theme: GameTheme
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = canvas.width;

  // Base obsidian/game surface
  ctx.fillStyle = theme.surfaceBase;
  ctx.fillRect(0, 0, size, size);

  // Subtle checkerboard elevation tint for spatial orientation during pan
  if ((Math.abs(coords.x) + Math.abs(coords.y)) % 2 === 0) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.014)';
    ctx.fillRect(0, 0, size, size);
  }

  // Sub-grid (64px)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.032)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let offset = 64; offset < size; offset += 64) {
    ctx.moveTo(offset + 0.5, 0);
    ctx.lineTo(offset + 0.5, size);
    ctx.moveTo(0, offset + 0.5);
    ctx.lineTo(size, offset + 0.5);
  }
  ctx.stroke();

  // Primary tile border (256px)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.065)';
  ctx.strokeRect(0.5, 0.5, size - 1, size - 1);

  // Pattern-specific cartographic accents using the active game's theme palette
  ctx.save();
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = theme.accentPrimary;
  ctx.lineWidth = 1;

  if (theme.backgroundPattern === 'topographic-rings') {
    const hash = Math.abs(coords.x * 31 + coords.y * 17 + coords.z * 7);
    const cx = (hash % 3) * 84 + 44;
    const cy = ((hash >> 2) % 3) * 84 + 44;
    ctx.beginPath();
    ctx.arc(cx, cy, 42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.08;
    ctx.beginPath();
    ctx.arc(cx, cy, 78, 0, Math.PI * 2);
    ctx.stroke();
  } else if (theme.backgroundPattern === 'cyber-grid') {
    ctx.beginPath();
    ctx.moveTo(0, 128.5);
    ctx.lineTo(96, 128.5);
    ctx.lineTo(128, 96.5);
    ctx.lineTo(size, 96.5);
    ctx.stroke();
    ctx.strokeStyle = theme.accentSecondary;
    ctx.globalAlpha = 0.11;
    ctx.strokeRect(140.5, 140.5, 52, 28);
  } else if (theme.backgroundPattern === 'abyssal-contours') {
    ctx.beginPath();
    ctx.moveTo(0, 88);
    ctx.bezierCurveTo(85, 52, 170, 132, size, 88);
    ctx.stroke();
    ctx.strokeStyle = theme.accentSecondary;
    ctx.globalAlpha = 0.09;
    ctx.beginPath();
    ctx.moveTo(0, 184);
    ctx.bezierCurveTo(95, 148, 165, 212, size, 172);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(128.5, 114);
    ctx.lineTo(128.5, 142);
    ctx.moveTo(114, 128.5);
    ctx.lineTo(142, 128.5);
    ctx.stroke();
  }
  ctx.restore();

  // Corner crosshair ticks
  ctx.strokeStyle = theme.accentPrimary;
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, 8.5);
  ctx.lineTo(8.5, 8.5);
  ctx.moveTo(8.5, 0);
  ctx.lineTo(8.5, 8.5);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Subtle monospace tile coordinate label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.font = '10px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText(`z${coords.z} · ${coords.x},${coords.y}`, 12, size - 10);
}

/**
 * Creates a Leaflet GridLayer that loads real `{z}/{x}/{y}.webp` tiles when present
 * and gracefully falls back to a styled cartographic canvas tile using the active game's theme.
 */
export function createTacticalTileLayer(
  options: TacticalTileLayerOptions
): L.GridLayer {
  const { tileUrlTemplate, theme, ...gridOptions } = options;

  const TacticalGridLayer = L.GridLayer.extend({
    createTile(coords: L.Coords, done: L.DoneCallback): HTMLElement {
      const tileSize = this.getTileSize();
      const canvas = document.createElement('canvas');
      canvas.width = tileSize.x;
      canvas.height = tileSize.y;

      // Always paint fallback immediately so pan/zoom stays instantaneous with zero flicker
      drawFallbackCanvasTile(canvas, coords, theme);

      if (!tileUrlTemplate || coords.z < 0 || coords.x < 0 || coords.y < 0) {
        queueMicrotask(() => done(undefined, canvas));
        return canvas;
      }

      const url = tileUrlTemplate
        .replace('{z}', String(coords.z))
        .replace('{x}', String(coords.x))
        .replace('{y}', String(coords.y));

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
        done(undefined, canvas);
      };
      img.onerror = () => {
        // Fallback tile is already rendered on the canvas
        done(undefined, canvas);
      };
      img.src = url;

      return canvas;
    },
  });

  return new (TacticalGridLayer as unknown as new (
    opts?: L.GridLayerOptions
  ) => L.GridLayer)({
    tileSize: 256,
    noWrap: true,
    keepBuffer: 2,
    ...gridOptions,
  });
}
