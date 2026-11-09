import importlib, sys, os
sys.path.insert(0, "."); sys.path.insert(0, "cc")
mods = sorted(f[:-3] for f in os.listdir("cc") if f[:2] in ("cp", "cr") and f.endswith(".py"))
if len(sys.argv) > 1: mods = [m for m in mods if m in sys.argv[1:]]
for m in mods:
    b = importlib.import_module(m).build(); kind = "Playbook" if m.startswith("cp") else "Report"
    name = f"CC-{m[2:]}-{kind}-" + "".join(ch for ch in b.short.replace(" ", "-") if ch.isalnum() or ch == "-")
    b.build(name + ".html"); print(m, len(b.pages), "pages", name + ".html")
