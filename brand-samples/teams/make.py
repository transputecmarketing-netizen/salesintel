import random, math
random.seed(4)

FONTS = """
@font-face{font-family:Poppins;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}
@font-face{font-family:Poppins;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}
@font-face{font-family:Poppins;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}
"""
CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#222;font-family:Poppins,sans-serif}
.bg{position:relative;width:1920px;height:1080px;overflow:hidden;margin:0 0 40px 0}
.logo{position:absolute;height:34px}
.tag{position:absolute;font-weight:300;font-size:26px;letter-spacing:-.01em;line-height:1.4}
.url{position:absolute;font-family:'JetBrains Mono';font-weight:500;font-size:17px;letter-spacing:.2em;text-transform:uppercase}
.glow{position:absolute;border-radius:50%}
"""

def dots(cols, rows, pitch, d, x, y, lit=None, fade=True, c1="#00B8DB", c2="#155DFC", unlit="rgba(255,255,255,.10)"):
    W, H = cols*pitch, rows*pitch
    o = [f'<svg style="position:absolute;left:{x}px;top:{y}px" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs><linearGradient id="g{x}{y}" gradientUnits="userSpaceOnUse" x1="0" y1="{H}" x2="{W}" y2="0"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>']
    n = 0
    for r in range(rows):
        for c in range(cols):
            idx = r*cols + c
            on = lit is None or idx < lit
            op = 1
            if fade:
                op = max(.08, 1 - (cols-1-c)/cols*1.05) if x > 900 else max(.08, 1 - c/cols*1.05)
            o.append(f'<circle cx="{c*pitch+pitch/2}" cy="{r*pitch+pitch/2}" r="{d/2}" fill="{"url(#g%s%s)" % (x, y) if on else unlit}" fill-opacity="{op:.2f}"/>')
    o.append('</svg>')
    return ''.join(o)

def rings(cx, cy, base, n=8, gap=True, op=.2):
    s = [f'<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient></defs>']
    for i in range(n):
        s.append(f'<circle cx="{cx}" cy="{cy}" r="{base+i*70}" fill="none" stroke="#fff" stroke-opacity="{max(.03, op-i*.022):.3f}" stroke-width="1.4"/>')
    r = base + 3*70
    circ = 2*math.pi*r
    s.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#rg)" stroke-width="7" stroke-linecap="round" stroke-dasharray="{circ*.8:.0f} {circ*.2:.0f}" transform="rotate(-100 {cx} {cy})"/></svg>')
    return ''.join(s)

NAVY = "#0F172B"
def glow(l, t, w, h, rgba):
    return f'<div class="glow" style="left:{l}px;top:{t}px;width:{w}px;height:{h}px;background:radial-gradient(circle,{rgba} 0%,rgba(0,0,0,0) 65%)"></div>'

bgs = []
# 1 Midnight
bgs.append(("1-midnight", f'''<div class="bg" style="background:{NAVY}">
 {glow(1000,-380,1300,1300,"rgba(21,93,252,.38)")}{glow(-420,520,1100,1100,"rgba(0,184,219,.22)")}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#CAD5E2">Managed IT for UK businesses,<br>powered by AI.</div>
 <div class="url" style="right:96px;bottom:104px;color:rgba(255,255,255,.55)">transputec.com</div></div>'''))
# 2 Dot grid
bgs.append(("2-dot-grid", f'''<div class="bg" style="background:{NAVY}">
 {glow(1180,180,900,900,"rgba(0,184,219,.2)")}
 {dots(8,10,52,28,1440,300)}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#fff;font-weight:500;font-size:30px;letter-spacing:-.02em">Predictable IT.<br><span style="color:#00B8DB">Predictable budget.</span></div></div>'''))
# 3 Daylight
bgs.append(("3-daylight", f'''<div class="bg" style="background:#F4F6FA">
 {glow(1100,-300,1200,1200,"rgba(44,114,219,.18)")}{glow(-400,500,1100,1100,"rgba(0,184,219,.14)")}
 <img class="logo" src="../assets/logo-blue.svg" style="left:96px;top:84px">
 {dots(10,3,40,14,1370,880,fade=False,unlit="#D6DEEC")}
 <div class="tag" style="left:96px;bottom:96px;color:#0F172B">Managed IT for UK businesses,<br>powered by AI.</div>
 <div class="url" style="right:96px;top:92px;color:#6B7A90">transputec.com</div></div>'''))
# 4 Horizon rings
bgs.append(("4-horizon", f'''<div class="bg" style="background:{NAVY}">
 {glow(-200,-300,1300,1300,"rgba(21,93,252,.3)")}
 {rings(1700,1090,150)}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#CAD5E2">Contracted outcomes.<br>Not tickets closed.</div></div>'''))
# 5 Brand blue
dp = ''.join(f'<circle cx="{c*60+30}" cy="{r*60+30}" r="5" fill="#fff" fill-opacity=".10"/>' for r in range(18) for c in range(32))
bgs.append(("5-brand-blue", f'''<div class="bg" style="background:linear-gradient(135deg,#155DFC 0%,#2C72DB 45%,#00B8DB 100%)">
 <svg style="position:absolute;left:0;top:0" width="1920" height="1080">{dp}</svg>
 {glow(-300,-300,1200,1200,"rgba(0,16,32,.35)")}
 <img class="logo" src="../assets/logo-white.svg" style="right:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#fff;font-weight:500">Managed IT for UK businesses,<br>powered by AI.</div>
 <div class="url" style="right:96px;bottom:104px;color:rgba(255,255,255,.8)">transputec.com</div></div>'''))
# 6 Bokeh
bk = []
cols = ["rgba(0,184,219,.30)", "rgba(21,93,252,.34)", "rgba(44,114,219,.28)", "rgba(255,255,255,.12)"]
for i in range(26):
    x = random.choice([random.randint(-60, 480), random.randint(1440, 1960)]); y = random.randint(-40, 1100); r = random.randint(30, 150)
    bk.append(f'<div class="glow" style="left:{x-r}px;top:{y-r}px;width:{2*r}px;height:{2*r}px;background:{random.choice(cols)};filter:blur({random.choice([2,6,14])}px);opacity:{random.uniform(.35,.9):.2f}"></div>')
bgs.append(("6-bokeh", f'''<div class="bg" style="background:radial-gradient(circle at 50% 45%,#16213D 0%,#0A1020 70%)">
 {''.join(bk)}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;bottom:96px">
 <div class="url" style="right:96px;bottom:104px;color:rgba(255,255,255,.55)">transputec.com</div></div>'''))

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(f'<div id="{n}">{h}</div>' for n, h in bgs) + '</body></html>'
open('backgrounds.html', 'w', encoding='utf8').write(html)
open('names.txt', 'w').write('\n'.join(n for n, _ in bgs))

sil = '<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><g fill="#8793A8" fill-opacity=".55"><circle cx="960" cy="420" r="130"/><path d="M560,1080 C560,800 720,640 960,640 C1200,640 1360,800 1360,1080 Z"/></g></svg>'
prev = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}.g{{display:grid;grid-template-columns:repeat(3,1920px);gap:40px;padding:40px;background:#111}}.bg{{margin:0}}.c{{position:relative}}.cap{{position:absolute;left:30px;top:20px;font:600 40px Poppins;color:#fff;background:rgba(0,0,0,.5);padding:6px 20px;border-radius:30px}}</style></head><body><div class="g">' + ''.join(f'<div class="c">{h}{sil}<div class="cap">{n.split("-",1)[0]}</div></div>' for n, h in bgs) + '</div></body></html>'
open('preview.html', 'w', encoding='utf8').write(prev)
