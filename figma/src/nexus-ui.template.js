// ============================================================================
// NEXUS / WZ — HUD do duelo + Loja de Operadores
// Script único para `use_figma`. Sem upload, sem hash: a arte vai embutida.
// ----------------------------------------------------------------------------
// COMO USAR
//   1. Abra o arquivo no Figma e rode este script inteiro (ferramenta use_figma).
//   2. Ele cria (ou reconstrói) um frame 1920×1080 com duas camadas:
//        "01 · HUD de gameplay"  — o que fica na tela durante o treino
//        "02 · Loja de Operadores" — o modal por cima
//   3. Ajuste textos/preços/cores em C.P. Nada mais precisa ser mexido.
//
// O QUE VEM EMBUTIDO
//   • textura de stud (tile 512×256, repete sem emenda) -> preenchimento TILE + OVERLAY
//   • render de operador 320×320 com transparência -> imagem dos cartões e do destaque
//   As duas imagens são criadas com figma.createImage; se a API não estiver
//   disponível no seu ambiente, o script avisa e monta o resto sem textura.
//
// O QUE É EDITÁVEL DEPOIS DE RODAR
//   Tudo. Cada bloco é rectangle/text/vector nomeado (ex.: "loja/header/face",
//   "card-2-OPERADOR TÁTICO/titulo"). Nada é achatado, máscara ou componente.
//
// RECEITA (vem da skill ui-figma-roblox)
//   profundidade = cópia deslocada ×0.62 (×0.45 em botões) · contorno Outside 3–4px
//   stud = TILE scalingFactor 0.375, blend OVERLAY, opacidade 0.2–0.5
//   botão = rim interno claro 3px + lábio inferior escuro ~20% + linha clara 2px
//   brilho = faixas diagonais brancas 8–10% dentro de frame com clipsContent
// ============================================================================

// ---------------------------------------------------------------- CONFIG ----
const CFG = {
  frameId: null,          // null = cria um frame novo; '2:2' = reconstrói esse frame
  size: { w: 1920, h: 1080 }, // se o frame alvo for menor, tudo é reescalado junto
  show: { hud: true, shop: true }, // desligue o que não quiser gerar
  fontCandidates: [
    ['Baloo 2', 'ExtraBold'],
    ['Fredoka One', 'Regular'],
    ['Nunito', 'Black'],
    ['Inter', 'Bold'],
  ],
  copy: {
    brandA: 'NEXUS', brandB: 'WZ', mode: 'TREINO LOW-POLY',
    duelRound: 'ROUND 3', duelLeft: 'VOCÊ', duelRight: 'BOT', duelScore: '2 × 1', duelTimer: '01:24',
    life: 'VIDA', lifeValue: '82 / 100', armor: 'ARMADURA',
    weapon: 'FUZIL DE ASSALTO', ammo: '30', ammoReserve: '/ 120', fireMode: 'AUTO',
    level: '7', player: 'OPERADOR', xp: 'XP 620 / 1.000',
    hint: 'F PARA SACAR   •   Q PARA TROCAR DE ARMA   •   SHIFT PARA CORRER',
    shopTitle: 'LOJA DE OPERADORES',
    shopSub: 'ESCOLHA SEU VISUAL. AS ARMAS SÃO GRÁTIS.',
    currency: '1.250', currencyLabel: 'MOEDAS',
    heroChip: 'OFERTA LIMITADA • 24H',
    heroTitle: 'PACOTE LENDA DOURADA',
    heroBullets: ['5 OPERADORES • 3 EMBLEMAS', '4 FUNDOS DE PRÉVIA', 'ACESSO ANTECIPADO'],
    heroPrice: '1.250',
    buy: 'COMPRAR',
    cards: [
      { tag: 'COMUM', title: 'RECRUTA', sub: 'TREINO • OPERADOR', price: '900', color: '#2A3B57', accent: '#9FB4D0' },
      { tag: 'RARO', title: 'OPERADOR TÁTICO', sub: 'DUELO • OPERADOR', price: '1.450', color: '#2C7DB8', accent: '#8CD8FF' },
      { tag: 'ÉPICO', title: 'LENDA DOURADA', sub: 'EVENTO • OPERADOR', price: '2.200', color: '#B4791F', accent: '#FFE78D' },
    ],
    sideActions: [
      { label: 'LOJA', color: '#FFD34D', text: '#3D2B00' },
      { label: 'OPERADOR', color: '#2C7DB8', text: '#FFFFFF' },
      { label: 'TREINO', color: '#10B981', text: '#04291C' },
      { label: 'AJUSTES', color: '#22314C', text: '#D8E3F3' },
    ],
    footer: 'OS OPERADORES MUDAM APENAS O VISUAL. NENHUMA VANTAGEM DE COMBATE.',
  },
};

// Arte embutida (base64 → figma.createImage). Trocar aqui = trocar a arte.
const ART = {
  stud: '__STUD_B64__',
  render: '__RENDER_B64__',
};

// --------------------------------------------------------------- PALETA -----
const hex = (h) => ({
  r: parseInt(h.slice(1, 3), 16) / 255,
  g: parseInt(h.slice(3, 5), 16) / 255,
  b: parseInt(h.slice(5, 7), 16) / 255,
});
const shade = (h, k) => { const c = hex(h); return { r: c.r * k, g: c.g * k, b: c.b * k }; };
const alpha = (h, a) => ({ ...hex(h), a });
const OUT = '#090D16';
const P = {
  page: '#090D16', panel: '#101E3A', panelDeep: '#0B1730',
  gold: '#FFD34D', goldRim: '#FFE78D', goldDepth: '#B45309', goldInk: '#3D2B00',
  amber: '#FBBF24', cyan: '#3CB9F2', cyanSoft: '#70DEEC',
  emerald: '#10B981', emeraldDepth: '#065F46',
  red: '#F24848', redDepth: '#9E1F1F',
  white: '#FFFFFF', text: '#E7EFFA', muted: '#AEBBD3',
};

// ---------------------------------------------------------- BASE64 → BYTES --
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function b64ToBytes(b64) {
  const clean = b64.replace(/[^A-Za-z0-9+/=]/g, '');
  const out = new Uint8Array((clean.length * 3) >> 2);
  let p = 0; let buf = 0; let bits = 0;
  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (ch === '=') break;
    const v = B64.indexOf(ch);
    if (v < 0) continue;
    buf = (buf << 6) | v;
    bits += 6;
    if (bits >= 8) { bits -= 8; out[p] = (buf >> bits) & 0xff; p += 1; }
  }
  return out.subarray(0, p);
}

const warn = (...a) => console.log('[nexus]', ...a);
let FONT = null;

function makeImage(b64, label) {
  if (!b64) return null;
  if (!figma.createImage) { warn(`figma.createImage indisponível — ${label} será pulado`); return null; }
  try { return figma.createImage(b64ToBytes(b64)).hash; } catch (e) { warn(`falha ao criar ${label}:`, e.message); return null; }
}

// ------------------------------------------------------------- UTILITÁRIOS --
const crisp = (d, c = { r: 0, g: 0, b: 0, a: 0.85 }) => ({
  type: 'DROP_SHADOW', color: c, offset: { x: 0, y: d }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL',
});

function applyCorners(n, r) {
  if (typeof r === 'number') n.cornerRadius = r;
  else if (r && typeof r === 'object') {
    n.topLeftRadius = r.topLeft || 0; n.topRightRadius = r.topRight || 0;
    n.bottomLeftRadius = r.bottomLeft || 0; n.bottomRightRadius = r.bottomRight || 0;
  }
}

function rect(parent, name, x, y, w, h, fill, opts = {}) {
  const { r = 0, stroke = OUT, strokeW = 4 } = opts;
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.name = name; n.x = x; n.y = y; n.resize(w, h);
  applyCorners(n, r);
  if (!fill) n.fills = [];
  else if (typeof fill === 'string') n.fills = [{ type: 'SOLID', color: hex(fill) }];
  else if (Array.isArray(fill)) n.fills = fill;
  else if (fill.type) n.fills = [fill];
  else n.fills = [{ type: 'SOLID', color: fill }];
  if (stroke && strokeW) {
    n.strokes = [{ type: 'SOLID', color: typeof stroke === 'string' ? hex(stroke) : stroke }];
    n.strokeWeight = strokeW; n.strokeAlign = 'OUTSIDE';
  } else n.strokes = [];
  return n;
}

function solidGradient(stops, vertical = true) {
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: vertical ? [[0, 1, 0], [-1, 0, 0]] : [[1, 0, 0], [0, 1, 0]],
    gradientStops: stops.map(([pos, color, a = 1]) => ({
      position: pos, color: { ...(typeof color === 'string' ? hex(color) : color), a },
    })),
  };
}

// Bloco stud-UI: profundidade → face → textura → (rim/lábio ficam em bevel())
function block(parent, name, x, y, w, h, color, opts = {}) {
  const { stroke = 4, depth = 10, r = 0, studs = 0.35, fill = null, depthRatio = 0.62 } = opts;
  const isGradient = Boolean(color && color.gradientStops);
  const radius = typeof r === 'number' ? r : 0;
  if (depth) {
    const base = isGradient ? color.gradientStops[0].color : hex(color);
    const d = rect(parent, `${name}/depth`, x, y + depth, w, h, null, { r, stroke: OUT, strokeW: stroke });
    d.fills = [{ type: 'SOLID', color: { r: base.r * depthRatio, g: base.g * depthRatio, b: base.b * depthRatio } }];
  }
  rect(parent, `${name}/face`, x, y, w, h, fill || color, { r, stroke: OUT, strokeW: stroke });
  if (studs && STUD_HASH) {
    const s = figma.createRectangle();
    parent.appendChild(s);
    s.name = `${name}/studs`; s.x = x; s.y = y; s.resize(w, h); s.cornerRadius = radius;
    s.fills = [{ type: 'IMAGE', imageHash: STUD_HASH, scaleMode: 'TILE', scalingFactor: 0.375 }];
    s.blendMode = 'OVERLAY'; s.opacity = studs;
  }
  return parent;
}

// Rim interno claro + lábio inferior escuro + linha clara (efeito de botão grosso).
function bevel(parent, x, y, w, h, rim, lip, opts = {}) {
  const { r = 0, rimW = 3, lipRatio = 0.2 } = opts;
  const rimN = rect(parent, 'bevel/rim', x, y, w, h, null, { r, stroke: rim, strokeW: rimW });
  rimN.strokeAlign = 'INSIDE'; rimN.opacity = 0.9;
  const lipH = Math.max(4, Math.round(h * lipRatio));
  rect(parent, 'bevel/lip', x, y + h - lipH, w, lipH, alpha(lip, 0.35), { r: 0, stroke: null });
  rect(parent, 'bevel/lip-line', x + 6, y + h - lipH, Math.max(4, w - 12), 2, alpha('#FFFFFF', 0.25), { stroke: null });
}

// Brilho diagonal recortado; fica sempre atrás do texto de propósito.
function sheen(parent, x, y, w, h, r = 0, op = 0.1) {
  const f = figma.createFrame();
  parent.appendChild(f);
  f.name = 'sheen'; f.x = x; f.y = y; f.resize(w, h);
  f.fills = []; f.strokes = []; f.cornerRadius = r; f.clipsContent = true;
  for (let i = 0; i < 4; i += 1) {
    const s = figma.createRectangle();
    f.appendChild(s);
    s.resize(46, h * 2.2); s.x = -60 + i * 120; s.y = -h * 0.6; s.rotation = 20;
    s.fills = [{ type: 'SOLID', color: { ...hex('#FFFFFF'), a: op } }];
  }
}

function text(parent, name, chars, x, y, w, size, opts = {}) {
  const {
    align = 'CENTER', h = size * 1.6, color = P.text, strokeW = 0, shadow = 0,
    tracking = 0, vAlign = 'CENTER',
  } = opts;
  const t = figma.createText();
  parent.appendChild(t);
  t.name = name; t.fontName = FONT; t.characters = chars; t.fontSize = size;
  t.textAutoResize = 'NONE'; t.resize(w, h); t.x = x; t.y = y;
  t.textAlignHorizontal = align; t.textAlignVertical = vAlign;
  t.fills = [{ type: 'SOLID', color: hex(color) }];
  if (strokeW) { t.strokes = [{ type: 'SOLID', color: hex(OUT) }]; t.strokeWeight = strokeW; t.strokeAlign = 'OUTSIDE'; }
  if (shadow) t.effects = [crisp(shadow)];
  if (tracking) t.letterSpacing = { unit: 'PERCENT', value: tracking };
  return t;
}

function bar(parent, name, x, y, w, h, pct, color) {
  const t = rect(parent, `${name}/track`, x, y, w, h, '#0B1730', { r: 999, stroke: null });
  t.strokes = [{ type: 'SOLID', color: hex('#000000') }]; t.strokeWeight = 2; t.strokeAlign = 'INSIDE';
  rect(parent, `${name}/fill`, x, y, Math.max(6, Math.round(w * pct)), h, color, { r: 999, stroke: null });
  rect(parent, `${name}/gloss`, x + 2, y + 2, Math.max(2, Math.round(w * pct) - 4), Math.max(2, Math.round(h * 0.34)), alpha('#FFFFFF', 0.35), { r: 999, stroke: null });
}

function diamond(parent, name, x, y, size, color, strokeW = 3) {
  const v = figma.createVector();
  parent.appendChild(v);
  v.name = name;
  v.vectorPaths = [{ windingRule: 'NONZERO', data: `M 0 ${size / 2} L ${size / 2} 0 L ${size} ${size / 2} L ${size / 2} ${size} Z` }];
  v.x = x; v.y = y;
  v.fills = [{ type: 'SOLID', color: hex(color) }];
  v.strokes = [{ type: 'SOLID', color: hex(OUT) }];
  v.strokeWeight = strokeW; v.strokeAlign = 'OUTSIDE';
  return v;
}

function icon(parent, name, x, y, w, h, hash, mode = 'FIT', r = 0) {
  const n = rect(parent, name, x, y, w, h, null, { r, stroke: null });
  if (hash) n.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: mode, imageTransform: [[0, 0, 1], [0, 0, 1]] }];
  return n;
}

async function pickFont() {
  const available = await figma.listAvailableFontsAsync();
  for (const [family, style] of CFG.fontCandidates) {
    const hit = available.find((f) => f.fontName.family === family && f.fontName.style === style);
    if (hit) { await figma.loadFontAsync(hit.fontName); return hit.fontName; }
  }
  const fallback = { family: 'Inter', style: 'Regular' };
  await figma.loadFontAsync(fallback);
  return fallback;
}

let STUD_HASH = null;
let RENDER_HASH = null;

// ================================================================ HUD =======
function buildHUD(parent) {
  const C = CFG.copy;
  const hud = layer(parent, '01 · HUD de gameplay');

  block(hud, 'hud/marca', 36, 24, 300, 52, P.panelDeep, { stroke: 3, depth: 0, r: 12, studs: 0.25 });
  diamond(hud, 'hud/marca-diamante', 52, 38, 24, P.amber, 3);
  text(hud, 'hud/marca-a', C.brandA, 88, 26, 120, 24, { align: 'LEFT', color: P.white, tracking: 6 });
  text(hud, 'hud/marca-b', C.brandB, 196, 26, 60, 24, { align: 'LEFT', color: P.amber, tracking: 6 });
  text(hud, 'hud/modo', C.mode, 88, 52, 220, 10, { align: 'LEFT', color: P.muted, tracking: 12 });

  block(hud, 'hud/duelo', 700, 24, 520, 56, '#14203A', { stroke: 3, depth: 0, r: 12, studs: 0.2 });
  rect(hud, 'hud/duelo-round-bg', 712, 34, 118, 36, P.amber, { r: 8, stroke: OUT, strokeW: 3 });
  text(hud, 'hud/duelo-round', C.duelRound, 712, 34, 118, 18, { color: '#2B1D00', tracking: 8 });
  text(hud, 'hud/duelo-score', `${C.duelLeft}  ${C.duelScore}  ${C.duelRight}`, 846, 34, 250, 24, { align: 'LEFT', color: P.white, tracking: 4 });
  text(hud, 'hud/duelo-timer', C.duelTimer, 1104, 34, 104, 22, { align: 'RIGHT', color: P.cyanSoft, tracking: 4 });

  block(hud, 'hud/perfil', 1444, 20, 440, 76, P.panel, { stroke: 3, depth: 0, r: 14, studs: 0.22 });
  rect(hud, 'hud/perfil-nivel', 1460, 32, 52, 52, P.gold, { r: 10, stroke: OUT, strokeW: 3 });
  text(hud, 'hud/perfil-nivel-txt', `[${C.level}]`, 1460, 32, 52, 22, { color: P.goldInk });
  text(hud, 'hud/perfil-nome', C.player, 1524, 32, 220, 26, { align: 'LEFT', color: P.white, tracking: 4 });
  text(hud, 'hud/perfil-xp-txt', C.xp, 1524, 60, 220, 12, { align: 'LEFT', color: P.muted, tracking: 6 });
  bar(hud, 'hud/perfil-xp', 1752, 62, 116, 12, 0.62, P.gold);

  block(hud, 'hud/vida', 36, 920, 540, 124, '#0E1B33', { stroke: 4, depth: 8, r: 16, studs: 0.25 });
  text(hud, 'hud/vida-label', C.life, 60, 940, 120, 14, { align: 'LEFT', color: P.cyanSoft, tracking: 18 });
  bar(hud, 'hud/vida-bar', 60, 966, 380, 26, 0.82, P.emerald);
  text(hud, 'hud/vida-valor', C.lifeValue, 448, 964, 108, 18, { align: 'RIGHT', color: P.white });
  text(hud, 'hud/armadura-label', C.armor, 60, 1006, 120, 12, { align: 'LEFT', color: P.muted, tracking: 14 });
  for (let i = 0; i < 4; i += 1) {
    rect(hud, `hud/armadura-${i}`, 168 + i * 30, 1008, 22, 12, i < 3 ? P.cyan : '#1B2A44', { r: 4, stroke: OUT, strokeW: 2 });
  }

  block(hud, 'hud/ammo', 1560, 920, 324, 124, '#0E1B33', { stroke: 4, depth: 8, r: 16, studs: 0.25 });
  text(hud, 'hud/ammo-arma', C.weapon, 1584, 938, 276, 13, { align: 'LEFT', color: P.cyanSoft, tracking: 10 });
  text(hud, 'hud/ammo-num', C.ammo, 1580, 956, 160, 52, { align: 'LEFT', color: P.gold });
  text(hud, 'hud/ammo-reserva', C.ammoReserve, 1712, 978, 120, 22, { align: 'LEFT', color: P.muted });
  rect(hud, 'hud/ammo-modo-bg', 1808, 986, 56, 24, '#1B2A44', { r: 6, stroke: OUT, strokeW: 2 });
  text(hud, 'hud/ammo-modo', C.fireMode, 1808, 986, 56, 12, { color: P.text, tracking: 8 });

  rect(hud, 'hud/dica', 700, 1004, 520, 40, alpha('#0B1730', 0.86), { r: 999, stroke: '#24344F', strokeW: 2 });
  text(hud, 'hud/dica-txt', C.hint, 700, 1004, 520, 12, { color: P.muted, tracking: 6 });

  let actY = 356;
  for (const a of C.sideActions) {
    block(hud, `hud/acao-${a.label}`, 1812, actY, 72, 72, a.color, { stroke: 3, depth: 6, r: 14, studs: 0.3, depthRatio: 0.5 });
    text(hud, `hud/acao-${a.label}-txt`, a.label, 1812, actY + 20, 72, 11, { color: a.text, tracking: 6 });
    actY += 84;
  }
  return hud;
}

// ================================================================ LOJA ======
function buildShop(parent) {
  const C = CFG.copy;
  const shop = layer(parent, '02 · Loja de Operadores');

  const scrim = rect(shop, 'scrim', 0, 0, 1920, 1080, alpha('#04070F', 0.55), { stroke: null });
  scrim.strokes = [];

  const PX = 400; const PY = 104; const PW = 1120; const PH = 800;
  const HEAD = 100;

  block(shop, 'loja/painel', PX, PY, PW, PH, P.panel, { stroke: 4, depth: 12, r: 18, studs: 0.3, depthRatio: 0.5 });
  const painelFace = shop.children.find((n) => n.name === 'loja/painel/face');
  if (painelFace) painelFace.opacity = 0.96;
  rect(shop, 'loja/painel-rim', PX, PY, PW, PH, null, { r: 18, stroke: '#3B5A80', strokeW: 2 });
  rect(shop, 'loja/painel-rim', PX + 2, PY + 2, PW - 4, PH - 4, null, { r: 16, stroke: alpha('#FFFFFF', 0.10), strokeW: 2 });

  block(shop, 'loja/header', PX, PY, PW - 112, HEAD, P.gold, {
    stroke: 4, depth: 0, r: { topLeft: 18, topRight: 0, bottomRight: 0, bottomLeft: 0 }, studs: 0.22,
  });
  text(shop, 'loja/titulo', C.shopTitle, PX + 40, PY + 18, 620, 40, { align: 'LEFT', color: P.goldInk, tracking: 2 });
  text(shop, 'loja/sub', C.shopSub, PX + 42, PY + 62, 620, 12, { align: 'LEFT', color: '#5A4200', tracking: 10 });

  rect(shop, 'loja/moeda-pill', PX + PW - 344, PY + 26, 200, 48, alpha('#091632', 0.95), { r: 999, stroke: OUT, strokeW: 3 });
  diamond(shop, 'loja/moeda-icone', PX + PW - 328, PY + 40, 20, P.cyanSoft, 2);
  text(shop, 'loja/moeda-valor', C.currency, PX + PW - 300, PY + 28, 110, 24, { align: 'LEFT', color: P.white, tracking: 4 });
  rect(shop, 'loja/moeda-add', PX + PW - 168, PY + 26, 48, 48, P.emerald, { r: 999, stroke: OUT, strokeW: 3 });
  text(shop, 'loja/moeda-add-txt', '+', PX + PW - 168, PY + 22, 48, 30, { color: '#04291C' });

  block(shop, 'loja/fechar', PX + PW - 112, PY, 112, HEAD, P.red, {
    stroke: 4, depth: 0, r: { topLeft: 0, topRight: 18, bottomRight: 0, bottomLeft: 0 }, studs: 0.45,
  });
  rect(shop, 'loja/fechar-rim', PX + PW - 112, PY, 112, HEAD, null, { r: 0, stroke: alpha('#FFFFFF', 0.5), strokeW: 3 });
  text(shop, 'loja/fechar-x', 'X', PX + PW - 112, PY + 16, 112, 38, { color: '#FFFFFF' });

  // ---- pacote em destaque ----
  const HX = PX + 32; const HY = PY + HEAD + 24; const HW = PW - 64; const HH = 216;
  block(shop, 'hero', HX, HY, HW, HH, '#123C70', {
    stroke: 4, depth: 10, r: 16, studs: 0.45, depthRatio: 0.5,
    fill: solidGradient([[0, '#1B5FA8'], [0.6, '#123C70'], [1, '#0C1A44']]),
  });
  sheen(shop, HX + 2, HY + 2, Math.round((HW - 4) * 0.55), HH - 4, 14, 0.08);

  const halo = rect(shop, 'hero/halo', HX + HW - 292, HY + 26, 164, 164, alpha('#FFFFFF', 0.12), { r: 28, stroke: P.gold, strokeW: 3 });
  halo.rotation = 8;
  if (RENDER_HASH) icon(shop, 'hero/render', HX + HW - 320, HY + 6, 220, 204, RENDER_HASH, 'FIT');

  rect(shop, 'hero/chip-bg', HX + 32, HY + 26, 248, 30, P.red, { r: 8, stroke: OUT, strokeW: 3 });
  text(shop, 'hero/chip', C.heroChip, HX + 32, HY + 26, 248, 13, { color: '#FFFFFF', tracking: 8 });
  text(shop, 'hero/titulo', C.heroTitle, HX + 32, HY + 58, 660, 36, { align: 'LEFT', color: P.gold, strokeW: 4, shadow: 4, tracking: 2 });
  C.heroBullets.forEach((b, i) => {
    diamond(shop, `hero/bullet-${i}`, HX + 34, HY + 108 + i * 24, 12, P.gold, 2);
    text(shop, `hero/bullet-txt-${i}`, b, HX + 58, HY + 102 + i * 24, 520, 13, { align: 'LEFT', color: P.text, tracking: 6 });
  });

  const buyX = HX + 32; const buyY = HY + HH - 72; const buyW = 300; const buyH = 52;
  block(shop, 'hero/btn', buyX, buyY, buyW, buyH, P.emerald, { stroke: 4, depth: 6, r: 12, studs: 0.35, depthRatio: 0.45 });
  bevel(shop, buyX, buyY, buyW, buyH, alpha('#FFFFFF', 0.75), P.emeraldDepth, { r: 12, rimW: 3, lipRatio: 0.2 });
  diamond(shop, 'hero/btn-icone', buyX + 20, buyY + 16, 20, P.cyanSoft, 2);
  text(shop, 'hero/btn-valor', C.heroPrice, buyX + 52, buyY + 6, 120, 24, { align: 'LEFT', color: '#FFFFFF', tracking: 2 });
  text(shop, 'hero/btn-go', C.buy, buyX + 168, buyY + 10, 116, 17, { align: 'RIGHT', color: '#DFFBEF', tracking: 6 });

  // ---- cartões ----
  const cards = C.cards;
  const cw = 344; const ch = 300; const gap = 12;
  const cy = HY + HH + 22;

  cards.forEach((c, i) => {
    const g = layer(shop, `card-${i + 1}-${c.title}`, HX + i * (cw + gap), cy);
    block(g, 'face', 0, 0, cw, ch, c.color, { stroke: 4, depth: 8, r: 16, studs: 0.4, depthRatio: 0.55 });
    rect(g, 'faixa', 4, 4, cw - 8, 148, c.color, { r: 12, stroke: null });
    rect(g, 'faixa-brilho', 4, 4, cw - 8, 74, alpha('#FFFFFF', 0.1), { r: 12, stroke: null });

    const img = figma.createFrame();
    g.appendChild(img);
    img.name = 'imagem'; img.x = 16; img.y = 12;
    img.resize(cw - 32, 132); img.cornerRadius = 10; img.clipsContent = true;
    img.fills = [solidGradient([[0, shade(c.color, 2.2)], [1, '#0B1730']])];
    img.strokes = [{ type: 'SOLID', color: hex(OUT) }]; img.strokeWeight = 3; img.strokeAlign = 'INSIDE';
    if (RENDER_HASH) {
      const im = figma.createRectangle();
      img.appendChild(im);
      im.name = 'render'; im.resize(cw - 40, 130); im.x = 4; im.y = 2;
      im.fills = [{ type: 'IMAGE', imageHash: RENDER_HASH, scaleMode: 'FIT', imageTransform: [[0, 0, 1], [0, 0, 1]] }];
    }
    sheen(g, 14, 12, cw - 28, 132, 10, 0.1);

    const tagW = Math.max(76, c.tag.length * 10 + 30);
    rect(g, 'tag-bg', 16, 156, tagW, 24, alpha('#0B1730', 0.92), { r: 999, stroke: c.accent, strokeW: 2 });
    text(g, 'tag', c.tag, 16, 156, tagW, 11, { color: c.accent, tracking: 12 });
    text(g, 'titulo', c.title, 16, 186, cw - 32, 26, { align: 'LEFT', color: '#FFFFFF', strokeW: 3, shadow: 3, tracking: 2 });
    text(g, 'sub', c.sub, 16, 208, cw - 32, 14, { align: 'LEFT', color: P.muted, tracking: 10 });

    const py = ch - 62;
    block(g, 'preco', 16, py, cw - 32, 52, P.emerald, { stroke: 4, depth: 6, r: 12, studs: 0.3, depthRatio: 0.45 });

    bevel(g, 16, py, cw - 32, 52, alpha('#FFFFFF', 0.7), P.emeraldDepth, { r: 12, rimW: 3, lipRatio: 0.22 });
    diamond(g, 'preco-icone', 34, py + 16, 20, P.cyanSoft, 2);
    text(g, 'preco-valor', c.price, 64, py + 6, 130, 24, { align: 'LEFT', color: '#FFFFFF', tracking: 2 });
    text(g, 'preco-go', C.buy, 28, py + 12, cw - 56, 15, { align: 'RIGHT', color: '#DFFBEF', tracking: 6 });
  });

  // anel de foco dourado no cartão do meio (estado de hover)
  const focus = figma.createFrame();
  shop.appendChild(focus);
  focus.name = 'card-2-focus-ring';
  focus.x = HX + (cw + gap) - 6; focus.y = cy - 6;
  focus.resize(cw + 12, ch + 18);
  focus.fills = []; focus.strokes = [{ type: 'SOLID', color: hex(P.gold) }];
  focus.strokeWeight = 4; focus.strokeAlign = 'INSIDE'; focus.cornerRadius = 20;
  focus.locked = true;

  text(shop, 'loja/rodape', C.footer, PX + 32, PY + PH - 38, PW - 64, 13, { align: 'LEFT', color: P.muted, tracking: 8 });
  return shop;
}

// ============================================================ MONTAGEM ======
function layer(parent, name, x = 0, y = 0) {
  const f = figma.createFrame();
  parent.appendChild(f);
  f.name = name; f.x = x; f.y = y;
  f.resize(1920, 1080);
  f.fills = []; f.strokes = []; f.clipsContent = false;
  return f;
}

function buildBackground(parent) {
  const bg = layer(parent, '00 · fundo (travar)');
  const base = rect(bg, 'fundo/gradiente', 0, 0, 1920, 1080, null, { stroke: null });
  base.fills = [solidGradient([[0, '#123C70'], [0.55, '#0C1A44'], [1, '#080F25']])];
  const glow = rect(bg, 'fundo/glow', 560, -260, 800, 800, null, { stroke: null });
  glow.fills = [{
    type: 'GRADIENT_RADIAL',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0, color: alpha('#3CB9F2', 0.35) },
      { position: 0.55, color: alpha('#123C70', 0.12) },
      { position: 1, color: alpha('#0C1A44', 0) },
    ],
  }];
  if (STUD_HASH) {
    const studs = rect(bg, 'fundo/studs', 0, 0, 1920, 1080, null, { stroke: null });
    studs.fills = [{ type: 'IMAGE', imageHash: STUD_HASH, scaleMode: 'TILE', scalingFactor: 2.2 }];
    studs.blendMode = 'OVERLAY'; studs.opacity = 0.16;
  }
  const vig = rect(bg, 'fundo/vinheta', 0, 0, 1920, 1080, null, { stroke: null });
  vig.fills = [{
    type: 'GRADIENT_RADIAL',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0.45, color: alpha('#000000', 0) },
      { position: 1, color: alpha('#04070F', 0.92) },
    ],
  }];
  bg.locked = true;
  return bg;
}

async function main() {
  FONT = await pickFont();
  warn('fonte:', FONT.family, FONT.style);

  STUD_HASH = makeImage(ART.stud, 'textura de stud');
  RENDER_HASH = makeImage(ART.render, 'render de operador');
  warn(STUD_HASH ? 'stud ok' : 'stud indisponível', '·', RENDER_HASH ? 'render ok' : 'render indisponível');

  const target = CFG.frameId ? await figma.getNodeByIdAsync(CFG.frameId) : null;
  if (CFG.frameId && !target) throw new Error(`Frame ${CFG.frameId} não encontrado.`);

  let screen;
  if (target) {
    for (const child of [...target.children]) child.remove();
    target.fills = [{ type: 'SOLID', color: hex(P.page) }];
    target.clipsContent = true;
    screen = target;
  } else {
    screen = figma.createFrame();
    screen.name = 'NEXUS/WZ — HUD + LOJA';
    screen.fills = [{ type: 'SOLID', color: hex(P.page) }];
    screen.clipsContent = true;
    screen.x = 0; screen.y = 0;
    screen.resize(1920, 1080);
  }

  // constrói sempre em 1920×1080 e reescala para o tamanho pedido
  const stage = layer(screen, 'NEXUS/stage');
  buildBackground(stage);
  if (CFG.show.hud) buildHUD(stage);
  if (CFG.show.shop) buildShop(stage);

  const scale = Math.min(CFG.size.w / 1920, CFG.size.h / 1080);
  if (Math.abs(scale - 1) > 0.001) {
    stage.rescale(scale);
    screen.resize(CFG.size.w, CFG.size.h);
    stage.x = 0; stage.y = 0;
  }

  figma.currentPage.selection = [screen];
  figma.viewport.scrollAndZoomIntoView([screen]);

  const count = (n) => 1 + ((n.children || []).reduce((s, c) => s + count(c), 0));
  console.log(`[nexus] pronto — ${screen.name}: ${count(stage)} nós, ${CFG.show.shop ? 'com' : 'sem'} loja.`);
  console.log('[nexus] edite textos em CFG.copy e rode de novo para reconstruir.');
  return { frame: screen.id, font: FONT, nodes: count(stage) };
}

await main();
