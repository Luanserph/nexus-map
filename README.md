<div align="center">

<img src="docs/banner-hero.png" alt="Nexus Maps — Interactive Open-World Cartography" width="100%" />

<br />
<br />

[![Acessar Web App](https://img.shields.io/badge/🌐_Acessar_Web_App-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://nexus-map-zeta.vercel.app)
[![Download Windows](https://img.shields.io/badge/⬇️_Download_Windows-Tauri_v2_(.exe)-06B6D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/Luanserph/nexus-map/releases/latest)
[![Versão](https://img.shields.io/badge/Release-v2.3.1-8B5CF6?style=for-the-badge)](https://github.com/Luanserph/nexus-map/releases/tag/v2.3.1)
[![Build Windows](https://img.shields.io/github/actions/workflow/status/Luanserph/nexus-map/release.yml?style=for-the-badge&label=Build_Windows&logo=githubactions&logoColor=white)](https://github.com/Luanserph/nexus-map/actions/workflows/release.yml)
[![Licença](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)](LICENSE)

<br />

**Central de cartografia interativa de alta performance para jogos de mundo aberto.**  
**69 jogos** • **152 mapas/camadas** • **168.644 marcadores** • Web (PWA) &amp; App Desktop Nativo para Windows (~12 MB)

</div>

---

## ✨ Por que o Nexus Maps?

O **Nexus Maps** foi criado para oferecer um único lugar rápido, limpo e sem distrações para acompanhar exploração **100%** em jogos de mundo aberto — seja no segundo monitor do PC, sobreposto ao jogo com atalho global, ou instalado no celular como PWA.

> [!TIP]
> **Modo Overlay no Windows:** no App Desktop (`Tauri v2`), pressione **`Alt + M`** a qualquer momento durante a gameplay para chamar ou ocultar o mapa instantaneamente, e use o botão **Fixar no Topo (Pin)** para mantê-lo sobreposto ao jogo. O instalador `.exe` está disponível na aba [**Releases**](https://github.com/Luanserph/nexus-map/releases/latest), compilado automaticamente via **GitHub Actions**.

---

## 🆕 Novidades da v2.3.0

- **Hub reorganizado:** header `sticky` minimalista em 1 linha, filtros de status horizontais e seletor de gêneros em dropdown padronizado (com busca e acentuação unificada).
- **Navegação multi-mapa aprimorada:** barra flutuante com botões laterais (`<` e `>`) quando há overflow, gradiente sutil nas bordas, rolagem horizontal direta com a rodinha do mouse (sem precisar de `Shift`) e centralização automática do mapa selecionado.
- **Indicador `Offline-First` ativo:** bolinha de status em tempo real (**esmeralda** online / **âmbar** offline via `navigator.onLine`), tooltip explicando o salvamento local sem necessidade de conta e clique abrindo o modal de **Exportar / Importar Backup (`.json`)**.
- **Versão dinâmica sincronizada:** selo do Atlas Interativo alimentado automaticamente pelo `package.json` (`__APP_VERSION__`).
- **Abertura instantânea e confiável:** inicialização do Leaflet condicionada a dimensões válidas via `ResizeObserver` + `invalidateSize()`, cancelamento limpo via `AbortController` e recuperação automática de chunks PWA (`vite:preloadError`).
- **Desktop Windows automatizado (Tauri v2):** build e publicação automática do instalador `.exe` na aba [**Releases**](https://github.com/Luanserph/nexus-map/releases/latest) via GitHub Actions.
- **Nova leva de jogos no catálogo:** *Tainted Grail: The Fall of Avalon*, *Borderlands 4*, *Hollow Knight: Silksong*, *Silent Hill f*, *Dying Light: The Beast* e *Baby Steps*, além de novos ícones semânticos por categoria.

---

## 🎮 Vitrine do Catálogo (69 Jogos • 152 Mapas • 168.644 Pins)

> Organizado em ordem alfabética com contagem real de mapas/camadas e pins extraída de `src/data/games/`.

<table>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/007-first-light/cover.webp" width="160" alt="007 First Light" /><br />
      <b>007 First Light</b><br /><sub>8 mapas • 1.983 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/assassins-creed-black-flag-resynced/cover.webp" width="160" alt="Assassin's Creed: Black Flag Resynced" /><br />
      <b>Assassin's Creed: Black Flag Resynced</b><br /><sub>1 mapa • 1.526 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/baby-steps/cover.webp" width="160" alt="Baby Steps" /><br />
      <b>Baby Steps</b><br /><sub>1 mapa • 215 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/beast-of-reincarnation/cover.webp" width="160" alt="Beast of Reincarnation" /><br />
      <b>Beast of Reincarnation</b><br /><sub>12 mapas • 1.273 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/big-walk/cover.webp" width="160" alt="Big Walk" /><br />
      <b>Big Walk</b><br /><sub>1 mapa • 230 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/borderlands-4/cover.webp" width="160" alt="Borderlands 4" /><br />
      <b>Borderlands 4</b><br /><sub>3 mapas • 2.315 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/call-of-duty-modern-warfare-4/cover.webp" width="160" alt="Call of Duty: Modern Warfare 4" /><br />
      <b>Call of Duty: Modern Warfare 4</b><br /><sub>2 mapas • 393 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/call-of-duty-vanguard/cover.webp" width="160" alt="Call of Duty: Vanguard" /><br />
      <b>Call of Duty: Vanguard</b><br /><sub>4 mapas • 507 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/castlevania-belmonts-curse/cover.webp" width="160" alt="Castlevania: Belmont's Curse" /><br />
      <b>Castlevania: Belmont's Curse</b><br /><sub>1 mapa • 1.339 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/clair-obscur-expedition-33/cover.webp" width="160" alt="Clair Obscur: Expedition 33" /><br />
      <b>Clair Obscur: Expedition 33</b><br /><sub>1 mapa • 2.815 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/control-resonant/cover.webp" width="160" alt="Control Resonant" /><br />
      <b>Control Resonant</b><br /><sub>1 mapa • 2.121 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/crimson-desert/cover.webp" width="160" alt="Crimson Desert" /><br />
      <b>Crimson Desert</b><br /><sub>1 mapa • 15.572 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/croc-legend-of-gobbos/cover.webp" width="160" alt="Croc: Legend of the Gobbos" /><br />
      <b>Croc: Legend of the Gobbos</b><br /><sub>5 mapas • 2.322 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/cyberpunk-2077/cover.webp" width="160" alt="Cyberpunk 2077" /><br />
      <b>Cyberpunk 2077</b><br /><sub>1 mapa • 2.754 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/death-stranding-2/cover.webp" width="160" alt="Death Stranding 2: On the Beach" /><br />
      <b>Death Stranding 2: On the Beach</b><br /><sub>2 mapas • 336 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/dragon-quest-vii-reimagined/cover.webp" width="160" alt="Dragon Quest VII Reimagined" /><br />
      <b>Dragon Quest VII Reimagined</b><br /><sub>2 mapas • 3.656 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/dune-awakening/cover.webp" width="160" alt="Dune: Awakening" /><br />
      <b>Dune: Awakening</b><br /><sub>1 mapa • 980 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/dying-light-the-beast/cover.webp" width="160" alt="Dying Light: The Beast" /><br />
      <b>Dying Light: The Beast</b><br /><sub>1 mapa • 422 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/elden-ring/cover.webp" width="160" alt="Elden Ring" /><br />
      <b>Elden Ring</b><br /><sub>2 mapas • 7.578 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/elden-ring-nightreign/cover.webp" width="160" alt="Elden Ring Nightreign" /><br />
      <b>Elden Ring Nightreign</b><br /><sub>1 mapa • 230 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/escape-from-tarkov/cover.webp" width="160" alt="Escape from Tarkov" /><br />
      <b>Escape from Tarkov</b><br /><sub>5 mapas • 4.306 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/final-fantasy-resonance/cover.webp" width="160" alt="Final Fantasy Resonance" /><br />
      <b>Final Fantasy Resonance</b><br /><sub>1 mapa • 1.317 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/final-fantasy-vii-rebirth/cover.webp" width="160" alt="Final Fantasy VII Rebirth" /><br />
      <b>Final Fantasy VII Rebirth</b><br /><sub>1 mapa • 1.949 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/final-fantasy-xvi/cover.webp" width="160" alt="Final Fantasy XVI" /><br />
      <b>Final Fantasy XVI</b><br /><sub>1 mapa • 943 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/forza-horizon-6/cover.webp" width="160" alt="Forza Horizon 6" /><br />
      <b>Forza Horizon 6</b><br /><sub>1 mapa • 806 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/goat-simulator-3/cover.webp" width="160" alt="Goat Simulator 3" /><br />
      <b>Goat Simulator 3</b><br /><sub>4 mapas • 1.876 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/gothic-1-remake/cover.webp" width="160" alt="Gothic 1 Remake" /><br />
      <b>Gothic 1 Remake</b><br /><sub>1 mapa • 1.714 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/gta-vi/cover.webp" width="160" alt="Grand Theft Auto VI" /><br />
      <b>Grand Theft Auto VI</b><br /><sub>1 mapa • 2.690 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/grounded-2/cover.webp" width="160" alt="Grounded 2" /><br />
      <b>Grounded 2</b><br /><sub>1 mapa • 11.899 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/hollow-knight/cover.webp" width="160" alt="Hollow Knight" /><br />
      <b>Hollow Knight</b><br /><sub>1 mapa • 979 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/hollow-knight-silksong/cover.webp" width="160" alt="Hollow Knight: Silksong" /><br />
      <b>Hollow Knight: Silksong</b><br /><sub>1 mapa • 1.939 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/kingdom-hearts-3/cover.webp" width="160" alt="Kingdom Hearts III" /><br />
      <b>Kingdom Hearts III</b><br /><sub>10 mapas • 822 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/marathon/cover.webp" width="160" alt="Marathon" /><br />
      <b>Marathon</b><br /><sub>4 mapas • 530 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/metal-gear-solid-5-the-phantom-pain/cover.webp" width="160" alt="Metal Gear Solid V: The Phantom Pain" /><br />
      <b>Metal Gear Solid V: The Phantom Pain</b><br /><sub>2 mapas • 488 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/metal-gear-solid-peace-walker/cover.webp" width="160" alt="Metal Gear Solid: Peace Walker" /><br />
      <b>Metal Gear Solid: Peace Walker</b><br /><sub>1 mapa • 659 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/mina-the-hollower/cover.webp" width="160" alt="Mina the Hollower" /><br />
      <b>Mina the Hollower</b><br /><sub>1 mapa • 1.584 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/minecraft-dungeons-ii/cover.webp" width="160" alt="Minecraft Dungeons II" /><br />
      <b>Minecraft Dungeons II</b><br /><sub>1 mapa • 2.223 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/mortal-shell-ii/cover.webp" width="160" alt="Mortal Shell II" /><br />
      <b>Mortal Shell II</b><br /><sub>1 mapa • 1.724 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/onimusha-way-of-the-sword/cover.webp" width="160" alt="Onimusha: Way of the Sword" /><br />
      <b>Onimusha: Way of the Sword</b><br /><sub>9 mapas • 2.205 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/phantom-blade-zero/cover.webp" width="160" alt="Phantom Blade Zero" /><br />
      <b>Phantom Blade Zero</b><br /><sub>8 mapas • 2.680 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/pokemon-pokopia/cover.webp" width="160" alt="Pokémon Pokopia" /><br />
      <b>Pokémon Pokopia</b><br /><sub>1 mapa • 2.531 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/resident-evil-requiem/cover.webp" width="160" alt="Resident Evil Requiem" /><br />
      <b>Resident Evil Requiem</b><br /><sub>1 mapa • 1.145 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/runescape-dragonwilds/cover.webp" width="160" alt="RuneScape: Dragonwilds" /><br />
      <b>RuneScape: Dragonwilds</b><br /><sub>1 mapa • 6.092 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/schedule-1/cover.webp" width="160" alt="Schedule I" /><br />
      <b>Schedule I</b><br /><sub>1 mapa • 226 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/silent-hill-f/cover.webp" width="160" alt="Silent Hill f" /><br />
      <b>Silent Hill f</b><br /><sub>1 mapa • 1.057 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/silent-hill-townfall/cover.webp" width="160" alt="Silent Hill: Townfall" /><br />
      <b>Silent Hill: Townfall</b><br /><sub>1 mapa • 844 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/slime-rancher-2/cover.webp" width="160" alt="Slime Rancher 2" /><br />
      <b>Slime Rancher 2</b><br /><sub>1 mapa • 285 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/starrupture/cover.webp" width="160" alt="StarRupture" /><br />
      <b>StarRupture</b><br /><sub>1 mapa • 2.436 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/subnautica-2/cover.webp" width="160" alt="Subnautica 2" /><br />
      <b>Subnautica 2</b><br /><sub>1 mapa • 8.047 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/tainted-grail-the-fall-of-avalon/cover.webp" width="160" alt="Tainted Grail: The Fall of Avalon" /><br />
      <b>Tainted Grail: The Fall of Avalon</b><br /><sub>3 mapas • 3.809 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/the-adventures-of-elliot/cover.webp" width="160" alt="The Adventures of Elliot: The Millennium Tales" /><br />
      <b>The Adventures of Elliot: The Millennium Tales</b><br /><sub>4 mapas • 2.303 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/the-blood-of-dawnwalker/cover.webp" width="160" alt="The Blood of Dawnwalker" /><br />
      <b>The Blood of Dawnwalker</b><br /><sub>1 mapa • 719 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/oblivion-remastered/cover.webp" width="160" alt="The Elder Scrolls IV: Oblivion Remastered" /><br />
      <b>The Elder Scrolls IV: Oblivion Remastered</b><br /><sub>2 mapas • 1.703 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/the-legend-of-zelda/cover.webp" width="160" alt="The Legend of Zelda" /><br />
      <b>The Legend of Zelda</b><br /><sub>2 mapas • 545 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-a-link-between-worlds/cover.webp" width="160" alt="The Legend of Zelda: A Link Between Worlds" /><br />
      <b>The Legend of Zelda: A Link Between Worlds</b><br /><sub>1 mapa • 332 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/zelda-a-link-to-the-past/cover.webp" width="160" alt="The Legend of Zelda: A Link to the Past" /><br />
      <b>The Legend of Zelda: A Link to the Past</b><br /><sub>1 mapa • 815 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-breath-of-the-wild/cover.webp" width="160" alt="The Legend of Zelda: Breath of the Wild" /><br />
      <b>The Legend of Zelda: Breath of the Wild</b><br /><sub>1 mapa • 16.504 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-echoes-of-wisdom/cover.webp" width="160" alt="The Legend of Zelda: Echoes of Wisdom" /><br />
      <b>The Legend of Zelda: Echoes of Wisdom</b><br /><sub>1 mapa • 696 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-links-awakening/cover.webp" width="160" alt="The Legend of Zelda: Link's Awakening" /><br />
      <b>The Legend of Zelda: Link's Awakening</b><br /><sub>1 mapa • 409 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-ocarina-of-time/cover.webp" width="160" alt="The Legend of Zelda: Ocarina of Time" /><br />
      <b>The Legend of Zelda: Ocarina of Time</b><br /><sub>2 mapas • 3.218 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/zelda-tears-of-the-kingdom/cover.webp" width="160" alt="The Legend of Zelda: Tears of the Kingdom" /><br />
      <b>The Legend of Zelda: Tears of the Kingdom</b><br /><sub>1 mapa • 7.956 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-wind-waker/cover.webp" width="160" alt="The Legend of Zelda: The Wind Waker" /><br />
      <b>The Legend of Zelda: The Wind Waker</b><br /><sub>1 mapa • 1.232 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/the-witcher-3-wild-hunt/cover.webp" width="160" alt="The Witcher 3: Wild Hunt" /><br />
      <b>The Witcher 3: Wild Hunt</b><br /><sub>6 mapas • 3.000 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/titan-quest-2/cover.webp" width="160" alt="Titan Quest II" /><br />
      <b>Titan Quest II</b><br /><sub>3 mapas • 1.311 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/ghost-recon-wildlands/cover.webp" width="160" alt="Tom Clancy's Ghost Recon Wildlands" /><br />
      <b>Tom Clancy's Ghost Recon Wildlands</b><br /><sub>2 mapas • 2.528 pins</sub>
    </td>
  </tr>
  <tr>
    <td align="center" width="20%">
      <img src="public/games/world-of-warcraft-forever/cover.webp" width="160" alt="World of Warcraft: Forever" /><br />
      <b>World of Warcraft: Forever</b><br /><sub>1 mapa • 6.054 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/yakuza-0/cover.webp" width="160" alt="Yakuza 0 Director's Cut" /><br />
      <b>Yakuza 0 Director's Cut</b><br /><sub>2 mapas • 433 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/yakuza-kiwami/cover.webp" width="160" alt="Yakuza Kiwami" /><br />
      <b>Yakuza Kiwami</b><br /><sub>1 mapa • 256 pins</sub>
    </td>
    <td align="center" width="20%">
      <img src="public/games/zelda-2-adventure-of-link/cover.webp" width="160" alt="Zelda II: The Adventure of Link" /><br />
      <b>Zelda II: The Adventure of Link</b><br /><sub>1 mapa • 258 pins</sub>
    </td>
    <td align="center" width="20%"></td>
  </tr>
</table>

---

## ⚡ Recursos Principais

| Recurso | Descrição |
| :--- | :--- |
| 🗺️ **Motor `EPSG:3857` sob Demanda** | Pirâmides de tiles externas, polígonos de regiões em GeoJSON, `ResizeObserver` + `invalidateSize()` e **lazy-load por jogo** (bundle inicial leve, sem travar o navegador). |
| 🎯 **Ícones Semânticos em Cache** | Pins categorizados automaticamente (baús, chefes, shrines, NPCs, missões, extrações, colecionáveis) reutilizados em cache `L.divIcon` para manter 60 FPS mesmo com +16.000 pins. |
| 🧭 **Navegação Multi-Mapa Fluida** | Barra de camadas com botões laterais `<` / `>`, gradiente de overflow, rolagem horizontal com a rodinha do mouse (sem `Shift`) e centralização automática do mapa ativo. |
| 🌗 **Camadas em Tempo Real** | Alternância instantânea de estilos visuais no mesmo mapa (como **Dia / Noite** em *GTA VI* e **Superfície / Subterrâneo** em *Elden Ring*). |
| 💾 **Offline-First & Backup Local** | Progresso, notas, prints e rotas salvos localmente em IndexedDB (`Dexie.js`), com indicador de conexão online/offline em tempo real e exportação/importação `.json` sem necessidade de conta. |
| 🖥️ **App Desktop Nativo (Tauri v2)** | Executável leve (~12 MB) para Windows compilado via GitHub Actions, com atalho global **`Alt + M`**, modo **Sempre no Topo** e salvamento nativo em `%APPDATA%\com.nexusmaps.desktop\progress.json`. |
| 📱 **Mobile & PWA Instalável** | Interface responsiva para Android/iOS com instalação em janela própria e recuperação automática de atualizações do Service Worker. |
| 🌍 **Multi-idioma (i18n)** | Suporte completo para **Português (`pt-BR`)**, **Inglês (`en-US`)** e **Espanhol (`es-ES`)**. |

---

## 🛠️ Stack Tecnológica

<div align="center">

![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=flat-square&logo=tailwind-css&logoColor=38BDF8)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=flat-square&logo=leaflet&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri_v2-FFC131?style=flat-square&logo=tauri&logoColor=black)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat-square&logo=rust&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=flat-square&logo=pwa&logoColor=white)

</div>

---

<details>
<summary><b>🚀 Como rodar localmente (Web &amp; Desktop Tauri v2)</b></summary>

<br />

### Pré-requisitos
* **Node.js 18+** e **npm**
* *(Apenas para compilar o App Desktop)* **Rust + Cargo** e **Visual Studio C++ Build Tools**

```bash
# 1. Clone o repositório
git clone https://github.com/Luanserph/nexus-map.git
cd nexus-map

# 2. Instale as dependências
npm install

# 3. Rode a versão Web em desenvolvimento
npm run dev

# 4. Rode a versão Desktop (Tauri v2)
npm run tauri:dev

# 5. Gere o instalador Windows (.exe / .msi)
npm run tauri:build
```

</details>

---

## 🧭 Roadmap

- [x] Motor de mapas `EPSG:3857` com clustering (`chunkedLoading`), polígonos GeoJSON e `ResizeObserver`
- [x] Persistência offline-first (IndexedDB / Dexie.js) com indicador de status online/offline e backup `.json`
- [x] Hub reorganizado (header sticky em 1 linha, filtros horizontais e dropdown de gêneros padronizado)
- [x] Barra multi-mapa com setas laterais, rolagem horizontal via mouse wheel e centralização automática
- [x] Layout responsivo para Mobile e PWA instalável com recuperação automática de chunks
- [x] Ícones semânticos em cache por categoria na sidebar e nos pins do mapa
- [x] **App Desktop nativo para Windows (Tauri v2)** com atalho global `Alt + M`, *Sempre no Topo*, persistência em `%APPDATA%\progress.json` e build automático via GitHub Actions
- [ ] Expansão contínua do catálogo ([veja como adicionar novos jogos](./docs/ADDING_GAMES.md))
- [ ] Sincronização em nuvem opcional entre Desktop e Mobile

---

## 🧩 Adicionando Novos Jogos

O catálogo é 100% orientado a manifesto (`src/data/games/<slug>/manifest.json`). Para adicionar novos jogos usando o pipeline automatizado, consulte [**`docs/ADDING_GAMES.md`**](./docs/ADDING_GAMES.md).

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulte [LICENSE](./LICENSE) para mais detalhes.
