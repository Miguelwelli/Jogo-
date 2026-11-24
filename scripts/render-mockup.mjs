// Renderiza figma/nexus-shop-hud.figma.js num PNG, reusando o stub de nós.
// Uso: node scripts/render-mockup.mjs [saida.png]
// Requer @napi-rs/canvas (npm i --no-save @napi-rs/canvas).
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage, GlobalFonts, Path2D } from '@napi-rs/canvas';

const OUT = process.argv[2] || 'preview/nexus-shop-hud.png';
const ROOT = process.cwd();
const SKILL = path.join(ROOT, '.skills/ui-figma-roblox');
const studPath = path.join(SKILL, 'assets/kek-ui-essentials/kek_stud.png');
const renderPath = path.join(SKILL, 'assets/ui-resources/files/Renders/815490552-download_url-4c39aa1c-a32d-45ec-ba57-98c838e25b84_Noob_Run.webp');
const scenePath = path.join(SKILL, 'assets/ui-resources/files/Backgrounds/132278236-download_url-f6fd898f-26bc-4af2-ace0-7de650277f2d_G_b_Eb2WAAAJys_.webp');

// ------------------------------------------------------------------ nós ---
let nodeId = 0;
const created = [];
class Node {
  constructor(type) {
    this.type = type; this.id = `${++nodeId}:${nodeId}`; this.children = []; this.parent = null;
    this.name = ''; this.x = 0; this.y = 0; this.width = 100; this.height = 100;
    this.fills = []; this.strokes = []; this.effects = [];
    this.strokeWeight = 1; this.strokeAlign = 'INSIDE'; this.cornerRadius = 0;
    this.topLeftRadius = 0; this.topRightRadius = 0; this.bottomLeftRadius = 0; this.bottomRightRadius = 0;
    this.opacity = 1; this.blendMode = 'NORMAL'; this.rotation = 0;
    this.clipsContent = false; this.locked = false;
    this.characters = ''; this.fontSize = 12; this.fontName = null;
    this.textAlignHorizontal = 'LEFT'; this.textAlignVertical = 'TOP';
    this.textAutoResize = 'NONE'; this.letterSpacing = { unit: 'PERCENT', value: 0 };
    this.vectorPaths = [];
  }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  insertChild(i, c) { c.parent = this; this.children.splice(i, 0, c); return c; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter((x) => x !== this); this.parent = null; }
  resize(w, h) { this.width = w; this.height = h; }
  clone() { const c = new Node(this.type); Object.assign(c, this, { children: [], id: `${++nodeId}:${nodeId}` }); return c; }
}

globalThis.figma = {
  currentPage: { selection: [] },
  viewport: { scrollAndZoomIntoView: () => {} },
  createFrame: () => { const n = new Node('FRAME'); created.push(n); return n; },
  createRectangle: () => { const n = new Node('RECTANGLE'); created.push(n); return n; },
  createText: () => { const n = new Node('TEXT'); created.push(n); return n; },
  createVector: () => { const n = new Node('VECTOR'); created.push(n); return n; },
  createEllipse: () => { const n = new Node('ELLIPSE'); created.push(n); return n; },
  group: (nodes) => { const g = new Node('GROUP'); nodes.forEach((n) => g.appendChild(n)); return g; },
  listAvailableFontsAsync: async () => [{ fontName: { family: 'DejaVu Sans', style: 'Bold' } }],
  loadFontAsync: async () => {},
  getNodeByIdAsync: async () => null,
};

const src = fs.readFileSync(path.join(ROOT, 'figma/nexus-shop-hud.figma.js'), 'utf8');
const body = src
  .replace(/\nawait main\(\);\s*$/, '\n')
  .replace("const FRAME_ID = null;", "const FRAME_ID = null;")
  .replace(/studs: null,/, "studs: '__STUD__',")
  .replace(/render: null,/, "render: '__RENDER__',")
  .replace(/scene: null,/, "scene: '__SCENE__',");
if (!/__STUD__/.test(body) || !/__RENDER__/.test(body)) { console.error('não consegui injetar os hashes de teste'); process.exit(1); }

const run = new Function('figma', `return (async () => { ${body} \n return await main(); })();`);
const quiet = console.log;
console.log = () => {};
const res = await run(globalThis.figma);
console.log = quiet;
const screen = created.find((n) => n.id === res.frame);
if (!screen) { console.error('frame não encontrado'); process.exit(1); }

// ---------------------------------------------------------------- canvas ---
const imgCache = new Map();
async function img(p) {
  if (!imgCache.has(p)) imgCache.set(p, await loadImage(p));
  return imgCache.get(p);
}
const studImg = await img(studPath);
const renderImg = await img(renderPath);
const sceneImg = await img(scenePath);
const studTile = createCanvas(studImg.width, studImg.height);
studTile.getContext('2d').drawImage(studImg, 0, 0);
const studPatternBase = studTile;

const canvas = createCanvas(1920, 1080);
const ctx = canvas.getContext('2d');
const col = (c, a = 1) => `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${(c.a ?? 1) * a})`;

const radii = (r) => (typeof r === 'number'
  ? { tl: r, tr: r, br: r, bl: r }
  : { tl: r.topLeft || 0, tr: r.topRight || 0, br: r.bottomRight || 0, bl: r.bottomLeft || 0 });

function pathInto(p, x, y, w, h, r) {
  const lim = Math.max(0, Math.min(w, h) / 2);
  const raw = radii(r);
  const rr = { tl: Math.min(raw.tl, lim), tr: Math.min(raw.tr, lim), br: Math.min(raw.br, lim), bl: Math.min(raw.bl, lim) };
  p.moveTo(x + rr.tl, y);
  p.lineTo(x + w - rr.tr, y); p.quadraticCurveTo(x + w, y, x + w, y + rr.tr);
  p.lineTo(x + w, y + h - rr.br); p.quadraticCurveTo(x + w, y + h, x + w - rr.br, y + h);
  p.lineTo(x + rr.bl, y + h); p.quadraticCurveTo(x, y + h, x, y + h - rr.bl);
  p.lineTo(x, y + rr.tl); p.quadraticCurveTo(x, y, x + rr.tl, y);
  p.closePath();
}

function roundRectPath(c, x, y, w, h, r) {
  c.beginPath();
  pathInto(c, x, y, w, h, r);
}

function fillPaint(c, paints, x, y, w, h, node) {
  if (!paints || !paints.length) return false;
  const f = paints[0];
  if (f.type === 'SOLID') { c.fillStyle = col(f.color); c.fillRect(x, y, w, h); return true; }
  if (f.type === 'IMAGE') {
    const im = f.imageHash === '__STUD__' ? studPatternBase : f.imageHash === '__RENDER__' ? renderImg : sceneImg;
    c.save(); roundRectPath(c, x, y, w, h, node.cornerRadius || 0); c.clip();
    if (f.scaleMode === 'TILE') {
      const sw = studPatternBase.width * (f.scalingFactor || 1);
      const sh = studPatternBase.height * (f.scalingFactor || 1);
      for (let ty = y - sh; ty < y + h; ty += sh) {
        for (let tx = x - sw; tx < x + w; tx += sw) c.drawImage(studPatternBase, tx, ty, sw, sh);
      }
    } else if (f.scaleMode === 'FILL') {
      const scale = Math.max(w / im.width, h / im.height);
      c.drawImage(im, x + (w - im.width * scale) / 2, y + (h - im.height * scale) / 2, im.width * scale, im.height * scale);
    } else {
      const scale = Math.min(w / im.width, h / im.height) * (node.type === 'RECTANGLE' && node.name === 'render' ? 1.35 : 1);
      c.drawImage(im, x + (w - im.width * scale) / 2, y + (h - im.height * scale) / 2, im.width * scale, im.height * scale);
    }
    c.restore(); return true;
  }
  if (f.type === 'GRADIENT_LINEAR') {
    const g = c.createLinearGradient(x, y, x, y + h);
    f.gradientStops.forEach((s) => g.addColorStop(Math.min(1, Math.max(0, s.position)), col(s.color)));
    c.fillStyle = g; c.fillRect(x, y, w, h); return true;
  }
  if (f.type === 'GRADIENT_RADIAL') {
    const g = c.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.2, x + w / 2, y + h / 2, Math.max(w, h) * 0.62);
    f.gradientStops.forEach((s) => g.addColorStop(Math.min(1, Math.max(0, s.position)), col(s.color)));
    c.fillStyle = g; c.fillRect(x, y, w, h); return true;
  }
  return false;
}

function strokePaint(c, node, x, y, w, h) {
  if (!node.strokes || !node.strokes.length || !node.strokeWeight) return;
  const s = node.strokes[0];
  c.strokeStyle = s.type === 'SOLID' ? col(s.color) : '#000';
  c.lineWidth = node.strokeWeight;
  const off = node.strokeAlign === 'OUTSIDE' ? node.strokeWeight / 2 : -node.strokeWeight / 2;
  roundRectPath(c, x - off, y - off, w + off * 2, h + off * 2, typeof node.cornerRadius === 'number' ? node.cornerRadius : 0);
  c.stroke();
}

function draw(node, ox, oy, alpha = 1) {
  const x = ox + node.x, y = oy + node.y, w = node.width, h = node.height;
  const a = alpha * (node.opacity ?? 1);
  const isClip = node.clipsContent;
  {
    ctx.save();
    if (isClip) {
      const cp = new Path2D();
      pathInto(cp, x, y, w, h, node.cornerRadius || 0);
      ctx.clip(cp);
    }
    if (a < 1) ctx.globalAlpha = a;

    if (node.type === 'RECTANGLE' || node.type === 'FRAME' || node.type === 'GROUP') {
      if (node.fills && node.fills.length) fillPaint(ctx, node.fills, x, y, w, h, node);
      if (node.type === 'RECTANGLE') strokePaint(ctx, node, x, y, w, h);
      if (node.type === 'FRAME' && !isClip) {
        // frames sem clip ainda podem ter stroke (ex.: focus ring)
        strokePaint(ctx, node, x, y, w, h);
      }
      if (node.effects && node.effects.length) {
        const e = node.effects[0];
        if (e.type === 'DROP_SHADOW') {
          ctx.save();
          ctx.globalAlpha = a * (e.color.a ?? 0.5);
          ctx.fillStyle = col(e.color);
          ctx.fillRect(x + e.offset.x, y + e.offset.y, w, h);
          ctx.restore();
        }
      }
    }

    if (node.type === 'TEXT') {
      const fam = (node.fontName && node.fontName.family) || 'DejaVu Sans';
      const weight = (node.fontName && /Bold|Black|Extra/i.test(node.fontName.style)) ? 'bold' : 'normal';
      const size = node.fontSize || 12;
      ctx.font = `${weight} ${size}px "${fam}"`;
      ctx.textBaseline = 'middle';
      const track = node.letterSpacing && node.letterSpacing.unit === 'PERCENT' ? (node.letterSpacing.value / 100) * size : 0;
      ctx.textAlign = node.textAlignHorizontal === 'CENTER' ? 'center' : node.textAlignHorizontal === 'RIGHT' ? 'right' : 'left';
      const tx = node.textAlignHorizontal === 'CENTER' ? x + w / 2 : node.textAlignHorizontal === 'RIGHT' ? x + w : x;
      const ty = y + h / 2;
      if (node.strokes && node.strokes.length && node.strokeWeight) {
        ctx.lineWidth = node.strokeWeight * 2;
        ctx.strokeStyle = col(node.strokes[0].color);
        ctx.lineJoin = 'round';
        drawTracked(ctx, node.characters, tx, ty, track, true);
      }
      if (node.effects && node.effects.length && node.effects[0].type === 'DROP_SHADOW') {
        ctx.save(); ctx.globalAlpha = a * 0.8; ctx.fillStyle = col(node.effects[0].color);
        drawTracked(ctx, node.characters, tx, ty + node.effects[0].offset.y, track, false); ctx.restore();
      }
      ctx.fillStyle = col(node.fills[0].color);
      drawTracked(ctx, node.characters, tx, ty, track, false);
    }

    if (node.type === 'VECTOR' && node.vectorPaths.length) {
      const p = node.vectorPaths[0].data;
      // parse simples do caminho "M x y L x y L x y L x y Z"
      const parts = p.match(/[MLZ][^MLZ]*/g) || [];
      parts.forEach((seg) => {
        const t = seg[0]; const v = (seg.slice(1).match(/-?\d+(\.\d+)?/g) || []).map(Number);
        if (t === 'M') ctx.moveTo(x + v[0], y + v[1]);
        else if (t === 'L') ctx.lineTo(x + v[0], y + v[1]);
        else if (t === 'Z') ctx.closePath();
      });
      if (node.fills.length) { ctx.fillStyle = col(node.fills[0].color); ctx.fill(); }
      if (node.strokes.length) { ctx.strokeStyle = col(node.strokes[0].color); ctx.lineWidth = node.strokeWeight * 2; ctx.lineJoin = 'round'; ctx.stroke(); }
    }

    for (const ch of node.children) draw(ch, x, y, a);
    ctx.restore();
  }
}

function drawTracked(c, text, x, y, track, strokeMode) {
  if (!track) {
    if (strokeMode) c.strokeText(text, x, y); else c.fillText(text, x, y);
    return;
  }
  const align = c.textAlign;
  const total = c.measureText(text).width + track * (text.length - 1);
  let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
  const prev = c.textAlign; c.textAlign = 'left';
  for (const ch of text) {
    if (strokeMode) c.strokeText(ch, cx, y); else c.fillText(ch, cx, y);
    cx += c.measureText(ch).width + track;
  }
  c.textAlign = prev;
}

ctx.fillStyle = '#090D16'; ctx.fillRect(0, 0, 1920, 1080);
draw(screen, 0, 0, 1);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log(`${OUT} — ${created.length} nós, ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
