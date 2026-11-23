#!/usr/bin/env node
/**
 * Nexus Maps — Importador em Lote (`npm run import-map:all`)
 *
 * Localiza todos os bundles `temp/{gameSlug}__{mapSlug}.json` gerados pelo
 * `npm run extract-maps` e executa `import-tile-map.ts` para cada um deles.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';

async function main() {
  const tempDir = path.resolve('temp');
  let entries: string[];
  try {
    entries = await fs.readdir(tempDir);
  } catch {
    console.log('[import-map:all] Pasta temp/ não encontrada.');
    return;
  }

  const bundles = entries
    .filter((name) => name.endsWith('.json') && name.includes('__'))
    .sort();

  if (bundles.length === 0) {
    console.log(
      '[import-map:all] Nenhum bundle temp/{gameSlug}__{mapSlug}.json encontrado.'
    );
    return;
  }

  console.log(`[import-map:all] Encontrados ${bundles.length} bundle(s) para importar:\n`);

  const extraArgs = process.argv.slice(2);
  let success = 0;
  let failed = 0;

  for (const file of bundles) {
    const base = file.slice(0, -'.json'.length);
    const sepIdx = base.indexOf('__');
    const gameSlug = base.slice(0, sepIdx);
    const mapSlug = base.slice(sepIdx + 2);

    console.log(`→ Importando ${gameSlug} / ${mapSlug}...`);
    const result = spawnSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsx', 'scripts/import-markers/import-tile-map.ts', gameSlug, mapSlug, ...extraArgs],
      { stdio: 'inherit', shell: true }
    );

    if (result.status === 0 && !result.error) {
      success++;
    } else {
      failed++;
      console.error(
        `  ✗ Erro ao importar ${gameSlug}/${mapSlug} (exit ${result.status})${
          result.error ? ` — ${result.error.message}` : ''
        }`
      );
    }
  }

  console.log(`\n[import-map:all] Concluído: ${success} sucesso(s), ${failed} falha(s).`);
  if (failed > 0) process.exit(1);
}

main();
