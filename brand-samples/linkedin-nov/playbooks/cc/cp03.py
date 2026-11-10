from cckit import CCBook, S


def build():
    b = CCBook("Keep the Shutters Up", 3, "basket", "Retail", "23 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical playbook for retail resilience leaders in the UK, the US, Europe and the Middle East: how stores, regions and head office work as one when tills, systems, fridges or people are under threat, with a plan for every peak."
    b.art_cover("Crisis playbook · Retail", "Keep the", "shutters up.",
        "Payment outages, cyber attacks, abuse on the shop floor, lockdowns and warm freezers. How to keep stores trading and colleagues safe when it goes wrong at peak.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("Retail crises rarely start at head office. They start at a till, a freezer or a shop door.", [
        f"In April 2025 a cyber attack forced Marks and Spencer in the UK to pause online orders for 46 days, and the retailer estimated the hit to operating profit at around £300m before mitigation.{R(1,2)} In October 2026 an incident at Ahold Delhaize took online grocery services offline in the Benelux and the US; the group expects fourth-quarter sales to be €200m to €250m lower.{R(3)}",
        f"The same month, attackers switched supermarket refrigeration into defrost from the internet. France's CERT-FR reported numerous compromised controllers, and US agencies including CISA and the FBI later warned of ongoing attacks on refrigeration and cold chain monitoring systems.{R(4,7)} On the shop floor, the British Retail Consortium counts more than 1,600 incidents of violence and abuse against UK retail staff every day.{R(5)}",
        "This playbook is for the people who have to hold it all together: resilience, security, store operations, IT and communications leaders, wherever their stores trade. It sets out how a store, its region and head office work as one team on the busiest day of the year, who decides what, what to have ready before each peak and the messages to send in the first hour. It ends with a practical toolkit you can use straight away. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Executive summary")
    b.execsum("Stores, regions and head office must run one incident, not three.", [
        "Head office decisions, such as switching systems off, land on stores within minutes, often before anyone has told them.",
        "Peaks such as Black Friday, White Friday, Christmas and the end of Ramadan multiply queues, staffing gaps and pressure.",
        "Store managers see problems first but often lack a fast way to raise them and know they have landed."], [
        "Card payment or till outages across many stores or online, from a provider fault or an attack.",
        "Cyber attacks that force systems offline and can start 72-hour breach notification clocks in several jurisdictions.",
        "Violence and abuse against colleagues, and incidents that need evacuation, invacuation or lockdown.",
        "Refrigeration and cold-chain failures, including controllers tampered with remotely, that put food safety at risk."], [
        "Use one severity ladder and one escalation workflow across store, region and head office.",
        "Agree decision rights now: who closes a store, who switches to cash, who speaks to the media.",
        "Pre-approve messages for stores, colleagues, customers, regulators, suppliers and media, each with a next update time.",
        "Map breach notification deadlines, card acquirer contacts and food temperature limits for every country you trade in.",
        "Rehearse a payment outage, a lockdown and a cold-chain incident with stores before every peak."], [
        "Every store acknowledges within minutes, and silent stores are chased by their regional manager.",
        "Store managers act on safety at once; head office hears straight after.",
        "One log holds every decision, owner and reason, from first report to stand down.",
        "A store-by-store view shows who is trading, cash only, closed or in need of help."],
        ["Crises Control is an Operational Incident Coordination Platform. Ping reaches store and regional managers on several channels, and acknowledgements show which stores have heard.",
         "Plans you build turn the cash procedure, lockdown and cold-chain checks into owned tasks, with escalation on no response under rules you configure."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things keep a store trading on a bad day.", "Retail incidents move fast and land on the shop floor first. The retailers that cope best are not the ones with the thickest manuals. They are the ones where stores, regions and head office already know who decides, how they talk and what each store does without being asked.",
        [("owner", "One incident, one team", "A store manager, a regional manager and the head office incident lead share the same severity scale, the same facts and the same clock. Nobody waits for a meeting to start."),
         ("bell", "Fast, two-way messages", "Head office can reach every store, and every store can reach head office, in minutes, with a record of who has read what and who has not."),
         ("shield", "People before stock", "Every procedure starts with colleague and customer safety, from a queue that turns hostile to a lockdown call or a freezer that cannot be trusted.")])
    b.statement("Sending an alert to every store is the easy part. Running the incident end to end is where most retailers struggle.", "Most retailers can send alerts. Far fewer can take an incident from the first report at a till, through decisions, tasks and customer messages, to stand down and a record that stands up to scrutiny. That gap is where trading, colleagues and trust are lost.", "Introduction")

    # PART 01
    b.mark("01", "Ready for peak")
    b.opener("01", "Ready for<br>peak.", "Decide now how stores, regions and head office work together, what the law expects where you trade and who decides what.", [("01", "Store and head office as one team"), ("02", "Six threats, first moves"), ("03", "Breach notification by region"), ("04", "Cold-chain rules by region"), ("05", "Who decides what")])
    b.essay("Ready for peak", "One incident, two worlds: the store and head office", [
        "A retail incident is lived in two places at once. At head office, it is a dashboard turning red, a bridge call and a decision about which systems to switch off. In the store, it is a queue that will not move, a customer who wants to know why and a manager who has heard nothing.",
        f"The 2025 attacks on UK retailers showed how quickly the two worlds connect. Marks and Spencer first disclosed a cyber incident after problems with contactless payments and click and collect over the Easter weekend, and stopped taking online orders three days later.{R(2)}",
        f"The decisions that protect the business at head office are often the ones that hurt stores most. Taking systems offline can stop an attacker. It can also stop stock files, price updates, loyalty scanners and delivery slots. When Ahold Delhaize took systems offline in October 2026, it said disruption to online capabilities and to Benelux supply chain operations would weigh on fourth-quarter sales.{R(3)}",
        "So the first rule of retail incident management is that every head office decision has a store consequence, and someone must own telling stores about it. The second is that information must flow upwards as well as down. Store managers see the effects first: the first declined card, the first fridge alarm, the first group of shoplifters who turn aggressive. They need a fast, simple way to raise it and to know it has landed.",
        "That means one severity scale that stores, regions and head office all use, one place where the facts live, scheduled updates even when there is nothing new, and acknowledgement from every store so you know who has not heard. It also means trusting store managers with clear authority to act on safety without waiting for permission: to close a door, stop a queue or take stock off sale.",
        "None of this needs to be built during an incident. It needs to be agreed, written down and rehearsed before the busiest weeks of the year, whichever calendar your stores trade to."],
        "Ready for peak", "Every head office decision has a store consequence, and someone must own telling stores about it.")
    b.table("Six threats", "Six retail threats and the first moves that matter", "What each side does in the first five minutes, without waiting to be told.", ["Threat", "First store action", "First head office action"], [
        ("Till or payment outage", "Switch to the cash and offline procedure. Stop restarting terminals. Tell customers what works.", "Confirm scope. Send one instruction to all stores with the next update time."),
        ("Cyber attack on core systems", "Trade on what still works. Report anything odd. Do not reset devices unless told.", f"Contain, keep evidence, decide what to switch off and tell stores what each shutdown means.{R(3)}"),
        ("Violence or abuse", "Make safe, call emergency services if anyone is in danger, do not pursue. Colleague first.", "Check it is logged and reported, support the manager, make the next shifts safe."),
        ("Fire, threat or attack nearby", "Evacuate, invacuate or lock down as briefed. Account for colleagues.", "Alert nearby stores, convene the incident group, own customer and media lines."),
        ("Cold-chain failure", f"Probe food by hand, take unsafe stock off sale, do not just reset the controller.{R(4,7)}", "Call the contractor, find other sites with the same controllers, take them offline."),
        ("Rogue message to customers", "Expect questions. Use the approved line and do not guess.", "Lock the channel used, then tell customers plainly what to ignore.")], "Ready for peak", "38mm 1fr 1fr")
    b.regions("Regional notes · Breach notification", "After a cyber attack: who you must tell, and how fast", "Retail attacks often expose customer or loyalty data and card payments. Deadlines start when you become aware of a breach, so the decision log must record that moment.", [
        ("United Kingdom", f"UK GDPR Article 33: notify the regulator without undue delay and, where feasible, within 72 hours of becoming aware of a personal data breach, unless it is unlikely to result in a risk to people. From 30 September 2026 the text names the Information Commission, which took over from the ICO.{R(9)}", "Record the time of awareness and your risk assessment in the Incident decision log. If you notify late, give reasons."),
        ("United States", f"All states, the District of Columbia, Puerto Rico and the Virgin Islands have breach notification laws; triggers and deadlines vary by state.{R(11)} For card data, PCI DSS Requirement 12.10.1 (an industry standard, applied through your acquirer) requires an incident response plan that covers notifying payment brands and acquirers.{R(12)}", "Map which states your customers live in. Keep acquirer and payment brand contacts in the plan, wherever you trade."),
        ("European Union", f"GDPR Article 33: notify the competent supervisory authority without undue delay and, where feasible, within 72 hours. Article 34: tell affected people without undue delay where the breach is likely to result in a high risk to them.{R(10)}", "Know your lead supervisory authority in advance if you trade in several member states."),
        ("Middle East", f"<b>UAE:</b> Federal Decree-Law No. 45 of 2021 requires controllers to report breaches to the UAE Data Office; timing is left to Executive Regulations, which legal summaries report as not yet published. DIFC and ADGM have their own laws.{R(13)} <b>Saudi Arabia:</b> the PDPL is fully enforceable from 14 September 2024; notify SDAIA within 72 hours where a breach is likely to cause harm. A draft amendment would drop that harm test (proposed).{R(14)}", "Check which law applies to each store, including free zone sites, and name who files the notice.")], "Ready for peak")
    b.regions("Regional notes · Cold chain", "The temperature rules behind the fridge", "When a controller cannot be trusted, the question is simple: can you show the food stayed within the limit that applies where you trade? If not, it comes off sale.", [
        ("United Kingdom", f"Chilled food must legally be kept at 8°C or below in England, Wales and Northern Ireland, according to the Food Standards Agency.{R(6)}", "Probe the food, not the display, and record readings on the cold-chain quarantine record. For stores in Scotland, check Food Standards Scotland guidance."),
        ("United States", f"The FDA Food Code is a model code that state and local jurisdictions adopt. The 2022 edition requires time/temperature control for safety food to be cold-held at 5°C (41°F) or less.{R(15)}", "Check the version your state or county has adopted; editions and local amendments differ. Keep probe records with the time each reading was taken."),
        ("European Union", f"Regulation (EC) No 852/2004, Annex II, Chapter IX: foods that can support pathogens must not be kept at temperatures that risk health, and the cold chain is not to be interrupted, with limited periods allowed for handling.{R(16)}", "Use the limits in your national rules and your own food safety procedures as the trigger for taking stock off sale, and record each decision with the reading behind it."),
        ("Middle East (UAE)", f"The Dubai Municipality Food Code says high-risk food should be kept at or below 5°C, or at or above 60°C, and calls 5°C to 60°C the temperature danger zone.{R(17)} Other emirates and GCC states set their own rules.", "Confirm the authority and limits for each emirate or country you trade in, and brief night managers, who often find the alarm first.")], "Ready for peak")
    b.table("Decision rights", "Who closes a store, who goes to cash, who speaks to the media", "Name each owner and a deputy before peak. If the owner cannot be reached in ten minutes, the deputy decides.", ["Decision", "Who decides", "Who can act first", "Who must be told"], [
        ("Close a store or pause entry", "Store manager for safety; regional manager for trading.", "The most senior colleague on the floor.", "Regional manager, then the incident lead."),
        ("Switch to cash only", "Incident lead for the estate; store manager for one store.", "Store manager, using the cash procedure.", "Regional manager and cash office."),
        ("Take systems offline", "Incident lead, on IT and security advice.", "IT security, only to stop an active attack.", "Every store, with what it means for them."),
        ("Speak to the media", "Communications lead, with the incident lead.", "Nobody else. Stores use the holding line.", "Regional managers and stores."),
        ("Evacuate or lock down", "Store manager, or police on arrival.", "Any colleague facing an immediate threat.", "Regional manager, loss prevention."),
        ("Take chilled stock off sale", "Store manager, on probe readings.", "Any trained colleague.", "Facilities and food safety."),
        ("Notify regulators, acquirers and insurers", "Incident lead, with legal and the data protection lead.", "Nobody until it is logged with reasons.", "Executive team. Some deadlines run from awareness.")], "Ready for peak", "38mm 1fr 1fr 1fr")

    # PART 02
    b.mark("02", "Incident scenarios")
    b.opener("02", "Incident<br>scenarios.", "How a multi-store incident unfolds across stores, regions and head office, the first hour on the busiest day, and three scenarios to rehearse.", [("01", "A retail severity ladder"), ("02", "The first hour of a peak outage"), ("03", "Across stores, region and head office"), ("04", "Three scenarios"), ("05", "Tracking what is still outstanding"), ("06", "The store status log")])
    b.severity("Severity", "A retail severity ladder that stores and head office share", "Grade early and regrade often. If in doubt, go one level higher and step down later.", [
        (1, "Critical", "Payments, tills or core systems down across many stores or online. A weapon, terror or life-safety incident at any store. Controller tampering at several sites.", "Crisis team, all affected store and regional managers, IT and security leads, communications and legal.", "Voice · SMS · push · bridge in 15 min"),
        (2, "Major", "Outage in one region or one channel. Serious assault on a colleague. Fridge or freezer failure with stock at risk. A credible threat to a store.", "Incident manager, area and regional managers, IT or facilities on call, communications on standby.", "SMS · push · escalate after 10 min"),
        (3, "Moderate", "Problem at a single store: tills failing, a violent incident without injury, one fridge alarm, an evacuation for a false alarm.", "Store manager, area manager, service desk or facilities helpdesk.", "Push · email"),
        (4, "Minor", "Verbal abuse logged, a single device fault, a near miss or a suspicious approach to staff.", "Store manager, recorded for trend reporting and weekly review.", "App · email")], "Incident scenarios")
    b.firsthour("The first hour", "Peak Saturday, 07:40: card payments fail", "An illustrative timeline. The cause is not yet known. Act on what you can see, name who decides at each step and watch for the stores that go quiet.", [
        ("T+00:00", "First reports reach the service desk", "Dozens of stores report card terminals declining. Online checkout errors climb.", "Service desk", 2),
        ("T+00:05", "Incident declared at SEV 1", "Several regions and online are hit. The bridge opens and the decision log starts.", "Incident manager", 1),
        ("T+00:10", "First instruction to every store", "Go to the cash and offline procedure, stop restarting terminals, acknowledge. Stores silent after ten minutes go to their regional manager. Next update 08:30.", "Retail operations", 1),
        ("T+00:15", "Find the cause, keep the evidence", "Check provider status and internal systems for intrusion. Nothing is switched off without a decision.", "Security lead", 1),
        ("T+00:20", "Protect people, tell customers", "Managers may pause entry if queues become unsafe. Banner, social posts and store announcement: open, cash accepted, next update time.", "Security · Comms", 2),
        ("T+00:45", "Decide on containment", "If attack is suspected: isolate, call the response provider, insurer and acquirer, and log when you became aware of any personal data breach.", "Security lead · Legal", 1),
        ("T+01:00", "First update to the crisis team", "Stores affected, cash position, customer impact, likely duration, decisions needed, next update.", "Incident manager", 3)], "Incident scenarios")
    b.swimlane("Multi-store scenario", "A peak-day outage across stores, region and head office", "The same illustrative outage, seen lane by lane. Red marks where it usually goes wrong, navy marks who decides, and pale blue marks how progress is watched.",
        ["Affected stores", "Regional managers", "Head office incident lead", "IT and payments", "Communications"],
        ["07:40", "07:50", "08:00", "08:30", "09:30", "11:00"], [
        (0, 0, "Cards declined at tills in many stores", "act"),
        (3, 0, "Service desk sees failures in every region", "mon"),
        (0, 1, "Managers keep restarting terminals; queues build", "risk"),
        (1, 1, "Alerted by app and SMS; acknowledge", "act"),
        (2, 1, "Declares SEV 1 and opens the bridge", "dec"),
        (4, 1, "Colleagues post online before any statement", "risk"),
        (0, 2, "Stores acknowledge and start the cash procedure", "act"),
        (1, 2, "Silent stores chased after ten minutes", "mon"),
        (2, 2, "Estate-wide switch to cash and offline", "dec"),
        (3, 2, "Provider fault or attack? Evidence kept", "act"),
        (4, 2, "Holding line and web banner live", "act"),
        (0, 3, "Cash floats run low in busy stores", "risk"),
        (1, 3, "Closes two stores with unsafe queues", "dec"),
        (2, 3, "Approves isolating systems on security advice", "dec"),
        (4, 3, "One spokesperson takes media calls", "dec"),
        (2, 4, "Store status board reviewed every 30 minutes", "mon"),
        (0, 4, "Each store confirms cards work again", "mon"),
        (3, 3, "Pressure to restart before the cause is known", "risk"),
        (1, 5, "Checks every store reopened and staffed", "mon"),
        (3, 4, "Payments restored region by region", "act"),
        (1, 4, "Reopens stores once terminals are tested", "dec"),
        (4, 4, "Update runs late; stores fill the gap", "risk"),
        (0, 5, "Cash banked, losses and incidents logged", "act"),
        (2, 5, "Stands down; open actions tracked to closure", "mon"),
        (3, 5, "Root cause and evidence passed to review", "act"),
        (4, 5, "Customer update and thanks to colleagues", "act")], "Incident scenarios",
        "Most failures sit between the lanes: a decision made at head office that nobody tells stores about, or a store problem that never reaches head office. Give each handover an owner and a time.")
    b.usecase("Scenarios", "Three illustrative scenarios to rehearse before peak", [
        ("laptop", "Grocer, 400 stores", "Card terminals fail at 22:30 on a late-night trading evening in the last week of Ramadan", [("Where it goes wrong", "A provider outage hits two regions. Night managers wait for certainty and give customers different answers."), ("Who decides", "The head office incident lead calls the estate-wide cash switch; regional managers close unsafe stores."), ("How it is monitored", "Acknowledgement per store, chased at ten minutes, and a status board reviewed every 30 minutes."), ("Rehearse", "Run one store on cash only for 30 minutes, on a night shift.")]),
        ("truck", "Convenience chain, franchise and company stores", "Freezers defrost overnight in a dozen stores", [("Where it goes wrong", "Opening staff reset controllers and restock before anyone cuts the remote access they share."), ("Who decides", "Store managers take stock off sale; the head office lead orders controllers offline at every site."), ("How it is monitored", "A quarantine record per store and a site list of controllers, ticked off as each is checked."), ("Rehearse", "Ask area managers to name their controller models.")]),
        ("shield", "Fashion retailer, flagship store", "An aggressive group, then a call to lock down", [("Where it goes wrong", "A tannoy nobody hears upstairs, and no list of who is on shift or who locks which door."), ("Who decides", "The store manager locks down without waiting; police take over on arrival; head office supports."), ("How it is monitored", "Each floor confirms it is secure and every colleague is accounted for against the shift list."), ("Rehearse", "A ten-minute lockdown walk-through each quarter.")])], "Incident scenarios")
    b.tracker("Outstanding actions", "Saturday 11:00: what is still open", "An illustrative actions board three hours in. Every action has one owner, a due time and a way of checking it is done. Review it at every update until it is empty.", [
        ("Confirm every store is taking cards again", "Regional managers", "11:30", "In progress", "Store status board, store by store"),
        ("Reopen the two stores closed for queue safety", "Regional manager", "12:00", "Open", "Terminals tested; reopening logged"),
        ("Collect cash from stores over their float limit", "Cash office", "13:00", "Open", "Collection booked and confirmed"),
        ("Customer FAQ and social media update", "Communications", "10:45", "Overdue", "Escalated to the incident lead at due time"),
        ("Root cause statement from the payment provider", "IT lead", "17:00", "Blocked", "Chased at every update; waiting on provider"),
        ("Reconcile offline and failed card transactions", "Finance and IT", "Sun 10:00", "In progress", "Matched against the provider report"),
        ("Aftercare for the colleague pushed in a queue", "Loss prevention", "Today", "Done", "Call logged; incident report filed"),
        ("Decide whether to notify regulators, the acquirer and the insurer", "Incident lead, legal", "Sun 12:00", "Open", "Decision, reasons and awareness time in the log"),
        ("Book the post-incident review", "Incident lead", "Mon", "Done", "Invite sent with the review template")], "Incident scenarios",
        "Overdue and blocked actions are raised at the next update, not left on the board. The incident lead decides whether to chase, reassign or escalate, and the decision goes in the log. The board closes only when every action is done or handed to the post-incident review.")
    b.form("Store status log", "Store status log: one line per store, every update", "Regional managers keep this for their stores during a multi-store incident, or head office keeps it for the estate. It shows at a glance who has heard, who is trading and who needs help.",
        [("Store", 1.1), ("Alerted", .8), ("Acknowledged", 1), ("Trading status", 1.3), ("Safety or queue issue", 1.5), ("Stock at risk", 1.1), ("Next check", .8), ("Initials", .7)], "Incident scenarios", rows=11,
        example=["Store 0147, North", "07:52", "07:58, manager", "Open, cash only", "Long queue, entry paused 08:20", "None", "08:30", "RM"],
        note="Trading status: open, cash only, closed for safety, closed for trading. A store with no acknowledgement after ten minutes is chased and marked in red at the next update.")

    # PART 03
    b.mark("03", "Respond and recover")
    b.opener("03", "Respond and<br>recover.", "Procedures for violence, lockdown and a cold chain you cannot trust, the checks to finish before every peak and a dated plan with owners.", [("01", "After an assault on a colleague"), ("02", "Evacuate, invacuate, lock down, communicate"), ("03", "A cold-chain incident"), ("04", "The cold-chain quarantine record"), ("05", "Peak readiness in six steps"), ("06", "This week, this month, this quarter")])
    b.steps("Violence and abuse", "After an assault on a colleague: six steps that matter", f"Abuse is a daily reality on shop floors everywhere. <b>United Kingdom:</b> the BRC estimates over 1,600 incidents of violence and abuse against retail staff a day, 118 of them physically violent.{R(5)}", [
        ("Make safe and get help", "Call emergency services if anyone is hurt or in danger. Do not detain or follow the offender."),
        ("Look after the colleague", "First aid, a quiet room, someone with them, a safe way home. Not back on the till."),
        ("Keep the evidence", "Secure CCTV and body-worn video, note witnesses, write it up within the shift."),
        ("Report it, every time", "Report to police and keep the reference. Every report builds the evidence for local policing and store risk reviews."),
        ("Tell head office within the hour", "One message, one channel: area manager, security and HR hear the same facts."),
        ("Follow up and learn", "Call the colleague next day, review staffing and layout, share intelligence locally.")], "Respond and recover")
    b.grid("Protective procedures", "Evacuate, invacuate, lock down, communicate", "Four procedures every large store needs, wherever it trades. Brief them, walk them through, and agree who decides on each.", [
        ("power", "Evacuation", "Getting people away from danger by moving them out of the premises. Know your exits, assembly points and who sweeps each area."),
        ("shield", "Invacuation", "Moving people to a safer place inside, such as a stockroom or back corridor away from glass and entrances."),
        ("wrench", "Lockdown", "Securing the premises to stop people entering or leaving. Know which doors lock, who locks them and how fast."),
        ("bell", "Communication", "Getting information to everyone on site: colleagues, customers and contractors, with a way to reach staff who are off the shop floor.")], "Respond and recover",
        f"<b>United Kingdom:</b> Martyn's Law will require shops where 200 or more people can be expected at once to have these four procedures; the duties are not yet in force.{R(8)} <b>United States:</b> where an OSHA standard requires an emergency action plan, 29 CFR 1910.38 sets minimum elements, including reporting and evacuation procedures, accounting for employees and an alarm system.{R(18)}")
    b.flow("Cold chain", "When you cannot trust the fridge", "Refrigeration controllers were tampered with remotely across Europe in autumn 2026. Treat an unexplained defrost as a possible attack until you know otherwise.", [
        ("bell", "Spot it", "An alarm, a case warming for no reason or a defrost cycle outside its schedule."),
        ("magnifier", "Check the food, not the display", "Probe product temperatures by hand and compare them with the legal limit where you trade (see the regional notes in Part 01)."),
        ("storage", "Take it off sale", "Remove anything you cannot show stayed at a safe temperature. Record what, where and when for the insurer and food safety team."),
        ("power", "Cut the remote link", f"With the contractor, take controllers off the internet and allow access only through a secure VPN. CERT-FR warns a factory reset alone is not enough for end-of-life kit.{R(4)}"),
        ("check", "Restore and check every site", "Reconfigure, check defrost schedules, then look for the same controllers at every other store and depot.")], "Respond and recover",
        f"Check your insurance conditions before cutting data links to the refrigeration contractor, as CERT-FR advises.{R(4)}")
    b.form("Cold-chain record", "Cold-chain quarantine record", "Fill one line for every case or unit you check after an unexplained defrost or alarm, against the limit that applies where you trade: for example 8°C in England, Wales and Northern Ireland, or 5°C (41°F) under the US FDA Food Code model. The record supports the insurer, the food safety team and the review.",
        [("Case or unit", 1), ("Product or section", 1.3), ("Probe reading and time", 1.2), ("Display reading", .9), ("Action taken", 1.4), ("Quantity and value", 1), ("Checked by", .8)], "Respond and recover", rows=11,
        example=["Freezer 3, aisle 9", "Frozen desserts", "-4°C at 06:15", "-18°C", "Off sale, held for insurer", "42 units", "Duty manager"],
        note="Probe the food, not the display: the display reading comes from the controller you may not be able to trust. Do not reset the controller or restock until remote access has been cut and the contractor has checked it.")
    b.steps("Before every peak", "Peak readiness in six steps", f"Finish these before every peak: Black Friday (White Friday in the Gulf),{R(20)} Christmas, Ramadan and Eid. In Ramadan 2024, Visa found late-night transactions doubled their share in Saudi Arabia, to 35%.{R(19)}", [
        ("Freeze change and name the on-call team", "No non-essential changes to payments, tills, e-commerce or networks. Publish who is on call, day and night."),
        ("Test the offline and cash procedure", "Confirm what each till and terminal can do offline, how much cash float stores hold and who decides to go cash only."),
        ("Rehearse one outage and one lockdown", "A 30-minute exercise with store and regional managers: a payment failure at the busiest hour, then a lockdown call."),
        ("Check every contact list", "Managers, suppliers, payment providers, acquirers and contractors, each with a tested out-of-hours number."),
        ("Close the doors you forgot", f"List fridge controllers, building systems and supplier remote access that face the internet, and take them off it.{R(4,7)}"),
        ("Brief colleagues on safety", "De-escalation, raising an alarm, when not to intervene and who to call.")], "Respond and recover")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure, and date every action.", ["When", "Actions", "Owner"], [
        ("This week", "Publish the peak on-call rota and change freeze. Send the severity ladder and the message templates to every store.", "Head of resilience"),
        ("This week", "Test the cash and offline procedure in one store per region. Confirm payment provider and acquirer escalation contacts.", "Retail operations director"),
        ("This month", "Take fridge controllers and other building systems off the internet. Review supplier remote access.", "Facilities and IT security"),
        ("This month", "Build a notification map: for each country, the data protection regulator, deadline, card acquirer and food authority.", "Data protection lead, with legal"),
        ("This quarter", "Check protective security duties by country, such as Martyn's Law in the UK and emergency action plans in the US, and draft the four procedures per format.", "Head of security, with legal"),
        ("This quarter", "Run a joint store, region and head office exercise on a cyber outage. Report gaps and dated fixes to the board.", "Chief operating officer")], "Respond and recover", "30mm 1fr 46mm")

    # PART 04
    b.mark("04", "Practical toolkit")
    b.toolkit_index()
    b.readiness()
    b.raci("Roles and responsibilities", "Who does what: store, region and head office", "A suggested matrix for a multi-store incident. Agree it before peak and adjust it to your structure.",
        ["Store<br>manager", "Regional<br>manager", "Head office<br>incident lead", "IT and<br>security", "Comms", "Loss<br>prevention"], [
        ("Raise the first report", ["A", "I", "I", "I", "", "I"]),
        ("Declare and set the severity", ["C", "C", "A", "C", "I", "I"]),
        ("Switch to cash and offline", ["R", "R", "A", "C", "I", "I"]),
        ("Close one store for safety", ["A", "I", "I", "", "I", "C"]),
        ("Close stores across a region", ["R", "A", "C", "", "I", "I"]),
        ("Contain systems, keep evidence", ["I", "I", "A", "R", "", "C"]),
        ("Chase silent stores", ["R", "A", "I", "", "", ""]),
        ("Customer and media statements", ["I", "I", "C", "C", "A", "I"]),
        ("Colleague safety and lockdown", ["A", "C", "I", "", "I", "R"]),
        ("Keep CCTV, report to police", ["R", "I", "I", "", "", "A"]),
        ("Reopen and return to normal", ["R", "R", "A", "C", "I", "I"])], "Practical toolkit",
        "One rule overrides the matrix: a store manager never needs permission to act on safety. Closing a door, pausing entry or calling emergency services is theirs to decide; head office is told straight after.", tool=True)
    b.decisionlog("Every call that closes a store, switches to cash or takes a system offline", "Use it from the moment the incident is declared. In a retail incident it also records when you became aware of any personal data breach, which starts notification deadlines in several jurisdictions.",
        ("08:05", "Switch every store to the cash and offline procedure", "Wait for the provider; switch affected regions only; switch the whole estate", "Head office incident lead", "Failures in every region; no fix time from provider; queues building", "Store status log; provider status page"))
    b.escalation("Escalation", "Escalating from store to region to head office", "Four levels that match the severity ladder. The times are suggested starting points; set your own and write them into your alerting rules, so escalation does not depend on someone remembering.", [
        ("Store", "One store: tills failing, an aggressive customer, a single fridge alarm, a false fire alarm.", "Store manager, colleagues on shift, the service desk or facilities helpdesk.", "Store manager: pause entry, go cash only, take stock off sale, call emergency services.", "two or more stores are hit, anyone is hurt, or there is no fix in 30 minutes"),
        ("Region", "The same fault in several stores in one region, a serious assault, stock at risk or a credible threat.", "Regional manager, area managers, IT or facilities on call, loss prevention.", "Regional manager: close stores in the region, move colleagues, ask head office for support.", "more than one region or online is hit, or any store is silent after 10 minutes"),
        ("Head office", "Payments, tills or core systems down across regions or online, a suspected cyber attack, a lockdown or life-safety incident.", "Head office incident lead, IT and security, communications, loss prevention, every affected regional manager.", "Head office incident lead: estate-wide cash procedure, systems offline, customer messages.", "trading cannot resume by the next update, or data or media are involved"),
        ("Executive crisis team", "Business-wide disruption, a data breach, serious injury or death, sustained media attention.", "Executive team, legal, communications director, insurer and incident response provider.", "Executive lead: closing the estate or online, public statements, regulator, acquirer and insurer notifications.", "")], "Practical toolkit",
        "Silence is a signal. A store that has not acknowledged within ten minutes is chased by its regional manager; a regional manager who has not acknowledged is replaced by their deputy and the head office incident lead is told.", tool=True)
    b.messages("Messages", "Six messages ready to send", "Short, specific and honest. Fill the brackets, never guess the cause, and always give the time of the next update.", [
        ("SMS", "Store managers", "SEV1: Card payments down in many stores. Switch to cash and offline procedure now. Do not restart terminals. Reply 1 when done. Next update 08:30.", "Keep it under 160 characters so it arrives as one message."),
        ("Push", "All store colleagues", "Some payment systems are down. Your safety comes first. Stay calm, use the till script, call security if anyone becomes aggressive. Please do not post about this online.", ""),
        ("Web banner", "Customers", "We're sorry: some card payments aren't working in our stores right now. Stores are open and accepting [cash]. We're working to fix it and will update here at [10:00].", "Only say what you know is true. Add what still works."),
        ("Email", "Data protection regulator", "Initial notice of a personal data breach. Controller: [name, ref]. Became aware: [date, time]. What happened: [summary]. Data and people affected: [types, approx. numbers]. Measures taken: [summary]. Contact: [lead]. More to follow by [date].", "Use the regulator's own form where there is one. Send what you know now and the rest in phases."),
        ("Email", "Suppliers and hauliers", "We are managing an IT incident affecting [systems]. Deliveries continue as booked unless we call you. Do not act on any request to change bank details or give access. Verify on [known number].", "Attackers often follow up with fake supplier requests."),
        ("Holding line", "Media", "We are aware of an issue affecting payments in some of our stores and are working to resolve it as quickly as possible. Our stores remain open. We will share more information as soon as we can.", "")], "Practical toolkit", tool=True)
    b.exercise("Tabletop exercise", "Exercise: tills down on the busiest Saturday of peak", "An illustrative 90-minute exercise for store, regional and head office leads. Read each inject aloud, give the room five minutes, and record every decision, owner and gap.", [
        ("Duration", "90 minutes, six injects"), ("Participants", "Store and regional managers, head office lead, IT, comms, loss prevention"), ("Objective", "Test decision rights and store acknowledgement across many stores"), ("Facilitator", "Head of resilience or an external facilitator")], [
        ("09:55", "Card payments fail in 120 stores across three regions. Online checkout is slow.", "Who declares, at what level? What is the first instruction to stores, and by when?"),
        ("10:10", "Eighteen stores have not acknowledged. Two regional managers are on leave.", "How do you know who is silent? Who covers for the absent regional managers?"),
        ("10:30", "A queue in a large store turns hostile and a colleague is pushed.", "Who decides to pause entry or close? What support does the colleague get, and who checks?"),
        ("10:50", "IT finds signs of intrusion and wants to take the store network offline.", "Who approves? What will stores lose, who tells them, and when does a notification clock start?"),
        ("11:15", "A journalist calls a store directly. A video of the queue is spreading online.", "Who speaks for the business? What does the store say, word for word?"),
        ("13:00", "Freezer alarms in six stores. They share the same controller model.", "Is it connected? Who decides on stock, and who checks every other site?")], "Practical toolkit",
        "Afterwards, score yourselves on the Readiness assessment, put every gap on the outstanding actions board with an owner and a date, and run the exercise again before the next peak.", tool=True)
    b.pir("Post-incident review", "Post-incident review for a multi-store incident", "Hold the review within two weeks, with stores in the room as well as head office. Look for causes, not culprits, and turn every finding into a dated action.", [
        ("What happened", "A timeline from the first store report to stand down, built from the Incident decision log, not from memory."),
        ("Detection and first report", "How was it first spotted in store? How long until head office knew, and how?"),
        ("Alerting and acknowledgement", "Which stores acknowledged, and how fast? Who stayed silent, and why?"),
        ("Decisions and decision rights", "Who decided to close stores, go to cash or take systems offline? Were they the right people?"),
        ("Stores and colleagues", "Trading lost, stores closed, colleagues hurt or abused, aftercare given and still needed."),
        ("Customers, regulators and suppliers", "What was said, when and by whom? Were notification deadlines met, and did stores know first?"),
        ("What worked and what did not", "Procedures, tools, contact lists and handovers between store, region and head office."),
        ("Actions, owners and dates", "Every finding becomes an action with one owner and a due date, tracked to closure and reported.")], "Practical toolkit", tool=True)

    b.mark("", "Questions, checklist and glossary")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("Trading", ["If every card terminal failed at our busiest hour, how long until every store had one clear instruction?", "Which head office shutdown decisions would stop stores trading, and who tells them?", "Do we know which store systems and fridge controllers face the internet today?"]),
        ("People and duties", ["Is every assault on a colleague reported, followed up and visible to the board?", "Could each large store evacuate, invacuate or lock down today, and has it practised?", "Do we know who we must notify after a data breach in each country, and how fast?"])], "Questions and checklist")
    b.checklist("Checklist", "Are you ready for peak?", "Tick what is true today. Anything blank is your next action.", [
        ("One severity ladder used by stores and head office", "With named owners for each level."),
        ("Peak on-call rota and change freeze published", "Covering every trading day and night of each peak."),
        ("Cash and offline procedure tested before peak", "In at least one store per region."),
        ("Message templates approved and loaded", "Store managers, colleagues, customers, regulators, suppliers and media."),
        ("Fridge controllers and building systems off the internet", "Remote access only through a secure route."),
        ("Notification map ready for every country", "Regulator, deadline, acquirer and food authority, with a named owner."),
        ("Evacuation, invacuation and lockdown briefed", "And walked through in large stores."),
        ("Every store acknowledges alerts", "And non-responders are chased under escalation rules you set.")], "Questions and checklist")
    b.glossary("Words worth knowing", [
        ("Severity level", "A shared grade (SEV 1 to SEV 4) that sets who is alerted, how fast and how often."),
        ("Offline payment mode", "A terminal setting that stores some card transactions for later authorisation when the network is down."),
        ("Acquirer", "The bank or provider that processes card payments for a retailer and receives incident reports about card data."),
        ("Change freeze", "A period, usually over peak, when only essential changes to systems are allowed."),
        ("Supervisory authority", "The data protection regulator that receives breach notifications, for example the Information Commission in the UK."),
        ("Invacuation", "Moving people to a safer place inside a building, away from danger outside."),
        ("Lockdown", "Securing a building so people cannot enter or leave until it is safe."),
        ("Martyn's Law (UK)", "The Terrorism (Protection of Premises) Act 2025, which sets duties for larger public premises in the UK."),
        ("Cold chain", "Keeping chilled and frozen food at safe temperatures from supplier to shelf."),
        ("Refrigeration controller", "A device that runs fridges and freezers and can often be managed remotely."),
        ("Defrost cycle", "A scheduled warm-up that clears ice. Stretched or repeated, it spoils stock."),
        ("Acknowledgement", "A recipient's confirmation that an alert has been read and acted on."),
        ("Incident manager", "The person who runs the response, keeps the log and sets the rhythm of updates."),
        ("Holding line", "A short, accurate statement used while facts are still being established."),
        ("White Friday", "The name used for Black Friday sales in much of the Gulf."),
        ("End of life", "When a manufacturer stops issuing security fixes for a product.")])
    b.platform("Crises Control, an Operational Incident Coordination Platform, in a retail incident", "The peak-day outage from this playbook, step by step, from the first store report to the record for insurers, regulators and the review. Plans, groups and escalation rules are the ones your team configures.", [
        ("A store manager raises the incident from the app or web; a colleague at risk on the shop floor uses SOS, sharing location where available.", "SOS"),
        ("Store and regional managers receive the cash procedure by push, SMS and voice and acknowledge in one tap; silent stores escalate to their regional manager under rules you configure.", "Ping"),
        ("Head office launches the response plan, assigns store, regional and head office roles and keeps one communication log.", "Incident Manager"),
        ("The cash procedure, queue safety and reopening checks become owned tasks with deadlines in every store, from the plan you built.", "Task Manager"),
        ("Head office and regional managers see who has acknowledged, the responses each store has chosen and task progress, live.", "Control Centre"),
        ("A timestamped record of messages, acknowledgements, decisions logged and tasks exports as PDF or CSV for insurers, regulators and the review.", "Audit & Reporting"),
        ("CRAiG (beta) answers questions such as which stores have not acknowledged, using the incident data each user is permitted to see.", "CRAiG")])

    b.mark("", "Sources")
    src = [
        "M&S, Full Year Results 2024/25, 21 May 2025, corporate.marksandspencer.com/newsroom/press-releases/full-year-results-52-weeks-ended-29-march-2025",
        "Reuters via Insurance Journal, M&S resumes online orders, 10 June 2025, insurancejournal.com/news/international/2025/06/10/826904.htm",
        "Ahold Delhaize, Q3 2026 results, 4 November 2026, newsroom.aholddelhaize.com (Q3 2026 results release)",
        "CERT-FR, Alert CERTFR-2026-ALE-012, 12 October 2026, cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/",
        "British Retail Consortium, Crime Report 2026, 24 February 2026, brc.org.uk/media/bk1n3umn/crime-survey-2026.pdf",
        "Food Standards Agency, Chilling food correctly, food.gov.uk/business-guidance/chilling-food-correctly-in-your-business",
        "Help Net Security, US agencies warn of attacks on refrigeration systems, 6 November 2026, helpnetsecurity.com/2026/11/06/cyberattacks-refrigeration-systems-cisa-fbi/",
        "Home Office, Martyn's Law factsheets, updated 24 July 2026, gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "UK GDPR, Article 33, as amended, legislation.gov.uk/eur/2016/679/article/33",
        "Regulation (EU) 2016/679 (GDPR), Articles 33 and 34, eur-lex.europa.eu/eli/reg/2016/679/oj",
        "US FTC, Data Breach Response: A Guide for Business, ftc.gov/business-guidance/resources/data-breach-response-guide-business",
        "PCI SSC, You've been hacked! Now what? (quotes PCI DSS v4.0 Req. 12.10.1), pcisecuritystandards.org/07-youve-been-hacked-now-what/",
        "DLA Piper, Data protection laws of the world: UAE, dlapiperdataprotection.com/countries/uae-general/law.html",
        "Clyde & Co, SDAIA draft amendments to the PDPL, 8 October 2026, clydeco.com/en/insights/2026/10/sdaia-publishes-draft-amendments-to-the-pdpl",
        "US FDA, Food Code 2022, 3-501.16, fda.gov/food/retail-food-protection/fda-food-code",
        "Regulation (EC) No 852/2004, Annex II, Chapter IX, eur-lex.europa.eu/eli/reg/2004/852/oj",
        "Dubai Municipality, Food Code (2013), dmpmedia.dm.gov.ae/uploads/2024/10/Food-Code-2013-English.pdf",
        "eCFR, 29 CFR 1910.38 Emergency action plans, ecfr.gov/current/title-29/section-1910.38",
        "Visa, The bustling Ramadan night-time economy, March 2025, usa.visa.com/partner-with-us/visa-consulting-analytics/economic-insights/bustling-ramadan-night-time-economy.html",
        "Khaleej Times, Black, White, Yellow, Green Friday sales explained, 21 November 2025, khaleejtimes.com/uae/black-white-yellow-green-friday-sales-explainer",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    b.sources([(f"{n:02d}", t) for n, t in items])
    b.art_back("Keep every store<br>in the loop.", "", "Request a demo",
        next_title="Intelligence report No. 03 · When the tills go dark")
    return b
