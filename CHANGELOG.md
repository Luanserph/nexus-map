# Changelog

Todas as mudanças notáveis do **Nexus Maps** serão documentadas neste arquivo.
O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- Estrutura inicial do repositório e documentação de arquitetura (`docs/NEXUS_MAPS_BLUEPRINT.md`).
- Regras operacionais para agentes de código (`AGENTS.md`).
- Setup do Tailwind CSS v4 (`@tailwindcss/vite`) e `lucide-react`, além da base de tokens dinâmicos em CSS Variables (`--accent-primary`, `--accent-glow`, `--glass-bg`, `--glass-border`, `--surface-base`), overlay de micro-ruído (noise) e tipografia configurada (`Space Grotesk`, `Inter`, `JetBrains Mono`, `Cinzel`, `Rajdhani`).
- Primitivos Neon Glassmorphism reutilizáveis e tipados em `src/components/glass/`: `GlassPanel`, `NeonButton`, `GlassInput` e `GlassBadge`.
- Contratos TypeScript rigorosos orientados a manifesto (`GameManifest` em `src/types/schema.ts`), 3 manifestos individuais em `src/data/games/<slug>/manifest.json` (`elden-ring`, `cyberpunk-2077`, `hollow-knight`) e loader/registro central em `src/data/games/index.ts`.
- **Theme Engine Dinâmico** (`src/core/theme-engine/`): `ThemeProvider` e hook `useGameTheme` que injetam dinamicamente as CSS Variables (`--accent-primary`, `--accent-secondary`, `--accent-glow`, `--glass-tint`, `--surface-base`) no `:root` com transição suave ao alternar entre o Hub e qualquer jogo.
- Suporte a imagens reais (`coverImage` / `bannerImage`) com overlay em gradiente para legibilidade e fallback automático para o gráfico vetorial tático em caso de ausência ou erro de carregamento (`GameCoverArt`).
- Navegação fluida Hub ↔ Tela do Mapa baseada em URL hash (`src/core/router/useHashRoute.ts`) e shell do **MapWorkspace** (`src/components/map-ui/MapWorkspace.tsx`) com topbar flutuante (botão "Voltar ao Hub", nome do jogo e seletor de camadas) e sidebar retrátil de busca/filtros.
- **Script Fatiador de Tiles** (`scripts/tile-slicer/slice-map.mjs` + `README.md` + `npm run slice-map`) usando `sharp` para gerar pirâmides `public/tiles/<game-slug>/<map-id>/{z}/{x}/{y}.webp` (256×256px) e `metadata.json` com `bounds` e `maxZoom`; adicionada regra `public/tiles/` no `.gitignore`.
- **Motor de Mapa Interativo** (`src/core/engine/`): `InteractiveMap` baseado em Leaflet (`L.CRS.Simple` + `preferCanvas: true`), com `createTacticalTileLayer` (carregamento real de tiles `.webp` com fallback automático para canvas cartográfico temático), troca fluida de camadas, controles de zoom e leitura de coordenadas `[X, Y]` em tempo real.
- **Camada de Marcadores**: schema `MapMarker` atualizado, datasets `markers.json` para `elden-ring` (20 pins), `cyberpunk-2077` (8 pins) e `hollow-knight` (8 pins), ícones SVG distintos por categoria (`markerIcons.ts`), tooltips e popups em Neon Glassmorphism, além de busca com `flyTo` rápido na sidebar.

### Planned
- Persistência local offline-first de pins encontrados, notas pessoais e backups JSON via IndexedDB (`Dexie.js`).
- Command Palette global (`Cmd/Ctrl + K`) e criação de pins/rotas customizadas.

---

## [0.1.0] - A definir
### Added
- *(Preencher ao finalizar a Etapa 1 — Hub + Design System)*