#!/usr/bin/env node
/**
 * Nexus Maps — Tile Pyramid Slicer (Node.js + Sharp)
 *
 * Gera uma pirâmide de tiles 256x256px em formato .webp compatível com Leaflet (L.CRS.Simple):
 *   public/tiles/<game-slug>/<map-id>/{z}/{x}/{y}.webp
 *
 * Uso:
 *   npm run slice-map -- --input ./caminho/mapa.png --game elden-ring --map surface
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const DEFAULT_TILE_SIZE = 256;
const DEFAULT_WEBP_QUALITY = 82;

function printUsageAndExit(message) {
  if (message) {
    console.error(`\n[Erro] ${message}\n`);
  }
  console.log(`Uso:
  npm run slice-map -- --input <arquivo> --game <slug> --map <id> [opções]

Opções obrigatórias:
  --input <path>      Imagem de mapa em alta resolução (.png, .jpg, .webp, .tiff)
  --game <slug>       Slug do jogo (ex: elden-ring)
  --map <id>          ID da camada/mapa (ex: surface)

Opções facultativas:
  --tile-size <px>    Tamanho do tile em pixels (padrão: 256)
  --quality <1-100>   Qualidade WebP (padrão: 82)
  --max-zoom <n>      Sobrescreve o zoom máximo calculado automaticamente
  --out <dir>         Diretório de saída customizado (padrão: public/tiles/<game>/<map>)
`);
  process.exit(message ? 1 : 0);
}

async function run() {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      game: { type: 'string', short: 'g' },
      map: { type: 'string', short: 'm' },
      'tile-size': { type: 'string' },
      quality: { type: 'string', short: 'q' },
      'max-zoom': { type: 'string' },
      out: { type: 'string', short: 'o' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    printUsageAndExit();
  }

  const inputPath = values.input;
  const gameSlug = values.game;
  const mapId = values.map;

  if (!inputPath || !gameSlug || !mapId) {
    printUsageAndExit('Os parâmetros --input, --game e --map são obrigatórios.');
  }

  const tileSize = values['tile-size']
    ? Number.parseInt(values['tile-size'], 10)
    : DEFAULT_TILE_SIZE;
  const quality = values.quality
    ? Number.parseInt(values.quality, 10)
    : DEFAULT_WEBP_QUALITY;

  if (!Number.isFinite(tileSize) || tileSize < 64) {
    printUsageAndExit('--tile-size deve ser um número inteiro >= 64.');
  }
  if (!Number.isFinite(quality) || quality < 1 || quality > 100) {
    printUsageAndExit('--quality deve estar entre 1 e 100.');
  }

  const resolvedInput = path.resolve(process.cwd(), inputPath);
  const outputRoot = values.out
    ? path.resolve(process.cwd(), values.out)
    : path.resolve(process.cwd(), 'public', 'tiles', gameSlug, mapId);

  console.log(`\n[Nexus Tile Slicer] Lendo imagem fonte: ${resolvedInput}`);

  const sourceImage = sharp(resolvedInput, { limitInputPixels: false });
  const metadata = await sourceImage.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error('Não foi possível ler as dimensões da imagem de entrada.');
  }

  const { width, height } = metadata;
  const maxDimension = Math.max(width, height);
  const autoMaxZoom = Math.max(0, Math.ceil(Math.log2(maxDimension / tileSize)));
  const maxZoom = values['max-zoom']
    ? Number.parseInt(values['max-zoom'], 10)
    : autoMaxZoom;

  console.log(
    `[Nexus Tile Slicer] Dimensões: ${width}x${height}px | Tile: ${tileSize}px | Zoom: 0..${maxZoom}`
  );
  console.log(`[Nexus Tile Slicer] Saída: ${outputRoot}\n`);

  await fs.mkdir(outputRoot, { recursive: true });

  let totalTilesGenerated = 0;
  const startTime = Date.now();

  for (let z = 0; z <= maxZoom; z += 1) {
    const scale = 2 ** (z - maxZoom);
    const levelWidth = Math.max(1, Math.round(width * scale));
    const levelHeight = Math.max(1, Math.round(height * scale));
    const cols = Math.ceil(levelWidth / tileSize);
    const rows = Math.ceil(levelHeight / tileSize);

    const levelBuffer = await sharp(resolvedInput, { limitInputPixels: false })
      .resize(levelWidth, levelHeight, {
        fit: 'fill',
        kernel: sharp.kernel.lanczos3,
      })
      .ensureAlpha()
      .raw()
      .toBuffer();

    const channels = 4;
    let levelTiles = 0;

    for (let x = 0; x < cols; x += 1) {
      const colDir = path.join(outputRoot, String(z), String(x));
      await fs.mkdir(colDir, { recursive: true });

      const tasks = [];
      for (let y = 0; y < rows; y += 1) {
        const left = x * tileSize;
        const top = y * tileSize;
        const extractWidth = Math.min(tileSize, levelWidth - left);
        const extractHeight = Math.min(tileSize, levelHeight - top);
        const padRight = tileSize - extractWidth;
        const padBottom = tileSize - extractHeight;
        const tileFile = path.join(colDir, `${y}.webp`);

        let tilePipeline = sharp(levelBuffer, {
          raw: { width: levelWidth, height: levelHeight, channels },
        }).extract({
          left,
          top,
          width: extractWidth,
          height: extractHeight,
        });

        if (padRight > 0 || padBottom > 0) {
          tilePipeline = tilePipeline.extend({
            top: 0,
            left: 0,
            right: padRight,
            bottom: padBottom,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          });
        }

        tasks.push(
          tilePipeline
            .webp({ quality, effort: 4 })
            .toFile(tileFile)
            .then(() => {
              levelTiles += 1;
              totalTilesGenerated += 1;
            })
        );
      }

      await Promise.all(tasks);
    }

    console.log(
      `  ✓ z=${z} (${levelWidth}x${levelHeight}px) → ${cols}x${rows} = ${levelTiles} tiles`
    );
  }

  /**
   * Em L.CRS.Simple, pixelY = -lat * 2^zoom.
   * Portanto, bounds no espaço lógico do zoom 0 com origem (0,0) no canto superior esquerdo:
   *   [minX, minY, maxX, maxY] = [0, -logicalHeight, logicalWidth, 0]
   * garantindo que os tiles solicitados pelo Leaflet tenham x >= 0 e y >= 0 (y=0 no topo).
   */
  const scaleAtZero = 2 ** maxZoom;
  const logicalWidth = Math.round((width / scaleAtZero) * 100) / 100;
  const logicalHeight = Math.round((height / scaleAtZero) * 100) / 100;
  const bounds = [0, -logicalHeight, logicalWidth, 0];
  const defaultCenter = [
    Math.round((logicalWidth / 2) * 100) / 100,
    Math.round((-logicalHeight / 2) * 100) / 100,
  ];

  const tileMetadata = {
    gameSlug,
    mapId,
    tileSize,
    sourceDimensions: { width, height },
    minZoom: 0,
    maxZoom,
    bounds,
    defaultCenter,
    defaultZoom: Math.min(2, maxZoom),
    tileUrlTemplate: `/tiles/${gameSlug}/${mapId}/{z}/{x}/{y}.webp`,
    generatedAt: new Date().toISOString(),
  };

  const metadataPath = path.join(outputRoot, 'metadata.json');
  await fs.writeFile(metadataPath, JSON.stringify(tileMetadata, null, 2), 'utf8');

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(
    `\n[Concluído] ${totalTilesGenerated} tiles gerados em ${elapsedSec}s.`
  );
  console.log(`[Metadados] Salvo em: ${metadataPath}`);
  console.log('\nTrecho sugerido para o manifest.json:\n');
  console.log(
    JSON.stringify(
      {
        id: mapId,
        tileUrlTemplate: tileMetadata.tileUrlTemplate,
        minZoom: tileMetadata.minZoom,
        maxZoom: tileMetadata.maxZoom,
        bounds: tileMetadata.bounds,
        defaultCenter: tileMetadata.defaultCenter,
        defaultZoom: tileMetadata.defaultZoom,
      },
      null,
      2
    )
  );
}

run().catch((error) => {
  console.error('\n[Nexus Tile Slicer] Falha:', error instanceof Error ? error.message : error);
  process.exit(1);
});
