"""Build document modules into HTML.
usage: python3 build.py content/my_playbook.py [content/my_report.py ...]
Each module defines build() returning a book. Optional OUT = "File-Name" sets the output name.
Output: <OUT or derived name>.html in this folder (next to the kits, so relative asset paths resolve)."""
import importlib.util, sys, os, re
sys.path.insert(0, "."); sys.path.insert(0, "content")
for f in sys.argv[1:]:
    spec = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    b = m.build()
    kind = "Report" if hasattr(b, "rep_cover") and type(b).__name__ in ("RBook", "CCReport") else "Playbook"
    name = getattr(m, "OUT", None) or f"{getattr(m, 'PREFIX', 'DOC')}-{int(getattr(b, 'num', 0) or 0):02d}-{kind}-" + re.sub(r"[^A-Za-z0-9-]", "", b.short.replace(" ", "-"))
    b.build(name + ".html"); print(f, "->", name + ".html", len(b.pages), "pages")
