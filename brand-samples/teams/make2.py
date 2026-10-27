import random, math
random.seed(21)
FONTS = """
@font-face{font-family:Poppins;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}
@font-face{font-family:Poppins;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}
@font-face{font-family:Poppins;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}
"""
CSS = FONTS + """
*{margin:0;padding:0;box-sizing:border-box}
body{background:#222;font-family:Poppins,sans-serif}
.bg{position:relative;width:1920px;height:1080px;overflow:hidden}
.logo{position:absolute;height:34px}
.tag{position:absolute;font-weight:300;font-size:26px;letter-spacing:-.01em;line-height:1.4}
.url{position:absolute;font-family:'JetBrains Mono';font-weight:500;font-size:17px;letter-spacing:.2em;text-transform:uppercase}
.blob{position:absolute;border-radius:50%}
.glass{position:absolute;background:rgba(255,255,255,.07);border:1.5px solid rgba(255,255,255,.18);backdrop-filter:blur(26px);-webkit-backdrop-filter:blur(26px);border-radius:30px}
"""
NAVY = "#0F172B"
GRAD = "linear-gradient(90deg,#00B8DB,#155DFC)"
def blob(l, t, w, h, col, blur=90, op=1):
    return f'<div class="blob" style="left:{l}px;top:{t}px;width:{w}px;height:{h}px;background:{col};filter:blur({blur}px);opacity:{op}"></div>'

def waves(y0, n=30, amp=70, light=False):
    o = ['<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient></defs>']
    for i in range(n):
        pts = []
        for x in range(0, 1941, 20):
            y = y0 + i*7 + amp*math.sin(x/310 + i*.09) * (0.6 + i/n) + 30*math.sin(x/130 + i*.2)
            pts.append(f'{x},{y:.1f}')
        op = .75 - i*.022
        o.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="url(#wg)" stroke-width="2" stroke-opacity="{max(.06, op):.2f}"/>')
    o.append('</svg>')
    return ''.join(o)

bgs = []
# 7 Aurora
bgs.append(("07-aurora", f'''<div class="bg" style="background:{NAVY}">
 {blob(-200,-160,1000,700,"#155DFC",110,.75)}{blob(1100,-260,900,700,"#00B8DB",120,.55)}{blob(1000,560,1100,700,"#2C72DB",120,.6)}{blob(-260,640,800,600,"#00B8DB",120,.4)}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div style="position:absolute;left:96px;top:140px;width:120px;height:4px;border-radius:2px;background:{GRAD}"></div>
 <div class="tag" style="left:96px;bottom:96px;color:#fff;font-weight:500;font-size:30px;letter-spacing:-.02em">Managed IT, cyber and AI.<br><span style="font-weight:300;color:#CAD5E2;font-size:24px">Contracted outcomes.</span></div></div>'''))
# 8 Glass
bgs.append(("08-glass", f'''<div class="bg" style="background:linear-gradient(160deg,#0F172B 0%,#16213D 100%)">
 {blob(-120,-120,720,720,"#155DFC",80,.8)}{blob(1380,520,620,620,"#00B8DB",80,.65)}{blob(1500,-100,480,480,"#2C72DB",80,.6)}
 <div class="glass" style="left:76px;bottom:76px;width:640px;height:230px"></div>
 <img class="logo" src="../assets/logo-white.svg" style="left:116px;bottom:226px">
 <div class="tag" style="left:116px;bottom:112px;color:#E6EEF9;font-size:24px">Managed IT for UK businesses,<br>powered by AI.</div>
 <div class="url" style="right:96px;top:92px;color:rgba(255,255,255,.7)">transputec.com</div></div>'''))
# 9 Diagonal bands
bgs.append(("09-bands", f'''<div class="bg" style="background:{NAVY}">
 <div style="position:absolute;left:-640px;top:-200px;width:600px;height:1600px;background:linear-gradient(180deg,#00B8DB,#155DFC);transform:rotate(14deg);opacity:.95"></div>
 <div style="position:absolute;right:-300px;top:-240px;width:520px;height:1600px;background:linear-gradient(180deg,#155DFC,#00B8DB);transform:rotate(14deg);opacity:.9"></div>
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#fff;font-weight:500;font-size:28px;line-height:1.3">Predictable IT.<br>Predictable budget.</div></div>'''))
# 10 Waves
bgs.append(("10-waves", f'''<div class="bg" style="background:{NAVY}">
 {blob(900,-300,1200,800,"rgba(21,93,252,.55)",120)}
 {waves(700)}
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="url" style="right:96px;top:92px;color:rgba(255,255,255,.6)">transputec.com</div></div>'''))
# 11 Gradient frame
bgs.append(("11-frame", f'''<div class="bg" style="background:{GRAD.replace("90deg","135deg")}">
 <div style="position:absolute;left:14px;top:14px;right:14px;bottom:14px;border-radius:36px;background:{NAVY};overflow:hidden">
  {blob(1100,-300,1000,800,"#155DFC",120,.5)}{blob(-300,500,900,700,"#00B8DB",120,.3)}
  <img class="logo" src="../assets/logo-white.svg" style="left:82px;top:70px">
  <div class="tag" style="left:82px;bottom:82px;color:#CAD5E2">Managed IT for UK businesses,<br>powered by AI.</div>
  <div class="url" style="right:82px;bottom:90px;color:rgba(255,255,255,.55)">transputec.com</div></div></div>'''))
# 12 Light aurora
bgs.append(("12-light-aurora", f'''<div class="bg" style="background:#F4F6FA">
 {blob(-200,-200,900,700,"#9CC3FF",110,.7)}{blob(1200,-260,900,700,"#9BE8F5",120,.7)}{blob(1250,600,900,700,"#B7CBFF",120,.6)}{blob(-240,640,800,600,"#A9EAF6",120,.55)}
 <img class="logo" src="../assets/logo-blue.svg" style="left:96px;top:84px">
 <div style="position:absolute;left:96px;top:140px;width:120px;height:4px;border-radius:2px;background:{GRAD}"></div>
 <div class="tag" style="left:96px;bottom:96px;color:#0F172B;font-weight:500;font-size:28px;letter-spacing:-.02em">Managed IT for UK businesses,<br><span style="font-weight:300">powered by AI.</span></div>
 <div class="url" style="right:96px;bottom:104px;color:#6B7A90">transputec.com</div></div>'''))
# 13 Giant ring
bgs.append(("13-ring", f'''<div class="bg" style="background:{NAVY}">
 {blob(-300,-100,900,900,"rgba(0,184,219,.25)",120)}
 <svg style="position:absolute;left:0;top:0" width="1920" height="1080"><defs><linearGradient id="r1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient></defs>
  <circle cx="1760" cy="300" r="330" fill="none" stroke="url(#r1)" stroke-width="64" stroke-opacity=".95"/>
  <circle cx="1760" cy="300" r="410" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>
  <circle cx="1760" cy="300" r="480" fill="none" stroke="#fff" stroke-opacity=".05" stroke-width="2"/></svg>
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#CAD5E2">Managed IT, cyber and AI<br>for UK businesses.</div></div>'''))
# 14 Mark glow
bgs.append(("14-mark", f'''<div class="bg" style="background:{NAVY}">
 {blob(1180,200,900,900,"rgba(21,93,252,.55)",110)}{blob(-200,-250,800,700,"rgba(0,184,219,.30)",120)}
 <img src="../assets/mark.png" style="position:absolute;right:-120px;top:150px;width:560px;height:560px;border-radius:120px;transform:rotate(-8deg);box-shadow:0 40px 120px rgba(21,93,252,.55)">
 <img src="../assets/mark.png" style="position:absolute;right:300px;top:640px;width:150px;height:150px;border-radius:34px;opacity:.55;transform:rotate(10deg)">
 <img class="logo" src="../assets/logo-white.svg" style="left:96px;top:84px">
 <div class="tag" style="left:96px;bottom:96px;color:#CAD5E2">Predictable IT.<br>Predictable budget.</div></div>'''))

html = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>' + ''.join(f'<div id="{n}" style="margin-bottom:40px">{h}</div>' for n, h in bgs) + '</body></html>'
open('backgrounds2.html', 'w', encoding='utf8').write(html)
open('names2.txt', 'w').write('\n'.join(n for n, _ in bgs))
sil = '<svg style="position:absolute;left:0;top:0" width="1920" height="1080"><g fill="#8793A8" fill-opacity=".5"><circle cx="960" cy="420" r="130"/><path d="M560,1080 C560,800 720,640 960,640 C1200,640 1360,800 1360,1080 Z"/></g></svg>'
prev = f'<!doctype html><html><head><meta charset="utf-8"><style>{CSS}.g{{display:grid;grid-template-columns:repeat(4,1920px);gap:40px;padding:40px;background:#111}}.c{{position:relative}}.cap{{position:absolute;left:30px;top:20px;font:600 44px Poppins;color:#fff;background:rgba(0,0,0,.55);padding:6px 22px;border-radius:30px}}</style></head><body><div class="g">' + ''.join(f'<div class="c">{h}{sil}<div class="cap">{n[:2]}</div></div>' for n, h in bgs) + '</div></body></html>'
open('preview2.html', 'w', encoding='utf8').write(prev)
