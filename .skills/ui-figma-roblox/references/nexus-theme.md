# NEXUS / WZ — art direction cheat sheet

Use this when the skill builds UI for **this** game. The upstream worked example is a green
Robux shop; do not copy its palette here.

## Palette (from `index.html`, `customizador.html`)

| Role | Hex | Notes |
| --- | --- | --- |
| Page / panel base | `#090D16`, `#0F172A`, `#101827` | slate-950/900; panels use `#101E3A`–`#091632` |
| Deep blue accent | `#0C1A44`, `#164678`, `#123C70` | preview stage gradient |
| Primary gold | `#FBBF24`, `#FFD34D`, `#FFDF64` | buttons, active states, eyebrows, `.section-title` bar |
| Gold shadow / press | `#B45309`, `#F8AC00` | depth layer and rim |
| Success / confirm | `#10B981`, `#34D399`, `#8EE8C0` | `.touch-btn:active`, status text |
| Info / cyan | `#22D3EE`, `#70DEEC`, `#3CB9F2` | labels, eyebrows |
| Body text | `#CBD9ED`, `#AEBBD3`, `#D8E3F3` | slate-300/400 |
| Outline | `#0009`–`#14161C` | 2–4 px outside stroke |

## Type

`ui-rounded, "SF Pro Rounded", "Trebuchet MS", system-ui, sans-serif`.
Headings: heavy weight, letter-spacing `0.04–0.2em` for uppercase eyebrows.
In Figma use a rounded display face (e.g. Fredoka One / Baloo 2) so the mockup matches the game's
feel; fall back to the system stack if the font is unavailable.

## Existing surfaces to stay consistent with

- **Training range HUD** (`index.html`): touch buttons (`scale(0.92)` on press), amber primary
  actions, emerald active state, slate panels with blur — mobile-first, one-handed layout.
- **Operator studio** (`customizador.html`): 1300 px max-width, two-column `preview | controls`,
  rounded 20 px panels, `#ffd24b` primary CTA and `#243a5b` secondary, circular palette swatches,
  3-column option grid that drops to 2 below 380 px. Its caption is explicit: the canvas is a
  reference illustration, **not** a playable 3D model.

## Stud-UI mapping for NEXUS

- Stud texture: `assets/kek-ui-essentials/kek_stud.png` (tile, scalingFactor ≈ 0.375).
- Depth: duplicate face, offset down 6–10 px, fill ×0.62 of the face colour (×0.45 on buttons).
- Primary button: gold face `#FFD34D`, depth `#B45309`, outside stroke `#14161C` 3–4 px,
  inside rim 3 px `#FFE78D`, bottom lip ≈ 20 % height.
- Currency: keep Robux assets from `assets/ui-resources/files/Icons/` out of the game's own HUD
  unless the economy is actually Robux-based; the game currently has no currency display.

## Copy

Portuguese (pt-BR), uppercase for labels, sentence case for body. Keep terms already used in the
game: *operador, treino, customizador, prévia, baixar imagem/projeto*.
