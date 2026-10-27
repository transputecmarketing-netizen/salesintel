from kit import *
import aivis
from case import RED, AMBER

TITLE = "The AI You Didn't Buy"
N = 14
page = mk(TITLE, N)


def p1():
    return page(1, cover("UK AI ADOPTION · OCT 2026", ["The AI you"], "didn't buy.", 62,
                         "What UK businesses say they use, what their staff probably use, and the rules in between.",
                         aivis.venn(), title_pt=46, vis_top="52mm", glow='<div class="glow" style="left:20mm;top:30mm;width:170mm;height:150mm;background:radial-gradient(circle,rgba(245,166,35,.14) 0%,rgba(245,166,35,0) 64%)"></div>'), dark=True, folio=False)


def p2():
    cards = [("Source 01", "DSIT AI Adoption Research", "Government, published January 2026. 3,500 businesses with 5 or more staff. Fieldwork February to May 2025."),
             ("Source 02", "Cyber Security Breaches Survey 2025/26", "DSIT and Home Office, 30 April 2026. Fieldwork August to December 2025. New AI questions."),
             ("Source 03", "IBM Cost of a Data Breach 2025, UK", "Vendor-sponsored study of organisations that had breaches. UK sample size not published."),
             ("Source 04", "ICO and the AI Cyber Code", "The regulator's AI guidance (2023, under review) and the Government's voluntary code of practice."),
             ("Source 05", "Microsoft Work Trend Index", "2024 edition, global, vendor-run. Used once, labelled, for the unofficial-tools figure.")]
    cc = ''.join(f'<div class="card"><div class="eyebrow">{a}</div><h3 style="margin:3mm 0 2mm;font-size:11pt">{b}</h3><p style="font-size:8.4pt">{c}</p></div>' for a, b, c in cards)
    body = f'''{head("About this report", "The best data is a year old.<br>We say which year.", "UK government measured AI adoption in spring 2025. Tools and habits have moved since. We use the numbers, date them, and avoid stretching them.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:11mm">{cc}</div>
    <div class="card" style="margin-top:5mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Do not compare</span>
      <p style="font-size:8.6pt;color:var(--slate)">Government's two adoption figures use different size bands, bases and years. They are not a trend, and we never put them side by side as if they were.</p></div>
    <div class="src" style="position:absolute;left:18mm;right:18mm;bottom:15mm">© 2026 Transputec Ltd. Government material is reproduced under the Open Government Licence where applicable.</div>'''
    return page(2, body, section="About")


def p3():
    return page(3, contents([("", "Executive summary", 4), ("01", "What was measured", 5), ("", "Who is using AI", 6), ("", "What they use it for", 7), ("", "The skills brake", 8),
                             ("02", "What was not measured", 9), ("", "Governance in practice", 10), ("03", "Rules that already apply", 11), ("04", "A one-page AI policy", 12), ("", "Sources and method", 13)]), section="Contents")


def p4():
    body = f'''{head("Executive summary", "Adoption is rising.<br>Control is lagging.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:13mm;padding-top:8mm;border-top:.35mm solid var(--navy)">
      {stat("23", "of mid-sized UK businesses used AI in spring 2025; 16% across all businesses", 1, "%")}
      {stat("64", "of mid-sized AI users say limited skills hold back wider rollout", 1, "%")}
      {stat("24", "of businesses using or considering AI have security practices for its risks", 2, "%")}
      {stat("31", "of UK organisations in IBM's study have policies to govern AI use", 3, "%")}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:15mm">
      <div><h3>What the data says</h3>
        <p style="margin-top:3mm">Government's survey found one in six businesses using AI, rising to nearly one in four mid-sized ones, mostly off-the-shelf text tools. Skills, not cost, is the main brake. Its own authors note that it cannot see unofficial use, and a later government survey finds only about a quarter of businesses that use, are adopting or are considering AI have security practices for its risk.<sup class="c">1,2</sup></p></div>
      <div><h3>What it means</h3>
        <p style="margin-top:3mm">The gap that matters is between the AI a business has chosen and the AI its people actually open. The first is a procurement question. The second is a data question, and it is probably the bigger one.</p>
        <p><b style="font-weight:600">Our view:</b> the cheapest first step is not a ban. It is a short approved list, a clear red line on data, and a named owner.</p></div></div>
    <div class="card" style="margin-top:12mm;background:var(--navy);color:#fff;display:flex;gap:7mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan);width:28mm">Dated data</div>
      <div style="font-size:9.4pt;line-height:1.6;color:var(--slate)">The government adoption study was fielded in spring 2025, about 18 months ago. Use the direction, not the decimals.<sup class="c">1</sup></div></div>
    {src("Sources: 1 DSIT AI Adoption Research. 2 Cyber Security Breaches Survey 2025/26. 3 IBM Cost of a Data Breach 2025, UK edition (vendor-sponsored).", "21mm")}'''
    return page(4, body, section="Executive summary")


def p5():
    return page(5, opener("Chapter 01 · What was measured", "16%", 130,
                          "of UK businesses with five or more staff were using at least one AI technology in spring 2025. A further 5% planned to.<sup class='c'>1</sup>",
                          "One in six.<br>As far as anyone<br>was told."), dark=True, section="01 · What was measured")


def p6():
    def bar(l, v, hot=False):
        return f'<div style="display:flex;align-items:center;gap:4mm;margin-bottom:3mm"><span class="mono" style="width:22mm;font-size:7pt;color:var(--mid)">{l}</span><div style="height:7mm;width:{v*2.4:.0f}mm;border-radius:1.6mm;background:{"var(--grad)" if hot else "#C9D6EE"}"></div><span style="font-weight:600;font-size:10.6pt">{v}%</span></div>'
    body = f'''{head("01 · What was measured", "Bigger firms lead.<br>Mid-sized firms follow.", "Share of businesses currently using at least one AI technology, by size, from the government's spring 2025 study.")}
    <div style="margin-top:11mm">{bar("Micro", 14)}{bar("All businesses", 16)}{bar("Mid-sized", 23, True)}{bar("Large", 36)}</div>
    <p class="src" style="margin-top:2mm">DSIT AI Adoption Research. Micro is 5 to 9 staff, mid-sized 50 to 249, large 250 or more. Base: 3,500 businesses with 5 or more staff.</p>
    <div class="hair" style="margin:9mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("43%", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">in information and communication, the highest sector. Business services 23%, finance and real estate 21%.<sup class="c">1</sup></p></div>
      <div>{G("20%", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of London businesses were using AI.<sup class="c">1</sup></p></div>
      <div>{G("21%", 28, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of businesses reported adopting some AI tools in a later survey; 39% of medium and 45% of large. Different base and year.<sup class="c">2</sup></p></div></div>
    {src("Sources: 1 DSIT AI Adoption Research (fieldwork Feb to May 2025). 2 Cyber Security Breaches Survey 2025/26 (Aug to Dec 2025; businesses with 1 or more staff). Not comparable.")}'''
    return page(6, body, section="01 · What was measured")


def p7():
    body = f'''{head("01 · What was measured", "Mostly off-the-shelf,<br>mostly text.", "Among businesses that use AI, the tools are the ones anyone can open in a browser.")}
    <div style="display:grid;grid-template-columns:60mm 1fr;gap:12mm;margin-top:11mm;align-items:center">
      <div>{dots(10,10,85,pitch=5.6,d=3.6,order="row",unlit="#E1E7F1",halo=False)}<div class="mono" style="font-size:6pt;letter-spacing:.1em;color:var(--mid);margin-top:3mm;text-transform:uppercase">85 in 100 AI users</div></div>
      <div>{G("85%", 54, ls=-0.05)}<p style="font-size:9.4pt;margin-top:4mm">of AI-using businesses use natural-language processing or text generation. The authors link this to the availability of off-the-shelf generative tools.<sup class="c">1</sup></p></div></div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G("7%", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of AI users use agentic AI, the kind that takes actions on its own.<sup class="c">1</sup></p></div>
      <div>{G("30%", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of staff use AI at the average adopting business. 77% say fewer than half do.<sup class="c">1</sup></p></div>
      <div>{G("84%", 30, ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">of adopters report at least some checking of AI outputs. 77% for medium firms.<sup class="c">1</sup></p></div></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.2pt">Text tools are the easiest to start and the easiest to leak through: a pasted contract, a customer list, a draft board paper. The risk is in what people type, not in the tool.</p></div>
    {src("Source: 1 DSIT AI Adoption Research, base: 700 businesses using AI. Fieldwork Feb to May 2025.")}'''
    return page(7, body, section="01 · What was measured")


def p8():
    def unit2(n, lab):
        return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
                f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">1</sup></div></div>')
    body = f'''{head("01 · What was measured", "Skills are the brake,<br>not cost.", "When government asked what holds businesses back, the answers were about people.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:12mm">
      {unit2(60, "of all businesses cite limited AI skills, expertise and knowledge")}{unit2(54, "of AI users say limited skills hinder wider rollout")}
      {unit2(64, "of mid-sized AI users say the same")}{unit2(54, "of AI users feel ready to scale (13% completely)")}</div>
    <div class="src" style="margin-top:6mm">Base: all businesses (60%); businesses that use AI (54%, 64%, 54%).</div>
    <div class="hair" style="margin:10mm 0 8mm"></div>
    <div class="card" style="display:flex;gap:7mm;align-items:flex-start"><span class="tag" style="color:var(--blue);flex:none">Read carefully</span>
      <p style="font-size:8.6pt">Government also found that of those who cited each barrier, 80% rated ethical concerns as significant, 76% cost and 72% unclear regulation. Those are ratings among people who raised the barrier, not shares of all firms.<sup class="c">1</sup></p></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.4pt">Skills include knowing what not to paste. A short, practical briefing on data does more for safety than a long policy few have read, and it is the cheapest part of an AI programme.</p></div>
    {src("Source: 1 DSIT AI Adoption Research. Fieldwork Feb to May 2025.", "20mm")}'''
    return page(8, body, section="01 · What was measured")


def p9():
    body = bg_dark('<div class="glow" style="right:-10mm;top:40mm;width:160mm;height:160mm;background:radial-gradient(circle,rgba(245,166,35,.14) 0%,rgba(245,166,35,0) 64%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 02 · What was not measured</div>
    <h2 style="margin-top:5mm;font-size:34pt;max-width:150mm">The survey cannot<br>see the other half.</h2>
    <div class="card" style="margin-top:12mm;padding:8mm"><div class="eyebrow">In the researchers' own words</div>
      <p class="pull" style="font-size:15pt;color:#fff;margin-top:4mm;font-weight:300;line-height:1.4">“A limitation of this approach is that the survey will not provide insights into shadow AI adoption.”<sup class="c">1</sup></p></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:12mm">
      <div>{G("78%", 56, ls=-0.05)}<p style="font-size:9.2pt;margin-top:3mm;color:var(--slate)">of AI users bring their own AI tools to work, in Microsoft's 2024 global survey: 80% at small and mid-sized companies. Vendor-run, global, two years old.<sup class="c">4</sup></p></div>
      <div><div class="eyebrow">Why we show it</div><p style="font-size:9.2pt;margin-top:3mm">It is the only large survey figure on unofficial use we could read at source. It is not about the UK and not about 2026, so treat it as a sign of direction, not a measurement of your business.</p></div></div>
    <div class="card" style="margin-top:12mm"><div class="eyebrow">What government survey respondents were</div><p style="font-size:9pt;margin-top:3mm">The person with oversight of technology. Their answers describe tools the business has chosen, not everything its people open in a browser tab.<sup class="c">1</sup></p></div>'''
    return page(9, body, dark=True, section="02 · What was not measured")


def p10():
    def unit3(n, lab, s):
        return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
                f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">{s}</sup></div></div>')
    body = f'''{head("02 · What was not measured", "Rules and controls<br>trail the tools.", "Two sources, two bases. They point the same way and should not be added together.")}
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:12mm">
      {unit3(24, "of businesses using or considering AI have security practices for its risks", 2)}{unit3(38, "more plan to within 12 months; 31% have no plans", 2)}
      {unit3(31, "of UK organisations in IBM's study have AI governance policies", 3)}{unit3(37, "have AI access controls in place; 63% do not", 3)}</div>
    <div class="src" style="margin-top:6mm">Columns 1–2: businesses using, adopting or considering AI (CSBS 2025/26). Columns 3–4: UK respondents to IBM's study of breached organisations.</div>
    <div class="hair" style="margin:9mm 0 7mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm">
      <div>{G("£498k", 30, ls=-0.045)}<p style="font-size:9pt;margin-top:3mm">extra average breach cost for organisations with high levels of unsanctioned AI use, among IBM's global findings. A correlation, not proof of cause.<sup class="c">3</sup></p></div>
      <div><div class="eyebrow">Government's interviews</div><p style="font-size:9pt;margin-top:3mm">“Very few businesses said they had any internal guidelines or specific policies around using AI responsibly or ethically.” Larger businesses were more likely to. This is from 100 qualitative interviews, so there is no percentage.<sup class="c">1</sup></p></div></div>
    {src("Sources: 1 DSIT. 2 CSBS 2025/26. 3 IBM UK release, 30 July 2025 (vendor-sponsored; UK sample size not published).", "20mm")}'''
    return page(10, body, section="02 · What was not measured")


def p11():
    pr = ["Raise awareness of AI security threats and risks", "Evaluate the threats and manage the risks to your AI system", "Enable human responsibility for AI systems", "Identify, track and protect your assets",
          "Secure your supply chain", "Monitor your system's behaviour"]
    pl = ''.join(f'<li style="font-size:9pt;line-height:1.5;padding:2.2mm 0;border-top:.25mm solid var(--line)">{p}</li>' for p in pr)
    body = f'''{head("03 · Rules that already apply", "Two sources of guidance.<br>Neither is new.")}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:11mm">
      <div class="card" style="padding:7mm"><div class="eyebrow">ICO · data protection</div>
        <p style="font-size:9pt;margin-top:3mm">Where AI processes personal data, you need a lawful basis chosen before you start. The ICO says that in the vast majority of cases AI use is likely to be high risk and so triggers a data protection impact assessment. Where you decide it is not, document how you decided.<sup class="c">5</sup></p>
        <p style="font-size:8pt;color:var(--mid);margin-top:3mm">Core guidance last updated March 2023 and under review because of the Data (Use and Access) Act. This does not mean every AI tool needs an assessment: it applies where personal data is processed.</p></div>
      <div class="card" style="padding:7mm"><div class="eyebrow">Government · AI cyber code</div>
        <p style="font-size:9pt;margin-top:3mm">A voluntary code of 13 principles for the cyber security of AI, covering organisations that deploy AI as well as those that build it. Six that matter most to a business buying tools:<sup class="c">6</sup></p>
        <ul style="list-style:none;margin-top:3mm">{pl}</ul></div></div>
    <div class="card" style="margin-top:6mm;display:flex;gap:7mm;align-items:flex-start;background:var(--navy);color:#fff"><span class="tag" style="color:var(--cyan);flex:none">Not law</span>
      <p style="font-size:8.6pt;color:var(--slate)">The code is voluntary. We did not verify the status of any related international standard or of any UK AI bill, and we make no claim about either.</p></div>
    {src("Sources: 5 ICO guidance on AI and data protection (accountability and lawfulness). 6 Code of Practice for the Cyber Security of AI, GOV.UK (January 2025).", "20mm")}'''
    return page(11, body, section="03 · Rules that already apply")


def p12():
    rows = [("An approved list", "Name the AI tools staff may use for work, and how to request another."), ("A red line", "Say, in one sentence, what must never be pasted in: customer data, contracts, credentials, source code."),
            ("An owner", "One person with authority to approve, review and say no."), ("A check on personal data", "Where a tool touches personal data, decide the lawful basis and whether an impact assessment is needed."),
            ("A briefing", "Ten minutes, once a quarter, with real examples. Not an annual course.")]
    cc = ''.join(f'''<div style="display:grid;grid-template-columns:54mm 1fr;gap:6mm;padding:5.6mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);align-items:center">
      <div style="font-weight:600;font-size:13.4pt;letter-spacing:-.03em">{a}</div><div style="font-size:9.6pt;line-height:1.5;color:var(--slate)">{b}</div></div>''' for a, b in rows)
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">04 · A one-page AI policy</div>
    <h2 style="margin-top:5mm;max-width:150mm">Five lines.<br>One page.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">A starting point, not a legal document. It maps to play 04 of The Resilience Playbook.</p>
    <div style="margin-top:11mm;border-top:.35mm solid rgba(255,255,255,.3)">{cc}</div>
    <div class="card" style="margin-top:9mm;display:flex;gap:7mm;align-items:center"><span class="tag" style="color:var(--cyan);flex:none">Illustrative</span>
      <p style="font-size:8.6pt">Our suggestion, built from the sources in this report. Take legal advice before relying on it for personal data or contracts.</p></div>'''
    return page(12, body, dark=True, section="04 · A one-page AI policy")


def p13():
    refs = [("1", "DSIT. <b>AI Adoption Research.</b> Published 28 January 2026; research by IFF Research and Technopolis Group. gov.uk/government/publications/ai-adoption-research/ai-adoption-research. 3,500 telephone interviews, 12 February to 2 May 2025, plus 100 qualitative interviews."),
            ("2", "DSIT and Home Office. <b>Cyber Security Breaches Survey 2025/26.</b> Official statistics, 30 April 2026. Fieldwork August to December 2025; 2,112 businesses. AI section 3.11."),
            ("3", "IBM. <b>UK sees drop in breach costs as AI speeds detection.</b> 30 July 2025. uk.newsroom.ibm.com/2025-cost-of-data-breach-UK. Sponsored by IBM; run by the Ponemon Institute."),
            ("4", "Microsoft and LinkedIn. <b>Work Trend Index 2024: AI at work is here.</b> 8 May 2024. 31,000 knowledge workers in 31 markets; vendor-run."),
            ("5", "ICO. <b>Guidance on AI and data protection</b>: accountability and governance; lawfulness. ico.org.uk. Core guidance updated 15 March 2023; under review."),
            ("6", "GOV.UK. <b>Code of Practice for the Cyber Security of AI.</b> Published 31 January 2025. Voluntary.")]
    notes = '''<p style="font-size:7.8pt;line-height:1.55">Accurate as of 27 October 2026. Government's two adoption figures differ in size bands and years and are not a trend. The government study cannot measure shadow AI. IBM's figures cover organisations that had breaches; its £498,000 finding is listed under global results and is a correlation. We did not read a 2025 or 2026 Microsoft Work Trend Index at source. Any UK AI legislation or standards status was not verified and is not claimed.</p>'''
    return page(13, sources(refs, notes), section="Sources and method")


def p14():
    return page(14, back("Microsoft Copilot consulting and managed IT<br>for UK businesses.", "Approved. In use. Aligned.", keys=("msmw", "mssec", "iso", "aws", "cisco"), visual=aivis.venn(110, 76).replace('width="110mm" height="76mm"', 'width="110mm" height="76mm"')), dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'


if __name__ == "__main__":
    open("ukai.html", "w", encoding="utf8").write(build())
