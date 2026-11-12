"""Isometric line illustrations, one per industry, in the Crises Control palette (dark and light)."""
import math
C30 = math.cos(math.pi / 6)
TH = {"dark": dict(top="#0A3165", side="#0B223C", side2="#0A2A55", edge="#16A1ED", det="#1179BB", hi="#FF0000", lit="#F7F6F8"),
      "light": dict(top="#FFFFFF", side="#F7F6F8", side2="#ECEBEF", edge="#0B223C", det="#1179BB", hi="#FF0000", lit="#0B223C")}

class Scene:
    def __init__(s, th): s.t, s.el, s.pts = TH[th], [], []
    def P(s, x, y, z):
        p = ((x - y) * C30, (x + y) * .5 - z); s.pts.append(p); return p
    def poly(s, pts, fill="none", stroke=None, w=1.3, dash=""):
        d = " ".join(f"{a:.2f},{b:.2f}" for a, b in (s.P(*q) for q in pts))
        da = f' stroke-dasharray="{dash}"' if dash else ""
        s.el.append(f'<polygon points="{d}" fill="{fill}" stroke="{stroke or s.t["edge"]}" stroke-width="{w}" stroke-linejoin="round"{da}/>')
    def line(s, a, b, stroke=None, w=1.1, dash=""):
        (x1, y1), (x2, y2) = s.P(*a), s.P(*b)
        da = f' stroke-dasharray="{dash}"' if dash else ""
        s.el.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{stroke or s.t["det"]}" stroke-width="{w}" stroke-linecap="round"{da}/>')
    def box(s, x0, y0, z0, x1, y1, z1, top=None, edge=None):
        t = s.t
        s.poly([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], t["side2"], edge)   # right face (x = x1)
        s.poly([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], t["side"], edge)    # left face (y = y1)
        s.poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], top or t["top"], edge)
    def winx(s, x, ys, zs, ww=5, wh=7, stroke=None):    # windows on the x = const face
        for y in ys:
            for z in zs: s.poly([(x, y, z), (x, y + ww, z), (x, y + ww, z + wh), (x, y, z + wh)], "none", stroke or s.t["det"], 1)
    def winy(s, y, xs, zs, ww=5, wh=7, stroke=None):    # windows on the y = const face
        for x in xs:
            for z in zs: s.poly([(x, y, z), (x + ww, y, z), (x + ww, y, z + wh), (x, y, z + wh)], "none", stroke or s.t["det"], 1)
    def ring(s, cx, cy, r, z, n=40): return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n), z) for i in range(n)]
    def cyl(s, cx, cy, r, z0, z1, top=None, edge=None):
        a = [s.P(*q) for q in s.ring(cx, cy, r, z0)] + [s.P(*q) for q in s.ring(cx, cy, r, z1)]
        h = hull(a); d = " ".join(f"{x:.2f},{y:.2f}" for x, y in h)
        s.el.append(f'<polygon points="{d}" fill="{s.t["side"]}" stroke="{edge or s.t["edge"]}" stroke-width="1.3" stroke-linejoin="round"/>')
        s.poly(s.ring(cx, cy, r, z1), top or s.t["top"], edge)
    def wheel(s, cx, y, cz, r):                     # vertical wheel on the y = const plane
        s.poly([(cx + r * math.cos(t), y, cz + r * math.sin(t)) for t in [2 * math.pi * i / 32 for i in range(32)]], s.t["side"], s.t["edge"], 1.3)
        s.poly([(cx + r * .45 * math.cos(t), y, cz + r * .45 * math.sin(t)) for t in [2 * math.pi * i / 24 for i in range(24)]], "none", s.t["det"], 1)
    def svg(s, W=400, H=320, pad=26):
        xs = [p[0] for p in s.pts]; ys = [p[1] for p in s.pts]
        bw, bh = max(xs) - min(xs), max(ys) - min(ys); k = min((W - 2 * pad) / bw, (H - 2 * pad) / bh)
        tx, ty = W / 2 - k * (min(xs) + bw / 2), H / 2 - k * (min(ys) + bh / 2)
        return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W*3}" height="{H*3}"><g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})" vector-effect="non-scaling-stroke">{"".join(s.el)}</g></svg>'

def hull(p):
    p = sorted(set(p))
    if len(p) < 3: return p
    def cr(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, up = [], []
    for q in p:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], q) <= 0: lo.pop()
        lo.append(q)
    for q in reversed(p):
        while len(up) >= 2 and cr(up[-2], up[-1], q) <= 0: up.pop()
        up.append(q)
    return lo[:-1] + up[:-1]

def ground(s, x0, y0, x1, y1):
    s.poly([(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0)], "none", s.t["det"], 1, "3 4")

def finance(s):                                   # a classical bank and a stack of coins
    ground(s, -12, -12, 140, 80)
    s.box(0, 0, 0, 92, 62, 4); s.box(4, 4, 4, 88, 58, 8)
    s.box(12, 10, 8, 80, 48, 46)
    for x in (14, 30, 46, 62, 78): s.cyl(x, 53, 3.2, 8, 46)
    for y in (12, 26, 40): s.cyl(83, y, 3.2, 8, 46)
    s.box(4, 4, 46, 88, 58, 52)
    s.poly([(46, 4, 66), (88, 4, 52), (88, 58, 52), (46, 58, 66)], s.t["side2"])
    s.poly([(4, 58, 52), (88, 58, 52), (46, 58, 66)], s.t["side"])
    s.poly([(20, 58, 54.5), (72, 58, 54.5), (46, 58, 63)], "none", s.t["det"], 1)
    for i in range(5): s.cyl(116, 52, 11, i * 4, i * 4 + 3.4, edge=s.t["hi"] if i == 4 else None)
    s.cyl(122, 26, 9, 0, 3.4); s.cyl(122, 26, 9, 4, 7.4)

def property_(s):                                 # a residential tower, a low-rise block and a house
    ground(s, -12, -12, 120, 100)
    s.box(0, 0, 0, 40, 40, 118)
    s.winx(40, (5, 17, 29), range(8, 108, 12)); s.winy(40, (5, 17, 29), range(8, 108, 12))
    s.poly([(40, 17, 80), (40, 22, 80), (40, 22, 87), (40, 17, 87)], s.t["hi"], s.t["hi"], 1)   # the one lit window
    s.box(52, 0, 0, 96, 44, 58)
    s.winx(96, (6, 18, 30), range(8, 52, 12)); s.winy(44, (58, 70, 82), range(8, 52, 12))
    s.box(56, 60, 0, 86, 86, 22)
    s.poly([(56, 73, 36), (86, 73, 36), (86, 86, 22), (56, 86, 22)], s.t["top"])
    s.poly([(86, 60, 22), (86, 86, 22), (86, 73, 36)], s.t["side2"])
    s.poly([(68, 86, 0), (74, 86, 0), (74, 86, 11), (68, 86, 11)], "none", s.t["det"], 1)

def retail(s):                                    # a shopfront with an awning, and stacked crates
    ground(s, -12, -12, 140, 92)
    s.box(0, 0, 0, 104, 52, 50)
    s.box(0, 40, 50, 104, 52, 60)
    s.poly([(8, 52, 4), (40, 52, 4), (40, 52, 30), (8, 52, 30)], "none", s.t["det"], 1.1)
    s.poly([(46, 52, 0), (60, 52, 0), (60, 52, 30), (46, 52, 30)], "none", s.t["det"], 1.1)
    s.poly([(66, 52, 4), (96, 52, 4), (96, 52, 30), (66, 52, 30)], "none", s.t["det"], 1.1)
    a = [(4, 52, 40), (100, 52, 40), (100, 66, 32), (4, 66, 32)]
    s.poly(a, s.t["top"], s.t["hi"], 1.3)
    for x in range(12, 100, 8): s.line((x, 52, 40), (x, 66, 32), s.t["hi"], .9)
    s.winx(104, (8, 22, 36), (18, 32), 8, 9)
    for (x, y, z) in [(112, 22, 0), (126, 22, 0), (112, 36, 0), (119, 29, 12)]:
        s.box(x, y, z, x + 12, y + 12, z + 12)
        s.line((x, y + 12, z + 6), (x + 12, y + 12, z + 6))

def transport(s):                                 # an articulated lorry on a marked road, with containers behind
    s.poly([(-14, -6, 0), (150, -6, 0), (150, 60, 0), (-14, 60, 0)], "none", s.t["det"], 1, "3 4")
    s.line((-14, 52, 0), (150, 52, 0), s.t["det"], 1, "10 8")
    s.box(-6, -62, 0, 46, -38, 22); s.box(52, -62, 0, 104, -38, 22); s.box(-6, -62, 22, 46, -38, 44)
    for x0 in (-6, 52):
        for x in range(x0 + 6, x0 + 52, 7): s.line((x, -38, 3), (x, -38, 19))
    s.box(0, 14, 10, 92, 40, 52)
    for x in range(8, 92, 12): s.line((x, 40, 14), (x, 40, 48))
    s.box(96, 14, 10, 124, 40, 44)
    s.poly([(124, 18, 30), (124, 36, 30), (124, 36, 41), (124, 18, 41)], "none", s.t["det"], 1.1)
    s.poly([(100, 40, 28), (118, 40, 28), (118, 40, 40), (100, 40, 40)], "none", s.t["det"], 1.1)
    s.cyl(110, 27, 3, 44, 49, top=s.t["hi"], edge=s.t["hi"])
    for x in (14, 30, 76, 112): s.wheel(x, 40, 9, 8)

def hospitality(s):                               # a hotel with balconies and a canopy, and a cloche on a table
    ground(s, -12, -12, 130, 96)
    s.box(0, 0, 0, 78, 34, 104)
    for z in range(16, 100, 12):
        s.line((4, 34, z), (74, 34, z))
        for x in range(8, 74, 13): s.poly([(x, 34, z + 2), (x + 7, 34, z + 2), (x + 7, 34, z + 9), (x, 34, z + 9)], "none", s.t["det"], .9)
    s.winx(78, (5, 15, 25), range(18, 100, 12), 4, 7)
    s.poly([(26, 34, 0), (52, 34, 0), (52, 34, 12), (26, 34, 12)], "none", s.t["det"], 1.1)
    s.box(22, 34, 13, 56, 50, 16, edge=s.t["hi"])
    for x in (24, 54): s.line((x, 49, 0), (x, 49, 13), s.t["edge"], 1.1)
    s.cyl(104, 70, 4, 0, 22); s.cyl(104, 70, 24, 22, 25)
    rings = [s.ring(104, 70, 18 * math.cos(math.radians(a)), 25 + 18 * math.sin(math.radians(a)), 36) for a in range(0, 90, 15)]
    pts = [s.P(*q) for r in rings for q in r]; h = hull(pts)
    s.el.append(f'<polygon points="{" ".join(f"{x:.2f},{y:.2f}" for x, y in h)}" fill="{s.t["top"]}" stroke="{s.t["edge"]}" stroke-width="1.3"/>')
    s.cyl(104, 70, 2.6, 42, 46, top=s.t["hi"], edge=s.t["hi"])

def healthcare(s):                                # a hospital with a red cross, and an ambulance
    ground(s, -12, -12, 140, 104)
    s.box(0, 0, 0, 104, 40, 60)
    s.winx(104, (6, 18, 30), range(8, 56, 12)); s.winy(40, range(46, 100, 12), range(8, 56, 12))
    s.box(0, 40, 0, 40, 64, 76)
    s.winx(40, (44, 54), range(8, 52, 12), 5, 7)
    cx, cz, a, b = 20, 60, 4, 11
    s.poly([(cx - a, 64, cz - b), (cx + a, 64, cz - b), (cx + a, 64, cz - a), (cx + b, 64, cz - a), (cx + b, 64, cz + a), (cx + a, 64, cz + a),
            (cx + a, 64, cz + b), (cx - a, 64, cz + b), (cx - a, 64, cz + a), (cx - b, 64, cz + a), (cx - b, 64, cz - a), (cx - a, 64, cz - a)], s.t["hi"], s.t["hi"], 1)
    s.poly([(12, 64, 0), (28, 64, 0), (28, 64, 16), (12, 64, 16)], "none", s.t["det"], 1.1)
    s.box(62, 66, 4, 104, 86, 30); s.box(104, 66, 4, 118, 86, 22)
    s.line((62, 86, 17), (104, 86, 17), s.t["det"], 2)
    s.poly([(118, 70, 13), (118, 82, 13), (118, 82, 20), (118, 70, 20)], "none", s.t["det"], 1.1)
    s.cyl(84, 76, 2.5, 30, 34, top=s.t["hi"], edge=s.t["hi"])
    for x in (72, 110): s.wheel(x, 86, 5, 5)

ART = {"finance": finance, "property": property_, "retail": retail, "transport": transport, "hospitality": hospitality, "healthcare": healthcare}
if __name__ == "__main__":
    import os
    for th in ("dark", "light"):
        os.makedirs(f"assets/ind/{th}", exist_ok=True)
        for name, fn in ART.items():
            sc = Scene(th); fn(sc); open(f"assets/ind/{th}/{name}.svg", "w").write(sc.svg())
    print("ok")
