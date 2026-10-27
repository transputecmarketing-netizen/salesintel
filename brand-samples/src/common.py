"""Shared Transputec design system for the sample report and playbook.

Tokens come from transputec.com (Poppins, #0F172B navy, #00B8DB -> #155DFC
gradient, #2C72DB logo blue) and the saved Transputec brand tokens.
"""

FONTS = """
@font-face{font-family:Poppins;font-weight:300;src:url(../assets/fonts/poppins-300.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:400;src:url(../assets/fonts/poppins-400.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:500;src:url(../assets/fonts/poppins-500.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:500;font-style:italic;src:url(../assets/fonts/poppins-500i.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:600;src:url(../assets/fonts/poppins-600.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:700;src:url(../assets/fonts/poppins-700.woff2) format('woff2')}
@font-face{font-family:Poppins;font-weight:800;src:url(../assets/fonts/poppins-800.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:400;src:url(../assets/fonts/jbm-400.woff2) format('woff2')}
@font-face{font-family:'JetBrains Mono';font-weight:500;src:url(../assets/fonts/jbm-500.woff2) format('woff2')}
"""

TOKENS = """
:root{
  --navy:#0F172B; --ink:#001020; --navy2:#16213D;
  --blue:#2C72DB; --royal:#155DFC; --cyan:#00B8DB; --sky:#009AF0;
  --slate:#CAD5E2; --mist:#F4F6FA; --line:#E3E8F0; --mid:#6B7A90; --body:#3A4559;
  --green:#34C759; --amber:#F5A623; --red:#E5484D;
  --grad:linear-gradient(90deg,#00B8DB 0%,#155DFC 100%);
  --grad-d:linear-gradient(135deg,#00B8DB 0%,#155DFC 100%);
}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Poppins,'Helvetica Neue',Arial,sans-serif;color:var(--navy);background:#fff;
  -webkit-font-smoothing:antialiased;font-feature-settings:'kern','liga'}
.pg{position:relative;overflow:hidden;page-break-after:always;break-after:page}
.pg:last-child{page-break-after:auto;break-after:auto}
.dark{background:var(--navy);color:#fff}
.mono{font-family:'JetBrains Mono',monospace}
.eyebrow{font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.18em;text-transform:uppercase;color:var(--blue);font-weight:500}
.dark .eyebrow{color:var(--cyan)}
.gt{background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent}
sup.c{font-family:'JetBrains Mono',monospace;font-size:.62em;color:var(--blue);font-weight:500;margin-left:.12em;vertical-align:super;line-height:0}
.dark sup.c{color:var(--cyan)}
.hair{height:0;border-top:.25mm solid var(--line)}
.dark .hair{border-color:rgba(255,255,255,.14)}
.card{background:var(--mist);border-radius:4mm;padding:6mm}
.dark .card{background:rgba(255,255,255,.055);border:.25mm solid rgba(255,255,255,.1)}
.tag{display:inline-block;font-family:'JetBrains Mono',monospace;font-size:6.4pt;letter-spacing:.14em;text-transform:uppercase;
  padding:1.2mm 2.6mm;border-radius:10mm;border:.25mm solid currentColor;font-weight:500;white-space:nowrap}
"""

DEFS = """
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient>
  <linearGradient id="gv" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#155DFC"/><stop offset="1" stop-color="#00B8DB"/></linearGradient>
  <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#00B8DB"/><stop offset="1" stop-color="#155DFC"/></linearGradient>
</defs></svg>
"""


def logo(color="blue", h="5mm"):
    return f'<img src="../assets/logo-{color}.svg" style="height:{h};display:block" alt="Transputec">'


def rings(size=170, cx=None, cy=None, gap=True, n=7, opacity=.16):
    """Concentric-ring motif with one broken, glowing ring: the 'gap'."""
    cx = cx if cx is not None else size / 2
    cy = cy if cy is not None else size / 2
    out = [f'<svg width="{size}mm" height="{size}mm" viewBox="0 0 {size} {size}" style="display:block">']
    for i in range(n):
        r = size * (0.12 + i * 0.065)
        out.append(f'<circle cx="{cx}" cy="{cy}" r="{r:.2f}" fill="none" stroke="#fff" stroke-opacity="{opacity - i*0.012:.3f}" stroke-width=".25"/>')
    r = size * 0.38
    circ = 2 * 3.14159 * r
    dash = f'{circ*0.78:.1f} {circ*0.22:.1f}' if gap else 'none'
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r:.2f}" fill="none" stroke="url(#gd)" stroke-width="1.6" stroke-linecap="round" stroke-dasharray="{dash}" transform="rotate(-70 {cx} {cy})"/>')
    out.append(f'<circle cx="{cx + r*0.9:.1f}" cy="{cy - r*0.42:.1f}" r="1.4" fill="#00B8DB"/>')
    out.append('</svg>')
    return ''.join(out)


# ---- gradient text as real SVG text: background-clip:text rasterises as a solid
# block in some PDF viewers (poppler/cairo), so we draw the gradient natively.
import html as _html
from functools import lru_cache
from fontTools.ttLib import TTFont as _TT

_FONT = {}


def _adv(weight):
    if weight not in _FONT:
        f = _TT(f"../assets/fonts/poppins-{weight}.woff2")
        _FONT[weight] = (f.getBestCmap(), f["hmtx"].metrics)
    return _FONT[weight]


def gt(parts, pt, weight=700, ls=-0.045, grad="gh"):
    """Gradient headline. parts: str or [(str, scale)]."""
    if isinstance(parts, str):
        parts = [(parts, 1.0)]
    cmap, hm = _adv(weight)
    size = pt * 0.3528  # mm
    x = 0.0
    spans = []
    for text, sc in parts:
        text = _html.unescape(text)
        w = 0.0
        for ch in text:
            w += hm[cmap.get(ord(ch), "space")][0] / 1000 * size * sc + ls * size * sc
        spans.append((_html.escape(text), sc, w))
        x += w
    W, H = x + size * 0.04, size * 0.80
    inner = ''.join(
        f'<tspan font-size="{size*sc:.3f}" letter-spacing="{ls*size*sc:.3f}">{t}</tspan>' for t, sc, _ in spans)
    return (f'<svg width="{W:.2f}mm" height="{H:.2f}mm" viewBox="0 0 {W:.2f} {H:.2f}" style="display:block;overflow:visible">'
            f'<text x="0" y="{size*0.735:.3f}" font-family="Poppins" font-weight="{weight}" fill="url(#{grad})">{inner}</text></svg>')


# ------------------------------------------------------------------ creative primitives
_uid = [0]


def _id(p):
    _uid[0] += 1
    return f"{p}{_uid[0]}"


def dots(cols, rows, lit, pitch=12.0, d=7.0, order="col", unlit="rgba(255,255,255,.10)",
         c1="#00B8DB", c2="#155DFC", halo=True, lit_ids=None, dim=None):
    """Dot-matrix unit chart. `lit` dots are filled with a sweeping brand gradient.
    order 'col' fills bottom-up, column by column; 'row' fills left-to-right, top-down.
    dim: optional set of indices drawn mid-tone (e.g. a second series)."""
    W, H = cols * pitch, rows * pitch
    gid = _id("dg")
    out = [f'<svg width="{W:.1f}mm" height="{H:.1f}mm" viewBox="0 0 {W:.1f} {H:.1f}" style="display:block;overflow:visible">',
           f'<defs><linearGradient id="{gid}" gradientUnits="userSpaceOnUse" x1="0" y1="{H:.1f}" x2="{W:.1f}" y2="0">'
           f'<stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>']
    n = 0
    last = None
    for r in range(rows):
        for c in range(cols):
            idx = c * rows + (rows - 1 - r) if order == "col" else r * cols + c
            is_lit = (idx in lit_ids) if lit_ids is not None else idx < lit
            cx, cy = c * pitch + pitch / 2, r * pitch + pitch / 2
            if is_lit:
                out.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{d/2:.2f}" fill="url(#{gid})"/>')
                if lit_ids is None and idx == lit - 1:
                    last = (cx, cy)
            elif dim and idx in dim:
                out.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{d/2:.2f}" fill="{c2}" fill-opacity=".35"/>')
            else:
                out.append(f'<circle cx="{cx:.2f}" cy="{cy:.2f}" r="{d/2:.2f}" fill="{unlit}"/>')
    if halo and last:
        out.append(f'<circle cx="{last[0]:.2f}" cy="{last[1]:.2f}" r="{d*0.78:.2f}" fill="none" stroke="{c1}" stroke-width=".35" stroke-opacity=".9"/>')
    out.append('</svg>')
    return ''.join(out)


def gt_slice(text, pt, weight=600, ls=-0.055, cut=0.30, shift=1.8, gap=1.1):
    """Headline with a literal gap sliced through it: top half nudged right, band removed."""
    cmap, hm = _adv(weight)
    size = pt * 0.3528
    t = _html.unescape(text)
    w = sum(hm[cmap.get(ord(ch), "space")][0] / 1000 * size + ls * size for ch in t)
    W, H = w + shift + size * 0.1, size * 1.12
    base = size * 0.80
    cy = base - size * cut          # slice centre line
    a, b = _id("sa"), _id("sb")
    esc = _html.escape(t)
    tx = (f'font-family="Poppins" font-weight="{weight}" font-size="{size:.3f}" letter-spacing="{ls*size:.3f}" fill="url(#gh)"')
    return (f'<svg width="{W:.2f}mm" height="{H:.2f}mm" viewBox="0 0 {W:.2f} {H:.2f}" style="display:block;overflow:visible">'
            f'<defs><clipPath id="{a}"><rect x="-5" y="-5" width="{W+10:.2f}" height="{cy-gap/2+5:.2f}"/></clipPath>'
            f'<clipPath id="{b}"><rect x="-5" y="{cy+gap/2:.2f}" width="{W+10:.2f}" height="{H:.2f}"/></clipPath></defs>'
            f'<text x="{shift:.2f}" y="{base:.2f}" {tx} clip-path="url(#{a})">{esc}</text>'
            f'<text x="0" y="{base:.2f}" {tx} clip-path="url(#{b})">{esc}</text></svg>')


def ghost(txt, size_mm=44, stroke="#E3E8F0", sw=.35, weight=700):
    cmap, hm = _adv(weight)
    w = sum(hm[cmap.get(ord(ch), "space")][0] / 1000 * size_mm for ch in txt)
    return (f'<svg width="{w:.1f}mm" height="{size_mm*0.8:.1f}mm" viewBox="0 0 {w:.1f} {size_mm*0.8:.1f}" style="display:block;overflow:visible">'
            f'<text x="0" y="{size_mm*0.74:.1f}" font-family="Poppins" font-weight="{weight}" font-size="{size_mm}" fill="none" stroke="{stroke}" stroke-width="{sw}">{txt}</text></svg>')


def avatar(size="11mm"):
    """Transputec mark as a profile picture."""
    return (f'<div style="width:{size};height:{size};border-radius:50%;padding:.5mm;background:var(--grad-d);flex:none">'
            f'<img src="../assets/mark.png" style="width:100%;height:100%;border-radius:50%;display:block;border:.5mm solid #fff;object-fit:cover" alt="Transputec"></div>')


BADGES = {
    "iso": ("accreditations-badge-1.png", "LRQA ISO 9001 · ISO 27001 · ISO 14001 · Cyber Essentials Plus · Offensive Security OSCP"),
    "msmw": ("ms-modern-workplace.png", "Microsoft Solutions Partner · Modern Work"),
    "mssec": ("ms-security.png", "Microsoft Solutions Partner · Security"),
    "aws": ("aws-advanced-tier-services.png", "AWS Advanced Tier Services Partner"),
    "cisco": ("cisco-p.png", "Cisco Select Integrator"),
    "dell": ("dell-gold.png", "Dell Technologies Gold Partner"),
    "lenovo": ("lenovo360gold.png", "Lenovo 360 Gold Partner"),
    "mimecast": ("mimecast.png", "Mimecast Premier Partner"),
    "cloudtango": ("cloudtango-badge1.svg", "CloudTango"),
}


def badge_wall(keys, cols, w="auto", h="22mm", gap="3mm", span=None):
    span = span or {}
    tiles = []
    for k in keys:
        f, alt = BADGES[k]
        s = span.get(k, 1)
        tiles.append(f'<div style="grid-column:span {s};background:#fff;border-radius:3mm;height:{h};display:flex;align-items:center;justify-content:center;padding:2.4mm 3mm">'
                     f'<img src="../assets/badges/{f}" alt="{alt}" style="max-width:100%;max-height:100%;object-fit:contain;display:block"></div>')
    return f'<div style="display:grid;grid-template-columns:repeat({cols},1fr);gap:{gap}">{"".join(tiles)}</div>'


def gov_tile(h="22mm", span=1):
    """G-Cloud / TePAS supplier marks (white-on-transparent artwork) on a brand-navy tile."""
    return (f'<div style="grid-column:span {span};background:#16213D;border:.25mm solid rgba(255,255,255,.12);border-radius:3mm;height:{h};'
            f'display:flex;align-items:center;justify-content:center;padding:2.4mm 3mm"><img src="../assets/badges/government-commercial-agency-supplier-white.svg" '
            f'alt="Government Commercial Agency supplier" style="max-width:100%;max-height:100%;display:block"></div>')
