from common import DEFS, logo, gt as G, gt_slice, dots, ghost, badge_wall
from report import bg_dark
from case import CSS as _C, head, src, ev, RED, AMBER
CSS = _C + ".tight .ev{padding-bottom:4.4mm}"

TITLE = "Your MSP Is About to Be Regulated"
SHORT = "Resilience Bill Report"
N = 14


def page(n, body, dark=False, section="", folio=True):
    spine = f'<div class="spine">{SHORT} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>' if folio and section[:2].isdigit() and not dark else ""
    run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
    fol = f'<div class="folio"><span>{SHORT} · <b>2026</b></span><span><b>{n:02d}</b> / {N}</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'


def p1():
    clock = dots(12, 6, 24, pitch=14, d=8.4, order="row", dim=set(range(24, 72)), halo=False)
    body = bg_dark('<div class="glow" style="left:10mm;top:40mm;width:190mm;height:130mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">REGULATION BRIEF · OCT 2026</span></div>
    <div style="position:absolute;left:18mm;top:56mm">{clock}
      <div class="mono" style="display:flex;justify-content:space-between;font-size:6.6pt;letter-spacing:.12em;color:rgba(255,255,255,.6);margin-top:5mm;text-transform:uppercase">
        <span style="color:var(--cyan)">Hour 1 → 24 · tell the regulator</span><span>Hour 72 · full report</span></div></div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:40pt;line-height:1;letter-spacing:-.05em">Your MSP is about</div>
      <div style="font-weight:600;font-size:40pt;line-height:1;letter-spacing:-.05em;margin-top:1mm">to be</div>
      <div style="margin-top:1mm">{G("regulated.", 62, weight=600, ls=-0.055)}</div>
      <div class="lede" style="margin-top:6mm;max-width:124mm;font-size:12.5pt">The Cyber Security and Resilience Bill puts a 24-hour clock on managed IT providers. What it means for the businesses that depend on them.</div>
      <div class="hair" style="margin:8mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    body = f'''{head("About this report", "A Bill, not yet an Act.<br>Read it that way.", "Parliament is still amending this legislation. We read the text as amended on report in the Lords, published on 26 October 2026, and say plainly what could still change.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">
      <div class="card"><div class="eyebrow">Primary</div><h3 style="margin:3mm 0 2mm;font-size:11pt">The Bill itself</h3><p style="font-size:8.4pt">HL Bill 62, as amended on report, read through Parliament's Bills API. The public bill page was blocked to our tools, so we used the same data from the official interface.</p></div>
      <div class="card"><div class="eyebrow">Primary</div><h3 style="margin:3mm 0 2mm;font-size:11pt">Hansard and GOV.UK</h3><p style="font-size:8.4pt">Lords Report stage of 26 October 2026, and the Government's factsheets and impact assessment, which describe the Bill as introduced.</p></div>
      <div class="card"><div class="eyebrow">Primary</div><h3 style="margin:3mm 0 2mm;font-size:11pt">Cyber Security Breaches Survey</h3><p style="font-size:8.4pt">DSIT and Home Office, 30 April 2026, for the supplier-review figures.</p></div>
      <div class="card"><div class="eyebrow">Not read</div><h3 style="margin:3mm 0 2mm;font-size:11pt">What we did not use</h3><p style="font-size:8.4pt">Explanatory Notes, library briefings, regulator guidance. We found no guidance aimed at managed service providers yet.</p></div></div>
    <div class="card" style="margin-top:6mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Not legal advice</span>
      <p style="font-size:8.6pt;color:var(--slate)">This is a plain-English reading of public documents by a technology provider. Take legal advice before relying on it for a contract or a compliance decision.</p></div>
    <div class="src" style="position:absolute;left:18mm;right:18mm;bottom:15mm">© 2026 Transputec Ltd. Government material is reproduced under the Open Government Licence where applicable.</div>'''
    return page(2, body, section="About")


def p3():
    rows = [("", "Executive summary", 4), ("01", "Where the Bill stands", 5), ("", "The journey so far", 6), ("02", "Who is in scope", 7),
            ("03", "The 24-hour clock", 8), ("", "What it costs to get wrong", 9), ("04", "What it means for you", 10),
            ("05", "The supplier-risk gap", 11), ("06", "What we do not know yet", 12), ("", "Sources and method", 13)]
    li = ''.join(f'''<div style="display:flex;align-items:baseline;padding:4.4mm 0;border-bottom:.25mm solid var(--line)">
      <span class="mono" style="width:14mm;font-size:8pt;color:var(--blue)">{a}</span><span style="flex:1;font-size:15pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span>
      <span class="mono" style="font-size:8pt;color:var(--mid)">{c:02d}</span></div>''' for a, b, c in rows)
    return page(3, f'<div class="eyebrow" style="margin-top:14mm">Contents</div><h2 style="margin-top:5mm">Inside.</h2><div style="margin-top:11mm;border-top:.35mm solid var(--navy)">{li}</div>', section="Contents")


def p4():
    def st(num, lab, s, unit=""):
        parts = [(num, 1.0)] + ([(unit, .5)] if unit else [])
        return f'<div>{G(parts, 36)}<div style="font-size:8.6pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{lab}<sup class="c">{s}</sup></div></div>'
    body = f'''{head("Executive summary", "Managed IT providers are<br>about to join the rulebook.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {st("24", "hours to tell the regulator that a significant incident has happened", 1, " h")}
      {st("72", "hours to file a full report with the Information Commission", 1, " h")}
      {st("£17m", "or 4% of turnover: the higher maximum penalty, whichever is greater", 1)}
      {st("788", "providers expected in scope, the Government's central estimate out of 12,867", 2)}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What the Bill does</h3>
        <p style="margin-top:3mm">It amends the Network and Information Systems Regulations 2018 to cover managed service providers: firms that remotely manage a customer's IT. They must manage security risks, register with the regulator, report significant incidents on a 24 and 72 hour clock, and tell affected customers.<sup class="c">1,2</sup></p></div>
      <div><h3>What it means for buyers</h3>
        <p style="margin-top:3mm">Customers should hear about a serious incident at their provider sooner and more reliably. But the duty to tell customers has no fixed deadline, the thresholds are still to be set, and the Bill gives customers no right to compensation.<sup class="c">1</sup></p>
        <p><b style="font-weight:600">Our view:</b> a provider that already works to ISO 27001 will find the duties familiar. The 24-hour clock is the real change.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:26mm">Not yet law</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">Lords Third Reading is listed for 2 November 2026. The Commons then considers the Lords' amendments. No Royal Assent date or commencement date has been published.</div></div>
    {src("Sources: 1 Cyber Security and Resilience (NIS) Bill, HL Bill 62 as amended on report. 2 Government impact assessment (updated).", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    body = bg_dark('<div class="glow" style="right:-30mm;top:60mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(21,93,252,.3) 0%,rgba(21,93,252,0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01 · Where the Bill stands</div>
    <div style="position:absolute;left:18mm;top:52mm">{G("2 Nov", 112, ls=-0.06)}
      <div class="lede" style="margin-top:8mm;max-width:116mm;font-size:14pt;color:#fff;font-weight:300">is when the House of Lords is listed to give the Bill its Third Reading. After that, the Commons must consider the Lords' amendments.<sup class="c">1</sup></div></div>
    <div style="position:absolute;left:18mm;bottom:30mm"><h2 style="font-size:34pt">Close.<br>But not law yet.</h2></div>'''
    return page(5, body, dark=True, section="01 · Where the Bill stands")


def p6():
    e = [ev("12 Nov 2025", "First reading", "The Bill is introduced in the Commons.", "", 1),
         ev("6 Jan 2026", "Second reading", "The Commons debates the principle of the Bill.", "", 1),
         ev("Feb 2026", "Committee", "A Public Bill Committee sits in February to examine it line by line.", "", 1),
         ev("14 May 2026", "Carried over", "The Bill is carried over into a new session and reintroduced.", "", 1),
         ev("16 Jun 2026", "Commons completes its work", "Report stage and Third Reading in a single day. The Bill passes to the Lords.", "k", 1),
         ev("14 Jul 2026", "Lords second reading", "Peers debate the Bill. Ministers describe bringing large and medium managed service providers into scope.", "", 1),
         ev("Sep 2026", "Grand Committee", "Detailed Lords scrutiny on 1, 3 and 7 September. Substantial new material is added, including national-security directions.", "", 1),
         ev("26 Oct 2026", "Lords report stage", "Further amendments. The Lords sitting ended partway through the Commencement clause.", "a", 1),
         ev("2 Nov 2026", "Third reading (listed)", "Then back to the Commons to consider the Lords' amendments, and Royal Assent.", "", 1)]
    body = f'''{head("01 · Where the Bill stands", "The journey so far.")}
    <div class="tl tight" style="margin-top:7mm">{''.join(e)}</div>
    {src("Source: 1 UK Parliament Bills API and Hansard (Lords, 26 October 2026). The 2 November date is a listed sitting, not an outcome.", "20mm")}'''
    return page(6, body, section="01 · Where the Bill stands")


def p7():
    body = f'''{head("02 · Who is in scope", "If you remotely manage<br>someone else's IT.", "The Bill defines a relevant managed service provider by what it does and how big it is.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:7mm">
      <div class="card"><div class="eyebrow" style="color:#2E9E4F">In scope</div><ul style="list-style:none;margin-top:4mm">
        {''.join(f'<li style="font-size:9pt;line-height:1.5;padding:2mm 0;border-bottom:.25mm solid var(--line)">{x}</li>' for x in ["Remote support and help desk", "Managed security: SOC, SIEM, firewall management", "Managed cloud", "Ongoing monitoring and administration of customer systems"])}</ul><p style="font-size:7.8pt;color:var(--mid);margin-top:3mm">Examples from the Government factsheet.<sup class="c">3</sup></p></div>
      <div class="card"><div class="eyebrow" style="color:var(--mid)">Out of scope</div><ul style="list-style:none;margin-top:4mm">
        {''.join(f'<li style="font-size:9pt;line-height:1.5;padding:2mm 0;border-bottom:.25mm solid var(--line)">{x}</li>' for x in ["Software sold as a product", "Install-only projects", "Pure operational-technology vendors", "Consultancies without ongoing access", "Micro and small enterprises"])}</ul><p style="font-size:7.8pt;color:var(--mid);margin-top:3mm">Small and micro providers can still be designated as critical suppliers.<sup class="c">1</sup></p></div></div>
    <div style="display:grid;grid-template-columns:50mm 1fr;gap:10mm;margin-top:6mm;align-items:center">
      <div>{dots(10,10,6,pitch=5,d=3.2,order="row",unlit="#E1E7F1",halo=False)}<div class="mono" style="font-size:6pt;letter-spacing:.1em;color:var(--mid);margin-top:3mm;text-transform:uppercase">About 6 in 100 UK MSPs</div></div>
      <div>{G("556–1,019", 30, ls=-0.045)}<p style="font-size:9pt;margin-top:3mm">of an estimated 12,867 UK managed service providers fall in scope, central estimate 788. The assessment assumes in-scope firms employ at least 50 people in the UK and exceed €10 million turnover. The Bill itself sets no headcount or turnover figure and refers to the EU Commission's definition of small enterprises.<sup class="c">2</sup></p></div></div>
    <div class="hair" style="margin:6mm 0 5mm"></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div class="eyebrow">Also covered</div>
      <p style="font-size:8.8pt">Data centres, at 1 MW (third-party) or 10 MW (enterprise), regulated by Ofcom. And any supplier of any size that the regulator designates as critical because an incident could significantly disrupt the economy or daily life.<sup class="c">1</sup></p></div>
    {src("Sources: 1 HL Bill 62. 2 Impact assessment; Frontier Economics research (March 2025). 3 GOV.UK factsheet on relevant managed service providers.", "20mm")}'''
    return page(7, body, section="02 · Who is in scope")


def p8():
    steps = [("Hour 0", "The provider becomes aware", "Of a significant incident affecting the systems it relies on to deliver the managed service."), ("Within 24 hours", "Initial notification", "To the Information Commission, the regulator formerly known as the ICO: name, service and brief details. A copy goes to the NCSC at the same time."),
             ("Within 72 hours", "Full notification", "Timing and duration, nature, impact including cross-border, and any upstream incident."), ("Then, as soon as reasonably practicable", "Customers are told", "Those likely to be adversely affected, with the nature of the incident and why they are affected. No fixed deadline, and updates only 'as the provider considers necessary'.")]
    st = ''.join(f'''<div style="display:grid;grid-template-columns:50mm 1fr;gap:7mm;padding:6mm 0;border-bottom:.25mm solid var(--line)">
      <div><div class="mono" style="font-size:6.6pt;letter-spacing:.1em;color:{'#E5484D' if i==3 else 'var(--blue)'};text-transform:uppercase;margin-bottom:1.6mm">{a}</div><h3 style="font-size:13.5pt;letter-spacing:-.03em">{b}</h3></div><p style="font-size:9.2pt">{c}</p></div>''' for i, (a, b, c) in enumerate(steps))
    body = f'''{head("03 · The 24-hour clock", "Two deadlines for the regulator.<br>None for you.", "Today the NIS rules allow a single 72-hour notification. The Bill replaces it with a faster, two-step model for providers.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{st}</div>
    <div class="card" style="margin-top:8mm;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">Also required</span>
      <p style="font-size:8.6pt">Register with the regulator within three months of the rules starting to apply, nominate a UK representative if based overseas, and report changes within seven days.<sup class="c">1</sup> What counts as a significant incident will be set later in secondary legislation.<sup class="c">3</sup></p></div>
    {src("Sources: 1 HL Bill 62, new regulations 14C to 14G. 3 GOV.UK incident reporting factsheet.", "20mm")}'''
    return page(8, body, section="03 · The 24-hour clock")


def p9():
    rows = [("Higher maximum", "£17m or 4% of turnover", ["Failing the security risk-management duty", "Failing to notify an incident", "Missing the 24 or 72 hour deadlines", "Failing to notify affected customers"]),
            ("Standard maximum", "£10m or 2% of turnover", ["Registration failures", "Failing to nominate a UK representative", "Failing to copy the NCSC", "Failing to give customers updates"])]
    cc = ''.join(f'''<div class="card" style="padding:7mm;min-width:0;{'background:var(--navy);color:#fff' if i==0 else ''}"><div class="eyebrow" style="color:{'var(--cyan)' if i==0 else 'var(--blue)'}">{a}</div>
      <div style="margin-top:4mm;font-weight:600;font-size:15pt;letter-spacing:-.035em;color:{"#fff" if i==0 else "var(--navy)"}">{b}</div><ul style="list-style:none;margin-top:5mm">{''.join(f'<li style="font-size:9pt;line-height:1.5;padding:2.2mm 0;border-top:.25mm solid {"rgba(255,255,255,.14)" if i==0 else "var(--line)"};color:{"var(--slate)" if i==0 else "var(--navy)"}">{x}</li>' for x in c)}</ul></div>''' for i, (a, b, c) in enumerate(rows))
    body = f'''{head("03 · The 24-hour clock", "What it costs to get<br>it wrong.", "In each band the maximum is the greater of the two figures. Penalties consider impact, remedial steps and previous compliance.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:11mm">{cc}</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9mm">
      <div>{G("£1m · £8.5m · £17m", 18, ls=-0.04)}<p style="font-size:8.8pt;margin-top:3mm">The existing NIS maximum penalty bands today.<sup class="c">3</sup></p></div>
      <div><div class="eyebrow">Turnover</div><p style="font-size:8.8pt;margin-top:2mm">The Bill counts turnover inside and outside the UK. The precise definition is left to secondary legislation.<sup class="c">1,3</sup></p></div></div>
    {src("Sources: 1 HL Bill 62, section 21 (new regulation 18). 3 GOV.UK enforcement factsheet. Maximums, not expected penalties.", "20mm")}'''
    return page(9, body, section="03 · The 24-hour clock")


def p10():
    cc = [("What changes", ["Your provider must manage risks to the systems it uses to serve you, proportionately and with regard to the state of the art.", "It must tell the regulator within 24 hours of a significant incident.", "It must tell you if you are likely to be adversely affected."]),
          ("What does not", ["You gain no statutory right to compensation.", "Nothing in the Bill obliges you to act.", "Your contract and your SLA still decide what you can recover."])]
    cols = ''.join(f'<div class="card" style="padding:7mm"><div class="eyebrow">{a}</div><ul style="list-style:none;margin-top:4mm">{"".join(f"<li style=\"font-size:9.2pt;line-height:1.55;padding:2.4mm 0;border-top:.25mm solid var(--line)\">{x}</li>" for x in b)}</ul></div>' for a, b in cc)
    qs = ["Are you a relevant managed service provider under the Bill, and will you register?", "How quickly would you tell us of an incident at your end, in writing?", "Who would you notify besides us: the regulator, the NCSC?", "Which of our systems can your staff reach, and how is that access protected?"]
    ql = ''.join(f'<div style="padding:3.6mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);font-weight:300;font-size:10.6pt;line-height:1.4;color:#fff">“{q}”</div>' for q in qs)
    body = f'''{head("04 · What it means for you", "Ask now, before it is<br>a contract dispute.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:10mm">{cols}</div>
    <div class="card onnavy" style="margin-top:7mm;background:var(--navy);color:#fff;padding:7mm 8mm"><div class="eyebrow" style="color:var(--cyan);margin-bottom:2mm">Four questions for your provider</div>{ql}</div>
    <p style="font-size:8pt;color:var(--mid);margin-top:4mm">Procurement checks are our inference from the Bill's duties, not a legal effect of the Bill.</p>
    {src("Sources: HL Bill 62, new regulations 14B and 14G; Government factsheet on relevant managed service providers.", "20mm")}'''
    return page(10, body, section="04 · What it means for you")


def p11():
    def unit(n, lab, s=1):
        return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
                f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">{s}</sup></div></div>')
    body = f'''{head("05 · The supplier-risk gap", "Most businesses do not<br>check their suppliers.", "The government's own survey shows how few look at the providers they depend on. The Bill puts some of that duty on the provider instead.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:12mm">
      {unit(15, "of all businesses review the risks from immediate suppliers")}{unit(30, "of medium businesses do")}{unit(48, "of large businesses do")}{unit(11, "of businesses require suppliers to hold a certification")}</div>
    <div class="src" style="margin-top:6mm">Cyber Security Breaches Survey 2025/26, businesses. Only 6% look at their wider supply chain.</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.4pt">A statutory duty on providers is welcome, but it is a floor, not an assurance. The Bill tells you what your provider must do after something goes wrong. Checking what it does before is still your job, and a certification such as ISO 27001 or Cyber Essentials Plus is a sensible place to start.</p></div>
    {src("Source: 1 DSIT and Home Office, Cyber Security Breaches Survey 2025/26 (30 April 2026). Medium and large businesses were also more likely to report a breach: 65% and 69%.", "20mm")}'''
    return page(11, body, section="05 · The supplier-risk gap")


def p12():
    items = [("Royal Assent", "No date is published. The Commons must still consider the Lords' amendments after 2 November."), ("Commencement", "The managed-service-provider provisions start on a day the Secretary of State appoints by regulations. None is stated."),
             ("Significant incident", "The thresholds that trigger reporting will be set in secondary legislation."), ("Turnover", "The precise definition for penalty purposes is left to secondary legislation."),
             ("Small and micro providers", "Ministers proposed a power to bring individual high-risk small providers into scope. It is a statement, not law."), ("The text itself", "The Lords has added substantial new material, including national-security directions and a provision on loss of control of an AI agent. The Bill can still change.")]
    cc = ''.join(f'<div style="display:grid;grid-template-columns:44mm 1fr;gap:6mm;padding:5.4mm 0;border-bottom:.25mm solid var(--line)"><h3 style="font-size:11.6pt">{a}</h3><p style="font-size:9.2pt">{b}<sup class="c">1</sup></p></div>' for a, b in items)
    body = f'''{head("06 · What we do not know yet", "Six open questions.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{cc}</div>
    <div class="card" style="margin-top:8mm;display:flex;gap:7mm;align-items:center;background:var(--navy);color:#fff"><div class="eyebrow" style="color:var(--cyan);width:24mm">Our view</div>
      <div class="pull" style="font-size:12.5pt;color:#fff">Do not wait for the dates. A provider that can already show a tested incident process will have no scramble when they arrive.</div></div>
    {src("Source: 1 HL Bill 62 as amended on report, section 69 (commencement); Hansard, Lords, 26 October 2026; GOV.UK summary of the Bill.", "20mm")}'''
    return page(12, body, section="06 · What we do not know yet")


def p13():
    refs = [("1", "UK Parliament. <b>Cyber Security and Resilience (Network and Information Systems) Bill, HL Bill 62, as amended on report</b> (published 26 October 2026), and Bill stages. bills.parliament.uk/bills/4035, read through bills-api.parliament.uk. Hansard, House of Lords, 26 October 2026."),
            ("2", "DSIT. <b>Cyber Security and Resilience Bill: impact assessment (updated)</b> and <b>Research on managed service providers 2025</b> (Frontier Economics, March 2025). gov.uk"),
            ("3", "GOV.UK. <b>Cyber Security and Resilience (NIS) Bill factsheets</b>: relevant managed service providers, incident reporting, enforcement, summary of the Bill. Dated 12 November 2025; collection updated 19 October 2026. These describe the Bill as introduced."),
            ("4", "DSIT and Home Office. <b>Cyber Security Breaches Survey 2025/26.</b> Official statistics, 30 April 2026. gov.uk/government/statistics/cyber-security-breaches-survey-20252026")]
    rows = ''.join(f'<div style="display:grid;grid-template-columns:10mm 1fr;gap:3mm;padding:3.8mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8.6pt;font-weight:500">{n}</div><div style="font-size:8.4pt;line-height:1.55;word-break:break-word">{t}</div></div>' for n, t in refs)
    body = f'''{head("Sources and method", "Where this comes from.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:8mm"><div class="eyebrow">Method notes</div>
      <div><p style="font-size:8.2pt">Accurate as of 27 October 2026. Quotations and figures come from the Bill text and Government documents. Where we describe what a duty means for a customer, we mark it as our inference. The Government's factsheets and impact assessment predate the Lords amendments, so figures such as the number of in-scope providers may change.</p>
      <p style="font-size:8.2pt">We found no regulator guidance for managed service providers on this Bill and cite none. We did not read the Explanatory Notes or parliamentary library briefings.</p></div></div>'''
    return page(13, body, section="Sources and method")


def p14():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{dots(12,6,24,pitch=11,d=6.6,order="row",dim=set(range(24,72)),halo=False)}
      <div class="mono" style="text-align:center;font-size:6.6pt;letter-spacing:.18em;color:var(--cyan);margin-top:5mm;text-transform:uppercase">24 hours · 72 hours · be ready</div></div>
    <div style="position:absolute;left:0;right:0;top:138mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">ISO 27001-certified delivery from a UK service desk.<br>24/7 support with incident response under SLA.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(14, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("csrb.html", "w", encoding="utf8").write(build())
