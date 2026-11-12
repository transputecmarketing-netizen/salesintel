#!/usr/bin/env bash
# usage (inside a project folder made by new_project.sh):
#   bash make_set.sh <palette> [figure or subject names... | all] [-- extra export_figures.js options]
# Exports the named hairline figures and isoart subjects in <palette>, dark and light, PNG + SVG,
# trimmed, at 2400 px wide, then writes one contact sheet per theme into out/.
# Names are routed automatically: hairline figure names go to export_figures.js, isoart subjects to isoart.py.
# Custom subjects: put them in subjects/*.py (every file there is loaded).
set -euo pipefail
cd "$(dirname "$0")"
PAL="${1:?palette name (see palettes.json)}"; shift
NAMES=(); EXTRA=()
while [ $# -gt 0 ]; do if [ "$1" = "--" ]; then shift; EXTRA=("$@"); break; fi; NAMES+=("$1"); shift; done
[ ${#NAMES[@]} -eq 0 ] && NAMES=(all)
MODS=(); for m in subjects/*.py; do [ -e "$m" ] && MODS+=(--module "$m"); done
HL=$(node -e "const a=JSON.parse(require('fs').readFileSync('catalogue.json')).figures.filter(f=>f.kind==='hairline').map(f=>f.name);console.log(a.join(' '))")
ISO=$(python3 isoart.py --list "${MODS[@]}" | awk '{print $1}' | tr '\n' ' ')
H=(); I=()
for n in "${NAMES[@]}"; do
  if [ "$n" = all ]; then H=(all); I=(all); continue; fi
  if [[ " $HL " == *" $n "* ]]; then H+=("$n"); elif [[ " $ISO " == *" $n "* ]]; then I+=("$n"); else echo "unknown name: $n (python3 find_figure.py --all; python3 isoart.py --list)"; exit 2; fi
done
[ ${#H[@]} -gt 0 ] && node export_figures.js "${H[@]}" --palette "$PAL" --out out/figures --svg --trim "${EXTRA[@]}"
[ ${#I[@]} -gt 0 ] && python3 isoart.py "${I[@]}" "${MODS[@]}" --palette "$PAL" --out out/iso --png
for th in dark light; do
  D=(); [ -d "out/figures/$PAL/$th" ] && D+=("out/figures/$PAL/$th"); [ -d "out/iso/$PAL/$th" ] && D+=("out/iso/$PAL/$th")
  [ ${#D[@]} -gt 0 ] && python3 contact_sheet.py "${D[@]}" --out "out/sheet_${PAL}_${th}.png"
done
echo "Done. LOOK at out/sheet_${PAL}_dark.png and out/sheet_${PAL}_light.png before using anything."
