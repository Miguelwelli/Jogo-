// Renderiza a árvore que roblox/nexus-ui.luau cria, aproximando o Roblox:
// UDim2 offset/scale, AnchorPoint, UIScale, UICorner, UIStroke Border,
// ImageLabel Tile/Fit, UIGradient, CanvasGroup (clip), Rotation e ZIndex.
// Uso: node scripts/preview-roblox-ui.mjs [saida.png]
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage, Path2D } from '@napi-rs/canvas';
import { LuaFactory } from 'wasmoon';

const ROOT = process.cwd();
const OUT = process.argv[2] || 'preview/nexus-roblox.png';
const W = 1920;
const H = 1080;

const SRC = fs.readFileSync(path.join(ROOT, 'roblox/nexus-ui.luau'), 'utf8');

// ------------------------------------------------------------------ stub ---
const STUB = `
NODES = {}
GUI_ROOT = nil
NP = {}
CH = {}

local function makeClass(class, props, parent)
  local o = { className = class, attrs = {} }
  local p = {}
  local kids = {}
  local holder = {}
  rawset(holder, "_props", p)
  rawset(holder, "_children", kids)

  function o:SetAttribute(k, v) self.attrs[k] = v end
  function o:GetAttribute(k) return self.attrs[k] end
  function o:IsA(c) return self.className == c end
  function o:GetFullName() return p.Name or "?" end
  function o:Destroy() end
  function o:GetPropertyChangedSignal() return { Connect = function() end } end
  function o:FindFirstChild(n)
    for _, c in ipairs(kids) do if NP[c].Name == n then return c end end
    return nil
  end
  function o:GetDescendants() return {} end
  function o:WaitForChild(n) return self:FindFirstChild(n) end

  setmetatable(o, {
    __index = function(t, k)
      if k == "Parent" then return t.parent end
      if k == "children" then return kids end
      if k == "props" then return p end
      local fn = rawget(t, k)
      if fn ~= nil then return fn end
      return p[k]
    end,
    __newindex = function(t, k, v)
      if k == "Parent" then
        t.parent = v
        if v ~= nil then
          local vk = v.children
          if vk ~= nil then vk[#vk + 1] = t end
        end
      else
        p[k] = v
      end
    end,
  })

  if props then
    for k, v in pairs(props) do
      if k == "Parent" then
        o.Parent = v
      else
        p[k] = v
      end
    end
  end
  if parent then o.Parent = parent end

  NP[o] = p
  CH[o] = kids
  NODES[#NODES + 1] = o
  if class == "ScreenGui" then GUI_ROOT = o end
  return o
end

Instance = { new = function(class, props, parent) return makeClass(class, props, parent) end }
Enum = setmetatable({}, { __index = function(_, k) return setmetatable({}, { __index = function(_, k2) return k .. "." .. k2 end }) end })
Color3 = {
  new = function(r, g, b) return { R = r or 0, G = g or 0, B = b or 0 } end,
  fromHex = function(h) return { R = tonumber(h:sub(2,3),16)/255, G = tonumber(h:sub(4,5),16)/255, B = tonumber(h:sub(6,7),16)/255 } end,
}
UDim = { new = function(s, o) return { Scale = s or 0, Offset = o or 0 } end }
UDim2 = {
  new = function(xs, xo, ys, yo) return { X = { Scale = xs or 0, Offset = xo or 0 }, Y = { Scale = ys or 0, Offset = yo or 0 } } end,
  fromScale = function(x, y) return { X = { Scale = x or 0, Offset = 0 }, Y = { Scale = y or 0, Offset = 0 } } end,
  fromOffset = function(x, y) return { X = { Scale = 0, Offset = x or 0 }, Y = { Scale = 0, Offset = y or 0 } } end,
}
Vector2 = { new = function(x, y) return { X = x or 0, Y = y or 0 } end }
ColorSequence = { new = function(a, b) return { a, b } end }
NumberSequence = { new = function() return {} end }
NumberSequenceKeypoint = { new = function(t, v) return { t, v } end }
Font = { fromEnum = function(e) return e end }
TweenInfo = { new = function() return {} end }
workspace = { CurrentCamera = { ViewportSize = { X = 1920, Y = 1080 } } }
task = { wait = function() end, spawn = function(f) f() end }
warn = function() end
game = {
  GetService = function(_, name)
    if name == "StarterGui" then return { FindFirstChild = function() return nil end } end
    if name == "TweenService" then return { Create = function() return { Play = function() end } end } end
    if name == "Players" then return { LocalPlayer = { Name = "P" } } end
    if name == "MarketplaceService" then return { PromptProductPurchase = function() end } end
    return {}
  end,
}
`;

// ---------------------------------------------------------- serialização ---
const SERIALIZE = String.raw`
local function esc(str)
  local out = tostring(str)
  out = out:gsub("\\", "\\\\")
  out = out:gsub('"', '\\"')
  out = out:gsub("\n", "\\n")
  out = out:gsub("\r", "\\r")
  out = out:gsub("\t", "\\t")
  return '"' .. out .. '"'
end

local function encVal(v)
  local tv = type(v)
  if tv == "number" or tv == "boolean" then return tostring(v) end
  if tv == "string" then return esc(v) end
  if tv ~= "table" then return "null" end
  if v.R ~= nil then
    return string.format('{"kind":"color","R":%.5f,"G":%.5f,"B":%.5f}', v.R, v.G, v.B)
  end
  if v.X ~= nil and v.Y ~= nil and type(v.X) == "table" then
    return string.format('{"kind":"udim2","xs":%.4f,"xo":%.4f,"ys":%.4f,"yo":%.4f}', v.X.Scale, v.X.Offset, v.Y.Scale, v.Y.Offset)
  end
  if v.X ~= nil and v.Y ~= nil and type(v.X) == "number" then
    return string.format('{"kind":"vector2","X":%.4f,"Y":%.4f}', v.X, v.Y)
  end
  if v.Scale ~= nil and v.Offset ~= nil then
    return string.format('{"kind":"udim","s":%.4f,"o":%.4f}', v.Scale, v.Offset)
  end
  if v[1] ~= nil and type(v[1]) == "table" and v[1].R ~= nil then
    return string.format('{"kind":"colorseq","a":{"R":%.4f,"G":%.4f,"B":%.4f},"b":{"R":%.4f,"G":%.4f,"B":%.4f}}',
      v[1].R, v[1].G, v[1].B, v[2].R, v[2].G, v[2].B)
  end
  return "null"
end

local function enc(node)
  local props = NP[node] or {}
  local kids = CH[node] or {}
  local parts = {}
  for k, v in pairs(props) do
    local e = encVal(v)
    if e ~= "null" then parts[#parts + 1] = esc(k) .. ":" .. e end
  end
  local children = {}
  for _, c in ipairs(kids) do children[#children + 1] = enc(c) end
  return '{"class":' .. esc(node.className) .. ',"props":{' .. table.concat(parts, ",") .. '},"children":[' .. table.concat(children, ",") .. ']}'
end

return enc(GUI_ROOT)
`;

// ------------------------------------------------------------- execução ---
const lua = await new LuaFactory().createEngine();
await lua.doString(STUB);
await lua.global.set('__SRC', SRC);
await lua.doString('local ok, err = pcall(function() local chunk = assert(load(__SRC, "ui")); chunk() end); BUILD_ERROR = tostring(err)');
const buildError = await lua.doString('return BUILD_ERROR');
if (buildError && buildError !== 'nil') {
  console.error('falha ao executar o Luau:', buildError);
  process.exit(1);
}
await lua.doString('JSON_OUT = (function()\n' + SERIALIZE + '\nend)()\nreturn nil');
const rawJson = await lua.global.get('JSON_OUT');
if (!rawJson) {
  console.error('serialização falhou');
  process.exit(1);
}
const TREE = JSON.parse(rawJson);
const countNodes = (n) => 1 + (n.children || []).reduce((acc, c) => acc + countNodes(c), 0);
console.log(`árvore: ${TREE.class} · ${countNodes(TREE)} nós · ${(rawJson.length / 1024).toFixed(0)} KB de JSON`);

// --------------------------------------------------------------- desenho ---
const canvas = createCanvas(W, H);
const ctx = canvas.getContext('2d');
const studImg = await loadImage(path.join(ROOT, 'roblox-assets/stud_tile.png'));
const tile96 = createCanvas(96, 96);
tile96.getContext('2d').drawImage(studImg, 0, 0, 96, 96);
const renderImg = await loadImage(path.join(ROOT, '.skills/ui-figma-roblox/assets/ui-resources/files/Renders/815490552-download_url-4c39aa1c-a32d-45ec-ba57-98c838e25b84_Noob_Run.webp'));

const col = (c, a = 1) => `rgba(${Math.round(c.R * 255)},${Math.round(c.G * 255)},${Math.round(c.B * 255)},${a})`;
const rounded = (p, x, y, w, h, r) => {
  const rr = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  p.moveTo(x + rr, y);
  p.lineTo(x + w - rr, y); p.quadraticCurveTo(x + w, y, x + w, y + rr);
  p.lineTo(x + w, y + h - rr); p.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  p.lineTo(x + rr, y + h); p.quadraticCurveTo(x, y + h, x, y + h - rr);
  p.lineTo(x, y + rr); p.quadraticCurveTo(x, y, x + rr, y);
  p.closePath();
};
const sizeOf = (node, pw, ph) => {
  const s = node.props.Size;
  if (!s || s.kind !== 'udim2') return [pw, ph];
  return [s.xs * pw + s.xo, s.ys * ph + s.yo];
};
const posOf = (node, pw, ph, w, h) => {
  const p = node.props.Position;
  if (!p || p.kind !== 'udim2') return [0, 0];
  const ap = node.props.AnchorPoint;
  const ax = ap && ap.kind === 'vector2' ? ap.X : 0;
  const ay = ap && ap.kind === 'vector2' ? ap.Y : 0;
  return [p.xs * pw + p.xo - w * ax, p.ys * ph + p.yo - h * ay];
};
const childOf = (node, cls) => (node.children || []).find((c) => c.class === cls);
const cornerRadius = (node) => {
  const c = childOf(node, 'UICorner');
  const r = c && c.props.CornerRadius;
  return r && r.kind === 'udim' ? r.o : 0;
};

const SKIP = new Set(['UICorner', 'UIStroke', 'UIGradient', 'UIScale', 'LocalScript', 'BindableEvent', 'UIAspectRatioConstraint']);

function drawNode(node, pw, ph, inheritedScale, inheritedAlpha) {
  const p = node.props || {};
  if (p.Visible === false) return;
  if (SKIP.has(node.class) || node.class === 'ScreenGui') {
    for (const c of node.children || []) drawNode(c, pw, ph, inheritedScale, inheritedAlpha);
    return;
  }

  const scaleNode = childOf(node, 'UIScale');
  const uiScale = inheritedScale * (scaleNode ? (scaleNode.props.Scale || 1) : 1);
  const [rawW, rawH] = sizeOf(node, pw, ph);
  const w = rawW * uiScale;
  const h = rawH * uiScale;
  const [x, y] = posOf(node, pw, ph, w, h);
  // transparência de fundo vale só para o próprio nó; o grupo é que afeta os filhos
  const alpha = inheritedAlpha * (1 - (p.GroupTransparency ?? 0));
  const bgAlpha = alpha * (1 - (p.BackgroundTransparency ?? 0));

  ctx.save();
  ctx.translate(x, y);
  if (p.Rotation) {
    ctx.translate(w / 2, h / 2);
    ctx.rotate((p.Rotation * Math.PI) / 180);
    ctx.translate(-w / 2, -h / 2);
  }
  const radius = cornerRadius(node);

  const clipChildren = p.ClipsDescendants === true || node.class === 'CanvasGroup';
  if (clipChildren) {
    const cp = new Path2D();
    rounded(cp, 0, 0, w, h, radius);
    ctx.clip(cp);
  }

  // fundo
  if (p.BackgroundColor3 && (p.BackgroundTransparency ?? 0) < 1) {
    ctx.globalAlpha = bgAlpha;
    ctx.fillStyle = col(p.BackgroundColor3);
    if (radius > 0) { const bp = new Path2D(); rounded(bp, 0, 0, w, h, radius); ctx.fill(bp); }
    else ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  // imagem
  if (node.class === 'ImageLabel') {
    ctx.globalAlpha = alpha * (1 - (p.ImageTransparency ?? 0));
    if (p.ScaleType === 'ScaleType.Tile') {
      const t = p.TileSize;
      const tw = (t && t.kind === 'udim2' ? t.xo : 96) * uiScale;
      const th = (t && t.kind === 'udim2' ? t.yo : 96) * uiScale;
      for (let ty = 0; ty < h; ty += th) {
        for (let tx = 0; tx < w; tx += tw) ctx.drawImage(tile96, tx, ty, tw, th);
      }
    } else if (p.Image && p.Image !== '') {
      const s = Math.min(w / renderImg.width, h / renderImg.height);
      ctx.drawImage(renderImg, (w - renderImg.width * s) / 2, (h - renderImg.height * s) / 2, renderImg.width * s, renderImg.height * s);
    }
    ctx.globalAlpha = 1;
  }

  // UIGradient por cima do fundo
  const grad = childOf(node, 'UIGradient');
  if (grad && grad.props.Color) {
    const c = grad.props.Color;
    ctx.globalAlpha = bgAlpha;
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, col(c.a));
    g.addColorStop(1, col(c.b));
    ctx.fillStyle = g;
    if (radius > 0) { const gp = new Path2D(); rounded(gp, 0, 0, w, h, radius); ctx.fill(gp); }
    else ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
  }

  // texto
  if ((node.class === 'TextLabel' || node.class === 'TextButton') && p.Text && p.Text !== '') {
    const size = (p.TextSize || 14) * uiScale;
    const bold = String(p.Font || '').includes('Black');
    ctx.font = `${bold ? 'bold ' : ''}${size}px "DejaVu Sans"`;
    ctx.textBaseline = 'middle';
    const align = String(p.TextXAlignment || '');
    ctx.textAlign = align.includes('Left') ? 'left' : align.includes('Right') ? 'right' : 'center';
    const tx = ctx.textAlign === 'left' ? 0 : ctx.textAlign === 'right' ? w : w / 2;
    const stroke = childOf(node, 'UIStroke');
    if (stroke && (stroke.props.Thickness || 0) > 0) {
      ctx.lineWidth = (stroke.props.Thickness || 1) * 2 * uiScale;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = stroke.props.Color ? col(stroke.props.Color) : '#090D16';
      ctx.lineJoin = 'round';
      ctx.strokeText(p.Text, tx, h / 2);
    }
    ctx.globalAlpha = alpha * (1 - (p.TextTransparency ?? 0));
    ctx.fillStyle = p.TextColor3 ? col(p.TextColor3) : '#ffffff';
    ctx.fillText(p.Text, tx, h / 2);
    ctx.globalAlpha = 1;
  }

  // contorno do frame
  const frameStroke = childOf(node, 'UIStroke');
  if (frameStroke && (frameStroke.props.Thickness || 0) > 0 && node.class !== 'TextLabel' && node.class !== 'TextButton') {
    const lw = (frameStroke.props.Thickness || 1) * 2 * uiScale;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = frameStroke.props.Color ? col(frameStroke.props.Color) : '#000';
    ctx.lineWidth = lw;
    const sp = new Path2D();
    rounded(sp, -lw / 2, -lw / 2, w + lw, h + lw, radius + lw / 2);
    ctx.stroke(sp);
  }

  for (const child of node.children || []) drawNode(child, w, h, uiScale, alpha);
  ctx.restore();
}

ctx.fillStyle = '#090D16';
ctx.fillRect(0, 0, W, H);
drawNode(TREE, W, H, 1, 1);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log(`${OUT} — ${(fs.statSync(OUT).size / 1024).toFixed(0)} KB`);
