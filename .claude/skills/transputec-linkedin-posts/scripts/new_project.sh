#!/usr/bin/env bash
# usage: bash new_project.sh <destination folder>
# Copies the LinkedIn slide engine into <destination>. Work inside <destination>/li.
set -euo pipefail
DEST="${1:?give a destination folder}"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
if [ -e "$DEST/li/kit.py" ]; then echo "Engine already in $DEST (kept as is, nothing overwritten)"; exit 0; fi
mkdir -p "$DEST"
cp -r "$HERE/engine/." "$DEST/"
mkdir -p "$DEST/li/content" "$DEST/li/out"
cp "$HERE/references/examples/cloud_cost_hides.py" "$DEST/li/content/example_cloud_cost_hides.py"
echo "Engine ready. Next: cd \"$DEST/li\" ; write content/<name>.py ; bash ../build.sh content/<name>.py"
