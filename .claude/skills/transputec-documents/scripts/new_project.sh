#!/usr/bin/env bash
# usage: bash new_project.sh <destination folder>
# Copies the design engine into <destination>. Work, build and QA inside <destination>/studio/docs.
set -euo pipefail
DEST="${1:?give a destination folder}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$DEST"; [ -e "$DEST/studio/docs/pbkit.py" ] && { echo "Engine already in $DEST (kept as is)"; exit 0; }; cp -r "$HERE/engine/." "$DEST/"
echo "Engine ready. Next: cd \"$DEST/studio/docs\" ; write content/<name>.py ; python3 build.py content/<name>.py ; python3 qa.py <name>.html"
