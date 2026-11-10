from cckit import CCBook, S


def build():
    b = CCBook("Keep It Moving", 4, "slow", "Transport and Logistics", "30 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical playbook for transport and logistics leaders: how to keep people, goods and passengers moving, and staff safe, when a hub goes dark, the weather turns, a system fails or a driver stops answering."
    b.art_cover("Crisis playbook · Transport and Logistics", "Keep it", "moving.",
        "Hub and depot incidents, storms, IT and cyber outages, failed suppliers and drivers on their own at 3am. How to reroute, inform and protect people in the first hour, and what to fix before winter.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("In transport, nobody fails alone. One fault becomes everyone's problem within the hour.", [
        f"On 21 March 2025 Heathrow closed for most of a day after a fire at the North Hyde substation in west London. More than 270,000 passenger journeys were disrupted.{R(1)} The official review found that losing one of the airport's three supply points cut power to some operationally critical systems, and that reconfiguring the airport's network to run on the other two would take an estimated 10 to 12 hours.{R(2)}",
        f"Six months later a ransomware attack on a check-in system supplier forced staff at Heathrow, Brussels and Berlin back to handwritten boarding passes.{R(3)} A cyber attack halted production at Jaguar Land Rover for five weeks and left its suppliers waiting for orders and payments.{R(4,5)} And on 8 September 2026 a software defect in the UK's air traffic system delayed, cancelled or diverted more than 2,000 flights.{R(6)}",
        "This playbook is for the people who hold it together when that happens: operations, resilience, security, safety and communications leaders in airports, ports, rail, bus and coach, freight and logistics. It sets out how to grade and escalate an incident, who decides what, what to do in the first hour, how to keep drivers and lone workers safe and how to bring contractors and partners into one response. It also gives you tools to use: a roles matrix, check-in and notification logs, a tabletop exercise, an actions tracker and a review template. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things keep a network moving on a bad day.", "Transport and logistics run on tight timings, shared assets and many hands. When something breaks, the operators that recover fastest are not the ones with the thickest plans. They are the ones that know where the network is fragile, who must hear first and how to reach every person in it.",
        [("power", "Know your single points of failure", "One power intake, one planning system, one supplier or one control room can stop a whole network. Find them, test the fallback and know how long it lasts."),
         ("bell", "Reach everyone, by more than one route", "Staff, drivers, contractors, partners, customers and passengers each need the right message, fast, with a record of who has acknowledged and who has not."),
         ("shield", "People before payload", "Every decision starts with the safety of passengers, crews, drivers and lone workers. Freight can wait in a yard. A driver who has stopped answering cannot.")])
    b.statement("Disruption travels faster than freight.", "A fault at one hub, airport or control room reaches drivers, partners and passengers within minutes. The first hour decides whether they hear it from you, with clear instructions, or work it out for themselves.", "Introduction")

    # PART 01
    b.mark("01", "Before it hits")
    b.opener("01", "Before<br>it hits.", "Find where your network is fragile, agree how to grade an incident and fix the gaps the recent reviews exposed.", [("01", "Why transport incidents spread"), ("02", "Six disruptions, first moves"), ("03", "Severity and escalation"), ("04", "Who decides: roles and responsibilities"), ("05", "Readiness in six steps")])
    b.essay("Before it hits", "Your network is only as strong as the parts you do not own", [
        "A transport or logistics operation is a chain of dependencies. Power comes from a network operator. Planning, booking and check-in run on systems built by suppliers. Track, airspace, roads and berths belong to someone else. Drivers, handlers and engineers are often contractors or agency staff. When one link fails, the effect lands somewhere else: at a gate, a loading bay, a platform or a lay-by.",
        f"The recent reviews make the point clearly. At Heathrow, the risk that one supply point might fail was understood at a technical level but less well known outside the technical team.{R(7)} After the 2023 failure of the UK's flight planning system, several airlines and airports first heard about it from the media.{R(9)} In September 2025, airports that had done nothing wrong lost their check-in desks because a supplier was attacked.{R(3)}",
        "So incident management in this sector is mostly about the space between organisations. Who tells the partner sites? Who tells the drivers already on the road? Who decides to divert, and who tells the customer whose delivery will now be late? Who checks that the contractor on the night shift is out of the building?",
        "That means three things have to be settled before anything happens. A severity scale that every site and partner understands. A map of who must be told, in what order, by what route. And a clear way to account for people, from passengers in a terminal to a driver parked alone at a closed depot.",
        f"None of this is exotic. Much of it is in the recommendations of the reviews that followed Heathrow and the air traffic failures: a second way to reach key people, earlier warnings to partners and a standard set of information for passengers.{R(1,8)} The work is in making it true across sites, shifts and suppliers before winter, not during the next incident."],
        "Before it hits", "Incident management in this sector is mostly about the space between organisations.")
    b.table("Six disruptions", "Six disruptions and the first moves that matter", "What to do in the first fifteen minutes, before the cause is clear.", ["Disruption", "First operational move", "First people and communication move"], [
        ("Hub, depot, port or airport incident", "Make the site safe. Stop inbound movements. Decide hold, divert or close.", "Account for staff, contractors and visiting drivers. Tell partner sites and drivers on the road."),
        ("Power loss", f"Confirm what is on backup and how long it will last. Ask the network operator for an estimate.{R(2)}", "Alert the incident team by two routes. Warn customers that services from the site may stop."),
        ("Severe weather", f"Act on Met Office warnings before they peak: pre-position, cancel early, protect exposed routes.{R(10)}", "Tell drivers and crews where to stop safely. Tell passengers and customers early, with what to do."),
        ("IT or cyber outage", "Switch to manual or offline procedures. Isolate if attack is suspected. Keep evidence.", "Tell sites what still works and what not to touch. Prepare a regulator notification."),
        ("Supplier or system failure", f"Ask the supplier for scope and a time. Move to the fallback you agreed in advance.{R(3)}", "Tell affected partners and customers once, plainly, with the next update time."),
        ("Driver or lone worker not responding", f"Follow the missed check-in procedure at once. Do not wait for the end of the shift.{R(11)}", "Call, then locate, then send help. Tell the family only through the agreed route.")], "Before it hits", "40mm 1fr 1fr")
    b.severity("Severity", "A transport severity ladder for every site and partner", "Grade early and regrade often. If in doubt, go one level higher and step down later.", [
        (1, "Critical", "A hub, port, terminal or depot closed. Power, IT or a critical supplier lost across the network. Confirmed cyber attack on operations. A fatality, serious injury or missing driver. A red weather warning on key routes.", "Crisis team, all affected site leads, safety, security, IT, communications, legal and key partners.", "Voice · SMS · push · bridge in 15 min"),
        (2, "Major", "One site partly down. An amber warning across a region. A planning, booking or check-in system failing. A road collision with injury. A credible threat to a crew or driver.", "Incident manager, site and regional leads, IT or engineering on call, communications on standby.", "SMS · push · escalate after 10 min"),
        (3, "Moderate", "A single depot or route affected. A breakdown in an unsafe place. A partner running late. A lone worker check-in missed by up to 30 minutes.", "Site lead, transport planner or controller, service desk.", "Push · email"),
        (4, "Minor", "Short delays, a single device fault, a near miss or an abusive passenger without injury.", "Site lead, recorded for trend reporting and the weekly review.", "App · email")], "Before it hits")
    b.escalation("Escalation", "Who is told, and who decides, at each level", "Severity says how bad it is. Escalation says who must act. Times are illustrative: set your own and test them out of hours.", [
        ("Site or depot", "A local fault, a delayed vehicle, a breakdown in an unsafe place or a single missed check-in (SEV 3 to 4).", "Depot or hub lead and the network controller on shift.", "Depot or hub lead", "it is not contained within 30 minutes, more than one site is hit or anyone is hurt"),
        ("Network control", "More than one site or route affected, a planning or check-in system failing, or a key partner running late (SEV 2 to 3).", "Network controller, incident manager, IT or engineering on call.", "Incident manager", "there is no restoration time, customers or passengers will be affected, or a driver is still not found"),
        ("Incident team", "A hub or terminal partly down, an amber warning across a region, a suspected cyber attack or a driver missing after the check-in procedure (SEV 2).", "Incident team, health and safety, communications, IT and key partners.", "Operations director: hold, divert or cancel", "a site closes, there is serious injury, a confirmed attack or media interest"),
        ("Crisis team", "A hub, port, terminal or depot closed, network-wide loss of power, IT or a critical supplier, a fatality or a red warning on key routes (SEV 1).", "Executive team, legal, all site leads, partners and, where required, regulators.", "Chief operating officer or accountable executive", "")], "Before it hits",
        f"If a decision maker has not acknowledged within five minutes, alert their deputy by a second route and record it. The Heathrow review recommended a second means of contact for significant incidents.{R(1)}")
    b.raci("Roles", "Who does what in a network incident", "Illustrative roles for an operator with hubs, depots and drivers on the road. One person is accountable for each activity; agree the names and deputies before you need them.",
        ["Operations director", "Incident manager", "Network control", "Depot or hub lead", "Health and safety", "Comms and customer service"], [
        ("Raise the first alert from site", ["", "I", "I", "A", "I", ""]),
        ("Declare the incident and set severity", ["I", "A", "C", "C", "I", "I"]),
        ("Account for everyone on site", ["", "I", "", "A", "R", ""]),
        ("Stop inbound vehicles and hold drivers safely", ["I", "C", "A", "C", "C", ""]),
        ("Run the missed check-in escalation", ["", "I", "A", "C", "R", ""]),
        ("Decide to hold, divert or cancel", ["A", "R", "C", "C", "C", "I"]),
        ("Tell partner sites, hauliers and suppliers", ["I", "A", "R", "I", "", "C"]),
        ("Tell customers and passengers", ["C", "C", "I", "", "", "A"]),
        ("Speak to the media", ["A", "C", "", "", "C", "R"]),
        ("Decide on regulator notification", ["A", "R", "", "", "C", "C"]),
        ("Approve the return to normal operations", ["A", "R", "C", "C", "C", "I"])], "Before it hits",
        "Drivers and crews are not on this matrix because they never decide alone in a crisis: they act on one instruction from network control and acknowledge it. Make sure every driver knows who that is on each shift.")
    b.steps("Readiness", "Readiness in six steps", "Each step comes from a lesson in a recent official review. Finish them before the winter peak.", [
        ("Map your single points of failure", f"Power intakes, control rooms, planning and check-in systems, fuel and key suppliers. At Heathrow, losing one of three supply points cut power to critical systems.{R(2)}"),
        ("Test backup for duration, not just start-up", f"Find out how long each backup source lasts. Heathrow's review found nearly all emergency power on the affected supply would have run out before main power returned.{R(7)}"),
        ("Give every key person a second route", f"The Heathrow review recommended a second means of contact for significant incidents, in addition to the existing alert calls.{R(1)}"),
        ("Check on-call staff can actually act", f"In 2023 an on-call engineer could not log in remotely and reached the control centre 3 hours 15 minutes after the failure began.{R(9)}"),
        ("Agree who tells partners, and how fast", f"After the 2023 air traffic failure, several airlines and airports first heard of it from the media.{R(9)}"),
        ("Set weather triggers in advance", f"Decide which warnings cancel which services. In a red warning, police advise people to avoid travel in the affected area.{R(10)}")], "Before it hits")

    # PART 02
    b.mark("02", "When it hits")
    b.opener("02", "When it<br>hits.", "The first hour at a hub that has gone dark, keeping drivers and lone workers safe, rerouting, informing passengers and bringing partners into one response.", [("01", "The first hour, and lane by lane"), ("02", "Missed check-ins and the driver log"), ("03", "Rerouting and messages ready to send"), ("04", "Contractors, partners and the notification log")])
    b.firsthour("The first hour", "Thursday, 23:40: a substation fire cuts power to your main hub", "Illustrative. The cause is not yours. The response is.", [
        ("T+00:00", "Power lost at the hub", "Lights, sortation and yard systems stop. Backup starts, but not everything is on it.", "Hub duty manager", 2),
        ("T+00:05", "SEV 1 declared, log started", "The team is alerted by call and SMS. Anyone silent after five minutes is called again.", "Incident manager", 1),
        ("T+00:10", "Account for everyone on site", "Roll call of staff, agency workers, contractors and visiting drivers.", "Site safety lead", 1),
        ("T+00:15", "Stop inbound vehicles", "Drivers heading in stop at a safe place and acknowledge. Nobody arrives at a dark yard.", "Transport planner", 1),
        ("T+00:30", "Decide where the freight goes", "No restoration time yet. Divert trunks to hubs with confirmed capacity.", "Operations director", 1),
        ("T+00:45", "Tell customers before they ask", "Key customers hear what is affected and when the next update is.", "Customer service · Comms", 2),
        ("T+01:00", "First crisis team review", "People, freight, drivers' hours and the morning plan.", "Incident manager", 3)], "When it hits")
    b.swimlane("Lane by lane", "The hub power loss, lane by lane", "The same illustrative incident, showing who acts, who decides, where it goes wrong and how each step is watched.",
        ["Drivers", "Hub and depots", "Network control", "Suppliers and partners", "Customers and passengers"],
        ["T+00:00", "T+00:05", "T+00:15", "T+00:30", "T+00:45", "T+01:00"], [
        (0, 0, "Trunks still heading for a dark yard", "risk"),
        (0, 1, "Stop alert: park safely, reply 1", "act"),
        (0, 2, "Three drivers silent after ten minutes", "risk"),
        (0, 3, "Replies and locations tracked", "mon"),
        (0, 4, "Rerouted to receiving hubs", "act"),
        (0, 5, "Drivers' hours checked before onward legs", "mon"),
        (1, 0, "Backup covers only some systems", "risk"),
        (1, 1, "Duty manager raises the alarm, with location where supported", "act"),
        (1, 2, "Roll call: staff, agency, visiting drivers", "act"),
        (1, 3, "Agency workers missing from the list", "risk"),
        (1, 4, "Roll call confirmed to incident manager", "mon"),
        (2, 1, "SEV 1 declared, log started", "dec"),
        (2, 2, "Silent leads called by second route", "mon"),
        (2, 3, "Operations director: divert to hubs with capacity", "dec"),
        (2, 4, "Missed check-ins escalated to duty manager", "mon"),
        (2, 5, "First review: people, freight, morning plan", "dec"),
        (3, 1, "Network operator asked for an estimate", "act"),
        (3, 2, "No restoration time; plan for hours", "risk"),
        (3, 3, "Receiving hubs and hauliers told", "act"),
        (3, 4, "Partners acknowledge; same update clock", "mon"),
        (4, 3, "Calls start before any message is sent", "risk"),
        (4, 4, "Key customers told impact and next update", "act"),
        (4, 5, "Next update sent at the promised time", "mon")], "When it hits",
        "<b>Where it goes wrong:</b> drivers who never got the stop message, people missing from the roll call and customers who hear nothing. <b>Who decides:</b> the incident manager declares and grades; the operations director decides where freight goes. <b>How it is monitored:</b> network control watches acknowledgements, check-ins and the time of the next update, and chases anything silent.")
    b.escalation("Missed check-ins", "When a driver or lone worker stops answering", f"HSE guidance says employers must monitor lone workers and keep in touch with them, using pre-agreed intervals of regular contact, and test their emergency procedures regularly.{R(11)} These times are illustrative.", [
        ("T+0 Missed check-in", "A driver or lone worker misses a scheduled check-in. The alert reaches the controller automatically, not by memory.", "Network controller. The driver by app and SMS.", "Network controller", "there is no reply within 10 minutes"),
        ("T+10 Contact", "No reply to the app or SMS.", "The controller calls the driver, then the vehicle or site phone, then any colleague nearby.", "Network controller", "there is still no contact by T+20"),
        ("T+20 Locate", "Still no contact. Record it in the check-in log as unresolved.", "Duty manager and depot lead. Last known location and telematics checked.", "Duty manager", "there is still no contact by T+30, or any sign of danger"),
        ("T+30 Send help", "No contact, or any sign of danger at any point. Declare SEV 2, or SEV 1 if the driver is confirmed missing or hurt.", "999 where there is any risk to life. Incident manager and health and safety lead. Family only through the agreed route.", "Duty manager, with the incident manager", "")], "When it hits",
        f"Call 999 at once if there is any sign of danger; do not wait for the next level. Shorten the times for higher risk work such as night parking or remote sites. Transport and storage recorded 15 worker deaths in 2025/26 in HSE's provisional figures, which do not include deaths in road traffic accidents.{R(12)}")
    b.form("Driver check-in log", "Driver and lone worker check-in log", "One line per scheduled check-in. Network control keeps it on every night shift; a blank in the actual time column is a live escalation.",
        [("Driver and vehicle", 1.2), ("Route or location", 1.4), ("Due", .6), ("Actual", .6), ("Status code", .9), ("If missed: action and time", 1.7), ("Controller", .8)], "When it hits", rows=14,
        example=["Driver 14 · Vehicle 207", "Services, junction 5 (planned rest)", "02:00", "02:04", "OK, parked", "None", "Initials"],
        note="Agree the rhythm before the shift: planned route, check-in times and a status code. Higher risk work, such as night parking or remote sites, gets shorter intervals. Record the outcome of every missed check-in, check on the person the next day and keep the log for the review.")
    b.grid("Rerouting and information", "Rerouting and keeping people informed", f"The 2023 air traffic review asked airlines and airports to develop a standardised suite of passenger information during major incidents.{R(8)} The same discipline works for freight customers.", [
        ("compass", "Decide the route, then say it once", "Agree the diversion or alternative with the receiving site before announcing it. One instruction, one owner, one time stamp, sent to every site and driver affected."),
        ("bell", "Tell people what to do", "Lead with the action: do not travel, rebook, collect from another depot, expect delivery tomorrow. Then explain the cause, if you know it."),
        ("loop", "Set the next update and keep it", "Give a time for the next update, even if there will be nothing new. Silence is when rumours start and phone lines jam."),
        ("laptop", "Reach people without data", "Not everyone has the app. Use SMS, station and terminal staff, partner desks and recorded phone lines alongside the website.")], "When it hits")
    b.messages("Messages", "Six messages ready to send", "Short, specific and honest. Fill the brackets, never guess the cause and always give the time of the next update.", [
        ("SMS", "Drivers on the road", "SEV1: [Hub] has no power. Do not travel to site. Stop at [safe location] and reply 1 when parked. Next update 00:30. Call [number] if unsafe.", "Ask for a reply so you know who has stopped."),
        ("Push", "Hub staff and contractors", "Power loss at [Hub]. Stop work safely and go to [assembly point] for a roll call. Do not restart equipment. Supervisors will brief you there.", ""),
        ("Web banner", "Passengers", "Services from [terminal or station] are disrupted because of [a power failure]. Please do not travel to [location] today unless told your journey is running. Next update [10:00].", "Lead with what to do. Add rebooking and refund links."),
        ("Email", "Customers and partners", "We are managing an incident at [site] affecting [services]. Freight is being diverted to [site]. Expect delays of [x hours]. We will update you at [time]. Contact [desk].", "Partners should hear before the media does."),
        ("Email", "Regulator", "Initial notification: [Organisation] is managing an incident affecting [service] since [time]. Impact: [summary]. Cause: under investigation. Contact: [name, number]. Full report to follow.", f"NIS operators must notify within 72 hours; a Bill now before Parliament proposes 24 hours.{R(13,14)}"),
        ("Holding line", "Media", "We are aware of disruption affecting [services] and are working to restore them as quickly as possible. The safety of our passengers and colleagues comes first. We will share more information as soon as we can.", "")], "When it hits")
    b.dive("01", "transfer", "Bring contractors and partners into one response", "Most transport incidents involve people you do not employ: network operators, system suppliers, hauliers, handlers, security and cleaning contractors, neighbouring sites. They need to hear early and act on the same facts.", [
        ("Know who they are", "Every partner that can stop your operation, or be stopped by it, with a 24-hour contact and a named owner."),
        ("Tell them first", "Partners should hear from you, not the news. Agree in contracts how fast you tell each other."),
        ("Share one clock", "Key partners join the incident log or call, with the same severity scale and update times."),
        (f"Plan for their failure", f"JLR set up early payment financing for suppliers critical to its restart.{R(5)} Ask what yours would need.")], "When it hits",
        "Head of operations, with procurement")
    b.form("Partner notification log", "Partner and supplier notification log", "Who must hear from you, who told them, when, and whether they acknowledged. Fill in the first three columns before winter.",
        [("Partner or supplier", 1.3), ("What they do for us", 1.3), ("24-hour contact", 1.2), ("Told at", .7), ("Told by", .9), ("Acknowledged", .9), ("Next update", .8)], "When it hits", rows=14,
        example=["Planning system supplier", "Route planning and labels", "24-hour service desk", "22:12", "Network control", "22:15, by phone", "23:00"],
        note=f"After the 2023 air traffic failure, several airlines and airports first heard about it from the media.{R(9)} A partner that is not on this log will not be told.")

    # PART 03
    b.mark("03", "Recover and rehearse")
    b.opener("03", "Recover and<br>rehearse.", "Three scenarios to test your plan, a tabletop exercise, the tools to track and review the response, and a dated plan with owners.", [("01", "Three scenarios"), ("02", "A tabletop exercise"), ("03", "Outstanding actions and the review"), ("04", "Your plan, questions and checklist")])
    b.usecase("Scenarios", "Three illustrative scenarios: where they go wrong and who decides", [
        ("truck", "Regional bus and coach operator", "A red wind warning on a weekday morning", [("Where it goes wrong", "Deciding route by route at 05:00, with drivers already out and passengers waiting at stops."), ("Who decides", "The operations director at a 04:30 call, on triggers agreed in advance."), ("How it is monitored", "Hourly driver check-ins and a live list of routes running, held or cancelled."), ("Rehearse", "Walk through the 04:30 decision call with depot leads.")]),
        ("server", "Parcel and freight network", "The planning system supplier is hit by ransomware", [("Where it goes wrong", "Waiting for the supplier before telling sites and customers anything."), ("Who decides", "The incident manager declares; the operations director moves hubs to the offline route pack."), ("How it is monitored", "Depot acknowledgements, loads dispatched against plan and a supplier update on a fixed clock."), ("Rehearse", "Run one hub for two hours without the planning system.")]),
        ("shield", "Airport ground handler", "Check-in and bag drop go down at 06:00", [("Where it goes wrong", "Each airline saying something different at its own desks as queues build."), ("Who decides", "The terminal duty manager, with airline station managers, on one manual check-in plan."), ("How it is monitored", "Queue times, desks open on manual kits and one agreed passenger message."), ("Rehearse", "A 30-minute manual check-in drill with airline partners.")])], "Recover and rehearse")
    b.exercise("Tabletop exercise", "Exercise: the planning system goes dark at night", "Illustrative. A supplier cyber attack, run as a facilitated discussion. Release each inject only when the room has answered the last.", [
        ("Duration", "Two and a half hours"), ("Participants", "Operations, network control, two depot leads, safety, comms, IT, a key haulier"), ("Objective", "Test the divert decision, missed check-ins and partner notice at night"), ("Facilitator", "Head of resilience, with an observer keeping the log")], [
        ("22:00", "Route planning and label printing fail across the network. The supplier says it is investigating.", "Who declares, and at what severity? How are depots told? What do drivers already loaded do?"),
        ("22:20", "The supplier confirms a suspected cyber attack and cannot give a restoration time.", "Do you cut any connections? Who decides to switch to the offline route pack? Who considers regulator notification?"),
        ("23:10", "A driver on a rural route misses two check-ins. The phone goes to voicemail.", "Who owns the escalation, and what times apply? At what point do you call 999?"),
        ("00:30", "A national news site reports the outage and names your company.", "Who speaks? Have customers and partners already heard from you?"),
        ("02:00", "Two depots report the offline pack is out of date for key customers.", "Who decides which loads go first? How is that tracked and reported?"),
        ("05:30", "The morning shift starts. The system is still down.", "What runs, what is cancelled, and who tells customers before 07:00? Which actions are still outstanding?")], "Recover and rehearse",
        "Afterwards, record the decisions, the gaps and an owner for each fix in the review template, and add every action to the tracker.")
    b.tracker("Outstanding actions", "Outstanding actions, the morning after", "Illustrative, following the hub power loss. The incident manager reviews this board at every update; every action has an owner, a due time and a way to check it is done.", [
        ("Account for the agency worker missing from the roll call", "Depot lead", "00:20", "Done", "Agency confirmation recorded in the log"),
        ("Confirm drivers held overnight are rested and fit to drive", "Network control", "05:00", "Done", "Check-in log and drivers' hours records"),
        ("Get a written restoration estimate from the network operator", "Engineering lead", "06:00", "Blocked", "Estimate logged; chased every hour"),
        ("Send customers the 07:00 update", "Comms and customer service", "07:00", "Overdue", "Sent time compared with promised time"),
        ("Clear diverted freight at receiving hubs", "Operations director", "Day 2", "In progress", "Volumes reported at each review"),
        ("Test how long backup power lasts before reopening", "Engineering lead", "Day 2", "Open", "Test result signed off by the site lead"),
        ("Call the three drivers who missed check-ins", "Health and safety lead", "Day 2", "Open", "Welfare call recorded for each driver"),
        ("Decide whether a regulator notification is needed", "Incident manager, with legal", "Within 72 h", "In progress", "Decision and reasons recorded"),
        ("Book the post-incident review with partners", "Incident manager", "Day 5", "Open", "Each partner has accepted")], "Recover and rehearse",
        "Anything overdue or blocked goes to the top of the next crisis team review, with one named person to unblock it.")
    b.pir("Post-incident review", "Post-incident review template", "Complete within two weeks, with partners in the room. Look for what the system allowed to happen, not for someone to blame.", [
        ("What happened", "A short timeline from first alert to stand-down. Which sites, routes, drivers and partners were affected?"),
        ("People and welfare", "Was everyone accounted for? How long did each missed check-in take to resolve?"),
        ("Alerting and acknowledgement", "How was it first reported? How long until the right people acknowledged, and who did not?"),
        ("Decisions", "Which decisions were made, by whom, when and on what information? Which waited too long?"),
        ("Partners and suppliers", "When was each partner told? Did any hear first from the media or a customer?"),
        ("Customers and passengers", "Were updates sent on time, in plain language and on more than one channel?"),
        ("What worked, what did not", "Backup duration, manual procedures, diversions and the incident log."),
        ("Actions", "Each fix with an owner, a due date and how completion will be checked. Report to the board.")], "Recover and rehearse")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure, and date every action.", ["When", "Actions", "Owner"], [
        ("This week", "Publish the severity ladder, escalation levels, roles matrix and the six message templates to every site. Confirm a second contact route for every key person.", "Head of resilience"),
        ("This week", "Put the driver check-in log and missed check-in escalation live on every night shift, and test it.", "Head of health and safety"),
        ("This month", "Map single points of failure: power, control rooms, systems and suppliers. Test how long each backup lasts.", "Engineering and IT leads"),
        ("This month", "Agree partner notification routes and 24-hour contacts with your top 20 suppliers and partners.", "Head of operations, with procurement"),
        ("This quarter", "Run the tabletop exercise in this playbook with partners, then a hub power loss at night. Track every fix.", "Operations director"),
        ("This quarter", "Check regulator reporting duties and timings. Report gaps and dated fixes to the board.", "Chief operating officer, with legal")], "Recover and rehearse", "30mm 1fr 50mm")
    b.questions("For leaders", "Questions for your leadership team", "Ask them out loud. Vague answers are the finding.", [
        ("Resilience", ["If our main hub or terminal lost power tonight, how long would backup last, and what would stop first?", "Which single supplier or system could stop our whole operation, and what is the fallback?", "How quickly would every partner site and driver have one clear instruction?"]),
        ("People", ["How do we know, minute by minute, that every lone worker and driver is safe?", "Could every key decision maker be reached at 1am if their phone was on silent?", "Do passengers and customers hear from us before they hear from the media?"])], "Recover and rehearse")
    b.checklist("Checklist", "Are you ready to keep it moving?", "Tick what is true today. Anything blank is your next action.", [
        ("One severity ladder used by every site and key partner", "With named owners and alert routes for each level."),
        ("Single points of failure mapped and backup duration known", "Power, control rooms, systems and suppliers."),
        ("Two routes to every key decision maker", "Tested out of hours, not only in office time."),
        ("Lone worker and driver check-ins live on every shift", "With automatic alerts for missed check-ins."),
        ("Message templates approved and loaded", "Drivers, staff, passengers, customers, regulators and media."),
        ("Partner contacts current and notification agreed", "Including 24-hour numbers for critical suppliers."),
        ("Manual or offline procedures tested this quarter", "Planning, check-in, dispatch and gate control."),
        ("Regulator reporting duties understood", "Who reports what, to whom, and by when.")], "Recover and rehearse")
    b.glossary("Words worth knowing", [
        ("Severity level", "A shared grade (SEV 1 to SEV 4) that sets who is alerted, how fast and how often."),
        ("Single point of failure", "One component, site, system or supplier whose loss stops the whole operation."),
        ("Supply point", "A connection to the electricity network. Large sites may have several, each feeding different systems."),
        ("Backup duration", "How long a generator, battery or other fallback can run before it is exhausted."),
        ("Lone worker", "Anyone who works without close or direct supervision, such as a driver or night security officer."),
        ("Welfare check", "A planned contact to confirm a lone worker or driver is safe."),
        ("Trunking", "Moving freight in bulk between hubs, usually overnight."),
        ("Diversion", "Sending vehicles, freight or passengers through another site or route."),
        ("Manual fallback", "A paper or offline way of doing a task when the system is down."),
        ("NIS Regulations", "The Network and Information Systems Regulations 2018, which set security and incident reporting duties for essential services, including transport."),
        ("Competent authority", "The regulator for an essential service under the NIS Regulations."),
        ("Holding line", "A short, accurate statement used while facts are still being established."),
        ("Acknowledgement", "A recipient's confirmation that an alert has been read and acted on."),
        ("Incident manager", "The person who runs the response, keeps the log and sets the rhythm of updates.")])
    b.platform("How the modules work together in a transport incident", "The hub power loss from this playbook, followed through the platform from the first alarm to the review.", [
        ("A depot duty manager or a driver on their own raises the alarm in one touch, with their location where supported.", "SOS"),
        ("Drivers, depot staff and partners are alerted by push, SMS and voice; anyone silent is chased and escalated automatically.", "Ping"),
        ("The incident manager declares SEV 1, assigns network roles and keeps one log shared with partner sites and suppliers.", "Incident Manager"),
        ("Roll call, missed check-in escalation, diversion and customer updates run as owned tasks with deadlines.", "Task Manager"),
        ("Network control sees affected sites, drivers stopped safely, overdue check-ins and outstanding actions in one live view.", "Control Centre"),
        ("A timestamped record of every alert, acknowledgement and decision supports the review, insurers and regulators.", "Audit & Reporting"),
        ("CRAiG helps the incident team find which drivers have not checked in and which actions are still outstanding.", "CRAiG")])

    b.mark("", "Sources")
    src = [
        "The National (PA), report on the Kelly Review, 29 May 2025, https://www.thenationalnews.com/business/aviation/2025/05/29/heathrow-chiefs-phone-on-silent-mode-as-fire-caused-airport-to-close-inquiry-finds/",
        "NESO, Final report from the North Hyde review, 1 July 2025, https://www.neso.energy/news/final-report-review-north-hyde-substation-outage",
        "NBC News (Associated Press), Airport cyberattack disrupts more flights, 21 September 2025, https://www.nbcnews.com/world/europe/airport-cyberattack-disrupts-flights-europe-rcna232743",
        "The Register, JLR attack cost (Cyber Monitoring Centre), 22 October 2025, https://www.theregister.com/2025/10/22/jaguar_lander_rover_cost/",
        "JLR, JLR restarts manufacturing, 7 October 2025, https://media.jlr.com/corporate/news/2025/10/jlr-restarts-manufacturing-and-introduces-new-financing-solution-pay-jlr-suppliers",
        "Civil Aviation Authority, Scope of review into NATS incident of 8 September 2026, 25 September 2026, https://www.caa.co.uk/newsroom/news/uk-aviation-regulator-announces-scope-of-independent-review-into-nats-technical-incident-on-8-september-2026/",
        "The Business Continuity Institute, The Kelly Review, 29 May 2025, https://www.thebci.org/news/the-kelly-review-lessons-from-heathrow-s-power-outage.html",
        "Civil Aviation Authority, Independent Review into August 2023 NATS failure, 14 November 2024, https://www.caa.co.uk/newsroom/news/aviation-regulator-publishes-independent-review-into-august-2023-nats-flight-planning-system-failure/",
        "The Irish News (PA), Engineer's password problem contributed to failure, 14 November 2024, https://us.irishnews.com/news/uk/engineers-password-problem-contributed-to-air-traffic-control-failure-report-JLYW4ZCCWROLDIZBCYMCGFWEEM",
        "Transport Scotland, Storm Éowyn: red wind warning, 23 January 2025, https://www.transport.gov.scot/news/storm-eowyn-red-wind-warning",
        "HSE, Lone working: supervision and monitoring, https://www.hse.gov.uk/lone-working/employer/training-supervision-monitoring.htm",
        "HSE, Fatal injuries 2025/26 (provisional), updated 30 June 2026, https://www.hse.gov.uk/statistics/fatals-overview.htm",
        "The Network and Information Systems Regulations 2018, regulation 11, https://www.legislation.gov.uk/uksi/2018/506/regulation/11",
        "DSIT, Cyber Security and Resilience Bill factsheet: incident reporting, updated 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/incident-reporting",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    b.sources([(f"{n:02d}", t) for n, t in items], "Accessed November 2026. Early reporting on live incidents can change.")
    b.art_back("Keep every driver,<br>site and passenger<br>in the loop.", "Crises Control helps transport and logistics operators alert every site, crew and driver in seconds, see who has acknowledged, coordinate partners from one place and keep lone workers safe.", "Request a demo",
        next_title="Intelligence report No. 04 · The Heathrow lesson")
    return b
