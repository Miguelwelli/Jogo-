// Gera o tile de stud para Roblox: branco/preto com alfa (Roblox não tem blend Overlay).
// Baseado em examples/stud-shop/scripts/bake_roblox_studs.py da skill.
// Uso: node scripts/bake-stud-tile.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const ROOT = process.cwd();
const SRC = path.join(ROOT, '.skills/ui-figma-roblox/assets/kek-ui-essentials/kek_stud.png');
const OUT_DIR = path.join(ROOT, 'roblox-assets');
const OUT = path.join(OUT_DIR, 'stud_tile.png');

const im = await loadImage(SRC);
// o pitch do stud é 64 px -> recorte de 256 px = 4×4 studs e emenda perfeita
const SIZE = 256;
const c = createCanvas(SIZE, SIZE);
const x = c.getContext('2d');
x.drawImage(im, 0, 0, SIZE, SIZE, 0, 0, SIZE, SIZE);
const data = x.getImageData(0, 0, SIZE, SIZE);

const lum = new Float32Array(SIZE * SIZE);
for (let i = 0; i < SIZE * SIZE; i += 1) {
  const r = data.data[i * 4]; const g = data.data[i * 4 + 1]; const b = data.data[i * 4 + 2];
  lum[i] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const sorted = Array.from(lum).sort((a, b) => a - b);
const base = sorted[Math.floor(sorted.length / 2)];
const lo = sorted[0];
const hi = sorted[sorted.length - 1];

for (let i = 0; i < SIZE * SIZE; i += 1) {
  const v = lum[i];
  let rgb; let a;
  if (v >= base) {
    const t = (v - base) / (hi - base + 1);
    rgb = [255, 255, 255];
    a = Math.min(255, Math.round(t * 255));
  } else {
    const t = (base - v) / (base - lo + 1);
    rgb = [0, 0, 0];
    a = Math.min(255, Math.round(t * 255));
  }
  data.data[i * 4] = rgb[0]; data.data[i * 4 + 1] = rgb[1]; data.data[i * 4 + 2] = rgb[2];
  data.data[i * 4 + 3] = a;
}
x.putImageData(data, 0, 0);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, c.toBuffer('image/png'));
const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
console.log(`${path.relative(ROOT, OUT)} — ${SIZE}×${SIZE}, ${kb} KB · TileSize 96×96 = studs de 24 px`);
