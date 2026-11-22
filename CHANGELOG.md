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
- Navegação fluida Hub ↔ Tela do Mapa baseada em URL hash (`src/core/router/useHashRoute.ts`) e shell do **MapWorkspace** (`src/components/map-ui/MapWorkspace.tsx`) com topbar flutuante (botão "Voltar ao Hub", nome do jogo e seletor de camadas), sidebar retrátil de busca/filtros e viewport tática com coordenadas `[X, Y]` em tempo real e controles de zoom.

### Planned
- Pipeline de fatiamento de mapas em tiles `.webp`.
- Motor de mapa interativo WebGL (MapLibre GL JS) com multicamadas, filtros e progresso offline-first (IndexedDB).

---

## [0.1.0] - A definir
### Added
- *(Preencher ao finalizar a Etapa 1 — Hub + Design System)*