# Nexus Maps — Regras para Agentes

## Fonte de Verdade
- Consulte sempre `docs/NEXUS_MAPS_BLUEPRINT.md` antes de propor arquitetura, schemas de dados ou componentes visuais.

## Stack e Padrões
- React + TypeScript + Vite + Tailwind CSS.
- Persistência local via IndexedDB (Dexie.js). Nunca dependa de backend obrigatório para salvar progresso do usuário.
- Dados de jogos são estritamente orientados a manifesto (`src/data/games/<slug>/manifest.json`). Nunca faça hardcode de cores, fontes ou regras específicas de um jogo dentro dos componentes globais.

## Direção de Arte (Neon Glassmorphism Autoral)
- Evite estética genérica de IA (nada de gradientes roxo/azul padrão em tudo ou cards genéricos sem hierarquia).
- Use superfícies translúcidas com `backdrop-filter`, bordas sutis de 1px (`rgba`), micro-ruído (noise) e brilho neon contido apenas em estados ativos, foco e marcadores.
- Todas as cores de destaque devem consumir CSS Variables injetadas pelo Theme Engine do jogo ativo.

## Higiene de Repositório
- Ao concluir uma funcionalidade relevante ou correção, sugira a entrada correspondente na seção `[Unreleased]` do `CHANGELOG.md`.
- Mantenha componentes pequenos, tipados e desacoplados.