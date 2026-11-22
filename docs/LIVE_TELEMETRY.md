# Nexus Maps — Live Telemetry WebSocket Protocol (`v1.2.0`)

O **Nexus Maps** suporta rastreamento de personagem em tempo real diretamente sobre o mapa interativo via WebSocket local (zero dependência de nuvem).

## Endpoint Padrão

```text
ws://localhost:7777
```

O endereço pode ser alterado diretamente no widget **Live Telemetry** no HUD do mapa (salvo automaticamente em `localStorage`).

## Formato do Payload JSON

Cada mensagem enviada pelo script/mod local deve ser um objeto JSON com as coordenadas no espaço do mapa ativo (`L.CRS.Simple`):

```json
{
  "game": "the-witcher-3-wild-hunt",
  "mapId": "main",
  "x": 51.88,
  "y": -40.31,
  "heading": 135
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `game` | `string` | Recomendado | Slug do jogo ativo (`manifest.json` → `slug`). Mensagens de outros jogos são ignoradas automaticamente. |
| `mapId` | `string` | Recomendado | ID da camada/mapa ativa (`manifest.json` → `maps[].id`, ex: `"main"`, `"surface"`). |
| `x` | `number` | Sim | Coordenada horizontal `X` no espaço calibrado dos tiles. |
| `y` | `number` | Sim | Coordenada vertical `Y` no espaço calibrado dos tiles. |
| `heading` | `number` | Não | Direção do personagem em graus (`0` = Norte/Cima, `90` = Leste/Direita, `180` = Sul/Baixo, `270` = Oeste/Esquerda). Padrão: `0`. |

## Exemplo de Servidor Local (Node.js)

```js
import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 7777 });

wss.on('connection', (ws) => {
  console.log('Nexus Maps conectado!');

  // Envie atualizações de telemetria a ~10-30 Hz lidas do seu mod/save/memória
  setInterval(() => {
    ws.send(
      JSON.stringify({
        game: 'the-witcher-3-wild-hunt',
        mapId: 'main',
        x: 51.88,
        y: -40.31,
        heading: 45,
      })
    );
  }, 100);
});
```

## Teste Sem Jogo Aberto (Simulação Dev)

No widget **Live Telemetry** do HUD do mapa, clique em **Simular Movimento (Dev)** para fazer o marcador direcional percorrer automaticamente uma rota de teste no mapa atual, permitindo testar o cone de visão e o modo **Seguir Câmera** sem servidor WebSocket ativo.
