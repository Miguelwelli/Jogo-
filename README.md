# Jogo-

**NEXUS / WZ — Low-Poly Training Range** (`index.html`, `customizador.html`).

## Agent skill: `ui-figma-roblox`

Instalada em [`.skills/ui-figma-roblox/`](.skills/ui-figma-roblox/) a partir de
[grim-technologies-arch/ui-figma-roblox](https://github.com/grim-technologies-arch/ui-figma-roblox):
skill para desenhar interfaces estilo *stud* de Roblox no Figma (shops, HUD, menus, cartões de
produto, botões em camadas, texturas de stud, ícones e moedas).

- Entrada da skill: `.skills/ui-figma-roblox/SKILL.md`
- Guia de construção: `.skills/ui-figma-roblox/references/design-workflow.md`
- Biblioteca de arte: `.skills/ui-figma-roblox/references/asset-library.md`
- Direção de arte deste jogo: `.skills/ui-figma-roblox/references/nexus-theme.md`
- Espelho para Claude Code: `.claude/skills/ui-figma-roblox` → symlink para a pasta acima

O que está versionado aqui (~16 MB) e o que não está:

| Incluído | Tamanho |
| --- | --- |
| Kek UI Essentials completo (106 arquivos: stud, halftones, raios, brilhos, correntes) | 12 MB |
| UI Resources: `Textures` (stud), `Icons` (Robux), `Sounds` (cliques/abrir/fechar) | 0,6 MB |
| `MANIFEST.csv`, `catalog.json`, `LINK-ONLY-RESOURCES.csv` do catálogo completo (1.137 registros) | 1,1 MB |
| Exemplos stud-shop (renders + scripts Figma/Luau) | 2 MB |

O restante da captura UI Resources (Effects, Backgrounds, Renders, Faces, Brushes, Other; ~310 MB)
fica fora do repositório. Para baixar uma peça ou categoria sob demanda:

```bash
cd .skills/ui-figma-roblox

scripts/fetch-assets.sh --dry-run --grep sunburst          # ver o que existe no catálogo
scripts/fetch-assets.sh --grep halftone --category Effects # baixar por palavra-chave
scripts/fetch-assets.sh --file files/Effects/2-download_url-quelly2.png
scripts/fetch-assets.sh --category Backgrounds Renders     # categorias inteiras
```

O script faz clone esparso com `--filter=blob:none` (baixa só o pedido) e confere o `sha256` do
manifesto. Requer `git`, `python3` e `bash`.

Licença: o texto e os scripts da skill são MIT. A arte de terceiros **não** é MIT — ver
`.skills/ui-figma-roblox/ATTRIBUTION.md` antes de publicar ou redistribuir.
