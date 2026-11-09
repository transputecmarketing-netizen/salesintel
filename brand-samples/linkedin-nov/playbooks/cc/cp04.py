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
        "This playbook is for the people who hold it together when that happens: operations, resilience, security, safety and communications leaders in airports, ports, rail, bus and coach, freight and logistics. It sets out how to grade an incident, what to do in the first hour, how to keep drivers and lone workers safe, how to reroute and keep customers and passengers informed, and how to bring contractors and partners into one response. The companion intelligence report sets out the evidence in full."],
        "The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three things keep a network moving on a bad day.", "Transport and logistics run on tight timings, shared assets and many hands. When something breaks, the operators that recover fastest are not the ones with the thickest plans. They are the ones that know where the network is fragile, who must hear first and how to reach every person in it.",
        [("power", "Know your single points of failure", "One power intake, one planning system, one supplier or one control room can stop a whole network. Find them, test the fallback and know how long it lasts."),
         ("bell", "Reach everyone, by more than one route", "Staff, drivers, contractors, partners, customers and passengers each need the right message, fast, with a record of who has acknowledged and who has not."),
         ("shield", "People before payload", "Every decision starts with the safety of passengers, crews, drivers and lone workers. Freight can wait in a yard. A driver who has stopped answering cannot.")])
    b.statement("Disruption travels faster than freight.", "A fault at one hub, airport or control room reaches drivers, partners and passengers within minutes. The first hour decides whether they hear it from you, with clear instructions, or work it out for themselves.", "Introduction")

    # PART 01
    b.mark("01", "Before it hits")
    b.opener("01", "Before<br>it hits.", "Find where your network is fragile, agree how to grade an incident and fix the gaps the recent reviews exposed.", [("01", "Why transport incidents spread"), ("02", "Six disruptions, first moves"), ("03", "A transport severity ladder"), ("04", "Readiness in six steps")])
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
    b.steps("Readiness", "Readiness in six steps", "Each step comes from a lesson in a recent official review. Finish them before the winter peak.", [
        ("Map your single points of failure", f"Power intakes, control rooms, planning and check-in systems, fuel and key suppliers. At Heathrow, losing one of three supply points cut power to critical systems.{R(2)}"),
        ("Test backup for duration, not just start-up", f"Find out how long each backup source lasts. Heathrow's review found nearly all emergency power on the affected supply would have run out before main power returned.{R(7)}"),
        ("Give every key person a second route", f"The Heathrow review recommended a second means of contact for significant incidents, in addition to the existing alert calls.{R(1)}"),
        ("Check on-call staff can actually act", f"In 2023 an on-call engineer could not log in remotely and reached the control centre 3 hours 15 minutes after the failure began.{R(9)}"),
        ("Agree who tells partners, and how fast", f"After the 2023 air traffic failure, several airlines and airports first heard of it from the media.{R(9)}"),
        ("Set weather triggers in advance", f"Decide which warnings cancel which services. In a red warning, police advise people to avoid travel in the affected area.{R(10)}")], "Before it hits")

    # PART 02
    b.mark("02", "When it hits")
    b.opener("02", "When it<br>hits.", "The first hour at a hub that has gone dark, keeping drivers and lone workers safe, rerouting, informing passengers and bringing partners into one response.", [("01", "The first hour"), ("02", "Driver and lone worker welfare checks"), ("03", "Rerouting and information"), ("04", "Messages ready to send"), ("05", "Contractors and partners")])
    b.firsthour("The first hour", "Thursday, 23:40: a substation fire cuts power to your main hub", "Illustrative. The cause is not yours. The response is.", [
        ("T+00:00", "Power lost at the hub", "Lights, sortation and yard systems stop. Backup starts, but not everything is on it.", "Hub duty manager", 2),
        ("T+00:05", "SEV 1 declared, log started", "The team is alerted by call and SMS. Anyone silent after five minutes is called again.", "Incident manager", 1),
        ("T+00:10", "Account for everyone on site", "Roll call of staff, agency workers, contractors and visiting drivers.", "Site safety lead", 1),
        ("T+00:15", "Stop inbound vehicles", "Drivers heading in stop at a safe place and acknowledge. Nobody arrives at a dark yard.", "Transport planner", 1),
        ("T+00:30", "Decide where the freight goes", "No restoration time yet. Divert trunks to hubs with confirmed capacity.", "Operations director", 1),
        ("T+00:45", "Tell customers before they ask", "Key customers hear what is affected and when the next update is.", "Customer service · Comms", 2),
        ("T+01:00", "First crisis team review", "People, freight, drivers' hours and the morning plan.", "Incident manager", 3)], "When it hits")
    b.flow("Welfare checks", "When a driver or lone worker stops answering", f"HSE guidance says employers must monitor lone workers and keep in touch with them, using pre-agreed intervals of regular contact, and test their emergency procedures regularly.{R(11)}", [
        ("bell", "Agree the rhythm before the shift", "Planned route, check-in times and a safe word or status code. Higher risk work, such as night parking or remote sites, gets shorter intervals."),
        ("eye", "Spot the missed check-in at once", "A missed check-in raises an alert to the controller automatically. Nobody should be relying on memory at 3am."),
        ("owner", "Try to reach them, then escalate", "Call, then message, then call the vehicle or site. If there is no answer within the agreed window, escalate to SEV 2 and the duty manager."),
        ("magnifier", "Locate and send help", "Use the last known location and telematics. Call 999 if there is any sign of danger. Send a colleague only if it is safe to do so."),
        ("check", "Close the loop and learn", "Record the outcome, check on the person the next day and review the route, the timing and the kit.")], "When it hits",
        f"Transport and storage recorded 15 worker deaths in 2025/26 in HSE's provisional figures, which do not include deaths in road traffic accidents.{R(12)}")
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

    # PART 03
    b.mark("03", "Recover and rehearse")
    b.opener("03", "Recover and<br>rehearse.", "Three scenarios to test your plan, a dated plan with owners, and the questions to put to your leadership team.", [("01", "Three scenarios"), ("02", "This week, this month, this quarter"), ("03", "Questions and checklist")])
    b.usecase("Scenarios", "Three illustrative scenarios to rehearse this winter", [
        ("truck", "Regional bus and coach operator", "A red wind warning on a weekday morning", [("The trigger", "Warnings move from amber to red overnight. Drivers start at 05:00 on exposed routes."), ("What helps", "Pre-agreed triggers, early cancellation and a driver check-in every hour."), ("What hurts", "Deciding route by route at the depot, while passengers wait at stops."), ("Rehearse", "Walk through the 04:30 decision call with depot leads.")]),
        ("server", "Parcel and freight network", "The planning system supplier is hit by ransomware", [("The trigger", "Route planning and labels fail at 22:00. The supplier says it is investigating."), ("What helps", "A paper or offline route pack and a list of priority customers."), ("What hurts", "Waiting for the supplier before telling sites and customers anything."), ("Rehearse", "Run one hub for two hours without the planning system.")]),
        ("shield", "Airport ground handler", "Check-in and bag drop go down at 06:00", [("The trigger", "Desk systems fail across the terminal. Queues build within minutes."), ("What helps", "Manual check-in kits, extra staff called in and one passenger message."), ("What hurts", "Each airline saying something different at its own desks."), ("Rehearse", "A 30-minute manual check-in drill with airline partners.")])], "Recover and rehearse")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure, and date every action.", ["When", "Actions", "Owner"], [
        ("This week", "Publish the severity ladder and the six message templates to every site. Confirm a second contact route for every key person.", "Head of resilience"),
        ("This week", "Check lone worker and driver check-in procedures are live on every night shift, with escalation tested.", "Head of health and safety"),
        ("This month", "Map single points of failure: power, control rooms, systems and suppliers. Test how long each backup lasts.", "Engineering and IT leads"),
        ("This month", "Agree partner notification routes and 24-hour contacts with your top 20 suppliers and partners.", "Head of operations, with procurement"),
        ("This quarter", "Run a joint exercise with partners: a hub power loss at night, then a supplier cyber attack.", "Operations director"),
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
    b.platform("Where Crises Control fits in a transport incident", "How the steps in this playbook map to Crises Control modules.", [
        ("Alert drivers, crews and partner sites in seconds, see who has acknowledged and escalate automatically to anyone who has not.", "Ping"),
        ("Run the incident from one workspace with one log, shared by sites, contractors and partners.", "Incident Manager"),
        ("Turn the hub power loss, manual check-in and diversion procedures into tasks with owners and deadlines.", "Task Manager"),
        ("See which sites are affected, which drivers have stopped safely and where escalations are waiting.", "Control Centre"),
        ("Give drivers and lone workers a one-touch way to raise an alarm with their location.", "SOS"),
        ("Keep a timestamped record of every message and decision for the regulator, the insurer and the review.", "Audit Trail")])

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
