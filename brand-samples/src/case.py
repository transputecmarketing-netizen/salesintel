from common import FONTS, TOKENS, DEFS, logo, gt as G, gt_slice, dots, ghost, avatar, badge_wall, gov_tile
from report import CSS as RCSS, bg_dark

TITLE = "PHP2Shell Case Study"
N = 19
RED, AMBER = "#E5484D", "#F5A623"

CSS = RCSS + """
.alert{color:#E5484D}
.tl{position:relative;padding-left:9mm}
.tl:before{content:'';position:absolute;left:1.6mm;top:1mm;bottom:1mm;width:.4mm;background:linear-gradient(180deg,#00B8DB,#155DFC)}
.ev{position:relative;padding-bottom:8.4mm}
.ev:last-child{padding-bottom:0}
.ev i{position:absolute;left:-9mm;top:1.2mm;width:3.8mm;height:3.8mm;border-radius:50%;background:#fff;border:.7mm solid #155DFC}
.ev.a i{border-color:#E5484D;background:#E5484D}
.ev.k i{border-color:#00B8DB;background:#00B8DB}
.ev .d{font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.12em;color:var(--blue);text-transform:uppercase}
.ev.a .d{color:#E5484D}
.ev h3{font-size:11.8pt;margin:1.2mm 0 1mm}
.ev p{font-size:9.2pt;line-height:1.6}
.step2{display:flex;gap:3mm;align-items:flex-start;padding:2.6mm 0}
.step2 b{flex:none;width:6.4mm;height:6.4mm;border-radius:50%;background:var(--grad-d);color:#fff;font-size:7.4pt;display:flex;align-items:center;justify-content:center;font-weight:600}
.step2 span{font-size:8.6pt;line-height:1.5;color:var(--navy);padding-top:.8mm}
table.t{width:100%;border-collapse:collapse;font-size:8.6pt}
table.t th{text-align:left;font-family:'JetBrains Mono',monospace;font-size:6.4pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid);font-weight:500;padding:0 0 2.4mm;border-bottom:.35mm solid var(--navy)}
table.t td{padding:4.4mm 3mm 4.4mm 0;border-bottom:.25mm solid var(--line);vertical-align:top;line-height:1.5}
table.t td:first-child{font-weight:600}
"""


def page(n, body, dark=False, section="", folio=True):
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = ""
    if folio and section[:2].isdigit() and not dark:
        gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>'
    run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / {N}</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'


def head(eyebrow, h, lede=None, w="150mm"):
    l = f'<p class="lede" style="margin-top:7mm;max-width:142mm">{lede}</p>' if lede else ""
    return f'<div class="eyebrow" style="margin-top:14mm">{eyebrow}</div><h2 style="margin-top:5mm;max-width:{w}">{h}</h2>{l}'


def src(t, bottom="20mm"):
    return f'<div class="src" style="position:absolute;left:18mm;right:18mm;bottom:{bottom}">{t}</div>'


def ev(d, h, p, kind="", s=""):
    return f'<div class="ev {kind}"><i></i><div class="d">{d}</div><h3>{h}</h3><p>{p}<sup class="c">{s}</sup></p></div>'


# ---------------------------------------------------------------- pages
def p1():
    days = [(17, "a"), (18, "a"), (19, "a"), (20, "w"), (21, "k"), (22, "b"), (23, "b"), (24, "b"), (25, "b"), (26, "m"), (27, "f"), (28, "f"), (29, "f")]
    col = {"a": RED, "w": AMBER, "k": "linear-gradient(180deg,#00B8DB,#155DFC)", "b": "#2C72DB", "m": "#F5A623", "f": "rgba(255,255,255,.14)"}
    bars = ""
    for i, (d, k) in enumerate(days):
        h = 74 if k in ("k",) else (58 if k in ("m", "a", "w") else 44)
        op = ".5" if k == "a" and d in (18, 19) else "1"
        bars += (f'<div style="position:absolute;left:{i*13.4}mm;bottom:0;width:9.4mm;height:{h}mm;border-radius:2mm;background:{col[k]};opacity:{op}"></div>'
                 f'<div class="mono" style="position:absolute;left:{i*13.4}mm;bottom:-6mm;width:9.4mm;text-align:center;font-size:6.2pt;color:rgba(255,255,255,.55)">{d}</div>')
    marks = (f'<div class="mono" style="position:absolute;left:0;bottom:62mm;font-size:6.2pt;letter-spacing:.1em;color:{RED}">17 OCT · FIRST ATTEMPT</div>'
             f'<div class="mono" style="position:absolute;left:{4*13.4}mm;bottom:78mm;font-size:6.2pt;letter-spacing:.1em;color:#00B8DB;white-space:nowrap">21 · PATCH</div>'
             f'<div class="mono" style="position:absolute;left:{9*13.4-6}mm;bottom:62mm;font-size:6.2pt;letter-spacing:.1em;color:{AMBER};white-space:nowrap">26 · KEV</div>')
    body = bg_dark('<div class="glow" style="left:40mm;top:60mm;width:150mm;height:110mm;background:radial-gradient(circle,rgba(229,72,77,.16) 0%,rgba(229,72,77,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">CASE STUDY · OCT 2026</span></div>
    <div style="position:absolute;left:18mm;top:44mm"><div class="eyebrow" style="color:{RED}">CVE-2026-109618 · CVE-2026-109619 · CVSS 9.2</div></div>
    <div style="position:absolute;left:18mm;top:104mm;width:174mm;height:80mm">{marks}{bars}</div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:56pt;line-height:.98;letter-spacing:-.055em">Nine days</div>
      <div style="margin-top:1.5mm">{G("in October.", 56, weight=600, ls=-0.055)}</div>
      <div class="lede" style="margin-top:7mm;max-width:118mm;font-size:12.5pt">How two flaws in PHP went from first attack to the CISA exploited list while most of the internet was still deciding whether to patch.</div>
      <div class="hair" style="margin:9mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    facts = [("Name", "PHP2Shell (named by Wiz Research)"), ("CVEs", "CVE-2026-109618, CVE-2026-109619"), ("Severity", "CVSS v4.0 score 9.2, both"),
             ("Impact", "Unauthenticated remote code execution with the web worker's privileges"), ("Affects", "PHP itself: PHP-FPM, Apache mod_php, php-cgi, FrankenPHP, LiteSpeed"),
             ("Fixed in", "PHP 8.5.12, 8.4.27, 8.3.36, 8.2.35 (21 October 2026)"), ("Older branches", "Minimal source backports for PHP 7.4 to 8.1; vendor fixes"),
             ("Exploited", "Added to CISA's Known Exploited Vulnerabilities catalogue on 26 October 2026")]
    kv = ''.join(f'<div class="kv"><span style="color:var(--mid);font-size:8.4pt">{a}</span><span style="max-width:112mm;text-align:right;font-weight:500;font-size:8.8pt">{b}</span></div>' for a, b in facts)
    body = f'''{head("At a glance", "The facts, on one page.", "A case study of the fastest-moving PHP security event in years: what the flaws are, how the nine days unfolded, and what it asks of the people who run websites.")}
    <div style="margin-top:12mm;border-top:.35mm solid var(--navy)">{kv}<sup class="c" style="display:none">1</sup></div>
    <div class="card" style="margin-top:9mm;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">Read this first</span>
      <p style="font-size:8.6pt">This is a live event. Everything here is accurate as of 27 October 2026 and drawn from the sources on page 18. Where sources disagree, we say so. Figures from scans and honeypots describe what researchers saw, not the full picture.</p></div>
    {src("Sources: Rapid7; Tenable; Recorded Future Insikt Group. Full list on page 18.")}'''
    return page(2, body, section="At a glance")


def p3():
    rows = [("", "Executive summary", 4), ("01", "What broke", 5), ("", "Two bugs, in plain English", 6), ("", "Where PHP runs, and what is fixed", 7),
            ("02", "Nine days in October", 8), ("", "The first hours of 21 October", 10), ("03", "The exposure", 11), ("04", "Proven, or only claimed?", 12),
            ("05", "The response", 13), ("", "What made patching hard", 14), ("06", "The AI question", 15),
            ("07", "What to do", 16), ("", "Questions for your IT provider", 17), ("", "Sources and method", 18)]
    li = ''.join(f'''<div style="display:flex;align-items:baseline;padding:3.3mm 0;border-bottom:.25mm solid var(--line)">
      <span class="mono" style="width:14mm;font-size:8pt;color:var(--blue)">{a}</span>
      <span style="flex:1;font-size:13pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span>
      <span class="mono" style="font-size:8pt;color:var(--mid)">{c:02d}</span></div>''' for a, b, c in rows)
    body = f'''<div class="eyebrow" style="margin-top:14mm">Contents</div><h2 style="margin-top:5mm">Inside.</h2>
    <div style="margin-top:10mm;border-top:.35mm solid var(--navy)">{li}</div>'''
    return page(3, body, section="Contents")


def p4():
    def st(num, lab, s, unit=""):
        parts = [(num, 1.0)] + ([(unit, .5)] if unit else [])
        return f'<div>{G(parts, 38)}<div style="font-size:8.6pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{lab}<sup class="c">{s}</sup></div></div>'
    body = f'''{head("Executive summary", "A patch window that<br>closed before it opened.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {st("4", "days between the first recorded exploitation attempt and the public patch", "3,4", " d")}
      {st("11.4", "hours that leaked technical details circulated before the patch shipped", "3", " h")}
      {st("79", "of services showing a PHP version run a branch that no longer gets routine fixes", "3", "%")}
      {st("5.1", "million IP addresses running PHP, counted by VirusTotal", "3", " m")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What happened</h3>
        <p style="margin-top:3mm">Two memory-safety flaws in PHP itself, rated 9.2 out of 10, let an unauthenticated attacker run code on a server that handles web requests. They sit beneath WordPress, Drupal, Joomla, Magento and thousands of custom sites. Attacks were recorded four days before the fix. Details leaked hours before it. By 26 October CISA listed both as exploited.<sup class="c">1,3,4</sup></p>
        <p>Banks, retailers, hospitals and some government bodies took services offline to patch, according to TechCrunch.<sup class="c">4</sup></p></div>
      <div><h3>What it shows</h3>
        <p style="margin-top:3mm">The window between a flaw becoming known and being used is now measured in hours. A patch that exists is not a patch that is installed: running processes keep the vulnerable code until restarted, and most exposed PHP runs on branches with no official fix.<sup class="c">2,3</sup></p>
        <p><b style="font-weight:600">Our view:</b> the organisations that coped best were not the best defended. They were the ones that already knew where PHP ran and who owned it.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:26mm">Four actions</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">Find every PHP install · Patch and restart, then rebuild images · Look back to 17 October for signs of compromise · Rotate what may have leaked</div></div>
    {src("Sources: 1 Rapid7. 2 Tenable. 3 Recorded Future. 4 TechCrunch. Hours: 02:29 to 13:52 UTC, 21 October.", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    body = bg_dark('<div class="glow" style="right:-30mm;top:60mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(21,93,252,.3) 0%,rgba(21,93,252,0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01 · What broke</div>
    <div style="position:absolute;left:18mm;top:52mm">{G("69.3%", 120, ls=-0.07)}
      <div class="lede" style="margin-top:8mm;max-width:120mm;font-size:14pt;color:#fff;font-weight:300">of websites whose server-side language is known use PHP, according to W3Techs. WordPress, Drupal, Joomla, Laravel and Magento all run on it.<sup class="c">2</sup></div></div>
    <div style="position:absolute;right:18mm;top:132mm;width:70mm">{dots(10,10,69,pitch=7,d=4.4,order="row")}
      <div class="mono" style="font-size:6pt;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-top:3mm;text-transform:uppercase">69 of every 100 sites</div></div>
    <div style="position:absolute;left:18mm;bottom:30mm"><h2 style="font-size:34pt">The flaw was not<br>in a website.<br>It was underneath all of them.</h2></div>'''
    return page(5, body, dark=True, section="01 · What broke")


def flow(title, sub, steps, color):
    st = ''.join(f'<div class="step2"><b>{i+1}</b><span>{t}</span></div>' for i, t in enumerate(steps))
    return f'''<div class="card" style="padding:7mm"><div class="eyebrow" style="color:{color}">{title}</div><h3 style="margin:3mm 0 4mm;font-size:12pt">{sub}</h3>
      <div style="border-left:.4mm solid var(--line);margin-left:3.1mm;padding-left:0">{st}</div></div>'''


def p6():
    a = flow("CVE-2026-109618", "The out-of-memory bug", [
        "An attacker sends a crafted multipart request, the kind used for forms and file uploads.",
        "PHP runs out of memory part-way through setting up the request, even when the size looks within limits.",
        "PHP abandons the request, leaving internal data half-built.",
        "Clean-up runs anyway and uses the invalid data. Memory is corrupted.",
        "In Apache mod_php this happens before any of the website's own code runs."], "#00B8DB")
    b = flow("CVE-2026-109619", "The stale-state bug", [
        "A worker process handles many requests in turn, and keeps some state between them.",
        "At the end of one request, a pointer still refers to memory that has been freed.",
        "A fatal error or timeout interrupts the clean-up that would have reset it.",
        "The next request on the same worker reads the stale value, including through session upload progress, which is on by default.",
        "Freed memory is reused. Code runs."], "#155DFC")
    body = f'''{head("01 · What broke", "Two bugs, in plain English.", "Both are memory-safety flaws in how PHP starts, fails and cleans up a request. Neither needs a password or a click.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:10mm">{a}{b}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:9mm"><div class="eyebrow">Why it matters</div>
      <p style="font-size:9pt">Because the flaw is in PHP rather than in a plugin, a site can have flawless application code and still be exposed. Wiz also showed that the memory-disclosure side can leak passwords, tokens, API keys and certificates from other requests, with no code execution at all.<sup class="c">3</sup></p></div>
    {src("Sources: PHP advisories as summarised by Rapid7 and Recorded Future. The session upload progress feature has existed since PHP 5.4.0.")}'''
    return page(6, body, section="01 · What broke")


def p7():
    rows = [("Apache mod_php", "Highest risk. The vendor notes exploitation can succeed before any application code runs."),
            ("PHP-FPM", "At risk. A worker ends on failed start-up, which blocks one sequence, but a session path was validated."),
            ("php-cgi", "At risk."), ("FrankenPHP", "At risk."), ("LiteSpeed", "At risk.")]
    t1 = ''.join(f'<tr><td style="width:36mm;padding:4.6mm 3mm 4.6mm 0">{a}</td><td style="padding:4.6mm 0">{b}<sup class="c">1</sup></td></tr>' for a, b in rows)
    vers = [("8.5", "8.5.12"), ("8.4", "8.4.27"), ("8.3", "8.3.36"), ("8.2", "8.2.35")]
    vh = ''.join(f'<div style="flex:1;text-align:center;padding:5mm 2mm;border-radius:3mm;background:var(--mist)"><div class="mono" style="font-size:6.4pt;color:var(--mid)">PHP {a}</div><div style="margin-top:2mm;display:flex;justify-content:center">{G(b, 17, ls=-0.03)}</div></div>' for a, b in vers)
    apps = ["WordPress", "Drupal", "Joomla", "Magento", "MediaWiki", "Symfony", "Laravel", "phpBB"]
    ch = ''.join(f'<span class="tag" style="color:var(--blue);margin:0 2mm 2mm 0">{a}</span>' for a in apps)
    body = f'''{head("01 · What broke", "Where PHP runs,<br>and what is fixed.")}
    <div style="margin-top:11mm"><table class="t"><tr><th>Runtime</th><th>Exposure</th></tr>{t1}</table></div>
    <div class="eyebrow" style="color:var(--mid);margin:12mm 0 4mm">Fixed releases · 21 October 2026</div>
    <div style="display:flex;gap:3mm">{vh}</div>
    <p style="margin-top:4mm;font-size:8.6pt">PHP 7.4, 8.0 and 8.1 get no official release. The PHP security team published minimal source backports; distributions and long-term-support vendors issued their own.<sup class="c">1,2</sup> An update that contains both fixes is the only complete remediation.<sup class="c">1</sup></p>
    <div class="eyebrow" style="color:var(--mid);margin:11mm 0 4mm">Exploits demonstrated against</div><div>{ch}</div>
    <p style="font-size:8pt;color:var(--mid)">Wiz and Calif demonstrated WordPress, Drupal, Joomla and Magento; Trail of Bits showed shells on MediaWiki, Symfony, Laravel and phpBB, all on unpatched PHP.<sup class="c">3,4</sup></p>
    {src("Sources: 1 Rapid7. 2 Tenable. 3 Recorded Future. 4 TechCrunch; Tenable FAQ.")}'''
    return page(7, body, section="01 · What broke")


def p8():
    e = [ev("19 Aug", "Discovery", "Wiz Research finds the first flaw using AI-assisted tools. Within two days it confirms unauthenticated code execution on Drupal, then WordPress.", "", 3),
         ev("24 Aug", "Reported to PHP", "Wiz privately reports the flaws to the PHP security team, starting coordinated disclosure. Calif and OpenAI are credited alongside Wiz.", "", 3),
         ev("21 Sep", "Fixes begin", "The PHP security team acknowledges the reports and starts building coordinated fixes. Large hosts and Linux distributions later receive early access under embargo.", "", "3,4"),
         ev("17 Oct", "First recorded attack", "Amazon's MadPot honeypots log an exploitation attempt, four days before public disclosure. It is unclear how the attacker knew.", "a", 2),
         ev("20 Oct", "A warning, without details", "PHP announces an out-of-band release for 21 October at 14:00 UTC and withholds technical detail. watchTowr says it has reproduced CVE-2026-109618.", "", 3)]
    body = f'''{head("02 · Nine days in October", "Before the world knew.")}
    <div class="tl" style="margin-top:12mm">{''.join(e)}</div>
    <div class="card" style="margin-top:11mm;display:flex;gap:6mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">Sources differ</span>
      <p style="font-size:8.4pt">Recorded Future dates the discovery to August 2026. TechCrunch reports the bugs were first noticed in 2024 and judged unexploitable until recently. We follow the dated timeline; the difference does not change what to do.</p></div>
    {src("Sources: 2 Amazon Threat Intelligence, as reported by Tenable. 3 Recorded Future Insikt Group. 4 TechCrunch.")}'''
    return page(8, body, section="02 · Nine days in October")


def p9():
    e = [ev("21 Oct · 02:29 UTC", "Details leak", "An archive containing leaked vulnerability information is first submitted to VirusTotal.", "a", 3),
         ev("21 Oct · 07:34 UTC", "Hosts report attacks", "Patchstack receives reports of multiple active exploitation incidents from hosting partners, hours ahead of the planned release.", "a", 3),
         ev("21 Oct · 13:52 UTC", "Patch ships, eight minutes early", "PHP releases 8.5.12, 8.4.27, 8.3.36 and 8.2.35. Cloudflare reports early attacks and switches on stopgap firewall rules for all customers, including free.", "k", "2,3"),
         ev("23 Oct", "A third issue", "The PHP Foundation publishes CVE-2026-115560. No patch yet; setting session.upload_progress.enabled=0 is the interim mitigation.", "", 1),
         ev("24 Oct", "Exploitation confirmed on honeypots", "Researcher Adel Karimi reports successful attacks on three honeypots running PHP 8.4.26. The requests started shells that ran attacker commands.", "a", 2),
         ev("26 Oct", "Working exploits, then the KEV list", "Trail of Bits confirms working exploits against pre-patch PHP 8.2 to 8.5. CISA adds both CVEs to its Known Exploited Vulnerabilities catalogue; federal agencies must remediate by 29 October.", "a", "1,2")]
    body = f'''{head("02 · Nine days in October", "The week it happened.")}
    <div class="tl" style="margin-top:11mm">{''.join(e)}</div>
    {src("Sources: 1 Rapid7 (update of 27 October). 2 Tenable. 3 Recorded Future Insikt Group. Times UTC.", "20mm")}'''
    return page(9, body, section="02 · Nine days in October")


def hours_chart():
    X0, X1 = 8, 166
    def x(h): return X0 + (X1 - X0) * h / 24
    t_leak, t_ps, t_rel = 2 + 29 / 60, 7 + 34 / 60, 13 + 52 / 60
    o = [f'<svg viewBox="0 0 174 70" width="174mm" height="70mm" style="display:block;overflow:visible">']
    for h in range(0, 25, 3):
        o.append(f'<line x1="{x(h)}" x2="{x(h)}" y1="30" y2="48" stroke="#E3E8F0" stroke-width=".25"/><text x="{x(h)}" y="54" text-anchor="middle" font-family="JetBrains Mono" font-size="2.6" fill="#6B7A90">{h:02d}:00</text>')
    o.append(f'<rect x="{x(t_leak)}" y="34" width="{x(t_rel)-x(t_leak)}" height="5" rx="1.4" fill="{RED}" fill-opacity=".28"/>')
    o.append(f'<rect x="{x(t_ps)}" y="41" width="{x(t_rel)-x(t_ps)}" height="5" rx="1.4" fill="{RED}"/>')
    o.append(f'<rect x="{x(t_rel)}" y="34" width="{x(24)-x(t_rel)}" height="12" rx="1.4" fill="url(#gh)"/>')
    for t, lab, sub, yy, col in [(t_leak, "02:29", "Leak reaches VirusTotal", 6, RED), (t_ps, "07:34", "Patchstack hears of attacks", 16, RED), (t_rel, "13:52", "Patch released", 6, "#155DFC")]:
        o.append(f'<line x1="{x(t)}" x2="{x(t)}" y1="{yy+4}" y2="34" stroke="{col}" stroke-width=".35"/><circle cx="{x(t)}" cy="{yy+4}" r="1.2" fill="{col}"/>'
                 f'<text x="{x(t)+(-2.4 if lab=="07:34" else 2.4)}" y="{yy+2.6}" text-anchor="{"end" if lab=="07:34" else "start"}" font-family="Poppins" font-weight="600" font-size="3.4" fill="#0F172B">{lab}</text><text x="{x(t)+(-2.4 if lab=="07:34" else 2.4)}" y="{yy+6.4}" text-anchor="{"end" if lab=="07:34" else "start"}" font-family="Poppins" font-size="2.8" fill="#6B7A90">{sub}</text>')
    o.append(f'<text x="{x(t_leak)+1}" y="64" font-family="JetBrains Mono" font-size="2.6" fill="{RED}">11 H 23 M · DETAILS OUT, NO OFFICIAL PATCH</text></svg>')
    return ''.join(o)


def p10():
    body = f'''{head("02 · Nine days in October", "The first hours of<br>21 October.", "Coordinated disclosure assumes a quiet gap between the patch and the exploit. That gap lasted about eleven hours, and for some it never existed.")}
    <div style="margin-top:12mm">{hours_chart()}</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("−4 days", 26, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">Amazon saw an attempt on 17 October. How the attacker knew remains unexplained.<sup class="c">2</sup></p></div>
      <div>{G("6 h 18 m", 26, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">between Patchstack's first reports from hosting partners and the patch.<sup class="c">3</sup></p></div>
      <div>{G("8 min", 26, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">The release went out ahead of its 14:00 UTC schedule. The PHP Foundation blamed one company for publishing early.<sup class="c">3,4</sup></p></div></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.2pt">Embargoes protect the many by trusting the few, and open-source patches show attackers where to look. Plan as though the gap does not exist: a critical fix should be installed in hours, not at the next maintenance window.</p></div>
    {src("Sources: 2 Tenable (Amazon Threat Intelligence). 3 Recorded Future. 4 TechCrunch. All times UTC.")}'''
    return page(10, body, section="02 · Nine days in October")


def p11():
    body = f'''{head("03 · The exposure", "Most of the exposed PHP<br>cannot be patched upstream.")}
    <div style="display:grid;grid-template-columns:60mm 1fr;gap:12mm;margin-top:11mm;align-items:start">
      <div>{dots(10,10,79,pitch=6,d=3.8,order="row",unlit="#E1E7F1",halo=False)}
        <div class="mono" style="font-size:6.2pt;letter-spacing:.1em;color:var(--mid);margin-top:3mm;text-transform:uppercase">79 of 100 services with a readable version</div></div>
      <div><div>{G("79%", 54, ls=-0.05)}</div>
        <p style="margin-top:4mm;font-size:9.4pt">of PHP services that report a version run a branch PHP no longer supports. PHP 7.4, end of life since 2022, accounts for 878,761 services, more than any supported branch.<sup class="c">3</sup></p>
        <p style="font-size:8pt;color:var(--mid)">Modat: 4,384,302 PHP services on 1,886,612 hosts, seen in the ten days before 20 October.</p></div></div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("5.1m", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">IP addresses running PHP (VirusTotal, 21 October). About four in five hide their version.<sup class="c">3</sup></p></div>
      <div>{G("758k", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of those that disclose a version run an end-of-life branch, against about 272,000 on a supported one.<sup class="c">3</sup></p></div>
      <div>{G("85k", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">were on the 24 September releases, the newest before the fix. Being current was no protection.<sup class="c">3</sup></p></div></div>
    <div class="eyebrow" style="color:var(--mid);margin:11mm 0 4mm">Other doors open on the same hosts</div>
    {''.join(f'<div style="display:flex;align-items:center;gap:4mm;margin-bottom:2.6mm"><span class="mono" style="width:16mm;font-size:7pt;color:var(--mid)">{k}</span><div style="height:5mm;width:{v/394*95:.0f}mm;border-radius:1.4mm;background:var(--grad)"></div><span style="font-weight:600;font-size:9.6pt">{v}k</span></div>' for k, v in [("SSH", 394), ("MYSQL", 233), ("RDP", 68)])}
    <p style="font-size:8.2pt;margin-top:3mm">PHP hosts that also expose these services, per VirusTotal. A foothold on the web server does not have to end there.<sup class="c">3</sup></p>
    {src("Source: 3 Recorded Future Insikt Group, citing Modat and VirusTotal scans. Neither scan counts confirmed vulnerable hosts.")}'''
    return page(11, body, section="03 · The exposure")


def p12():
    rungs = [("Catalogued", "CISA adds both CVEs to KEV on 26 October, evidence of active exploitation. Federal deadline 29 October.", "Rapid7, Tenable", "k"),
             ("Observed succeeding", "Shells ran attacker commands on three honeypots (PHP 8.4.26). Trail of Bits shows working exploits on MediaWiki, Symfony, Laravel and phpBB.", "Tenable", "a"),
             ("Reproduced in the lab", "watchTowr reproduced both. Wiz demonstrated code execution on WordPress, Drupal and Joomla.", "Recorded Future", ""),
             ("Attempted", "Amazon (17 Oct), Patchstack's hosts and Cloudflare (21 Oct) saw attacks. Cloudflare later reported an exponential rise in attempts.", "Tenable, TechCrunch", ""),
             ("Warned", "PHP announces an emergency release on 20 October with details withheld.", "Recorded Future", "")]
    r = ''.join(f'''<div style="display:grid;grid-template-columns:9mm 1fr;gap:5mm;padding:5mm 0;border-bottom:.25mm solid var(--line)">
      <div style="width:6mm;height:6mm;border-radius:50%;background:{'var(--grad-d)' if k=='k' else (RED if k=='a' else '#C9D6EE')};margin-top:1mm"></div>
      <div><div style="display:flex;justify-content:space-between;align-items:baseline"><h3 style="font-size:12.4pt">{t}</h3><span class="mono" style="font-size:6.2pt;color:var(--mid)">{s}</span></div><p style="font-size:8.8pt;margin-top:1.6mm">{b}</p></div></div>''' for t, b, s, k in rungs)
    body = f'''{head("04 · Proven, or only claimed?", "Five rungs of evidence.", "Early headlines said everything from “nothing seen” to “the internet is on fire”. Both were true at different rungs. Here is how to read the claims.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{r}</div>
    <div class="card" style="margin-top:8mm;display:flex;gap:6mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Caution</span>
      <p style="font-size:8.4pt;color:var(--slate)">Rapid7 found the early public proofs of concept worked only in narrow lab conditions and treated the difficulty as <i>a window to patch rather than a reason to delay</i>. Days later, working exploits were confirmed. Reliable exploitation is a matter of time.<sup class="c">1</sup></p></div>
    {src("Sources: 1 Rapid7. 2 Tenable. 3 Recorded Future. 4 TechCrunch.", "20mm")}'''
    return page(12, body, section="04 · Proven, or only claimed?")


def p13():
    cols = [("Maintainers", "The PHP Foundation ran a coordinated disclosure, giving large hosts and Linux distributions early access under embargo, then published fixes on 21 October.", "4"),
            ("Platforms", "Cloudflare put stopgap firewall rules in front of PHP sites for every customer, free tier included, and said plainly that they were only a stopgap.", "3"),
            ("Governments", "CISA listed both CVEs as exploited, set 29 October as the federal deadline and required forensic triage. CERT-EU advised isolating internet-facing PHP apps that cannot be updated. The UK NCSC reportedly advised updating or taking systems offline, per BleepingComputer.", "1,2,6"),
            ("Businesses", "Banks, retailers, gaming sites, online stores, hospitals and some government agencies took servers offline to apply patches, TechCrunch reported.", "4")]
    cc = ''.join(f'<div class="card" style="padding:8mm"><div class="eyebrow">{a}</div><p style="margin-top:4mm;font-size:9.6pt">{b}<sup class="c">{s}</sup></p></div>' for a, b, s in cols)
    body = f'''{head("05 · The response", "Who did what.", "Most of the system worked. The weak points were hours, restarts and the long tail of systems nobody was watching.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">{cc}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:11mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.2pt">Taking a site offline is a legitimate control, not a failure. The organisations that could make that call in an hour had already decided who is allowed to make it, and what a day without the site costs.</p></div>
    {src("Sources: 1 Rapid7. 2 Tenable (CERT-EU). 3 Recorded Future; Tenable. 4 TechCrunch. 6 BleepingComputer, for the UK NCSC advice; we could not retrieve the NCSC's own text.")}'''
    return page(13, body, section="05 · The response")


def p14():
    traps = [("Updated is not patched", "Installing a new package does not fix processes already running. PHP-FPM and Apache keep the vulnerable code in memory until restarted. Google Cloud's guidance, with Mandiant, also advises capturing worker memory from probed servers before restarting.", "2"),
             ("Containers keep the old image", "Patching a running container leaves the image exposed. Rebuild and redeploy.", "7"),
             ("End of life, no fix", "PHP 8.1 and older get minimal source backports only. Remi's repository did not update on 21 October; users were told to switch to distribution packages or build from source.", "1"),
             ("A regression in the fix", "PHP 8.4.27 and 8.5.12 can crash some applications that use SimpleXML (php-src issue 24488). It comes from a separate garbage-collector change, not the security patches.", "2"),
             ("More after the patch", "CVE-2026-115560 had no patch on 23 October. On Windows, builds were refreshed on 26 October for a bundled Brotli flaw, CVE-2026-111497.", "1,2"),
             ("PHP you did not install", "PHP also sits in developer tools and in components used by routers, storage devices, firewalls and VPNs. Those need their vendors to ship updates.", "4")]
    tt = ''.join(f'''<div style="display:grid;grid-template-columns:10mm 1fr;gap:4mm;padding:6.6mm 0;border-bottom:.25mm solid var(--line)">
      <div class="mono" style="color:var(--blue);font-size:8.4pt">{i+1:02d}</div><div><h3 style="font-size:12pt">{a}</h3><p style="font-size:9.2pt;margin-top:1.8mm">{b}<sup class="c">{s}</sup></p></div></div>''' for i, (a, b, s) in enumerate(traps))
    body = f'''{head("05 · The response", "Six traps that<br>made patching hard.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{tt}</div>
    {src("Sources: 1 Rapid7. 2 Tenable. 4 TechCrunch. 7 Aikido.", "20mm")}'''
    return page(14, body, section="05 · The response")


def p15():
    body = bg_dark('<div class="glow" style="left:-30mm;top:100mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 06 · The AI question</div>
    <h2 style="margin-top:6mm;font-size:34pt;max-width:140mm">Found with help from AI.<br>Not found by it alone.</h2>
    <div style="margin-top:14mm;display:grid;grid-template-columns:1fr 1fr;gap:10mm">
      <div><div class="eyebrow">What was reported</div>
        <p style="margin-top:3mm">Wiz and Calif both say they used AI models in the research. Calif's write-up is blunt about the limits: <i>“No model is simply capable of unearthing ‘all bugs’ with simple prompts. At least for now.”</i> The bulk of the work relied on researchers who knew PHP's code and exploitation history well.<sup class="c">3,4</sup></p>
        <p>Discovery was part of OpenAI and Wiz's Hack the Planet initiative.<sup class="c">4</sup></p></div>
      <div><div class="eyebrow">Why it changes planning</div>
        <p style="margin-top:3mm">Old, widely used, memory-unsafe software is the likeliest place for the next discovery. TechCrunch cites the NSA's estimate that around 75% of actively exploited vulnerabilities abuse memory-related flaws.<sup class="c">4</sup></p>
        <p>If finding flaws gets cheaper for defenders, it gets cheaper for everyone. The honest planning assumption is shorter windows, not longer ones.</p></div></div>
    <div class="card" style="margin-top:16mm"><div class="eyebrow">Not the first PHP warning</div>
      <p style="margin-top:3mm;font-size:8.8pt">Before PHP2Shell, CISA's catalogue already held three PHP flaws. CVE-2024-4577 (PHP-CGI) and CVE-2019-11043 (PHP-FPM) are both known to have been used in ransomware campaigns. The third, CVE-2012-1823, is the flaw CVE-2024-4577 later bypassed.<sup class="c">2</sup></p></div>
    {src("Sources: 2 Tenable. 3 Recorded Future. 4 TechCrunch.", "20mm")}'''
    return page(15, body, dark=True, section="06 · The AI question")


def p16():
    rows = [("First hour", "Decide", ["Name an incident owner and a decision-maker for taking sites offline.", "Pull the asset list: every web server, container image and appliance that runs PHP.", "Rank by internet exposure; mod_php first."]),
            ("Hours 1–24", "Contain", ["Apply vendor packages or the fixed versions. Restart every PHP process. Rebuild images.", "Where you cannot patch: isolate, or take offline. Treat a web firewall as a stopgap.", "Apply PHP's interim settings where they fit, and check nothing restores a finite memory limit."]),
            ("Hours 24–72", "Hunt", ["Look back to 17 October in web, application and endpoint logs.", "Watch for odd multipart requests, PHP worker crashes and unexpected commands.", "Absence of log entries is not proof of safety."]),
            ("Days 3–30", "Recover", ["Rotate secrets and keys that a PHP worker could reach.", "Move end-of-life branches onto supported releases.", "Write down what slowed you, and fix it."])]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:34mm 1fr;gap:6mm;padding:8mm 0;border-bottom:.25mm solid var(--line)">
      <div><div class="mono" style="font-size:6.6pt;letter-spacing:.12em;color:var(--blue);text-transform:uppercase">{a}</div>{G(b, 22, ls=-0.04)}</div>
      <ul style="list-style:none">{''.join(f'<li style="font-size:9.6pt;line-height:1.55;padding-left:4mm;position:relative;margin-bottom:2.4mm"><span style="position:absolute;left:0;top:1.9mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--grad-d)"></span>{x}</li>' for x in c)}</ul></div>''' for a, b, c in rows)
    body = f'''{head("07 · What to do", "A 72-hour runbook.", "Illustrative, built from the vendor, CISA and researcher guidance in the sources. Adapt it to your estate.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{cc}</div>
    {src("Sources: Rapid7; Tenable; Recorded Future recommendations. This runbook is illustrative and is not a substitute for a vendor advisory.", "20mm")}'''
    return page(16, body, section="07 · What to do")


def p17():
    qs = ["Do we know every place PHP runs, including inside appliances and containers? Show me the list.",
          "How many of our PHP installs are on a branch with no official fixes?",
          "How quickly can we patch and restart a critical, internet-facing system? Has it been tested?",
          "Who can decide to take a site offline, and what does an hour of that cost?",
          "Which secrets could a compromised PHP worker reach, and how fast can we rotate them?",
          "Who tells us about a supplier's incident, and how quickly, in writing?"]
    li = ''.join(f'<div style="display:grid;grid-template-columns:10mm 1fr;gap:4mm;padding:4.4mm 0;border-bottom:.25mm solid rgba(255,255,255,.14)"><div class="mono" style="color:var(--cyan);font-size:8.4pt">{i+1:02d}</div><div style="font-weight:300;font-size:11.6pt;line-height:1.4;color:#fff;letter-spacing:-.01em">“{q}”</div></div>' for i, q in enumerate(qs))
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">07 · What to do</div>
    <h2 style="margin-top:5mm;max-width:150mm">Six questions for your<br>IT provider, today.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">A good answer is specific, quick and written down. A vague one is also an answer.</p>
    <div style="margin-top:11mm;border-top:.35mm solid rgba(255,255,255,.3)">{li}</div>
    <div class="card" style="margin-top:9mm;display:flex;gap:6mm;align-items:center"><span class="tag" style="color:var(--cyan);flex:none">Playbook</span>
      <p style="font-size:8.6pt">These questions map onto plays 01, 03 and 05 of The Resilience Playbook: map what matters, rehearse recovery, know your suppliers.</p></div>'''
    return page(17, body, dark=True, section="07 · What to do")


def p18():
    refs = [("1", "Rapid7. <b>CVE-2026-109618 and CVE-2026-109619: Critical Unauthenticated Remote Code Execution in PHP.</b> 21 October 2026, updated 27 October. rapid7.com/blog/post/etr-cve-2026-109618-and-cve-2026-109619-critical-unauthenticated-remote-code-execution-in-php/"),
            ("2", "Tenable. <b>PHP2Shell: frequently asked questions about critical PHP remote code execution.</b> Updated 26 October 2026. tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote"),
            ("3", "Recorded Future Insikt Group. <b>PHP2Shell Exploitation: Two Critical PHP Flaws Explained.</b> recordedfuture.com/blog/php2shell-vulnerability-exploitation"),
            ("4", "TechCrunch (Z. Whittaker). <b>PHP-ocalypse: How two critical web bugs almost broke the internet.</b> 24 October 2026. techcrunch.com/2026/10/24/php-ocalypse-how-two-critical-web-bugs-almost-broke-the-internet/"),
            ("5", "CISA. <b>Critical Vulnerabilities in PHP Require Immediate Patching.</b> 21 October 2026. cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching (not retrievable by us; the KEV listing is taken from sources 1 and 2)."),
            ("6", "BleepingComputer, as summarised in search results, for the UK NCSC advice. We did not retrieve the NCSC's own text."),
            ("7", "Aikido. <b>Critical vulnerabilities in PHP (PHP2Shell): how to fix.</b> aikido.dev/blog/critical-vulnerabilities-in-php-php2shell")]
    rows = ''.join(f'''<div style="display:grid;grid-template-columns:10mm 1fr;gap:3mm;padding:3.6mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8.6pt;font-weight:500">{n}</div><div style="font-size:8.2pt;line-height:1.55;word-break:break-word">{t}</div></div>''' for n, t in refs)
    body = f'''{head("Sources and method", "Where this comes from.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:8mm"><div class="eyebrow">Method notes</div>
      <div><p style="font-size:8.2pt">Accurate as of 27 October 2026; the event is still moving. Exposure counts come from scans that count differently, so they are not comparable. Exploitation reports from vendors describe what they observed, not total compromise. Fixes and regressions may have changed since publication; check the PHP project's advisories.</p>
      <p style="font-size:8.2pt">Sources 5 and 6 are listed for completeness. Nothing in this study rests on text we could not read.</p></div></div>'''
    return page(18, body, section="Sources and method")


def p19():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{dots(10,10,100,pitch=11,d=6.6,halo=False)}</div>
    <div style="position:absolute;left:0;right:0;top:158mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">Fixed-fee managed IT with 24/7 support,<br>patching and incident response under SLA.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(19, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14(), p15(), p16(), p17(), p18(), p19()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("case.html", "w", encoding="utf8").write(build())
