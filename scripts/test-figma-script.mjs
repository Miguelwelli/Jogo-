// Teste do script use_figma sem o Figma: stub mínimo da API + checagens.
// Roda com: node scripts/test-figma-script.mjs
import fs from 'node:fs';
import path from 'node:path';

let nodeId = 0;
const created = [];
const warnings = [];
const log = (...a) => console.log(...a);

class Node {
  constructor(type) {
    this.type = type;
    this.id = `${++nodeId}:${nodeId}`;
    this.children = [];
    this.parent = null;
    this.name = '';
    this.x = 0; this.y = 0; this.width = 100; this.height = 100;
    this.fills = []; this.strokes = []; this.effects = [];
    this.strokeWeight = 1; this.strokeAlign = 'INSIDE'; this.cornerRadius = 0;
    this.opacity = 1; this.blendMode = 'NORMAL'; this.rotation = 0;
    this.clipsContent = false; this.locked = false;
    this.characters = ''; this.fontSize = 12; this.fontName = null;
    this.textAlignHorizontal = 'LEFT'; this.textAlignVertical = 'TOP';
    this.textAutoResize = 'NONE'; this.letterSpacing = { unit: 'PERCENT', value: 0 };
    this.vectorPaths = [];
    created.push(this);
  }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  insertChild(i, c) { c.parent = this; this.children.splice(i, 0, c); return c; }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((c) => c !== this);
    this.parent = null;
  }
  resize(w, h) {
    if (typeof w !== 'number' || typeof h !== 'number' || Number.isNaN(w) || Number.isNaN(h)) {
      throw new Error(`resize inválido em ${this.name || this.type}: ${w}×${h}`);
    }
    if (w < 0 || h < 0) throw new Error(`resize negativo em ${this.name || this.type}: ${w}×${h}`);
    this.width = w; this.height = h;
  }
  rescale(scale) { this.width *= scale; this.height *= scale; this.children.forEach((c) => { c.x *= scale; c.y *= scale; c.rescale(scale); }); }
  clone() { const c = new Node(this.type); Object.assign(c, this, { children: [], id: `${++nodeId}:${nodeId}` }); created.push(c); return c; }
}

const fonts = [
  { fontName: { family: 'Baloo 2', style: 'ExtraBold' } },
  { fontName: { family: 'Inter', style: 'Regular' } },
];
const errors = [];

globalThis.figma = {
  currentPage: { selection: [] },
  viewport: { scrollAndZoomIntoView: () => {} },
  createFrame: () => new Node('FRAME'),
  createRectangle: () => new Node('RECTANGLE'),
  createText: () => new Node('TEXT'),
  createVector: () => new Node('VECTOR'),
  createEllipse: () => new Node('ELLIPSE'),
  createImage: (bytes) => {
    if (!(bytes instanceof Uint8Array) || bytes.length < 100) throw new Error(`createImage recebeu ${typeof bytes}`);
    const sig = Array.from(bytes.slice(0, 8)).join(',');
    if (sig !== '137,80,78,71,13,10,26,10') throw new Error('createImage: bytes não são PNG');
    return { hash: `img-${bytes.length}` };
  },
  group: (nodes, parent) => { const g = new Node('GROUP'); parent.appendChild(g); nodes.forEach((n) => n.parent === parent && g.appendChild(n)); return g; },
  listAvailableFontsAsync: async () => fonts,
  loadFontAsync: async (f) => { if (!fonts.find((x) => x.fontName.family === f.family && x.fontName.style === f.style)) throw new Error(`fonte ausente: ${f.family} ${f.style}`); },
  getNodeByIdAsync: async () => null,
};

// captura console.log do script
const origLog = console.log;
const scriptLogs = [];
console.log = (...a) => { scriptLogs.push(a.join(' ')); };

const src = fs.readFileSync(path.join(process.cwd(), 'figma/nexus-ui.figma.js'), 'utf8');
const body = src.replace(/\nawait main\(\);\s*$/, '\n');
const mod = new Function('figma', `return (async () => { ${body} \n return await main(); })();`);
let result;
try {
  result = await mod(globalThis.figma);
} catch (e) {
  console.log = origLog;
  console.error('FALHOU durante a execução:', e && e.message);
  process.exit(1);
}
console.log = origLog;

// ---- checagens ----
const texts = created.filter((n) => n.type === 'TEXT');
const rects = created.filter((n) => n.type === 'RECTANGLE');
const frames = created.filter((n) => n.type === 'FRAME');

const nullFills = created.filter((n) => n.fills === null || n.fills === undefined);
const badColor = [];
const walk = (n) => {
  for (const f of n.fills || []) {
    if (f.type === 'SOLID' && (!f.color || [f.color.r, f.color.g, f.color.b].some((v) => typeof v !== 'number' || Number.isNaN(v)))) badColor.push(`${n.name} (solid ${JSON.stringify(f.color)})`);
    if (f.type && f.type.startsWith('GRADIENT') && !Array.isArray(f.gradientStops)) badColor.push(`${n.name} (gradient sem stops)`);
  }
  (n.children || []).forEach(walk);
};
created.forEach(walk);

const emptyText = texts.filter((t) => !t.characters);
const overlaps = [];
const screen = result ? created.find((n) => n.id === result.frame) || created[created.length - 1] : null;

printSummary();

function printSummary() {
  const skills = [
    ['nós criados', created.length],
    ['frames', frames.length],
    ['retângulos', rects.length],
    ['textos', texts.length],
    ['textos vazios', emptyText.length],
    ['fills inválidas', nullFills.length],
    ['cores inválidas', badColor.length],
    ['fonte escolhida', result && `${result.font.family} ${result.font.style}`],
  ];
  for (const [k, v] of skills) origLog(`  ${k.padEnd(18)} ${v}`);
  const warns = scriptLogs.filter((l) => l.startsWith('[nexus]'));
  origLog('\n  logs do script:');
  warns.slice(0, 8).forEach((l) => origLog('   ', l));
  if (emptyText.length) {
    origLog('\n  textos vazios:', emptyText.map((t) => t.name).join(', '));
  }
  if (badColor.length) origLog('\n  cores inválidas em:', [...new Set(badColor)].join(', '));
  if (emptyText.length || badColor.length) process.exitCode = 1;
}
