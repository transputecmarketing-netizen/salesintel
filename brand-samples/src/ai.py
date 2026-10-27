import random
from common import DEFS, logo, gt as G, gt_slice, dots, ghost, badge_wall
from report import bg_dark
from case import CSS, head, src, ev, flow, RED, AMBER

TITLE = "AI Breach Brief"
N = 13


def page(n, body, dark=False, section="", folio=True):
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>' if folio and section[:2].isdigit() and not dark else ""
    run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / {N}</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'


def keystream():
    rnd = random.Random(11)
    W, H = 174, 112
    o = [f'<svg viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm" style="display:block;overflow:visible">']
    cx, cy, r = 36, 56, 30
    circ = 2 * 3.14159 * r
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width=".4"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="url(#gd)" stroke-width="5.2" stroke-linecap="round" stroke-dasharray="{circ*0.84:.1f} {circ*0.16:.1f}" transform="rotate(25 {cx} {cy})"/>')
    o.append(f'<circle cx="{cx}" cy="{cy}" r="9" fill="none" stroke="rgba(255,255,255,.18)" stroke-width=".4"/><circle cx="{cx}" cy="{cy}" r="2.2" fill="#00B8DB"/>')
    for j in range(9):
        y0 = cy + (j - 4) * 7.4
        for i in range(48):
            x = 70 + 2.4 * i + 0.085 * i * i
            if x > W - 1:
                break
            y = y0 + (rnd.random() - .5) * (1.2 + i * .18)
            rad = max(.32, 1.9 * (1 - (x - 70) / 130))
            op = max(.12, 1 - (x - 70) / 118)
            col = RED if rnd.random() < .035 else "url(#gh)"
            o.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rad:.2f}" fill="{col}" fill-opacity="{op:.2f}"/>')
    o.append('</svg>')
    return ''.join(o)


def p1():
    body = bg_dark('<div class="glow" style="left:-20mm;top:40mm;width:160mm;height:130mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">AI BREACH BRIEF · OCT 2026</span></div>
    <div style="position:absolute;left:18mm;top:60mm">{keystream()}</div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:46pt;line-height:1;letter-spacing:-.05em">The keys to</div>
      <div style="margin-top:1mm">{G("the gateway.", 46, weight=600, ls=-0.05)}</div>
      <div class="lede" style="margin-top:7mm;max-width:120mm;font-size:12.5pt">What October's AI incidents have in common: credentials that were never rotated, tokens nobody scoped, and agents nobody briefed.</div>
      <div class="hair" style="margin:9mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''
    return page(1, body, dark=True, folio=False)


def conf(t):
    c = {"Solid": "#34C759", "Mostly solid": "#2C72DB", "Single source": AMBER, "Disputed": RED}[t]
    return f'<span class="tag" style="color:{c}">{t}</span>'


def p2():
    rows = [("LiteLLM", "21 Oct", "Backdoored release on PyPI and Docker; credential stealer", "Cloud keys, tokens, LLM provider keys", conf("Solid")),
            ("OpenCode Console", "16–17 Oct", "Intrusion into an older system", "Stored provider API keys of 1.4% of users", conf("Mostly solid")),
            ("PixelLeak", "Reported 1 Oct", "AI coding agents posting screenshots to public repos", "13,000+ internal images, 300+ organisations", conf("Single source")),
            ("302.ai storage", "Found early Aug; news 22 Oct", "Open cloud storage bucket, no password", "17.6m files, 22.72 TB incl. chat logs", conf("Single source"))]
    tr = ''.join(f'<tr><td style="width:30mm">{a}</td><td style="width:26mm;color:var(--mid);font-weight:400">{b}</td><td>{c}</td><td>{d}</td><td style="width:32mm">{e}</td></tr>' for a, b, c, d, e in rows)
    body = f'''{head("At a glance", "Four incidents.<br>One week's reading.", "Each one is about an AI tool or the plumbing around it. None of them involved a clever attack on a model. All of them turned on access.")}
    <div style="margin-top:12mm"><table class="t"><tr><th>Incident</th><th>When</th><th>What happened</th><th>What was exposed</th><th>Confidence</th></tr>{tr}</table></div>
    <div class="card" style="margin-top:10mm;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">How we rate</span>
      <p style="font-size:8.6pt"><b style="font-weight:600">Solid</b>: confirmed by the vendor and independent analysts. <b style="font-weight:600">Mostly solid</b>: confirmed, but cause or scale is undisclosed. <b style="font-weight:600">Single source</b>: one researcher or vendor, no independent confirmation. <b style="font-weight:600">Disputed</b>: used in the text where a claim is contested.</p></div>
    {src("Sources: LiteLLM; Datadog; StepSecurity; TechCrunch; BleepingComputer; Glow; Tom's Hardware; TechRadar (Cybernews). Page 12.")}'''
    return page(2, body, section="At a glance")


def p3():
    def st(num, lab, s, unit=""):
        parts = [(num, 1.0)] + ([(unit, .5)] if unit else [])
        return f'<div>{G(parts, 38)}<div style="font-size:8.6pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{lab}<sup class="c">{s}</sup></div></div>'
    body = f'''{head("Executive summary", "The model was not the<br>weak point. The keys were.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {st("1", "master key left unrevoked started the LiteLLM attack chain", "1")}
      {st("49k", "PyPI downloads of the bad release before removal, including caches and mirrors", "2")}
      {st("6", "minutes for security firms to detect it", "3", " min")}
      {st("1.4", "of OpenCode Console users had stored provider keys exposed", "4", "%")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What happened</h3>
        <p style="margin-top:3mm">On 21 October a backdoored version of LiteLLM, a widely used gateway that sits between applications and AI providers, was published to PyPI and Docker. It stole cloud keys, tokens and the AI provider keys the gateway holds. Days earlier, OpenCode lost stored provider keys to an intruder, and researchers reported that coding agents had been posting internal screenshots to public repositories.<sup class="c">1,2,4,5</sup></p></div>
      <div><h3>What it shows</h3>
        <p style="margin-top:3mm">AI tools concentrate secrets. A gateway holds every provider key; a coding agent holds your repository; an aggregator holds your prompts. One unrotated key, one broad token or one unbriefed agent is enough.</p>
        <p><b style="font-weight:600">Our view:</b> treat AI plumbing as production infrastructure with a named owner, scoped credentials and a rotation date. The same discipline as any other system that holds keys.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:28mm">Five moves</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">Inventory AI tools and keys · Rotate on exposure, always · Pin and verify what you install · Scope every token · Brief your agents</div></div>
    {src("Sources: 1 LiteLLM. 2 StepSecurity. 3 BleepingComputer. 4 TechCrunch. 5 Glow.", "21mm")}'''
    return page(3, body, section="Executive summary")


def p4():
    body = bg_dark('<div class="glow" style="right:-30mm;top:60mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba(21,93,252,.3) 0%,rgba(21,93,252,0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01 · LiteLLM</div>
    <div style="position:absolute;left:18mm;top:56mm">{G("1 key.", 130, ls=-0.07)}
      <div class="lede" style="margin-top:8mm;max-width:118mm;font-size:14pt;color:#fff;font-weight:300">An internal master key was committed to a repository, the commit was overwritten, and the key was never revoked. On 10 October it was used to take an organisation owner's token. Eleven days later the release pipeline shipped malware.<sup class="c">1</sup></div></div>
    <div style="position:absolute;left:18mm;bottom:30mm"><h2 style="font-size:34pt">Deleting a secret<br>is not revoking it.</h2></div>'''
    return page(4, body, dark=True, section="01 · LiteLLM")


def p5():
    e = [ev("Earlier", "A key is committed", "A repository once contained the master key of an experimental internal agent platform. The commit was overwritten. The key was never revoked.", "", 1),
         ev("10 Oct", "The key is used", "The attacker uses it to extract a GitHub CLI token belonging to an organisation owner. The token was not scoped down and not tied to a service account.", "a", 1),
         ev("Before 21 Oct", "Quiet escalation", "Throwaway CI workflows harvest more tokens, including two engineers'. The release workflow is repointed to a lookalike repository with a hyphen in its name.", "a", 1),
         ev("19 Oct", "Approvals loosened", "Release permissions are relaxed so that any two engineers can trigger and approve a release.", "", 1),
         ev("21 Oct", "The release", "Version 1.107.0 goes out to PyPI and to Docker tags. Security firms detect it within about six minutes; packages are removed within hours.", "a", "1,3"),
         ev("23–24 Oct", "The record is corrected", "LiteLLM publishes the attack chain on 23 October. Earlier theories, about gateway logs or a leaked coding-tool token, were not how the attacker got in. Clean releases resume on 24 October.", "k", "1,2")]
    body = f'''{head("01 · LiteLLM", "How it unfolded.")}
    <div class="tl" style="margin-top:11mm">{''.join(e)}</div>
    {src("Sources: 1 LiteLLM, attack-chain post-mortem (23 Oct). 2 StepSecurity. 3 BleepingComputer. Attribution to any group is unproven.")}'''
    return page(5, body, section="01 · LiteLLM")


def p6():
    f = flow("The attack chain", "Five steps, one unrotated key", [
        "A stale master key from an experimental platform is still valid.",
        "It yields an organisation owner's GitHub CLI token, broad and not tied to a service account.",
        "Disposable CI workflows steal more tokens, including engineers' own.",
        "The release workflow is pointed at a lookalike repository.",
        "Release rules had been relaxed two days before, so two engineers could approve. Version 1.107.0 ships."], "#00B8DB")
    chips = ["Cloud keys (AWS, GCP, Azure)", "Kubernetes and Vault secrets", "SSH, GPG and TLS keys", "npm, PyPI and Git tokens", ".env files", "LLM provider API keys", "AI coding-tool sessions", "Browser passwords and cookies", "Provider keys in the proxy database"]
    ch = ''.join(f'<span class="tag" style="color:var(--blue);margin:0 2mm 2mm 0">{c}</span>' for c in chips)
    body = f'''{head("01 · LiteLLM", "Built to run, whether or not<br>you ever used it.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:10mm">
      <div>{f}</div>
      <div><div class="eyebrow" style="color:var(--mid)">What the payload did</div>
        <p style="margin-top:3mm;font-size:9pt">The malicious release added files that Python runs at start-up, so it executed on any Python launch on an affected host, even if LiteLLM itself was never imported. It stole credentials and fetched code from a remote server every hour.<sup class="c">2</sup></p>
        <div class="eyebrow" style="color:var(--mid);margin:8mm 0 3mm">What it went after</div><div>{ch}</div>
        <div class="card" style="margin-top:6mm;padding:5mm"><div class="eyebrow">Use of stolen keys</div><p style="font-size:8.4pt;margin-top:2mm">Datadog saw no second-stage payload in the wild. Wiz reported that stolen AWS credentials were tested starting about four and a half hours after exfiltration, consistent with abusing them to run AI workloads.<sup class="c">2,6</sup></p></div></div></div>
    {src("Sources: 1 LiteLLM. 2 Datadog Security Labs. 6 Wiz, via The Hacker News.")}'''
    return page(6, body, section="01 · LiteLLM")


def hrs():
    X0, X1 = 6, 168
    t0, t1 = 11.0, 15.0
    def x(h): return X0 + (X1 - X0) * (h - t0) / (t1 - t0)
    pyp = (11 + 39.85 / 60, 13 + 23 / 60)
    dk = (11 + 46.93 / 60, 14 + 20 / 60)
    o = ['<svg viewBox="0 0 174 62" width="174mm" height="62mm" style="display:block;overflow:visible">']
    for h in range(11, 16):
        o.append(f'<line x1="{x(h)}" x2="{x(h)}" y1="8" y2="44" stroke="#E3E8F0" stroke-width=".25"/><text x="{x(h)}" y="50" text-anchor="middle" font-family="JetBrains Mono" font-size="2.6" fill="#6B7A90">{h:02d}:00</text>')
    o.append(f'<rect x="{x(pyp[0])}" y="12" width="{x(pyp[1])-x(pyp[0])}" height="9" rx="1.6" fill="url(#gh)"/><text x="{x(pyp[0])+2}" y="17.8" font-family="Poppins" font-weight="600" font-size="3" fill="#fff">PyPI · 1 h 43 m</text>')
    o.append(f'<rect x="{x(dk[0])}" y="26" width="{x(dk[1])-x(dk[0])}" height="9" rx="1.6" fill="{RED}"/><text x="{x(dk[0])+2}" y="31.8" font-family="Poppins" font-weight="600" font-size="3" fill="#fff">Docker Hub tags · 2 h 33 m</text>')
    o.append(f'<text x="{X0}" y="58" font-family="JetBrains Mono" font-size="2.4" fill="#6B7A90">21 OCTOBER 2026 · UTC · LITELLM TIMINGS; OTHER SOURCES DIFFER BY A FEW MINUTES</text></svg>')
    return ''.join(o)


def p7():
    body = f'''{head("01 · LiteLLM", "A few hours, a very<br>large footprint.", "The bad release was live for under two hours on PyPI and under three on Docker. For a package at this scale, that is a long time.")}
    <div style="margin-top:12mm">{hrs()}</div>
    <div class="hair" style="margin:9mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("92m", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">monthly PyPI downloads of the project overall, as cited by BleepingComputer. Datadog cites about 23 million a week.<sup class="c">2,3</sup></p></div>
      <div>{G("49,000", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">downloads of the malicious version, a figure that includes CI caches and mirrors and excludes container pulls.<sup class="c">4</sup></p></div>
      <div>{G("~4.5 h", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">from exfiltration to the first testing of stolen AWS credentials, according to Wiz.<sup class="c">6</sup></p></div></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">What affected users were told</div>
      <p style="font-size:9pt">Pin to version 1.106.2. Rotate every credential reachable from an affected host. Rebuild the hosts. Customers using a private enterprise registry were not affected.<sup class="c">1</sup></p></div>
    {src("Sources: 1 LiteLLM. 2 Datadog. 3 BleepingComputer. 4 StepSecurity. 6 Wiz via The Hacker News. Download figures are not comparable across sources.")}'''
    return page(7, body, section="01 · LiteLLM")


def p8():
    cards = [("OpenCode Console", "16–17 Oct", "Mostly solid", "Attackers entered an older system overnight. Provider API keys stored by 1.4% of Console users, those who had linked OpenAI, Anthropic or Google, were exposed and used to run up charges. Some users reported more than $1,700 overnight; those figures are user reports. Anthropic and Google blocked keys; OpenAI said it worked with OpenCode on access and refunds.", "OpenCode called it a large-scale distillation attack. Reporters note it did not explain how, and sceptics call it a plain breach. The entry route is undisclosed.", "4,7"),
             ("PixelLeak", "Reported 1 Oct", "Single source", "Glow reports AI coding agents that could not attach images to pull requests in private repositories worked around it by posting screenshots to public ones, often under the developer's personal account. Over 13,000 images from 300+ organisations across 900+ repositories; 93% were under personal accounts.", "Vendor research that promotes its own controls. No organisations are named; Glow's page metadata and Tom's Hardware give different dates.", "5,8"),
             ("302.ai storage", "Found early Aug", "Single source", "Cybernews reports an unencrypted, password-less cloud storage bucket linked to an AI aggregator holding 17.6 million files and 22.72 TB, including roughly 500 GB of chat logs, prompts and responses. It was locked down about a month later. The news broke on 22 October.", "No vendor statement and no evidence of third-party access. The headline says 18 million files; the body says 17.6 million. We use the body.", "9")]
    cc = ''.join(f'''<div class="card" style="padding:7mm"><div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">{a} · {b}</div>{conf(c)}</div>
      <p style="margin-top:4mm;font-size:9pt">{d}<sup class="c">{s}</sup></p><p style="margin-top:3mm;font-size:8.2pt;color:var(--mid)"><b style="font-weight:600;color:var(--navy)">Caveat.</b> {e}</p></div>''' for a, b, c, d, e, s in cards)
    body = f'''{head("02 · Around it", "Three more in the<br>same few weeks.")}
    <div style="display:grid;gap:5mm;margin-top:10mm">{cc}</div>
    {src("Sources: 4 TechCrunch. 5 Glow. 7 BleepingComputer. 8 Tom's Hardware. 9 TechRadar, citing Cybernews. Page 12.", "20mm")}'''
    return page(8, body, section="02 · Around it")


def p9():
    rows = [("LiteLLM", "One unrevoked key; broad token; relaxed release approvals", "Revoke on exposure. Scope tokens. Two-person release review that cannot be relaxed quietly."),
            ("OpenCode", "Provider keys stored in a system that was breached", "Short-lived, spend-capped keys. Alerts on unusual spend. Retire old systems."),
            ("PixelLeak", "Agents given a workaround nobody anticipated", "Tell agents where they may not write. Block public repos for sensitive projects. Review what they publish."),
            ("302.ai", "Storage open to the internet", "Private by default. Treat chat logs as sensitive data.")]
    tr = ''.join(f'<tr><td style="width:24mm">{a}</td><td>{b}</td><td>{c}</td></tr>' for a, b, c in rows)
    body = f'''{head("02 · Around it", "One pattern, four times.", "Strip away the AI vocabulary and each incident is a familiar failure: access that was wider, older or more open than anyone intended.")}
    <div style="margin-top:12mm"><table class="t"><tr><th>Incident</th><th>The failure</th><th>The control that helps</th></tr>{tr}</table></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center"><div class="eyebrow" style="color:var(--cyan);width:24mm">Our view</div>
      <div class="pull" style="font-size:13.5pt;color:#fff">New technology does not need new principles. It needs the old ones applied to a place nobody was looking.</div></div>
    {src("Controls are our synthesis of vendor post-mortems and the NCSC secure AI development guidelines. Page 12.")}'''
    return page(9, body, section="02 · Around it")


def p10():
    def unit(n, lab, s):
        return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
                f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">{s}</sup></div></div>')
    body = f'''{head("03 · The UK picture", "Most organisations are<br>not ready for this.", "IBM's 2025 UK research gives the clearest recent view of AI governance. Picture 100 UK organisations.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:11mm">
      {unit(31, "have policies to govern AI use and prevent shadow AI", 10)}{unit(37, "have AI access controls in place (63% do not)", 10)}
      {unit(18, "of breaches began with a supplier or supply-chain compromise, the top cause", 10)}{unit(16, "began with phishing", 10)}</div>
    <div class="src" style="margin-top:6mm">IBM Cost of a Data Breach Report 2025, UK edition. UK respondents. Different questions; not additive.</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm">
      <div>{G("£498k", 30, ls=-0.045)}<p style="font-size:9pt;margin-top:3mm">more paid on average by organisations with high levels of unsanctioned AI use. IBM lists this among its global findings, not UK-only.<sup class="c">10</sup></p></div>
      <div><div class="eyebrow">UK NCSC guidance</div><p style="font-size:9pt;margin-top:3mm">The NCSC's secure AI development guidelines tell organisations to <i>assess and monitor the security of your AI supply chains across a system's life cycle</i>, to take models, libraries and external APIs from verified developers, and to <i>treat logs as sensitive data</i>.<sup class="c">11</sup></p></div></div>
    {src("Sources: 10 IBM UK newsroom. 11 NCSC, Guidelines for secure AI system development (2023). The guidance predates these incidents; its advice maps directly onto them.", "20mm")}'''
    return page(10, body, section="03 · The UK picture")


def p11():
    rows = [("Know", "List every AI tool, gateway, agent and key in use. Name an owner for each.", "Play 04"),
            ("Rotate", "Revoke a secret the moment it is exposed. Deleting a commit is not revocation.", "Play 02"),
            ("Pin", "Pin dependencies and verify them. Delay adopting brand-new releases for production.", "Play 05"),
            ("Scope", "Short-lived, least-privilege tokens. No organisation-owner tokens in everyday tooling.", "Play 02"),
            ("Cap", "Spend limits and alerts on every AI provider key.", "Play 04"),
            ("Gate", "Release approvals that cannot be relaxed without a second person noticing.", "Play 05"),
            ("Brief", "Tell coding agents where they may and may not write, and review what they publish.", "Play 04"),
            ("Rehearse", "Practise a leaked-key day: who rotates what, in what order, within an hour.", "Play 03")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:28mm 1fr 20mm;gap:5mm;padding:5.2mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);align-items:center">
      <div style="font-weight:600;font-size:15pt;letter-spacing:-.03em">{a}</div><div style="font-size:9.6pt;line-height:1.5;color:var(--slate)">{b}</div><div class="tag" style="color:var(--cyan);text-align:center">{c}</div></div>''' for a, b, c in rows)
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">04 · What to do</div>
    <h2 style="margin-top:5mm;max-width:150mm">Eight habits.<br>None of them are new.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">Mapped to the plays in The Resilience Playbook, so each has an owner and a test.</p>
    <div style="margin-top:11mm;border-top:.35mm solid rgba(255,255,255,.3)">{cc}</div>'''
    return page(11, body, dark=True, section="04 · What to do")


def p12():
    refs = [("1", "LiteLLM. <b>Security incident, 21 October 2026: attack chain.</b> docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain (and the incident post, docs.litellm.ai/blog/security-incident-oct-21-2026)"),
            ("2", "Datadog Security Labs. <b>LiteLLM compromised on PyPI and Docker.</b> securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/"),
            ("3", "BleepingComputer. <b>LiteLLM release pipeline hacked to distribute info-stealer malware.</b> 22 October 2026."),
            ("4", "StepSecurity. <b>litellm 1.107.0 compromised: backdoored wheels and credential stealer.</b> stepsecurity.io/blog/litellm-1-107-0-compromised-pypi-backdoored-wheels-credential-stealer"),
            ("5", "Glow. <b>How AI agents exposed developer screenshots from leading tech companies.</b> glow.io/blogs/how-ai-agents-exposed-developer-screenshots-from-leading-tech-companies"),
            ("6", "The Hacker News, citing Wiz. thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html (used only for the credential-testing observation; its root-cause headline was superseded)."),
            ("7", "TechCrunch and BleepingComputer on OpenCode, 19 October 2026. techcrunch.com/2026/10/19/hackers-hit-ai-coding-tool-opencode-running-up-charges-on-users-ai-accounts/"),
            ("8", "Tom's Hardware on PixelLeak. tomshardware.com/tech-industry/cyber-security/ai-agents-inadvertently-leak-13-000-internal-screenshots-from-organizations-list-of-companies-includes-fortune-500-and-a-frontier-ai-lab"),
            ("9", "TechRadar, citing Cybernews, 22 October 2026. techradar.com/pro/security/security-breach-at-ai-aggregator-exposes-over-18-million-files-including-some-very-embarrassing-chat-records"),
            ("10", "IBM UK newsroom. <b>UK sees drop in breach costs as AI speeds detection.</b> uk.newsroom.ibm.com/2025-cost-of-data-breach-UK"),
            ("11", "NCSC. <b>Guidelines for secure AI system development: secure development.</b> ncsc.gov.uk/collection/guidelines-secure-ai-system-development/guidelines/secure-development")]
    rows = ''.join(f'<div style="display:grid;grid-template-columns:9mm 1fr;gap:3mm;padding:2.6mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8pt;font-weight:500">{n}</div><div style="font-size:7.6pt;line-height:1.5;word-break:break-word">{t}</div></div>' for n, t in refs)
    body = f'''{head("Sources and method", "Where this comes from, and<br>what we corrected.")}
    <div style="margin-top:7mm;border-top:.35mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:6mm"><div class="eyebrow">Method notes</div>
      <p style="font-size:7.8pt;line-height:1.55">Accurate as of 27 October 2026. Early reports blamed LiteLLM's breach on leaked gateway logs or a coding-tool token; LiteLLM's own post-mortem replaced that account, and we follow it. 302.ai's news date is not its incident date. PixelLeak and 302.ai rest on single sources. We did not name organisations that sources did not name, and we make no attribution to any threat group. Counts of downloads and users come from different measurements and are not comparable.</p></div>'''
    return page(12, body, section="Sources and method")


def p13():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{dots(10,10,100,pitch=11,d=6.6,halo=False)}</div>
    <div style="position:absolute;left:0;right:0;top:158mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">Managed IT, cyber and AI for UK businesses.<br>ISO 27001-certified delivery from a UK service desk.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(13, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("ai.html", "w", encoding="utf8").write(build())
