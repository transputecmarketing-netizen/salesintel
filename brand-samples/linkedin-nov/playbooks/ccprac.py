"""Practical tools, platform pages and the final call to action for the Crises Control playbooks.

Everything here follows the Crises Control Company Operating Framework (V4):
category, positioning statement, incident lifecycle, module purposes, discovery stages and demonstration flow.
Page types are attached to CCBook at import, so writers call them as b.raci(...), b.escalation(...) and so on.
"""
import io, qrcode, qrcode.image.svg

INK, NAVY2, BLUE, SKY, RED, GREY, LIGHT = "#0B223C", "#0A3165", "#1179BB", "#16A1ED", "#FF0000", "#3A3A3A", "#F7F6F8"
LINE, LINE_D = "#3A3A3A26", "rgba(247,246,248,.16)"
MONO = "font-family:'Roboto Mono'"

# Framework, Section 7: one connected lifecycle. Verbs from Section 11 (product structure).
LIFE = [("SOS", "Escalate", "Frontline staff report an incident in one touch from a mobile device."),
        ("Ping", "Start", "Alerting and activation: reach people and collect acknowledgements and responses."),
        ("Incident Manager", "Coordinate", "Activate the incident, assign roles, control communication and keep the timeline."),
        ("Task Manager", "Execute", "Assign actions, track completion and escalate what stalls, with clear accountability."),
        ("Control Centre", "Operate", "Real-time view of incidents, timelines, task status and assets."),
        ("Audit & Reporting", "Prove", "Incident records, response analysis and task accountability, ready to report."),
        ("CRAiG", "Assist", "AI assistant that helps users find information and work through the incident.")]
ALIAS = {"Audit Trail": "Audit & Reporting"}
PILLARS = [("Alerting and activation", "Reach the right people immediately."),
           ("Operational coordination", "Structure communication and response activities."),
           ("Execution and visibility", "Track tasks, responsibilities and progress."),
           ("Proof and accountability", "Create a complete, defensible operational record.")]
POSITIONING = ("Crises Control helps organisations maintain operational control during incidents by combining alerting, "
               "coordination, execution, visibility and accountability in one platform.")

LANDING = {"Financial Services and Insurance": "https://www.crises-control.com/operational-resilience-software-for-financial-services/",
           "Property, Housing and Facilities": "https://www.crises-control.com/property-management-incident-management-software/",
           "Retail": "https://www.crises-control.com/retail-incident-management-software/",
           "Transport and Logistics": "https://www.crises-control.com/incident-management-software-for-transport-and-logistics/",
           "Hospitality": "https://www.crises-control.com/hospitality-crisis-management-software/",
           "Healthcare": "https://www.crises-control.com/healthcare-incident-management-software/"}

# Framework, Section 9: demonstrations follow the incident lifecycle. Industry wording per step.
DEMO = {
 "Financial Services and Insurance": dict(title="Watch a payments outage<br>run end to end.", steps=[
   "A branch colleague reports customers cannot pay by card.", "The incident team and executives are alerted; acknowledgements come back by role.",
   "Card payments is declared against its impact tolerance; roles and the bridge are set.", "Workarounds, customer messages and the supervisor notification become owned tasks.",
   "The executive watches services, tasks and time remaining against tolerance.", "The timeline for the self-assessment and the regulator is produced.",
   "CRAiG answers who has not responded and what remains outstanding."]),
 "Property, Housing and Facilities": dict(title="Watch a night-time fire<br>run end to end.", steps=[
   "A concierge raises a fire alarm alert from the building, with location.", "Residents, the duty manager and contractors are alerted; acknowledgements come back by flat.",
   "The incident is activated, roles assigned and the evacuation decision logged.", "Welfare checks for residents with assistance needs become owned tasks.",
   "The duty manager sees buildings, residents reached and jobs outstanding.", "A defensible record of every message and decision is produced.",
   "CRAiG lists the flats that have not responded."]),
 "Retail": dict(title="Watch a multi-store outage<br>run end to end.", steps=[
   "A store manager reports tills down, with location.", "Store managers and regional managers are alerted; each store acknowledges.",
   "Head office activates the incident and assigns store, regional and head office roles.", "Fallback, customer messaging and cash procedures become tasks in every store.",
   "Head office sees which stores are trading, closed or at risk.", "The incident timeline is produced for insurers and the review.",
   "CRAiG shows which stores have overdue tasks."]),
 "Transport and Logistics": dict(title="Watch a hub power loss<br>run end to end.", steps=[
   "A depot supervisor reports a power loss, with location.", "Drivers, depots and partners are alerted; drivers check in.",
   "The duty manager activates the incident and assigns network roles.", "Rerouting, customer updates and welfare checks become owned tasks.",
   "Operations sees sites, drivers, vehicles and actions outstanding.", "The response record is produced for partners, insurers and regulators.",
   "CRAiG shows which drivers have not checked in."]),
 "Hospitality": dict(title="Watch a venue lockdown<br>run end to end.", steps=[
   "A door supervisor raises a lockdown alert in one touch.", "Every member of staff on shift across the venue is alerted and acknowledges.",
   "The duty manager activates the incident and assigns roles by area.", "Lockdown, guest communication and head count become owned tasks.",
   "Head office sees every venue, area secured and staff accounted for.", "A timeline of the first fifteen minutes is produced.",
   "CRAiG lists the areas that have not confirmed they are secure."]),
 "Healthcare": dict(title="Watch a pathology outage<br>run end to end.", steps=[
   "A laboratory manager reports a system outage, with location.", "On-call, clinical and digital leads are alerted; call-in responses come back.",
   "The incident is declared, roles assigned and partners added.", "Downtime procedures in each department become owned tasks.",
   "The incident team sees services affected, staff mobilised and actions outstanding.", "The record for EPRR assurance and the after-action review is produced.",
   "CRAiG shows which downtime actions are overdue."]),
}

def _chip(text, bg=None, fg="#fff", border=None):
    b = f"border:.3mm solid {border};" if border else ""
    return f'<span style="display:inline-block;{MONO};font-size:6.8pt;letter-spacing:.06em;padding:.8mm 2mm;border-radius:1.4mm;{b}background:{bg or "transparent"};color:{fg}">{text}</span>'

def _qr(url, px=96, dark="#0B223C"):
    img = qrcode.make(url, image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=1)
    buf = io.BytesIO(); img.save(buf); s = buf.getvalue().decode()
    s = s[s.index("<svg"):].replace("<svg ", f'<svg style="width:{px}px;height:{px}px;display:block;background:#fff;border-radius:6px;padding:4px" ', 1)
    return s.replace('fill="#000000"', f'fill="{dark}"').replace("#000000", dark)


# ---------------------------------------------------------------- practical page types
def raci(s, ey, title, lede, roles, rows, sec, note=""):
    """rows: (activity, [code per role]) with codes R, A, C, I or ''."""
    n = len(roles); cols = f"50mm repeat({n},1fr)"
    sty = {"R": (BLUE, "#fff", None), "A": (INK, "#fff", None), "C": (None, BLUE, BLUE), "I": (None, GREY, "#3A3A3A66")}
    head = f'<div style="display:grid;grid-template-columns:{cols};gap:2mm;align-items:end;padding-bottom:2mm"><span class="lab">Activity</span>' + "".join(f'<span class="lab" style="text-align:center;line-height:1.3">{r}</span>' for r in roles) + "</div>"
    body = "".join(f'''<div style="display:grid;grid-template-columns:{cols};gap:2mm;align-items:center;padding:2.6mm 0;border-top:.25mm solid {LINE}"><div style="font-size:9pt;line-height:1.35;color:{INK}">{a}</div>'''
                   + "".join(f'<div style="text-align:center">{_chip(c, *sty[c]) if c in sty else "<span style=color:#3A3A3A55>·</span>"}</div>' for c in codes) + "</div>" for a, codes in rows)
    leg = " &nbsp; ".join(f'{_chip(k, *sty[k])} <span style="font-size:8pt;color:{GREY}">{v}</span>' for k, v in [("R", "Responsible: does the work"), ("A", "Accountable: owns the decision"), ("C", "Consulted"), ("I", "Informed")])
    nt = f'<div style="margin-top:5mm;padding:4mm 5mm;border-left:1mm solid {BLUE};background:{LIGHT};font-size:9.4pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:7mm">{head}<div style="border-bottom:.25mm solid {LINE}">{body}</div></div><div style="margin-top:4mm;line-height:2">{leg}</div>{nt}', sec=sec)

def escalation(s, ey, title, lede, levels, sec, note=""):
    """levels: (level name, trigger, who is alerted, who decides, escalate-if condition or '')."""
    cards = ""
    for i, (lv, trig, who, dec, esc) in enumerate(levels):
        col = [RED, NAVY2, BLUE, SKY, GREY][min(i, 4)]
        cards += f'''<div style="display:grid;grid-template-columns:30mm 1fr 1fr 1fr;gap:5mm;border:.3mm solid {LINE};border-left:1.6mm solid {col};border-radius:2.4mm;padding:3.6mm 4.4mm;background:#fff">
          <div><div style="{MONO};font-size:6.8pt;letter-spacing:.12em;color:{col}">LEVEL {i+1}</div><div style="font-weight:700;font-size:10.6pt;margin-top:.8mm">{lv}</div></div>
          <div><div class="lab">Trigger</div><div style="font-size:8.8pt;line-height:1.4;margin-top:1mm;color:{INK}">{trig}</div></div>
          <div><div class="lab">Who is alerted</div><div style="font-size:8.8pt;line-height:1.4;margin-top:1mm;color:{INK}">{who}</div></div>
          <div><div class="lab">Who decides</div><div style="font-size:8.8pt;line-height:1.4;margin-top:1mm;color:{INK}">{dec}</div></div></div>'''
        if esc and i < len(levels) - 1:
            cards += f'<div style="display:flex;align-items:center;gap:3mm;padding:1.6mm 0 1.6mm 12mm"><span style="font-size:13pt;color:{RED};line-height:1">↓</span><span style="{MONO};font-size:7.4pt;color:{RED};letter-spacing:.04em">ESCALATE IF {esc.upper()}</span></div>'
        else:
            cards += '<div style="height:3mm"></div>'
    nt = f'<div style="margin-top:3mm;padding:4mm 5mm;border-left:1mm solid {BLUE};background:{LIGHT};font-size:9.4pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:7mm">{cards}</div>{nt}', sec=sec)

def swimlane(s, ey, title, lede, lanes, times, events, sec, note=""):
    """events: (lane index, time index, text, kind) with kind 'act', 'dec', 'risk' or 'mon'."""
    K = {"act": (BLUE, "#fff", "Action"), "dec": (INK, "#fff", "Decision"), "risk": (RED, "#fff", "Where it goes wrong"), "mon": ("#E8F4FD", INK, "Monitored")}
    nt_ = len(times); cols = f"28mm repeat({nt_},1fr)"
    head = f'<div style="display:grid;grid-template-columns:{cols};gap:1.6mm"><span></span>' + "".join(f'<span style="{MONO};font-size:7.4pt;color:{RED if j==0 else INK};text-align:center;padding-bottom:1.6mm;border-bottom:.4mm solid {INK}">{t}</span>' for j, t in enumerate(times)) + "</div>"
    rows = ""
    for li, ln in enumerate(lanes):
        cells = ""
        for tj in range(nt_):
            ev = [e for e in events if e[0] == li and e[1] == tj]
            cells += '<div style="display:flex;flex-direction:column;gap:1.2mm;padding:1.4mm 0">' + "".join(
                f'<div style="background:{K[k][0]};color:{K[k][1]};border-radius:1.6mm;padding:1.6mm 2mm;font-size:7.3pt;line-height:1.3">{"◆ " if k=="dec" else ("! " if k=="risk" else "")}{t}</div>' for _, _, t, k in ev) + "</div>"
        rows += f'<div style="display:grid;grid-template-columns:{cols};gap:1.6mm;border-bottom:.25mm solid {LINE};background:{LIGHT if li%2 else "#fff"}"><div style="font-weight:700;font-size:8.6pt;padding:2.4mm 1.6mm;color:{INK};line-height:1.25">{ln}</div>{cells}</div>'
    leg = " &nbsp; ".join(f'<span style="display:inline-block;width:3mm;height:3mm;border-radius:.8mm;background:{c};vertical-align:-.4mm;border:.2mm solid {LINE}"></span> <span style="font-size:8pt;color:{GREY}">{n}</span>' for c, _, n in K.values())
    nt = f'<div style="margin-top:4mm;padding:4mm 5mm;border-left:1mm solid {RED};background:{LIGHT};font-size:9.2pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:6mm">{head}{rows}</div><div style="margin-top:3mm">{leg}</div>{nt}', sec=sec)

def tracker(s, ey, title, lede, rows, sec, note=""):
    """rows: (action, owner, due, status, how it is checked). Status: Done, In progress, Open, Overdue, Blocked."""
    st = {"Done": (BLUE, "#fff", None), "In progress": (None, SKY, SKY), "Open": (None, GREY, "#3A3A3A66"), "Overdue": (RED, "#fff", None), "Blocked": (INK, "#fff", None)}
    cols = "1fr 30mm 20mm 24mm 1fr"
    head = f'<div style="display:grid;grid-template-columns:{cols};gap:4mm;padding-bottom:2mm" class="lab"><span>Action</span><span>Owner</span><span>Due</span><span>Status</span><span>How it is checked</span></div>'
    body = "".join(f'<div style="display:grid;grid-template-columns:{cols};gap:4mm;padding:3mm 0;border-top:.25mm solid {LINE};align-items:center;font-size:8.8pt;line-height:1.35;color:{INK}"><div style="font-weight:500">{a}</div><div>{o}</div><div style="{MONO};font-size:8pt">{d}</div><div>{_chip(x.upper(), *st.get(x, st["Open"]))}</div><div style="color:{GREY}">{c}</div></div>' for a, o, d, x, c in rows)
    nt = f'<div style="margin-top:5mm;padding:4mm 5mm;border-left:1mm solid {BLUE};background:{LIGHT};font-size:9.4pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:7mm">{head}<div style="border-bottom:.25mm solid {LINE}">{body}</div></div>{nt}', sec=sec)

def exercise(s, ey, title, lede, meta, injects, sec, note=""):
    """meta: (label, value) pairs; injects: (time, what happens, questions for the room)."""
    m = "".join(f'<div style="flex:1;background:{LIGHT};border-radius:2.4mm;padding:3mm 4mm"><div class="lab">{k}</div><div style="font-size:9pt;line-height:1.4;margin-top:1mm;color:{INK};font-weight:500">{v}</div></div>' for k, v in meta)
    inj = "".join(f'''<div style="display:grid;grid-template-columns:20mm 1fr 1fr;gap:5mm;padding:3.6mm 0;border-top:.25mm solid {LINE}">
        <div style="{MONO};font-size:8.6pt;color:{RED}">{t}</div><div><div class="lab">Inject {i+1}</div><div style="font-size:9pt;line-height:1.4;margin-top:1mm;color:{INK}">{w}</div></div>
        <div><div class="lab">Discuss</div><div style="font-size:8.8pt;line-height:1.4;margin-top:1mm;color:{GREY}">{q}</div></div></div>''' for i, (t, w, q) in enumerate(injects))
    nt = f'<div style="margin-top:4mm;padding:4mm 5mm;border-left:1mm solid {BLUE};background:{LIGHT};font-size:9.2pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="display:flex;gap:3mm;margin-top:6mm">{m}</div><div style="margin-top:5mm;border-bottom:.25mm solid {LINE}">{inj}</div>{nt}', sec=sec)

def pir(s, ey, title, lede, sections, sec):
    """A post-incident review template: header fields, then (heading, prompt) boxes with write-in lines."""
    hdr = "".join(f'<div style="flex:1"><div class="lab">{k}</div><div style="border-bottom:.3mm solid {INK};height:6mm"></div></div>' for k in ("Incident", "Date", "Severity", "Review lead"))
    box = "".join(f'''<div style="border:.3mm solid {LINE};border-radius:2.4mm;padding:3.2mm 4mm;break-inside:avoid;margin-bottom:3mm"><div style="font-weight:700;font-size:9.6pt;color:{INK}"><span style="{MONO};color:{RED};font-size:7.6pt">0{i+1}</span> &nbsp;{h}</div>
        <div style="font-size:8pt;line-height:1.35;color:{GREY};margin-top:1mm">{p}</div>{"".join(f'<div style="border-bottom:.25mm dashed #3A3A3A55;height:5.6mm"></div>' for _ in range(3))}</div>''' for i, (h, p) in enumerate(sections))
    s._wrap(s._hd(ey, title, lede) + f'<div style="display:flex;gap:5mm;margin-top:6mm">{hdr}</div><div style="margin-top:5mm;columns:2;column-gap:4mm">{box}</div>', sec=sec)

def form(s, ey, title, lede, cols, sec, rows=8, example=None, note=""):
    """A fill-in template: cols is [(label, width fr)], optional example row in grey."""
    tpl = " ".join(f"{w}fr" for _, w in cols)
    head = f'<div style="display:grid;grid-template-columns:{tpl};gap:0;background:{INK};border-radius:2mm 2mm 0 0">' + "".join(f'<div style="padding:2.4mm 2.4mm;{MONO};font-size:6.8pt;letter-spacing:.08em;color:#fff;text-transform:uppercase">{c}</div>' for c, _ in cols) + "</div>"
    ex = (f'<div style="display:grid;grid-template-columns:{tpl};border:.25mm solid {LINE};border-top:0;background:{LIGHT}">' + "".join(f'<div style="padding:2.2mm 2.4mm;font-size:7.8pt;line-height:1.3;color:{BLUE};font-style:italic;border-right:.25mm solid {LINE}">{v}</div>' for v in example) + "</div>") if example else ""
    blank = "".join(f'<div style="display:grid;grid-template-columns:{tpl};border:.25mm solid {LINE};border-top:0;height:9.4mm">' + "".join(f'<div style="border-right:.25mm solid {LINE}"></div>' for _ in cols) + "</div>" for _ in range(rows))
    nt = f'<div style="margin-top:4mm;font-size:8.6pt;line-height:1.5;color:{GREY}">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:7mm">{head}{ex}{blank}</div>{nt}', sec=sec)

def depmap(s, ey, title, lede, centre, nodes, tolerance, sec, note=""):
    """A dependency map: centre (service, one-line description); six nodes (category, items); tolerance (label, value) pairs."""
    pos = [(0, 0), (0, 1), (0, 2), (2, 0), (2, 1), (2, 2)]
    W, H = 174, 118; cw, ch = 50, 33; xs = [0, (W - 60) / 2, W - cw]; ys = [0, (H - ch) / 2, H - ch]
    cx0, cy0, cwid, chei = (W - 60) / 2, (H - 46) / 2, 60, 46
    lines = "".join(f'<line x1="{xs[c]+cw/2 if c==1 else (xs[c]+cw if c==0 else xs[c])}" y1="{ys[r]+ch/2}" x2="{cx0 if c==0 else cx0+cwid}" y2="{cy0+chei/2}" stroke="{SKY}" stroke-width=".35" stroke-dasharray="1.4 1"/>' for (c, r) in pos)
    nd = "".join(f'''<div style="position:absolute;left:{xs[c]}mm;top:{ys[r]}mm;width:{cw}mm;height:{ch}mm;border:.3mm solid {LINE};border-radius:2.6mm;background:#fff;padding:2.6mm 3.2mm;overflow:hidden">
        <div style="{MONO};font-size:6.6pt;letter-spacing:.1em;color:{BLUE};text-transform:uppercase">{cat}</div><div style="font-size:8pt;line-height:1.38;margin-top:1.2mm;color:{INK}">{it}</div></div>''' for (c, r), (cat, it) in zip(pos, nodes))
    cn = f'<div style="position:absolute;left:{cx0}mm;top:{cy0}mm;width:{cwid}mm;height:{chei}mm;border-radius:3.4mm;background:{INK};color:#fff;padding:4mm 4.6mm"><div style="{MONO};font-size:6.6pt;letter-spacing:.12em;color:{SKY}">IMPORTANT BUSINESS SERVICE</div><div style="font-weight:700;font-size:12pt;margin-top:1.6mm;line-height:1.2">{centre[0]}</div><div style="font-size:8pt;line-height:1.4;margin-top:1.6mm;color:rgba(247,246,248,.8)">{centre[1]}</div></div>'
    tol = "".join(f'<div style="flex:1;border-top:1mm solid {RED if i==len(tolerance)-1 else BLUE};padding-top:2mm"><div class="lab">{k}</div><div style="font-weight:700;font-size:10pt;margin-top:1mm;color:{INK}">{v}</div></div>' for i, (k, v) in enumerate(tolerance))
    nt = f'<div style="margin-top:4mm;padding:3.4mm 5mm;border-left:1mm solid {BLUE};background:{LIGHT};font-size:9pt;line-height:1.5">{note}</div>' if note else ""
    s._wrap(s._hd(ey, title, lede) + f'''<div style="position:relative;width:{W}mm;height:{H}mm;margin-top:7mm"><svg viewBox="0 0 {W} {H}" style="position:absolute;inset:0;width:{W}mm;height:{H}mm">{lines}</svg>{nd}{cn}</div>
        <div style="display:flex;gap:4mm;margin-top:6mm">{tol}</div>{nt}''', sec=sec)


# ---------------------------------------------------------------- platform pages (replace the old list)
def platform(s, title, lede, rows, sec="Where Crises Control fits"):
    """Two dark pages: the connected lifecycle with outcomes, then the playbook's own steps flowing through the modules."""
    used = {ALIAS.get(m, m) for _, m in rows}
    nodes = ""
    for i, (m, verb, txt) in enumerate(LIFE):
        on = m in used
        nodes += f'''<div style="flex:1;position:relative;text-align:center;padding:0 1.4mm">
          <div style="width:15mm;height:15mm;margin:0 auto;border-radius:50%;border:.5mm solid {SKY if on else 'rgba(247,246,248,.35)'};background:{NAVY2 if on else 'transparent'};display:flex;align-items:center;justify-content:center;{MONO};font-size:9pt;color:{'#fff' if on else 'rgba(247,246,248,.6)'};position:relative;z-index:1">{i+1:02d}</div>
          <div style="{MONO};font-size:6.6pt;letter-spacing:.12em;color:{RED if i==0 else SKY};margin-top:2.4mm;text-transform:uppercase">{verb}</div>
          <div style="font-weight:700;font-size:9pt;margin-top:1mm;line-height:1.2">{m}</div>
          <div style="font-size:7.3pt;line-height:1.38;color:rgba(247,246,248,.72);margin-top:1.4mm">{txt}</div></div>'''
    flow = f'<div style="position:relative;display:flex;margin-top:9mm"><div style="position:absolute;left:7%;right:7%;top:7.5mm;border-top:.4mm solid rgba(22,161,237,.5)"></div>{nodes}</div>'
    pil = "".join(f'<div style="flex:1;border-top:.6mm solid {SKY};padding-top:3mm"><div style="font-weight:700;font-size:10.4pt">{a}</div><div style="font-size:8.6pt;line-height:1.45;color:rgba(247,246,248,.75);margin-top:1.4mm">{b}</div></div>' for a, b in PILLARS)
    s._wrap(f'''<div class="ey">The platform</div><h1 style="margin-top:4mm;width:172mm;font-size:28pt">One connected platform,<br><span style="color:{SKY}">from first alert to final report.</span></h1>
      <div style="margin-top:5mm;width:168mm;font-weight:300;font-size:11pt;line-height:1.55;color:rgba(247,246,248,.82)">{POSITIONING} Each module does one job; the value comes from how they work together across the incident.</div>
      {flow}
      <div style="margin-top:11mm;font-family:'Roboto Mono';font-size:7pt;letter-spacing:.16em;color:{RED};text-transform:uppercase">The outcomes</div>
      <div style="display:flex;gap:5mm;margin-top:3mm">{pil}</div>
      <div style="margin-top:9mm;font-size:9.6pt;line-height:1.55;color:rgba(247,246,248,.85)">Most organisations start with the capability they need today, often alerting, and expand as their requirements mature. Highlighted modules are the ones this playbook draws on.</div>''',
      True, sec, bg=f'<div style="position:absolute;right:-78mm;top:-78mm;width:170mm;opacity:.3">{__import__("cckit").dial()}</div>')
    order = {m: i for i, (m, _, _) in enumerate(LIFE)}
    steps = sorted(rows, key=lambda r: order.get(ALIAS.get(r[1], r[1]), 9))
    st = "".join(f'''<div style="display:grid;grid-template-columns:14mm 46mm 1fr;gap:4mm;align-items:start;position:relative;padding:3.2mm 0">
        <div style="width:10mm;height:10mm;border-radius:50%;background:{NAVY2};border:.4mm solid {SKY};display:flex;align-items:center;justify-content:center;{MONO};font-size:8pt;position:relative;z-index:1">{i+1:02d}</div>
        <div><div style="{MONO};font-size:6.6pt;letter-spacing:.12em;color:{SKY};text-transform:uppercase">{dict((a, b) for a, b, _ in LIFE).get(ALIAS.get(m, m), "")}</div><div style="font-weight:700;font-size:10pt;margin-top:.6mm">{ALIAS.get(m, m)}</div></div>
        <div style="font-size:9.8pt;line-height:1.5;color:rgba(247,246,248,.9);padding-top:.8mm">{t}</div></div>''' for i, (t, m) in enumerate(steps))
    s._wrap(f'''<div class="ey">How the modules work together</div><h2 style="margin-top:4mm;width:172mm">{title}</h2>
      <div style="margin-top:5mm;width:168mm;font-weight:300;font-size:10.6pt;line-height:1.55;color:rgba(247,246,248,.82)">{lede}</div>
      <div style="position:relative;margin-top:8mm"><div style="position:absolute;left:5mm;top:6mm;bottom:6mm;border-left:.4mm dashed rgba(22,161,237,.5)"></div>{st}</div>
      <div style="margin-top:7mm;display:grid;grid-template-columns:repeat(4,1fr);gap:4mm">{"".join(f'<div style="border:.3mm solid {LINE_D};border-radius:2.4mm;padding:3mm 3.6mm"><div style="{MONO};font-size:6.6pt;letter-spacing:.12em;color:{RED}">{k}</div><div style="font-size:8.6pt;line-height:1.4;margin-top:1.2mm">{v}</div></div>' for k, v in [("COORDINATION", "Everyone works from the same incident, roles and log."), ("VISIBILITY", "Leaders see progress without chasing for updates."), ("EXECUTION", "Every action has an owner, a deadline and an escalation."), ("ACCOUNTABILITY", "The record of what happened builds itself as you go.")])}</div>''',
      True, sec, bg=f'<div style="position:absolute;right:-78mm;bottom:-78mm;width:170mm;opacity:.3">{__import__("cckit").dial()}</div>')


# ---------------------------------------------------------------- the final page: book an industry demonstration
def cta_page(s, dark=True, next_title=""):
    d = DEMO.get(s.industry); url = LANDING.get(s.industry, "https://www.crises-control.com/")
    from cckit import LOGO, dial
    fg, sub, line = ("#fff", "rgba(247,246,248,.78)", LINE_D) if dark else (INK, GREY, LINE)
    steps = "".join(f'''<div style="display:grid;grid-template-columns:9mm 38mm 1fr;gap:3mm;padding:2.5mm 0;border-top:.25mm solid {line};align-items:start">
        <div style="{MONO};font-size:8pt;color:{RED}">0{i+1}</div><div style="{MONO};font-size:7.2pt;letter-spacing:.06em;color:{SKY if dark else BLUE};padding-top:.3mm">{m.upper()}</div>
        <div style="font-size:9pt;line-height:1.4;color:{fg}">{t}</div></div>''' for i, ((m, _, _), t) in enumerate(zip(LIFE, d["steps"])))
    short = url.replace("https://www.", "")
    nx = f'<div style="margin-top:4mm;font-size:8.4pt;color:{sub}"><span style="{MONO};font-size:6.8pt;letter-spacing:.14em;color:{RED}">{"COMPANION REPORT" if "report" in next_title.lower() else "COMPANION PLAYBOOK"} </span>&nbsp;{next_title.split("·")[-1].strip()}</div>' if next_title else ""
    body = f'''<div style="position:absolute;left:18mm;right:18mm;top:15mm;display:flex;justify-content:space-between;align-items:center"><img src="{LOGO}" style="height:17mm"><span style="{MONO};font-size:7pt;letter-spacing:.16em;color:{sub};text-transform:uppercase">{s.industry}</span></div>
      <div style="position:absolute;left:18mm;right:18mm;top:42mm">
        <div style="{MONO};font-size:7.4pt;letter-spacing:.16em;color:{RED};text-transform:uppercase">Book your {s.industry.lower()} platform demonstration</div>
        <div style="font-weight:700;font-size:32pt;line-height:1.04;letter-spacing:-.035em;margin-top:4mm;color:{fg}">{d["title"]}</div>
        <div style="font-weight:300;font-size:11pt;line-height:1.55;color:{sub};margin-top:5mm;width:168mm">A live, 30-minute demonstration built around a {s.industry.lower()} incident. You will see one incident move through the whole platform, not a tour of features, and you can bring your own scenario.</div>
        <div style="{MONO};font-size:7pt;letter-spacing:.16em;color:{SKY if dark else BLUE};text-transform:uppercase;margin-top:8mm">What you will see</div>
        <div style="margin-top:2mm;border-bottom:.25mm solid {line}">{steps}</div>
        <div style="margin-top:8mm;display:grid;grid-template-columns:1fr auto;gap:8mm;align-items:center;border-radius:4mm;padding:6mm 7mm;background:{'rgba(247,246,248,.06)' if dark else LIGHT};border:.3mm solid {line}">
          <div><a href="{url}" style="display:inline-block;background:{RED};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:700;font-size:11pt;text-decoration:none">Book your demonstration →</a>
            <div style="margin-top:4mm;font-size:9pt;line-height:1.7;color:{fg}"><a href="{url}" style="color:{SKY if dark else BLUE};text-decoration:none;{MONO};font-size:8pt">{short}</a><br><span style="{MONO};font-size:8pt;color:{sub}">+44 (0) 20 8584 1385 · contactus@crises-control.com</span></div></div>
          <div style="text-align:center"><a href="{url}">{_qr(url, 92)}</a><div style="{MONO};font-size:6.4pt;letter-spacing:.1em;color:{sub};margin-top:1.6mm">SCAN TO BOOK</div></div></div>
        {nx}</div>
      <div style="position:absolute;left:18mm;right:18mm;bottom:12mm;display:flex;justify-content:space-between;{MONO};font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:{sub}"><span>Crises Control · Operational Incident Coordination Platform</span><span>www.crises-control.com</span></div>'''
    bg = (f'<div style="position:absolute;inset:0;background:radial-gradient(110% 70% at 85% 10%,#0A3165 0%,{INK} 60%)"></div><div style="position:absolute;right:-96mm;bottom:-96mm;width:170mm;opacity:.35">{dial()}</div>' if dark
          else f'<div style="position:absolute;right:-96mm;bottom:-90mm;width:170mm;opacity:.5">{dial(dark=False)}</div><div style="position:absolute;left:0;right:0;bottom:0;height:5mm;background:linear-gradient(90deg,#0A3165,{BLUE} 70%,{RED} 70%,{RED})"></div>')
    s._wrap(bg + body, dark, folio=False)


def attach(cls):
    for f in (raci, escalation, swimlane, tracker, exercise, pir, form, depmap, platform):
        setattr(cls, f.__name__, f)
    cls.art_back = lambda s, title="", lede="", cta="", next_title="": cta_page(s, True, next_title)
