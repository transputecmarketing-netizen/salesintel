"""Transputec LinkedIn November 2026 design kit (1080 x 1350)."""
NAVY, CARD, BLUE, BRIGHT, GREY, WHITE = "#0A0F1A", "#111A2B", "#2C72DB", "#3B8BFF", "#AEBACC", "#F4F7FB"
FONTS = "".join(f"@font-face{{font-family:Poppins;font-weight:{w};src:url(../assets/fonts/poppins-{w}.woff2)}}" for w in (300, 400, 500, 600, 700))
BASE = FONTS + f"""
*{{margin:0;padding:0;box-sizing:border-box}}
body{{background:#000;font-family:Poppins,sans-serif;color:{WHITE};-webkit-font-smoothing:antialiased}}
.s{{position:relative;width:1080px;height:1350px;overflow:hidden;background:{NAVY}}}
.glow{{position:absolute;border-radius:50%;pointer-events:none}}
.hd{{position:absolute;left:88px;right:88px;top:80px;display:flex;justify-content:space-between;align-items:center}}
.hd img{{height:28px}}
.tag{{font-weight:500;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:{GREY}}}
.ft{{position:absolute;left:88px;right:88px;bottom:76px;display:flex;justify-content:space-between;align-items:center;font-weight:400;font-size:20px;color:{GREY};letter-spacing:.02em}}
.ft b{{color:{WHITE};font-weight:500}}
.h1{{font-weight:600;font-size:84px;line-height:1.02;letter-spacing:-.04em}}
.h2{{font-weight:600;font-size:62px;line-height:1.06;letter-spacing:-.035em}}
.lede{{font-weight:300;font-size:34px;line-height:1.42;color:{GREY};letter-spacing:-.005em}}
.body{{font-weight:300;font-size:30px;line-height:1.45;color:{GREY}}}
.lbl{{font-weight:600;font-size:17px;letter-spacing:.2em;text-transform:uppercase;color:{BRIGHT}}}
.b{{color:{BRIGHT}}}
.rule{{height:2px;background:linear-gradient(90deg,{BLUE},rgba(59,139,255,0))}}
.card{{background:{CARD};border:1.5px solid rgba(174,186,204,.14);border-radius:28px}}
.pill{{display:inline-flex;align-items:center;gap:14px;padding:16px 28px;border-radius:999px;border:1.5px solid rgba(174,186,204,.3);font-weight:500;font-size:22px;color:{WHITE}}}
"""

def glow(x, y, size, a=.22, col="44,114,219"):
    return f'<div class="glow" style="left:{x}px;top:{y}px;width:{size}px;height:{size}px;background:radial-gradient(circle,rgba({col},{a}) 0%,rgba({col},0) 65%)"></div>'

def header(series):
    return f'<div class="hd"><img src="../assets/logo-white.svg"><span class="tag">{series}</span></div>'

def footer(idx=None, total=None, swipe=False):
    right = (f'<span><b>{idx:02d}</b> / {total:02d}</span>' if idx else '')
    if swipe:
        right = f'<span class="pill" style="padding:12px 24px;font-size:20px">Swipe {arrow(22)}</span>'
    return f'<div class="ft"><span>transputec.com</span>{right}</div>'

def arrow(s=24, col=WHITE):
    return f'<svg width="{s}" height="{s}" viewBox="0 0 24 24"><path d="M4 12h15M13 6l6 6-6 6" fill="none" stroke="{col}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def slide(inner, series, idx=None, total=None, swipe=False, bg=""):
    return f'<div class="s">{bg or glow(560, -320, 900)}{header(series)}{inner}{footer(idx, total, swipe)}</div>'

# ---------------------------------------------------------------- line icons (64 x 64 grid)
def icon(name, size=120, col=BRIGHT, sw=2.6):
    P = {
        "compass": '<circle cx="32" cy="32" r="24"/><path d="M40 24l-5 11-11 5 5-11z"/><circle cx="32" cy="32" r="2" fill="C"/>',
        "loop": '<path d="M48 26a17 17 0 0 0-31-6M16 38a17 17 0 0 0 31 6"/><path d="M14 13v8h8M50 51v-8h-8"/>',
        "server": '<rect x="12" y="12" width="40" height="14" rx="3"/><rect x="12" y="32" width="40" height="14" rx="3"/><circle cx="20" cy="19" r="1.6" fill="C"/><circle cx="20" cy="39" r="1.6" fill="C"/><path d="M30 19h14M30 39h14M24 50v4M40 50v4"/>',
        "storage": '<ellipse cx="32" cy="16" rx="18" ry="6"/><path d="M14 16v32c0 3.3 8 6 18 6s18-2.7 18-6V16M14 32c0 3.3 8 6 18 6s18-2.7 18-6"/>',
        "transfer": '<path d="M12 22h36M40 14l8 8-8 8M52 42H16M24 34l-8 8 8 8"/>',
        "flask": '<path d="M26 10h12M28 10v16L14 50a4 4 0 0 0 3.5 6h29a4 4 0 0 0 3.5-6L36 26V10"/><path d="M20 40h24"/>',
        "contract": '<path d="M18 8h20l10 10v38H18z"/><path d="M38 8v10h10M24 30h16M24 38h10"/><path d="M34 47l4 4 8-9"/>',
        "tag": '<path d="M10 30V12h18l24 24-18 18z"/><circle cx="20" cy="22" r="3"/>',
        "power": '<path d="M32 10v20"/><path d="M20 18a18 18 0 1 0 24 0"/>',
        "broom": '<path d="M40 8L28 30"/><path d="M20 30h16l6 24H12z"/><path d="M22 42l-2 12M30 42v12M36 42l2 12"/>',
        "bell": '<path d="M18 44V30a14 14 0 0 1 28 0v14l4 4H14z"/><path d="M27 52a5 5 0 0 0 10 0"/>',
        "laptop": '<rect x="14" y="14" width="36" height="24" rx="3"/><path d="M8 46h48l-4 6H12z"/>',
        "wrench": '<path d="M40 10a12 12 0 0 0-12 16L10 44l8 8 18-18a12 12 0 0 0 16-12l-7 7-7-2-2-7z"/>',
        "shield": '<path d="M32 8l20 8v14c0 13-9 22-20 26-11-4-20-13-20-26V16z"/><path d="M24 32l6 6 12-12"/>',
        "recycle": '<path d="M24 14l8-6 8 6M32 8v14"/><path d="M50 36l-2 10-10 2M48 46L36 38"/><path d="M14 46l-2-10 8-6M12 36l14 6"/><path d="M22 20a20 20 0 0 0-8 18M42 54a20 20 0 0 1-20 0M50 30a20 20 0 0 0-8-12" opacity=".6"/>',
        "eye": '<path d="M6 32s10-16 26-16 26 16 26 16-10 16-26 16S6 32 6 32z"/><circle cx="32" cy="32" r="7"/>',
        "owner": '<circle cx="32" cy="22" r="10"/><path d="M14 54a18 18 0 0 1 36 0"/>',
        "sliders": '<path d="M14 18h36M14 32h36M14 46h36"/><circle cx="24" cy="18" r="4" fill="N"/><circle cx="40" cy="32" r="4" fill="N"/><circle cx="28" cy="46" r="4" fill="N"/>',
        "truck": '<path d="M8 18h28v24H8zM36 26h12l8 8v8H36z"/><circle cx="18" cy="46" r="5" fill="N"/><circle cx="46" cy="46" r="5" fill="N"/>',
        "check": '<rect x="10" y="10" width="44" height="44" rx="10"/><path d="M22 33l7 7 14-15"/>',
        "magnifier": '<circle cx="28" cy="28" r="16"/><path d="M40 40l14 14"/>',
    }[name].replace('fill="C"', f'fill="{col}"').replace('fill="N"', f'fill="{NAVY}"')
    return f'<svg width="{size}" height="{size}" viewBox="0 0 64 64" fill="none" stroke="{col}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{P}</svg>'

def icon_tile(name, size=150):
    return f'<div style="width:{size}px;height:{size}px;border-radius:36px;background:linear-gradient(160deg,rgba(59,139,255,.16),rgba(44,114,219,.04));border:1.5px solid rgba(59,139,255,.32);display:flex;align-items:center;justify-content:center">{icon(name, int(size*.56))}</div>'

def page(slides, title):
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><style>{BASE}@page{{size:1080px 1350px;margin:0}}.s{{page-break-after:always}}</style></head><body>' + "".join(slides) + '</body></html>'
