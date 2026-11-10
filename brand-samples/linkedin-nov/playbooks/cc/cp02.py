from cckit import CCBook, S

SRC = {
    "fsr22": "Fire Safety (England) Regulations 2022 (SI 2022/547), regs 4 to 10, https://www.legislation.gov.uk/uksi/2022/547/made",
    "rpeep": "Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 (SI 2025/797), https://www.legislation.gov.uk/uksi/2025/797/made",
    "awaab": "Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025 (SI 2025/1042), https://www.legislation.gov.uk/uksi/2025/1042/made",
    "awaab2": "MHCLG, Awaab's Law: Phase 2 guidance for social landlords, updated 31 July 2026, gov.uk/government/publications/awaabs-law-phase-2-guidance-for-social-housing-landlords",
    "bsa91": "Building Safety Act 2022, section 91 (residents' engagement strategy), https://www.legislation.gov.uk/ukpga/2022/30/section/91",
    "bsa87": "Building Safety Act 2022, section 87 (mandatory occurrence reporting), https://www.legislation.gov.uk/ukpga/2022/30/section/87",
    "gti1": "Grenfell Tower Inquiry, Phase 2 Report, Volume 1, Chapter 2 (executive summary), HC 19-I, 4 September 2024, published on gov.uk",
    "gti7": "Grenfell Tower Inquiry, Phase 2 Report, Volume 7, Chapter 113 (recommendations), 4 September 2024, published on gov.uk",
    "certfr": "CERT-FR, Alert CERTFR-2026-ALE-012 on refrigeration remote controllers, 12 October 2026 (updated 16 October), https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/",
    "cisa": "CISA, FBI and partners, Urge Hardening Industrial Refrigeration and Cold Chain Monitoring Systems, 5 November 2026, https://www.ic3.gov/CSA/2026/261105.pdf",
    "record": "The Record, British businesses caught in Europe-wide supermarket fridge attacks, 3 November 2026, therecord.media",
    "hos": "Housing Ombudsman, Annual Complaints Review 2025-26, 2026, housing-ombudsman.org.uk",
    "rrfso": "Regulatory Reform (Fire Safety) Order 2005 (SI 2005/1541), https://www.legislation.gov.uk/uksi/2005/1541/contents",
    "gas": "National Gas, Emergency contacts, https://nationalgas.com/emergency-contacts",
}


def build():
    b = CCBook("Every Resident Reached", 2, "lockers", "Property, Housing and Facilities", "16 November 2026")
    order = {}
    def R(*k):
        for x in k: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in k))
    b.how = "A practical playbook for landlords, managing agents and facilities teams: how to keep residents, occupiers and staff safe and informed when a building emergency starts, and how to prove afterwards that you did."
    b.art_cover("Building emergencies", "Every resident", "reached.",
        "Fire, flood, gas, a dead lift or a building system that stops obeying. A playbook for reaching every resident, occupier and member of staff in the first hour, including the people who cannot leave on their own.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In a building emergency, the message is part of the safety system.", [
        f"When something goes wrong in a block of flats, an office or a care setting, the physical response gets the attention: the fire service, the engineer, the shut-off valve. Yet the Grenfell Tower Inquiry found that the people affected were also failed by information. The landlord's records of residents who might need help to escape were incomplete on the night, and in the days after the fire the council had no effective system for communicating with the public.{R('gti1','gti7')}",
        f"The law has moved since. Responsible persons in multi-occupied residential buildings must give residents fire safety instructions and report lift faults to the fire service. From April 2026, taller buildings and those that have switched to simultaneous evacuation need evacuation plans for residents who cannot get out unaided. Social landlords now have 24 hours to investigate and make safe emergency hazards.{R('fsr22','rpeep','awaab')}",
        f"There is a newer risk too. In October and November 2026, attackers reached refrigeration controllers across Europe that had been left exposed to the internet, and the UK's National Cyber Security Centre warned that other building and heating controls could be at risk if left unprotected.{R('certfr','record')} A building management system that is switched off, or quietly changed, is now a credible way for an emergency to begin.",
        "This playbook is for the people who own that first hour: housing and property managers, facilities and building safety leads, and the out-of-hours teams who pick up the phone at 3am. It is practical and vendor-neutral. Our companion intelligence report sets out the evidence and the legal detail."],
        sign="The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things decide whether everyone is reached.", "Most failures in building emergencies are not about knowing what to do. They are about who knows, how fast they hear, and whether anyone can show later what was decided and why.",
        [("owner", "Know who is in the building", "A current, consented record of residents and occupiers who may need help, with how each prefers to be contacted and who can act for them."),
         ("bell", "Reach them in minutes, not hours", "Pre-approved messages for each kind of emergency, sent on more than one channel, with a way to see who has not acknowledged."),
         ("contract", "Log every decision", "A single, timestamped record of what was known, what was decided, who was told and when. It protects residents first and your organisation second.")])
    b.statement("A plan that cannot reach the person on the ninth floor is not a plan.", "Evacuation strategies, contractor rotas and BMS alarms all depend on one thing working: getting the right instruction to the right person, and knowing that it arrived.", "Introduction")

    # PART 01
    b.mark("01", "Know your building")
    b.opener("01", "Know your<br>building.", "Before the alarm sounds: the emergencies you will face, how serious each one is, who lives inside and who decides.", [("01", "Why building emergencies are communication emergencies"), ("02", "Six emergencies, six first messages"), ("03", "A severity ladder and an escalation route"), ("04", "Knowing who needs help"), ("05", "A resident assistance register"), ("06", "Who does what: a responsibility matrix")])
    b.essay("Know your building", "Why building emergencies are communication emergencies", [
        f"Every building emergency has two parts. One is physical: a fire, a burst main, a gas escape, a stuck lift, a power cut. The other is informational: who needs to know, what they should do, and whether they have understood.",
        f"The Grenfell Tower Inquiry's findings are blunt on this. The landlord's emergency plan was out of date and incomplete, missing fire action notices were a prominent subject of residents' complaints, and its information on vulnerable residents was incomplete on the night.{R('gti1')} Afterwards, the council had no arrangements for identifying those forced from their homes or for communicating with them.{R('gti1')}",
        f"Residents also notice when communication fails in ordinary times. In its review of complaints determined in 2025-26, the Housing Ombudsman found poor communication and inadequate record keeping running through its most serious repairs cases.{R('hos')}",
        f"The building itself is changing too. Heating, ventilation, lifts, access and pumps are increasingly run from a building management system (BMS) that a contractor can reach remotely. In October 2026 France's CERT-FR reported numerous compromises of internet-exposed refrigeration controllers.{R('certfr')} US agencies warned such attacks could alter settings and create fire hazards.{R('cisa')}",
        f"No UK building management system compromise was confirmed in that wave, but the NCSC has warned that exposed controls of other kinds are at risk.{R('record')} For elderly residents, heating switched off on a January night is a welfare emergency, whatever caused it.",
        "So the planning question is not only how to fight a fire or fix a pipe. It is how quickly you can tell everyone what to do, and how you will know who has not heard."],
        "Know your building", "The physical emergency is only half of it. Who knows, how fast, and what they do next usually decides the harm.")
    b.table("Six emergencies", "Six emergencies, and what the first message must say", "The first message sets the tone for everything after it. Agree the wording now, not on the night.", ["Emergency", "First message must say", "Watch for"], [
        ("Fire", f"Where it is, the current strategy and how to report a fire, matching the instructions residents already hold.{R('fsr22')}", "A change of strategy. The second message matters more than the first."),
        ("Flood or escape of water", "Which floors are affected, whether to isolate electrics, where to go if homes are unsafe.", "Water reaching risers, lift pits and electrical intakes."),
        ("Gas", f"No switches or flames, open windows, leave if told to, call 0800 111 999.{R('gas')}", "Residents who cannot leave quickly."),
        ("Lift failure", f"Which lifts are out, expected return, help for those who cannot use stairs.", f"In high-rise blocks, report firefighting lift faults not fixed in 24 hours to the fire service.{R('fsr22')}"),
        ("Power failure", "Scope, expected duration, what still works, welfare checks for powered medical equipment.", "Door entry and warden call that depend on mains power."),
        ("BMS fault or tampering", "What people will notice (heat, ventilation, access), what to report, and that the cause is being checked.", "Settings that change back after a reset.")], "Know your building", "34mm 1fr 1fr")
    b.severity("Severity", "A severity ladder for buildings", "Agree the levels in advance so the person on call does not have to decide alone. Each level names who is alerted and how.", [
        (1, "Life at risk", "Fire with smoke spreading, change from stay put to evacuation, gas escape inside the building, people trapped, structural movement, or, for social landlords, an emergency hazard under Awaab's Law.", "Duty manager, building safety lead, senior leadership, every affected resident, contractors and the fire and rescue service liaison.", "Voice + SMS + push, repeat until acknowledged"),
        (2, "Safety at risk", "Firefighting or evacuation lift out with no fix in 24 hours, loss of heating in cold weather, flood affecting electrics, unexplained BMS changes.", "Duty manager, building safety lead, contractor, residents of affected floors, welfare team for vulnerable residents.", "SMS + push + email, voice for vulnerable residents"),
        (3, "Service disruption", "Single lift out with another working, planned shutdown overrun, door entry fault, local leak contained.", "Duty manager, contractor, affected residents or occupiers.", "SMS or push + email"),
        (4, "Monitor", "BMS alarm cleared, minor fault logged, advance notice of works.", "Building team and contractor; residents only if they will notice.", "Email or app notice")], "Know your building")
    b.escalation("Escalation", "Who is alerted, who decides, and when it goes up", "An illustrative escalation route tied to the severity ladder. Each level names a decision owner, so nobody at 3am waits for permission that is not coming.", [
        ("Building report", "A caretaker, concierge, resident or BMS alarm reports a fault or hazard. Usually SEV 4 or 3.", "Out-of-hours line and building team; the contractor if a repair is needed.", "Duty manager on call, who sets the severity level.", "not acknowledged in 10 minutes, or residents' safety may be affected"),
        ("Duty manager", "SEV 2: firefighting lift out, heating lost in cold weather, flood near electrics, unexplained BMS changes.", "Duty manager, building safety lead, contractor, residents of affected floors, welfare lead.", "Duty manager, with the building safety lead.", "life is at risk, several blocks are affected, or residents must leave"),
        ("Incident control", "SEV 1: fire, gas escape, people trapped, a change to evacuation, or several blocks affected at once.", "Incident lead, head of housing or facilities, every affected resident, communications, fire service liaison.", "Incident lead. The fire and rescue service decides the evacuation strategy.", "a rest centre is needed, someone is badly hurt, or the media call"),
        ("Executive", "A prolonged SEV 1, residents displaced overnight, serious injury, or regulator and media scrutiny.", "Executive director, accountable person, board chair, insurers, council emergency planning.", "Executive director, who also owns reports to regulators, including any safety occurrence.", "")], "Know your building",
        "Escalation is triggered by conditions, not by someone remembering to call. If a level has not acknowledged within its time limit, the next level is alerted automatically and the delay is recorded.")
    b.figpage("Who lives here", "Four things to know about every resident who may need help", f"The law requires this in blocks of 18 metres or seven storeys, and over 11 metres with simultaneous evacuation. It helps everywhere.{R('rpeep')}", "lockers", [
        ("Who and where", f"Residents whose ability to evacuate is compromised by an impairment or condition, with flat and floor.{R('rpeep')}"),
        ("What help they need", f"Offer a person-centred fire risk assessment; agree the approach in an emergency evacuation statement.{R('rpeep')}"),
        ("How to reach them", "Preferred channel and language, and whether a carer should also be told."),
        ("Consent and review", f"Share with the fire service only with explicit consent. Review every 12 months.{R('rpeep')}")], "Know your building")
    b.form("Template", "Resident assistance register", f"One row for each resident who may need help to leave or to stay safe at home. In buildings in scope, offer a person-centred fire risk assessment, agree an emergency evacuation statement and review it every 12 months.{R('rpeep')}",
        [("Block, floor, flat", 1.1), ("Resident", .8), ("Help needed", 1.5), ("Contact channel and language", 1.3), ("Carer or named contact", 1.1), ("Consent to share with fire service", 1.1), ("Next review", .8)], "Know your building", rows=12,
        example=("Block B, floor 9, flat 9.04", "Initials only", "Wheelchair user; cannot use stairs. Evacuation statement agreed.", "Voice call in Polish; SMS copy to daughter", "Daughter, mobile on file", "Yes, recorded 12 March 2026", "March 2027"),
        note="Illustrative example row. Health details are sensitive: record only what an emergency needs and limit who can see the register. Add residents with powered medical equipment, hearing or sight loss, and those who do not read English, even where no evacuation plan is required. Keep a current copy available out of hours and away from the office.")
    b.raci("Roles", "Who does what in a building emergency", "Illustrative, for a landlord or managing agent. One person is accountable for each activity; adapt the roles and keep the matrix with the on-call rota.",
        ["Duty manager", "Building safety lead", "Head of housing", "Welfare lead", "Comms", "Contractors"], [
        ("Open the incident and set the severity level", ["A", "C", "I", "I", "I", ""]),
        ("Send the first message to residents", ["A", "C", "", "I", "C", ""]),
        ("Relay a change of evacuation strategy to every resident", ["A", "R", "I", "I", "I", ""]),
        ("Give the fire service plans and the consented assistance list", ["C", "A", "", "R", "", ""]),
        ("Reach residents with assistance needs and report each status", ["I", "C", "", "A", "", ""]),
        ("Chase residents who have not acknowledged", ["A", "", "", "R", "", "I"]),
        ("Call out contractors; approve any remote BMS, lift or alarm change", ["A", "C", "", "", "", "R"]),
        ("Arrange a rest centre or temporary accommodation", ["R", "", "A", "R", "I", ""]),
        ("Issue the holding statement and media updates", ["C", "", "A", "", "R", ""]),
        ("Decide whether a safety occurrence must be reported", ["I", "R", "A", "", "", ""]),
        ("Keep the decision log and lead the post-incident review", ["R", "A", "I", "C", "C", "C"])], "Know your building",
        "The fire and rescue service decides the evacuation strategy; this matrix covers how you carry it out. Statutory duty-holders keep their legal duties whatever you delegate.")

    # PART 02
    b.mark("02", "The first hour")
    b.opener("02", "The first<br>hour.", "When the alarm sounds: who does what, what residents hear, how silence is chased and how to change course safely.", [("01", "A worst-day timeline"), ("02", "Ready-to-send messages"), ("03", "Changing the evacuation strategy"), ("04", "When residents do not respond"), ("05", "Three blocks, one night"), ("06", "Three scenarios")])
    b.firsthour("Worst day", "Fire in a high-rise block, 02:10 on a winter night", "Illustrative: a 20-storey block with a stay-put strategy and residents who need help to leave. Adapt the roles to your structure.", [
        ("T+00:00", "Fire reported, 999 called", "A resident calls 999 and the out-of-hours line. The incident is opened; duty manager and building safety lead alerted automatically.", "Out-of-hours", 1),
        ("T+00:08", "First message to residents", "Approved message to every resident: location, current strategy, how to report smoke. SMS, push and voice.", "Duty manager", 1),
        ("T+00:12", "Information for the fire service", "Plans and secure information box confirmed. Consented list of residents who need help ready for the incident commander.", "Building safety lead", 1),
        ("T+00:20", "Strategy change", "If the fire service decides to evacuate, one message goes to all residents at once. Non-acknowledgements are chased.", "Duty manager", 1),
        ("T+00:30", "Vulnerable residents", "Each resident on the list is reached, or reported to the incident commander as not reached.", "Welfare lead", 2),
        ("T+00:45", "Contractors, holding line, log", "Lift, alarm and BMS contractors called; no remote changes without approval. Holding statement issued. Log checked.", "Facilities and comms", 2)], "The first hour")
    b.messages("Templates", "Six messages to approve before you need them", "Short, specific and written for the person reading at 2am. Keep SMS under 160 characters and send the same instruction on every channel.", [
        ("SMS", "Residents", "FIRE at Lowry House, floor 9. Stay in your flat unless fire or smoke affects it. If it does, get out and call 999. Updates to follow.", "Only while the strategy is stay put."),
        ("SMS", "Residents", "Lowry House: LEAVE THE BUILDING NOW by the stairs. Do not use lifts. If you cannot get out, call 999 and tell them your flat number.", "Strategy change. Voice call anyone who has not acknowledged."),
        ("Voice", "Vulnerable residents", "This is Northgate Housing. There is a fire at Lowry House. The fire service know you may need help. Keep your front door shut and press 1 to confirm you heard this.", "Only say the fire service know if they do."),
        ("SMS", "Occupiers and staff", "Gas escape reported at Quay Building. Do not use switches or flames. Leave now by the nearest exit and meet at the front car park.", "Fire wardens confirm floors are clear."),
        ("Email", "Contractors", "Incident at Lowry House from 02:10. Make no remote changes to BMS, lift or alarm settings until the duty manager confirms. If on call, attend and report to the incident lead.", "Stops resets that destroy evidence."),
        ("Holding line", "Media and families", "We are working with the fire service at Lowry House. Residents' safety is our priority. We will update this statement at 04:00.", "No speculation on cause or casualties.")], "The first hour")
    b.flow("Strategy change", "Changing from stay put to evacuation", f"The decision belongs to the fire and rescue service. Your job is to make it reach every resident within minutes. The Grenfell Tower Inquiry criticised the absence of contingency plans for a full evacuation.{R('gti1')}", [
        ("bell", "Hear it once, clearly", "Agree in advance how the incident commander's decision reaches your duty manager, and who is allowed to trigger the evacuation message."),
        ("transfer", "Send to everyone, on every channel", "One pre-approved instruction, by SMS, push and voice, to every resident and visitor on record. Building alarm systems where fitted."),
        ("eye", "Watch who has not responded", "Non-acknowledgements are not silence. Pass the list of flats not reached to the incident commander, floor by floor."),
        ("owner", "Prioritise those who need help", "Residents with evacuation statements are contacted individually and their status reported, using the information already shared with consent."),
        ("contract", "Log the change", "Time of decision, time of message, numbers reached and not reached. This is the record an inquiry, regulator or court will ask for.")], "The first hour",
        "Test the strategy-change message at least once a year, with the fire safety instructions you give residents every 12 months.")
    b.table("Non-responders", "When residents do not acknowledge", "Silence is not safety. Illustrative timings for a SEV 1 incident: set your own in the plan and agree with the fire service what they need from you, and when.", ["Time", "What happens", "Owner"], [
        ("T+0", "First message on at least two channels, in the resident's recorded language where possible.", "Duty manager"),
        ("T+5 min", "Automatic resend to everyone not yet acknowledged. Voice call at once to residents on the assistance register.", "Duty manager monitors"),
        ("T+10 min", "Voice call to every remaining non-responder. Message the carer or named contact if one is recorded.", "Welfare lead"),
        ("T+15 min", "List of flats not reached, by block and floor, to staff on site. Door-knocking only where safe and agreed with the fire service.", "Caretaker or concierge"),
        ("T+20 min", "Flats still not reached, and any assistance-register resident not confirmed, passed to the incident commander.", "Building safety lead"),
        ("Until stand-down", "Each flat marked reached, visited, passed to the fire service or confirmed away. Nobody leaves the list by assumption.", "Welfare lead")], "The first hour", "30mm 1fr 44mm")
    b.form("Template", "Acknowledgement and follow-up log", "For the duty manager and welfare lead during an incident: every flat that has not acknowledged, what was tried next and how it ended. Keep a printed copy for when power or systems fail.",
        [("Time sent", .7), ("Block and flat", .8), ("Channel", .9), ("Acknow-<br>ledged", .8), ("If not: next step and time", 1.6), ("Done by", .9), ("Outcome", 1.5)], "The first hour", rows=15,
        example=("02:12", "B, 9.04", "SMS and push", "No", "Voice call 02:17; door-knock 02:30", "Caretaker", "Reached 02:31; staying in flat with door shut"),
        note="Illustrative example row. Record the outcome for every flat, including those confirmed away from home, so the list passed to the fire service is accurate.")
    b.swimlane("Multi-building scenario", "Three blocks, one night", "Illustrative: at 01:40 a fault in a shared plant room cuts power to Blocks A, B and C on one estate. Smoke is reported in Block B's basement. Lifts and door entry stop in all three.",
        ["Out-of-hours line", "Duty manager (incident lead)", "Residents, three blocks", "Welfare and caretaking", "Contractors and fire service"],
        ["01:40", "01:50", "02:05", "02:20", "02:45", "03:30"], [
        (0, 0, "Calls arrive from all three blocks", "act"), (0, 0, "Logged as three separate repair jobs", "risk"),
        (0, 1, "Merged into one incident, duty manager alerted", "act"),
        (1, 1, "Declares one SEV 1 incident across three blocks", "dec"),
        (1, 2, "Approves block-specific messages", "dec"),
        (1, 3, "Decides to open a rest centre", "dec"),
        (1, 4, "Live view of flats reached, by block", "mon"),
        (1, 5, "Hands over to the day team with the log", "act"),
        (2, 1, "One message to all three blocks", "risk"),
        (2, 2, "Block B told to leave; A and C stay put", "act"),
        (2, 3, "Acknowledgements tracked by block and flat", "mon"),
        (2, 4, "Updates every 30 minutes", "act"),
        (3, 2, "Calls assistance register, Block B first", "act"),
        (3, 3, "No power for medical equipment overnight", "risk"),
        (3, 4, "Door-knocks flats still silent", "act"),
        (3, 5, "Every register resident's status confirmed", "mon"),
        (4, 1, "Fire service attends; electrician called", "act"),
        (4, 2, "Incident commander evacuates Block B", "dec"),
        (4, 3, "Contractor wants to reset plant controls", "risk"),
        (4, 4, "Settings recorded before any reset", "mon"),
        (4, 5, "Power back to A and C; B isolated", "act")], "The first hour",
        "The red points are where nights like this usually fail: separate jobs instead of one incident, one message for three different situations, residents who depend on power, and evidence lost to a reset. Each has a named decision owner and a way of being monitored.")
    b.usecase("In practice", "Three buildings, three bad nights", [
        ("storage", "Supported housing, 40 flats", "Burst tank floods the plant room at 23:00", [("Where it goes wrong", "Power, lift and warden call fail together. Some residents use powered medical equipment."), ("Who decides", "The duty manager sets SEV 2, calls the welfare lead, contractor and network operator."), ("How it is monitored", "Acknowledgement by flat; anyone silent after 15 minutes gets a call or a visit."), ("The proof", "Log shows every resident reached within 40 minutes. Know what fails when the power goes.")]),
        ("sliders", "Office campus, 1,200 staff", "Heating and ventilation settings change overnight", [("Where it goes wrong", "BMS setpoints altered remotely; laboratory ventilation off. A quick reset would wipe the evidence."), ("Who decides", "The head of facilities treats it as tampering, cuts remote access and approves any reset."), ("How it is monitored", f"Settings recorded before reset and checked hourly. A reset alone is not enough if the device stays exposed.{R('certfr')}"), ("The proof", "Log and contractor access records shared with security and the insurer.")]),
        ("power", "General needs tower, 18 storeys", "Both lifts fail on a Friday evening", [("Where it goes wrong", "Residents with limited mobility stranded. One is the firefighting lift. By day two it is a welfare issue."), ("Who decides", "The building safety lead owns the repair deadline and the fire service notification."), ("How it is monitored", "Daily calls to residents with limited mobility; the contractor's return date tracked as a task."), ("The proof", f"Fire service told when the fault ran past 24 hours, and when fixed.{R('fsr22')} Monthly lift checks on record.")])], "The first hour")

    # PART 03
    b.mark("03", "Prove it")
    b.opener("03", "Prove<br>it.", "After the first hour: contractors and nights, a record you can stand behind, the actions still open, and how to rehearse and review.", [("01", "Who answers at 3am"), ("02", "A decision log you can defend"), ("03", "Tracking the actions that remain"), ("04", "A night-time tabletop exercise"), ("05", "A post-incident review template"), ("06", "Week, month, quarter")])
    b.steps("Out of hours", "Who answers at 3am: five arrangements to settle now", "Most building emergencies start outside office hours. The weakest link is usually the hand-off between your on-call team and a contractor's.", [
        ("One number, one owner", "A single out-of-hours route, a named duty manager and a deputy called automatically if the first does not respond."),
        ("Contractor contacts that work", "Named 24/7 contacts for alarm, lift, BMS, gas, electrical and water contractors, tested quarterly."),
        ("Remote access rules", f"No remote changes during an incident without approval. Remote access only through secured connections.{R('certfr','cisa')}"),
        ("Information to hand", f"Floor plans and the consented list of residents who need help, available away from the office.{R('fsr22','rpeep')}"),
        ("Who reports to whom", f"Who tells the fire service, council and insurers, and who decides if a safety occurrence goes to the Building Safety Regulator.{R('bsa87')}")], "Prove it")
    b.compare("Decision log", "A decision log you can defend", f"Social landlords must now give tenants a written summary of investigation findings and keep them informed of progress.{R('awaab')} A good log makes that easy.", ["Area", "What often happens", "What good looks like"], [
        ("Timing", "Times reconstructed from memory and phone records days later.", "Every alert, call and decision timestamped automatically as it happens."),
        ("Who was told", "\"We messaged the residents\" with no list.", "Recipients, channel, delivery and acknowledgement for every message."),
        ("Decisions", "Actions recorded, reasons lost.", "What was known, what was decided, by whom and why, in one place."),
        ("Vulnerable residents", "A spreadsheet checked if someone remembers.", "Each person's status recorded: reached, visited, passed to the fire service."),
        ("Contractors", "Calls on personal phones, not recorded.", "Who was called, when they arrived, what they changed."),
        ("Afterwards", "A report written from scattered emails.", "A timeline ready for the debrief, the Ombudsman or the regulator.")], "Prove it")
    b.tracker("Outstanding actions", "The morning after: what is still open", "Illustrative: the day after the three-block night incident. Review the board at every handover until each row is done, and escalate anything overdue or blocked.", [
        ("Call every resident on the assistance register", "Welfare lead", "Day 1, 10:00", "Done", "Status recorded for each resident"),
        ("Written update to all residents of the three blocks", "Comms", "Day 1, 11:00", "Done", "Delivery and acknowledgement by block"),
        ("Secure plant room evidence and contractor access records", "Facilities manager", "Day 1, 12:00", "Done", "Photos and records attached to the log"),
        ("Restore power to Block B; test lifts and door entry", "Electrical contractor", "Day 1, 18:00", "In progress", "Contractor sign-off in the incident record"),
        ("Temporary heating for residents with medical needs", "Housing officer", "Day 1, 16:00", "Overdue", "Resident confirms delivery; escalated to duty manager"),
        ("Make safe any emergency hazard in affected homes", "Repairs manager", "Day 2, 01:40", "In progress", "Investigation and safety work logged per home"),
        ("Tell the fire service if a firefighting lift is still out", "Building safety lead", "Day 2, 01:40", "Open", "Notification time recorded"),
        ("Decide whether a safety occurrence must be reported", "Head of housing", "Day 2", "Open", "Decision and reasons logged"),
        ("Close contractors' remote access to plant controls", "Facilities and IT", "Day 5", "Blocked", "Awaiting contractor; escalated to head of facilities")], "Prove it",
        f"Due times are illustrative. Social landlords must investigate and make safe emergency hazards within 24 hours of becoming aware, and in high-rise blocks a firefighting lift fault not fixed in 24 hours must be reported to the fire service.{R('awaab','fsr22')}")
    b.exercise("Exercise", "Tabletop exercise: lights out on the estate", "A night-time scenario across three blocks. Run it in the room or on the platform you would use for real, with the clock running.", [
        ("Duration", "Two and a half hours, including a 30-minute debrief"),
        ("Participants", "Duty managers, building safety, welfare, comms, a contractor; invite the fire service liaison"),
        ("Objective", "Reach every resident in three blocks and show who has not responded"),
        ("Facilitator", "Someone outside the on-call team, with an observer timing each decision")], [
        ("01:40", "Calls from Blocks A and C: lights out. A BMS alarm shows high temperature in the shared plant room.", "Who opens the incident, and at what level? Is this one incident or three?"),
        ("01:50", "Smoke reported in Block B's basement. The fire service is on its way. Lifts in all three blocks have stopped.", "What does each block hear first, and who approves the wording?"),
        ("02:05", "The incident commander decides to evacuate Block B. Blocks A and C stay put.", "How fast does the change reach every Block B resident without confusing A and C?"),
        ("02:20", "A third of Block B flats have not acknowledged, including three residents on the assistance register.", "Who chases, on which channel? What goes to the incident commander, and when?"),
        ("02:45", "A contractor offers to reset the plant controls remotely. A local reporter calls the out-of-hours line.", "Who decides on remote changes? What is recorded first? Who speaks to the media?"),
        ("03:30", "Power will not return to Block B tonight. Two residents use powered medical equipment.", "Who decides on a rest centre or hotels? How do displaced residents stay informed?")], "Prove it",
        "Measure time to declare, time to first message for each block, time to reach every resident on the assistance register, and how many decisions were logged with reasons. Every gap goes on the actions tracker.")
    b.pir("Review", "Post-incident review template", "Hold the review within two weeks, while memories are fresh, and build it from the incident log rather than recollection. Invite the fire service liaison and a resident representative where appropriate.", [
        ("What happened", "Timeline from first report to stand-down, block by block, taken from the log."),
        ("Who was reached, and how fast", "Residents messaged, acknowledged and not reached, by block and channel."),
        ("Residents who need help", "Was everyone on the assistance register reached or reported? Anyone missing from it?"),
        ("Decisions and who made them", "Severity, strategy change, rest centre, remote changes: who, when, on what information."),
        ("Where it went wrong", "Delays, missed hand-offs, confusing messages, gaps out of hours or with contractors."),
        ("Contractors and building systems", "Who attended, what they changed, and whether settings were recorded before any reset."),
        ("Duties and reports", "Fire service lift notifications, emergency hazard timescales, safety occurrence decision."),
        ("Actions, owners, dates", "Each lesson becomes a tracked action with an owner, a due date and a check.")], "Prove it")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure and building portfolio.", ["When", "Actions", "Owner"], [
        ("This week", "Check every out-of-hours contact and escalation route. Confirm contractors' 24/7 numbers. Find any BMS, lift or plant controller reachable from the internet.", "Duty manager rota lead"),
        ("This week", "Draft and approve the six message templates. Confirm who may send an evacuation message.", "Head of housing or facilities"),
        ("This month", "Audit records of residents who may need help: consent, contact preference, flat and floor. Confirm what the fire service holds.", "Building safety lead"),
        ("This month", "Remove internet exposure of building controls, change default passwords and agree remote access rules with contractors.", "Facilities and IT"),
        ("This quarter", "Run a night-time exercise including a strategy change and a BMS fault. Measure time to reach every resident.", "Building safety lead"),
        ("This quarter", f"Review Awaab's Law response times, the decision log and, for higher-risk buildings, the residents' engagement strategy.{R('bsa91')} Report to the board.", "Director of property")], "Prove it", "30mm 1fr 40mm")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("Reach", ["If we had to evacuate our tallest block tonight, how long would it take to reach every resident, and how would we know who we had missed?", "Do we know, for every building, which residents need help to leave, and does the fire service have that information with their consent?", "Who decides, at 3am, that an incident is SEV 1?"]),
        ("Control and proof", ["Which of our building systems can be reached from the internet, and who can change them?", "Could we produce a timed record of every message and decision from our last incident within a day?", "Are we meeting the 24-hour emergency hazard timescale today, and how do we know?"])], "Prove it")
    b.checklist("Checklist", "Can you reach every resident?", "Tick what is true today. Anything blank is your next action.", [
        ("One out-of-hours route with automatic escalation", "Tested in the last three months."),
        ("Six approved message templates", "Including a stay put to evacuation change and a holding line."),
        ("Consented records of residents who need help", "With flat, floor, contact preference and review date."),
        ("Fire safety instructions issued to every resident", f"To new residents promptly and to everyone every 12 months.{R('fsr22')}"),
        ("Contractor 24/7 contacts and remote access rules", "No exposed controllers, no default passwords."),
        ("24-hour emergency hazard process", f"Investigation and safety work within 24 hours of becoming aware.{R('awaab','awaab2')}"),
        ("Decision log in use", "Every incident, timestamped, with recipients and acknowledgements."),
        ("Night-time exercise in the last year", "Including vulnerable residents and a strategy change.")], "Prove it")
    b.glossary("Words worth knowing", [
        ("Responsible person", f"The person with duties under the Fire Safety Order for the common parts of a building, usually the landlord or managing agent.{R('rrfso')}"),
        ("Accountable person", "Under the Building Safety Act, a person who holds a legal estate in, or has a repairing obligation for, any part of the common parts of a higher-risk building."),
        ("Higher-risk building", "In occupation, a building at least 18 metres or seven storeys tall with at least two residential units."),
        ("Stay put", "A strategy in which residents not affected by fire or smoke remain in their flats, relying on compartmentation."),
        ("Simultaneous evacuation", "Everyone leaves at once when the alarm sounds or when told to."),
        ("Residential PEEP", "A personal emergency evacuation plan for a resident who cannot evacuate unaided, recorded as an emergency evacuation statement."),
        ("Secure information box", "A box on site holding plans and contact details for the fire and rescue service."),
        ("Emergency hazard", "Under Awaab's Law, a hazard posing an imminent and significant risk of harm that a reasonable landlord would make safe within 24 hours."),
        ("BMS", "Building management system: the controls that run heating, ventilation, lighting, pumps and sometimes access and lifts."),
        ("Safety occurrence", "An incident or situation relating to fire spread or structural integrity in a higher-risk building that must be reported to the regulator.")])
    b.platform("How the modules work together in a building emergency", "The three-block night incident from this playbook, followed through the platform from the first report to the record you hand the review.", [
        ("A concierge or caretaker raises the alarm in one touch, with the building and floor attached.", "SOS"),
        ("Every resident in the affected blocks gets the right stay-put or evacuation message by SMS, voice and push, and silence is chased.", "Ping"),
        ("The duty manager opens one incident across all three blocks, assigns roles and logs the fire service's strategy decision.", "Incident Manager"),
        ("Welfare calls, door-knocks and contractor call-outs become owned tasks with deadlines that escalate when missed.", "Task Manager"),
        ("The incident lead sees, block by block, which flats are reached, which tasks are open and what has escalated.", "Control Centre"),
        ("A timestamped record of every message, acknowledgement and decision is ready for the review, the Ombudsman or the regulator.", "Audit & Reporting"),
        ("Users ask CRAiG to find information in the incident, such as which flats have not yet responded.", "CRAiG")])
    b.mark("", "Sources")
    items = sorted((n, SRC[k]) for k, n in order.items())
    b.sources([(f"{n:02d}", t) for n, t in items], "Sources were accessed in November 2026. Legal duties are summarised; read the regulations and official guidance for the full requirements. Building and organisation names in the examples are fictional.")
    b.art_back("Reach every resident,<br>every time.", "Crises Control helps landlords, managing agents and facilities teams alert residents, occupiers, staff and contractors in seconds, track who has responded and keep a complete record of every decision.", "Request a demo",
        next_title="Intelligence report No. 02 · Safe homes, clear duties")
    assert set(order) == set(SRC), set(SRC) - set(order)
    return b
