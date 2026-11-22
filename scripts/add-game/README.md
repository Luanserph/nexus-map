# Nexus Maps — Pipeline Automatizado de Ingestão de Jogos (`add-game`)

Script CLI em TypeScript (`tsx`) que automatiza a criação completa de um jogo no Hub:

1. Consulta metadados na **RAWG API** (título, estúdio, ano, gêneros e imagem base).
2. Consulta a **SteamGridDB API** (opcional, com fallback automático para a RAWG) para capa, banner e logo em alta resolução.
3. Converte todas as imagens para `.webp` otimizado em `public/games/<slug>/` usando `sharp`.
4. Extrai uma paleta vibrante (`accentPrimary`, `accentSecondary`, `accentGlow`, `glassTint`, `surfaceBase`) diretamente da capa/banner para o **Theme Engine**.
5. Se `--map-url` for informado, baixa a imagem do mapa para uma pasta temporária, executa `scripts/tile-slicer/slice-map.mjs` para gerar a pirâmide `.webp` em `public/tiles/<slug>/<map-id>/`, injeta `bounds` e `maxZoom` no manifesto e limpa o temporário.
6. Cria `src/data/games/<slug>/manifest.json` e `markers.json`, detectados automaticamente pelo Vite via `import.meta.glob` em `src/data/games/index.ts`.

## Configuração

Copie `.env.example` para `.env` na raiz do projeto e preencha:

```env
RAWG_API_KEY=sua_chave_rawg
STEAMGRIDDB_API_KEY=sua_chave_steamgriddb_opcional
```

## Uso

```bash
# Apenas metadados, capa/banner .webp, tema automático e manifesto:
npm run add-game -- --name "The Witcher 3: Wild Hunt"

# Com fatiamento automático de imagem de mapa em tiles .webp:
npm run add-game -- --name "Skyrim" --map-url "https://exemplo.com/skyrim-8k.png" --map-id "tamriel" --map-name "Skyrim"
```
