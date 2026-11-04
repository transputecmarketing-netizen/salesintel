"""Builds the presentation and the teacher edition as HTML; render.js prints them to PDF."""
from kit import CSS, BLUE, INK, SUB, MUTE, TINT, NM
from deck import SLIDES, SECS

HEAD = f'''<!doctype html><html><head><meta charset="utf-8"><title>Motion and Force · CBSE Class 9 Physics</title>
<link rel="stylesheet" href="{NM}/katex/dist/katex.min.css"><style>{CSS}
@page{{size:1920px 1080px;margin:0}}
.page{{width:1920px;height:1080px;position:relative;overflow:hidden;page-break-after:always;background:#fff}}
.slide{{page-break-after:auto}}
.te-slide{{position:absolute;left:90px;top:120px;width:1152px;height:648px;overflow:hidden;border-radius:22px;box-shadow:0 0 0 1.5px #E8E8ED}}
.te-slide .slide{{transform:scale(.6);transform-origin:0 0}}
.notes{{position:absolute;left:1302px;right:90px;top:120px;bottom:110px;display:flex;flex-direction:column;gap:30px}}
.notes .k{{font-size:15px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:{BLUE};margin-bottom:8px}}
.notes .t{{font-size:21px;line-height:1.55;color:{INK}}}
.notes .w .k{{color:#B25000}}
</style>
<script defer src="{NM}/katex/dist/katex.min.js"></script><script defer src="{NM}/katex/dist/contrib/auto-render.min.js"></script>
<script>document.addEventListener("DOMContentLoaded",()=>{{renderMathInElement(document.body,{{delimiters:[{{left:"\\\\[",right:"\\\\]",display:true}},{{left:"\\\\(",right:"\\\\)",display:false}}],throwOnError:true}});window.__done=true;}});</script></head><body>'''

N = len(SLIDES)

def slide_html(i, x):
    top = "" if i == 0 else f'<div class="top"><span class="sec"><b>{x["sec"]}</b>{x["name"]}</span><span class="pill">{x["mins"]}</span></div>'
    foot = f'<div class="foot"><span>CBSE Class 9 · Physics · Motion and force</span><span>{i+1:02d} / {N}</span></div>'
    return f'<div class="slide">{top}{x["body"]}{foot}</div>'

def presentation():
    return HEAD + "".join(f'<section class="page">{slide_html(i, x)}</section>' for i, x in enumerate(SLIDES)) + "</body></html>"

def te_cover():
    rows = "".join(f'<tr><td style="color:{BLUE};font-weight:600;width:80px;text-align:left">{n}</td><td style="text-align:left">{nm}</td><td style="text-align:right;color:{SUB}">{m} min</td></tr>' for n, nm, m in SECS)
    return f'''<section class="page"><div class="slide">
    <div class="grid2" style="height:100%;align-items:center;gap:110px"><div><div class="ey">Teacher edition</div><h1 style="margin-top:22px">Motion and force.<br>A 60-minute lesson.</h1>
    <p class="lead" style="margin-top:28px">CBSE Class 9 Physics. Each page shows one slide beside what to say, what to ask, and the misconception to watch for.</p>
    <div class="card" style="margin-top:40px"><div class="ey" style="font-size:16px">Before the lesson</div><p class="s" style="margin-top:10px;color:{INK}">Have a book, a coin, a playing card and a glass ready for quick demonstrations. Write the three SI units, m, kg and s, in a corner of the board.</p></div>
    <p class="s" style="margin-top:28px">Syllabus: aligned to CBSE Class 9 Science 2026–27, NCERT <i>Exploration</i> chapters “Describing Motion Around Us” and “How Forces Affect Motion”. Physical quantities, SI units and scalars and vectors are taught as foundations.</p></div>
    <div><table class="v">{rows}<tr><td></td><td style="text-align:left;font-weight:600">Total</td><td style="text-align:right;font-weight:600">60 min</td></tr></table>
    <p class="s" style="margin-top:22px">Practice questions 3 to 8 and the answer key are set as homework.</p></div></div>
    <div class="foot"><span>Teacher edition</span><span>CBSE Class 9 · Physics</span></div></div></section>'''

def teacher():
    out = [te_cover()]
    for i, x in enumerate(SLIDES):
        blocks = [("Say", x["say"], "")]
        if x["ask"]: blocks.append(("Ask", x["ask"], ""))
        if x["watch"]: blocks.append(("Misconception to address", x["watch"], "w"))
        nb = "".join(f'<div class="{c}"><div class="k">{k}</div><div class="t">{t}</div></div>' for k, t, c in blocks)
        tm = f'{x["time"]}' if x["time"] else ""
        out.append(f'''<section class="page"><div class="top"><span class="sec"><b>{x["sec"]}</b>{x["name"]}</span><span class="pill">{x["mins"]}{" · " + tm if tm and "min" in tm else ""}</span></div>
        <div class="te-slide">{slide_html(i, x)}</div><div class="notes">{nb}</div>
        <div class="foot"><span>Teacher edition · slide {i+1:02d} of {N}</span><span>CBSE Class 9 · Physics</span></div></section>''')
    return HEAD + "".join(out) + "</body></html>"

open("presentation.html", "w", encoding="utf8").write(presentation())
open("teacher.html", "w", encoding="utf8").write(teacher())
print(N, "slides")
