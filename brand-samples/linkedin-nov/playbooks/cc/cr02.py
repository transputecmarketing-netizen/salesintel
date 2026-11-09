from cckit import CCReport, S

SRC = {
    "awaab": "Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025 (SI 2025/1042), made 23 September 2025, in force 27 October 2025, https://www.legislation.gov.uk/uksi/2025/1042/made",
    "awaab2": "MHCLG, Awaab's Law: Phase 2 guidance for social landlords, updated 31 July 2026, https://www.gov.uk/government/publications/awaabs-law-phase-2-guidance-for-social-housing-landlords/awaabs-law-phase-2-guidance-for-social-landlords",
    "parl": "UK Parliament, Statutory instrument procedure: Hazards in Social Housing (Prescribed Requirements) (England) (Amendment) Regulations 2026, laid 12 July 2026, approved 14 and 20 October 2026, https://api.parliament.uk/procedure/WorkPackages/8020",
    "gti1": "Grenfell Tower Inquiry, Phase 2 Report, Volume 1, Chapter 2 (executive summary), HC 19-I, 4 September 2024, https://assets.publishing.service.gov.uk/media/66d817aa701781e1b341dbd3/CCS0923434692-004_GTI_Phase_2_Volume_1_BOOKMARKED.pdf",
    "gti7": "Grenfell Tower Inquiry, Phase 2 Report, Volume 7, Chapter 113 (recommendations), 4 September 2024, https://assets.publishing.service.gov.uk/media/66d818059084b18b95709f86/CCS0923434692-004_GTI_Phase_2_Volume_7_BOOKMARKED.pdf",
    "govresp": "UK Government, Grenfell Tower Inquiry Phase 2 Report: Government Response, 26 February 2025 (updated 2 June 2025), https://www.gov.uk/government/publications/grenfell-tower-inquiry-phase-2-report-government-response/grenfell-tower-inquiry-phase-2-report-government-response-html",
    "fsr22": "Fire Safety (England) Regulations 2022 (SI 2022/547), in force 23 January 2023, https://www.legislation.gov.uk/uksi/2022/547/made",
    "rpeep": "Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 (SI 2025/797), made 3 July 2025, in force 6 April 2026, https://www.legislation.gov.uk/uksi/2025/797/made",
    "rrfso": "Regulatory Reform (Fire Safety) Order 2005 (SI 2005/1541), https://www.legislation.gov.uk/uksi/2005/1541/contents",
    "bsa91": "Building Safety Act 2022, section 91 (residents' engagement strategy), https://www.legislation.gov.uk/ukpga/2022/30/section/91",
    "bsa87": "Building Safety Act 2022, section 87 (mandatory occurrence reporting), https://www.legislation.gov.uk/ukpga/2022/30/section/87",
    "bsr": "MHCLG, BSR becomes standalone body in landmark step towards single construction regulator, 27 January 2026, https://www.gov.uk/government/news/bsr-becomes-standalone-body-in-landmark-step-towards-single-construction-regulator",
    "hos": "Housing Ombudsman, Annual Complaints Review 2025-26, 2026, https://www.housing-ombudsman.org.uk/annual-complaint-review-reports/annual-complaints-review-2025-26/",
    "certfr": "CERT-FR, Alert CERTFR-2026-ALE-012: security incident targeting remote controllers of refrigeration installations, 12 October 2026 (updated 13 and 16 October 2026), https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/",
    "censys": "Censys, European Refrigeration Controller Exposure: A Second Attack Wave, 5 November 2026, https://censys.com/blog/european-refrigeration-controller-exposure-sitrep",
    "cisa": "CISA, FBI, HHS, USDA and DoT, US Government Partners Urge Hardening Industrial Refrigeration and Cold Chain Monitoring Systems, fact sheet, 5 November 2026, https://www.ic3.gov/CSA/2026/261105.pdf",
    "record": "The Record, British businesses caught in Europe-wide supermarket fridge attacks (statements by NCSC officials), 3 November 2026, https://therecord.media/british-businesses-caught-in-europe-wide-supermarket-fridge-attacks",
    "pa": "PA Media, GCHQ alerting UK businesses after cyber attacks hit freezers across Europe (NCSC chief executive's remarks), November 2026, https://www.rhyljournal.co.uk/news/26709597.gchq-warns-uk-organisations-freezer-cyber-attacks/",
    "ncscot": "NCSC, Operational technology collection, including secure connectivity principles for OT, accessed November 2026, https://www.ncsc.gov.uk/collection/operational-technology",
}


def build():
    b = CCReport("Safe Homes, Clear Duties", 2, "elevator", "Property, Housing and Facilities", "16 November 2026")
    order = {}
    def R(*k):
        for x in k: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in k))
    b.how = "An evidence-based look at the duties that now govern how landlords and building managers keep residents safe and informed in an emergency, the lessons of the Grenfell Tower Inquiry, and the new risk to building controls."
    b.rep_cover("Intelligence report", "Safe homes,<br>clear duties.",
        "Awaab's Law, the Building Safety Act, new evacuation duties and attacks on building controls. What the evidence says about keeping residents safe and informed, and what UK landlords and building managers should do now.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("Telling residents what is happening, and proving you did, is now a legal duty as much as a courtesy.", [
        f"Since October 2025 social landlords in England have had 24 hours to investigate and make safe emergency hazards in tenants' homes.{R('awaab')} From 30 November 2026 the same regime extends to further hazards including fire, electrical hazards and excess cold.{R('awaab2','parl')} Responsible persons for multi-occupied residential buildings must already give residents fire safety instructions, and from April 2026 taller blocks need evacuation plans for residents who cannot get out unaided.{R('fsr22','rpeep')}",
        f"These duties follow the Grenfell Tower Inquiry. Its Phase 2 report found that the landlord's information about vulnerable residents was incomplete on the night of the fire, that the fire brigade's control room was not prepared for a flood of calls, and that the council had no effective system for communicating with those affected.{R('gti1')}",
        f"A new risk has joined the old ones. In October and November 2026, attackers reached internet-exposed refrigeration controllers across Europe, including at a few UK businesses.{R('certfr','record')} The UK's National Cyber Security Centre warned that heating and other building controls could also be at risk if left unprotected.{R('pa')}",
        "This report sets out the duties, the evidence behind them and the emerging threat, and ends with practical recommendations for UK landlords, managing agents and facilities leaders."],
        "Treat resident communication as part of the safety system: know who is in each building and who needs help, reach them in minutes on more than one channel, keep building controls off the internet, and keep a timestamped record of every decision.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("Response times are now law for social landlords.", f"Emergency hazards must be investigated and made safe within 24 hours of the landlord becoming aware of them.{R('awaab','awaab2')}"),
        ("The scope widens on 30 November 2026.", f"Phase 2 of Awaab's Law adds fire, electrical, excess cold and heat, falls, structural collapse and domestic hygiene hazards.{R('awaab2')}"),
        ("Residents must be told how to stay safe, every year.", f"Fire safety instructions go to new residents promptly and to all residents every 12 months.{R('fsr22')}"),
        ("Vulnerable residents now have specific rights.", f"In scope buildings, residents who cannot evacuate unaided must be offered an assessment and an evacuation plan.{R('rpeep')}"),
        ("Grenfell's communication failures were systemic.", f"Incomplete records of vulnerable residents, an overwhelmed control room and no way to reach displaced people all contributed.{R('gti1','gti7')}"),
        ("Communication is where landlords most often fail residents.", f"The Housing Ombudsman found poor communication and record keeping running through its most serious repairs cases in 2025-26.{R('hos')}"),
        ("Exposed building controls are a live target.", f"Attacks on refrigeration controllers in 2026 used internet-exposed interfaces and, in some cases, published default passwords.{R('certfr','record')}")])

    b.facts("Building safety and communication, in six figures", "Each figure is sourced. Legal duties are summarised; the regulations set out the detail.", [
        ("24 hours", f"To investigate and make safe an emergency hazard in social housing under Awaab's Law.{R('awaab')}"),
        ("30 Nov", f"2026: the date Phase 2 of Awaab's Law is due to apply, after approval by both Houses in October.{R('awaab2','parl')}"),
        ("58", f"Grenfell Phase 2 recommendations. The government accepted all of them, 49 in full and 9 in principle.{R('govresp')}"),
        ("12 months", f"How often residents of multi-occupied buildings must be given fire safety instructions.{R('fsr22')}"),
        ("62%", f"Share of Housing Ombudsman findings in 2025-26 that were maladministration.{R('hos')}"),
        ("53%", f"Fall in internet-exposed refrigeration controllers Censys observed between 9 October and 5 November 2026.{R('censys')}")], "At a glance")

    b.timeline("From Grenfell to Awaab's Law", "Key dates for residential and building safety communication.", [
        ("14 June 2017", "Grenfell Tower fire", f"Fire sweeps through the tower in a few hours. A public inquiry follows.{R('gti1')}"),
        ("23 January 2023", "Fire Safety (England) Regulations", f"Duties on resident information, fire doors, lifts and secure information boxes take effect.{R('fsr22')}"),
        ("4 September 2024", "Grenfell Phase 2 report", f"Fifty-eight recommendations, including on emergency planning and vulnerable residents.{R('gti7')}"),
        ("26 February 2025", "Government response", f"All 58 recommendations accepted, 49 in full and 9 in principle.{R('govresp')}"),
        ("27 October 2025", "Awaab's Law Phase 1", f"24-hour duty for emergency hazards, and damp and mould timescales, in social housing.{R('awaab')}"),
        ("27 January 2026", "Building Safety Regulator stands alone", f"The regulator leaves the HSE to become an arm's length body of MHCLG.{R('bsr')}"),
        ("6 April 2026", "Residential evacuation plans", f"Person-centred fire risk assessments and evacuation plans in scope buildings.{R('rpeep')}"),
        ("12 October to 5 November 2026", "Attacks on refrigeration controllers", f"CERT-FR alert, a second European wave, NCSC alerts to UK firms and a US fact sheet.{R('certfr','censys','record','cisa')}"),
        ("30 November 2026", "Awaab's Law Phase 2", f"Fire, electrical, excess cold and other hazards brought into the timescales.{R('awaab2')}")])

    # PART 01
    b.mark("01", "The new duties")
    b.opener("01", "The new<br>duties.", "What the law now requires landlords and building managers to do, and to tell residents.", [("01", "Awaab's Law and the 24-hour clock"), ("02", "The duties at a glance"), ("03", "Fire safety, evacuation and the regulator")])
    b.essay("Awaab's Law", "Awaab's Law and the 24-hour clock", [
        f"The Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025, known as Awaab's Law, came into force on 27 October 2025.{R('awaab')} They apply to social landlords in England.",
        f"An emergency hazard is defined as one that poses an imminent and significant risk of harm to the health or safety of an occupier, which a reasonable landlord would act on to make safe within 24 hours.{R('awaab')} The landlord must investigate and complete any safety work as soon as reasonably practicable, and within 24 hours of the duty applying.{R('awaab')} Government guidance puts it plainly: both must be completed within 24 hours of becoming aware of the hazard.{R('awaab2')}",
        f"The regulations also govern communication. After an investigation, the landlord must give the tenant a written document setting out its findings within three working days, and keep the tenant informed about the timing and progress of work.{R('awaab')} Where a home cannot be made safe in time, the landlord must secure suitable alternative accommodation at no cost to the household.{R('awaab')}",
        f"Phase 1 covered emergency hazards and significant damp and mould. Amending regulations, approved by the House of Lords on 14 October and the House of Commons on 20 October 2026, are due to extend the regime from 30 November 2026.{R('parl')} Phase 2 adds excess cold and heat, falls, structural collapse, fire and explosions, electrical hazards and domestic hygiene where they present a significant risk of harm.{R('awaab2')}",
        f"There is one carve-out that matters for building managers. Guidance states that Awaab's Law does not apply to fire hazards in communal areas already covered by the Regulatory Reform (Fire Safety) Order 2005, such as damaged fire doors or blocked escape routes, which remain for the responsible person.{R('awaab2','rrfso')} Fire hazards inside homes, such as broken smoke alarms, are in scope.{R('awaab2')}",
        "The practical effect is a clock that starts when a landlord becomes aware, often through an out-of-hours call. Meeting it depends on reports reaching the right person quickly and on a reliable record of when each step happened."],
        "Awaab's Law", "The clock starts when the landlord becomes aware, often through an out-of-hours call.")
    b.table("At a glance", "The duties that shape emergency communication", "England only. Summaries; the regulations and guidance contain conditions and exceptions.", ["Law", "Applies to", "What it requires on communication"], [
        ("Awaab's Law", f"Social landlords{R('awaab')}", "Emergency hazards investigated and made safe within 24 hours; written findings to tenants; progress updates."),
        ("Fire Safety (England) Regulations 2022", f"Responsible persons for multi-occupied residential buildings{R('fsr22')}", "Fire safety instructions and fire door information to residents; lift faults over 24 hours reported to the fire service in high-rise blocks."),
        ("Residential Evacuation Plans Regulations 2025", f"Blocks of 18m or seven storeys, or over 11m with simultaneous evacuation{R('rpeep')}", "Identify residents who need help, offer assessment and plans, share basic details with the fire service with consent."),
        ("Building Safety Act 2022, s91", f"Principal accountable persons for occupied higher-risk buildings{R('bsa91')}", "A residents' engagement strategy covering information, consultation and how views are taken into account."),
        ("Building Safety Act 2022, s87", f"Accountable persons for occupied higher-risk buildings{R('bsa87')}", "Prescribed safety occurrences reported to the Building Safety Regulator.")], "The new duties", "40mm 46mm 1fr")
    b.essay("Fire and evacuation", "Fire safety, evacuation and the regulator", [
        f"The Fire Safety (England) Regulations 2022 came into force on 23 January 2023.{R('fsr22')} In any building with two or more homes and common parts used for evacuation, the responsible person must display fire safety instructions covering the evacuation strategy and how to report a fire, give them to new residents promptly and to all residents every 12 months, and tell residents about fire doors.{R('fsr22')}",
        f"Buildings of at least 18 metres or seven storeys carry more. They need a secure information box, floor and building plans for the fire service, wayfinding signs that can be read in low light, and monthly checks of firefighting and evacuation lifts. A lift fault that cannot be fixed within 24 hours must be reported to the fire and rescue service, and so must the fix.{R('fsr22')}",
        f"From 6 April 2026, the Fire Safety (Residential Evacuation Plans) (England) Regulations 2025 apply to blocks of at least 18 metres or seven storeys, and to those over 11 metres with a simultaneous evacuation strategy.{R('rpeep')} The responsible person must use reasonable endeavours to identify residents who cannot evacuate unaided, offer a person-centred fire risk assessment, agree an emergency evacuation statement, and prepare a building emergency evacuation plan for the fire service. Basic details go to the fire service only with the resident's explicit consent.{R('rpeep')}",
        f"For higher-risk buildings, the Building Safety Act 2022 adds a residents' engagement strategy, setting out what information residents will receive about building safety decisions and what they will be consulted on, and a duty to report prescribed safety occurrences to the regulator.{R('bsa91','bsa87')}",
        f"The Building Safety Regulator became a standalone body sponsored by MHCLG on 27 January 2026, a step towards the single construction regulator the Grenfell Tower Inquiry recommended.{R('bsr')} The government's response to the inquiry also notes that statutory guidance now requires evacuation alert systems in new blocks of flats over 18 metres.{R('govresp')}"],
        "Fire and evacuation", "Basic details go to the fire service only with the resident's explicit consent.")

    # PART 02
    b.mark("02", "The lessons")
    b.opener("02", "The<br>lessons.", "What the Grenfell Tower Inquiry and the Housing Ombudsman say about communication when it matters most.", [("01", "What Grenfell revealed"), ("02", "Four failures of information"), ("03", "The everyday test")])
    b.essay("Grenfell Phase 2", "What the Grenfell Tower Inquiry found about communication", [
        f"The Phase 2 report, published on 4 September 2024, set out how a concrete tower became a death trap through the failings of many institutions over many years.{R('gti1')}",
        f"Before the fire, the landlord's emergency plan for the tower was out of date and incomplete, and the absence of fire action notices was a prominent subject of complaints by residents.{R('gti1')} Its data systems on vulnerable residents were not co-ordinated, and the spreadsheet available on the night was incomplete: a basic neglect of its fire safety obligations, the inquiry said.{R('gti1')}",
        f"During the fire, the London Fire Brigade had not prepared for a large number of calls from people needing rescue. Staff were forced to improvise ways of handling the information, and it had not produced contingency plans for a full evacuation.{R('gti1')}",
        f"After the fire, the response of government and the council in the first week was described as muddled, slow, indecisive and piecemeal.{R('gti1')} The council had no arrangements for identifying people forced from their homes or for communicating with them, and arrangements for obtaining and sharing reliable information were lacking.{R('gti1')}",
        f"The inquiry's recommendations follow from this. Local authorities should practise recording information about displaced people and communicate continuously with those who need help, in suitable languages. Responsible persons should collect enough information about vulnerable occupants to assist their escape.{R('gti7')}",
        "None of these failures needed new technology to avoid. They needed current records, rehearsed plans and someone accountable for telling people what was happening."],
        "Grenfell Phase 2", "None of these failures needed new technology to avoid. They needed current records and rehearsed plans.")
    b.figpage("Four failures", "Four failures of information the inquiry identified", "Each has a direct counterpart in today's duties.", "elevator", [
        ("Records of who needs help", f"Incomplete information on vulnerable residents on the night. Now addressed by residential evacuation plans in scope buildings.{R('gti1','rpeep')}"),
        ("Instructions residents can follow", f"An out-of-date emergency plan and missing fire action notices. Now addressed by annual fire safety instructions.{R('gti1','fsr22')}"),
        ("Handling a surge of calls", f"No preparation for many simultaneous calls for rescue, and improvised information handling.{R('gti1')}"),
        ("Reaching people afterwards", f"No system to identify or communicate with displaced residents, and no reliable records.{R('gti1','gti7')}")], "The lessons")
    b.essay("The everyday test", "The everyday test: what the Ombudsman sees", [
        f"Emergencies test communication that is already in place. The Housing Ombudsman's Annual Complaints Review for 2025-26 shows how often that everyday communication falls short. Of its findings, 62% were maladministration and a further 2% severe maladministration.{R('hos')}",
        f"Responsive repairs featured in 80% of cases and accounted for most severe findings. Across those severe cases, the Ombudsman identified poor communication and inadequate record keeping as recurring failures.{R('hos')} Damp, mould and leaks made up a large share of repairs complaints, the same territory Awaab's Law now governs.{R('hos')}",
        f"The Ombudsman reports that Awaab's Law cases are beginning to reach it, and that early insights suggest landlords are struggling to identify them and respond within the timescales.{R('hos')}",
        "Records matter as much as messages. A landlord that cannot show when it was told about a problem, what it did and what it told the resident will find the same gap exposed when an emergency hazard and its 24-hour clock are disputed.",
        "The lesson for landlords is uncomfortable but useful. A resident who has waited weeks for a reply about a leak will not trust an instruction to stay put at 2am. Trust built in ordinary times is what makes emergency messages work."],
        "The everyday test", "A resident who has waited weeks for a reply about a leak will not trust an instruction to stay put at 2am.")

    # PART 03
    b.mark("03", "The new threat")
    b.opener("03", "The new<br>threat.", "Building controls connected to the internet, and what the 2026 attacks mean for landlords and facilities teams.", [("01", "When building controls are attacked"), ("02", "What good control looks like"), ("03", "What it means for UK organisations")])
    b.essay("Building controls", "When building controls are attacked", [
        f"On 12 October 2026 France's national CERT issued an alert after numerous compromises of remote controllers for refrigeration installations, naming Danfoss AK-SM and AK-SC, Copeland XWEB and Dixell XWEB products.{R('certfr')} It said attack campaigns were probably still under way and that exposing these management interfaces to the internet was contrary to good practice.{R('certfr')}",
        f"Censys reported that the night of 11 October attacks switched units at hundreds of French supermarkets into defrost. Overnight on 2 November, grocers in Belgium, Estonia, Ireland, Luxembourg, the Netherlands and Sweden reported similar attacks.{R('censys')} In the UK, three members of the Association of Independent Meat Suppliers and a fruit and vegetable wholesaler were affected; no stock was reported lost.{R('record')}",
        f"The NCSC's director of operations said the attacks used vulnerabilities that had been out there for a long time and were not sophisticated. Its chief executive called them the foothills of a wider threat.{R('record')} In remarks reported by PA Media, he named heating and refrigeration controls among systems often under-secured.{R('pa')}",
        f"US agencies described the risk in terms any building manager will recognise. Attackers could change temperatures, creating fire hazards and equipment damage, and cause a loss of visibility of current conditions. Their advice: remove internet exposure, separate operational technology from business networks, change default passwords, patch or replace end-of-life devices, log activity and set safe limits with alerts.{R('cisa')}",
        f"No compromise of a UK building management system was confirmed in this wave, and we found no public evidence that residential buildings were targeted. But the controllers that run heating, ventilation, lifts, pumps and smoke control are often managed remotely by contractors in the same way. CERT-FR warns that resetting an end-of-life device that stays exposed leaves it open to reinfection.{R('certfr')} The NCSC publishes guidance on secure connectivity for operational technology.{R('ncscot')}"],
        "Building controls", "Exposed controllers were reached with weaknesses that had been known for a long time.")
    b.compare("Building controls", "What most organisations get wrong", "Building controls are usually owned by facilities, maintained by contractors and invisible to IT. That gap is where the risk sits.", ["Area", "What often happens", "What good looks like"], [
        ("Inventory", "Nobody holds a list of BMS, lift, plant and refrigeration controllers.", "A list of every controller, its location, owner, contractor and how it is reached."),
        ("Remote access", "A web page left open so a contractor can log in from anywhere.", f"Access only through a secured connection, with internet exposure removed.{R('certfr','cisa')}"),
        ("Passwords", "Factory defaults, sometimes printed in public manuals.", f"Defaults changed, accounts named, stronger authentication where feasible.{R('record','cisa')}"),
        ("Lifecycle", "Controllers run for years past vendor support.", f"End-of-life devices identified, isolated and replaced.{R('cisa')}"),
        ("Monitoring", "Changes noticed only when residents complain.", f"Safe setpoint limits with alerts, and logs reviewed.{R('cisa')}"),
        ("In an incident", "A contractor resets the device remotely.", "Settings recorded first, access cut, residents told what to expect.")], "The new threat")
    b.essay("UK relevance", "What it means for UK organisations in Property, Housing and Facilities", [
        f"For social landlords, the immediate priority is the Awaab's Law clock. From 30 November 2026 more hazards fall within it, including electrical faults and excess cold.{R('awaab2')} Out-of-hours reporting routes, contractor response and the record of when the landlord became aware will be tested more often.",
        f"For anyone responsible for a block of flats, fire safety communication is a standing duty, not a one-off. Annual instructions, fire door information and, in taller buildings, lift fault reporting are already required.{R('fsr22')} In scope buildings, residents who need help to evacuate must be identified and offered plans, with consent to share basic details.{R('rpeep')}",
        f"For higher-risk buildings, the residents' engagement strategy and mandatory occurrence reporting create a clear expectation of what residents are told, and what the regulator hears about.{R('bsa91','bsa87')} A standalone regulator focused on building safety is likely to ask for evidence.{R('bsr')}",
        f"For facilities teams in offices, campuses and mixed-use buildings, the 2026 attacks are a prompt to find every building controller that can be reached from the internet. Loss of heating, ventilation or access is an operational emergency, and in residential settings a welfare one.{R('cisa','pa')}",
        f"Across all of these, the Grenfell findings point to the same capabilities: current records of who is in the building and who needs help, rehearsed ways of reaching people quickly, and reliable records of what was done.{R('gti1','gti7')}"],
        "UK relevance", "Out-of-hours reporting, contractor response and the record of awareness will be tested more often.")
    b.steps("Recommendations", "Seven steps for landlords and building managers", "", [
        ("Map the clock", f"Trace how an out-of-hours hazard report reaches a decision-maker, and how awareness is timed.{R('awaab','awaab2')}"),
        ("Know who needs help", f"Current, consented records of residents who may need help to evacuate.{R('rpeep','gti7')}"),
        ("Take building controls off the internet", f"Inventory BMS and plant controllers, remove exposure and change default passwords.{R('certfr','cisa')}"),
        ("Approve messages in advance", f"Templates for each emergency, consistent with residents' fire safety instructions.{R('fsr22')}"),
        ("Reach people on more than one channel", f"Use suitable technology and languages, and track who has not acknowledged.{R('gti7')}"),
        ("Log every decision", "Timestamp each alert, decision and acknowledgement."),
        ("Exercise at night", "Rehearse a night incident with a strategy change, at least annually.")], "What to do")
    b.questions("For the board", "Questions boards should ask this quarter", "Answers should be specific, dated and owned.", [
        ("Duties", ["Are we meeting the 24-hour emergency hazard timescale, and are we ready for the hazards added on 30 November?", "In which of our buildings do residential evacuation plan duties apply, and how many residents have been offered an assessment?", "When did every resident last receive fire safety instructions?"]),
        ("Readiness", ["How long would it take to reach every resident of our largest building at 3am, and how would we know who we had missed?", "Which of our building controllers can be reached from the internet, and who can change them?", "Could we produce a timed record of every decision from our last serious incident?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("Awaab's Law", "The common name for the Hazards in Social Housing (Prescribed Requirements) (England) Regulations 2025."),
        ("Emergency hazard", "A hazard posing an imminent and significant risk of harm that a reasonable landlord would make safe within 24 hours."),
        ("Responsible person", "The person with duties under the Fire Safety Order for the common parts of a building."),
        ("Higher-risk building", "In occupation, a building at least 18 metres or seven storeys tall with at least two residential units."),
        ("Accountable person", "A person who holds a legal estate in, or has a repairing obligation for, the common parts of a higher-risk building."),
        ("Residential PEEP", "A personal emergency evacuation plan for a resident who cannot evacuate unaided."),
        ("Simultaneous evacuation", "A strategy in which everyone leaves at once, used where stay put is not appropriate."),
        ("Safety occurrence", "An incident or situation relating to fire spread or structural integrity that must be reported to the regulator."),
        ("BMS", "Building management system: controls for heating, ventilation, lighting, pumps and sometimes lifts and access."),
        ("Operational technology", "Systems that monitor and control physical equipment, as opposed to business IT.")])

    b.mark("", "Sources")
    items = [(f"{n:02d}", SRC[k]) for k, n in sorted(order.items(), key=lambda x: x[1])]
    assert set(order) == set(SRC), set(SRC) - set(order)
    b.sources(items[:10])
    b.sources(items[10:], "Sources continued. Secondary reporting is used only where primary statements were not published.")
    b.rep_back("Is every resident<br>reached?", "Crises Control helps landlords, managing agents and facilities teams alert residents, occupiers, staff and contractors in seconds, track who has responded and keep a complete, timestamped record of every decision.", "Request a demo",
        companion="Crisis playbook No. 02 · Every resident reached")
    return b
