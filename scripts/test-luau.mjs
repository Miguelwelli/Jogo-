// Roda roblox/nexus-ui.luau num stub da API do Roblox (Lua 5.4 via wasmoon).
// Pega erro de sintaxe, propriedade inexistente, divisão por zero, nil, etc.
// Uso: node scripts/test-luau.mjs
import fs from 'node:fs';
import { LuaFactory } from 'wasmoon';

const src = fs.readFileSync('roblox/nexus-ui.luau', 'utf8');

const STUB = String.raw`
-- ============ stub mínimo da API do Roblox ============
created = {}
warnings = {}
ERRORS = {}
COUNT = 0
ALL_OBJECTS = {}
RESET = function() created = {} warnings = {} ERRORS = {} COUNT = 0 ALL_OBJECTS = {} end

local function record(kind, name, props)
  COUNT = COUNT + 1
  local rec = { className = kind, name = props and props.Name or nil, props = props or {} }
  created[#created + 1] = rec
  return rec
end

local ClassDefaults = {
  Frame = { BackgroundTransparency = 0, Visible = true, ClipsDescendants = false, Rotation = 0 },
  CanvasGroup = { BackgroundTransparency = 0 },
  TextLabel = { Text = "", TextSize = 14, TextScaled = false },
  TextButton = { Text = "", AutoButtonColor = true },
  ImageLabel = { Image = "", ImageTransparency = 0 },
  ScreenGui = { Enabled = true },
  LocalScript = { Source = "" },
  BindableEvent = {},
  UIStroke = { Thickness = 1 },
  UICorner = {},
  UIGradient = {},
  UIScale = { Scale = 1 },
  UIAspectRatioConstraint = {},
}

local Object = {}
Object.__index = Object

function Object:__newindex(key, value)
  if key ~= "Parent" then
    local store = rawget(self, "_props")
    if store == nil then store = {}; rawset(self, "_props", store) end
    store[key] = value
  end
  if key == "Parent" then
    rawset(self, "_parent", value)
    if value ~= nil and type(value) == "table" then
      local kids = rawget(value, "_children")
      if kids then kids[#kids + 1] = self end
    end
    return
  end
  if self._class == "Instance" then error("nao deveria") end
  local props = rawget(self, "_props") or {}
  props[key] = value
  rawset(self, "_props", props)
  local defaults = ClassDefaults[self._class] or {}
  if defaults[key] == nil and key ~= "Name" and key ~= "Size" and key ~= "Position" and key ~= "ZIndex"
     and key ~= "BackgroundColor3" and key ~= "BorderSizePixel" and key ~= "TextColor3"
     and key ~= "Font" and key ~= "TextXAlignment" and key ~= "TextYAlignment"
     and key ~= "AutomaticSize" and key ~= "ApplyStrokeMode" and key ~= "LineJoinMode"
     and key ~= "CornerRadius" and key ~= "ScaleType" and key ~= "TileSize" and key ~= "Image"
     and key ~= "ImageTransparency" and key ~= "AnchorPoint" and key ~= "Size"
     and key ~= "Color" and key ~= "Transparency" and key ~= "Rotation" and key ~= "Offset"
     and key ~= "Scale" and key ~= "Text" and key ~= "ClipsDescendants" and key ~= "Visible"
     and key ~= "BackgroundTransparency" and key ~= "TextSize" and key ~= "Source"
     and key ~= "ResetOnSpawn" and key ~= "IgnoreGuiInset" and key ~= "ZIndexBehavior"
     and key ~= "DisplayOrder" and key ~= "FillDirection" and key ~= "HorizontalAlignment"
     and key ~= "VerticalAlignment" and key ~= "Padding" and key ~= "SortOrder"
     and key ~= "LayoutOrder" and key ~= "TextScaled" and key ~= "TextWrapped"
     and key ~= "RichText" and key ~= "BorderMode" and key ~= "ApplyStrokeMode"
     and key ~= "ColorSequence" and key ~= "NumberSequence" and key ~= "Enabled" then
    -- propriedade desconhecida: no Roblox real isto é ERRO
    ERRORS[#ERRORS + 1] = "propriedade inválida: " .. tostring(key) .. " em " .. tostring(rawget(self, "_class"))
  end
  rawset(self, key, value)
end

function Object:__index(key)
  local raw = rawget(self, key)
  if raw ~= nil then return raw end
  local p = rawget(self, "_props")
  if p and p[key] ~= nil then return p[key] end
  if key == "Parent" then return rawget(self, "_parent") end
  if key == "Name" then return rawget(self, "_name") end
  if key == "Size" then return rawget(self, "_size") or "UDim2(0,0,0,0)" end
  if key == "Position" then return rawget(self, "_pos") or "UDim2(0,0,0,0)" end
  if key == "ZIndex" then return rawget(self, "_z") or 1 end
  if key == "AbsoluteSize" then return { X = 100, Y = 100 } end
  if key == "ClassName" then return rawget(self, "_class") end
  local method = Object[key]
  if method then return method end
  error("tentou ler propriedade inexistente '" .. tostring(key) .. "' em " .. tostring(rawget(self, "_class")))
end

function Object:GetDescendants()
  local out = {}
  local function walk(node)
    for _, c in ipairs(rawget(node, "_children") or {}) do
      out[#out + 1] = c
      walk(c)
    end
  end
  walk(self)
  return out
end

function Object:FindFirstChild(name)
  for _, c in ipairs(rawget(self, "_children") or {}) do
    if rawget(c, "_name") == name then return c end
  end
  return nil
end

function Object:IsA(class)
  return rawget(self, "_class") == class
end

function Object:GetFullName() return rawget(self, "_name") or "?" end
function Object:Destroy() self._destroyed = true end
function Object:SetAttribute(k, v) rawset(self, "_attr", (rawget(self, "_attr") or {})); self._attr[k] = v end
function Object:GetAttribute(k) local a = rawget(self, "_attr"); return a and a[k] end
function Object:GetPropertyChangedSignal() return { Connect = function() end } end
function Object:WaitForChild(n) return self:FindFirstChild(n) or new(n, "Frame", self) end

local function WARN_UNKNOWN(msg)
  warnings[#warnings + 1] = msg
end

function newInstance(class, props, parent)
  local o = setmetatable({}, Object)
  rawset(o, "_class", class)
  rawset(o, "_children", {})
  o._children = rawget(o, "_children")
  if ClassDefaults[class] == nil then
    ERRORS[#ERRORS + 1] = "classe desconhecida no stub: " .. class
  end
  if props then
    for k, v in pairs(props) do
      if k == "Parent" then
        o.Parent = v
      else
        o[k] = v
      end
    end
  end
  if parent then o.Parent = parent end
  ALL_OBJECTS[#ALL_OBJECTS + 1] = o
  local reg = record(class, props and props.Name, {})
  rawset(o, "_record", reg)
  return o
end

Instance = { new = newInstance }

Enum = setmetatable({}, { __index = function(_, k) return setmetatable({}, { __index = function(_, k2) return k .. "." .. k2 end }) end })
Color3 = {
  new = function(r, g, b) return { R = r or 0, G = g or 0, B = b or 0 } end,
  fromHex = function(h)
    if type(h) ~= "string" or #h ~= 7 or h:sub(1, 1) ~= "#" then
      ERRORS[#ERRORS + 1] = "Color3.fromHex com valor inválido: " .. tostring(h)
      return { R = 0, G = 0, B = 0 }
    end
    return { R = tonumber(h:sub(2, 3), 16) / 255, G = tonumber(h:sub(4, 5), 16) / 255, B = tonumber(h:sub(6, 7), 16) / 255 }
  end,
}
UDim = { new = function(s, o) return { Scale = s or 0, Offset = o or 0 } end }
UDim2 = {
  new = function(xs, xo, ys, yo) return { X = { Scale = xs or 0, Offset = xo or 0 }, Y = { Scale = ys or 0, Offset = yo or 0 } } end,
  fromScale = function(x, y) return { X = { Scale = x or 0, Offset = 0 }, Y = { Scale = y or 0, Offset = 0 } } end,
  fromOffset = function(x, y) return { X = { Scale = 0, Offset = x or 0 }, Y = { Scale = 0, Offset = y or 0 } } end,
}
Vector2 = { new = function(x, y) return { X = x or 0, Y = y or 0 } end }
ColorSequence = { new = function(a, b) return { a, b } end }
NumberSequence = { new = function(a, b) return { a, b } end }
NumberSequenceKeypoint = { new = function(t, v) return { t, v } end }
Font = { fromEnum = function(e) return e end, fromName = function(f, w) return f end }
TweenInfo = { new = function(t, s, d) return { t, s, d } end }

local function fakeGame()
  return {
    GetService = function(_, name)
      if name == "TweenService" then
        return { Create = function(_, obj, info, props)
          return { Play = function() end }
        end }
      end
      if name == "Players" then
        return { LocalPlayer = { Name = "TestPlayer" } }
      end
      if name == "MarketplaceService" then
        return { PromptProductPurchase = function() end }
      end
      if name == "StarterGui" then
        local sg = newInstance("ScreenGui", { Name = "StarterGuiService" })  -- container
        return {
          FindFirstChild = function(_, n)
            for _, c in ipairs(rawget(sg, "_children")) do if rawget(c, "_name") == n then return c end end
            return nil
          end,
          _children = {},
        }
      end
      error("serviço não stubado: " .. name)
    end,
    CurrentCamera = nil,
  }
end
GAME = fakeGame()
workspace = { CurrentCamera = { ViewportSize = Vector2.new(1920, 1080) } }
game = GAME
warn = function(...) warnings[#warnings + 1] = table.concat({ ... }, " ") end
function STUB_NODES()
  for _, o in ipairs(ALL_OBJECTS) do
    local reg = rawget(o, "_record")
    if reg then
      local p = {}
      for k, v in pairs(rawget(o, "_props") or {}) do p[k] = v end
      reg.props = p
      reg.name = p.Name
    end
  end
  return created
end
task = { wait = function() end, spawn = function(f) f() end }
`;

const lua = await (await new LuaFactory().createEngine());
lua.global.set('__SRC', src);

let result; let err = null;
try {
  await lua.doString(STUB);
  result = await lua.doString(`
    local chunk, compileErr = load(__SRC, "nexus-ui")
    if not chunk then
      ERROR = "sintaxe: " .. tostring(compileErr)
      return "erro de sintaxe"
    end
    RESET()
    local ok, ret = pcall(chunk)
    if not ok then
      ERROR = "runtime: " .. tostring(ret)
      return "erro de execução"
    end
    return tostring(ret)
  `);
} catch (e) {
  err = e.message;
}

const checks = await lua.doString([
  'local out = {}',
  'local nodes = STUB_NODES()',
  'local frames, labels, hits, noSize, badColor = 0, 0, 0, 0, 0',
  'for _, r in ipairs(nodes) do',
  '  if r.className == "Frame" then frames = frames + 1 end',
  '  if r.className == "TextLabel" then labels = labels + 1 end',
  '  if r.className == "TextButton" then hits = hits + 1 end',
  '  local p = r.props or {}',
  '  if r.className == "Frame" and p.Size == nil and p.Name ~= nil then noSize = noSize + 1 end',
  '  if p.BackgroundColor3 ~= nil and (type(p.BackgroundColor3) ~= "table" or p.BackgroundColor3.R == nil) then badColor = badColor + 1 end',
  'end',
  'out[#out+1] = "frames " .. frames .. " · labels " .. labels .. " · hit buttons " .. hits',
  'out[#out+1] = "frames sem Size " .. noSize .. " · cores inválidas " .. badColor',
  'local pb, withHit, withScale = 0, 0, 0',
  'for _, r in ipairs(nodes) do',
  '  local p = r.props or {}',
  '  if r.className == "Frame" and p.Name == "PriceButton" then pb = pb + 1 end',
  '  if p.Name == "Hit" then withHit = withHit + 1 end',
  '  if p.Name == "HoverScale" then withScale = withScale + 1 end',
  'end',
  'out[#out+1] = "PriceButton " .. pb .. " · Hit " .. withHit .. " · HoverScale " .. withScale',
  'return table.concat(out, " | ")',
].join('\n'));

const stats = await lua.doString(`
  local byClass = {}
  for _, r in ipairs(created) do byClass[r.className] = (byClass[r.className] or 0) + 1 end
  local parts = {}
  for k, v in pairs(byClass) do parts[#parts + 1] = k .. "=" .. v end
  table.sort(parts)
  return table.concat(parts, "  ")
`);
const unknowns = await lua.doString(`return table.concat(warnings, "\\n")`);
const errors = await lua.doString(`return table.concat(ERRORS, "\\n")`);
const runtimeErr = await lua.doString(`return ERROR or ""`);

console.log('resultado:', result ?? `(exceção JS: ${err})`);
console.log('instâncias:', stats);
console.log(checks);
if (runtimeErr) console.log('ERRO:', runtimeErr);
if (errors) console.log('erros de API:\n' + errors);

const unknownList = unknowns ? unknowns.split('\n').filter(Boolean) : [];
if (unknownList.length) {
  const uniq = [...new Set(unknownList)];
  console.log(`propriedades fora do stub (${uniq.length}):`);
  uniq.slice(0, 20).forEach((u) => console.log('  -', u));
} else {
  console.log('nenhuma propriedade desconhecida');
}
if (runtimeErr || errors || err) process.exitCode = 1;
