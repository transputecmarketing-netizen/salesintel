from kit import *
import aivis
from case import RED, AMBER

TITLE = "Found by Machines"
N = 14
page = mk(TITLE, N)


def p1():
    return page(1, cover("AI & VULNERABILITIES · OCT 2026", ["Found by"], "machines.", 62,
                         "How AI is changing the hunt for software flaws, and why the gap between a bug and an attack keeps shrinking.",
                         aivis.code_scan(), title_pt=46, vis_top="52mm", glow='<div class="glow" style="left:30mm;top:20mm;width:170mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 64%)"></div>'), dark=True, folio=False)


def p2():
    cards = [("Source 01", "Wiz Research and Calif", "Both teams' own PHP2Shell write-ups, October 2026. Both sell security services."),
             ("Source 02", "DARPA", "Results of the AI Cyber Challenge, August 2025. Government, but a competition, not production."),
             ("Source 03", "Google, XBOW", "Big Sleep (2024, 2025) and XBOW's bug-bounty results (2025). Vendor claims."),
             ("Source 04", "Mandiant M-Trends 2026", "Incident-response telemetry from more than 500,000 investigation hours. Vendor-authored."),
             ("Source 05", "UK NCSC", "Impact of AI on cyber threat from now to 2027. Published May 2025; we found no update."),
             ("Source 06", "News", "BleepingComputer, The Register, The Next Web, for what attackers and maintainers did.")]
    cc = ''.join(f'<div class="card"><div class="eyebrow">{a}</div><h3 style="margin:3mm 0 2mm;font-size:11pt">{b}</h3><p style="font-size:8.4pt">{c}</p></div>' for a, b, c in cards)
    body = f'''{head("About this report", "Who says so, and who<br>sells what.", "Most claims about AI and vulnerabilities come from companies that sell security products or AI. We read each source at the page, flag who published it, and say what we could not read.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">{cc}</div>
    <div class="card" style="margin-top:6mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Read with care</span>
      <p style="font-size:8.6pt;color:var(--slate)">Competition and vendor results show what is possible under stated conditions, not what attackers do every day. Nothing here shows that PHP2Shell was exploited by AI-built attacks.</p></div>
    <div class="src" style="position:absolute;left:18mm;right:18mm;bottom:15mm">© 2026 Transputec Ltd. Third-party material is quoted with attribution.</div>'''
    return page(2, body, section="About")


def p3():
    return page(3, contents([("", "Executive summary", 4), ("01", "What AI actually changed", 5), ("", "Humans and models on PHP2Shell", 6), ("", "Four years of precedents", 7),
                             ("02", "Scores, and the small print", 8), ("", "The flood of noise", 9), ("03", "What defenders face", 10), ("", "The UK government view", 11),
                             ("04", "What to do", 12), ("", "Sources and method", 13)]), section="Contents")


def p4():
    body = f'''{head("Executive summary", "The machines are good at<br>proving a bug can be used.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {stat("54", "of 63 planted flaws found by the best AI systems in DARPA's 2025 final, with 43 patched", 6, " of 63")}
      {stat("45", "minutes: the average time those systems took to patch a flaw", 6, " min")}
      {stat("−7", "days: Mandiant's estimated mean time to exploit, so attacks often precede a patch", 9, " days")}
      {stat("4", "days between the first recorded PHP2Shell attempt and the fix", 3, " days")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What happened</h3>
        <p style="margin-top:3mm">The PHP2Shell flaws were found by researchers using frontier AI models. Wiz says the code had sat there for more than a decade and that what AI changed was turning the weaknesses into working exploits, in hours. Calif, the other team, warns that no model finds all bugs from simple prompts, and that knowing your target still matters.<sup class="c">1,2</sup></p></div>
      <div><h3>What it means</h3>
        <p style="margin-top:3mm">Treat the next critical flaw in old, widely used software as more likely to be found, and to be usable sooner. The NCSC judges that the time between disclosure and exploitation has shrunk to days and that AI will almost certainly shrink it further.<sup class="c">10</sup></p>
        <p><b style="font-weight:600">Our view:</b> the useful response is not a new tool. It is a patch process measured in hours for anything facing the internet.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:26mm">Keep calibrated</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">Mandiant says 2025 was not the year breaches were the direct result of AI; most intrusions still come from basic failures.<sup class="c">9</sup></div></div>
    {src("Sources: 1 Wiz. 2 Calif. 3 BleepingComputer. 6 DARPA. 9 Mandiant M-Trends 2026. 10 NCSC.", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    return page(5, opener("Chapter 01 · What AI actually changed", "A week", 112,
                          "is how long Wiz says a single researcher needed for work that would once have taken a world-class team months. It is Wiz's own claim, and it is unquantified.<sup class='c'>1</sup>",
                          "The bug was old.<br>The exploit was new."), dark=True, section="01 · What AI actually changed")


def p6():
    humans = ["Chose a target they knew well, with a deep history of vulnerabilities", "Decided where to look and which results mattered", "Judged what was exploitable and what was noise", "Coordinated disclosure with the PHP maintainers"]
    ai = ["Helped understand weaknesses in old code", "Helped turn them into working exploits", "Adapted exploits across several applications in hours", "Scaled the audit: Wiz used three AI tools, Calif general models anyone could use"]
    def col(t, items, c):
        return f'<div class="card" style="padding:7mm"><div class="eyebrow" style="color:{c}">{t}</div><ul style="list-style:none;margin-top:4mm">{"".join(f"<li style=\"font-size:9.2pt;line-height:1.5;padding:2.6mm 0;border-top:.25mm solid var(--line)\">{x}</li>" for x in items)}</ul></div>'
    body = f'''{head("01 · What AI actually changed", "Humans steered.<br>Models did the heavy lifting.", "Both teams describe human-led work with AI assistance. Neither describes an autonomous discovery.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:10mm">{col("Researchers", humans, "#155DFC")}{col("AI models", ai, "#00B8DB")}</div>
    <div class="card" style="margin-top:6mm;padding:7mm"><div class="eyebrow">Calif, in its own words</div>
      <p style="font-size:10pt;margin-top:3mm;font-weight:300;line-height:1.5">“No model is simply capable of unearthing ‘all bugs’ with simple prompts. At least for now.”<sup class="c">2</sup></p>
      <p style="font-size:8.4pt;margin-top:2mm">Calif adds that it expected to find nothing critical, because every lab had already run AI-assisted audits of PHP. It surfaced the first issue within days.<sup class="c">2</sup></p></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:8mm"><div class="eyebrow">History</div>
      <p style="font-size:8.8pt">A related out-of-memory problem was reported in 2020 and rediscovered in a 2024 audit, but exploitation was not proven, so it was not fixed.<sup class="c">2</sup> That is the pattern AI changes: a flaw that is known but unproven stops being safe.</p></div>
    {src("Sources: 1 Wiz Research, 21 Oct 2026. 2 Calif PHP2Shell write-up. Both are security vendors.", "20mm")}'''
    return page(6, body, section="01 · What AI actually changed")


def p7():
    e = [ev("Nov 2024", "Big Sleep's first find", "Google's Big Sleep agent finds an exploitable memory flaw in SQLite, fixed the same day, before it reached an official release. Google believes it is the first public example of its kind.", "", 5),
         ev("Jun 2025", "A bot tops a bug bounty board", "XBOW submits nearly 1,060 vulnerabilities to HackerOne, reviewed by its team before sending, and reaches the top of the US leaderboard.", "", 7),
         ev("Jul 2025", "Foiling an attack", "Google says Big Sleep, with threat intelligence, found a SQLite flaw (CVE-2025-6965) that was about to be exploited, and cut it off. A self-reported first.", "", 5),
         ev("Aug 2025", "DARPA's final", "AI systems find 54 of 63 planted flaws and patch 43, and also find 18 real, previously unknown ones.", "k", 6),
         ev("Jan 2026", "curl closes its bounty", "Daniel Stenberg ends curl's bug bounty to remove the incentive for low-quality, AI-generated reports.", "a", 8),
         ev("Oct 2026", "PHP2Shell", "Researchers use frontier models to find and weaponise flaws in PHP, then disclose them. Attacks begin four days before the patch.", "a", "1,2,3")]
    body = f'''{head("01 · What AI actually changed", "Four years of precedents.")}
    <div class="tl" style="margin-top:10mm">{''.join(e)}</div>
    {src("Sources: 5 Google Project Zero and Google. 6 DARPA. 7 XBOW. 8 The Register. 1–3 as listed. Several of these are vendor claims.", "20mm")}'''
    return page(7, body, section="01 · What AI actually changed")


def p8():
    segs = [("Resolved", 130, "#155DFC"), ("Triaged", 303, "#00B8DB"), ("Duplicates", 208, "#C9D6EE"), ("Informative", 209, "#9AA8C0")]
    tot = sum(v for _, v, _ in segs)
    bar = ''.join(f'<div style="width:{v/tot*100:.1f}%;background:{c};height:9mm"></div>' for _, v, c in segs)
    leg = ''.join(f'<div style="flex:1"><div style="display:flex;align-items:center;gap:2mm"><i style="width:3mm;height:3mm;border-radius:50%;background:{c};display:inline-block"></i><span class="mono" style="font-size:6.6pt;color:var(--mid);text-transform:uppercase">{n}</span></div>{G(str(v), 20, ls=-0.04)}</div>' for n, v, c in segs)
    body = f'''{head("02 · Scores, and the small print", "Impressive, and<br>not the whole story.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:10mm">
      <div><div class="eyebrow" style="color:var(--mid)">DARPA AI Cyber Challenge final</div>
        <div style="margin-top:5mm">{G("54 of 63", 40, ls=-0.045)}</div>
        <p style="font-size:9pt;margin-top:3mm">planted flaws found (86%, against 37% at the semifinals), 43 patched, in an average of 45 minutes, at about $152 per task. They also found 18 real, unknown flaws and patched 11.<sup class="c">6</sup></p></div>
      <div class="card"><div class="eyebrow">Read the conditions</div><p style="font-size:8.8pt;margin-top:3mm">These are competition results on defined targets, run under stated rules. They show what is achievable, not what attackers do daily.<sup class="c">6</sup></p></div></div>
    <div class="hair" style="margin:9mm 0 7mm"></div>
    <div class="eyebrow" style="color:var(--mid)">XBOW on HackerOne · what happened to the reports</div>
    <div style="display:flex;margin-top:5mm;border-radius:1.6mm;overflow:hidden">{bar}</div>
    <div style="display:flex;gap:4mm;margin-top:5mm">{leg}</div>
    <p style="font-size:8.6pt;margin-top:5mm">Of nearly 1,060 submissions, 130 were resolved and 303 triaged. 208 were duplicates and 209 informative. That is a strong hit rate and a lot of reports for humans to sort.<sup class="c">7</sup></p>
    {src("Sources: 6 DARPA, 8 August 2025. 7 XBOW (a vendor), 24 June 2025. The four groups shown do not account for every submission.", "20mm")}'''
    return page(8, body, section="02 · Scores, and the small print")


def p9():
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">02 · Scores, and the small print</div>
    <h2 style="margin-top:5mm;max-width:150mm">The same tools make<br>noise at scale.</h2>
    <div style="margin-top:14mm;display:grid;grid-template-columns:1fr 1fr;gap:10mm">
      <div>{G("7", 90, ls=-0.06)}<p style="font-size:9.6pt;margin-top:4mm;color:var(--slate);max-width:60mm">reports received by curl in a single week in January 2026. None was a real vulnerability.<sup class="c">8</sup></p></div>
      <div><p class="pull" style="font-size:15pt;color:#fff;font-weight:300;line-height:1.4">“Remove the incentive for people to submit crap and non-well researched reports to us. AI generated or not.”</p>
        <p style="font-size:8.6pt;margin-top:4mm;color:var(--slate)">Daniel Stenberg, curl maintainer, as quoted by The Register. He also accepted that AI can be a fine bug-hunting aid after receiving good AI-assisted reports.<sup class="c">8</sup></p></div></div>
    <div class="card" style="margin-top:16mm"><div class="eyebrow">Why it matters to you</div>
      <p style="font-size:9.4pt;margin-top:3mm">Open-source maintainers are the unpaid backstop for software your business runs. If good reports drown in bad ones, fixes slow down for everyone downstream. Ask your suppliers how they track and fund the open-source components they depend on.</p></div>'''
    return page(9, body, dark=True, section="02 · Scores, and the small print")


def p10():
    body = f'''{head("03 · What defenders face", "Faster, but not yet<br>AI-made.", "Mandiant's incident-response data shows exploitation getting quicker and hand-offs between attackers collapsing. It does not blame AI.")}
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:9mm;margin-top:11mm">
      <div>{G("−7 days", 40, ls=-0.045)}<p style="font-size:9.2pt;margin-top:3mm">estimated mean time to exploit in 2025, meaning exploitation routinely happens before a patch exists.<sup class="c">9</sup></p></div>
      <div>{G("22 sec", 40, ls=-0.045)}<p style="font-size:9.2pt;margin-top:3mm">median hand-off from initial access to a second threat group in 2025, against more than eight hours in 2022.<sup class="c">9</sup></p></div></div>
    <div class="hair" style="margin:9mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("32%", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of intrusions began with an exploit, the top vector for the sixth year.<sup class="c">9</sup></p></div>
      <div>{G("11%", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">began with voice phishing.<sup class="c">9</sup></p></div>
      <div>{G("14 days", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">global median dwell time, up from 11.<sup class="c">9</sup></p></div></div>
    <div class="card" style="margin-top:10mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--cyan);flex:none">Mandiant</span>
      <p style="font-size:8.8pt;color:var(--slate)">“We do not consider 2025 to be the year where breaches were the direct result of AI… the vast majority of successful intrusions still stem from fundamental human and systemic failures.”<sup class="c">9</sup></p></div>
    {src("Source: 9 Google Cloud / Mandiant, M-Trends 2026 (23 March 2026), based on more than 500,000 hours of investigations. Vendor telemetry.", "20mm")}'''
    return page(10, body, section="03 · What defenders face")


def p11():
    j = [("Frequency and intensity", "AI will almost certainly continue to make elements of cyber intrusion more effective and efficient, leading to an increase in frequency and intensity of cyber threats."),
         ("Vulnerability research", "The most significant AI cyber development will highly likely come from AI-assisted vulnerability research and exploit development. The time between disclosure and exploitation has shrunk to days and AI will almost certainly reduce this further."),
         ("A widening divide", "There will almost certainly be a digital divide between systems keeping pace with AI-enabled threats and a large proportion that are more vulnerable."),
         ("A limit", "Fully automated, end-to-end advanced cyber attacks are unlikely to 2027.")]
    cc = ''.join(f'<div style="display:grid;grid-template-columns:44mm 1fr;gap:6mm;padding:5.4mm 0;border-bottom:.25mm solid var(--line)"><h3 style="font-size:11.4pt">{a}</h3><p style="font-size:9.2pt">“{b}”<sup class="c">10</sup></p></div>' for a, b in j)
    body = f'''{head("03 · What defenders face", "What the NCSC said.", "The UK's National Cyber Security Centre assessed the impact of AI on the cyber threat out to 2027.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{cc}</div>
    <div class="card" style="margin-top:8mm;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:{AMBER};flex:none">Date</span>
      <p style="font-size:8.6pt">The assessment was published on 7 May 2025. We found no 2026 update to it. Its judgements pre-date PHP2Shell and are consistent with it.</p></div>
    {src("Source: 10 NCSC, Impact of AI on cyber threat from now to 2027 (7 May 2025). Government assessment.", "20mm")}'''
    return page(11, body, section="03 · What defenders face")


def p12():
    rows = [("Shrink the window", "Patch and restart anything internet-facing in hours, not weeks. Assume attacks may start before the fix.", "Play 02"),
            ("Know your estate", "List every place a widely used component runs, including inside appliances and containers.", "Play 01"),
            ("Retire the old", "Move end-of-life software onto supported versions. There may be no fix when it matters.", "Play 05"),
            ("Look back", "When a flaw is announced, review logs from before the disclosure date.", "Play 03"),
            ("Back the maintainers", "Ask suppliers how they fund and track the open-source parts they ship.", "Play 05")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:50mm 1fr 20mm;gap:5mm;padding:5.6mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);align-items:center">
      <div style="font-weight:600;font-size:13.4pt;letter-spacing:-.03em">{a}</div><div style="font-size:9.6pt;line-height:1.5;color:var(--slate)">{b}</div><div class="tag" style="color:var(--cyan);text-align:center">{c}</div></div>''' for a, b, c in rows)
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">04 · What to do</div>
    <h2 style="margin-top:5mm;max-width:150mm">Five habits for a<br>shorter window.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">None needs an AI tool. All of them are about speed and knowing what you run.</p>
    <div style="margin-top:11mm;border-top:.35mm solid rgba(255,255,255,.3)">{cc}</div>'''
    return page(12, body, dark=True, section="04 · What to do")


def p13():
    refs = [("1", "Wiz Research. <b>PHP2Shell.</b> 21 October 2026. wiz.io/blog/php2shell-php-rce. Vendor."), ("2", "Calif. <b>PHP2Shell write-up.</b> calif.io/php2shell/. Security consultancy; undated page with entries to 21 October 2026."),
            ("3", "BleepingComputer. <b>Amazon says PHP2Shell exploitation began 4 days before patches.</b> 22 October 2026 (quotes Amazon Threat Intelligence and Dataminr)."), ("4", "The Register, 23 October 2026 (PHP Foundation statement on no evidence of successful exploitation prior to disclosure)."),
            ("5", "Google Project Zero. <b>From Naptime to Big Sleep.</b> 1 November 2024; Google, 15 July 2025 (blog.google). Vendor."), ("6", "DARPA. <b>AIxCC results.</b> 8 August 2025. darpa.mil/news/2025/aixcc-results."),
            ("7", "XBOW. <b>Top 1: how XBOW did it.</b> 24 June 2025. xbow.com. Vendor."), ("8", "The Register. <b>curl ends bug bounty.</b> 21 January 2026."),
            ("9", "Google Cloud / Mandiant. <b>M-Trends 2026.</b> 23 March 2026. cloud.google.com/blog/topics/threat-intelligence/m-trends-2026. Blog post read; full report not read."), ("10", "NCSC. <b>Impact of AI on cyber threat from now to 2027.</b> 7 May 2025. ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027.")]
    notes = '''<p style="font-size:7.8pt;line-height:1.55">Accurate as of 27 October 2026. We could not read OpenAI's own pages (blocked), so we make no claims that rest on them. A White House statement on AI incident disclosure was reported only second-hand and is not used. Calif refers to OpenAI's programme as Patch the Planet; some press calls it Hack the Planet. M-Trends' time-to-exploit estimate is not attributed to AI by its authors. Vendor and competition results are labelled as such.</p>'''
    return page(13, sources(refs, notes), section="Sources and method")


def p14():
    return page(14, back("Managed IT, cyber and AI for UK businesses.<br>Patching and incident response under SLA.", "Machines find them. People fix them.", visual=aivis.code_scan(120, 80).replace('width="120mm" height="80mm"', 'width="120mm" height="80mm"')), dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("found.html", "w", encoding="utf8").write(build())
