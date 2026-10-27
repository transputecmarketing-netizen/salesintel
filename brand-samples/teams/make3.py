import random, math
FONTS = """
@font-face{font-family:Poppins;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}
@font-face{font-family:Poppins;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}
@font-face{font-family:Poppins;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}
@font-face{font-family:Poppins;font-weight:700;src:url(../assets/fonts/poppins-700.woff2)}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}
"""
CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#222;font-family:Poppins,sans-serif}
.bg{position:relative;width:1920px;height:1080px;overflow:hidden}
.logo{position:absolute;height:34px}
.mono{font-family:'JetBrains Mono';font-weight:500;letter-spacing:.2em;text-transform:uppercase}
svg{position:absolute;left:0;top:0}
"""
NAVY = "#0F172B"
DEFS = '''<defs>
<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient>
<linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient>
<linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient>
</defs>'''

def mix(a, b, t):
    pa = [int(a[i:i+2], 16) for i in (1, 3, 5)]; pb = [int(b[i:i+2], 16) for i in (1, 3, 5)]
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(x + (y - x) * t))) for x, y in zip(pa, pb))

bgs = []

# ---------------------------------------------------------------- A. London dusk
def london():
    r = random.Random(12)
    o = [f'<svg width="1920" height="1080" viewBox="0 0 1920 1080">{DEFS}<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A1020"/><stop offset=".45" stop-color="#16294F"/><stop offset=".78" stop-color="#1F4FB8"/><stop offset="1" stop-color="#00B8DB"/></linearGradient>'
         '<radialGradient id="hz" cx=".5" cy="1" r=".6"><stop offset="0" stop-color="#00B8DB" stop-opacity=".55"/><stop offset="1" stop-color="#00B8DB" stop-opacity="0"/></radialGradient></defs>',
         '<rect width="1920" height="1080" fill="url(#sky)"/><rect width="1920" height="1080" fill="url(#hz)"/>']
    for _ in range(90):
        o.append(f'<circle cx="{r.randint(0,1920)}" cy="{r.randint(0,520)}" r="{r.choice([1,1,1.5,2])}" fill="#fff" fill-opacity="{r.uniform(.25,.8):.2f}"/>')
    def block(x, w, h, col, win=True, base=1080):
        s = f'<rect x="{x}" y="{base-h}" width="{w}" height="{h}" fill="{col}"/>'
        if win:
            for yy in range(base - h + 18, base - 20, 22):
                for xx in range(x + 8, x + w - 8, 16):
                    if r.random() < .22:
                        s += f'<rect x="{xx}" y="{yy}" width="6" height="9" fill="{r.choice(["#9BE8F5","#F5D78A","#9BE8F5"])}" fill-opacity="{r.uniform(.5,.95):.2f}"/>'
        return s
    # back layer: generic blocks
    back = "#1B2E58"; front = "#0C1530"
    x = -20
    while x < 1940:
        w = r.randint(50, 110); h = r.randint(140, 330)
        o.append(block(x, w, h, back, win=False, base=1000)); x += w + r.randint(0, 12)
    # landmarks (front) -- left cluster
    # The Shard
    sx, sw, sh = 330, 130, 640
    o.append(f'<polygon points="{sx-sw/2},1080 {sx+sw/2},1080 {sx+6},{1080-sh} {sx-6},{1080-sh}" fill="{front}"/>')
    for k in range(1, 15):
        yy = 1080 - k * 40
        o.append(f'<line x1="{sx-sw/2*(1-k*40/sh)+4}" x2="{sx+sw/2*(1-k*40/sh)-4}" y1="{yy}" y2="{yy}" stroke="#00B8DB" stroke-opacity=".28" stroke-width="2"/>')
    o.append(f'<line x1="{sx}" y1="{1080-sh}" x2="{sx}" y2="{1080-sh-34}" stroke="#9BE8F5" stroke-width="3"/><circle cx="{sx}" cy="{1080-sh-36}" r="4" fill="#fff"/>')
    # Gherkin
    gx, gw, gh_ = 130, 84, 410
    o.append(f'<path d="M{gx-gw/2},1080 L{gx-gw/2},{1080-gh_*0.55} Q{gx-gw/2-8},{1080-gh_*0.82} {gx},{1080-gh_} Q{gx+gw/2+8},{1080-gh_*0.82} {gx+gw/2},{1080-gh_*0.55} L{gx+gw/2},1080 Z" fill="{front}"/>')
    for k in range(1, 12):
        yy = 1080 - k * 32
        o.append(f'<path d="M{gx-gw/2+2},{yy} Q{gx},{yy-8} {gx+gw/2-2},{yy}" fill="none" stroke="#00B8DB" stroke-opacity=".3" stroke-width="2"/>')
    # Walkie-Talkie
    wx = 505
    o.append(f'<path d="M{wx-48},1080 L{wx-48},{1080-190} Q{wx-70},{1080-250} {wx-72},{1080-330} L{wx+72},{1080-330} Q{wx+70},{1080-250} {wx+48},{1080-190} L{wx+48},1080 Z" fill="{front}"/>')
    for k in range(1, 9):
        o.append(f'<line x1="{wx-60}" x2="{wx+60}" y1="{1080-k*34}" y2="{1080-k*34}" stroke="#9BE8F5" stroke-opacity=".2" stroke-width="2"/>')
    # fill gaps left
    for (bx, bw, bh) in [(0,60,230),(30,70,180),(210,60,300),(236,64,220),(600,70,210),(660,60,260),(50,60,150)]:
        o.append(block(bx, bw, bh, front))
    # right cluster: Elizabeth Tower, London Eye, Tower Bridge
    tx = 1440
    o.append(f'<rect x="{tx-26}" y="{1080-420}" width="52" height="420" fill="{front}"/><polygon points="{tx-30},{1080-420} {tx+30},{1080-420} {tx},{1080-520}" fill="{front}"/>'
             f'<circle cx="{tx}" cy="{1080-352}" r="18" fill="#F5D78A" fill-opacity=".9"/><rect x="{tx-34}" y="{1080-500}" width="68" height="8" fill="{front}" transform="translate(0,52)"/>')
    ex, ey, er = 1800, 800, 190
    o.append(f'<circle cx="{ex}" cy="{ey}" r="{er}" fill="none" stroke="#9BE8F5" stroke-opacity=".7" stroke-width="5"/><circle cx="{ex}" cy="{ey}" r="{er-26}" fill="none" stroke="#9BE8F5" stroke-opacity=".35" stroke-width="2"/>')
    for k in range(24):
        a = k * math.pi / 12
        o.append(f'<line x1="{ex}" y1="{ey}" x2="{ex+er*math.cos(a):.1f}" y2="{ey+er*math.sin(a):.1f}" stroke="#9BE8F5" stroke-opacity=".28" stroke-width="2"/>'
                 f'<circle cx="{ex+er*math.cos(a):.1f}" cy="{ey+er*math.sin(a):.1f}" r="7" fill="#fff" fill-opacity=".85"/>')
    o.append(f'<polygon points="{ex-40},1080 {ex},{ey} {ex+40},1080" fill="{front}"/>')
    # Tower Bridge
    bx0 = 1560
    for cx in (bx0, bx0 + 230):
        o.append(f'<rect x="{cx-38}" y="{1080-300}" width="76" height="300" fill="{front}"/><polygon points="{cx-38},{1080-300} {cx+38},{1080-300} {cx+26},{1080-350} {cx},{1080-390} {cx-26},{1080-350}" fill="{front}"/>'
                 + ''.join(f'<rect x="{cx-9+dx}" y="{1080-270+dy}" width="9" height="22" fill="#F5D78A" fill-opacity=".85"/>' for dx in (-14, 14) for dy in (0, 60, 120)))
    o.append(f'<rect x="{bx0+38}" y="{1080-215}" width="154" height="14" fill="{front}"/><rect x="{bx0+38}" y="{1080-90}" width="154" height="8" fill="{front}"/>')
    o.append(f'<path d="M{bx0+38},{1080-300} Q{bx0+115},{1080-120} {bx0+192},{1080-300}" fill="none" stroke="#9BE8F5" stroke-opacity=".6" stroke-width="3"/>')
    o.append(f'<path d="M{bx0-38},{1080-210} Q{bx0-170},{1080-110} {bx0-300},{1080-70}" fill="none" stroke="#9BE8F5" stroke-opacity=".5" stroke-width="3"/>'
             f'<path d="M{bx0+268},{1080-210} Q{bx0+400},{1080-120} {bx0+520},{1080-90}" fill="none" stroke="#9BE8F5" stroke-opacity=".5" stroke-width="3"/>')
    for (bx, bw, bh) in [(1340,70,200),(1700,110,250),(1620,60,160),(1880,60,300),(1280,60,170)]:
        pass
    for (bx, bw, bh) in [(1290,60,190),(1330,60,150),(1880,60,260)]:
        o.append(block(bx, bw, bh, front))
    # river
    o.append('<rect x="0" y="1030" width="1920" height="50" fill="#0A1020" fill-opacity=".8"/>')
    for i in range(40):
        o.append(f'<line x1="{r.randint(0,1900)}" x2="{r.randint(30,140)+r.randint(0,1900)}" y1="{1040+r.randint(0,30)}" y2="{1040+r.randint(0,30)}" stroke="#9BE8F5" stroke-opacity="{r.uniform(.08,.3):.2f}" stroke-width="2"/>')
    o.append('</svg>')
    return ''.join(o) + '<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">' + '<div class="mono" style="position:absolute;right:96px;top:92px;font-size:17px;color:rgba(255,255,255,.7)">London · 24/7/365</div>'
bgs.append(("15-london-dusk", f'<div class="bg">{london()}</div>'))

# ---------------------------------------------------------------- B. Service network
def network():
    r = random.Random(9)
    fixed = [(210, 300, "Cyber"), (400, 640, "Cloud"), (1660, 250, "AI"), (1510, 600, "Service desk"), (230, 900, "Microsoft 365"), (1690, 900, "Backup")]
    pts = [(x, y) for x, y, _ in fixed]
    while len(pts) < 70:
        x, y = r.randint(40, 1880), r.randint(40, 1040)
        if 500 < x < 1420 and y > 120: continue
        if x < 760 and y < 150: continue
        if 500 < x < 1420 and y <= 120 and r.random() < .7: continue
        if all((x-a)**2 + (y-b)**2 > 95**2 for a, b in pts): pts.append((x, y))
    o = [f'<svg width="1920" height="1080">{DEFS}']
    for i, (x, y) in enumerate(pts):
        for (a, b) in pts[i+1:]:
            d = math.hypot(x-a, y-b)
            if d < 270:
                o.append(f'<line x1="{x}" y1="{y}" x2="{a}" y2="{b}" stroke="url(#gh)" stroke-opacity="{max(.12, .75 - d/400):.2f}" stroke-width="2"/>')
    for i, (x, y) in enumerate(pts):
        big = i < len(fixed)
        rr = 12 if big else r.choice([4, 5, 6])
        if big:
            o.append(f'<circle cx="{x}" cy="{y}" r="52" fill="#00B8DB" fill-opacity=".12"/><circle cx="{x}" cy="{y}" r="28" fill="none" stroke="url(#gd)" stroke-width="2.5"/>')
        o.append(f'<circle cx="{x}" cy="{y}" r="{rr}" fill="url(#gd)"/>')
        if big:
            t = fixed[i][2]; w = 30 + len(t) * 13
            o.append(f'<rect x="{x-w/2}" y="{y+46}" width="{w}" height="38" rx="19" fill="rgba(15,23,43,.85)" stroke="rgba(255,255,255,.3)"/>'
                     f'<text x="{x}" y="{y+70}" text-anchor="middle" font-family="JetBrains Mono" font-weight="500" font-size="15" letter-spacing="2.4" fill="#E6F6FF">{t.upper()}</text>')
    o.append('</svg>')
    return ''.join(o)
bgs.append(("16-network", f'<div class="bg" style="background:radial-gradient(circle at 50% 40%,#16213D 0%,{NAVY} 70%)">{network()}<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px"></div>'))

# ---------------------------------------------------------------- C. Isometric blocks
def iso():
    o = [f'<svg width="1920" height="1080">{DEFS}<defs><linearGradient id="top" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7FE3F5"/><stop offset="1" stop-color="#2C72DB"/></linearGradient>'
         '<linearGradient id="lf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#155DFC"/><stop offset="1" stop-color="#0B2A7A"/></linearGradient>'
         '<linearGradient id="rt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#0A6C8A"/></linearGradient></defs>']
    cw, ch = 70, 40.4
    def cube(cx, gy, h, glow=False):
        # cx: centre x, gy: ground y of the centre of the bottom diamond
        tp = gy - h
        top = f'{cx},{tp-ch} {cx+cw},{tp} {cx},{tp+ch} {cx-cw},{tp}'
        lf = f'{cx-cw},{tp} {cx},{tp+ch} {cx},{gy+ch} {cx-cw},{gy}'
        rt = f'{cx},{tp+ch} {cx+cw},{tp} {cx+cw},{gy} {cx},{gy+ch}'
        s = ''
        if glow: s += f'<ellipse cx="{cx}" cy="{tp}" rx="150" ry="90" fill="#00B8DB" fill-opacity=".18"/>'
        s += f'<polygon points="{lf}" fill="url(#lf)"/><polygon points="{rt}" fill="url(#rt)"/><polygon points="{top}" fill="url(#top)"/>'
        s += f'<polygon points="{top}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>'
        return s
    # left staircase (descending toward centre)
    L = [(150, 1000, 620), (290, 1040, 470), (430, 1080, 330), (80, 880, 300)]
    R = [(1770, 1000, 640), (1630, 1040, 500), (1490, 1080, 360), (1840, 880, 300)]
    for cx, gy, h in sorted(L + R, key=lambda t: t[1]):
        o.append(cube(cx, gy, h, glow=(h > 450)))
    # floor grid
    for i in range(-3, 18):
        o.append(f'<line x1="{i*140-200}" y1="1080" x2="{i*140+200}" y2="760" stroke="#fff" stroke-opacity=".035"/>')
    # floating small cubes
    for cx, cy, s in [(260, 190, .4), (1650, 210, .5), (420, 330, .3), (1500, 340, .35)]:
        sw, sh = cw*s, ch*s
        o.append(f'<polygon points="{cx-sw},{cy} {cx},{cy+sh} {cx},{cy+sh+sw} {cx-sw},{cy+sw}" fill="url(#lf)"/><polygon points="{cx},{cy+sh} {cx+sw},{cy} {cx+sw},{cy+sw} {cx},{cy+sh+sw}" fill="url(#rt)"/><polygon points="{cx},{cy-sh} {cx+sw},{cy} {cx},{cy+sh} {cx-sw},{cy}" fill="url(#top)"/>')
    o.append('</svg>')
    return ''.join(o)
bgs.append(("17-isometric", f'<div class="bg" style="background:linear-gradient(180deg,#0A1020 0%,#13224A 70%,#1B3D8F 100%)">{iso()}<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px"><div class="mono" style="position:absolute;right:96px;top:92px;font-size:17px;color:rgba(255,255,255,.65)">transputec.com</div></div>'))

# ---------------------------------------------------------------- D. Editorial type
bgs.append(("18-type", f'''<div class="bg" style="background:{NAVY}"><svg width="1920" height="1080">{DEFS}
 <text x="-30" y="470" font-family="Poppins" font-weight="700" font-size="430" letter-spacing="-14" fill="none" stroke="url(#gh)" stroke-width="2.6" stroke-opacity=".85">PREDICT</text>
 <text x="-30" y="470" font-family="Poppins" font-weight="700" font-size="430" letter-spacing="-14" fill="url(#gh)" fill-opacity=".05">PREDICT</text>
 <text x="1930" y="960" text-anchor="end" font-family="Poppins" font-weight="700" font-size="430" letter-spacing="-14" fill="url(#gh)" fill-opacity=".9">ABLE.</text></svg>
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;bottom:96px">
 <div class="mono" style="position:absolute;right:96px;top:92px;font-size:17px;color:rgba(255,255,255,.6)">Predictable IT · Predictable budget</div></div>'''))

# ---------------------------------------------------------------- E. Low-poly facets
def lowpoly():
    r = random.Random(3)
    cols, rows, cs = 17, 10, 130
    P = [[(c*cs + (r.uniform(-.32, .32)*cs if 0 < c < cols else 0), rr*cs + (r.uniform(-.32, .32)*cs if 0 < rr < rows else 0)) for c in range(cols+1)] for rr in range(rows+1)]
    o = ['<svg width="1920" height="1080">']
    for rr in range(rows):
        for c in range(cols):
            a, b, d, e = P[rr][c], P[rr][c+1], P[rr+1][c], P[rr+1][c+1]
            for tri in ((a, b, d), (b, e, d)):
                mx = sum(p[0] for p in tri)/3; my = sum(p[1] for p in tri)/3
                t = min(1, max(0, (mx*0.55 + my*0.9)/(1920*.55+1080*.9)))
                base = mix("#155DFC", "#00B8DB", t)
                dist = math.hypot(mx-960, (my-620)*1.2)
                k = max(0, 1 - dist/820)
                col = mix(base, "#0F172B", .55 + .43*k + r.uniform(-.07, .07))
                o.append(f'<polygon points="{" ".join(f"{x:.0f},{y:.0f}" for x,y in tri)}" fill="{col}" stroke="{col}" stroke-width="1"/>')
    o.append('</svg>')
    return ''.join(o)
bgs.append(("19-facets", f'<div class="bg" style="background:{NAVY}">{lowpoly()}<img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px"><div class="mono" style="position:absolute;right:96px;bottom:92px;font-size:17px;color:rgba(255,255,255,.75)">Managed IT · Cyber · Cloud · AI</div></div>'))

# ---------------------------------------------------------------- F. Credentials board (bento)
def tile(x, y, w, h, inner, style="glass"):
    st = {"glass": "background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.16)", "white": "background:#fff", "grad": "background:linear-gradient(135deg,#00B8DB,#155DFC)", "navy": "background:#16213D;border:1.5px solid rgba(255,255,255,.10)"}[style]
    return f'<div style="position:absolute;left:{x}px;top:{y}px;width:{w}px;height:{h}px;border-radius:30px;{st};overflow:hidden;display:flex;flex-direction:column;justify-content:center;padding:0 34px">{inner}</div>'
def stat(n, l, col="#fff"):
    return f'<div style="font-weight:700;font-size:78px;letter-spacing:-.05em;line-height:1;color:{col}">{n}</div><div style="font-weight:300;font-size:22px;line-height:1.3;margin-top:8px;color:{col};opacity:.9">{l}</div>'
def img(src, h):
    return f'<img src="{src}" style="height:{h}px;max-width:100%;object-fit:contain;align-self:center">'
badge = lambda f: f'../assets/badges/{f}'
bento = ''.join([
    tile(72, 72, 360, 150, '<img src="../assets/logo-white.svg" style="width:292px">', "navy"),
    tile(72, 246, 360, 220, stat("24/7", "UK service desk, answered by a live human in London"), "grad"),
    tile(72, 490, 360, 200, stat("NPS 70+", "across managed users"), "glass"),
    tile(72, 714, 360, 284, stat("78%", "first-call resolution, with rapid phone answer"), "glass"),
    tile(1488, 72, 360, 160, img(badge("accreditations-badge-1.png"), 110), "white"),
    tile(1488, 256, 172, 150, img(badge("ms-modern-workplace.png"), 100), "white"),
    tile(1676, 256, 172, 150, img(badge("ms-security.png"), 100), "white"),
    tile(1488, 430, 360, 250, stat("30%+", "lower run-cost than the equivalent in-house team"), "grad"),
    tile(1488, 704, 172, 140, img(badge("aws-advanced-tier-services.png"), 96), "white"),
    tile(1676, 704, 172, 140, img(badge("cisco-p.png"), 96), "white"),
    tile(1488, 868, 360, 130, '<div style="font-weight:600;font-size:34px;letter-spacing:-.02em;color:#fff;line-height:1.1">ISO 27001<br><span style="font-weight:300;font-size:22px;color:#CAD5E2">certified delivery</span></div>', "glass"),
])
bgs.append(("20-credentials", f'<div class="bg" style="background:radial-gradient(circle at 50% 30%,#1B2A55 0%,{NAVY} 70%)">{bento}</div>'))

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(f'<div id="{n}" style="margin-bottom:40px">{h}</div>' for n, h in bgs) + '</body></html>'
open('backgrounds3.html', 'w', encoding='utf8').write(html)
open('names3.txt', 'w').write('\n'.join(n for n, _ in bgs))
sil = '<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><g fill="#8793A8" fill-opacity=".5"><circle cx="960" cy="420" r="130"/><path d="M560,1080 C560,800 720,640 960,640 C1200,640 1360,800 1360,1080 Z"/></g></svg>'
prev = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}.g{{display:grid;grid-template-columns:repeat(3,1920px);gap:40px;padding:40px;background:#111}}.c{{position:relative}}.cap{{position:absolute;left:30px;top:20px;font:600 44px Poppins;color:#fff;background:rgba(0,0,0,.55);padding:6px 22px;border-radius:30px;z-index:9}}</style></head><body><div class="g">' + ''.join(f'<div class="c">{h}{sil}<div class="cap">{n[:2]}</div></div>' for n, h in bgs) + '</div></body></html>'
open('preview3.html', 'w', encoding='utf8').write(prev)
