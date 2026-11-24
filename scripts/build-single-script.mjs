// Gera figma/nexus-ui.figma.js (script único, arte embutida) a partir de
// figma/src/nexus-ui.template.js + assets locais da skill.
// Uso: node scripts/build-single-script.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const ROOT = process.cwd();
const SKILL = path.join(ROOT, '.skills/ui-figma-roblox');
const TEMPLATE = path.join(ROOT, 'figma/src/nexus-ui.template.js');
const OUT = path.join(ROOT, 'figma/nexus-ui.figma.js');

const STUD_SRC = path.join(SKILL, 'assets/kek-ui-essentials/kek_stud.png');
const RENDER_SRC = path.join(SKILL, 'assets/ui-resources/files/Renders/815490552-download_url-4c39aa1c-a32d-45ec-ba57-98c838e25b84_Noob_Run.webp');

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const toB64 = (bytes) => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]; const b = bytes[i + 1]; const c = bytes[i + 2];
    out += B64[a >> 2];
    out += B64[((a & 3) << 4) | ((b ?? 0) >> 4)];
    out += b === undefined ? '=' : B64[((b & 15) << 2) | ((c ?? 0) >> 6)];
    out += c === undefined ? '=' : B64[c & 63];
  }
  return out;
};

// stud: 512×256 mantém o tile sem emenda (o original é 2048×1024 = 4×4 studs)
const stud = await (async () => {
  const im = await loadImage(STUD_SRC);
  const c = createCanvas(512, 256);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(im, 0, 0, 512, 256);
  return c.toBuffer('image/png');
})();

// render: 320×320 PNG com transparência
const render = await (async () => {
  const im = await loadImage(RENDER_SRC);
  const c = createCanvas(320, 320);
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(im, 0, 0, 320, 320);
  return c.toBuffer('image/png');
})();

const studB64 = toB64(stud);
const renderB64 = toB64(render);

// confere round-trip do encoder
const back = Buffer.from(studB64, 'base64');
if (!back.equals(stud)) throw new Error('encoder base64 falhou no round-trip');

const template = fs.readFileSync(TEMPLATE, 'utf8');
if (!template.includes("'__STUD_B64__'") || !template.includes("'__RENDER_B64__'")) {
  throw new Error('template sem os placeholders __STUD_B64__ / __RENDER_B64__');
}

const banner = `// GERADO por scripts/build-single-script.mjs — não edite este arquivo à mão.
// Fonte: figma/src/nexus-ui.template.js · arte: .skills/ui-figma-roblox/assets/
// stud ${(stud.length / 1024).toFixed(1)} KB · render ${(render.length / 1024).toFixed(1)} KB (antes do base64)
`;

const out = banner + template
  .replace("'__STUD_B64__'", `'${studB64}'`)
  .replace("'__RENDER_B64__'", `'${renderB64}'`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`${path.relative(ROOT, OUT)} — ${kb(Buffer.byteLength(out))} · stud ${kb(stud.length)} · render ${kb(render.length)}`);
