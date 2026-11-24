# Bundled asset library

All paths are relative to the skill root (`.skills/ui-figma-roblox/`).

> **Repository install note.** This copy lives inside the `Jogo-` repo, so it ships
> the **core art** only (~16 MB): the complete Kek UI Essentials pack, the
> Textures/Icons/Sounds from UI Resources, and every manifest. The other UI
> Resources categories (~310 MB: Backgrounds, Effects, Renders, Faces, Brushes,
> Other) stay in the upstream repo. Fetch them, or a tag-filtered subset, with
> `scripts/fetch-assets.sh` (see the end of this file). `MANIFEST.csv` lists every
> file, so you can pick from the catalog before downloading anything.

## 1. Kek UI Essentials — `assets/kek-ui-essentials/`

106 files (105 PNG, 1 WebP) from the user-supplied `KekUIEssentials.rar`. Full family counts and filenames: [ASSET-NOTES.md](../assets/kek-ui-essentials/ASSET-NOTES.md).

Most useful for stud UI:

| Need | File(s) |
| --- | --- |
| Repeating stud surface | `kek_stud.png` |
| Halftone fills / corners | `kek_circle_halftone_*.png`, `kek_square_halftone_*.png`, `kek_zoomed_halftone_1.png` |
| Sunburst behind a hero item | `kek_rays.webp`, `kek_light_*.png` |
| Sparkle / shine accents | `kek_sparkle_*.png`, `kek_spark_*.png` |
| Energy / action accents | `kek_slash_*.png`, `kek_speedlines_*.png`, `kek_flame_*.png`, `kek_smoke_*.png` |
| Decorative frames | `kek_chain_*.png`, `kek_circle_*.png`, `kek_design_*.png`, `quelly_spiral_*.png` |

This pack covers most UI polish needs without touching the big capture: stud tiling, halftones, sunbursts, sparkles, sparks, chains, flames and slashes are all here.

## 2. UI Resources capture — `assets/ui-resources/`

Captured from `https://ui-resources.com/api/resources` (catalog dated 2026-10-13, 1134 records). The upstream skill bundles 975 direct files; this copy keeps 14.

| Folder under `files/` | Bundled here | Typical use |
| --- | --- | --- |
| `Textures/` | 5 stud textures (90–92, 1217–1219) | the `Stud` tag: `stud.png`, `universal_stud.webp`, `StudTexture3.webp`, ... |
| `Icons/` | 4 | Robux icon (PNG + SVG), crystal, misc |
| `Sounds/` | 6 | UI open/close/click/hover/slide MP3s |
| `Effects/` | not bundled (~423 upstream) | halftones, sunbursts, stars, sparkles, chains, lightning, flames, slashes |
| `Backgrounds/` | not bundled (~199 upstream) | scene backdrops, city/nature/horror/fantasy |
| `Renders/` | not bundled (~156 upstream) | character and item renders for product cards |
| `Faces/` | not bundled (~34 upstream) | Roblox face decals |
| `Brushes/` | not bundled (~20 upstream) | paint brush strokes |
| `Other/` | not bundled (~12 upstream) | blueprint frames, reference sheets |

Common tags: Halftones, Sunbursts, Stars, Characters, City, Circle, Sparke (sic), Chains, Lightning, Paper, Grid, Stud, Roblox, Flames, Metal, Patterns, Slash, Smoke, Crystal. Many records are tagged `Undefined` or `Dump`, so search titles and descriptions too.

### Files in this folder

- `MANIFEST.csv` — one row per catalog link: `resource_id, title, category, description, tags, link_field, source_url, downloaded_path, download_status, http_status, content_type, size_bytes, sha256, final_url`. `downloaded_path` is relative to `assets/ui-resources/` and describes the upstream layout, so it stays correct whether or not the file is present locally.
- `LINK-ONLY-RESOURCES.csv` — 154 records with no direct file (Figma/Studio plugins, sites, tutorials, software).
- `catalog.json` — raw API response.
- `SUMMARY.json`, `failures.json`, `README.md` — capture totals and notes.

### Lookup recipes

Search the manifest by tag, title or description in `assets/ui-resources/`, then open the image to check it visually. Names are clues, not guarantees.

```bash
python3 - <<'PHP'
import csv
rows = list(csv.DictReader(open('.skills/ui-figma-roblox/assets/ui-resources/MANIFEST.csv', encoding='utf-8-sig')))
for r in rows:
    hay = (r['title'] + ' ' + r['tags'] + ' ' + r['description']).lower()
    if 'sunburst' in hay and r['downloaded_path']:
        print(r['category'], '|', r['title'], '|', r['size_bytes'], '|', r['downloaded_path'])
PHP
```

```bash
grep -i "stud" .skills/ui-figma-roblox/assets/ui-resources/MANIFEST.csv | cut -d, -f2,3,5,8
```

### Not bundled

Two catalog entries were zip archives and are left out upstream:

- `1010` "Vectors by Montzter" (Icons, ~44 MB zip)
- `714668956` "5000+ Pixel Icons" by Windwolf (Icons, ~5.8 MB zip)

Fetch them from `source_url` only if the user asks, into a fresh directory outside the skill.

One extensionless JPEG (`1220` "color theory basics") is named `files/Other/1220-download_url-G9ivY83W4AAG9Jo.jpg` upstream; the manifest reflects that path.

### Completing the library

`scripts/fetch-assets.sh` clones the upstream repo sparsely and copies only what you ask for, so you never pull 330 MB by accident. Paths are relative to the skill root.

```bash
# one file
scripts/fetch-assets.sh --file files/Effects/2-download_url-quelly2.png

# every local file whose title/tags/description match a word
scripts/fetch-assets.sh --grep sunburst
scripts/fetch-assets.sh --grep "halftone"
scripts/fetch-assets.sh --grep "stud map" --category Backgrounds

# whole categories
scripts/fetch-assets.sh --category Effects Backgrounds Renders

# everything (≈310 MB)
scripts/fetch-assets.sh --all
```

The script verifies each copied file against the manifest's `sha256`, keeps the upstream layout under `assets/ui-resources/files/<Category>/`, and never modifies the bundled originals already present.

## Usage rules

1. Prefer the smallest asset set that solves the visual need. Choose by the actual image, not the filename.
2. Copy an asset into the user's project before editing. Never modify the bundled originals.
3. Keep `title`, creator (`description` often holds "By <creator>") and `source_url` beside any asset moved into a project.
4. The capture is point-in-time. Check the live listing for changes and terms before a commercial release.
5. No license is implied. A "free" label is not redistribution permission. If rights are unclear, use the asset as reference only or ask the user to confirm.
6. Link-only records (plugins, software) are discovery pointers, not endorsements. Verify publisher, compatibility and data handling before recommending one. Never run downloaded software.
