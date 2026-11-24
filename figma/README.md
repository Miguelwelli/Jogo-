# Mockup: HUD do duelo + Loja de Operadores (NEXUS / WZ)

Feito com a skill [`ui-figma-roblox`](../.skills/ui-figma-roblox/SKILL.md).

![preview](../preview/nexus-shop-hud.png)

## Arquivo único

**`nexus-ui.figma.js`** — 93 KB, autossuficiente. Rode esse script inteiro no Figma (`use_figma`):

- cria (ou reconstrói) um frame `NEXUS/WZ — HUD + LOJA` com três camadas: fundo travado,
  `01 · HUD de gameplay` e `02 · Loja de Operadores`;
- **não precisa de upload nem de colar hash**: a textura de stud (512×256, tile sem emenda) e o
  render de operador (320×320) vão embutidos em base64 e são criados com `figma.createImage`;
- tudo é editável depois: cada bloco é um `rectangle`/`text`/`vector` nomeado
  (`loja/header/face`, `card-2-OPERADOR TÁTICO/titulo`, …). Nada achatado.

Configuração no topo do arquivo:

| Campo | Para quê |
| --- | --- |
| `CFG.frameId` | `null` cria frame novo · `'2:2'` reconstrói um frame existente |
| `CFG.size` | tamanho final; o layout é desenhado em 1920×1080 e reescalado junto |
| `CFG.show` | liga/desliga `hud` e `shop` (ex.: só HUD) |
| `CFG.copy` | todos os textos, preços, títulos e cores por cartão (pt-BR) |
| `ART` | troca a textura/render; qualquer PNG em base64 funciona |

## Fonte (não editar o gerado à mão)

| Arquivo | O que é |
| --- | --- |
| `src/nexus-ui.template.js` | o script, com `__STUD_B64__` / `__RENDER_B64__` |
| `../scripts/build-single-script.mjs` | injeta a arte e escreve `nexus-ui.figma.js` |
| `../scripts/test-figma-script.mjs` | roda o script contra um stub da API do Figma (valida PNG, cores, textos vazios) |
| `../scripts/render-mockup.mjs` | rasteriza o script em PNG sem abrir o Figma (`@napi-rs/canvas`) |

```bash
node scripts/build-single-script.mjs      # regenera o script único
node scripts/test-figma-script.mjs        # 196 nós, 0 erros
node scripts/render-mockup.mjs preview/nexus-shop-hud.png
```

## O que está no layout

**HUD** (`01 · HUD de gameplay`): marca NEXUS WZ + modo · placar do duelo
(`ROUND 3 · VOCÊ 2 × 1 BOT · 01:24`) · perfil com nível e barra de XP · vida 82/100 + armadura ·
munição 30/120 AUTO · dica de teclas · ações laterais LOJA / OPERADOR / TREINO / AJUSTES.

**Loja** (`02 · Loja de Operadores`, painel 1120×800): header dourado com título, subtítulo e moeda
com botão de recarga · fechar vermelho · pacote destaque com render, halo, bullets e CTA verde ·
3 cartões (COMUM/RARO/ÉPICO) com faixa de cor no topo, tag, título, subtítulo e barra de preço ·
anel de foco dourado no cartão do meio · rodapé avisando que operador é só visual.

## Receita de camadas (da skill)

- **Profundidade:** face + cópia deslocada 6–12 px, preenchida a ×0.62 (×0.45 nos botões).
- **Contorno:** 3–4 px *Outside* em `#090D16` em todos os blocos.
- **Studs:** PNG tile com `scalingFactor 0.375` (24 px), blend `OVERLAY`, opacidade 0.2–0.5;
  no fundo, `scalingFactor 2.2` a 16 %.
- **Bevel:** rim interno claro 3 px + lábio inferior escuro (~20 % da altura) + linha clara de 2 px.
- **Sheen:** faixas diagonais brancas a 8–10 % num frame com `clipsContent`, sempre atrás do texto.
- **Translucidez:** opacidade no nó (não cor com alfa) para a profundidade continuar funcionando.

## Paleta

`#090D16` página · `#101E3A` painel · `#FFD34D`/`#FFE78D` dourado · `#B45309` profundidade dourada ·
`#10B981`/`#065F46` verde de compra · `#3CB9F2`/`#70DEEC` ciano · `#F24848` fechar ·
`#E7EFFA` texto · `#AEBBD3` texto fraco — igual ao `index.html` / `customizador.html`.

## Notas

- O render embutido é do catálogo UI Resources (Noob Run). Direitos do criador original: serve para
  mockup, não como asset de produção. Ver `.skills/ui-figma-roblox/ATTRIBUTION.md`.
- Não existe moeda no jogo hoje; `1.250` é placeholder. Se a economia for Robux, troque o losango
  pelo ícone `assets/ui-resources/files/Icons/75-download_url2-RobuxIcon.svg` da skill.
- Se `figma.createImage` não existir no seu ambiente, o script avisa no console e monta o layout
  sem textura/render (o resto continua intacto).
