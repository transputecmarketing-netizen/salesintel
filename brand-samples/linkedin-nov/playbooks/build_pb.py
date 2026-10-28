from pbkit import Book, CSS, glow, LOGO_W, GREY, BRIGHT, BLUE, NAVY
from content import BOOKS
import json
books = [f() for f in BOOKS]
names = ["W1-AWS-Consultancy-vs-Managed-Services", "W2-Five-Places-Cloud-Cost-Hides", "W3-What-FinOps-Actually-Is", "W4-Real-Cost-of-a-Device-Fleet", "W5-AWS-Cost-Control-Checklist"]
for b, n in zip(books, names): b.build(f"{n}.html")
# combined, end to end
m = Book("November 2026 playbooks", "Cost control series"); m.how = ""
starts, off = [], 2
for b in books:
    starts.append(off + 1); off += len(b.pages)
total = off
cover = f'''<section class="pg dark">{glow(30,-120,280,.42)}{glow(-90,190,220,.16,"59,139,255")}
<img src="{LOGO_W}" style="position:absolute;left:18mm;top:18mm;height:5.6mm">
<div style="position:absolute;left:18mm;right:18mm;top:140mm"><div class="ey">The cost control series</div>
<div style="font-weight:600;font-size:46pt;line-height:1.02;letter-spacing:-.045em;margin-top:6mm">November 2026<br><span class="b">Playbooks.</span></div>
<div class="lede" style="margin-top:8mm;width:160mm;font-size:13pt">Five practical playbooks across AWS, FinOps and IT Procurement. One cost-control story, building to the February webinar.</div></div>
<div style="position:absolute;left:18mm;right:18mm;bottom:16mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:{GREY}"><span>Transputec</span><span>transputec.com</span></div></section>'''
rows = "".join(f'<div style="display:grid;grid-template-columns:16mm 1fr 14mm;gap:6mm;padding:4.6mm 0;border-bottom:.25mm solid #E3E8F0;align-items:baseline"><span style="font-weight:700;font-size:20pt;color:{BLUE}">0{i+1}</span><div><div class="lab">{b.series}</div><div style="font-weight:600;font-size:14pt;letter-spacing:-.02em;margin-top:1.5mm">{b.short}</div><div class="tx" style="margin-top:1mm;font-size:8.8pt">{b.how}</div></div><span style="font-weight:600;font-size:9pt;color:#6B7A90;text-align:right">{s:02d}</span></div>' for i, (b, s) in enumerate(zip(books, starts)))
toc = f'''<section class="pg"><div class="run"><img src="../../assets/logo-blue.svg" style="height:3.4mm"><span>Contents</span></div>
<div class="ey">Inside</div><h1 style="margin-top:4mm">Five weeks,<br>five playbooks.</h1><div class="lede" style="margin-top:6mm;width:160mm;font-size:10.5pt">Read end to end, or go straight to the week you are posting.</div>
<div style="border-top:.25mm solid #E3E8F0;margin-top:9mm">{rows}</div>
<div class="folio"><span>November 2026 playbooks · Cost control series</span><span><b>02</b> / {total:02d}</span></div></section>'''
body = cover + toc + "".join(b.html(offset=s - 1, total=total) for b, s in zip(books, starts))
open("November-2026-Playbooks-Complete.html", "w", encoding="utf8").write(f'<!doctype html><meta charset="utf8"><title>November 2026 Playbooks</title><style>{CSS}</style>' + body)
json.dump(names + ["November-2026-Playbooks-Complete"], open("pb.json", "w"))
print([len(b.pages) for b in books], total)
