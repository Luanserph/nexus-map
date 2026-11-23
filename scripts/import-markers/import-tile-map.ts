#!/usr/bin/env node
/**
 * Nexus Maps — Importador Universal de Mapas EPSG:3857 (tileSets + locations + regions)
 *
 * Lê `temp/<game-slug>/` (ou `temp/<game-slug>/<map-slug>/`):
 *   - `page.html` (extrai `window.mapData` / `window.mapConfig`) ou `config.json`
 *   - `data.json` (extrai `locations` e `regions` com polígonos GeoJSON)
 *
 * Atualiza de forma segura (multi-mapa, sem apagar outros mapas do mesmo jogo):
 *   - `src/data/games/<game-slug>/manifest.json`
 *   - `src/data/games/<game-slug>/markers.json`
 *   - `src/data/games/<game-slug>/regions.json`
 *
 * Uso:
 *   npm run import-map -- <game-slug> <map-slug> [--name "Night City"] [--dlc "base"] [--keep-temp]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { decodeHtmlEntities } from '../../src/core/utils/text';
import { GAME_PRESETS } from './game-presets';
import type {
  Category,
  CategoryGroup,
  GameManifest,
  GameMapLayer,
  MapMarker,
  MapRegion,
  MapTileSet,
} from '../../src/types/schema';

interface RawTileSetBounds {
  [zoom: string]: {
    x?: [number, number];
    y?: [number, number];
  };
}

interface RawTileSet {
  id?: number | string;
  name?: string;
  label?: string;
  pattern?: string;
  urlTemplate?: string;
  extension?: string;
  min_zoom?: number;
  max_zoom?: number;
  tiles_max_zoom?: number;
  background_color?: string;
  bounds?: RawTileSetBounds;
}

interface RawCategory {
  id: number | string;
  title?: string;
  name?: string;
  icon?: string;
  color?: string;
}

interface RawGroup {
  id: number | string;
  title?: string;
  name?: string;
  categories?: RawCategory[];
}

interface RawLocation {
  id: number | string;
  region_id?: number | null;
  category_id: number | string;
  title?: string;
  description?: string;
  latitude: string | number;
  longitude: string | number;
  media?: Array<{ url?: string; type?: string }>;
}

interface RawRegion {
  id: number | string;
  parent_region_id?: number | string | null;
  title?: string;
  center_x: string | number;
  center_y: string | number;
  features?: unknown[];
}

const NEON_PALETTE = [
  '#38BDF8',
  '#F472B6',
  '#FBBF24',
  '#34D399',
  '#A78BFA',
  '#FB7185',
  '#2DD4BF',
  '#FB923C',
  '#60A5FA',
  '#E879F9',
  '#FACC15',
  '#4ADE80',
];

const ULTRA_DENSE_PATTERN =
  /\b(bus\s*stop|atm|electric\s*charger|street\s*food|bar|cafe|takeout|under\s*the\s*bridge|fast\s*food|vending|korok|material|creature|ore\s*deposit|weapon|arrow|enemy\s*camp|monster\s*camp|poe|rupee|treasure\s*chest|chest|mushroom|herb|flower|fish|insect|shield|bow|zonai|bubbulfrog|addison|crafting|smithing|golden\s*rune|consumable)\b/i;

const PRIORITY_VISIBLE_PATTERN =
  /\b(shrine|skyview\s*tower|sheikah\s*tower|remnawave\s*tower|tower|lightroot|dungeon|temple|sanctum|settlement|town|village|stable|great\s*fairy|heart\s*piece|piece\s*of\s*heart|heart\s*container|gold\s*skulltula|skulltula|boss|notorious\s*mark|hunt|esper|classified|maiamai|secret\s*seashell|seashell|goddess\s*statue|dragon\s*tear|geoglyph|rift|site\s*of\s*grace|fast\s*travel|obelisk|chronolith|chocobo\s*stop|summon\s*crystal|protorelic|lifespring|world\s*intel|save\s*point|lucky\s*emblem|hidden\s*mickey|weapon\s*case|skill\s*point|kingslayer|outpost|sester|bonfire|mirror\s*of\s*light|oni\s*portal|shell|crtv|key\s*item|keycard|barn\s*find|fast\s*travel\s*board|xp\s*board|speed\s*trap|viewpoint|animus\s*fragment|treasure\s*map|shanty|wreck|blueprint|pda|cassette|substory|substories|locker\s*key|trinket|gobbo)\b/i;

function tileXToLng(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

function extractRangePair(
  raw: unknown
): [number, number] | null {
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = Number(raw[0]);
    const b = Number(raw[1]);
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }
  if (raw && typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    const a = Number(obj.min ?? obj[0] ?? obj.start);
    const b = Number(obj.max ?? obj[1] ?? obj.end);
    return Number.isFinite(a) && Number.isFinite(b) ? [a, b] : null;
  }
  return null;
}

function computeTileBoundsFromGrid(
  bounds?: RawTileSetBounds
): [[number, number], [number, number]] | undefined {
  if (!bounds || typeof bounds !== 'object') return undefined;

  const zoomKeys = Object.keys(bounds)
    .map((k) => Number(k))
    .filter((n) => Number.isFinite(n))
    .sort((a, b) => b - a);

  for (const z of zoomKeys) {
    const entry = bounds[String(z)];
    if (!entry?.x || !entry?.y) continue;
    const xPair = extractRangePair(entry.x);
    const yPair = extractRangePair(entry.y);
    if (!xPair || !yPair) continue;
    const [minX, maxX] = xPair;
    const [minY, maxY] = yPair;

    const west = Number(tileXToLng(minX, z).toFixed(5));
    const east = Number(tileXToLng(maxX + 1, z).toFixed(5));
    const north = Number(tileYToLat(minY, z).toFixed(5));
    const south = Number(tileYToLat(maxY + 1, z).toFixed(5));
    if ([west, east, north, south].every(Number.isFinite)) {
      return [
        [south, west],
        [north, east],
      ];
    }
  }
  return undefined;
}

/**
 * Extracts a balanced JS/JSON object literal assigned to `varName = { ... }` in HTML.
 */
function extractAssignedJsonObject(
  html: string,
  varName: string
): Record<string, unknown> | null {
  const marker = new RegExp(`${varName.replace('.', '\\.')}\\s*=\\s*\\{`);
  const match = marker.exec(html);
  if (!match) return null;

  const startIdx = match.index + match[0].length - 1;
  let depth = 0;
  let inString: '"' | "'" | null = null;
  let escaped = false;

  for (let i = startIdx; i < html.length; i++) {
    const ch = html[i];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
    } else if (ch === '{') {
      depth++;
    } else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const raw = html.slice(startIdx, i + 1);
        try {
          return JSON.parse(raw) as Record<string, unknown>;
        } catch {
          // Fallback for JS object literals with unquoted keys or trailing commas
          return new Function(`return (${raw})`)() as Record<string, unknown>;
        }
      }
    }
  }
  return null;
}

function slugifyId(raw: string): string {
  return raw
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pickLucideIcon(rawName: string): string {
  const lower = rawName.toLowerCase();
  if (/boss|skull|psycho|enemy|hunt|illegal|gang/.test(lower)) return 'skull';
  if (/fast\s*travel|signpost|grace|stag|dataterm|waypoint/.test(lower)) return 'navigation';
  if (/shop|store|vendor|merchant|ripper|arm|gun|ammo|weapon/.test(lower)) return 'shopping-bag';
  if (/quest|mission|gig|contract|story/.test(lower)) return 'scroll-text';
  if (/chest|treasure|loot|safe|bank|jewelry|collect|card|tarot|relic|grub/.test(lower)) return 'gem';
  if (/stunt|jump|race|flame|fire/.test(lower)) return 'flame';
  if (/garage|home|house|motel|bench|camp|safe\s*house/.test(lower)) return 'bookmark';
  if (/landmark|view|tower|monument|poi/.test(lower)) return 'landmark';
  if (/radio|waink|drone|signal/.test(lower)) return 'radio';
  if (/club|magic|charm|sparkle|spray/.test(lower)) return 'sparkles';
  return 'map-pin';
}

function cleanText(raw: unknown): string {
  return decodeHtmlEntities(String(raw ?? ''))
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function findSourceFile(
  dirs: string[],
  candidates: string[]
): Promise<string | null> {
  for (const dir of dirs) {
    for (const file of candidates) {
      const full = path.join(dir, file);
      if (await fileExists(full)) return full;
    }
  }
  return null;
}

async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      name: { type: 'string' },
      dlc: { type: 'string' },
      'keep-temp': { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  const [gameSlug, mapSlug] = positionals;
  if (values.help || !gameSlug || !mapSlug) {
    console.log(`Uso:
  npm run import-map -- <game-slug> <map-slug> [opções]

Arquivos esperados em temp/<game-slug>/ (ou temp/<game-slug>/<map-slug>/):
  - page.html (com window.mapData / window.mapConfig) ou config.json
  - data.json (com locations e regions)

Opções:
  --name <string>   Nome amigável do mapa (sobrescreve o do manifesto/config)
  --dlc <string>    ID da DLC (padrão: "base")
  --keep-temp       Mantém os arquivos de temp/ após a importação
`);
    process.exit(values.help ? 0 : 1);
  }

  const bundlePath = path.resolve('temp', `${gameSlug}__${mapSlug}.json`);
  const hasBundle = await fileExists(bundlePath);

  const searchDirs = [
    path.resolve('temp', gameSlug, mapSlug),
    path.resolve('temp', gameSlug),
  ];

  const htmlPath = hasBundle
    ? null
    : await findSourceFile(searchDirs, ['page.html', `${mapSlug}.html`]);
  const configJsonPath = hasBundle
    ? null
    : await findSourceFile(searchDirs, ['config.json', `${mapSlug}.config.json`]);
  const dataJsonPath = hasBundle
    ? null
    : await findSourceFile(searchDirs, ['data.json', `${mapSlug}.json`]);

  if (!hasBundle && !htmlPath && !configJsonPath && !dataJsonPath) {
    console.error(
      `[Erro] Nenhum arquivo encontrado em temp/${gameSlug}__${mapSlug}.json, temp/${gameSlug}/ ou temp/${gameSlug}/${mapSlug}/.\n` +
        'Rode `npm run extract-maps` ou coloque page.html (ou config.json) e data.json nessa pasta.'
    );
    process.exit(1);
  }

  let mapDataObj: Record<string, unknown> = {};
  let mapConfigObj: Record<string, unknown> = {};
  let dataPayload: Record<string, unknown> = {};
  let tilesCdnUrl = '';
  let bundleMetaName: string | undefined;
  let bundleMetaDlc: string | undefined;
  let bundleCoverUrl: string | undefined;

  if (hasBundle) {
    console.log(`[import-map] Lendo Bundle unificado: ${bundlePath}`);
    const bundle = JSON.parse(await fs.readFile(bundlePath, 'utf8')) as {
      meta?: { name?: string; dlc?: string; coverUrl?: string };
      game?: Record<string, unknown> | null;
      tilesCdnUrl?: string | null;
      mapData?: Record<string, unknown> | null;
      data?: Record<string, unknown> | null;
    };
    bundleMetaName = bundle.meta?.name;
    bundleMetaDlc = bundle.meta?.dlc;
    bundleCoverUrl =
      bundle.meta?.coverUrl ||
      (typeof bundle.game?.image === 'string' ? bundle.game.image : undefined) ||
      (typeof bundle.game?.cover_image === 'string' ? bundle.game.cover_image : undefined) ||
      (typeof bundle.game?.banner_image === 'string' ? bundle.game.banner_image : undefined);
    tilesCdnUrl =
      typeof bundle.tilesCdnUrl === 'string'
        ? bundle.tilesCdnUrl.trim().replace(/\/+$/, '')
        : '';
    mapDataObj = (bundle.mapData ?? {}) as Record<string, unknown>;
    mapConfigObj =
      (mapDataObj.mapConfig as Record<string, unknown> | undefined) ??
      ((mapDataObj.map as { config?: Record<string, unknown> } | undefined)?.config ??
        {});
    dataPayload = {
      ...mapDataObj,
      ...((bundle.data ?? {}) as Record<string, unknown>),
    };
  }

  if (htmlPath) {
    console.log(`[import-map] Lendo HTML: ${htmlPath}`);
    const html = await fs.readFile(htmlPath, 'utf8');
    mapDataObj = extractAssignedJsonObject(html, 'window.mapData') ?? {};
    mapConfigObj =
      extractAssignedJsonObject(html, 'window.mapConfig') ??
      ((mapDataObj.mapConfig as Record<string, unknown>) ?? {});
  }

  if (configJsonPath) {
    console.log(`[import-map] Lendo Config: ${configJsonPath}`);
    const cfg = JSON.parse(await fs.readFile(configJsonPath, 'utf8')) as Record<
      string,
      unknown
    >;
    mapDataObj = { ...mapDataObj, ...cfg };
    if (cfg.mapConfig && typeof cfg.mapConfig === 'object') {
      mapConfigObj = {
        ...mapConfigObj,
        ...(cfg.mapConfig as Record<string, unknown>),
      };
    } else if (cfg.tile_sets) {
      mapConfigObj = { ...mapConfigObj, ...cfg };
    }
  }

  if (!hasBundle) {
    dataPayload = { ...mapDataObj };
  }
  if (dataJsonPath) {
    console.log(`[import-map] Lendo Data: ${dataJsonPath}`);
    const parsed = JSON.parse(await fs.readFile(dataJsonPath, 'utf8')) as Record<
      string,
      unknown
    >;
    dataPayload = { ...dataPayload, ...parsed };
  }

  const rawLocations = (dataPayload.locations as RawLocation[] | undefined) ?? [];
  const rawRegions = (dataPayload.regions as RawRegion[] | undefined) ?? [];
  const rawGroups =
    (mapDataObj.groups as RawGroup[] | undefined) ??
    (dataPayload.groups as RawGroup[] | undefined) ??
    [];
  const rawCategoriesMap =
    (mapDataObj.categories as Record<string, RawCategory> | undefined) ??
    (dataPayload.categories as Record<string, RawCategory> | undefined) ??
    {};

  // 1. Extract regions with mapId for multi-map isolation
  const regionNameById = new Map<string, string>();
  const importedRegions: MapRegion[] = [];
  let nanRegions = 0;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const reg of rawRegions) {
    const cx = Number(reg.center_x);
    const cy = Number(reg.center_y);
    const title = cleanText(reg.title);
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !title) {
      nanRegions++;
      continue;
    }
    regionNameById.set(String(reg.id), title);
    importedRegions.push({
      id: reg.id,
      mapId: mapSlug,
      parentRegionId: reg.parent_region_id ?? null,
      title,
      centerX: cx,
      centerY: cy,
      features: Array.isArray(reg.features) ? reg.features : [],
    });
    if (cx < minLng) minLng = cx;
    if (cx > maxLng) maxLng = cx;
    if (cy < minLat) minLat = cy;
    if (cy > maxLat) maxLat = cy;
  }

  // 2. Build category lookup from groups / categories
  const catMetaBySourceId = new Map<
    string,
    { id: string; groupId: string; groupLabel: string; name: string; icon: string; color: string }
  >();
  let colorCursor = 0;

  for (const grp of rawGroups) {
    const grpTitle = cleanText(grp.title ?? grp.name ?? 'Locais');
    const grpSlug = slugifyId(grpTitle) || `group-${grp.id}`;
    for (const cat of grp.categories ?? []) {
      const catTitle = cleanText(cat.title ?? cat.name ?? `Categoria ${cat.id}`);
      const catSlug = slugifyId(catTitle) || `cat-${cat.id}`;
      catMetaBySourceId.set(String(cat.id), {
        id: catSlug,
        groupId: grpSlug,
        groupLabel: grpTitle,
        name: catTitle,
        icon: pickLucideIcon(catTitle),
        color: cat.color || NEON_PALETTE[colorCursor++ % NEON_PALETTE.length],
      });
    }
  }

  for (const cat of Object.values(rawCategoriesMap)) {
    const key = String(cat.id);
    if (catMetaBySourceId.has(key)) continue;
    const catTitle = cleanText(cat.title ?? cat.name ?? `Categoria ${cat.id}`);
    const catSlug = slugifyId(catTitle) || `cat-${cat.id}`;
    catMetaBySourceId.set(key, {
      id: catSlug,
      groupId: 'locations',
      groupLabel: 'Locais',
      name: catTitle,
      icon: pickLucideIcon(catTitle),
      color: cat.color || NEON_PALETTE[colorCursor++ % NEON_PALETTE.length],
    });
  }

  // 3. Extract locations preserving exact EPSG:3857 latitude & longitude
  const importedMarkers: MapMarker[] = [];
  const countByCatSlug: Record<string, number> = {};
  let nanLocations = 0;

  for (const loc of rawLocations) {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      nanLocations++;
      continue;
    }

    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;

    const meta = catMetaBySourceId.get(String(loc.category_id));
    const catSlug = meta?.id ?? `cat-${loc.category_id}`;
    const regionName =
      (loc.region_id != null ? regionNameById.get(String(loc.region_id)) : undefined) ??
      values.name ??
      mapSlug;

    const title = cleanText(loc.title || meta?.name || 'Ponto de Interesse');
    const rawDesc = cleanText(loc.description);
    const description =
      rawDesc || `${meta?.name ?? 'Ponto de interesse'} localizado em ${regionName}.`;

    const firstImage = Array.isArray(loc.media)
      ? loc.media.find(
          (m) => m.type === 'image' && typeof m.url === 'string' && m.url.startsWith('http')
        )?.url
      : undefined;

    importedMarkers.push({
      id: `${gameSlug}-${mapSlug}-${loc.id}`,
      mapId: mapSlug,
      category: catSlug,
      title,
      description,
      coords: [lng, lat],
      region: regionName,
      dlc: values.dlc ?? 'base',
      ...(firstImage ? { imageUrl: firstImage } : {}),
    });

    countByCatSlug[catSlug] = (countByCatSlug[catSlug] || 0) + 1;
  }

  // 4. Derive fallback geographic bounds from markers/regions
  const hasGeoSpan =
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLng) &&
    Number.isFinite(maxLng);

  const latPad = hasGeoSpan ? Math.max(0.04, (maxLat - minLat) * 0.08) : 0.1;
  const lngPad = hasGeoSpan ? Math.max(0.04, (maxLng - minLng) * 0.08) : 0.1;
  const derivedBounds: [[number, number], [number, number]] = hasGeoSpan
    ? [
        [Number((minLat - latPad).toFixed(5)), Number((minLng - lngPad).toFixed(5))],
        [Number((maxLat + latPad).toFixed(5)), Number((maxLng + lngPad).toFixed(5))],
      ]
    : [
        [0, -1.40625],
        [1.40611, 0],
      ];

  // 5. Build tileSets from mapConfig.tile_sets
  const rawTileSets = (mapConfigObj.tile_sets as RawTileSet[] | undefined) ?? [];
  const tileSets: MapTileSet[] = [];

  for (let idx = 0; idx < rawTileSets.length; idx++) {
    const ts = rawTileSets[idx];
    let pattern = ts.urlTemplate ?? ts.pattern;
    if (!pattern) continue;

    // Resolve relative tile patterns against tilesCdnUrl when extracted from bundle
    if (tilesCdnUrl && !/^https?:\/\//i.test(pattern)) {
      pattern = `${tilesCdnUrl}/${pattern.replace(/^\/+/, '')}`;
    }

    const ext = ts.extension ? `.${ts.extension.replace(/^\./, '')}` : '';
    const urlTemplate =
      ext && !pattern.endsWith(ext) && !/\.(?:jpg|jpeg|png|webp|avif)(?:\?|$)/i.test(pattern)
        ? `${pattern}${ext}`
        : pattern;

    const computedBounds = computeTileBoundsFromGrid(ts.bounds) ?? derivedBounds;
    const minZoom = Number.isFinite(ts.min_zoom) ? Number(ts.min_zoom) : 8;
    const maxNativeZoom = Number.isFinite(ts.tiles_max_zoom)
      ? Number(ts.tiles_max_zoom)
      : Number.isFinite(ts.max_zoom)
        ? Number(ts.max_zoom)
        : 16;
    const maxZoom = Number.isFinite(ts.max_zoom)
      ? Math.max(Number(ts.max_zoom), maxNativeZoom + 1)
      : maxNativeZoom + 1;

    const label = cleanText(ts.label ?? ts.name ?? (idx === 0 ? 'Padrão' : `Camada ${idx + 1}`));
    tileSets.push({
      id: slugifyId(label) || `tileset-${ts.id ?? idx}`,
      label,
      urlTemplate,
      backgroundColor:
        ts.background_color ?? (mapConfigObj.background_color as string | undefined),
      minZoom,
      maxNativeZoom,
      maxZoom,
      tileBounds: computedBounds,
    });
  }

  const startLat = Number(mapConfigObj.start_lat);
  const startLng = Number(mapConfigObj.start_lng);
  const initialCenter: [number, number] =
    Number.isFinite(startLat) && Number.isFinite(startLng)
      ? [startLat, startLng]
      : hasGeoSpan
        ? [
            Number(((minLat + maxLat) / 2).toFixed(5)),
            Number(((minLng + maxLng) / 2).toFixed(5)),
          ]
        : [0.7, -0.7];

  const initialZoom = Number.isFinite(Number(mapConfigObj.initial_zoom))
    ? Number(mapConfigObj.initial_zoom)
    : tileSets[0]
      ? Math.min(tileSets[0].maxNativeZoom, tileSets[0].minZoom + 2)
      : 10;

  // 6. Merge safely into src/data/games/<game-slug>/
  const gameDir = path.resolve('src/data/games', gameSlug);
  await fs.mkdir(gameDir, { recursive: true });

  // 6a. Merge markers.json (preserve markers of OTHER maps in the same game)
  const markersPath = path.join(gameDir, 'markers.json');
  let existingMarkers: MapMarker[] = [];
  if (await fileExists(markersPath)) {
    existingMarkers = JSON.parse(await fs.readFile(markersPath, 'utf8')) as MapMarker[];
  }
  const mergedMarkers = [
    ...existingMarkers.filter((m) => m.mapId !== mapSlug),
    ...importedMarkers,
  ];
  await fs.writeFile(
    markersPath,
    JSON.stringify(mergedMarkers, null, 2) + '\n',
    'utf8'
  );

  // 6b. Merge regions.json (preserve regions of OTHER maps in the same game)
  const regionsPath = path.join(gameDir, 'regions.json');
  let existingRegions: MapRegion[] = [];
  if (await fileExists(regionsPath)) {
    existingRegions = JSON.parse(await fs.readFile(regionsPath, 'utf8')) as MapRegion[];
  }
  const mergedRegions = [
    ...existingRegions.filter((r) => r.mapId && r.mapId !== mapSlug),
    ...importedRegions,
  ];
  if (mergedRegions.length > 0) {
    await fs.writeFile(
      regionsPath,
      JSON.stringify(mergedRegions, null, 2) + '\n',
      'utf8'
    );
  }

  // 6c. Merge manifest.json (preserve other maps & existing categories)
  const manifestPath = path.join(gameDir, 'manifest.json');
  const publicGameDir = path.resolve('public/games', gameSlug);
  const localCover = (await fileExists(path.join(publicGameDir, 'cover.webp')))
    ? `/games/${gameSlug}/cover.webp`
    : undefined;
  const localBanner = (await fileExists(path.join(publicGameDir, 'banner.webp')))
    ? `/games/${gameSlug}/banner.webp`
    : undefined;
  const localLogo = (await fileExists(path.join(publicGameDir, 'logo.webp')))
    ? `/games/${gameSlug}/logo.webp`
    : undefined;

  // Never overwrite official covers with MapGenie map tile preview screenshots
  const isMapPreview = (u?: string) => Boolean(u && /mapgenie\.io\/.*preview/i.test(u));
  const safeBundleCover =
    bundleCoverUrl && !isMapPreview(bundleCoverUrl) ? bundleCoverUrl : undefined;

  let manifest: GameManifest;
  if (await fileExists(manifestPath)) {
    manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8')) as GameManifest;
    if (localCover && (!manifest.assets.coverImage || isMapPreview(manifest.assets.coverImage))) {
      manifest.assets.coverImage = localCover;
    } else if (safeBundleCover && !manifest.assets.coverImage) {
      manifest.assets.coverImage = safeBundleCover;
    }
    if (localBanner && (!manifest.assets.bannerImage || isMapPreview(manifest.assets.bannerImage))) {
      manifest.assets.bannerImage = localBanner;
    } else if (safeBundleCover && !manifest.assets.bannerImage) {
      manifest.assets.bannerImage = safeBundleCover;
    }
    if (localLogo && !manifest.assets.logoImage) {
      manifest.assets.logoImage = localLogo;
    }
  } else {
    const preset = GAME_PRESETS[gameSlug];
    const resolvedCover = localCover ?? safeBundleCover;
    const resolvedBanner = localBanner ?? safeBundleCover;
    manifest = {
      id: `game-${gameSlug}`,
      slug: gameSlug,
      title: preset?.title ?? values.name ?? gameSlug,
      subtitle: preset?.subtitle ?? 'Mapa Interativo',
      studio: preset?.studio ?? 'Desconhecido',
      releaseYear: preset?.releaseYear ?? new Date().getFullYear(),
      genres: preset?.genres ?? ['Aventura', 'Mundo Aberto'],
      platforms: preset?.platforms,
      status: 'available',
      assets: {
        ...(resolvedCover ? { coverImage: resolvedCover } : {}),
        ...(resolvedBanner ? { bannerImage: resolvedBanner } : {}),
        ...(localLogo ? { logoImage: localLogo } : {}),
      },
      theme: preset?.theme ?? {
        accentPrimary: '#00F0FF',
        accentSecondary: '#FF2A85',
        accentGlow: 'rgba(0, 240, 255, 0.34)',
        glassTint: 'rgba(13, 17, 24, 0.78)',
        surfaceBase: '#07090D',
        fontDisplay: "'Space Grotesk', sans-serif",
        backgroundPattern: 'tactical-grid',
        badgeStyle: 'minimal',
      },
      maps: [],
      categoryGroups: [],
    };
  }

  const existingMapIdx = manifest.maps.findIndex((m) => m.id === mapSlug);
  const prevMap = existingMapIdx >= 0 ? manifest.maps[existingMapIdx] : undefined;

  const updatedMapLayer: GameMapLayer = {
    id: mapSlug,
    name:
      values.name ??
      bundleMetaName ??
      prevMap?.name ??
      cleanText(mapDataObj.title ?? mapSlug),
    dlc: values.dlc ?? bundleMetaDlc ?? prevMap?.dlc ?? 'base',
    pinsCount: importedMarkers.length,
    icon: prevMap?.icon ?? 'map',
    crs: 'epsg3857',
    backgroundColor:
      tileSets[0]?.backgroundColor ??
      (mapConfigObj.background_color as string | undefined) ??
      prevMap?.backgroundColor ??
      manifest.theme.surfaceBase,
    initialCenter,
    initialZoom,
    maxBounds: derivedBounds,
    ...(tileSets.length > 0 ? { tileSets } : {}),
  };

  if (existingMapIdx >= 0) {
    manifest.maps[existingMapIdx] = updatedMapLayer;
  } else {
    manifest.maps.push(updatedMapLayer);
  }
  manifest.totalPins = mergedMarkers.length;

  // Merge new category groups into manifest.categoryGroups without wiping categories used by other maps
  const groupMap = new Map<string, CategoryGroup>();
  for (const g of manifest.categoryGroups) {
    groupMap.set(g.id, { ...g, categories: [...g.categories] });
  }

  for (const meta of catMetaBySourceId.values()) {
    const count = countByCatSlug[meta.id] ?? 0;
    if (count === 0) continue;

    let group = groupMap.get(meta.groupId);
    if (!group) {
      group = { id: meta.groupId, label: meta.groupLabel, categories: [] };
      groupMap.set(meta.groupId, group);
    }

    const exists = group.categories.some((c) => c.id === meta.id);
    if (!exists) {
      const isPriority = PRIORITY_VISIBLE_PATTERN.test(meta.name);
      const isUltraDense =
        !isPriority && (count > 120 || ULTRA_DENSE_PATTERN.test(meta.name));
      const newCat: Category = {
        id: meta.id,
        groupId: meta.groupId,
        name: meta.name,
        icon: meta.icon,
        color: meta.color,
        defaultVisible: !isUltraDense,
      };
      group.categories.push(newCat);
    }
  }

  manifest.categoryGroups = Array.from(groupMap.values());

  await fs.writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + '\n',
    'utf8'
  );

  // Optionally clean temp source files
  if (!values['keep-temp']) {
    for (const p of [hasBundle ? bundlePath : null, htmlPath, configJsonPath, dataJsonPath]) {
      if (p) {
        try {
          await fs.unlink(p);
        } catch {
          // ignore
        }
      }
    }
  }

  console.log('\n=== IMPORTAÇÃO CONCLUÍDA ===');
  console.log(`Jogo: ${gameSlug} | Mapa: ${mapSlug}`);
  console.log(`TileSets gerados: ${tileSets.length} (${tileSets.map((t) => t.label).join(', ') || 'nenhum'})`);
  console.log(`Marcadores importados neste mapa: ${importedMarkers.length} (NaN ignorados: ${nanLocations})`);
  console.log(`Total de marcadores no jogo (todos os mapas): ${mergedMarkers.length}`);
  console.log(`Regiões importadas neste mapa: ${importedRegions.length} (NaN ignorados: ${nanRegions})`);
  console.log(`Bounds derivados: ${JSON.stringify(derivedBounds)}`);
  console.log(`Manifesto atualizado: ${manifestPath}`);
}

main();
