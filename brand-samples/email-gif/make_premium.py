"""Premium Transputec email signature GIF, 560x150 CSS px, rendered at 2x.
Rolling headline 'Your IT / cloud / security / AI, handled.' + hairline figure that draws itself per service.
Frame 0 is complete (render starts 1.2 s into the first service) for Outlook versions that show only frame 1."""
import re
NAVY, BLUE, BRIGHT, GREY = "#0A0F1A", "#2C72DB", "#3B8BFF", "#AEBACC"
S = [("IT", "laptop", "Managed IT", "Support, devices and networks."),
     ("cloud", "stack", "Cloud", "Moved, run and kept cost-efficient."),
     ("security", "vault", "Cybersecurity", "Protected, monitored and ready."),
     ("AI", "phosphor", "AI", "Put to work in your business, safely.")]
def svg(n):
    t = open(f"figs/{n}.svg").read()
    return re.sub(r'width="\d+" height="\d+"', 'width="100%" height="100%" preserveAspectRatio="xMidYMid meet"', t, count=1)
figs = "".join(f'<div class="fig" id="f{i}">{svg(n)}</div>' for i, (_, n, _, _) in enumerate(S))
words = "".join(f'<span class="w">{w}</span>' for w, *_ in S) + f'<span class="w">{S[0][0]}</span>'
subs = "".join(f'<div class="sub" id="s{i}"><b>{lab}</b>&nbsp;&nbsp;{x}</div>' for i, (_, _, lab, x) in enumerate(S))
segs = "".join(f'<i id="g{i}"><u></u></i>' for i in range(4))
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:P;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}}@font-face{{font-family:P;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}}@font-face{{font-family:P;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}}@font-face{{font-family:M;font-weight:500;src:url(../assets/fonts/jbm-500.woff2)}}
*{{margin:0;padding:0;box-sizing:border-box}}body{{width:560px;height:150px;overflow:hidden;background:#070B14;font-family:P,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;position:relative}}
#bg{{position:absolute;inset:0;background:radial-gradient(42% 120% at 82% 50%,rgba(44,114,219,.26),rgba(44,114,219,0) 70%),linear-gradient(100deg,#060912 0%,{NAVY} 45%,#0B1424 100%)}}
#dots{{position:absolute;left:330px;right:0;top:0;bottom:0;background-image:radial-gradient(rgba(174,186,204,.16) .7px,transparent .8px);background-size:12px 12px;mask-image:radial-gradient(60% 70% at 60% 50%,#000,transparent)}}
#top{{position:absolute;left:0;right:0;top:0;height:1px;background:linear-gradient(90deg,rgba(59,139,255,0),rgba(59,139,255,.9) 30%,rgba(59,139,255,.15) 80%,rgba(59,139,255,0))}}
#halo{{position:absolute;left:400px;top:15px;width:140px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(59,139,255,.45),rgba(59,139,255,0) 65%);opacity:.0}}
.fig{{position:absolute;left:372px;top:6px;width:176px;height:138px;opacity:0}}
#logo{{position:absolute;left:26px;top:24px;height:10px}}
#mark{{position:absolute;left:26px;top:24px;height:10px;width:118px;overflow:hidden}}#sheen{{position:absolute;top:-10px;width:40px;height:30px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);mix-blend-mode:overlay;opacity:.9}}
#h{{position:absolute;left:26px;top:46px;font-weight:600;font-size:25px;letter-spacing:-.035em;line-height:30px;white-space:nowrap}}
#roll{{display:inline-block;vertical-align:top;height:37px;margin-bottom:-7px;overflow:hidden;position:relative}}#col{{display:flex;flex-direction:column;align-items:flex-start}}
.w{{display:block;width:max-content;height:37px;line-height:30px;padding-right:4px;background:linear-gradient(90deg,#5AA2FF,{BRIGHT} 40%,#7FB6FF);-webkit-background-clip:text;color:transparent;white-space:nowrap}}
#u{{position:absolute;left:0;bottom:0;height:1.5px;border-radius:2px;background:linear-gradient(90deg,{BRIGHT},rgba(59,139,255,.2))}}
.sub{{position:absolute;left:26px;top:86px;font-weight:300;font-size:10.5px;color:{GREY};opacity:0;white-space:nowrap}}.sub b{{font-weight:500;color:#fff}}
#foot{{position:absolute;left:26px;bottom:20px;display:flex;align-items:center;gap:12px}}
#web{{font-family:M;font-size:8.6px;letter-spacing:.14em;color:#fff;text-transform:uppercase}}#web span{{color:{BRIGHT}}}
#segs{{display:flex;gap:4px}}#segs i{{display:block;width:16px;height:2px;border-radius:2px;background:rgba(174,186,204,.22);overflow:hidden}}#segs u{{display:block;height:100%;width:0;background:{BRIGHT}}}
#tick{{position:absolute;right:14px;top:12px;font-family:M;font-size:7px;letter-spacing:.14em;color:rgba(174,186,204,.55)}}
</style><div id="bg"></div><div id="dots"></div><div id="top"></div><div id="halo"></div>{figs}
<img id="logo" src="../assets/logo-white.svg"><div id="mark"><div id="sheen"></div></div>
<div id="h">Your <span id="roll"><span id="col">{words}</span><span id="u"></span></span>, handled.</div>{subs}
<div id="foot"><div id="web">transputec<span>.</span>com</div><div id="segs">{segs}</div></div><div id="tick">MANAGED IT · CLOUD · CYBER · AI</div>
<script>
const SEG = 2.2, N = 4, D = SEG * N, OFF = 1.25, ease = x => x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(1 - x, 3), inout = x => x <= 0 ? 0 : x >= 1 ? 1 : x < .5 ? 4*x*x*x : 1 - Math.pow(-2*x + 2, 3)/2;
let W = [];
const figs = [...document.querySelectorAll('.fig')].map(f => {{ const els = [...f.querySelectorAll('path,circle')];
  return els.map((e, k) => {{ const L = e.getTotalLength ? e.getTotalLength() : 100; e.style.strokeDasharray = L; const fo = e.getAttribute('fill-opacity') || '1', fill = e.getAttribute('fill');
    return {{ e, L, d: k / els.length, fill: fill && fill !== 'none' ? +fo : 0 }}; }}); }});
window.render = t => {{
  W = [...document.querySelectorAll('.w')].map(e => e.getBoundingClientRect().width - 2);
  const T = (t + OFF) % D, k = Math.floor(T / SEG), u = T - k * SEG, nk = (k + 1) % N;
  // figure draw: 0..0.9 strokes (staggered), fills 0.55..1.0, hold, fade 1.95..2.2
  figs.forEach((ps, i) => {{ const f = document.getElementById('f' + i);
    if (i !== k) {{ f.style.opacity = 0; return; }}
    const out = 1 - ease((u - 1.95) / .25); f.style.opacity = out; f.style.transform = `translateY(${{(1 - out) * -4}}px)`;
    ps.forEach(p => {{ const q = inout((u - p.d * .45) / .55); p.e.style.strokeDashoffset = p.L * (1 - q); if (p.fill) p.e.style.fillOpacity = p.fill * ease((u - .5) / .45); }}); }});
  document.getElementById('halo').style.opacity = .6;
  // rolling word: transition at the start of each segment (0..0.45)
  const r = inout(u / .45), pos = k + (u < .45 ? r - 1 : 0), from = (k + N - 1) % N;
  const y = (u < .45 ? (k === 0 ? N - 1 + r : k - 1 + r) : k) * 37;   // column has N+1 words (last repeats first)
  document.getElementById('col').style.transform = `translateY(${{-y}}px)`;
  document.querySelectorAll('.w').forEach((e, j) => e.style.opacity = Math.max(0, 1 - Math.abs(y / 37 - j) * 1.8));
  const wi = u < .45 ? W[from] + (W[k] - W[from]) * r : W[k]; document.getElementById('roll').style.width = wi + 'px';
  document.getElementById('u').style.width = (u < .45 ? wi * r : wi) + 'px'; document.getElementById('u').style.opacity = .9;
  for (let i = 0; i < N; i++) {{ const s = document.getElementById('s' + i), v = i === k ? Math.min(ease((u - .2) / .35), 1 - ease((u - 1.95) / .25)) : 0;
    s.style.opacity = v; s.style.transform = `translateX(${{(1 - v) * 6}}px)`;
    document.querySelector('#g' + i + ' u').style.width = (i < k ? 100 : i === k ? Math.min(100, u / SEG * 100) : 0) + '%'; }}
  // sheen across the wordmark at the start of each segment
  document.getElementById('sheen').style.left = (-50 + 220 * ease((u - .1) / .9)) + 'px';
}};
render(0);
</script>'''
open("premium.html", "w").write(html)
