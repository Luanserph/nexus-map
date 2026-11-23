<div align="center">

# 🗺️ Nexus Maps `v2.0.0`

**Central de cartografia interativa de alta performance para jogos de mundo aberto — Web, PWA e App Desktop nativo para Windows.**

[![Live Demo](https://img.shields.io/badge/Vercel-Acessar%20Web%20App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexus-map-zeta.vercel.app)
[![GitHub Releases](https://img.shields.io/badge/Windows-Baixar%20Desktop%20(.exe)-0EA5E9?style=for-the-badge&logo=tauri&logoColor=white)](https://github.com/Luanserph/nexus-map/releases)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tauri v2](https://img.shields.io/badge/Tauri_v2-24C8DB?style=for-the-badge&logo=tauri&logoColor=0F172A)](https://v2.tauri.app/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22C55E?style=for-the-badge)](./LICENSE)

</div>

---

## Sobre o Projeto

O **Nexus Maps** nasceu da vontade de ter um único lugar rápido, limpo e sem distrações para acompanhar exploração 100% em jogos de mundo aberto — seja no segundo monitor do PC, como aplicativo nativo no Windows ou direto no celular.

O motor do projeto trabalha com **pirâmides de tiles sob demanda (`EPSG:3857`)**, lazy-load de datasets por jogo, **ícones semânticos em cache por categoria**, clustering otimizado para mais de 16.000 pins simultâneos, camadas dinâmicas (como **Dia / Noite**) e persistência local offline-first com exportação e importação em JSON.

---

## App Desktop (Windows — Tauri v2)

Além da versão Web/PWA, o Nexus Maps conta com um aplicativo nativo para Windows construído em **Tauri v2**, compartilhando 100% da interface React/Vite com recursos exclusivos para jogar no PC:

- **Atalho Global `Alt + M`:** exibe, oculta e traz o mapa para frente instantaneamente sobre qualquer jogo sem precisar usar `Alt + Tab`.
- **Modo Sempre no Topo (*Always-on-Top*):** botão dedicado na barra superior para fixar o mapa como overlay ou no segundo monitor.
- **Persistência Nativa em Disco (`progress.json`):** todo o progresso (pins encontrados, notas pessoais, rotas e checklists) é salvo automaticamente em `%APPDATA%\com.nexusmaps.desktop\progress.json` via `@tauri-apps/plugin-fs`, com backup/restore em `.json` diretamente no rodapé do Hub.
- **Zero Flash Branco:** janela inicial configurada com fundo `#07090f` e abertura instantânea.

> **Download do Instalador:** baixe o instalador `.exe` (NSIS) ou `.msi` diretamente na aba [**GitHub Releases**](https://github.com/Luanserph/nexus-map/releases).

---

## Principais Recursos

* **Motor de Mapas de Alta Performance:** renderização fluida com tiles sob demanda (`EPSG:3857`), polígonos de regiões em GeoJSON, ícones SVG semânticos em cache por categoria e clustering com `chunkedLoading` pronto para mais de 16.000 pins.
* **Lazy-Load por Jogo:** o Hub carrega apenas os manifestos leves (`< 560 kB` no chunk principal), baixando marcadores e regiões sob demanda somente ao abrir um mapa.
* **Camadas em Tempo Real:** alternância instantânea entre variações visuais do mapa (ex.: **Dia / Noite** em *GTA VI*, **Superfície / Subterrâneo** em *Elden Ring*).
* **Ferramentas de Exploração 100%:** busca rápida (`Ctrl + K`), filtros por categoria, Modo Guia 100%, notas personalizadas, traçado de rotas e backup/restauração em JSON.
* **Estética Neon Glassmorphism Dinâmica:** Theme Engine orientado a manifesto que injeta automaticamente a paleta neon de cada jogo via CSS Variables.
* **Multi-idioma (i18n):** interface e categorias traduzidas em **Português (`pt-BR`)**, **Inglês (`en-US`)** e **Espanhol (`es-ES`)**.
* **Mobile & PWA Instalável:** layout adaptado para Android/iOS com suporte a instalação como aplicativo offline-first.

---

## Catálogo Atual (15 Jogos · 23 Mapas · 48.966 Pins)

### Mundos Abertos em Destaque

| Jogo | Mapas Disponíveis | Pins | Destaques |
| :--- | :--- | :---: | :--- |
| **Grand Theft Auto VI** | Estado de Leonida | 2.690 | Camadas Dia/Noite, 112 regiões GeoJSON e clustering |
| **Cyberpunk 2077** | Night City & Dogtown | 2.754 | Serviços, cyberpsicopatas, tarô e expansão integrada |
| **Elden Ring** | Terras Intermédias (+ Subterrâneo) & Reino das Sombras | 7.578 | Jogo base + *Shadow of the Erdtree* com clustering otimizado |
| **The Witcher 3: Wild Hunt** | Velen & Novigrad, Skellige, Toussaint, White Orchard, Kaer Morhen, Torre de Fyke | 3.000 | 6 mapas integrados com progresso unificado e DLCs |
| **Hollow Knight** | Hallownest | 979 | 43 áreas mapeadas, amuletos, chefes e segredos |

### Coleção *The Legend of Zelda* (10 Jogos · 31.965 Pins)

| Jogo | Mapas Disponíveis | Pins |
| :--- | :--- | :---: |
| **The Legend of Zelda: Breath of the Wild** | Hyrule | 16.504 |
| **The Legend of Zelda: Tears of the Kingdom** | Hyrule (Céu, Superfície e Profundezas) | 7.956 |
| **The Legend of Zelda: Ocarina of Time** | Passado (Criança) & Futuro (Adulto) | 3.218 |
| **The Legend of Zelda: The Wind Waker** | Great Sea | 1.232 |
| **The Legend of Zelda: A Link to the Past** | Light & Dark World | 815 |
| **The Legend of Zelda: Echoes of Wisdom** | Hyrule | 696 |
| **The Legend of Zelda (NES)** | First Quest & Second Quest | 545 |
| **The Legend of Zelda: Link's Awakening** | Koholint Island | 409 |
| **The Legend of Zelda: A Link Between Worlds** | Hyrule & Lorule | 332 |
| **Zelda II: The Adventure of Link** | Hyrule | 258 |

---

## Roadmap

- [x] Motor de mapas `EPSG:3857` com clustering (`chunkedLoading`) e polígonos GeoJSON
- [x] Persistência offline-first (IndexedDB / Dexie.js) com exportação e importação JSON
- [x] Layout responsivo para Mobile e suporte a PWA instalável
- [x] Coleção completa de 10 jogos de **The Legend of Zelda** + lazy-load de datasets por jogo
- [x] Ícones semânticos em cache por categoria nos pins do mapa e na sidebar
- [x] **App Desktop nativo para Windows (Tauri v2)** com atalho global `Alt + M`, *Sempre no Topo* e persistência em `%APPDATA%\progress.json`
- [ ] Expansão contínua do catálogo com novos RPGs e jogos de mundo aberto ([veja como adicionar novos jogos](./docs/ADDING_GAMES.md))
- [ ] Sincronização em nuvem opcional entre Desktop e Mobile

---

## Stack Tecnológica

* **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4
* **Desktop Nativo:** Tauri v2 (Rust), `@tauri-apps/plugin-global-shortcut`, `@tauri-apps/plugin-fs`
* **Mapas & Geodados:** Leaflet (`EPSG:3857` / `CRS.Simple`), GeoJSON, `leaflet.markercluster`
* **Persistência & Offline:** IndexedDB (Dexie.js), `progress.json` nativo no Desktop, `vite-plugin-pwa`
* **Pipeline de Dados:** Scripts automatizados em TypeScript (`tsx`) para extração, padronização de manifestos, marcadores e regiões

---

## Rodando Localmente

### Pré-requisitos
* **Web:** Node.js 18+ e npm
* **Desktop (Tauri v2):** Rust (`rustup`) + Visual Studio Build Tools (*Desenvolvimento para desktop com C++*)

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone https://github.com/Luanserph/nexus-map.git
cd nexus-map

# 2. Instale as dependências
npm install

# 3. Inicie a versão Web
npm run dev

# 4. Ou inicie o App Desktop (Tauri v2)
npm run tauri:dev

# 5. Para gerar os instaladores Windows (.exe / .msi)
npm run tauri:build
```

---

## Adicionando Novos Jogos

O catálogo é 100% orientado a manifesto (`src/data/games/<slug>/manifest.json`). Para adicionar um novo jogo ou mapa usando nosso pipeline automatizado, consulte o guia completo em [**`docs/ADDING_GAMES.md`**](./docs/ADDING_GAMES.md).

---

## Licença

Distribuído sob a licença **MIT**. Consulte o arquivo [LICENSE](./LICENSE) para mais detalhes.
