#!/usr/bin/env python3
"""Build call-background pages from a set file.

usage: python3 build.py sets/<name>.json
Writes build/<prefix>-<id>.html (one 1920x1080 page per background) and build/manifest.json.
Then run: node render.js   (PNGs to out/, contact sheet and QA via sheet.py)

Set file shape (see sets/example-*.json):
{
  "brand": "crises-control",             # brands/<brand>.json
  "prefix": "cc-teams",                  # output file prefix
  "backgrounds": [
    {"id": "01-exec", "family": "office", "design": "exec"},
    {"id": "02-mesh", "family": "gradient", "design": "mesh", "tag": "Ready when it matters"},
    {"id": "03-orbit", "family": "keynote", "design": "orbit", "side": "left", "logo": "tr"}
  ]
}
Per background: family, design, side ("right" default: art on the right; "left" mirrors the art),
logo ("tl" | "tr" | "none"; default is the corner opposite the art), tag (one short line under the logo),
plus family extras: hud "readouts" [[label, value, bar 0..1 or null], ...], "place", "core_label", "hubs".
"""
import json, os, sys, re

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'families'))
import svgart  # noqa: E402

FAMILIES = {
    'office': ['exec', 'brandwall', 'library', 'meeting', 'studio'],
    'hud': svgart.DESIGNS['hud'],
    'gradient': ['mesh', 'ribbon', 'horizon', 'fluted', 'glass', 'rings', 'orb', 'beam', 'system'],
    'keynote': svgart.DESIGNS['keynote'],
}
MAX_TAG = 40  # characters; a call background is not a slide


def load_brand(slug):
    b = json.load(open(os.path.join(HERE, 'brands', slug + '.json')))
    col = b['colors']
    res = lambda v: col.get(v, v)
    b['gradients'] = {k: [res(x) for x in v] for k, v in b.get('gradients', {}).items()}
    b['colors'] = {k: v for k, v in col.items()}
    b['_font'] = f"'{b['font']}', sans-serif"
    b['_mono'] = f"'{b['mono']}', monospace"
    b['_logo_url'] = '../' + b['logo']
    return b


def font_css(b):
    css = ''.join(f"@font-face{{font-family:'{b['font']}';font-weight:{w};src:url(../{f})}}" for w, f in b['font_files'].items())
    return css + f"@font-face{{font-family:'{b['mono']}';font-weight:500;src:url(../{b['mono_file']})}}"


def lockup(b, corner, tag, hud=False):
    if corner == 'none':
        return ''
    side = 'left' if corner == 'tl' else 'right'
    glow = f"filter:drop-shadow(0 0 8px {b['colors']['cyan']}99);" if hud else ''
    wm = (f"<span style=\"font:500 {round(b['logo_height']*.36)}px {b['_mono']};letter-spacing:.22em;color:rgba(255,255,255,.92)\">{b['wordmark']}</span>"
          if b.get('wordmark') else '')
    t = (f"<div style=\"margin-top:16px;font:500 14px {b['_font']};letter-spacing:.32em;text-transform:uppercase;color:{b['colors']['muted']};opacity:.85;text-align:{side}\">{tag}</div>"
         if tag else '')
    mx, my = (100, 92) if hud else (72, 64)  # HUD corner brackets sit at 40px, so clear them
    return (f"<div id=\"lockup\" style=\"position:absolute;{side}:{mx}px;top:{my}px;{glow}\">"
            f"<div style=\"display:flex;align-items:center;gap:{round(b['logo_height']*.32)}px;justify-content:{'flex-start' if side == 'left' else 'flex-end'}\">"
            f"<img src=\"{b['_logo_url']}\" style=\"height:{b['logo_height']}px;display:block\">{wm}</div>{t}</div>")


def page(b, spec):
    fam, d = spec['family'], spec['design']
    if fam not in FAMILIES or d not in FAMILIES[fam]:
        raise SystemExit(f"{spec['id']}: unknown family/design {fam}/{d}. Options: " + '; '.join(f"{k}: {', '.join(v)}" for k, v in FAMILIES.items()))
    side = spec.get('side', 'right')
    corner = spec.get('logo', 'tl' if side == 'right' else 'tr')
    if fam == 'office':
        corner = spec.get('logo', 'none')  # the logo is already on the wall in every office scene
    if fam == 'gradient' and d == 'system':
        corner = 'tl'
    tag = spec.get('tag', '')
    if len(tag) > MAX_TAG:
        print(f"WARN {spec['id']}: tag is {len(tag)} characters; keep it under {MAX_TAG}")
    flip_css = 'transform:scaleX(-1);' if side == 'left' and fam in ('gradient', 'keynote', 'hud') and d != 'system' else ''
    head = (f"<!doctype html><html><head><meta charset=\"utf-8\"><style>{font_css(b)}"
            f"*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1920px;height:1080px;overflow:hidden;background:{b['colors']['ink']};font-family:{b['_font']}}}"
            f"#art{{position:absolute;inset:0;overflow:hidden;{flip_css}}}#art>svg,#art>canvas{{position:absolute;left:0;top:0}}#ui{{position:absolute;inset:0}}</style>")
    data = f"<script>window.BRAND={json.dumps(b)};window.SPEC={json.dumps(dict(spec, side=side))};</script>"
    ui = f"<div id=\"ui\">{lockup(b, corner, tag, hud=(fam == 'hud'))}</div>"
    if fam in ('hud', 'keynote'):
        svgart.FLIP = side == 'left'
        P = dict(b['colors'], _font=b['_font'])
        art = svgart.hud(P | {'_mono': b['_mono'], 'hud_readouts': b.get('hud_readouts'), 'hud_place': b.get('hud_place', '')}, d, spec) if fam == 'hud' else svgart.keynote(P, d, spec)
        return head + f"</head><body><div id=\"art\">{art}</div>{ui}{data}<script>document.fonts.ready.then(()=>setTimeout(()=>window.__done=true,150))</script></body></html>"
    if fam == 'gradient':
        return head + f"</head><body><div id=\"art\"><canvas id=\"c\" width=\"1920\" height=\"1080\"></canvas><div class=\"grain\" style=\"position:absolute;inset:0;opacity:.11;mix-blend-mode:overlay;background-image:url(&quot;data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='300' height='300' filter='url(%23n)'/></svg>&quot;)\"></div></div>{ui}{data}<script src=\"../families/gradient.js\"></script></body></html>"
    # office
    imap = '<script type="importmap">{"imports":{"three":"../vendor/three/three.module.js","three/addons/":"../vendor/three/jsm/"}}</script>'
    over = ("<div style=\"position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 58%,rgba(0,0,0,.38) 100%)\"></div>")
    return head + imap + f"</head><body><div id=\"art\">{over}</div>{ui}{data}<script type=\"module\" src=\"../families/office.js\"></script></body></html>"


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    setf = sys.argv[1]
    S = json.load(open(setf))
    b = load_brand(S.get('brand', 'transputec'))
    prefix = S.get('prefix', b['slug'] + '-teams')
    os.makedirs(os.path.join(HERE, 'build'), exist_ok=True)
    man = []
    for spec in S['backgrounds']:
        if not re.fullmatch(r'[A-Za-z0-9_-]+', spec['id']):
            raise SystemExit(f"bad id {spec['id']!r}: letters, digits, - and _ only")
        name = f"{prefix}-{spec['id']}"
        open(os.path.join(HERE, 'build', name + '.html'), 'w', encoding='utf8').write(page(b, spec))
        man.append({'name': name, 'id': spec['id'], 'family': spec['family'], 'design': spec['design'],
                    'reference': spec['family'] == 'gradient' and spec['design'] == 'system'})
        print('built', name)
    json.dump({'brand': b['name'], 'prefix': prefix, 'items': man}, open(os.path.join(HERE, 'build', 'manifest.json'), 'w'), indent=1)
    print(f"{len(man)} pages in build/. Next: node render.js")


if __name__ == '__main__':
    main()
