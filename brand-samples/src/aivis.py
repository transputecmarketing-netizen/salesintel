"""Cover visuals for the AI-tools series."""
import math
import random
from common import _id

AMBER, RED = "#F5A623", "#E5484D"


def agent_arms(W=174, H=120):
    """A model at the centre with tool 'hands'; one injected instruction arrives from outside."""
    cx, cy = W / 2, H / 2
    o = [f'<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" style="display:block;overflow:visible">']
    tools = ["Mail", "Files", "Code", "Calendar", "Browser", "Chat", "Database", "Payments"]
    R = 50
    for k, t in enumerate(tools):
        a = math.radians(-90 + k * 45 + 22.5)
        x, y = cx + R * 1.45 * math.cos(a), cy + R * 0.95 * math.sin(a)
        hot = (k == 1)
        o.append(f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="url(#gd)" stroke-width=".9" stroke-opacity="{1 if hot else .6}"/>')
        o.append(f'<rect x="{x-12:.1f}" y="{y-5.6:.1f}" width="24" height="11.2" rx="2.8" fill="{"rgba(245,166,35,.16)" if hot else "rgba(255,255,255,.07)"}" stroke="{AMBER if hot else "rgba(255,255,255,.28)"}" stroke-width=".4"/>')
        o.append(f'<text x="{x:.1f}" y="{y+1.3:.1f}" text-anchor="middle" font-family="JetBrains Mono" font-size="3.3" letter-spacing=".3" fill="{AMBER if hot else "#CAD5E2"}">{t.upper()}</text>')
    for r, op in ((11, .5), (17, .18), (24, .09)):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="#00B8DB" stroke-opacity="{op}" stroke-width=".4"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="8.6" fill="url(#gd)"/><circle cx="{cx}" cy="{cy}" r="2.4" fill="#0F172B"/>')
    # injected instruction: from outside to the Files arm
    a = math.radians(-90 + 1 * 45 + 22.5)
    fx, fy = cx + R * 1.45 * math.cos(a), cy + R * 0.95 * math.sin(a)
    o.append(f'<path d="M{W-6},{12} C{W-40},{14} {fx+34:.1f},{fy-26:.1f} {fx+9:.1f},{fy-3:.1f}" fill="none" stroke="{RED}" stroke-width=".7" stroke-dasharray="1.6 1.6"/>')
    o.append(f'<rect x="{W-52}" y="3" width="50" height="9" rx="2" fill="rgba(229,72,77,.16)" stroke="{RED}" stroke-width=".4"/>'
             f'<text x="{W-27}" y="8.8" text-anchor="middle" font-family="JetBrains Mono" font-size="2.6" letter-spacing=".25" fill="#FF8A8E">"IGNORE PREVIOUS RULES…"</text></svg>')
    return ''.join(o)


def code_scan(W=174, H=118):
    """Lines of code as bars; a scan beam sweeps down and lands on one flawed line."""
    rnd = random.Random(3)
    gid = _id("cs")
    o = [f'<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" style="display:block;overflow:visible">',
         f'<defs><linearGradient id="{gid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#00B8DB" stop-opacity="0"/><stop offset=".85" stop-color="#00B8DB" stop-opacity=".28"/><stop offset="1" stop-color="#00B8DB" stop-opacity=".9"/></linearGradient></defs>']
    rows, bug = 26, 17
    ys = [4 + i * (H - 8) / rows for i in range(rows)]
    for i, y in enumerate(ys):
        x = 6 + (rnd.choice([0, 0, 6, 12, 18]))
        while x < W - 14:
            w = rnd.choice([8, 12, 16, 22, 30, 14, 10])
            if x + w > W - 8:
                break
            dist = max(0, (bug - i))
            lit = i <= bug
            col = "url(#gh)" if lit and i > bug - 9 else "rgba(255,255,255,.14)"
            op = 1 if lit and i > bug - 9 else 1
            o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{w}" height="2.6" rx="1.3" fill="{col}" fill-opacity="{op}"/>')
            x += w + 3.4
    by = ys[bug]
    o.append(f'<rect x="2" y="{ys[0]-3:.1f}" width="{W-4}" height="{by-ys[0]+6:.1f}" fill="url(#{gid})" fill-opacity=".5"/>')
    o.append(f'<rect x="4" y="{by-1.6:.1f}" width="{W-8}" height="6" rx="1.6" fill="rgba(229,72,77,.18)" stroke="{RED}" stroke-width=".4"/>')
    o.append(f'<rect x="10" y="{by:.1f}" width="46" height="2.6" rx="1.3" fill="{RED}"/><rect x="60" y="{by:.1f}" width="22" height="2.6" rx="1.3" fill="{RED}"/>')
    o.append(f'<text x="{W-6}" y="{by+3.2:.1f}" text-anchor="end" font-family="JetBrains Mono" font-size="2.7" letter-spacing=".3" fill="#FF8A8E">FLAW FOUND · LINE {bug+140}</text></svg>')
    return ''.join(o)


def venn(W=174, H=120):
    """Approved tools versus tools actually in use. The amber crescent is shadow AI."""
    o = [f'<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" style="display:block;overflow:visible">']
    o.append(f'<defs><clipPath id="vc"><circle cx="68" cy="62" r="40"/></clipPath></defs>')
    o.append(f'<circle cx="100" cy="58" r="52" fill="{AMBER}" fill-opacity=".14" stroke="{AMBER}" stroke-width=".5" stroke-dasharray="1.6 1.6"/>')
    o.append(f'<circle cx="68" cy="62" r="40" fill="url(#gd)" fill-opacity=".92"/>')
    rnd = random.Random(8)
    for _ in range(44):
        a, r = rnd.random() * 6.283, math.sqrt(rnd.random())
        x, y = 100 + 50 * r * math.cos(a), 58 + 50 * r * math.sin(a)
        if (abs(x - 132) < 20 and abs(y - 64) < 9) or (abs(x - 52) < 20 and abs(y - 66) < 9):
            continue
        inside_a = (x - 68) ** 2 + (y - 62) ** 2 < 38 ** 2
        o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="1.1" fill="{"#fff" if inside_a else AMBER}" fill-opacity="{.85 if inside_a else .95}"/>')
    o.append('<text x="52" y="64" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="6.4" fill="#fff">Approved</text>'
             '<text x="52" y="70.4" text-anchor="middle" font-family="JetBrains Mono" font-size="2.7" letter-spacing=".3" fill="#E6F6FF">WHAT IT BOUGHT</text>'
             f'<text x="132" y="62" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="6.4" fill="{AMBER}">In use</text>'
             f'<text x="132" y="68.4" text-anchor="middle" font-family="JetBrains Mono" font-size="2.7" letter-spacing=".3" fill="{AMBER}">WHAT STAFF OPENED</text></svg>')
    return ''.join(o)
