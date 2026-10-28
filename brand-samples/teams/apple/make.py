import math, random
W, H = 1920, 1080
GRAIN = """<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>"""
def page(defs, body, logo="tl", dark="#05070C"):
    pos = {"tl": "left:76px;top:66px", "bl": "left:76px;bottom:62px", "tr": "right:76px;top:66px"}[logo]
    return f'''<!doctype html><meta charset="utf-8"><style>*{{margin:0}}body{{width:{W}px;height:{H}px;overflow:hidden;background:{dark}}}svg{{position:absolute;left:0;top:0}}img{{position:absolute;{pos};height:26px;opacity:.92}}</style>
<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{GRAIN}{defs}</defs>{body}<rect width="{W}" height="{H}" filter="url(#gr)"/></svg><img src="../../assets/logo-white.svg">'''
def lg(id, stops, x1=0, y1=0, x2=0, y2=1):
    return f'<linearGradient id="{id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">' + "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops) + "</linearGradient>"
def rg(id, stops, cx=.5, cy=.5, r=.5, gu=""):
    return f'<radialGradient id="{id}" cx="{cx}" cy="{cy}" r="{r}" {gu}>' + "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops) + "</radialGradient>"
SH = '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="28"/><feOffset dx="-18" dy="-10"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
out = {}

# 1 Silk folds (macOS feel): broad overlapping sheets sweeping in from the right
defs = SH; body = ""
cols = [("#081430", "#16336E", "#2C72DB"), ("#0A1838", "#155DFC", "#7FB2FF"), ("#0B1E44", "#2C72DB", "#A9CBFF"), ("#07112A", "#1E5BD6", "#00B8DB"), ("#060E22", "#3B8BFF", "#E6F0FF")]
for i, (a, b, c) in enumerate(cols):
    defs += lg(f"f{i}", [(0, a, 1), (.6, b, 1), (1, c, 1)], 1, 1, 0, 0)
    body += f'<path filter="url(#sh)" fill="url(#f{i})" transform="rotate({-34 + i * 11} 2150 1250)" d="M 2150 1250 C 1500 1250 980 980 760 520 C 1250 700 1700 760 2150 700 Z"/>'
defs += lg("vg", [(0, "#05070C", .9), (.5, "#05070C", .2), (1, "#05070C", 0)], 0, 0, 1, 0)
out["silk"] = page(defs, f'<rect width="{W}" height="{H}" fill="#05070C"/>{body}<rect width="{W}" height="{H}" fill="url(#vg)"/>')

# 2 Layered waves (Big Sur feel, dark)
defs = '<filter id="ws" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dy="-14"/><feComponentTransfer><feFuncA type="linear" slope=".8"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
body = ""; bands = [("#0E2756", "#1B4FA8"), ("#0C2150", "#2C72DB"), ("#0A1B44", "#3B8BFF"), ("#081638", "#155DFC"), ("#06112C", "#2C72DB"), ("#050C20", "#16336E")]
for i, (a, b) in enumerate(bands):
    defs += lg(f"w{i}", [(0, b, 1), (1, a, 1)])
    y0 = 430 + i * 105; amp = 120 - i * 8; ph = i * .9
    pts = " ".join(f"{x},{y0 + math.sin(x / 520 + ph) * amp + math.sin(x / 210 + ph * 2) * 18:.1f}" for x in range(-40, W + 60, 20))
    body += f'<polygon filter="url(#ws)" fill="url(#w{i})" points="-40,{H+40} {pts} {W+60},{H+40}"/>'
defs += lg("sky", [(0, "#03050A", 1), (1, "#0B1A3A", 1)])
out["waves"] = page(defs, f'<rect width="{W}" height="{H}" fill="url(#sky)"/>{body}')

# 3 Light line: one continuous, elegant loop of light
P = []
for k in range(0, 1201):
    t = k / 1200 * 2 * math.pi
    x0 = 470 * math.sin(t); y0 = 250 * math.sin(t) * math.cos(t)
    x = 1400 + x0 * math.cos(-.32) - y0 * math.sin(-.32); y = 580 + x0 * math.sin(-.32) + y0 * math.cos(-.32)
    P.append(f"{x:.1f},{y:.1f}")
d = "M " + " L ".join(P) + " Z"
defs = lg("ln", [(0, "#00B8DB", 1), (.45, "#3B8BFF", 1), (1, "#155DFC", 1)], 1, 0, 0, 1) + '<filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26"/></filter><filter id="gl2"><feGaussianBlur stdDeviation="7"/></filter>'
defs += rg("bk", [(0, "#0B1A3A", 1), (1, "#03050A", 1)], .72, .55, .7)
body = f'<rect width="{W}" height="{H}" fill="url(#bk)"/><path d="{d}" fill="none" stroke="url(#ln)" stroke-width="40" opacity=".5" filter="url(#gl)"/><path d="{d}" fill="none" stroke="url(#ln)" stroke-width="10" opacity=".85" filter="url(#gl2)"/><path d="{d}" fill="none" stroke="#E6F0FF" stroke-width="2.4" opacity=".95"/>'
out["line"] = page(defs, body)

# 4 Liquid glass: magnifying glass pills over a colour field
field = ""
defs = '<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter>'
for x, y, r, c, a in [(1500, 300, 520, "#155DFC", 1), (1780, 820, 460, "#2C72DB", 1), (1150, 950, 420, "#00B8DB", .7), (1450, 600, 260, "#A9CBFF", .8), (300, 1000, 500, "#16336E", 1)]:
    field += f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{a}" filter="url(#bl)"/>'
defs += f'<g id="field"><rect width="{W}" height="{H}" fill="#05070C"/>{field}</g>'
body = '<use href="#field"/>'
for i, (x, y, w, h) in enumerate([(1180, 230, 560, 220), (1420, 520, 380, 380), (1060, 760, 520, 190)]):
    rr = min(w, h) / 2; cx, cy = x + w / 2, y + h / 2
    defs += f'<clipPath id="cp{i}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rr}"/></clipPath>' + lg(f"rim{i}", [(0, "#FFFFFF", .75), (.3, "#FFFFFF", .08), (.7, "#FFFFFF", .02), (1, "#FFFFFF", .45)], 0, 0, 1, 1) + lg(f"tint{i}", [(0, "#FFFFFF", .16), (1, "#FFFFFF", .02)])
    body += f'<g clip-path="url(#cp{i})"><use href="#field" transform="translate({cx} {cy}) scale(1.35) translate({-cx-30} {-cy+20})"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#tint{i})"/></g>'
    body += f'<rect x="{x+1}" y="{y+1}" width="{w-2}" height="{h-2}" rx="{rr-1}" fill="none" stroke="url(#rim{i})" stroke-width="2.5"/>'
out["liquid"] = page(defs, body)

# 5 Bloom: an Apple-event style colour bloom on black, low right
defs = '<filter id="bb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>'
bl = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{a}" filter="url(#bb)" style="mix-blend-mode:screen"/>' for x, y, rx, ry, c, a in [(1500, 1080, 620, 300, "#155DFC", 1), (1650, 1040, 380, 220, "#00B8DB", .85), (1350, 1020, 300, 180, "#A9CBFF", .7), (1750, 1100, 520, 260, "#2C72DB", .9)])
out["bloom"] = page(defs, f'<rect width="{W}" height="{H}" fill="#020306"/>{bl}<ellipse cx="1520" cy="1010" rx="420" ry="34" fill="#E6F0FF" opacity=".35" filter="url(#bb)"/>', dark="#020306")

# 6 Petals: translucent petals fanning from off-frame
defs = '<filter id="pb"><feGaussianBlur stdDeviation="1.2"/></filter>'
body = f'<rect width="{W}" height="{H}" fill="#04060B"/>'
for i in range(14):
    t = i / 13; c = ["#155DFC", "#2C72DB", "#3B8BFF", "#00B8DB", "#A9CBFF"][i % 5]
    defs += lg(f"p{i}", [(0, c, 0), (.6, c, .32), (1, c, .7)], 0, 0, 1, 0)
    body += f'<g transform="rotate({-4 + t * 84} 2000 1150)"><ellipse cx="1350" cy="1150" rx="680" ry="120" fill="url(#p{i})" style="mix-blend-mode:screen" filter="url(#pb)"/></g>'
out["petals"] = page(defs, body)

# 7 Sheen: one vast, polished curved surface (dark, precise)
defs = lg("s1", [(0, "#03050A", 1), (.5, "#0D2452", 1), (.78, "#2C72DB", 1), (.86, "#CFE2FF", 1), (.9, "#2C72DB", 1), (1, "#0A1838", 1)], 0, 0, 1, 1)
defs += lg("s2", [(0, "#03050A", 0), (1, "#03050A", 1)], 1, 0, 0, 0)
body = f'<rect width="{W}" height="{H}" fill="#03050A"/><path d="M 700 1180 C 1000 700 1500 260 2100 -120 L 2100 1180 Z" fill="url(#s1)"/><path d="M 1100 1180 C 1350 820 1700 520 2100 300 L 2100 1180 Z" fill="#05070C" opacity=".55"/><rect width="{W}" height="{H}" fill="url(#s2)" opacity=".5"/>'
out["sheen"] = page(defs, body)

# 8 Orbit: thin precise rings and a single lit point (Apple keynote minimalism)
defs = rg("sp", [(0, "#CFE2FF", 1), (.25, "#3B8BFF", 1), (.7, "#155DFC", 1), (1, "#0A1838", 1)], .35, .3, .8) + rg("og", [(0, "#3B8BFF", .9), (.4, "#155DFC", .3), (1, "#155DFC", 0)]) + '<filter id="ob"><feGaussianBlur stdDeviation="10"/></filter>'
rings = "".join(f'<ellipse cx="1480" cy="560" rx="{260 + k * 120}" ry="{90 + k * 42}" fill="none" stroke="#9CC3FF" stroke-opacity="{.38 - k * .05}" stroke-width="{1.4 if k else 2}" transform="rotate(-14 1480 560)"/>' for k in range(7))
body = f'<rect width="{W}" height="{H}" fill="#04060B"/><circle cx="1480" cy="560" r="520" fill="url(#og)" opacity=".55"/>{rings}<circle cx="1480" cy="560" r="120" fill="url(#sp)"/><circle cx="1870" cy="470" r="9" fill="#E6F0FF"/><circle cx="1870" cy="470" r="22" fill="#3B8BFF" filter="url(#ob)"/>'
out["orbit"] = page(defs, body)

for k, v in out.items(): open(f"{k}.html", "w").write(v)
print(list(out))
