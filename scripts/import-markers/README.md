# Nexus Maps — Importador & Calibrador de Marcadores (`import-markers`)

CLI em TypeScript (`tsx`) para importar datasets externos de marcadores (JSON padrão ou formato open-source `witcher3map` JS), calibrar automaticamente as coordenadas via transformação linear afim com 2 pontos de referência (`--ref`) e enriquecer pontos de referência com miniaturas da MediaWiki API.

## Como Usar

```bash
npm run import-markers -- \
  --input "https://raw.githubusercontent.com/witcher3map/witcher3map/master/assets/scripts/custom/mapdata-hos_velen.js" \
  --locales-url "https://raw.githubusercontent.com/witcher3map/witcher3map/master/assets/locales/en" \
  --game the-witcher-3-wild-hunt \
  --map main \
  --swap-xy \
  --ref "0,0=0,-144" \
  --ref "224,256=128,0" \
  --enrich-wiki
```

### Parâmetros

| Flag | Descrição |
| :--- | :--- |
| `--input`, `-i` | Caminho local ou URL do dataset (`.json` ou `.js`). |
| `--game`, `-g` | Slug do jogo destino (`src/data/games/<slug>/markers.json`). |
| `--map`, `-m` | ID da camada do mapa (`mapId`). |
| `--ref` | Ponto de calibração `srcX,srcY=dstX,dstY` (informe 2 pontos para calcular `scaleX/Y` e `offsetX/Y`). |
| `--swap-xy` | Inverte `[lat, lng]` da fonte para `[x, y]` antes de aplicar a transformação linear. |
| `--locales-url` | URL base dos arquivos de tradução do `witcher3map` (`general.json`, `v.json`, etc.). |
| `--enrich-wiki` | Busca miniaturas (`imageUrl`) e links (`wikiUrl`) na Witcher Wiki MediaWiki API. |
