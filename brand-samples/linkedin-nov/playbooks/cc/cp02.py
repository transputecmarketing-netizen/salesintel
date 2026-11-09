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
    b.opener("01", "Know your<br>building.", "Before the alarm sounds: the emergencies you will face, how serious each one is, and who lives and works inside.", [("01", "Why building emergencies are communication emergencies"), ("02", "Six emergencies, six first messages"), ("03", "A severity ladder for buildings"), ("04", "Knowing who needs help")])
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
    b.figpage("Who lives here", "Four things to know about every resident who may need help", f"The law requires this in blocks of 18 metres or seven storeys, and over 11 metres with simultaneous evacuation. It helps everywhere.{R('rpeep')}", "lockers", [
        ("Who and where", f"Residents whose ability to evacuate is compromised by an impairment or condition, with flat and floor.{R('rpeep')}"),
        ("What help they need", f"Offer a person-centred fire risk assessment; agree the approach in an emergency evacuation statement.{R('rpeep')}"),
        ("How to reach them", "Preferred channel and language, and whether a carer should also be told."),
        ("Consent and review", f"Share with the fire service only with explicit consent. Review every 12 months.{R('rpeep')}")], "Know your building")

    # PART 02
    b.mark("02", "The first hour")
    b.opener("02", "The first<br>hour.", "When the alarm sounds: who does what, what residents hear, and how to change course safely.", [("01", "A worst-day timeline"), ("02", "Ready-to-send messages"), ("03", "Changing the evacuation strategy"), ("04", "Three scenarios")])
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
    b.usecase("In practice", "Three buildings, three bad nights", [
        ("storage", "Supported housing, 40 flats", "Burst tank floods the plant room at 23:00", [("The risk", "Power, lift and warden call fail. Some residents use powered medical equipment."), ("The response", "SEV 2. Voice calls to all, welfare checks, contractor and network operator called."), ("The proof", "Log shows every resident reached within 40 minutes."), ("Watch out", "Know what fails when the power goes.")]),
        ("sliders", "Office campus, 1,200 staff", "Heating and ventilation settings change overnight", [("The risk", "BMS setpoints altered remotely; laboratory ventilation switched off."), ("The response", "Treated as tampering. Remote access cut, settings recorded before reset, staff told."), ("The proof", "Log and contractor access records shared with security and the insurer."), ("Watch out", f"A reset alone is not enough if the device stays exposed.{R('certfr')}")]),
        ("power", "General needs tower, 18 storeys", "Both lifts fail on a Friday evening", [("The risk", "Residents with limited mobility stranded. One is the firefighting lift."), ("The response", f"Fire service told when the fault ran past 24 hours, and when fixed.{R('fsr22')}"), ("The proof", "Monthly lift check records available to residents."), ("Watch out", "By day two a lift outage is a welfare issue.")])], "The first hour")

    # PART 03
    b.mark("03", "Prove it")
    b.opener("03", "Prove<br>it.", "After the first hour: contractors and nights, a record you can stand behind, and the plan for the next 90 days.", [("01", "Who answers at 3am"), ("02", "A decision log you can defend"), ("03", "Week, month, quarter")])
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
    b.platform("Where Crises Control fits", "The steps in this playbook, mapped to the Crises Control modules that support them.", [
        ("Send the evacuation or stay-put message to every resident on SMS, voice and push, and chase anyone who has not acknowledged.", "Ping"),
        ("Open one workspace per incident, with approved templates and a single communication log for the duty manager and partners.", "Incident Manager"),
        ("Turn the out-of-hours procedure into assigned tasks for the welfare lead, facilities and contractors, with deadlines and escalation.", "Task Manager"),
        ("See which floors and residents have been reached, which tasks are open and what has escalated, in one live view.", "Control Centre"),
        ("Keep a timestamped record of every message, decision and acknowledgement, ready for the debrief or the regulator.", "Audit Trail"),
        ("Let concierge, wardens and caretakers raise an alarm with their location in one touch.", "SOS"),
        ("Draft resident updates quickly and translate them into the languages your residents use.", "CRAiG")])
    b.mark("", "Sources")
    items = sorted((n, SRC[k]) for k, n in order.items())
    b.sources([(f"{n:02d}", t) for n, t in items], "Sources were accessed in November 2026. Legal duties are summarised; read the regulations and official guidance for the full requirements. Building and organisation names in the examples are fictional.")
    b.art_back("Reach every resident,<br>every time.", "Crises Control helps landlords, managing agents and facilities teams alert residents, occupiers, staff and contractors in seconds, track who has responded and keep a complete record of every decision.", "Request a demo",
        next_title="Intelligence report No. 02 · Safe homes, clear duties")
    assert set(order) == set(SRC), set(SRC) - set(order)
    return b
