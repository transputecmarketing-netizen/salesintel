#!/usr/bin/env bash
# Rebuild the published Crises Control industry series (6 playbooks + 6 reports, series front, complete edition).
# usage: bash build_series.sh <project folder> [cp01 cr01 ...]   (no module names = all twelve)
set -euo pipefail
DEST="${1:?give a project folder}"; shift || true
HERE="$(cd "$(dirname "$0")/.." && pwd)"
bash "$HERE/scripts/new_project.sh" "$DEST" >/dev/null
cd "$DEST/studio/docs"
mkdir -p content pdf
cp -n "$HERE"/series/content/*.py content/ 2>/dev/null || true
cp -n "$HERE"/series/notes/*.md content/ 2>/dev/null || true
python3 - "$@" <<'PY'
import importlib, sys, os
sys.path.insert(0, "."); sys.path.insert(0, "content")
mods = sorted(f[:-3] for f in os.listdir("content") if f[:2] in ("cp", "cr") and f[2:4].isdigit() and f.endswith(".py"))
if len(sys.argv) > 1: mods = [m for m in mods if m in sys.argv[1:]]
for m in mods:
    b = importlib.import_module(m).build(); kind = "Playbook" if m.startswith("cp") else "Report"
    name = f"CC-{m[2:]}-{kind}-" + "".join(ch for ch in b.short.replace(" ", "-") if ch.isalnum() or ch == "-")
    b.build(name + ".html"); print(m, len(b.pages), "pages", name + ".html")
PY
node check.js CC-0[1-6]-*.html
node render.js CC-0[1-6]-*.html >/dev/null
python3 "$HERE/series/series_front.py"
node render.js CC-00-Series-Front.html >/dev/null
pdfunite pdf/CC-00-Series-Front.pdf $(ls pdf/CC-0[1-6]-Playbook-*.pdf pdf/CC-0[1-6]-Report-*.pdf | sort -t- -k2,2 -k3,3) pdf/Crises-Control-Industry-Series-Complete.pdf
echo "Done: PDFs in $DEST/studio/docs/pdf"
