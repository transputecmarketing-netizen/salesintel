"""SVG families drawn in Python: hud (holographic heads-up display) and keynote (Apple-keynote style).

Every function takes P (the brand palette dict from brands/<slug>.json, with hex values resolved)
and returns an SVG string 1920x1080. Art is composed for the RIGHT third; build.py mirrors it when
side is "left". Text inside art goes through txt(), which stays readable when mirrored.
"""
import math, random

W, H = 1920, 1080
FLIP = False  # set by build.py before drawing


def hx(c):
    return [int(c[i:i + 2], 16) for i in (1, 3, 5)]


def mix(a, b, t):
    pa, pb = hx(a), hx(b)
    return '#%02x%02x%02x' % tuple(max(0, min(255, round(x + (y - x) * t))) for x, y in zip(pa, pb))


WHITE = '#FFFFFF'

# ------------------------------------------------------------------ HUD
def hud_cols(P):
    return mix(P['cyan'], WHITE, .5), P['cyan'], P['primary'], P['vivid']


def hud_defs(P, mono):
    C1, C2, C3, C4 = hud_cols(P)
    return f'''<defs>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="{C2}"/><stop offset="1" stop-color="{C4}"/></linearGradient>
<linearGradient id="cone" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="{C2}" stop-opacity=".45"/><stop offset="1" stop-color="{C2}" stop-opacity="0"/></linearGradient>
<radialGradient id="disc"><stop offset="0" stop-color="{C1}" stop-opacity=".9"/><stop offset=".5" stop-color="{C2}" stop-opacity=".35"/><stop offset="1" stop-color="{C2}" stop-opacity="0"/></radialGradient>
<radialGradient id="hudbg" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="{mix(P['base'], P['deep'], .45)}"/><stop offset=".55" stop-color="{P['base']}"/><stop offset="1" stop-color="{P['ink']}"/></radialGradient>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="{C1}" fill-opacity=".05"/></pattern>
</defs>'''


class Hud:
    def __init__(self, P, mono):
        self.P = P; self.mono = mono
        self.C1, self.C2, self.C3, self.C4 = hud_cols(P)
        self.alert = P.get('alert') or ''

    def txt(self, x, y, t, size=14, col=None, op=.85, anchor="start"):
        col = col or self.C1
        if FLIP:  # counter-mirror so text stays readable after the art layer is flipped
            anchor = {"start": "end", "end": "start"}.get(anchor, anchor)
            return f'<text transform="translate({2*x},0) scale(-1,1)" x="{x}" y="{y}" font-family="{self.mono}" font-weight="500" letter-spacing="2.5" font-size="{size}" fill="{col}" fill-opacity="{op}" text-anchor="{anchor}">{t}</text>'
        return f'<text x="{x}" y="{y}" font-family="{self.mono}" font-weight="500" letter-spacing="2.5" font-size="{size}" fill="{col}" fill-opacity="{op}" text-anchor="{anchor}">{t}</text>'

    def arc(self, cx, cy, r, a0, a1, w=2, col=None, op=.9, dash=None):
        col = col or self.C2
        a0r, a1r = math.radians(a0), math.radians(a1)
        x0, y0, x1, y1 = cx + r*math.cos(a0r), cy + r*math.sin(a0r), cx + r*math.cos(a1r), cy + r*math.sin(a1r)
        large = 1 if (a1 - a0) % 360 > 180 else 0
        d = f' stroke-dasharray="{dash}"' if dash else ''
        return f'<path d="M{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f}" fill="none" stroke="{col}" stroke-width="{w}" stroke-opacity="{op}"{d}/>'

    def ticks(self, cx, cy, r, n, l=8, a0=0, a1=360, col=None, op=.6, major=5):
        col = col or self.C2; s = ''
        for i in range(n + 1):
            a = math.radians(a0 + (a1 - a0) * i / n); ll = l * (1.8 if i % major == 0 else 1)
            s += f'<line x1="{cx+r*math.cos(a):.1f}" y1="{cy+r*math.sin(a):.1f}" x2="{cx+(r+ll)*math.cos(a):.1f}" y2="{cy+(r+ll)*math.sin(a):.1f}" stroke="{col}" stroke-opacity="{op}" stroke-width="1.4"/>'
        return s

    def ring(self, cx, cy, R, seed=1):
        rr = random.Random(seed); s = ''
        s += self.arc(cx, cy, R, 0, 359.9, 1.2, self.C3, .35)
        s += self.ticks(cx, cy, R + 6, 72, 6, col=self.C2, op=.5, major=6)
        for k in range(4):
            a = rr.uniform(0, 360); s += self.arc(cx, cy, R - 18, a, a + rr.uniform(30, 80), 5, self.C1 if k % 2 else self.C2, .9)
        s += self.arc(cx, cy, R - 34, 0, 359.9, 1, self.C2, .25, "2 6")
        for k in range(3):
            a = rr.uniform(0, 360); s += self.arc(cx, cy, R + 26, a, a + rr.uniform(15, 50), 2, self.C4, .8)
        if self.alert:  # one small alarm sector, the only place the alert colour appears
            a = rr.uniform(0, 360); s += self.arc(cx, cy, R - 18, a, a + 14, 5, self.alert, .95)
        return s

    def corners(self, m=40, L=90):
        s = ''
        for (x, y, dx, dy) in [(m, m, 1, 1), (W-m, m, -1, 1), (m, H-m, 1, -1), (W-m, H-m, -1, -1)]:
            s += f'<path d="M{x},{y+dy*L} L{x},{y} L{x+dx*L},{y}" fill="none" stroke="{self.C2}" stroke-width="2.4" stroke-opacity=".8"/>'
            s += f'<line x1="{x+dx*14}" y1="{y+dy*14}" x2="{x+dx*34}" y2="{y+dy*14}" stroke="{self.C1}" stroke-width="2"/>'
        return s

    def readouts(self, x, y, rows, w=360):
        s = f'<line x1="{x}" y1="{y-26}" x2="{x+w}" y2="{y-26}" stroke="{self.C2}" stroke-opacity=".5"/>'
        for i, row in enumerate(rows):
            k, v, bar = (list(row) + [None])[:3]
            yy = y + i * 54
            s += self.txt(x, yy, k, 16, self.C2, .85) + self.txt(x + w, yy, v, 16, self.C1, .95, "end")
            if bar is not None:
                s += f'<rect x="{x}" y="{yy+10}" width="{w}" height="4" rx="2" fill="{self.C3}" fill-opacity=".2"/><rect x="{x}" y="{yy+10}" width="{w*bar:.0f}" height="4" rx="2" fill="url(#gh)"/>'
        return s

    def projector(self, cx, by, w=220, top=None):
        top = top if top is not None else by - 560
        return (f'<polygon points="{cx-w*.18},{by} {cx+w*.18},{by} {cx+w*1.25},{top} {cx-w*1.25},{top}" fill="url(#cone)" opacity=".55"/>'
                f'<ellipse cx="{cx}" cy="{by}" rx="{w}" ry="{w*.2}" fill="url(#disc)"/>'
                f'<ellipse cx="{cx}" cy="{by}" rx="{w*.95}" ry="{w*.19}" fill="none" stroke="{self.C1}" stroke-width="2" stroke-opacity=".8"/>'
                f'<ellipse cx="{cx}" cy="{by}" rx="{w*1.25}" ry="{w*.25}" fill="none" stroke="{self.C3}" stroke-width="1.2" stroke-opacity=".6" stroke-dasharray="3 7"/>')

    def grid_floor(self):
        s = ''
        for i in range(-14, 15):
            s += f'<line x1="{960+i*30}" y1="760" x2="{960+i*190}" y2="1080" stroke="{self.C3}" stroke-opacity=".12"/>'
        for k in range(9):
            y = 760 + (k**1.7) * 7; s += f'<line x1="0" y1="{y:.0f}" x2="1920" y2="{y:.0f}" stroke="{self.C3}" stroke-opacity="{.05+.012*k:.3f}"/>'
        return s

    def bot(self, cx, cy, sc=1.0, yaw=-0.5, pitch=0.12):
        C1, C2 = self.C1, self.C2; pts = []
        def sup(u, v, a, b, c, e=0.28):
            cu, su, cv, sv = math.cos(u), math.sin(u), math.cos(v), math.sin(v)
            f = lambda w, p: math.copysign(abs(w) ** p, w)
            return a * f(cv, e) * f(cu, e), b * f(sv, e), c * f(cv, e) * f(su, e)
        for i in range(46):
            for j in range(26):
                pts.append(sup(2*math.pi*i/46, -math.pi/2 + math.pi*j/25, 150, 118, 112) + ('h',))
        for i in range(36):
            for j in range(18):
                x, y, z = sup(2*math.pi*i/36, -math.pi/2 + math.pi*j/17, 108, 92, 86); pts.append((x, y + 250, z, 'b'))
        for i in range(30):
            a = 2*math.pi*i/30; pts.append((10*math.cos(a), -170 + 10*math.sin(a), 0, 'tip'))
        cyw, syw, cp, sp = math.cos(yaw), math.sin(yaw), math.cos(pitch), math.sin(pitch)
        def proj(x, y, z):
            x2, z2 = x*cyw + z*syw, -x*syw + z*cyw
            y2, z3 = y*cp - z2*sp, y*sp + z2*cp
            f = 900 / (900 + z3)
            return cx + x2*f*sc, cy + y2*f*sc, z3
        s = ''
        for X, Y, Z, k in sorted((proj(x, y, z) + (k,) for x, y, z, k in pts), key=lambda p: -p[2]):
            op = .25 + .6 * (1 - (Z + 150) / 300); rad = 1.6 if k != 'tip' else 2.4
            s += f'<circle cx="{X:.1f}" cy="{Y:.1f}" r="{rad}" fill="{C1 if Z < 0 else C2}" fill-opacity="{max(.12, min(.95, op)):.2f}"/>'
        fx, fy, _ = proj(0, -8, 112)
        s += f'<rect x="{fx-118*sc}" y="{fy-52*sc}" width="{236*sc}" height="{104*sc}" rx="{40*sc}" fill="{C2}" fill-opacity=".10" stroke="{C1}" stroke-width="2" stroke-opacity=".9"/>'
        for ex in (-48, 48):
            X, Y, _ = proj(ex, -10, 116); s += f'<rect x="{X-12*sc}" y="{Y-26*sc}" width="{24*sc}" height="{52*sc}" rx="{12*sc}" fill="{C1}" filter="url(#glow2)"/>'
        X, Y, _ = proj(0, -150, 0); X2, Y2, _ = proj(0, -118, 0)
        s += f'<line x1="{X:.1f}" y1="{Y:.1f}" x2="{X2:.1f}" y2="{Y2:.1f}" stroke="{C1}" stroke-width="3"/>'
        return s

    def globe(self, cx, cy, R, yaw=0.25, tilt=-0.5, hubs=None):
        s = ''; cyw, syw, ct, st = math.cos(yaw), math.sin(yaw), math.cos(tilt), math.sin(tilt)
        def Pt(lat, lon):
            la, lo = math.radians(lat), math.radians(lon)
            x, y, z = math.cos(la)*math.sin(lo), -math.sin(la), math.cos(la)*math.cos(lo)
            x2, z2 = x*cyw + z*syw, -x*syw + z*cyw
            y2, z3 = y*ct - z2*st, y*st + z2*ct
            return cx + x2*R, cy + y2*R, z3
        for lat in range(-75, 90, 15):
            pts = [Pt(lat, lo) for lo in range(0, 361, 5)]
            for a, b in zip(pts, pts[1:]):
                s += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{self.C2}" stroke-opacity="{.55 if a[2]+b[2] > 0 else .12}" stroke-width="1.2"/>'
        for lon in range(0, 360, 20):
            pts = [Pt(la, lon) for la in range(-90, 91, 5)]
            for a, b in zip(pts, pts[1:]):
                s += f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{self.C3}" stroke-opacity="{.55 if a[2]+b[2] > 0 else .12}" stroke-width="1.1"/>'
        hubs = hubs or [(51.5, -0.13), (40.7, -74), (25.2, 55.3), (12.97, 77.6), (1.35, 103.8), (50.1, 8.7), (43.7, -79.4)]
        lp = Pt(*hubs[0])
        for i, (la, lo) in enumerate(hubs):
            p = Pt(la, lo)
            if p[2] < -0.05: continue
            s += f'<circle cx="{p[0]:.1f}" cy="{p[1]:.1f}" r="{7 if i == 0 else 4}" fill="{self.C1}"/>'
            if i:
                mx, my = (lp[0]+p[0])/2, (lp[1]+p[1])/2 - 90
                s += f'<path d="M{lp[0]:.1f},{lp[1]:.1f} Q{mx:.1f},{my:.1f} {p[0]:.1f},{p[1]:.1f}" fill="none" stroke="url(#gh)" stroke-width="2.4"/>'
        s += f'<circle cx="{lp[0]:.1f}" cy="{lp[1]:.1f}" r="20" fill="none" stroke="{self.C1}" stroke-width="2"/>'
        return s

    def core(self, cx, cy, label):
        rr = random.Random(11); s = ''
        for k in range(26):
            side = rr.choice([(1, 0), (0, -1), (0, 1), (1, 0)])
            x, y = (cx + (150 if side == (1, 0) else rr.randint(-130, 130)), cy + (rr.randint(-130, 130) if side == (1, 0) else side[1]*150))
            pts = [(x, y)]
            for step in range(4):
                if side == (1, 0): x += rr.randint(60, 140); y += rr.choice([-1, 1]) * rr.randint(0, 60) if step % 2 else 0
                else: y += side[1] * rr.randint(50, 110); x += rr.choice([-1, 1]) * rr.randint(0, 60) if step % 2 else 0
                pts.append((x, y))
            s += f'<polyline points="{" ".join(f"{a:.0f},{b:.0f}" for a, b in pts)}" fill="none" stroke="url(#gh)" stroke-width="2.2" stroke-opacity=".85"/><circle cx="{x:.0f}" cy="{y:.0f}" r="5" fill="{self.C1}"/>'
        s += f'<rect x="{cx-150}" y="{cy-150}" width="300" height="300" rx="34" fill="{mix(self.P["ink"], self.P["deep"], .5)}" stroke="url(#gh)" stroke-width="4"/>'
        for i in range(10):
            for sd in (-1, 1):
                s += f'<rect x="{cx-128+i*28}" y="{cy+sd*150-(0 if sd > 0 else 14)}" width="12" height="14" fill="{self.C2}" fill-opacity=".8"/>'
                s += f'<rect x="{cx+sd*150-(0 if sd > 0 else 14)}" y="{cy-128+i*28}" width="14" height="12" fill="{self.C2}" fill-opacity=".8"/>'
        s += f'<rect x="{cx-100}" y="{cy-100}" width="200" height="200" rx="20" fill="none" stroke="{self.C1}" stroke-opacity=".6" stroke-width="1.5"/>'
        if label:
            if FLIP:
                s += f'<g transform="translate({2*cx},0) scale(-1,1)">'
            s += f'<text x="{cx}" y="{cy+40}" text-anchor="middle" font-family="{self.P["_font"]}" font-weight="700" font-size="{120 if len(label) <= 2 else 64}" letter-spacing="-4" fill="url(#gh)" filter="url(#glow2)">{label}</text>'
            if FLIP:
                s += '</g>'
        return s


def hud(P, design, spec):
    h = Hud(P, P['_mono'])
    rows = spec.get('readouts') or P.get('hud_readouts') or [["STATUS", "ONLINE", None], ["SESSION", "SECURE", .92], ["LINK", "STABLE", .74], ["SIGNAL", "CLEAR", .6]]
    place = spec.get('place', P.get('hud_place', ''))
    out = [f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}">{hud_defs(P, h.mono)}<rect width="{W}" height="{H}" fill="url(#hudbg)"/>']
    if design == 'assistant':
        out += [h.grid_floor(), h.corners(), f'<g filter="url(#glow)">{h.ring(1560, 470, 300, 2)}</g>',
                h.projector(1560, 900, 210, 300), f'<g filter="url(#glow)">{h.bot(1560, 450, .95, -.55)}</g>',
                f'<g filter="url(#glow)">{h.readouts(96, 640, rows)}</g>', h.txt(96, 940, place, 13, h.C2, .7)]
    elif design == 'globe':
        out += [h.corners(), f'<g filter="url(#glow)">{h.ring(1520, 470, 330, 5)}{h.globe(1520, 470, 250, hubs=spec.get("hubs"))}</g>',
                h.projector(1520, 930, 190, 520), f'<g filter="url(#glow)">{h.readouts(96, 620, rows)}</g>', h.txt(96, 940, place, 13, h.C2, .7)]
    elif design == 'visor':  # symmetric frame: arcs at both edges, centre kept clear
        s = h.corners(36, 120)
        for sd in (-1, 1):
            cx = 960 + sd * 1500
            s += h.arc(cx, 540, 1180, 180 - 26 if sd > 0 else -26, 180 + 26 if sd > 0 else 26, 3, h.C2, .7)
            s += h.arc(cx, 540, 1150, 180 - 18 if sd > 0 else -18, 180 + 18 if sd > 0 else 18, 1.2, h.C3, .6, "4 8")
            s += h.ticks(cx, 540, 1110, 40, 10, a0=(180 - 18) if sd > 0 else -18, a1=(180 + 18) if sd > 0 else 18, col=h.C2, op=.6, major=5)
        s += f'<line x1="180" y1="540" x2="420" y2="540" stroke="{h.C2}" stroke-opacity=".6"/><line x1="1500" y1="540" x2="1740" y2="540" stroke="{h.C2}" stroke-opacity=".6"/>'
        for i in range(12):
            hh = 10 + (i % 4) * 8; s += f'<rect x="{1540+i*16}" y="{900-hh}" width="10" height="{hh}" fill="url(#gh)" opacity=".9"/>'
        s += f'{h.arc(300, 860, 60, -220, 40, 6, h.C2, .9)}{h.arc(300, 860, 74, 0, 359.9, 1, h.C3, .4)}'
        if h.alert: s += h.arc(300, 860, 60, 40, 70, 6, h.alert, .95)
        s += h.txt(1740, 1004, place, 12, h.C2, .7, "end")
        out += [f'<g filter="url(#glow)">{s}</g>']
    elif design == 'core':
        out += [h.corners(), f'<g filter="url(#glow)">{h.core(1580, 560, spec.get("core_label", "AI"))}</g>',
                f'<g filter="url(#glow)">{h.ring(1580, 560, 250, 9)}</g>', f'<g filter="url(#glow)">{h.readouts(96, 640, rows)}</g>']
    else:
        raise SystemExit(f"hud: unknown design {design!r} (assistant, globe, visor, core)")
    out.append(f'<rect width="{W}" height="{H}" fill="url(#scan)"/></svg>')
    return ''.join(out)


# ------------------------------------------------------------------ KEYNOTE (Apple-inspired)
GRAIN = '<filter id="gr"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0"/></filter>'


def lg(id, stops, x1=0, y1=0, x2=0, y2=1):
    return f'<linearGradient id="{id}" x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}">' + "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops) + "</linearGradient>"


def rg(id, stops, cx=.5, cy=.5, r=.5):
    return f'<radialGradient id="{id}" cx="{cx}" cy="{cy}" r="{r}">' + "".join(f'<stop offset="{o}" stop-color="{c}" stop-opacity="{a}"/>' for o, c, a in stops) + "</radialGradient>"


def keynote(P, design, spec):
    ink, base, deep, pri, viv, bri, cy, pale, glow = (P[k] for k in ('ink', 'base', 'deep', 'primary', 'vivid', 'bright', 'cyan', 'pale', 'glow'))
    dk = lambda t: mix(ink, deep, t)  # dark tints
    defs, body = '', ''
    if design == 'silk':  # broad overlapping sheets sweeping in from the right
        defs = '<filter id="sh" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur in="SourceAlpha" stdDeviation="28"/><feOffset dx="-18" dy="-10"/><feComponentTransfer><feFuncA type="linear" slope=".7"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        cols = [(dk(.45), deep, pri), (dk(.55), viv, mix(bri, WHITE, .4)), (dk(.65), pri, pale), (dk(.4), mix(viv, pri, .5), cy), (dk(.3), bri, glow)]
        for i, (a, b, c) in enumerate(cols):
            defs += lg(f"f{i}", [(0, a, 1), (.6, b, 1), (1, c, 1)], 1, 1, 0, 0)
            body += f'<path filter="url(#sh)" fill="url(#f{i})" transform="translate(480 40) rotate({-34 + i * 11} 2150 1250)" d="M 2150 1250 C 1500 1250 980 980 760 520 C 1250 700 1700 760 2150 700 Z"/>'
        defs += lg("vg", [(0, ink, .9), (.5, ink, .2), (1, ink, 0)], 0, 0, 1, 0)
        body = f'<rect width="{W}" height="{H}" fill="{ink}"/>{body}<rect width="{W}" height="{H}" fill="url(#vg)"/>'
    elif design == 'waves':  # layered dark waves, low in the frame
        defs = '<filter id="ws" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur in="SourceAlpha" stdDeviation="22"/><feOffset dy="-14"/><feComponentTransfer><feFuncA type="linear" slope=".8"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>'
        bands = [(dk(.7), mix(deep, pri, .5)), (dk(.6), pri), (dk(.5), bri), (dk(.4), viv), (dk(.3), pri), (dk(.2), deep)]
        for i, (a, b) in enumerate(bands):
            defs += lg(f"w{i}", [(0, b, 1), (1, a, 1)])
            y0 = 520 + i * 92; amp = 110 - i * 8; ph = i * .9
            pts = " ".join(f"{x},{y0 + math.sin(x / 520 + ph) * amp + math.sin(x / 210 + ph * 2) * 18:.1f}" for x in range(-40, W + 60, 20))
            body += f'<polygon filter="url(#ws)" fill="url(#w{i})" points="-40,{H+40} {pts} {W+60},{H+40}"/>'
        defs += lg("sky", [(0, ink, 1), (1, dk(.35), 1)])
        body = f'<rect width="{W}" height="{H}" fill="url(#sky)"/>{body}'
    elif design == 'line':  # one continuous loop of light
        Pts = []
        for k in range(1201):
            t = k / 1200 * 2 * math.pi
            x0 = 470 * math.sin(t); y0 = 250 * math.sin(t) * math.cos(t)
            Pts.append(f"{1400 + x0 * math.cos(-.32) - y0 * math.sin(-.32):.1f},{580 + x0 * math.sin(-.32) + y0 * math.cos(-.32):.1f}")
        d = "M " + " L ".join(Pts) + " Z"
        defs = lg("ln", [(0, cy, 1), (.45, bri, 1), (1, viv, 1)], 1, 0, 0, 1) + '<filter id="gl" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="26"/></filter><filter id="gl2"><feGaussianBlur stdDeviation="7"/></filter>'
        defs += rg("bk", [(0, dk(.35), 1), (1, ink, 1)], .72, .55, .7)
        body = f'<rect width="{W}" height="{H}" fill="url(#bk)"/><path d="{d}" fill="none" stroke="url(#ln)" stroke-width="40" opacity=".5" filter="url(#gl)"/><path d="{d}" fill="none" stroke="url(#ln)" stroke-width="10" opacity=".85" filter="url(#gl2)"/><path d="{d}" fill="none" stroke="{glow}" stroke-width="2.4" opacity=".95"/>'
    elif design == 'liquid':  # magnifying glass pills over a colour field
        field = ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}" opacity="{a}" filter="url(#bl)"/>' for x, y, r, c, a in
                        [(1500, 300, 520, viv, 1), (1780, 820, 460, pri, 1), (1150, 950, 420, cy, .7), (1450, 600, 260, pale, .8), (300, 1000, 500, deep, 1)])
        defs = f'<filter id="bl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="110"/></filter><g id="field"><rect width="{W}" height="{H}" fill="{ink}"/>{field}</g>'
        defs += lg("lv", [(0, ink, .85), (.45, ink, .35), (1, ink, 0)], 0, 0, 1, 0)
        body = '<use href="#field"/><rect width="1920" height="1080" fill="url(#lv)"/>'
        for i, (x, y, w, h) in enumerate([(1300, 230, 520, 210), (1500, 520, 360, 360), (1290, 790, 480, 180)]):
            rr = min(w, h) / 2; cx_, cy_ = x + w / 2, y + h / 2
            defs += f'<clipPath id="cp{i}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rr}"/></clipPath>' + lg(f"rim{i}", [(0, WHITE, .75), (.3, WHITE, .08), (.7, WHITE, .02), (1, WHITE, .45)], 0, 0, 1, 1) + lg(f"tint{i}", [(0, WHITE, .16), (1, WHITE, .02)])
            body += f'<g clip-path="url(#cp{i})"><use href="#field" transform="translate({cx_} {cy_}) scale(1.35) translate({-cx_-30} {-cy_+20})"/><rect x="{x}" y="{y}" width="{w}" height="{h}" fill="url(#tint{i})"/></g>'
            body += f'<rect x="{x+1}" y="{y+1}" width="{w-2}" height="{h-2}" rx="{rr-1}" fill="none" stroke="url(#rim{i})" stroke-width="2.5"/>'
    elif design == 'bloom':  # keynote colour bloom, low right
        defs = '<filter id="bb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="90"/></filter>'
        bl = "".join(f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="{c}" opacity="{a}" filter="url(#bb)" style="mix-blend-mode:screen"/>' for x, y, rx, ry, c, a in
                     [(1500, 1080, 620, 300, viv, 1), (1650, 1040, 380, 220, cy, .85), (1350, 1020, 300, 180, pale, .7), (1750, 1100, 520, 260, pri, .9)])
        body = f'<rect width="{W}" height="{H}" fill="{mix(ink, "#000000", .4)}"/>{bl}<ellipse cx="1520" cy="1010" rx="420" ry="34" fill="{glow}" opacity=".35" filter="url(#bb)"/>'
    elif design == 'petals':  # translucent petals fanning from off-frame
        defs = '<filter id="pb"><feGaussianBlur stdDeviation="1.2"/></filter>'
        body = f'<rect width="{W}" height="{H}" fill="{ink}"/>'
        for i in range(14):
            t = i / 13; c = [viv, pri, bri, cy, pale][i % 5]
            defs += lg(f"p{i}", [(0, c, 0), (.6, c, .32), (1, c, .7)], 0, 0, 1, 0)
            body += f'<g transform="rotate({-4 + t * 84} 2000 1150)"><ellipse cx="1350" cy="1150" rx="680" ry="120" fill="url(#p{i})" style="mix-blend-mode:screen" filter="url(#pb)"/></g>'
    elif design == 'sheen':  # one vast polished curved surface
        defs = lg("s1", [(0, ink, 1), (.5, dk(.6), 1), (.78, pri, 1), (.86, mix(pale, WHITE, .4), 1), (.9, pri, 1), (1, dk(.45), 1)], 0, 0, 1, 1)
        defs += lg("s2", [(0, ink, 0), (1, ink, 1)], 1, 0, 0, 0)
        body = f'<rect width="{W}" height="{H}" fill="{ink}"/><path d="M 700 1180 C 1000 700 1500 260 2100 -120 L 2100 1180 Z" fill="url(#s1)"/><path d="M 1100 1180 C 1350 820 1700 520 2100 300 L 2100 1180 Z" fill="{ink}" opacity=".55"/><rect width="{W}" height="{H}" fill="url(#s2)" opacity=".5"/>'
    elif design == 'orbit':  # thin rings and one lit point
        defs = rg("sp", [(0, mix(pale, WHITE, .4), 1), (.25, bri, 1), (.7, viv, 1), (1, dk(.45), 1)], .35, .3, .8) + rg("og", [(0, bri, .9), (.4, viv, .3), (1, viv, 0)]) + '<filter id="ob"><feGaussianBlur stdDeviation="10"/></filter>'
        rings = "".join(f'<ellipse cx="1480" cy="560" rx="{260 + k * 120}" ry="{90 + k * 42}" fill="none" stroke="{pale}" stroke-opacity="{.38 - k * .05}" stroke-width="{1.4 if k else 2}" transform="rotate(-14 1480 560)"/>' for k in range(7))
        body = f'<rect width="{W}" height="{H}" fill="{ink}"/><circle cx="1480" cy="560" r="520" fill="url(#og)" opacity=".55"/>{rings}<circle cx="1480" cy="560" r="120" fill="url(#sp)"/><circle cx="1870" cy="470" r="9" fill="{glow}"/><circle cx="1870" cy="470" r="22" fill="{bri}" filter="url(#ob)"/>'
    else:
        raise SystemExit(f"keynote: unknown design {design!r} (silk, waves, line, liquid, bloom, petals, sheen, orbit)")
    return f'<svg width="{W}" height="{H}" viewBox="0 0 {W} {H}"><defs>{GRAIN}{defs}</defs>{body}<rect width="{W}" height="{H}" filter="url(#gr)"/></svg>'


DESIGNS = {
    'hud': ['assistant', 'globe', 'visor', 'core'],
    'keynote': ['silk', 'waves', 'line', 'liquid', 'bloom', 'petals', 'sheen', 'orbit'],
}
