from cckit import CCBook, S


def build():
    b = CCBook("Major Incident, Minute One", 6, "phone", "Healthcare", "14 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical playbook for NHS trusts and independent healthcare providers: how to declare, mobilise staff, run downtime procedures and keep patients safe in the first hour of a business continuity, critical or major incident, including a cyber attack on clinical systems."
    b.art_cover("Crisis playbook · Healthcare", "Major incident,", "minute one.",
        "Ransomware on the pathology system, a chiller failure in a heatwave, a surge in winter. How to declare, call staff in, switch to paper and keep patients safe when the systems go down.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In healthcare, an IT incident becomes a patient safety incident within the hour.", [
        f"On 3 June 2024 a ransomware attack on Synnovis, the pathology provider for major hospitals in south east London, stopped normal blood testing. Guy's and St Thomas' and King's College Hospital declared a critical incident the next morning.{R(1)} NHS England later reported that 10,152 acute outpatient appointments and 1,710 elective procedures had been postponed at the two trusts.{R(2)} Because blood could not be matched in the usual way, NHS Blood and Transplant asked O type donors to book urgently.{R(3)}",
        f"In June 2025 King's College Hospital confirmed that a long wait for a blood test result, caused by the attack, was one of the factors that contributed to a patient's death.{R(4)} In April 2026, almost two years on, one mental health trust in the area was still working in business continuity for pathology.{R(5)} And in the summer of 2026 trusts declared critical incidents when chillers failed in a heatwave and when IT systems went down.{R(6,7)}",
        "This playbook is for the people who carry the bleep when that happens: accountable emergency officers, EPRR and business continuity leads, on-call managers and directors, digital, nursing and communications teams, in NHS trusts and in independent providers that deliver NHS-funded care. It covers the first hour, the downtime that follows and the plan to be ready before the next one. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things decide how the first hour goes.", "Every trust has an incident response plan and a business continuity plan. The ones that cope best on the day have rehearsed three simple things until they are habits.",
        [("bell", "Declare early, in the right words", f"Use the NHS England definitions for business continuity, critical and major incidents, and the standard message formats, so partners know exactly what you mean.{R(8)}"),
         ("owner", "Know who is coming in", "Reach on-call staff, ward leaders and off-duty teams in minutes, and know who has acknowledged, who is on the way and who has not answered."),
         ("shield", "Make downtime safe", "Paper requests, manual result reporting, safe blood and clear handovers, practised before the systems fail, so patient care does not depend on the network.")])
    b.statement("The network can go down. Patient care cannot.", "A cyber attack, a power cut or a failed cooling plant all end in the same place: clinicians working without the systems they rely on, and patients who need to be told what is happening.", "Introduction")

    # PART 01
    b.mark("01", "Declare and decide")
    b.opener("01", "Declare and<br>decide.", "Agree the words, the thresholds and who can say them, before the day you need them.", [("01", "Three declarations, exact words"), ("02", "Why declaring early matters"), ("03", "A severity ladder and escalation workflow"), ("04", "Who does what: a responsibilities matrix")])
    b.table("Definitions", "Three declarations, in NHS England's words", f"From the NHS EPRR Framework, version 3, July 2022. Use them exactly, and always say who declared it.{R(8)}", ["Declaration", "Definition", "What it means in practice"], [
        ("Business continuity incident", "“an event or occurrence that disrupts, or might disrupt, an organisation’s normal service delivery, to below acceptable pre-defined levels. This would require special arrangements to be put in place until services can return to an acceptable level.”", "Your business continuity plan is running. Examples in the framework include a surge in demand, a utilities breakdown and significant equipment failure."),
        ("Critical incident", "“any localised incident where the level of disruption results in an organisation temporarily or permanently losing its ability to deliver critical services; or where patients and staff may be at risk of harm.”", "Principally an internal escalation. You need support from partners across the system to restore normal operating functions."),
        ("Major incident", "Defined by the Cabinet Office and JESIP as “an event or situation with a range of serious consequences that require special arrangements to be implemented by one or more emergency responder agency.”", "Usually multi-agency. There are no universal triggers; the decision is made in a local, operational context."),
        ("Format", "“Critical Incident declared by (organisation)”. For major incidents: standby, declared, cancelled or stand down.", f"Tell your ICB, which reports to NHS England through regional on-call.{R(8)}")], "Declare and decide", "34mm 1fr 52mm")
    b.essay("Declare and decide", "Why the first decision is the hardest, and the most important", [
        "Nobody wants to declare too soon. A critical incident is a public signal, it pulls in partners and it can feel like an admission. So the first hour often goes on fixing the problem quietly, while wards improvise and the on-call director hears about it second hand.",
        f"The NHS framework is clear that a critical incident is principally an internal escalation response to increased system pressures or disruption to services that will affect the ability to deliver safe patient care.{R(8)} It exists to bring in help. When East Kent Hospitals declared one over IT problems in July 2026, it said the declaration let it keep patients safe by drawing on support from colleagues across the health system.{R(7)}",
        "Declaring is also how you get the right people moving. An on-call manager who declares a business continuity incident at 08:15 can start the downtime procedures, call in the pathology and digital leads and warn the emergency department. One who waits for certainty at 10:00 is two hours behind the wards.",
        f"So set the triggers in advance. Loss of a clinical system that supports results, prescribing or patient flow for more than a set time. Any suspected cyber attack on a clinical system. Loss of power, water, cooling or medical gases to a clinical area. A surge that takes the organisation to its highest operational pressure level under the OPEL framework.{R(9)} Write them down, give named roles the authority to declare and tell them they will never be criticised for declaring early and standing down.",
        f"Use the agreed words. NHS England asks for the format “Critical Incident declared by (organisation)”, and the four standard major incident messages: standby, declared, cancelled and stand down.{R(8)} Share facts with partners in METHANE or SBAR form, which the framework sets out, including an example for a cyber incident.{R(8)}",
        "Then tell your own staff, in the same words, at the same time. A declaration that reaches the ICB before it reaches the wards has gone the wrong way round."],
        "Declare and decide", "Declaring is how you get the right people moving. Waiting for certainty puts you two hours behind the wards.")
    b.severity("Severity", "A healthcare severity ladder for the first hour", "An internal scale for alerting and staffing. It sits alongside the formal EPRR declarations, not instead of them. If in doubt, grade up and step down later.", [
        (1, "Major or critical, trust wide", "Loss of pathology, EPR or prescribing across sites; suspected ransomware; mass casualty major incident declared by your trust or the ambulance service; loss of power or water to clinical areas.", "Executive on call, AEO, incident team, all clinical leads, digital, comms; ICB on call informed at once.", "Push, SMS and voice · ack in 5 min"),
        (2, "Critical in one service or site", "One site's emergency department, theatres or diagnostics unable to work safely; critical system down beyond the agreed time; OPEL 4 with patient safety risk.", "Director and manager on call, service and site leads, digital, comms.", "Push and SMS · ack in 10 min"),
        (3, "Business continuity incident", "Planned downtime overrunning; single system or equipment failure with a working fallback; staffing gap in one area; supplier outage.", "Manager on call, service leads, EPRR lead.", "Push and email · ack in 30 min"),
        (4, "Watch and prepare", "Supplier warning, heat or cold alert, cyber advisory affecting your systems, rising pressure.", "EPRR lead, digital, site team.", "Email and app · no ack needed")], "Declare and decide")
    b.escalation("Escalation", "How an incident climbs, and who decides at each step", "From the first report on a ward to a system-wide response. Times are illustrative: set your own and write them into the plan. Never wait at a level because the next one feels too big.", [
        ("Department response", "A system is slow or failing in one service, with a working fallback. Patient care is not yet affected.", "Department lead, digital service desk, site manager.", "Department or site manager. Logs the fault as a possible incident, not a ticket.", "no fix in 30 minutes, care is affected or a cyber cause is possible"),
        ("Business continuity incident", "A clinical system is down beyond the agreed time, or special arrangements are needed. SEV 3 on the ladder.", "Manager on call, service leads, digital, EPRR lead. Call-in by role, with acknowledgement.", "Manager on call declares and starts downtime procedures.", "critical services are lost, people are at risk or ransomware is suspected"),
        ("Critical incident", "Loss of critical services or risk of harm; suspected cyber attack on a clinical system. SEV 2 or SEV 1.", "Executive on call, accountable emergency officer, incident team, clinical leads, comms; ICB on call told at once.", "Executive on call declares, in the standard words, and sets the meeting rhythm.", "other organisations are affected or help is needed beyond the trust"),
        ("System response", "Several providers affected, mutual aid needed, ambulance redirection, or a major incident declared.", "ICB on call, who reports to NHS England through regional on-call; ambulance service; suppliers.", "Your executive still decides for your trust. The ICB coordinates the system and mutual aid.", "")], "Declare and decide",
        f"Notify the ICB when you declare; it reports to NHS England through regional on-call.{R(8)} Step down as deliberately as you stepped up, with a message at each level.")
    b.raci("Responsibilities", "Who does what in a critical incident", "One accountable owner for every decision. Adapt the roles to your own on-call structure; clinical leads include pathology, transfusion, ED, theatres and nursing.",
        ["Executive on call", "Incident lead (manager on call)", "Clinical leads", "Digital and IT", "Comms", "ICB and partners"], [
        ("Grade the incident and call staff in", ["I", "A", "C", "C", "I", ""]),
        ("Declare a critical incident", ["A", "R", "C", "C", "I", "I"]),
        ("Start downtime procedures in each department", ["I", "A", "R", "C", "", ""]),
        ("Isolate systems and report a suspected cyber attack", ["I", "C", "I", "A", "", "I"]),
        ("Prioritise care: what is cancelled, diverted or protected", ["A", "R", "R", "I", "I", "C"]),
        ("Authorise O type blood use under downtime", ["I", "I", "A", "", "", "C"]),
        ("Request mutual aid and ambulance redirection", ["A", "R", "C", "", "", "R"]),
        ("Messages to staff, patients and the public", ["A", "C", "C", "I", "R", "I"]),
        ("Decide when systems are safe to restore", ["A", "C", "C", "R", "I", "I"]),
        ("Back-enter and check results recorded on paper", ["I", "A", "R", "R", "", ""]),
        ("Stand down and hold the hot debrief", ["A", "R", "C", "C", "C", "I"])], "Declare and decide",
        "Illustrative. Check that every row has exactly one A, that the A can be reached at 03:00, and that a named deputy is on the call-in list for each role.")

    # PART 02
    b.mark("02", "Mobilise")
    b.opener("02", "Mobilise.", "Reach the right people, know who is coming, and say the same thing to everyone.", [("01", "The first hour, minute by minute"), ("02", "Who does what across teams, and where it breaks"), ("03", "Call-in and messages ready to send"), ("04", "Three scenarios")])
    b.firsthour("The first hour", "Monday, 08:10: the lab goes dark", "An illustrative acute trust. Treat it as a cyber attack until proved otherwise.", [
        ("T+00:00", "Laboratory staff report the system is down", "Lab manager calls the site manager and digital service desk. No results are going out.", "Lab manager", 1),
        ("T+00:05", "On-call manager grades it SEV 1", "Business continuity incident declared. Executive on call and AEO alerted. Digital isolates systems.", "Manager on call", 1),
        ("T+00:10", "Call-in alert sent", "Incident team, pathology, transfusion, ED, theatres, critical care, comms. Reply with arrival time; silence escalates to a deputy at 10 minutes.", "Site manager", 1),
        ("T+00:15", "Downtime procedures start", "Paper requests and phoned urgent results; transfusion to its downtime plan. Clinical leads review today's planned care.", "Pathology lead", 2),
        ("T+00:20", "Cyber reporting route", f"Digital lead calls the NHS England cyber security operations centre, which is monitored 24/7.{R(13)} NIS operators prepare a DSPT report within 72 hours.{R(10)}", "Chief digital officer", 2),
        ("T+00:30", "Critical incident declared", "“Critical Incident declared by (trust)”. ICB on call told; testing mutual aid requested.", "Executive on call", 1),
        ("T+01:00", "Messages out, first meeting held", "Holding lines to staff, today's patients and ED. Facts in METHANE form; decisions logged; open actions reviewed at each meeting.", "Incident director", 3)], "Mobilise")
    b.swimlane("Across the teams", "The same hour, team by team: where it goes wrong", "Clinical teams, incident control, digital, partners and comms in the pathology outage. Red cards are the points where responses commonly break down; diamonds are decisions and their owners.",
        ["Clinical teams", "Site management and incident control", "Digital and IT", "Partners: ICB, ambulance, supplier", "Comms"],
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
        (1, 4, "Fixed meeting and sitrep times", "act"),
        (1, 5, "Recovery cell and second shift planned", "act"),
        (2, 0, "Service desk logs a fault, not an incident", "risk"),
        (2, 1, "Systems isolated; cyber reporting started", "act"),
        (2, 2, "Out-of-band channel confirmed for staff", "act"),
        (2, 4, "Restore only when declared safe", "dec"),
        (2, 5, "Back-entry checked against paper logs", "mon"),
        (3, 0, "Supplier's incident call leaves out the trust", "risk"),
        (3, 2, "ICB on call told; mutual aid asked", "act"),
        (3, 3, "Ambulance service warned of possible diverts", "act"),
        (3, 4, "Mutual aid turnaround tracked by batch", "mon"),
        (4, 1, "Staff hear first on personal WhatsApp", "risk"),
        (4, 2, "Holding line to staff and switchboard", "act"),
        (4, 3, "Patients booked today sent SMS", "act"),
        (4, 4, "Updates at fixed times until stand down", "mon")], "Mobilise",
        f"Illustrative. Most failures sit at hand-offs between teams, not inside them. After WannaCry, staff shared information by personal phones and WhatsApp when email was lost.{R(12)} Give every lane the same incident, the same log and the same update times.")
    b.steps("Call-in", "Five rules for calling staff in", "Most trusts have a cascade. Few know, in real time, who has answered.", [
        ("Alert by role, not by name", "Lists are built around roles and rotas: the on-call transfusion scientist, the theatre coordinator, the matron on duty. People change; roles do not."),
        ("Ask for an answer, not a read receipt", "Every call-in asks a question: available now, available later, not available. Silence after the set time escalates to a deputy automatically."),
        ("Use more than one channel", "Push, SMS and voice. If the incident is a cyber attack, assume trust email and Teams may be down or untrusted."),
        ("Protect people off duty", "Ask for what you need and no more. Track hours so the people who come in at 08:30 are not still there at midnight. Plan the second shift in the first hour."),
        ("Stand down in the same way", "Release staff with a message as clear as the one that called them in, and tell them when the hot debrief will be.")], "Mobilise",
        "If you cannot see who has acknowledged within ten minutes, you do not yet know whether you have a response team.")
    b.messages("Messages", "Six messages ready to send", "Short, specific and honest. Fill the brackets, do not speculate on cause, and always give the time of the next update.", [
        ("SMS", "On-call staff", "[Trust] critical incident: lab systems down. Incident team to [room] now. Reply 1 coming, 2 later, 3 not available. Next update 09:00.", "Send by role. Escalate no reply after 10 minutes."),
        ("Push", "All clinical staff", "Pathology systems unavailable. Use paper request forms and phone urgent results via [extension]. Transfusion is on downtime procedures. Do not use [system] until told. Update at 09:30.", "Pin it in the app; repeat at each handover."),
        ("SMS", "Patients booked today", "[Trust]: we have an IT problem affecting blood tests. Please attend as planned unless we contact you. Info: [web page]. Do not reply.", "Approved by clinical leads first."),
        ("Web and phone", "Public holding line", "We have declared a critical incident because of an IT problem affecting pathology. Emergency care is open. Please use NHS 111, your GP or a pharmacy for non-urgent needs. We will update this page at [time].", "Same words on the switchboard message."),
        ("Email", "ICB and partners", "Critical Incident declared by [trust] at [time]. METHANE summary attached. Requests: urgent testing mutual aid, ambulance awareness. Next sitrep [time].", "From the incident log, not from memory."),
        ("SMS", "Community and lone staff", "[Trust]: IT incident. Visits go ahead. Use paper notes, call [number] for results. Check in at 12:00 and on finishing.", "Ask for a reply to confirm they are safe.")], "Mobilise")
    b.usecase("In practice", "Three providers, three first hours", [
        ("server", "Acute trust, three sites", "Ransomware at a pathology partner", [("Where it fails", "The lab is run by a partner; nobody at the trust was on its incident call list, so wards heard first."), ("Who decides", "The executive on call declares; the transfusion lead authorises O type use, agreed with the blood bank."), ("What happens", "A joint call-in list and shared incident log with the partner; downtime forms printed on every ward."), ("How it is monitored", "Time from first report to first paper result, measured in a joint exercise and again on the day.")]),
        ("truck", "Community trust, 1,200 field staff", "EPR outage during a cold snap", [("Where it fails", "Visit lists live only in the electronic record; staff were already on the road."), ("Who decides", "The community manager on call decides which visits go ahead and which are deferred."), ("What happens", "Offline visit lists, a lone worker check-in rule and SMS updates that need no app login."), ("How it is monitored", f"Check-ins tracked; a missed one escalates. About one in seven NHS staff reported physical violence from patients or the public in the 2025 staff survey.{R(11)}")]),
        ("shield", "Independent provider, NHS contract", "Cooling failure in a heatwave", [("Where it fails", "Theatres and the server room relied on the same chiller plant, and nobody linked the two."), ("Who decides", f"The director on call declares a business continuity incident and tells the ICB. The NHS Standard Contract requires NHS-funded providers to follow EPRR guidance.{R(8)}"), ("What happens", "Lists moved to a partner site; temperature triggers written into the severity ladder."), ("How it is monitored", "Theatre and server room temperatures checked against the triggers at set times.")])], "Mobilise")

    # PART 03
    b.mark("03", "Keep patients safe")
    b.opener("03", "Keep patients<br>safe.", "Downtime, partners, patients and staff, from the first hour to the last debrief.", [("01", "Downtime that works, department by department"), ("02", "A results log for paper working"), ("03", "Partners, long incidents and outstanding actions")])
    b.essay("Keep patients safe", "Downtime procedures: the plan you hope never to use", [
        "Most clinical areas have a downtime folder. The question is whether anyone has opened it this year. The test is simple: can a ward request an urgent blood test, receive the result and act on it safely with no computers at all? If the answer depends on one person who knows how, it is not a procedure.",
        f"Synnovis showed how long downtime can last. NHS England reported that services in south east London were largely restored by the end of 2024, but in early 2026 one trust estimated that entering 161,560 pathology reports into patient records had been delayed, and it had recorded 122 patient safety incidents involving incorrect, unavailable or delayed results.{R(5)} Recovery has its own risks: results back-entered weeks later, duplicate records and patients lost to follow-up.",
        f"Blood is the sharpest edge. When hospitals cannot match blood in the usual way they rely on O type blood, which is safe for all patients. That is why NHS Blood and Transplant appealed for O negative and O positive donors within a week of the attack.{R(3)} Every transfusion laboratory needs a downtime plan agreed with clinicians, including who authorises O type use.",
        "Good downtime procedures are short, printed and practised. They name the forms, the phone numbers, the runners and the order of priority: emergency department, critical care, maternity, theatres, then the rest. They say how results will be checked and entered when systems return. And they are tested in exercises with the people who will use them, not just the people who wrote them.",
        f"Treat the cyber attack as different from the power cut in one way: you may not be able to trust the systems even when they come back. Keep digital and clinical leads in the same incident meeting. The 2017 WannaCry review found that local staff shared information by personal mobile phones and WhatsApp when email was lost.{R(12)} Decide your out-of-band channel now, before staff choose one for you."],
        "Keep patients safe", "Can a ward request an urgent blood test, get the result and act on it safely with no computers at all?")
    b.table("Downtime checklist", "Downtime procedure checklist by department", "Check each folder before the day and use it as the switch-over list on the day, in this order.", ["Department", "On switching to downtime", "Before systems come back"], [
        ("Emergency department", "Paper triage and requests; urgent results phoned to a named number.", "Every paper request matched to a result; discharges reviewed."),
        ("Critical care", "Paper charts; blood gases and infusions logged by hand.", "Charts reconciled and entered, checked by a second person."),
        ("Maternity", "Paper notes; urgent bloods phoned; transfusion route confirmed.", "Results confirmed in the record; babies linked to the right mother."),
        ("Theatres", "Lists reviewed by clinical leads; cases needing blood held unless authorised.", "Cancelled patients rebooked by clinical priority."),
        ("Pathology and transfusion", "Downtime plan started; manual reporting; O type use authorised by a named clinician.", "Results back-entered and validated; duplicates resolved."),
        ("Pharmacy", "Paper prescribing and dispensing; high-risk medicines double-checked.", "Prescriptions and administration entered; allergies re-confirmed."),
        ("Imaging", "Paper requests; urgent reports phoned; images held locally where safe.", "Reports matched to requests and to the right patient."),
        ("Wards", "Downtime folder opened; result phone numbers on display.", "Paper records entered; results chased before discharge.")], "Keep patients safe", "40mm 1fr 1fr")
    b.form("Results log", "Downtime results and back-entry log", "One sheet per department, kept by the nurse in charge. Every result received on paper or by phone is written here, then entered and checked when systems return.",
        [("Time", 0.8), ("Patient (NHS no.)", 1.4), ("Test", 1.1), ("Result received from", 1.3), ("Given to and acted on by", 1.5), ("Entered on system (date, initials)", 1.4), ("Checked by", 1)], "Keep patients safe", rows=16,
        example=["09:42", "999 000 0018", "Potassium", "Lab, ext. 4412, A.B.", "FY2 on Ward 7; repeat ordered", "Day 3, C.D.", "E.F."],
        note="Illustrative example row; the number shown is in the NHS test range, not a real patient. Keep the log with the patient's paper notes. A result is only closed when it has been entered on the system and checked by a second person.")
    b.grid("System partners", "Who needs to hear from you, and when", "A declared incident is rarely yours alone. Agree these routes in advance and test them in exercises.", [
        ("bell", "ICB and NHS England", f"Tell your ICB on call when you declare. The ICB reports to NHS England through regional on-call, and coordinates mutual aid.{R(8)}"),
        ("truck", "Ambulance service", f"If you need diverts or redirection, say so early. The framework lists ambulance redirection as a reason to notify.{R(8)}"),
        ("server", "Suppliers and partners", "Pathology, imaging, EPR and facilities partners belong on your call-in lists, and you on theirs."),
        ("eye", "GPs, social care, the public", "Primary care, care homes and patients need to know what still works and where to go instead.")], "Keep patients safe",
        f"Report cyber incidents to the NHS England cyber security operations centre straight away.{R(13)} Operators of essential services report network and information system incidents through the DSPT within 72 hours.{R(10)}")
    b.compare("Long incidents", "Winter, heat and the incident that does not end", "Many healthcare incidents are rising tides, not explosions. They need a different rhythm.", ["Pressure", "What often happens", "What good looks like"], [
        ("Winter surge", "Escalation drifts from OPEL 3 to 4 without a declared incident or extra staff.", f"Triggers that link OPEL levels to your severity ladder and call-in lists.{R(9)}"),
        ("Heat", "Chillers and server rooms fail together; theatres and scanners stop.", f"Temperature triggers, cooling checks and a plan for diagnostics, as trusts learned in June 2026.{R(6)}"),
        ("Long cyber recovery", "Staff run on paper for weeks with no rota change or welfare plan.", "A recovery cell, shift patterns, welfare checks and a plan for back-entering results."),
        ("Lone and community staff", "Visits continue with no way to raise an alarm if systems are down.", "Check-in times, one-touch alarms and visit lists that work offline."),
        ("Communication fatigue", "Updates stop once the crisis feels normal.", "Fixed update times for staff and patients until stand down.")], "Keep patients safe")
    b.tracker("Outstanding actions", "Day one, 16:00: the actions board", "Illustrative board for the pathology outage, reviewed at every incident meeting. Overdue and blocked items go straight to the executive on call.", [
        ("Paper request forms on every ward", "Pathology lead", "Day 1 10:00", "Done", "Runner signs off each ward"),
        ("O type authorisation rule confirmed", "Transfusion lead", "Day 1 09:00", "Done", "Decision and authoriser in the log"),
        ("Patients booked today contacted", "Outpatients manager", "Day 1 11:00", "Done", "SMS delivery and call log"),
        ("Mutual aid testing route agreed", "Incident lead", "Day 1 12:00", "In progress", "Samples sent against results back"),
        ("Cyber incident reported and DSPT report drafted", "Chief digital officer", "Within 72 hours", "In progress", "Reference number in the log"),
        ("Lone worker check-ins for community teams", "Community manager", "Each shift", "Overdue", "Missed check-ins escalated, not waited on"),
        ("Second shift and welfare plan", "Incident lead", "Day 1 14:00", "Overdue", "Hours worked against the rota"),
        ("Results back-entry plan", "Digital lead", "Day 3", "Blocked", "Waiting for assurance systems are clean"),
        ("Sitrep to the ICB", "Incident director", "Daily 16:00", "Open", "Sent from the log, not from memory")], "Keep patients safe",
        "Every action has one owner, a due time and a way to check it is done. If an action has no check, nobody will know it has stalled. The incident lead owns the board and reviews it at every meeting and every shift handover; closed actions stay visible for the debrief.")

    # PART 04
    b.mark("04", "Rehearse and review")
    b.opener("04", "Rehearse<br>and review.", "Practise with the people who will do it, then learn from every incident and every exercise.", [("01", "A tabletop exercise, ready to run"), ("02", "A post-incident review template"), ("03", "Your plan, questions and checklist")])
    b.exercise("Tabletop exercise", "Exercise: the lab goes dark", "A discussion exercise built on the scenario in this playbook. Read each inject aloud, give the room five minutes, and record decisions and gaps as you go.", [
        ("Duration", "Two and a half hours, plus a 30-minute hot debrief"),
        ("Participants", "Executive and manager on call, pathology, transfusion, ED, digital, comms, ICB liaison, supplier"),
        ("Objective", "Test declaration, call-in and the first paper result with no clinical systems"),
        ("Facilitator", "EPRR lead, with an observer timing each decision")], [
        ("00:00", "Monday 08:10. The lab manager reports the pathology system is down. A ransom note is found on a server.", "Who grades it, and how? Who is called first? What do wards do right now?"),
        ("00:15", "Ten minutes after the call-in, the transfusion on-call and the theatre coordinator have not replied.", "Who are the deputies? How do you know, now, who is coming in?"),
        ("00:30", "Digital advise that trust email and Teams cannot be trusted.", "What is the out-of-band channel? How does the critical incident message reach the ICB?"),
        ("00:50", "ED has a patient with major bleeding. Electronic crossmatch is unavailable.", "Who authorises O type blood, how quickly, and where is it recorded?"),
        ("01:15", "A local journalist calls. Patients are posting about cancelled appointments.", "Who approves the holding line? What do today's patients hear, and from whom?"),
        ("01:45", "The supplier says full restoration will take weeks.", "Who runs recovery? What changes for the second shift, mutual aid and results back-entry?")], "Rehearse and review",
        "Measure three times: to grade the incident, to hear back from every key role, and to the first paper result. Put each gap on the actions board with an owner.")
    b.pir("Post-incident review", "Post-incident review template", f"Use it for the hot debrief within 48 hours of stand down, then the structured debrief within 28 days and any multi-agency debrief within 8 weeks, as the EPRR framework expects.{R(8)} Facts first, from the log.", [
        ("What happened, and when", "The timeline from first report to stand down, taken from the incident log, not from memory."),
        ("Declaration and decisions", "Were the triggers clear? Who declared, at what time, and was it early enough? Who decided what?"),
        ("Call-in and acknowledgement", "How long to reach, and hear back from, each key role? Who was not reached, and why?"),
        ("Downtime procedures", "Did each department switch to paper safely? How long to the first paper result?"),
        ("Patient safety", "Incidents reported, delays to care and results, harm reviews started, patients needing follow-up."),
        ("Partners and suppliers", "Did the ICB, ambulance service and suppliers hear in time, in the agreed words?"),
        ("Staff, patients and the public", "Were updates on time and consistent? Which channels worked? How were staff looked after?"),
        ("Actions, owners, dates", "What changes, who owns each one and by when. Add them to the actions board and the board report.")], "Rehearse and review")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("This week", "Write declaration triggers and who can declare. Check call-in lists by role, with tested numbers for every on-call rota.", "Accountable emergency officer"),
        ("This week", "Confirm the out-of-band channel if email and Teams are lost. Print downtime forms for every clinical area.", "Chief digital officer"),
        ("This month", "Agree downtime plans with pathology, transfusion, imaging and pharmacy partners, including results back-entry.", "Chief medical officer"),
        ("This month", "Load the six message templates. Set a lone worker check-in rule for community teams.", "Head of comms; chief nurse"),
        ("This month", "Swap incident contacts with every clinical supplier. Agree how they will alert you and how you will alert them.", "Chief operating officer"),
        ("This quarter", "Link OPEL levels, heat and cold alerts to the severity ladder before winter peaks.", "EPRR lead"),
        ("This quarter", "Run a no-notice call-in test and a cyber downtime exercise with a key supplier. Time first paper result.", "EPRR lead"),
        ("This quarter", "Report results, gaps and dated actions to the board alongside the annual EPRR core standards return.", "Accountable emergency officer")], "Rehearse and review", "30mm 1fr 44mm")
    b.questions("For leaders", "Questions for your executive team", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["Who can declare a critical incident tonight, and do they know the triggers?", "How long would it take to know who is coming in after a call-in?", "Could each ward get an urgent blood result with no computers?"]),
        ("Partners and people", ["Are our pathology, imaging and EPR suppliers on our incident call lists, and are we on theirs?", "How would we reach community staff if the record system and email were both down?", "Who looks after the people who worked the first twelve hours?"])], "Rehearse and review")
    b.checklist("Checklist", "Ready for minute one?", "Tick what is true today. Anything blank is your next action.", [
        ("Declaration triggers written and owned", "Using the EPRR definitions and standard formats."),
        ("Call-in lists by role, with acknowledgement", "Tested out of hours in the last quarter."),
        ("Downtime procedures printed and practised", "Including transfusion and results back-entry."),
        ("Out-of-band channel agreed", "For use when email and Teams cannot be trusted."),
        ("Suppliers on your incident lists", "And your team on theirs."),
        ("Message templates approved", "Staff, patients, partners, public and lone workers."),
        ("Lone worker check-in rule", "Works with no access to the record system."),
        ("Hot debrief within 48 hours of stand down", "As the EPRR framework expects, with welfare support.")], "Rehearse and review")
    b.glossary("Words worth knowing", [
        ("EPRR", "Emergency preparedness, resilience and response: the NHS England programme and framework for incidents and emergencies."),
        ("Accountable emergency officer", "The board-level executive responsible for EPRR in an NHS-funded organisation."),
        ("Business continuity incident", "Disruption below acceptable levels that needs special arrangements until services recover."),
        ("Critical incident", "Localised loss of ability to deliver critical services, or risk of harm to patients and staff."),
        ("Major incident", "An event with serious consequences needing special arrangements by one or more responder agencies."),
        ("OPEL", "Operational pressures escalation levels, from 1 to 4, used to describe pressure on services."),
        ("METHANE", "A JESIP format for sharing incident information: major incident, exact location, type, hazards, access, number of casualties, emergency services."),
        ("SBAR", "Situation, background, assessment, recommendation: a structured way to escalate."),
        ("Downtime procedure", "How a service works safely when a clinical system is unavailable."),
        ("Mutual aid", "Help from other organisations, such as testing capacity or staff, during an incident."),
        ("Hot debrief", "A short review straight after an incident, within 48 hours of stand down."),
        ("DSPT", "The Data Security and Protection Toolkit, used by health bodies to report security incidents."),
        ("ICB", "Integrated care board: plans and coordinates NHS services across a local area, with 24/7 on-call."),
        ("Out-of-band channel", "A way to communicate that does not depend on the systems that may be compromised."),
        ("RACI", "Responsible, accountable, consulted, informed: a way to show who does what, with one owner per decision."),
        ("Back-entry", "Entering results and notes recorded on paper during downtime into the system once it is safe.")])
    b.platform("How the modules work together in a healthcare incident", "One pathology outage, followed through the platform. Crises Control supports your incident response and business continuity plans; it does not replace them.", [
        ("A laboratory manager, or a lone community nurse, raises the alarm in one touch, with location, so the site team knows in seconds.", "SOS"),
        ("On-call, clinical and digital leads are called in by role; replies show who is coming, and silence escalates to a deputy.", "Ping"),
        ("The critical incident is declared, roles are assigned, and the incident team, ICB liaison and supplier work from one log.", "Incident Manager"),
        ("Downtime procedures, O type authorisation and results back-entry run as owned tasks with deadlines in every department.", "Task Manager"),
        ("The incident team sees services affected, staff mobilised and overdue actions, without chasing wards for updates.", "Control Centre"),
        ("A timestamped record of messages, decisions and tasks supports the hot debrief, EPRR assurance and the post-incident review.", "Audit & Reporting"),
        ("CRAiG helps the team find information in the platform and assists them as they work through the live incident.", "CRAiG"),
        ])

    b.mark("", "Sources")
    src = [
        "The Register, Suspected cyberattack hits major London hospitals, 4 June 2024, https://www.theregister.com/2024/06/04/suspected_cyberattack_hits_major_london/",
        "NHS England London, Latest media statement on Synnovis cyber-attack, https://www.england.nhs.uk/london/synnovis-ransomware-cyber-attack/latest-media-statement-on-synnovis-cyber-attack/",
        "NHS Blood and Transplant, O Positive and O Negative donors asked to urgently book appointments following London hospitals IT incident, 10 June 2024, https://www.nhsbt.nhs.uk/news/o-positive-and-o-negative-donors-asked-to-urgently-book-appointments-to-give-blood-following-london-hospitals-it-incident/",
        "The Record, Ransomware attack contributed to patient's death, says Britain's NHS, 25 June 2025, https://therecord.media/ransomware-attack-contributed-patient-death-uk-nhs",
        "The Record, Ransomware attack continues to disrupt healthcare in London nearly two years later, 17 April 2026, https://therecord.media/ransomware-nhs-cyberattack-disruption",
        "ITV News Meridian, Hospital declares critical incident as heat causes cooling systems to fail, 24 June 2026, https://www.itv.com/news/meridian/2026-06-24/hospital-declares-critical-incident-as-heat-causes-cooling-systems-to-fail",
        "PublicTechnology, East Kent Hospitals declare critical incident over ongoing IT issues, 31 July 2026, https://www.publictechnology.net/2026/07/31/health-and-social-care/east-kent-hospitals-declare-critical-incident-over-ongoing-it-issues/",
        "NHS England, NHS Emergency Preparedness, Resilience and Response Framework, version 3, July 2022, https://www.england.nhs.uk/wp-content/uploads/2022/07/B0900-NHS-Emergency-Preparedness-Resilience-and-Response-Framework-version-3.pdf",
        "NHS England, Integrated operational pressures escalation levels (OPEL) framework 2024 to 2026, https://www.england.nhs.uk/long-read/integrated-opel-framework-2024-to-2026/",
        "DHSC, The Network and Information Systems Regulations 2018: guide for the health sector in England, updated 27 September 2023, https://www.gov.uk/government/publications/network-and-information-systems-regulations-2018-health-sector-guide",
        "Royal College of Nursing, NHS Staff Survey lifts lid on torrent of abuse, 12 March 2026, https://www.rcn.org.uk/news-and-events/news/NHS-Staff-Survey-lifts-lid-on-torrent-of-abuse-says-Royal-College-of-Nursing-of-Nursing",
        "National Audit Office, Investigation: WannaCry cyber attack and the NHS, 27 October 2017, https://www.nao.org.uk/reports/investigation-wannacry-cyber-attack-and-the-nhs/",
        "NHS England Digital, Report a cyber security incident, https://digital.nhs.uk/cyber-and-data-security/incidents-and-alerts/report-an-incident",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    b.sources([(f"{n:02d}", t) for n, t in items], "Accessed November 2026. Early reporting on live incidents can change.")
    b.art_back("Every clinician<br>reached, every<br>patient safe.", "Crises Control helps NHS trusts and independent providers call staff in by role, see who has acknowledged, run downtime procedures as tasks and keep a full record for the debrief.", "Request a demo",
        next_title="Intelligence report No. 06 · When the lab went dark")
    return b
