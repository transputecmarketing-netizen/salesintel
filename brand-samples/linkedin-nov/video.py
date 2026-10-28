from kit import *
scenes = [  # (start, end, html)
 (0, 4.5, f'<div class="lbl">FinOps, explained</div><div class="big">FinOps is<br><span class="dim">not a tool.</span></div>'),
 (4.5, 8.5, f'<div class="big">It is a<br><span class="b">discipline.</span></div><div class="sub">A way of running cloud spend, practised every day.</div>'),
]
pill = [("eye", "Visibility", "See where every pound goes."), ("owner", "Accountability", "Every cost has a named owner."),
        ("sliders", "Optimisation", "Spend with intent, not by default."), ("loop", "Continuous review", "Check, adjust, repeat.")]
for i, (ic, t, d) in enumerate(pill):
    scenes.append((8.5 + i * 4, 12.5 + i * 4, f'<div class="num">0{i+1}</div><div style="margin:40px 0 56px">{icon_tile(ic, 200)}</div><div class="big" style="font-size:104px">{t}</div><div class="sub">{d}</div>'))
cyc = "".join(f'<div class="cy" style="left:{x}px;top:{y}px">{icon_tile(ic,150)}<div>{t}</div></div>' for (ic, t, _), (x, y) in zip(pill, [(300, 0), (600, 300), (300, 600), (0, 300)]))
scenes += [
 (24.5, 30, f'<div class="lbl">Four parts, one cycle</div><div style="position:relative;width:900px;height:900px;margin:60px 0 50px"><svg width="900" height="900" style="position:absolute;left:0;top:0"><circle cx="450" cy="450" r="300" fill="none" stroke="{BLUE}" stroke-width="3" stroke-dasharray="6 14" opacity=".7"/></svg>{cyc}</div><div class="big" style="font-size:92px">Not a project.<br><span class="b">A habit.</span></div>'),
 (30, 36, f'<div class="lbl">Next step</div><div class="big" style="font-size:96px">Want to see where<br>your cloud cost <span class="b">hides</span>?</div><div class="sub">Talk to Transputec about a FinOps review.</div><div class="pill" style="margin-top:70px;align-self:flex-start;font-size:34px;padding:24px 40px;background:{BLUE};border-color:{BLUE}">transputec.com</div>'),
]
sc = "".join(f'<section class="sc" data-a="{a}" data-b="{b}">{h}</section>' for a, b, h in scenes)
html = f'''<!doctype html><meta charset="utf8"><style>{BASE}
html,body{{margin:0;background:{NAVY}}}
#v{{position:relative;width:1080px;height:1920px;overflow:hidden;background:{NAVY};font-family:Poppins;color:{WHITE}}}
.sc{{position:absolute;left:96px;right:96px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center;opacity:0}}
.big{{font-weight:600;font-size:124px;line-height:1.04;letter-spacing:-.04em;margin-top:30px}}.dim{{color:{GREY};font-weight:300}}
.sub{{font-weight:300;font-size:46px;line-height:1.3;color:{GREY};margin-top:44px}}
.num{{font-weight:700;font-size:64px;color:{BRIGHT};letter-spacing:.02em}}
.lbl{{font-size:28px}}
.cy{{position:absolute;width:300px;display:flex;flex-direction:column;align-items:center;gap:20px;font-weight:500;font-size:32px;text-align:center}}
.cy .tile,.cy>div:first-child{{margin:0 auto}}
#top{{position:absolute;left:96px;right:96px;top:110px;display:flex;justify-content:space-between;align-items:center}}
#bar{{position:absolute;left:96px;right:96px;bottom:130px;height:6px;border-radius:3px;background:rgba(174,186,204,.15)}}#bar i{{display:block;height:100%;border-radius:3px;background:{BRIGHT};width:0}}
</style><div id="v">{glow(300,-500,1400,.28)}{glow(-500,1200,1300,.16,"59,139,255")}
<div id="top"><img src="../assets/logo-white.svg" style="height:34px"><span class="tag" style="font-size:22px">AWS · FinOps · Week 3</span></div>{sc}<div id="bar"><i></i></div></div>
<script>
const S=[...document.querySelectorAll('.sc')],T=36,e=x=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
window.render=t=>{{S.forEach(s=>{{const a=+s.dataset.a,b=+s.dataset.b,i=e((t-a)/.6),o=b>=T?1:1-e((t-b+.45)/.45);s.style.opacity=Math.min(i,o);
s.style.transform=`translateY(${{(1-i)*60-(1-o)*40}}px)`;
[...s.children].forEach((c,k)=>{{const ci=e((t-a-k*.12)/.6);c.style.opacity=ci;c.style.transform=`translateY(${{(1-ci)*30}}px)`}})}});
document.querySelector('#bar i').style.width=(t/T*100)+'%'}};render(0);
</script>'''
open("w3_video.html", "w", encoding="utf8").write(html)
