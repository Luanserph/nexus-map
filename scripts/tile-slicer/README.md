# Nexus Maps — Tile Pyramid Slicer

Script utilitário em Node.js (`sharp`) para fatiar imagens de mapas em altíssima resolução (4K, 8K, 16K+) em uma pirâmide de tiles `.webp` de `256x256px` pronta para consumo pelo motor Leaflet (`L.CRS.Simple`).

## Como Usar

```bash
npm run slice-map -- --input ./caminho/do/mapa.png --game elden-ring --map surface
```

### Parâmetros

| Flag | Obrigatório | Padrão | Descrição |
| :--- | :---: | :--- | :--- |
| `--input`, `-i` | Sim | — | Caminho para a imagem fonte (`.png`, `.jpg`, `.webp`, `.tiff`). |
| `--game`, `-g` | Sim | — | Slug do jogo (ex: `elden-ring`, `cyberpunk-2077`). |
| `--map`, `-m` | Sim | — | ID da camada/mapa declarada no `manifest.json` (ex: `surface`). |
| `--tile-size` | Não | `256` | Dimensão de cada tile em pixels (`256x256`). |
| `--quality`, `-q` | Não | `82` | Qualidade da compressão `.webp` (1 a 100). |
| `--max-zoom` | Não | Automático | Sobrescreve o nível máximo de zoom calculado pela resolução. |
| `--out`, `-o` | Não | `public/tiles/<game>/<map>` | Diretório de saída customizado. |

## Saída Gerada

1. Árvore de tiles: `public/tiles/<game>/<map>/{z}/{x}/{y}.webp`
2. Arquivo de metadados: `public/tiles/<game>/<map>/metadata.json` contendo `bounds`, `minZoom`, `maxZoom`, `defaultCenter` e `tileUrlTemplate` prontos para o `manifest.json`.

> **Nota:** A pasta `public/tiles/` está listada no `.gitignore` para evitar versionar milhares de arquivos binários `.webp` no Git.
