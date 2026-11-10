"""Crises Control series: industry playbooks (CCBook) and intelligence reports (CCReport).

Built on the Hot Topics kit, re-skinned at build time into the Crises Control palette, with
its own covers and four crisis-specific page types:
  firsthour()  an incident timeline stamped T+00:00 ... with owners and severity colours
  severity()   a severity ladder: SEV1 red, SEV2 navy, SEV3 blue, SEV4 sky blue (brand palette only)
  messages()   ready-to-send alert templates, set as message cards
  platform()   where Crises Control modules fit each step (closing pages only)
The motif is the dial from the Crises Control badge: a ring of ticks, a blue arc, a red sector.
"""
import math
from rkit import RBook, S

# Official Crises Control brand sheet: #16A1ED #2D9CFA #1179BB #0A3165 #0B223C #FF0000 #F7F6F8 #3A3A3A #000000, Roboto.
# AMBER and GREEN keep their names for the status roles but take brand colours.
INK, PANEL, BLUE, SKY, RED, AMBER, GREEN, NAVY_CC, MUTE = "#0B223C", "#0A3165", "#1179BB", "#16A1ED", "#FF0000", "#2D9CFA", "#F7F6F8", "#0A3165", "#F7F6F8A6"
CONTACT = "+44 (0) 20 8584 1385 &nbsp;·&nbsp; contactus@crises-control.com &nbsp;·&nbsp; www.crises-control.com"
CC = "../../crises-control/assets/"
LOGO = CC + "cc-logo.svg"
MONO = "@font-face{font-family:'Roboto Mono';font-weight:400;src:url(../../crises-control/assets/fonts/robotomono-400.woff2)}@font-face{font-family:'Roboto Mono';font-weight:500;src:url(../../crises-control/assets/fonts/robotomono-500.woff2)}"
SEV = {1: ("SEV 1", RED), 2: ("SEV 2", "#0A3165"), 3: ("SEV 3", BLUE), 4: ("SEV 4", SKY)}
MODULES = {"Ping": "Mass alerting by push, SMS, voice and email, with acknowledgement tracking and escalation on no response.",
           "Incident Manager": "A workspace per incident: team coordination, a single communication log and message templates.",
           "Task Manager": "Digitised procedures: tasks assigned with owners, deadlines and escalation paths.",
           "Control Centre": "A live view of tasks, communications, locations and escalations.",
           "Audit Trail": "Audit & Reporting: incident records, response analysis and task accountability, ready to report.",
           "SOS": "One-touch mobile escalation with GPS location for frontline staff.",
           "CRAiG": "AI assistant that helps users interact with the platform, find information and work through the incident."}

def dial(size=520, ticks=60, arc=(200, 330), red=(330, 352), needle=338, dark=True, fig=None, figw=None):
    """The Crises Control dial: tick ring, a blue arc, a red sector and a needle. Angles in degrees, 0 = top, clockwise."""
    c = size / 2; R = size * .46
    def pt(a, r): a = math.radians(a - 90); return c + r * math.cos(a), c + r * math.sin(a)
    def arcpath(a0, a1, r):
        x0, y0 = pt(a0, r); x1, y1 = pt(a1, r); large = 1 if (a1 - a0) % 360 > 180 else 0
        return f"M{x0:.1f} {y0:.1f} A{r:.1f} {r:.1f} 0 {large} 1 {x1:.1f} {y1:.1f}"
    base = "rgba(255,255,255,.14)" if dark else "#3A3A3A26"
    out = f'<circle cx="{c}" cy="{c}" r="{R}" fill="none" stroke="{base}" stroke-width="{size*.018:.1f}"/>'
    out += f'<path d="{arcpath(*arc, R)}" fill="none" stroke="{BLUE}" stroke-width="{size*.022:.1f}" stroke-linecap="butt"/>'
    out += f'<path d="{arcpath(*red, R)}" fill="none" stroke="{RED}" stroke-width="{size*.022:.1f}"/>'
    for i in range(ticks):
        a = i * 360 / ticks; big = i % 5 == 0
        x0, y0 = pt(a, R * (.80 if big else .85)); x1, y1 = pt(a, R * .9)
        col = ("rgba(255,255,255,.55)" if big else "rgba(255,255,255,.22)") if dark else ("#0B223C" if big else "#3A3A3A55")
        out += f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{col}" stroke-width="{2.2 if big else 1.2}" stroke-linecap="round"/>'
    nx, ny = pt(needle, R * .97)
    out += f'<line x1="{c}" y1="{c}" x2="{nx:.1f}" y2="{ny:.1f}" stroke="{RED}" stroke-width="3" stroke-linecap="round" opacity=".0"/>'
    out += f'<circle cx="{nx:.1f}" cy="{ny:.1f}" r="{size*.016:.1f}" fill="{RED}"/>'
    svg = f'<svg width="100%" viewBox="0 0 {size} {size}" style="display:block">{out}</svg>'
    if fig:
        fw = figw or 62
        th = "dark" if dark else "light"
        src = f"{CC}ind/{th}/{fig[4:]}.svg" if fig.startswith("ind:") else f"{CC}hl/{th}/{fig}.png"
        svg += f'<img src="{src}" style="position:absolute;left:50%;top:50%;width:{fw}%;transform:translate(-50%,-52%)">'
    return f'<div style="position:relative">{svg}</div>'

INDART = {"Financial Services and Insurance": "finance", "Property, Housing and Facilities": "property", "Retail": "retail",
          "Transport and Logistics": "transport", "Hospitality": "hospitality", "Healthcare": "healthcare"}

def strip(dark=True, labels=("T+00:00", "T+00:05", "T+00:15", "T+01:00", "T+04:00")):
    col = "rgba(255,255,255,.55)" if dark else "#3A3A3ABF"
    line = "rgba(255,255,255,.18)" if dark else "#3A3A3A26"
    n = len(labels)
    marks = "".join(f'<div style="position:absolute;left:{i/(n-1)*100}%;top:0;transform:translateX(-50%);text-align:center"><div style="width:{3.2 if i==0 else 2.2}mm;height:{3.2 if i==0 else 2.2}mm;border-radius:50%;margin:{0 if i==0 else .5}mm auto 0;background:{RED if i==0 else (SKY if dark else BLUE)}"></div><div style="font-family:JBM;font-size:6.6pt;color:{RED if i==0 else col};margin-top:2mm;letter-spacing:.04em;white-space:nowrap">{l}</div></div>' for i, l in enumerate(labels))
    return f'<div style="position:relative;height:11mm"><div style="position:absolute;left:0;right:0;top:1.5mm;border-top:.35mm solid {line}"></div>{marks}</div>'


class CCBook(RBook):
    KIND = "Crisis playbook"

    def __init__(s, short, num, fig, industry, week):
        super().__init__(short, num, "dial", fig)
        s.series, s.industry, s.week = f"Crises Control · {industry}", industry, week

    # ------------------------------------------------------------- build: re-skin to the Crises Control palette
    def build(s, path):
        import ccextra
        if not getattr(s, '_extra', False): s._extra = True; ccextra.add_pages(s)
        super().build(path)
        h = open(path, encoding="utf8").read()
        for a, b in [("#0A0F1A", INK), ("#111A2B", PANEL), ("#2C72DB", BLUE), ("#3B8BFF", SKY), ("rgba(44,114,219", "rgba(17,121,187"), ("rgba(59,139,255", "rgba(22,161,237"), ("rgba(174,186,204", "rgba(247,246,248"),
                     ("#F4F6FA", "#F7F6F8"), ("#3A4559", "#3A3A3A"), ("#6B7A90", "#3A3A3ABF"), ("#E3E8F0", "#3A3A3A26"), ("#AEBACC", "#F7F6F8B3"), ("#C9D3E3", "#3A3A3A40"), ("#F3F6F9", "#F7F6F8"),
                     ("../../assets/fonts/poppins-600.woff2", "../../crises-control/assets/fonts/roboto-700.woff2"), ("../../assets/fonts/poppins-", "../../crises-control/assets/fonts/roboto-"), ("Poppins", "Roboto"), ("font-family:JBM", "font-family:'Roboto Mono'"),
                     ('src="hl/', f'src="{CC}hl/'), ("url(art2/", f"url({CC}art/"), ("url(art/", f"url({CC}art/")]:
            h = h.replace(a, b)
        wm = lambda c: f'<span style="display:flex;align-items:center;gap:2.6mm"><img src="{LOGO}" style="height:8mm"><span style="font-family:JBM;font-size:7pt;letter-spacing:.2em;font-weight:500;color:{c}">CRISES CONTROL</span></span>'
        h = h.replace('<img src="../../assets/logo-blue.svg" style="height:3.4mm">', wm(INK)).replace('<img src="../../assets/logo-white.svg" style="height:3.4mm">', wm("#FFFFFF"))
        h = h.replace("../../assets/logo-white.svg", LOGO).replace("../../assets/logo-blue.svg", LOGO)
        h = h.replace("<style>", "<style>" + MONO + ".run{top:9mm!important}.run span{font-family:JBM;letter-spacing:.12em!important}.folio span:first-child{font-family:JBM;letter-spacing:.04em}", 1)
        h = h.replace("font-family:JBM", "font-family:'Roboto Mono'")
        h = h.replace("transputec.com", "crises-control.com").replace("Transputec Ltd", "Crises Control").replace("Transputec", "Crises Control")
        open(path, "w", encoding="utf8").write(h)

    # ------------------------------------------------------------- covers
    def art_cover(s, kicker, t1, t2, lede, tag=None):
        s._wrap(f'''<div style="position:absolute;inset:0;background:radial-gradient(120% 80% at 80% 22%,#0A3165 0%,{INK} 58%)"></div>
        <div style="position:absolute;right:-30mm;top:40mm;width:170mm">{dial(fig=('ind:' + INDART[s.industry]) if s.industry in INDART else s.fig, figw=74)}</div>
        <div style="position:absolute;left:18mm;top:60mm;width:74mm;border-left:.4mm solid rgba(255,255,255,.16);padding-left:4mm;font-family:JBM;font-size:7pt;line-height:2.15;color:rgba(255,255,255,.7)">
          <div><span style="color:{RED}">●</span> T+00:00 &nbsp;Incident declared</div><div><span style="color:{SKY}">●</span> T+00:02 &nbsp;Alert sent · push, SMS, voice</div><div><span style="color:{AMBER}">●</span> T+01:30 &nbsp;Escalated · no response</div><div><span style="color:{GREEN}">●</span> T+04:10 &nbsp;Team acknowledged</div></div>
        <img src="{LOGO}" style="position:absolute;left:18mm;top:16mm;height:19mm">
        <div style="position:absolute;left:18mm;top:40mm;font-family:JBM;font-size:7pt;letter-spacing:.16em;color:{SKY};text-transform:uppercase">{s.KIND} · No. {s.num:02d}</div>
        <div style="position:absolute;left:18mm;top:45mm;font-family:JBM;font-size:7pt;letter-spacing:.16em;color:rgba(255,255,255,.55);text-transform:uppercase">Week of {s.week}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:52mm"><span style="display:inline-block;padding:1.4mm 3.6mm;border:.3mm solid {RED};color:#fff;border-radius:99px;font-size:7.4pt;font-weight:600;letter-spacing:.14em;text-transform:uppercase"><span style="display:inline-block;width:1.8mm;height:1.8mm;border-radius:50%;background:{RED};margin-right:2mm;vertical-align:.2mm"></span>{s.industry}</span>
        <div style="font-weight:600;font-size:54pt;line-height:.98;letter-spacing:-.055em;margin-top:7mm">{t1}<br><span style="color:{SKY}">{t2}</span></div>
        <div style="font-weight:300;font-size:12.5pt;line-height:1.5;color:rgba(255,255,255,.78);margin-top:6mm;width:158mm">{lede}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:26mm">{strip()}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:13mm;display:flex;justify-content:space-between;font-family:JBM;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.5)"><span>Prepare · Communicate · Protect</span><span>www.crises-control.com</span></div>''', True, folio=False)

    def foreword(s, title, paras, sign="The Crises Control team"):
        p = "".join(f'<p class="tx" style="font-size:11pt;line-height:1.7;margin-top:{0 if i==0 else 5}mm">{t}</p>' for i, t in enumerate(paras))
        s._wrap(f'''<div class="ey">Foreword</div><h1 style="margin-top:4mm;width:170mm">{title}</h1>
        <div style="margin-top:12mm;width:160mm">{p}</div>
        <div style="margin-top:12mm;display:flex;gap:5mm;align-items:center"><img src="{LOGO}" style="width:16mm"><div><div style="font-weight:600;font-size:11pt">{sign}</div><div class="tx" style="font-size:9pt">Crises Control</div></div></div>''', sec="Foreword")

    def art_back(s, title, lede, cta="Request a demo", next_title=""):
        nx = f'<div style="margin-top:12mm;padding-top:5mm;border-top:.3mm solid rgba(255,255,255,.18);width:150mm"><div style="font-family:JBM;font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:{SKY}">{"Read the companion report" if "report" in next_title.lower() else "Next in the series"}</div><div style="font-size:11pt;margin-top:2.4mm;color:#fff">{next_title}</div></div>' if next_title else ""
        s._wrap(f'''<div style="position:absolute;inset:0;background:radial-gradient(110% 70% at 20% 85%,#0A3165 0%,{INK} 60%)"></div>
        <div style="position:absolute;right:-62mm;top:-48mm;width:190mm;opacity:.9">{dial(arc=(150, 300), red=(300, 322), needle=311)}</div>
        <div style="position:absolute;left:18mm;right:18mm;top:96mm"><img src="{LOGO}" style="height:24mm">
        <div style="font-weight:600;font-size:34pt;line-height:1.05;letter-spacing:-.04em;margin-top:16mm">{title}</div>
        <div style="font-weight:300;font-size:12.5pt;line-height:1.55;color:rgba(255,255,255,.78);margin-top:7mm;width:150mm">{lede}</div>
        <div style="margin-top:6mm;width:150mm;font-size:10pt;line-height:1.5;color:#fff">Crises Control is an <b>Operational Incident Coordination Platform</b>: alert, coordinate, execute, see and prove, in one place.</div>
        <div style="margin-top:9mm;display:flex;gap:4mm"><span style="background:{RED};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:600;font-size:10pt">Request a tailored demo</span><span style="border:.3mm solid rgba(255,255,255,.4);border-radius:99px;padding:3.6mm 7mm;font-size:10pt">www.crises-control.com</span></div><div style="margin-top:7mm;font-family:JBM;font-size:7.6pt;letter-spacing:.06em;color:rgba(247,246,248,.75)">{CONTACT}</div>{nx}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:14mm;font-family:JBM;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.55)">Crises Control · {s.KIND} No. {s.num:02d}</div>''', True, folio=False)

    def opener(s, num, word, line, items):
        it = "".join(f'<div style="display:flex;gap:4mm;padding:4mm 0;border-top:.3mm solid rgba(255,255,255,.14);font-size:10pt"><span style="font-family:JBM;color:{SKY};width:10mm">{a}</span><span>{b}</span></div>' for a, b in items)
        s._wrap(f'''<div style="position:absolute;right:-50mm;top:-30mm;width:190mm;opacity:.55">{dial(arc=(int(num or 1)*60, int(num or 1)*60+120), red=(int(num or 1)*60+120, int(num or 1)*60+140), needle=int(num or 1)*60+130)}</div>
        <div style="position:absolute;left:18mm;right:18mm;top:100mm"><div style="font-family:JBM;font-size:8pt;letter-spacing:.18em;color:{RED};text-transform:uppercase">Part {num}</div>
        <div style="font-weight:600;font-size:60pt;line-height:.98;letter-spacing:-.05em;margin-top:5mm">{word}</div>
        <div style="font-weight:300;margin-top:8mm;width:160mm;font-size:14pt;line-height:1.45;color:rgba(255,255,255,.85)">{line}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:30mm">{it}</div>''', True, f"Part {num}")

    # ------------------------------------------------------------- crisis page types
    def firsthour(s, ey, title, lede, rows, sec):
        """rows: (time, title, text, owner, sev) where sev is 1-4 for the dot colour."""
        r = "".join(f'''<div style="display:grid;grid-template-columns:24mm 7mm 1fr 34mm;gap:3mm;padding:4.6mm 0;border-top:.25mm solid #E3E8F0;align-items:start">
          <div style="font-family:JBM;font-size:10pt;font-weight:500;color:{INK}">{t}</div><div style="padding-top:1.2mm"><div style="width:3mm;height:3mm;border-radius:50%;background:{SEV[sv][1]}"></div></div>
          <div><div style="font-weight:600;font-size:11pt">{h}</div><div class="tx" style="margin-top:1.2mm;font-size:9.4pt">{x}</div></div>
          <div style="font-family:JBM;font-size:7.6pt;color:#6B7A90;text-transform:uppercase;letter-spacing:.06em;padding-top:.8mm">{o}</div></div>''' for t, h, x, o, sv in rows)
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:9mm;display:grid;grid-template-columns:24mm 7mm 1fr 34mm;gap:3mm;padding-bottom:2mm" class="lab"><span>Clock</span><span></span><span>Action</span><span>Owner</span></div><div style="border-bottom:.25mm solid #E3E8F0">{r}</div>', sec=sec)

    def severity(s, ey, title, lede, levels, sec):
        """levels: (n, name, criteria, who, channels) for n in 1..4."""
        c = "".join(f'''<div style="display:grid;grid-template-columns:30mm 1fr 1fr;gap:6mm;padding:6mm 0;border-top:.25mm solid #E3E8F0">
          <div><div style="display:inline-block;font-family:JBM;font-size:9pt;font-weight:500;color:#fff;background:{SEV[n][1]};border-radius:2mm;padding:1.4mm 3mm">{SEV[n][0]}</div><div style="font-weight:600;font-size:11pt;margin-top:3mm">{nm}</div></div>
          <div><div class="lab">Triggers</div><div class="tx" style="margin-top:1.4mm;font-size:9.6pt">{cr}</div></div>
          <div><div class="lab">Who is alerted, how</div><div class="tx" style="margin-top:1.4mm;font-size:9.6pt">{wh}<br><span style="font-family:JBM;font-size:8pt;color:{BLUE}">{ch}</span></div></div></div>''' for n, nm, cr, wh, ch in levels)
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:9mm;border-bottom:.25mm solid #E3E8F0">{c}</div>', sec=sec)

    def messages(s, ey, title, lede, msgs, sec):
        """msgs: (channel, audience, text, note). Rendered as message cards, with a character count for SMS."""
        def card(ch, au, tx, nt):
            cnt = f'<span style="font-family:JBM;font-size:7pt;color:#6B7A90">{len(tx)} chars</span>' if ch.upper().startswith("SMS") else ""
            return f'''<div style="border:.3mm solid #E3E8F0;border-radius:4mm;padding:5mm 6mm;break-inside:avoid;margin-bottom:5mm">
              <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-family:JBM;font-size:7.4pt;letter-spacing:.12em;color:{RED};text-transform:uppercase">{ch} · {au}</span>{cnt}</div>
              <div style="margin-top:3mm;background:#F3F6F9;border-radius:3.4mm 3.4mm 3.4mm 1mm;padding:4mm 5mm;font-size:9.8pt;line-height:1.5;color:{INK}">{tx}</div>
              {f'<div class="tx" style="margin-top:2.4mm;font-size:8.6pt">{nt}</div>' if nt else ''}</div>'''
        s._wrap(s._hd(ey, title, lede) + '<div style="margin-top:9mm;columns:2;column-gap:6mm">' + "".join(card(*m) for m in msgs) + "</div>", sec=sec)

    def platform(s, title, lede, rows, sec="Where Crises Control fits"):
        """rows: (step, module) where module is a key of MODULES. Closing pages only."""
        r = "".join(f'''<div style="display:grid;grid-template-columns:1fr 46mm;gap:8mm;padding:5mm 0;border-top:.25mm solid rgba(255,255,255,.14)"><div style="font-size:10.4pt;line-height:1.5">{st}</div>
          <div><div style="font-family:JBM;font-size:8.4pt;color:{SKY};letter-spacing:.06em">{m}</div><div style="font-size:8.2pt;line-height:1.45;color:{MUTE};margin-top:1mm">{MODULES[m]}</div></div></div>''' for st, m in rows)
        s._wrap(s._hd("Platform", title, lede) + f'<div style="margin-top:9mm;border-bottom:.25mm solid rgba(255,255,255,.14)">{r}</div>', True, sec,
                bg=f'<div style="position:absolute;right:-78mm;top:-78mm;width:170mm;opacity:.4">{dial()}</div>')


class CCReport(CCBook):
    KIND = "Intelligence report"

    def rep_cover(s, kicker, title, sub, dateline=None):
        s._wrap(f'''<div style="position:absolute;left:0;right:0;top:0;height:5mm;background:linear-gradient(90deg,{NAVY_CC},{BLUE} 70%,{RED} 70%,{RED})"></div>
        <img src="{LOGO}" style="position:absolute;left:18mm;top:15mm;height:19mm">
        <div style="position:absolute;right:18mm;top:17mm;text-align:right;font-family:JBM;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:#6B7A90">{s.KIND} · No. {s.num:02d}<div style="margin-top:1.6mm;color:{RED}">Week of {s.week}</div></div>
        <div style="position:absolute;left:30mm;right:30mm;top:38mm">{dial(dark=False, fig=('ind:' + INDART[s.industry]) if s.industry in INDART else s.fig, figw=80)}</div>
        <div style="position:absolute;left:18mm;right:18mm;top:192mm"><span style="font-family:JBM;font-size:7.4pt;letter-spacing:.16em;text-transform:uppercase;color:{BLUE}">{s.industry} · {kicker}</span>
        <div style="font-weight:600;font-size:38pt;line-height:1.03;letter-spacing:-.045em;margin-top:5mm;color:{INK}">{title}</div>
        <div class="lede" style="margin-top:6mm;width:165mm;font-size:12pt">{sub}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:13mm;display:flex;justify-content:space-between;font-family:JBM;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:#6B7A90;border-top:.25mm solid #E3E8F0;padding-top:4mm"><span>Evidence-based · Every figure sourced</span><span>www.crises-control.com</span></div>''', folio=False)

    def rep_back(s, title, lede, cta="Request a demo", companion=""):
        cp = f'<div style="margin-top:12mm;padding-top:5mm;border-top:.25mm solid #E3E8F0;width:150mm"><div style="font-family:JBM;font-size:6.8pt;letter-spacing:.16em;text-transform:uppercase;color:{RED}">Put it into practice</div><div style="font-size:11pt;margin-top:2.4mm">{companion}</div></div>' if companion else ""
        s._wrap(f'''<div style="position:absolute;right:-30mm;top:-30mm;width:150mm">{dial(dark=False, arc=(120, 280), red=(280, 300), needle=290)}</div>
        <div style="position:absolute;left:18mm;right:18mm;top:120mm"><img src="{LOGO}" style="height:22mm">
        <div style="font-weight:600;font-size:32pt;line-height:1.06;letter-spacing:-.04em;margin-top:12mm;color:{INK}">{title}</div>
        <div class="lede" style="margin-top:7mm;width:150mm">{lede}</div>
        <div style="margin-top:6mm;width:150mm;font-size:10pt;line-height:1.5;color:#0B223C">Crises Control is an <b>Operational Incident Coordination Platform</b>: alert, coordinate, execute, see and prove, in one place.</div>
        <div style="margin-top:9mm;display:flex;gap:4mm"><span style="background:{RED};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:600;font-size:10pt">Request a tailored demo</span><span style="border:.3mm solid #C9D3E3;border-radius:99px;padding:3.6mm 7mm;font-size:10pt">www.crises-control.com</span></div><div style="margin-top:7mm;font-family:JBM;font-size:7.6pt;letter-spacing:.06em;color:#3A3A3A">{CONTACT}</div>{cp}</div>
        <div style="position:absolute;left:0;right:0;bottom:0;height:5mm;background:linear-gradient(90deg,{NAVY_CC},{BLUE} 70%,{RED} 70%,{RED})"></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:12mm;font-family:JBM;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:#6B7A90">Crises Control · {s.KIND} No. {s.num:02d}</div>''', folio=False)


# Framework-aligned practical tools, platform pages and final call to action (see ccprac.py).
import ccprac as _ccprac
_ccprac.attach(CCBook)
CCReport.rep_back = lambda s, title="", lede="", cta="", companion="": _ccprac.cta_page(s, False, companion)
