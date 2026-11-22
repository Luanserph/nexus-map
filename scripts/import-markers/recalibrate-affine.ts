#!/usr/bin/env node
/**
 * Nexus Maps — Utilitário de Recalibração Afim de Marcadores
 *
 * Recalibra coordenadas [x, y] (ou [lng, lat]) de um markers.json existente usando
 * 2 pontos de referência (--ref "srcX,srcY=dstX,dstY") e opcionalmente valida contra
 * um mapa de referência (ou máscara de oceano) para filtrar/marcar outliers.
 *
 * Uso:
 *   npx tsx scripts/import-markers/recalibrate-affine.ts \
 *     --input src/data/games/gta-vi/markers.json \
 *     --ref "-0.66139,0.41644=-0.56200,0.66800" \
 *     --ref "-0.84800,0.11800=-0.77500,0.36500" \
 *     [--precision 5] [--check-ocean-rgb 47,144,176] [--mask-image path.jpg] [--drop-outliers]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';
import { decodeHtmlEntities } from '../../src/core/utils/text';
import type { MapMarker } from '../../src/types/schema';

interface RefPair {
  src: [number, number];
  dst: [number, number];
}

export interface Affine2D {
  scaleX: number;
  offsetX: number;
  scaleY: number;
  offsetY: number;
}

export function parseRefPair(raw: string): RefPair {
  const [srcPart, dstPart] = raw.split('=');
  if (!srcPart || !dstPart) {
    throw new Error(`Formato inválido de --ref: "${raw}". Use "srcX,srcY=dstX,dstY".`);
  }
  const [sx, sy] = srcPart.split(',').map(Number);
  const [dx, dy] = dstPart.split(',').map(Number);
  if (![sx, sy, dx, dy].every(Number.isFinite)) {
    throw new Error(`Coordenadas inválidas em --ref: "${raw}".`);
  }
  return { src: [sx, sy], dst: [dx, dy] };
}

export function computeAffineTransform(p1: RefPair, p2: RefPair): Affine2D {
  const dxSrc = p2.src[0] - p1.src[0];
  const dySrc = p2.src[1] - p1.src[1];
  if (Math.abs(dxSrc) < 1e-9 || Math.abs(dySrc) < 1e-9) {
    throw new Error('Os dois pontos --ref precisam diferir tanto em X quanto em Y.');
  }
  const scaleX = (p2.dst[0] - p1.dst[0]) / dxSrc;
  const scaleY = (p2.dst[1] - p1.dst[1]) / dySrc;
  const offsetX = p1.dst[0] - p1.src[0] * scaleX;
  const offsetY = p1.dst[1] - p1.src[1] * scaleY;
  return { scaleX, offsetX, scaleY, offsetY };
}

export function applyAffine(
  coords: [number, number],
  t: Affine2D,
  precision = 5
): [number, number] {
  const factor = 10 ** precision;
  const nx = Math.round((coords[0] * t.scaleX + t.offsetX) * factor) / factor;
  const ny = Math.round((coords[1] * t.scaleY + t.offsetY) * factor) / factor;
  return [nx, ny];
}

async function isOnLand(
  lng: number,
  lat: number,
  maskData: Buffer,
  maskW: number,
  maskH: number,
  oceanRgb: [number, number, number],
  bounds: { west: number; east: number; south: number; north: number }
): Promise<boolean> {
  const px = Math.round(((lng - bounds.west) / (bounds.east - bounds.west)) * (maskW - 1));
  const py = Math.round(((bounds.north - lat) / (bounds.north - bounds.south)) * (maskH - 1));
  if (px < 0 || px >= maskW || py < 0 || py >= maskH) return false;

  // Check a small 5x5 neighborhood around the pin so coastline pins are preserved
  const [or, og, ob] = oceanRgb;
  for (let dy = -3; dy <= 3; dy++) {
    for (let dx = -3; dx <= 3; dx++) {
      const cx = Math.max(0, Math.min(maskW - 1, px + dx));
      const cy = Math.max(0, Math.min(maskH - 1, py + dy));
      const idx = (cy * maskW + cx) * 4;
      const r = maskData[idx];
      const g = maskData[idx + 1];
      const b = maskData[idx + 2];
      // Deep ocean & shallow-water halo are strongly blue (b > r + 40 && g > r + 25)
      const isDeepOcean =
        Math.abs(r - or) + Math.abs(g - og) + Math.abs(b - ob) < 55;
      const isWaterBlue = b > r + 45 && g > r + 25 && r < 90;
      if (!isDeepOcean && !isWaterBlue) {
        return true;
      }
    }
  }
  return false;
}

async function main() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      ref: { type: 'string', multiple: true },
      precision: { type: 'string' },
      'mask-image': { type: 'string' },
      'ocean-rgb': { type: 'string' },
      'mask-bounds': { type: 'string' }, // west,south,east,north
      'drop-outliers': { type: 'boolean' },
      'manifest': { type: 'string' },
    },
    strict: true,
  });

  if (!values.input || !values.ref || values.ref.length < 2) {
    console.error(
      'Uso: npx tsx scripts/import-markers/recalibrate-affine.ts --input <markers.json> --ref "sx1,sy1=dx1,dy1" --ref "sx2,sy2=dx2,dy2"'
    );
    process.exit(1);
  }

  const p1 = parseRefPair(values.ref[0]);
  const p2 = parseRefPair(values.ref[1]);
  const affine = computeAffineTransform(p1, p2);
  const precision = values.precision ? Number.parseInt(values.precision, 10) : 5;

  console.log('[Recalibrate Affine] Transform:', affine);

  const inputPath = path.resolve(values.input);
  const markers = JSON.parse(await fs.readFile(inputPath, 'utf8')) as MapMarker[];

  let maskBuffer: Buffer | null = null;
  let maskW = 0;
  let maskH = 0;
  let oceanRgb: [number, number, number] = [47, 144, 176];
  let maskBounds = { west: -1.40625, south: 0, east: 0, north: 1.40611 };

  if (values['mask-image']) {
    const resolvedMask = path.resolve(values['mask-image']);
    const { data, info } = await sharp(resolvedMask)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    maskBuffer = data;
    maskW = info.width;
    maskH = info.height;
    if (values['ocean-rgb']) {
      const parts = values['ocean-rgb'].split(',').map(Number);
      if (parts.length === 3 && parts.every(Number.isFinite)) {
        oceanRgb = [parts[0], parts[1], parts[2]];
      }
    }
    if (values['mask-bounds']) {
      const parts = values['mask-bounds'].split(',').map(Number);
      if (parts.length === 4 && parts.every(Number.isFinite)) {
        maskBounds = {
          west: parts[0],
          south: parts[1],
          east: parts[2],
          north: parts[3],
        };
      }
    }
  }

  const result: MapMarker[] = [];
  let onLandCount = 0;
  let outlierCount = 0;

  for (const marker of markers) {
    const [nx, ny] = applyAffine(marker.coords, affine, precision);
    const cleaned: MapMarker = {
      ...marker,
      title: decodeHtmlEntities(marker.title),
      description: decodeHtmlEntities(marker.description),
      region: marker.region ? decodeHtmlEntities(marker.region) : undefined,
      coords: [nx, ny],
    };

    if (maskBuffer) {
      const land = await isOnLand(nx, ny, maskBuffer, maskW, maskH, oceanRgb, maskBounds);
      if (land) {
        onLandCount++;
        if (cleaned.tags) {
          cleaned.tags = cleaned.tags.filter((t) => t !== 'needs-realign');
          if (cleaned.tags.length === 0) delete cleaned.tags;
        }
        result.push(cleaned);
      } else {
        outlierCount++;
        if (!values['drop-outliers']) {
          const tags = new Set(cleaned.tags ?? []);
          tags.add('needs-realign');
          cleaned.tags = Array.from(tags);
          result.push(cleaned);
        }
      }
    } else {
      result.push(cleaned);
    }
  }

  await fs.writeFile(inputPath, JSON.stringify(result, null, 2) + '\n', 'utf8');
  console.log(
    `[Recalibrate Affine] Salvo ${result.length} marcadores em ${inputPath} (terra: ${onLandCount}, outliers: ${outlierCount}, drop=${Boolean(values['drop-outliers'])})`
  );

  if (values.manifest) {
    const manifestPath = path.resolve(values.manifest);
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    if (Array.isArray(manifest.maps) && manifest.maps[0]) {
      manifest.maps[0].pinsCount = result.length;
      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
      console.log(`[Recalibrate Affine] Atualizado pinsCount=${result.length} em ${manifestPath}`);
    }
  }
}

main();
