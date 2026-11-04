"""Design system and illustration kit for the CBSE Class 9 Physics deck.

One accent (blue), one ink, generous whitespace. Illustrations are line drawings:
2.5px ink strokes, round caps, blue reserved for the quantity being taught
(a vector, a highlighted path, the answer).
"""
import math

INK, SUB, MUTE, LINE, BG, BLUE, TINT, AMBER = "#1D1D1F", "#6E6E73", "#86868B", "#D2D2D7", "#FFFFFF", "#0071E3", "#EEF5FF", "#B25000"
NM = "node_modules"

CSS = f"""
@font-face{{font-family:Inter;font-weight:400;src:url({NM}/@fontsource/inter/files/inter-latin-400-normal.woff2)}}
@font-face{{font-family:Inter;font-weight:500;src:url({NM}/@fontsource/inter/files/inter-latin-500-normal.woff2)}}
@font-face{{font-family:Inter;font-weight:600;src:url({NM}/@fontsource/inter/files/inter-latin-600-normal.woff2)}}
@font-face{{font-family:Inter;font-weight:700;src:url({NM}/@fontsource/inter/files/inter-latin-700-normal.woff2)}}
*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Inter,system-ui,sans-serif;color:{INK};background:#fff;-webkit-font-smoothing:antialiased}}
.slide{{width:1920px;height:1080px;position:relative;overflow:hidden;background:{BG};page-break-after:always;padding:150px 150px 120px}}
.top{{position:absolute;left:150px;right:150px;top:64px;display:flex;justify-content:space-between;align-items:center;font-size:20px;font-weight:500;color:{MUTE};letter-spacing:.02em}}
.top .sec b{{color:{BLUE};font-weight:600;margin-right:14px}}
.pill{{border:1.5px solid {LINE};border-radius:99px;padding:8px 18px;font-size:18px;color:{SUB}}}
.foot{{position:absolute;left:150px;right:150px;bottom:52px;display:flex;justify-content:space-between;font-size:17px;color:{MUTE}}}
h1{{font-size:76px;font-weight:600;letter-spacing:-.025em;line-height:1.06}}
h2{{font-size:56px;font-weight:600;letter-spacing:-.022em;line-height:1.1}}
h3{{font-size:30px;font-weight:600;letter-spacing:-.01em;line-height:1.25}}
.lead{{font-size:32px;line-height:1.45;color:{SUB};font-weight:400;max-width:1250px}}
.p{{font-size:27px;line-height:1.5;color:{INK}}}
.s{{font-size:22px;line-height:1.5;color:{SUB}}}
.ey{{font-size:20px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:{BLUE}}}
.b{{color:{BLUE}}}
.def{{border-left:5px solid {BLUE};padding:6px 0 6px 30px;font-size:31px;line-height:1.45}}
.def .k{{display:block;font-size:17px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:{BLUE};margin-bottom:8px}}
.card{{background:#F5F5F7;border-radius:28px;padding:36px 40px}}
.ask{{background:{TINT};border-radius:28px;padding:30px 38px;display:flex;gap:26px;align-items:flex-start}}
.ask .q{{font-size:28px;line-height:1.45;font-weight:500}}
.ask .k{{font-size:17px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:{BLUE};margin-bottom:6px}}
.eq{{font-size:46px;text-align:center;padding:10px 0}}
.eq .katex{{font-size:1em}}
.p .katex,.s .katex,.def .katex,.ask .katex,td .katex{{font-size:1.08em}}
table.v{{border-collapse:collapse;width:100%}}
table.v td,table.v th{{padding:15px 18px;border-top:1.5px solid #E8E8ED;font-size:24px;text-align:left;vertical-align:middle}}
table.v th{{font-size:16px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:{MUTE};border-top:none;padding-bottom:10px}}
table.v td:first-child{{font-weight:600;width:110px;text-align:center}}
.work{{display:grid;grid-template-columns:170px 1fr;row-gap:16px;column-gap:24px;font-size:26px;line-height:1.45;align-items:baseline}}
.work .l{{font-size:16px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:{MUTE};padding-top:6px}}
.work .ans{{color:{BLUE};font-weight:600}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:70px}}
.row{{display:flex;gap:60px;align-items:center}}
.tag{{display:inline-block;font-size:16px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;padding:6px 14px;border-radius:99px;background:{TINT};color:{BLUE}}}
.warn{{background:#FFF6EC;border-radius:24px;padding:24px 32px;font-size:24px;line-height:1.45}}
.warn b{{color:{AMBER}}}
svg text{{font-family:Inter,sans-serif}}
"""

# ---------------------------------------------------------------- svg primitives
def svg(w, h, body, style=""):
    return f'<svg width="{w}" height="{h}" viewBox="0 0 {w} {h}" style="{style}" xmlns="http://www.w3.org/2000/svg"><defs>{MARK}</defs>{body}</svg>'

MARK = (f'<marker id="ab" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1.5 L10.5 6 L1 10.5 Z" fill="{BLUE}"/></marker>'
        f'<marker id="ai" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1.5 L10.5 6 L1 10.5 Z" fill="{INK}"/></marker>'
        f'<marker id="aa" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M1 1.5 L10.5 6 L1 10.5 Z" fill="{AMBER}"/></marker>')

def ln(x1, y1, x2, y2, c=INK, w=2.5, dash="", cap="round"):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" stroke-linecap="{cap}"{d}/>'

def arrow(x1, y1, x2, y2, c=BLUE, w=4, both=False):
    m = {"#0071E3": "ab", INK: "ai", AMBER: "aa"}.get(c, "ab")
    s = f' marker-start="url(#{m})"' if both else ""
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width="{w}" stroke-linecap="round" marker-end="url(#{m})"{s}/>'

def tx(x, y, t, size=22, c=INK, w=500, anchor="middle", italic=False):
    st = ' font-style="italic"' if italic else ""
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{c}" font-weight="{w}" text-anchor="{anchor}"{st}>{t}</text>'

def circle(cx, cy, r, c=INK, w=2.5, fill="none"):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" stroke="{c}" stroke-width="{w}" fill="{fill}"/>'

def path(d, c=INK, w=2.5, fill="none", dash=""):
    dd = f' stroke-dasharray="{dash}"' if dash else ""
    return f'<path d="{d}" stroke="{c}" stroke-width="{w}" fill="{fill}" stroke-linecap="round" stroke-linejoin="round"{dd}/>'

def ground(x1, x2, y, c=LINE):
    return ln(x1, y, x2, y, c, 2.5)

# ---------------------------------------------------------------- objects (side views, ground contact at y)
def car(x, y, s=1.0, c=INK, hi=False):
    """A compact hatchback facing right; x is the rear, y the ground line. About 240*s wide."""
    k = lambda v: v * s
    body = (f"M{x+k(14)} {y-k(26)} Q{x+k(8)} {y-k(58)} {x+k(30)} {y-k(62)} L{x+k(70)} {y-k(66)} L{x+k(98)} {y-k(104)} Q{x+k(106)} {y-k(112)} {x+k(120)} {y-k(112)} "
            f"L{x+k(168)} {y-k(112)} Q{x+k(180)} {y-k(112)} {x+k(190)} {y-k(100)} L{x+k(212)} {y-k(70)} L{x+k(228)} {y-k(64)} Q{x+k(240)} {y-k(58)} {x+k(238)} {y-k(40)} L{x+k(234)} {y-k(26)}")
    win = (f"M{x+k(86)} {y-k(70)} L{x+k(106)} {y-k(100)} Q{x+k(110)} {y-k(104)} {x+k(118)} {y-k(104)} L{x+k(146)} {y-k(104)} L{x+k(146)} {y-k(70)} Z "
           f"M{x+k(156)} {y-k(70)} L{x+k(156)} {y-k(104)} L{x+k(166)} {y-k(104)} Q{x+k(174)} {y-k(104)} {x+k(180)} {y-k(96)} L{x+k(198)} {y-k(70)} Z")
    col = BLUE if hi else c
    out = path(body, col, 3) + path(win, col, 2.2)
    out += ln(x + k(14), y - k(26), x + k(38), y - k(26), col, 3) + ln(x + k(86), y - k(26), x + k(170), y - k(26), col, 3) + ln(x + k(218), y - k(26), x + k(234), y - k(26), col, 3)
    for wx in (62, 194):
        out += circle(x + k(wx), y - k(24), k(23), col, 3) + circle(x + k(wx), y - k(24), k(8), col, 2.2)
    out += path(f"M{x+k(222)} {y-k(52)} l{k(10)} 0", col, 3)  # headlamp
    return out

def bicycle(x, y, s=1.0, c=INK, hi=False):
    """A bicycle facing right; x is the back wheel's left edge, y the ground. About 220*s wide."""
    k = lambda v: v * s
    col = BLUE if hi else c
    r = k(46)
    bx, fx, wy = x + r, x + k(220) - r, y - r
    crank = (bx + k(62), wy)
    seat = (bx + k(48), wy - k(70))
    head = (fx - k(30), wy - k(64))
    out = circle(bx, wy, r, col, 3) + circle(fx, wy, r, col, 3) + circle(bx, wy, k(4), col, 2) + circle(fx, wy, k(4), col, 2)
    out += path(f"M{bx} {wy} L{crank[0]} {crank[1]} L{seat[0]} {seat[1]} Z", col, 3)
    out += path(f"M{seat[0]} {seat[1]} L{head[0]} {head[1]} L{crank[0]} {crank[1]}", col, 3)
    out += path(f"M{head[0]} {head[1]} L{fx} {wy}", col, 3)
    out += path(f"M{seat[0]-k(14)} {seat[1]-k(10)} L{seat[0]+k(16)} {seat[1]-k(10)} M{seat[0]} {seat[1]} L{seat[0]} {seat[1]-k(10)}", col, 3)
    out += path(f"M{head[0]} {head[1]} L{head[0]-k(4)} {head[1]-k(18)} L{head[0]+k(18)} {head[1]-k(22)}", col, 3)
    out += circle(crank[0], crank[1], k(10), col, 2.2)
    return out

def ball(cx, cy, r=30, c=INK, hi=False):
    col = BLUE if hi else c
    return circle(cx, cy, r, col, 3) + path(f"M{cx-r*.62} {cy-r*.78} Q{cx-r*.05} {cy} {cx-r*.62} {cy+r*.78} M{cx+r*.62} {cy-r*.78} Q{cx+r*.05} {cy} {cx+r*.62} {cy+r*.78}", col, 2)

def person(x, y, s=1.0, c=INK, lean=0):
    """A simple standing figure, feet at (x, y). lean in degrees tilts the upper body forward (+) from the hips."""
    k = lambda v: v * s
    hip = (x, y - k(78))
    a = math.radians(lean)
    sh = (hip[0] + math.sin(a) * k(62), hip[1] - math.cos(a) * k(62))
    hd = (hip[0] + math.sin(a) * k(88), hip[1] - math.cos(a) * k(88))
    out = circle(hd[0], hd[1], k(15), c, 3)
    out += path(f"M{hip[0]} {hip[1]} L{sh[0]} {sh[1]}", c, 3)
    out += path(f"M{hip[0]} {hip[1]} L{x-k(16)} {y} M{hip[0]} {hip[1]} L{x+k(16)} {y}", c, 3)
    out += path(f"M{sh[0]-math.sin(a)*k(8)} {sh[1]+k(8)} L{sh[0]+k(22)} {sh[1]+k(44)}", c, 3)
    return out

def block(x, y, w, h, c=INK, label="", lc=INK, r=10):
    out = f'<rect x="{x}" y="{y-h}" width="{w}" height="{h}" rx="{r}" stroke="{c}" stroke-width="3" fill="#fff"/>'
    if label:
        out += tx(x + w / 2, y - h / 2 + 9, label, 26, lc, 600)
    return out

def rocket_icon(cx, y, s=1.0, c=INK):
    k = lambda v: v * s
    return (path(f"M{cx-k(16)} {y-k(20)} L{cx-k(16)} {y-k(88)} Q{cx} {y-k(126)} {cx+k(16)} {y-k(88)} L{cx+k(16)} {y-k(20)} Z", c, 3)
            + path(f"M{cx-k(16)} {y-k(40)} L{cx-k(30)} {y-k(18)} L{cx-k(16)} {y-k(22)} M{cx+k(16)} {y-k(40)} L{cx+k(30)} {y-k(18)} L{cx+k(16)} {y-k(22)}", c, 3)
            + circle(cx, y - k(72), k(6), c, 2.2))

def axes(x0, y0, w, h, xl, yl, c=INK):
    out = arrow(x0, y0, x0 + w, y0, INK, 2.5) + arrow(x0, y0, x0, y0 - h, INK, 2.5)
    out += tx(x0 + w, y0 + 40, xl, 22, SUB, 500, "end") + tx(x0 - 14, y0 - h + 6, yl, 22, SUB, 500, "end")
    return out

def hl(name, w, extra=""):
    return f'<img src="assets/{name}.png" style="width:{w}px;display:block;{extra}">'

def K(s):
    """Inline maths: KaTeX auto-render picks up \\( ... \\)."""
    return "\\(" + s + "\\)"

def E(s):
    return '<div class="eq">\\[' + s + '\\]</div>'
