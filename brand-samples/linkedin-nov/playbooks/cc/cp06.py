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
    b.opener("01", "Declare and<br>decide.", "Agree the words, the thresholds and who can say them, before the day you need them.", [("01", "Three declarations, exact words"), ("02", "Why declaring early matters"), ("03", "A healthcare severity ladder")])
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

    # PART 02
    b.mark("02", "Mobilise")
    b.opener("02", "Mobilise.", "Reach the right people, know who is coming, and say the same thing to everyone.", [("01", "The first hour, minute by minute"), ("02", "Call-in and acknowledgement"), ("03", "Messages ready to send"), ("04", "Three scenarios")])
    b.firsthour("The first hour", "Monday, 08:10: the lab goes dark", "An illustrative acute trust. Treat it as a cyber attack until proved otherwise.", [
        ("T+00:00", "Laboratory staff report the system is down", "Lab manager calls the site manager and digital service desk. No results are going out.", "Lab manager", 1),
        ("T+00:05", "On-call manager grades it SEV 1", "Business continuity incident declared. Executive on call and AEO alerted. Digital isolates systems.", "Manager on call", 1),
        ("T+00:10", "Call-in alert sent", "Incident team, pathology, transfusion, ED, theatres, critical care, comms. Reply with arrival time.", "Site manager", 1),
        ("T+00:15", "Downtime procedures start", "Paper requests and phoned urgent results; transfusion to its downtime plan. Clinical leads review today's planned care.", "Pathology lead", 2),
        ("T+00:20", "Cyber reporting route", f"Digital lead calls the NHS England cyber security operations centre, which is monitored 24/7.{R(13)} NIS operators prepare a DSPT report within 72 hours.{R(10)}", "Chief digital officer", 2),
        ("T+00:30", "Critical incident declared", "“Critical Incident declared by (trust)”. ICB on call told; testing mutual aid requested.", "Executive on call", 1),
        ("T+01:00", "Messages out, first meeting held", "Holding lines to staff, today's patients and ED. Facts in METHANE form; decisions logged.", "Incident director", 3)], "Mobilise")
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
        ("server", "Acute trust, three sites", "Ransomware at a pathology partner", [("The gap", "The lab is run by a partner; nobody at the trust was on its incident call list."), ("The fix", "Joint call-in list and shared incident log with the partner; downtime forms printed on every ward."), ("The check", "A joint exercise with the partner, timed from first report to first paper result."), ("Watch out", "Transfusion needs its own downtime plan; agree O type use with the blood bank.")]),
        ("truck", "Community trust, 1,200 field staff", "EPR outage during a cold snap", [("The gap", "Visit lists live only in the electronic record; staff were already on the road."), ("The fix", "Daily offline visit lists, a check-in rule for lone workers and SMS updates that need no app login."), ("The check", "Every lone worker confirmed safe by the end of the shift."), ("Watch out", f"About one in seven NHS staff reported physical violence from patients or the public in the 2025 staff survey.{R(11)}")]),
        ("shield", "Independent provider, NHS contract", "Cooling failure in a heatwave", [("The gap", "Theatres and the server room relied on the same chiller plant."), ("The fix", "A business continuity incident declared and the ICB told; lists moved to a partner site."), ("The check", "Temperature triggers written into the severity ladder."), ("Watch out", f"The NHS Standard Contract requires providers of NHS-funded services to comply with EPRR guidance.{R(8)}")])], "Mobilise")

    # PART 03
    b.mark("03", "Keep patients safe")
    b.opener("03", "Keep patients<br>safe.", "Downtime, partners, patients and staff, from the first hour to the last debrief.", [("01", "Downtime that works"), ("02", "Working with system partners"), ("03", "Winter, heat and long incidents"), ("04", "Your plan")])
    b.essay("Keep patients safe", "Downtime procedures: the plan you hope never to use", [
        "Most clinical areas have a downtime folder. The question is whether anyone has opened it this year. The test is simple: can a ward request an urgent blood test, receive the result and act on it safely with no computers at all? If the answer depends on one person who knows how, it is not a procedure.",
        f"Synnovis showed how long downtime can last. NHS England reported that services in south east London were largely restored by the end of 2024, but in early 2026 one trust estimated that entering 161,560 pathology reports into patient records had been delayed, and it had recorded 122 patient safety incidents involving incorrect, unavailable or delayed results.{R(5)} Recovery has its own risks: results back-entered weeks later, duplicate records and patients lost to follow-up.",
        f"Blood is the sharpest edge. When hospitals cannot match blood in the usual way they rely on O type blood, which is safe for all patients. That is why NHS Blood and Transplant appealed for O negative and O positive donors within a week of the attack.{R(3)} Every transfusion laboratory needs a downtime plan agreed with clinicians, including who authorises O type use.",
        "Good downtime procedures are short, printed and practised. They name the forms, the phone numbers, the runners and the order of priority: emergency department, critical care, maternity, theatres, then the rest. They say how results will be checked and entered when systems return. And they are tested in exercises with the people who will use them, not just the people who wrote them.",
        f"Treat the cyber attack as different from the power cut in one way: you may not be able to trust the systems even when they come back. Keep digital and clinical leads in the same incident meeting. The 2017 WannaCry review found that local staff shared information by personal mobile phones and WhatsApp when email was lost.{R(12)} Decide your out-of-band channel now, before staff choose one for you."],
        "Keep patients safe", "Can a ward request an urgent blood test, get the result and act on it safely with no computers at all?")
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
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("This week", "Write declaration triggers and who can declare. Check call-in lists by role, with tested numbers for every on-call rota.", "Accountable emergency officer"),
        ("This week", "Confirm the out-of-band channel if email and Teams are lost. Print downtime forms for every clinical area.", "Chief digital officer"),
        ("This month", "Agree downtime plans with pathology, transfusion, imaging and pharmacy partners, including results back-entry.", "Chief medical officer"),
        ("This month", "Load the six message templates. Set a lone worker check-in rule for community teams.", "Head of comms; chief nurse"),
        ("This month", "Swap incident contacts with every clinical supplier. Agree how they will alert you and how you will alert them.", "Chief operating officer"),
        ("This quarter", "Link OPEL levels, heat and cold alerts to the severity ladder before winter peaks.", "EPRR lead"),
        ("This quarter", "Run a no-notice call-in test and a cyber downtime exercise with a key supplier. Time first paper result.", "EPRR lead"),
        ("This quarter", "Report results, gaps and dated actions to the board alongside the annual EPRR core standards return.", "Accountable emergency officer")], "Keep patients safe", "30mm 1fr 44mm")
    b.questions("For leaders", "Questions for your executive team", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["Who can declare a critical incident tonight, and do they know the triggers?", "How long would it take to know who is coming in after a call-in?", "Could each ward get an urgent blood result with no computers?"]),
        ("Partners and people", ["Are our pathology, imaging and EPR suppliers on our incident call lists, and are we on theirs?", "How would we reach community staff if the record system and email were both down?", "Who looks after the people who worked the first twelve hours?"])], "Keep patients safe")
    b.checklist("Checklist", "Ready for minute one?", "Tick what is true today. Anything blank is your next action.", [
        ("Declaration triggers written and owned", "Using the EPRR definitions and standard formats."),
        ("Call-in lists by role, with acknowledgement", "Tested out of hours in the last quarter."),
        ("Downtime procedures printed and practised", "Including transfusion and results back-entry."),
        ("Out-of-band channel agreed", "For use when email and Teams cannot be trusted."),
        ("Suppliers on your incident lists", "And your team on theirs."),
        ("Message templates approved", "Staff, patients, partners, public and lone workers."),
        ("Lone worker check-in rule", "Works with no access to the record system."),
        ("Hot debrief within 48 hours of stand down", "As the EPRR framework expects, with welfare support.")], "Keep patients safe")
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
        ("Out-of-band channel", "A way to communicate that does not depend on the systems that may be compromised.")])
    b.platform("Where Crises Control fits in a healthcare incident", "How the steps in this playbook map to Crises Control modules.", [
        ("Call in on-call staff and clinical leads by role, see who has acknowledged and escalate non-responders to deputies automatically.", "Ping"),
        ("Run the incident from one workspace with one log, shared by the incident team, digital, partners and the ICB liaison.", "Incident Manager"),
        ("Turn downtime procedures, transfusion steps and results back-entry into tasks with owners and deadlines.", "Task Manager"),
        ("See which sites and services are affected, what has been done and where escalations are waiting.", "Control Centre"),
        ("Give community and lone staff a one-touch alarm with their location.", "SOS"),
        ("Keep a timestamped record of every message and decision for the hot debrief and the post-incident report.", "Audit Trail"),
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
