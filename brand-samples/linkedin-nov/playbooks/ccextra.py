"""Four pages added to every Crises Control playbook and report: positioning, scorecard, buyer's questions, tailored demo.
Content is written once here, with industry-specific lines in IND, and inserted by CCBook.build."""

DIMS = [("Alert", "Can you reach the right people on more than one channel within minutes, day or night?"),
        ("Acknowledge", "Do you know who has seen the alert, and does silence trigger escalation by rule?"),
        ("Escalate", "Are escalation paths set by role and time, not by whoever remembers who to call?"),
        ("Coordinate", "Is there one shared workspace and log for the incident, not scattered calls, chats and inboxes?"),
        ("Execute", "Are your procedures turned into owned tasks with deadlines that someone can track?"),
        ("See", "Can leaders see tasks, people, locations and blockers live, without having to ask?"),
        ("Prove", "Could you produce a timestamped timeline for a regulator, insurer or inquiry within a day?"),
        ("Rehearse", "Do you exercise the whole response, not just the call tree, at least once a year?")]

IND = {
 "Financial Services and Insurance": dict(
   short="financial services",
   example="When a cloud region fails at 07:00, sending the alert is the easy part. Staying within your tolerance for disruption depends on who acknowledged, which workarounds started, what customers and supervisors were told, and whether you can prove it all afterwards.",
   good=["Incident team, executives and key suppliers reached by push, SMS and voice when email is down.",
         "Acknowledgement tracked against each important business service; no response escalates in minutes.",
         "Escalation tied to disruption tolerance thresholds, not to individual memory.",
         "One incident log shared by IT, operations, communications and compliance.",
         "Workaround and recovery steps for each important business service run as owned tasks.",
         "A live view of services, tasks and teams that the executive can read without a briefing.",
         "A timeline that supports board, auditor and regulator questions, produced on request.",
         "Severe but plausible scenarios rehearsed end to end, including the loss of usual channels."],
   bring=["A cloud or payments outage that pushes an important business service towards its tolerance for disruption.",
          "A cyber incident that takes out email and chat, so you need out-of-band coordination.",
          "A critical supplier failure that you must manage, report and evidence."]),
 "Property, Housing and Facilities": dict(
   short="property and housing",
   example="When a fire alarm sounds in a high-rise at 02:10, a text to residents is minute one. Keeping everyone safe depends on which residents need help, which contractor is on the way, who changed the evacuation strategy, and a record you can stand behind later.",
   good=["Residents, staff and contractors reached on several channels, including people without smartphones.",
         "Acknowledgement tracked by block and by flat; vulnerable residents followed up first.",
         "Out-of-hours escalation to the duty manager and contractor follows rules set in advance.",
         "One log for the incident, shared by housing, repairs, the fire service liaison and communications.",
         "Repair, damp and fire safety actions run as tasks with owners and deadlines.",
         "A live view of buildings, residents contacted and jobs outstanding.",
         "A defensible, timestamped record of every decision and message.",
         "Night-time scenarios rehearsed, including a change from stay put to evacuation."],
   bring=["A night-time fire in a high-rise block where the evacuation strategy changes.",
          "A flood, gas leak or power failure that affects vulnerable residents.",
          "A building management system fault or tampering incident that needs contractors at 3am."]),
 "Retail": dict(
   short="retail",
   example="When card payments fail on the busiest trading day of the year, a message to stores is minute one. Trading through it depends on which stores acknowledged, who switched to the fallback, what customers were told, and an accurate picture for head office.",
   good=["Every store manager and on-call colleague reached in minutes, on more than one channel.",
         "Store-by-store acknowledgement, with escalation when a store stays silent.",
         "Escalation from store to region to head office runs by rule.",
         "One incident log shared by IT, store operations, loss prevention and communications.",
         "Fallback, lockdown and cold-chain procedures run as owned tasks in every store.",
         "Head office sees which stores are trading, closed or at risk, live.",
         "A timeline for insurers, data protection regulators or a post-incident review, ready the next day.",
         "Peak-trading scenarios rehearsed with stores, not only at head office."],
   bring=["A card payment or till outage on your busiest trading day.",
          "A violent incident or lockdown in a store, with colleagues to protect.",
          "A refrigeration or cold-chain failure across several sites."]),
 "Transport and Logistics": dict(
   short="transport and logistics",
   example="When a substation fire cuts power to a hub at 23:40, the alert is minute one. Keeping goods and people moving depends on which drivers are safe, which partners know, what passengers or customers were told, and a clear record of who decided what.",
   good=["Drivers, depot staff, partners and contractors reached on several channels, at any hour.",
         "Acknowledgement and welfare checks for lone and remote workers, with escalation on silence.",
         "Escalation to duty managers and partner organisations runs by rule.",
         "One incident log shared by operations, partners and customer communications.",
         "Rerouting and recovery steps run as owned tasks across sites.",
         "A live view of sites, people, vehicles and outstanding actions.",
         "A timeline that supports regulators, insurers and the post-incident review.",
         "Multi-partner exercises that include a second means of contact for key people."],
   bring=["A power loss or fire at a hub, depot, port or airport.",
          "A cyber or supplier outage that stops dispatch or check-in.",
          "A driver or lone worker who stops responding."]),
 "Hospitality": dict(
   short="hospitality",
   example="When an attack happens outside a busy venue at 22:15, the alert is minute one. Protecting guests depends on every member of staff knowing their role, lockdown or invacuation starting at once, guests being told clearly, and a record of the first fifteen minutes.",
   good=["Every member of staff on shift reached in seconds, including agency and new starters.",
         "Acknowledgement from each area of the venue, with escalation when one stays silent.",
         "One duty manager can start evacuation, invacuation or lockdown for the whole site.",
         "One incident log shared by the duty manager, security, head office and emergency services liaison.",
         "Public protection procedures (such as those required under Martyn's Law in the UK) run as owned tasks.",
         "A live view of staff, areas secured and guests accounted for.",
         "A timeline that shows what the venue did and when, for the regulator or an inquiry.",
         "Shift-level drills, including peak seasons and the busiest nights."],
   bring=["A lockdown or invacuation on your busiest night.",
          "A fire, medical emergency or spiking incident with guests to protect.",
          "A booking or payment system outage during peak season."]),
 "Healthcare": dict(
   short="healthcare",
   example="When pathology goes down at 08:10, the alert is minute one. Keeping patients safe depends on who declared what, which staff came in, which downtime procedures started, what partners and patients were told, and a record for the after-action review.",
   good=["Clinical, on-call and support staff reached on several channels, at any hour.",
         "Call-in responses tracked, with escalation when key roles stay silent.",
         "Declaration and escalation follow your emergency preparedness framework by role.",
         "One incident log shared by the incident team, clinical leads, partners and communications.",
         "Downtime procedures run as owned tasks in every affected department.",
         "A live view of staff mobilised, services affected and actions outstanding.",
         "A timeline that supports assurance, data protection regulators and the after-action review.",
         "Exercises that include a cyber attack on clinical systems, not just a major incident."],
   bring=["A cyber attack that takes a clinical system or pathology offline.",
          "A major incident that needs staff called in out of hours.",
          "A seasonal surge or heatwave critical incident across several sites."]),
}

QS = [("Does it stop at the message?", "Ask what the platform does after the alert is sent: tasks, log, escalation, recovery."),
      ("Can it prove who acknowledged?", "Delivery is not acknowledgement. Ask how silence is spotted and escalated, and what you must configure."),
      ("Does it run your procedures?", "Ask whether your plans become owned tasks with deadlines, or stay as documents."),
      ("Is there one shared picture?", "Ask what leaders see live, and whether it needs someone to update a spreadsheet."),
      ("Does it work when your systems do not?", "Ask how teams coordinate if email, chat or your network is down."),
      ("Can frontline staff raise the alarm?", "Ask how a colleague on site escalates, with their location where available, in one action."),
      ("What evidence does it leave behind?", "Ask for a sample timeline of the kind a regulator, insurer or inquiry would want."),
      ("Can you rehearse in it?", "Ask whether you can run exercises on the same platform you would use for real.")]

STAGES = [("Alert", "Ping", "Reach people on push, SMS, voice and email, and track who acknowledged."),
          ("Coordinate", "Incident Manager", "One workspace and log for the whole team."),
          ("Execute", "Task Manager", "Procedures become owned tasks with deadlines and escalation."),
          ("See", "Control Centre", "A live picture of tasks, people, locations and blockers."),
          ("Prove", "Audit Trail", "A timestamped timeline, ready for the post-incident report.")]

VS = [("Sends a message", "Runs the response, from first alert to recovery"),
      ("Knows the message was delivered", "Knows who acknowledged, and escalates silence"),
      ("Ends when the alert goes out", "Follows the incident with tasks, owners and deadlines"),
      ("Leaves the record in inboxes and chats", "Keeps one timestamped timeline you can hand over"),
      ("Gives leaders a list of recipients", "Gives leaders a live picture of what is happening")]


STAGE = ["ACTIVATION", "ACTIVATION", "COORDINATION", "COORDINATION", "EXECUTION", "EXECUTION", "ASSURANCE", "ASSURANCE"]

def add_pages(b):
    from cckit import INK, SKY, BLUE, RED, MUTE, LOGO, CONTACT, dial
    d = IND.get(b.industry)
    if not d: return
    R, P = len(b.pages), []
    # 1 positioning (dark): framework sections 3 and 4
    FAIL = [("Fragmented information", "Different teams work from different information."), ("Delayed decision making", "Leadership lacks visibility, so decisions wait."),
            ("Uncoordinated response", "Several teams work independently on the same problem."), ("Lack of visibility", "Critical actions become difficult to track."),
            ("Lack of accountability", "Actions and decisions are poorly documented.")]
    fl = "".join(f'<div style="display:grid;grid-template-columns:8mm 52mm 1fr;gap:3mm;padding:2.8mm 0;border-top:.25mm solid rgba(247,246,248,.16);font-size:9.4pt"><span style="font-family:Roboto Mono;font-size:7.6pt;color:{RED}">0{i+1}</span><span style="font-weight:700">{a}</span><span style="color:rgba(247,246,248,.78)">{t}</span></div>' for i, (a, t) in enumerate(FAIL))
    LC = ["Detection", "Alert", "Coordination", "Execution", "Recovery", "Closure", "Reporting"]
    lc = "".join(f'<div style="flex:1;text-align:center;position:relative"><div style="width:4mm;height:4mm;border-radius:50%;margin:0 auto;background:{RED if i==0 else SKY};position:relative;z-index:1"></div><div style="font-family:Roboto Mono;font-size:7pt;letter-spacing:.06em;margin-top:2mm;color:{"#fff" if i else RED}">{x.upper()}</div></div>' for i, x in enumerate(LC))
    P.append(dict(body=f'''<div class="ey">Why coordination, not just notification</div>
      <h1 style="margin-top:4mm;width:172mm;font-size:29pt">Most organisations can send alerts.<br><span style="color:{SKY}">Few can manage incidents end-to-end.</span></h1>
      <div class="lede" style="margin-top:5mm;width:168mm;font-size:10.8pt">{d["example"]}</div>
      <div style="margin-top:8mm;font-family:Roboto Mono;font-size:7pt;letter-spacing:.16em;color:{RED};text-transform:uppercase">Where incidents go wrong</div>
      <div style="margin-top:2mm;border-bottom:.25mm solid rgba(247,246,248,.16)">{fl}</div>
      <div style="margin-top:9mm;font-family:Roboto Mono;font-size:7pt;letter-spacing:.16em;color:{SKY};text-transform:uppercase">The whole incident, in one platform</div>
      <div style="position:relative;display:flex;margin-top:4mm"><div style="position:absolute;left:7%;right:7%;top:2mm;border-top:.4mm solid rgba(22,161,237,.6)"></div>{lc}</div>
      <div style="margin-top:9mm;padding:5mm 6mm;border-left:1.2mm solid {RED};background:rgba(247,246,248,.05);font-size:10.6pt;line-height:1.55">Crises Control is an <b>Operational Incident Coordination Platform</b>. It helps organisations maintain operational control during incidents by combining alerting, coordination, execution, visibility and accountability in one platform.</div>''',
      dark=True, sec="Coordination, not just notification", bg=f'<div style="position:absolute;right:-78mm;top:-78mm;width:170mm;opacity:.35">{dial()}</div>'))
    # 2 scorecard (light)
    rows = "".join(f'''<div style="display:grid;grid-template-columns:24mm 1fr 30mm;gap:5mm;padding:2.4mm 0;border-top:.25mm solid #3A3A3A26;align-items:start">
      <div><div style="font-family:'Roboto Mono';font-size:6.6pt;letter-spacing:.08em;color:{RED}">0{i+1} · {STAGE[i]}</div><div style="font-weight:700;font-size:10.4pt;margin-top:.6mm">{n}</div></div>
      <div><div style="font-size:8.8pt;line-height:1.35;color:#0B223C">{q}</div><div style="font-size:7.9pt;line-height:1.35;color:#3A3A3A;margin-top:1mm"><span style="font-family:'Roboto Mono';font-size:6.6pt;letter-spacing:.1em;color:{BLUE}">GOOD LOOKS LIKE </span>{g}</div></div>
      <div style="display:flex;gap:2mm;padding-top:1mm">{"".join(f'<div style="width:5.6mm;height:5.6mm;border:.35mm solid #0B223C;border-radius:1.2mm;font-family:Roboto Mono;font-size:7pt;display:flex;align-items:center;justify-content:center;color:#3A3A3A">{k}</div>' for k in range(4))}</div></div>''' for i, ((n, q), g) in enumerate(zip(DIMS, d["good"])))
    bands = "".join(f'<div style="flex:1;padding:2.6mm 3.6mm;border-radius:2.4mm;background:{bg};color:{fg}"><div style="font-family:Roboto Mono;font-size:7.6pt;font-weight:500">{r}</div><div style="font-weight:700;font-size:9.8pt;margin-top:.8mm">{t}</div><div style="font-size:8pt;line-height:1.35;margin-top:.6mm;opacity:.85">{x}</div></div>'
                    for r, t, x, bg, fg in [("0 to 8", "Alerting only", "You can send messages. The response still depends on people and luck.", "#F7F6F8", "#0B223C"), ("9 to 16", "Coordinating in parts", "Some steps work. Gaps appear at night, at scale or when systems fail.", "#1179BB", "#FFFFFF"), ("17 to 24", "Coordinated and provable", "You can run the response and show exactly what happened.", "#0B223C", "#FFFFFF")])
    P.append(dict(body=s_hd(b, "Readiness assessment", f"How ready is your response?", f"Score each area from 0 (not in place) to 3 (fully in place) for your {d['short']} organisation, then add up the total.")
                  + f'<div style="margin-top:4mm;display:grid;grid-template-columns:24mm 1fr 30mm;gap:5mm" class="lab"><span>Area</span><span>The question</span><span>Score 0 to 3</span></div><div style="border-bottom:.25mm solid #3A3A3A26">{rows}</div><div style="display:flex;gap:3mm;margin-top:3.5mm">{bands}</div>',
                  dark=False, sec="Readiness assessment"))
    # 3 buyer's questions (light)
    q = "".join(f'<div style="padding:4.6mm 0;border-top:.25mm solid #3A3A3A26;display:grid;grid-template-columns:10mm 1fr;gap:3mm"><div style="font-family:Roboto Mono;font-size:9pt;color:{RED}">0{i+1}</div><div><div style="font-weight:700;font-size:11pt">{a}</div><div style="font-size:9.2pt;line-height:1.45;color:#3A3A3A;margin-top:1.2mm">{t}</div></div></div>' for i, (a, t) in enumerate(QS))
    P.append(dict(body=s_hd(b, "Buyer's guide", "Eight questions to ask any incident platform supplier", "Many tools can send an alert. These questions separate a notification tool from a platform that coordinates the whole response.")
                  + f'<div style="margin-top:7mm;columns:2;column-gap:10mm">{q}</div>', dark=False, sec="Buyer's guide"))
    # placement: playbooks put positioning before the platform pages and the tools after them; reports put all before Sources
    import ccuse
    uc = ccuse.page(b)
    if uc: P.insert(1, uc)
    if not any(p[2] == "Where Crises Control fits" for p in b.pages):
        import ccprac as _cp; _n = len(b.pages); _cp.capabilities_page(b, False, "What is standard, what is configured"); cap = b.pages.pop()
        P.insert(1, dict(body=cap[0], dark=False, sec=cap[2]))
    rd = next((i for i, pg in enumerate(b.pages) if "__READINESS__" in pg[0]), None)
    if rd is not None:
        sc = P.pop(2 if uc else 1)
        body = sc["body"].replace('<div class="ey">Readiness assessment</div>', '<div class="ey">Toolkit 01 · Readiness assessment</div>', 1)
        b.pages[rd] = (b.pages[rd][0].replace("__READINESS__", body),) + tuple(b.pages[rd][1:])
    plat = [i for i, p in enumerate(b.pages) if p[2] == "Where Crises Control fits"]
    src = next((t for t in b.toc if t[1] == "Sources"), None)
    if plat:
        ins(b, plat[0], [P[0]]); ins(b, plat[-1] + 2, P[1:], ("", "Use cases and buyer's guide" if rd is not None else "Use cases, readiness assessment and buyer's guide"))
    else:
        at = src[2] - 1 if src else len(b.pages) - 1
        ins(b, at, P, ("", "Coordination, use cases, readiness and buyer's guide"))

def s_hd(b, ey, title, lede): return b._hd(ey, title, lede)

def ins(b, at, pages, entry=None):
    k = len(pages)
    b.toc = [(n, t, p + k if p - 1 >= at else p) for n, t, p in b.toc]
    for j, p in enumerate(pages):
        b.pages.insert(at + j, (p["body"], p["dark"], p["sec"], True, p.get("bg", ""), False))
    if entry:
        b.toc.append((entry[0], entry[1], at + 1)); b.toc.sort(key=lambda t: t[2])
