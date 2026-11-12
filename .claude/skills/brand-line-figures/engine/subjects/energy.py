"""Energy sector: a wind turbine, a row of solar panels and a substation with one live warning lamp."""
import math
from isoart import subject


@subject("energy", "A wind turbine, a bank of solar panels and a substation with a warning lamp")
def energy(s):
    t = s.t
    s.ground(-8, -8, 136, 112)
    # far back: substation yard (small x + y first)
    s.box(0, 0, 0, 46, 30, 4)                                   # concrete pad
    for x in (6, 26):
        s.box(x, 6, 4, x + 14, 22, 24)                          # transformers
        for z in (8, 13, 18): s.line((x + 14, 8, z), (x + 14, 20, z))   # cooling fins on the right face
        for y in (9, 14, 19): s.cyl(x + 7, y, 1.4, 24, 30)      # bushings
    s.cyl(44, 26, 2.2, 4, 10, top=t["hi"], edge=t["hi"])        # the one accent: a warning lamp
    # wind turbine on the left-back
    s.cyl(70, 10, 3.2, 0, 80)                                  # tower
    s.box(62, 6, 80, 80, 14, 88)                              # nacelle
    hx, hy, hz = 81, 10, 84                                    # hub on the x = 81 plane
    for k in range(3):                                          # three blades in the y-z plane
        a = math.radians(90 + 120 * k); b = a + math.radians(7)
        tip = (hx, hy + 34 * math.cos(a), hz + 34 * math.sin(a)); tip2 = (hx, hy + 34 * math.cos(b), hz + 34 * math.sin(b))
        s.poly([(hx, hy + 3 * math.cos(a - 1.3), hz + 3 * math.sin(a - 1.3)), tip, tip2, (hx, hy + 3 * math.cos(b + 1.3), hz + 3 * math.sin(b + 1.3))], t["top"])
    s.poly([(hx, hy + 3.2 * math.cos(a), hz + 3.2 * math.sin(a)) for a in [2 * math.pi * i / 20 for i in range(20)]], t["side2"])   # hub disc
    # front: solar panels on frames, tilted towards the viewer's right
    for row in range(3):
        y0 = 50 + row * 20
        for col in range(3):
            x0 = 40 + col * 30
            s.line((x0 + 4, y0 + 6, 0), (x0 + 4, y0 + 6, 6), t["edge"]); s.line((x0 + 20, y0 + 6, 0), (x0 + 20, y0 + 6, 6), t["edge"])
            pts = [(x0, y0, 12), (x0 + 24, y0, 12), (x0 + 24, y0 + 14, 4), (x0, y0 + 14, 4)]
            s.poly(pts, t["top"])
            for i in (1, 2, 3): s.line((x0 + 6 * i, y0, 12), (x0 + 6 * i, y0 + 14, 4), w=.8)
            s.line((x0, y0 + 7, 8), (x0 + 24, y0 + 7, 8), w=.8)
    # cable trench from the panels to the substation
    s.line((40, 48, 0), (36, 30, 0), t["det"], 1, "4 3")
