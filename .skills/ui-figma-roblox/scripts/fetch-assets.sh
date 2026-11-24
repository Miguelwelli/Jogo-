#!/usr/bin/env bash
# fetch-assets.sh — complete the ui-figma-roblox art library on demand.
#
# This repo ships only the core art (~16 MB) of the upstream skill. This script
# pulls the rest straight from github.com/grim-technologies-arch/ui-figma-roblox
# using a sparse, blob-filtered clone, so you download only what you ask for.
#
# Usage (paths relative to the skill root):
#   scripts/fetch-assets.sh --file files/Effects/2-download_url-quelly2.png
#   scripts/fetch-assets.sh --grep sunburst
#   scripts/fetch-assets.sh --grep halftone --category Effects
#   scripts/fetch-assets.sh --category Effects Backgrounds
#   scripts/fetch-assets.sh --all
#
# Options:
#   --file PATH...     manifest downloaded_path(s) to fetch
#   --grep WORD...     fetch every local file whose title/tags/description match
#   --category NAME... restrict --grep/--all to these Categories (Effects, ...)
#   --all              fetch every file in the manifest (~310 MB)
#   --dry-run          print what would be fetched, download nothing
#   -h, --help         this text
#
# Exit codes: 0 ok, 1 usage/copy/verification error, 2 nothing matched.

set -euo pipefail

REPO="grim-technologies-arch/ui-figma-roblox"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="$SKILL_DIR/assets/ui-resources"
MANIFEST="$ASSET_DIR/MANIFEST.csv"

FILES=()
GREPS=()
CATEGORIES=()
ALL=0
DRY_RUN=0

die() { printf 'error: %s\n' "$*" >&2; exit 1; }
usage() { sed -n '3,29p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

while (($#)); do
  case "$1" in
    --file) shift; (($#)) || die "--file needs a path"; while (($#)) && [[ "$1" != --* ]]; do FILES+=("$1"); shift; done ;;
    --grep) shift; (($#)) || die "--grep needs a word"; while (($#)) && [[ "$1" != --* ]]; do GREPS+=("$1"); shift; done ;;
    --category) shift; (($#)) || die "--category needs a name"; while (($#)) && [[ "$1" != --* ]]; do CATEGORIES+=("$1"); shift; done ;;
    --all) ALL=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "unknown option: $1 (try --help)" ;;
  esac
done

[[ -f "$MANIFEST" ]] || die "manifest not found: $MANIFEST"
(( ALL )) || ((${#FILES[@]})) || ((${#GREPS[@]})) || { usage; die "nothing to fetch"; }
command -v python3 >/dev/null || die "python3 is required"
command -v git >/dev/null || die "git is required"

# --- resolve targets -------------------------------------------------------
TARGETS_RAW="$(FILES_ENV="$(printf '%s\n' "${FILES[@]:-}")" \
  GREPS_ENV="$(printf '%s\n' "${GREPS[@]:-}")" \
  CATS_ENV="$(printf '%s\n' "${CATEGORIES[@]:-}")" \
  ALL="$ALL" python3 - "$MANIFEST" <<'PY'
import csv, os, sys

manifest = sys.argv[1]
files = [l for l in os.environ.get("FILES_ENV", "").splitlines() if l]
greps = [l.lower() for l in os.environ.get("GREPS_ENV", "").splitlines() if l]
cats = {l.strip().lower() for l in os.environ.get("CATS_ENV", "").splitlines() if l.strip()}
want_all = os.environ.get("ALL") == "1"

rows = [r for r in csv.DictReader(open(manifest, encoding="utf-8-sig")) if r.get("downloaded_path")]

def matches(r):
    if cats and r["category"].strip().lower() not in cats:
        return False
    if want_all:
        return True
    hay = (r["title"] + " " + r["tags"] + " " + r["description"]).lower()
    return any(g in hay for g in greps)

selected = {r["downloaded_path"]: r for r in rows if matches(r)}
for f in files:
    f = f.strip().lstrip("./")
    if not f.startswith("files/"):
        f = "files/" + f
    for r in rows:
        if r["downloaded_path"] == f:
            selected[f] = r
            break
    else:
        print(f"warn: not in manifest, will try anyway: {f}", file=sys.stderr)
        selected.setdefault(f, None)

for path, r in sorted(selected.items()):
    sha = (r or {}).get("sha256", "")
    print(f"{path}\t{sha}")
PY
)" || die "target resolution failed"

TARGETS=()
while IFS= read -r line; do [[ -n "$line" ]] && TARGETS+=("$line"); done <<<"$TARGETS_RAW"
((${#TARGETS[@]})) || { echo "Nothing matched the manifest. Try --help."; exit 2; }

SPARSE=()
MISSING=()
for line in "${TARGETS[@]}"; do
  rel="${line%%$'\t'*}"
  [[ -f "$ASSET_DIR/$rel" ]] && continue
  MISSING+=("$rel")
  SPARSE+=("assets/ui-resources/${rel%/*}")
done

echo "Matched ${#TARGETS[@]} file(s); ${#MISSING[@]} not yet bundled."
((${#MISSING[@]})) || { echo "Nothing to download."; exit 0; }
printf '  %s\n' "${MISSING[@]}"
(( DRY_RUN )) && exit 0

# --- sparse clone ----------------------------------------------------------
WORK="$(mktemp -d "${TMPDIR:-/tmp}/ufr-assets.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT

mapfile -t DIRS < <(printf '%s\n' "${SPARSE[@]}" | sort -u)

echo "Cloning $REPO (sparse, blob-filtered)..." >&2
git clone --quiet --depth 1 --filter=blob:none --sparse \
  "https://github.com/${REPO}.git" "$WORK/repo" >&2
git -C "$WORK/repo" sparse-checkout set --no-cone "${DIRS[@]}" >/dev/null

# --- copy + verify ---------------------------------------------------------
ok=0; bad=0; absent=0
for line in "${TARGETS[@]}"; do
  rel="${line%%$'\t'*}"; sha="${line#*$'\t'}"
  dest="$ASSET_DIR/$rel"
  [[ -f "$dest" ]] && continue
  src="$WORK/repo/assets/ui-resources/$rel"
  if [[ ! -f "$src" ]]; then
    echo "skip (not in upstream checkout): $rel" >&2; absent=$((absent + 1)); continue
  fi
  mkdir -p "$(dirname "$dest")"
  if [[ -n "$sha" ]] && command -v sha256sum >/dev/null; then
    got="$(sha256sum "$src" | cut -d' ' -f1)"
    if [[ "$got" != "$sha" ]]; then
      echo "FAIL checksum: $rel (expected $sha, got $got)" >&2; bad=$((bad + 1)); continue
    fi
  fi
  cp -p "$src" "$dest"
  ok=$((ok + 1))
done

echo "Copied $ok file(s) into assets/ui-resources/files/. Skipped: $absent absent, $bad failed checksum."
(( bad == 0 )) || exit 1
