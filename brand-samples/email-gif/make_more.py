"""Three more Transputec signature concepts: Pulse, Terminal, Ticker. 560x150 CSS px; window.DUR + window.render(t); frame 0 complete."""
import json
from make_options import HEAD, JS, NAVY, BLUE, BRIGHT, GREY
BG = f'''body{{background:#070B14}}
#bg{{position:absolute;inset:0;background:radial-gradient(45% 120% at 78% 40%,rgba(44,114,219,.22),rgba(44,114,219,0) 70%),linear-gradient(100deg,#060912,{NAVY} 50%,#0B1424)}}
#h{{position:absolute;left:26px;top:44px;font-weight:600;font-size:23px;letter-spacing:-.035em;line-height:1.06}}#h span{{background:linear-gradient(90deg,#5AA2FF,{BRIGHT});-webkit-background-clip:text;color:transparent}}
.sl{{position:absolute;left:26px;top:100px;font-weight:300;font-size:10px;color:{GREY}}}'''

# ---------------- 7 PULSE: a monitoring trace draws itself, one blip per service, then settles
SV = ["MANAGED IT", "CLOUD", "CYBER", "AI"]
pulse = HEAD + BG + f'''
#tr{{position:absolute;left:238px;top:22px}}
.lb{{position:absolute;font-family:M;font-size:6.6px;letter-spacing:.12em;color:#fff;opacity:0;white-space:nowrap;transform:translateX(-50%)}}.lb b{{color:{BRIGHT};font-weight:500}}
#ok{{position:absolute;right:22px;bottom:18px;font-family:M;font-size:7px;letter-spacing:.14em;color:{BRIGHT}}}
</style><div id="bg"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg">
<div id="h">Steady IT.<br><span>Quietly handled.</span></div><div class="sl">Managed IT, cloud, cyber and AI.</div>
<svg id="tr" width="304" height="96" viewBox="0 0 304 96">
  <defs><linearGradient id="fadeL" x1="0" x2="1"><stop offset="0" stop-color="#3B8BFF" stop-opacity=".15"/><stop offset=".25" stop-color="#3B8BFF"/></linearGradient></defs>
  <line x1="0" y1="62" x2="304" y2="62" stroke="rgba(174,186,204,.14)" stroke-dasharray="2 4"/>
  <path id="p" fill="none" stroke="url(#fadeL)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"/>
  <circle id="hd" r="3.2" fill="#fff"/><circle id="hg" r="9" fill="rgba(59,139,255,.35)"/>
</svg>{"".join(f'<div class="lb" id="l{i}">{s} <b>· OK</b></div>' for i, s in enumerate(SV))}
<div id="ok">ALL HANDLED</div><div class="web">TRANSPUTEC<span>.</span>COM</div>
<script>{JS}
window.DUR = 7.2;
const X = [44, 112, 180, 248], W = 304, B = 62;
function y(x) {{ let v = 0; X.forEach(c => {{ const d = x - c; if (d > -14 && d < 14) v += (d < -6 ? (d + 14) * .9 : d < 0 ? 7 - (d + 6) * 6.5 : d < 5 ? -32 + d * 9.5 : 13 - (d - 5) * 1.45); }}); return B - v; }}
const pts = []; for (let x = 0; x <= W; x += 1) pts.push([x, y(x)]);
const path = document.getElementById('p'); path.setAttribute('d', 'M' + pts.map(p => p[0] + ' ' + p[1].toFixed(1)).join('L'));
const L = path.getTotalLength(); path.style.strokeDasharray = L;
window.render = t => {{
  // 0-1.2 complete trace (first frame), 1.2-1.6 fade, 1.6-6.0 draw, 6.0-7.2 hold complete
  let draw, op = 1;
  if (t < 1.2) draw = 1; else if (t < 1.6) {{ draw = 1; op = 1 - ease((t - 1.2) / .4); }} else if (t < 6.0) draw = inout((t - 1.6) / 4.4); else draw = 1;
  if (t >= 1.6 && t < 1.8) op = ease((t - 1.6) / .2);
  path.style.strokeDashoffset = L * (1 - draw); path.style.opacity = op;
  const hx = W * draw, hy = y(hx), r = document.getElementById('tr').getBoundingClientRect();
  ['hd', 'hg'].forEach(id => {{ const c = document.getElementById(id); c.setAttribute('cx', hx); c.setAttribute('cy', hy); c.style.opacity = (t >= 1.6 && t < 6.2) ? 1 : 0; }});
  X.forEach((c, i) => {{ const shown = (t < 1.6 ? op : draw * W >= c + 4 ? ease((draw * W - c - 4) / 30) : 0) * (t >= 1.2 && t < 1.6 ? op : 1);
    const l = document.getElementById('l' + i); l.style.left = (238 + c) + 'px'; l.style.top = (22 + B - 46) + 'px'; l.style.opacity = shown; }});
  document.getElementById('ok').style.opacity = t < 1.2 ? 1 : t < 1.6 ? op : ease((t - 5.9) / .4);
}};
render(0);</script>'''
open("opt-pulse.html", "w").write(pulse)

# ---------------- 8 TERMINAL: a command line types each service as handled
LINES = [("managed-it", "handled"), ("cloud", "handled"), ("cybersecurity", "handled"), ("ai", "handled")]
term = HEAD + BG + f'''
#w{{position:absolute;left:278px;top:18px;width:262px;height:114px;border-radius:9px;background:#05080F;border:1px solid rgba(59,139,255,.3);overflow:hidden}}
#bar{{height:16px;display:flex;align-items:center;gap:4px;padding:0 8px;background:rgba(174,186,204,.06);border-bottom:1px solid rgba(174,186,204,.1)}}#bar i{{width:5px;height:5px;border-radius:50%;background:rgba(174,186,204,.3)}}#bar span{{margin-left:auto;font-family:M;font-size:6px;letter-spacing:.12em;color:rgba(174,186,204,.6)}}
#tx{{padding:7px 10px;font-family:M;font-size:8.4px;line-height:15px;color:#DCE6F5;white-space:pre}}
.p{{color:{BRIGHT}}}.ok{{color:{BRIGHT}}}.dim{{color:rgba(174,186,204,.55)}}
#cur{{display:inline-block;width:5px;height:9px;background:{BRIGHT};vertical-align:-1px}}
</style><div id="bg"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg">
<div id="h">Your IT,<br><span>handled.</span></div><div class="sl">Managed IT, cloud, cyber and AI.</div>
<div id="w"><div id="bar"><i></i><i></i><i></i><span>TRANSPUTEC ~</span></div><div id="tx"></div></div>
<div class="web">TRANSPUTEC<span>.</span>COM</div>
<script>{JS}
window.DUR = 8.0;
const CMD = "transputec status";
const L = {json.dumps([list(x) for x in LINES])};
const dots = n => ".".repeat(Math.max(2, 16 - n.length));
function full(k, typed, cursor) {{
  let s = '<span class="p">$</span> ' + CMD.slice(0, typed);
  if (typed >= CMD.length) {{ for (let i = 0; i < k; i++) s += '\\n' + L[i][0] + ' <span class="dim">' + dots(L[i][0]) + '</span> <span class="ok">✓ ' + L[i][1] + '</span>'; }}
  return s + (cursor ? '<span id="cur"></span>' : '');
}}
window.render = t => {{
  const blink = Math.floor(t * 2.5) % 2 === 0;
  let html;
  if (t < 1.4) html = full(4, CMD.length, blink);               // complete first frame
  else if (t < 1.7) html = '<span class="p">$</span> ' + (blink ? '<span id="cur"></span>' : '');
  else if (t < 3.0) html = full(0, Math.floor((t - 1.7) / 1.3 * CMD.length), true);
  else html = full(Math.min(4, Math.floor((t - 3.0) / .75) + 1), CMD.length, blink);
  document.getElementById('tx').innerHTML = html;
}};
render(0);</script>'''
open("opt-terminal.html", "w").write(term)

# ---------------- 9 TICKER: headline plus a news-ticker band of services
ITEMS = ["MANAGED IT", "CLOUD", "CYBERSECURITY", "AI", "ONE PARTNER"]
seq = "".join(f'<span class="it">{s}</span><span class="dot">●</span>' for s in ITEMS)
tick = HEAD + BG + f'''
#h{{top:40px;font-size:26px}}
#tag{{position:absolute;right:24px;top:26px;font-family:M;font-size:7px;letter-spacing:.16em;color:rgba(174,186,204,.6)}}
#band{{position:absolute;left:0;right:0;bottom:0;height:34px;background:rgba(59,139,255,.10);border-top:1px solid rgba(59,139,255,.35);overflow:hidden}}
#live{{position:absolute;left:0;top:0;bottom:0;width:96px;z-index:2;display:flex;align-items:center;justify-content:center;gap:5px;background:{BLUE};font-family:M;font-weight:500;font-size:7.4px;letter-spacing:.14em;color:#fff}}#live b{{width:5px;height:5px;border-radius:50%;background:#fff}}
#run{{position:absolute;left:96px;top:0;bottom:0;display:flex;align-items:center;white-space:nowrap;will-change:transform}}
.it{{font-family:M;font-weight:500;font-size:9.5px;letter-spacing:.16em;color:#fff;padding:0 16px}}.dot{{color:{BRIGHT};font-size:6px}}
#fade{{position:absolute;right:0;top:0;bottom:0;width:60px;background:linear-gradient(90deg,rgba(7,11,20,0),#0B1424);z-index:2}}
.web{{bottom:auto;top:auto;left:auto;right:24px;bottom:48px}}
</style><div id="bg"></div><div id="top"></div><img id="logo" src="../assets/logo-white.svg"><div id="tag">MANAGED IT · CLOUD · CYBER · AI</div>
<div id="h">Your IT, <span>handled.</span></div><div class="sl" style="top:78px">One partner for managed IT, cloud, cybersecurity and AI.</div>
<div class="web">TRANSPUTEC<span>.</span>COM</div>
<div id="band"><div id="live"><b></b>TRANSPUTEC</div><div id="run">{seq}{seq}{seq}</div><div id="fade"></div></div>
<script>{JS}
window.DUR = 6.0; let P = 0;
window.render = t => {{
  const run = document.getElementById('run'); if (!P) P = run.scrollWidth / 3;   // one sequence width = loop period
  run.style.transform = `translateX(${{-(t / DUR) * P}}px)`;
  document.querySelector('#live b').style.opacity = Math.floor(t * 2) % 2 ? .35 : 1;
}};
render(0);</script>'''
open("opt-ticker.html", "w").write(tick)
print("ok")
