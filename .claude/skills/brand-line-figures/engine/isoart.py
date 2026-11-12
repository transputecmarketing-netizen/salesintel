"""isoart: custom isometric line illustrations in the hairline style, in any palette, dark and light.

Usage
  python3 isoart.py --list
  python3 isoart.py [subjects...|all] [--palette crises-control] [--theme dark,light]
                    [--module my_subjects.py] [--out out/iso] [--width 2400] [--png] [--weight 1.0|bold]

Writes <out>/<palette>/<theme>/<subject>.svg (and .png with --png, via render_svg.js).

Coordinates: x runs to the lower right, y to the lower left, z up (units are arbitrary, the
scene is fitted to the frame). The viewer looks from +x, +y, +z, so the faces you see are the
x = max face (right), the y = max face (left) and the top. Draw back to front: later elements
paint over earlier ones (every face is filled), so draw far objects (small x + y) first.

Add a subject: write a function f(s) that draws onto Scene s and register it with @subject("name",
"what it depicts"). Put it in your own module and pass --module, or add it below. See
references/isoart-api.md.
"""
import argparse, importlib.util, json, math, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
C30 = math.cos(math.pi / 6)
SUBJECTS = {}           # name -> (function, description)


def subject(name, desc=""):
    def reg(fn):
        SUBJECTS[name] = (fn, desc)
        return fn
    return reg


def load_palette(name, theme, path=None):
    pals = json.load(open(path or os.path.join(HERE, "palettes.json")))
    if name not in pals:
        sys.exit(f"No palette '{name}'. Have: {', '.join(k for k in pals if not k.startswith('_'))}")
    return pals[name]["iso"][theme]


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


class Scene:
    """Collects SVG elements in draw order. Colours come from the palette's iso block:
    top, side, side2 (face fills), edge (outlines), det (detail lines), hi (the one accent), lit."""

    def __init__(s, colours):
        s.t, s.el, s.pts = colours, [], []

    # projection
    def P(s, x, y, z):
        p = ((x - y) * C30, (x + y) * .5 - z); s.pts.append(p); return p

    # primitives
    def poly(s, pts, fill="none", stroke=None, w=1.3, dash=""):
        """A flat polygon through 3D points. fill: a colour or "none"."""
        d = " ".join(f"{a:.2f},{b:.2f}" for a, b in (s.P(*q) for q in pts))
        da = f' stroke-dasharray="{dash}"' if dash else ""
        s.el.append(f'<polygon points="{d}" fill="{fill}" stroke="{stroke or s.t["edge"]}" stroke-width="§{w}§" stroke-linejoin="round"{da}/>')

    def line(s, a, b, stroke=None, w=1.1, dash=""):
        (x1, y1), (x2, y2) = s.P(*a), s.P(*b)
        da = f' stroke-dasharray="{dash}"' if dash else ""
        s.el.append(f'<line x1="{x1:.2f}" y1="{y1:.2f}" x2="{x2:.2f}" y2="{y2:.2f}" stroke="{stroke or s.t["det"]}" stroke-width="§{w}§" stroke-linecap="round"{da}/>')

    def path2d(s, pts, fill="none", stroke=None, w=1.3):
        """A polygon from already projected 2D points (for hulls of curved solids)."""
        d = " ".join(f"{x:.2f},{y:.2f}" for x, y in pts)
        s.el.append(f'<polygon points="{d}" fill="{fill}" stroke="{stroke or s.t["edge"]}" stroke-width="§{w}§" stroke-linejoin="round"/>')

    def box(s, x0, y0, z0, x1, y1, z1, top=None, edge=None):
        """A cuboid: right face, left face, then top."""
        t = s.t
        s.poly([(x1, y0, z0), (x1, y1, z0), (x1, y1, z1), (x1, y0, z1)], t["side2"], edge)
        s.poly([(x0, y1, z0), (x1, y1, z0), (x1, y1, z1), (x0, y1, z1)], t["side"], edge)
        s.poly([(x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1)], top or t["top"], edge)

    def extrude(s, foot, z0, z1, top=None, edge=None):
        """A prism from a convex footprint [(x, y), ...] (any winding) between z0 and z1."""
        cx = sum(p[0] for p in foot) / len(foot); cy = sum(p[1] for p in foot) / len(foot)
        faces = []
        for i in range(len(foot)):
            (ax, ay), (bx, by) = foot[i], foot[(i + 1) % len(foot)]
            nx, ny = by - ay, -(bx - ax)                       # a normal; flip it to point outwards
            if nx * ((ax + bx) / 2 - cx) + ny * ((ay + by) / 2 - cy) < 0: nx, ny = -nx, -ny
            if nx + ny > 1e-9:                                # faces the viewer
                faces.append(((ax + bx) / 2 + (ay + by) / 2, (ax, ay), (bx, by), nx >= ny))
        for _, (ax, ay), (bx, by), right in sorted(faces):
            s.poly([(ax, ay, z0), (bx, by, z0), (bx, by, z1), (ax, ay, z1)], s.t["side2"] if right else s.t["side"], edge)
        s.poly([(x, y, z1) for x, y in foot], top or s.t["top"], edge)

    def ring(s, cx, cy, r, z, n=40):
        return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n), z) for i in range(n)]

    def cyl(s, cx, cy, r, z0, z1, top=None, edge=None):
        """An upright cylinder (coins, columns, tanks, lamps)."""
        a = [s.P(*q) for q in s.ring(cx, cy, r, z0)] + [s.P(*q) for q in s.ring(cx, cy, r, z1)]
        s.path2d(hull(a), s.t["side"], edge)
        s.poly(s.ring(cx, cy, r, z1), top or s.t["top"], edge)

    def dome(s, cx, cy, r, z, fill=None, edge=None):
        """A hemisphere sitting on z (cloches, radomes, domes)."""
        rings = [s.ring(cx, cy, r * math.cos(math.radians(a)), z + r * math.sin(math.radians(a)), 36) for a in range(0, 91, 10)]
        s.path2d(hull([s.P(*q) for rg in rings for q in rg]), fill or s.t["top"], edge)

    def wheel(s, cx, y, cz, r):
        """A vertical wheel on the y = const plane (vehicles)."""
        s.poly([(cx + r * math.cos(t), y, cz + r * math.sin(t)) for t in [2 * math.pi * i / 32 for i in range(32)]], s.t["side"], s.t["edge"], 1.3)
        s.poly([(cx + r * .45 * math.cos(t), y, cz + r * .45 * math.sin(t)) for t in [2 * math.pi * i / 24 for i in range(24)]], "none", s.t["det"], 1)

    def winx(s, x, ys, zs, ww=5, wh=7, stroke=None):
        """Windows (outlines) on the x = const (right) face."""
        for y in ys:
            for z in zs: s.poly([(x, y, z), (x, y + ww, z), (x, y + ww, z + wh), (x, y, z + wh)], "none", stroke or s.t["det"], 1)

    def winy(s, y, xs, zs, ww=5, wh=7, stroke=None):
        """Windows (outlines) on the y = const (left) face."""
        for x in xs:
            for z in zs: s.poly([(x, y, z), (x + ww, y, z), (x + ww, y, z + wh), (x, y, z + wh)], "none", stroke or s.t["det"], 1)

    def ground(s, x0, y0, x1, y1):
        """The dashed ground plate every scene stands on."""
        s.poly([(x0, y0, 0), (x1, y0, 0), (x1, y1, 0), (x0, y1, 0)], "none", s.t["det"], 1, "3 4")

    def svg(s, W=400, H=320, pad=26, px_width=None, weight=1.0):
        """Fit everything into a W x H frame (5:4 like the hairline figures).
        weight=1.0 makes a stroke of w draw w px wide when the frame is 800 px wide, the same line
        weight as the hairline figures. weight="bold" keeps the original cover-art look (strokes
        scale with the scene, about 2.5x heavier)."""
        xs = [p[0] for p in s.pts]; ys = [p[1] for p in s.pts]
        bw, bh = max(xs) - min(xs), max(ys) - min(ys); k = min((W - 2 * pad) / bw, (H - 2 * pad) / bh)
        tx, ty = W / 2 - k * (min(xs) + bw / 2), H / 2 - k * (min(ys) + bh / 2)
        pw = px_width or W * 3
        f = 1.0 if weight == "bold" else float(weight) * (W / 800) / k
        body = re.sub(r"§([0-9.]+)§", lambda m: f"{float(m.group(1)) * f:.3f}", "".join(s.el))
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{pw}" height="{round(pw * H / W)}">'
                f'<g transform="translate({tx:.2f} {ty:.2f}) scale({k:.4f})">{body}</g></svg>')


# ---------------------------------------------------------------------------------------------
# Built-in subjects (the six Crises Control industry covers). Each uses ONE hi accent only.

def ground(s, x0, y0, x1, y1): s.ground(x0, y0, x1, y1)


@subject("finance", "A classical bank with columns and pediment, and stacks of coins")
def finance(s):
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


@subject("property", "A residential tower with one lit window, a low-rise block and a house")
def property_(s):
    ground(s, -12, -12, 120, 100)
    s.box(0, 0, 0, 40, 40, 118)
    s.winx(40, (5, 17, 29), range(8, 108, 12)); s.winy(40, (5, 17, 29), range(8, 108, 12))
    s.poly([(40, 17, 80), (40, 22, 80), (40, 22, 87), (40, 17, 87)], s.t["hi"], s.t["hi"], 1)
    s.box(52, 0, 0, 96, 44, 58)
    s.winx(96, (6, 18, 30), range(8, 52, 12)); s.winy(44, (58, 70, 82), range(8, 52, 12))
    s.box(56, 60, 0, 86, 86, 22)
    s.poly([(56, 73, 36), (86, 73, 36), (86, 86, 22), (56, 86, 22)], s.t["top"])
    s.poly([(86, 60, 22), (86, 86, 22), (86, 73, 36)], s.t["side2"])
    s.poly([(68, 86, 0), (74, 86, 0), (74, 86, 11), (68, 86, 11)], "none", s.t["det"], 1)


@subject("retail", "A shopfront with a striped awning, and stacked crates")
def retail(s):
    ground(s, -12, -12, 140, 92)
    s.box(0, 0, 0, 104, 52, 50)
    s.box(0, 40, 50, 104, 52, 60)
    s.poly([(8, 52, 4), (40, 52, 4), (40, 52, 30), (8, 52, 30)], "none", s.t["det"], 1.1)
    s.poly([(46, 52, 0), (60, 52, 0), (60, 52, 30), (46, 52, 30)], "none", s.t["det"], 1.1)
    s.poly([(66, 52, 4), (96, 52, 4), (96, 52, 30), (66, 52, 30)], "none", s.t["det"], 1.1)
    s.poly([(4, 52, 40), (100, 52, 40), (100, 66, 32), (4, 66, 32)], s.t["top"], s.t["hi"], 1.3)
    for x in range(12, 100, 8): s.line((x, 52, 40), (x, 66, 32), s.t["hi"], .9)
    s.winx(104, (8, 22, 36), (18, 32), 8, 9)
    for (x, y, z) in [(112, 22, 0), (126, 22, 0), (112, 36, 0), (119, 29, 12)]:
        s.box(x, y, z, x + 12, y + 12, z + 12)
        s.line((x, y + 12, z + 6), (x + 12, y + 12, z + 6))


@subject("transport", "An articulated lorry on a marked road, with shipping containers behind")
def transport(s):
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


@subject("hospitality", "A hotel with balconies and an entrance canopy, and a cloche on a table")
def hospitality(s):
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
    s.dome(104, 70, 18, 25)
    s.cyl(104, 70, 2.6, 42, 46, top=s.t["hi"], edge=s.t["hi"])


@subject("healthcare", "A hospital with a red cross, and an ambulance")
def healthcare(s):
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


# ---------------------------------------------------------------------------------------------

def load_module(path):
    """Import a user module; its @subject decorators register into SUBJECTS."""
    sys.modules.setdefault("isoart", sys.modules[__name__])
    spec = importlib.util.spec_from_file_location(os.path.splitext(os.path.basename(path))[0], path)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("subjects", nargs="*", default=["all"])
    ap.add_argument("--palette", default="crises-control")
    ap.add_argument("--palettes", default=None, help="palettes.json path (default: next to this file)")
    ap.add_argument("--theme", default="dark,light")
    ap.add_argument("--module", action="append", default=[], help="extra subjects module (repeatable)")
    ap.add_argument("--out", default="out/iso")
    ap.add_argument("--width", type=int, default=2400, help="output pixel width")
    ap.add_argument("--png", action="store_true", help="also render transparent PNGs")
    ap.add_argument("--weight", default="1.0", help="line weight: 1.0 matches the hairline figures; bold = original heavy cover-art lines")
    ap.add_argument("--list", action="store_true")
    a = ap.parse_args()
    for m in a.module: load_module(m)
    if a.list:
        for k, (_, d) in SUBJECTS.items(): print(f"{k:16} {d}")
        return
    names = list(SUBJECTS) if "all" in a.subjects else a.subjects
    bad = [n for n in names if n not in SUBJECTS]
    if bad: sys.exit(f"Unknown subject(s): {', '.join(bad)}. Use --list.")
    made = []
    for th in a.theme.split(","):
        cols = load_palette(a.palette, th, a.palettes)
        d = os.path.join(a.out, a.palette, th); os.makedirs(d, exist_ok=True)
        for n in names:
            sc = Scene(cols); SUBJECTS[n][0](sc)
            f = os.path.join(d, n + ".svg"); open(f, "w").write(sc.svg(px_width=a.width // 2, weight=a.weight)); made.append(f)
    print(f"wrote {len(made)} SVG(s) to {os.path.join(a.out, a.palette)}")
    if a.png:
        subprocess.run(["node", os.path.join(HERE, "render_svg.js"), "--width", str(a.width)] + made, check=True, stdout=subprocess.DEVNULL)
        print(f"rendered {len(made)} PNG(s) at {a.width} px wide")


if __name__ == "__main__":
    main()
