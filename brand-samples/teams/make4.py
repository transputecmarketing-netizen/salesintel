import random, math, importlib.util
spec = importlib.util.spec_from_file_location("m3", "make3.py"); m3 = importlib.util.module_from_spec(spec); spec.loader.exec_module(m3)
CSS = m3.CSS + """
.wall{position:absolute;left:-60px;right:-60px;top:70px;height:700px;transform:perspective(1600px) rotateX(4deg);transform-origin:50% 100%;filter:blur(2.2px)}
.scr{position:absolute;border-radius:10px;background:#081227;border:3px solid #1a2440;box-shadow:0 0 40px rgba(21,93,252,.25);overflow:hidden}
.mono2{font-family:'JetBrains Mono';font-weight:500;letter-spacing:.18em;text-transform:uppercase}
"""
DEFS = m3.DEFS
r = random.Random(5)

def chart_line(w, h, col="#00B8DB", n=40, seed=1):
    rr = random.Random(seed); y = h * .6; pts = []
    for i in range(n + 1):
        y = max(h * .15, min(h * .9, y + rr.uniform(-h * .09, h * .08))); pts.append(f"{i * w / n:.0f},{y:.0f}")
    return (f'<svg width="{w}" height="{h}" style="position:absolute;left:0;bottom:0"><polyline points="{" ".join(pts)}" fill="none" stroke="{col}" stroke-width="3"/>'
            f'<polygon points="0,{h} {" ".join(pts)} {w},{h}" fill="{col}" fill-opacity=".12"/></svg>')
def bars(w, h, n=18, seed=2):
    rr = random.Random(seed); bw = w / n
    return f'<svg width="{w}" height="{h}" style="position:absolute;left:0;bottom:0">' + ''.join(f'<rect x="{i*bw+3:.0f}" y="{h-(hh:=rr.uniform(.2,.95)*h):.0f}" width="{bw-6:.0f}" height="{hh:.0f}" rx="3" fill="url(#gv)"/>' for i in range(n)) + '</svg>'
def ring(sz, frac, seed=3):
    c = 2 * math.pi * (sz * .38)
    return (f'<svg width="{sz}" height="{sz}" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%)"><circle cx="{sz/2}" cy="{sz/2}" r="{sz*.38}" fill="none" stroke="#1a2a50" stroke-width="{sz*.08}"/>'
            f'<circle cx="{sz/2}" cy="{sz/2}" r="{sz*.38}" fill="none" stroke="url(#gd)" stroke-width="{sz*.08}" stroke-linecap="round" stroke-dasharray="{c*frac:.0f} {c:.0f}" transform="rotate(-90 {sz/2} {sz/2})"/></svg>')
def dotmap(w, h, seed=4):
    rr = random.Random(seed); s = f'<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0">'
    for y in range(14, h, 16):
        for x in range(14, w, 16):
            v = math.sin(x / 47) + math.cos(y / 33) + math.sin((x + y) / 61)
            if v > .4: s += f'<circle cx="{x}" cy="{y}" r="3.2" fill="#2C72DB" fill-opacity=".55"/>'
    for _ in range(8):
        x, y = rr.randint(30, w - 30), rr.randint(30, h - 30); s += f'<circle cx="{x}" cy="{y}" r="16" fill="#00B8DB" fill-opacity=".2"/><circle cx="{x}" cy="{y}" r="6" fill="#00E0FF"/>'
    return s + '</svg>'
def term(w, h, seed=6):
    rr = random.Random(seed); s = f'<svg width="{w}" height="{h}" style="position:absolute;left:0;top:0">'
    for i, y in enumerate(range(20, h - 10, 22)):
        x = 20
        while x < w - 60:
            ww = rr.choice([30, 50, 70, 90, 40]); s += f'<rect x="{x}" y="{y}" width="{ww}" height="8" rx="4" fill="{rr.choice(["#00B8DB","#2C72DB","#3B4A6B","#3B4A6B"])}"/>'; x += ww + 12
            if rr.random() < .25: break
    return s + '</svg>'
def screen(x, y, w, h, inner, label=None):
    lab = f'<div class="mono2" style="position:absolute;left:16px;top:12px;font-size:13px;color:#7FA6E8">{label}</div>' if label else ''
    return f'<div class="scr" style="left:{x}px;top:{y}px;width:{w}px;height:{h}px">{inner}{lab}</div>'

def ops():
    W = 2040; cw, ch, g = 390, 215, 18
    tiles = []
    content = [
        (chart_line(cw, ch * .7, seed=11), "Network"), (dotmap(cw, ch, 3), "Sites"), (bars(cw, ch * .75, seed=4), "Service desk"), (f'<div style="position:absolute;inset:0">{ring(170, .82)}</div>', "Patching"), (term(cw, ch, 2), "SOC"),
        (term(cw, ch, 9), "Endpoint"), (f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><img src="../assets/logo-white.svg" style="width:300px;opacity:.9"></div>', None), (chart_line(cw, ch * .7, "#2C72DB", seed=21), "Cloud"), (dotmap(cw, ch, 8), "Identity"), (bars(cw, ch * .75, seed=12), "Backup"),
        (bars(cw, ch * .7, seed=7), "Email"), (f'<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:700 120px Poppins;letter-spacing:-6px;background:linear-gradient(90deg,#00B8DB,#155DFC);-webkit-background-clip:text;color:transparent">24/7</div>', "Operations"), (chart_line(cw, ch * .7, seed=31), "Latency"), (f'<div style="position:absolute;inset:0">{ring(170, .64)}</div>', "Compliance"), (term(cw, ch, 14), "Threat intel")]
    for i, (inner, lab) in enumerate(content):
        c, rw = i % 5, i // 5
        tiles.append(screen(c * (cw + g) + 30, rw * (ch + g) + 30, cw, ch, inner, lab))
    wall = f'<div class="wall"><svg width="0" height="0">{DEFS}</svg>{"".join(tiles)}</div>'
    refl = f'<div style="position:absolute;left:0;right:0;top:770px;height:310px;overflow:hidden;opacity:.35;filter:blur(6px)"><div style="position:absolute;left:-60px;right:-60px;top:-700px;height:700px;transform:scaleY(-1) perspective(1600px) rotateX(4deg);transform-origin:50% 100%">{"".join(tiles)}</div></div>'
    room = ('<div style="position:absolute;left:0;right:0;top:0;height:70px;background:linear-gradient(180deg,#05070f,#0a1020)"></div>'
            '<div style="position:absolute;left:0;right:0;top:66px;height:4px;background:linear-gradient(90deg,#00B8DB,#155DFC);box-shadow:0 0 30px #2C72DB"></div>'
            '<div style="position:absolute;left:0;right:0;top:770px;height:2px;background:rgba(127,166,232,.35)"></div>'
            '<div style="position:absolute;left:0;right:0;bottom:0;height:120px;background:linear-gradient(180deg,rgba(5,7,15,0),#05070f 70%)"></div>'
            '<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(5,7,15,.0) 40%,rgba(5,7,15,.6) 100%)"></div>')
    ui = ('<div style="position:absolute;left:84px;top:96px;padding:18px 26px;border-radius:18px;background:rgba(5,7,15,.62);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.12)"><img src="../assets/logo-white.svg" style="height:30px;display:block"></div>'
          '<div class="mono2" style="position:absolute;right:96px;bottom:86px;font-size:16px;color:rgba(255,255,255,.7)">24/7 Operations · London</div>')
    return f'<div class="bg" style="background:#0a1020">{wall}{refl}{room}{ui}</div>'

def window():
    lon = m3.london(); lon = lon[:lon.index('<img class="logo"')]
    city = f'<div style="position:absolute;inset:-20px;filter:blur(2px) saturate(1.1)">{lon}</div>'
    frame = ('<div style="position:absolute;inset:0;pointer-events:none">'
             + ''.join(f'<div style="position:absolute;left:{x}px;top:0;bottom:0;width:30px;background:linear-gradient(90deg,#03050b,#121a2e 45%,#03050b)"></div>' for x in (-6, 610, 1290, 1896))
             + '<div style="position:absolute;left:0;right:0;top:0;height:46px;background:linear-gradient(180deg,#03050b,#0e1528)"></div>'
             + '<div style="position:absolute;left:0;right:0;top:250px;height:18px;background:linear-gradient(180deg,#03050b,#121a2e 50%,#03050b)"></div></div>')
    glass = ('<div style="position:absolute;inset:0;background:linear-gradient(115deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.07) 38%,rgba(255,255,255,0) 46%,rgba(255,255,255,0) 62%,rgba(255,255,255,.05) 68%,rgba(255,255,255,0) 74%)"></div>')
    etch = ('<div style="position:absolute;left:1360px;top:300px;width:500px;height:130px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);backdrop-filter:blur(10px);border-radius:6px">'
            '<img src="../assets/logo-white.svg" style="width:400px;opacity:.75;filter:drop-shadow(0 0 1px rgba(255,255,255,.6))"></div>')
    ledge = ('<div style="position:absolute;left:0;right:0;bottom:0;height:150px;background:linear-gradient(180deg,#141d33 0%,#0a0f1d 30%,#05070f 100%);border-top:2px solid rgba(155,232,245,.25)"></div>'
             '<div style="position:absolute;left:0;right:0;bottom:118px;height:30px;background:linear-gradient(90deg,rgba(0,184,219,.0),rgba(0,184,219,.18),rgba(21,93,252,.18),rgba(21,93,252,0));filter:blur(8px)"></div>')
    return f'<div class="bg">{city}{glass}{frame}{etch}{ledge}<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:90px;height:30px"></div>'

def blueprint():
    s = ['<svg width="1920" height="1080">']
    for x in range(0, 1921, 24): s.append(f'<line x1="{x}" y1="0" x2="{x}" y2="1080" stroke="#4C8DFF" stroke-opacity="{.22 if x % 120 == 0 else .08}"/>')
    for y in range(0, 1081, 24): s.append(f'<line x1="0" y1="{y}" x2="1920" y2="{y}" stroke="#4C8DFF" stroke-opacity="{.22 if y % 120 == 0 else .08}"/>')
    L = 'stroke="#7FD8F0" stroke-width="2" fill="none"'
    # isometric server rack, left
    ox, oy, w, d, h = 300, 860, 210, 170, 430
    cos, sin = math.cos(math.radians(30)), math.sin(math.radians(30))
    def P(x, y, z): return (ox + (x - y) * cos, oy - z + (x + y) * sin)
    def poly(pts): return 'M' + ' L'.join(f'{a:.1f},{b:.1f}' for a, b in pts) + ' Z'
    s.append(f'<path d="{poly([P(0,0,0),P(w,0,0),P(w,0,h),P(0,0,h)])}" {L}/>')
    s.append(f'<path d="{poly([P(0,0,h),P(w,0,h),P(w,-d,h),P(0,-d,h)])}" {L}/>')
    s.append(f'<path d="{poly([P(0,0,0),P(0,-d,0),P(0,-d,h),P(0,0,h)])}" {L}/>')
    for k in range(1, 12):
        z = k * h / 12; a, b = P(6, 0, z), P(w - 6, 0, z); s.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#EAF6FF" stroke-opacity=".7" stroke-width="1.4"/>')
        c = P(w - 22, 0, z - h / 24); s.append(f'<circle cx="{c[0]:.1f}" cy="{c[1]:.1f}" r="3" fill="#00E0FF"/>')
    a, b = P(0, 0, -30), P(w, 0, -30); s.append(f'<line x1="{a[0]:.0f}" y1="{a[1]:.0f}" x2="{b[0]:.0f}" y2="{b[1]:.0f}" stroke="#9BE8F5" stroke-width="1.4"/>')
    s.append(f'<text x="{(a[0]+b[0])/2-40:.0f}" y="{(a[1]+b[1])/2+28:.0f}" font-family="JetBrains Mono" font-size="15" fill="#9BE8F5" letter-spacing="2">600 MM</text>')
    s.append(f'<text x="70" y="250" font-family="JetBrains Mono" font-size="16" fill="#EAF6FF" letter-spacing="3">FIG. 01 · RACK, LONDON</text><line x1="70" y1="262" x2="360" y2="262" stroke="#EAF6FF" stroke-width="1.4"/>')
    # cloud + network, right
    cx, cy = 1640, 330
    s.append(f'<path d="M{cx-150},{cy+60} a60,60 0 0 1 30,-112 a80,80 0 0 1 150,-20 a70,70 0 0 1 120,40 a55,55 0 0 1 -20,92 Z" {L}/>')
    nodes = [(1460, 640), (1640, 600), (1810, 660), (1540, 820), (1740, 840)]
    for (x, y) in nodes: s.append(f'<line x1="{cx}" y1="{cy+60}" x2="{x}" y2="{y}" stroke="#EAF6FF" stroke-opacity=".55" stroke-width="1.4" stroke-dasharray="6 6"/>')
    for i, (x, y) in enumerate(nodes):
        s.append(f'<rect x="{x-46}" y="{y-28}" width="92" height="56" rx="6" {L}/><line x1="{x-30}" y1="{y+40}" x2="{x+30}" y2="{y+40}" stroke="#EAF6FF" stroke-width="2"/>'
                 f'<text x="{x}" y="{y+6}" text-anchor="middle" font-family="JetBrains Mono" font-size="13" fill="#9BE8F5" letter-spacing="2">{["CYBER","CLOUD","AI","DESK","M365"][i]}</text>')
    s.append(f'<text x="1440" y="250" font-family="JetBrains Mono" font-size="16" fill="#EAF6FF" letter-spacing="3">FIG. 02 · ONE NETWORK</text><line x1="1440" y1="262" x2="1760" y2="262" stroke="#EAF6FF" stroke-width="1.4"/>')
    # title block
    tb = (1440, 930, 440, 120)
    s.append(f'<rect x="{tb[0]}" y="{tb[1]}" width="{tb[2]}" height="{tb[3]}" {L}/><line x1="{tb[0]}" y1="{tb[1]+40}" x2="{tb[0]+tb[2]}" y2="{tb[1]+40}" stroke="#EAF6FF" stroke-width="1.4"/><line x1="{tb[0]+220}" y1="{tb[1]+40}" x2="{tb[0]+220}" y2="{tb[1]+tb[3]}" stroke="#EAF6FF" stroke-width="1.4"/>'
             f'<text x="{tb[0]+16}" y="{tb[1]+27}" font-family="JetBrains Mono" font-size="15" fill="#EAF6FF" letter-spacing="3">TRANSPUTEC · MANAGED IT</text>'
             f'<text x="{tb[0]+16}" y="{tb[1]+72}" font-family="JetBrains Mono" font-size="13" fill="#9BE8F5" letter-spacing="2">DRAWING TX-001</text><text x="{tb[0]+16}" y="{tb[1]+98}" font-family="JetBrains Mono" font-size="13" fill="#9BE8F5" letter-spacing="2">REV A · 1:1</text>'
             f'<text x="{tb[0]+236}" y="{tb[1]+72}" font-family="JetBrains Mono" font-size="13" fill="#9BE8F5" letter-spacing="2">LONDON, UK</text><text x="{tb[0]+236}" y="{tb[1]+98}" font-family="JetBrains Mono" font-size="13" fill="#9BE8F5" letter-spacing="2">ISO 27001</text>')
    s.append('</svg>')
    return (f'<div class="bg" style="background:radial-gradient(ellipse at 50% 45%,#13275A 0%,#0C1838 50%,#070D1F 100%)">{"".join(s)}'
            '<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:96px"></div>')

bgs = [("21-operations-centre", ops()), ("22-window-seat", window()), ("23-blueprint", blueprint())]
html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(f'<div id="{n}" style="margin-bottom:40px">{h}</div>' for n, h in bgs) + '</body></html>'
open('backgrounds4.html', 'w', encoding='utf8').write(html)
open('names4.txt', 'w').write('\n'.join(n for n, _ in bgs))
