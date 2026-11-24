--!nocheck
--[[
  NEXUS / WZ — HUD do duelo + Loja de Operadores  ·  Roblox Studio (Luau)
  ------------------------------------------------------------------------
  COMO USAR
    1. Cole este arquivo inteiro no comando de barra do Studio (View > Command Bar)
       ou rode pela ferramenta de execução de Luau do seu MCP/plugin.
    2. Ele monta StarterGui.NexusGui com duas telas:
         NexusHud     — vida, munição, placar do duelo, perfil/XP, ações
         NexusShop    — modal da loja (header, destaque, 3 cartões, moeda)
    3. Rode de novo quando quiser: a versão anterior é destruída antes.

  CONFIGURAÇÃO (no topo)
    DRY_RUN  = true  -> monta tudo e DESTRÓI no fim; serve para conferir erros
                        de sintaxe/execução sem sujar o jogo.
    ASSET_ID = ""    -> textura de stud. Vazio = tenta o id público da skill e,
                        se não carregar, segue sem textura. Suba o PNG
                        roblox-assets/stud_tile.png no seu jogo e cole o id aqui.
    Imagens de personagem NÃO vão embutidas: o Roblox exige upload. Os cartões
    usam um avatar vetorial (camadas editáveis). Para usar render, suba o PNG e
    preencha IMAGE_OVERRIDES abaixo.

  LIÇÕES DO ROBLOX QUE ESTÃO APLICADAS AQUI (vêm da skill ui-figma-roblox)
    • Não existe blend Overlay -> o tile de stud é branco/preto com alfa
      (roblox-assets/stud_tile.png), o que engana o olho sobre qualquer cor.
    • UIGradient.Transparency não esmaece ImageLabel em Tile -> os fades de stud
      foram trocados por opacidade uniforme; nada de fade animado.
    • ZIndexBehavior.Sibling: filho sempre desenha acima do pai. Por isso o
      "lábio" inferior e o brilho são irmãos dentro da face, com ZIndex explícito.
    • Clip de filho rotacionado exige CanvasGroup (ClipsDescendants não recorta
      rotação). O brilho diagonal usa CanvasGroup.
    • UIStroke em ApplyStrokeMode.Border desenha FORA = o contorno "Outside" do Figma.
    • Tudo é offset/scale, com UIScale para caber na tela (sem pixels fixos soltos).

  O QUE FICA EDITÁVEL
    Cada bloco tem Face/Depth/Rim/Lip/Hit nomeados. Textos em CONFIG.copy.
    Botões de compra têm o atributo ProductId (0 = só mostra aviso).
    O LocalScript "NexusController" (criado junto) cuida de: fit-to-screen,
    abrir/fechar a loja, hover/click dos botões e aviso de compra.
]]

local DRY_RUN = false

local CONFIG = {
	GUI_NAME = "NexusGui",
	-- suba roblox-assets/stud_tile.png no seu jogo e troque aqui (rbxassetid://000)
	ASSET_ID = "",
	-- textura pública da skill usada como fallback (pode falhar fora do lugar)
	ASSET_FALLBACK = "rbxassetid://73394678597111",
	-- imagens próprias (upload obrigatório): nome do slot -> asset id
	IMAGE_OVERRIDES = {
		-- hero = "rbxassetid://000",
		-- card1 = "rbxassetid://000",
		-- card2 = "rbxassetid://000",
		-- card3 = "rbxassetid://000",
	},
	copy = {
		brandA = "NEXUS", brandB = "WZ", mode = "TREINO LOW-POLY",
		round = "ROUND 3", left = "VOCÊ", right = "BOT", score = "2 × 1", timer = "01:24",
		lifeLabel = "VIDA", life = "82 / 100", armor = "ARMADURA",
		weapon = "FUZIL DE ASSALTO", ammo = "30", ammoReserve = "/ 120", fireMode = "AUTO",
		level = "7", player = "OPERADOR", xp = "XP 620 / 1.000",
		hint = "F PARA SACAR   •   Q PARA TROCAR DE ARMA   •   SHIFT PARA CORRER",
		shopTitle = "LOJA DE OPERADORES",
		shopSub = "ESCOLHA SEU VISUAL. AS ARMAS SÃO GRÁTIS.",
		currency = "1.250",
		heroChip = "OFERTA LIMITADA • 24H",
		heroTitle = "PACOTE LENDA DOURADA",
		heroBullets = { "5 OPERADORES • 3 EMBLEMAS", "4 FUNDOS DE PRÉVIA", "ACESSO ANTECIPADO" },
		heroPrice = "1.250",
		buy = "COMPRAR",
		cards = {
			{ tag = "COMUM", title = "RECRUTA", sub = "TREINO • OPERADOR", price = "900", color = "#2A3B57", accent = "#9FB4D0" },
			{ tag = "RARO", title = "OPERADOR TÁTICO", sub = "DUELO • OPERADOR", price = "1.450", color = "#2C7DB8", accent = "#8CD8FF" },
			{ tag = "ÉPICO", title = "LENDA DOURADA", sub = "EVENTO • OPERADOR", price = "2.200", color = "#B4791F", accent = "#FFE78D" },
		},
		footer = "OS OPERADORES MUDAM APENAS O VISUAL. NENHUMA VANTAGEM DE COMBATE.",
		sideActions = {
			{ label = "LOJA", color = "#FFD34D", text = "#3D2B00" },
			{ label = "OPERADOR", color = "#2C7DB8", text = "#FFFFFF" },
			{ label = "TREINO", color = "#10B981", text = "#04291C" },
			{ label = "AJUSTES", color = "#22314C", text = "#D8E3F3" },
		},
	},
}

-- =====================================================================
-- helpers
-- =====================================================================
local StarterGui = game:GetService("StarterGui")
local TweenService = game:GetService("TweenService")

local C = CONFIG.copy
-- math.clamp existe no Luau/Roblox; garantir compatível caso o arquivo rode em Lua puro
local clamp = math.clamp or function(v, lo, hi) return math.max(lo, math.min(hi, v)) end
local OUTLINE = Color3.fromHex("#090D16")

local P = {
	gold = "#FFD34D", goldRim = "#FFE78D", goldDepth = "#B45309", goldInk = "#3D2B00",
	amber = "#FBBF24", cyan = "#3CB9F2", cyanSoft = "#70DEEC",
	emerald = "#10B981", emeraldDepth = "#065F46",
	red = "#F24848", white = "#FFFFFF", text = "#E7EFFA", mutedSoft = "#A9B8CE",
	muted = "#AEBBD3",
	panel = "#101E3A", panelDeep = "#0B1730", field = "#0E1B33",
}

local function c3(h) return Color3.fromHex(h) end
local function shade(color, k) return Color3.new(color.R * k, color.G * k, color.B * k) end

local function new(class, props, parent)
	local o = Instance.new(class)
	for k, v in pairs(props) do
		o[k] = v
	end
	if parent then
		o.Parent = parent
	end
	return o
end

-- UIStroke em Border = contorno OUTSIDE do Figma
local function stroke(parent, thickness, color)
	return new("UIStroke", {
		Thickness = thickness,
		Color = color or OUTLINE,
		ApplyStrokeMode = Enum.ApplyStrokeMode.Border,
		LineJoinMode = Enum.LineJoinMode.Miter,
	}, parent)
end

local function corner(parent, radius)
	return new("UICorner", { CornerRadius = UDim.new(0, radius) }, parent)
end

-- ---------------------------------------------------------------------
-- texto com contorno e sombra dura (sombra = irmão deslocado, por causa do
-- ZIndex Sibling: filho sempre desenha acima do pai)
-- ---------------------------------------------------------------------
local function text(parent, name, value, sizePx, props)
	props = props or {}
	local holder = new("Frame", {
		Name = name,
		BackgroundTransparency = 1,
		Position = props.position or UDim2.fromOffset(0, 0),
		Size = props.size or UDim2.fromScale(1, 1),
		ZIndex = props.z or 10,
		AutomaticSize = props.auto and Enum.AutomaticSize.X or Enum.AutomaticSize.None,
	}, parent)

	local function makeText(suffix, color, offsetY, z)
		local t = new("TextLabel", {
			Name = suffix,
			BackgroundTransparency = 1,
			Text = value,
			Font = props.bold == false and Enum.Font.Gotham or Enum.Font.GothamBlack,
			TextSize = sizePx,
			TextColor3 = color,
			TextXAlignment = props.align or Enum.TextXAlignment.Center,
			TextYAlignment = Enum.TextYAlignment.Center,
			Position = UDim2.fromOffset(0, offsetY),
			Size = props.auto and UDim2.new(0, 0, 1, 0) or UDim2.fromScale(1, 1),
			AutomaticSize = props.auto and Enum.AutomaticSize.X or Enum.AutomaticSize.None,
			TextScaled = false,
			ZIndex = z,
		}, holder)
		if props.noStroke ~= true then
			new("UIStroke", {
				Thickness = props.stroke or 2,
				Color = offsetY > 0 and Color3.new(0, 0, 0) or OUTLINE,
				ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual,
				LineJoinMode = Enum.LineJoinMode.Round,
			}, t)
		end
		return t
	end

	if (props.shadow or 0) > 0 then
		makeText("Shadow", Color3.new(0, 0, 0), props.shadow, props.z or 10)
	end
	return makeText("Text", c3(props.color or P.text), 0, (props.z or 10) + 1)
end
-- compat: text(...) devolve o TextLabel direto quando não há sombra
local tlabel = text

-- ---------------------------------------------------------------------
-- bloco stud-UI: Depth (deslocado e escuro) + Face + Studs, com contorno fora
-- ---------------------------------------------------------------------
local function block(parent, name, x, y, w, h, color, o)
	o = o or {}
	local depthPx = o.depth or 10
	local root = new("Frame", {
		Name = name,
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(x, y),
		Size = UDim2.fromOffset(w, h + depthPx),
		ZIndex = o.z or 1,
	}, parent)

	local depth = new("Frame", {
		Name = "Depth",
		BackgroundColor3 = shade(color, o.depthShade or 0.62),
		BorderSizePixel = 0,
		Position = UDim2.fromOffset(0, depthPx),
		Size = UDim2.fromOffset(w, h),
		ZIndex = (o.z or 1) + 0,
	}, root)
	stroke(depth, o.strokePx or 3)
	if o.radius then corner(depth, o.radius) end

	local face = new("Frame", {
		Name = "Face",
		BackgroundColor3 = color,
		BackgroundTransparency = o.faceTransparency or 0,
		BorderSizePixel = 0,
		Size = UDim2.fromOffset(w, h),
		ZIndex = (o.z or 1) + 1,
		ClipsDescendants = o.clip ~= false,
	}, root)
	stroke(face, o.strokePx or 3)
	if o.radius then corner(face, o.radius) end

	-- tile de stud (branco/preto com alfa = Overlay emulado)
	if o.studs ~= false then
		local img = new("ImageLabel", {
			Name = "Studs",
			BackgroundTransparency = 1,
			Size = UDim2.fromScale(1, 1),
			Image = CONFIG.ASSET_ID ~= "" and CONFIG.ASSET_ID or CONFIG.ASSET_FALLBACK,
			ScaleType = Enum.ScaleType.Tile,
			TileSize = UDim2.fromOffset(o.studPx or 96, o.studPx or 96),
			ImageTransparency = o.studs or 0.55,
			ZIndex = (o.z or 1) + 2,
		}, face)
		if o.radius then corner(img, o.radius) end
	end
	return root, face
end

-- rim claro + lábio inferior escuro (irmãos da face, ZIndex acima)
local function bevel(face, baseColor, rimColor, rimPx, lipFrac, z)
	local size = face.AbsoluteSize
	local w = face.Size.X.Offset
	local h = face.Size.Y.Offset
	if w <= 0 or h <= 0 then
		w, h = size.X, size.Y
	end
	local lipH = math.max(4, math.floor(h * (lipFrac or 0.2) + 0.5))

	new("Frame", {
		Name = "Lip",
		BackgroundColor3 = shade(baseColor, 0.8),
		BorderSizePixel = 0,
		Position = UDim2.new(0, 0, 1, -lipH),
		Size = UDim2.new(1, 0, 0, lipH),
		ZIndex = z,
	}, face)
	new("Frame", {
		Name = "LipLine",
		BackgroundColor3 = rimColor,
		BackgroundTransparency = 0.55,
		BorderSizePixel = 0,
		Position = UDim2.new(0, 6, 1, -lipH),
		Size = UDim2.new(1, -12, 0, 2),
		ZIndex = z + 1,
	}, face)

	local rim = new("Frame", {
		Name = "Rim",
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(rimPx, rimPx),
		Size = UDim2.new(1, -rimPx * 2, 1, -rimPx * 2),
		ZIndex = z + 2,
	}, face)
	stroke(rim, rimPx, rimColor)
end

-- brilho diagonal estático, recortado por CanvasGroup (clip de rotação)
local function sheen(face, z, transparency)
	local cg = new("CanvasGroup", {
		Name = "Sheen",
		BackgroundTransparency = 1,
		Size = UDim2.fromScale(1, 1),
		ZIndex = z,
	}, face)
	local w = math.max(face.Size.X.Offset, 40)
	local h = math.max(face.Size.Y.Offset, 40)
	for i = 1, 3 do
		new("Frame", {
			Name = "Bar" .. i,
			BackgroundColor3 = Color3.new(1, 1, 1),
			BackgroundTransparency = transparency or 0.9,
			BorderSizePixel = 0,
			AnchorPoint = Vector2.new(0.5, 0.5),
			Position = UDim2.fromOffset((i - 1) * (w / 3.4), h / 2),
			Size = UDim2.fromOffset(34, h * 2.2),
			Rotation = 20,
		}, cg)
	end
	return cg
end

-- losango como ícone de moeda
local function diamond(parent, x, y, size, color, z)
	local holder = new("Frame", {
		Name = "Diamond",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(x + size / 2, y + size / 2),
		Size = UDim2.fromOffset(size, size),
		Rotation = 45,
		ZIndex = z or 20,
	}, parent)
	local inner = new("Frame", {
		Name = "Fill",
		BackgroundColor3 = color,
		BorderSizePixel = 0,
		Position = UDim2.fromOffset(2, 2),
		Size = UDim2.new(1, -4, 1, -4),
		ZIndex = z or 20,
	}, holder)
	corner(inner, 3)
	stroke(holder, 2)
	return holder
end

-- barra de progresso
local function bar(parent, x, y, w, h, pct, color, z)
	local track = new("Frame", {
		Name = "Track",
		BackgroundColor3 = c3("#0B1730"),
		BorderSizePixel = 0,
		Position = UDim2.fromOffset(x, y),
		Size = UDim2.fromOffset(w, h),
		ZIndex = z or 5,
	}, parent)
	corner(track, h / 2)
	stroke(track, 2, Color3.new(0, 0, 0))
	local fillPct = clamp(pct, 0, 1)
	local fill = new("Frame", {
		Name = "Fill",
		BackgroundColor3 = color,
		BorderSizePixel = 0,
		Size = UDim2.fromScale(fillPct, 1),
		ZIndex = (z or 5) + 1,
	}, track)
	corner(fill, h / 2)
	new("Frame", {
		Name = "Gloss",
		BackgroundColor3 = Color3.new(1, 1, 1),
		BackgroundTransparency = 0.65,
		BorderSizePixel = 0,
		Position = UDim2.fromOffset(2, 2),
		Size = UDim2.new(1, -4, 0.34, 0),
		ZIndex = (z or 5) + 2,
	}, fill)
	return track
end

-- avatar vetorial em camadas (placeholder dos renders; troque por imagem se subir)
local function avatar(parent, w, h, z, tint)
	tint = tint or c3("#2C7DB8")
	local holder = new("Frame", {
		Name = "Avatar",
		BackgroundTransparency = 1,
		AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromScale(0.5, 0.52),
		Size = UDim2.fromOffset(w, h),
		ZIndex = z or 20,
	}, parent)
	local function part(name, px, py, pw, ph, color, rot)
		local f = new("Frame", {
			Name = name,
			BackgroundColor3 = color,
			BorderSizePixel = 0,
			Position = UDim2.fromOffset(px, py),
			Size = UDim2.fromOffset(pw, ph),
			Rotation = rot or 0,
			ZIndex = z or 20,
		}, holder)
		corner(f, math.min(6, math.floor(pw / 4)))
		stroke(f, 2, c3("#0A1220"))
		return f
	end
	local u = w / 100
	part("Head", 38 * u, 0, 24 * u, 20 * u, c3("#FFD34D"))
	part("Torso", 33 * u, 21 * u, 34 * u, 30 * u, tint)
	part("ArmL", 14 * u, 22 * u, 15 * u, 28 * u, c3("#FFD34D"), -8)
	part("ArmR", 71 * u, 22 * u, 15 * u, 28 * u, c3("#FFD34D"), 8)
	part("LegL", 35 * u, 54 * u, 13 * u, 30 * u, c3("#10B981"))
	part("LegR", 52 * u, 54 * u, 13 * u, 30 * u, c3("#10B981"))
	return holder
end

local function imageSlot(parent, name, x, y, w, h, z)
	local id = CONFIG.IMAGE_OVERRIDES[name]
	if not id then
		return nil
	end
	return new("ImageLabel", {
		Name = "Image_" .. name,
		BackgroundTransparency = 1,
		Position = UDim2.fromOffset(x, y),
		Size = UDim2.fromOffset(w, h),
		Image = id,
		ScaleType = Enum.ScaleType.Fit,
		ZIndex = z or 20,
	}, parent)
end

-- =====================================================================
-- HUD
-- =====================================================================
local function buildHud(gui, scale)
	local hud = new("Frame", {
		Name = "Hud",
		BackgroundTransparency = 1,
		Size = UDim2.fromOffset(1920, 1080),
		ZIndex = 1,
	}, gui)
	new("UIScale", { Name = "FitScale", Scale = scale }, hud)

	-- marca
	local _, marca = block(hud, "Marca", 36, 24, 300, 52, c3(P.panelDeep), { depth = 0, radius = 12, z = 2, studs = 0.78 })
	diamond(marca, 16, 14, 24, c3(P.amber), 5)
	text(marca, "Brand", C.brandA, 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(52, 0), size = UDim2.fromOffset(120, 34), bold = true, stroke = 1, z = 6 })
	text(marca, "WZ", C.brandB, 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(158, 0), size = UDim2.fromOffset(80, 34), color = P.amber, stroke = 1, z = 6 })
	text(marca, "Mode", C.mode, 10, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(52, 30), size = UDim2.fromOffset(220, 18), color = P.muted, noStroke = true, z = 6 })

	-- placar do duelo
	local _, duelo = block(hud, "Duelo", 700, 24, 520, 56, c3("#14203A"), { depth = 0, radius = 12, z = 2, studs = 0.8 })
	local roundBg = new("Frame", {
		Name = "RoundBg", BackgroundColor3 = c3(P.amber), BorderSizePixel = 0,
		Position = UDim2.fromOffset(12, 10), Size = UDim2.fromOffset(118, 36), ZIndex = 5,
	}, duelo)
	corner(roundBg, 8); stroke(roundBg, 2)
	text(duelo, "Round", C.round, 18, { position = UDim2.fromOffset(12, 10), size = UDim2.fromOffset(118, 36), color = "#2B1D00", stroke = 1, z = 6 })
	text(duelo, "Score", string.format("%s  %s  %s", C.left, C.score, C.right), 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(146, 10), size = UDim2.fromOffset(250, 36), z = 6, stroke = 2 })
	text(duelo, "Timer", C.timer, 22, { align = Enum.TextXAlignment.Right, position = UDim2.fromOffset(404, 10), size = UDim2.fromOffset(104, 36), color = P.cyanSoft, z = 6, stroke = 2 })

	-- perfil + XP
	local _, perfil = block(hud, "Perfil", 1444, 20, 440, 76, c3(P.panel), { depth = 0, radius = 14, z = 2, studs = 0.78 })
	local nivel = new("Frame", {
		Name = "Nivel", BackgroundColor3 = c3(P.gold), BorderSizePixel = 0,
		Position = UDim2.fromOffset(16, 12), Size = UDim2.fromOffset(52, 52), ZIndex = 5,
	}, perfil)
	corner(nivel, 10); stroke(nivel, 2)
	text(perfil, "NivelTxt", "[" .. C.level .. "]", 22, { position = UDim2.fromOffset(16, 12), size = UDim2.fromOffset(52, 52), color = P.goldInk, z = 6, stroke = 1 })
	text(perfil, "Nome", C.player, 26, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(80, 12), size = UDim2.fromOffset(220, 30), z = 6, stroke = 2 })
	text(perfil, "Xp", C.xp, 12, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(80, 42), size = UDim2.fromOffset(220, 18), color = P.muted, noStroke = true, z = 6 })
	bar(perfil, 308, 42, 116, 12, 0.62, c3(P.gold), 6)

	-- vida
	local _, vida = block(hud, "Vida", 36, 920, 540, 124, c3(P.field), { depth = 8, radius = 16, z = 2 })
	text(vida, "LifeLabel", C.lifeLabel, 14, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(24, 20), size = UDim2.fromOffset(120, 20), color = P.cyanSoft, noStroke = true, z = 6 })
	bar(vida, 24, 46, 380, 26, 0.82, c3(P.emerald), 6)
	text(vida, "LifeValue", C.life, 18, { align = Enum.TextXAlignment.Right, position = UDim2.fromOffset(412, 44), size = UDim2.fromOffset(108, 30), z = 6, stroke = 2 })
	text(vida, "ArmorLabel", C.armor, 12, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(24, 86), size = UDim2.fromOffset(120, 18), color = P.muted, noStroke = true, z = 6 })
	for i = 1, 4 do
		local pip = new("Frame", {
			Name = "Armor" .. i,
			BackgroundColor3 = i <= 3 and c3(P.cyan) or c3("#1B2A44"),
			BorderSizePixel = 0,
			Position = UDim2.fromOffset(132 + (i - 1) * 30, 88),
			Size = UDim2.fromOffset(22, 12),
			ZIndex = 6,
		}, vida)
		corner(pip, 4); stroke(pip, 1)
	end

	-- munição
	local _, ammo = block(hud, "Ammo", 1560, 920, 324, 124, c3(P.field), { depth = 8, radius = 16, z = 2 })
	text(ammo, "Weapon", C.weapon, 13, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(24, 18), size = UDim2.fromOffset(276, 20), color = P.cyanSoft, noStroke = true, z = 6 })
	text(ammo, "AmmoNum", C.ammo, 52, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(20, 36), size = UDim2.fromOffset(160, 60), color = P.gold, z = 6, stroke = 2 })
	text(ammo, "AmmoReserve", C.ammoReserve, 22, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(152, 58), size = UDim2.fromOffset(120, 30), color = P.muted, noStroke = true, z = 6 })
	local modeBg = new("Frame", {
		Name = "FireModeBg", BackgroundColor3 = c3("#1B2A44"), BorderSizePixel = 0,
		Position = UDim2.fromOffset(248, 66), Size = UDim2.fromOffset(56, 24), ZIndex = 6,
	}, ammo)
	corner(modeBg, 6); stroke(modeBg, 1)
	text(ammo, "FireMode", C.fireMode, 12, { position = UDim2.fromOffset(248, 66), size = UDim2.fromOffset(56, 24), z = 7, stroke = 1 })

	-- dica de teclas
	local hint = new("Frame", {
		Name = "Hint", BackgroundColor3 = c3(P.panelDeep), BackgroundTransparency = 0.15,
		BorderSizePixel = 0, Position = UDim2.fromOffset(700, 1004), Size = UDim2.fromOffset(520, 40), ZIndex = 3,
	}, hud)
	corner(hint, 20); stroke(hint, 2, c3("#24344F"))
	text(hint, "HintTxt", C.hint, 12, { color = P.muted, noStroke = true, z = 5 })

	-- ações laterais
	for i, action in ipairs(C.sideActions) do
		local y = 356 + (i - 1) * 84
		local root, face = block(hud, "Acao" .. action.label, 1804, y, 88, 76, c3(action.color), { depth = 6, radius = 14, z = 3, depthShade = 0.5, studs = 0.7 })
		text(face, "Label", action.label, 12, { position = UDim2.fromOffset(0, 24), size = UDim2.fromOffset(88, 28), color = action.text, noStroke = true, z = 8 })
		new("TextButton", {
			Name = "Hit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 30,
		}, face)
		local _ = root
	end
	return hud
end

-- =====================================================================
-- LOJA
-- =====================================================================
local function buildShop(gui, scale)
	local shop = new("Frame", {
		Name = "Shop",
		BackgroundTransparency = 1,
		Size = UDim2.fromOffset(1920, 1080),
		Visible = true,
		ZIndex = 1000,
	}, gui)
	new("UIScale", { Name = "FitScale", Scale = scale }, shop)

	-- scrim
	local scrim = new("Frame", {
		Name = "Scrim", BackgroundColor3 = Color3.new(0.016, 0.027, 0.059), BackgroundTransparency = 0.45,
		BorderSizePixel = 0, Size = UDim2.fromScale(1, 1), ZIndex = 1000,
	}, shop)
	new("TextButton", { Name = "ScrimHit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 1000 }, scrim)

	local PX, PY, PW, PH, HEAD = 400, 104, 1120, 800, 100

	-- painel (translúcido: a profundidade não aparece, igual ao exemplo da skill)
	local _, painel = block(shop, "Painel", PX, PY, PW, PH, c3(P.panel), { depth = 0, radius = 18, z = 1001, faceTransparency = 0.04, studs = 0.72 })
	stroke(painel, 2, c3("#3B5A80"))

	-- header + fechar: mesma altura, um colado no outro
	local _, header = block(shop, "Header", PX, PY, PW - 112, HEAD, c3(P.gold), { depth = 0, radius = 16, z = 1003, studs = 0.78, strokePx = 3 })
	header.ClipsDescendants = true
	text(header, "Title", C.shopTitle, 40, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(40, 14), size = UDim2.fromOffset(620, 44), color = P.goldInk, noStroke = true, z = 1006 })
	text(header, "Sub", C.shopSub, 12, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(42, 58), size = UDim2.fromOffset(620, 20), color = "#5A4200", noStroke = true, z = 1006 })

	-- moeda
	local pill = new("Frame", {
		Name = "MoedaPill", BackgroundColor3 = c3("#091632"), BackgroundTransparency = 0.05,
		BorderSizePixel = 0, Position = UDim2.fromOffset(712, 26), Size = UDim2.fromOffset(200, 48), ZIndex = 1006,
	}, header)
	corner(pill, 24); stroke(pill, 2)
	diamond(pill, 14, 14, 20, c3(P.cyanSoft), 1008)
	text(pill, "Value", C.currency, 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(44, 0), size = UDim2.fromOffset(110, 48), z = 1008, stroke = 2 })
	local addBtn = new("Frame", {
		Name = "MoedaAdd", BackgroundColor3 = c3(P.emerald), BorderSizePixel = 0,
		AnchorPoint = Vector2.new(1, 0.5), Position = UDim2.new(1, -8, 0.5, 0), Size = UDim2.fromOffset(44, 44), ZIndex = 1008,
	}, header)
	corner(addBtn, 22); stroke(addBtn, 2)
	text(addBtn, "Plus", "+", 28, { position = UDim2.fromOffset(0, -4), size = UDim2.fromOffset(44, 48), color = "#04291C", noStroke = true, z = 1009 })
	new("TextButton", { Name = "Hit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 1020 }, addBtn)

	local _, fechar = block(shop, "CloseButton", PX + PW - 112, PY, 112, HEAD, c3(P.red), { depth = 0, radius = 16, z = 1003, studs = 0.5, strokePx = 3 })
	text(fechar, "X", "X", 38, { position = UDim2.fromOffset(0, -2), size = UDim2.fromScale(1, 1), z = 1006, stroke = 3 })
	new("TextButton", { Name = "Hit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 1020 }, fechar)

	-- pacote em destaque
	local HX, HY, HW, HH = PX + 32, PY + HEAD + 24, PW - 64, 216
	local _, hero = block(shop, "Hero", HX, HY, HW, HH, c3("#123C70"), { depth = 10, radius = 16, z = 1004, depthShade = 0.5, studs = 0.55 })
	sheen(hero, 1007, 0.92)
	local halo = new("Frame", {
		Name = "Halo", BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.88,
		BorderSizePixel = 0, AnchorPoint = Vector2.new(0.5, 0.5),
		Position = UDim2.fromOffset(HW - 132, HH / 2), Size = UDim2.fromOffset(164, 164), Rotation = 8, ZIndex = 1006,
	}, hero)
	corner(halo, 28); stroke(halo, 3, c3(P.gold))
	-- o avatar é ancorado no centro do holder: posiciona o holder na área livre da direita
	if not imageSlot(hero, "hero", HW - 256, 4, 232, HH - 8, 1008) then
		local av = avatar(hero, 176, 176, 1008, c3("#2C7DB8"))
		av.AnchorPoint = Vector2.new(0, 0)
		av.Position = UDim2.fromOffset(HW - 240, 10)
	end

	local chip = new("Frame", {
		Name = "Chip", BackgroundColor3 = c3(P.red), BorderSizePixel = 0,
		Position = UDim2.fromOffset(32, 26), Size = UDim2.fromOffset(248, 30), ZIndex = 1008,
	}, hero)
	corner(chip, 8); stroke(chip, 2)
	text(chip, "ChipTxt", C.heroChip, 13, { color = P.white, noStroke = true, z = 1009 })
	text(hero, "HeroTitle", C.heroTitle, 34, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(32, 58), size = UDim2.fromOffset(HW - 320, 44), color = P.gold, stroke = 3, shadow = 3, z = 1009 })
	for i, bullet in ipairs(C.heroBullets) do
		local y = 108 + (i - 1) * 24
		diamond(hero, 34, y, 12, c3(P.gold), 1009)
		text(hero, "Bullet" .. i, bullet, 13, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(58, y - 6), size = UDim2.fromOffset(HW - 420, 24), z = 1009, stroke = 1 })
	end

	-- botão COMPRAR do destaque
	local buyW, buyH = 300, 52
	local buyRoot, buyFace = block(hero, "PriceButton", 32, HH - 72, buyW, buyH, c3(P.emerald), { depth = 6, radius = 12, z = 1010, depthShade = 0.45, studs = 0.65 })
	bevel(buyFace, c3(P.emerald), c3("#A6FF8F"), 3, 0.2, 1013)
	diamond(buyFace, 20, 16, 20, c3(P.cyanSoft), 1016)
	text(buyFace, "Price", C.heroPrice, 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(52, 0), size = UDim2.fromOffset(120, buyH), z = 1016, stroke = 2 })
	text(buyFace, "Go", C.buy, 17, { align = Enum.TextXAlignment.Right, position = UDim2.fromOffset(160, 0), size = UDim2.fromOffset(116, buyH), z = 1016, stroke = 2 })
	local hit = new("TextButton", { Name = "Hit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 1030 }, buyFace)
	local _ = hit
	new("UIScale", { Name = "HoverScale" }, buyRoot)
	buyRoot:SetAttribute("ProductId", 0)

	-- cartões
	local CW, CH, GAP = 344, 300, 12
	local CY = HY + HH + 22
	for i, card in ipairs(C.cards) do
		local root, face = block(shop, "Card" .. i, HX + (i - 1) * (CW + GAP), CY, CW, CH, c3(card.color), { depth = 8, radius = 16, z = 1004, studs = 0.6 })
		face.Name = "Face"

		-- faixa de cor no topo (mesma cor do card, dá profundidade)
		local faixa = new("Frame", {
			Name = "Faixa", BackgroundColor3 = c3(card.color), BorderSizePixel = 0,
			Position = UDim2.fromOffset(4, 4), Size = UDim2.new(1, -8, 0, 148), ZIndex = 1007,
		}, face)
		corner(faixa, 12)
		new("Frame", {
			Name = "FaixaGlow", BackgroundColor3 = Color3.new(1, 1, 1), BackgroundTransparency = 0.9,
			BorderSizePixel = 0, Position = UDim2.fromOffset(4, 4), Size = UDim2.new(1, -8, 0, 74), ZIndex = 1008,
		}, face)

		-- área da imagem
		local imgFrame = new("Frame", {
			Name = "Imagem", BackgroundColor3 = shade(c3(card.color), 1.5), BorderSizePixel = 0,
			Position = UDim2.fromOffset(16, 12), Size = UDim2.new(1, -32, 0, 132), ZIndex = 1008,
			ClipsDescendants = true,
		}, face)
		corner(imgFrame, 10); stroke(imgFrame, 2)
		new("UIGradient", {
			Rotation = 90,
			Color = ColorSequence.new(shade(c3(card.color), 1.8), c3(P.panelDeep)),
		}, imgFrame)
		if not imageSlot(imgFrame, "card" .. i, 4, 2, CW - 40, 130, 1009) then
			avatar(imgFrame, 120, 120, 1009, c3(card.color))
		end
		sheen(imgFrame, 1010, 0.94)

		-- tag de raridade
		local tagW = math.max(76, #card.tag * 9 + 30)
		local tagBg = new("Frame", {
			Name = "TagBg", BackgroundColor3 = c3(P.panelDeep), BackgroundTransparency = 0.08,
			BorderSizePixel = 0, Position = UDim2.fromOffset(16, 156), Size = UDim2.fromOffset(tagW, 24), ZIndex = 1010,
		}, face)
		corner(tagBg, 12); stroke(tagBg, 2, c3(card.accent))
		text(tagBg, "Tag", card.tag, 11, { color = card.accent, noStroke = true, z = 1011 })

		text(face, "Titulo", card.title, 26, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(16, 182), size = UDim2.new(1, -32, 0, 30), z = 1011, stroke = 2, shadow = 2 })
		text(face, "Sub", card.sub, 12, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(16, 214), size = UDim2.new(1, -32, 0, 16), color = P.mutedSoft, noStroke = true, z = 1011 })

		-- barra de preço
		local priceRoot, priceFace = block(face, "PriceButton", 16, CH - 62, CW - 32, 52, c3(P.emerald), { depth = 6, radius = 12, z = 1012, depthShade = 0.45, studs = 0.65 })
		bevel(priceFace, c3(P.emerald), c3("#A6FF8F"), 3, 0.22, 1015)
		diamond(priceFace, 18, 16, 20, c3(P.cyanSoft), 1018)
		text(priceFace, "Price", card.price, 24, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(48, 0), size = UDim2.fromOffset(120, 52), z = 1018, stroke = 2 })
		text(priceFace, "Go", C.buy, 15, { align = Enum.TextXAlignment.Right, position = UDim2.fromOffset(12, 0), size = UDim2.new(1, -24, 0, 52), z = 1018, stroke = 2 })
		new("TextButton", { Name = "Hit", BackgroundTransparency = 1, Text = "", Size = UDim2.fromScale(1, 1), ZIndex = 1030 }, priceFace)
		new("UIScale", { Name = "HoverScale" }, priceRoot)
		priceRoot:SetAttribute("ProductId", 0)
	end

	-- anel de foco no cartão do meio (estado de hover da arte)
	local focus = new("Frame", {
		Name = "Card2Focus", BackgroundTransparency = 1, BorderSizePixel = 0,
		Position = UDim2.fromOffset(HX + (CW + GAP) - 6, CY - 6), Size = UDim2.fromOffset(CW + 12, CH + 18), ZIndex = 1032,
	}, shop)
	corner(focus, 20); stroke(focus, 4, c3(P.gold))

	text(shop, "Footer", C.footer, 13, { align = Enum.TextXAlignment.Left, position = UDim2.fromOffset(PX + 32, PY + PH - 38), size = UDim2.fromOffset(PW - 64, 20), color = P.muted, noStroke = true, z = 1006 })

	return shop
end

-- =====================================================================
-- controller (LocalScript dentro da GUI)
-- =====================================================================
local CONTROLLER = [==[
-- NexusController: fit-to-screen, abrir/fechar, hover/click dos botões, compra.
local TweenService = game:GetService("TweenService")
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local gui = script.Parent
local shop = gui:WaitForChild("Shop")
local hud = gui:WaitForChild("Hud")
local camera = workspace.CurrentCamera
local Out, Back = Enum.EasingDirection.Out, Enum.EasingStyle.Back

local function fit()
	local vp = camera.ViewportSize
	local s = math.min(vp.Y / 1080, vp.X / 1920)
	for _, layer in ipairs({ hud, shop }) do
		local sc = layer and layer:FindFirstChild("FitScale")
		if sc then sc.Scale = s end
	end
end
camera:GetPropertyChangedSignal("ViewportSize"):Connect(fit)
fit()

gui:WaitForChild("Toggle").Event:Connect(function(state)
	if state == nil then state = not shop.Visible end
	shop.Visible = state
end)

local function find(name)
	return shop:FindFirstChild(name)
end
local closeBtn = find("CloseButton")
if closeBtn then
	closeBtn.Face.Hit.Activated:Connect(function() shop.Visible = false end)
end
local scrim = find("Scrim")
if scrim and scrim:FindFirstChild("ScrimHit") then
	scrim.ScrimHit.Activated:Connect(function() shop.Visible = false end)
end

local function wireBuy(root)
	if not root or not root:IsA("Frame") then return end
	local face = root:FindFirstChild("Face")
	local scale = root:FindFirstChild("HoverScale")
	if not face or not scale then return end
	local hit = face:FindFirstChild("Hit")
	if not hit then return end
	local hovering = false
	hit.MouseEnter:Connect(function()
		hovering = true
		TweenService:Create(scale, TweenInfo.new(0.18, Back, Out), { Scale = 1.06 }):Play()
	end)
	hit.MouseLeave:Connect(function()
		hovering = false
		TweenService:Create(scale, TweenInfo.new(0.18), { Scale = 1 }):Play()
		TweenService:Create(face, TweenInfo.new(0.08), { Position = UDim2.fromOffset(0, 0) }):Play()
	end)
	hit.MouseButton1Down:Connect(function()
		TweenService:Create(face, TweenInfo.new(0.06), { Position = UDim2.fromOffset(0, 4) }):Play()
	end)
	hit.MouseButton1Up:Connect(function()
		TweenService:Create(face, TweenInfo.new(0.12, Back, Out), { Position = UDim2.fromOffset(0, 0) }):Play()
	end)
	hit.Activated:Connect(function()
		local id = root:GetAttribute("ProductId") or 0
		if id ~= 0 then
			MarketplaceService:PromptProductPurchase(Players.LocalPlayer, id)
		else
			warn("NexusGui: defina o atributo ProductId em " .. root:GetFullName())
		end
	end)
	if hovering then scale.Scale = 1.06 end
end

for _, d in ipairs(shop:GetDescendants()) do
	if d.Name == "PriceButton" and d:IsA("Frame") then wireBuy(d) end
end
]==]

-- =====================================================================
-- build
-- =====================================================================
local function fitScale()
	local vp = workspace.CurrentCamera and workspace.CurrentCamera.ViewportSize or Vector2.new(1920, 1080)
	return math.min(vp.Y / 1080, vp.X / 1920)
end

local gui = new("ScreenGui", {
	Name = CONFIG.GUI_NAME,
	ResetOnSpawn = false,
	IgnoreGuiInset = true,
	ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
	DisplayOrder = 10,
})
new("BindableEvent", { Name = "Toggle" }, gui)

local scale = fitScale()
buildHud(gui, scale)
local shop = buildShop(gui, scale)

new("LocalScript", { Name = "NexusController", Source = CONTROLLER }, gui)

local total = #gui:GetDescendants()
if DRY_RUN then
	gui:Destroy()
	return string.format("dry run ok — %d descendentes, nenhuma instância ficou no jogo", total)
end

local old = StarterGui:FindFirstChild(CONFIG.GUI_NAME)
if old then
	old:Destroy()
end
gui.Parent = StarterGui
return string.format("%s montada com %d descendentes (HUD + Loja). Para abrir/fechar: NexusGui.Toggle:Fire()", CONFIG.GUI_NAME, total)
