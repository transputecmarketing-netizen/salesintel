"""Find the figures that suit a topic, or print the catalogue.

  python3 find_figure.py "ransomware backup"        # ranked matches with what each depicts
  python3 find_figure.py --all                      # the whole catalogue
  python3 find_figure.py --md > catalogue.md        # catalogue as a Markdown table

Scores are word overlaps with each figure's topics and description, so phrase the query in plain
business words (security, network, backup, retail). Always read what the figure depicts before using it:
a match on one word is not relevance.
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
CAT = json.load(open(os.path.join(HERE, "catalogue.json")))["figures"]


def words(t): return set(w for w in re.findall(r"[a-z0-9]+", t.lower()) if len(w) > 2)


def score(f, q):
    tw = set().union(*(words(t) for t in f["topics"])); dw = words(f["depicts"]) | {f["name"]}
    phr = sum(3 for t in f["topics"] if t.lower() in " ".join(sys.argv[1:]).lower())
    return 2 * len(q & tw) + len(q & dw) + phr


def main():
    a = sys.argv[1:]
    if not a or a[0] in ("-h", "--help"): print(__doc__); return
    if a[0] == "--md":
        print("# Figure catalogue\n\nGenerated from engine/catalogue.json with `python3 find_figure.py --md`. Edit the JSON, not this file, then regenerate. hairline = export_figures.js; iso = isoart.py (subjects/*.py are loaded by make_set.sh).\n")
        print("| name | kind | depicts | suits | avoid |\n|---|---|---|---|---|")
        for f in CAT: print(f"| {f['name']} | {f['kind']} | {f['depicts']} | {', '.join(f['topics'])} | {f.get('avoid', '')} |")
        return
    if a[0] == "--all":
        for f in CAT: print(f"{f['name']:12} {f['kind']:8} {f['depicts']}\n{'':22}suits: {', '.join(f['topics'])}")
        return
    q = words(" ".join(a))
    hits = sorted(((score(f, q), f) for f in CAT), key=lambda x: -x[0])
    hits = [h for h in hits if h[0] > 0][:8]
    if not hits: print("No match. Try plainer words, or --all, or draw a custom isoart subject."); return
    for s, f in hits:
        print(f"{s:3}  {f['name']:12} {f['kind']:8} {f['depicts']}" + (f"\n{'':27}avoid: {f['avoid']}" if f.get("avoid") else ""))


if __name__ == "__main__":
    main()
