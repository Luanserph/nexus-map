# 🗺️ NEXUS MAPS — Blueprint de Arquitetura, Engenharia Reversa & Design System

> **Documento Diretor de Engenharia (PRD + Arquitetura Técnica + UI/UX)**  
> **Objetivo:** Construir um Hub centralizado de mapas interativos de jogos de alta performance, com estética **Neon Glassmorphism** tática (anti-estética genérica de IA) e **Identidade Visual Dinâmica por Jogo**.  
> **Uso:** Este documento foi estruturado para servir como *Single Source of Truth* (Fonte Única de Verdade) para agentes de desenvolvimento no **Antigravity**.

---

## 1. Visão do Produto & Conceito de Hub

O **Nexus Maps** não é apenas uma página com um mapa embutido; é uma **Central de Cartografia Gamer**. O usuário entra em um Hub unificado com estética espacial/tática refinada, escolhe um jogo e, ao abrir o mapa, toda a interface (HUD, cores de acento, tipografia auxiliar, texturas, ícones de pins e efeitos de luz) sofre uma mutação controlada para refletir o universo daquele jogo específico.

### Pilares Inegociáveis
1. **Performance a 60 FPS:** Suportar mapas em altíssima resolução (16K+) com mais de **5.000 marcadores simultâneos** sem engasgos (renderização via WebGL, nunca milhares de nós no DOM).
2. **Estética Autoral (Anti-"AI Slop"):** Neon Glassmorphism maduro — superfícies translúcidas com micro-bordas nítidas, textura de grão sutil (*noise*), contraste cirúrgico e uso contido de brilho neon apenas como indicador de estado/hierarquia.
3. **Identidade Camaleônica:** Cada jogo carrega seu próprio `ThemeManifest` (ex: ouro envelhecido + esmeralda espectral para *Elden Ring*; amarelo ácido + ciano cyber para *Cyberpunk 2077*; azul abissal + branco osso para *Hollow Knight*).
4. **Offline-First & Instantâneo:** Progresso salvo localmente em tempo real (IndexedDB/LocalStorage) com sincronização em nuvem opcional.

---

## 2. Engenharia Reversa Funcional & Técnica (Benchmark: MapGenie)

Analisando a fundo a arquitetura de plataformas líderes como o *MapGenie* (ex: `elden-ring/maps/the-lands-between`), extraímos **4 camadas críticas** que compõem a experiência completa:

### 2.1. Motor de Renderização e Pirâmide de Tiles (Map Engine)
Mapas de jogos não são imagens `.jpg` gigantes carregadas de uma vez (isso travaria a memória da GPU/Browser). Eles funcionam exatamente como o Google Maps:
* **Tile Pyramid (`{z}/{x}/{y}.webp`):** A imagem original (ex: `16384x16384px`) é fatiada em quadrados de `256x256px` ou `512x512px` em múltiplos níveis de zoom (`z=0` até `z=6`).
* **Sistema de Coordenadas Plano (`CRS.Simple` / Coordenadas Cartesianas):** Ao contrário de mapas terrestres (Mercator), mapas de jogos usam projeção plana 2D com limites (`bounds`) definidos `[minX, minY, maxX, maxY]`.
* **Renderização em WebGL (Recomendado: `MapLibre GL JS`):** Em vez de usar Leaflet com marcadores HTML (que travam acima de 500 pins), usamos **MapLibre GL JS** com camadas de símbolos (*Symbol Layers*) e **Sprite Sheets** (atlas de ícones). Isso permite renderizar 10.000 pins a 60 FPS nativos.

### 2.2. Sistema de Camadas & Dimensões (Multi-Layer)
Jogos modernos possuem múltiplos níveis sobrepostos (ex: *Elden Ring* com **Superfície** vs. **Subterrâneo / Siofra & Deeproot**, ou edifícios com múltiplos andares):
* **Layer Switcher:** Botão flutuante no HUD que troca o `tileset` ativo e filtra automaticamente os marcadores pertencentes ao `layerId` selecionado.
* **Transição Espacial:** Crossfade suave entre camadas mantendo as coordenadas `(x, y)` e o nível de zoom sincronizados.
* **Overlays Opcionais:** Regiões/Nomes de áreas (textos vetoriais que escalam com o zoom), linhas de fronteira, zonas de nível recomendado (Heatmaps) e caminhos subterrâneos tracejados.

### 2.3. Anatomia Completa de Recursos (Feature Matrix)

| Categoria | Recurso | Comportamento Esperado |
| :--- | :--- | :--- |
| **Navegação & Busca** | Busca Global (`Cmd/Ctrl + K`) | Fuzzy search instantâneo por nome do item, chefe, região ou descrição. Clicar faz *flyTo()* suave até o pin e abre o card. |
| **Filtros Inteligentes** | Árvore de Categorias | Agrupamento hierárquico (ex: *Locais*, *Chefes*, *Colecionáveis*, *Equipamentos*). Botões rápidos: `Mostrar Todos`, `Ocultar Todos` e contador `Encontrados / Total`. |
| **Progresso do Jogador** | Tracking (Check-off) | Marcar pin como "Encontrado/Concluído" reduz sua opacidade (ex: `35%`) ou o oculta conforme preferência do usuário. Barra de progresso global por categoria. |
| **Personalização** | Notas & Pins Customizados | Clique direito no mapa para criar um marcador pessoal com ícone, cor e nota em Markdown. |
| **Planejamento** | Traçador de Rotas (Pathing) | Ferramenta para desenhar rotas de *speedrun* ou *farm* ligando pontos no mapa, com cálculo de distância relativa e exportação via URL/JSON. |
| **Presets (Filtros Salvos)** | Perfis de Visualização | Ex: "Modo Platina 100%", "Apenas Chefes Principais", "Sem Spoilers (Esconder segredos)". |
| **Compartilhamento** | Deep Linking | URL dinâmica refletindo estado: `/map/elden-ring?layer=surface&x=420&y=-180&z=4&pin=malenia-01`. |
| **Detalhes do Pin** | Rich Drawer / Popover | Título, categoria, imagem/screenshot do local, vídeo embutido (opcional), guia passo-a-passo, pré-requisitos de quest, botão "Marcar como Encontrado" e link direto. |
| **Comunidade** | Sugestões & Comentários | Área de dicas rápidas da comunidade por pin (com tag de Spoiler colapsável) e botão de reportar coordenada incorreta. |

---

## 3. Direção de Arte: Neon Glassmorphism "Anti-AI Slop"

Para fugir completamente da aparência genérica de interfaces geradas por IA (roxo/azul padrão, bordas brilhantes exageradas, cartões genéricos sem alma), adotaremos o estilo **Tactical Neon Glassmorphism**:

### 3.1. Princípios Visuais
1. **Vidro Realista (Materialidade):**
   * Fundo escuro de altíssima profundidade (`rgba(10, 12, 16, 0.72)`), `backdrop-filter: blur(16px) saturate(140%)`.
   * **Micro-textura de ruído (SVG Noise Overlay a 2-3% de opacidade):** Elimina o aspecto "plástico digital" e dá peso tátil aos painéis.
   * **Bordas Arquitetônicas:** Bordas de `1px solid` com gradiente sutil simulando iluminação vinda do topo (`rgba(255,255,255,0.14)` no topo para `rgba(255,255,255,0.03)` na base).
2. **Neon Cirúrgico (Sem Poluição Visual):**
   * O brilho neon (`box-shadow` difuso + borda luminosa) é reservado **exclusivamente** para: estado ativo (*active/selected*), foco de busca, indicadores de progresso e pins selecionados.
   * Nunca aplicar neon em textos longos ou blocos inteiros de fundo.
3. **Tipografia de Alto Contraste:**
   * **Display / Títulos:** Fonte geométrica ou serifada adaptada ao jogo (no Hub: `Space Grotesk` ou `Syne`).
   * **UI / Leitura:** `Inter` ou `Plus Jakarta Sans` com `font-feature-settings: "cv02", "cv03"`.
   * **Dados / Coordenadas / Contadores:** `JetBrains Mono` (ex: `X: 1402.4 | Y: -892.1 | Z: 4.2x`) para dar autenticidade de ferramenta cartográfica de precisão.
4. **Geometria HUD:**
   * Cantos chanfrados sutis (*chamfered corners* via `clip-path`) ou raios consistentes (`12px` para painéis principais, `6px` para botões internos) combinados com pequenos marcadores técnicos nos cantos (crosshairs sutis).

### 3.2. Motor de Identidade Visual Dinâmica (Dynamic Theme Engine)
Cada jogo possui um manifesto visual que injeta variáveis CSS no elemento raiz (`:root` / `[data-theme]`) instantaneamente ao navegar para o mapa:

```css
/* Exemplo de Injeção Dinâmica de Tokens por Jogo */

/* 1. HUB CENTRAL (Padrão - Obsidiana & Ciano Tático) */
[data-game-theme="hub-default"] {
  --bg-canvas: #07090D;
  --glass-bg: rgba(13, 17, 24, 0.75);
  --accent-primary: #00F0FF;      /* Ciano Neon */
  --accent-secondary: #FF2A85;    /* Magenta Alerta */
  --accent-glow: rgba(0, 240, 255, 0.35);
  --font-display: 'Space Grotesk', sans-serif;
}

/* 2. ELDEN RING (Ouro Maculado & Chama Espectral) */
[data-game-theme="elden-ring"] {
  --bg-canvas: #0B0A08;
  --glass-bg: rgba(18, 16, 12, 0.80);
  --accent-primary: #D4AF37;      /* Ouro Térvore */
  --accent-secondary: #48D1CC;    /* Azul Espectral (Ranni/Graça) */
  --accent-glow: rgba(212, 175, 55, 0.40);
  --font-display: 'Cinzel', serif; /* Tipografia medieval refinada */
}

/* 3. CYBERPUNK 2077 (Amarelo Night City & Vermelho Arasaka) */
[data-game-theme="cyberpunk-2077"] {
  --bg-canvas: #09060A;
  --glass-bg: rgba(16, 10, 18, 0.82);
  --accent-primary: #FCEE0A;      /* Cyber Yellow */
  --accent-secondary: #FF003C;    /* Neon Crimson */
  --accent-glow: rgba(252, 238, 10, 0.35);
  --font-display: 'Rajdhani', sans-serif;
}
```

> **Detalhe Crucial:** Além das cores e fontes, cada jogo define seu próprio **Icon Pack SVG** (ex: *Site of Grace* em Elden Ring, *Fast Travel DataTerm* em Cyberpunk) e uma **Vinheta/Watermark sutil** no cabeçalho da sidebar.

---

## 4. Arquitetura de Software & Stack Recomendada

Arquitetura moderna, escalável e ideal para desenvolvimento ágil no Antigravity:

### 4.1. Stack Tecnológica
* **Framework:** `Next.js 15+` (App Router) com `React 19` e `TypeScript` (Strict Mode).
* **Estilização:** `Tailwind CSS v4` (integrado diretamente às CSS Variables do Theme Engine) + `Framer Motion` (transições fluidas de HUD e modais).
* **Engine de Mapa:** `MapLibre GL JS` (open-source, WebGL nativo, zero custos de licença do Mapbox, suporte a tiles raster customizados + layers GeoJSON de altíssima performance).
* **Gerenciamento de Estado:**
  * `Zustand`: Estado global da sessão do mapa (camada ativa, categorias filtradas, pin selecionado, zoom/coordenadas, modo de desenho de rota).
  * `TanStack Query`: Cache inteligente de datasets JSON dos mapas.
* **Persistência Local (Offline-First):** `Dexie.js` (wrapper moderno para IndexedDB) para salvar progresso, pins encontrados, notas e rotas instantaneamente sem depender de login.
* **Backend & Infraestrutura (Fase de Escala):**
  * **Banco de Dados:** `Supabase` (PostgreSQL) para autenticação, sincronização de progresso em nuvem e comentários da comunidade.
  * **Storage de Tiles & Mídia:** `Cloudflare R2` (egress gratuito — essencial para servir milhões de tiles de mapa sem estourar a fatura).

### 4.2. Estrutura de Diretórios (Monorepo / App Limpo)
```text
nexus-maps/
├── public/
│   ├── tiles/                  # Tiles locais para dev: /tiles/{gameId}/{layerId}/{z}/{x}/{y}.webp
│   ├── sprites/                # Atlas de ícones SVG/PNG por jogo
│   └── textures/               # Noise grain overlay e banners dos jogos
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Fontes base + Providers
│   │   ├── page.tsx            # O HUB CENTRAL (Vitrine de Jogos)
│   │   └── map/[gameSlug]/
│   │       └── page.tsx        # Viewport do Mapa Interativo + Theme Injection
│   ├── components/
│   │   ├── hub/                # GameCard, HeroCarousel, GlobalSearch, ContinuePlaying
│   │   ├── map/                # MapEngine.tsx (MapLibre), MarkerPopup.tsx, RouteDrawer.tsx
│   │   ├── hud/                # GlassSidebar, LayerSwitcher, CommandPalette (Cmd+K), ProgressBar
│   │   └── ui/                 # GlassPanel, NeonButton, ChamferedBadge
│   ├── engine/
│   │   ├── themes/             # Manifestos visuais de cada jogo (elden-ring.theme.ts, etc.)
│   │   ├── map-utils.ts        # Conversão de coordenadas, bounds, cálculo de distância
│   │   └── tile-pipeline.ts    # Helpers de resolução de URLs de tiles
│   ├── store/
│   │   ├── useMapStore.ts      # Filtros, busca, camada ativa, pin selecionado
│   │   └── useProgressStore.ts # Sync com Dexie.js (Found pins, notas, presets)
│   ├── data/                   # Datasets estruturados (JSON/GeoJSON) por jogo
│   └── types/
│       └── schema.ts           # Contratos TypeScript rigorosos
└── scripts/
    └── generate-tiles.ts       # Script Node + Sharp para fatiar imagens 8K/16K em Tile Pyramid
```

---

## 5. Modelagem de Dados (Contratos TypeScript)

Estes schemas garantem que adicionar um novo jogo ao Hub seja puramente **orientado a dados (Data-Driven)**, sem precisar duplicar código de UI:

```typescript
// src/types/schema.ts

export interface GameTheme {
  id: string;
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  bgCanvas: string;
  glassTint: string;
  fontDisplay: string;
  badgeStyle: 'chamfered' | 'ornate' | 'minimal';
  bannerUrl: string;
  logoUrl: string;
}

export interface MapLayer {
  id: string;                   // ex: "surface", "underground"
  name: string;                 // ex: "Terras Intermédias", "Subterrâneo"
  icon: string;
  tileUrlTemplate: string;      // ex: "/tiles/elden-ring/surface/{z}/{x}/{y}.webp"
  minZoom: number;
  maxZoom: number;
  bounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  defaultCenter: [number, number];
  defaultZoom: number;
}

export interface CategoryGroup {
  id: string;                   // ex: "locations", "bosses", "collectibles"
  label: string;
  categories: Category[];
}

export interface Category {
  id: string;                   // ex: "site-of-grace", "demigod-boss"
  groupId: string;
  name: string;
  icon: string;                 // ID do ícone no Sprite Sheet / SVG
  color: string;                // Hex específico do pin
  defaultVisible: boolean;
}

export interface MapMarker {
  id: string;
  gameId: string;
  layerId: string;
  categoryId: string;
  title: string;
  subtitle?: string;
  description: string;          // Suporta Markdown leve
  coordinates: [number, number];// [x, y]
  region?: string;
  media?: {
    imageUrl?: string;
    videoUrl?: string;
  };
  tags?: string[];              // ex: ["missable", "dlc", "spoiler"]
  relatedPinIds?: string[];     // Ex: chave que abre esta porta
}

export interface UserPinState {
  pinId: string;
  gameId: string;
  found: boolean;
  foundAt?: number;
  note?: string;
}

export interface GameManifest {
  slug: string;                 // ex: "elden-ring"
  title: string;
  developer: string;
  releaseYear: number;
  genre: string[];
  totalMarkersCount: number;
  theme: GameTheme;
  layers: MapLayer[];
  categoryGroups: CategoryGroup[];
}
```

---

## 6. Arquitetura de UX/UI (Fluxo das Telas)

### 6.1. Tela 1: O Hub Central (`/`)
* **Header Minimalista:** Logo Nexus Maps, barra de busca unificada ("Buscar jogos, mapas ou chefes...") e status de sincronização.
* **Seção "Continuar Explorando":** Cards compactos mostrando os últimos mapas acessados pelo usuário com barra de progresso real (ex: *Elden Ring — 42% concluído*).
* **Grid de Jogos (Bento / Cards Reativos):**
  * Cada card exibe a arte oficial/key-art do jogo em dark mode com vinheta.
  * **Hover Inteligente:** Ao passar o mouse sobre um jogo, a borda do card e o brilho ambiental (*ambient glow*) assumem imediatamente a cor primária daquele jogo (`theme.accentPrimary`), antecipando a identidade visual do mapa.
  * Micro-badges exibem a contagem de mapas/camadas e total de marcadores catalogados.

### 6.2. Tela 2: Viewport do Mapa Interativo (`/map/[gameSlug]`)
O mapa ocupa **100% da viewport (`100vw x 100vh`)**. Todos os controles flutuam sobre o mapa como um **HUD de Vidro Neon** retrátil:

1. **Sidebar Esquerda Flutuante (GlassPanel):**
   * Cabeçalho com Logo do Jogo + botão voltar ao Hub.
   * Barra de Progresso Geral (`X / Y encontrados`) com barra neon estilizada.
   * Botões rápidos: `Todos`, `Nenhum`, `Ocultar Encontrados`, `Presets`.
   * Acordeão de Categorias com ícones temáticos e contadores individuais.
   * Botão de recolher (`<`) para imersão total no mapa.
2. **Barra Superior Central (Floating Pill):**
   * Gatilho rápido para Busca Global (`Cmd + K`) + Breadcrumb da região atual sob o cursor.
3. **Seletor de Camadas (Canto Inferior Esquerdo):**
   * Alternador estilizado (ex: `Superfície` / `Subterrâneo`) com ícone de camadas e feedback neon ativo.
4. **Controles Táticos (Canto Inferior Direito):**
   * Zoom `+ / -`, Resetar Visão, Ferramenta de Rota (Medir/Traçar), Adicionar Pin Pessoal, Tela Cheia e Leitor de Coordenadas em tempo real (`JetBrains Mono`).
5. **Drawer / Card de Detalhes do Pin (Direita):**
   * Abre de forma suave ao clicar em qualquer pin sem bloquear o arrasto do mapa.
   * Exibe screenshot ampliável, guia em Markdown, botão principal **Marcar como Encontrado** (com micro-animação satisfatória), área de **Nota Pessoal** e botão **Copiar Link do Pin**.

---

## 7. Pipeline de Dados & Geração de Tiles (Boas Práticas)

Para alimentar o Hub de forma sustentável, limpa e rápida:
1. **Script de Fatiamento de Mapas (`scripts/generate-tiles.ts`):**
   * Utilizar a biblioteca `sharp` em Node.js para ler uma imagem base de alta resolução e gerar automaticamente a árvore de diretórios `{z}/{x}/{y}.webp` (qualidade 82%, compressão rápida).
2. **Conversão para GeoJSON:**
   * Armazenar os marcadores em arquivos JSON otimizados por jogo e convertê-los em memória para um `FeatureCollection` (GeoJSON) antes de injetar no MapLibre GL JS.
   * Usar **Data-Driven Styling** no MapLibre para alterar opacidade de pins marcados como "encontrados" direto na GPU, sem recarregar o mapa.

---

## 8. Roadmap de Execução para o Antigravity

Siga estritamente esta ordem de fases para manter o código limpo, testável e visualmente impressionante desde o primeiro commit:

### Fase 1: Fundação, Design System & Theme Engine
- [ ] Inicializar projeto Next.js (App Router, TypeScript, Tailwind CSS v4).
- [ ] Configurar fontes (`Space Grotesk`, `Inter`, `JetBrains Mono`, `Cinzel`, `Rajdhani`).
- [ ] Criar o sistema de CSS Variables para **Neon Glassmorphism** (incluindo o filtro de *noise texture* e componentes base `GlassPanel`, `NeonButton`, `ProgressBar`).
- [ ] Implementar o `ThemeProvider` dinâmico que troca as variáveis CSS com base no `GameManifest`.

### Fase 2: O Hub Central
- [ ] Criar 3 `GameManifest` completos de demonstração com identidades visuais radicalmente distintas (ex: *Elden Ring*, *Cyberpunk 2077*, *Hollow Knight*).
- [ ] Desenvolver a tela inicial do Hub com busca, filtros por gênero, seção "Continuar Explorando" e cards com *hover glow* reativo ao tema do jogo.

### Fase 3: Engine de Mapa Interativo (WebGL)
- [ ] Integrar `MapLibre GL JS` configurado para projeção plana (Custom Raster Tiles ou imagem de alta resolução com bounds).
- [ ] Criar script `generate-tiles.ts` ou fallback de imagem de alta resolução para testes rápidos em ambiente local.
- [ ] Renderizar marcadores via camada GeoJSON + ícones customizados + Clustering inteligente em níveis baixos de zoom.
- [ ] Implementar o HUD flutuante (Sidebar de filtros, Coordenadas em tempo real, Zoom e Seletor de Camadas).

### Fase 4: Interatividade & Recursos Power-User
- [ ] Implementar o Drawer de detalhes do Pin com suporte a Markdown, imagem e botão "Marcar como Encontrado".
- [ ] Conectar o `useProgressStore` ao `Dexie.js` (IndexedDB) para persistência local instantânea + Exportar/Importar backup em JSON.
- [ ] Construir a Command Palette (`Cmd + K`) com *fuzzy search* e animação `flyTo()` até o pin escolhido.
- [ ] Implementar criação de Pins Pessoais (clique direito no mapa) e Deep Linking via parâmetros de URL.

### Fase 5: Recursos Avançados & Polimento Final
- [ ] Ferramenta de Traçador de Rotas (desenho de linhas vetoriais sobre o mapa com salvamento).
- [ ] Sistema de Presets de filtros (ex: "100% Completion", "Chefes", "Sem Spoilers").
- [ ] Auditoria de performance (garantir 60 FPS com 2.000+ pins mockados em teste de estresse) e responsividade mobile (Bottom Sheet para filtros e detalhes em telas menores).

---

## 9. Diretrizes de Código para o Agente (Antigravity Rules)

1. **Zero UI Genérica:** Nunca use gradientes roxo-para-azul padrão ou cards brancos/cinzas sem profundidade. Respeite sempre os tokens `--glass-bg`, `--accent-primary` e as micro-bordas definidas na Seção 3.
2. **Performance em Primeiro Lugar:** Nunca renderize centenas de `<div />` como marcadores sobre o mapa. Use as camadas WebGL/Canvas do motor de mapa.
3. **Arquitetura Data-Driven:** Nenhuma lógica de componente deve ter `if (game === 'elden-ring')`. Toda customização visual ou estrutural deve vir do objeto `GameManifest`.
4. **Acessibilidade & Atalhos:** Todos os painéis devem responder a `ESC` para fechar e `Cmd/Ctrl + K` para focar na busca.