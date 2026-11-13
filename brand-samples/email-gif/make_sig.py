"""Transputec email signature GIF: 500x120 CSS px (render at 2x). Dark navy card so it reads on light and dark inboxes.
Frame 0 is complete (logo, line, first service, web address) because some Outlook versions show only the first frame."""
import sys; sys.path.insert(0, "../linkedin-nov")
from kit import icon
NAVY, BLUE, BRIGHT, GREY = "#0A0F1A", "#2C72DB", "#3B8BFF", "#AEBACC"
CLOUD = '<svg width="{s}" height="{s}" viewBox="0 0 64 64" fill="none" stroke="{c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 46h26a10 10 0 0 0 1-20 14 14 0 0 0-27-3 11 11 0 0 0 0 23z"/></svg>'
SPARK = '<svg width="{s}" height="{s}" viewBox="0 0 64 64" fill="none" stroke="{c}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M28 12l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"/><path d="M46 38l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>'
S = [("Managed IT", "laptop", "Support, devices and networks."),
     ("Cloud", "cloud", "Moved, run and kept cost-efficient."),
     ("Cybersecurity", "shield", "Protected, monitored and ready."),
     ("AI", "spark", "Put to work in your business, safely.")]
def ic(n, s, c): return {"cloud": CLOUD, "spark": SPARK}[n].format(s=s, c=c) if n in ("cloud", "spark") else icon(n, s, c, 2.8)
svc = "".join(f'<div class="svc" id="s{i}"><div class="tile"><div class="glow"></div>{ic(n, 26, BRIGHT)}</div><div><div class="sl">{t}</div><div class="sx">{x}</div></div></div>' for i, (t, n, x) in enumerate(S))
dots = "".join(f'<i id="d{i}"></i>' for i in range(4))
html = f'''<!doctype html><meta charset="utf-8"><style>
@font-face{{font-family:P;font-weight:300;src:url(../assets/fonts/poppins-300.woff2)}}@font-face{{font-family:P;font-weight:500;src:url(../assets/fonts/poppins-500.woff2)}}@font-face{{font-family:P;font-weight:600;src:url(../assets/fonts/poppins-600.woff2)}}
*{{margin:0;padding:0;box-sizing:border-box}}body{{width:500px;height:120px;overflow:hidden;background:{NAVY};font-family:P,sans-serif;color:#fff;-webkit-font-smoothing:antialiased;position:relative}}
#bg{{position:absolute;inset:0;background:radial-gradient(55% 140% at 82% 0%,rgba(44,114,219,.32),rgba(44,114,219,0) 70%)}}
#edge{{position:absolute;left:0;top:0;bottom:0;width:3px;background:linear-gradient({BRIGHT},{BLUE})}}
#logo{{position:absolute;left:22px;top:24px;height:10px}}
#tag{{position:absolute;left:22px;top:46px;font-weight:600;font-size:18px;letter-spacing:-.03em;line-height:1.1}}#tag span{{color:{BRIGHT}}}
#web{{position:absolute;left:22px;bottom:17px;font-weight:500;font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:{GREY}}}
#div{{position:absolute;left:200px;top:22px;bottom:22px;width:1px;background:rgba(174,186,204,.18)}}
.svc{{position:absolute;left:222px;top:26px;width:260px;display:flex;gap:14px;align-items:center}}
.tile{{position:relative;flex:none;width:52px;height:52px;border-radius:13px;background:linear-gradient(160deg,rgba(59,139,255,.18),rgba(44,114,219,.04));border:1px solid rgba(59,139,255,.5);display:flex;align-items:center;justify-content:center;overflow:hidden}}
.glow{{position:absolute;inset:0;background:radial-gradient(circle at 50% 35%,rgba(59,139,255,.5),rgba(59,139,255,0) 70%)}}.tile svg{{position:relative}}
.sl{{font-weight:600;font-size:15px;letter-spacing:-.02em}}.sx{{font-weight:300;font-size:10.5px;line-height:1.4;color:{GREY};margin-top:3px}}
#dots{{position:absolute;left:222px;bottom:20px;display:flex;gap:6px}}#dots i{{display:block;width:14px;height:3px;border-radius:2px;background:rgba(174,186,204,.25)}}
#cap{{position:absolute;right:20px;bottom:17px;font-weight:500;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(174,186,204,.7)}}
</style><div id="bg"></div><div id="edge"></div><img id="logo" src="../assets/logo-white.svg">
<div id="tag">Your IT,<br><span>handled.</span></div><div id="web">transputec.com</div><div id="div"></div>
{svc}<div id="dots">{dots}</div><div id="cap">Managed IT · Cloud · Cyber · AI</div>
<script>
const SEG = 1.6, F = .28, D = SEG * 4, ease = x => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
window.render = t => {{
  for (let i = 0; i < 4; i++) {{
    const a = i * SEG; let u = ((t - a) % D + D) % D;   // time since this service started, looping
    const inn = i === 0 && t < SEG ? 1 : ease(u / F), out = 1 - ease((u - (SEG - F)) / F), v = u < SEG ? Math.min(inn, out) : 0;
    const e = document.getElementById("s" + i); e.style.opacity = v; e.style.transform = `translateY(${{(1 - v) * (u < SEG / 2 ? 8 : -8)}}px)`;
    const d = document.getElementById("d" + i); d.style.background = Math.floor(t / SEG + 1e-6) % 4 === i ? "{BRIGHT}" : "rgba(174,186,204,.25)"; }}
}};
render(0);
</script>'''
open("sig.html", "w").write(html)
