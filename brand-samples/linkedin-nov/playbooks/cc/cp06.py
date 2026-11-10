from cckit import CCBook, S


def build():
    b = CCBook("Major Incident, Minute One", 6, "phone", "Healthcare", "14 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "For hospitals and health systems in the UK, US, EU and Middle East: the first hour of a major incident."
    b.art_cover("Crisis playbook · Healthcare", "Major incident,", "minute one.",
        "Ransomware on the laboratory system, a mass casualty surge at night, a cooling or power failure in a heatwave. How hospitals declare, call staff in, switch to downtime procedures and keep patients safe.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In healthcare, an IT incident becomes a patient safety incident within the hour.", [
        f"In June 2024, in the UK, a ransomware attack on Synnovis, the pathology provider for major hospitals in south east London, stopped normal blood testing. NHS England later reported that 10,152 acute outpatient appointments and 1,710 elective procedures had been postponed at the two most affected hospital trusts.{R(1)} A year later one of the hospitals confirmed that a long wait for a blood test result, caused by the attack, was one of the factors in a patient's death.{R(2)}",
        f"It is not only a UK story, and not only a cyber story. In May 2024, in the US, a cyber attack on Ascension, which operates 140 hospitals in 19 states, forced several hospitals to divert ambulances and moved staff onto paper records.{R(5)} In June 2026 an English hospital declared a critical incident when its cooling systems failed in a heatwave.{R(6)} Almost two years after the Synnovis attack, one UK provider was still working in business continuity for pathology.{R(3)}",
        "This playbook is for the people who carry the bleep when that happens, in hospitals and health systems in the UK, the US, Europe and the Middle East: emergency managers and business continuity leads, administrators and executives on call, clinical, nursing and digital leaders, and communications teams. It covers the first hour, the downtime that follows and the plan to be ready before the next one. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Executive summary")
    b.execsum("Declare early, reach the right people, keep care going without the systems.",
        ["Clinical care runs on systems, suppliers and utilities that the hospital does not fully control.",
         "Plans exist, but the first hour often depends on who happens to be on call and who answers.",
         "Clinical teams, management, digital teams and external partners work from different information when it matters most."],
        ["A cyber attack or IT failure that takes pathology, the patient record or prescribing offline, at the hospital or a supplier.",
         "A mass casualty incident or sustained surge that needs staff called in out of hours.",
         "Loss of power, water, cooling or medical gases to clinical areas.",
         "A long downtime: weeks on paper, results to back-enter and staff to rest."],
        ["Write declaration triggers and give named roles the authority to declare without waiting for certainty.",
         "Call staff in by role on several channels, and track who has acknowledged.",
         "Print, practise and time downtime procedures in every department, including transfusion.",
         "Put suppliers, the ambulance service and your regional health authority on your incident lists.",
         "Rehearse all three scenarios each year, and close every action from the review."],
        ["A declaration in agreed words within minutes, reaching wards and partners at the same time.",
         "One incident log and one actions board for clinical, management, digital teams and partners.",
         "Downtime running as owned tasks, with the time to the first paper result measured.",
         "Updates to staff and patients at fixed times until stand down, then a debrief within days."],
        support=["Crises Control is an Operational Incident Coordination Platform. Ping calls staff in by role by push, SMS, voice and email, and no reply escalates to a deputy under the rules you configure.",
                 "Incident Manager and Task Manager give one log and owned downtime tasks; Audit & Reporting keeps the timestamped record for your review and your regulator."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things decide how the first hour goes.", "Almost every hospital can send an alert. Far fewer can run an incident from first report to final review: declare it, mobilise the right people, keep care safe on paper and show what was done. The ones that cope best have rehearsed three simple things until they are habits.",
        [("bell", "Declare early, in agreed words", "Define incident levels and triggers in advance, name who can declare, and use the same words with staff and partners. Where your framework sets the wording, use it."),
         ("owner", "Know who is coming in", "Reach on-call staff, ward leaders and off-duty teams in minutes, and know who has acknowledged, who is on the way and who has not answered."),
         ("shield", "Make downtime safe", "Paper requests, manual result reporting, safe blood and clear handovers, practised before the systems fail, so patient care does not depend on the network or the plant room.")])
    b.statement("The network can go down. Patient care cannot.", "A cyber attack, a mass casualty incident or a failed power or cooling plant all end in the same place: clinicians working without the systems they rely on, and patients who need to be told what is happening.", "Introduction")

    # PART 01
    b.mark("01", "Declare and decide")
    b.opener("01", "Declare and<br>decide.", "Agree the words, the thresholds and who can say them, before the day you need them.", [("01", "Three incident levels, defined in advance"), ("02", "Why declaring early matters"), ("03", "Emergency preparedness rules by region"), ("04", "Reporting a cyber or data incident, by region")])
    b.table("Definitions", "Three incident levels, defined before you need them", "Names vary by country and framework. What matters is that everyone, from the ward to the board, means the same thing. Illustrative definitions: use your own framework's wording where one exists.", ["Level", "What it means", "Typical triggers"], [
        ("Business continuity incident", "Disruption that takes a service below an acceptable level and needs special arrangements until it recovers.", "One system or supplier down with a working fallback; planned downtime overrunning; a staffing gap in one area."),
        ("Critical incident", "Loss of the ability to deliver critical services, or a risk of harm to patients or staff, needing support from beyond the department or site.", "Pathology, the patient record or prescribing down across the hospital; suspected ransomware; power, water, cooling or medical gases lost to clinical areas."),
        ("Major incident", "An event with serious consequences that needs special arrangements by one or more emergency responder agencies, often multi-agency.", "A mass casualty incident; evacuation of a building; an incident affecting several hospitals or the wider community."),
        ("Declaring", "One agreed format: who declares, which level, at what time. Standard messages for standby, declared and stand down.", f"<b>United Kingdom:</b> NHS England's EPRR Framework defines all three levels and the wording “Critical Incident declared by (organisation)”.{R(7)}")], "Declare and decide", "34mm 1fr 1fr")
    b.essay("Declare and decide", "Why the first decision is the hardest, and the most important", [
        "Nobody wants to declare too soon. A critical incident is a public signal, it pulls in partners and it can feel like an admission. So the first hour often goes on fixing the problem quietly, while wards improvise and the executive on call hears about it second hand.",
        f"Declaring is how help arrives. <b>United Kingdom:</b> NHS England's framework describes a critical incident as principally an internal escalation response to disruption that will affect the ability to deliver safe patient care.{R(7)} <b>United States:</b> many hospitals organise their response with the Hospital Incident Command System (HICS), an incident command framework with job action sheets for each role.{R(12)} The labels differ; the purpose is the same.",
        "Declaring is also how the right people start moving. An administrator on call who declares a business continuity incident at 08:15 can start the downtime procedures, call in the laboratory and digital leads and warn the emergency department. One who waits for certainty at 10:00 is two hours behind the wards.",
        "So set the triggers in advance. Loss of a clinical system that supports results, prescribing or patient flow for more than a set time. Any suspected cyber attack on a clinical system. Loss of power, water, cooling or medical gases to a clinical area. A surge that takes the hospital to its highest escalation level. Write them down, give named roles the authority to declare and tell them they will never be criticised for declaring early and standing down.",
        f"Use the agreed words, and share facts in a structured form such as METHANE or SBAR, which the NHS framework sets out with an example for a cyber incident.{R(7)} Then tell your own staff, in the same words, at the same time. A declaration that reaches the regional health authority before it reaches the wards has gone the wrong way round."],
        "Declare and decide", "Declaring is how you get the right people moving. Waiting for certainty puts you two hours behind the wards.")
    b.regions("Regional notes", "Emergency preparedness: what applies where", "Hospitals everywhere are expected to plan, train and exercise for emergencies. The detail, and who checks it, differs by country.", [
        ("United Kingdom", f"<b>England:</b> NHS-funded organisations work to NHS England's EPRR Framework and assess themselves each year against the EPRR Core Standards; the NHS Standard Contract requires providers to follow EPRR guidance.{R(7)} Under the Civil Contingencies Act 2004, NHS England, integrated care boards and foundation trusts providing A&E or ambulance services are Category 1 responders.{R(8)}",
         "Map your triggers to the EPRR definitions and keep the evidence for the annual assurance return. Scotland, Wales and Northern Ireland have their own arrangements."),
        ("United States", f"Hospitals in Medicare and Medicaid must meet the CMS emergency preparedness rule, 42 CFR 482.15: an all-hazards risk assessment and plan, policies, a communication plan, and training and testing, reviewed at least every 2 years, with exercises at least twice a year.{R(10)} The Joint Commission's revised Emergency Management standards apply to accredited hospitals from July 2022.{R(11)}",
         f"The rule expects drills, exercises and real events to be analysed and documented, and the plan revised. Many hospitals use HICS to run the response.{R(10,12)}"),
        ("European Union", f"Hospital preparedness is set nationally, and systems vary. The CER Directive (EU) 2022/2557 covers health among its sectors: Member States had to transpose it by 17 October 2024 and identify critical entities by 17 July 2026. Critical entities must take resilience measures and notify incidents.{R(15)}",
         "Ask your national authority whether your hospital is, or serves, a designated critical entity, and align your plan with national emergency arrangements."),
        ("Middle East (UAE and Saudi Arabia)", f"<b>Dubai:</b> the DHA framework for healthcare emergencies, effective 14 January 2025, requires licensed facilities to run an annual hazard vulnerability analysis, keep a 24/7 contact for DHA, give hospitals an emergency operations centre and hold at least one exercise a year.{R(16)} <b>Abu Dhabi</b> launched a healthcare business continuity standard in May 2025.{R(17)}",
         f"<b>Saudi Arabia:</b> CBAHI accreditation is linked to hospital licence renewal.{R(19)} JCI surveys use its 8th edition hospital standards from 1 January 2025.{R(20)}")], "Declare and decide")
    b.regions("Regional notes", "Reporting a cyber or data incident: the clocks differ", "A cyber attack on a clinical system is an operational incident and, often, a reportable one. Know which clock starts, who files and to whom, before the day.", [
        ("United Kingdom", f"<b>England:</b> NHS trusts, foundation trusts, integrated care boards and certain independent providers are operators of essential services under the NIS Regulations 2018. They report network and information system incidents through the Data Security and Protection Toolkit within 72 hours of becoming aware.{R(9)}",
         "Name who files the report and when the 72-hour clock starts. Personal data breaches can also need a separate report to the data protection regulator."),
        ("United States", f"Under the HIPAA Breach Notification Rule, covered entities notify affected individuals without unreasonable delay and no later than 60 calendar days after discovering a breach of unsecured health information; breaches affecting 500 or more people are reported to HHS at the same time.{R(13)}",
         "A ransomware attack can be both a downtime and a breach. Bring privacy, legal and digital leads into the incident team in the first hour."),
        ("European Union", f"Under NIS2, health is a sector of high criticality. Entities in scope send an early warning within 24 hours of becoming aware of a significant incident, an incident notification within 72 hours and a final report no later than one month later. Member States had to transpose NIS2 by 17 October 2024.{R(14)}",
         "The detail is in national law. Check whether your hospital is an essential or important entity, and who your CSIRT or competent authority is."),
        ("Middle East (UAE)", f"Requirements are set nationally and, in the UAE, by each health regulator. <b>Dubai:</b> the DHA framework requires facilities to name a focal point, preferably from incident command, and keep a phone number and email that reach them 24/7 during emergencies.{R(16)}",
         "Confirm with your health regulator and national cyber security authority which incidents you must report, to whom and how fast. Do not assume another region's clocks apply.")], "Declare and decide")

    # PART 02
    b.mark("02", "Incident scenarios")
    b.opener("02", "Incident<br>scenarios.", "Three scenarios every hospital should plan for: the systems go down, the patients arrive, the building fails.", [("01", "A severity ladder for the first hour"), ("02", "Three scenarios at a glance"), ("03", "Cyber or IT downtime: the first hour, team by team"), ("04", "Cyber, mass casualty, utility failure: where each fails"), ("05", "Calling staff in and tracking outstanding actions")])
    b.severity("Severity", "A hospital severity ladder for the first hour", "An internal scale for alerting and staffing. It sits alongside your formal declarations, not instead of them. If in doubt, grade up and step down later.", [
        (1, "Major or critical, hospital wide", "Loss of pathology, the patient record or prescribing across sites; suspected ransomware; mass casualty incident declared by you or the ambulance service; loss of power, water or medical gases to clinical areas.", "Executive on call, incident commander, all clinical leads, digital, estates, comms; regional health authority told at once.", "Push, SMS and voice · ack in 5 min"),
        (2, "Critical in one service or site", "One site's emergency department, theatres or diagnostics unable to work safely; a critical system down beyond the agreed time; surge at the highest level with patient safety risk.", "Administrator and manager on call, service and site leads, digital, comms.", "Push and SMS · ack in 10 min"),
        (3, "Business continuity incident", "Planned downtime overrunning; a single system or equipment failure with a working fallback; a staffing gap in one area; supplier outage.", "Manager on call, service leads, emergency management lead.", "Push and email · ack in 30 min"),
        (4, "Watch and prepare", "Supplier warning, heat or cold alert, cyber advisory affecting your systems, rising pressure, a major event in your area.", "Emergency management lead, digital, estates, site team.", "Email and app · no ack needed")], "Incident scenarios")
    b.table("Scenarios", "Three scenarios at a glance", "Different causes, the same first hour: declare, mobilise, switch to downtime, inform. Illustrative; adapt the triggers and owners to your hospital.", ["Scenario", "Typical triggers", "First decisions and who makes them", "Downtime and recovery"], [
        ("1 · Cyber attack or clinical IT downtime", "Laboratory, record, imaging or prescribing systems fail; ransom note; a supplier reports an attack.", "Incident commander grades and declares; digital lead isolates systems; transfusion lead sets the O type rule.", "Paper requests and phoned results; reporting clocks start; restore only when declared safe; results back-entered."),
        ("2 · Mass casualty or surge", "Ambulance service alert of a major incident; sudden arrivals; sustained demand at the highest escalation level.", "Emergency department lead and executive on call declare; incident commander opens the command centre and stands down planned care.", "Role-based call-in; beds and theatres released; blood stock checked; staff rested and rotated."),
        ("3 · Utility or building failure", "Loss of power, water, cooling or medical gases; generator or chiller fault; flood or fire in a plant room.", "Estates lead advises; executive on call declares and decides whether to move patients or lists.", "Generator, gas and temperature checks at set times; affected services moved; servers and devices checked before restart.")], "Incident scenarios", "34mm 1fr 1fr 1fr")
    b.firsthour("The first hour", "Scenario 1, Monday 08:10: the lab goes dark", "An illustrative acute hospital. Treat it as a cyber attack until proved otherwise.", [
        ("T+00:00", "Laboratory staff report the system is down", "Lab manager calls the site manager and the digital service desk. No results are going out.", "Lab manager", 1),
        ("T+00:05", "Manager on call grades it SEV 1", "Business continuity incident declared. Executive on call and incident commander alerted. Digital isolates systems.", "Manager on call", 1),
        ("T+00:10", "Call-in alert sent", "Incident team, laboratory, transfusion, emergency department, theatres, critical care, comms. Reply with arrival time; silence escalates to a deputy at 10 minutes.", "Site manager", 1),
        ("T+00:15", "Downtime procedures start", "Paper requests and phoned urgent results; transfusion to its downtime plan. Clinical leads review today's planned care.", "Laboratory lead", 2),
        ("T+00:20", "Reporting clocks start", "Digital and privacy leads note the time of awareness and start the cyber and data reporting routes that apply to you (see Part 01).", "Chief information officer", 2),
        ("T+00:30", "Critical incident declared", "Command centre opened. Regional health authority told; testing mutual aid requested from a partner laboratory.", "Executive on call", 1),
        ("T+01:00", "Messages out, first meeting held", "Holding lines to staff, today's patients and the emergency department. Facts in METHANE or SBAR form; decisions logged; open actions reviewed at each meeting.", "Incident commander", 3)], "Incident scenarios")
    b.swimlane("Across the teams", "The same hour, team by team: where it goes wrong", "Clinical teams, incident command, digital, partners and comms in the laboratory outage. Red cards are the points where responses commonly break down; diamonds are decisions.",
        ["Clinical teams", "Site management and incident command", "Digital and IT", "Partners: health authority, ambulance, supplier", "Comms"],
        ["T+0", "T+10 min", "T+30 min", "T+1 hour", "T+4 hours", "Day 2 on"], [
        (0, 0, "Lab reports results not flowing", "act"),
        (0, 1, "Wards keep sending electronic requests", "risk"),
        (0, 2, "Paper requests; urgent results phoned", "act"),
        (0, 3, "Clinical leads triage today's planned care", "dec"),
        (0, 4, "Results logged on paper for back-entry", "mon"),
        (0, 5, "Same staff on paper for days, no rota change", "risk"),
        (1, 0, "Manager on call grades SEV 1", "dec"),
        (1, 1, "Call-in sent; acknowledgements tracked by role", "mon"),
        (1, 2, "Executive on call declares critical incident", "dec"),
        (1, 3, "One log; actions owned and timed", "mon"),
        (1, 4, "Fixed meeting and situation report times", "act"),
        (1, 5, "Recovery cell and second shift planned", "act"),
        (2, 0, "Service desk logs a fault, not an incident", "risk"),
        (2, 1, "Systems isolated; reporting clocks noted", "act"),
        (2, 2, "Out-of-band channel confirmed for staff", "act"),
        (2, 4, "Restore only when declared safe", "dec"),
        (2, 5, "Back-entry checked against paper logs", "mon"),
        (3, 0, "Supplier's incident call leaves out the hospital", "risk"),
        (3, 2, "Health authority told; mutual aid asked", "act"),
        (3, 3, "Ambulance service warned of possible diverts", "act"),
        (3, 4, "Mutual aid turnaround tracked by batch", "mon"),
        (4, 1, "Staff hear first on personal messaging apps", "risk"),
        (4, 2, "Holding line to staff and switchboard", "act"),
        (4, 3, "Patients booked today sent SMS", "act"),
        (4, 4, "Updates at fixed times until stand down", "mon")], "Incident scenarios",
        "Illustrative. Most failures sit at hand-offs between teams, not inside them. Give every lane the same incident, the same log and the same update times, and agree in advance how staff will talk if email and chat cannot be trusted.")
    b.usecase("In practice", "Three scenarios, three first hours", [
        ("server", "Scenario 1 · Acute hospital, three sites", "Cyber attack at a laboratory partner", [("Where it fails", "The laboratory is run by a partner; nobody at the hospital was on its call list, so wards heard first."), ("Who decides", "The executive on call declares; the transfusion lead authorises O type use, agreed with the blood bank."), ("What happens", "A joint call-in list and shared incident log with the partner; downtime forms printed on every ward."), ("How it is monitored", "Time from first report to first paper result, measured in a joint exercise and again on the day.")]),
        ("truck", "Scenario 2 · Regional trauma centre", "Mass casualty incident at night", [("Where it fails", "The ambulance alert reaches the emergency department, but calling in theatres, critical care and the blood bank relies on a phone tree."), ("Who decides", "The emergency department lead and executive on call declare; the incident commander opens the command centre."), ("What happens", "Role-based call-in: coming, later, not available. Planned lists stood down; beds and theatres updated at set times."), ("How it is monitored", "Acknowledgements by role against the casualty estimate, staff arrival times and beds released.")]),
        ("power", "Scenario 3 · Hospital with a shared plant room", "Cooling and power failure in a heatwave", [("Where it fails", f"Theatres, scanners and the server room shared one cooling plant, as one English hospital found in June 2026.{R(6)}"), ("Who decides", "The estates lead advises; the executive on call declares and decides whether to move lists and patients."), ("What happens", "Lists moved to a partner site; generator, fuel and medical gas checks run as tasks."), ("How it is monitored", "Temperatures, generator and gas supply checked at set times against triggers.")])], "Incident scenarios")
    b.steps("Call-in", "Five rules for calling staff in", "Most hospitals have a cascade. Few know, in real time, who has answered. It matters most in a mass casualty incident at 03:00.", [
        ("Alert by role, not by name", "Lists are built around roles and rotas: the on-call transfusion scientist, the theatre coordinator, the nurse in charge. People change; roles do not."),
        ("Ask for an answer, not a read receipt", "Every call-in asks a question: available now, available later, not available. Silence after the set time escalates to a deputy, under rules agreed in advance."),
        ("Use more than one channel", "Push, SMS and voice. If the incident is a cyber attack, assume hospital email and chat may be down or untrusted."),
        ("Protect people off duty", "Ask for what you need and no more. Track hours so the people who come in at 08:30 are not still there at midnight. Plan the second shift in the first hour."),
        ("Stand down in the same way", "Release staff with a message as clear as the one that called them in, and tell them when the hot debrief will be.")], "Incident scenarios",
        "If you cannot see who has acknowledged within ten minutes, you do not yet know whether you have a response team.")
    b.tracker("Outstanding actions", "Scenario 1, day one, 16:00: the actions board", "Illustrative board for the laboratory outage, reviewed at every incident meeting. Overdue and blocked items go straight to the executive on call.", [
        ("Paper request forms on every ward", "Laboratory lead", "Day 1 10:00", "Done", "Runner signs off each ward"),
        ("O type authorisation rule confirmed", "Transfusion lead", "Day 1 09:00", "Done", "Decision and authoriser in the log"),
        ("Patients booked today contacted", "Outpatients manager", "Day 1 11:00", "Done", "SMS delivery and call log"),
        ("Mutual aid testing route agreed", "Incident commander", "Day 1 12:00", "In progress", "Samples sent against results back"),
        ("Cyber and data incident reports filed", "Chief information officer", "Per your clocks", "In progress", "Reference numbers in the log"),
        ("Check-ins for community and lone staff", "Community manager", "Each shift", "Overdue", "Missed check-ins escalated, not waited on"),
        ("Second shift and welfare plan", "Incident commander", "Day 1 14:00", "Overdue", "Hours worked against the rota"),
        ("Results back-entry plan", "Digital lead", "Day 3", "Blocked", "Waiting for assurance systems are clean"),
        ("Situation report to the health authority", "Incident commander", "Daily 16:00", "Open", "Sent from the log, not from memory")], "Incident scenarios",
        "Every action has one owner, a due time and a way to check it is done. If an action has no check, nobody will know it has stalled. The incident commander owns the board and reviews it at every meeting and handover; closed actions stay visible for the debrief.")

    # PART 03
    b.mark("03", "Keep patients safe")
    b.opener("03", "Keep patients<br>safe.", "Downtime, partners, patients and staff, from the first hour to the last debrief.", [("01", "Downtime that works, department by department"), ("02", "A downtime checklist and a results log"), ("03", "Partners and long incidents"), ("04", "Your plan: first week, month and quarter")])
    b.essay("Keep patients safe", "Downtime procedures: the plan you hope never to use", [
        "Most clinical areas have a downtime folder. The question is whether anyone has opened it this year. The test is simple: can a ward request an urgent blood test, receive the result and act on it safely with no computers at all? If the answer depends on one person who knows how, it is not a procedure.",
        f"Downtime can last far longer than plans assume. <b>United Kingdom:</b> after the Synnovis attack, one provider estimated in early 2026 that entering 161,560 pathology reports into patient records had been delayed, and it had recorded 122 patient safety incidents involving incorrect, unavailable or delayed results.{R(3)} <b>United States:</b> Ascension told patients it expected to rely on downtime procedures for some time.{R(5)} Recovery has its own risks: results back-entered weeks later, duplicate records and patients lost to follow-up.",
        f"Blood is the sharpest edge. When blood cannot be matched in the usual way, transfusion falls back on O type blood, and stocks come under pressure. Every transfusion laboratory needs a downtime plan agreed with clinicians, including who authorises O type use.",
        "Good downtime procedures are short, printed and practised. They name the forms, the phone numbers, the runners and the order of priority: emergency department, critical care, maternity, theatres, then the rest. They say how results will be checked and entered when systems return. And they are tested with the people who will use them, not just the people who wrote them.",
        "Treat a cyber attack differently from a power cut in one way: you may not be able to trust the systems even when they come back. Keep digital and clinical leads in the same incident meeting, and decide your out-of-band channel now, before staff choose one for you."],
        "Keep patients safe", "Can a ward request an urgent blood test, get the result and act on it safely with no computers at all?")
    b.table("Downtime checklist", "Downtime procedure checklist by department", "Check each folder before the day and use it as the switch-over list on the day, in this order. It applies whether the cause is cyber, a supplier or the plant room.", ["Department", "On switching to downtime", "Before systems come back"], [
        ("Emergency department", "Paper triage and requests; urgent results phoned to a named number.", "Every paper request matched to a result; discharges reviewed."),
        ("Critical care", "Paper charts; blood gases and infusions logged by hand.", "Charts reconciled and entered, checked by a second person."),
        ("Maternity", "Paper notes; urgent bloods phoned; transfusion route confirmed.", "Results confirmed in the record; babies linked to the right mother."),
        ("Theatres", "Lists reviewed by clinical leads; cases needing blood held unless authorised.", "Cancelled patients rebooked by clinical priority."),
        ("Laboratory and transfusion", "Downtime plan started; manual reporting; O type use authorised by a named clinician.", "Results back-entered and validated; duplicates resolved."),
        ("Pharmacy", "Paper prescribing and dispensing; high-risk medicines double-checked.", "Prescriptions and administration entered; allergies re-confirmed."),
        ("Imaging", "Paper requests; urgent reports phoned; images held locally where safe.", "Reports matched to requests and to the right patient."),
        ("Wards", "Downtime folder opened; result phone numbers on display.", "Paper records entered; results chased before discharge.")], "Keep patients safe", "40mm 1fr 1fr")
    b.form("Results log", "Downtime results and back-entry log", "One sheet per department, kept by the nurse in charge. Every result received on paper or by phone is written here, then entered and checked when systems return.",
        [("Time", 0.8), ("Patient (ID number)", 1.4), ("Test", 1.1), ("Result received from", 1.3), ("Given to and acted on by", 1.5), ("Entered on system (date, initials)", 1.4), ("Checked by", 1)], "Keep patients safe", rows=16,
        example=["09:42", "TEST-000018", "Potassium", "Lab, ext. 4412, A.B.", "Ward 7 doctor; repeat ordered", "Day 3, C.D.", "E.F."],
        note="Illustrative example row; the identifier is not a real patient. Keep the log with the patient's paper notes. A result is only closed when it has been entered on the system and checked by a second person.")
    b.grid("System partners", "Who needs to hear from you, and when", "A declared incident is rarely yours alone. Agree these routes in advance and test them in exercises.", [
        ("bell", "Regional health authority", f"Tell your health authority or commissioner when you declare, in the agreed format. <b>United Kingdom:</b> the integrated care board, which reports to NHS England through regional on-call.{R(7)}"),
        ("truck", "Ambulance service", "If you need diverts or redirection, say so early, and tell them again when you can accept patients normally."),
        ("server", "Suppliers and partners", "Laboratory, imaging, patient record and facilities partners belong on your call-in lists, and you on theirs."),
        ("eye", "Primary care and the public", "Family doctors, care homes, pharmacies and patients need to know what still works and where to go instead.")], "Keep patients safe",
        "Cyber incidents also start regulatory clocks: see the regional notes in Part 01 for who reports what, and how fast.")
    b.compare("Long incidents", "Heat, surge and the incident that does not end", "Many healthcare incidents are rising tides, not explosions. They need a different rhythm.", ["Pressure", "What often happens", "What good looks like"], [
        ("Seasonal surge", "Escalation drifts to the highest level without a declared incident or extra staff.", "Triggers that link your escalation levels to the severity ladder and call-in lists."),
        ("Heat", "Chillers and server rooms fail together; theatres and scanners stop.", f"Temperature triggers, cooling checks and a plan for diagnostics, as one English hospital learned in June 2026.{R(6)}"),
        ("Long cyber recovery", "Staff run on paper for weeks with no rota change or welfare plan.", "A recovery cell, shift patterns, welfare checks and a plan for back-entering results."),
        ("Lone and community staff", "Visits continue with no way to raise an alarm if systems are down.", "Check-in times, one-touch alarms and visit lists printed before each shift."),
        ("Communication fatigue", "Updates stop once the crisis feels normal.", "Fixed update times for staff and patients until stand down.")], "Keep patients safe")
    b.table("Your plan", "First week, first month, first quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("First week", "Write declaration triggers and who can declare. Check call-in lists by role, with tested numbers for every on-call rota.", "Executive lead for emergency preparedness"),
        ("First week", "Confirm the out-of-band channel if email and chat are lost. Print downtime forms for every clinical area.", "Chief information officer"),
        ("First month", "Agree downtime plans with laboratory, transfusion, imaging and pharmacy partners, including results back-entry.", "Chief medical officer"),
        ("First month", "Load the communication templates. Set a check-in rule for community and lone staff.", "Head of comms; chief nurse"),
        ("First month", "Swap incident contacts with every clinical supplier, the ambulance service and your health authority.", "Chief operating officer"),
        ("First quarter", "Link escalation levels, heat and cold alerts and generator and gas checks to the severity ladder.", "Emergency management lead; estates"),
        ("First quarter", "Run a no-notice call-in test and a cyber downtime exercise with a key supplier. Time the first paper result.", "Emergency management lead"),
        ("First quarter", "Report results, gaps and dated actions to the board, alongside your regulatory or accreditation assurance.", "Executive lead for emergency preparedness")], "Keep patients safe", "30mm 1fr 44mm")

    # PART 04
    b.mark("04", "Practical toolkit")
    b.toolkit_index()
    b.readiness()
    b.raci("Responsibilities", "Who does what in a critical incident", "One accountable owner for every decision. Adapt the roles to your own on-call and incident command structure; clinical leads include laboratory, transfusion, emergency department, theatres and nursing.",
        ["Executive on call", "Incident commander", "Clinical leads", "Digital and IT", "Comms", "Health authority and partners"], [
        ("Grade the incident and call staff in", ["I", "A", "C", "C", "I", ""]),
        ("Declare a critical or major incident", ["A", "R", "C", "C", "I", "I"]),
        ("Start downtime procedures in each department", ["I", "A", "R", "C", "", ""]),
        ("Isolate systems and file cyber and data reports", ["I", "C", "I", "A", "", "I"]),
        ("Prioritise care: what is cancelled, diverted or protected", ["A", "R", "R", "I", "I", "C"]),
        ("Authorise O type blood use under downtime", ["I", "I", "A", "", "", "C"]),
        ("Request mutual aid and ambulance diverts", ["A", "R", "C", "", "", "R"]),
        ("Messages to staff, patients and the public", ["A", "C", "C", "I", "R", "I"]),
        ("Decide when systems are safe to restore", ["A", "C", "C", "R", "I", "I"]),
        ("Back-enter and check results recorded on paper", ["I", "A", "R", "R", "", ""]),
        ("Stand down and hold the hot debrief", ["A", "R", "C", "C", "C", "I"])], "Practical toolkit",
        "Illustrative. Check that every row has exactly one A, that the A can be reached at 03:00, and that a named deputy is on the call-in list for each role.", tool=True)
    b.decisionlog("Every decision, who made it and why", "Kept by the incident loggist from the moment of declaration. Clinical decisions made under downtime, such as O type use, belong here as well as in the patient record.",
        ("08:52", "Authorise O type red cells for emergency use while crossmatch is unavailable", "Wait for manual crossmatch; transfer the patient; O type use", "Transfusion lead, with the emergency department consultant", "Electronic crossmatch down; patient bleeding; blood bank confirmed stock", "Log entry 14; blood bank stock check"))
    b.escalation("Escalation", "How an incident climbs, and who decides at each step", "From the first report on a ward to a system-wide response. Times are illustrative: set your own and write them into the plan. Never wait at a level because the next one feels too big.", [
        ("Department response", "A system is slow or failing in one service, with a working fallback. Patient care is not yet affected.", "Department lead, digital service desk, site manager.", "Department or site manager. Logs the fault as a possible incident, not a ticket.", "no fix in 30 minutes, care is affected or a cyber cause is possible"),
        ("Business continuity incident", "A clinical system or utility is down beyond the agreed time, or special arrangements are needed. SEV 3 on the ladder.", "Manager on call, service leads, digital, estates, emergency management lead. Call-in by role, with acknowledgement.", "Manager on call declares and starts downtime procedures.", "critical services are lost, people are at risk or ransomware is suspected"),
        ("Critical incident", "Loss of critical services or risk of harm; suspected cyber attack on a clinical system. SEV 2 or SEV 1.", "Executive on call, incident commander, clinical leads, comms; health authority told at once.", "Executive on call declares, in the agreed words, and opens the command centre.", "other hospitals are affected, casualties are arriving or help is needed from outside"),
        ("System or major incident", "Several providers affected, mutual aid needed, ambulance diverts, or a major incident declared.", "Regional health authority, ambulance service, suppliers, emergency services as needed.", "Your executive still decides for your hospital. The health authority coordinates the system and mutual aid.", "")], "Practical toolkit",
        f"Notify your regional health authority when you declare. <b>United Kingdom:</b> notify the integrated care board, which reports to NHS England through regional on-call.{R(7)} Step down as deliberately as you stepped up, with a message at each level.", tool=True)
    b.messages("Messages", "Six messages ready to send", "Short, specific and honest. Fill the brackets, do not speculate on cause, and always give the time of the next update.", [
        ("SMS", "On-call staff", "[Hospital] critical incident: lab systems down. Incident team to [room] now. Reply 1 coming, 2 later, 3 not available. Next update 09:00.", "Send by role. Escalate no reply after 10 minutes."),
        ("Push", "All clinical staff", "Laboratory systems unavailable. Use paper request forms and phone urgent results via [extension]. Transfusion is on downtime procedures. Do not use [system] until told. Update at 09:30.", "Pin it in the app; repeat at each handover."),
        ("SMS", "Patients booked today", "[Hospital]: an IT problem is affecting blood tests. Please attend as planned unless we contact you. Info: [web page]. Do not reply.", "Approved by clinical leads first."),
        ("Email", "Health authority and regulator", "Critical incident declared by [hospital] at [time]: [system] unavailable, cause under investigation. Patient impact: [summary]. Reports filed: [ref]. Requests: [mutual aid]. Next update [time].", "From the incident log, not from memory."),
        ("Email", "Suppliers and partner laboratories", "[Hospital] critical incident since [time]. Please send your incident lead to our call at [time] and route urgent samples via [route]. Contact: [name, number].", "Agree the joint log and update times on the first call."),
        ("Web and media", "Public holding statement", "We have declared a critical incident because of an IT problem affecting laboratory services. Emergency care is open. For non-urgent needs, please use your usual doctor or pharmacy. We will update this page at [time].", "Same words on the switchboard message.")], "Practical toolkit", tool=True)
    b.exercise("Tabletop exercise", "Exercise: the lab goes dark", "A discussion exercise built on Scenario 1 in this playbook. Read each inject aloud, give the room five minutes, and record decisions and gaps as you go. Run Scenarios 2 and 3 the same way.", [
        ("Duration", "Two and a half hours, plus a 30-minute hot debrief"),
        ("Participants", "Executive and manager on call, laboratory, transfusion, emergency department, digital, comms, health authority liaison, supplier"),
        ("Objective", "Test declaration, call-in and the first paper result with no clinical systems"),
        ("Facilitator", "Emergency management lead, with an observer timing each decision")], [
        ("00:00", "Monday 08:10. The lab manager reports the laboratory system is down. A ransom note is found on a server.", "Who grades it, and how? Who is called first? What do wards do right now?"),
        ("00:15", "Ten minutes after the call-in, the transfusion on-call and the theatre coordinator have not replied.", "Who are the deputies? How do you know, now, who is coming in?"),
        ("00:30", "Digital advise that hospital email and chat cannot be trusted.", "What is the out-of-band channel? Which reports are due, to whom, and by when?"),
        ("00:50", "The emergency department has a patient with major bleeding. Electronic crossmatch is unavailable.", "Who authorises O type blood, how quickly, and where is it recorded?"),
        ("01:15", "A local journalist calls. Patients are posting about cancelled appointments.", "Who approves the holding line? What do today's patients hear, and from whom?"),
        ("01:45", "The supplier says full restoration will take weeks.", "Who runs recovery? What changes for the second shift, mutual aid and results back-entry?")], "Practical toolkit",
        "Measure three times: to grade the incident, to hear back from every key role, and to the first paper result. Put each gap on the actions board with an owner.", tool=True)
    b.pir("Post-incident review", "Post-incident review template", f"Hot debrief within 48 hours of stand down, then a structured review. <b>United Kingdom:</b> the EPRR framework expects a structured debrief within 28 days.{R(7)} <b>United States:</b> CMS expects real events and exercises to be analysed and documented.{R(10)}", [
        ("What happened, and when", "The timeline from first report to stand down, taken from the incident log, not from memory."),
        ("Declaration and decisions", "Were the triggers clear? Who declared, at what time, and was it early enough? Who decided what?"),
        ("Call-in and acknowledgement", "How long to reach, and hear back from, each key role? Who was not reached, and why?"),
        ("Downtime procedures", "Did each department switch to paper safely? How long to the first paper result?"),
        ("Patient safety", "Incidents reported, delays to care and results, harm reviews started, patients needing follow-up."),
        ("Partners and regulators", "Did the health authority, ambulance service, suppliers and regulators hear in time, in the agreed words?"),
        ("Staff, patients and the public", "Were updates on time and consistent? Which channels worked? How were staff looked after?"),
        ("Actions, owners, dates", "What changes, who owns each one and by when. Add them to the actions board and the board report.")], "Practical toolkit", tool=True)

    b.mark("", "Questions, checklist and glossary")
    b.questions("For leaders", "Questions for your executive team", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["Who can declare a critical incident tonight, and do they know the triggers?", "How long would it take to know who is coming in after a call-in?", "Could each ward get an urgent blood result with no computers?"]),
        ("Partners and people", ["Are our laboratory, imaging and patient record suppliers on our incident call lists, and are we on theirs?", "Which cyber and data reports would we owe, to whom, and by when?", "Who looks after the people who worked the first twelve hours?"])], "Questions and checklist")
    b.checklist("Checklist", "Ready for minute one?", "Tick what is true today. Anything blank is your next action.", [
        ("Declaration triggers written and owned", "Using your framework's definitions and standard formats."),
        ("Call-in lists by role, with acknowledgement", "Tested out of hours in the last quarter."),
        ("Downtime procedures printed and practised", "Including transfusion and results back-entry."),
        ("Out-of-band channel agreed", "For use when email and chat cannot be trusted."),
        ("Suppliers on your incident lists", "And your team on theirs."),
        ("Reporting routes and clocks known", "Cyber, data protection and health regulator."),
        ("All three scenarios exercised", "Cyber or IT downtime, mass casualty or surge, utility failure."),
        ("Hot debrief within 48 hours of stand down", "Then a structured review with dated actions and welfare support.")], "Questions and checklist")
    b.glossary("Words worth knowing", [
        ("Incident command", "A standard structure of roles for running an incident, led by an incident commander."),
        ("HICS", "Hospital Incident Command System: an incident command framework for hospitals, used widely in the US."),
        ("Emergency operations centre", "The room or virtual space from which the incident is run; also called a command centre."),
        ("EPRR", "Emergency preparedness, resilience and response: the NHS England framework for incidents (UK)."),
        ("Business continuity incident", "Disruption below acceptable levels that needs special arrangements until services recover."),
        ("Critical incident", "Loss of ability to deliver critical services, or risk of harm to patients and staff."),
        ("Major incident", "An event with serious consequences needing special arrangements by one or more responder agencies."),
        ("Mass casualty incident", "More casualties than normal resources can manage, needing a declared, coordinated response."),
        ("METHANE", "A format for sharing incident information: major incident, exact location, type, hazards, access, number of casualties, emergency services."),
        ("SBAR", "Situation, background, assessment, recommendation: a structured way to escalate."),
        ("Downtime procedure", "How a service works safely when a clinical system is unavailable."),
        ("Mutual aid", "Help from other organisations, such as testing capacity or staff, during an incident."),
        ("Out-of-band channel", "A way to communicate that does not depend on the systems that may be compromised."),
        ("Back-entry", "Entering results and notes recorded on paper during downtime into the system once it is safe."),
        ("NIS2", "The EU directive on cyber security risk management and incident reporting, which covers health."),
        ("Hot debrief", "A short review straight after an incident, usually within 48 hours of stand down.")])
    b.platform("How the modules work together in a hospital incident", "Crises Control is an Operational Incident Coordination Platform. Here one laboratory outage is followed through the platform. It supports your emergency plan, incident command structure and business continuity plans; it does not replace them.", [
        ("A laboratory manager, or a lone community nurse, raises an alert in one touch from the app, with location where available, so the site team knows straight away.", "SOS"),
        ("On-call, clinical and digital leads are called in by role by push, SMS, voice and email; replies show who is coming, and no reply escalates to a deputy under the rules you configure.", "Ping"),
        ("An authorised user declares the incident and launches the response plan; roles are assigned, and the incident team, partner liaison and supplier work from one communication log.", "Incident Manager"),
        ("Downtime procedures, O type authorisation and results back-entry run as tasks with owners and deadlines, assigned when the plan is activated.", "Task Manager"),
        ("The incident team sees who was notified and acknowledged, task progress and locations, without chasing wards for updates.", "Control Centre"),
        ("A timestamped record of messages, acknowledgements, decisions logged and tasks, exportable as PDF or CSV, supports the debrief, regulatory reports and accreditation evidence.", "Audit & Reporting"),
        ("CRAiG (beta) answers questions and summarises the incident's data in the platform, within each user's permissions. People make every decision.", "CRAiG"),
        ])

    b.mark("", "Sources")
    src = [
        "NHS England London, Synnovis media statement, https://www.england.nhs.uk/london/synnovis-ransomware-cyber-attack/latest-media-statement-on-synnovis-cyber-attack/",
        "The Record, 25 June 2025, https://therecord.media/ransomware-attack-contributed-patient-death-uk-nhs",
        "The Record, 17 April 2026, https://therecord.media/ransomware-nhs-cyberattack-disruption",
        "(unused)",
        "AP via News4JAX, 10 May 2024, https://www.news4jax.com/health/2024/05/10/a-cyberattack-forces-a-big-us-health-system-to-divert-ambulances-and-take-records-offline/",
        "ITV News Meridian, 24 June 2026, https://www.itv.com/news/meridian/2026-06-24/hospital-declares-critical-incident-as-heat-causes-cooling-systems-to-fail",
        "NHS England, EPRR Framework v3, July 2022, https://www.england.nhs.uk/wp-content/uploads/2022/07/B0900-NHS-Emergency-Preparedness-Resilience-and-Response-Framework-version-3.pdf",
        "Civil Contingencies Act 2004, Schedule 1, https://www.legislation.gov.uk/ukpga/2004/36/schedule/1",
        "DHSC, NIS Regulations 2018: health sector guide, https://www.gov.uk/government/publications/network-and-information-systems-regulations-2018-health-sector-guide",
        "42 CFR 482.15 (Cornell LII), https://www.law.cornell.edu/cfr/text/42/482.15",
        "ASPR TRACIE, Joint Commission EM standards, https://asprtracie.hhs.gov/technical-resources/resource/10609/new-and-revised-emncy-management-standards",
        "ASPR TRACIE, HICS Guidebook, 5th edition, https://asprtracie.hhs.gov/technical-resources/resource/2735/hospital-incident-command-system-hics-guidebook-fifth-edition-may-2014",
        "45 CFR 164.404 and 164.408 (Cornell LII), https://www.law.cornell.edu/cfr/text/45/164.404",
        "European Commission, NIS2 FAQs, https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs",
        "European Commission, CER Directive, https://home-affairs.ec.europa.eu/policies/internal-security/counter-terrorism-and-radicalisation/protection/critical-infrastructure-resilience_en",
        "DHA, Healthcare Emergencies, Crises and Disasters Management Framework, https://www.dha.gov.ae/uploads/112024/DHA%20Healthcare%20Emergencies%20Crises%20&%20Disasters%20Management%20Framework2024112683.pdf",
        "Abu Dhabi Media Office, 8 May 2025, https://www.mediaoffice.abudhabi/en/health/emergencies-crises-and-disasters-management-centre-abu-dhabi-and-department-of-health-abu-dhabi-launch-business-continuity-management-standard-for-healthcare-activities/",
        "(unused)",
        "Cureus, CBAHI narrative review, 2025, https://pmc.ncbi.nlm.nih.gov/articles/PMC12635948/",
        "JCI via PR Newswire, 1 July 2024, https://www.aap.com.au/aapreleases/cision20240701ae51644",
    ]
    items = sorted((order[i+1], t) for i, t in enumerate(src) if i+1 in order)
    assert len(items) == len(order) == len([t for t in src if t != "(unused)"]), (sorted(order), len(src))
    b.sources([(f"{n:02d}", t) for n, t in items])
    b.art_back("Every clinician<br>reached, every<br>patient safe.", "Crises Control helps hospitals and health systems call staff in by role, see who has acknowledged, run downtime procedures as tasks and keep a full record for the debrief.", "Request a demo",
        next_title="Intelligence report No. 06 · When the lab went dark")
    return b
