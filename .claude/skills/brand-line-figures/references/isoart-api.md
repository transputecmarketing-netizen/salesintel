# isoart API: drawing new subjects

`engine/isoart.py` draws isometric line scenes that sit next to the hairline figures: same 5:4 frame, same line weight (at `--weight 1.0`), flat filled faces, one accent. A subject is a Python function that draws onto a `Scene`.

## Minimal subject

```python
# subjects/warehouse.py  (every file in subjects/ is loaded by make_set.sh)
from isoart import subject

@subject("warehouse", "A portal-frame warehouse with a loading dock and pallets")
def warehouse(s):
    t = s.t                                   # palette colours: top side side2 edge det hi lit
    s.ground(-10, -10, 130, 90)               # dashed plate, always first
    s.box(0, 0, 0, 90, 50, 34)                # far, big things first
    s.winy(50, range(8, 80, 14), (20,), 8, 6) # windows on the left face
    for x in (20, 44, 68):                    # roller doors on the left (y = 50) face
        s.poly([(x, 50, 0), (x + 14, 50, 0), (x + 14, 50, 16), (x, 50, 16)], "none", t["det"], 1)
    for x in (24, 48):
        s.box(x, 58, 0, x + 10, 68, 6)        # pallets in front
    s.cyl(86, 52, 2, 34, 38, top=t["hi"], edge=t["hi"])   # ONE accent
```

Run: `python3 isoart.py warehouse --module subjects/warehouse.py --palette <name> --png`, or `bash make_set.sh <palette> warehouse`.

## Coordinate system

- `x` runs to the lower right of the picture, `y` to the lower left, `z` straight up. Units are arbitrary: the scene is fitted to the frame afterwards, so only proportions matter (a storey is about 12 units in the built-ins).
- The viewer looks from +x, +y, +z. Visible faces: the `x = max` face (right, filled `side2`), the `y = max` face (left, filled `side`) and the top (`top`).
- Painter's order: every face is filled, so later elements cover earlier ones. Draw in increasing `x + y` (far to near) and bottom to top. If something pokes through, it was drawn too late.

## Scene methods

| call | draws |
|---|---|
| `s.ground(x0, y0, x1, y1)` | dashed ground plate at z = 0 (every scene has one) |
| `s.box(x0, y0, z0, x1, y1, z1, top=None, edge=None)` | cuboid with right, left and top faces |
| `s.extrude([(x, y), ...], z0, z1, top=None, edge=None)` | prism from any convex footprint (hexagonal kiosks, angled roofs in plan, wedges) |
| `s.cyl(cx, cy, r, z0, z1, top=None, edge=None)` | upright cylinder (columns, coins, tanks, lamps, towers) |
| `s.dome(cx, cy, r, z, fill=None, edge=None)` | hemisphere sitting on z (cloche, radome, dome) |
| `s.wheel(cx, y, cz, r)` | vertical wheel on a `y = const` face (vehicles) |
| `s.poly(points3d, fill="none", stroke=None, w=1.3, dash="")` | any flat polygon: doors, roofs, signs, panels, a red cross |
| `s.line(a3d, b3d, stroke=None, w=1.1, dash="")` | detail line (default colour `det`) |
| `s.winx(x, ys, zs, ww=5, wh=7)` / `s.winy(y, xs, zs, ...)` | window grids on the right / left face |
| `s.ring(cx, cy, r, z, n=40)` | list of 3D points on a horizontal circle (for custom shapes) |
| `s.path2d(points2d, fill, stroke)` + `hull()` | a polygon from projected points, for curved solids |

`stroke` defaults: polygons use `edge`, lines use `det`. Widths are in px at an 800 px frame when `--weight 1.0` (the default), matching the hairline figures; `--weight bold` restores the heavier original Crises Control cover-art look.

## Style rules (why the set looks like one family)

1. **One accent.** Exactly one small element in `t["hi"]` (a lamp, a window, a lock, a cross). It is where the eye lands. Two accents read as a mistake.
2. **Outlines, not shading.** Faces only use `top`, `side`, `side2`; no gradients, shadows or text.
3. **A ground plate and a little context.** One main object plus one or two supporting objects (bank plus coins, hotel plus cloche) tells the story better than a lone box.
4. **Details as thin `det` lines**: windows, seams, fins, ribs. Keep detail density similar to the built-ins; more lines turn to noise at small sizes.
5. **Literal and recognisable.** A reader should name the subject in two seconds. Prefer an object the audience physically knows (a turbine, an ambulance) over an abstract metaphor.
6. **Frame.** Aim for a roughly 5:4 silhouette. A very tall element (tower, turbine) next to a wide ground plate shrinks everything; shorten the tall thing or tighten the plate.

## Worked examples

- `engine/isoart.py`: finance, property, retail, transport, hospitality, healthcare (built in).
- `engine/subjects/energy.py`: wind turbine (blades as polygons in the `x = const` plane), solar panels (tilted polygons with grid lines), substation with a lamp accent. Copy it as a template.
- `references/examples/industry_art_original.py`: the original Crises Control script these came from.
