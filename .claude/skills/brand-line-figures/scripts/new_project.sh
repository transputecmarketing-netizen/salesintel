#!/usr/bin/env bash
# usage: bash new_project.sh <destination folder>
# Copies the figure engine into <destination>. Run every command from inside <destination>.
set -euo pipefail
DEST="${1:?give a destination folder}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
if [ -e "$DEST/export_figures.js" ]; then echo "Engine already in $DEST (kept as is, not overwritten)"; exit 0; fi
mkdir -p "$DEST"; cp -r "$HERE/engine/." "$DEST/"; cp "$HERE/scripts/make_set.sh" "$DEST/"
node -e "require('playwright')" 2>/dev/null || echo "WARNING: node cannot find playwright; npm i playwright (and npx playwright install chromium)"
echo "Engine ready in $DEST. Next: cd \"$DEST\"; python3 find_figure.py \"<topic>\"; bash make_set.sh <palette> <names...>"
