#!/usr/bin/env bash
# usage: bash new_project.sh <destination folder>
# Copies the background engine into <destination>. Work, build and render inside it.
set -euo pipefail
DEST="${1:?give a destination folder}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
if [ -e "$DEST/build.py" ]; then echo "Engine already in $DEST (kept as is, not overwritten)"; exit 0; fi
mkdir -p "$DEST"; cp -r "$HERE/engine/." "$DEST/"
echo "Engine ready in $DEST"
echo "Next: write $DEST/sets/<name>.json (copy sets/example-*.json), then: bash $HERE/scripts/make.sh $DEST sets/<name>.json"
