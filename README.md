<div align="center">

# 🗺️ Nexus Maps

**Central de cartografia interativa de alta performance para jogos de mundo aberto.**

[![Live Demo](https://img.shields.io/badge/Vercel-Acessar%20App-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexus-map-zeta.vercel.app)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge&logo=tailwind-css&logoColor=38BDF8)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Instalável-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](#)

</div>

---

## Sobre o Projeto

O **Nexus Maps** nasceu da vontade de ter um único lugar rápido, limpo e sem distrações para acompanhar exploração 100% em jogos de mundo aberto — seja no segundo monitor do PC ou direto no celular.

Em vez de carregar imagens estáticas pesadas ou interfaces poluídas, o motor do projeto trabalha com **pirâmides de tiles sob demanda (`EPSG:3857`)**, clustering otimizado para milhares de marcadores simultâneos, camadas dinâmicas em tempo real (como **Dia / Noite**) e progresso salvo localmente com exportação e importação.

<!-- Dica: salve 1 print do Hub e 1 do mapa de Leonida em docs/screenshots/ e descomente abaixo -->
<!--
<div align="center">
  <img src="docs/screenshots/hub-preview.png" alt="Nexus Maps Hub" width="49%" />
  <img src="docs/screenshots/leonida-preview.png" alt="Mapa de Leonida - GTA VI" width="49%" />
</div>
-->

---

## Principais Recursos

* **Motor de Mapas de Alta Performance:** renderização fluida com tiles sob demanda, polígonos de regiões em GeoJSON e clustering com `chunkedLoading` capaz de lidar com mais de 5.000 pins sem travar o zoom.
* **Camadas em Tempo Real:** alternância instantânea entre variações visuais do mapa (ex.: camadas **Dia** e **Noite** em *GTA VI*).
* **Ferramentas de Exploração 100%:** busca rápida (`Ctrl + K`), filtros por categoria, Modo Guia 100%, notas personalizadas, traçado de rotas e controle de progresso individual por jogo (com backup via JSON).
* **Hub com Estética Neon Glassmorphism:** busca por jogo, estúdio ou gênero, filtros de status (*Em progresso*, *Concluídos*, *Não iniciados*) e destaque dinâmico por jogo.
* **Multi-idioma (i18n):** interface e categorias traduzidas em **Português (`pt-BR`)**, **Inglês (`en-US`)** e **Espanhol (`es-ES`)**.
* **Mobile & PWA Instalável:** layout adaptado para Android/iOS com suporte a instalação como aplicativo em janela própria.

---

## Catálogo Atual

| Jogo | Mapas Disponíveis | Destaques |
| :--- | :--- | :--- |
| **Grand Theft Auto VI** | Estado de Leonida | Camadas Dia/Noite, regiões GeoJSON e +2.400 pins |
| **Cyberpunk 2077** | Night City | +2.700 pins, serviços, cyberpsicopatas e regiões |
| **Elden Ring** | Terras Intermédias & Reino das Sombras | +7.500 pins com clustering otimizado |
| **The Witcher 3: Wild Hunt** | Velen & Novigrad, Skellige, Toussaint | Multi-mapa integrado com progresso unificado |
| **Hollow Knight** | Hallownest | +970 pins e 43 áreas mapeadas |

---

## Stack Tecnológica

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Mapas & Geodados:** Leaflet (`EPSG:3857`), GeoJSON, Marker Clustering
* **Deploy & Offline:** Vercel + `vite-plugin-pwa`
* **Pipeline de Dados:** Scripts automatizados em TypeScript (`tsx`) para padronização de manifestos, marcadores e regiões

---

## Rodando Localmente

### Pré-requisitos
* Node.js 18+
* npm

### Instalação e Execução

```bash
# 1. Clone o repositório
git clone [https://github.com/SEU-USUARIO/nexus-maps.git](https://github.com/SEU-USUARIO/nexus-maps.git)
cd nexus-maps

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
