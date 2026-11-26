#!/usr/bin/env node
/**
 * Nexus Maps — Sincronizador Automático de Catálogo no README.md (`npm run sync-readme`)
 *
 * Lê todos os jogos ativos em `src/data/games/<slug>/manifest.json` e `markers.json`,
 * recalcula `totalPins` nos manifestos (se divergente) e atualiza automaticamente:
 *   - Contadores de jogos, mapas/camadas e pins no topo e no cabeçalho da vitrine
 *   - Grade alfabética completa de capas `public/games/<slug>/cover.webp` no README.md
 */

import fs from 'node:fs/promises';
import path from 'node:path';

interface ManifestMap {
  id: string;
  name: string;
  pinsCount?: number;
}

interface GameManifestFile {
  slug: string;
  title: string;
  totalPins?: number;
  maps: ManifestMap[];
}

interface GameSummary {
  slug: string;
  title: string;
  mapsCount: number;
  pinsCount: number;
  coverRel: string;
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatPtBr(num: number): string {
  return num.toLocaleString('pt-BR');
}

async function fileExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function buildCatalogTable(games: GameSummary[]): string {
  const COLS = 5;
  const rows: string[] = [];

  for (let i = 0; i < games.length; i += COLS) {
    const slice = games.slice(i, i + COLS);
    const cells: string[] = [];

    for (const game of slice) {
      const mapLabel = game.mapsCount === 1 ? '1 mapa' : `${game.mapsCount} mapas`;
      const safeTitle = escapeHtml(game.title);
      cells.push(
        [
          `    <td align="center" width="20%">`,
          `      <img src="${game.coverRel}" width="160" alt="${safeTitle}" /><br />`,
          `      <b>${safeTitle}</b><br /><sub>${mapLabel} • ${formatPtBr(game.pinsCount)} pins</sub>`,
          `    </td>`,
        ].join('\n')
      );
    }

    while (cells.length < COLS) {
      cells.push(`    <td align="center" width="20%"></td>`);
    }

    rows.push(`  <tr>\n${cells.join('\n')}\n  </tr>`);
  }

  return `<table>\n${rows.join('\n')}\n</table>`;
}

async function main() {
  const gamesRoot = path.resolve('src/data/games');
  const readmePath = path.resolve('README.md');

  const dirs = await fs.readdir(gamesRoot, { withFileTypes: true });
  const summaries: GameSummary[] = [];
  let manifestsUpdated = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const manifestPath = path.join(gamesRoot, dir.name, 'manifest.json');
    if (!(await fileExists(manifestPath))) continue;

    const manifest = JSON.parse(
      await fs.readFile(manifestPath, 'utf8')
    ) as GameManifestFile;

    const markersPath = path.join(gamesRoot, dir.name, 'markers.json');
    let realPins =
      typeof manifest.totalPins === 'number'
        ? manifest.totalPins
        : (manifest.maps ?? []).reduce((sum, m) => sum + (m.pinsCount ?? 0), 0);

    if (await fileExists(markersPath)) {
      const markers = JSON.parse(await fs.readFile(markersPath, 'utf8')) as unknown[];
      realPins = markers.length;
      if (manifest.totalPins !== realPins) {
        manifest.totalPins = realPins;
        await fs.writeFile(
          manifestPath,
          JSON.stringify(manifest, null, 2) + '\n',
          'utf8'
        );
        manifestsUpdated++;
      }
    }

    const coverRel = `public/games/${manifest.slug}/cover.webp`;
    if (!(await fileExists(path.resolve(coverRel)))) {
      console.warn(`[sync-readme] Aviso: capa não encontrada para ${manifest.slug} (${coverRel})`);
    }

    summaries.push({
      slug: manifest.slug,
      title: manifest.title,
      mapsCount: (manifest.maps ?? []).length,
      pinsCount: realPins,
      coverRel,
    });
  }

  summaries.sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));

  const totalGames = summaries.length;
  const totalMaps = summaries.reduce((sum, g) => sum + g.mapsCount, 0);
  const totalPins = summaries.reduce((sum, g) => sum + g.pinsCount, 0);

  let readme = await fs.readFile(readmePath, 'utf8');

  // 1. Update top counters line
  readme = readme.replace(
    /\*\*\d+ jogos\*\* • \*\*[\d.]+ mapas\/camadas\*\* • \*\*[\d.]+ marcadores\*\*/,
    `**${totalGames} jogos** • **${formatPtBr(totalMaps)} mapas/camadas** • **${formatPtBr(totalPins)} marcadores**`
  );

  // 2. Update catalog heading counters
  readme = readme.replace(
    /## 🎮 Vitrine do Catálogo \(\d+ Jogos • [\d.]+ Mapas • [\d.]+ Pins\)/,
    `## 🎮 Vitrine do Catálogo (${totalGames} Jogos • ${formatPtBr(totalMaps)} Mapas • ${formatPtBr(totalPins)} Pins)`
  );

  // 3. Replace catalog <table>...</table>
  const newTable = buildCatalogTable(summaries);
  readme = readme.replace(/<table>[\s\S]*?<\/table>/, newTable);

  await fs.writeFile(readmePath, readme, 'utf8');

  console.log(
    `[sync-readme] README.md atualizado: ${totalGames} jogos • ${formatPtBr(totalMaps)} mapas • ${formatPtBr(totalPins)} pins (${manifestsUpdated} manifestos recalculados).`
  );
}

main().catch((err) => {
  console.error('[sync-readme] Erro:', err);
  process.exit(1);
});
