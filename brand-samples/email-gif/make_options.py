"""More Transputec email signature concepts (560x150 CSS px, rendered at 2x). Each page exposes window.DUR and window.render(t).
Frame 0 of every concept is a complete, readable card (some Outlook versions show only the first frame)."""
import sys; sys.path.insert(0, "../linkedin-nov")
from kit import icon
NAVY, BLUE, BRIGHT, GREY = "#0A0F1A", "#2C72DB", "#3B8BFF", "#AEBACC"
HEAD = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:P;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}}@font-face{{font-family:P;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}}@font-face{{font-family:P;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}}@font-face{{font-family:M;font-weight:400;src:url(../assets/fonts/jbm-400.woff2)}}@font-face{{font-family:M;font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}}
*{{margin:0;padding:0;box-sizing:border-box}}body{{width:560px;height:150px;overflow:hidden;font-family:P,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;position:relative}}
#logo{{position:absolute;left:26px;top:24px;height:10px}}.web{{position:absolute;left:26px;bottom:20px;font-family:M;font-weight:500;font-size:8.6px;letter-spacing:.14em;color:#fff}}.web span{{color:{BRIGHT}}}
#top{{position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,rgba(59,139,255,0),rgba(59,139,255,.9) 30%,rgba(59,139,255,.15) 80%,rgba(59,139,255,0))}}
'''
JS = "const ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3), inout = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2, clamp = x => Math.max(0, Math.min(1, x));"
CLOUD = '<svg width="{s}" height="{s}" viewBox="0 0 64 64" fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 46h26a10 10 0 0 0 1-20 14 14 0 0 0-27-3 11 11 0 0 0 0 23z"/></svg>'
SPARK = '<svg width="{s}" height="{s}" viewBox="0 0 64 64" fill="none" stroke="{c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M28 12l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/><path d="M46 38l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>'
def ic(n, s, c): return {"cloud": CLOUD, "spark": SPARK}[n].format(s=s, c=c) if n in ("cloud", "spark") else icon(n, s, c, 3)
S = [("Managed IT", "laptop", "Support, devices and networks."), ("Cloud", "cloud", "Moved, run and kept cost-efficient."),
     ("Cybersecurity", "shield", "Protected, monitored and ready."), ("AI", "spark", "Put to work in your business, safely.")]

# ---------------------------------------------------------------- 1 ORBIT
nodes = "".join(f'<div class="node" id="n{i}"><div class="nt">{ic(n, 15, BRIGHT)}</div><div class="nl">{t}</div></div>' for i, (t, n, _) in enumerate(S))
subs = "".join(f'<div class="sub" id="s{i}"><b>{t}</b>&nbsp;&nbsp;{x}</div>' for i, (t, _, x) in enumerate(S))
orbit = HEAD + f'''body{{background:#070B14}}
#bg{{position:absolute;inset:0;background:radial-gradient(40% 110% at 79% 52%,rgba(44,114,219,.28),rgba(44,114,219,0) 70%),linear-gradient(100deg,#060912,{NAVY} 50%,#0B1424)}}
#h{{position:absolute;left:26px;top:42px;font-weight:600;font-size:22px;letter-spacing:-.035em;line-height:1.08}}#h span{{background:linear-gradient(90deg,#5AA2FF,{BRIGHT});-webkit-background-clip:text;color:transparent}}
.sub{{position:absolute;left:26px;top:95px;font-weight:300;font-size:10.5px;color:{GREY};white-space:nowrap;opacity:0}}.sub b{{font-weight:500;color:#fff}}
#orb{{position:absolute;left:330px;top:0;width:230px;height:150px}}
#ring{{position:absolute;left:0;top:0}}
#core{{position:absolute;left:96px;top:58px;width:34px;height:34px;border-radius:9px}}#cg{{position:absolute;left:73px;top:35px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,rgba(59,139,255,.5),rgba(59,139,255,0) 65%)}}
.node{{position:absolute;width:30px;height:30px;margin:-15px 0 0 -15px}}.nt{{width:30px;height:30px;border-radius:9px;background:#0E1A30;border:1px solid rgba(59,139,255,.55);display:flex;align-items:center;justify-content:center}}
.nl{{position:absolute;top:33px;left:50%;transform:translateX(-50%);font-family:M;font-size:6.5px;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;color:{GREY}}}
.web{{bottom:18px}}
</style><div id="bg"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg">
<div id="h">One partner.<br><span>Every layer of your IT.</span></div>{subs}
<div id="orb"><svg id="ring" width="230" height="150"><ellipse cx="113" cy="75" rx="78" ry="40" fill="none" stroke="rgba(59,139,255,.35)" stroke-width="1"/>
<ellipse id="dash" cx="113" cy="75" rx="78" ry="40" fill="none" stroke="#3B8BFF" stroke-width="1.4" stroke-dasharray="40 360" stroke-linecap="round"/>
<line id="beam" x1="113" y1="75" x2="113" y2="115" stroke="#3B8BFF" stroke-width="1.2" stroke-dasharray="2 3" opacity=".9"/></svg>
<div id="cg"></div><img id="core" src="../assets/mark.png">{nodes}</div>
<div class="web">TRANSPUTEC<span>.</span>COM</div>
<script>{JS}
window.DUR = 8.8; const N = 4, OFF = 0;
window.render = t => {{
  const turn = (t / DUR) * 2 * Math.PI;                // one full orbit per loop
  let best = -1, bz = -9;
  for (let i = 0; i < N; i++) {{
    const a = Math.PI / 2 - turn + i * Math.PI / 2;    // node 0 starts at the front
    const x = 113 + 78 * Math.cos(a), y = 75 + 40 * Math.sin(a), z = Math.sin(a);   // z: 1 front, -1 back
    const e = document.getElementById('n' + i), sc = .78 + .22 * (z + 1) / 2;
    e.style.left = x + 'px'; e.style.top = y + 'px'; e.style.transform = `scale(${{sc}})`; e.style.zIndex = z > 0 ? 3 : 1;
    const act = clamp((z - .55) / .4); e.style.opacity = .45 + .55 * ((z + 1) / 2);
    e.querySelector('.nt').style.background = `rgba(${{14 + 30 * act}},${{26 + 80 * act}},${{48 + 160 * act}},1)`;
    e.querySelector('.nt').style.borderColor = `rgba(127,182,255,${{.55 + .45 * act}})`;
    e.querySelector('.nl').style.color = act > .5 ? '#fff' : 'rgba(174,186,204,.7)'; e.querySelector('.nl').style.opacity = clamp((z + .2) / .6);
    if (z > bz) {{ bz = z; best = i; }}
    const s = document.getElementById('s' + i); s.style.opacity = act; s.style.transform = `translateY(${{(1 - act) * 4}}px)`;
    if (act > .01) {{ const b = document.getElementById('beam'); b.setAttribute('x2', x); b.setAttribute('y2', y); b.style.opacity = .9 * act; }}
  }}
  document.getElementById('dash').style.strokeDashoffset = -((t / DUR) * 4 * 400) % 400;
  document.getElementById('core').style.zIndex = 2;
}};
render(0);</script>'''
open("opt-orbit.html", "w").write(orbit)

# ---------------------------------------------------------------- 2 STATUS BOARD
rows = "".join(f'''<div class="row" id="r{i}"><span class="ri">{ic(n, 11, BRIGHT)}</span><span class="rl">{t.upper()}</span><span class="bar"><i></i></span><span class="st"><b>●</b> HANDLED</span></div>''' for i, (t, n, _) in enumerate(S))
status = HEAD + f'''body{{background:#070B14}}
#bg{{position:absolute;inset:0;background:radial-gradient(45% 120% at 75% 30%,rgba(44,114,219,.22),rgba(44,114,219,0) 70%),linear-gradient(100deg,#060912,{NAVY} 50%,#0B1424)}}
#h{{position:absolute;left:26px;top:44px;font-weight:600;font-size:25px;letter-spacing:-.035em;line-height:1.05}}#h span{{background:linear-gradient(90deg,#5AA2FF,{BRIGHT});-webkit-background-clip:text;color:transparent}}
#sl{{position:absolute;left:26px;top:100px;font-weight:300;font-size:10px;color:{GREY}}}
#p{{position:absolute;left:286px;top:20px;width:252px;height:110px;border-radius:10px;background:rgba(10,18,34,.85);border:1px solid rgba(59,139,255,.28);padding:9px 12px}}
#ph{{display:flex;justify-content:space-between;font-family:M;font-size:6.6px;letter-spacing:.14em;color:{GREY};padding-bottom:6px;border-bottom:1px solid rgba(174,186,204,.12)}}#ph b{{color:{BRIGHT};font-weight:500}}
.row{{display:grid;grid-template-columns:16px 1fr 46px 62px;align-items:center;height:19px;font-family:M;font-size:7.6px;letter-spacing:.08em;border-bottom:1px solid rgba(174,186,204,.07)}}
.ri{{display:flex;align-items:center}}.rl{{color:#fff}}.bar{{height:2px;background:rgba(174,186,204,.15);border-radius:2px;overflow:hidden;margin-right:8px}}.bar i{{display:block;height:100%;width:0;background:{BRIGHT}}}
.st{{color:{BRIGHT};text-align:right;font-weight:500}}.st b{{font-weight:500}}
#all{{position:absolute;left:298px;bottom:12px;font-family:M;font-size:6.6px;letter-spacing:.14em;color:#fff}}
</style><div id="bg"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg">
<div id="h">Everything IT.<br><span>Handled.</span></div><div id="sl">Managed IT, cloud, cyber and AI.</div>
<div id="p"><div id="ph"><span>TRANSPUTEC · YOUR IT</span><span><b id="live">●</b> LIVE</span></div>{rows}</div>
<div class="web">TRANSPUTEC<span>.</span>COM</div>
<script>{JS}
window.DUR = 8.0;
window.render = t => {{
  const reset = t > 1.3 && t < 1.7 ? 1 - ease((t - 1.3) / .3) : (t >= 1.7 && t < 7.4 ? 0 : 1);
  for (let i = 0; i < 4; i++) {{
    const a = 1.8 + i * 1.25, r = document.getElementById('r' + i);
    let fill, done;
    if (t < 1.3 || t >= 7.4) {{ fill = 1; done = 1; }}
    else if (t < 1.7) {{ fill = reset; done = reset; }}
    else {{ fill = inout((t - a) / .8); done = ease((t - a - .8) / .25); }}
    r.querySelector('.bar i').style.width = fill * 100 + '%';
    const st = r.querySelector('.st'); st.style.opacity = done; st.style.transform = `translateX(${{(1 - done) * 6}}px)`;
    r.style.background = done > .5 && done < 1 ? 'rgba(59,139,255,.10)' : (t >= a + .8 && t < a + 1.3 ? 'rgba(59,139,255,.08)' : 'transparent');
  }}
  document.getElementById('live').style.opacity = (Math.floor(t * 2) % 2) ? .35 : 1;
}};
render(0);</script>'''
open("opt-status.html", "w").write(status)

# ---------------------------------------------------------------- 3 KEYNOTE
words = "".join(f'<div class="kw" id="k{i}">{t}.</div>' for i, (t, _, _) in enumerate(S))
idx = "".join(f'<div class="ix" id="x{i}"><span>0{i+1}</span><i></i></div>' for i in range(4))
keynote = HEAD + f'''body{{background:#03050A}}
#glow{{position:absolute;left:300px;top:-60px;width:320px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(44,114,219,.22),rgba(44,114,219,0) 65%)}}
.kw,#end{{position:absolute;left:26px;top:48px;font-weight:600;font-size:34px;letter-spacing:-.045em;line-height:1.1;white-space:nowrap}}
.kw{{background:linear-gradient(90deg,#FFFFFF 0%,#FFFFFF 40%,{BRIGHT} 60%,#7FB6FF 100%);background-size:250% 100%;-webkit-background-clip:text;color:transparent;opacity:0}}
#end{{top:44px;font-size:30px;line-height:1.08}}#end span{{background:linear-gradient(90deg,#5AA2FF,{BRIGHT});-webkit-background-clip:text;color:transparent}}
#line{{position:absolute;left:26px;top:100px;height:1px;width:0;background:linear-gradient(90deg,{BRIGHT},rgba(59,139,255,0))}}
#idx{{position:absolute;right:26px;top:36px;display:flex;flex-direction:column;gap:9px}}.ix{{display:flex;align-items:center;gap:8px;font-family:M;font-size:7px;letter-spacing:.12em;color:rgba(174,186,204,.45)}}.ix i{{display:block;width:60px;height:1px;background:rgba(174,186,204,.18)}}
#cap{{position:absolute;right:26px;bottom:20px;font-family:M;font-size:7px;letter-spacing:.14em;color:rgba(174,186,204,.6)}}
</style><div id="glow"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg">
{words}<div id="end">One partner.<br><span>All of it.</span></div><div id="line"></div><div id="idx">{idx}</div>
<div class="web">TRANSPUTEC<span>.</span>COM</div><div id="cap">MANAGED IT · CLOUD · CYBER · AI</div>
<script>{JS}
window.DUR = 8.0; const A = 1.9, STEP = 1.3;
window.render = t => {{
  const endv = t < A ? (t < A - .35 ? 1 : 1 - ease((t - (A - .35)) / .35)) : ease((t - (A + 4 * STEP)) / .45);
  const e = document.getElementById('end'); e.style.opacity = endv; e.style.transform = `translateY(${{(1 - endv) * 8}}px)`;
  for (let i = 0; i < 4; i++) {{
    const a = A + i * STEP, u = t - a, v = u < 0 || u > STEP ? 0 : Math.min(ease(u / .3), 1 - ease((u - STEP + .3) / .3));
    const k = document.getElementById('k' + i); k.style.opacity = v; k.style.transform = `translateY(${{u < STEP / 2 ? (1 - v) * 10 : -(1 - v) * 10}}px)`;
    k.style.backgroundPosition = `${{100 - 100 * inout(u / (STEP * .9))}}% 0`;
    const on = u >= 0 && u < STEP ? 1 : 0, x = document.getElementById('x' + i);
    x.style.color = on ? '#fff' : 'rgba(174,186,204,.45)'; x.querySelector('i').style.background = on ? '{BRIGHT}' : 'rgba(174,186,204,.18)';
    x.querySelector('i').style.width = on ? (30 + 30 * ease(u / .5)) + 'px' : '60px';
  }}
  const lw = t >= A && t < A + 4 * STEP ? 120 * ease(((t - A) % STEP) / .6) : 0;
  document.getElementById('line').style.width = lw + 'px';
}};
render(0);</script>'''
open("opt-keynote.html", "w").write(keynote)
print("ok")
