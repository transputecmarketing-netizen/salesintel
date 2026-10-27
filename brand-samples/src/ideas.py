import math
from common import DEFS, logo, gt as G, gt_slice, dots, ghost, badge_wall
from report import bg_dark
from case import CSS, head, src, RED, AMBER

TITLE = "The Next Ten"
N = 12

# (id, working title, short, headline, source line, evidence 1-5, fit 1-5, status, audience, service, format)
IDEAS = [
    (1, "The Token Problem", "Microsoft 365 identity attacks",
     "AiTM phishing is 44.6% of identified phishing techniques; password attacks fell 26% year on year.",
     "Microsoft Digital Defense Report 2026 (Microsoft telemetry)", 4.2, 4.6, "Built",
     "IT and security leaders on Microsoft 365", "Modern Work and Security partner; managed identity", "Report"),
    (2, "The 55%", "Ransomware recovery and backups",
     "78% of UK victims recovered from backups, up from 39%; only 55% were fully back within a week.",
     "Sophos State of Ransomware in the UK 2026 (UK n=120, vendor-commissioned)", 3.8, 4.3, "Built",
     "MDs, finance and IT leaders", "Backup, DR and restore testing", "Report"),
    (3, "Your MSP Is About to Be Regulated", "Cyber Security and Resilience Bill",
     "The Bill extends network and information systems rules to managed service providers. It passed the Commons on 16 June 2026.",
     "UK Parliament; Digital Policy Alert", 3.4, 4.9, "Built",
     "Anyone buying managed IT", "ISO 27001 delivery; customer incident notification", "Report"),
    (4, "What Copilot Can See", "Copilot readiness and oversharing",
     "56% have Copilot fully deployed, up from 29%; 77% had a Microsoft 365 governance incident.",
     "ShareGate State of Microsoft 365 2026 (vendor survey)", 3.0, 4.8, "Built",
     "IT and finance leaders planning Copilot", "Microsoft Copilot consulting", "Report"),
    (5, "Negative Seven", "Time to exploit",
     "Mean time-to-exploit is estimated at minus seven days: attacks begin before a patch exists.",
     "Mandiant M-Trends 2026 (500,000+ investigation hours)", 3.9, 4.0, "Next",
     "IT leaders; pairs with the PHP2Shell case study", "Patching, vulnerability management, pen testing", "Report"),
    (6, "The Supplier Blind Spot", "Third-party and supply-chain risk",
     "Only 15% of UK businesses review immediate suppliers: 30% of medium and 48% of large.",
     "Cyber Security Breaches Survey 2025/26 (government, n=2,112 businesses)", 4.6, 3.6, "Next",
     "Procurement, risk and finance", "Supplier assurance, G-Cloud and TePAS credentials", "Report"),
    (7, "Ready, Not Willing", "Mid-market AI adoption and skills",
     "23% of mid-sized UK firms use AI, and 64% of those users say skills are the brake.",
     "DSIT AI Adoption Research (fieldwork Feb to May 2025: refresh before use)", 3.5, 3.4, "Later",
     "MDs and HR leaders", "Copilot training and adoption", "Report"),
    (8, "What Insurers Now Ask", "Cyber insurance and claims",
     "Marsh UK logged a record 668 claims notifications in 2025; ransomware encryption fell from 70% of extortion claims to 24%.",
     "Marsh UK claims trends 2025 (broker's own book)", 3.2, 3.0, "Later",
     "Finance directors", "Cyber Essentials Plus, controls evidence", "Report"),
    (9, "Green Dashboard, Red Users", "Experience-level agreements",
     "No verifiable statistic found. The honest version needs original research.",
     "Proposal: survey Transputec clients and prospects", 1.2, 4.2, "Research",
     "IT leaders and service owners", "XLA service desk; fixed-fee model", "Original survey"),
    (10, "The Hidden Footprint", "Sustainable IT and device lifecycle",
     "62 million tonnes of e-waste in 2022; only 22.3% documented as recycled. UK business data still to source.",
     "UNITAR and ITU Global E-waste Monitor 2024 (global)", 2.0, 3.2, "Research",
     "Sustainability and procurement leads", "Device lifecycle, ISO 14001, ITAD", "Report"),
]

STATUS_COL = {"Built": "#34C759", "Next": "#2C72DB", "Later": "#6B7A90", "Research": AMBER}


def page(n, body, dark=False, section="", folio=True):
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>' if folio and section[:2].isdigit() and not dark else ""
    run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / {N}</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'


def radar():
    W = 174
    cx, cy = 87, 87
    o = [f'<svg viewBox="0 0 {W} {W}" width="{W}mm" height="{W}mm" style="display:block;overflow:visible">']
    for i, r in enumerate((20, 38, 56, 74, 90)):
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="rgba(255,255,255,{.2-i*.03:.2f})" stroke-width=".3"/>')
    for a in range(0, 360, 30):
        x, y = cx + 90 * math.cos(math.radians(a)), cy + 90 * math.sin(math.radians(a))
        o.append(f'<line x1="{cx}" y1="{cy}" x2="{x:.1f}" y2="{y:.1f}" stroke="rgba(255,255,255,.06)" stroke-width=".25"/>')
    o.append(f'<path d="M{cx},{cy} L{cx+90*math.cos(math.radians(-70)):.1f},{cy+90*math.sin(math.radians(-70)):.1f} A90,90 0 0 1 {cx+90*math.cos(math.radians(-20)):.1f},{cy+90*math.sin(math.radians(-20)):.1f} Z" fill="url(#gd)" fill-opacity=".14"/>')
    for k, idea in enumerate(IDEAS):
        ev, fit, status = idea[5], idea[6], idea[7]
        ang = math.radians(-82 + k * 36 + (k % 2) * 6)
        rad = 14 + (5 - ev) * 17 + (k % 3) * 3
        x, y = cx + rad * math.cos(ang), cy + rad * math.sin(ang)
        r = 2.2 + fit * 0.9
        if status == "Built":
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r*2.2:.1f}" fill="rgba(0,184,219,.10)"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="url(#gd)"/>')
        elif status == "Next":
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="#2C72DB" fill-opacity=".55"/>')
        else:
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.1f}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".5" stroke-dasharray="1.2 1.2"/>')
        o.append(f'<text x="{x:.1f}" y="{y+1.2:.1f}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="3.4" fill="#fff">{idea[0]}</text>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="2" fill="#00B8DB"/></svg>')
    return ''.join(o)


def p1():
    body = bg_dark('<div class="glow" style="left:20mm;top:30mm;width:180mm;height:180mm;background:radial-gradient(circle,rgba(21,93,252,.28) 0%,rgba(21,93,252,0) 64%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">EDITORIAL ROADMAP · OCT 2026</span></div>
    <div style="position:absolute;left:18mm;top:44mm">{radar()}</div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:46pt;line-height:1;letter-spacing:-.05em">The next</div>
      <div style="margin-top:1mm">{G("ten reports.", 46, weight=600, ls=-0.05)}</div>
      <div class="lede" style="margin-top:6mm;max-width:124mm;font-size:12.5pt">What the evidence supports, what fits Transputec, and the order to publish in.</div>
      <div class="hair" style="margin:8mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research · Internal</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    crit = [("Evidence", "Is there a primary source we can read in full? Government and regulator data beat vendor surveys; vendor telemetry beats a vendor poll."),
            ("Fit", "Does it connect to something Transputec does and can prove: Microsoft Modern Work and Security, ISO 27001 delivery, Copilot consulting, backup and recovery, device lifecycle."),
            ("Timing", "Is there a news event or a deadline that makes someone read it this quarter?")]
    cc = ''.join(f'<div style="padding-top:7mm;border-top:.35mm solid var(--navy)"><div class="mono" style="font-size:8pt;color:var(--blue)">{i+1:02d}</div><h3 style="margin:6mm 0 3mm;font-size:15pt;letter-spacing:-.03em">{a}</h3><p>{b}</p></div>' for i, (a, b) in enumerate(crit))
    body = f'''{head("How we chose", "Three questions.<br>Ten topics.", "We screened a long list against what we could read at source, not what we could find in a search snippet.")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9mm;margin-top:13mm">{cc}</div>
    <div class="card" style="margin-top:14mm;background:var(--navy);color:#fff"><div class="eyebrow" style="color:var(--cyan)">What we found</div>
      <p style="font-size:9.6pt;margin-top:3mm;color:var(--slate)">Six topics have a statistic we read on the source page or PDF. Two rest on vendor surveys and are labelled as such. Two have no UK business figure we can stand behind, and are marked <b style="color:#fff;font-weight:600">Research</b>: they need original work before anyone reads them.</p></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:11mm"><div class="eyebrow">Our standard</div>
      <p style="font-size:9.2pt">A number goes in a report only if we can name the source, the sample, the date and who paid for it. A claim we could not verify is flagged, softened or left out. A topic without a defensible headline is not published; it is researched first.</p></div>'''
    return page(2, body, section="How we chose")


def scatter():
    W, H = 174, 118
    X0, Y0, X1, Y1 = 14, 6, 168, 100
    def x(v): return X0 + (X1 - X0) * (v - 1) / 4.2
    def y(v): return Y1 - (Y1 - Y0) * (v - 2.6) / 2.6
    o = [f'<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" style="display:block;overflow:visible">']
    o.append(f'<rect x="{x(3.1)}" y="{Y0}" width="{X1-x(3.1)}" height="{y(3.8)-Y0}" rx="3" fill="url(#gh)" fill-opacity=".08"/>')
    for v in (1, 2, 3, 4, 5):
        o.append(f'<line x1="{x(v)}" x2="{x(v)}" y1="{Y0}" y2="{Y1}" stroke="#E3E8F0" stroke-width=".25"/><text x="{x(v)}" y="{Y1+6}" text-anchor="middle" font-family="JetBrains Mono" font-size="2.6" fill="#6B7A90">{v}</text>')
    for v in (3, 4, 5):
        o.append(f'<line x1="{X0}" x2="{X1}" y1="{y(v)}" y2="{y(v)}" stroke="#E3E8F0" stroke-width=".25"/><text x="{X0-3}" y="{y(v)+1}" text-anchor="end" font-family="JetBrains Mono" font-size="2.6" fill="#6B7A90">{v}</text>')
    o.append(f'<text x="{(X0+X1)/2}" y="{Y1+13}" text-anchor="middle" font-family="JetBrains Mono" font-size="2.8" letter-spacing=".4" fill="#6B7A90">EVIDENCE STRENGTH →</text>')
    o.append(f'<text x="3" y="{(Y0+Y1)/2}" transform="rotate(-90 3 {(Y0+Y1)/2})" text-anchor="middle" font-family="JetBrains Mono" font-size="2.8" letter-spacing=".4" fill="#6B7A90">FIT WITH TRANSPUTEC →</text>')
    o.append(f'<text x="{X1-2}" y="{Y0+5}" text-anchor="end" font-family="JetBrains Mono" font-size="2.6" fill="#155DFC" letter-spacing=".3">PUBLISH FIRST</text>')
    for i in IDEAS:
        px, py = x(i[5]), y(i[6])
        st = i[7]
        fill = "url(#gd)" if st == "Built" else ("#2C72DB" if st == "Next" else "#fff")
        stroke = "none" if st in ("Built", "Next") else (AMBER if st == "Research" else "#6B7A90")
        o.append(f'<circle cx="{px:.1f}" cy="{py:.1f}" r="5.2" fill="{fill}" stroke="{stroke}" stroke-width=".6"/><text x="{px:.1f}" y="{py+1.3:.1f}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="3.6" fill="{"#fff" if st in ("Built","Next") else "#0F172B"}">{i[0]}</text>')
    o.append('</svg>')
    return ''.join(o)


def p3():
    key = ''.join(f'<span style="margin-right:6mm"><i style="display:inline-block;width:3mm;height:3mm;border-radius:50%;background:{c};margin-right:2mm;vertical-align:-.5mm"></i>{t}</span>' for t, c in [("Built in this batch", "#2C72DB"), ("Next", "#155DFC"), ("Later", "#C9D6EE"), ("Needs research", AMBER)])
    body = f'''{head("The map", "Where each idea sits.", "Our judgement on a five-point scale, based on what we could verify and how closely each topic matches Transputec's services. Numbers match the pages that follow.")}
    <div style="margin-top:9mm">{scatter()}</div>
    <div class="mono" style="font-size:6.6pt;letter-spacing:.1em;color:var(--mid);text-transform:uppercase;margin-top:3mm">{key}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:9mm"><div class="eyebrow">Reading it</div>
      <p style="font-size:9pt">The top-right corner is where a report is both credible and commercially useful. Idea 9 has the right fit and the wrong evidence today; the fix is to run our own survey, not to borrow someone else's number.</p></div>'''
    return page(3, body, section="The map")


def p4():
    rows = ''.join(f'''<tr><td style="width:9mm;color:var(--blue)">{i[0]:02d}</td><td style="width:50mm">{i[1]}</td><td style="color:var(--body);font-weight:400;font-size:8.2pt">{i[2]}</td>
      <td style="width:22mm"><span class="tag" style="color:{STATUS_COL[i[7]]}">{i[7]}</span></td></tr>''' for i in IDEAS)
    body = f'''{head("The shortlist", "Ten working titles.", "Titles are drafts. Status shows where each stands as of 27 October 2026.")}
    <div style="margin-top:10mm"><table class="t"><tr><th></th><th>Working title</th><th>Topic</th><th>Status</th></tr>{rows}</table></div>'''
    return page(4, body, section="The shortlist")


def card(i):
    col = STATUS_COL[i[7]]
    return f'''<div style="padding:7mm 0;border-top:.35mm solid var(--navy);display:grid;grid-template-columns:30mm 1fr;gap:7mm">
      <div>{G(f"{i[0]:02d}", 40, ls=-0.05)}<div style="margin-top:3mm"><span class="tag" style="color:{col}">{i[7]}</span></div></div>
      <div><h3 style="font-size:15pt;letter-spacing:-.03em">{i[1]}</h3>
        <div class="mono" style="font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid);margin:1.4mm 0 4mm">{i[2]}</div>
        <p style="font-size:10pt;font-weight:500;color:var(--navy);line-height:1.5">{i[3]}</p>
        <p class="src" style="margin-top:1.8mm">{i[4]}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5mm;margin-top:5mm">
          <div><div class="eyebrow" style="color:var(--mid)">Reader</div><p style="font-size:8.4pt;margin-top:1.4mm">{i[8]}</p></div>
          <div><div class="eyebrow" style="color:var(--mid)">Transputec link</div><p style="font-size:8.4pt;margin-top:1.4mm">{i[9]}</p></div>
          <div><div class="eyebrow" style="color:var(--mid)">Evidence · fit</div><p style="font-size:8.4pt;margin-top:1.4mm">{i[5]:.1f} · {i[6]:.1f} out of 5</p></div></div></div></div>'''


def pitch(n, ids, h):
    body = f'''<div class="eyebrow" style="margin-top:14mm">Pitches · {h}</div>
    <h2 style="margin-top:5mm;font-size:24pt">{ids[0][1]}{" and " + ids[1][1] if len(ids) > 1 else ""}.</h2>
    <div style="margin-top:9mm">{''.join(card(i) for i in ids)}</div>'''
    return page(n, body, section="Pitches")


def p10():
    steps = [("Weeks 1–2", "Publish", "Identity, Recovery, Resilience Bill and Copilot reports. Pair each with a one-page LinkedIn summary and a playbook play."), ("Weeks 3–6", "Verify and build", "Read Verizon DBIR and Gartner at source. Re-check the ABI claims figure. Build ideas 5 and 6."),
             ("Weeks 7–10", "Commission", "Field a short client and prospect survey for ideas 9 and 7. Pull UK figures for idea 10."), ("Weeks 11–13", "Refresh", "Update the first four with new data. Retire anything a newer source supersedes.")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:34mm 1fr;gap:6mm;padding:7mm 0;border-bottom:.25mm solid var(--line)">
      <div><div class="mono" style="font-size:6.6pt;letter-spacing:.12em;color:var(--blue);text-transform:uppercase">{a}</div>{G(b, 20, ls=-0.04)}</div><p style="font-size:9.6pt">{c}</p></div>''' for a, b, c in steps)
    body = f'''{head("The plan", "A quarter, in four moves.")}
    <div style="margin-top:10mm;border-top:.35mm solid var(--navy)">{cc}</div>
    <div class="card" style="margin-top:9mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center"><div class="eyebrow" style="color:var(--cyan);width:28mm">Decision</div>
      <div style="font-size:10pt;line-height:1.55;color:var(--slate)">Which of the six unbuilt ideas should go next, and do you want to fund the client survey for idea 9?</div></div>'''
    return page(10, body, section="The plan")


def p11():
    rules = [("Name the source", "Publisher, date, sample, and who paid for it, on the page."), ("Keep studies apart", "Two surveys from one vendor are two surveys."), ("Label opinion", "Our view is marked as ours."),
             ("Flag the gaps", "If we could not read it, we say so."), ("No invented people", "No made-up quotes, names or case studies."), ("Refresh or retire", "Old data is dated on the page, then replaced.")]
    cc = ''.join(f'<div class="card" style="padding:7mm"><div class="mono" style="font-size:8pt;color:var(--blue)">{i+1:02d}</div><h3 style="margin:5mm 0 2mm;font-size:12.6pt">{a}</h3><p style="font-size:9pt">{b}</p></div>' for i, (a, b) in enumerate(rules))
    body = f'''{head("Our standard", "Six rules that protect<br>the brand.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">{cc}</div>
    {src("These are the rules used on every document in this series, including the four built in this batch.", "20mm")}'''
    return page(11, body, section="Our standard")


def p12():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{dots(10,10,40,pitch=11,d=6.6)}
      <div class="mono" style="text-align:center;font-size:6.6pt;letter-spacing:.18em;color:var(--cyan);margin-top:5mm;text-transform:uppercase">4 of 10 built · 6 to go</div></div>
    <div style="position:absolute;left:0;right:0;top:158mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">Predictable IT. Predictable budget.<br>Contracted outcomes.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(12, body, dark=True, folio=False)


def build():
    I = {i[0]: i for i in IDEAS}
    pages = [p1(), p2(), p3(), p4(), pitch(5, [I[1], I[2]], "01–02"), pitch(6, [I[3], I[4]], "03–04"), pitch(7, [I[5], I[6]], "05–06"),
             pitch(8, [I[7], I[8]], "07–08"), pitch(9, [I[9], I[10]], "09–10"), p10(), p11(), p12()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("ideas.html", "w", encoding="utf8").write(build())
