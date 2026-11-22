# Changelog

Todas as mudanças notáveis do **Nexus Maps** serão documentadas neste arquivo.
O formato segue o padrão [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Unreleased]

### Added
- Estrutura inicial do repositório e documentação de arquitetura (`docs/NEXUS_MAPS_BLUEPRINT.md`).
- Regras operacionais para agentes de código (`AGENTS.md`).
- Setup do Tailwind CSS v4 (`@tailwindcss/vite`) e `lucide-react`, além da base de tokens dinâmicos em CSS Variables (`--accent-primary`, `--accent-glow`, `--glass-bg`, `--glass-border`, `--surface-base`), overlay de micro-ruído (noise) e tipografia configurada (`Space Grotesk`, `Inter`, `JetBrains Mono`, `Cinzel`, `Rajdhani`).
- Primitivos Neon Glassmorphism reutilizáveis e tipados em `src/components/glass/`: `GlassPanel`, `NeonButton`, `GlassInput` e `GlassBadge`.
- Contratos TypeScript orientados a manifesto (`src/types/schema.ts`) e 3 manifestos de jogos de demonstração (`elden-ring`, `cyberpunk-2077` e `hollow-knight`) em `src/data/games/<slug>/manifest.json` com registro central (`src/data/games/registry.ts`).
- Shell do Hub (`src/components/hub/`) com barra superior flutuante (`HubNavbar` com busca global `Ctrl+K` e filtros por status/gênero), grid responsivo de `GameCard` com capa cartográfica procedural (`GameCoverArt`), progresso local mockado, indicador de identidade cromática, hover reativo por variáveis CSS e modal de pré-visualização de manifesto (`HubShell`).

### Planned
- Theme Engine dinâmico completo com `ThemeProvider` para transições de viewport de mapa.
- Pipeline de fatiamento de mapas em tiles `.webp`.
- Motor de mapa interativo com multicamadas, filtros e progresso offline-first (IndexedDB).

---

## [0.1.0] - A definir
### Added
- *(Preencher ao finalizar a Etapa 1 — Hub + Design System)*