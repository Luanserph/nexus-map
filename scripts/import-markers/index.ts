#!/usr/bin/env node
/**
 * Nexus Maps — Importador & Calibrador de Marcadores (CLI)
 *
 * Aceita datasets JSON padrão ou formato open-source `witcher3map` (JS),
 * aplica transformação linear afim a partir de 2 pontos de calibração (--ref)
 * e opcionalmente enriquece marcadores com miniaturas da MediaWiki / Witcher Wiki API.
 *
 * Uso:
 *   npm run import-markers -- \
 *     --input <arquivo-ou-url> \
 *     --game <slug> \
 *     --map <mapId> \
 *     --ref "srcX1,srcY1=dstX1,dstY1" \
 *     --ref "srcX2,srcY2=dstX2,dstY2" \
 *     [--locales-url <url>] [--swap-xy] [--enrich-wiki]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { parseArgs } from 'node:util';
import { decodeHtmlEntities } from '../../src/core/utils/text';
import type { MapMarker, MarkerChecklistItem } from '../../src/types/schema';

interface CalibrationPoint {
  src: [number, number];
  dst: [number, number];
}

interface AffineTransform {
  scaleX: number;
  offsetX: number;
  scaleY: number;
  offsetY: number;
}

interface Witcher3RawEntry {
  coords: [number, number][];
  label?: string;
  popup?: string;
  popupTitle?: string;
}

const PT_BR_CATEGORY_LABELS: Record<string, string> = {
  signpost: 'Placa de Viagem Rápida',
  harbor: 'Porto',
  entrance: 'Entrada de Caverna / Ruína',
  poi: 'Ponto de Interesse',
  notice: 'Quadro de Avisos',
  pid: 'Pessoa em Perigo',
  abandoned: 'Local Abandonado',
  guarded: 'Tesouro Guardado',
  hidden: 'Tesouro Escondido',
  smugglers: 'Esconderijo de Contrabandista',
  spoils: 'Espólios de Guerra',
  armourerstable: 'Mesa de Armeiro',
  grindstone: 'Pedra de Amolar',
  armourer: 'Armeiro',
  blacksmith: 'Ferreiro',
  alchemy: 'Suprimentos de Alquimia',
  herbalist: 'Herbalista',
  innkeep: 'Estalajadeiro',
  shopkeeper: 'Mercador',
  barber: 'Barbeiro',
  brothel: 'Bordel',
  monsternest: 'Ninho de Monstros',
  monsterden: 'Covil de Monstros',
  banditcamp: 'Acampamento de Bandidos',
  pop: 'Local de Poder',
  gwent: 'Jogador de Gwent',
};

const PT_BR_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  signpost: 'Ponto de viagem rápida liberado ao descobrir este local.',
  harbor: 'Porto acessível por barco para navegar pelas águas da região.',
  entrance: 'Entrada para caverna, ruína élfica ou passagem subterrânea.',
  poi: 'Local notável para exploração e descoberta.',
  notice: 'Quadro de avisos com contratos de bruxo e missões secundárias.',
  pid: 'Prisioneiro aguardando resgate. Derrote os bandidos e recupere a chave da jaula.',
  abandoned: 'Assentamento dominado por monstros ou bandidos. Limpe a área para restaurar o local.',
  guarded: 'Tesouro valioso protegido por um monstro poderoso ou grupo hostil.',
  hidden: 'Tesouro oculto — procure pistas, chaves ou cartas nas proximidades.',
  smugglers: 'Carga submersa ou escondida deixada por contrabandistas.',
  spoils: 'Espólios abandonados após batalhas na região.',
  armourerstable: 'Concede bônus temporário de resistência à armadura.',
  grindstone: 'Concede bônus temporário de dano às espadas.',
  armourer: 'Artesão capaz de forjar armaduras de bruxo, reparar equipamentos e desmontar itens.',
  blacksmith: 'Ferreiro capaz de forjar espadas de bruxo, reparar armas e comprar espólios.',
  alchemy: 'Mercador especializado em fórmulas e ingredientes alquímicos.',
  herbalist: 'Vendedor de ervas raras, receitas de poções e ingredientes naturais.',
  innkeep: 'Estalagem com comida, bebidas, cartas de Gwent e partidas contra o estalajadeiro.',
  shopkeeper: 'Comerciante local com suprimentos, mapas de tesouro e itens variados.',
  barber: 'Oferece cortes de cabelo e estilos de barba para Geralt.',
  brothel: 'Estabelecimento de entretenimento em Novigrad.',
  monsternest: 'Destrua o ninho com uma bomba (Colmeia ou Estrela Dançante) após derrotar os monstros.',
  monsterden: 'Covil repleto de monstros perigosos e espólios raros.',
  banditcamp: 'Acampamento hostil com bandidos e baús de saque.',
  pop: 'Extraia energia do Local de Poder para ganhar +1 Ponto de Habilidade e bônus de Sinal.',
  gwent: 'Desafie este NPC em uma partida de Gwent para conquistar uma carta única.',
};

const PT_BR_DEFAULT_CHECKLISTS: Record<string, MarkerChecklistItem[]> = {
  pop: [
    { id: 'draw-power', label: 'Extrair energia (+1 Ponto de Habilidade)' },
  ],
  monsternest: [
    { id: 'clear-monsters', label: 'Derrotar monstros do entorno' },
    { id: 'destroy-nest', label: 'Destruir o ninho com bomba' },
    { id: 'loot-nest', label: 'Saquear os restos do ninho' },
  ],
  guarded: [
    { id: 'defeat-guardian', label: 'Derrotar o guardião do tesouro' },
    { id: 'loot-chest', label: 'Abrir o baú principal' },
  ],
  abandoned: [
    { id: 'clear-area', label: 'Eliminar ameaças do local' },
    { id: 'liberate', label: 'Liberar o assentamento' },
  ],
  pid: [
    { id: 'defeat-bandits', label: 'Derrotar os bandidos e pegar a chave' },
    { id: 'free-prisoner', label: 'Libertar o prisioneiro da jaula' },
  ],
  gwent: [
    { id: 'win-card', label: 'Vencer partida de Gwent e coletar carta' },
  ],
};

function printUsageAndExit(message?: string): never {
  if (message) {
    console.error(`\n[Erro] ${message}\n`);
  }
  console.log(`Uso:
  npm run import-markers -- --input <arquivo-ou-url> --game <slug> --map <mapId> [opções]

Opções obrigatórias:
  --input, -i <path|url>       Dataset externo (.json ou .js estilo witcher3map)
  --game, -g <slug>            Slug do jogo destino (ex: the-witcher-3-wild-hunt)
  --map, -m <mapId>            ID da camada/mapa (ex: main)

Opções de calibração:
  --ref <sx,sy=dx,dy>          Ponto de referência (informe 2x para calibração linear exata)
  --swap-xy                    Inverte [lat, lng] → [x, y] da fonte antes de calibrar

Opções extras:
  --locales-url <baseUrl>      URL base dos JSONs de idioma do witcher3map (ex: .../locales/en)
  --enrich-wiki                Busca miniaturas na Witcher Wiki API para pontos de referência
  --wiki-limit <n>             Máximo de requisições à Wiki API (padrão: 35)
  --help, -h                   Exibe esta ajuda
`);
  process.exit(message ? 1 : 0);
}

function parseRefPoint(raw: string): CalibrationPoint {
  const [srcPart, dstPart] = raw.split('=');
  if (!srcPart || !dstPart) {
    throw new Error(`Ponto --ref inválido: "${raw}". Use "srcX,srcY=dstX,dstY".`);
  }
  const [sx, sy] = srcPart.split(',').map(Number);
  const [dx, dy] = dstPart.split(',').map(Number);
  if (![sx, sy, dx, dy].every(Number.isFinite)) {
    throw new Error(`Coordenadas numéricas inválidas em --ref "${raw}".`);
  }
  return { src: [sx, sy], dst: [dx, dy] };
}

function computeAffineTransform(refs: CalibrationPoint[]): AffineTransform {
  if (refs.length < 2) {
    return { scaleX: 1, offsetX: 0, scaleY: 1, offsetY: 0 };
  }

  const [p1, p2] = refs;
  const dSrcX = p2.src[0] - p1.src[0];
  const dSrcY = p2.src[1] - p1.src[1];

  if (Math.abs(dSrcX) < 1e-6 || Math.abs(dSrcY) < 1e-6) {
    throw new Error(
      'Os 2 pontos de calibração --ref precisam ter valores distintos em X e em Y.'
    );
  }

  const scaleX = (p2.dst[0] - p1.dst[0]) / dSrcX;
  const offsetX = p1.dst[0] - p1.src[0] * scaleX;
  const scaleY = (p2.dst[1] - p1.dst[1]) / dSrcY;
  const offsetY = p1.dst[1] - p1.src[1] * scaleY;

  return { scaleX, offsetX, scaleY, offsetY };
}

function applyTransform(
  coords: [number, number],
  tf: AffineTransform,
  swapXY: boolean
): [number, number] {
  const srcX = swapXY ? coords[1] : coords[0];
  const srcY = swapXY ? coords[0] : coords[1];
  const x = Math.round((srcX * tf.scaleX + tf.offsetX) * 100) / 100;
  const y = Math.round((srcY * tf.scaleY + tf.offsetY) * 100) / 100;
  return [x, y];
}

function stripHtml(html: string): string {
  return decodeHtmlEntities(html);
}

function extractLevel(text: string): number | undefined {
  const match = text.match(/\b(?:lvl|level|nv\.?)\s*(\d{1,2})\b/i);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferVelenRegion(x: number, y: number): string {
  // Coordinates inside [0..128, -144..0]
  if (y > -58 && x < 72) return 'Novigrad';
  if (y > -64 && x >= 72) return 'Nordeste de Redânia (HoS)';
  if (y <= -58 && y > -80 && x >= 72) return 'Oxenfurt';
  if (y <= -96 && x < 54) return 'Costa Sudoeste de Velen';
  if (y <= -96 && x >= 54) return 'Pântano Retorcido';
  return 'Velen';
}

function lookupNestedKey(obj: Record<string, unknown>, keyPath: string): string | undefined {
  const parts = keyPath.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

async function loadTextSource(input: string): Promise<string> {
  if (/^https?:\/\//i.test(input)) {
    const res = await fetch(input);
    if (!res.ok) {
      throw new Error(`Falha ao baixar "${input}" (HTTP ${res.status}).`);
    }
    return res.text();
  }
  return fs.readFile(path.resolve(process.cwd(), input), 'utf8');
}

async function loadWitcher3Locales(
  baseUrl?: string
): Promise<Record<string, Record<string, unknown>>> {
  if (!baseUrl) return {};
  const namespaces = ['general', 'v', 's', 't', 'w', 'k'];
  const dict: Record<string, Record<string, unknown>> = {};

  await Promise.all(
    namespaces.map(async (ns) => {
      try {
        const res = await fetch(`${baseUrl.replace(/\/$/, '')}/${ns}.json`);
        if (res.ok) {
          dict[ns] = (await res.json()) as Record<string, unknown>;
        }
      } catch {
        // Ignore missing optional namespaces
      }
    })
  );

  return dict;
}

function parseWitcher3JsDataset(
  code: string,
  locales: Record<string, Record<string, unknown>>
): Record<string, Witcher3RawEntry[]> {
  const translate = (key: string): string => {
    const colonIdx = key.indexOf(':');
    const ns = colonIdx > 0 ? key.slice(0, colonIdx) : 'general';
    const pathKey = colonIdx > 0 ? key.slice(colonIdx + 1) : key;
    const found = locales[ns] ? lookupNestedKey(locales[ns], pathKey) : undefined;
    if (found) return found;
    return pathKey.split('.').pop() ?? key;
  };

  const sandboxWindow: Record<string, unknown> = {};
  const context = vm.createContext({
    window: sandboxWindow,
    L: {
      latLng: (lat: number, lng: number) => [lat, lng],
    },
    $: {
      t: translate,
    },
  });

  vm.runInContext(code, context, { timeout: 5000 });

  for (const [k, v] of Object.entries(sandboxWindow)) {
    if (k.startsWith('mapdata_') && v && typeof v === 'object') {
      return v as Record<string, Witcher3RawEntry[]>;
    }
  }

  throw new Error('Nenhum objeto window.mapdata_* encontrado no arquivo JS.');
}

async function fetchWikiThumbnail(
  title: string
): Promise<{ imageUrl?: string; wikiUrl?: string }> {
  const cleanTitle = title.replace(/\s*\(.*?\)\s*/g, '').trim();
  if (!cleanTitle || cleanTitle.length < 3) return {};

  try {
    const url = new URL('https://witcher.fandom.com/api.php');
    url.searchParams.set('action', 'query');
    url.searchParams.set('titles', cleanTitle);
    url.searchParams.set('prop', 'pageimages|info');
    url.searchParams.set('pithumbsize', '640');
    url.searchParams.set('inprop', 'url');
    url.searchParams.set('redirects', '1');
    url.searchParams.set('format', 'json');

    const res = await fetch(url);
    if (!res.ok) return {};
    const json = (await res.json()) as {
      query?: {
        pages?: Record<
          string,
          {
            missing?: string;
            fullurl?: string;
            thumbnail?: { source?: string };
          }
        >;
      };
    };

    const page = Object.values(json.query?.pages ?? {})[0];
    if (!page || 'missing' in page) return {};

    return {
      imageUrl: page.thumbnail?.source,
      wikiUrl: page.fullurl,
    };
  } catch {
    return {};
  }
}

async function run(): Promise<void> {
  const { values } = parseArgs({
    options: {
      input: { type: 'string', short: 'i' },
      game: { type: 'string', short: 'g' },
      map: { type: 'string', short: 'm' },
      ref: { type: 'string', multiple: true },
      'swap-xy': { type: 'boolean' },
      'locales-url': { type: 'string' },
      'enrich-wiki': { type: 'boolean' },
      'wiki-limit': { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) printUsageAndExit();

  const input = values.input?.trim();
  const gameSlug = values.game?.trim();
  const mapId = values.map?.trim();

  if (!input || !gameSlug || !mapId) {
    printUsageAndExit('Os parâmetros --input, --game e --map são obrigatórios.');
  }

  const refPoints = (values.ref ?? []).map(parseRefPoint);
  const transform = computeAffineTransform(refPoints);
  const swapXY = Boolean(values['swap-xy']);

  console.log(`\n[Nexus Import-Markers] Carregando fonte: ${input}`);
  if (refPoints.length >= 2) {
    console.log(
      `[Calibração Linear] scaleX=${transform.scaleX.toFixed(5)}, offsetX=${transform.offsetX.toFixed(3)} | scaleY=${transform.scaleY.toFixed(5)}, offsetY=${transform.offsetY.toFixed(3)}`
    );
  }

  const rawText = await loadTextSource(input);
  const markers: MapMarker[] = [];

  if (rawText.trimStart().startsWith('[') || rawText.trimStart().startsWith('{')) {
    // Standard JSON array of markers
    const parsed = JSON.parse(rawText) as Array<Partial<MapMarker>>;
    const list = Array.isArray(parsed) ? parsed : [];
    list.forEach((item, idx) => {
      if (!item.coords || item.coords.length !== 2) return;
      const calibrated = applyTransform(item.coords, transform, swapXY);
      markers.push({
        id: item.id ?? `${gameSlug}-${mapId}-${idx + 1}`,
        mapId,
        category: item.category ?? 'poi',
        title: item.title ?? `Marcador #${idx + 1}`,
        description: item.description ?? '',
        coords: calibrated,
        region: item.region,
        imageUrl: item.imageUrl,
        wikiUrl: item.wikiUrl,
        level: item.level,
        tags: item.tags,
        checklist: item.checklist,
        metadata: item.metadata,
      });
    });
  } else {
    // Open-source witcher3map JS format
    const locales = await loadWitcher3Locales(values['locales-url']);
    const grouped = parseWitcher3JsDataset(rawText, locales);

    for (const [rawCategory, entries] of Object.entries(grouped)) {
      if (!Array.isArray(entries)) continue;
      let catIndex = 0;

      for (const entry of entries) {
        if (!Array.isArray(entry.coords)) continue;

        const rawLabel = stripHtml(entry.popupTitle || entry.label || '');
        const rawPopup = stripHtml(entry.popup || '');
        const ptCategoryName = PT_BR_CATEGORY_LABELS[rawCategory] ?? rawCategory;
        const ptFallbackDesc =
          PT_BR_CATEGORY_DESCRIPTIONS[rawCategory] ??
          'Ponto catalogado em Velen e Novigrad.';

        const level = extractLevel(`${rawLabel} ${rawPopup}`);
        const isDefaultEnglishLabel =
          !rawLabel ||
          rawLabel.toLowerCase() === rawCategory.toLowerCase() ||
          /^(abandoned site|bandit camp|guarded treasure|hidden treasure|monster den|monster nest|person\(s\) in distress|place of power|smuggler's cache|spoils of war|armourer's table|grindstone|alchemy supplies|armourer|blacksmith|barber|brothel|gwent player|harbor|herbalist|innkeep|notice board|shopkeeper|entrance)$/i.test(
            rawLabel
          );

        for (const coordPair of entry.coords) {
          if (!Array.isArray(coordPair) || coordPair.length < 2) continue;
          catIndex += 1;

          const calibrated = applyTransform(
            [Number(coordPair[0]), Number(coordPair[1])],
            transform,
            swapXY
          );
          const region = inferVelenRegion(calibrated[0], calibrated[1]);

          const title = isDefaultEnglishLabel
            ? `${ptCategoryName} — ${region}`
            : rawLabel;

          const extraContext =
            rawPopup && !isDefaultEnglishLabel && rawPopup.length > 10
              ? rawPopup
              : level !== undefined
                ? `${ptFallbackDesc} Ameaça recomendada: Nível ${level}.`
                : ptFallbackDesc;

          const tags: string[] = [region];
          if (rawCategory === 'pop') tags.push('ponto-de-habilidade');
          if (rawCategory === 'signpost' || rawCategory === 'harbor')
            tags.push('viagem-rapida');
          if (rawCategory === 'gwent') tags.push('gwent');
          if (level !== undefined && level >= 20) tags.push('alto-nivel');

          const checklist = PT_BR_DEFAULT_CHECKLISTS[rawCategory];

          markers.push({
            id: `${gameSlug}-${mapId}-${rawCategory}-${catIndex}`,
            mapId,
            category: rawCategory,
            title,
            description: extraContext,
            coords: calibrated,
            region,
            level,
            tags,
            checklist,
            wikiUrl: !isDefaultEnglishLabel
              ? `https://witcher.fandom.com/wiki/${encodeURIComponent(
                  rawLabel.replace(/\s+/g, '_')
                )}`
              : undefined,
          });
        }
      }
    }
  }

  // Optional Wiki MediaWiki API thumbnail enrichment
  if (values['enrich-wiki']) {
    const wikiLimit = values['wiki-limit']
      ? Number.parseInt(values['wiki-limit'], 10)
      : 35;
    const candidates = markers
      .filter((m) => m.category === 'signpost' || m.category === 'harbor')
      .slice(0, wikiLimit);

    console.log(
      `[Wiki Enrichment] Buscando miniaturas para até ${candidates.length} locais de referência...`
    );

    let enrichedCount = 0;
    const batchSize = 6;
    for (let i = 0; i < candidates.length; i += batchSize) {
      const slice = candidates.slice(i, i + batchSize);
      await Promise.all(
        slice.map(async (marker) => {
          const info = await fetchWikiThumbnail(marker.title);
          if (info.imageUrl) {
            marker.imageUrl = info.imageUrl;
            enrichedCount += 1;
          }
          if (info.wikiUrl) {
            marker.wikiUrl = info.wikiUrl;
          }
        })
      );
    }
    console.log(`  ✓ ${enrichedCount} marcadores enriquecidos com imagem da Wiki.`);
  }

  const outputPath = path.resolve(
    process.cwd(),
    'src',
    'data',
    'games',
    gameSlug,
    'markers.json'
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(markers, null, 2)}\n`, 'utf8');

  // Update manifest pinsCount for this mapId if manifest exists
  const manifestPath = path.resolve(
    process.cwd(),
    'src',
    'data',
    'games',
    gameSlug,
    'manifest.json'
  );
  try {
    const rawManifest = await fs.readFile(manifestPath, 'utf8');
    const manifestJson = JSON.parse(rawManifest) as {
      maps?: Array<{ id: string; pinsCount: number }>;
    };
    const targetMap = manifestJson.maps?.find((m) => m.id === mapId);
    if (targetMap) {
      targetMap.pinsCount = markers.length;
      await fs.writeFile(
        manifestPath,
        `${JSON.stringify(manifestJson, null, 2)}\n`,
        'utf8'
      );
    }
  } catch {
    // Ignore if manifest doesn't exist yet
  }

  console.log(
    `\n[Concluído] ${markers.length} marcadores calibrados e salvos em ${path.relative(process.cwd(), outputPath)}\n`
  );
}

run().catch((error) => {
  console.error(
    '\n[Nexus Import-Markers] Falha:',
    error instanceof Error ? error.message : error
  );
  process.exit(1);
});
