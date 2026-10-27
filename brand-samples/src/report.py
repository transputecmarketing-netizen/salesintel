from common import FONTS, TOKENS, DEFS, logo, rings, gt as G, gt_slice, dots, ghost, avatar, badge_wall, gov_tile

TITLE = "The Resilience Gap"

CSS = FONTS + TOKENS + """
@page{size:210mm 297mm;margin:0}
.pg{width:210mm;height:297mm;padding:20mm 18mm 22mm}
.folio{position:absolute;left:18mm;right:18mm;bottom:10mm;display:flex;justify-content:space-between;align-items:center;
  font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid)}
.dark .folio{color:rgba(255,255,255,.5)}
.folio b{color:var(--navy);font-weight:500}.dark .folio b{color:#fff}
.spine{position:absolute;left:6mm;top:50%;writing-mode:vertical-rl;transform:translateY(-50%) rotate(180deg);font-family:'JetBrains Mono',monospace;font-size:5.6pt;letter-spacing:.24em;text-transform:uppercase;color:#B7C1D3;white-space:nowrap}
.dark .spine{color:rgba(255,255,255,.3)}
.run{position:absolute;left:18mm;right:18mm;top:10mm;display:flex;justify-content:space-between;align-items:center}
.run span{font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mid)}
h2{font-weight:600;font-size:29pt;line-height:1.06;letter-spacing:-.035em}
h3{font-weight:600;font-size:12.5pt;letter-spacing:-.015em;line-height:1.25}
.lede{font-size:12.4pt;font-weight:300;line-height:1.58;color:var(--body);letter-spacing:-.005em}
.dark .lede{color:var(--slate)}
p{font-size:9.4pt;line-height:1.72;color:var(--body);font-weight:400}
.dark p{color:var(--slate)}
p+p{margin-top:3.2mm}
.big{font-weight:700;letter-spacing:-.045em;line-height:.9}
.glow{position:absolute;border-radius:50%;filter:blur(0)}
.src{font-family:'JetBrains Mono',monospace;font-size:6.2pt;letter-spacing:.04em;color:var(--mid);line-height:1.6}
.pull{font-weight:300;font-size:17pt;line-height:1.35;letter-spacing:-.02em}
.onnavy p{color:var(--slate)}
.kv{display:flex;justify-content:space-between;align-items:baseline;padding:2.6mm 0;border-bottom:.25mm solid var(--line);font-size:9pt}
.kv:last-child{border-bottom:0}.kv span:last-child{font-weight:600}
"""


def page(n, body, dark=False, section="", folio=True, cls=""):
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    gh = ""
    if folio and section[:2].isdigit() and not dark:
        gh = f'<div style="position:absolute;right:16mm;top:20mm;pointer-events:none">{ghost(section[:2], 40)}</div>'
    run = f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>' if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / 15</span></div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""} {cls}">{gh}{spine}{run}{body}{fol}</section>'


def bg_dark(extra=""):
    return ('<div class="glow" style="right:-70mm;top:-40mm;width:210mm;height:210mm;'
            'background:radial-gradient(circle,rgba(21,93,252,.34) 0%,rgba(21,93,252,0) 62%)"></div>'
            '<div class="glow" style="left:-60mm;bottom:-70mm;width:190mm;height:190mm;'
            'background:radial-gradient(circle,rgba(0,184,219,.20) 0%,rgba(0,184,219,0) 62%)"></div>' + extra)


def stat(num, label, src, unit=""):
    return f'''<div>{G([(num,1.0)]+([(unit,0.5)] if unit else []),40)}
    <div style="font-size:9pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{label}<sup class="c">{src}</sup></div></div>'''


# ---------------------------------------------------------------- pages
def p1():
    body = bg_dark() + f'''
    <div style="position:absolute;right:-48mm;top:-14mm">{rings(196)}</div>
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">
      {logo("white","5.2mm")}<span></span></div>
    <div style="position:absolute;left:18mm;bottom:26mm;right:18mm">
      <div class="eyebrow" style="margin-bottom:8mm">UK IT resilience report · October 2026</div>
      <div style="font-weight:600;font-size:66pt;line-height:.98;letter-spacing:-.055em">The<br>Resilience</div><div style="margin-top:1mm">{G('Gap.',66,weight=600,ls=-0.055)}</div>
      <div class="lede" style="margin-top:9mm;max-width:104mm;font-size:13pt">Attacks have levelled off. Readiness has not caught up. What four public sources tell UK leaders about breach, cost and preparedness.</div>
      <div class="hair" style="margin:12mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div>
    </div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    body = f'''
    <div class="eyebrow" style="margin-top:14mm">About this report</div>
    <h2 style="margin-top:5mm;max-width:140mm">Four sources.<br>Every figure cited.</h2>
    <p class="lede" style="margin-top:8mm;max-width:130mm">We did not run a survey for this report. We read the best public evidence available, put it side by side, and said plainly where a number comes from.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:12mm">
      <div class="card"><div class="eyebrow">Source 01</div><h3 style="margin:3mm 0 2mm">Cyber Security Breaches Survey 2025/26</h3><p style="font-size:8.6pt">UK Government (DSIT and the Home Office). The annual benchmark of how many businesses are attacked and how they respond. Published 30 April 2026.</p></div>
      <div class="card"><div class="eyebrow">Source 02</div><h3 style="margin:3mm 0 2mm">Cost of a Data Breach Report 2025</h3><p style="font-size:8.6pt">IBM, with the Ponemon Institute. UK edition. Real breaches at 600 organisations, March 2024 to February 2025.</p></div>
      <div class="card"><div class="eyebrow">Source 03</div><h3 style="margin:3mm 0 2mm">NCSC Annual Review 2025</h3><p style="font-size:8.6pt">The National Cyber Security Centre's account of the incidents it handled in the twelve months to August 2025.</p></div>
      <div class="card"><div class="eyebrow">Source 04</div><h3 style="margin:3mm 0 2mm">Cyber Monitoring Centre</h3><p style="font-size:8.6pt">Independent assessment of the Jaguar Land Rover incident and its cost to the UK economy, October 2025.</p></div>
    </div>
    <div class="hair" style="margin:12mm 0 6mm"></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm">
      <div class="eyebrow">How to read it</div>
      <div><p style="font-size:8.6pt">Each source samples a different group of organisations over a different period, so we never add figures from separate sources together. Superscript numbers refer to the sources on page 14. Where we give a view rather than a fact, it is marked <b style="font-weight:600">Our view</b>.</p>
      <p style="font-size:8.6pt">This is a design sample. Layout, voice and structure are final; the Transputec Resilience Model on page 11 is illustrative.</p></div>
    </div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:22mm" class="src">© 2026 Transputec Ltd. All rights reserved. Third-party figures remain the property of their publishers and are quoted with attribution.</div>'''
    return page(2, body, section="About")


def p3():
    rows = [("", "Foreword", 4), ("", "Executive summary", 5),
            ("01", "The shape of the threat", 6), ("02", "What a breach costs", 8),
            ("03", "When it becomes national news", 9), ("04", "The preparedness gap", 10),
            ("05", "A model for resilience", 11), ("06", "Where to start", 12),
            ("07", "What good looks like", 13), ("", "Sources and method", 14)]
    li = ''.join(f'''<div style="display:flex;align-items:baseline;padding:4.6mm 0;border-bottom:.25mm solid var(--line)">
      <span class="mono" style="width:14mm;font-size:8pt;color:var(--blue)">{a}</span>
      <span style="flex:1;font-size:15.5pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span>
      <span class="mono" style="font-size:8pt;color:var(--mid)">{c:02d}</span></div>''' for a, b, c in rows)
    body = f'''<div class="eyebrow" style="margin-top:14mm">Contents</div>
    <h2 style="margin-top:5mm">Inside.</h2>
    <div style="margin-top:12mm;border-top:.25mm solid var(--navy)">{li}</div>'''
    return page(3, body, section="Contents")


def p4():
    body = f'''<div class="eyebrow" style="margin-top:14mm">Foreword</div>
    <div class="pull" style="margin-top:8mm;max-width:150mm;font-size:22pt;font-weight:300;line-height:1.28">Most IT leaders are not short of warnings. They are short of time, and of a clear view of what comes first.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:22mm">
      <div><p>This report is our attempt at that view. We went back to the public evidence — the government's annual survey, the National Cyber Security Centre, IBM's research on breach costs and the independent analysis of last year's biggest UK incidents — and set it side by side.</p>
      <p>Two things stand out. The first is that the number of businesses being hit has stopped climbing. It has held at 43% for two years running. The second is harder to read: preparedness has barely moved. Three in four businesses still have no formal plan for the day something goes wrong.</p></div>
      <div><p>We work with organisations that run on very little spare attention. What they ask of us is rarely another tool. They want a calmer operation, a cost they can predict, and a straight answer when something breaks.</p>
      <p>We hope this report makes the case for that kind of resilience on the evidence rather than on fear. Read it for the figures. Use the playbook that accompanies it for the next ninety days.</p></div>
    </div>
    <div class="hair" style="margin:20mm 0 7mm"></div>
    <div style="display:flex;align-items:center;gap:5mm"><div style="width:11mm;height:11mm;border-radius:50%;background:var(--grad-d)"></div>
      <div><div style="font-weight:600;font-size:10pt">The Transputec team</div><div class="mono" style="font-size:6.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid);margin-top:1mm">London · October 2026</div></div></div>'''
    return page(4, body, section="Foreword")


def p5():
    body = f'''<div class="eyebrow" style="margin-top:14mm">Executive summary</div>
    <h2 style="margin-top:5mm;max-width:150mm">The threat has levelled off.<br>The gap has not closed.</h2>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:15mm;padding-top:8mm;border-top:.25mm solid var(--navy)">
      {stat("43","of UK businesses reported a breach or attack in the past year","1","%")}
      {stat("£3.78","m average UK breach cost without extensive security automation, against £3.11m with it","2")}
      {stat("204","nationally significant incidents handled by the NCSC, up from 89","3")}
      {stat("25","of businesses have a formal incident response plan","1","%")}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:16mm">
      <div><h3>What the evidence says</h3>
        <p style="margin-top:3mm">Attack volume is flat, but the incidents that land are larger. The NCSC handled more than twice as many nationally significant incidents as the year before, and one manufacturing outage cost the UK economy an estimated £1.9 billion.<sup class="c">3,4</sup></p>
        <p>Cost follows speed. UK organisations that used security automation widely found and contained breaches 42 days sooner and saved about £670,000 per breach.<sup class="c">2</sup></p></div>
      <div><h3>What it means</h3>
        <p style="margin-top:3mm">The gap is no longer awareness. It is practice: rehearsed recovery, a view of supplier risk, and rules for the AI tools staff already use. Each is cheaper to build before an incident than during one.</p>
        <p><b style="font-weight:600">Our view:</b> resilience is an operating discipline with a budget line, not a project with an end date.</p></div>
    </div>
    <div class="card" style="margin-top:12mm;display:flex;align-items:center;gap:6mm;background:var(--navy);color:#fff">
      <div class="eyebrow" style="color:var(--cyan);width:30mm">Five moves</div>
      <div style="font-size:9.6pt;line-height:1.6;color:var(--slate)">Know what matters · Close the front door · Rehearse recovery · Govern AI and suppliers · Report to the board in numbers</div></div>'''
    return page(5, body, section="Executive summary")


def p6():
    body = bg_dark('<div style="position:absolute;right:-62mm;top:132mm;opacity:.9">' + rings(170) + '</div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01</div>
    <div style="position:absolute;left:18mm;top:70mm">
      {G('43%',150,ls=-0.07)}
      <div class="lede" style="margin-top:8mm;max-width:96mm;font-size:15pt;color:#fff;font-weight:300">of UK businesses reported a cyber breach or attack in the last twelve months. That is about 612,000 organisations.<sup class="c">1</sup></div></div>
    <div style="position:absolute;left:18mm;bottom:30mm;right:18mm">
      <h2 style="font-size:36pt">The shape<br>of the threat.</h2></div>'''
    return page(6, body, dark=True, section="01 · The shape of the threat")


def size_chart():
    data = [("Micro", 42), ("Small", 46), ("Medium", 65), ("Large", 69)]
    W, H, base, top = 108, 88, 76, 6
    sc = (base - top) / 80
    out = [f'<svg viewBox="0 0 {W} {H}" width="108mm" height="88mm" style="display:block;overflow:visible">']
    for g in (0, 25, 50, 75):
        y = base - g * sc
        out.append(f'<line x1="0" x2="{W}" y1="{y}" y2="{y}" stroke="#E3E8F0" stroke-width=".25"/>'
                   f'<text x="0" y="{y-1.2}" font-family="JetBrains Mono" font-size="2.6" fill="#6B7A90">{g}%</text>')
    bw, gap = 17, 8.4
    for i, (k, v) in enumerate(data):
        x = 8 + i * (bw + gap)
        h = v * sc
        fill = 'url(#gv)' if v > 60 else '#C9D6EE'
        out.append(f'<rect x="{x}" y="{base-h}" width="{bw}" height="{h}" rx="2" fill="{fill}"/>'
                   f'<text x="{x+bw/2}" y="{base-h-2.4}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="5.4" fill="#0F172B">{v}%</text>'
                   f'<text x="{x+bw/2}" y="{base+6}" text-anchor="middle" font-family="JetBrains Mono" font-size="2.7" letter-spacing=".3" fill="#6B7A90">{k.upper()}</text>')
    out.append('</svg>')
    return ''.join(out)


def trend_chart():
    pts = [("2023/24", 50), ("2024/25", 43), ("2025/26", 43)]
    W, H = 56, 38
    xs = [6, 28, 50]
    ys = [H - 8 - (v - 30) * (H - 18) / 25 for _, v in pts]
    path = ' '.join(f'{"M" if i==0 else "L"}{x},{y:.1f}' for i, (x, y) in enumerate(zip(xs, ys)))
    out = [f'<svg viewBox="0 0 {W} {H}" width="56mm" height="38mm" style="display:block;overflow:visible">',
           f'<path d="{path}" fill="none" stroke="url(#gh)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>']
    for (lab, v), x, y in zip(pts, xs, ys):
        out.append(f'<circle cx="{x}" cy="{y:.1f}" r="1.7" fill="#fff" stroke="#155DFC" stroke-width=".8"/>'
                   f'<text x="{x}" y="{y-3.2:.1f}" text-anchor="middle" font-family="Poppins" font-weight="600" font-size="3.6" fill="#0F172B">{v}%</text>'
                   f'<text x="{x}" y="{H-1}" text-anchor="middle" font-family="JetBrains Mono" font-size="2.4" fill="#6B7A90">{lab}</text>')
    out.append('</svg>')
    return ''.join(out)


def p7():
    body = f'''<div class="eyebrow" style="margin-top:14mm">01 · The shape of the threat</div>
    <h2 style="margin-top:5mm;max-width:150mm">Size changes the odds.<br>Nobody is exempt.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">Two in three medium-sized and large businesses reported a breach or attack. Among micro businesses the figure was still above four in ten.<sup class="c">1</sup></p>
    <div style="display:grid;grid-template-columns:108mm 1fr;gap:10mm;margin-top:11mm">
      <div><div class="eyebrow" style="color:var(--mid);margin-bottom:5mm">Share reporting a breach or attack, by business size</div>{size_chart()}</div>
      <div><div class="eyebrow" style="color:var(--mid);margin-bottom:5mm">All businesses, over time</div>{trend_chart()}
        <p style="font-size:8.4pt;margin-top:5mm">Down from half of businesses in 2023/24, then flat for two years.<sup class="c">1</sup></p></div>
    </div>
    <div class="hair" style="margin:14mm 0 10mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G('38%',28,ls=-0.045)}<h3 style="margin:3mm 0 1.5mm;font-size:10.5pt">Phishing</h3><p style="font-size:8.6pt">of businesses faced at least one phishing attack. It remains the most common type, and the one most often named as the most disruptive.<sup class="c">1</sup></p></div>
      <div>{G('1%',28,ls=-0.045)}<h3 style="margin:3mm 0 1.5mm;font-size:10.5pt">Ransomware</h3><p style="font-size:8.6pt">of businesses reported it, down from 3% in each of the two previous years. Reports are low, but the impact when it lands is not.<sup class="c">1</sup></p></div>
      <div>{G('5%',28,ls=-0.045)}<h3 style="margin:3mm 0 1.5mm;font-size:10.5pt">Lost revenue</h3><p style="font-size:8.6pt">of businesses said a breach cost them revenue or share value, up from 2% the year before.<sup class="c">1</sup></p></div>
    </div>
    <div class="src" style="position:absolute;left:18mm;bottom:20mm">Source: DSIT and Home Office, Cyber Security Breaches Survey 2025/26.</div>'''
    return page(7, body, section="01 · The shape of the threat")


def pair_bar(label, a, b, maxv, fmt, unit=""):
    wa, wb = a / maxv * 74, b / maxv * 74
    return f'''<div style="margin-bottom:9mm"><div style="font-size:8.6pt;font-weight:500;margin-bottom:2.4mm">{label}</div>
    <div style="display:flex;align-items:center;gap:3mm;margin-bottom:1.6mm"><div style="height:5.2mm;width:{wa}%;border-radius:1.4mm;background:var(--grad)"></div><span class="mono" style="font-size:7.6pt;font-weight:500;white-space:nowrap">{fmt(a)}{unit}</span></div>
    <div style="display:flex;align-items:center;gap:3mm"><div style="height:5.2mm;width:{wb}%;border-radius:1.4mm;background:#C9D6EE"></div><span class="mono" style="font-size:7.6pt;color:var(--mid);white-space:nowrap">{fmt(b)}{unit}</span></div></div>'''


def p8():
    body = f'''<div class="eyebrow" style="margin-top:14mm">02 · What a breach costs</div>
    <h2 style="margin-top:5mm;max-width:150mm">Speed is the cheapest<br>control there is.</h2>
    <p class="lede" style="margin-top:7mm;max-width:142mm">UK organisations that used security AI and automation across their operations paid £3.11 million per breach. Those that did not paid £3.78 million.<sup class="c">2</sup></p>
    <div style="display:grid;grid-template-columns:1.25fr 1fr;gap:12mm;margin-top:11mm">
      <div>
        <div style="display:flex;gap:5mm;align-items:center;margin-bottom:6mm"><span style="display:inline-block;width:5mm;height:2.4mm;border-radius:1mm;background:var(--grad)"></span><span class="mono" style="font-size:6.8pt;color:var(--mid)">EXTENSIVE SECURITY AUTOMATION</span>
        <span style="display:inline-block;width:5mm;height:2.4mm;border-radius:1mm;background:#C9D6EE;margin-left:3mm"></span><span class="mono" style="font-size:6.8pt;color:var(--mid)">NOT USED</span></div>
        {pair_bar("Average cost per breach (£m)", 3.11, 3.78, 4.2, lambda v: f"£{v:.2f}m")}
        {pair_bar("Days to identify a breach", 148, 168, 190, lambda v: f"{v:.0f}", " d")}
        {pair_bar("Days to contain a breach", 42, 64, 70, lambda v: f"{v:.0f}", " d")}
      </div>
      <div class="card onnavy" style="background:var(--navy);color:#fff">
        <div class="eyebrow" style="color:var(--cyan)">Where UK breaches start</div>
        <div style="margin-top:6mm">
          <div class="kv" style="border-color:rgba(255,255,255,.12);color:var(--slate)"><span>Supplier or supply chain</span><span style="color:#fff">18%</span></div>
          <div class="kv" style="border-color:rgba(255,255,255,.12);color:var(--slate)"><span>Phishing</span><span style="color:#fff">16%</span></div>
          <div class="kv" style="border-color:rgba(255,255,255,.12);color:var(--slate)"><span>Compromised credentials</span><span style="color:#fff">11%</span></div>
        </div>
        <p style="font-size:7.8pt;margin-top:4mm">Most commonly reported causes among UK respondents.<sup class="c">2</sup></p>
      </div>
    </div>
    <div class="hair" style="margin:10mm 0 10mm"></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm">
      <div>{G('£5.74m',24,ls=-0.045)}<p style="font-size:8.6pt;margin-top:2.5mm">average UK breach cost in financial services, the costliest sector.<sup class="c">2</sup></p></div>
      <div>{G('£498k',24,ls=-0.045)}<p style="font-size:8.6pt;margin-top:2.5mm">extra paid by organisations with high levels of unsanctioned AI use, among IBM's global findings.<sup class="c">2</sup></p></div>
      <div>{G('&lt;1 in 3',24,ls=-0.045)}<p style="font-size:8.6pt;margin-top:2.5mm">UK organisations use security automation extensively. The saving is on the table.<sup class="c">2</sup></p></div>
    </div>
    <div class="src" style="position:absolute;left:18mm;bottom:20mm">Source: IBM, Cost of a Data Breach Report 2025, UK edition. 600 organisations worldwide, March 2024 to February 2025.</div>'''
    return page(8, body, section="02 · What a breach costs")


def p9():
    n = [("2023/24", 89), ("2024/25", 204)]
    bars = ''.join(f'''<div style="display:flex;align-items:center;gap:4mm;margin-bottom:3mm">
      <span class="mono" style="width:16mm;font-size:7pt;color:var(--mid)">{k}</span>
      <div style="height:7mm;width:{v/204*72}mm;border-radius:1.6mm;background:{'var(--grad)' if v>100 else '#C9D6EE'}"></div>
      <span style="font-weight:600;font-size:11pt">{v}</span></div>''' for k, v in n)
    scale = ''.join(f'''<div style="flex:1;text-align:center"><div style="height:{6+i*5}mm;border-radius:1.6mm;margin:0 .8mm;
      background:{'var(--grad)' if i==2 else ('rgba(21,93,252,.38)' if i==1 else 'rgba(255,255,255,.12)')};display:flex;align-items:flex-end;justify-content:center;padding-bottom:1.4mm" class="mono"><span style="font-size:6.4pt;color:#fff">{i+1}</span></div></div>''' for i in range(5))
    body = f'''<div class="eyebrow" style="margin-top:14mm">03 · When it becomes national news</div>
    <h2 style="margin-top:5mm;max-width:150mm">Four a week, and one that cost the economy £1.9 billion.</h2>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12mm;margin-top:12mm">
      <div>
        <div class="eyebrow" style="color:var(--mid);margin-bottom:5mm">NCSC · nationally significant incidents</div>{bars}
        <div style="display:flex;gap:6mm;margin-top:7mm">
          <div>{G('429',26,ls=-0.045)}<div style="font-size:8pt;color:var(--mid);margin-top:2mm">incidents handled<sup class="c">3</sup></div></div>
          <div>{G('18',26,ls=-0.045)}<div style="font-size:8pt;color:var(--mid);margin-top:2mm">highly significant, up 50%<sup class="c">3</sup></div></div></div>
        <p style="margin-top:6mm;font-size:8.8pt">Twelve months to August 2025. The NCSC describes this as the third consecutive year of increase in the most serious category.<sup class="c">3</sup></p>
        <div class="card" style="margin-top:8mm;padding:5mm 6mm"><div class="eyebrow" style="color:var(--mid)">Also assessed · CMC Category 2</div>
          <div style="font-size:11pt;font-weight:500;letter-spacing:-.01em;margin-top:3mm;line-height:1.5">Marks &amp; Spencer<br>Co-op<br>Harrods<sup class="c">4</sup></div></div>
      </div>
      <div class="card onnavy" style="background:var(--navy);color:#fff;padding:7mm">
        <div class="eyebrow" style="color:var(--cyan)">Case · Jaguar Land Rover</div>
        <div style="margin-top:6mm">{G('£1.9bn',44,ls=-0.045)}</div>
        <p style="margin-top:6mm;font-size:8.8pt">Estimated cost to the UK economy, the most economically damaging cyber event in the country's history. About 5,000 organisations were affected, most through halted production at JLR and its suppliers.<sup class="c">4</sup></p>
        <div style="margin-top:7mm"><div style="display:flex;align-items:flex-end;height:30mm">{scale}</div>
        <div class="mono" style="font-size:6pt;letter-spacing:.08em;color:rgba(255,255,255,.55);margin-top:2.4mm;display:flex;justify-content:space-between"><span>CMC CATEGORY SCALE</span><span>JLR = 3</span></div></div>
      </div>
    </div>
    <div class="hair" style="margin:20mm 0 8mm"></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div class="eyebrow">Our view</div>
      <p style="font-size:9.4pt">What links the large incidents is not novelty. It is dependence: a handful of systems, suppliers or logins that the business could not run without, and no rehearsed way to run without them.</p></div>
    <div class="src" style="position:absolute;left:18mm;bottom:20mm">Sources: NCSC Annual Review 2025; Cyber Monitoring Centre. The JLR estimate assumes a return to normal by January 2026.</div>'''
    return page(9, body, section="03 · When it becomes national news")


def gauge(pct, label, src, warn=False):
    r, c = 15, 2 * 3.14159 * 15
    d = c * pct / 100
    return f'''<div style="text-align:center"><svg viewBox="0 0 40 40" width="38mm" height="38mm" style="display:block;margin:0 auto">
    <circle cx="20" cy="20" r="{r}" fill="none" stroke="#E3E8F0" stroke-width="2.6"/>
    <circle cx="20" cy="20" r="{r}" fill="none" stroke="url(#gd)" stroke-width="2.6" stroke-linecap="round" stroke-dasharray="{d:.1f} {c:.1f}" transform="rotate(-90 20 20)"/>
    <text x="20" y="22.6" text-anchor="middle" font-family="Poppins" font-weight="700" font-size="8.4" letter-spacing="-.4" fill="#0F172B">{pct}%</text></svg>
    <div style="font-size:8.8pt;line-height:1.45;margin-top:3mm;font-weight:500">{label}<sup class="c">{src}</sup></div></div>'''


def p10():
    body = f'''<div class="eyebrow" style="margin-top:14mm">04 · The preparedness gap</div>
    <h2 style="margin-top:5mm;max-width:150mm">Knowing the risk is not<br>the same as being ready.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">Four numbers describe the gap. None of them is a technology problem.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-top:14mm">
      {gauge(25, "of businesses have a formal incident response plan", 1)}
      {gauge(15, "of businesses review the risk from their immediate suppliers", 1)}
      {gauge(31, "of UK organisations have policies to govern AI use and prevent shadow AI", 2)}
      {gauge(63, "of UK organisations have no AI access controls in place", 2)}
    </div>
    <div class="src" style="margin-top:6mm;text-align:center">Rows 1–2: DSIT, businesses. Rows 3–4: IBM, UK respondents. Different populations; not additive.</div>
    <div class="hair" style="margin:8mm 0 7mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8mm">
      <div><h3>A plan on paper</h3><p style="margin-top:2.5mm;font-size:8.8pt">Having a document is the start. The organisations that recover quickly have run the plan: someone has been woken at 2am, the phone tree has been tried, and the backups have been restored somewhere other than the lab.</p></div>
      <div><h3>Suppliers are the blind spot</h3><p style="margin-top:2.5mm;font-size:8.8pt">Supplier compromise was the most common cause of UK breaches in IBM's data, yet only 15% of businesses review supplier risk.<sup class="c">1,2</sup></p></div>
      <div><h3>AI arrived first, rules second</h3><p style="margin-top:2.5mm;font-size:8.8pt">Staff are already using AI tools. Fewer than a third of UK organisations have rules for it, and IBM's global findings put the extra cost of heavy unsanctioned use at £498,000.<sup class="c">2</sup></p></div>
    </div>
    <div class="card" style="margin-top:7mm;background:var(--navy);color:#fff;display:flex;gap:8mm;align-items:center;padding:5mm 6mm">
      <div class="eyebrow" style="color:var(--cyan);width:24mm">Our view</div>
      <div class="pull" style="font-size:12.5pt;color:#fff">The gap is cheap to close and expensive to discover. It is closed with rehearsal and ownership, not with another purchase.</div></div>'''
    return page(10, body, section="04 · The preparedness gap")


def p11():
    pillars = [("01", "Know", "What matters most", ["Critical systems and data mapped", "Owners named for each", "Dependencies on suppliers listed"], "You cannot protect or restore what you have not listed."),
               ("02", "Protect", "Close the front door", ["Multi-factor sign-in everywhere", "Email filtering and user training", "Devices patched and managed"], "Phishing reached 38% of businesses.¹"),
               ("03", "Detect", "See it early", ["24/7 monitoring of identity and endpoints", "Alerts that people act on", "Defined escalation paths"], "Faster identification cut containment by 42 days.²"),
               ("04", "Recover", "Rehearse, then rely", ["Backups restored on a schedule", "Incident plan exercised twice a year", "Recovery time agreed in the contract"], "Only 25% have a formal plan.¹"),
               ("05", "Govern", "Make it a board topic", ["Supplier risk reviewed yearly", "AI use under written rules", "A one-page scorecard each quarter"], "Supplier compromise led UK causes at 18%.²")]
    cards = ''
    for i, (n, t, s, bl, why) in enumerate(pillars):
        li = ''.join(f'<li style="margin-bottom:1.8mm">{b}</li>' for b in bl)
        why = why.replace("¹", '<sup class="c">1</sup>').replace("²", '<sup class="c">2</sup>')
        cards += f'''<div style="position:relative;padding-left:0">
        <div style="display:flex;align-items:center;gap:3mm"><div style="width:12mm;height:12mm;border-radius:50%;background:var(--grad-d);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:600;font-size:9pt">{n}</div>
        <div style="height:.4mm;flex:1;background:{'linear-gradient(90deg,#155DFC,#E3E8F0)' if i<4 else 'transparent'}"></div></div>
        <h3 style="margin-top:5mm;font-size:15pt;letter-spacing:-.03em">{t}</h3>
        <div class="mono" style="font-size:6.4pt;letter-spacing:.1em;text-transform:uppercase;color:var(--mid);margin:1.2mm 0 4mm">{s}</div>
        <ul style="list-style:none;font-size:8.4pt;line-height:1.55;color:var(--body)">{li}</ul>
        <div style="margin-top:4mm;padding-top:3mm;border-top:.25mm solid var(--line);font-size:7.4pt;line-height:1.5;color:var(--mid)">{why}</div></div>'''
    body = f'''<div class="eyebrow" style="margin-top:14mm">05 · A model for resilience</div>
    <h2 style="margin-top:5mm;max-width:150mm">Five disciplines.<br>One operating rhythm.</h2>
    <p class="lede" style="margin-top:7mm;max-width:142mm">The Transputec Resilience Model organises the evidence into five things an organisation does continuously. Each one answers a gap on the previous pages.</p>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:4.5mm;margin-top:20mm">{cards}</div>
    <div class="card" style="margin-top:26mm;display:flex;gap:8mm;align-items:center">
      <span class="tag" style="color:var(--blue)">Illustrative</span>
      <p style="font-size:8.6pt">The model is Transputec's own framing, built from the sources in this report. It is a starting structure, not a certification or a standard.</p></div>'''
    return page(11, body, section="05 · A model for resilience")


def p12():
    stages = [("A", "Reactive", "We fix what breaks.", ["No written incident plan", "Backups exist, restores untested", "Sign-in protection is patchy"], 25),
              ("B", "Managed", "Someone owns it.", ["Named owner for IT risk", "MFA across the business", "Monitoring during office hours"], 50),
              ("C", "Resilient", "We have practised.", ["Plan exercised twice a year", "Backups restored on schedule", "24/7 monitoring and response"], 75),
              ("D", "Assured", "We can show it.", ["Supplier risk reviewed yearly", "AI use under written rules", "Quarterly board scorecard"], 100)]
    cols = ''.join(f'''<div class="card" style="padding:8mm 5mm 9mm;{'background:var(--navy);color:#fff' if i==3 else ''}">
      <div class="mono" style="font-size:8pt;color:{'var(--cyan)' if i==3 else 'var(--blue)'}">{a}</div>
      <h3 style="margin-top:6mm;font-size:15pt;letter-spacing:-.03em">{t}</h3>
      <div style="font-size:8.4pt;font-weight:300;margin-top:1.5mm;color:{'var(--slate)' if i==3 else 'var(--body)'}">{s}</div>
      <div class="hair" style="margin:5mm 0 4mm;{'border-color:rgba(255,255,255,.16)' if i==3 else ''}"></div>
      <ul style="list-style:none;font-size:8pt;line-height:1.5;color:{'var(--slate)' if i==3 else 'var(--body)'}">{''.join(f'<li style="margin-bottom:2.2mm;padding-left:4mm;position:relative"><span style="position:absolute;left:0;top:1.8mm;width:1.6mm;height:1.6mm;border-radius:50%;background:var(--grad-d)"></span>{b}</li>' for b in bl)}</ul></div>''' for i, (a, t, s, bl, p) in enumerate(stages))
    body = f'''<div class="eyebrow" style="margin-top:14mm">06 · Where to start</div>
    <h2 style="margin-top:5mm;max-width:150mm">Find your stage.<br>Take the next one.</h2>
    <p class="lede" style="margin-top:7mm;max-width:142mm">Read down each column and count the statements that are true today without qualification. Your stage is the highest one where you can tick every line.</p>
    <div style="margin-top:12mm;height:1.6mm;border-radius:1mm;background:linear-gradient(90deg,#E3E8F0,#00B8DB,#155DFC)"></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.5mm;margin-top:6mm">{cols}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:14mm"><div class="eyebrow">Moving up</div>
      <div><p style="font-size:9pt">Most of the distance between A and C is rehearsal and ownership, which cost time rather than licences. The step from C to D is where a managed partner earns its fee: evidence, supplier reviews and a board pack someone else prepares.</p>
      <p style="font-size:9pt"><b style="font-weight:600">Our view:</b> do not skip a stage. An assured organisation that has never restored a backup is not assured.</p></div></div>'''
    return page(12, body, section="06 · Where to start")


def p13():
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">07 · What good looks like</div>
    <h2 style="margin-top:5mm;max-width:150mm">Resilience you can<br>put in a contract.</h2>
    <p class="lede" style="margin-top:7mm;max-width:142mm">Transputec delivers managed IT for UK businesses on a fixed monthly fee, with service levels written into the agreement. These are the figures we report publicly.<sup class="c">5</sup></p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:14mm">
      <div class="card">{G('30%+',34,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">lower run-cost than the equivalent in-house team</p></div>
      <div class="card">{G('NPS 70+',28,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">across managed users</p></div>
      <div class="card">{G('78%',34,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">first-call resolution, with rapid phone answer</p></div>
      <div class="card">{G('1,000+',30,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">projects delivered</p></div>
      <div class="card">{G('ISO 27001',26,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">certified delivery from a UK service desk</p></div>
      <div class="card">{G('24/7',34,ls=-0.045)}<p style="font-size:8.6pt;margin-top:3mm">IT support with service commitments under SLA</p></div>
    </div>
    <div style="margin-top:14mm;display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div class="eyebrow">The principle</div>
      <p class="pull" style="font-size:15pt;color:#fff">Predictable IT. Predictable budget. Contracted outcomes.</p></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8mm;margin-top:16mm;padding-top:8mm;border-top:.25mm solid rgba(255,255,255,.14)">
      <div><div class="eyebrow">One contract</div><p style="font-size:8.6pt;margin-top:2.5mm">Cyber, cloud, service desk and AI under one agreement. One bill, one point of accountability.<sup class="c">5</sup></p></div>
      <div><div class="eyebrow">Fixed fee</div><p style="font-size:8.6pt;margin-top:2.5mm">A predictable monthly cost. No per-ticket bills and no surprise charges.<sup class="c">5</sup></p></div>
      <div><div class="eyebrow">Quarterly reviews</div><p style="font-size:8.6pt;margin-top:2.5mm">Business reviews tied to your objectives, reporting outcomes rather than tickets closed.<sup class="c">5</sup></p></div>
    </div>
    <div class="src" style="position:absolute;left:18mm;bottom:20mm;color:rgba(255,255,255,.45)">Source: Transputec, transputec.com, accessed 27 October 2026. Company-reported figures; not independently audited.</div>'''
    return page(13, body, dark=True, section="07 · What good looks like")


def p14():
    refs = [("1", "Department for Science, Innovation and Technology and Home Office. <b>Cyber Security Breaches Survey 2025/26.</b> Official statistics, published 30 April 2026. gov.uk.", "Prevalence by size, phishing, ransomware, revenue loss, incident response plans, supplier review."),
            ("2", "IBM. <b>Cost of a Data Breach Report 2025, UK edition</b> (Ponemon Institute). Press release: uk.newsroom.ibm.com/2025-cost-of-data-breach-UK", "UK breach cost, identification and containment times, causes, shadow AI, AI governance."),
            ("3", "National Cyber Security Centre. <b>NCSC Annual Review 2025.</b> Incident management chapter. ncsc.gov.uk/collection/ncsc-annual-review-2025", "429 incidents, 204 nationally significant, 18 highly significant."),
            ("4", "Cyber Monitoring Centre. <b>Assessment of the Jaguar Land Rover cyber event,</b> 22 October 2025, as reported by Infosecurity Magazine: infosecurity-magazine.com/news/jlr-hack-uk-costliest-ever-19bn/", "£1.9bn estimate, Category 3, c.5,000 organisations; M&amp;S, Co-op, Harrods at Category 2."),
            ("5", "Transputec. <b>transputec.com,</b> accessed 27 October 2026.", "Company-reported service figures.")]
    rows = ''.join(f'''<div style="display:grid;grid-template-columns:12mm 1fr;gap:4mm;padding:5mm 0;border-bottom:.25mm solid var(--line)">
      <div class="mono" style="color:var(--blue);font-size:9pt;font-weight:500">{n}</div>
      <div><div style="font-size:9pt;line-height:1.6;color:var(--navy)">{t}</div><div class="mono" style="font-size:6.6pt;letter-spacing:.04em;color:var(--mid);margin-top:1.6mm">Used for: {u}</div></div></div>''' for n, t, u in refs)
    body = f'''<div class="eyebrow" style="margin-top:14mm">Sources and method</div>
    <h2 style="margin-top:5mm">Where the numbers<br>come from.</h2>
    <div style="margin-top:11mm;border-top:.25mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:10mm"><div class="eyebrow">Method notes</div>
      <div><p style="font-size:8.4pt">Figures are reproduced as published. We have rounded nothing except where a source itself rounds. The DSIT survey reports what organisations identified and chose to disclose, so true prevalence is likely higher. IBM's UK figures come from a subset of its global sample and are indicative. The JLR estimate depends on assumptions about recovery timing that the CMC states in its assessment.</p>
      <p style="font-size:8.4pt">Cross-source comparisons are avoided by design. We have not modelled or extrapolated any figure.</p></div></div>'''
    return page(14, body, section="Sources and method")


def p15():
    body = bg_dark('<div style="position:absolute;left:50%;top:48%;transform:translate(-50%,-50%);opacity:.8">' + rings(210, gap=False) + '</div>') + f'''
    <div style="position:absolute;left:0;right:0;top:122mm;text-align:center">{logo("white","8mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:10mm;font-size:13pt;color:#fff">Managed IT services for UK businesses,<br>powered by AI.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:24mm">
      <div class="hair" style="margin-bottom:7mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(15, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(), p5(), p6(), p7(), p8(), p9(), p10(), p11(), p12(), p13(), p14(), p15()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'




# ================================================= v2 creative overrides
def p1():
    legend = ('<div style="display:flex;gap:7mm;font-family:\'JetBrains Mono\',monospace;font-size:6.6pt;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.7);margin-top:5mm">'
              '<span><i style="display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;background:var(--grad-d);margin-right:2mm;vertical-align:-.4mm"></i>43 reported a breach or attack</span>'
              '<span><i style="display:inline-block;width:2.6mm;height:2.6mm;border-radius:50%;background:rgba(255,255,255,.14);margin-right:2mm;vertical-align:-.4mm"></i>57 did not</span></div>')
    body = bg_dark('<div class="glow" style="left:44mm;top:30mm;width:120mm;height:120mm;background:radial-gradient(circle,rgba(0,184,219,.22) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">OCT 2026</span></div>
    <div style="position:absolute;left:18mm;top:44mm;writing-mode:vertical-rl;transform:rotate(180deg);font-family:'JetBrains Mono',monospace;font-size:6.8pt;letter-spacing:.24em;text-transform:uppercase;color:var(--cyan)">100 UK businesses · one year</div>
    <div style="position:absolute;left:70mm;top:30mm">{dots(10,10,43,pitch=12,d=7.4)}{legend}</div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">
      <div style="font-weight:600;font-size:38pt;line-height:.98;letter-spacing:-.05em">The Resilience</div>
      <div style="margin-top:2mm">{gt_slice("Gap.", 104, weight=700, ls=-0.06, cut=0.26, shift=3.2, gap=1.7)}</div>
      <div class="lede" style="margin-top:7mm;max-width:112mm;font-size:12.5pt">Attacks have levelled off. Readiness has not caught up. A reading of the evidence for UK leaders.</div>
      <div class="hair" style="margin:9mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div>
    </div>'''
    return page(1, body, dark=True, folio=False)


def p4():
    body = f'''<div class="eyebrow" style="margin-top:14mm">Foreword</div>
    <div class="pull" style="margin-top:8mm;max-width:150mm;font-size:22pt;font-weight:300;line-height:1.28">Most IT leaders are not short of warnings. They are short of time, and of a clear view of what comes first.</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:9mm;margin-top:22mm">
      <div><p>This report is our attempt at that view. We went back to the public evidence (the government's annual survey, the National Cyber Security Centre, IBM's research on breach costs and the independent analysis of last year's biggest UK incidents) and set it side by side.</p>
      <p>Two things stand out. The first is that the number of businesses being hit has stopped climbing. It has held at 43% for two years running. The second is harder to read: preparedness has barely moved. Three in four businesses still have no formal plan for the day something goes wrong.</p></div>
      <div><p>We work with organisations that run on very little spare attention. What they ask of us is rarely another tool. They want a calmer operation, a cost they can predict, and a straight answer when something breaks.</p>
      <p>We hope this report makes the case for that kind of resilience on the evidence rather than on fear. Read it for the figures. Use the playbook that accompanies it for the next ninety days.</p></div>
    </div>
    <div class="hair" style="margin:20mm 0 7mm"></div>
    <div style="display:flex;align-items:center;gap:5mm">{avatar("13mm")}
      <div><div style="font-weight:600;font-size:10pt">The Transputec team</div><div class="mono" style="font-size:6.8pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid);margin-top:1mm">London · October 2026</div></div></div>'''
    return page(4, body, section="Foreword")


def p6():
    body = bg_dark('<div class="glow" style="right:-10mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.18) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">Chapter 01</div>
    <div style="position:absolute;right:18mm;top:40mm">{dots(10,10,43,pitch=11,d=6.6)}
      <div class="mono" style="font-size:6.4pt;letter-spacing:.14em;color:rgba(255,255,255,.5);margin-top:4mm;text-transform:uppercase">Every dot, one UK business in 100</div></div>
    <div style="position:absolute;left:18mm;top:168mm">{G('43%',128,ls=-0.07)}
      <div class="lede" style="margin-top:7mm;max-width:104mm;font-size:14pt;color:#fff;font-weight:300">of UK businesses reported a cyber breach or attack in the last twelve months. About 612,000 organisations.<sup class="c">1</sup></div></div>
    <div style="position:absolute;left:18mm;top:46mm"><h2 style="font-size:30pt;max-width:56mm">The shape of the threat.</h2></div>'''
    return page(6, body, dark=True, section="01 · The shape of the threat")


def unit(n, label, src, tint=False):
    num = G(f"{n}%", 26, ls=-0.045)
    return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{num}</div>'
            f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{label}<sup class="c">{src}</sup></div></div>')


def p10():
    body = f'''<div class="eyebrow" style="margin-top:14mm">04 · The preparedness gap</div>
    <h2 style="margin-top:5mm;max-width:150mm">Knowing the risk is not<br>the same as being ready.</h2>
    <p class="lede" style="margin-top:7mm;max-width:140mm">Picture 100 organisations in each case. The lit dots are the ones that have done the thing.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4.7mm;margin-top:9mm">
      {unit(25, "have a formal incident response plan", 1)}
      {unit(15, "review the risk from their immediate suppliers", 1)}
      {unit(31, "of UK organisations govern AI use with policies", 2)}
      {unit(37, "of UK organisations have AI access controls in place", 2)}
    </div>
    <div class="src" style="margin-top:6mm">Columns 1–2: DSIT, businesses. Columns 3–4: IBM, UK respondents (63% report no AI access controls). Different populations; not additive.</div>
    <div class="hair" style="margin:8mm 0 7mm"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8mm">
      <div><h3>A plan on paper</h3><p style="margin-top:2.5mm;font-size:8.8pt">Having a document is the start. The organisations that recover quickly have run the plan: someone has been woken at 2am, the phone tree has been tried, and the backups have been restored somewhere other than the lab.</p></div>
      <div><h3>Suppliers are the blind spot</h3><p style="margin-top:2.5mm;font-size:8.8pt">Supplier compromise was the most common cause of UK breaches in IBM's data, yet only 15% of businesses review supplier risk.<sup class="c">1,2</sup></p></div>
      <div><h3>AI arrived first, rules second</h3><p style="margin-top:2.5mm;font-size:8.8pt">Staff are already using AI tools. Fewer than a third of UK organisations have rules for it, and IBM's global findings put the extra cost of heavy unsanctioned use at £498,000.<sup class="c">2</sup></p></div>
    </div>
    <div class="card" style="margin-top:7mm;background:var(--navy);color:#fff;display:flex;gap:8mm;align-items:center;padding:5mm 6mm">
      <div class="eyebrow" style="color:var(--cyan);width:24mm">Our view</div>
      <div class="pull" style="font-size:12.5pt;color:#fff">The gap is cheap to close and expensive to discover. It is closed with rehearsal and ownership, not with another purchase.</div></div>'''
    return page(10, body, section="04 · The preparedness gap")


def p13():
    def mini(num, lab):
        return f'<div>{G(num, 26, ls=-0.045)}<p style="font-size:8pt;margin-top:2mm;max-width:36mm">{lab}</p></div>'
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco", "dell", "lenovo", "mimecast", "cloudtango"], 4, h="31mm", gap="4mm", span={"iso": 2, "cloudtango": 2})
    # replace the single cloudtango tile order: build custom grid so the government tile sits in the last row
    tiles = wall[:-6] + gov_tile("31mm") + "</div>"
    body = bg_dark() + f'''<div class="eyebrow" style="margin-top:14mm">07 · What good looks like</div>
    <h2 style="margin-top:5mm;max-width:150mm">Resilience you can<br>check, and contract.</h2>
    <p class="lede" style="margin-top:6mm;max-width:142mm">Transputec delivers managed IT for UK businesses on a fixed monthly fee, with service levels written into the agreement. These are the figures we report, and the credentials behind them.<sup class="c">5</sup></p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6mm;margin-top:11mm;padding-top:7mm;border-top:.25mm solid rgba(255,255,255,.14)">
      {mini("30%+", "lower run-cost than the equivalent in-house team")}{mini("NPS 70+", "across managed users")}
      {mini("78%", "first-call resolution, rapid phone answer")}{mini("1,000+", "projects delivered")}</div>
    <div class="eyebrow" style="margin:11mm 0 4mm">Accreditations and partnerships</div>
    {tiles}
    <p style="font-size:7.8pt;margin-top:5mm;color:rgba(255,255,255,.6)">Government Commercial Agency G-Cloud 15 and TePAS 2 [RM6098] supplier (Lots 2, 3 and 8) · Data Protection registered · PCR Awards 2023 · Prestige Awards 2023 · ISO 27001-certified delivery from a UK service desk.<sup class="c">5</sup></p>
    <div class="src" style="position:absolute;left:18mm;bottom:20mm;color:rgba(255,255,255,.45)">Source: Transputec, transputec.com, accessed 27 October 2026. Company-reported; not independently audited.</div>'''
    return page(13, body, dark=True, section="07 · What good looks like")


def p15():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco"], 6, h="19mm", gap="2.6mm", span={"iso": 2})
    body = bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.22) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:26mm;transform:translateX(-50%)">{dots(10,10,100,pitch=11.5,d=7,halo=False)}
      <div class="mono" style="text-align:center;font-size:6.6pt;letter-spacing:.18em;color:var(--cyan);margin-top:5mm;text-transform:uppercase">100 of 100 · the gap, closed</div></div>
    <div style="position:absolute;left:0;right:0;top:172mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">Managed IT services for UK businesses,<br>powered by AI.</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}
      <div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(15, body, dark=True, folio=False)


if __name__ == "__main__":
    open("report.html", "w", encoding="utf8").write(build())
