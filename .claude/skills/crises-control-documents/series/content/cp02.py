from cckit import CCBook, S

SRC = {
    "gti1": "Grenfell Tower Inquiry, Phase 2 Report, Vol. 1, Ch. 2 (executive summary), HC 19-I, 4 September 2024, gov.uk",
    "fsr22": "Fire Safety (England) Regulations 2022 (SI 2022/547), regs 4 to 10, legislation.gov.uk/uksi/2022/547/made",
    "rpeep": "Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 (SI 2025/797), in force 6 April 2026, legislation.gov.uk/uksi/2025/797/made",
    "awaab": "Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025 (SI 2025/1042), legislation.gov.uk/uksi/2025/1042/made",
    "awaab2": "MHCLG, Awaab's Law: Phase 2 guidance for social landlords, updated 31 July 2026, gov.uk",
    "nfpa101": "NFPA, NFPA 101 Life Safety Code: code use and development (fact sheet), docinfofiles.nfpa.org",
    "osha": "OSHA, 29 CFR 1910.38, Emergency action plans, osha.gov/laws-regs/regulations/standardnumber/1910/1910.38",
    "cpr": "Regulation (EU) 2024/3110 (Construction Products Regulation), recitals 25 and 26; European Commission, CPR 2024 revision page",
    "eu89": "Council Directive 89/391/EEC (OSH Framework Directive), Article 8, via osha.europa.eu",
    "uaecode": "UAE Ministry of Interior, Civil Defence, UAE Fire and Life Safety Code of Practice, 2018 edition, dcd.gov.ae",
    "dubai4": "Dubai Law No. (4) of 2025 Establishing the Dubai Civil Defence General Command, Articles 15 and 17, dlp.dubai.gov.ae",
    "sbc801": "Saudi Building Code National Committee, Saudi Fire Protection Code SBC 801-CR-2024, Chapter 4 and Section 917, sbc.gov.sa",
    "hud": "US HUD, NSPIRE Standard: Smoke Alarm, version 3.0, 11 August 2023, hud.gov",
    "eecc": "Directive (EU) 2018/1972 (European Electronic Communications Code), Article 110, public warning systems",
    "nfpa1660": "NFPA 1660, Standard for Emergency, Continuity, and Crisis Management, 2024 edition, nfpa.org",
    "hos": "Housing Ombudsman (England), Annual Complaints Review 2025-26, housing-ombudsman.org.uk",
    "certfr": "CERT-FR, Alert CERTFR-2026-ALE-012 on refrigeration remote controllers, 12 October 2026, cert.cyber.gouv.fr",
    "cisa": "CISA, FBI and partners, Urge Hardening Industrial Refrigeration and Cold Chain Monitoring Systems, 5 November 2026, ic3.gov",
    "bsa91": "Building Safety Act 2022, s91 (residents' engagement strategy), legislation.gov.uk/ukpga/2022/30/section/91",
    "bsa87": "Building Safety Act 2022, s87 (mandatory occurrence reporting), legislation.gov.uk/ukpga/2022/30/section/87",
}


def build():
    b = CCBook("Every Resident Reached", 2, "lockers", "Property, Housing and Facilities", "16 November 2026")
    order = {}
    def R(*k):
        for x in k: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in k))
    # contents has 11 entries in the round 3 structure; tighten its rows so the list fits one page (kit default padding overflows)
    b.how = "For landlords, managing agents and facilities teams: reach every resident in a building emergency, and prove afterwards that you did." + '<style>div[style*="padding:8mm 0;border-bottom"]{padding:6.2mm 0!important}</style>'
    b.art_cover("Building emergencies", "Every resident", "reached.",
        "Fire, flood, gas, a dead lift or a building system that stops obeying. A playbook for reaching every resident, occupier and member of staff in the first hour, including the people who cannot leave on their own.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In a building emergency, the message is part of the safety system.", [
        f"When something goes wrong in a block of flats, an office or a care setting, the physical response gets the attention: the fire service, the engineer, the shut-off valve. Yet the UK's Grenfell Tower Inquiry found that the people affected were also failed by information. The landlord's records of residents who might need help to escape were incomplete on the night, and afterwards the council had no effective way to communicate with those forced from their homes.{R('gti1')}",
        "The lesson travels. Fire and building codes differ between England, the United States, the European Union and the Gulf, and we set out the main duties region by region. Underneath them, the questions are the same everywhere: who is inside, who needs help to leave, how quickly they hear what to do, and whether anyone can show later what was decided and why.",
        f"There is a newer risk too. In 2026 attackers reached refrigeration controllers across Europe that had been left exposed to the internet, and US agencies warned that such access could change settings and create fire hazards.{R('certfr','cisa')} A building system that is switched off, or quietly changed, is now a credible way for an emergency to begin. This playbook is for the people who own that first hour: housing and property managers, facilities and building safety leads, and the out-of-hours teams who pick up the phone at 3am. It is practical and vendor-neutral; our companion report sets out the evidence."],
        sign="The Crises Control team")

    b.mark("", "Executive summary")
    b.execsum("Reach every resident in minutes, find who is missing, and keep the record.",
        ["Building emergencies start out of hours, in buildings where few staff are on site.",
         "Records of residents who need help are often incomplete, unconsented or out of reach at 3am.",
         "Contractors, building systems and housing teams each hold part of the picture, and nobody holds all of it."],
        ["Fire in a high-rise block, including a change from stay put to full evacuation.",
         "Flood, gas escape or power loss that disables lifts, door entry and medical equipment.",
         "A building management system fault or tampering that cuts heat, ventilation or access.",
         "One fault hitting several blocks at night, with residents displaced."],
        ["Keep a consented assistance register, with contact channel and language, available out of hours.",
         "Approve messages for each emergency in advance, including the change to evacuation.",
         "Set escalation by severity and time so silence is chased, not assumed to be safety.",
         "Take building controls off the internet and agree remote access rules with contractors.",
         "Exercise a night-time, multi-building incident at least once a year."],
        ["One incident across all affected blocks, with one named lead and a severity level.",
         "Every flat marked reached, visited, passed to the fire service or confirmed away.",
         "Residents who need help contacted first, and their status reported to the incident commander.",
         "A timestamped log of messages, acknowledgements and decisions, ready for any review."],
        ["Residents, staff and contractors can be alerted by push, SMS, voice and email, with acknowledgements tracked by the groups you set up for each block and floor.",
         "Those who do not respond are re-alerted under the escalation rules you configure; tasks, decisions and messages are kept in one timestamped record."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things decide whether everyone is reached.", "Most organisations can send alerts. Few can manage incidents end-to-end. In a building emergency the gap shows in three places: who knows, how fast they hear, and whether anyone can show later what was decided and why.",
        [("owner", "Know who is in the building", "A current, consented record of residents and occupiers who may need help, with how each prefers to be contacted and who can act for them."),
         ("bell", "Reach them in minutes, not hours", "Pre-approved messages for each kind of emergency, sent on more than one channel, with a way to see who has not acknowledged."),
         ("contract", "Log every decision", "A single, timestamped record of what was known, what was decided, who was told and when. It protects residents first and your organisation second.")])
    b.statement("A plan that cannot reach the person on the ninth floor is not a plan.", "Evacuation strategies, contractor rotas and building alarms all depend on one thing working: getting the right instruction to the right person, knowing it arrived, and coordinating what happens next.", "Introduction")

    # PART 01
    b.mark("01", "Know your building")
    b.opener("01", "Know your<br>building.", "Before the alarm sounds: the emergencies you will face, the duties that apply where you operate, and who inside needs help.", [("01", "Why building emergencies are communication emergencies"), ("02", "Fire and evacuation duties, by region"), ("03", "Response clocks and resident communication, by region"), ("04", "Six emergencies, six first messages"), ("05", "A resident assistance register")])
    b.essay("Know your building", "Why building emergencies are communication emergencies", [
        "Every building emergency has two parts. One is physical: a fire, a burst main, a gas escape, a stuck lift, a power cut. The other is informational: who needs to know, what they should do, and whether they have understood.",
        f"The Grenfell Tower Inquiry in the UK is blunt on this. The landlord's emergency plan was out of date and incomplete, missing fire action notices were a prominent subject of residents' complaints, and its information on vulnerable residents was incomplete on the night.{R('gti1')} Afterwards, the council had no arrangements for identifying those forced from their homes or for communicating with them.{R('gti1')}",
        f"Residents notice when communication fails in ordinary times too. In its review of complaints determined in 2025-26, England's Housing Ombudsman found poor communication and inadequate record keeping running through its most serious repairs cases.{R('hos')}",
        f"The building itself is changing. Heating, ventilation, lifts, access and pumps are increasingly run from a building management system (BMS) that a contractor can reach remotely. In October 2026 France's CERT-FR reported numerous compromises of internet-exposed refrigeration controllers.{R('certfr')} US agencies warned that such attacks could alter settings and create fire hazards.{R('cisa')}",
        "We found no public report of a residential BMS being compromised in that wave. But the controllers that run heating, ventilation and lifts are often reached remotely in the same way, and for elderly residents heating switched off on a winter night is a welfare emergency, whatever caused it.",
        "So the planning question is not only how to fight a fire or fix a pipe. It is how quickly you can tell everyone what to do, and how you will know who has not heard."],
        "Know your building", "The physical emergency is only half of it. Who knows, how fast, and what they do next usually decides the harm.")
    b.regions("Regional notes", "Fire and evacuation duties for residential buildings", "Who must plan for evacuation, and what residents must be told, differs by country and often by city. The operational guidance in this playbook works under all of them.", [
        ("United Kingdom", f"<b>England:</b> responsible persons for blocks of flats give residents fire safety instructions every 12 months; in high-rise blocks, firefighting lift faults not fixed in 24 hours go to the fire service.{R('fsr22')} From 6 April 2026, taller blocks need evacuation plans for residents who cannot leave unaided.{R('rpeep')}",
         f"In higher-risk buildings, add the residents' engagement strategy and mandatory occurrence reporting.{R('bsa91','bsa87')}"),
        ("United States", f"No single national code for housing. NFPA 101, the Life Safety Code, is a model code that applies where a state or local jurisdiction has adopted it, often with amendments.{R('nfpa101')} Where an OSHA standard requires one, employers need an emergency action plan that includes accounting for employees after evacuation.{R('osha')}",
         f"Check the edition your state or city has adopted. NFPA 1660 (2024) is a voluntary planning standard.{R('nfpa1660')}"),
        ("European Union", f"Building and fire safety rules are set nationally, often regionally. The Construction Products Regulation (EU) 2024/3110 harmonises how products are assessed, while requirements for buildings stay with member states.{R('cpr')} Employers must arrange first aid, fire-fighting and evacuation of workers.{R('eu89')}",
         "Work from the national code and fire authority guidance in each country; one model rarely fits every border."),
        ("Middle East (UAE, Saudi Arabia)", f"<b>UAE:</b> the UAE Fire and Life Safety Code of Practice, issued by Civil Defence, is the national fire code.{R('uaecode')} <b>Saudi Arabia:</b> the Saudi Fire Protection Code, SBC 801 (2024), covers emergency planning, evacuation plans, drills and mass notification systems.{R('sbc801')}",
         f"In Dubai, owners must keep fire systems maintained and seek Civil Defence approval before changes that affect them.{R('dubai4')}")], "Know your building")
    b.regions("Regional notes", "Response clocks and resident communication", "Some regimes put a clock on hazards in homes, or say who keeps occupants informed. Build these timings into your escalation rules.", [
        ("United Kingdom", f"<b>England, social landlords:</b> under Awaab's Law, emergency hazards must be investigated and made safe within 24 hours, with written findings and progress updates to tenants.{R('awaab')} From 30 November 2026 the regime extends to fire, electrical, excess cold and other hazards.{R('awaab2')}",
         "The clock starts when the landlord becomes aware, often through an out-of-hours call. Time-stamp every report."),
        ("United States", f"<b>HUD-assisted housing:</b> under HUD's inspection standards, a missing or non-working smoke alarm is a life-threatening deficiency with a 24-hour correction timeframe.{R('hud')} Workplace emergency action plans must be reviewed with each employee covered.{R('osha')}",
         "State and city housing codes add their own timescales; record which apply to each building."),
        ("European Union", f"Member states must ensure official public warnings about major emergencies reach mobile users in the area.{R('eecc')} These warnings come from the authorities and do not replace your own instructions to residents and staff.",
         "Plan for residents receiving an official alert and your message at the same time. Keep them consistent."),
        ("Middle East (UAE, Saudi Arabia)", f"<b>Dubai:</b> facilities must have a designated, qualified person who implements preventive safety requirements, liaises with Civil Defence and keeps occupants informed.{R('dubai4')} <b>Saudi Arabia:</b> SBC 801 sets requirements for employee training and response procedures.{R('sbc801')}",
         "Name that person in your plan and in the escalation workflow, with a deputy for nights.")], "Know your building")
    b.table("Six emergencies", "Six emergencies, and what the first message must say", "The first message sets the tone for everything after it. Agree the wording now, not on the night.", ["Emergency", "First message must say", "Watch for"], [
        ("Fire", "Where it is, the current strategy and how to report a fire, matching the instructions residents already hold.", "A change of strategy. The second message matters more than the first."),
        ("Flood or escape of water", "Which floors are affected, whether to isolate electrics, where to go if homes are unsafe.", "Water reaching risers, lift pits and electrical intakes."),
        ("Gas", "No switches or flames, open windows, leave if told to, call the gas emergency number.", "Residents who cannot leave quickly."),
        ("Lift failure", "Which lifts are out, expected return, help for those who cannot use stairs.", f"Firefighting lifts. <b>UK:</b> in high-rise blocks, faults not fixed in 24 hours go to the fire service.{R('fsr22')}"),
        ("Power failure", "Scope, expected duration, what still works, welfare checks for powered medical equipment.", "Door entry and warden call that depend on mains power."),
        ("BMS fault or tampering", "What people will notice (heat, ventilation, access), what to report, and that the cause is being checked.", "Settings that change back after a reset.")], "Know your building", "34mm 1fr 1fr")
    b.form("Template", "Resident assistance register", f"One row for each resident who may need help to leave or to stay safe at home. <b>UK:</b> in buildings in scope, offer a person-centred fire risk assessment, agree an emergency evacuation statement and review it every 12 months.{R('rpeep')}",
        [("Block, floor, flat", 1.1), ("Resident", .8), ("Help needed", 1.5), ("Contact channel and language", 1.3), ("Carer or named contact", 1.1), ("Consent to share with fire service", 1.1), ("Next review", .8)], "Know your building", rows=12,
        example=("Block B, floor 9, flat 9.04", "Initials only", "Wheelchair user; cannot use stairs. Evacuation plan agreed.", "Voice call in Polish; SMS copy to daughter", "Daughter, mobile on file", "Yes, recorded 12 March 2026", "March 2027"),
        note="Illustrative example row. Health details are sensitive: record only what an emergency needs, follow your data protection law and limit who can see the register. Add residents with powered medical equipment, hearing or sight loss, and those who do not read the local language, even where no evacuation plan is required. Keep a current copy available out of hours and away from the office.")

    # PART 02
    b.mark("02", "Incident scenarios")
    b.opener("02", "Incident<br>scenarios.", "When the alarm sounds: how serious it is, what the first hour looks like, and three nights that go wrong in different ways.", [("01", "A severity ladder for buildings"), ("02", "Fire in a high-rise block at 02:10"), ("03", "Three blocks, one night"), ("04", "Three buildings, three bad nights"), ("05", "The morning after: what is still open")])
    b.severity("Severity", "A severity ladder for buildings", "Agree the levels in advance so the person on call does not have to decide alone. Each level names who is alerted and how.", [
        (1, "Life at risk", "Fire with smoke spreading, change from stay put to evacuation, gas escape inside the building, people trapped, structural movement, or any hazard your rules say must be made safe within 24 hours.", "Duty manager, building safety lead, senior leadership, every affected resident, contractors and the fire service liaison.", "Voice + SMS + push, repeat until acknowledged"),
        (2, "Safety at risk", "Firefighting or evacuation lift out with no fix in 24 hours, loss of heating in cold weather, flood affecting electrics, unexplained BMS changes.", "Duty manager, building safety lead, contractor, residents of affected floors, welfare team for vulnerable residents.", "SMS + push + email, voice for vulnerable residents"),
        (3, "Service disruption", "Single lift out with another working, planned shutdown overrun, door entry fault, local leak contained.", "Duty manager, contractor, affected residents or occupiers.", "SMS or push + email"),
        (4, "Monitor", "BMS alarm cleared, minor fault logged, advance notice of works.", "Building team and contractor; residents only if they will notice.", "Email or app notice")], "Incident scenarios")
    b.firsthour("Worst day", "Fire in a high-rise block, 02:10 on a winter night", "Illustrative: a 20-storey block with a stay-put strategy and residents who need help to leave. Adapt the roles to your structure.", [
        ("T+00:00", "Fire reported, emergency services called", "A resident calls the emergency services and the out-of-hours line. The incident is opened; duty manager and building safety lead alerted under the plan's escalation rules.", "Out-of-hours", 1),
        ("T+00:08", "First message to residents", "Approved message to every resident: location, current strategy, how to report smoke. SMS, push and voice.", "Duty manager", 1),
        ("T+00:12", "Information for the fire service", "Plans and on-site information box confirmed. Consented list of residents who need help ready for the incident commander.", "Building safety lead", 1),
        ("T+00:20", "Strategy change", "If the fire service decides to evacuate, one message goes to all residents at once. Non-acknowledgements are chased.", "Duty manager", 1),
        ("T+00:30", "Vulnerable residents", "Each resident on the register is reached, or reported to the incident commander as not reached.", "Welfare lead", 2),
        ("T+00:45", "Contractors, holding line, log", "Lift, alarm and BMS contractors called; no remote changes without approval. Holding statement issued. Log checked.", "Facilities and comms", 2)], "Incident scenarios")
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
        (4, 5, "Power back to A and C; B isolated", "act")], "Incident scenarios",
        "The red points are where nights like this usually fail: separate jobs instead of one incident, one message for three different situations, residents who depend on power, and evidence lost to a reset. Each has a named decision owner and a way of being monitored.")
    b.usecase("In practice", "Three buildings, three bad nights", [
        ("storage", "Supported housing, 40 flats", "Burst tank floods the plant room at 23:00", [("Where it goes wrong", "Power, lift and warden call fail together. Some residents use powered medical equipment."), ("Who decides", "The duty manager sets SEV 2, calls the welfare lead, contractor and power network operator."), ("How it is monitored", "Acknowledgement by flat; anyone silent after 15 minutes gets a call or a visit."), ("The proof", "Log shows when each resident was reached. Know what fails when the power goes.")]),
        ("sliders", "Office campus, 1,200 staff", "Heating and ventilation settings change overnight", [("Where it goes wrong", "BMS setpoints altered remotely; laboratory ventilation off. A quick reset would wipe the evidence."), ("Who decides", "The head of facilities treats it as tampering, cuts remote access and approves any reset."), ("How it is monitored", f"Settings recorded before reset and checked hourly. A reset alone is not enough if the device stays exposed.{R('certfr')}"), ("The proof", "Log and contractor access records shared with security and the insurer.")]),
        ("power", "General needs tower, 18 storeys", "Both lifts fail on a Friday evening", [("Where it goes wrong", "Residents with limited mobility stranded. One is the firefighting lift. By day two it is a welfare issue."), ("Who decides", "The building safety lead owns the repair deadline and any notification to the fire service."), ("How it is monitored", "Daily calls to residents with limited mobility; the contractor's return date tracked as a task."), ("The proof", f"<b>UK:</b> fire service told when the fault ran past 24 hours, and when fixed.{R('fsr22')} Lift checks on record.")])], "Incident scenarios")
    b.tracker("Outstanding actions", "The morning after: what is still open", "Illustrative: the day after the three-block night incident. Review the board at every handover until each row is done, and escalate anything overdue or blocked.", [
        ("Call every resident on the assistance register", "Welfare lead", "Day 1, 10:00", "Done", "Status recorded for each resident"),
        ("Written update to all residents of the three blocks", "Comms", "Day 1, 11:00", "Done", "Delivery and acknowledgement by block"),
        ("Secure plant room evidence and contractor access records", "Facilities manager", "Day 1, 12:00", "Done", "Photos and records attached to the log"),
        ("Restore power to Block B; test lifts and door entry", "Electrical contractor", "Day 1, 18:00", "In progress", "Contractor sign-off in the incident record"),
        ("Temporary heating for residents with medical needs", "Housing officer", "Day 1, 16:00", "Overdue", "Resident confirms delivery; escalated to duty manager"),
        ("Make safe any hazard in affected homes within your response clock", "Repairs manager", "Day 2, 01:40", "In progress", "Investigation and safety work logged per home"),
        ("Tell the fire service if a firefighting lift is still out", "Building safety lead", "Day 2, 01:40", "Open", "Notification time recorded"),
        ("Decide whether the incident must be reported to a regulator", "Head of housing", "Day 2", "Open", "Decision and reasons logged"),
        ("Close contractors' remote access to plant controls", "Facilities and IT", "Day 5", "Blocked", "Awaiting contractor; escalated to head of facilities")], "Incident scenarios",
        f"Due times are illustrative. <b>United Kingdom:</b> social landlords in England must investigate and make safe emergency hazards within 24 hours of becoming aware, and in high-rise blocks a firefighting lift fault not fixed in 24 hours must be reported to the fire service.{R('awaab','fsr22')}")

    # PART 03
    b.mark("03", "Reach, record, recover")
    b.opener("03", "Reach, record,<br>recover.", "How to change course safely, chase silence, work with contractors at night and leave a record you can stand behind.", [("01", "Changing the evacuation strategy"), ("02", "When residents do not respond"), ("03", "An acknowledgement and follow-up log"), ("04", "Who answers at 3am"), ("05", "Records you can stand behind"), ("06", "Your first week, month and quarter")])
    b.flow("Strategy change", "Changing from stay put to evacuation", f"The decision belongs to the fire service. Your job is to make it reach every resident within minutes. The Grenfell Tower Inquiry criticised the absence of contingency plans for a full evacuation.{R('gti1')}", [
        ("bell", "Hear it once, clearly", "Agree in advance how the incident commander's decision reaches your duty manager, and who is allowed to trigger the evacuation message."),
        ("transfer", "Send to everyone, on every channel", "One pre-approved instruction, by SMS, push and voice, to every resident and visitor on record. Building alarm and voice systems where fitted."),
        ("eye", "Watch who has not responded", "Non-acknowledgements are not silence. Pass the list of flats not reached to the incident commander, floor by floor."),
        ("owner", "Prioritise those who need help", "Residents on the assistance register are contacted individually and their status reported, using the information already shared with consent."),
        ("contract", "Log the change", "Time of decision, time of message, numbers reached and not reached. This is the record an inquiry, regulator or court will ask for.")], "Reach, record, recover",
        "Test the strategy-change message at least once a year, alongside the fire safety instructions you give residents.")
    b.table("Non-responders", "When residents do not acknowledge", "Silence is not safety. Illustrative timings for a SEV 1 incident: set your own in the plan and agree with the fire service what they need from you, and when.", ["Time", "What happens", "Owner"], [
        ("T+0", "First message on at least two channels, in the resident's recorded language where possible.", "Duty manager"),
        ("T+5 min", "Resend to everyone not yet acknowledged, under the rules set in the plan. Voice call at once to residents on the assistance register.", "Duty manager monitors"),
        ("T+10 min", "Voice call to every remaining non-responder. Message the carer or named contact if one is recorded.", "Welfare lead"),
        ("T+15 min", "List of flats not reached, by block and floor, to staff on site. Door-knocking only where safe and agreed with the fire service.", "Caretaker or concierge"),
        ("T+20 min", "Flats still not reached, and any register resident not confirmed, passed to the incident commander.", "Building safety lead"),
        ("Until stand-down", "Each flat marked reached, visited, passed to the fire service or confirmed away. Nobody leaves the list by assumption.", "Welfare lead")], "Reach, record, recover", "30mm 1fr 44mm")
    b.form("Template", "Acknowledgement and follow-up log", "For the duty manager and welfare lead during an incident: every flat that has not acknowledged, what was tried next and how it ended. Keep a printed copy for when power or systems fail.",
        [("Time sent", .7), ("Block and flat", .8), ("Channel", .9), ("Acknow-<br>ledged", .8), ("If not: next step and time", 1.6), ("Done by", .9), ("Outcome", 1.5)], "Reach, record, recover", rows=15,
        example=("02:12", "B, 9.04", "SMS and push", "No", "Voice call 02:17; door-knock 02:30", "Caretaker", "Reached 02:31; staying in flat with door shut"),
        note="Illustrative example row. Record the outcome for every flat, including those confirmed away from home, so the list passed to the fire service is accurate.")
    b.steps("Out of hours", "Who answers at 3am: five arrangements to settle now", "Most building emergencies start outside office hours. The weakest link is usually the hand-off between your on-call team and a contractor's.", [
        ("One number, one owner", "A single out-of-hours route, a named duty manager and a deputy who is alerted if the first does not respond within the time you set."),
        ("Contractor contacts that work", "Named 24/7 contacts for alarm, lift, BMS, gas, electrical and water contractors, tested quarterly."),
        ("Remote access rules", f"No remote changes during an incident without approval. Remote access only through secured connections.{R('certfr','cisa')}"),
        ("Information to hand", "Floor plans and the consented list of residents who need help, available away from the office."),
        ("Who reports to whom", f"Who tells the fire service, the authorities and insurers, and who decides whether a regulator must be told. <b>UK:</b> safety occurrences in higher-risk buildings go to the Building Safety Regulator.{R('bsa87')}")], "Reach, record, recover")
    b.compare("Records", "Records you can stand behind", f"Residents, ombudsmen and regulators increasingly expect a written account. <b>UK:</b> social landlords must give tenants written findings and progress updates on hazards.{R('awaab')}", ["Area", "What often happens", "What good looks like"], [
        ("Timing", "Times reconstructed from memory and phone records days later.", "Every alert, call and decision timestamped as it happens."),
        ("Who was told", "\"We messaged the residents\" with no list.", "Recipients, channel, delivery and acknowledgement for every message."),
        ("Decisions", "Actions recorded, reasons lost.", "What was known, what was decided, by whom and why, in the Incident decision log."),
        ("Vulnerable residents", "A spreadsheet checked if someone remembers.", "Each person's status recorded: reached, visited, passed to the fire service."),
        ("Contractors", "Calls on personal phones, not recorded.", "Who was called, when they arrived, what they changed."),
        ("Afterwards", "A report written from scattered emails.", "A timeline ready for the debrief, an ombudsman or the regulator.")], "Reach, record, recover")
    b.table("Your plan", "Your first week, month and quarter", "Owners are suggestions. Adjust them to your structure and building portfolio.", ["When", "Actions", "Owner"], [
        ("First week", "Check every out-of-hours contact and escalation route. Confirm contractors' 24/7 numbers. Find any BMS, lift or plant controller reachable from the internet.", "Duty manager rota lead"),
        ("First week", "Draft and approve the Communication templates. Confirm who may send an evacuation message.", "Head of housing or facilities"),
        ("First month", "Audit records of residents who may need help: consent, contact preference, flat and floor. Confirm what the fire service holds.", "Building safety lead"),
        ("First month", "Remove internet exposure of building controls, change default passwords and agree remote access rules with contractors.", "Facilities and IT"),
        ("First month", "List the fire, building and housing duties for each building by country and city, using the regional notes as a starting point.", "Compliance lead"),
        ("First quarter", "Run the Tabletop exercise, including a strategy change and a BMS fault. Measure time to reach every resident.", "Building safety lead"),
        ("First quarter", "Review response clocks, the Incident decision log and resident engagement arrangements. Report to the board.", "Director of property")], "Reach, record, recover", "30mm 1fr 40mm")

    # PART 04
    b.mark("04", "Practical toolkit")
    b.toolkit_index()
    b.readiness()
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
        ("Decide whether the incident must be reported to a regulator", ["I", "R", "A", "", "", ""]),
        ("Keep the Incident decision log and lead the post-incident review", ["R", "A", "I", "C", "C", "C"])], "Practical toolkit",
        "The fire service decides the evacuation strategy; this matrix covers how you carry it out. Statutory duty-holders keep their legal duties whatever you delegate.", tool=True)
    b.decisionlog("Every decision on the night, with its reasons", "Use it from the first call to stand-down. One line per decision, including decisions not to act, so the post-incident review is built from the log, not from memory.",
        ("02:21", "Send the evacuation message to Block B only; Blocks A and C stay put", "One message to all three blocks; Block B only; wait for further fire service instruction", "Duty manager (incident lead)", "Incident commander ordered Block B out at 02:20; one message for all blocks would move A and C residents into smoke-free stairs unnecessarily", "Fire service instruction 02:20; message log ref B-EVAC-01"))
    b.escalation("Escalation", "Who is alerted, who decides, and when it goes up", "An illustrative route tied to the severity ladder. Each level names a decision owner, so nobody at 3am waits for permission that is not coming.", [
        ("Building report", "A caretaker, concierge, resident or BMS alarm reports a fault or hazard. Usually SEV 4 or 3.", "Out-of-hours line and building team; the contractor if a repair is needed.", "Duty manager on call, who sets the severity level.", "not acknowledged in 10 minutes, or residents' safety may be affected"),
        ("Duty manager", "SEV 2: firefighting lift out, heating lost in cold weather, flood near electrics, unexplained BMS changes.", "Duty manager, building safety lead, contractor, residents of affected floors, welfare lead.", "Duty manager, with the building safety lead.", "life is at risk, several blocks are affected, or residents must leave"),
        ("Incident control", "SEV 1: fire, gas escape, people trapped, a change to evacuation, or several blocks affected at once.", "Incident lead, head of housing or facilities, every affected resident, communications, fire service liaison.", "Incident lead. The fire service decides the evacuation strategy.", "a rest centre is needed, someone is badly hurt, or the media call"),
        ("Executive", "A prolonged SEV 1, residents displaced overnight, serious injury, or regulator and media scrutiny.", "Executive director, the senior duty-holder for the building, board chair, insurers, local authority emergency planning.", "Executive director, who also owns reports to regulators.", "")], "Practical toolkit",
        "Escalation is triggered by conditions, not by someone remembering to call. If a level has not acknowledged within its time limit, the next level is alerted under the rules you have set, and the delay is recorded.", tool=True)
    b.messages("Templates", "Six messages to approve before you need them", "Short, specific and written for the person reading at 2am. Keep SMS under 160 characters, send the same instruction on every channel, and put your local emergency number where shown.", [
        ("SMS", "Residents", "FIRE at Lowry House, floor 9. Stay in your flat unless fire or smoke affects it. If it does, get out and call [emergency number]. Updates to follow.", "Only while the strategy is stay put."),
        ("SMS", "Residents", "Lowry House: LEAVE THE BUILDING NOW by the stairs. Do not use lifts. If you cannot get out, call [emergency number] with your flat number.", "Strategy change. Voice call anyone who has not acknowledged."),
        ("Voice", "Residents who need help", "This is Northgate Housing. There is a fire at Lowry House. The fire service know you may need help. Keep your front door shut and press 1 to confirm you heard this.", "Only say the fire service know if they do."),
        ("Email", "Staff and contractors", "Incident at Lowry House from 02:10. On-call staff report to the incident lead. Contractors: make no remote changes to BMS, lift or alarm settings until the duty manager confirms.", "Stops resets that destroy evidence."),
        ("Email", "Regulator or authority", "Initial notification: fire at Lowry House reported 02:10. Fire service in attendance; Block B evacuated. Residents displaced: [number]. Next update by [time]. Contact: [duty manager].", "Facts only; follow the regulator's own form and deadline."),
        ("Holding line", "Media and families", "We are working with the fire service at Lowry House. Residents' safety is our priority. We will update this statement at 04:00.", "No speculation on cause or casualties.")], "Practical toolkit", tool=True)
    b.exercise("Exercise", "Lights out on the estate: a night-time exercise", "A night-time scenario across three blocks. Run it in the room or on the platform you would use for real, with the clock running.", [
        ("Duration", "Two and a half hours, including a 30-minute debrief"),
        ("Participants", "Duty managers, building safety, welfare, comms, a contractor; invite the fire service liaison"),
        ("Objective", "Reach every resident in three blocks and show who has not responded"),
        ("Facilitator", "Someone outside the on-call team, with an observer timing each decision")], [
        ("01:40", "Calls from Blocks A and C: lights out. A BMS alarm shows high temperature in the shared plant room.", "Who opens the incident, and at what level? Is this one incident or three?"),
        ("01:50", "Smoke reported in Block B's basement. The fire service is on its way. Lifts in all three blocks have stopped.", "What does each block hear first, and who approves the wording?"),
        ("02:05", "The incident commander decides to evacuate Block B. Blocks A and C stay put.", "How fast does the change reach every Block B resident without confusing A and C?"),
        ("02:20", "A third of Block B flats have not acknowledged, including three residents on the assistance register.", "Who chases, on which channel? What goes to the incident commander, and when?"),
        ("02:45", "A contractor offers to reset the plant controls remotely. A local reporter calls the out-of-hours line.", "Who decides on remote changes? What is recorded first? Who speaks to the media?"),
        ("03:30", "Power will not return to Block B tonight. Two residents use powered medical equipment.", "Who decides on a rest centre or hotels? How do displaced residents stay informed?")], "Practical toolkit",
        "Measure time to declare, time to first message for each block, time to reach every resident on the assistance register, and how many decisions were logged with reasons. Every gap goes on the actions tracker.", tool=True)
    b.pir("Review", "Reviewing a building emergency", "Hold the review within two weeks, while memories are fresh, and build it from the Incident decision log rather than recollection. Invite the fire service liaison and a resident representative where appropriate.", [
        ("What happened", "Timeline from first report to stand-down, block by block, taken from the log."),
        ("Who was reached, and how fast", "Residents messaged, acknowledged and not reached, by block and channel."),
        ("Residents who need help", "Was everyone on the assistance register reached or reported? Anyone missing from it?"),
        ("Decisions and who made them", "Severity, strategy change, rest centre, remote changes: who, when, on what information."),
        ("Where it went wrong", "Delays, missed hand-offs, confusing messages, gaps out of hours or with contractors."),
        ("Contractors and building systems", "Who attended, what they changed, and whether settings were recorded before any reset."),
        ("Duties and reports", "Fire service notifications, response clocks for hazards, and any report owed to a regulator."),
        ("Actions, owners, dates", "Each lesson becomes a tracked action with an owner, a due date and a check.")], "Practical toolkit", tool=True)

    b.mark("", "Questions, checklist and glossary")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("Reach", ["If we had to evacuate our tallest building tonight, how long would it take to reach every resident, and how would we know who we had missed?", "Do we know, for every building, which residents need help to leave, and does the fire service have that information with their consent?", "Who decides, at 3am, that an incident is SEV 1?"]),
        ("Control and proof", ["Which of our building systems can be reached from the internet, and who can change them?", "Could we produce a timed record of every message and decision from our last incident within a day?", "Do we know which fire, housing and workplace rules apply to each building, and are we meeting their timescales?"])], "Questions, checklist and glossary")
    b.checklist("Checklist", "Can you reach every resident?", "Tick what is true today. Anything blank is your next action.", [
        ("One out-of-hours route with escalation rules", "Tested in the last three months."),
        ("Approved Communication templates", "Including a stay put to evacuation change and a holding line."),
        ("Consented records of residents who need help", "With flat, floor, contact preference and review date."),
        ("Fire safety instructions issued to every resident", f"On arrival and at regular intervals. <b>UK:</b> every 12 months in blocks of flats.{R('fsr22')}"),
        ("Contractor 24/7 contacts and remote access rules", "No exposed controllers, no default passwords."),
        ("A clock for hazards in homes", f"Set by your local rules. <b>UK:</b> social landlords have 24 hours for emergency hazards.{R('awaab','awaab2')}"),
        ("Incident decision log in use", "Every incident, timestamped, with recipients and acknowledgements."),
        ("Night-time exercise in the last year", "Including vulnerable residents and a strategy change.")], "Questions, checklist and glossary")
    b.glossary("Words worth knowing", [
        ("Stay put", "A strategy in which residents not affected by fire or smoke remain in their homes, relying on fire-resisting construction."),
        ("Simultaneous evacuation", "Everyone leaves at once when the alarm sounds or when told to."),
        ("Assistance register", "A consented list of residents who may need help to leave or to stay safe, with contact preferences."),
        ("Emergency action plan", f"<b>US:</b> the plan an employer must have where an OSHA standard requires one.{R('osha')}"),
        ("Life Safety Code", f"<b>US:</b> NFPA 101, a model code that applies where a state or local jurisdiction adopts it.{R('nfpa101')}"),
        ("Responsible person", f"<b>UK:</b> the person with fire safety duties for the common parts of a building, usually the landlord or managing agent.{R('fsr22')}"),
        ("Higher-risk building", "<b>UK:</b> in occupation, a building at least 18 metres or seven storeys tall with at least two residential units."),
        ("Residential PEEP", f"<b>UK:</b> a personal emergency evacuation plan for a resident who cannot evacuate unaided.{R('rpeep')}"),
        ("Emergency hazard", f"<b>UK:</b> under Awaab's Law, a hazard posing an imminent and significant risk of harm that must be made safe within 24 hours.{R('awaab')}"),
        ("BMS", "Building management system: the controls that run heating, ventilation, lighting, pumps and sometimes access and lifts.")])
    b.platform("How an Operational Incident Coordination Platform works in a building emergency", "The three-block night incident from this playbook, followed through Crises Control from the first report to the record you hand the review.", [
        ("A concierge or caretaker raises an incident with a press-and-hold SOS alert, sharing their location where available.", "SOS"),
        ("Residents in the affected blocks get the stay-put or evacuation message by SMS, voice and push; those who do not acknowledge are re-alerted under the rules you configure.", "Ping"),
        ("The duty manager opens one incident across all three blocks, assigns roles and logs the fire service's strategy decision.", "Incident Manager"),
        ("Welfare calls, door-knocks and contractor call-outs become owned tasks with deadlines, assigned when the plan is activated.", "Task Manager"),
        ("The incident lead sees who has acknowledged, by the groups set up for each block, which tasks are open and what has escalated.", "Control Centre"),
        ("A timestamped record of every message, acknowledgement and decision logged, exportable for the review, an ombudsman or the regulator.", "Audit & Reporting"),
        ("Users ask CRAiG (beta) questions about the incident data they can see, such as which flats have not yet responded.", "CRAiG")])
    b.mark("", "Sources")
    items = sorted((n, SRC[k]) for k, n in order.items())
    b.sources([(f"{n:02d}", t) for n, t in items], "Sources were accessed in November 2026. Legal duties are summarised for orientation, not legal advice; read the regulations and official guidance for the full requirements. Building and organisation names in the examples are fictional.")
    b.art_back("Reach every resident,<br>every time.", "Crises Control is an Operational Incident Coordination Platform. It helps landlords, managing agents and facilities teams alert residents, occupiers, staff and contractors on several channels, track who has responded, coordinate the tasks that follow and keep a complete record of every decision.", "Request a demo",
        next_title="Intelligence report No. 02 · Safe homes, clear duties")
    assert set(order) == set(SRC), set(SRC) - set(order)
    return b
