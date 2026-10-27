from kit import *
import aivis
from case import RED, AMBER

TITLE = "Agents Have Hands"
N = 14
page = mk(TITLE, N)


def p1():
    return page(1, cover("AI AGENT SECURITY · OCT 2026", ["Agents have"], "hands.", 62,
                         "What changes when an AI tool can read your mail, open your files and act on what it finds. And why one hidden sentence can steer it.",
                         aivis.agent_arms(), title_pt=46, vis_top="50mm", glow='<div class="glow" style="left:30mm;top:20mm;width:170mm;height:150mm;background:radial-gradient(circle,rgba(229,72,77,.14) 0%,rgba(229,72,77,0) 64%)"></div>'), dark=True, folio=False)


def p2():
    cards = [("Source 01", "UK NCSC", "Blog by its Technical Director for Platforms Research on prompt injection, 8 December 2025. A blog, not formal guidance."),
             ("Source 02", "OWASP and NIST", "OWASP Top 10 for LLM Applications 2025; NIST AI 100-2e2025 on adversarial machine learning."),
             ("Source 03", "CVE records", "MITRE records for six vulnerabilities in AI assistants and developer tools, 2025 and 2026."),
             ("Source 04", "Microsoft MSRC; joint guidance", "Microsoft's July 2025 defence write-up, and the March 2026 AI supply-chain guidance co-sealed by the UK NCSC."),
             ("Not read", "Gartner", "Its agent-sprawl press release was blocked. Figures come from syndicated copies and are flagged.")]
    cc = ''.join(f'<div class="card"><div class="eyebrow">{a}</div><h3 style="margin:3mm 0 2mm;font-size:11pt">{b}</h3><p style="font-size:8.4pt">{c}</p></div>' for a, b, c in cards)
    body = f'''{head("About this report", "A young field.<br>Mostly vendor research.", "Agent security is two years old. Many findings come from the security firms that discovered them, so we say who found what and which claims have a single source.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">{cc}</div>
    <div class="card" style="margin-top:5mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">No exploitation claimed</span>
      <p style="font-size:8.6pt;color:var(--slate)">Where we cite a vulnerability, the record we read shows no evidence of exploitation in the wild. These are lessons in design, not reports of attacks on customers.</p></div>
    <div class="src" style="position:absolute;left:18mm;right:18mm;bottom:15mm">© 2026 Transputec Ltd. Third-party material is quoted with attribution.</div>'''
    return page(2, body, section="About")


def p3():
    return page(3, contents([("", "Executive summary", 4), ("01", "No boundary", 5), ("", "What prompt injection is", 6), ("", "Why tools raise the stakes", 7),
                             ("02", "Six real cases", 8), ("", "Developer tools and severity", 9), ("03", "How many agents, and who governs them", 10),
                             ("04", "What the guidance says", 11), ("", "Five questions before you give an agent hands", 12), ("", "Sources and method", 13)]), section="Contents")


def p4():
    body = f'''{head("Executive summary", "The model can be talked<br>into things. The tools make<br>it matter.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {stat("7", "of UK businesses using AI use agentic AI, in spring 2025", 5, "%")}
      {stat("9.3", "CVSS score for EchoLeak, a zero-click flaw in Microsoft 365 Copilot", 3)}
      {stat("0", "clicks needed from the user to trigger it", 3, " clicks")}
      {stat("13", "of organisations think they have the right agent governance (Gartner, via press copies)", 6, "%")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What the sources say</h3>
        <p style="margin-top:3mm">The NCSC says current language models do not enforce a security boundary between instructions and data, and that prompt injection may never be fully mitigated. Where such a model can call tools, an injected instruction has the reach of whatever those tools can do.<sup class="c">1</sup></p></div>
      <div><h3>What it means</h3>
        <p style="margin-top:3mm">Treat an agent like a very capable, very gullible new starter: give it the least access that does the job, ask a human before anything irreversible, and log what it does.</p>
        <p><b style="font-weight:600">Our view:</b> the question to ask of any agent is not how smart it is. It is what it can touch, and who is told when it does.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:26mm">Not a product fix</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">The NCSC: prompt injection “cannot be fully mitigated with a product or appliance”. It must be designed around.<sup class="c">1</sup></div></div>
    {src("Sources: 1 NCSC. 3 CVE record CVE-2025-32711. 5 DSIT AI Adoption Research (fieldwork spring 2025). 6 Gartner, as syndicated; not read at source.", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    return page(5, opener("Chapter 01 · No boundary", "No line.", 112,
                          "“Current large language models simply do not enforce a security boundary between instructions and data inside a prompt.”<sup class='c'>1</sup>",
                          "The model cannot tell<br>an order from<br>an email.", glow_col="229,72,77"), dark=True, section="01 · No boundary")


def p6():
    defs = [("NCSC", "Prompt injection is where developers concatenate their own instructions with untrusted content in a single prompt, and then treat the model's response as if there were a robust boundary between what the app asked for and anything in the untrusted content.", "1"),
            ("NIST", "An attack which exploits the concatenation of untrusted input with a prompt constructed by a higher-trust party such as the application designer.", "2"),
            ("OWASP", "It is unclear if there are fool-proof methods of prevention for prompt injection.", "3")]
    dd = ''.join(f'<div style="display:grid;grid-template-columns:20mm 1fr;gap:5mm;padding:5mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8pt;letter-spacing:.1em">{a}</div><p style="font-size:9.2pt">“{b}”<sup class="c">{s}</sup></p></div>' for a, b, s in defs)
    flow = ''.join(f'<div style="flex:1;text-align:center"><div style="padding:5mm 2mm;border-radius:3mm;background:{bg};border:.3mm solid {bd};font-size:8.8pt;font-weight:500;line-height:1.35">{t}</div></div>' + ('<div style="align-self:center;color:var(--mid);font-size:12pt;padding:0 1mm">→</div>' if i < 3 else '') for i, (t, bg, bd) in enumerate([("Your instruction<br>“Summarise my inbox”", "var(--mist)", "var(--line)"), ("Untrusted content<br>an email with a hidden line", "rgba(229,72,77,.08)", RED), ("The model reads both as one prompt", "var(--mist)", "var(--line)"), ("It acts through tools<br>mail, files, calendar", "rgba(0,184,219,.1)", "#00B8DB")]))
    body = f'''{head("01 · No boundary", "What prompt injection is.", "Three authorities, one idea: text that arrives as data can be read as an instruction.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{dd}</div>
    <div class="eyebrow" style="color:var(--mid);margin:11mm 0 4mm">The path of one hidden sentence</div>
    <div style="display:flex;gap:1mm">{flow}</div>
    <div class="card" style="margin-top:9mm;display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">Indirect</span>
      <p style="font-size:8.6pt">NIST describes indirect injection as an attacker injecting instructions remotely, without interacting with the application directly: through a web page, a document, an email.<sup class="c">2</sup></p></div>
    {src("Sources: 1 NCSC blog, 8 December 2025. 2 NIST AI 100-2e2025. 3 OWASP LLM01:2025. Quotations are exact; the diagram is ours.", "20mm")}'''
    return page(6, body, section="01 · No boundary")


def p7():
    owasp = [("LLM01", "Prompt Injection", 1), ("LLM02", "Sensitive Information Disclosure", 0), ("LLM03", "Supply Chain", 1), ("LLM04", "Data and Model Poisoning", 0), ("LLM05", "Improper Output Handling", 0),
             ("LLM06", "Excessive Agency", 1), ("LLM07", "System Prompt Leakage", 0), ("LLM08", "Vector and Embedding Weaknesses", 0), ("LLM09", "Misinformation", 0), ("LLM10", "Unbounded Consumption", 0)]
    ol = ''.join(f'<div style="display:flex;gap:4mm;padding:2.4mm 0;border-bottom:.25mm solid var(--line);{"background:linear-gradient(90deg,rgba(0,184,219,.1),rgba(0,184,219,0));" if h else ""}"><span class="mono" style="width:14mm;font-size:7.4pt;color:var(--blue)">{a}</span><span style="font-size:9pt;font-weight:{600 if h else 400}">{b}</span></div>' for a, b, h in owasp)
    body = f'''{head("01 · No boundary", "Tools raise the stakes.", "A chatbot that is fooled says something wrong. An agent that is fooled does something.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:10mm">
      <div><div class="card" style="padding:7mm"><div class="eyebrow">The NCSC on tools</div>
        <p style="font-size:9.2pt;margin-top:3mm">When a system calls tools or APIs based on a model's output, the impact of prompt injection becomes “whatever the worse case scenario would be of giving an attacker direct access to those tools/APIs”.<sup class="c">1</sup></p></div>
        <div class="card" style="padding:7mm;margin-top:5mm"><div class="eyebrow">A design rule it cites</div>
        <p style="font-size:9.2pt;margin-top:3mm">When a model processes information from a party, its privileges drop to that of that party. A model reading external email should not hold privileged tools.<sup class="c">1</sup></p></div></div>
      <div><div class="eyebrow" style="color:var(--mid);margin-bottom:3mm">OWASP Top 10 for LLM Applications 2025</div><div style="border-top:.35mm solid var(--navy)">{ol}</div>
        <p style="font-size:8pt;color:var(--mid);margin-top:3mm">Highlighted: the three most relevant to agents. LLM06 Excessive Agency is the agent-specific item.<sup class="c">3</sup></p></div></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:9mm"><div class="eyebrow">Newer list</div>
      <p style="font-size:8.6pt">OWASP also published a Top 10 for Agentic Applications on 9 December 2025, developed with more than 100 experts. We could not read its item list at source and do not reproduce it here.<sup class="c">3</sup></p></div>
    {src("Sources: 1 NCSC blog. 3 OWASP GenAI Security Project.", "20mm")}'''
    return page(7, body, section="01 · No boundary")


def case_card(a, b, tag, text, s, col=AMBER):
    return f'''<div class="card" style="padding:6.5mm"><div style="display:flex;justify-content:space-between;align-items:center"><div class="eyebrow">{a} · {b}</div><span class="tag" style="color:{col}">{tag}</span></div>
      <p style="margin-top:3.4mm;font-size:8.9pt">{text}<sup class="c">{s}</sup></p></div>'''


def p8():
    body = f'''{head("02 · Six real cases", "From inbox to exfiltration.", "Three cases in assistants that read your business data. Two are vendor-reported and single-source; the CVE records show no sign of exploitation in the wild.")}
    <div style="display:grid;gap:5mm;margin-top:9mm">
      {case_card("EchoLeak", "CVE-2025-32711", "CVSS 9.3", "A zero-click flaw in Microsoft 365 Copilot. A crafted email could, per a research paper, lead to remote data exfiltration by chaining past several protections. Published 11 June 2025; Microsoft fixed it on its servers, so customers had nothing to install. Found by Aim Security, per the CVE record's reference.", "3,4")}
      {case_card("Copilot Studio", "CVE-2026-21520", "CVSS 7.5", "Capsule Security reported that text planted in a public SharePoint form could steer an agent into sending data out. The CVE record, published 22 January 2026, describes only an information-disclosure flaw; the link to the research rests on trade press (CSO).", "3,6")}
      {case_card("Agentforce", "PipeLeak", "No CVE", "Capsule also reported that a public lead form could push a Salesforce agent to email out records. Salesforce said it had remediated the specific scenario and called the vector configuration-specific. Single source; no Salesforce advisory read.", "6")}</div>
    {src("Sources: 3 CVE records at cveawg.mitre.org (CISA records: exploitation none). 4 Reddy and Gujral, arXiv 2509.10540. 6 CSO Online, 15 April 2026.", "20mm")}'''
    return page(8, body, section="02 · Six real cases")


def p9():
    data = [("MCP Inspector", "CVE-2025-49596", 9.4, "v4.0"), ("EchoLeak", "CVE-2025-32711", 9.3, "v3.1"), ("Cursor · CurXecute", "CVE-2025-54135", 8.6, "v3.1"),
            ("Copilot and Visual Studio", "CVE-2025-53773", 7.8, "v3.1"), ("Copilot Studio", "CVE-2026-21520", 7.5, "v3.1"), ("Cursor · MCPoison", "CVE-2025-54136", 7.2, "v3.1")]
    bars = ''.join(f'<div style="display:grid;grid-template-columns:44mm 1fr;gap:4mm;align-items:center;margin-bottom:3.4mm"><div><div style="font-size:9pt;font-weight:500">{n}</div><div class="mono" style="font-size:6.2pt;color:var(--mid)">{c}</div></div>'
                   f'<div style="display:flex;align-items:center;gap:3mm"><div style="height:6.4mm;width:{v*10.5:.0f}mm;border-radius:1.5mm;background:{"var(--grad)" if v>=9 else "#C9D6EE"}"></div><span style="font-weight:600;font-size:10pt">{v}</span><span class="mono" style="font-size:6pt;color:var(--mid)">CVSS {vv}</span></div></div>' for n, c, v, vv in data)
    body = f'''{head("02 · Six real cases", "Developer tools are the<br>sharpest edge.", "AI coding assistants and tool servers sit close to source code and credentials. Severity scores for six records from 2025 and 2026.")}
    <div style="margin-top:10mm">{bars}</div>
    <p class="src" style="margin-top:2mm">CVSS versions differ (v3.1 and v4.0), so scores are indicative, not strictly comparable.</p>
    <div class="hair" style="margin:7mm 0 6mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm">
      <p style="font-size:8.6pt"><b style="font-weight:600">MCP Inspector</b> (a developer tool, fixed in 0.14.1): remote code execution because the client and proxy did not authenticate. <b style="font-weight:600">Cursor</b>: an injected instruction could create a configuration without approval (fixed in 1.3.9), and an approved configuration could be silently swapped.<sup class="c">3</sup></p>
      <p style="font-size:8.6pt"><b style="font-weight:600">GitHub Copilot and Visual Studio</b>: per the researcher, Johann Rehberger, prompt injection could edit settings so tool use was auto-approved. He reported it on 29 June 2025; Microsoft fixed it in August 2025. His account is the source for the timeline.<sup class="c">7</sup></p></div>
    {src("Sources: 3 CVE records. 7 Embrace The Red (researcher's own write-up). We did not verify who found the Cursor flaws.", "20mm")}'''
    return page(9, body, section="02 · Six real cases")


def p10():
    body = f'''{head("03 · How many agents", "More agents, fewer<br>governed.", "Gartner's April 2026 press release on agent sprawl was blocked to our tools. These figures come from syndicated copies and need checking against Gartner's own wording.")}
    <div style="display:grid;grid-template-columns:60mm 1fr;gap:12mm;margin-top:11mm;align-items:center">
      <div>{dots(10,10,13,pitch=5.6,d=3.6,order="row",unlit="#E1E7F1",halo=False)}<div class="mono" style="font-size:6pt;letter-spacing:.1em;color:var(--mid);margin-top:3mm;text-transform:uppercase">13 in 100 think governance is right</div></div>
      <div>{G("13%", 56, ls=-0.05)}<p style="font-size:9.4pt;margin-top:4mm">of organisations think they have the right AI agent governance in place, according to a copy of Gartner's release. No sample size or survey name was given.<sup class="c">8</sup></p></div></div>
    <div class="hair" style="margin:9mm 0 7mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm">
      <div>{G("150,000", 30, ls=-0.045)}<p style="font-size:8.8pt;margin-top:3mm">agents in use at an average Fortune 500 company by 2028, up from fewer than 15 in 2025, as Gartner predicts. One copy says Fortune 100; check the original.<sup class="c">8</sup></p></div>
      <div><div class="eyebrow">The six steps it recommends</div><ol style="margin:3mm 0 0 4mm;font-size:8.6pt;line-height:1.6;color:var(--body)"><li>Agent governance and policies</li><li>A central inventory, including shadow AI</li><li>Agent identity, permissions and lifecycle</li><li>AI information governance</li><li>Monitor and remediate behaviour</li><li>A culture of responsible use</li></ol></div></div>
    <div class="card" style="margin-top:7mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">UK context</span>
      <p style="font-size:8.6pt;color:var(--slate)">In spring 2025 only 7% of UK businesses using AI used agentic AI. The direction is clear; the UK baseline is small and dated.<sup class="c">5</sup></p></div>
    {src("Sources: 8 Gartner, 28 April 2026, via itvoice.in and tech.co; not read at gartner.com. 5 DSIT AI Adoption Research.", "20mm")}'''
    return page(10, body, section="03 · How many agents")


def p11():
    rows = [("Constrain", "Favour deterministic, non-model safeguards that limit what the system can do. Do not rely on filters for phrases like “ignore previous instructions”.", "NCSC"),
            ("Least privilege", "Give the application its own narrow tokens and handle sensitive functions in code, not through the model.", "OWASP"),
            ("Ask a human", "Require approval for high-risk actions.", "OWASP"),
            ("Treat it as untrusted", "Test with the model treated as an untrusted user. Mark external data separately from instructions.", "OWASP, NCSC"),
            ("Watch the calls", "Log model inputs and outputs, and tool and API calls, including failures.", "NCSC"),
            ("Block the exits", "Use fine-grained permissions and deterministic blocking of known exfiltration channels, with user consent.", "Microsoft")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:42mm 1fr 22mm;gap:5mm;padding:5mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);align-items:center">
      <div style="font-weight:600;font-size:13pt;letter-spacing:-.03em">{a}</div><div style="font-size:9.2pt;line-height:1.5;color:var(--slate)">{b}</div><div class="tag" style="color:var(--cyan);text-align:center">{c}</div></div>''' for a, b, c in rows)
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">04 · What the guidance says</div>
    <h2 style="margin-top:5mm;max-width:150mm">Contain the damage.<br>You cannot cure the cause.</h2>
    <p class="lede" style="margin-top:6mm;max-width:140mm">The NCSC's aim is to reduce the risk and the impact. If the system cannot tolerate the remaining risk, it may not be a good use case.<sup class="c">1</sup></p>
    <div style="margin-top:9mm;border-top:.35mm solid rgba(255,255,255,.3)">{cc}</div>
    <p style="font-size:7.8pt;margin-top:5mm;color:rgba(255,255,255,.5)">Microsoft's guidance is vendor-authored. We read no agency guidance on sandboxing or network isolation and attribute none.</p>'''
    return page(11, body, dark=True, section="04 · What the guidance says")


def p12():
    qs = [("What can it read?", "List every mailbox, drive, site and system. Remove what it does not need."), ("What can it do?", "Send, delete, pay, publish, run code? Start read-only."),
          ("Who approves?", "Name what needs a human yes, and who gives it."), ("What can leave?", "Block links, images and mail to outside addresses unless approved."),
          ("How will we know?", "Log tool calls. Decide who looks, how often, and what triggers a call.")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:12mm 54mm 1fr;gap:5mm;padding:6mm 0;border-bottom:.25mm solid var(--line);align-items:center">
      <div style="width:9mm;height:9mm;border-radius:50%;background:var(--grad-d);color:#fff;font-weight:600;font-size:9pt;display:flex;align-items:center;justify-content:center">{i+1}</div>
      <div style="font-weight:600;font-size:13pt;letter-spacing:-.03em">{a}</div><div style="font-size:9.4pt;line-height:1.5;color:var(--body)">{b}</div></div>''' for i, (a, b) in enumerate(qs))
    body = f'''{head("04 · What the guidance says", "Five questions before you<br>give an agent hands.", "Our synthesis of the NCSC, OWASP and Microsoft guidance above. Use it for any tool that can act on your data.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{cc}</div>
    <div class="card" style="margin-top:9mm;display:flex;gap:7mm;align-items:center;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Playbook</span>
      <p style="font-size:8.6pt;color:var(--slate)">These map to play 04, Govern AI use, in The Resilience Playbook, and to the oversharing steps in What Copilot Can See.</p></div>
    {src("Illustrative synthesis; not an official checklist.", "20mm")}'''
    return page(12, body, section="04 · What the guidance says")


def p13():
    refs = [("1", "NCSC. <b>Prompt injection is not SQL injection (it may be worse).</b> Blog, 8 December 2025. ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection. A blog, not formal guidance."),
            ("2", "NIST. <b>Adversarial Machine Learning, AI 100-2e2025</b> (March 2025). csrc.nist.gov/glossary/term/prompt_injection"),
            ("3", "OWASP GenAI Security Project. <b>LLM01:2025 Prompt Injection</b> and <b>Top 10 for LLM Applications 2025.</b> genai.owasp.org. CVE records at cveawg.mitre.org: CVE-2025-32711, -49596, -53773, -54135, -54136 and CVE-2026-21520."),
            ("4", "Reddy and Gujral. <b>EchoLeak: the first real-world zero-click prompt injection exploit.</b> arXiv 2509.10540, 6 September 2025."),
            ("5", "DSIT. <b>AI Adoption Research.</b> Published 28 January 2026; fieldwork spring 2025."),
            ("6", "CSO Online. <b>Copilot and Agentforce fall to form-based prompt injection tricks.</b> 15 April 2026. Reports Capsule Security research; Gartner syndicated copies (itvoice.in, tech.co) cited as [8]."),
            ("7", "Embrace The Red (J. Rehberger). <b>GitHub Copilot remote code execution via prompt injection.</b> embracethered.com, 2025."),
            ("8", "Gartner, 28 April 2026, as syndicated by itvoice.in and tech.co. The original page returned an error and was not read."),
            ("9", "Microsoft MSRC. <b>How Microsoft defends against indirect prompt injection attacks.</b> 29 July 2025. Vendor.")]
    notes = '''<p style="font-size:7.8pt;line-height:1.55">Accurate as of 27 October 2026. Vulnerability finders are credited as each source states; EchoLeak's rests on the CVE record's reference and the Cursor finders were not verified. We did not use GitHub or Asana MCP incidents. March 2026 joint AI supply-chain guidance, authored by Australia's ASD with the UK NCSC among co-sealers, is not agent-specific and is not quoted here. CVSS versions differ across records.</p>'''
    return page(13, sources(refs, notes), section="Sources and method")


def p14():
    return page(14, back("Managed IT, cyber and AI governance<br>for UK businesses.", "Least privilege. Human approval.", keys=("msmw", "mssec", "iso", "aws", "cisco"), visual=aivis.agent_arms(150, 104).replace('width="150mm" height="104mm"', 'width="150mm" height="104mm"')), dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("agents.html", "w", encoding="utf8").write(build())
