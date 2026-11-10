from cckit import CCBook, S


def build():
    b = CCBook("Within Tolerance", 1, "relay", "Financial Services and Insurance", "9 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A crisis playbook for banks, insurers, payment and investment firms in the UK, US, Europe and the Middle East." + '<style>div[style*="padding:8mm 0;border-bottom"]{padding:6.2mm 0!important}</style>'
    b.art_cover("Operational resilience", "Within", "tolerance.",
        "A crisis playbook for banks, insurers, payment and investment firms. What to do in the first hour of a severe disruption, how to communicate when email and chat are down, and how to prove your critical services stay within tolerance.")
    b.contents()

    # ------------------------------------------------------------------ front matter
    b.mark("", "Foreword")
    b.foreword("Resilience on paper met a real morning on 20 October 2026.", [
        f"At 06:53 BST on Tuesday 20 October 2026, the utility feed to a data centre hosting europe-west2-b, one of Google Cloud's London zones, failed. A second feed was switched out for repairs, and a control system fault stopped the backup generators from starting. When the batteries ran out at 07:00, servers in the zone lost power. Google's incident report puts the main impact across the London region at six hours and eight minutes.{R('gcp')}",
        f"Customers of Lloyds, HSBC and Revolut reported problems with apps, payments and cash withdrawals that morning.{R('reuters', 'yahoo')} The UK's Financial Conduct Authority said it was engaging with Google, and the European Banking Authority sought information.{R('reuters')} One zone in one city became a question for supervisors in two jurisdictions.",
        f"Regulators everywhere now ask the same question in different words. The UK calls it an impact tolerance and has expected firms to stay within one since 31 March 2025.{R('ps213')} The EU's DORA has applied since 17 January 2025,{R('dora')} US banking agencies speak of a tolerance for disruption,{R('sound')} and the UAE Central Bank's operational risk regulation took effect on 14 September 2026.{R('cbuae')} This playbook is about the practical side: the first hour, the messages, the suppliers and the evidence."],
        sign="The Crises Control team")

    b.mark("", "Executive summary")
    b.execsum("Know the limit, act inside it, and prove it afterwards.",
        ["Critical services depend on cloud, payment and data suppliers you do not control, often concentrated in one region.",
         "Regulators in the UK, US, EU and Middle East want evidence that critical services survive severe disruption, not just a plan.",
         "The tools used to coordinate a response often share the dependency that has failed: email, chat and single sign-on."],
        ["A cloud region or data centre outage that takes apps, cards and internal tools down together.",
         "A card processor or payment scheme failure on payday, month end or a peak trading day.",
         "Ransomware at the firm or at a critical supplier, such as a claims or core banking platform.",
         "A storm or flood that brings a surge of insurance claims while staff and suppliers are disrupted."],
        ["Set a tolerance, or your regulator's equivalent, for every critical service and map what it depends on.",
         "Tie escalation to time left against tolerance, not to how the room feels.",
         "Agree decision rights in advance, with a named deputy for every accountable role.",
         "Reach the response team without corporate email or chat, and test that you can.",
         "Know every reporting clock that applies to you, in every jurisdiction where you operate."],
        ["The team is reached and acknowledges within minutes, on channels that do not share the failure.",
         "One log of decisions, messages and tasks, shared by technology, operations, communications and compliance.",
         "Customers hear something useful within 30 minutes, and supervisors hear early, on the right clock.",
         "Every decision and timing can be shown to a board and a supervisor afterwards."],
        support=["Crises Control reaches the response team by push, SMS, voice and email, tracks who has acknowledged, and escalates on no response under the rules you configure.",
                 "Response plans for each critical service run as owned tasks in one incident workspace, and Audit & Reporting keeps a timestamped record for your board and supervisors."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three questions decide how your worst day goes.", "Most organisations can send alerts. Few can manage incidents end-to-end. Financial regulators do not expect firms to prevent every disruption. They expect firms to know which services matter most, how much disruption customers and markets can bear, and how they will stay inside that limit when something fails.",
        [("compass", "Do we know what matters?", "Critical services named, tolerances set and approved by the board, and every service mapped to the people, systems and suppliers it relies on."),
         ("bell", "Can we act in minutes?", "A severity ladder everyone uses, a first-hour plan with named owners, and a way to reach the response team that does not depend on the systems that have failed."),
         ("check", "Can we prove it?", "Severe but plausible scenarios tested, communications included, and the timings, decisions and lessons recorded so the evidence stands up to challenge.")])
    b.statement("Sending the alert is the easy part. Running the incident is the job.", "Resilience is measured on the customer's clock, not the supplier's. A cloud provider restores its service on its own timetable; your tolerance keeps running from the moment customers cannot pay, be paid or claim.", "Introduction")

    # ------------------------------------------------------------------ PART 01
    b.mark("01", "Know your limits")
    b.opener("01", "Know your<br>limits.", "Before a crisis, decide which services matter most and how much disruption is too much, wherever you are regulated.", [("01", "Impact tolerance and its equivalents"), ("02", "What regulators expect, region by region"), ("03", "Services, a dependency map and concentration")])
    b.essay("Know your limits", "Impact tolerance, in plain terms and in other words", [
        f"<b>Impact tolerance</b> is a UK term. The FCA's PS21/3 and the PRA's SS1/21 ask a firm to look at itself from the outside in. An important business service is one that, if disrupted, could cause intolerable harm to customers or risk to market integrity, or for the PRA threaten the firm's safety and soundness or financial stability.{R('ps213', 'ss121')}",
        f"For each one, the firm sets an impact tolerance: the maximum tolerable level of disruption. The PRA requires every tolerance to include a time metric, says it applies at peak times as well as normal ones, and expects firms to stay within it in severe but plausible scenarios, whether or not a third party delivers part of the service.{R('ss121')}",
        f"Other regulators use other words for a similar idea. US banking agencies' 2020 sound practices ask large banks' boards to set a <b>tolerance for disruption</b> for critical operations and core business lines, informed by severe but plausible scenarios.{R('sound')} The UAE Central Bank asks boards to approve <b>disruption tolerances</b> for critical operations.{R('cbuae')} DORA in the EU frames resilience around ICT risk and critical or important functions.{R('dora')}",
        f"The UK FCA reviewed annual self-assessments in March 2026. It saw clearer methods and some non-time metrics such as transaction volumes, but also mapping that focused mainly on technology.{R('fca1y')}",
        "Whatever your regulator calls it, a tolerance is not a recovery time objective. It is the point at which harm becomes intolerable, so recovery targets usually sit well inside it. If your recovery plan only just fits within the tolerance, the plan is the risk.",
        "The practical test is simple. Pick any critical service and ask three people to name its tolerance, its top three dependencies and who declares an incident. If the answers differ, start there."],
        "Know your limits", "Whatever your regulator calls it, a tolerance is the point at which harm becomes intolerable.")
    b.regions("Regional notes", "One idea, four rulebooks", "What operational resilience means for financial firms in each region. Check which regimes apply to each legal entity in your group.", [
        ("United Kingdom", f"FCA PS21/3 and PRA SS1/21 apply to banks, building societies, insurers, payment and e-money firms and other in-scope firms: important business services, impact tolerances with a time metric, mapping, severe but plausible testing and a board-approved self-assessment. Firms had to be able to stay within tolerance by 31 March 2025.{R('ps213', 'ss121')}",
         "The tolerance is the trigger for your top escalation level, and the self-assessment is where test evidence lands."),
        ("United States", f"No single impact tolerance rule. The 2020 interagency Sound Practices (Federal Reserve, OCC, FDIC) are directed at the largest banks and do not change existing rules.{R('sound')} The FFIEC Business Continuity Management booklet (2019) is examiner guidance for institutions and their service providers.{R('ffiec')} NYDFS Part 500 requires covered entities to keep incident response and business continuity and disaster recovery plans, tested at least annually.{R('nydfs')}",
         "Set a tolerance for disruption per critical operation even where it is guidance, not law: examiners will ask how you know."),
        ("European Union", f"DORA, Regulation (EU) 2022/2554, applies from 17 January 2025 to EU financial entities, including UK and US groups' EU subsidiaries. It requires an ICT risk management framework, ICT business continuity and response plans, resilience testing, crisis communication plans and major ICT-related incident reporting.{R('dora')}",
         "Map your critical services to DORA's critical or important functions, so one dependency map serves both."),
        ("Middle East", f"<b>UAE:</b> the Central Bank's Operational Risk Management Regulation (Circular 1/2026) took effect on 14 September 2026 for licensed financial institutions: critical operations, mapping, board-approved disruption tolerances and plans to continue or restore them.{R('cbuae')} <b>Saudi Arabia:</b> SAMA's Business Continuity Management Framework (2017) applies to banks and other member organisations, with impact analysis, recovery objectives and annual testing.{R('sama')} <b>DIFC:</b> the DFSA consulted in 2026 on impact tolerances (CP 170); proposed, not yet in force.{R('dfsa')}",
         "Firms in financial free zones follow their own regulator's rulebook; confirm which applies.")], "Know your limits")
    b.table("Illustrative services", "What a critical service looks like", "Examples only. Each firm must identify its own services and justify its own tolerances.", ["Firm type", "Example service", "Tolerance metrics to consider", "Hidden dependency"], [
        ("Retail bank", "Making a payment from a current account", "Hours of disruption at peak, number of customers and value of payments affected", "Card processor, cloud region, fraud engine"),
        ("Insurer", "Making and paying a motor or home claim", "Days to first contact and payment, with extra weight in a storm or flood", "Claims platform supplier, contact centre telephony"),
        ("Payments and e-money", "Card authorisation and access to funds", "Minutes of failed authorisations, share of transactions declined", "Scheme connection, issuer processor, single hosting zone"),
        ("Investment firm", "Placing and settling client orders", "Orders missed or delayed in market hours, settlement fails", "Order management SaaS, market data, custodian links"),
        ("Mortgage lender", "Mortgage completion on the agreed day", "Completions missed, with tolerance tightest at month end", "Payment scheme access, conveyancer portal")], "Know your limits", "32mm 1fr 1fr 1fr")
    b.depmap("Dependency map", "One service, mapped before you need it", "An illustrative map for retail card payments: the people, technology, suppliers, sites, information and processes the service relies on, and the limits that apply.",
        ("Retail card payments", "Customers pay in shops and online by debit card, and see the payment in their account."), [
        ("People", "Payments operations, fraud team, contact centre, technology on call, executive on call and their deputies."),
        ("Technology", "Card authorisation platform, core ledger, fraud engine, mobile app and the identity service staff sign in with."),
        ("Third parties", "Card scheme connection, issuer processor, cloud provider and the region and zones used, telephony supplier."),
        ("Facilities", "Operations centre, contact centre sites, data centres and the cloud zones each component runs in."),
        ("Information", "Card and account data, fraud rules, customer contact details, payment and authorisation logs."),
        ("Processes", "Authorisation, fallback processing, disputes and refunds, customer messages and supervisor contact.")],
        [("Recovery target · illustrative", "2 hours"), ("Volume metric · illustrative", "5% declined at peak"), ("Customer metric · illustrative", "Urgent cases helped same day"), ("Impact tolerance · illustrative", "4 hours at peak")], "Know your limits",
        note=f"All values are illustrative. Impact tolerance is the UK term; read it as your tolerance for disruption, disruption tolerance or maximum acceptable outage where those apply.{R('sound', 'cbuae', 'sama')} Each firm sets and justifies its own, approved by its board. Recovery targets sit well inside the tolerance.")
    b.figpage("Concentration", "Four places concentration hides", f"<b>United Kingdom:</b> four cloud providers were designated critical third parties in July 2026, and regulated firms remain responsible for their own third-party arrangements.{R('hmt', 'boe')} The same blind spots exist in every market.", "hub", [
        ("One region, one zone", "Services described as resilient may still run in a single zone, or rely on regional control systems that a zone failure can disrupt."),
        ("Shared tooling", "Email, chat, identity and incident tooling often sit with the same provider as production. One outage removes both the service and the means to coordinate."),
        ("Your suppliers' suppliers", "A claims platform or core banking SaaS may run in the same cloud region you chose to avoid."),
        ("Payments chains and people", "Processors, scheme connections and fraud engines need tested alternatives. So do key teams working from a single site."),
        ], "Know your limits")

    # ------------------------------------------------------------------ PART 02
    b.mark("02", "Incident scenarios")
    b.opener("02", "Incident<br>scenarios.", "What happens in the first sixty minutes decides whether you stay within tolerance.", [("01", "Severity, and a first hour on the clock"), ("02", "The same morning, lane by lane"), ("03", "Three severe days and the work that follows")])
    b.severity("Severity", "A severity ladder for financial services", "Agree the triggers in advance so nobody debates the level while customers wait. If in doubt, declare higher and step down.", [
        (1, "Critical", "A critical service is down or badly degraded and its tolerance is at risk. Customers cannot pay, be paid, reach cash or make a claim. Data integrity in doubt, or a suspected cyber attack on core systems.", "Crisis team, executive on call, regulatory lead and communications lead. Board chair informed.", "Push, SMS, voice call · escalate after 5 minutes"),
        (2, "Major", "A critical service is degraded but a tested workaround is holding. One channel is down, such as the app but not cards. A material supplier declares an incident.", "Incident team, service owners, supplier manager. Communications lead on standby.", "Push and SMS · bridge opened"),
        (3, "Moderate", "Internal system failure with little or no customer impact. Failover worked as designed. Elevated error rates under investigation.", "Technology on call and the service owner.", "Push and email"),
        (4, "Watch", "Supplier advisory, risky change window, severe weather warning or a peak day such as payday or month end ahead.", "Duty manager logs it and briefs the next shift.", "Email and incident log")], "Incident scenarios")
    b.firsthour("First hour", "Cloud outage at 07:00", "A bank or payment firm whose app and cards depend on one cloud region. Owners are roles.", [
        ("T+00:00", "Alarms and complaints arrive together", "Monitoring shows failed card authorisations and app logins as the contact centre and social channels light up.", "Duty incident manager", 1),
        ("T+00:05", "Declare and page out of band", "Declare SEV1 provisionally. Page the team by SMS and voice, not email or chat, which may share the failed dependency.", "Duty incident manager", 1),
        ("T+00:10", "Convene, start the clock", "Assign leads and a scribe. Record which critical services are hit, and when harm began.", "Incident lead", 1),
        ("T+00:15", "Call the provider, do not wait for it", f"Raise a priority case. On 20 October the first public update came about two and a half hours after impact began.{R('gcp')}", "Supplier lead", 2),
        ("T+00:30", "First word to customers", "Holding message on the website, app and social channels. Contact centre script live. Flag customers who need urgent help.", "Communications lead", 2),
        ("T+00:45", "Decide on failover", "Invoke the tested move to another zone or region, or manual workarounds. Protect data integrity above speed.", "Technology lead", 1),
        ("T+01:00", "Tell the supervisor", "Early call to your lead supervisor. Start every formal reporting clock that applies: some run from detection, some from classification, some are as short as four hours.", "Regulatory lead", 2)], "Incident scenarios")
    b.swimlane("Swimlane", "The same morning, lane by lane", "Who acts, who decides, where it goes wrong and how progress is watched, from the first failed payment to the second hour.",
        ["Executive and senior manager", "Incident lead", "Technology and suppliers", "Comms and customers", "Compliance and regulators"],
        ["07:00", "07:05", "07:15", "07:30", "08:00", "09:00"], [
        (2, 0, "Card and app failures spike", "act"), (3, 0, "Contact centre calls surge", "mon"), (1, 0, "First page sent by chat, which is down", "risk"),
        (1, 1, "Declares SEV1, starts tolerance clock", "dec"), (1, 1, "Acknowledgements tracked; silence goes to deputies", "mon"), (0, 1, "Executive on call acknowledges by SMS", "act"),
        (2, 2, "Priority case raised with provider", "act"), (2, 2, "Team waits for the provider status page", "risk"), (4, 2, "Logs services hit and start times", "act"),
        (3, 3, "Holding message on web, social, phone line", "act"), (3, 3, "App banner used while the app is down", "risk"), (0, 3, "Briefed from the live task board", "mon"),
        (1, 4, "Approves failover to second region", "dec"), (2, 4, "Failover tasks timed against recovery target", "mon"), (0, 4, "Tolerance at risk: takes the escalation", "dec"), (4, 4, "Early call to lead supervisor", "act"),
        (0, 5, "Executive sets the redress approach", "dec"), (2, 5, "Rerouted payments trip fraud rules", "risk"), (3, 5, "Hourly update, even with no news", "mon"), (4, 5, "Reporting clocks logged and due", "mon")], "Incident scenarios",
        note="Illustrative. Each red box is a common failure point: coordination over a channel that shares the outage, waiting on a supplier, the wrong customer channel and an untested route. Plan the alternative before the day.")
    b.usecase("Scenarios", "Three severe days to rehearse", [
        ("server", "Retail bank", "A cloud zone fails at 07:00 on payday", [("The disruption", "App, card payments and online transfers degrade across the region, not just the failed zone."), ("Where it goes wrong", "Corporate email and chat run in the same region, so the first page never arrives."), ("Who decides", "The incident lead declares and approves failover. The executive on call owns escalation as tolerance nears."), ("Monitor and test", "One live board of acknowledgements, tasks and time left. Rehearse failover to another region without email and chat.")]),
        ("transfer", "Payments and e-money firm", "Card processor outage on Black Friday", [("The disruption", "Authorisations fail for 40 minutes at peak, leaving customers stuck at tills."), ("Where it goes wrong", "Traffic moves to the standby route and fraud rules block legitimate payments."), ("Who decides", "The incident lead switches route and starts the reporting clock. The head of fraud owns rule changes."), ("Monitor and test", "Success rate by route every five minutes. Prove the standby route carries peak volume, not a test transaction.")]),
        ("shield", "General insurer", "Claims supplier hit by ransomware during a storm", [("The disruption", "The claims platform is offline as storm claims peak. Brokers and the supervisor need telling early."), ("Where it goes wrong", "Claims taken by hand go missing, and vulnerable customers wait in the same queue."), ("Who decides", "The claims director invokes manual intake. Compliance leads on any data breach, which brings separate duties."), ("Monitor and test", "Manual claims logged centrally and reconciled daily. Rehearse a week of claims by hand and count what breaks.")])], "Incident scenarios")
    b.tracker("Outstanding actions", "Services back. The work is not finished.", "An illustrative board at 13:30, after recovery. Every open action has one owner, a time and a way to check it is really done.", [
        ("Customer update: services restored", "Communications lead", "13:30", "Done", "Published on web, app, social and phone line"),
        ("Confirm card authorisations are back to normal", "Technology lead", "14:00", "In progress", "Success rate against the normal baseline"),
        ("Update supervisors: recovery confirmed", "Regulatory lead", "14:30", "In progress", "Entry and reference in the notification log"),
        ("Call customers flagged as needing urgent help", "Contact centre lead", "13:00", "Overdue", "Call list ticked off; anyone unreached escalated"),
        ("Brief board chair and executive committee", "Executive on call", "16:00", "Open", "Briefing note filed with the incident record"),
        ("Preserve logs and timeline for the report", "Incident lead", "17:00", "In progress", "Timeline checked against the decision log"),
        ("Reconcile failed and duplicate payments", "Payments operations", "18:00", "Open", "Sample of reconciled accounts signed off"),
        ("Refund fees and charges caused by the outage", "Remediation lead", "Day 2", "Open", "Redress log reviewed by compliance"),
        ("Root cause and fix in writing from the provider", "Supplier lead", "Day 3", "Blocked", "Awaiting provider report; chased daily")], "Incident scenarios",
        note="Review the board at a fixed time, such as every two hours, until every row is done or handed to the post-incident review. An overdue row escalates to the executive on call.")

    # ------------------------------------------------------------------ PART 03
    b.mark("03", "Respond and prove it")
    b.opener("03", "Respond and<br>prove it.", "Keep talking when channels fail, meet every reporting clock and keep the evidence a board can rely on.", [("01", "Out of band, and what good communication looks like"), ("02", "Reporting clocks by region and a notification log"), ("03", "Testing, evidence and your plan")])
    b.essay("Out of band", "When email and chat go down with everything else", [
        f"The UK FCA's March 2026 review found firms often had not considered in detail the alternatives or workarounds when their usual communication channels are unavailable, and little evidence that communications strategies are tested in scenario exercises.{R('fca1y')} The point applies in any market.",
        "In a cloud or identity outage, the tools a firm uses to coordinate may be the first casualties. If email, chat, the intranet and the incident ticketing system all sign in through the same identity provider or sit in the same cloud region, the response team cannot reach each other at the moment they most need to.",
        "Out-of-band means a route that shares no critical dependency with the systems that have failed. In practice that is a combination: an alerting service hosted separately from your estate, SMS and voice to personal and work mobiles, a fixed conference bridge with numbers printed in the plan, and an offline copy of contact lists and runbooks.",
        "Test it the way it would fail. Run an exercise in which email and chat are declared unavailable for the first two hours. Measure how long it takes to reach the full response team, how many acknowledge, and who you could not reach at all.",
        "The same thinking applies to customers. If the app is the channel that is down, the app banner cannot carry the message. Agree in advance which channels carry customer updates when the main one fails: the website status page, social accounts, SMS, branch staff, and the contact centre's recorded message.",
        "Finally, keep each regulator's contact details outside your normal systems. A supervisor's mobile number in a locked mailbox helps nobody."],
        "Respond and prove it", "Out-of-band means a route that shares no critical dependency with the systems that have failed.")
    b.compare("Customers and regulators", "Telling customers and regulators: what good looks like", "Most criticism after an outage is about silence and confusion, not the fault itself.", ["Moment", "What often happens", "What good looks like"], [
        ("First 30 minutes", "Silence while engineers diagnose the problem.", "A holding message on every channel you still control, within 30 minutes."),
        ("Supervisors", "First call made only once the cause is known.", "An early heads-up to the lead supervisor, then formal reports to every clock that applies."),
        ("Vulnerable customers", "One generic message for everyone.", "Priority help for those who cannot reach cash, pay rent or complete a purchase that day."),
        ("Cause", "Early speculation, or blaming a supplier.", "Say what you know and what customers should do. Name the cause only when confirmed."),
        ("Updates", "Irregular, and only when there is news.", "A fixed cadence, such as every 60 minutes, even when nothing has changed."),
        ("Afterwards", "Close quietly and move on.", "Explain what happened, put right any financial loss and share the lessons.")], "Respond and prove it")
    b.regions("Regional notes", "Reporting clocks by region", "The first formal report is often due within hours. Know which clocks apply to each entity before the day, and who starts them.", [
        ("United Kingdom", f"Payment service providers report a major operational or security incident within 4 hours of detecting it. From 18 March 2027, FCA rules require most firms to make an initial report within 24 hours of determining that an incident meets a threshold.{R('ps262')}",
         "Decide in advance who determines that a threshold is met; that decision starts the clock."),
        ("United States", f"Banks notify their primary federal regulator of a significant computer-security incident within 36 hours of determining it occurred.{R('cirn')} NYDFS covered entities notify within 72 hours of determining a cybersecurity incident, and within 24 hours of any extortion payment.{R('nydfs')} Listed companies file Form 8-K Item 1.05 within four business days of determining a cyber incident is material.{R('sec8k')}",
         "One incident can start several clocks. Log each one, with its owner, on the notification log."),
        ("European Union", f"Under DORA, the initial report of a major ICT-related incident is due within 4 hours of classifying it as major and no later than 24 hours from becoming aware; an intermediate report within 72 hours; a final report within one month.{R('dr301')}",
         "Classify quickly. A slow classification decision is itself a finding."),
        ("Middle East", f"<b>UAE:</b> licensed financial institutions notify the Central Bank within 4 hours of an event that significantly affects critical operations, with a summary within 24 hours.{R('cbuae')} <b>Saudi Arabia:</b> SAMA expects medium and high disruptive incidents to be reported promptly, and a post-incident report once normal operations resume.{R('sama')}",
         "Keep supervisor contacts for each jurisdiction outside your normal systems.")], "Respond and prove it")
    b.form("Notification log", "Supervisor, supplier and scheme notification log", "One line for every notification made or received during the incident, so nobody has to rebuild who was told what from inboxes afterwards.",
        [("Time", 0.8), ("To or from", 1.4), ("Channel", 1), ("What was said", 2.6), ("Reference", 1), ("Next update due", 1), ("By", 1)], "Respond and prove it", rows=11,
        example=("08:00", "Lead supervisor", "Phone, then email", "Card payments disrupted since 07:00; about [n] customers; cause under investigation", "Call note 3", "09:00", "Regulatory lead"),
        note="Illustrative example row. Formal reports follow the rules that apply to each entity: see the regional notes on reporting clocks. Record the time each clock started and the time each report was made.")
    b.steps("Testing and evidence", "Test the severe days, then write it down", "Six steps that turn a tested plan into evidence a board and a supervisor can rely on.", [
        ("Choose scenarios that could break you", f"Vary the nature, severity and duration. The UK FCA questions self-assessments that claim no scenario could defeat the firm without severe testing to show it.{R('fca1y')}"),
        ("Include communications in every test", "Declare email and chat unavailable. Time how long it takes to reach the team, the customer channels and the supervisor."),
        ("Run the tolerance clock", "Record the start, each decision and the point of recovery against the tolerance for every affected service."),
        ("Plan for a breach", f"Where a scenario would breach a tolerance, document the longer-term remediation plan, with owners and dates.{R('fca1y')}"),
        ("Make the evidence decision-ready", f"Confidence ratings, second and third line input, and a clear ask of the board. In the UK the board approves the self-assessment.{R('ss121')}"),
        ("Learn from real incidents", "Use 20 October as a case study. Map which of your services would have been hit, and how you would have known.")], "Respond and prove it")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("This week", "Check that the response team can be reached without corporate email or chat. Print the bridge number and supervisor contacts into the plan.", "Head of resilience"),
        ("This week", "List every critical service that depends on a single cloud region or zone, including through suppliers.", "CIO or CTO"),
        ("This month", "Agree the severity ladder, escalation levels and decision rights. Load the Communication templates and their sign-off rules.", "Head of resilience, communications lead"),
        ("This month", "Ask material suppliers how they notify you, how fast, and where their own dependencies sit.", "Third-party risk lead"),
        ("This quarter", "Run the Tabletop exercise with communications channels unavailable. Time it against tolerance and record the evidence.", "Head of resilience"),
        ("This quarter", "Map every reporting clock that applies to each entity in the group, and name who starts each one.", "Chief risk officer, compliance")], "Respond and prove it", "30mm 1fr 46mm")

    # ------------------------------------------------------------------ PART 04: practical toolkit
    b.mark("04", "Practical toolkit")
    b.toolkit_index()
    b.readiness()
    b.raci("", "Who decides, who acts, who is told", "Most delay in a crisis is waiting for someone to decide. Agree decision rights in advance and name a deputy for every accountable role.",
        ["Executive on call", "Incident lead", "IT and technology", "Comms", "Compliance", "Senior manager"], [
        ("Declare SEV1 and start the tolerance clock", ["I", "A", "C", "I", "I", "I"]),
        ("Engage the cloud provider and card processor", ["", "A", "R", "", "I", ""]),
        ("Decide failover or manual workaround", ["I", "A", "R", "I", "C", "I"]),
        ("Approve the first customer message", ["I", "A", "C", "R", "C", ""]),
        ("Early call to the lead supervisor", ["I", "C", "", "I", "R", "A"]),
        ("Escalate when tolerance is at risk", ["A", "R", "C", "I", "C", "C"]),
        ("Accept a likely breach and set remediation", ["R", "C", "C", "C", "C", "A"]),
        ("Media statement and spokesperson", ["A", "C", "", "R", "C", "I"]),
        ("Redress for customers who lost out", ["A", "C", "", "C", "R", "I"]),
        ("Formal incident reports to supervisors", ["I", "C", "C", "", "R", "A"]),
        ("Post-incident review and resilience evidence", ["I", "R", "C", "C", "C", "A"])], "", tool=True,
        note="Illustrative. The executive on call leads the crisis team. The senior manager is the person accountable for operational resilience in your firm (in the UK, the relevant SMF holder). One A per row, and every A has a named deputy who can act without waiting.")
    b.decisionlog("Write it down as you go, against the tolerance clock", "Every material decision, in one place, with the time left against tolerance in the rationale. It is the backbone of the timeline your board and supervisors will ask for.",
        ("07:52", "Fail card authorisation over to the second region", "Wait for provider fix; manual fallback only", "Incident lead, advised by technology lead", "No provider ETA; 3h 08m left of a 4-hour tolerance; failover tested last quarter", "Bridge note 4; task 14"),
        note="Illustrative example row, against a 4-hour tolerance. Record decisions not to act as well as decisions to act. The scribe keeps the log; the decision owner confirms each entry.")
    b.escalation("", "Escalate on the tolerance clock", "Severity says how bad it is. Escalation says who must decide next, and it runs on time remaining against tolerance for card payments, not on how the room feels.", [
        ("Service degraded", "Authorisation errors above normal. A workaround is holding and customers can still pay.", "Technology on call, card payments service owner.", "Incident lead, with the service owner.", "no fix in 30 minutes or customers cannot pay"),
        ("Tolerance clock running", "Customers cannot pay or be paid. The clock started when the harm began, not when it was declared.", "Incident team, communications lead, compliance lead.", "Incident lead declares SEV1 and owns the response.", "forecast recovery passes half the tolerance"),
        ("Tolerance at risk", "Recovery within tolerance is no longer assured. Failover is untested or has failed.", "Executive on call, accountable senior manager, supplier executive contact.", "Executive on call, on options set out by the incident lead.", "a breach is likely before recovery"),
        ("Breach likely or confirmed", "The service will exceed, or has exceeded, its tolerance.", "Executive committee, board chair, supervisors through the regulatory lead.", "Accountable senior manager and executive committee: remediation, redress and reporting.", "")], "", tool=True,
        note="Illustrative thresholds for a 4-hour tolerance. Set yours as fractions of each service's tolerance, so the same rule works for a 2-hour and a 2-day service. If in doubt, escalate.")
    b.messages("", "Six messages ready to send", "Fill the brackets with confirmed facts only. Agree sign-off rules in advance so messages are not held up.", [
        ("SMS", "Response team", "SEV1 declared 07:05. Cards and app down. Join bridge now: [number] PIN [pin]. Do not use email or chat. Reply 1 to confirm, 2 if unavailable.", "No reply in 5 minutes: call the deputy."),
        ("App banner and web", "Customers", "Some customers can't use our app or cards right now. We're working to fix this and will update you here by [time]. Sorry for the disruption.", "Say money is safe only once confirmed."),
        ("Email and phone", "Supervisors", "Since [time] an operational incident has affected [service]. Likely cause: third-party cloud disruption. Customers affected: about [n]. Tolerance [x] hours, [y] elapsed. Next update [time]. Contact: [name, mobile].", "Formal reports follow the rules that apply."),
        ("SMS", "Branch and contact centre", "Cards and app disrupted. Use script v3. Don't speculate on cause. Log customers who need urgent cash or payments. Next brief [time].", ""),
        ("Email", "Critical supplier", "SEV1 affecting [service] since [time]. Within 15 minutes please confirm scope, your reference, a named engineer, an ETA and any workaround.", "Copy the contract owner."),
        ("Statement", "Media holding line", "We're aware some customers are having difficulty using our app and cards. We're working to restore services as quickly as possible and will update our website. We apologise to those affected.", "No supplier or cause until confirmed.")], "", tool=True)
    b.exercise("", "Region down on payday: a three-hour tabletop", "A ready-to-run exercise built on the scenario in this playbook. Run it with the people who would really be called, and keep email and chat out of the room.",
        [("Duration", "Three hours, including a 30-minute debrief"), ("Participants", "Executive on call, accountable senior manager, incident, IT, comms, compliance, supplier leads"), ("Objective", "Keep card payments within tolerance without email or chat"), ("Facilitator", "Head of resilience, with an independent observer")], [
        ("07:00", "Card authorisations and app logins fail. Email and chat are declared unavailable for two hours.", "How do we reach the team? Who declares, and when did the tolerance clock start?"),
        ("07:20", "The provider status page still shows no incident. Contact centre waits pass 30 minutes.", "What do customers hear now, on which channels, and who approves it?"),
        ("07:50", "Failover to the second region is ready, but has never been run at peak volume.", "Who decides? What is the risk to data integrity, and who is told?"),
        ("08:30", "Rerouted payments start failing fraud checks. A journalist asks if customer data is affected.", "Who can change fraud rules? What can we say, and what must we not say?"),
        ("09:30", "Forecast recovery for card payments now runs past the tolerance.", "Who escalates to the executive? Which supervisors hear, on which clocks, and when?"),
        ("11:00", "Services are back. Many customers missed payments or were charged twice.", "How do we find them, put it right and record it for the review?")], "", tool=True,
        note="Measure four things: time to reach the full team, time to the first customer message, time to the supervisor call, and decisions logged with an owner. Put the results and the gaps into your resilience evidence.")
    b.pir("", "Measured against the tolerance", "Hold it soon, ideally within two weeks, while memories and logs are fresh. Blame-free, evidence-led and measured against the tolerance.", [
        ("The tolerance timeline", "When did harm start for customers, and when was it detected, declared and recovered? How close did each service come to its tolerance?"),
        ("Detection and declaration", "What told us first: monitoring, customers or the supplier? How long from first signal to declaration?"),
        ("Decisions and decision rights", "Which decisions were made, by whom, on what information? Did any wait for someone with authority?"),
        ("Reaching people", "How long to reach the response team out of band? Who could not be reached, and why?"),
        ("Customers and vulnerability", "What were customers told, when and where? Who needed urgent help, and did they get it?"),
        ("Third parties", "When did suppliers tell us, and what did they give us? Did a supplier's own supplier play a part?"),
        ("Regulatory reporting", "Which notifications were made, to whom, and was every clock met? What follow-up is due?"),
        ("Actions and evidence", "What changes, who owns it and by when? What does this mean for our tolerances and resilience evidence?")], "", tool=True)

    # ------------------------------------------------------------------ questions, checklist, glossary
    b.mark("", "Questions, checklist and glossary")
    b.questions("For leaders", "Questions for your executive committee", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["If our cloud region failed at 07:00 tomorrow, which critical services would breach tolerance first?", "Could we reach the whole response team in ten minutes without email or chat?", "Who is authorised to send the first customer message, and how fast?"]),
        ("Evidence", ["Which scenario in our last test came closest to breaching a tolerance, and what are we doing about it?", "Did our last test include communications, suppliers and the supervisor call?", "Do we know every reporting clock that applies to each entity in the group?"])], "Questions, checklist and glossary")
    b.checklist("Checklist", "Are you ready to stay within tolerance?", "Tick what is true today. Anything blank is your next action.", [
        ("Critical services and tolerances approved by the board", "Reviewed in the last twelve months or after material change."),
        ("Every service mapped to people, systems and suppliers", "Including the cloud region and zone, and key fourth parties."),
        ("Severity ladder agreed and out-of-band alerting tested", "The team reachable without corporate email, chat or single sign-on."),
        ("Communication templates loaded", "For customers, staff, supervisors, suppliers and the media, with sign-off rules."),
        ("Reporting clocks known for every jurisdiction", "Who starts each clock, and the supervisor contacts for each entity."),
        ("Severe scenario tested in the last year", "With communications included and timings recorded against tolerance."),
        ("Evidence ready for the board and supervisors", "Confidence ratings, remediation owners and second line challenge.")], "Questions, checklist and glossary")
    b.glossary("Words worth knowing", [
        ("Important business service", "UK term: a service to an external user which, if disrupted, could cause intolerable harm or risk to the firm or the wider system."),
        ("Impact tolerance", "UK term: the maximum tolerable level of disruption to an important business service, always including a time metric."),
        ("Tolerance for disruption", "The US sound practices term for the disruption a bank's board will accept for critical operations; the UAE uses disruption tolerance."),
        ("Critical or important function", "The DORA term for a function whose disruption would materially impair an EU financial entity."),
        ("Maximum acceptable outage", "A limit Saudi SAMA's framework asks firms to define for critical activities, with recovery time and point objectives."),
        ("Mapping", "Identifying the people, processes, technology, facilities and information that support each critical service."),
        ("Severe but plausible scenario", "A demanding but realistic disruption used to test whether a firm can stay within tolerance."),
        ("Critical third party", "UK term: a provider designated by HM Treasury whose disruption could threaten UK financial stability or confidence."),
        ("Availability zone", "An isolated location within a cloud region, with its own power and networking."),
        ("Out-of-band", "A communication route that does not rely on the systems affected by the incident.")])

    b.platform("An Operational Incident Coordination Platform for a financial services incident", "Most organisations can send alerts. Few can manage incidents end-to-end. Here is the cloud outage in this playbook, one module at a time. Crises Control supports your plan; it does not replace it.", [
        ("A branch colleague raises an SOS from the mobile app with a press and hold, sharing location where available.", "SOS"),
        ("The incident team, executive on call and senior manager are alerted by push, SMS and voice; no response escalates to deputies under the rules you configure.", "Ping"),
        ("An authorised user launches the card payments response plan, with roles and a single communication log in one workspace.", "Incident Manager"),
        ("Failover, workarounds, customer messages and the supervisor call become owned tasks with deadlines, tracked to completion.", "Task Manager"),
        ("The executive sees who has acknowledged, task progress and status in one live view, without asking for a briefing.", "Control Centre"),
        ("A timestamped record of messages, acknowledgements, decisions logged and tasks, exportable for the report and the review.", "Audit & Reporting"),
        ("CRAiG (beta) answers the incident lead's questions, such as who has not responded and which tasks are still open.", "CRAiG")])

    b.mark("", "Sources")
    src = {
        "gcp": "Google Cloud, Incident report Xs2XTHzAVC9YnafnPyzj (europe-west2), final report 4 November 2026, status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj",
        "reuters": "Reuters via Yahoo Finance, Europe's financial regulators query Google over cloud outage that hit banks, 21 October 2026, finance.yahoo.com",
        "yahoo": "Yahoo Finance UK, Power outage hits Google Cloud services, disrupting UK banks, 20 October 2026, uk.finance.yahoo.com",
        "ps213": "UK FCA, PS21/3: Building operational resilience, March 2021, fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience",
        "dora": "Regulation (EU) 2022/2554 (DORA), OJ L 333, 27 December 2022, eur-lex.europa.eu/eli/reg/2022/2554/oj/eng",
        "sound": "Federal Reserve, OCC and FDIC, Sound Practices to Strengthen Operational Resilience, 30 October 2020 (SR 20-24), federalreserve.gov",
        "cbuae": "Central Bank of the UAE, Operational Risk Management Regulation, Circular 1/2026, effective 14 September 2026; summary by Trowers & Hamlins, September 2026, trowers.com",
        "ss121": "UK PRA, SS1/21 Operational resilience: Impact tolerances for important business services, as updated, bankofengland.co.uk",
        "fca1y": "UK FCA, Operational resilience: insights and observations one year on, 27 March 2026, fca.org.uk",
        "ffiec": "FFIEC, IT Examination Handbook, Business Continuity Management booklet, November 2019, ithandbook.ffiec.gov",
        "nydfs": "New York DFS, 23 NYCRR 500.16 and 500.17, as amended November 2023, dfs.ny.gov",
        "sama": "SAMA, Business Continuity Management Framework, Circular 381000058504, 27 February 2017, rulebook.sama.gov.sa",
        "dfsa": "DFSA, Consultation Paper 170: Strengthening operational resilience in the DIFC, 2026 (proposals), dfsa.ae",
        "hmt": "HM Treasury, UK financial system strengthened with new safeguards for major technology providers, 10 July 2026, gov.uk",
        "boe": "Bank of England, PRA and FCA, UK financial regulators to begin overseeing Critical Third Parties, 10 July 2026, bankofengland.co.uk",
        "ps262": "UK FCA, PS26/2: Operational incident and third party reporting, 18 March 2026 (applies from 18 March 2027), fca.org.uk/publication/policy/ps26-2.pdf",
        "cirn": "Federal Reserve, FDIC and OCC, Computer-security incident notification final rule, 18 November 2021, federalreserve.gov",
        "sec8k": "US SEC, Cybersecurity incident disclosure rules (Form 8-K Item 1.05), press release 2023-139, July 2023, sec.gov",
        "dr301": "Commission Delegated Regulation (EU) 2025/301, Article 5, eur-lex.europa.eu/eli/reg_del/2025/301/oj/eng",
    }
    assert set(order) == set(src), (set(src) - set(order), set(order) - set(src))
    items = sorted((order[k], t) for k, t in src.items())
    b.sources([(f"{n:02d}", t) for n, t in items])
    b.art_back("Stay within tolerance<br>on the worst day.", "Most organisations can send alerts. Few can manage incidents end-to-end. Crises Control helps banks, insurers, payment and investment firms reach the right people, run the response from one place and keep the evidence supervisors ask for.", "Request a demo",
        next_title="Intelligence report No. 01 · Resilience, regulated")
    return b
