from cckit import CCReport, S


def build():
    b = CCReport("When the Tills Go Dark", 3, "plot", "Retail", "23 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at the incidents that have tested UK and European retailers since 2025: cyber attacks that stopped online trading, a rogue message to app users, refrigeration controllers switched off from the internet, violence against shop workers and the new laws that follow."
    b.rep_cover("Intelligence report", "When the tills<br>go dark.",
        "M&S, Co-op, Ahold Delhaize, ASOS and the supermarket fridge attacks. What the evidence shows about retail disruption, colleague safety and the laws coming into force, as peak trading begins.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("Retail disruption now starts in systems most shoppers never see, and ends on the shop floor.", [
        f"In April 2025 a cyber attack forced Marks and Spencer to pause online orders for 46 days; it estimated the hit to operating profit at around £300m before mitigation and later booked £131.3m of incident costs against £100m of insurance proceeds.{R(1,2,4)} The Co-op lost an estimated £206m of sales in six months and confirmed that data on all 6.5 million members had been taken.{R(5,6)}",
        f"Autumn 2026 brought new patterns. Ahold Delhaize took systems offline in October and expects fourth-quarter sales to be €200m to €250m lower.{R(8)} ASOS app users received an unauthorised push notification after an employee's credentials were obtained by impersonation.{R(11)} And attackers switched supermarket refrigeration into defrost: around 700 French supermarkets were affected in October, and a second wave on 2 November reached Ireland, Belgium, Sweden and UK food suppliers.{R(14,15,17)}",
        f"On the shop floor, the BRC estimates over 1,600 incidents of violence and abuse against retail staff a day.{R(21)} A specific offence of assaulting a retail worker is now in the Crime and Policing Act 2026 but is not yet in force, and Martyn's Law will require larger shops to plan for evacuation, invacuation, lockdown and communication.{R(23,26)}",
        "This report sets out what happened, separates disclosed figures from claims, and ends with practical steps for UK retail leaders before and during peak."],
        "Treat payment, store systems, refrigeration controllers and colleague safety as one resilience problem, owned at board level, with a single way to alert and coordinate every store and a plan rehearsed before peak.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("Shutting systems down is often the right call, and it is expensive.", f"M&S, the Co-op and Ahold Delhaize all took systems offline to contain attacks; each then faced weeks of disrupted online trading, availability or supply.{R(5,8,3)}"),
        ("Stores kept trading, but not normally.", f"Shops stayed open in every case, yet colleagues dealt with payment problems, empty shelves, wrong shelf prices and failed loyalty scanners.{R(2,5,10)}"),
        ("People, not code, opened the door.", f"M&S says attackers tricked staff at a third-party contractor; ASOS says an attacker impersonated a trusted contact to obtain an employee's credentials.{R(2,11)}"),
        ("Recovery takes months, not days.", f"M&S restored its online offer in August 2025 and recorded £131.3m of incident costs for the year; its fashion recovery took longer than expected.{R(3,4)}"),
        ("Operational technology is now a retail attack surface.", f"CERT-FR reported numerous compromised refrigeration controllers. Danfoss said most affected units were end of life and no longer patched.{R(13,14)}"),
        ("Violence remains high even as it falls.", f"Incidents fell to 1,617 a day from over 2,000, but remain far above the 455 a day recorded in 2019 to 2020.{R(21)}"),
        ("New legal duties are coming, but not yet live.", f"The retail worker assault offence and Martyn's Law duties are both enacted but awaiting commencement.{R(23,26)}")])

    b.facts("Retail disruption, in six figures", "Each figure is sourced. Some are company estimates that may change as results are finalised.", [
        ("46 days", f"How long M&S stopped taking online clothing and home orders in 2025.{R(2)}"),
        ("£206m", f"Sales the Co-op estimates it lost to its 2025 cyber attack in the first half alone.{R(5)}"),
        ("€250m", f"Upper end of Ahold Delhaize's expected fourth-quarter 2026 sales hit, estimated at €200m to €250m.{R(8)}"),
        ("About 700", f"French supermarkets affected by the October 2026 refrigeration attacks, according to the French finance minister.{R(14)}"),
        ("1,617", f"Incidents of violence and abuse against UK retail staff a day, September 2024 to August 2025.{R(21)}"),
        ("£18m or 5%", f"Maximum Martyn's Law penalty for enhanced duty premises: £18m or 5% of worldwide revenue.{R(26)}")], "At a glance")

    b.timeline("From one Easter weekend to peak 2026", "Key dates. Company dates are as disclosed; incident dates as reported.", [
        ("25 April 2025", "M&S pauses online orders", f"After contactless and click and collect problems over Easter. The pause lasts 46 days.{R(2)}"),
        ("1 May 2025", "NCSC steps in", f"The NCSC confirms it is working with UK retailers affected by cyber incidents.{R(7)}"),
        ("16 July 2025", "Co-op data confirmed", f"The Co-op says data on all 6.5 million members was taken.{R(6)}"),
        ("24 February 2026", "BRC Crime Report", f"Violence and abuse against retail staff falls to 1,617 incidents a day.{R(21)}"),
        ("29 April 2026", "Crime and Policing Act", f"Royal Assent for the Act containing a new retail worker assault offence.{R(24)}"),
        ("6 October 2026", "ASOS app alert", f"App users receive an unauthorised push notification claiming a hack.{R(11,12)}"),
        ("11 to 12 October", "Two retail shocks", f"Ahold Delhaize takes systems offline; CERT-FR warns of compromised fridge controllers.{R(9,13)}"),
        ("2 November 2026", "Second fridge wave", f"Stores in Ireland, Belgium and Sweden, and UK food suppliers, are hit.{R(15,16,17)}"),
        ("4 to 5 November", "Costs and warnings", f"Ahold Delhaize cuts guidance; US agencies warn about refrigeration controllers.{R(8,19)}")])

    # PART 01
    b.mark("01", "The outage")
    b.opener("01", "The<br>outage.", "Four incidents, four ways a retailer's systems can stop it trading normally.", [("01", "2025: the spring that emptied shelves"), ("02", "2026: the back office and the app"), ("03", "Four incidents compared")])
    b.essay("The outage", "2025: the spring that emptied the shelves", [
        f"M&S first disclosed a cyber incident on 22 April 2025, after problems with contactless payments and click and collect over the Easter weekend. On 25 April it stopped taking online orders for clothing and home, and did not restart them for 46 days. It said attackers had got in by tricking staff at a third-party contractor.{R(2)}",
        f"The company's own account shows how a cyber response becomes an operational one. Containing the attack meant disconnecting warehouse management systems, which paused online orders, click and collect and in-store ordering. Manual processes were introduced to keep forecasting, ordering and replenishment going, and customers could shop in stores throughout.{R(3)}",
        f"The cost was large but smaller than first feared. In May 2025 M&S estimated a hit to operating profit of around £300m before mitigation.{R(1)} A year later it reported £131.3m of incident costs within adjusting items and £100m of insurance proceeds, describing 2025/26 as a year of two halves.{R(4)} Its online offer was restored in August 2025.{R(3)}",
        f"The Co-op took a different path to the same place. It shut down systems to contain its attack and kept stores trading, but faced payment problems and stock shortages.{R(5)} It estimated lost sales of at least £206m and an £80m profit hit in the six months to 5 July 2025, with around £120m expected for the full year.{R(5)} It later confirmed that names, addresses and contact details of all 6.5 million members had been taken, with no financial data involved.{R(6)}",
        f"In July 2025 the National Crime Agency arrested four people in connection with attacks on M&S, the Co-op and Harrods.{R(6)} The NCSC called the incidents a wake-up call for all organisations.{R(7)}",
        "The lesson for retailers is not that systems should never be switched off. It is that every shutdown decision has a store and supply chain consequence that must be planned for in advance."],
        "The outage", "Every shutdown decision has a store and supply chain consequence that must be planned for in advance.")
    b.essay("The outage", "2026: the back office and the customer's phone", [
        f"On 11 October 2026 Ahold Delhaize took some systems offline after identifying a security issue in its network. It said stores remained open and that it had no evidence that customer or associate data had been stolen.{R(9,10)}",
        f"The effects were felt most online and in logistics. Albert Heijn's online ordering reopened on 23 October, with delivery fleets initially running at about a third of normal capacity. In stores, some electronic shelf labels showed outdated promotional prices and digital loyalty card scanners temporarily failed.{R(10)}",
        f"On 4 November the group set out the bill. It expects the incident to cut fourth-quarter net sales by €200m to €250m and operating income by €75m to €100m, mostly through disruption to online capabilities in the Benelux and the US and to Benelux supply chain operations. Its chief executive said most of the disruption was contained within two weeks.{R(8)}",
        f"ASOS faced a different kind of incident. On 6 October 2026 app users received a push notification claiming the retailer had been hacked and urging staff to make contact.{R(11)} ASOS said an attacker had obtained an employee's login credentials by impersonating a trusted contact, then used them to access information on certain third-party platforms and send the notification. It said names and contact details may have been accessed, but not payment card details or passwords.{R(11)}",
        f"The market reacted before the facts were known: ASOS shares fell as much as 15% in London that day.{R(12)} The attacker's claim of a wider data compromise had not been confirmed when this report was written.",
        "Two lessons stand out. Customer channels such as push notifications are now part of the incident surface. And the first public sign of an attack may be a message your customers see before your own teams do."],
        "The outage", "The first public sign of an attack may be a message your customers see before your own teams do.")
    b.table("Four incidents", "What was hit, what kept working, what it cost", "Disclosed figures only. Company estimates may be revised.", ["Retailer", "What was hit", "What kept working", "Disclosed impact"], [
        ("M&S, 2025", f"Online orders paused 46 days; warehouse systems disconnected.{R(2,3)}", f"Stores traded throughout, with manual processes.{R(3)}", f"£131.3m incident costs; £100m insurance.{R(4)}"),
        ("Co-op, 2025", f"Systems shut down; payment problems and stock shortages.{R(5)}", f"Stores kept trading.{R(5)}", f"At least £206m lost sales in H1; 6.5m members' data taken.{R(5,6)}"),
        ("Ahold Delhaize, 2026", f"Online in the Benelux and US; Benelux supply chain.{R(8)}", f"Stores stayed open; online reopened after about two weeks.{R(9,10)}", f"Q4 sales down €200m to €250m (estimate).{R(8)}"),
        ("ASOS, 2026", f"Push notification channel; data on third-party platforms.{R(11)}", f"Shopping continued; no card data or passwords taken, it says.{R(11)}", f"Names and contact details may be exposed; shares fell up to 15% on the day.{R(11,12)}")], "The outage", "30mm 1fr 1fr 1fr")

    # PART 02
    b.mark("02", "The store itself")
    b.opener("02", "The store<br>itself.", "When the threat is a warm freezer or an aggressive customer, the incident starts and ends with the people on shift.", [("01", "The fridge attacks"), ("02", "How a controller becomes a weapon"), ("03", "Violence, abuse and the law")])
    b.essay("The fridge attacks", "When the freezer is switched off from the internet", [
        f"On 12 October 2026 France's CERT-FR warned that it knew of numerous compromises of remote controllers for refrigeration installations: Danfoss AK-SC and AK-SM series and Copeland and Dixell XWEB systems. It said exposing a management interface on the internet runs against good practice, and that attack campaigns were probably still under way.{R(13)}",
        f"The French finance minister told lawmakers that about 700 supermarkets were affected. Retailers including Carrefour, Coopérative U, E.Leclerc, Intermarché and Monoprix confirmed impact, and two supermarkets in Alsace reported combined losses of €270,000. Danfoss said most affected units were end-of-life models no longer receiving patches.{R(14)}",
        f"A second wave on 2 November reached other countries. Le Monde Informatique reported around 40 Delhaize stores in Belgium, ICA stores in Sweden and at least 13 SuperValu stores in Ireland, with attackers again triggering defrost cycles.{R(15)} SuperValu's owner took chilled and frozen products off sale as a precaution and said all stores were trading normally by that evening.{R(16)}",
        f"The UK was not untouched. Members of the Association of Independent Meat Suppliers and a London fruit and vegetable wholesaler had equipment switched to defrost, but no stock was lost.{R(17,18)} The NCSC said it was working with affected organisations and that the impact so far was minimal; no UK supermarket chain had been confirmed as directly affected.{R(17,18)}",
        f"On 5 November US agencies including CISA and the FBI warned of ongoing attacks on refrigeration and cold chain monitoring systems, citing inventory loss, fire hazards and unsafe storage conditions.{R(19)}",
        f"For food retailers this is a food safety issue as much as a cyber one. In England, Wales and Northern Ireland chilled food must legally be kept at 8°C or below.{R(27)} A store that cannot prove its cold chain held has to assume it did not."],
        "The fridge attacks", "A store that cannot prove its cold chain held has to assume it did not.")
    b.figpage("How it works", "Four steps from exposed panel to empty shelf", "As described by CERT-FR, vendors and US agencies.", "relay", [
        ("Find the panel", f"Controller web interfaces reachable from the internet, often on end-of-life kit.{R(13,14)}"),
        ("Get in", f"Authentication flaws and weak or default passwords, some long since patched.{R(14,17,19)}"),
        ("Change the settings", f"Defrost triggered or stretched, or units pushed into heating.{R(15,19)}"),
        ("Leave the store to cope", f"Stock is discarded and staff must check, quarantine and restock.{R(14,16)}")], "The store itself")
    b.essay("Violence and the law", "Violence, abuse and the laws catching up", [
        f"The BRC Crime Report 2026 estimates more than 1,600 incidents of violence and abuse against retail staff a day, about 590,000 in the year to August 2025. That is down from over 2,000 a day the year before, but far above the 455 a day recorded in 2019 to 2020.{R(21)} Around 118 incidents a day involved physical violence, and incidents involving a weapon fell from 68 to 36 a day.{R(21)}",
        f"Reporting remains patchy. Only 15% of all incidents of abuse, threats and violence were reported to the police, although retailers reported 55% of physically violent incidents.{R(21)} Usdaw's own survey of 9,481 retail staff found 77% had been verbally abused in the previous year, 53% threatened and 10% assaulted.{R(22)}",
        f"The law is changing. The Crime and Policing Act 2026 received Royal Assent on 29 April 2026.{R(24)} Section 45 makes it an offence to assault a retail worker at work, covering anyone working on or about retail premises for the owner or occupier, including unpaid work, and is triable summarily with up to six months in prison, a fine or both.{R(23)} The legislation.gov.uk text still marks the section as prospective: it is not yet in force, and no commencement date has been published.{R(23,24)}",
        f"Section 46 adds a duty on courts to make a criminal behaviour order for the offence, subject to conditions in the Act, and section 47 makes theft from a shop triable either way whatever the value of the goods, ending the £200 threshold.{R(25,21)}",
        f"Martyn's Law adds a different duty. The Terrorism (Protection of Premises) Act 2025 applies to premises wholly or mainly used for listed purposes, including shops, where 200 or more people can reasonably be expected at the same time.{R(26)} Standard tier premises will need evacuation, invacuation, lockdown and communication procedures, so far as is reasonably practicable, and must notify the SIA.{R(26)} The implementation period is at least 24 months from Royal Assent on 3 April 2025.{R(26)}"],
        "Violence and the law", "A specific offence of assaulting a retail worker is now law, but is not yet in force.")
    b.table("The law", "What the new rules say, and when they bite", "Status as at 9 November 2026. Check legislation.gov.uk and GOV.UK for commencement.", ["Measure", "What it does", "Status"], [
        ("Crime and Policing Act 2026, s.45", f"Offence of assaulting a retail worker at work; up to six months, a fine or both.{R(23)}", f"Enacted 29 April 2026; not yet in force.{R(23,24)}"),
        ("Crime and Policing Act 2026, s.46 and s.47", f"Duty on courts to make a criminal behaviour order, subject to conditions; shop theft triable either way whatever the value.{R(25)}", "Enacted; check commencement before relying on them."),
        ("Martyn's Law, standard tier", f"200 to 799 people: notify the SIA; evacuation, invacuation, lockdown and communication procedures.{R(26)}", f"Not yet in force; at least 24 months from 3 April 2025.{R(26)}"),
        ("Martyn's Law, enhanced tier", f"800 or more people: public protection measures and wider duties; penalties up to £18m or 5% of worldwide revenue.{R(26)}", f"Not yet in force; standard tier penalties up to £10,000.{R(26)}"),
        ("UK food hygiene law", f"Chilled food kept at 8°C or below in England, Wales and Northern Ireland.{R(27)}", "In force now.")], "The store itself", "44mm 1fr 52mm")

    # PART 03
    b.mark("03", "What to do now")
    b.opener("03", "What to<br>do now.", "What the evidence means for UK organisations in retail, and the steps that close the gap before and during peak.", [("01", "What it means for UK retail"), ("02", "Where retailers get it wrong"), ("03", "Recommendations and board questions")])
    b.essay("UK relevance", "What it means for UK organisations in Retail", [
        f"The NCSC's Annual Review records 80 nationally significant incidents in the year to August 2026, out of 337 that needed its support.{R(20)} Retailers were among the most visible of those affected in 2025, and the refrigeration attacks show the threat now reaches equipment that most IT teams have never inventoried.{R(7,17)}",
        f"The BRC's own members ranked cyber crime as their second biggest financial concern related to crime, after customer theft.{R(21)} The evidence above shows why. A cyber incident in retail is rarely just an IT event: it becomes a store event, a supplier event, a customer event and often a food safety event within hours.",
        "The common thread is coordination. In each case, the hardest work was keeping stores trading safely while head office contained the problem: telling managers what to do, telling customers what still worked and making sure nobody was left guessing. That work depends on fast, two-way communication with every store and a clear record of who has been told what.",
        "Colleague safety sits alongside this. Violence and abuse is a daily reality, peak trading raises the pressure, and two new legal frameworks are on the way. Retailers that improve reporting now will be ready to use the new offence when it commences, and those that write and rehearse their four Martyn's Law procedures now will not be scrambling when the duties begin.",
        "For UK retail leaders, the test before Black Friday is practical. Could every store receive and acknowledge one clear instruction within ten minutes? Could you list every fridge controller and building system that faces the internet? And would a colleague who was assaulted on the busiest Saturday of the year be looked after, and the incident reported?"],
        "UK relevance", "A cyber incident in retail becomes a store, supplier, customer and food safety event within hours.")
    b.compare("Common gaps", "Where retailers get it wrong", "The gap is rarely technology. It is ownership, communication and rehearsal.", ["Area", "What often happens", "What good looks like"], [
        ("Store communication", "Head office decides; stores hear about it from customers or social media.", "Every decision has a store message, sent at once and acknowledged by every manager."),
        ("Shutdown decisions", "Systems are switched off with no view of what stores lose.", "A pre-agreed map of each system's store and supply chain dependencies."),
        ("Operational technology", "Fridge and building controllers left on the internet, run by contractors.", "Controllers inventoried, off the internet and reached only through secure access."),
        ("Third parties", "Contractor and help desk access assumed to be safe.", "Supplier access reviewed, limited and verified, with tested reset procedures."),
        ("Colleague safety", "Abuse treated as part of the job and rarely reported.", "Every incident logged and reported, with aftercare and store risk reviews."),
        ("Peak readiness", "Plans written for a quiet Tuesday.", "Rehearsed for a Saturday in December, with peak on-call rotas.")], "What to do")
    b.steps("Recommendations", "Seven steps before peak", "In priority order.", [
        ("Give stores and head office one severity scale", "Shared triggers, owners and update rhythm for stores and the crisis team."),
        ("Make every shutdown decision store-aware", f"Map what stores, online and supply chain lose with each system, and pre-write the store instruction.{R(3,10)}"),
        ("Get operational technology off the internet", f"Inventory fridge controllers and building systems, remove internet exposure and replace end-of-life kit.{R(13,19)}"),
        ("Harden people-based access", f"Train help desks and staff against impersonation and tighten contractor access.{R(2,11)}"),
        ("Pre-approve messages for every audience", "Stores, colleagues, customers, suppliers and media, each with the next update time."),
        ("Report and support every assault", f"Make reporting easy, follow up every incident, prepare for the new offence.{R(21,23)}"),
        ("Rehearse before Black Friday", f"Exercise a payment outage, a cold-chain incident and a lockdown; draft Martyn's Law procedures.{R(26)}")], "What to do")
    b.questions("For the board", "Questions boards should ask this quarter", "Answers should be specific, dated and owned.", [
        ("Trading", ["If we had to take core systems offline tomorrow, which stores, channels and suppliers would stop, and how would we tell them?", "How many of our refrigeration controllers and building systems are reachable from the internet?", "How quickly can every store acknowledge a single instruction?"]),
        ("People and law", ["How many assaults on colleagues were reported last quarter, and what support followed?", "Which of our stores are likely to be in scope of Martyn's Law, and in which tier?", "When did we last rehearse an incident with store and head office together?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("Push notification", "A message sent by an app straight to a customer's phone screen."),
        ("Social engineering", "Tricking a person into giving access, for example by impersonating a colleague or supplier."),
        ("Refrigeration controller", "A device that runs fridges and freezers, often reachable remotely by engineers."),
        ("Defrost cycle", "A scheduled warm-up that clears ice. Stretched or repeated, it spoils stock."),
        ("End of life", "When a manufacturer stops issuing security fixes for a product."),
        ("Operational technology", "Systems that control physical equipment, such as refrigeration, lighting or access."),
        ("Adjusting items", "Costs a company reports separately from underlying profit, such as one-off incident costs."),
        ("Prospective", "A provision that is law but has not yet been brought into force."),
        ("Invacuation", "Moving people to a safer place inside a building, away from danger outside."),
        ("SIA", "The Security Industry Authority, which will regulate Martyn's Law."),
        ("Standard and enhanced tier", "Martyn's Law categories for premises expecting 200 to 799 people, and 800 or more."),
        ("Cold chain", "Keeping chilled and frozen food at safe temperatures from supplier to shelf.")])

    b.mark("", "Sources")
    src = [
        "M&S, Full Year Results 2024/25, 21 May 2025, https://corporate.marksandspencer.com/newsroom/press-releases/full-year-results-52-weeks-ended-29-march-2025",
        "Reuters via Insurance Journal, After 46-day cyberattack pause, M&S resumes online orders, 10 June 2025, https://amp.insurancejournal.com/news/international/2025/06/10/826904.htm",
        "M&S, Interim Results 2025/26, 5 November 2025, https://corporate.marksandspencer.com/sites/marksandspencer/files/2025-11/marks-and-spencer-hy-2526-rns.pdf",
        "M&S, Full Year Results 2025/26, May 2026, https://corporate.marksandspencer.com/newsroom/press-releases/full-year-results-52-weeks-ended-28-march-2026",
        "Co-operative News, Co-op Group says cyber attack cost £206m in lost sales in half-year report, 25 September 2025, https://www.thenews.coop/co-op-group-says-cyber-attack-cost-206m-in-lost-sales-in-half-year-report/",
        "Food Manufacture, 6.5m Co-op members had data stolen in cyberattack, 18 July 2025, https://www.foodmanufacture.co.uk/Article/2025/07/18/65m-co-op-members-had-data-stolen-in-cyberattack",
        "NCSC, Statement on incidents affecting UK retailers, 1 May 2025, https://www.ncsc.gov.uk/news/retailers-incident",
        "Ahold Delhaize, Q3 2026 results, 4 November 2026, https://newsroom.aholddelhaize.com/ahold-delhaize-reports-resilient-q3-2026-results-and-updates-2026-guidance-to-reflect-business-disruption-caused-by-recent-cybersecurity-incident/",
        "SecurityWeek, Cyberattack prompts grocery giant Ahold Delhaize to disconnect systems, 13 October 2026, https://www.securityweek.com/cyberattack-prompts-ahold-delhaize-to-disconnect-systems/",
        "Just Drinks, Albert Heijn resumes online deliveries after cyber outage, 23 October 2026, https://www.just-drinks.com/news/albert-heijn-resumes-online-deliveries-after-cyber-outage/",
        "BleepingComputer, ASOS links data breach to social engineering, 8 October 2026, https://www.bleepingcomputer.com/news/security/asos-links-data-breach-to-social-engineering-attack-credential-theft/",
        "Bloomberg via Insurance Journal, ASOS shares slump after app users receive hack notification, 6 October 2026, https://www.insurancejournal.com/news/international/2026/10/06/888095.htm",
        "CERT-FR, Alert CERTFR-2026-ALE-012: security incident targeting remote controllers of refrigeration installations, 12 October 2026 (updated 13 and 16 October), https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/",
        "SecurityWeek, Supermarket refrigeration attack widens to Copeland, Dixell controllers, 15 October 2026, https://www.securityweek.com/supermarket-refrigeration-attack-widens-to-copeland-dixell-controllers/",
        "Le Monde Informatique, Les frigos des supermarchés européens victimes d'une nouvelle vague, 3 November 2026, https://www.lemondeinformatique.fr/actualites/lire-les-frigos-des-supermarches-europeens-victimes-d-une-nouvelle-vague-de-cyberattaques-100899.html",
        "RTÉ News, SuperValu stores hit by cyber attack now back to normal, 2 November 2026, https://www.rte.ie/news/business/2026/1102/1597612-13-supervalu-stores-hit-by-suspected-cyber-attack/",
        "The Record, British businesses caught in Europe-wide supermarket fridge attacks, 3 November 2026, https://therecord.media/british-businesses-caught-in-europe-wide-supermarket-fridge-attacks",
        "Retail Gazette, UK food suppliers hit by cyber attacks targeting fridge and freezer systems, 5 November 2026, https://www.retailgazette.co.uk/blog/2026/11/uk-food-suppliers-hit-by-cyber-attacks-targeting-fridge-and-freezer-systems/",
        "Help Net Security, US agencies warn attackers are targeting refrigeration systems (CISA and FBI joint advisory), 6 November 2026, https://www.helpnetsecurity.com/2026/11/06/cyberattacks-refrigeration-systems-cisa-fbi/",
        "NCSC, Annual Review 2026: Incident management, 3 November 2026, https://www.ncsc.gov.uk/collection/annual-review-2026/understanding-threat/incident-management",
        "BRC, Crime Report 2026, 24 February 2026, https://brc.org.uk/media/bk1n3umn/crime-survey-2026.pdf",
        "Usdaw, BRC Crime Survey response and Usdaw survey of 9,481 retail staff, 24 February 2026, https://www.usdaw.org.uk/latest-news/brc-crime-survey/",
        "Crime and Policing Act 2026, s.45 (prospective, as at 7 November 2026), https://www.legislation.gov.uk/ukpga/2026/20/section/45",
        "Full Fact, Government tracker: retail staff assault offence (Royal Assent 29 April 2026; not yet in force), updated 23 July 2026, https://fullfact.org/government-tracker/retail-staff-assault-offence/",
        "Crime and Policing Act 2026, table of contents (sections 46 and 47), https://www.legislation.gov.uk/ukpga/2026/20/contents",
        "Home Office, Martyn's Law factsheets (overarching, scope, standard duty, regulator), updated 24 July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Food Standards Agency, Chilling food correctly in your business, https://www.food.gov.uk/business-guidance/chilling-food-correctly-in-your-business",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    items = [(f"{n:02d}", t) for n, t in items]
    b.sources(items[:13], "Accessed November 2026. Early reports can change.")
    b.sources(items[13:], "Sources continued.")
    b.rep_back("Keep every store<br>trading, and every<br>colleague safe.", "Crises Control helps retailers alert every store in seconds, see who has acknowledged, coordinate head office and the shop floor from one place, and keep a full record for the review.", "Request a demo",
        companion="Crisis playbook No. 03 · Keep the shutters up")
    return b
