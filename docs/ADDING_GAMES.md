# Guia de Expansão — Adicionando Novos Jogos ao Nexus Maps

O catálogo do **Nexus Maps** é 100% orientado a manifesto (`src/data/games/<slug>/manifest.json`), com auto-descoberta e lazy-load automático via `src/data/games/index.ts`. Não é necessário alterar componentes globais para suportar um novo jogo.

---

## Fluxo Passo a Passo

### 1. Adicionar o alvo em `scripts/import-markers/maps-targets.json`

Adicione uma nova entrada no array JSON especificando `gameSlug`, `mapSlug`, `name`, `dlc` (`"base"` ou slug da expansão) e a `url` de origem:

```json
{
  "gameSlug": "meu-novo-jogo",
  "mapSlug": "mapa-principal",
  "name": "Nome do Mapa",
  "dlc": "base",
  "url": "https://mapgenie.io/meu-novo-jogo/maps/mapa-principal"
}
```

> **Dica:** para jogos com múltiplos mapas ou DLCs, adicione um objeto por mapa compartilhando o mesmo `gameSlug`.

---

### 2. Extrair e importar os dados do mapa

Execute o extrator e, em seguida, o importador em lote:

```bash
# Extrai os bundles brutos para temp/ (diretório ignorado pelo Git)
npm run extract-maps

# Converte os bundles em manifest.json, markers.json e regions.json
npm run import-map:all
```

O comando `import-map:all` irá gerar ou atualizar automaticamente:
- `src/data/games/<slug>/manifest.json` (incluindo `totalPins` pré-calculado para o Hub)
- `src/data/games/<slug>/maps/<mapSlug>/markers.json`
- `src/data/games/<slug>/maps/<mapSlug>/regions.json`

---

### 3. Salvar a capa oficial (`cover.webp`)

Salve a Key Art / capa oficial do jogo em formato `.webp` na pasta pública do jogo:

```text
public/games/<slug>/cover.webp
```

Se desejar banner e logo dedicados para destaque no Hub, você também pode adicionar `banner.webp` e `logo.webp` na mesma pasta e referenciá-los no `manifest.json`:

```json
{
  "coverImage": "/games/<slug>/cover.webp",
  "bannerImage": "/games/<slug>/banner.webp"
}
```

> **Dica de personalização:** ajuste as cores do Theme Engine (`theme.accentPrimary`, `theme.accentSecondary`, `theme.accentGlow`) no `manifest.json` para dar identidade visual própria ao jogo no Hub e no mapa.

---

### 4. Validar Build e Lint

Antes de fazer commit, rode o linter e o build de produção para garantir 0 erros de TypeScript/ESLint e confirmar que o novo jogo gerou chunks lazy-loaded separados:

```bash
npm run lint
npm run build
```

Se ambos passarem com saída `0`, o novo jogo já aparecerá automaticamente no Hub com busca, filtros, ícones semânticos por categoria e persistência de progresso!
