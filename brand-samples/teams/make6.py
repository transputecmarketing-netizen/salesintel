import math, random
FONTS = """
@font-face{font-family:Poppins;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}
@font-face{font-family:Poppins;font-weight:700;src:url(../assets/fonts/poppins-700.woff2)}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}
"""
CSS = FONTS + "*{margin:0;padding:0}body{background:#000}.bg{position:relative;width:1920px;height:1080px;overflow:hidden;background:radial-gradient(ellipse at 50% 45%,#0B1A3D 0%,#060C1E 55%,#03060F 100%)}svg{position:absolute;left:0;top:0}"
C1, C2, C3, C4 = "#7FF3FF", "#00B8DB", "#2C72DB", "#155DFC"
DEFS = f'''<defs>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{C2}"/><stop offset="1" stop-color="{C4}"/></linearGradient>
<linearGradient id="cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{C2}" stop-opacity=".45"/><stop offset="1" stop-color="{C2}" stop-opacity="0"/></linearGradient>
<radialGradient id="disc"><stop offset="0" stop-color="{C1}" stop-opacity=".9"/><stop offset=".5" stop-color="{C2}" stop-opacity=".35"/><stop offset="1" stop-color="{C2}" stop-opacity="0"/></radialGradient>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#7FF3FF" fill-opacity=".05"/></pattern>
</defs>'''
MONO = 'font-family="JetBrains Mono" font-weight="500" letter-spacing="2.5"'

def txt(x, y, t, size=14, col=C1, op=.85, anchor="start"):
    return f'<text x="{x}" y="{y}" {MONO} font-size="{size}" fill="{col}" fill-opacity="{op}" text-anchor="{anchor}">{t}</text>'

def arc(cx, cy, r, a0, a1, w=2, col=C2, op=.9, dash=None):
    a0r, a1r = math.radians(a0), math.radians(a1)
    x0, y0, x1, y1 = cx + r*math.cos(a0r), cy + r*math.sin(a0r), cx + r*math.cos(a1r), cy + r*math.sin(a1r)
    large = 1 if (a1 - a0) % 360 > 180 else 0
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f}" fill="none" stroke="{col}" stroke-width="{w}" stroke-opacity="{op}"{d}/>'

def ticks(cx, cy, r, n, l=8, a0=0, a1=360, col=C2, op=.6, major=5):
    s = ''
    for i in range(n + 1):
        a = math.radians(a0 + (a1 - a0) * i / n); ll = l * (1.8 if i % major == 0 else 1)
        s += f'<line x1="{cx+r*math.cos(a):.1f}" y1="{cy+r*math.sin(a):.1f}" x2="{cx+(r+ll)*math.cos(a):.1f}" y2="{cy+(r+ll)*math.sin(a):.1f}" stroke="{col}" stroke-opacity="{op}" stroke-width="1.4"/>'
    return s

def hud_ring(cx, cy, R, seed=1):
    rr = random.Random(seed); s = ''
    s += arc(cx, cy, R, 0, 359.9, 1.2, C3, .35)
    s += ticks(cx, cy, R + 6, 72, 6, col=C2, op=.5, major=6)
    for k in range(4):
        a = rr.uniform(0, 360); s += arc(cx, cy, R - 18, a, a + rr.uniform(30, 80), 5, C1 if k % 2 else C2, .9)
    s += arc(cx, cy, R - 34, 0, 359.9, 1, C2, .25, "2 6")
    for k in range(3):
        a = rr.uniform(0, 360); s += arc(cx, cy, R + 26, a, a + rr.uniform(15, 50), 2, C4, .8)
    return s

def corners(m=40, L=90):
    s = ''
    for (x, y, dx, dy) in [(m, m, 1, 1), (1920-m, m, -1, 1), (m, 1080-m, 1, -1), (1920-m, 1080-m, -1, -1)]:
        s += f'<path d="M{x},{y+dy*L} L{x},{y} L{x+dx*L},{y}" fill="none" stroke="{C2}" stroke-width="2.4" stroke-opacity=".8"/>'
        s += f'<line x1="{x+dx*14}" y1="{y+dy*14}" x2="{x+dx*34}" y2="{y+dy*14}" stroke="{C1}" stroke-width="2"/>'
    return s

def readouts(x, y, rows, w=360):
    s = f'<line x1="{x}" y1="{y-26}" x2="{x+w}" y2="{y-26}" stroke="{C2}" stroke-opacity=".5"/>'
    for i, (k, v, bar) in enumerate(rows):
        yy = y + i * 54
        s += txt(x, yy, k, 16, C2, .85) + txt(x + w, yy, v, 16, C1, .95, "end")
        if bar is not None:
            s += f'<rect x="{x}" y="{yy+10}" width="{w}" height="4" rx="2" fill="{C3}" fill-opacity=".2"/><rect x="{x}" y="{yy+10}" width="{w*bar:.0f}" height="4" rx="2" fill="url(#gh)"/>'
    return s

def holo_bot(cx, cy, sc=1.0, yaw=-0.5, pitch=0.12, seed=3):
    rr = random.Random(seed); pts = []
    def sup(u, v, a, b, c, e=0.28):
        cu, su, cv, sv = math.cos(u), math.sin(u), math.cos(v), math.sin(v)
        f = lambda w, p: math.copysign(abs(w) ** p, w)
        return a * f(cv, e) * f(cu, e), b * f(sv, e), c * f(cv, e) * f(su, e)
    for i in range(46):
        for j in range(26):
            u = 2*math.pi*i/46; v = -math.pi/2 + math.pi*j/25
            pts.append(sup(u, v, 150, 118, 112) + ('h',))
    for i in range(36):
        for j in range(18):
            u = 2*math.pi*i/36; v = -math.pi/2 + math.pi*j/17
            x, y, z = sup(u, v, 108, 92, 86); pts.append((x, y + 250, z, 'b'))
    for i in range(30):
        a = 2*math.pi*i/30; pts.append((0 + 10*math.cos(a), -170 + 10*math.sin(a), 0, 'tip'))
    cyw, syw, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
    def proj(x, y, z):
        x2, z2 = x*cyw + z*syw, -x*syw + z*cyw
        y2, z3 = y*cp - z2*sp, y*sp + z2*cp
        f = 900 / (900 + z3)
        return cx + x2*f*sc, cy + y2*f*sc, z3
    s = ''
    ordered = sorted((proj(x, y, z) + (k,) for x, y, z, k in pts), key=lambda p: -p[2])
    for X, Y, Z, k in ordered:
        op = .25 + .6 * (1 - (Z + 150) / 300); rad = 1.6 if k != 'tip' else 2.4
        s += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="{rad}" fill="{C1 if Z < 0 else C2}" fill-opacity="{max(.12, min(.95, op)):.2f}"/>'
    # visor and eyes on the front face
    fx, fy, _ = proj(0, -8, 112)
    s += f'<rect x="{fx-118*sc}" y="{fy-52*sc}" width="{236*sc}" height="{104*sc}" rx="{40*sc}" fill="{C2}" fill-opacity=".10" stroke="{C1}" stroke-width="2" stroke-opacity=".9"/>'
    for ex in (-48, 48):
        X, Y, _ = proj(ex, -10, 116); s += f'<rect x="{X-12*sc}" y="{Y-26*sc}" width="{24*sc}" height="{52*sc}" rx="{12*sc}" fill="{C1}" filter="url(#glow2)"/>'
    X, Y, _ = proj(0, -150, 0); X2, Y2, _ = proj(0, -118, 0)
    s += f'<line x1="{X:.1f}" y1="{Y:.1f}" x2="{X2:.1f}" y2="{Y2:.1f}" stroke="{C1}" stroke-width="3"/>'
    return s

def projector(cx, by, w=220, top=None):
    top = top if top is not None else by - 560
    return (f'<polygon points="{cx-w*.18},{by} {cx+w*.18},{by} {cx+w*1.25},{top} {cx-w*1.25},{top}" fill="url(#cone)" opacity=".55"/>'
            f'<ellipse cx="{cx}" cy="{by}" rx="{w}" ry="{w*.2}" fill="url(#disc)"/>'
            f'<ellipse cx="{cx}" cy="{by}" rx="{w*.95}" ry="{w*.19}" fill="none" stroke="{C1}" stroke-width="2" stroke-opacity=".8"/>'
            f'<ellipse cx="{cx}" cy="{by}" rx="{w*1.25}" ry="{w*.25}" fill="none" stroke="{C3}" stroke-width="1.2" stroke-opacity=".6" stroke-dasharray="3 7"/>')

def grid_floor():
    s = ''
    for i in range(-14, 15):
        s += f'<line x1="{960+i*30}" y1="760" x2="{960+i*190}" y2="1080" stroke="{C3}" stroke-opacity=".12"/>'
    for k in range(9):
        y = 760 + (k**1.7) * 7; s += f'<line x1="0" y1="{y:.0f}" x2="1920" y2="{y:.0f}" stroke="{C3}" stroke-opacity="{.05+.012*k:.3f}"/>'
    return s

def logo(x=96, y=88): return f'<img src="../assets/logo-white.svg" style="position:absolute;left:{x}px;top:{y}px;height:32px;filter:drop-shadow(0 0 8px rgba(0,184,219,.6))">'
def scan(): return '<svg width="1920" height="1080"><rect width="1920" height="1080" fill="url(#scan)"/></svg>'

bgs = []
# ---------- H1 Holo assistant (bot on the right, readouts left)
s = [f'<svg width="1920" height="1080">{DEFS}', grid_floor(), corners(),
     f'<g filter="url(#glow)">{hud_ring(1560, 470, 300, 2)}</g>',
     projector(1560, 900, 210, 300), f'<g filter="url(#glow)">{holo_bot(1560, 450, .95, -.55)}</g>',
     f'<g filter="url(#glow)">{readouts(96, 640, [("AI ASSIST", "ONLINE", None), ("SERVICE DESK", "24/7", .92), ("THREAT SCAN", "ACTIVE", .74), ("PATCH CYCLE", "LIVE", .6)])}</g>',
     txt(96, 940, "51.5072° N  0.1276° W · LONDON", 13, C2, .7), txt(1824, 1000, "TRANSPUTEC · AI OPERATIONS", 13, C2, .7, "end"), '</svg>']
bgs.append(("27-holo-assistant", f'<div class="bg">{"".join(s)}{scan()}{logo()}</div>'))

# ---------- H2 Holo globe
def globe(cx, cy, R, yaw=0.25, tilt=-0.5):
    s = ''; cyw, syw, ct, st = math.cos(yaw), math.sin(yaw), math.cos(tilt), math.sin(tilt)
    def P(lat, lon):
        la, lo = math.radians(lat), math.radians(lon)
        x, y, z = math.cos(la)*math.sin(lo), -math.sin(la), math.cos(la)*math.cos(lo)
        x2, z2 = x*cyw + z*syw, -x*syw + z*cyw
        y2, z3 = y*ct - z2*st, y*st + z2*ct
        return cx + x2*R, cy + y2*R, z3
    for lat in range(-75, 90, 15):
        pts = [P(lat, lo) for lo in range(0, 361, 5)]
        for a, b in zip(pts, pts[1:]):
            op = .55 if (a[2] + b[2]) > 0 else .12
            s += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{C2}" stroke-opacity="{op}" stroke-width="1.2"/>'
    for lon in range(0, 360, 20):
        pts = [P(la, lon) for la in range(-90, 91, 5)]
        for a, b in zip(pts, pts[1:]):
            op = .55 if (a[2] + b[2]) > 0 else .12
            s += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{C3}" stroke-opacity="{op}" stroke-width="1.1"/>'
    cities = {"LON": (51.5, -0.13), "NYC": (40.7, -74), "DXB": (25.2, 55.3), "BLR": (12.97, 77.6), "SIN": (1.35, 103.8), "FRA": (50.1, 8.7), "TOR": (43.7, -79.4)}
    lp = P(*cities["LON"])
    for k, (la, lo) in cities.items():
        p = P(la, lo)
        if p[2] < -0.05: continue
        s += f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{7 if k=="LON" else 4}" fill="{C1}"/>' + txt(p[0]+12, p[1]-10, k, 12, C1, .9)
        if k != "LON":
            mx, my = (lp[0]+p[0])/2, (lp[1]+p[1])/2 - 90
            s += f'<path d="M{lp[0]:.1f},{lp[1]:.1f} Q{mx:.1f},{my:.1f} {p[0]:.1f},{p[1]:.1f}" fill="none" stroke="url(#gh)" stroke-width="2.4"/>'
    s += f'<circle cx="{lp[0]:.1f}" cy="{lp[1]:.1f}" r="20" fill="none" stroke="{C1}" stroke-width="2"/>'
    return s
s = [f'<svg width="1920" height="1080">{DEFS}', corners(),
     f'<g filter="url(#glow)">{hud_ring(1520, 470, 330, 5)}{globe(1520, 470, 250)}</g>',
     projector(1520, 930, 190, 520),
     f'<g filter="url(#glow)">{readouts(96, 620, [("NODES", "LINKED", .88), ("LATENCY", "NOMINAL", .5), ("SOC", "WATCHING", .97), ("REGION", "UK · EU", None)])}</g>',
     txt(96, 940, "HQ · LONDON · UK", 13, C2, .7), '</svg>']
bgs.append(("28-holo-globe", f'<div class="bg">{"".join(s)}{scan()}{logo()}</div>'))

# ---------- H3 HUD visor frame
def visor():
    s = corners(36, 120)
    for side in (-1, 1):
        cx = 960 + side * 1500; s += arc(cx, 540, 1180, 180 - 26 if side > 0 else -26, 180 + 26 if side > 0 else 26, 3, C2, .7)
        s += arc(cx, 540, 1150, 180 - 18 if side > 0 else -18, 180 + 18 if side > 0 else 18, 1.2, C3, .6, "4 8")
        s += ticks(cx, 540, 1110, 40, 10, a0=(180 - 18) if side > 0 else -18, a1=(180 + 18) if side > 0 else 18, col=C2, op=.6, major=5)
    s += f'<line x1="180" y1="540" x2="420" y2="540" stroke="{C2}" stroke-opacity=".6"/><line x1="1500" y1="540" x2="1740" y2="540" stroke="{C2}" stroke-opacity=".6"/>'
    for i in range(12):
        h = 10 + (i % 4) * 8; s += f'<rect x="{1540+i*16}" y="{900-h}" width="10" height="{h}" fill="url(#gh)" opacity=".9"/>'
    s += f'<g>{arc(300, 860, 60, -220, 40, 6, C2, .9)}{arc(300, 860, 74, 0, 359.9, 1, C3, .4)}</g>' + txt(300, 866, "AI", 18, C1, 1, "middle")
    s += txt(960, 70, "· TRANSPUTEC VISOR · SECURE SESSION ·", 13, C2, .75, "middle") + txt(1740, 1004, "ENCRYPTED · ISO 27001", 12, C2, .7, "end")
    return s
bgs.append(("29-hud-visor", f'<div class="bg"><svg width="1920" height="1080">{DEFS}<g filter="url(#glow)">{visor()}</g></svg>{scan()}{logo(120, 100)}</div>'))

# ---------- H4 AI core
def core(cx, cy):
    rr = random.Random(11); s = ''
    for k in range(26):
        side = rr.choice([(1, 0), (0, -1), (0, 1), (1, 0)]); y0 = cy + rr.randint(-120, 120); x0 = cx + rr.randint(-120, 120)
        pts = [(cx + (150 if side == (1, 0) else rr.randint(-130, 130)), cy + (rr.randint(-130, 130) if side == (1, 0) else side[1]*150))]
        x, y = pts[0]
        for step in range(4):
            if side == (1, 0): x += rr.randint(60, 140); y += rr.choice([-1, 1]) * rr.randint(0, 60) if step % 2 else 0
            else: y += side[1] * rr.randint(50, 110); x += rr.choice([-1, 1]) * rr.randint(0, 60) if step % 2 else 0
            pts.append((x, y))
        s += f'<polyline points="{" ".join(f"{a:.0f},{b:.0f}" for a,b in pts)}" fill="none" stroke="url(#gh)" stroke-width="2.2" stroke-opacity=".85"/><circle cx="{x:.0f}" cy="{y:.0f}" r="5" fill="{C1}"/>'
    s += f'<rect x="{cx-150}" y="{cy-150}" width="300" height="300" rx="34" fill="#071330" stroke="url(#gh)" stroke-width="4"/>'
    for i in range(10):
        for side in (-1, 1):
            s += f'<rect x="{cx-128+i*28}" y="{cy+side*150-(0 if side>0 else 14)}" width="12" height="14" fill="{C2}" fill-opacity=".8"/>'
            s += f'<rect x="{cx+side*150-(0 if side>0 else 14)}" y="{cy-128+i*28}" width="14" height="12" fill="{C2}" fill-opacity=".8"/>'
    s += f'<rect x="{cx-100}" y="{cy-100}" width="200" height="200" rx="20" fill="none" stroke="{C1}" stroke-opacity=".6" stroke-width="1.5"/>'
    s += f'<text x="{cx}" y="{cy+40}" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="120" letter-spacing="-4" fill="url(#gh)" filter="url(#glow2)">AI</text>'
    return s
s = [f'<svg width="1920" height="1080">{DEFS}', corners(),
     f'<g filter="url(#glow)">{core(1580, 560)}</g>',
     f'<g filter="url(#glow)">{hud_ring(1580, 560, 250, 9)}</g>',
     f'<g filter="url(#glow)">{readouts(96, 640, [("COPILOT", "READY", .9), ("AGENTS", "GOVERNED", .7), ("DATA", "PROTECTED", .95), ("MODEL", "MONITORED", .62)])}</g>', '</svg>']
bgs.append(("30-ai-core", f'<div class="bg">{"".join(s)}{scan()}{logo()}</div>'))

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(f'<div id="{n}" style="margin-bottom:40px">{h}</div>' for n, h in bgs) + '</body></html>'
open('backgrounds6.html', 'w', encoding='utf8').write(html)
open('names6.txt', 'w').write('\n'.join(n for n, _ in bgs))
