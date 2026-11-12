"""Short vertical video (1080 x 1920, muted-safe, text animates in scene by scene).

Scenes are (seconds, html) pairs. Build them with v_title / v_point / v_cta, or let from_slides()
turn a carousel into scenes. render.js steps a render(t) function frame by frame and ffmpeg encodes MP4.
"""
import re
from kit import BASE, NAVY, BLUE, GREY, WHITE, LOGO_WHITE, glow, icon_tile


def v_title(kicker, big, sub=""):
    return (f'<div class="lbl">{kicker}</div>' if kicker else '') + f'<div class="big">{big}</div>' + (f'<div class="sub">{sub}</div>' if sub else '')


def v_point(n, ic, title, sub=""):
    return f'<div class="num">{n:02d}</div><div style="margin:40px 0 56px">{icon_tile(ic, 200)}</div><div class="big" style="font-size:100px">{title}</div>' + (f'<div class="sub">{sub}</div>' if sub else '')


def v_cta(title, sub="", url="transputec.com"):
    return f'<div class="lbl">Next step</div><div class="big" style="font-size:96px">{title}</div>' + (f'<div class="sub">{sub}</div>' if sub else '') + \
        f'<div class="pill solid" style="margin-top:70px;align-self:flex-start;font-size:34px;padding:24px 40px">{url}</div>'


def from_slides(slides):
    """Cover, statements, points/framework items and the closing slide become 4 to 6 second scenes."""
    sc = []
    for s in slides:
        m = getattr(s, "meta", {})
        k = m.get("kind")
        if k == "cover":
            sc.append((4.5, v_title(m["kicker"], m["title"])))
        elif k == "statement":
            sc.append((4.5, v_title(m["kicker"], m["text"], m.get("sub", ""))))
        elif k == "point":
            sc.append((4.5, v_point(m["n"], m["ic"], m["title"], m["a_txt"])))
        elif k == "framework":
            sc += [(4, v_point(i + 1, ic, a, b)) for i, (ic, a, b) in enumerate(m["items"])]
        elif k in ("cta", "checklist"):
            sc.append((6, v_cta(m["title"], m.get("sub", ""))))
    return sc


def page(scenes, series):
    """scenes: list of (seconds, html). Returns (html, total_seconds)."""
    t, secs = 0.0, []
    for d, h in scenes:
        secs.append(f'<section class="sc" data-a="{t}" data-b="{t + d}">{h}</section>')
        t += d
    T = round(t, 2)
    html = f'''<!doctype html><meta charset="utf8"><style>{BASE}
html,body{{margin:0;background:{NAVY}}}
#v{{position:relative;width:1080px;height:1920px;overflow:hidden;background:{NAVY};font-family:Poppins;color:{WHITE}}}
.sc{{position:absolute;left:96px;right:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;opacity:0}}
.big{{font-weight:600;font-size:116px;line-height:1.04;letter-spacing:-.04em;margin-top:30px}}.dim{{color:{GREY};font-weight:300}}
.sub{{font-weight:300;font-size:46px;line-height:1.3;color:{GREY};margin-top:44px}}
.num{{font-weight:700;font-size:64px;color:#3B8BFF;letter-spacing:.02em}}
.lbl{{font-size:28px}}
#top{{position:absolute;left:96px;right:96px;top:110px;display:flex;justify-content:space-between;align-items:center}}
#bar{{position:absolute;left:96px;right:96px;bottom:130px;height:6px;border-radius:3px;background:rgba(174,186,204,.15)}}#bar i{{display:block;height:100%;border-radius:3px;background:#3B8BFF;width:0}}
</style><div id="v">{glow(300,-500,1400,.28)}{glow(-500,1200,1300,.16,"59,139,255")}
<div id="top"><img src="{LOGO_WHITE}" style="height:28px"><span class="tag" style="font-size:20px;white-space:nowrap">{series}</span></div>{"".join(secs)}<div id="bar"><i></i></div></div>
<script>
const S=[...document.querySelectorAll('.sc')],T={T},e=x=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
window.TOTAL=T;
window.render=t=>{{S.forEach(s=>{{const a=+s.dataset.a,b=+s.dataset.b,i=e((t-a)/.6),o=b>=T?1:1-e((t-b+.45)/.45);s.style.opacity=Math.min(i,o);
s.style.transform=`translateY(${{(1-i)*60-(1-o)*40}}px)`;
[...s.children].forEach((c,k)=>{{const ci=e((t-a-k*.12)/.6);c.style.opacity=ci;c.style.transform=`translateY(${{(1-ci)*30}}px)`}})}});
document.querySelector('#bar i').style.width=(t/T*100)+'%'}};render(0);
</script>'''
    return html, T
