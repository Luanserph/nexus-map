#!/usr/bin/env node
/**
 * Nexus Maps — Conversor Oficial de Leonida (GTA VI)
 *
 * Lê temp/leonida-jaw.json (ou fallback temp/leonida-raw.json), converte todas as
 * locations (EPSG:3857 exato, sem transformação afim) para src/data/games/gta-vi/markers.json,
 * extrai regions + polígonos GeoJSON para src/data/games/gta-vi/regions.json,
 * atualiza src/data/games/gta-vi/manifest.json e remove o arquivo temporário.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { decodeHtmlEntities } from '../../src/core/utils/text';
import type { CategoryGroup, MapMarker } from '../../src/types/schema';

interface RawMedia {
  url?: string;
  type?: string;
}

interface RawLocation {
  id: number | string;
  region_id?: number | null;
  category_id: number;
  title?: string;
  description?: string;
  latitude: string | number;
  longitude: string | number;
  media?: RawMedia[];
}

interface RawRegion {
  id: number;
  parent_region_id: number | null;
  title: string;
  subtitle?: string | null;
  center_x: string | number;
  center_y: string | number;
  order?: number;
  features?: unknown[];
}

interface RawLeonidaPayload {
  locations: RawLocation[];
  regions?: RawRegion[];
}

interface CategoryRule {
  id: string;
  groupId: 'locations' | 'collectibles' | 'activities';
  name: string;
  icon: string;
  color: string;
  defaultVisible: boolean;
  sourceIds: number[];
}

const CATEGORY_RULES: CategoryRule[] = [
  // ===================== LOCAIS =====================
  {
    id: 'banks',
    groupId: 'locations',
    name: 'Bancos',
    icon: 'landmark',
    color: '#EF4444',
    defaultVisible: true,
    sourceIds: [29022, 29023],
  },
  {
    id: 'jewelry-pawn',
    groupId: 'locations',
    name: 'Joalherias & Penhores',
    icon: 'gem',
    color: '#F472B6',
    defaultVisible: true,
    sourceIds: [29025, 29026, 29027],
  },
  {
    id: 'safes',
    groupId: 'locations',
    name: 'Cofres',
    icon: 'lock',
    color: '#F59E0B',
    defaultVisible: true,
    sourceIds: [29083],
  },
  {
    id: 'illegal-operations',
    groupId: 'locations',
    name: 'Operações Ilegais',
    icon: 'skull',
    color: '#FB7185',
    defaultVisible: true,
    sourceIds: [29133, 29134, 29135, 29136, 29137, 29138, 29139, 29140, 29141],
  },
  {
    id: 'standout-vehicles',
    groupId: 'locations',
    name: 'Veículos Únicos',
    icon: 'crown',
    color: '#FDE047',
    defaultVisible: true,
    sourceIds: [29095, 29096, 29097],
  },
  {
    id: 'paynspray',
    groupId: 'locations',
    name: "Pay 'N' Spray",
    icon: 'sparkles',
    color: '#2DD4BF',
    defaultVisible: true,
    sourceIds: [29029],
  },
  {
    id: 'mod-shops',
    groupId: 'locations',
    name: 'Mod Shops',
    icon: 'hammer',
    color: '#60A5FA',
    defaultVisible: true,
    sourceIds: [29032],
  },
  {
    id: 'gun-shops',
    groupId: 'locations',
    name: 'Ammu-Nation & Armas',
    icon: 'swords',
    color: '#F43F5E',
    defaultVisible: true,
    sourceIds: [29041],
  },
  {
    id: 'nightclubs',
    groupId: 'locations',
    name: 'Clubes Noturnos',
    icon: 'sparkles',
    color: '#E879F9',
    defaultVisible: true,
    sourceIds: [29031],
  },
  {
    id: 'landmarks',
    groupId: 'locations',
    name: 'Marcos & Pontos de Interesse',
    icon: 'map-pin',
    color: '#38BDF8',
    defaultVisible: true,
    sourceIds: [29065, 29066, 29067],
  },
  {
    id: 'gas-garages',
    groupId: 'locations',
    name: 'Postos, Garagens & Lava-Jatos',
    icon: 'bookmark',
    color: '#FB923C',
    defaultVisible: false,
    sourceIds: [29033, 29034, 29040, 29062, 29063],
  },
  {
    id: 'convenience-stores',
    groupId: 'locations',
    name: 'Lojas de Conveniência',
    icon: 'shopping-bag',
    color: '#FBBF24',
    defaultVisible: false,
    sourceIds: [29051, 29024],
  },
  {
    id: 'shops-services',
    groupId: 'locations',
    name: 'Comércio, Roupas & Tatuagens',
    icon: 'shopping-bag',
    color: '#94A3B8',
    defaultVisible: false,
    sourceIds: [29028, 29042, 29043, 29044, 29045, 29046, 29047, 29048, 29049, 29050],
  },
  {
    id: 'bus-stops',
    groupId: 'locations',
    name: 'Pontos de Ônibus',
    icon: 'navigation',
    color: '#64748B',
    defaultVisible: false,
    sourceIds: [29036, 29038, 29039],
  },
  {
    id: 'atms',
    groupId: 'locations',
    name: 'ATMs',
    icon: 'gem',
    color: '#34D399',
    defaultVisible: false,
    sourceIds: [29021],
  },
  {
    id: 'atms-towable',
    groupId: 'locations',
    name: 'ATMs (Rebocáveis)',
    icon: 'gem',
    color: '#10B981',
    defaultVisible: false,
    sourceIds: [29037],
  },
  {
    id: 'ev-chargers',
    groupId: 'locations',
    name: 'Carregadores Elétricos',
    icon: 'activity',
    color: '#22D3EE',
    defaultVisible: false,
    sourceIds: [29035],
  },
  {
    id: 'bars',
    groupId: 'locations',
    name: 'Bares & Bebidas',
    icon: 'flask-conical',
    color: '#C084FC',
    defaultVisible: false,
    sourceIds: [29055, 29054],
  },
  {
    id: 'cafes-takeout',
    groupId: 'locations',
    name: 'Cafés & Lanchonetes',
    icon: 'bookmark',
    color: '#FDBA74',
    defaultVisible: false,
    sourceIds: [29053, 29052],
  },
  {
    id: 'street-food',
    groupId: 'locations',
    name: 'Comida de Rua',
    icon: 'flame',
    color: '#FB923C',
    defaultVisible: false,
    sourceIds: [29056],
  },

  // ===================== COLECIONÁVEIS =====================
  {
    id: 'waink-locations',
    groupId: 'collectibles',
    name: 'Locais WAiNK',
    icon: 'radio',
    color: '#FF4D9E',
    defaultVisible: true,
    sourceIds: [29112, 29113, 29114],
  },
  {
    id: 'collectible-cards',
    groupId: 'collectibles',
    name: 'Cartas Colecionáveis & Dossiês',
    icon: 'spade',
    color: '#A78BFA',
    defaultVisible: true,
    sourceIds: [29120, 29143, 29144],
  },
  {
    id: 'top-fun-drones',
    groupId: 'collectibles',
    name: 'Drones Top Fun',
    icon: 'compass',
    color: '#38BDF8',
    defaultVisible: true,
    sourceIds: [29142],
  },
  {
    id: 'hoops',
    groupId: 'collectibles',
    name: 'Cestas de Basquete (Hoops)',
    icon: 'flag',
    color: '#FF9E44',
    defaultVisible: false,
    sourceIds: [29011],
  },
  {
    id: 'book-swaps',
    groupId: 'collectibles',
    name: 'Troca de Livros & Revistas',
    icon: 'scroll-text',
    color: '#FDBA74',
    defaultVisible: true,
    sourceIds: [29093],
  },

  // ===================== ATIVIDADES =====================
  {
    id: 'stunt-jumps',
    groupId: 'activities',
    name: 'Saltos Únicos (Stunt Jumps)',
    icon: 'flame',
    color: '#FF9E44',
    defaultVisible: true,
    sourceIds: [29019],
  },
  {
    id: 'base-jumps',
    groupId: 'activities',
    name: 'Base Jumps',
    icon: 'navigation',
    color: '#38BDF8',
    defaultVisible: true,
    sourceIds: [29057],
  },
  {
    id: 'knife-flights',
    groupId: 'activities',
    name: 'Knife Flights',
    icon: 'signpost',
    color: '#F43F5E',
    defaultVisible: true,
    sourceIds: [29059],
  },
  {
    id: 'under-the-bridge',
    groupId: 'activities',
    name: 'Under the Bridge',
    icon: 'anchor',
    color: '#94A3B8',
    defaultVisible: false,
    sourceIds: [29060],
  },
  {
    id: 'races',
    groupId: 'activities',
    name: 'Corridas',
    icon: 'flag',
    color: '#FACC15',
    defaultVisible: true,
    sourceIds: [29084, 29085, 29086, 29087, 29088, 29089, 29090, 29091],
  },
  {
    id: 'shooting-ranges',
    groupId: 'activities',
    name: 'Estandes de Tiro',
    icon: 'swords',
    color: '#FB7185',
    defaultVisible: true,
    sourceIds: [29017],
  },
  {
    id: 'golf-sports',
    groupId: 'activities',
    name: 'Golfe, Sinuca & Academias',
    icon: 'activity',
    color: '#4ADE80',
    defaultVisible: false,
    sourceIds: [29013, 29015, 29030, 29061],
  },
  {
    id: 'fishing-contacts',
    groupId: 'activities',
    name: 'Pesca & Contatos',
    icon: 'anchor',
    color: '#2DD4BF',
    defaultVisible: false,
    sourceIds: [29099, 29082],
  },
];

async function resolveInputFile(): Promise<string> {
  const candidates = [
    path.resolve('temp/leonida-jaw.json'),
    path.resolve('temp/leonida-raw.json'),
  ];
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next
    }
  }
  throw new Error(
    'Arquivo bruto não encontrado em temp/leonida-jaw.json ou temp/leonida-raw.json.'
  );
}

function cleanMarkdown(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\r\n/g, '\n')
    .trim();
}

async function main() {
  const inputPath = await resolveInputFile();
  console.log(`[Convert Leonida] Lendo: ${inputPath}`);

  const raw = JSON.parse(await fs.readFile(inputPath, 'utf8')) as RawLeonidaPayload;

  // Map source category_id -> CategoryRule
  const catBySourceId = new Map<number, CategoryRule>();
  for (const rule of CATEGORY_RULES) {
    for (const srcId of rule.sourceIds) {
      catBySourceId.set(srcId, rule);
    }
  }

  // Extract regions & build lookup by id
  const regionNameById = new Map<number, string>();
  const exportedRegions: Array<{
    id: number;
    parentRegionId: number | null;
    title: string;
    centerX: number;
    centerY: number;
    features: unknown[];
  }> = [];

  let nanRegions = 0;
  for (const reg of raw.regions ?? []) {
    const cx = Number(reg.center_x);
    const cy = Number(reg.center_y);
    const title = decodeHtmlEntities(String(reg.title ?? '').trim());
    if (!Number.isFinite(cx) || !Number.isFinite(cy) || !title) {
      nanRegions++;
      continue;
    }
    regionNameById.set(reg.id, title);
    exportedRegions.push({
      id: reg.id,
      parentRegionId: reg.parent_region_id ?? null,
      title,
      centerX: cx,
      centerY: cy,
      features: Array.isArray(reg.features) ? reg.features : [],
    });
  }

  // Convert all locations preserving exact EPSG:3857 latitude & longitude
  const markers: MapMarker[] = [];
  const countsByCategory: Record<string, number> = {};
  const unmappedSourceCats = new Set<number>();
  let nanLocations = 0;

  for (const loc of raw.locations ?? []) {
    const lat = Number(loc.latitude);
    const lng = Number(loc.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      nanLocations++;
      continue;
    }

    const rule = catBySourceId.get(loc.category_id);
    if (!rule) {
      unmappedSourceCats.add(loc.category_id);
    }
    const categoryId = rule?.id ?? 'landmarks';
    const regionName =
      (loc.region_id ? regionNameById.get(loc.region_id) : undefined) ?? 'Leonida';

    const rawTitle = cleanMarkdown(String(loc.title ?? rule?.name ?? 'Local de Leonida'));
    const rawDesc = cleanMarkdown(String(loc.description ?? ''));
    const description =
      rawDesc || `${rule?.name ?? 'Ponto de interesse'} localizado em ${regionName}.`;

    const firstImage = Array.isArray(loc.media)
      ? loc.media.find((m) => m.type === 'image' && typeof m.url === 'string' && m.url.startsWith('http'))?.url
      : undefined;

    const marker: MapMarker = {
      id: `gtavi-${loc.id}`,
      mapId: 'leonida',
      category: categoryId,
      title: rawTitle,
      description,
      // InteractiveMap expects coords: [x, y] -> L.latLng(y, x) = L.latLng(lat, lng)
      coords: [lng, lat],
      region: regionName,
      dlc: 'base',
      ...(firstImage ? { imageUrl: firstImage } : {}),
    };

    markers.push(marker);
    countsByCategory[categoryId] = (countsByCategory[categoryId] || 0) + 1;
  }

  const gameDir = path.resolve('src/data/games/gta-vi');
  await fs.mkdir(gameDir, { recursive: true });

  // Write markers.json & regions.json
  await fs.writeFile(
    path.join(gameDir, 'markers.json'),
    JSON.stringify(markers, null, 2) + '\n',
    'utf8'
  );
  await fs.writeFile(
    path.join(gameDir, 'regions.json'),
    JSON.stringify(exportedRegions, null, 2) + '\n',
    'utf8'
  );

  // Build categoryGroups for manifest.json
  const groupDefs: Array<{ id: 'locations' | 'collectibles' | 'activities'; label: string }> = [
    { id: 'locations', label: 'Locais' },
    { id: 'collectibles', label: 'Colecionáveis' },
    { id: 'activities', label: 'Atividades' },
  ];

  const categoryGroups: CategoryGroup[] = groupDefs.map((g) => ({
    id: g.id,
    label: g.label,
    categories: CATEGORY_RULES.filter(
      (r) => r.groupId === g.id && (countsByCategory[r.id] ?? 0) > 0
    ).map((r) => ({
      id: r.id,
      groupId: r.groupId,
      name: r.name,
      icon: r.icon,
      color: r.color,
      defaultVisible: r.defaultVisible,
    })),
  }));

  // Update manifest.json
  const manifestPath = path.join(gameDir, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  manifest.maps[0].pinsCount = markers.length;
  manifest.categoryGroups = categoryGroups;
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  // Remove temporary file
  await fs.unlink(inputPath);
  // Remove empty temp/ folder if empty
  try {
    const remaining = await fs.readdir(path.resolve('temp'));
    if (remaining.length === 0) {
      await fs.rmdir(path.resolve('temp'));
    }
  } catch {
    // ignore
  }

  console.log('\n=== CONVERSÃO CONCLUÍDA ===');
  console.log(`Total de pins importados: ${markers.length} (NaN ignorados: ${nanLocations})`);
  console.log(`Total de regiões importadas: ${exportedRegions.length} (NaN ignorados: ${nanRegions})`);
  console.log(`Categorias não mapeadas: ${unmappedSourceCats.size}`, [...unmappedSourceCats]);
  console.log('Pins visíveis por padrão:', markers.filter((m) => {
    const r = CATEGORY_RULES.find((x) => x.id === m.category);
    return r?.defaultVisible;
  }).length);
  console.log('Arquivo temporário removido:', inputPath);
}

main();
