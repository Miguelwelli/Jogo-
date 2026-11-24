# NEXUS — UI de Roblox Studio (Luau)

Port do mockup `figma/nexus-ui.figma.js` para **Roblox Studio**, em **um único arquivo**:
[`nexus-ui.luau`](./nexus-ui.luau).

Ele monta `StarterGui.NexusGui` com o **HUD do duelo** e a **Loja de Operadores**, em UI nativa
editável (Frame/TextLabel/ImageLabel/UICorner/UIStroke — nada achatado em imagem).

## Como usar

1. Abra o Roblox Studio e o **Viewport** do seu jogo.
2. Instale `nexus-ui.luau` como **Script** em `ServerScriptService` (ou cole no Command Bar para
   só visualizar, sem salvar).
3. Rode com **Play** (F5). A loja já abre visível; o HUD fica por baixo.

O script é autossuficiente: não precisa de módulos, pacotes nem upload manual. Ao rodar de novo,
a versão anterior é destruída antes de recriar.

### Textura dos studs

Os painéis usam a textura de studs em `roblox-assets/stud_tile.png` (256×256, gerada por
`scripts/bake-stud-tile.mjs`). O script referencia um asset ID já publicado:

```lua
ASSET_ID = "",  -- vazio = usa o fallback abaixo
```

Se você quiser usar **sua própria** textura, suba o PNG em **Asset Manager → Images** e cole o ID
em `CONFIG.ASSET_ID`. Sem imagem carregada o Roblox mostra um quadriculado; o layout continua
correto (só perde o relevo dos studs).

### Imagens de personagem

Renders de personagem **não** vão embutidos — o Roblox exige upload. Os cards e o hero usam um
**avatar vetorial** feito de Frames (camadas editáveis no Explorer). Para trocar por um render:

```lua
IMAGE_OVERRIDES = {
  hero = "rbxassetid://SEU_ID",
  card1 = "rbxassetid://...",
  card2 = "rbxassetid://...",
  card3 = "rbxassetid://...",
}
```

## Personalização

Tudo o que é texto está em `CONFIG.copy`, em pt-BR:

| chave | onde aparece |
| --- | --- |
| `brandA` / `brandB` | marca no canto superior esquerdo (NEXUS **WZ**) |
| `mode` | subtítulo da marca (TREINO LOW-POLY) |
| `round` / `score` / `timer` | pílula central do duelo (ROUND 3 · VOCÊ 2 × 1 BOT · 01:24) |
| `level` / `player` / `xp` | perfil no canto superior direito |
| `life` / `armor` / `weapon` / `ammo` / `ammoReserve` / `fireMode` | HUD inferior |
| `hint` | dica de teclas no rodapé |
| `sideActions` | os 4 botões da borda direita |
| `shopTitle` / `shopSub` / `coin` / `close` | cabeçalho dourado da loja |
| `heroChip` / `heroTitle` / `heroBullets` / `heroPrice` | faixa de destaque |
| `cards` | os 3 cards (tag, título, sub, preço, cor, acento) |
| `footer` / `buy` | rodapé e o texto COMPRAR |

Cores em `PALETTE` (`P`): dourado `#FFD34D`, slate `#090D16` / `#101E3A`, esmeralda `#10B981`,
ciano `#3CB9F2`, vermelho `#F24848`.

## Compras (Dev Products)

Cada `PriceButton` é um `Frame` com um filho `TextButton` invisível chamado `Hit` (área de clique).
O `LocalScript` embutido chama `MarketplaceService:PromptProductPurchase` usando o atributo
`ProductId` do botão:

```lua
buyRoot:SetAttribute("ProductId", 0)  -- 0 = DRY_RUN, só loga no output
```

Troque `0` pelo ID do seu **Developer Product** (não é Game Pass) e a compra passa a valer.
Com `ProductId = 0` o script avisa no Output e não abre a loja do Roblox.

## Abrir / fechar

`NexusGui.Toggle` é um `BindableEvent`. De qualquer script:

```lua
game.StarterGui.NexusGui.Toggle:Fire()
```

Na loja, o `X` vermelho e o clique fora do painel (`Scrim`) fecham. O `LocalScript` cuida de:

- **fit-to-screen**: `UIScale` = `min(viewport.Y/1080, viewport.X/1920)`, reajustado no resize;
- **hover** dos 4 botões de preço: escala 1.06 (`TweenService`, `Back/Out`);
- **press**: a face afunda 4 px;
- **clique no scrim / X**: fecha a loja.

## Estrutura do arquivo

```
CONFIG            -- GUI_NAME, ASSET_ID, IMAGE_OVERRIDES, copy (pt-BR)
PALETTE (P)       -- cores do mockup
helpers           -- block, bevel, sheen, diamond, bar, avatar, imageSlot, text, stroke, corner
buildHud(gui)     -- marca, duelo, perfil, vida/armadura, munição, hint, ações laterais
buildShop(gui)    -- painel, header, hero, 3 cards, rodapé, scrim
NexusController   -- LocalScript embutido (fit, toggle, hover, compra)
```

## Verificação

Os dois harnesses rodam fora do Studio (wasmoon + stub da API Roblox):

```bash
npm install --no-save wasmoon @napi-rs/canvas

node scripts/test-luau.mjs                  # valida a árvore criada
node scripts/preview-roblox-ui.mjs          # gera preview/nexus-roblox.png
```

Resultado atual: **561 descendentes**, 0 propriedades inválidas, 0 frames sem `Size`,
0 cores inválidas. Preview em [`../preview/nexus-roblox.png`](../preview/nexus-roblox.png).

## Limitações conhecidas do Roblox

- **Não existe blend Overlay** em UI. O brilho dos studs é simulado com textura branca em
  `ImageTransparency` (não dá para escurecer o que está embaixo).
- `UIGradient.Transparency` não esmaece `ImageLabel` com `ScaleType.Tile` — por isso cada painel
  recebe sua própria `ImageTransparency`.
- `ClipsDescendants` não recorta filhos rotacionados; onde isso importa (sheen) uso `CanvasGroup`.
- Textos longos não têm `TextScaled`; se você trocar o copy por algo muito maior, aumente a caixa.
