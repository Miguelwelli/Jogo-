// ============================================================================
// NEXUS / WZ — HUD + Loja de Operadores  ·  script `use_figma`
// Construído com a skill ui-figma-roblox (.skills/ui-figma-roblox/SKILL.md)
// ----------------------------------------------------------------------------
// O QUE ELE FAZ
//   Desenha, num frame 1920×1080, duas camadas:
//     1) HUD de gameplay (vida, munição, placar do duelo, perfil/XP, ações)
//     2) Modal "LOJA DE OPERADORES" (header, pacote destaque, 3 cartões, moeda)
//   Tudo em formas editáveis: face + profundidade + contorno externo + studs
//   em tile com Overlay + rim interno + lábio inferior + brilho diagonal.
//
// ANTES DE RODAR
//   a) Suba as imagens com upload_assets e cole os hashes em HASH abaixo:
//        assets/kek-ui-essentials/kek_stud.png                        -> studs
//        assets/ui-resources/files/Renders/815490552-...Noob_Run.webp -> render
//        assets/ui-resources/files/Backgrounds/132278236-...webp       -> cena
//      Deixe null no que não quiser: o script pula essas camadas e avisa no console.
//   b) Aponte FRAME_ID para um frame 1920×1080 (null = cria um novo).
//   c) Rode. IDs e hashes são do arquivo; o resto é reexecutável (limpa filhos).
//
// Nada depende de plugin externo. Fontes: tenta Fredoka One, cai para Baloo 2,
// Nunito, Inter — em ordem — e avisa qual usou.
// ============================================================================

const FRAME_ID = null; // ex.: '2:2'
const HASH = {
  studs: null,   // kek_stud.png (obrigatório p/ textura de stud)
  render: null,  // render de operador (Noob_Run.webp)
  scene: null,   // print do mapa, só como referência de fundo
};

const CFG = {
  w: 1920, h: 1080,
  fontCandidates: [
    ['Fredoka One', 'Regular'],
    ['Baloo 2', 'ExtraBold'],
    ['Nunito', 'Black'],
    ['Inter', 'Bold'],
  ],
  studScale: 0.375,          // 24 px por stud no tile 2048×1024
  studOpacity: 0.42,
  copy: {
    brandA: 'NEXUS', brandB: 'WZ', mode: 'TREINO LOW-POLY',
    duelTitle: 'ROUND 3', duelLeft: 'VOCÊ', duelRight: 'BOT', duelScore: '2 × 1', timer: '01:24',
    lifeLabel: 'VIDA', lifeValue: '82 / 100', armor: 'ARMADURA',
    weapon: 'FUZIL DE ASSALTO', ammo: '30', ammoReserve: '/ 120', fireMode: 'AUTO',
    level: '7', player: 'OPERADOR', xp: 'XP 620 / 1.000',
    hint: 'F PARA SACAR   •   Q PARA TROCAR DE ARMA   •   SHIFT PARA CORRER',
    shopTitle: 'LOJA DE OPERADORES',
    shopSub: 'ESCOLHA SEU VISUAL. AS ARMAS SÃO GRÁTIS.',
    currency: '1.250',
    heroChip: 'OFERTA LIMITADA • 24H',
    heroTitle: 'PACOTE LENDA DOURADA',
    heroBullets: ['5 OPERADORES • 3 EMBLEMAS', '4 FUNDOS DE PRÉVIA', 'ACESSO ANTECIPADO'],
    heroPrice: '1.250',
    cards: [
      { tag: 'COMUM', title: 'RECRUTA', sub: 'TREINO • OPERADOR', price: '900', color: '#2A3B57', accent: '#9FB4D0' },
      { tag: 'RARO', title: 'OPERADOR TÁTICO', sub: 'DUELO • OPERADOR', price: '1.450', color: '#2C7DB8', accent: '#8CD8FF' },
      { tag: 'ÉPICO', title: 'LENDA DOURADA', sub: 'EVENTO • OPERADOR', price: '2.200', color: '#B4791F', accent: '#FFE78D' },
    ],
    close: 'X',
    sideActions: [
      { label: 'LOJA', color: '#FFD34D', text: '#3D2B00' },
      { label: 'OPERADOR', color: '#2C7DB8', text: '#FFFFFF' },
      { label: 'TREINO', color: '#10B981', text: '#04291C' },
      { label: 'AJUSTES', color: '#22314C', text: '#D8E3F3' },
    ],
  },
};

// ---------------------------------------------------------------- palette ---
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
  emerald: '#10B981', emeraldDepth: '#065F46', emeraldInk: '#04291C',
  red: '#F24848', redDepth: '#9E1F1F',
  white: '#FFFFFF', text: '#E7EFFA', muted: '#AEBBD3',
};

// --------------------------------------------------------------- utilities ---
const warn = (...a) => console.log('[nexus]', ...a);
let FONT = null;

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

const crisp = (d, c = { r: 0, g: 0, b: 0, a: 0.85 }) => ({
  type: 'DROP_SHADOW', color: c, offset: { x: 0, y: d }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL',
});

function rect(parent, name, x, y, w, h, fill, { r = 0, stroke = OUT, strokeW = 4 } = {}) {
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.name = name; n.x = x; n.y = y; n.resize(w, h);
  if (typeof r === 'number') n.cornerRadius = r;
  else if (r && typeof r === 'object') {
    n.topLeftRadius = r.topLeft || 0; n.topRightRadius = r.topRight || 0;
    n.bottomLeftRadius = r.bottomLeft || 0; n.bottomRightRadius = r.bottomRight || 0;
  }
  if (!fill) n.fills = [];
  else if (typeof fill === 'string') n.fills = [{ type: 'SOLID', color: hex(fill) }];
  else if (Array.isArray(fill)) n.fills = fill;
  else if (fill && fill.type) n.fills = [fill];               // paint já montado (gradiente)
  else n.fills = [{ type: 'SOLID', color: fill }];            // objeto de cor cru
  if (stroke && strokeW) {
    n.strokes = [{ type: 'SOLID', color: typeof stroke === 'string' ? hex(stroke) : stroke }];
    n.strokeWeight = strokeW;
    n.strokeAlign = 'OUTSIDE';
  } else { n.strokes = []; }
  return n;
}

function relRect(parent, name, x, y, w, h, { r = 0, stroke = null, strokeW = 0 } = {}) {
  const n = figma.createRectangle();
  parent.appendChild(n);
  n.name = name; n.x = x; n.y = y; n.resize(w, h); n.cornerRadius = r;
  n.fills = [];
  if (stroke && strokeW) {
    n.strokes = [{ type: 'SOLID', color: typeof stroke === 'string' ? hex(stroke) : stroke }];
    n.strokeWeight = strokeW; n.strokeAlign = 'OUTSIDE';
  }
  return n;
}

function solidGradient(stops, vertical = true) {
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: vertical ? [[0, 1, 0], [-1, 0, 0]] : [[1, 0, 0], [0, 1, 0]],
    gradientStops: stops.map(([pos, color, a = 1]) => ({
      position: pos,
      color: { ...(typeof color === 'string' ? hex(color) : color), a },
    })),
  };
}

// Bloco stud-UI: profundidade -> face -> textura -> rim -> lábio.
function block(parent, name, x, y, w, h, color, opts = {}) {
  const {
    stroke = 4, depth = 10, r = 0, studs = CFG.studOpacity, fill = null, depthRatio = 0.62,
  } = opts;
  const isGradient = Boolean(color && color.gradientStops);
  const radius = typeof r === 'number' ? r : 0;
  if (depth) {
    const base = isGradient ? color.gradientStops[0].color : (typeof color === 'string' ? hex(color) : color);
    relRect(parent, `${name}/depth`, x, y + depth, w, h, { r, stroke: OUT, strokeW: stroke })
      .fills = [{
      type: 'SOLID',
      color: { r: base.r * depthRatio, g: base.g * depthRatio, b: base.b * depthRatio },
    }];
  }
  const face = rect(parent, `${name}/face`, x, y, w, h, fill || color, { r, stroke: OUT, strokeW: stroke });
  if (studs && HASH.studs) {
    const s = figma.createRectangle();
    parent.appendChild(s);
    s.name = `${name}/studs`; s.x = x; s.y = y; s.resize(w, h); s.cornerRadius = radius;
    s.fills = [{ type: 'IMAGE', imageHash: HASH.studs, scaleMode: 'TILE', scalingFactor: CFG.studScale }];
    s.blendMode = 'OVERLAY';
    s.opacity = studs;
  } else if (studs) { warn(`sem HASH.studs: textura pulada em ${name}`); }
  return face;
}

// Rim interno claro + lábio inferior escuro (efeito "botão grosso" do tutorial).
function bevel(parent, x, y, w, h, rim, lip, { r = 0, rimW = 3, lipRatio = 0.2 } = {}) {
  const rimN = rect(parent, 'bevel/rim', x, y, w, h, null, { r, stroke: rim, strokeW: rimW });
  rimN.strokeAlign = 'INSIDE';
  rimN.opacity = 0.9;
  const lipH = Math.max(4, Math.round(h * lipRatio));
  const lipN = rect(parent, 'bevel/lip', x, y + h - lipH, w, lipH, alpha(lip, 0.35), { r: 0, stroke: null });
  lipN.cornerRadius = r ? Math.min(r, 8) : 0;
  const line = rect(parent, 'bevel/lip-line', x + 6, y + h - lipH, w - 12, 2, alpha('#FFFFFF', 0.25), { stroke: null });
  return [rimN, lipN, line];
}

// Brilho diagonal recortado (sheen), como no exemplo stud-shop da skill.
function sheen(parent, x, y, w, h, r = 0, op = 0.10) {
  const f = figma.createFrame();
  parent.appendChild(f);
  f.name = 'sheen'; f.x = x; f.y = y; f.resize(w, h);
  f.fills = []; f.strokes = []; f.cornerRadius = r; f.clipsContent = true;
  for (let i = 0; i < 4; i += 1) {
    const s = figma.createRectangle();
    f.appendChild(s);
    s.resize(46, h * 2.2); s.x = -60 + i * 120; s.y = -h * 0.6;
    s.rotation = 20;
    s.fills = [{ type: 'SOLID', color: { ...hex('#FFFFFF'), a: op } }];
  }
  return f;
}

function text(parent, name, chars, x, y, w, size, opts = {}) {
  const {
    align = 'CENTER', h = size * 1.5, color = P.text, strokeW = 0, shadow = 0,
    tracking = 0, vAlign = 'CENTER',
  } = opts;
  const t = figma.createText();
  parent.appendChild(t);
  t.name = name; t.fontName = FONT; t.characters = chars; t.fontSize = size;
  t.textAutoResize = 'NONE'; t.resize(w, h); t.x = x; t.y = y;
  t.textAlignHorizontal = align; t.textAlignVertical = vAlign;
  t.fills = [{ type: 'SOLID', color: hex(color) }];
  if (strokeW) {
    t.strokes = [{ type: 'SOLID', color: hex(OUT) }];
    t.strokeWeight = strokeW; t.strokeAlign = 'OUTSIDE';
  }
  if (shadow) t.effects = [crisp(shadow)];
  if (tracking) t.letterSpacing = { unit: 'PERCENT', value: tracking };
  return t;
}

function bar(parent, name, x, y, w, h, pct, color, { track = '#0B1730', r = 999 } = {}) {
  const t = rect(parent, `${name}/track`, x, y, w, h, track, { r, stroke: null, strokeW: 0 });
  t.strokes = [{ type: 'SOLID', color: hex('#000000') }]; t.strokeWeight = 2; t.strokeAlign = 'INSIDE';
  const fw = Math.max(6, Math.round(w * pct));
  const f = rect(parent, `${name}/fill`, x, y, fw, h, color, { r, stroke: null, strokeW: 0 });
  const glow = rect(parent, `${name}/gloss`, x + 2, y + 2, Math.max(2, fw - 4), Math.max(2, Math.round(h * 0.34)), alpha('#FFFFFF', 0.35), { r, stroke: null });
  return [t, f, glow];
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

function imageRect(parent, name, x, y, w, h, hash, opts = {}) {
  const { mode = 'FIT', r = 0, stroke = OUT, strokeW = 0, bg = null } = opts;
  const n = rect(parent, name, x, y, w, h, bg, { r, stroke, strokeW });
  if (hash) n.fills = [{ type: 'IMAGE', imageHash: hash, scaleMode: mode, imageTransform: [[0, 0, 1], [0, 0, 1]] }];
  else warn(`sem hash: ${name} ficou com placeholder`);
  return n;
}

// --------------------------------------------------------------- montagem ---
const screenFrame = async () => {
  if (FRAME_ID) return await figma.getNodeByIdAsync(FRAME_ID);
  const f = figma.createFrame();
  f.name = 'NEXUS/WZ — HUD + LOJA (1920×1080)';
  f.resize(CFG.w, CFG.h); f.x = 0; f.y = 0;
  f.fills = [{ type: 'SOLID', color: hex(P.page) }];
  f.clipsContent = true;
  return f;
};

async function main() {
  FONT = await pickFont();
  warn('fonte:', FONT.family, FONT.style);

  const screen = await screenFrame();
  if (!screen) throw new Error(`Frame ${FRAME_ID} não encontrado.`);
  screen.resize(CFG.w, CFG.h);
  for (const child of [...screen.children]) child.remove();
  screen.fills = [{ type: 'SOLID', color: hex(P.page) }];

  // ---------- fundo: cena de jogo (referência travada) ----------
  const bg = figma.createFrame();
  screen.appendChild(bg);
  bg.name = '00 · cena-de-fundo (travar)';
  bg.x = 0; bg.y = 0; bg.resize(CFG.w, CFG.h);
  bg.fills = [solidGradient([[0, '#123C70'], [0.55, '#0C1A44'], [1, '#080F25']])];
  bg.clipsContent = true;
  if (HASH.scene) {
    const scene = imageRect(bg, 'mapa', -40, -40, CFG.w + 80, CFG.h + 80, HASH.scene, { mode: 'FILL', strokeW: 0 });
    scene.opacity = 0.55;
  }
  // vinheta
  const vig = rect(bg, 'vinheta', 0, 0, CFG.w, CFG.h, null, { stroke: null });
  vig.fills = [{
    type: 'GRADIENT_RADIAL',
    gradientTransform: [[1, 0, 0], [0, 1, 0]],
    gradientStops: [
      { position: 0.45, color: alpha('#000000', 0) },
      { position: 1, color: alpha('#04070F', 0.92) },
    ],
  }];
  bg.locked = true;

  // ======================================================== HUD (trás do modal)
  const hud = figma.createFrame();
  screen.appendChild(hud);
  hud.name = '01 · HUD de gameplay';
  hud.x = 0; hud.y = 0; hud.resize(CFG.w, CFG.h);
  hud.fills = []; hud.strokes = []; hud.clipsContent = false;

  // marca
  block(hud, 'hud/marca', 36, 24, 300, 52, P.panelDeep, { stroke: 3, depth: 0, r: 12, studs: 0.25 });
  diamond(hud, 'hud/marca-diamante', 52, 38, 24, P.amber, 3);
  text(hud, 'hud/marca-texto', CFG.copy.brandA, 88, 26, 120, 24, { align: 'LEFT', color: P.white, tracking: 6 });
  text(hud, 'hud/marca-wz', CFG.copy.brandB, 196, 26, 60, 24, { align: 'LEFT', color: P.amber, tracking: 6 });
  text(hud, 'hud/modo', CFG.copy.mode, 88, 52, 220, 10, { align: 'LEFT', color: P.muted, tracking: 12 });

  // placar do duelo
  block(hud, 'hud/duelo', 700, 24, 520, 56, '#14203A', { stroke: 3, depth: 0, r: 12, studs: 0.2 });
  rect(hud, 'hud/duelo-round-bg', 712, 34, 118, 36, P.amber, { r: 8, stroke: OUT, strokeW: 3 });
  text(hud, 'hud/duelo-round', CFG.copy.duelTitle, 712, 34, 118, 18, { color: '#2B1D00', tracking: 8 });
  text(hud, 'hud/duelo-score', `${CFG.copy.duelLeft}  ${CFG.copy.duelScore}  ${CFG.copy.duelRight}`, 846, 34, 250, 24, { align: 'LEFT', color: P.white, tracking: 4 });
  text(hud, 'hud/duelo-timer', CFG.copy.timer, 1104, 34, 104, 22, { align: 'RIGHT', color: P.cyanSoft, tracking: 4 });

  // perfil + XP (espelha o pill do lobby)
  block(hud, 'hud/perfil', 1444, 20, 440, 76, P.panel, { stroke: 3, depth: 0, r: 14, studs: 0.22 });
  rect(hud, 'hud/perfil-nivel', 1460, 32, 52, 52, P.gold, { r: 10, stroke: OUT, strokeW: 3 });
  text(hud, 'hud/perfil-nivel-txt', `[${CFG.copy.level}]`, 1460, 32, 52, 22, { color: P.goldInk });
  text(hud, 'hud/perfil-nome', CFG.copy.player, 1524, 32, 220, 26, { align: 'LEFT', color: P.white, tracking: 4 });
  text(hud, 'hud/perfil-xp-txt', CFG.copy.xp, 1524, 60, 220, 12, { align: 'LEFT', color: P.muted, tracking: 6 });
  bar(hud, 'hud/perfil-xp', 1752, 62, 116, 12, 0.62, P.gold);

  // vitais (embaixo à esquerda)
  block(hud, 'hud/vida', 36, 920, 540, 124, '#0E1B33', { stroke: 4, depth: 8, r: 16, studs: 0.25 });
  text(hud, 'hud/vida-label', CFG.copy.lifeLabel, 60, 940, 120, 14, { align: 'LEFT', color: P.cyanSoft, tracking: 18 });
  bar(hud, 'hud/vida-bar', 60, 966, 380, 26, 0.82, P.emerald);
  text(hud, 'hud/vida-valor', CFG.copy.lifeValue, 448, 964, 108, 18, { align: 'RIGHT', color: P.white });
  text(hud, 'hud/armadura-label', CFG.copy.armor, 60, 1006, 120, 12, { align: 'LEFT', color: P.muted, tracking: 14 });
  for (let i = 0; i < 4; i += 1) {
    rect(hud, `hud/armadura-${i}`, 168 + i * 30, 1008, 22, 12, i < 3 ? P.cyan : '#1B2A44', { r: 4, stroke: OUT, strokeW: 2 });
  }

  // munição (embaixo à direita)
  block(hud, 'hud/ammo', 1560, 920, 324, 124, '#0E1B33', { stroke: 4, depth: 8, r: 16, studs: 0.25 });
  text(hud, 'hud/ammo-arma', CFG.copy.weapon, 1584, 938, 276, 13, { align: 'LEFT', color: P.cyanSoft, tracking: 10 });
  text(hud, 'hud/ammo-num', CFG.copy.ammo, 1580, 956, 160, 52, { align: 'LEFT', color: P.gold });
  text(hud, 'hud/ammo-reserva', CFG.copy.ammoReserve, 1712, 978, 120, 22, { align: 'LEFT', color: P.muted });
  rect(hud, 'hud/ammo-modo-bg', 1808, 986, 56, 24, '#1B2A44', { r: 6, stroke: OUT, strokeW: 2 });
  text(hud, 'hud/ammo-modo', CFG.copy.fireMode, 1808, 986, 56, 12, { color: P.text, tracking: 8 });

  // dica de teclas
  const hint = rect(hud, 'hud/dica', 700, 1004, 520, 40, alpha('#0B1730', 0.86), { r: 999, stroke: '#24344F', strokeW: 2 });
  text(hud, 'hud/dica-txt', CFG.copy.hint, 700, 1004, 520, 12, { color: P.muted, tracking: 6 });
  void hint;

  // ações laterais (direita)
  const actX = 1812; let actY = 356;
  for (const a of CFG.copy.sideActions) {
    block(hud, `hud/acao-${a.label}`, actX, actY, 72, 72, a.color, { stroke: 3, depth: 6, r: 14, studs: 0.3, depthRatio: 0.5 });
    text(hud, `hud/acao-${a.label}-txt`, a.label, actX, actY + 20, 72, 11, { color: a.text, tracking: 6 });
    actY += 84;
  }

  // ============================================================ MODAL DA LOJA
  const PX = 400, PY = 104, PW = 1120, PH = 800;
  const shop = figma.createFrame();
  screen.appendChild(shop);
  shop.name = '02 · Loja de Operadores';
  shop.x = 0; shop.y = 0; shop.resize(CFG.w, CFG.h);
  shop.fills = []; shop.strokes = []; shop.clipsContent = false;

  // escurecer o HUD atrás do modal
  const scrim = rect(shop, 'scrim', 0, 0, CFG.w, CFG.h, alpha('#04070F', 0.55), { stroke: null });
  scrim.strokes = [];

  // painel
  block(shop, 'loja/painel', PX, PY, PW, PH, alpha(P.panel, 0.96), { stroke: 4, depth: 12, r: 18, studs: 0.3, depthRatio: 0.5 });

  // header + botão fechar
  const HEAD = 100;
  block(shop, 'loja/header', PX, PY, PW - 112, HEAD, P.gold, {
    stroke: 4, depth: 0, r: { topLeft: 18, topRight: 0, bottomRight: 0, bottomLeft: 0 }, studs: 0.22, depthRatio: 0.55,
  });
  text(shop, 'loja/titulo', CFG.copy.shopTitle, PX + 40, PY + 18, 620, 40, { align: 'LEFT', color: P.goldInk, strokeW: 0, tracking: 2 });
  text(shop, 'loja/sub', CFG.copy.shopSub, PX + 42, PY + 62, 620, 12, { align: 'LEFT', color: '#5A4200', tracking: 10 });

  // moeda no header
  rect(shop, 'loja/moeda-pill', PX + PW - 344, PY + 26, 200, 48, alpha('#091632', 0.95), { r: 999, stroke: OUT, strokeW: 3 });
  diamond(shop, 'loja/moeda-icone', PX + PW - 328, PY + 40, 20, P.cyanSoft, 2);
  text(shop, 'loja/moeda-valor', CFG.copy.currency, PX + PW - 300, PY + 28, 110, 24, { align: 'LEFT', color: P.white, tracking: 4 });
  rect(shop, 'loja/moeda-add', PX + PW - 168, PY + 26, 48, 48, P.emerald, { r: 999, stroke: OUT, strokeW: 3 });
  text(shop, 'loja/moeda-add-txt', '+', PX + PW - 168, PY + 22, 48, 30, { color: '#04291C' });

  // fechar
  block(shop, 'loja/fechar', PX + PW - 112, PY, 112, HEAD, P.red, {
    stroke: 4, depth: 0, r: { topLeft: 0, topRight: 18, bottomRight: 0, bottomLeft: 0 }, studs: 0.45, depthRatio: 0.55,
  });
  rect(shop, 'loja/fechar-rim', PX + PW - 112, PY, 112, HEAD, null, { r: 0, stroke: alpha('#FFFFFF', 0.5), strokeW: 3 });
  text(shop, 'loja/fechar-x', 'X', PX + PW - 112, PY + 16, 112, 38, { color: '#FFFFFF', strokeW: 0 });

  // pacote destaque
  const HX = PX + 32, HY = PY + HEAD + 24, HW = PW - 64, HH = 216;
  block(shop, 'hero', HX, HY, HW, HH, '#123C70', {
    stroke: 4, depth: 10, r: 16, studs: 0.45, depthRatio: 0.5,
    fill: solidGradient([[0, '#1B5FA8'], [0.6, '#123C70'], [1, '#0C1A44']]),
  });
  sheen(shop, HX + 2, HY + 2, HW - 4, HH - 4, 14, 0.08);

  // halo + render à direita
  const halo = rect(shop, 'hero/halo', HX + HW - 292, HY + 26, 164, 164, alpha('#FFFFFF', 0.12), { r: 28, stroke: P.gold, strokeW: 3 });
  halo.rotation = 8;
  if (HASH.render) {
    const rn = imageRect(shop, 'hero/render', HX + HW - 320, HY + 6, 220, 204, HASH.render, { mode: 'FIT', strokeW: 0 });
    rn.opacity = 0.98;
  }

  // textos do hero
  rect(shop, 'hero/chip-bg', HX + 32, HY + 26, 248, 30, P.red, { r: 8, stroke: OUT, strokeW: 3 });
  text(shop, 'hero/chip', CFG.copy.heroChip, HX + 32, HY + 26, 248, 13, { color: '#FFFFFF', tracking: 8 });
  text(shop, 'hero/titulo', CFG.copy.heroTitle, HX + 32, HY + 58, 660, 36, { align: 'LEFT', color: P.gold, strokeW: 4, shadow: 4, tracking: 2 });
  CFG.copy.heroBullets.forEach((b, i) => {
    diamond(shop, `hero/bullet-${i}`, HX + 34, HY + 108 + i * 24, 12, P.gold, 2);
    text(shop, `hero/bullet-txt-${i}`, b, HX + 58, HY + 102 + i * 24, 520, 13, { align: 'LEFT', color: P.text, tracking: 6 });
  });

  // botão de compra do hero
  const buyX = HX + 32, buyY = HY + HH - 72, buyW = 300, buyH = 52;
  block(shop, 'hero/btn', buyX, buyY, buyW, buyH, P.emerald, { stroke: 4, depth: 6, r: 12, studs: 0.35, depthRatio: 0.45 });
  bevel(shop, buyX, buyY, buyW, buyH, alpha('#FFFFFF', 0.75), P.emeraldDepth, { r: 12, rimW: 3, lipRatio: 0.2 });
  diamond(shop, 'hero/btn-icone', buyX + 20, buyY + 18, 20, P.cyanSoft, 2);
  text(shop, 'hero/btn-valor', CFG.copy.heroPrice, buyX + 52, buyY + 8, 120, 26, { align: 'LEFT', color: '#FFFFFF', tracking: 2 });
  text(shop, 'hero/btn-go', 'COMPRAR', buyX + 168, buyY + 12, 116, 18, { align: 'RIGHT', color: '#DFFBEF', tracking: 6 });

  // cartões
  const cards = CFG.copy.cards;
  const cw = 344, ch = 300, gap = 12;
  const cy = HY + HH + 22;
  cards.forEach((c, i) => {
    const cx = HX + i * (cw + gap);
    const g = figma.createFrame();
    shop.appendChild(g);
    g.name = `card-${i + 1}-${c.title}`;
    g.x = cx; g.y = cy; g.resize(cw, ch);
    g.fills = []; g.strokes = []; g.clipsContent = false;

    block(g, 'face', 0, 0, cw, ch, c.color, { stroke: 4, depth: 8, r: 16, studs: 0.4, depthRatio: 0.55 });
    rect(g, 'faixa', 4, 4, cw - 8, 148, c.color, { r: 12, stroke: null });
    rect(g, 'faixa-brilho', 4, 4, cw - 8, 74, alpha('#FFFFFF', 0.10), { r: 12, stroke: null });

    // área da imagem
    const imgFrame = figma.createFrame();
    g.appendChild(imgFrame);
    imgFrame.name = 'imagem'; imgFrame.x = 16; imgFrame.y = 12;
    imgFrame.resize(cw - 32, 132); imgFrame.cornerRadius = 10; imgFrame.clipsContent = true;
    imgFrame.fills = [solidGradient([[0, shade(c.color, 2.2)], [1, '#0B1730']])];
    imgFrame.strokes = [{ type: 'SOLID', color: hex(OUT) }]; imgFrame.strokeWeight = 3; imgFrame.strokeAlign = 'INSIDE';
    if (HASH.render) {
      const im = figma.createRectangle();
      imgFrame.appendChild(im);
      im.name = 'render'; im.resize(cw - 40, 130); im.x = 4; im.y = 2;
      im.fills = [{ type: 'IMAGE', imageHash: HASH.render, scaleMode: 'FIT', imageTransform: [[0, 0, 1], [0, 0, 1]] }];
    }
    sheen(g, 14, 12, cw - 28, 132, 10, 0.10);

    // tag de raridade (pill primeiro, texto depois — senão a pílula cobre o texto)
    const tagW = Math.max(76, c.tag.length * 10 + 30);
    rect(g, 'tag-bg', 16, 156, tagW, 24, alpha('#0B1730', 0.92), { r: 999, stroke: c.accent, strokeW: 2 });
    text(g, 'tag', c.tag, 16, 156, tagW, 11, { align: 'CENTER', color: c.accent, tracking: 12 });

    text(g, 'titulo', c.title, 16, 186, cw - 32, 26, { align: 'LEFT', color: '#FFFFFF', strokeW: 3, shadow: 3, tracking: 2 });
    text(g, 'sub', c.sub, 16, 208, cw - 32, 14, { align: 'LEFT', color: P.muted, tracking: 10 });

    // barra de preço
    const py = ch - 62;
    block(g, 'preco', 16, py, cw - 32, 52, P.emerald, { stroke: 4, depth: 6, r: 12, studs: 0.3, depthRatio: 0.45 });
    bevel(g, 16, py, cw - 32, 52, alpha('#FFFFFF', 0.7), P.emeraldDepth, { r: 12, rimW: 3, lipRatio: 0.22 });
    diamond(g, 'preco-icone', 34, py + 16, 20, P.cyanSoft, 2);
    text(g, 'preco-valor', c.price, 64, py + 6, 130, 24, { align: 'LEFT', color: '#FFFFFF', tracking: 2 });
    text(g, 'preco-go', 'COMPRAR', 16 + 12, py + 12, cw - 56, 15, { align: 'RIGHT', color: '#DFFBEF', tracking: 6 });
  });

  // estado de hover/foco: destacar o 2º cartão (como no exemplo da skill)
  const focus = figma.createFrame();
  shop.appendChild(focus);
  focus.name = 'card-2-focus-ring';
  focus.x = HX + (cw + gap) - 6; focus.y = cy - 6;
  focus.resize(cw + 12, ch + 18);
  focus.fills = []; focus.strokes = [{ type: 'SOLID', color: hex(P.gold) }];
  focus.strokeWeight = 4; focus.strokeAlign = 'INSIDE'; focus.cornerRadius = 20;
  focus.opacity = 1;
  focus.locked = true;

  // rodapé do modal
  text(shop, 'loja/rodape', 'OS OPERADORES MUDAM APENAS O VISUAL. NENHUMA VANTAGEM DE COMBATE.', PX + 32, PY + PH - 38, PW - 64, 13, {
    align: 'LEFT', color: P.muted, tracking: 8,
  });

  // fecha grupo do HUD num nome legível
  const hudGroup = hud;
  hudGroup.name = '01 · HUD de gameplay (atrás do modal)';

  figma.currentPage.selection = [screen];
  figma.viewport.scrollAndZoomIntoView([screen]);
  console.log('[nexus] OK — HUD + Loja construídos em', screen.name, `(${screen.children.length} blocos)`);
  console.log('[nexus] próximos passos: trav(e) o fundo, ajuste os textos em CFG.copy e duplique cards.');
  return { ok: true, frame: screen.id, font: FONT };
}

await main();
