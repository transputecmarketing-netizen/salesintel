import sys, subprocess
import sys, os; sys.path.insert(0, ".")
from cckit import CCBook, dial, strip, LOGO, INK, SKY, RED, BLUE, AMBER, GREEN, MUTE
import glob
from pypdf import PdfReader
def n(pat): return len(PdfReader(glob.glob("pdf/" + pat)[0]).pages)
W = [("01", "Financial Services and Insurance", "Within tolerance", n("CC-01-Playbook*"), "Resilience, regulated", n("CC-01-Report*")),
     ("02", "Property, Housing and Facilities", "Every resident reached", n("CC-02-Playbook*"), "Safe homes, clear duties", n("CC-02-Report*")),
     ("03", "Retail", "Keep the shutters up", n("CC-03-Playbook*"), "When the tills go dark", n("CC-03-Report*")),
     ("04", "Transport and Logistics", "Keep it moving", n("CC-04-Playbook*"), "The Heathrow lesson", n("CC-04-Report*")),
     ("05", "Hospitality", "Every guest, every shift", n("CC-05-Playbook*"), "Safe in a crowd", n("CC-05-Report*")),
     ("06", "Healthcare", "Major incident, minute one", n("CC-06-Playbook*"), "When the lab went dark", n("CC-06-Report*"))]
b = CCBook("Industry Series", 0, "hub", "Six industries", "9 November 2026")
b._wrap(f'''<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 80% 22%,#16263A 0%,{INK} 58%)"></div>
<div style="position:absolute;right:-30mm;top:40mm;width:170mm">{dial(fig="hub", figw=64)}</div>
<img src="{LOGO}" style="position:absolute;left:18mm;top:16mm;height:19mm">
<div style="position:absolute;left:18mm;top:40mm;font-family:JBM;font-size:7pt;letter-spacing:.16em;color:{SKY};text-transform:uppercase">Industry series · UK, US, Europe and the Middle East</div>
<div style="position:absolute;left:18mm;top:60mm;width:74mm;border-left:.4mm solid rgba(255,255,255,.16);padding-left:4mm;font-family:JBM;font-size:7pt;line-height:2.15;color:rgba(255,255,255,.7)">
{"".join(f'<div><span style="color:{c}">●</span> {d} &nbsp;{i}</div>' for (d, i, *_), c in zip(W, [RED, SKY, AMBER, GREEN, SKY, RED]))}</div>
<div style="position:absolute;left:18mm;right:18mm;bottom:52mm"><span style="display:inline-block;padding:1.4mm 3.6mm;border:.3mm solid {RED};color:#fff;border-radius:99px;font-size:7.4pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase"><span style="display:inline-block;width:1.8mm;height:1.8mm;border-radius:50%;background:{RED};margin-right:2mm;vertical-align:.2mm"></span>6 playbooks · 6 reports</span>
<div style="font-weight:600;font-size:54pt;line-height:.98;letter-spacing:-.055em;margin-top:7mm">Six industries.<br><span style="color:{SKY}">One plan.</span></div>
<div style="font-weight:300;font-size:12.5pt;line-height:1.5;color:rgba(255,255,255,.78);margin-top:6mm;width:158mm">A practical crisis playbook and an evidence-based intelligence report for each of six industries, with a standard toolkit in every playbook.</div></div>
<div style="position:absolute;left:18mm;right:18mm;bottom:26mm">{strip(labels=("Finance", "Property", "Retail", "Transport", "Hospitality", "Healthcare"))}</div>
<div style="position:absolute;left:18mm;right:18mm;bottom:13mm;display:flex;justify-content:space-between;font-family:JBM;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5)"><span>Prepare · Communicate · Protect</span><span>crises-control.com</span></div>''', True, folio=False)
p = 3; rows = ""
for i, (d, ind, pb, pn, rp, rn) in enumerate(W):
    rows += f'''<div style="display:grid;grid-template-columns:30mm 1fr;gap:6mm;padding:6mm 0;border-top:.25mm solid #E3E8F0">
      <div><div style="font-family:JBM;font-size:7.4pt;letter-spacing:.12em;color:{RED};text-transform:uppercase">Industry {d}</div></div>
      <div><div style="font-weight:600;font-size:14pt;letter-spacing:-.02em">{ind}</div>
      <div style="display:flex;justify-content:space-between;margin-top:2.4mm;font-size:10pt"><span><span style="font-family:JBM;font-size:7.4pt;color:{BLUE};letter-spacing:.1em">PLAYBOOK</span> &nbsp;{pb}</span><span style="font-family:JBM;color:#6B7A90">p. {p:03d}</span></div>
      <div style="display:flex;justify-content:space-between;margin-top:1.4mm;font-size:10pt"><span><span style="font-family:JBM;font-size:7.4pt;color:{BLUE};letter-spacing:.1em">REPORT</span> &nbsp;&nbsp;&nbsp;{rp}</span><span style="font-family:JBM;color:#6B7A90">p. {p+pn:03d}</span></div></div></div>'''
    p += pn + rn
b._wrap(f'<div class="ey">Inside this edition</div><h1 style="margin-top:4mm">Six industries, twelve guides.</h1><div class="lede" style="margin-top:5mm;width:160mm;font-size:11pt">Each industry pairs a practical crisis playbook with an evidence-based intelligence report. Page numbers refer to this combined edition. Last reviewed: November 2026.</div><div style="margin-top:10mm;border-bottom:.25mm solid #E3E8F0">{rows}</div>', sec="Contents", folio=False)
b.build("CC-00-Series-Front.html"); print(len(b.pages), "front pages; total", p - 1)
