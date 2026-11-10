"""Four pages added to every Crises Control playbook and report: positioning, scorecard, buyer's questions, tailored demo.
Content is written once here, with industry-specific lines in IND, and inserted by CCBook.build."""

DIMS = [("Alert", "Can you reach the right people on more than one channel within minutes, day or night?"),
        ("Acknowledge", "Do you know who has seen the alert, and does silence trigger escalation automatically?"),
        ("Escalate", "Are escalation paths set by role and time, not by whoever remembers who to call?"),
        ("Coordinate", "Is there one shared workspace and log for the incident, not scattered calls, chats and inboxes?"),
        ("Execute", "Are your procedures turned into owned tasks with deadlines that someone can track?"),
        ("See", "Can leaders see tasks, people, locations and blockers live, without having to ask?"),
        ("Prove", "Could you produce a timestamped timeline for a regulator, insurer or inquiry within a day?"),
        ("Rehearse", "Do you exercise the whole response, not just the call tree, at least once a year?")]

IND = {
 "Financial Services and Insurance": dict(
   short="financial services",
   example="When a cloud region fails at 07:00, sending the alert is the easy part. Staying within impact tolerance depends on who acknowledged, which workarounds started, what customers and supervisors were told, and whether you can prove it all afterwards.",
   good=["Incident team, executives and key suppliers reached by push, SMS and voice when email is down.",
         "Acknowledgement tracked against each important business service; no response escalates in minutes.",
         "Escalation tied to impact tolerance thresholds, not to individual memory.",
         "One incident log shared by IT, operations, communications and compliance.",
         "Workaround and recovery steps for each important business service run as owned tasks.",
         "A live view of services, tasks and teams that the executive can read without a briefing.",
         "A timeline that supports self-assessment and regulator questions, produced on request.",
         "Severe but plausible scenarios rehearsed end to end, including the loss of usual channels."],
   bring=["A cloud or payments outage that pushes an important business service towards its impact tolerance.",
          "A cyber incident that takes out email and chat, so you need out-of-band coordination.",
          "A critical supplier failure that you must manage, report and evidence."]),
 "Property, Housing and Facilities": dict(
   short="property and housing",
   example="When a fire alarm sounds in a high-rise at 02:10, a text to residents is minute one. Keeping everyone safe depends on which residents need help, which contractor is on the way, who changed the evacuation strategy, and a record you can stand behind later.",
   good=["Residents, staff and contractors reached on several channels, including people without smartphones.",
         "Acknowledgement tracked by block and by flat; vulnerable residents followed up first.",
         "Out-of-hours escalation to the duty manager and contractor is automatic.",
         "One log for the incident, shared by housing, repairs, the fire service liaison and communications.",
         "Awaab's Law and fire safety actions run as tasks with owners and deadlines.",
         "A live view of buildings, residents contacted and jobs outstanding.",
         "A defensible, timestamped record of every decision and message.",
         "Night-time scenarios rehearsed, including a change from stay put to evacuation."],
   bring=["A night-time fire in a high-rise block where the evacuation strategy changes.",
          "A flood, gas leak or power failure that affects vulnerable residents.",
          "A building management system fault or tampering incident that needs contractors at 3am."]),
 "Retail": dict(
   short="retail",
   example="When card payments fail on Black Friday, a message to stores is minute one. Trading through it depends on which stores acknowledged, who switched to the fallback, what customers were told, and an accurate picture for head office.",
   good=["Every store manager and on-call colleague reached in minutes, on more than one channel.",
         "Store-by-store acknowledgement, with escalation when a store stays silent.",
         "Escalation from store to region to head office runs by rule.",
         "One incident log shared by IT, store operations, loss prevention and communications.",
         "Fallback, lockdown and cold-chain procedures run as owned tasks in every store.",
         "Head office sees which stores are trading, closed or at risk, live.",
         "A timeline for insurers, the ICO or a post-incident review, ready the next day.",
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
         "Public protection procedures under Martyn's Law run as owned tasks.",
         "A live view of staff, areas secured and guests accounted for.",
         "A timeline that shows what the venue did and when, for the regulator or an inquiry.",
         "Shift-level drills, including the festive season and the busiest nights."],
   bring=["A lockdown or invacuation on your busiest night.",
          "A fire, medical emergency or spiking incident with guests to protect.",
          "A booking or payment system outage during the festive season."]),
 "Healthcare": dict(
   short="healthcare",
   example="When pathology goes down at 08:10, the alert is minute one. Keeping patients safe depends on who declared what, which staff came in, which downtime procedures started, what partners and patients were told, and a record for the after-action review.",
   good=["Clinical, on-call and support staff reached on several channels, at any hour.",
         "Call-in responses tracked, with escalation when key roles stay silent.",
         "Declaration and escalation follow the EPRR framework by role.",
         "One incident log shared by the incident team, clinical leads, partners and communications.",
         "Downtime procedures run as owned tasks in every affected department.",
         "A live view of staff mobilised, services affected and actions outstanding.",
         "A timeline that supports EPRR assurance, the ICO and the after-action review.",
         "Exercises that include a cyber attack on clinical systems, not just a major incident."],
   bring=["A cyber attack that takes a clinical system or pathology offline.",
          "A major incident that needs staff called in out of hours.",
          "A winter pressure or heatwave critical incident across several sites."]),
}

QS = [("Does it stop at the message?", "Ask what the platform does after the alert is sent: tasks, log, escalation, recovery."),
      ("Can it prove who acknowledged?", "Delivery is not acknowledgement. Ask how silence is detected and escalated."),
      ("Does it run your procedures?", "Ask whether your plans become owned tasks with deadlines, or stay as documents."),
      ("Is there one shared picture?", "Ask what leaders see live, and whether it needs someone to update a spreadsheet."),
      ("Does it work when your systems do not?", "Ask how teams coordinate if email, chat or your network is down."),
      ("Can frontline staff raise the alarm?", "Ask how a colleague on site escalates, with their location, in one action."),
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


def add_pages(b):
    from cckit import INK, SKY, BLUE, RED, MUTE, LOGO, CONTACT, dial
    d = IND.get(b.industry)
    if not d: return
    R, P = len(b.pages), []
    # 1 positioning (dark)
    st = "".join(f'''<div style="flex:1;position:relative;padding-top:7mm"><div style="position:absolute;left:0;right:0;top:1.6mm;border-top:.4mm solid {RED if i==0 else 'rgba(247,246,248,.25)'}"></div>
      <div style="position:absolute;left:0;top:0;width:3.6mm;height:3.6mm;border-radius:50%;background:{RED if i==0 else SKY}"></div>
      <div style="font-family:'Roboto Mono';font-size:7pt;letter-spacing:.14em;text-transform:uppercase;color:{SKY}">0{i+1} · {a}</div>
      <div style="font-weight:700;font-size:11pt;margin-top:2mm">{m}</div><div style="font-size:8.4pt;line-height:1.45;color:rgba(247,246,248,.75);margin-top:1.4mm;padding-right:4mm">{t}</div></div>''' for i, (a, m, t) in enumerate(STAGES))
    vs = "".join(f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;padding:3.4mm 0;border-top:.25mm solid rgba(247,246,248,.16);font-size:9.6pt"><div style="color:rgba(247,246,248,.7)">{a}</div><div>{c}</div></div>' for a, c in VS)
    P.append(dict(body=f'''<div class="ey">Why coordination, not just notification</div>
      <h1 style="margin-top:4mm;width:172mm;font-size:30pt">Alerting is minute one.<br><span style="color:{SKY}">Coordination is everything after.</span></h1>
      <div class="lede" style="margin-top:5mm;width:168mm;font-size:11pt">{d["example"]}</div>
      <div style="display:flex;margin-top:10mm">{st}</div>
      <div style="margin-top:10mm;display:grid;grid-template-columns:1fr 1fr;gap:8mm;font-family:'Roboto Mono';font-size:7pt;letter-spacing:.14em;text-transform:uppercase"><div style="color:rgba(247,246,248,.6)">A mass notification tool</div><div style="color:{RED}">An Operational Incident Coordination Platform</div></div>
      <div style="margin-top:2mm;border-bottom:.25mm solid rgba(247,246,248,.16)">{vs}</div>
      <div style="margin-top:7mm;font-size:10pt;line-height:1.5;color:rgba(247,246,248,.85)">Crises Control is an <b style="color:#fff">Operational Incident Coordination Platform</b>. Mass alerting is where it starts, not where it ends.</div>''',
      dark=True, sec="Coordination, not just notification", bg=f'<div style="position:absolute;right:-78mm;top:-78mm;width:170mm;opacity:.35">{dial()}</div>'))
    # 2 scorecard (light)
    rows = "".join(f'''<div style="display:grid;grid-template-columns:24mm 1fr 30mm;gap:5mm;padding:2.4mm 0;border-top:.25mm solid #3A3A3A26;align-items:start">
      <div><div style="font-family:'Roboto Mono';font-size:7pt;color:{RED}">0{i+1}</div><div style="font-weight:700;font-size:10.4pt;margin-top:.6mm">{n}</div></div>
      <div><div style="font-size:8.8pt;line-height:1.35;color:#0B223C">{q}</div><div style="font-size:7.9pt;line-height:1.35;color:#3A3A3A;margin-top:1mm"><span style="font-family:'Roboto Mono';font-size:6.6pt;letter-spacing:.1em;color:{BLUE}">GOOD LOOKS LIKE </span>{g}</div></div>
      <div style="display:flex;gap:2mm;padding-top:1mm">{"".join(f'<div style="width:5.6mm;height:5.6mm;border:.35mm solid #0B223C;border-radius:1.2mm;font-family:Roboto Mono;font-size:7pt;display:flex;align-items:center;justify-content:center;color:#3A3A3A">{k}</div>' for k in range(4))}</div></div>''' for i, ((n, q), g) in enumerate(zip(DIMS, d["good"])))
    bands = "".join(f'<div style="flex:1;padding:2.6mm 3.6mm;border-radius:2.4mm;background:{bg};color:{fg}"><div style="font-family:Roboto Mono;font-size:7.6pt;font-weight:500">{r}</div><div style="font-weight:700;font-size:9.8pt;margin-top:.8mm">{t}</div><div style="font-size:8pt;line-height:1.35;margin-top:.6mm;opacity:.85">{x}</div></div>'
                    for r, t, x, bg, fg in [("0 to 8", "Alerting only", "You can send messages. The response still depends on people and luck.", "#F7F6F8", "#0B223C"), ("9 to 16", "Coordinating in parts", "Some steps work. Gaps appear at night, at scale or when systems fail.", "#1179BB", "#FFFFFF"), ("17 to 24", "Coordinated and provable", "You can run the response and show exactly what happened.", "#0B223C", "#FFFFFF")])
    P.append(dict(body=s_hd(b, "Self-assessment", f"How coordinated is your response?", f"Score each area from 0 (not in place) to 3 (fully in place) for your {d['short']} organisation, then add up the total.")
                  + f'<div style="margin-top:4mm;display:grid;grid-template-columns:24mm 1fr 30mm;gap:5mm" class="lab"><span>Area</span><span>The question</span><span>Score 0 to 3</span></div><div style="border-bottom:.25mm solid #3A3A3A26">{rows}</div><div style="display:flex;gap:3mm;margin-top:3.5mm">{bands}</div>',
                  dark=False, sec="Self-assessment"))
    # 3 buyer's questions (light)
    q = "".join(f'<div style="padding:4.6mm 0;border-top:.25mm solid #3A3A3A26;display:grid;grid-template-columns:10mm 1fr;gap:3mm"><div style="font-family:Roboto Mono;font-size:9pt;color:{RED}">0{i+1}</div><div><div style="font-weight:700;font-size:11pt">{a}</div><div style="font-size:9.2pt;line-height:1.45;color:#3A3A3A;margin-top:1.2mm">{t}</div></div></div>' for i, (a, t) in enumerate(QS))
    P.append(dict(body=s_hd(b, "Buyer's guide", "Eight questions to ask any incident platform supplier", "Many tools can send an alert. These questions separate a notification tool from a platform that coordinates the whole response.")
                  + f'<div style="margin-top:7mm;columns:2;column-gap:10mm">{q}</div>', dark=False, sec="Buyer's guide"))
    # 4 tailored demo (dark)
    br = "".join(f'<div style="display:flex;gap:4mm;padding:3.6mm 0;border-top:.25mm solid rgba(247,246,248,.16);font-size:10pt;line-height:1.45"><span style="font-family:Roboto Mono;color:{RED}">0{i+1}</span><span>{t}</span></div>' for i, t in enumerate(d["bring"]))
    sh = "".join(f'<div style="display:flex;gap:4mm;padding:3.6mm 0;border-top:.25mm solid rgba(247,246,248,.16);font-size:10pt;line-height:1.45"><span style="font-family:Roboto Mono;color:{SKY}">{m}</span><span>{t}</span></div>' for m, t in [
        ("05 min", "We agree your scenario and the people involved."), ("10 min", "We run your first hour live: alert, acknowledgement and escalation."),
        ("10 min", "We turn your procedure into tasks and show the live picture leaders would see."), ("05 min", "We produce the timeline and talk through what it means for your plans.")])
    P.append(dict(body=f'''<div class="ey">Your tailored demonstration</div>
      <h1 style="margin-top:4mm;width:170mm;font-size:30pt">Bring your worst day.<br><span style="color:{SKY}">We will run it with you.</span></h1>
      <div class="lede" style="margin-top:5mm;width:165mm;font-size:11pt">A 30-minute session built around your own {d["short"]} scenario, not a standard product tour. You leave with a clearer view of your gaps, whether or not you go on to use Crises Control.</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10mm;margin-top:9mm"><div><div class="lab" style="color:{RED}">Bring a scenario like</div><div style="margin-top:2mm;border-bottom:.25mm solid rgba(247,246,248,.16)">{br}</div></div>
      <div><div class="lab" style="color:{SKY}">What the 30 minutes covers</div><div style="margin-top:2mm;border-bottom:.25mm solid rgba(247,246,248,.16)">{sh}</div></div></div>
      <div style="margin-top:10mm;border-radius:4mm;background:rgba(247,246,248,.06);border:.3mm solid rgba(247,246,248,.18);padding:7mm 8mm;display:flex;justify-content:space-between;align-items:center">
        <div><div style="font-weight:700;font-size:15pt">Request your tailored demo</div><div style="font-family:Roboto Mono;font-size:8.6pt;color:rgba(247,246,248,.85);margin-top:2.6mm;line-height:1.9">+44 (0) 20 8584 1385<br>contactus@crises-control.com<br>www.crises-control.com</div></div>
        <div style="background:{RED};color:#fff;border-radius:99px;padding:3.8mm 7mm;font-weight:700;font-size:10.5pt">Request a demo</div></div>''',
      dark=True, sec="Your tailored demonstration", bg=f'<div style="position:absolute;right:-70mm;bottom:-70mm;width:170mm;opacity:.35">{dial()}</div>'))
    # placement: playbooks put positioning before the platform page and the rest after it; reports put all four before Sources
    idx_platform = next((i for i, p in enumerate(b.pages) if p[2] == "Where Crises Control fits" or "Where Crises Control fits" in str(p[0])[:4000]), None)
    src = next((t for t in b.toc if t[1] == "Sources"), None)
    if idx_platform is not None:
        ins(b, idx_platform, [P[0]]); ins(b, idx_platform + 2, P[1:], ("", "Self-assessment and your demo"))
    else:
        at = src[2] - 1 if src else len(b.pages) - 1
        ins(b, at, P, ("", "Coordination, self-assessment and your demo"))

def s_hd(b, ey, title, lede): return b._hd(ey, title, lede)

def ins(b, at, pages, entry=None):
    k = len(pages)
    b.toc = [(n, t, p + k if p - 1 >= at else p) for n, t, p in b.toc]
    for j, p in enumerate(pages):
        b.pages.insert(at + j, (p["body"], p["dark"], p["sec"], True, p.get("bg", ""), False))
    if entry:
        b.toc.append((entry[0], entry[1], at + 1)); b.toc.sort(key=lambda t: t[2])
