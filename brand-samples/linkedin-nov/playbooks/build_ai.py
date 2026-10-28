import importlib, sys, json, os
sys.path.insert(0, "."); sys.path.insert(0, "ai")
mods = sorted(f[:-3] for f in os.listdir("ai") if f.startswith("pb") and f.endswith(".py"))
if len(sys.argv) > 1: mods = [m for m in mods if m in sys.argv[1:]]
done = []
for m in mods:
    b = importlib.import_module(m).build(); name = f"AI-{m[2:]}-" + b.short.replace(" ", "-").replace(",", "").replace("?", "").replace("'", "").replace(":", "")
    b.build(name + ".html"); done.append(name); print(m, len(b.pages), "pages", name)
if len(sys.argv) == 1: json.dump(done, open("pb.json", "w"))
