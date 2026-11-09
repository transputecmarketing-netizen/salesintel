from cckit import CCBook, S


def build():
    b = CCBook("Keep the Shutters Up", 3, "basket", "Retail", "23 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical playbook for retail resilience leaders: how stores and head office work as one when tills, systems, fridges or people are under threat, with a peak trading plan for Black Friday and Christmas."
    b.art_cover("Crisis playbook · Retail", "Keep the", "shutters up.",
        "Payment outages, cyber attacks, abuse on the shop floor, lockdowns and warm freezers. How to keep stores trading and colleagues safe when it goes wrong at peak.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("Retail crises rarely start at head office. They start at a till, a freezer or a shop door.", [
        f"In April 2025 a cyber attack forced Marks and Spencer to pause online orders for 46 days, and the retailer estimated the hit to operating profit at around £300m before mitigation.{R(1,7)} The Co-op shut down systems to contain a parallel attack, lost an estimated £206m of sales in six months and later confirmed that data on all 6.5 million members had been taken.{R(2,14)} In October 2026 an incident at Ahold Delhaize took online grocery services offline in the Benelux and the US; the group now expects fourth-quarter sales to be €200m to €250m lower.{R(3)}",
        f"The same month, attackers switched supermarket refrigeration into defrost from the internet. France's CERT-FR reported numerous compromised controllers, and on 2 November a second wave reached stores in Ireland, Belgium and Sweden and food suppliers in the UK.{R(4,5)} Meanwhile, the BRC counts more than 1,600 incidents of violence and abuse against retail staff every day.{R(6)}",
        "This playbook is for the people who have to hold it all together: resilience, security, store operations, IT and communications leaders. It sets out how a store and head office should work as one team on the worst day of the year, what to have ready before Black Friday, and the messages to send in the first hour. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things keep a store trading on a bad day.", "Retail incidents move fast and land on the shop floor first. The retailers that cope best are not the ones with the thickest manuals. They are the ones where stores and head office already know who decides, how they talk and what each store does without being asked.",
        [("owner", "One incident, one team", "A store manager and the head office incident lead share the same severity scale, the same facts and the same clock. Nobody waits for a meeting to start."),
         ("bell", "Fast, two-way messages", "Head office can reach every store, and every store can reach head office, in minutes, with a record of who has read what and who has not."),
         ("shield", "People before stock", "Every procedure starts with colleague and customer safety, from a queue that turns hostile to a lockdown call or a freezer that cannot be trusted.")])
    b.statement("A store that cannot take payment is not trading. It just has the lights on.", "The hardest retail incidents are the ones that turn an IT problem into a shop floor problem within minutes: long queues, angry customers and colleagues left to explain something nobody has told them.", "Introduction")

    # PART 01
    b.mark("01", "Ready for peak")
    b.opener("01", "Ready for<br>peak.", "Decide now how stores and head office will work together, how you will grade an incident and what must be true before Black Friday.", [("01", "Store and head office as one team"), ("02", "Six threats, first actions"), ("03", "A retail severity ladder"), ("04", "Peak readiness in six steps")])
    b.essay("Ready for peak", "One incident, two worlds: the store and head office", [
        "A retail incident is lived in two places at once. At head office, it is a dashboard turning red, a bridge call and a decision about which systems to switch off. In the store, it is a queue that will not move, a customer who wants to know why and a manager who has heard nothing.",
        f"The 2025 attacks showed how quickly the two worlds connect. M&S first disclosed a cyber incident after problems with contactless payments and click and collect over the Easter weekend, and stopped taking online orders three days later.{R(7)} The Co-op said it kept trading while it contained its attack, but had to deal with payment problems and empty shelves along the way.{R(2)}",
        f"The decisions that protect the business at head office are often the ones that hurt stores most. Taking systems offline can stop an attacker. It can also stop stock files, price updates, loyalty scanners and delivery slots. When Ahold Delhaize took systems offline as a precaution in October 2026, stores stayed open but some shelf labels showed out-of-date promotional prices and loyalty scanners failed.{R(8)}",
        "So the first rule of retail incident management is that every head office decision has a store consequence, and someone must own telling stores about it. The second is that information must flow upwards as well as down. Store managers see the effects first: the first declined card, the first fridge alarm, the first group of shoplifters who turn aggressive. They need a fast, simple way to raise it and to know it has landed.",
        "That means one severity scale that stores and head office both use, one place where the facts live, scheduled updates even when there is nothing new, and acknowledgement from every store so you know who has not heard. It also means trusting store managers with clear authority to act on safety without waiting for permission: to close a door, stop a queue or take stock off sale.",
        "None of this needs to be built during an incident. It needs to be agreed, written down and rehearsed before the busiest weeks of the year."],
        "Ready for peak", "Every head office decision has a store consequence, and someone must own telling stores about it.")
    b.table("Six threats", "Six retail threats and the first moves that matter", "What each side does in the first five minutes, without waiting to be told.", ["Threat", "First store action", "First head office action"], [
        ("Till or payment outage", "Switch to the cash and offline procedure. Stop restarting terminals. Tell customers what works.", "Confirm scope. Send one instruction to all stores with the next update time."),
        ("Cyber attack on core systems", "Trade on what still works. Report anything odd. Do not reset devices unless told.", f"Contain, keep evidence, decide what to switch off and tell stores what each shutdown means.{R(7,8)}"),
        ("Violence or abuse", "Make safe, call 999 if anyone is in danger, do not pursue. Colleague first.", "Check it is logged and reported, support the manager, make the next shifts safe."),
        ("Fire, threat or attack nearby", "Evacuate, invacuate or lock down as briefed. Account for colleagues.", "Alert nearby stores, convene the incident group, own customer and media lines."),
        ("Cold-chain failure", f"Probe food by hand, take unsafe stock off sale, do not just reset the controller.{R(4,9)}", "Call the contractor, find other sites with the same controllers, take them offline."),
        ("Rogue message to customers", "Expect questions. Use the approved line and do not guess.", f"Lock the channel used, then tell customers plainly what to ignore.{R(10)}")], "Ready for peak", "38mm 1fr 1fr")
    b.severity("Severity", "A retail severity ladder that stores and head office share", "Grade early and regrade often. If in doubt, go one level higher and step down later.", [
        (1, "Critical", "Payments, tills or core systems down across many stores or online. A weapon, terror or life-safety incident at any store. Controller tampering at several sites.", "Crisis team, all affected store and area managers, IT and security leads, communications and legal.", "Voice · SMS · push · bridge in 15 min"),
        (2, "Major", "Outage in one region or one channel. Serious assault on a colleague. Fridge or freezer failure with stock at risk. A credible threat to a store.", "Incident manager, area and regional managers, IT or facilities on call, communications on standby.", "SMS · push · escalate after 10 min"),
        (3, "Moderate", "Problem at a single store: tills failing, a violent incident without injury, one fridge alarm, an evacuation for a false alarm.", "Store manager, area manager, service desk or facilities helpdesk.", "Push · email"),
        (4, "Minor", "Verbal abuse logged, a single device fault, a near miss or a suspicious approach to staff.", "Store manager, recorded for trend reporting and weekly review.", "App · email")], "Ready for peak")
    b.steps("Before Black Friday", "Peak readiness in six steps", "Black Friday falls on 27 November this year. Finish these before then, and repeat the checks before the last trading weekend before Christmas.", [
        ("Freeze change and name the on-call team", "No non-essential changes to payments, tills, e-commerce or networks over peak. Publish who is on call for every day, including weekends."),
        ("Test the offline and cash procedure", "Confirm what each till and terminal can do offline, how much cash float stores hold and who decides to go cash only."),
        ("Rehearse one outage and one lockdown", "A 30-minute exercise with store and area managers: a payment failure at 10am on a Saturday, then a lockdown call."),
        ("Check every contact list", "Store, area and regional managers, key suppliers, payment providers and contractors, each with a tested out-of-hours number."),
        ("Close the doors you forgot", f"List fridge controllers, building systems and supplier remote access that face the internet, and take them off it.{R(4,11)}"),
        ("Brief colleagues on safety", "De-escalation, how to raise an alarm, when not to intervene and who to call. Staff the hotspots, not just the tills.")], "Ready for peak")

    # PART 02
    b.mark("02", "When it happens")
    b.opener("02", "When it<br>happens.", "The first hour on the worst day, and the procedures for violence, lockdown and a cold chain you cannot trust.", [("01", "The first hour of a peak outage"), ("02", "After an assault on a colleague"), ("03", "Evacuate, invacuate, lock down, communicate"), ("04", "A cold-chain incident"), ("05", "Messages ready to send")])
    b.firsthour("The first hour", "Black Friday, 07:40: card payments fail", "An illustrative timeline. The cause is not yet known. Act on what you can see.", [
        ("T+00:00", "First reports reach the service desk", "Dozens of stores report card terminals declining. Online checkout errors climb.", "Service desk", 2),
        ("T+00:05", "Incident declared at SEV 1", "Several regions and online are hit. The bridge opens and the log starts.", "Incident manager", 1),
        ("T+00:10", "First instruction to every store", "Go to the cash and offline procedure, stop restarting terminals, acknowledge. Next update 08:30.", "Retail operations", 1),
        ("T+00:15", "Find the cause, keep the evidence", "Check provider status and internal systems for intrusion. Nothing is switched off without a decision.", "Security lead", 1),
        ("T+00:20", "Protect people, tell customers", "Managers may pause entry if queues become unsafe. Banner, social posts and store announcement: open, cash accepted, next update time.", "Security · Comms", 2),
        ("T+00:45", "Decide on containment", f"If attack is suspected: isolate, call the response provider and insurer, assess whether personal data is involved.", "Security lead · Legal", 1),
        ("T+01:00", "First update to the crisis team", "Stores affected, cash position, customer impact, likely duration, decisions needed, next update.", "Incident manager", 3)], "When it happens")
    b.steps("Violence and abuse", "After an assault on a colleague: six steps that matter", f"The BRC estimates over 1,600 incidents of violence and abuse against retail staff a day, 118 of them physically violent.{R(6)}", [
        ("Make safe and get help", "Call 999 if anyone is hurt or in danger. Do not detain or follow the offender."),
        ("Look after the colleague", "First aid, a quiet room, someone with them, a safe way home. Not back on the till."),
        ("Keep the evidence", "Secure CCTV and body-worn video, note witnesses, write it up within the shift."),
        ("Report it, every time", f"Report to police and keep the reference. The new offence of assaulting a retail worker is enacted but not yet in force.{R(12)}"),
        ("Tell head office within the hour", "One message, one channel: area manager, security and HR hear the same facts."),
        ("Follow up and learn", "Call the colleague next day, review staffing and layout, share intelligence locally.")], "When it happens")
    b.grid("Martyn's Law procedures", "Evacuate, invacuate, lock down, communicate", f"The Terrorism (Protection of Premises) Act 2025 will require shops where 200 or more people can be expected at once to have these four procedures, so far as is reasonably practicable. The duties are not yet in force.{R(13)}", [
        ("power", "Evacuation", f"Getting people away from danger by moving them out of the premises. Know your exits, assembly points and who sweeps each area.{R(13)}"),
        ("shield", "Invacuation", f"Moving people to a safer place inside, such as a stockroom or back corridor away from glass and entrances.{R(13)}"),
        ("wrench", "Lockdown", f"Securing the premises to stop people entering or leaving. Know which doors lock, who locks them and how fast.{R(13)}"),
        ("bell", "Communication", f"Getting information to everyone on site: colleagues, customers and contractors, with a way to reach staff who are off the shop floor.{R(13)}")], "When it happens",
        f"The implementation period is at least 24 months from Royal Assent on 3 April 2025. Premises expecting 800 or more people fall into the enhanced tier, with wider duties.{R(13)}")
    b.flow("Cold chain", "When you cannot trust the fridge", "Refrigeration controllers have been tampered with remotely across Europe this autumn. Treat an unexplained defrost as a possible attack until you know otherwise.", [
        ("bell", "Spot it", f"An alarm, a case warming for no reason or a defrost cycle outside its schedule."),
        ("magnifier", "Check the food, not the display", f"Probe product temperatures by hand. In England, Wales and Northern Ireland chilled food must legally be kept at 8°C or below.{R(9)}"),
        ("storage", "Take it off sale", "Remove anything you cannot show stayed at a safe temperature. Record what, where and when for the insurer and food safety team."),
        ("power", "Cut the remote link", f"With the contractor, take controllers off the internet and allow access only through a secure VPN. CERT-FR warns a factory reset alone is not enough for end-of-life kit.{R(4)}"),
        ("check", "Restore and check every site", f"Reconfigure, check defrost schedules, then look for the same controllers at every other store and depot.{R(4,11)}")], "When it happens",
        f"Check your insurance conditions before cutting data links to the refrigeration contractor, as CERT-FR advises.{R(4)}")
    b.messages("Messages", "Six messages ready to send", "Short, specific and honest. Fill the brackets, never guess the cause, and always give the time of the next update.", [
        ("SMS", "Store managers", "SEV1: Card payments down in many stores. Switch to cash and offline procedure now. Do not restart terminals. Reply 1 when done. Next update 08:30.", "Keep it under 160 characters so it arrives as one message."),
        ("Push", "All store colleagues", "Some payment systems are down. Your safety comes first. Stay calm, use the till script, call security if anyone becomes aggressive. Please do not post about this online.", ""),
        ("Web banner", "Customers", "We're sorry: some card payments aren't working in our stores right now. Stores are open and accepting [cash]. We're working to fix it and will update here at [10:00].", "Only say what you know is true. Add what still works."),
        ("Email", "Suppliers and hauliers", "We are managing an IT incident affecting [systems]. Deliveries continue as booked unless we call you. Do not act on any request to change bank details or give access. Verify on [known number].", "Attackers often follow up with fake supplier requests."),
        ("Holding line", "Media", "We are aware of an issue affecting payments in some of our stores and are working to resolve it as quickly as possible. Our stores remain open. We will share more information as soon as we can.", ""),
        ("SMS", "Store manager, cold chain", "SEV2: Fridge controller alarm at your store. Probe food temps now. Do not reset the controller. Take unsafe stock off sale. Reply 1, then call [FM line].", "")], "When it happens")

    # PART 03
    b.mark("03", "Recover and rehearse")
    b.opener("03", "Recover and<br>rehearse.", "Three scenarios to test your plan, a dated plan with owners and the questions to put to your leadership team.", [("01", "Three scenarios"), ("02", "This week, this month, this quarter"), ("03", "Questions and checklist")])
    b.usecase("Scenarios", "Three illustrative scenarios to rehearse before peak", [
        ("laptop", "Grocer, 400 stores", "Card terminals fail on the last Saturday before Christmas", [("The trigger", "A provider outage hits two regions at 10am. Queues build and answers vary."), ("What helps", "One acknowledged instruction to every store within ten minutes."), ("What hurts", "Waiting for certainty before saying anything."), ("Rehearse", "Run one store on cash only for 30 minutes.")]),
        ("truck", "Convenience chain, franchise and company stores", "Freezers defrost overnight in a dozen stores", [("The trigger", "Opening staff find warm freezers in defrost. The common link is remote access."), ("What helps", "A probe-and-quarantine routine and a list of controllers by site."), ("What hurts", "Restocking before anyone has cut remote access."), ("Rehearse", "Ask area managers to name their controller models.")]),
        ("shield", "Fashion retailer, flagship store", "An aggressive group, then a call to lock down", [("The trigger", "A group threatens colleagues, then police advise of an incident nearby."), ("What helps", "Colleagues who know the safe room and which doors lock."), ("What hurts", "A tannoy nobody hears upstairs, no list of who is on shift."), ("Rehearse", "A ten-minute lockdown walk-through each quarter.")])], "Recover and rehearse")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure, and date every action.", ["When", "Actions", "Owner"], [
        ("This week", "Publish the peak on-call rota and change freeze. Send the severity ladder and the six message templates to every store.", "Head of resilience"),
        ("This week", "Test the cash and offline procedure in one store per region. Confirm payment provider escalation contacts.", "Retail operations director"),
        ("This month", "Take fridge controllers and other building systems off the internet. Review supplier remote access.", "Facilities and IT security"),
        ("This month", "Brief every store on violence response and reporting. Check alarms, body-worn video and radios work.", "Head of security"),
        ("This quarter", "Map stores likely to be in scope of Martyn's Law and draft the four procedures for each format.", "Head of security, with legal"),
        ("This quarter", "Run a joint store and head office exercise on a cyber outage. Report gaps and dated fixes to the board.", "Chief operating officer")], "Recover and rehearse", "30mm 1fr 46mm")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("Trading", ["If every card terminal failed at 10am on a Saturday, how long until every store had one clear instruction?", "Which head office shutdown decisions would stop stores trading, and who tells them?", "Do we know which store systems and fridge controllers face the internet today?"]),
        ("People", ["Is every assault on a colleague reported, followed up and visible to the board?", "Could each large store evacuate, invacuate or lock down today, and has it practised?", "How would we reach colleagues who are off shift or off the shop floor?"])], "Recover and rehearse")
    b.checklist("Checklist", "Are you ready for peak?", "Tick what is true today. Anything blank is your next action.", [
        ("One severity ladder used by stores and head office", "With named owners for each level."),
        ("Peak on-call rota and change freeze published", "Covering every trading day to the new year."),
        ("Cash and offline procedure tested this month", "In at least one store per region."),
        ("Message templates approved and loaded", "Store managers, colleagues, customers, suppliers and media."),
        ("Fridge controllers and building systems off the internet", "Remote access only through a secure route."),
        ("Every assault reported and followed up", "With aftercare for the colleague and a store risk review."),
        ("Evacuation, invacuation and lockdown briefed", "And walked through in large stores."),
        ("Every store acknowledges alerts", "And non-responders are chased automatically.")], "Recover and rehearse")
    b.glossary("Words worth knowing", [
        ("Severity level", "A shared grade (SEV 1 to SEV 4) that sets who is alerted, how fast and how often."),
        ("Offline payment mode", "A terminal setting that stores some card transactions for later authorisation when the network is down."),
        ("Change freeze", "A period, usually over peak, when only essential changes to systems are allowed."),
        ("Invacuation", "Moving people to a safer place inside a building, away from danger outside."),
        ("Lockdown", "Securing a building so people cannot enter or leave until it is safe."),
        ("Martyn's Law", "The Terrorism (Protection of Premises) Act 2025, which sets duties for larger public premises."),
        ("Cold chain", "Keeping chilled and frozen food at safe temperatures from supplier to shelf."),
        ("Refrigeration controller", "A device that runs fridges and freezers and can often be managed remotely."),
        ("Defrost cycle", "A scheduled warm-up that clears ice. Stretched or repeated, it spoils stock."),
        ("Acknowledgement", "A recipient's confirmation that an alert has been read and acted on."),
        ("Incident manager", "The person who runs the response, keeps the log and sets the rhythm of updates."),
        ("Holding line", "A short, accurate statement used while facts are still being established."),
        ("Body-worn video", "A camera worn by colleagues or security staff that records incidents as evidence."),
        ("Responsible person", "Under Martyn's Law, the person or organisation in control of qualifying premises."),
        ("Remote access", "A route for suppliers or engineers to manage systems from outside the store."),
        ("End of life", "When a manufacturer stops issuing security fixes for a product.")])
    b.platform("Where Crises Control fits in a retail incident", "How the steps in this playbook map to Crises Control modules.", [
        ("Send the first instruction to every store manager and see who has acknowledged, with automatic escalation to area managers.", "Ping"),
        ("Run the incident from one workspace with one log, shared by stores, head office and suppliers.", "Incident Manager"),
        ("Turn the cash procedure, cold-chain checks and lockdown steps into tasks with owners and deadlines.", "Task Manager"),
        ("See which stores are affected, what has been done and where escalations are waiting.", "Control Centre"),
        ("Give colleagues a one-touch way to raise an alarm with their location.", "SOS"),
        ("Keep a timestamped record of every message and decision for the post-incident review and insurer.", "Audit Trail")])

    b.mark("", "Sources")
    src = [
        "M&S, Full Year Results 2024/25, 21 May 2025, https://corporate.marksandspencer.com/newsroom/press-releases/full-year-results-52-weeks-ended-29-march-2025",
        "Co-operative News, Co-op Group says cyber attack cost £206m in lost sales in half-year report, 25 September 2025, https://www.thenews.coop/co-op-group-says-cyber-attack-cost-206m-in-lost-sales-in-half-year-report/",
        "Ahold Delhaize, Q3 2026 results, 4 November 2026, https://newsroom.aholddelhaize.com/ahold-delhaize-reports-resilient-q3-2026-results-and-updates-2026-guidance-to-reflect-business-disruption-caused-by-recent-cybersecurity-incident/",
        "CERT-FR, Alert CERTFR-2026-ALE-012 on refrigeration remote controllers, 12 October 2026 (updated 13 and 16 October), https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/",
        "Retail Gazette, UK food suppliers hit by cyber attacks targeting fridge and freezer systems, 5 November 2026, https://www.retailgazette.co.uk/blog/2026/11/uk-food-suppliers-hit-by-cyber-attacks-targeting-fridge-and-freezer-systems/",
        "British Retail Consortium, BRC Crime Report 2026, 24 February 2026, https://brc.org.uk/media/bk1n3umn/crime-survey-2026.pdf",
        "Reuters via Insurance Journal, After 46-day cyberattack pause, M&S resumes online orders, 10 June 2025, https://amp.insurancejournal.com/news/international/2025/06/10/826904.htm",
        "Just Drinks, Albert Heijn resumes online deliveries after cyber outage, 23 October 2026, https://www.just-drinks.com/news/albert-heijn-resumes-online-deliveries-after-cyber-outage/",
        "Food Standards Agency, Chilling food correctly in your business, https://www.food.gov.uk/business-guidance/chilling-food-correctly-in-your-business",
        "BleepingComputer, ASOS links data breach to social engineering attack, credential theft, 8 October 2026, https://www.bleepingcomputer.com/news/security/asos-links-data-breach-to-social-engineering-attack-credential-theft/",
        "Help Net Security, US agencies warn attackers are targeting refrigeration systems (CISA and FBI joint advisory), 6 November 2026, https://www.helpnetsecurity.com/2026/11/06/cyberattacks-refrigeration-systems-cisa-fbi/",
        "Crime and Policing Act 2026, section 45: Assault of retail worker (prospective), https://www.legislation.gov.uk/ukpga/2026/20/section/45",
        "Home Office, Terrorism (Protection of Premises) Act 2025 factsheets (overarching; standard duty requirements), updated 24 July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Food Manufacture, 6.5m Co-op members had data stolen in cyberattack, 18 July 2025, https://www.foodmanufacture.co.uk/Article/2025/07/18/65m-co-op-members-had-data-stolen-in-cyberattack",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    b.sources([(f"{n:02d}", t) for n, t in items], "Accessed November 2026. Early reporting on live incidents can change.")
    b.art_back("Keep every store<br>in the loop.", "Crises Control helps retailers alert every store in seconds, see who has acknowledged, run incidents from one place and keep colleagues safe on the shop floor.", "Request a demo",
        next_title="Intelligence report No. 03 · When the tills go dark")
    return b
