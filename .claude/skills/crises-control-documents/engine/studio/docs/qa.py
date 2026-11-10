"""Full QA for one or more built HTML documents.
usage: python3 qa.py <file.html> [...] [--brand cc|transputec] [--sheets DIR]
 1. check.js: text past the footer, CSS column overflow
 2. text lint: em/en dashes, AI-sounding phrases, wrong brand name
 3. render.js -> pdf/<name>.pdf, then contact sheets (6 pages per PNG) in --sheets DIR for visual review
Exit code 1 if any automatic check fails. Always LOOK at the contact sheets afterwards."""
import sys, os, re, subprocess, html as H
args = sys.argv[1:]; brand = "transputec"; sheets = "qa-sheets"
if "--brand" in args: i = args.index("--brand"); brand = args[i + 1]; del args[i:i + 2]
if "--sheets" in args: i = args.index("--sheets"); sheets = args[i + 1]; del args[i:i + 2]
BANNED = ["in today's fast-paced", "unlock", "delve", "game-changer", "game changer", "revolutionise", "harness the power", "landscape is evolving", "navigate the complexities", "seamless"]
bad = 0
r = subprocess.run(["node", "check.js", *args], capture_output=True, text=True); print(r.stdout.strip() or r.stderr)
if "overflow" in r.stdout or r.returncode: bad = 1
for f in args:
    t = open(f, encoding="utf8").read()
    vis = H.unescape(re.sub(r"<style.*?</style>|<script.*?</script>|<[^>]+>", " ", t, flags=re.S))
    probs = []
    if re.search("[—–]", vis): probs.append("em/en dash: " + ", ".join(sorted(set(m.group(0).strip() for m in re.finditer(r".{0,25}[—–].{0,25}", vis)))[:4]))
    for w in BANNED:
        if w in vis.lower(): probs.append(f'phrase "{w}"')
    if brand == "cc" and re.search("transputec", vis, re.I): probs.append("mentions Transputec")
    if brand == "transputec" and re.search("crises control", vis, re.I): probs.append("mentions Crises Control (check this is intended)")
    print(f, "text:", "OK" if not probs else "\n  " + "\n  ".join(probs)); bad |= bool(probs and not all("check this" in p for p in probs))
subprocess.run(["node", "render.js", *args], check=True)
os.makedirs(sheets, exist_ok=True)
from PIL import Image
for f in args:
    stem = os.path.basename(f)[:-5]; pre = os.path.join(sheets, stem)
    subprocess.run(["pdftocairo", "-png", "-r", "40", f"pdf/{stem}.pdf", pre], check=True)
    pngs = sorted(p for p in os.listdir(sheets) if p.startswith(stem + "-") and p.endswith(".png") and "sheet" not in p)
    for k in range(0, len(pngs), 6):
        ims = [Image.open(os.path.join(sheets, p)) for p in pngs[k:k + 6]]; w, h = ims[0].size
        sh = Image.new("RGB", (w * 3 + 40, h * 2 + 30), "#888"); [sh.paste(im, (10 + (j % 3) * (w + 10), 10 + (j // 3) * (h + 10))) for j, im in enumerate(ims)]
        sh.save(os.path.join(sheets, f"{stem}.sheet{k // 6 + 1:02d}.png"))
    for p in pngs: os.remove(os.path.join(sheets, p))
    print(f, "-> pdf/" + stem + ".pdf, contact sheets in", sheets)
sys.exit(1 if bad else 0)
