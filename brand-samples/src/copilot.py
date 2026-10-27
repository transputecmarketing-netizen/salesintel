import random
from common import DEFS, logo, gt as G, gt_slice, dots, ghost, badge_wall
from report import bg_dark
from case import CSS, head, src, ev, RED, AMBER

TITLE = "What Copilot Can See"
N = 14


def page(n, body, dark=False, section="", folio=True):
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>' if folio and section[:2].isdigit() and not dark else ""
    run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / {N}</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'


def spotlight(cols=14, rows=14, pitch=11.6, d=6.2, cx=8.1, cy=6.4, R=4.9, flagged=9):
    """A grid of documents. The beam is what an AI assistant can reach for one user; amber dots are
    sensitive files that were never meant to be inside it."""
    W, H = cols * pitch, rows * pitch
    rnd = random.Random(5)
    inside = [(c, r) for r in range(rows) for c in range(cols) if (c - cx) ** 2 + (r - cy) ** 2 <= R ** 2]
    amb = set(rnd.sample(inside, flagged))
    o = [f'<svg width="{W:.1f}mm" height="{H:.1f}mm" viewBox="0 0 {W:.1f} {H:.1f}" style="display:block;overflow:visible">']
    for r in range(rows):
        for c in range(cols):
            x, y = c * pitch + pitch / 2, r * pitch + pitch / 2
            if (c, r) in amb:
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{d*0.78:.2f}" fill="none" stroke="{AMBER}" stroke-width=".4" stroke-opacity=".9"/><circle cx="{x:.1f}" cy="{y:.1f}" r="{d/2:.2f}" fill="{AMBER}"/>')
            elif (c, r) in inside:
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{d/2:.2f}" fill="url(#gd)"/>')
            else:
                o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{d/2.6:.2f}" fill="rgba(255,255,255,.13)"/>')
    bx, by, br = (cx + .5) * pitch, (cy + .5) * pitch, (R + .62) * pitch
    o.append(f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{br:.1f}" fill="none" stroke="url(#gd)" stroke-width=".7"/>'
             f'<circle cx="{bx:.1f}" cy="{by:.1f}" r="{br+4:.1f}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width=".3" stroke-dasharray="1 2"/></svg>')
    return ''.join(o)


def p1():
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(0,184,219,.22) 0%,rgba(0,184,219,0) 64%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">COPILOT READINESS · OCT 2026</span></div>
    <div style="position:absolute;left:24mm;top:34mm">{spotlight()}</div>
    <div class="mono" style="position:absolute;left:18mm;top:200mm;font-size:6.6pt;letter-spacing:.12em;color:rgba(255,255,255,.7);display:flex;gap:7mm;text-transform:uppercase">
      <span><i style="display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;background:var(--grad-d);margin-right:2mm;vertical-align:-.4mm"></i>Within reach</span>
      <span><i style="display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;background:{AMBER};margin-right:2mm;vertical-align:-.4mm"></i>Never meant to be</span></div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:46pt;line-height:1;letter-spacing:-.05em">What Copilot</div>
      <div style="margin-top:1mm">{G("can see.", 46, weight=600, ls=-0.05)}</div>
      <div class="lede" style="margin-top:6mm;max-width:124mm;font-size:12.5pt">Oversharing, the confidence gap, and the nine steps to take before you switch it on.</div>
      <div class="hair" style="margin:8mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    cards = [("Source 01", "State of Microsoft 365 2026", "ShareGate, 23 September 2026. Two surveys: 943 IT professionals and 851 IT leaders across nine countries including the UK. ShareGate sells governance tools."),
             ("Source 02", "AI governance survey", "ShareGate, April 2026. 851 IT leaders in seven countries. Self-reported, run by the vendor."),
             ("Source 03", "Gartner Microsoft 365 and Copilot survey", "186 organisations, March to May 2026, as reported by Opsin, a vendor. We have not read Gartner's own text."),
             ("Source 04", "Microsoft Learn guidance", "Microsoft's Copilot oversharing blueprint and Restricted Content Discovery documentation, 2026."),
             ("Source 05", "CVE records", "MITRE records for CVE-2025-32711 and CVE-2026-21520, with press reports for who found them.")]
    cc = ''.join(f'<div class="card"><div class="eyebrow">{a}</div><h3 style="margin:3mm 0 2mm;font-size:11pt">{b}</h3><p style="font-size:8.4pt">{c}</p></div>' for a, b, c in cards)
    body = f'''{head("About this report", "Mostly vendor surveys.<br>We say so on every page.", "There is no neutral census of Copilot readiness yet. The best available numbers come from companies that sell governance tools. We use them, label them, and keep them apart.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:9mm">{cc}</div>
    <div class="card" style="margin-top:5mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Read with care</span>
      <p style="font-size:8.6pt;color:var(--slate)">Percentages are self-reported and describe each survey's own respondents, not the market. Two different ShareGate figures are both 29%. They answer different questions, and we mark which is which.</p></div>
    <div class="src" style="position:absolute;left:18mm;right:18mm;bottom:15mm">© 2026 Transputec Ltd. Third-party figures are quoted with attribution and remain the property of their publishers.</div>'''
    return page(2, body, section="About")


def p3():
    rows = [("", "Executive summary", 4), ("01", "The confidence gap", 5), ("", "Adoption has doubled", 6), ("", "What goes wrong, and how often", 7),
            ("02", "How Copilot sees your data", 8), ("", "Two vulnerabilities, one lesson", 9), ("03", "What IT leaders worry about", 10),
            ("04", "Microsoft's nine steps", 11), ("05", "A 90-day plan", 12), ("", "Sources and method", 13)]
    li = ''.join(f'''<div style="display:flex;align-items:baseline;padding:4.4mm 0;border-bottom:.25mm solid var(--line)">
      <span class="mono" style="width:14mm;font-size:8pt;color:var(--blue)">{a}</span><span style="flex:1;font-size:15pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span>
      <span class="mono" style="font-size:8pt;color:var(--mid)">{c:02d}</span></div>''' for a, b, c in rows)
    body = f'<div class="eyebrow" style="margin-top:14mm">Contents</div><h2 style="margin-top:5mm">Inside.</h2><div style="margin-top:11mm;border-top:.35mm solid var(--navy)">{li}</div>'
    return page(3, body, section="Contents")


def p4():
    def st(num, lab, s, unit=""):
        parts = [(num, 1.0)] + ([(unit, .5)] if unit else [])
        return f'<div>{G(parts, 38)}<div style="font-size:8.6pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{lab}<sup class="c">{s}</sup></div></div>'
    body = f'''{head("Executive summary", "Copilot is not the risk.<br>What it can reach is.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {st("56", "of organisations now have Copilot fully deployed, up from 29% a year earlier", 1, "%")}
      {st("77", "had at least one Microsoft 365 governance incident in the past year", 1, "%")}
      {st("29", "of IT leaders say AI tools have surfaced sensitive data they should not have had", 2, "%")}
      {st("1", "in 100 use a purpose-built governance tool; 57% rely on Microsoft's built-in ones", 1, "%")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What the surveys say</h3>
        <p style="margin-top:3mm">Adoption doubled in a year. Confidence did too: 93% of IT leaders say their Microsoft 365 governance is ready for AI. Yet nearly three in ten report AI surfacing data it should not have, and two in three learn about problems only after they happen.<sup class="c">1,2</sup></p></div>
      <div><h3>What it means</h3>
        <p style="margin-top:3mm">An assistant that answers from everything a person can open makes old permission mistakes visible at conversation speed: the broad sharing link, the former contractor, the folder nobody owns. The fix is mostly housekeeping. It is also tedious, which is why it gets skipped.</p>
        <p><b style="font-weight:600">Our view:</b> run the clean-up before the licences, not after the incident.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:26mm">Three phases</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">Remediate oversharing · Set up guardrails · Meet your regulations. Microsoft's own order, page 11.<sup class="c">4</sup></div></div>
    {src("Sources: 1 ShareGate State of Microsoft 365 2026. 2 ShareGate AI governance survey, April 2026. 4 Microsoft Learn. All vendor-run surveys.", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    body = bg_dark('<div class="glow" style="right:-30mm;top:60mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(21,93,252,.3) 0%,rgba(21,93,252,0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01 · The confidence gap</div>
    <div style="position:absolute;left:18mm;top:52mm">{G("93%", 128, ls=-0.07)}
      <div class="lede" style="margin-top:7mm;max-width:116mm;font-size:14pt;color:#fff;font-weight:300">of IT leaders say their Microsoft 365 governance is ready to support AI responsibly.<sup class="c">2</sup></div></div>
    <div style="position:absolute;right:18mm;top:150mm">{dots(10,10,29,pitch=7.2,d=4.4,c1="#F5A623",c2="#F5A623")}
      <div class="mono" style="font-size:6pt;letter-spacing:.14em;color:rgba(255,255,255,.6);margin-top:3mm;text-transform:uppercase">29 in 100 say AI surfaced data it should not have</div></div>
    <div style="position:absolute;left:18mm;bottom:30mm"><h2 style="font-size:34pt">Confident.<br>And one in three<br>exposed.</h2></div>'''
    return page(5, body, dark=True, section="01 · The confidence gap")


def p6():
    def bars(title, a, b, la, lb):
        return f'''<div style="margin-bottom:11mm"><div style="font-size:9.4pt;font-weight:500;margin-bottom:3.6mm">{title}</div>
        <div style="display:flex;align-items:center;gap:4mm;margin-bottom:2.2mm"><span class="mono" style="width:12mm;font-size:7pt;color:var(--mid)">{la}</span><div style="height:7mm;width:{a*.62:.0f}mm;border-radius:1.6mm;background:#C9D6EE"></div><span style="font-weight:600;font-size:11pt">{a}%</span></div>
        <div style="display:flex;align-items:center;gap:4mm"><span class="mono" style="width:12mm;font-size:7pt;color:var(--mid)">{lb}</span><div style="height:7mm;width:{b*.62:.0f}mm;border-radius:1.6mm;background:var(--grad)"></div><span style="font-weight:600;font-size:11pt">{b}%</span></div></div>'''
    body = f'''{head("01 · The confidence gap", "Adoption doubled.<br>Governance did not.", "Two ways of counting Copilot use, both rising. The definitions differ, so the two figures should not be added or compared with each other.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:12mm">
      <div>{bars("Full Copilot deployment", 29, 56, "2025", "2026")}{bars("Copilot in production", 82, 93, "2025", "2026")}</div>
      <div class="card"><div class="eyebrow">How governance is done</div>
        <div style="margin-top:5mm">
          <div class="kv"><span>Built-in Microsoft tools</span><span>57%</span></div><div class="kv"><span>Manual or internal policies</span><span>38%</span></div>
          <div class="kv"><span>No governance</span><span>4%</span></div><div class="kv"><span>Purpose-built tool</span><span>1%</span></div></div>
        <p style="font-size:7.8pt;margin-top:3mm;color:var(--mid)">Share of organisations. ShareGate respondents.<sup class="c">1</sup></p></div></div>
    <div class="hair" style="margin:5mm 0 9mm"></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9mm">
      <div>{G("65%", 34, ls=-0.045)}<p style="font-size:9pt;margin-top:3mm">learn about governance problems only after the fact. 35% monitor proactively.<sup class="c">1</sup></p></div>
      <div>{G("93%", 34, ls=-0.045)}<p style="font-size:9pt;margin-top:3mm">have Copilot in production in the 2026 report, up from 82%. The April survey also finds 93% fully or partly deployed.<sup class="c">1,2</sup></p></div></div>
    {src("Source: 1 ShareGate, State of Microsoft 365 2026 (23 Sept 2026). 2 ShareGate, April 2026. Vendor-run, self-reported; no fielding dates published.")}'''
    return page(6, body, section="01 · The confidence gap")


def p7():
    items = [(38, "left former employees or guests with access they should have lost"), (35, "hit an audit or compliance gap"), (26, "had sensitive content reach the wrong people")]
    cols = ''.join(f'''<div>{dots(10,10,n,pitch=4.4,d=2.9,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",28,ls=-0.045)}</div>
      <p style="font-size:8.8pt;margin-top:2.4mm;max-width:46mm">{t}<sup class="c">1</sup></p></div>''' for n, t in items)
    body = f'''{head("01 · The confidence gap", "What goes wrong,<br>and how often.", "Across the past year, 77% of organisations had at least one Microsoft 365 governance incident. Three kinds account for most of what surveyed teams reported.")}
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin-top:13mm">{cols}</div>
    <div class="src" style="margin-top:6mm">Share of all organisations surveyed. Incidents counted include oversharing, stale access, audit gaps and shadow IT or AI. Self-reported.</div>
    <div class="hair" style="margin:11mm 0 9mm"></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div class="eyebrow">Our view</div>
      <div><p style="font-size:9.6pt">None of these three is new. A leaver who keeps access, a link that was meant for one person, a library nobody reviews: IT teams have lived with them for years because they were hard to see and slow to exploit.</p>
      <p style="font-size:9.6pt">An assistant that searches across everything makes them fast to find. That is the real change Copilot brings.</p></div></div>
    {src("Source: 1 ShareGate, State of Microsoft 365 2026. Vendor-run survey of 943 IT professionals and 851 IT leaders, nine countries.")}'''
    return page(7, body, section="01 · The confidence gap")


def p8():
    steps = [("A person asks Copilot a question", "It answers from content that person can already open."), ("It searches the places they can reach", "Content across Microsoft 365 that their permissions allow them to open."),
             ("Whatever is overshared is now findable", "A company-wide link, an old guest, a site with broken inheritance.")]
    st = ''.join(f'<div style="display:grid;grid-template-columns:12mm 1fr;gap:5mm;padding:6mm 0;border-bottom:.25mm solid var(--line)"><div style="width:9mm;height:9mm;border-radius:50%;background:var(--grad-d);color:#fff;font-weight:600;font-size:9pt;display:flex;align-items:center;justify-content:center">{i+1}</div><div><h3 style="font-size:12.6pt">{a}</h3><p style="font-size:9.2pt;margin-top:1.6mm">{b}</p></div></div>' for i, (a, b) in enumerate(steps))
    body = f'''{head("02 · How Copilot sees your data", "It does not break the rules.<br>It follows yours.", "Copilot does not need a vulnerability to show someone the wrong file. It needs the wrong person to have access.")}
    <div style="margin-top:10mm;border-top:.35mm solid var(--navy)">{st}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:11mm">
      <div class="card"><div class="eyebrow">Why a quick fix is not a fix</div><p style="font-size:8.8pt;margin-top:3mm">Microsoft's Restricted Content Discovery hides chosen SharePoint sites from Copilot, but it is a temporary control. It does not change permissions: anyone with access can still open the content.<sup class="c">5</sup></p></div>
      <div class="card"><div class="eyebrow">What it costs</div><p style="font-size:8.8pt;margin-top:3mm">Microsoft cautions that overusing it reduces how complete Copilot's answers are. Changes to large sites can take over a week to apply.<sup class="c">5</sup></p></div></div>
    {src("Source: 5 Microsoft Learn, Restricted Content Discovery. The three-step explanation is ours, consistent with ShareGate's finding that leaders expect Copilot's access to reflect appropriate permissions.")}'''
    return page(8, body, section="02 · How Copilot sees your data")


def p9():
    cards = [("EchoLeak", "CVE-2025-32711", "CVSS 9.3 critical", "A zero-click flaw in Microsoft 365 Copilot that, according to its finders at Aim Security, allowed data to be pulled out of Copilot's context with no action from the user. Microsoft fixed it server-side in June 2025. No customer action was needed and there was no evidence of exploitation in the wild.", "6"),
             ("Copilot Studio flaw", "CVE-2026-21520", "CVSS 7.5 high", "Researchers at Capsule Security showed that crafted text in a public SharePoint form could steer an agent into reading connected data and emailing it out. Data-loss rules did not fire because the email used a legitimate action. Microsoft patched it on 15 January 2026. Exploitation was shown only in testing.", "6")]
    cc = ''.join(f'''<div class="card" style="padding:8mm"><div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">{a} · {b}</div><span class="tag" style="color:{AMBER}">{c}</span></div>
      <p style="margin-top:4mm;font-size:9.4pt">{d}<sup class="c">{s}</sup></p></div>''' for a, b, c, d, s in cards)
    body = f'''{head("02 · How Copilot sees your data", "Two vulnerabilities,<br>one lesson.", "Both were fixed by Microsoft. Both are useful because they show where governance has to do the work that patching cannot.")}
    <div style="display:grid;gap:6mm;margin-top:11mm">{cc}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:11mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.4pt">A patch removes a specific hole. It does not tell you what the assistant could reach, whether a form is public, or whether outbound email is monitored. Those questions belong to the organisation, not the vendor.</p></div>
    {src("Sources: 6 MITRE CVE records for CVE-2025-32711 and CVE-2026-21520; The Hacker News (EchoLeak, finder per press); VentureBeat (Capsule Security, per press). We did not read the finders' own write-ups.", "20mm")}'''
    return page(9, body, section="02 · How Copilot sees your data")


def p10():
    def unit(n, lab):
        return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
                f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">3</sup></div></div>')
    body = f'''{head("03 · What IT leaders worry about", "Oversharing first.<br>Agents next.", "A Gartner survey of IT leaders responsible for Microsoft 365 at 186 organisations, run March to May 2026, as reported by Opsin.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:12mm">
      {unit(51, "name oversharing and data loss as the top barrier to deployment")}{unit(80, "want more governance controls before widely deploying agents")}
      {unit(68, "worry about Copilot agent sprawl")}{unit(86, "are limiting Copilot Studio deployments")}</div>
    <div class="src" style="margin-top:6mm">Gartner survey as reported by Opsin, a governance-tool vendor. We have not read Gartner's report.</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div class="card" style="display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:{AMBER};flex:none">Unreconciled</span>
      <p style="font-size:8.6pt">Another vendor blog quotes different figures from apparently the same research. Until the Gartner note itself is read, treat these four numbers as indicative, and look at direction rather than decimals.</p></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.4pt">The order of worries is the useful part. Oversharing is the problem in front of you today; agents multiply it tomorrow. Fix the foundation first, and agent rules become much easier to write.</p></div>
    {src("Source: 3 Opsin, 18 June 2026, summarising Gartner's 'Microsoft 365 Copilot and Agents: Assessing Impact and Value in 2026'. The 86% is the share limiting Copilot Studio deployments.", "20mm")}'''
    return page(10, body, section="03 · What IT leaders worry about")


def p11():
    phases = [("01", "Remediate oversharing", ["Find high-risk sites with Purview data risk assessments and SharePoint Advanced Management", "Apply interim protection: Restricted Content Discovery and DLP for Copilot", "Fix access: label sites, remove company-wide and anonymous links, review site access, assign owners"]),
              ("02", "Set up guardrails", ["Secure defaults: restricted access for critical sites, no Anyone links, labels at site creation", "Auto-labelling, default labels, DLP, insider-risk protection", "Keep watching: recurring risk assessments and alert reviews"]),
              ("03", "Meet your regulations", ["Assess against AI regulations in Compliance Manager", "Set audit-log retention and decide what happens to Copilot interactions", "Archive or retire inactive sites and apply retention policies"])]
    cc = ''.join(f'''<div style="padding:7mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);display:grid;grid-template-columns:22mm 1fr;gap:6mm">
      <div>{G(n, 34, ls=-0.04)}</div><div><h3 style="font-size:14pt;color:#fff">{t}</h3><ul style="list-style:none;margin-top:3mm">{''.join(f'<li style="font-size:9.2pt;line-height:1.5;color:var(--slate);padding-left:4mm;position:relative;margin-bottom:1.8mm"><span style="position:absolute;left:0;top:1.9mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--grad-d)"></span>{x}</li>' for x in b)}</ul></div></div>''' for n, t, b in phases)
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">04 · Microsoft's nine steps</div>
    <h2 style="margin-top:5mm;max-width:150mm">The vendor's own order.<br>Three phases, nine steps.</h2>
    <p class="lede" style="margin-top:6mm;max-width:140mm">From Microsoft's Copilot oversharing blueprint. SharePoint Advanced Management is included with Copilot licences; Purview foundations come with Microsoft 365 E3, with extra features in E5.<sup class="c">4</sup></p>
    <div style="margin-top:9mm;border-top:.35mm solid rgba(255,255,255,.3)">{cc}</div>'''
    return page(11, body, dark=True, section="04 · Microsoft's nine steps")


def p12():
    rows = [("Days 1–30", "Look", ["Run the site assessment. Rank sites by sensitivity and audience.", "List leavers, guests and ownerless sites with live access.", "Agree what Copilot may and may not draw on."], "Play 01"),
            ("Days 31–60", "Fix", ["Remove company-wide and anonymous links. Label the sensitive sites.", "Switch on interim protection for the highest-risk ones.", "Assign an owner to every site that keeps access."], "Play 02"),
            ("Days 61–90", "Hold", ["Set secure defaults for new sites and Teams.", "Start a monthly review of new exposure.", "Report three numbers to the board: exposed sites, stale access, time to fix."], "Play 06")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:36mm 1fr 18mm;gap:6mm;padding:8mm 0;border-bottom:.25mm solid var(--line);align-items:start">
      <div><div class="mono" style="font-size:6.6pt;letter-spacing:.12em;color:var(--blue);text-transform:uppercase">{a}</div>{G(b, 24, ls=-0.04)}</div>
      <ul style="list-style:none">{''.join(f'<li style="font-size:9.6pt;line-height:1.55;padding-left:4mm;position:relative;margin-bottom:2.2mm"><span style="position:absolute;left:0;top:1.9mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--grad-d)"></span>{x}</li>' for x in c)}</ul>
      <span class="tag" style="color:var(--blue)">{p}</span></div>''' for a, b, c, p in rows)
    body = f'''{head("05 · A 90-day plan", "Look, fix, hold.", "Our reading of Microsoft's steps for a UK mid-market tenant. Illustrative: adapt it to your estate and licences.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{cc}</div>
    <div class="card" style="margin-top:9mm;display:flex;gap:7mm;align-items:center;background:var(--navy);color:#fff"><div class="eyebrow" style="color:var(--cyan);width:30mm">Ask your IT partner</div>
      <div class="pull" style="font-size:12pt;color:#fff">“Which of our sites could Copilot answer from today that we would not want a new starter to read?”</div></div>
    {src("Plays refer to The Resilience Playbook. This plan is illustrative and not Microsoft guidance.", "20mm")}'''
    return page(12, body, section="05 · A 90-day plan")


def p13():
    refs = [("1", "ShareGate. <b>State of Microsoft 365 2026.</b> Press release, 23 September 2026; sharegate.com/guides/state-of-microsoft-365-report. Surveys of 943 IT professionals and 851 IT leaders, nine countries. Vendor-run; no fielding dates or research firm published."),
            ("2", "ShareGate. <b>93% of IT leaders are confident in their AI governance but nearly 1 in 3 report data exposure incidents.</b> 20 April 2026; sharegate.com/blog/93-of-it-leaders-are-confident-in-their-ai-governance-but-nearly-1-in-3-report-data-exposure-incidents. 851 IT leaders, seven countries."),
            ("3", "Opsin. <b>Opsin named in the Gartner Microsoft 365 Copilot and Agents research.</b> 18 June 2026; opsinsecurity.com/blog/opsin-named-2026-gartner-microsoft-copilot-agents-research. Gartner's own report was not read."),
            ("4", "Microsoft Learn. <b>Secure and govern Copilot: foundational deployment guidance</b> and <b>Configure a secure, governed data foundation for Microsoft 365 Copilot.</b> learn.microsoft.com/en-us/microsoft-365/copilot/secure-govern-copilot-foundational-deployment-guidance"),
            ("5", "Microsoft Learn. <b>Restricted Content Discovery.</b> learn.microsoft.com/en-us/sharepoint/restricted-content-discovery"),
            ("6", "MITRE CVE records CVE-2025-32711 and CVE-2026-21520 (cveawg.mitre.org); The Hacker News, 12 June 2025; VentureBeat, 15 April 2026.")]
    rows = ''.join(f'<div style="display:grid;grid-template-columns:10mm 1fr;gap:3mm;padding:3.6mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8.6pt;font-weight:500">{n}</div><div style="font-size:8.2pt;line-height:1.55;word-break:break-word">{t}</div></div>' for n, t in refs)
    body = f'''{head("Sources and method", "Where this comes from.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:8mm"><div class="eyebrow">Method notes</div>
      <p style="font-size:8.2pt">Accurate as of 27 October 2026. Every survey here is run or relayed by a vendor of governance tools and is self-reported. We keep separate studies separate: ShareGate's two surveys have different samples and country lists, and two of its figures are both 29%. UK-only breakdowns are not available for most figures. The nine steps are Microsoft's; the explanations and the 90-day plan are ours.</p></div>'''
    return page(13, body, section="Sources and method")


def p14():
    wall = badge_wall(["msmw", "mssec", "iso", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{dots(10,10,100,pitch=11,d=6.6,halo=False)}</div>
    <div style="position:absolute;left:0;right:0;top:158mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">Microsoft Copilot consulting for UK businesses.<br>Microsoft Solutions Partner for Modern Work and Security.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(14, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("copilot.html", "w", encoding="utf8").write(build())
