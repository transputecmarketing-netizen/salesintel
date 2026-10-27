from common import FONTS, TOKENS, DEFS, logo, rings, gt as G, gt_slice, dots, ghost, avatar, badge_wall, gov_tile

TITLE = "The Resilience Playbook"

CSS = FONTS + TOKENS + """
@page{size:297mm 210mm;margin:0}
.pg{width:297mm;height:210mm;padding:22mm 20mm 20mm}
.folio{position:absolute;left:20mm;right:20mm;bottom:9mm;display:flex;justify-content:space-between;align-items:center;
  font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.12em;text-transform:uppercase;color:var(--mid)}
.dark .folio{color:rgba(255,255,255,.5)}
.folio b{color:var(--navy);font-weight:500}.dark .folio b{color:#fff}
.spine{position:absolute;left:7mm;top:50%;writing-mode:vertical-rl;transform:translateY(-50%) rotate(180deg);font-family:'JetBrains Mono',monospace;font-size:5.6pt;letter-spacing:.24em;text-transform:uppercase;color:#B7C1D3;white-space:nowrap}
.dark .spine{color:rgba(255,255,255,.3)}
.run{position:absolute;left:20mm;right:20mm;top:9mm;display:flex;justify-content:space-between;align-items:center}
.run span{font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:var(--mid)}
h2{font-weight:600;font-size:27pt;line-height:1.06;letter-spacing:-.035em}
h3{font-weight:600;font-size:11.5pt;letter-spacing:-.015em;line-height:1.25}
.lede{font-size:12pt;font-weight:300;line-height:1.55;color:var(--body)}
.dark .lede{color:var(--slate)}
p{font-size:9.2pt;line-height:1.65;color:var(--body)}
.dark p{color:var(--slate)}
p+p{margin-top:2.6mm}
.glow{position:absolute;border-radius:50%}
.src{font-family:'JetBrains Mono',monospace;font-size:6pt;letter-spacing:.04em;color:var(--mid);line-height:1.6}
.navy{background:var(--navy);color:#fff;border-radius:4mm}
.navy p{color:var(--slate)}
.q{font-weight:300;font-size:12.6pt;line-height:1.38;letter-spacing:-.01em;color:#fff;padding:4.6mm 0;border-bottom:.25mm solid rgba(255,255,255,.14)}
.q:last-child{border-bottom:0}
.step{display:flex;gap:3.8mm;padding:4.3mm 0;border-bottom:.25mm solid var(--line);font-size:10.4pt;line-height:1.5;color:var(--navy)}
.step:last-child{border-bottom:0}
.step i{flex:none;width:4.8mm;height:4.8mm;border-radius:50%;border:.35mm solid var(--blue);margin-top:.5mm}
.step span{color:var(--mid)}
"""


def page(n, body, dark=False, section="", folio=True):
    run = f'<div class="run">{logo("white" if dark else "blue", "3.4mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>' if folio else ""
    fol = f'<div class="folio"><span>{TITLE} · <b>2026</b></span><span><b>{n:02d}</b> / 15</span></div>' if folio else ""
    spine = f'<div class="spine">{TITLE} &nbsp;·&nbsp; {section}</div>' if folio else ""
    return f'<section class="pg {"dark" if dark else ""}">{spine}{run}{body}{fol}</section>'


def bg(extra=""):
    return ('<div class="glow" style="right:-60mm;top:-70mm;width:230mm;height:230mm;background:radial-gradient(circle,rgba(21,93,252,.34) 0%,rgba(21,93,252,0) 62%)"></div>'
            '<div class="glow" style="left:-70mm;bottom:-90mm;width:210mm;height:210mm;background:radial-gradient(circle,rgba(0,184,219,.18) 0%,rgba(0,184,219,0) 62%)"></div>' + extra)


# ------------------------------------------------------------------ pages
def p1():
    body = bg(f'<div style="position:absolute;right:-30mm;top:-8mm">{rings(215)}</div>') + f'''
    <div style="position:absolute;left:20mm;top:16mm">{logo("white","5mm")}</div>
    <div style="position:absolute;left:20mm;bottom:26mm">
      <div class="eyebrow" style="margin-bottom:7mm">Playbook · UK mid-market IT leaders · 2026</div>
      <div style="font-weight:600;font-size:62pt;line-height:.98;letter-spacing:-.055em">The Resilience</div>
      <div style="margin-top:1mm">{G('Playbook.',62,weight=600,ls=-0.055)}</div>
      <div class="lede" style="margin-top:8mm;max-width:130mm;font-size:13pt">Ninety days to a calmer, safer IT estate. Six plays, each with the questions to ask out loud.</div>
    </div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:12mm;display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:6.8pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
      <span>Transputec</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div>'''
    return page(1, body, dark=True, folio=False)


def p2():
    steps = [("01", "Read the play", "Each play is one page. It opens with the evidence, so you can say why it matters in a sentence."),
             ("02", "Ask out loud", "The questions are written to be spoken in a meeting. Use them as written. The silence after is useful."),
             ("03", "Agree an owner", "Every play ends with a test: what is true when it is done. Name one person and one date.")]
    cards = ''.join(f'''<div style="padding:7mm 0 0;border-top:.35mm solid var(--navy)"><div class="mono" style="font-size:8pt;color:var(--blue)">{a}</div>
      <h3 style="margin:6mm 0 3mm;font-size:15pt;letter-spacing:-.03em">{b}</h3><p>{c}</p></div>''' for a, b, c in steps)
    ev = ''.join(f'<div style="display:flex;gap:3mm;margin-bottom:1.6mm"><b class="mono" style="color:var(--cyan);font-weight:500">{n}</b><span>{t}</span></div>' for n, t in [
        ("1", "DSIT and Home Office, Cyber Security Breaches Survey 2025/26"), ("2", "IBM, Cost of a Data Breach Report 2025, UK edition"),
        ("3", "NCSC, Annual Review 2025"), ("4", "Cyber Monitoring Centre, JLR assessment, October 2025")])
    body = f'''<div class="eyebrow" style="margin-top:8mm">How to use this playbook</div>
    <h2 style="margin-top:4mm;max-width:170mm">Built to be spoken,<br>not just read.</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9mm;margin-top:14mm">{cards}</div>
    <div class="navy" style="position:absolute;left:20mm;right:20mm;bottom:22mm;padding:6mm 8mm;display:grid;grid-template-columns:34mm 1fr;gap:8mm;align-items:center">
      <div class="eyebrow" style="color:var(--cyan)">Evidence base</div>
      <div style="font-size:8pt;color:var(--slate);line-height:1.5;columns:2;column-gap:8mm">{ev}</div></div>'''
    return page(2, body, section="How to use")


def p3():
    phases = [("Days 1–30", "See", "Know what you run and who can get in.", ["01 · Map what matters", "02 · Close the front door"]),
              ("Days 31–60", "Rehearse", "Practise recovery. Set rules for AI.", ["03 · Rehearse recovery", "04 · Govern AI use"]),
              ("Days 61–90", "Prove", "Extend to suppliers. Report in numbers.", ["05 · Know your suppliers", "06 · Brief the board"])]
    col = ''.join(f'''<div><div class="mono" style="font-size:7.6pt;letter-spacing:.12em;color:var(--blue);text-transform:uppercase">{a}</div>
      <div style="font-weight:600;font-size:26pt;letter-spacing:-.04em;margin:3mm 0 3mm">{b}</div><p style="max-width:68mm">{c}</p>
      <div style="margin-top:6mm">{''.join(f'<div style="padding:2.8mm 4mm;border-radius:2.4mm;background:var(--mist);font-size:9pt;font-weight:500;margin-bottom:2mm">{x}</div>' for x in d)}</div></div>''' for a, b, c, d in phases)
    body = f'''<div class="eyebrow" style="margin-top:8mm">The 90 days at a glance</div>
    <h2 style="margin-top:4mm;max-width:190mm">Three months. Three verbs.</h2>
    <div style="position:relative;margin-top:16mm">
      <div style="height:1.8mm;border-radius:1mm;background:linear-gradient(90deg,#00B8DB,#155DFC)"></div>
      <div style="position:absolute;left:0;top:-1.7mm;width:5mm;height:5mm;border-radius:50%;background:#fff;border:.8mm solid #00B8DB"></div>
      <div style="position:absolute;left:33.33%;top:-1.7mm;width:5mm;height:5mm;border-radius:50%;background:#fff;border:.8mm solid #009AF0"></div>
      <div style="position:absolute;left:66.66%;top:-1.7mm;width:5mm;height:5mm;border-radius:50%;background:#fff;border:.8mm solid #155DFC"></div>
      <div style="position:absolute;right:0;top:-1.7mm;width:5mm;height:5mm;border-radius:50%;background:#155DFC"></div></div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:9mm;margin-top:11mm">{col}</div>'''
    return page(3, body, section="At a glance")


def p4():
    people = [("Managing Director", "Continuity and reputation", "If our systems stopped on Monday, what would we have lost by Friday?", "Wants a plain answer and a number for the board."),
              ("IT Director", "Capacity and noise", "What did your team not get to last quarter?", "Wants fewer alerts, fewer vendors, and cover at 3am."),
              ("Finance Director", "Cost and predictability", "What did unplanned IT cost us last year?", "Wants a fixed fee and no surprises in the budget.")]
    cards = ''.join(f'''<div class="card" style="background:var(--mist);border-radius:4mm;padding:8mm 7mm;display:flex;flex-direction:column;min-height:118mm">
      <div class="mono" style="font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:var(--blue)">{k}</div>
      <h3 style="font-size:16pt;letter-spacing:-.03em;margin-top:4mm">{t}</h3>
      <p style="margin-top:3mm">{w}</p>
      <div style="margin-top:auto"><div class="eyebrow" style="color:var(--mid);margin-bottom:2.5mm">Open with</div>
      <div style="font-weight:300;font-size:12pt;line-height:1.38;letter-spacing:-.015em">“{q}”</div></div></div>''' for k, t, q, w in people)
    body = f'''<div class="eyebrow" style="margin-top:8mm">Know who you are talking to</div>
    <h2 style="margin-top:4mm;max-width:200mm">Three leaders. Three different first questions.</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7mm;margin-top:11mm">{cards}</div>'''
    return page(4, body, section="Audience")


def divider(n, num, days, word, line, plays, sec):
    li = ''.join(f'<div style="padding:3.4mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);font-size:10pt;color:#fff">{x}</div>' for x in plays)
    body = bg(f'<div style="position:absolute;right:-50mm;top:20mm;opacity:.85">{rings(190)}</div>') + f'''
    <div class="eyebrow" style="margin-top:8mm">Phase {num} · {days}</div>
    <div style="position:absolute;left:20mm;top:48mm">{G(word, 120, weight=600, ls=-0.06)}
      <div class="lede" style="margin-top:8mm;max-width:100mm;font-size:13.5pt;color:#fff;font-weight:300">{line}</div></div>
    <div style="position:absolute;right:20mm;bottom:26mm;width:82mm"><div class="eyebrow" style="margin-bottom:3mm">Plays in this phase</div>{li}</div>'''
    return page(n, body, dark=True, section=sec)


def play(n, num, title, stat, stat_label, why, asks, dos, done, src, sec):
    q = ''.join(f'<div class="q">“{a}”</div>' for a in asks)
    st = ''.join(f'<div class="step"><i></i><div>{a}</div></div>' for a in dos)
    body = f'''<div style="display:grid;grid-template-columns:84mm 1fr 1fr;gap:9mm;margin-top:4mm">
      <div>
        <div class="eyebrow">Play {num}</div>
        <h2 style="margin-top:4mm;font-size:25pt">{title}</h2>
        <div style="margin-top:12mm">{G(stat, 66, ls=-0.05)}</div>
        <p style="margin-top:4mm;font-size:9.8pt;max-width:76mm">{stat_label}</p>
        <div class="hair" style="margin:7mm 0 5mm"></div>
        <div class="eyebrow" style="color:var(--mid);margin-bottom:2.5mm">Why it matters</div>
        <p style="font-size:9.6pt">{why}</p>
      </div>
      <div class="navy" style="padding:8mm 7.5mm 6mm;align-self:start"><div class="eyebrow" style="color:var(--cyan);margin-bottom:3mm">Ask out loud</div>{q}</div>
      <div><div class="eyebrow" style="color:var(--mid);margin-bottom:2mm;padding-bottom:2.4mm;border-bottom:.35mm solid var(--navy)">Do</div>{st}</div>
    </div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:21mm;display:flex;align-items:center;gap:6mm;padding:4.4mm 6mm;border-radius:3mm;background:var(--mist)">
      <span class="tag" style="color:var(--blue)">Done when</span><span style="font-size:9.4pt;font-weight:500;line-height:1.45">{done}</span></div>
    <div class="src" style="position:absolute;left:20mm;bottom:14.5mm">{src}</div>'''
    return page(n, body, section=sec)


def p6():
    return play(6, "01", "Map what matters", "1 list", "The first deliverable is a single page: the systems, data and logins the business cannot run a day without.",
                "You cannot protect, monitor or restore what has not been listed. Most recovery plans fail on the first question: which system comes back first, and who decides?",
                ["Which five systems would stop us trading if they went down?", "Who can sign in to each one, and when did we last check?", "Where does our most sensitive data actually live?"],
                ["List the five to ten systems and data sets the business depends on.", "Name a business owner and a technical owner for each.", "Record where each one is hosted and who supports it.", "Mark which suppliers or outside logins touch them.", "Agree the order of recovery with the leadership team."],
                "One page exists, every item has two named owners, and the leadership team has agreed the order of recovery.", "", "Phase 01 · See")


def p7():
    return play(7, "02", "Close the front door", "38%", "of UK businesses faced at least one phishing attack last year, the most common type and the one most often named as the most disruptive.¹",
                "Phishing was the most common attack in the government survey, and compromised credentials were the third most common cause of UK breaches in IBM's data.¹ ² Sign-in is where most incidents begin.",
                ["Is every account protected by more than a password, starting with email?", "Do admins use a separate account for admin work?", "If someone clicks a bad link today, who finds out, and how fast?"],
                ["Switch on multi-factor sign-in for every account. Begin with email and administrators.", "Separate admin accounts from everyday accounts.", "Add a one-click “report phishing” button for staff.", "Run a short monthly note on one real example, not an annual course.", "Set devices to update automatically and check the exceptions."],
                "Every account uses multi-factor sign-in, admin accounts are separate, and a reported email reaches IT within a minute.", "Sources: ¹ DSIT, Cyber Security Breaches Survey 2025/26.  ² IBM, Cost of a Data Breach 2025, UK edition.", "Phase 01 · See")


def p9():
    return play(9, "03", "Rehearse recovery", "25%", "of businesses have a formal incident response plan. The rest will write one during the incident.¹",
                "UK organisations that used security automation extensively found a breach in 148 days and contained it in 42. Those that did not took 168 and 64.² Practice shortens both numbers.",
                ["When did we last restore from backup, onto a different machine?", "At 2am on a Sunday, who decides, and who rings the customers?", "How long can we be without each of our five systems?"],
                ["Write a one-page plan: who decides, who calls, who tells staff and customers.", "Restore one real system from backup and time it.", "Run a 90-minute tabletop exercise with the leadership team.", "Agree a target recovery time for each of the five systems.", "Store the plan somewhere you can reach without your own network."],
                "The plan has been exercised once, a restore has been timed, and recovery targets are written next to each system.", "Sources: ¹ DSIT, Cyber Security Breaches Survey 2025/26.  ² IBM, Cost of a Data Breach 2025, UK edition.", "Phase 02 · Rehearse")


def p10():
    return play(10, "04", "Govern AI use", "£498k", "extra breach cost paid by UK organisations with high levels of unsanctioned AI use.²",
                "Only 31% of UK organisations have policies to govern AI use, and 63% have no access controls for AI systems.² Staff are not waiting for the policy. They are already pasting work into tools.",
                ["Which AI tools is the business already using, officially or not?", "What is the one kind of data nobody may put into them?", "Who owns this decision?"],
                ["Ask each team which AI tools they use. Do not make it an interrogation.", "Publish a short approved list and a plain red-line list.", "Put access controls on the approved tools.", "Name one owner, with the authority to say no.", "Review the list every quarter."],
                "An approved list is published, one person owns it, and staff can say in a sentence what they must never paste in.", "Source: ² IBM, Cost of a Data Breach 2025, UK edition. Shadow AI: unregulated, unauthorised use of AI.", "Phase 02 · Rehearse")


def p12():
    return play(12, "05", "Know your suppliers", "15%", "of businesses review the risks posed by their immediate suppliers.¹ Supplier compromise was the top UK breach cause at 18%.²",
                "Your resilience is only as good as the least-prepared company with access to your systems or your data. The incidents that make the news usually arrive this way.³ ⁴",
                ["Which ten suppliers could stop us trading, or see our data?", "How quickly must they tell us about an incident, in writing?", "What is our plan if one of them is down for a week?"],
                ["List the ten suppliers you depend on most and rank by dependency.", "Ask each the same five questions: certifications, notification time, data location, access to you, exit plan.", "Tier them: critical, important, routine.", "Add incident notification terms at the next renewal.", "Review the critical tier every year."],
                "Ten suppliers are ranked, the critical ones have answered in writing, and each has a stated notification time.", "Sources: ¹ DSIT 2025/26.  ² IBM 2025, UK.  ³ NCSC Annual Review 2025.  ⁴ Cyber Monitoring Centre, JLR assessment.", "Phase 03 · Prove")


def p13():
    rows = [("Time to restore, last test", "3 h 40 m", "target 4 h", .9), ("Accounts on multi-factor sign-in", "100%", "target 100%", 1.0),
            ("Devices up to date", "96%", "target 95%", .96), ("Phishing reports per 100 staff", "7", "rising is healthy", .55),
            ("Critical suppliers reviewed", "8 of 10", "target 10", .8)]
    sc = ''.join(f'''<div style="display:grid;grid-template-columns:1fr 24mm 30mm;gap:5mm;align-items:center;padding:3.4mm 0;border-bottom:.25mm solid var(--line)">
      <div><div style="font-size:9pt;font-weight:500">{a}</div><div style="height:1.6mm;border-radius:1mm;background:var(--line);margin-top:2mm;overflow:hidden"><div style="width:{w*100:.0f}%;height:100%;background:var(--grad)"></div></div></div>
      <div style="font-weight:600;font-size:13pt;letter-spacing:-.02em;text-align:right">{b}</div><div class="mono" style="font-size:6.6pt;color:var(--mid)">{c}</div></div>''' for a, b, c, w in rows)
    body = f'''<div style="display:grid;grid-template-columns:84mm 1fr;gap:12mm;margin-top:4mm">
      <div>
        <div class="eyebrow">Play 06</div>
        <h2 style="margin-top:4mm;font-size:25pt">Brief the board<br>in numbers</h2>
        <div style="margin-top:12mm">{G('5', 66, ls=-0.05)}</div>
        <p style="margin-top:4mm;font-size:9.8pt;max-width:76mm">numbers on one page, every quarter. Same five, same order, so the trend is the story.</p>
        <div class="hair" style="margin:7mm 0 5mm"></div>
        <div class="eyebrow" style="color:var(--mid);margin-bottom:2.5mm">Ask out loud</div>
        <p style="font-weight:300;font-size:11pt;line-height:1.4;color:var(--navy)">“What is the one number that would tell us we are getting safer?”</p>
        <p style="font-weight:300;font-size:11pt;line-height:1.4;color:var(--navy);margin-top:3mm">“Are we reporting activity, or outcomes?”</p>
      </div>
      <div class="card" style="background:#fff;border:.3mm solid var(--line);border-radius:4mm;padding:7mm 8mm;box-shadow:0 2mm 8mm rgba(15,23,43,.06)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3mm"><div class="eyebrow">Quarterly resilience scorecard</div><span class="tag" style="color:var(--blue)">Illustrative figures</span></div>
        {sc}
      </div>
    </div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:21mm;display:flex;align-items:center;gap:6mm;padding:4.4mm 6mm;border-radius:3mm;background:var(--mist)">
      <span class="tag" style="color:var(--blue)">Done when</span><span style="font-size:9.4pt;font-weight:500;line-height:1.45">The board has seen the scorecard twice and can say whether each number is moving the right way.</span></div>'''
    return page(13, body, section="Phase 03 · Prove")


def p14():
    rows = [("“We are too small to be a target.”", "Four in ten micro businesses reported a breach or attack last year: 42%. Size changes the odds, not the exposure.¹", "Ask: “What would a week offline cost us?”"),
            ("“We already have backups.”", "Good. Backups are the start of recovery, not the end of it. The question is whether anyone has restored from them under pressure.", "Ask: “When did we last restore one, and how long did it take?”"),
            ("“IT looks after all of that.”", "Only 25% of businesses have a formal incident plan.¹ If it is not written down, it lives in one person's head.", "Ask: “If they were on leave, who would decide?”"),
            ("“We cannot afford it right now.”", "UK breaches cost £3.78m on average without extensive security automation, and £3.11m with it.² The cheap work is rehearsal and ownership.", "Ask: “Which of the six plays costs only time?”")]
    r = ''.join(f'''<div style="display:grid;grid-template-columns:78mm 1fr 70mm;gap:8mm;padding:5.8mm 0;border-bottom:.25mm solid var(--line);align-items:start">
      <div style="font-weight:500;font-size:13.5pt;letter-spacing:-.02em;line-height:1.3">{a}</div><p style="font-size:10pt">{b}</p><div class="mono" style="font-size:7.6pt;line-height:1.7;color:var(--blue)">{c}</div></div>''' for a, b, c in rows)
    body = f'''<div class="eyebrow" style="margin-top:8mm">The conversation cheat-sheet</div>
    <h2 style="margin-top:4mm;max-width:200mm">Four things you will hear.<br>What to say back.</h2>
    <div style="margin-top:10mm;border-top:.35mm solid var(--navy)">{r}</div>
    <div class="src" style="position:absolute;left:20mm;bottom:14.5mm">Sources: ¹ DSIT, Cyber Security Breaches Survey 2025/26.  ² IBM, Cost of a Data Breach 2025, UK edition.</div>'''
    return page(14, body, section="Cheat-sheet")


def p15():
    body = bg(f'<div style="position:absolute;right:-40mm;top:-20mm;opacity:.9">{rings(230, gap=False)}</div>') + f'''
    <div style="position:absolute;left:20mm;top:16mm">{logo("white","5mm")}</div>
    <div style="position:absolute;left:20mm;top:62mm;max-width:190mm">
      <div class="eyebrow" style="margin-bottom:6mm">Next step</div>
      <div style="font-weight:600;font-size:46pt;line-height:1.02;letter-spacing:-.05em">Your ninety days<br>start with one<br><span style="font-weight:600">conversation.</span></div>
      <div class="lede" style="margin-top:9mm;max-width:120mm;font-size:13pt">Predictable IT. Predictable budget. Contracted outcomes. Talk to a London-based partner about the first play.</div>
      <div style="margin-top:10mm;display:inline-flex;align-items:center;gap:3mm;padding:3.6mm 7mm;border-radius:10mm;background:var(--grad);font-weight:600;font-size:10pt;color:#fff">Book a strategic consultation →</div></div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:14mm"><div class="hair" style="margin-bottom:5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
      <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(15, body, dark=True, folio=False)


def build():
    pages = [p1(), p2(), p3(), p4(),
             divider(5, "01", "Days 1–30", "See.", "Know what you run, and who can get in.", ["02 · Map what matters", "03 · Close the front door"], "Phase 01"),
             p6(), p7(),
             divider(8, "02", "Days 31–60", "Rehearse.", "Practise recovery. Set rules for the AI already in use.", ["03 · Rehearse recovery", "04 · Govern AI use"], "Phase 02"),
             p9(), p10(),
             divider(11, "03", "Days 61–90", "Prove.", "Reach your suppliers. Report in numbers.", ["05 · Know your suppliers", "06 · Brief the board"], "Phase 03"),
             p12(), p13(), p14(), p15()]
    return f'<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><title>{TITLE} · Transputec</title><style>{CSS}</style></head><body>{DEFS}{"".join(pages)}</body></html>'




# ================================================= v2 creative overrides
PHASE = [("#00B8DB", "#009AF0"), ("#009AF0", "#2C72DB"), ("#2C72DB", "#155DFC")]


def days(pitch=14.2, d=8.6, active=None, labels=True, unlit="rgba(255,255,255,.10)"):
    """90 dots, one per day: 18 columns x 5 rows; each phase is 6 columns (30 days)."""
    cols, rows = 18, 5
    W, H = cols * pitch, rows * pitch
    out = [f'<svg width="{W:.1f}mm" height="{H + (9 if labels else 0):.1f}mm" viewBox="0 0 {W:.1f} {H + (9 if labels else 0):.1f}" style="display:block;overflow:visible"><defs>']
    for i, (a, b) in enumerate(PHASE):
        x0, x1 = i * 6 * pitch, (i + 1) * 6 * pitch
        out.append(f'<linearGradient id="ph{i}{int(pitch*10)}" gradientUnits="userSpaceOnUse" x1="{x0}" y1="{H}" x2="{x1}" y2="0"><stop offset="0" stop-color="{a}"/><stop offset="1" stop-color="{b}"/></linearGradient>')
    out.append('</defs>')
    for c in range(cols):
        ph = c // 6
        for r in range(rows):
            on = active is None or ph == active
            fill = f'url(#ph{ph}{int(pitch*10)})' if on else unlit
            out.append(f'<circle cx="{c*pitch+pitch/2:.2f}" cy="{r*pitch+pitch/2:.2f}" r="{d/2:.2f}" fill="{fill}"/>')
    if labels:
        for i, t in enumerate(["DAY 1", "DAY 31", "DAY 61"]):
            out.append(f'<text x="{i*6*pitch+pitch/2-d/2:.1f}" y="{H+6:.1f}" font-family="JetBrains Mono" font-size="2.6" letter-spacing=".5" fill="{"#00B8DB" if (active is None or active==i) else "#6B7A90"}">{t}</text>')
        out.append(f'<text x="{W-pitch/2+d/2:.1f}" y="{H+6:.1f}" text-anchor="end" font-family="JetBrains Mono" font-size="2.6" letter-spacing=".5" fill="{"#00B8DB" if active in (None,2) else "#6B7A90"}">DAY 90</text>')
    out.append('</svg>')
    return ''.join(out)


def p1():
    body = bg('<div class="glow" style="left:60mm;top:-20mm;width:200mm;height:140mm;background:radial-gradient(circle,rgba(0,184,219,.18) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:20mm;top:16mm;right:20mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">90 DAYS · 90 DOTS</span></div>
    <div style="position:absolute;left:20mm;top:34mm">{days(pitch=13.9, d=8.2)}</div>
    <div style="position:absolute;left:20mm;bottom:22mm;right:20mm">
      <div style="display:flex;align-items:flex-end;gap:9mm">
        <div>
          <div style="font-weight:600;font-size:34pt;line-height:1;letter-spacing:-.05em">The Resilience</div>
          <div style="margin-top:1mm">{gt_slice("Playbook.", 66, weight=700, ls=-0.06, cut=0.26, shift=2.4, gap=1.3)}</div></div>
        <div class="lede" style="max-width:88mm;font-size:11.5pt;padding-bottom:3mm">Ninety days to a calmer, safer IT estate. Six plays, each with the questions to ask out loud.</div></div>
      <div class="hair" style="margin:7mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec · UK mid-market IT leaders · 2026</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div>
    </div>'''
    return page(1, body, dark=True, folio=False)


def divider(n, num, dayrange, word, line, plays, sec):
    li = ''.join(f'<div style="padding:3.2mm 0;border-bottom:.25mm solid rgba(255,255,255,.14);font-size:10pt;color:#fff">{x}</div>' for x in plays)
    body = bg() + f'''
    <div class="eyebrow" style="margin-top:8mm">Phase {num} · {dayrange}</div>
    <div style="position:absolute;left:20mm;top:42mm">{G(word, 118, weight=600, ls=-0.06)}
      <div class="lede" style="margin-top:7mm;max-width:110mm;font-size:13.5pt;color:#fff;font-weight:300">{line}</div></div>
    <div style="position:absolute;left:20mm;bottom:24mm">{days(pitch=8.6, d=5.1, active=int(num)-1)}</div>
    <div style="position:absolute;right:20mm;bottom:26mm;width:76mm"><div class="eyebrow" style="margin-bottom:3mm">Plays in this phase</div>{li}</div>'''
    return page(n, body, dark=True, section=sec)


def p15():
    wall = badge_wall(["iso", "msmw", "mssec", "aws", "cisco", "dell", "lenovo", "mimecast"], 9, h="17mm", gap="2.6mm", span={"iso": 2})
    body = bg('<div class="glow" style="left:90mm;top:-30mm;width:200mm;height:140mm;background:radial-gradient(circle,rgba(0,184,219,.16) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:20mm;top:16mm">{logo("white","5mm")}</div>
    <div style="position:absolute;right:20mm;top:16mm">{days(pitch=6.4, d=4, labels=False)}</div>
    <div style="position:absolute;left:20mm;top:52mm">
      <div class="eyebrow" style="margin-bottom:5mm">Next step</div>
      <div style="font-weight:600;font-size:42pt;line-height:1.02;letter-spacing:-.05em">Your ninety days<br>start with one conversation.</div>
      <div class="lede" style="margin-top:7mm;max-width:130mm;font-size:12.5pt">Predictable IT. Predictable budget. Contracted outcomes. Talk to a London-based partner about the first play.</div>
      <div style="margin-top:8mm;display:inline-flex;align-items:center;gap:3mm;padding:3.4mm 7mm;border-radius:10mm;background:var(--grad);font-weight:600;font-size:10pt;color:#fff">Book a strategic consultation →</div></div>
    <div style="position:absolute;left:20mm;right:20mm;bottom:13mm">{wall}<div class="hair" style="margin:6mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
      <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''
    return page(15, body, dark=True, folio=False)


if __name__ == "__main__":
    open("playbook.html", "w", encoding="utf8").write(build())
