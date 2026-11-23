#!/usr/bin/env node
/**
 * Nexus Maps — Extrator Semi-Assistido de Mapas (Playwright + Chrome Local)
 *
 * Abre uma janela visível do Chrome com perfil persistente (`temp/.browser-profile`)
 * para capturar o payload XHR `/data` e os metadados globais (`window.game`,
 * `window.tilesCdnUrl`, `window.mapData`) de cada alvo em `maps-targets.json`.
 *
 * Salva cada bundle unificado em:
 *   temp/{gameSlug}__{mapSlug}.json
 *
 * Uso:
 *   npm run extract-maps
 *   npm run extract-maps -- --force
 *   npm run extract-maps -- --game cyberpunk-2077
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from 'playwright-core';

interface MapTarget {
  gameSlug: string;
  mapSlug: string;
  name?: string;
  dlc?: string;
  url: string;
}

const TARGETS_PATH = path.resolve('scripts/import-markers/maps-targets.json');
const TEMP_DIR = path.resolve('temp');
const PROFILE_DIR = path.resolve('temp/.browser-profile');
const DATA_RESPONSE_TIMEOUT_MS = 90_000;

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function randomDelayMs(minMs = 4000, maxMs = 7000): number {
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveBrowserTarget(): Promise<
  | { kind: 'executable'; executablePath: string; label: string }
  | { kind: 'channel'; channel: 'msedge'; label: string }
> {
  const envPath = process.env.BROWSER_PATH?.trim();
  if (envPath) {
    if (await fileExists(envPath)) {
      return {
        kind: 'executable',
        executablePath: envPath,
        label: `BROWSER_PATH (${envPath})`,
      };
    }
    console.warn(
      `[extract-maps] Aviso: BROWSER_PATH definido mas não encontrado: ${envPath}`
    );
  }

  const localAppData = process.env.LOCALAPPDATA ?? '';
  const candidates: Array<{ label: string; path: string }> = [
    {
      label: 'Brave',
      path: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    },
    {
      label: 'Brave (x86)',
      path: 'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    },
    ...(localAppData
      ? [
          {
            label: 'Brave (User)',
            path: path.join(
              localAppData,
              'BraveSoftware',
              'Brave-Browser',
              'Application',
              'brave.exe'
            ),
          },
        ]
      : []),
    {
      label: 'Google Chrome',
      path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    },
    {
      label: 'Google Chrome (x86)',
      path: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    },
    {
      label: 'Microsoft Edge (x86)',
      path: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    },
    {
      label: 'Microsoft Edge',
      path: 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    },
  ];

  for (const candidate of candidates) {
    if (await fileExists(candidate.path)) {
      return {
        kind: 'executable',
        executablePath: candidate.path,
        label: `${candidate.label} (${candidate.path})`,
      };
    }
  }

  return {
    kind: 'channel',
    channel: 'msedge',
    label: "Microsoft Edge (channel: 'msedge')",
  };
}

async function launchBrowserContext() {
  const baseOptions = {
    headless: false,
    viewport: { width: 1366, height: 860 },
  };

  const target = await resolveBrowserTarget();
  console.log(`[extract-maps] Navegador selecionado: ${target.label}`);

  if (target.kind === 'executable') {
    return chromium.launchPersistentContext(PROFILE_DIR, {
      ...baseOptions,
      executablePath: target.executablePath,
    });
  }

  try {
    return await chromium.launchPersistentContext(PROFILE_DIR, {
      ...baseOptions,
      channel: target.channel,
    });
  } catch {
    console.log(
      '[extract-maps] Fallback: tentando Chromium padrão do Playwright (sem channel)...'
    );
    return chromium.launchPersistentContext(PROFILE_DIR, baseOptions);
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      force: { type: 'boolean', short: 'f' },
      game: { type: 'string', short: 'g' },
      map: { type: 'string', short: 'm' },
      help: { type: 'boolean', short: 'h' },
    },
    strict: true,
  });

  if (values.help) {
    console.log(`Uso:
  npm run extract-maps [-- --force] [--game <slug>] [--map <slug>]

Opções:
  -f, --force        Rebaixa mesmo que temp/{gameSlug}__{mapSlug}.json já exista
  -g, --game <slug>  Filtra apenas um jogo específico
  -m, --map <slug>   Filtra apenas um mapa específico
`);
    process.exit(0);
  }

  const allTargets = JSON.parse(
    await fs.readFile(TARGETS_PATH, 'utf8')
  ) as MapTarget[];

  const targets = allTargets.filter((t) => {
    if (values.game && t.gameSlug !== values.game) return false;
    if (values.map && t.mapSlug !== values.map) return false;
    return true;
  });

  if (targets.length === 0) {
    console.log('[extract-maps] Nenhum alvo corresponde aos filtros informados.');
    return;
  }

  await fs.mkdir(TEMP_DIR, { recursive: true });
  await fs.mkdir(PROFILE_DIR, { recursive: true });

  // Filter targets that need extraction before launching Chrome
  const pending: MapTarget[] = [];
  for (const target of targets) {
    const outPath = path.join(TEMP_DIR, `${target.gameSlug}__${target.mapSlug}.json`);
    if (!values.force && (await fileExists(outPath))) {
      console.log(
        `[skip] ${target.gameSlug}/${target.mapSlug} já existe em temp/ (use --force para sobrescrever).`
      );
      continue;
    }
    pending.push(target);
  }

  if (pending.length === 0) {
    console.log('[extract-maps] Todos os alvos selecionados já estão em temp/.');
    return;
  }

  console.log(
    `\n[extract-maps] Preparando extração de ${pending.length} mapa(s)...`
  );
  console.log(
    '[extract-maps] Caso apareça alguma verificação manual na janela, conclua-a diretamente no navegador.\n'
  );

  const context = await launchBrowserContext();

  const page = context.pages()[0] ?? (await context.newPage());

  try {
    for (let idx = 0; idx < pending.length; idx++) {
      const target = pending[idx];
      const outPath = path.join(
        TEMP_DIR,
        `${target.gameSlug}__${target.mapSlug}.json`
      );

      console.log(
        `[${idx + 1}/${pending.length}] Navegando para ${target.gameSlug}/${target.mapSlug}: ${target.url}`
      );

      try {
        const dataResponsePromise = page.waitForResponse(
          (res) => {
            if (res.status() !== 200) return false;
            try {
              const pathname = new URL(res.url()).pathname.replace(/\/+$/, '');
              return pathname.endsWith('/data');
            } catch {
              return false;
            }
          },
          { timeout: DATA_RESPONSE_TIMEOUT_MS }
        );

        await page.goto(target.url, {
          waitUntil: 'domcontentloaded',
          timeout: DATA_RESPONSE_TIMEOUT_MS,
        });

        const dataResponse = await dataResponsePromise;
        const dataJson = (await dataResponse.json()) as {
          locations?: unknown[];
          regions?: unknown[];
        };

        // Brief settle so window.mapData / window.game globals are hydrated
        await sleep(600);

        const globals = await page.evaluate(() => {
          const w = window as unknown as Record<string, unknown>;
          const gameObj = (w.game ?? null) as Record<string, unknown> | null;
          return {
            game: gameObj,
            tilesCdnUrl: w.tilesCdnUrl ?? null,
            mapData: w.mapData ?? null,
          };
        });

        const bundle = {
          meta: {
            gameSlug: target.gameSlug,
            mapSlug: target.mapSlug,
            name: target.name,
            dlc: target.dlc ?? 'base',
            sourceUrl: target.url,
            extractedAt: new Date().toISOString(),
          },
          game: globals.game,
          tilesCdnUrl: globals.tilesCdnUrl,
          mapData: globals.mapData,
          data: dataJson,
        };

        await fs.writeFile(
          outPath,
          JSON.stringify(bundle, null, 2) + '\n',
          'utf8'
        );

        const pinsCount = Array.isArray(dataJson.locations)
          ? dataJson.locations.length
          : 0;
        const regionsCount = Array.isArray(dataJson.regions)
          ? dataJson.regions.length
          : 0;

        console.log(
          `  ✓ ${target.gameSlug}/${target.mapSlug}: ${pinsCount} pins, ${regionsCount} regiões → ${path.basename(outPath)}`
        );
      } catch (err) {
        console.error(
          `  ✗ Falha em ${target.gameSlug}/${target.mapSlug}:`,
          err instanceof Error ? err.message : String(err)
        );
      }

      if (idx < pending.length - 1) {
        const waitMs = randomDelayMs(4000, 7000);
        console.log(
          `  … aguardando ${(waitMs / 1000).toFixed(1)}s antes do próximo mapa...`
        );
        await sleep(waitMs);
      }
    }
  } finally {
    await context.close();
  }

  console.log(
    '\n[extract-maps] Concluído! Agora rode `npm run import-map -- <game-slug> <map-slug>` para importar cada bundle.'
  );
}

main();
