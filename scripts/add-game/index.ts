#!/usr/bin/env node
/**
 * Nexus Maps — Pipeline Automatizado de Ingestão de Jogos
 *
 * Uso:
 *   npm run add-game -- --name "Nome do Jogo" [--map-url "https://..."] [--map-id "main"]
 */

import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseArgs, promisify } from 'node:util';
import sharp from 'sharp';
import type { GameManifest, GameMapLayer, MapMarker } from '../../src/types/schema';
import {
  downloadBuffer,
  fetchRawgMetadata,
  fetchSteamGridDbAssets,
} from './apis';
import { loadDotEnv } from './env';
import { extractThemeFromImage } from './themeExtractor';

const execFileAsync = promisify(execFile);

interface TileMetadataFile {
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number];
  defaultCenter: [number, number];
  defaultZoom: number;
  tileUrlTemplate: string;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function printUsageAndExit(errorMessage?: string): never {
  if (errorMessage) {
    console.error(`\n[Erro] ${errorMessage}\n`);
  }
  console.log(`Uso:
  npm run add-game -- --name "Nome do Jogo" [opções]

Opções obrigatórias:
  --name, -n <string>     Nome do jogo para buscar na RAWG / SteamGridDB

Opções facultativas:
  --slug, -s <slug>       Sobrescreve o slug gerado automaticamente
  --map-url, -u <url>     URL da imagem em alta resolução do mapa para fatiar em tiles .webp
  --map-id, -m <id>       ID da camada principal do mapa (padrão: "main")
  --map-name <string>     Nome exibido da camada principal (padrão: "Mapa Principal")
  --force, -f             Sobrescreve src/data/games/<slug>/ se já existir
  --help, -h              Exibe esta ajuda
`);
  process.exit(errorMessage ? 1 : 0);
}

async function optimizeAndSaveWebp(
  buffer: Buffer,
  outputPath: string,
  options: { width: number; height?: number; quality?: number; fit?: 'cover' | 'inside' }
): Promise<void> {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(buffer)
    .resize(options.width, options.height, {
      fit: options.fit ?? 'cover',
      withoutEnlargement: true,
    })
    .webp({ quality: options.quality ?? 84, effort: 4 })
    .toFile(outputPath);
}

async function run(): Promise<void> {
  loadDotEnv();

  const { values } = parseArgs({
    options: {
      name: { type: 'string', short: 'n' },
      slug: { type: 'string', short: 's' },
      'map-url': { type: 'string', short: 'u' },
      'map-id': { type: 'string', short: 'm' },
      'map-name': { type: 'string' },
      force: { type: 'boolean', short: 'f' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    printUsageAndExit();
  }

  const gameName = values.name?.trim();
  if (!gameName) {
    printUsageAndExit('O parâmetro --name é obrigatório.');
  }

  const rawgApiKey = process.env.RAWG_API_KEY?.trim();
  const sgdbApiKey = process.env.STEAMGRIDDB_API_KEY?.trim();

  if (!rawgApiKey) {
    printUsageAndExit(
      'Variável RAWG_API_KEY não encontrada. Copie .env.example para .env e informe sua chave da RAWG API.'
    );
  }

  const mapId = values['map-id']?.trim() || 'main';
  const mapName = values['map-name']?.trim() || 'Mapa Principal';
  const mapUrl = values['map-url']?.trim();

  console.log(`\n[Nexus Add-Game] Buscando metadados para "${gameName}" na RAWG API...`);
  const rawg = await fetchRawgMetadata(gameName, rawgApiKey);
  const slug = values.slug?.trim() ? slugify(values.slug) : rawg.slug || slugify(rawg.title);

  const gameDataDir = path.resolve(process.cwd(), 'src', 'data', 'games', slug);
  const publicAssetsDir = path.resolve(process.cwd(), 'public', 'games', slug);

  try {
    await fs.access(gameDataDir);
    if (!values.force) {
      printUsageAndExit(
        `O jogo "${slug}" já existe em src/data/games/${slug}/. Use --force para sobrescrever.`
      );
    }
  } catch {
    // Directory does not exist yet — expected path
  }

  console.log(
    `[Nexus Add-Game] Encontrado: ${rawg.title} (${rawg.releaseYear}) — ${rawg.studio} [${rawg.genres.join(', ')}]`
  );

  // Fetch high-res assets from SteamGridDB (optional, with automatic fallback to RAWG)
  if (sgdbApiKey) {
    console.log('[Nexus Add-Game] Consultando SteamGridDB para capa, banner e logo...');
  } else {
    console.log(
      '[Nexus Add-Game] STEAMGRIDDB_API_KEY não definida — usando fallback de imagens da RAWG.'
    );
  }
  const sgdb = await fetchSteamGridDbAssets(rawg.title, sgdbApiKey);

  const coverSourceUrl = sgdb.coverUrl ?? rawg.backgroundImage;
  const bannerSourceUrl =
    sgdb.bannerUrl ?? rawg.additionalImage ?? rawg.backgroundImage;
  const logoSourceUrl = sgdb.logoUrl;

  const assets: GameManifest['assets'] = {};
  let themeSampleBuffer: Buffer | null = null;

  if (coverSourceUrl) {
    console.log('[Nexus Add-Game] Baixando e convertendo capa para .webp...');
    const coverBuffer = await downloadBuffer(coverSourceUrl);
    themeSampleBuffer = coverBuffer;
    await optimizeAndSaveWebp(
      coverBuffer,
      path.join(publicAssetsDir, 'cover.webp'),
      { width: 920, height: 430, fit: 'cover', quality: 84 }
    );
    assets.coverImage = `/games/${slug}/cover.webp`;
  }

  if (bannerSourceUrl) {
    console.log('[Nexus Add-Game] Baixando e convertendo banner para .webp...');
    const bannerBuffer =
      bannerSourceUrl === coverSourceUrl && themeSampleBuffer
        ? themeSampleBuffer
        : await downloadBuffer(bannerSourceUrl);
    if (!themeSampleBuffer) themeSampleBuffer = bannerBuffer;
    await optimizeAndSaveWebp(
      bannerBuffer,
      path.join(publicAssetsDir, 'banner.webp'),
      { width: 1440, height: 480, fit: 'cover', quality: 82 }
    );
    assets.bannerImage = `/games/${slug}/banner.webp`;
  }

  if (logoSourceUrl) {
    console.log('[Nexus Add-Game] Baixando e convertendo logo para .webp...');
    const logoBuffer = await downloadBuffer(logoSourceUrl);
    await optimizeAndSaveWebp(
      logoBuffer,
      path.join(publicAssetsDir, 'logo.webp'),
      { width: 640, fit: 'inside', quality: 88 }
    );
    assets.logoImage = `/games/${slug}/logo.webp`;
  }

  // Extract vibrant Neon Glassmorphism theme tokens from cover/banner
  console.log('[Nexus Add-Game] Extraindo paleta vibrante para o Theme Engine...');
  const theme = await extractThemeFromImage(themeSampleBuffer, rawg.genres);
  console.log(
    `  ✓ Tema extraído: primary=${theme.accentPrimary}, secondary=${theme.accentSecondary}, surface=${theme.surfaceBase}`
  );

  // Default planar layer config (overridden if --map-url is sliced)
  let primaryLayer: GameMapLayer = {
    id: mapId,
    name: mapName,
    pinsCount: 1,
    icon: 'compass',
    tileUrlTemplate: `/tiles/${slug}/${mapId}/{z}/{x}/{y}.webp`,
    minZoom: -1,
    maxZoom: 4,
    bounds: [0, 0, 1024, 1024],
    defaultCenter: [512, 512],
    defaultZoom: 0,
  };

  if (mapUrl) {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'nexus-maps-ingest-'));
    const tempMapPath = path.join(tempDir, 'source-map.img');

    try {
      console.log(`[Nexus Add-Game] Baixando imagem do mapa de ${mapUrl}...`);
      const mapBuffer = await downloadBuffer(mapUrl);
      await fs.writeFile(tempMapPath, mapBuffer);

      console.log('[Nexus Add-Game] Executando scripts/tile-slicer/slice-map.mjs...');
      const slicerPath = path.resolve(
        process.cwd(),
        'scripts',
        'tile-slicer',
        'slice-map.mjs'
      );

      const { stdout } = await execFileAsync(
        process.execPath,
        [slicerPath, '--input', tempMapPath, '--game', slug, '--map', mapId],
        { cwd: process.cwd() }
      );
      if (stdout.trim()) {
        console.log(stdout.trim());
      }

      const metadataPath = path.resolve(
        process.cwd(),
        'public',
        'tiles',
        slug,
        mapId,
        'metadata.json'
      );
      const rawMeta = await fs.readFile(metadataPath, 'utf8');
      const tileMeta = JSON.parse(rawMeta) as TileMetadataFile;

      primaryLayer = {
        ...primaryLayer,
        tileUrlTemplate: tileMeta.tileUrlTemplate,
        minZoom: tileMeta.minZoom,
        maxZoom: tileMeta.maxZoom,
        bounds: tileMeta.bounds,
        defaultCenter: tileMeta.defaultCenter,
        defaultZoom: tileMeta.defaultZoom,
      };
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
      console.log('[Nexus Add-Game] Arquivo temporário do mapa removido.');
    }
  }

  const manifest: GameManifest = {
    id: `game-${slug}`,
    slug,
    title: rawg.title,
    subtitle: `${rawg.studio} · Atlas Interativo`,
    studio: rawg.studio,
    releaseYear: rawg.releaseYear,
    genres: rawg.genres,
    status: 'available',
    assets,
    theme,
    maps: [primaryLayer],
    categoryGroups: [
      {
        id: 'locations',
        label: 'Locais',
        categories: [
          {
            id: 'landmark',
            groupId: 'locations',
            name: 'Ponto de Referência',
            icon: 'landmark',
            color: theme.accentPrimary,
            defaultVisible: true,
          },
          {
            id: 'fast-travel',
            groupId: 'locations',
            name: 'Viagem Rápida',
            icon: 'navigation',
            color: theme.accentSecondary,
            defaultVisible: true,
          },
        ],
      },
      {
        id: 'collectibles',
        label: 'Colecionáveis',
        categories: [
          {
            id: 'collectible',
            groupId: 'collectibles',
            name: 'Item Colecionável',
            icon: 'sparkles',
            color: '#6EE7B7',
            defaultVisible: true,
          },
        ],
      },
    ],
  };

  const center = primaryLayer.defaultCenter ?? [512, 512];
  const initialMarkers: MapMarker[] = [
    {
      id: `${slug}-origin-01`,
      mapId: primaryLayer.id,
      category: 'landmark',
      title: `Ponto Inicial — ${rawg.title}`,
      description:
        'Marcador inicial gerado automaticamente pelo pipeline de ingestão. Edite src/data/games/' +
        `${slug}/markers.json para catalogar os pontos deste mapa.`,
      coords: [center[0], center[1]],
      region: primaryLayer.name,
      metadata: {
        geradoPor: 'nexus-add-game',
      },
    },
  ];

  await fs.mkdir(gameDataDir, { recursive: true });
  const manifestPath = path.join(gameDataDir, 'manifest.json');
  const markersPath = path.join(gameDataDir, 'markers.json');

  await Promise.all([
    fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8'),
    fs.writeFile(
      markersPath,
      `${JSON.stringify(initialMarkers, null, 2)}\n`,
      'utf8'
    ),
  ]);

  console.log('\n[Concluído] Jogo ingerido com sucesso!');
  console.log(`  • Manifesto: ${path.relative(process.cwd(), manifestPath)}`);
  console.log(`  • Marcadores: ${path.relative(process.cwd(), markersPath)}`);
  if (Object.keys(assets).length > 0) {
    console.log(`  • Assets WebP: public/games/${slug}/`);
  }
  console.log(
    '  • Registro: detectado automaticamente pelo Vite via import.meta.glob em src/data/games/index.ts\n'
  );
}

run().catch((error) => {
  console.error(
    '\n[Nexus Add-Game] Falha:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
