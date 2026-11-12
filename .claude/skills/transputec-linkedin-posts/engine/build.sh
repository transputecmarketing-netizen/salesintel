#!/usr/bin/env bash
# usage (from the li folder): bash ../build.sh content/<name>.py [--video] [--fps 30] [--no-render]
# Builds HTML, renders PNGs, carousel PDF, A4 one-pager, review pack (and MP4 with --video) into li/out/<name>/.
set -euo pipefail
LI="$(cd "$(dirname "$0")/li" && pwd)"
SRC="$(cd "$(dirname "$1")" && pwd)/$(basename "$1")"; shift
cd "$LI" && python3 build.py "$SRC" "$@"
