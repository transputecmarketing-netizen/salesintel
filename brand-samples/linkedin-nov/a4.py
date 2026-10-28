from kit import NAVY, CARD, BLUE, BRIGHT, GREY, WHITE, FONTS, icon
from playbook import W, rules, conf, L
CAP = {
 1: ["Editorial · consultancy vs managed service", "Quote card · optional second post"],
 2: ["Cover", "Start here", "01 Idle and oversized compute", "02 Storage nobody deletes", "03 Data on the move", "04 Forgotten environments", "05 Commitments that do not fit", "Call to action"],
 3: ["Myth vs reality card"],
 4: ["Editorial · the laptop is the cheap part", "Carousel cover", "The price tag", "01 Deploy", "02 Support and repair", "03 Secure", "04 Retire", "Call to action · offer to confirm"],
 5: ["Cover", "How to use it", "01 Give every resource an owner", "02 Switch off what is idle", "03 Clear out old storage", "04 Match commitments to usage", "05 Set alerts, then review", "Summary and call to action"],
}
SB = [("0 to 4s", "FinOps is not a tool."), ("4 to 8s", "It is a discipline."), ("8 to 12s", "01 Visibility"), ("12 to 16s", "02 Accountability"),
      ("16 to 20s", "03 Optimisation"), ("20 to 24s", "04 Continuous review"), ("24 to 30s", "Not a project. A habit."), ("30 to 36s", "Call to action")]
SBF = ["f00060", "f00180", "f00300", "f00420", "f00540", "f00660", "f00810", "f00990"]
CSS = FONTS + f"""@page{{size:A4;margin:0}}*{{box-sizing:border-box;margin:0}}body{{background:{NAVY}}}
.p{{width:210mm;height:297mm;position:relative;overflow:hidden;background:{NAVY};color:{WHITE};font-family:Poppins;page-break-after:always;padding:92px 60px 70px}}
.g{{position:absolute;border-radius:50%;pointer-events:none}}
.top{{position:absolute;left:60px;right:60px;top:38px;display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:{GREY};font-weight:500}}
.bot{{position:absolute;left:60px;right:60px;bottom:30px;display:flex;justify-content:space-between;font-size:9px;color:{GREY};letter-spacing:.04em}}
.lbl{{font-weight:600;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:{BRIGHT}}}
h1{{font-weight:600;font-size:40px;line-height:1.06;letter-spacing:-.035em;margin-top:10px}}.b{{color:{BRIGHT}}}
.card{{background:{CARD};border:1px solid rgba(174,186,204,.14);border-radius:14px;padding:18px 20px}}
.t{{font-size:12.5px;line-height:1.6;color:{GREY};font-weight:300}}.t b{{color:{WHITE};font-weight:500}}
.copy{{font-size:11.5px;line-height:1.62;color:{WHITE};font-weight:300;white-space:pre-line}}
.chip{{display:inline-block;padding:4px 10px;border-radius:99px;border:1px solid rgba(59,139,255,.5);font-size:9.5px;color:{BRIGHT};margin:0 5px 5px 0;font-weight:500}}
.sl img{{width:100%;display:block;border-radius:8px;border:1px solid rgba(174,186,204,.18)}}
.cap{{font-size:10px;color:{GREY};margin-top:8px;display:flex;gap:8px}}.cap b{{color:{BRIGHT};font-weight:600}}
"""
def g(x, y, s, a=.2): return f'<div class="g" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;background:radial-gradient(circle,rgba(44,114,219,{a}),rgba(44,114,219,0) 65%)"></div>'
P = []
def pg(inner, sec):
    P.append((inner, sec))
def render():
    out = []
    for i, (inner, sec) in enumerate(P):
        if sec is None: out.append(inner); continue
        out.append(f'<div class="p">{g(380,-380,900)}<div class="top"><img src="{L}" style="height:13px"><span>{sec}</span></div>{inner}<div class="bot"><span>Transputec · November 2026 LinkedIn playbook</span><span>{i+1:02d}</span></div></div>')
    return "".join(out)

# cover
P.append((f'''<div class="p" style="padding:0">{g(150,-420,1100,.34)}{g(-400,700,900,.16)}
 <img src="{L}" style="position:absolute;left:60px;top:60px;height:20px">
 <div style="position:absolute;left:60px;right:60px;top:170px;display:flex;gap:16px;transform:rotate(-4deg);transform-origin:center">
  {"".join(f'<img src="out/{i}.png" style="width:210px;border-radius:10px;border:1px solid rgba(174,186,204,.2);box-shadow:0 30px 60px rgba(0,0,0,.5)">' for i in ["w2-01","w1-01","w5-01"])}</div>
 <div style="position:absolute;left:60px;right:60px;top:640px"><div class="lbl">LinkedIn content playbook</div>
  <div style="font-weight:600;font-size:76px;line-height:1;letter-spacing:-.045em;margin-top:16px">November <span class="b">2026</span></div>
  <div class="t" style="font-size:17px;margin-top:22px;max-width:560px">Five weeks. Three services. One cost-control story, building to the February webinar.</div>
  <div style="margin-top:28px">{"".join(f'<span class="chip" style="font-size:11px;padding:6px 14px">{s}</span>' for s in ["AWS","FinOps","IT Procurement"])}</div></div>
 <div class="bot"><span>Draft for review. Final copy supplied separately.</span><span>transputec.com</span></div></div>''', None))

# contents (page numbers computed later)
P.append(("CONTENTS", "Contents"))
# calendar
cal = "".join(f'''<div class="card" style="display:grid;grid-template-columns:56px 1fr;gap:16px;align-items:center;margin-bottom:12px;padding:18px 22px">
 <div style="font-weight:700;font-size:30px;color:{BRIGHT}">W{x["w"]}</div>
 <div><div style="display:flex;justify-content:space-between"><span class="lbl" style="font-size:8.5px">{x["svc"]}</span><span class="t" style="font-size:10.5px">{x["d"]}</span></div>
 <div style="font-weight:600;font-size:17px;margin-top:6px">{x["t"]}</div><div class="t" style="font-size:11px;margin-top:2px">{x["fmt"]}</div></div></div>''' for x in W)
pg(f'<div class="lbl">The month at a glance</div><h1>Calendar</h1><div class="t" style="margin:12px 0 30px;max-width:560px">One topic per week across AWS, FinOps and IT Procurement. Together they seed the cost-control story ahead of the February webinar.</div>{cal}', "Overview")
rg = "".join(f'<div class="card"><div class="lbl" style="font-size:8.5px">{a}</div><div class="t" style="margin-top:8px;color:{WHITE}">{b}</div></div>' for a, b in rules)
sw = "".join(f'<div><div style="height:70px;border-radius:10px;background:{c};border:1.5px solid rgba(174,186,204,.45)"></div><div class="t" style="font-size:10px;margin-top:6px"><b>{n}</b> {c}</div></div>' for n, c in [("Navy", NAVY), ("Blue", BLUE), ("Bright", BRIGHT), ("Grey", GREY)])
pg(f'<div class="lbl">Guardrails</div><h1>Design rules</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:30px">{sw}</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px">{rg}</div>', "Overview")

starts = {}
for x in W:
    w = x["w"]; starts[w] = len(P) + 1
    vid = '<div class="t" style="font-size:11px;margin-top:10px"><b>Video file:</b> w3-finops-explainer-1080x1920.mp4 · 36s · 30fps · muted-safe</div>' if x.get("video") else ""
    pg(f'''<div class="lbl">Week {w} · {x["d"]} · {x["svc"]}</div>
     <div style="font-weight:700;font-size:150px;line-height:.9;letter-spacing:-.06em;color:{BRIGHT};margin-top:24px">0{w}</div>
     <h1 style="font-size:44px;margin-top:18px">{x["t"]}</h1><div class="t" style="font-size:14px;margin-top:12px;max-width:600px">{x["ang"]}</div>
     <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:24px">
      <div class="card"><div class="lbl" style="font-size:8.5px">Format</div><div class="t" style="margin-top:6px;color:{WHITE}">{x["fmt"]}</div>{vid}</div>
      <div class="card" style="{'border-color:rgba(59,139,255,.7)' if w==4 else ''}"><div class="lbl" style="font-size:8.5px">Posting notes</div><div class="t" style="margin-top:6px;font-size:11px">{x["note"]}</div></div></div>
     <div style="display:grid;grid-template-columns:1fr 250px;gap:14px;margin-top:14px;align-items:start"><div class="card"><div class="lbl" style="font-size:8.5px">Draft post copy</div><div class="copy" style="margin-top:10px;font-size:12px">{x["copy"]}</div>
      <div style="margin-top:12px">{"".join(f'<span class="chip">{h}</span>' for h in x["tags"].split())}</div></div>
      <div class="sl"><img src="out/{x["imgs"][0]}.png"><div class="cap"><b>Lead</b><span>{CAP[w][0]}</span></div></div></div>''', f"Week {w} · {x['svc']}")
    imgs, caps = x["imgs"], CAP[w]
    per = 4
    for s in range(0, len(imgs), per):
        chunk = list(zip(imgs[s:s+per], caps[s:s+per], range(s+1, s+per+1)))
        cells = "".join(f'<div class="sl"><img src="out/{i}.png"><div class="cap"><b>{n:02d}</b><span>{c}</span></div></div>' for i, c, n in chunk)
        cols = "1fr 1fr" if len(chunk) > 1 else "380px"
        pg(f'<div class="lbl">Week {w} · {x["t"]}</div><div style="font-weight:600;font-size:20px;margin-top:6px">Assets {s+1} to {s+len(chunk)} of {len(imgs)} · 1080 x 1350</div><div style="display:grid;grid-template-columns:{cols};gap:22px 26px;margin-top:22px;{"justify-content:center" if len(chunk)==1 else ""}">{cells}</div>', f"Week {w} · {x['svc']}")
    if x.get("video"):
        cells = "".join(f'<div class="sl"><img src="out/storyboard/{f}.jpg"><div class="cap"><b>{a}</b></div><div class="t" style="font-size:10px;color:{WHITE}">{b}</div></div>' for f, (a, b) in zip(SBF, SB))
        pg(f'<div class="lbl">Week 3 · Video storyboard</div><div style="font-weight:600;font-size:20px;margin-top:6px">36 seconds · 1080 x 1920 · reads with the sound off</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px 14px;margin-top:22px">{cells}</div>', "Week 3 · AWS / FinOps")

cc = "".join(f'<div class="card" style="margin-bottom:12px"><div style="display:flex;gap:10px;align-items:center">{icon("check",24)}<div style="font-weight:600;font-size:16px">{a}</div></div><div class="t" style="margin-top:8px">{b}</div></div>' for a, b in conf)
pg(f'<div class="lbl">Before scheduling</div><h1>Confirm first</h1><div style="margin-top:28px">{cc}</div>', "Sign-off")
P.append((f'''<div class="p" style="padding:0">{g(-200,300,1100,.3)}<div style="position:absolute;left:60px;right:60px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
 <img src="{L}" style="height:26px;align-self:flex-start"><div style="font-weight:600;font-size:40px;letter-spacing:-.03em;margin-top:40px;line-height:1.1">Cost control,<br><span class="b">all the way to February.</span></div>
 <div class="t" style="font-size:14px;margin-top:20px">transputec.com</div></div></div>''', None))

ci = [("Calendar", 3), ("Design rules", 4)] + [(f"Week {x['w']} · {x['t']}", starts[x['w']]) for x in W] + [("Confirm first", len(P) - 1)]
rows = "".join(f'<div style="display:flex;justify-content:space-between;align-items:baseline;padding:22px 0;border-top:1px solid rgba(174,186,204,.14)"><span style="font-weight:500;font-size:18px">{a}</span><span style="font-weight:600;font-size:16px;color:{BRIGHT}">{b:02d}</span></div>' for a, b in ci)
P[1] = (f'<div class="lbl">Inside</div><h1>Contents</h1><div style="margin-top:34px;border-bottom:1px solid rgba(174,186,204,.14)">{rows}</div>', "Contents")
open("a4.html", "w", encoding="utf8").write(f'<!doctype html><meta charset="utf8"><style>{CSS}</style>' + render())
print(len(P), "pages")
