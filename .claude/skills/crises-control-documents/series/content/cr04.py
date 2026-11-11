from cckit import CCReport, S


def build():
    b = CCReport("The Heathrow Lesson", 4, "plug", "Transport and Logistics", "30 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at disruptions that have tested transport and logistics, through UK and European case studies: the North Hyde fire that closed Heathrow, two failures of the UK's air traffic system, a ransomware attack on airport check-in and the cyber attack that stopped Jaguar Land Rover and its supply chain."
    b.rep_cover("Intelligence report", "The Heathrow<br>lesson.",
        "What the official reviews of the North Hyde fire, the NATS failures, the airport check-in attack and the JLR shutdown tell transport and logistics leaders about power, partners, people and the first hour.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("The weak points were known. What failed was the link between knowing and acting.", [
        f"Late on 20 March 2025 a fire at the North Hyde substation cut power to part of Heathrow. The airport closed for most of 21 March and more than 270,000 passenger journeys were disrupted.{R(1,3)} NESO's review found that losing one of Heathrow's three supply points cut power to some operationally critical systems, and that a high moisture reading taken at the substation in 2018 had not been acted on.{R(1)}",
        f"Heathrow's own review, led by Ruth Kelly, found the decision to close was correct, but that nearly all emergency power on the affected supply would have run out before main power returned, and that a key alert went unheard overnight.{R(3,4)} The CAA's review of the August 2023 air traffic failure had already found partners hearing late and an on-call engineer who could not log in remotely.{R(7,8)} On 8 September 2026 a different software defect at NATS delayed, cancelled or diverted more than 2,000 flights.{R(9,10)}",
        f"Cyber attacks on suppliers added a second pattern. A ransomware attack on a check-in system supplier hit Heathrow, Brussels and Berlin in September 2025, and an attack on Jaguar Land Rover stopped production for five weeks, with a modelled UK cost of £1.9bn across more than 5,000 organisations.{R(11,12,16)}",
        "This report sets out what the reviews found, separates findings from commentary, summarises the rules that shape the response in the UK, the US, the EU and the Middle East, and ends with practical steps for transport and logistics leaders wherever they operate."],
        "Treat power, systems, suppliers and people as one resilience problem: know your single points of failure and how long each fallback lasts, reach every key person and partner by more than one route, and rehearse the first hour with the organisations you depend on.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("The weak point was a single connection, and it was known.", f"Heathrow's network meant losing one of three supply points cut power to critical systems. The vulnerability was understood at a technical level but less well known outside the technical team.{R(1,4)}"),
        ("Backup that starts is not backup that lasts.", f"The Kelly Review found nearly all emergency power sources on the North Hyde supply would have been depleted before main power was restored.{R(4)}"),
        ("Alerts depend on the phone that receives them.", f"A senior leader's phone had switched to silent overnight. The review recommended a second means of contact for significant incidents.{R(3)}"),
        ("Partners often heard last.", f"After the 2023 air traffic failure, several airlines and airports first learned of it from media coverage, and the review called for earlier notification.{R(7,8)}"),
        ("A supplier's incident becomes the operator's crisis.", f"Airports that were not themselves attacked fell back to manual check-in when their supplier's system was hit by ransomware.{R(11,12)}"),
        ("One attack can stop a whole supply chain.", f"The Cyber Monitoring Centre called the JLR attack a Category 3 systemic event affecting more than 5,000 UK organisations.{R(16)}"),
        ("Fixing one failure does not prevent the next.", f"NATS says the September 2026 defect was unrelated to 2023. The new CAA review will examine how earlier recommendations were implemented.{R(9,10)}")])

    b.facts("Disruption, in six figures", "Each figure is sourced. Estimates are labelled as such.", [
        ("270,000+", f"Passenger journeys disrupted by the closure of Heathrow on 21 March 2025.{R(3)}"),
        ("10 to 12 hrs", f"NESO's estimate of the time to reconfigure Heathrow's network onto its two remaining supply points.{R(1)}"),
        ("700,000+", f"Passengers affected by the UK NATS flight planning failure of 28 August 2023.{R(7)}"),
        ("3 h 15 min", f"Time before the on-call engineer reached the control centre in 2023, after remote login failed.{R(8)}"),
        ("£1.9bn", f"Cyber Monitoring Centre's central estimate of the UK cost of the JLR attack, within a modelled £1.6bn to £2.1bn.{R(16)}"),
        ("2,000+", f"Flights delayed, cancelled or diverted after the UK NATS software defect of 8 September 2026.{R(10)}")], "At a glance")

    b.timeline("From a bank holiday failure to a second one", "Key dates, mostly UK case studies. Times are as given in the official reviews and company statements.", [
        ("28 Aug 2023", "UK flight planning failure", f"Automatic flight plan processing fails at 08:32 on a bank holiday. Restrictions run until 18:03.{R(8)}"),
        ("14 Nov 2024", "UK CAA review published", f"The independent panel makes 34 recommendations for NATS, airlines, airports, the CAA and government.{R(7)}"),
        ("20 to 21 Mar 2025", "North Hyde fire (UK)", f"The substation loses all supplies late on 20 March. Heathrow closes for most of 21 March.{R(1)}"),
        ("28 May 2025", "Kelly Review (UK)", f"Heathrow publishes its independent review. The decision to close is found to be correct.{R(2)}"),
        ("1 to 2 Jul 2025", "NESO report, Ofgem acts (UK)", f"NESO publishes its final report with 12 recommendations. Ofgem opens an enforcement investigation.{R(1,6)}"),
        ("19 to 22 Sep 2025", "Check-in attack (Europe)", f"Ransomware at a supplier disrupts check-in at Heathrow, Brussels and Berlin.{R(11,12)}"),
        ("28 Sep to 8 Oct 2025", "JLR support and restart (UK)", f"A £1.5bn loan guarantee is announced. JLR begins a phased restart.{R(14,15)}"),
        ("6 Aug 2026", "Manchester signalling (UK)", f"A brief power loss at a rail operating centre halts trains across the North West.{R(20)}"),
        ("8 Sep 2026", "UK air traffic fails again", f"A software defect forces UK-wide restrictions. The CAA sets up a new review.{R(9,10)}")])

    # PART 01
    b.mark("01", "The Heathrow lesson")
    b.opener("01", "The Heathrow<br>lesson.", "A UK case study: what two official reviews found about the fire that closed Europe's busiest airport, and why it matters to operators everywhere.", [("01", "One night in March"), ("02", "Four links that broke"), ("03", "What the reviews found")])
    b.essay("UK case study", "One night in March", [
        f"Late on 20 March 2025, North Hyde, a 275kV substation in west London, lost all supplies after a fire. NESO found the fire was caused by a catastrophic failure of a high voltage bushing on a transformer, most likely because moisture had got in. An elevated moisture reading in oil samples taken in July 2018 had not been followed by actions appropriate to its severity.{R(1)}",
        f"The government's response to NESO adds that the protocols for logging and scheduling routine maintenance had not flagged that essential work was outstanding, and that the fire risk assessment did not include a site-level view of nearby oil-filled equipment.{R(5)} Ofgem opened an enforcement investigation into the transmission owner on 2 July 2025, stressing that this did not mean it had found any breach.{R(6)}",
        f"The fire did not only hit Heathrow. NESO says 66,919 customers supplied directly from the local distribution network were affected, alongside road and rail services, Hillingdon Hospital and homes near the site, some of which were evacuated.{R(1)} Three data centres lost mains power but kept running on generators.{R(1)}",
        f"At Heathrow, the loss of one of three supply points cut power to some operationally critical systems.{R(1)} Reporting on the Kelly Review says the first automated alert to senior leaders went out at 00:21, that the decision to suspend operations was taken at 01:15, and that limited arrivals resumed at 16:00, with full operations on 22 March.{R(3)}",
        f"The review found the decision was correct and that alternative choices would not have materially changed the outcome.{R(2)} It also found that overnight alerts had not reached one senior leader because the phone had switched to silent without their knowledge, and recommended a second means of contact for significant incidents.{R(3)} The lesson applies to every organisation, not one person: an alert is only as good as the device that receives it.",
        "Most transport and logistics businesses do not run an airport, and many do not operate in the UK. But almost all of them depend on a small number of power connections, control rooms and systems, and assume that backup will cover the gap. North Hyde tested that assumption in public."],
        "The Heathrow lesson", "An alert is only as good as the device that receives it.")
    b.figpage("Four links that broke", "Four links in the chain, and what each one teaches", "A UK case study. Each was survivable alone. Together they closed an airport.", "plug", [
        ("The asset", f"A 2018 moisture warning was not acted on as it should have been.{R(1)} A known defect with no owner is a future incident."),
        ("The protection", f"The fire risk assessment had no site-level view.{R(5)} Assess the whole site, not each part alone."),
        ("The design", f"Switching away from one supply point would take 10 to 12 hours.{R(1)} Know what each connection powers."),
        ("The alert", f"A key alert went unheard on a silent phone.{R(3)} Reach key people by more than one route.")], "The Heathrow lesson")
    b.table("What the reviews found", "Five official UK reviews, one set of lessons", "Summaries of published findings and terms of reference. The lessons apply to operators in any country. Read the originals before relying on any one point.", ["Review", "What it found or examines", "Lesson for operators"], [
        ("NESO final report, July 2025", f"Root cause, maintenance, fire risk and Heathrow's supply design. 12 recommendations, including on the energy resilience of critical national infrastructure.{R(1)}", "Map what each power connection feeds and how long a switch-over takes."),
        ("Kelly Review, May 2025", f"Right decision to close; backup power would have run out; vulnerability not widely known outside the technical team.{R(2,4)}", "Test backup for duration and share risk knowledge beyond engineers."),
        ("DESNZ response, Nov 2025", f"No cross-sector requirement on CNI operators to ensure continuity during power disruption. Action plan for all 12 NESO recommendations.{R(5)}", "Do not wait for a duty. Plan for a long power loss now."),
        ("CAA review of NATS, Nov 2024", f"34 recommendations, including earlier notification to airlines and airports and standard passenger information.{R(7)}", "Agree how partners and passengers will hear, and how fast."),
        ("CAA review of NATS, from Sep 2026", f"Causes, consumer impact, system renewal, how past recommendations were implemented and CAA oversight. Final report due by 8 March 2027.{R(10)}", "Check that last year's actions are actually closed.")], "The Heathrow lesson", "40mm 1fr 52mm")

    # PART 02
    b.mark("02", "The pattern")
    b.opener("02", "The<br>pattern.", "Heathrow was not a one-off. Air traffic, airport check-in, rail signalling and a car maker's supply chain show the same shape of failure.", [("01", "When the system is someone else's"), ("02", "One attack, a whole supply chain"), ("03", "What good looks like")])
    b.essay("The pattern", "When the failure is in someone else's system", [
        f"On the August 2023 bank holiday in the UK, the national automatic flight plan processing failed at 08:32 after receiving a plan with duplicate waypoint names. Restrictions ran until 18:03, with knock-on disruption for days.{R(8)}",
        f"The independent review found that the on-call engineer's login could not readily be verified remotely, so the engineer travelled in and arrived 3 hours 15 minutes after the failure began. The manufacturer was not contacted for more than four hours, then found a fix within 30 minutes.{R(8)} More than 700,000 passengers were affected, and the panel made 34 recommendations.{R(7)}",
        f"On 8 September 2026 a different defect stopped the same national system. NATS says a paused request to allocate an aircraft code did not resume correctly and corrupted later flight data, within a millisecond. Restrictions had to be applied across the UK so the system could be restarted.{R(9)} More than 2,000 flights were delayed, cancelled or diverted, and the CAA has opened a wider review.{R(10)}",
        f"Airports met a similar problem a year earlier from a supplier. From the evening of 19 September 2025, a cyber attack on the passenger processing software provided by Collins Aerospace hit check-in and bag drop at Heathrow, Brussels and Berlin. Staff used handwritten boarding passes, and Brussels asked airlines to cancel about half of one day's departures.{R(11)} ENISA confirmed it was ransomware, and the NCA arrested a man in West Sussex on 23 September.{R(12,13)}",
        f"Rail has seen the same pattern with power. In England, on 6 August 2026 a power loss of about 90 seconds at the Manchester Rail Operating Centre took down signalling when backup did not start in time, halting trains across the North West into a second day.{R(20)} On 30 December 2025 a power problem in the Channel Tunnel suspended Eurostar services between London, Paris, Brussels and Amsterdam.{R(19)}",
        "In each case the operator facing passengers was not the one whose system failed. That is the pattern: transport depends on shared systems, and the first hour depends on how fast the people who rely on them are told."],
        "The pattern", "The operator facing passengers was rarely the one whose system failed.")
    b.essay("Supply chains", "One attack, a whole supply chain", [
        f"Jaguar Land Rover shut down production in early September 2025 after a cyber incident. It began a phased restart on 8 October, starting with engine and battery assembly in the West Midlands, then stamping and vehicle lines in Solihull and Nitra.{R(14)} Production returned to normal levels only by mid-November, and vehicles then took extra time to reach markets.{R(17)}",
        f"The effects ran well beyond JLR. On 28 September the government announced a loan guarantee backing up to £1.5bn of lending, provided through a commercial bank and backed by UK Export Finance, to help JLR support its suppliers.{R(15)} JLR introduced financing to pay qualifying suppliers early, speeding payment by up to 120 days, starting with those critical to the restart.{R(14)}",
        f"The Cyber Monitoring Centre estimated the UK cost at £1.9bn, within a modelled range of £1.6bn to £2.1bn, and said more than 5,000 UK organisations were affected. It described how disruption spread from suppliers to transport and retail, with a little over half of the modelled cost falling on JLR and the rest on its supply chain.{R(16)}",
        f"JLR's own accounts show the direct cost. It recorded £196m of cyber incident costs in the quarter to September 2025 and a further £64m in the quarter to December.{R(18,17)}",
        "For logistics firms, the lesson is two-sided. A customer's shutdown stops your work and your cash flow without warning. Your own outage can do the same to every haulier, warehouse and supplier that depends on you. Both need a plan: who you call, what you can keep doing, and how long your partners can survive a stop."],
        "Supply chains", "A customer's shutdown stops your work and your cash flow without warning.")
    b.compare("What good looks like", "Where the gaps were, and what good looks like", "Drawn from the published reviews. The gaps are common across the sector, not unique to the organisations named.", ["Area", "What the reviews found", "What good looks like"], [
        ("Single points of failure", f"One supply point fed critical systems. Switching would take 10 to 12 hours.{R(1)}", "Each critical system mapped to its power, IT and supplier dependencies, with a tested fallback."),
        ("Backup", f"Emergency power would have run out before mains returned.{R(4)}", "Backup tested for how long it lasts, not just whether it starts."),
        ("Alerting key people", f"An overnight alert went unheard on a silent phone.{R(3)}", "Two independent routes to every key decision maker, with escalation on no response."),
        ("On-call response", f"Remote login failed; the engineer arrived after 3 hours 15 minutes.{R(8)}", "On-call access tested regularly, with supplier escalation in the first hour."),
        ("Partners", f"Some airlines and airports learned of the 2023 failure from the media.{R(8)}", "Partners told directly within minutes, by an agreed route, with update times."),
        ("Suppliers", f"A supplier attack stopped check-in at several airports.{R(11)}", "Manual fallbacks rehearsed, and supplier incident terms agreed in advance.")], "The pattern")

    # PART 03
    b.mark("03", "What to do now")
    b.opener("03", "What to<br>do now.", "What the evidence means for transport and logistics organisations, the rules that apply by region and the steps that close the gap.", [("01", "What it means for the sector"), ("02", "Rules by region"), ("03", "Recommendations"), ("04", "Questions for the board")])
    b.essay("What it means", "What it means for organisations in Transport and Logistics", [
        f"The first lesson is about time. Most transport regimes now expect a regulator or national authority to hear about a significant cyber or network incident within one to three days. <b>United Kingdom:</b> operators of essential transport services must notify their regulator no later than 72 hours after becoming aware of a significant incident, and the Cyber Security and Resilience Bill proposes an initial notice within 24 hours.{R(22,23)} The regional notes that follow set out comparable rules in the US, the EU and the Middle East.",
        f"The second is about power. Few legal frameworks give transport operators priority when the grid fails. <b>United Kingdom:</b> NESO found that critical national infrastructure has no priority within the electricity legal or regulatory framework, and the government accepted there is no cross-sector requirement on CNI operators to ensure continuity during power disruption.{R(1,5)} Operators everywhere should plan on the basis that a long power loss is theirs to manage.",
        f"The third is weather, which adds to the load in every season and every region. When Storm Éowyn brought a red wind warning to central Scotland on 24 January 2025, officials warned of lengthy delays, bridge closures and cancelled rail, ferry and air services, and police advised people to avoid travel in the warning area.{R(21)} Decide in advance which warnings stop which services.",
        f"People remain the first priority, especially drivers and others who work alone. <b>United Kingdom:</b> HSE says employers must monitor lone workers and keep in touch with them, test emergency procedures regularly and use devices for raising the alarm where needed.{R(24)} Transport and storage recorded 15 worker deaths in 2025/26 in HSE's provisional figures for Great Britain, which do not include deaths in road traffic accidents.{R(25)}",
        "The practical test is the same in any country. Could you name every single point of failure in your operation, say how long each backup lasts, reach every key person and partner within ten minutes at night, and show a regulator a timed record of what you did? If not, that is the first job."],
        "What it means", "Plan on the basis that a long power loss is yours to manage.")
    b.regions("Rules by region", "The rules that shape the response", "Examples to check, not a full list. Each card says who it applies to and its status.", [
        ("United Kingdom", f"NIS Regulations 2018: operators of essential transport services notify within 72 hours.{R(22)} The Cyber Security and Resilience Bill proposes a 24-hour initial notice; it is a proposal, not yet law.{R(23)} There is no general priority for CNI in power restoration.{R(1)}", "Plan for the shorter clock, and for a long power loss."),
        ("United States", f"TSA security directives 1580-21-01E and 1582-21-01E, effective 16 January 2026 to 15 January 2027, apply to designated freight rail, passenger rail and rail transit operators: report cyber incidents to CISA within 72 hours, keep a 24/7 cybersecurity coordinator and exercise an incident response plan at least annually.{R(28)}", "Directives are renewed and revised; check the current version."),
        ("European Union", f"NIS2 covers air, rail, water and road transport: early warning within 24 hours, notification within 72 hours, final report within one month.{R(27)} The CER Directive adds resilience duties for designated critical entities, identified by 17 July 2026, with incident notice within 24 hours.{R(26)}", "Check your national transposition and whether you are designated."),
        ("Middle East", f"<b>UAE:</b> NCEMA 7000:2021 states it applies to all UAE entities and requires a response structure covering command, immediate response and communication during disruptions.{R(29)} <b>Saudi Arabia:</b> NCA ECC-2:2024 requires incident response plans and reporting to the NCA for government and CNI entities.{R(30)}", "Map plans to both, and keep exercise records.")], "What to do now")
    b.steps("Recommendations", "Seven steps for transport and logistics leaders", "In priority order. The first four can start straight away, in any country.", [
        ("Map single points of failure", f"Power, control rooms, systems and suppliers, and what each one feeds.{R(1)}"),
        ("Test backup for duration", f"Run fallbacks for as long as a real outage might last.{R(4)}"),
        ("Give every key person two routes", f"App, call and SMS, with escalation on no response.{R(3)}"),
        ("Tell partners first", f"Agree routes and timings with suppliers and partners.{R(7,8)}"),
        ("Rehearse supplier failure", f"Run manual procedures for a shift; agree incident terms.{R(11,14)}"),
        ("Protect lone workers and drivers", f"Scheduled check-ins, with an escalation for every missed one.{R(24)}"),
        ("Know your reporting duties", f"First-notice clocks run from 24 to 72 hours, by regime. See the regional notes.{R(22,27,28)}")], "What to do now")
    b.questions("For the board", "Questions boards should ask", "Answers should be specific, dated and owned.", [
        ("Exposure", ["Which single power connection, system or supplier could stop our whole operation, and for how long?", "How long does each backup actually last, and when did we last test it for that long?", "Which partners would we stop if we went down, and how fast would they hear?"]),
        ("Response", ["Could we reach every key decision maker within ten minutes at 1am tonight?", "Are the actions from our last incident review closed, and who checked?", "Could we show a regulator a timed record of every alert and decision?"])], "What to do now")
    b.glossary("Terms used in this report", [
        ("NESO", "The UK's National Energy System Operator, which reviewed the North Hyde outage for government."),
        ("NATS", "The UK's main air navigation service provider, which runs en route air traffic control."),
        ("CAA", "The Civil Aviation Authority, the UK aviation regulator."),
        ("Supply point", "A connection to the electricity network. Heathrow has three."),
        ("Bushing", "An insulated part that carries a high voltage conductor through a transformer casing."),
        ("CNI", "Critical national infrastructure: assets whose loss would have a major impact on essential services."),
        ("Flight plan processing", "The system that checks flight plans and passes them to air traffic controllers."),
        ("Ransomware", "Malware that locks or steals data and demands payment."),
        ("Category 3 event", "The Cyber Monitoring Centre's rating for a systemic event, on its five-point scale."),
        ("NIS Regulations (UK)", "The Network and Information Systems Regulations 2018, covering essential services including transport."),
        ("NIS2 (EU)", "Directive (EU) 2022/2555 on cybersecurity, covering air, rail, water and road transport entities."),
        ("CER Directive (EU)", "Directive (EU) 2022/2557 on the resilience of critical entities, including in transport."),
        ("Lone worker", "Anyone who works without close or direct supervision."),
        ("Second means of contact", "A separate route to reach a key person if the first alert is missed.")])

    b.mark("", "Sources")
    src = [
        "NESO, Final report from the review into the North Hyde Substation outage, 1 July 2025, https://www.neso.energy/news/final-report-review-north-hyde-substation-outage",
        "Heathrow, Kelly Review published, 28 May 2025, https://mediacentre.heathrow.com/pressrelease/detail/22887",
        "The National (PA), Heathrow chief's phone on silent mode as fire caused airport to close, inquiry finds, 29 May 2025, https://www.thenationalnews.com/business/aviation/2025/05/29/heathrow-chiefs-phone-on-silent-mode-as-fire-caused-airport-to-close-inquiry-finds/",
        "The Business Continuity Institute, The Kelly Review: lessons from Heathrow's power outage, 29 May 2025, https://www.thebci.org/news/the-kelly-review-lessons-from-heathrow-s-power-outage.html",
        "DESNZ, NESO's North Hyde report: government response, 18 November 2025, https://www.gov.uk/government/publications/nesos-north-hyde-report-government-response/nesos-north-hyde-report-government-response-accessible-webpage",
        "Ofgem, Ofgem opens investigation into NGET over North Hyde substation fire, 2 July 2025, https://www.ofgem.gov.uk/press-release/ofgem-opens-investigation-national-grid-electricity-transmission-nget-north-hyde-substation-fire",
        "Civil Aviation Authority, Independent Review into August 2023 NATS Flight Planning System Failure, 14 November 2024, https://www.caa.co.uk/newsroom/news/aviation-regulator-publishes-independent-review-into-august-2023-nats-flight-planning-system-failure/",
        "The Irish News (PA), Engineer's password problem contributed to air traffic control failure, report finds, 14 November 2024, https://us.irishnews.com/news/uk/engineers-password-problem-contributed-to-air-traffic-control-failure-report-JLYW4ZCCWROLDIZBCYMCGFWEEM",
        "NATS, NATS publishes preliminary report on technical incident of 8 September, 18 September 2026, https://www.nats.aero/news/nats-publishes-preliminary-report-on-technical-incident-of-8-september/",
        "Civil Aviation Authority, Scope of independent review into NATS technical incident on 8 September 2026, 25 September 2026, https://www.caa.co.uk/newsroom/news/uk-aviation-regulator-announces-scope-of-independent-review-into-nats-technical-incident-on-8-september-2026/",
        "NBC News (Associated Press), Airport cyberattack disrupts more flights across Europe, 21 September 2025, https://www.nbcnews.com/world/europe/airport-cyberattack-disrupts-flights-europe-rcna232743",
        "BankInfoSecurity, Ransomware behind Collins Aerospace hack, ENISA says, 22 September 2025, https://www.bankinfosecurity.com/ransomware-behind-collins-aerospace-hack-enisa-says-a-29498",
        "Global News (Associated Press), Man arrested in UK over cyberattack that disrupted European airports, 24 September 2025, https://globalnews.ca/news/11448123/man-arrested-cyberattack-european-airports",
        "JLR, JLR restarts manufacturing and introduces new financing solution to pay JLR suppliers early, 7 October 2025, https://media.jlr.com/corporate/news/2025/10/jlr-restarts-manufacturing-and-introduces-new-financing-solution-pay-jlr-suppliers",
        "GOV.UK, Government backs Jaguar Land Rover with £1.5 billion loan guarantee, 28 September 2025, https://www.gov.uk/government/news/government-backs-jaguar-land-rover-with-15-billion-loan-guarantee",
        "The Register, JLR attack cost estimate from the Cyber Monitoring Centre, 22 October 2025, https://www.theregister.com/2025/10/22/jaguar_lander_rover_cost/",
        "JLR, JLR Q3 performance impacted by previously indicated challenges, 5 February 2026, https://media.jlr.com/corporate/news/2026/02/jlr-q3-performance-impacted-previously-indicated-challenges",
        "Teiss, Cyberattack drains £196m from JLR's quarterly results (Q2 FY26 results), November 2025, https://www.teiss.co.uk/news/cyberattack-drains-196m-from-jlrs-quarterly-results-16731",
        "France 24 (AFP), Eurostar Channel Tunnel traffic resumes after power failure, 30 December 2025, https://www.france24.com/en/live-news/20251230-eurostar-suspends-all-europe-trains-due-to-power-problem",
        "UPI, Thousands of rail travellers in England face a second day of disruption, 7 August 2026, https://www.upi.com/Top_News/World-News/2026/08/07/England-major-rail-disruption/7291786098085/",
        "Transport Scotland, Storm Éowyn: red wind warning, 23 January 2025, https://www.transport.gov.scot/news/storm-eowyn-red-wind-warning",
        "The Network and Information Systems Regulations 2018, regulation 11, https://www.legislation.gov.uk/uksi/2018/506/regulation/11",
        "DSIT, Cyber Security and Resilience Bill factsheet: incident reporting, updated 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/incident-reporting",
        "HSE, Lone working: training, supervision and monitoring, accessed November 2026, https://www.hse.gov.uk/lone-working/employer/training-supervision-monitoring.htm",
        "HSE, Work-related fatal injuries in Great Britain 2025/26 (provisional), updated 30 June 2026, https://www.hse.gov.uk/statistics/fatals-overview.htm",
        "EU, Directive (EU) 2022/2557 on the resilience of critical entities (CER Directive), https://eur-lex.europa.eu/eli/dir/2022/2557/oj",
        "EU, Directive (EU) 2022/2555 (NIS2 Directive), https://eur-lex.europa.eu/eli/dir/2022/2555/oj",
        "TSA (US), Security Directives 1580-21-01E and 1582-21-01E, January 2026, https://www.tsa.gov/sd-and-ea",
        "NCEMA (UAE), AE/SCNS/NCEMA 7000:2021 National Standard for Business Continuity Management, https://www.ncema.gov.ae",
        "NCA (Saudi Arabia), Essential Cybersecurity Controls ECC-2:2024, https://nca.gov.sa/en/regulatory-documents/controls-list/ecc/",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    items = [(f"{n:02d}", t) for n, t in items]
    b.sources(items[:14], "Where reports differ, we say so in the text. Early reporting on live incidents can change. Regulatory summaries are for orientation, not legal advice.")
    b.sources(items[14:], "Sources continued. Press reports are used where the full review text was not published or could not be accessed.")
    b.rep_back("Keep every site,<br>partner and driver<br>in the loop.", "Crises Control is an Operational Incident Coordination Platform. It helps transport and logistics operators alert every key person by more than one route, see who has acknowledged, coordinate partners from one place and keep a timed record for the regulator and the review.", "Request a demo",
        companion="Crisis playbook No. 04 · Keep it moving")
    return b
