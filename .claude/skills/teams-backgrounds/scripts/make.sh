#!/usr/bin/env bash
# usage: bash make.sh <project folder> <set file relative to it> [--mirror]
# Builds the pages, renders PNGs to <project>/out/, writes the contact sheet and prints QA notes.
set -euo pipefail
P="${1:?give the project folder}"; SET="${2:?give the set file, e.g. sets/my-set.json}"
cd "$P"
rm -rf build; python3 build.py "$SET"
node render.js
if [ "${3:-}" = "--mirror" ]; then python3 sheet.py --mirror; fi
echo "PNGs: $(pwd)/out"
