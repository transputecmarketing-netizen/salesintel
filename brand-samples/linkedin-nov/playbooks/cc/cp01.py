from cckit import CCBook, S


def build():
    b = CCBook("Within Tolerance", 1, "relay", "Financial Services and Insurance", "9 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "A practical crisis playbook for banks, insurers, payment and investment firms: how to keep important business services within tolerance on the worst day, run the first hour, talk to customers and regulators when normal channels fail, and gather the evidence a board and a supervisor will ask for."
    b.art_cover("Operational resilience", "Within", "tolerance.",
        "A crisis playbook for banks, insurers, payment and investment firms. What to do in the first hour of a severe disruption, how to communicate when email and chat are down, and how to prove you can stay within your impact tolerances.")
    b.contents()

    # ------------------------------------------------------------------ front matter
    b.mark("", "Foreword")
    b.foreword("Resilience on paper met a real morning on 20 October 2026.", [
        f"At 06:53 BST on Tuesday 20 October 2026, the utility feed to a data centre hosting europe-west2-b, one of Google Cloud's London zones, failed. A second feed was switched out for repairs, and a control system fault stopped the backup generators from starting. When the batteries ran out at 07:00, servers in the zone lost power. Google's incident report puts the main impact across the London region at six hours and eight minutes.{R('gcp')}",
        f"Customers of Lloyds, HSBC and Revolut reported problems with apps, payments and cash withdrawals that morning.{R('reuters', 'yahoo')} The FCA said it was engaging with Google, and the Treasury Committee wrote to the Bank of England and the FCA for details.{R('reuters')} Google Cloud had been designated a critical third party to the UK financial sector just fourteen weeks earlier.{R('hmt')}",
        f"Since 31 March 2025, UK banks, insurers, payment firms and many investment firms have been expected to show they can remain within impact tolerances for each important business service.{R('ps213')} This playbook is about the practical side of that duty: the first hour, the messages, the suppliers and the evidence. Our companion intelligence report sets out the regulation and the record in full."],
        sign="The Crises Control team")

    b.mark("", "Introduction")
    b.intro("Introduction", "Three questions decide how your worst day goes.", "Regulators do not expect firms to prevent every disruption. They expect firms to know which services matter most, how much disruption customers and markets can bear, and how they will stay inside that limit when something fails.",
        [("compass", "Do we know what matters?", "Important business services named, impact tolerances set and approved by the board, and every service mapped to the people, systems and suppliers it relies on."),
         ("bell", "Can we act in minutes?", "A severity ladder everyone uses, a first-hour plan with named owners, and a way to reach the response team that does not depend on the systems that have failed."),
         ("check", "Can we prove it?", "Severe but plausible scenarios tested, communications included, and the timings, decisions and lessons recorded so the self-assessment stands up to challenge.")])
    b.statement("Resilience is measured on the customer's clock, not the supplier's.", "A cloud provider can restore its service on its own timetable. Your impact tolerance keeps running from the moment your customers cannot pay, be paid or claim.", "Introduction")

    # ------------------------------------------------------------------ PART 01
    b.mark("01", "Know your limits")
    b.opener("01", "Know your<br>limits.", "Before a crisis, decide which services matter most and how much disruption is too much.", [("01", "Services, tolerances and a dependency map"), ("02", "Severity and escalation on the tolerance clock"), ("03", "Who decides: roles and decision rights")])
    b.essay("Know your limits", "Important business services and impact tolerances, in plain terms", [
        f"The UK operational resilience rules, set out by the FCA in PS21/3 and by the PRA in SS1/21, ask a firm to look at itself from the outside in. An important business service is one that, if disrupted, could cause intolerable harm to customers or risk to market integrity, or for the PRA threaten the firm's safety and soundness or financial stability.{R('ps213', 'ss121')}",
        f"For each one, the firm sets an impact tolerance: the maximum tolerable level of disruption. The PRA requires every tolerance to include a time metric, says it applies at peak times as well as normal ones, and expects firms to stay within it in severe but plausible scenarios, whether or not a third party delivers part of the service.{R('ss121')}",
        f"The deadline mattered. Rules came into force on 31 March 2022, and by 31 March 2025 firms had to have done the mapping and testing to remain within tolerance, and made the investments to operate consistently within it.{R('ps213')}",
        f"In March 2026, reviewing annual self-assessments, the FCA saw progress: clearer methods, annual reviews and some non-time metrics such as transaction volumes. It also found firms not setting distinct tolerances for consumer harm and market integrity, and mapping that focused mainly on technology.{R('fca1y')}",
        "A tolerance is not a recovery time objective. It is the point at which harm becomes intolerable, so recovery targets usually sit well inside it. If your recovery plan only just fits within the tolerance, the plan is the risk.",
        "The practical test is simple. Pick any important business service and ask three people to name its tolerance, its top three dependencies and who declares an incident. If the answers differ, start there."],
        "Know your limits", "A tolerance is the point at which harm becomes intolerable. Recovery targets should sit well inside it.")
    b.table("Illustrative services", "What an important business service looks like", "Examples only. Each firm must identify its own services and justify its own tolerances.", ["Firm type", "Example service", "Tolerance metrics to consider", "Hidden dependency"], [
        ("Retail bank", "Making a payment from a current account", "Hours of disruption at peak, number of customers and value of payments affected", "Card processor, cloud region, fraud engine"),
        ("Insurer", "Making and paying a motor or home claim", "Days to first contact and payment, with extra weight in a storm or flood", "Claims platform supplier, contact centre telephony"),
        ("Payments and e-money", "Card authorisation and access to funds", "Minutes of failed authorisations, share of transactions declined", "Scheme connection, issuer processor, single hosting zone"),
        ("Investment firm", "Placing and settling client orders", "Orders missed or delayed in market hours, settlement fails", "Order management SaaS, market data, custodian links"),
        ("Building society", "Mortgage completion on the agreed day", "Completions missed, with tolerance tightest at month end", "Payment scheme access, conveyancer portal")], "Know your limits", "32mm 1fr 1fr 1fr")
    b.depmap("Dependency map", "One service, mapped before you need it", "An illustrative map for retail card payments: the people, technology, suppliers, sites, information and processes the service relies on, and the limits that apply.",
        ("Retail card payments", "Customers pay in shops and online by debit card, and see the payment in their account."), [
        ("People", "Payments operations, fraud team, contact centre, technology on call, executive on call and their deputies."),
        ("Technology", "Card authorisation platform, core ledger, fraud engine, mobile app and the identity service staff sign in with."),
        ("Third parties", "Card scheme connection, issuer processor, cloud provider and the region and zones used, telephony supplier."),
        ("Facilities", "Operations centre, contact centre sites, data centres and the cloud zones each component runs in."),
        ("Information", "Card and account data, fraud rules, customer contact details, payment and authorisation logs."),
        ("Processes", "Authorisation, fallback processing, disputes and refunds, customer messages and supervisor contact.")],
        [("Recovery target · illustrative", "2 hours"), ("Volume metric · illustrative", "5% declined at peak"), ("Customer metric · illustrative", "Urgent cases helped same day"), ("Impact tolerance · illustrative", "4 hours at peak")], "Know your limits",
        note=f"All values are illustrative. Each firm sets and justifies its own tolerances, approved by its board. The PRA expects every tolerance to include a time metric and to hold at peak times.{R('ss121')} Recovery targets sit well inside the tolerance.")
    b.severity("Severity", "A severity ladder for financial services", "Agree the triggers in advance so nobody debates the level while customers wait. If in doubt, declare higher and step down.", [
        (1, "Critical", "An important business service is down or badly degraded and its impact tolerance is at risk. Customers cannot pay, be paid, reach cash or make a claim. Data integrity in doubt, or a suspected cyber attack on core systems.", "Crisis team, executive on call, regulatory lead and communications lead. Board chair informed.", "Push, SMS, voice call · escalate after 5 minutes"),
        (2, "Major", "An important business service is degraded but a tested workaround is holding. One channel is down, such as the app but not cards. A material supplier declares an incident.", "Incident team, service owners, supplier manager. Communications lead on standby.", "Push and SMS · bridge opened"),
        (3, "Moderate", "Internal system failure with little or no customer impact. Failover worked as designed. Elevated error rates under investigation.", "Technology on call and the service owner.", "Push and email"),
        (4, "Watch", "Supplier advisory, risky change window, severe weather warning or a peak day such as payday or month end ahead.", "Duty manager logs it and briefs the next shift.", "Email and incident log")], "Know your limits")
    b.escalation("Escalation", "Escalate on the tolerance clock", "Severity says how bad it is. Escalation says who must decide next, and it runs on time remaining against tolerance for card payments, not on how the room feels.", [
        ("Service degraded", "Authorisation errors above normal. A workaround is holding and customers can still pay.", "Technology on call, card payments service owner.", "Incident lead, with the service owner.", "no fix in 30 minutes or customers cannot pay"),
        ("Tolerance clock running", "Customers cannot pay or be paid. The clock started when the harm began, not when it was declared.", "Incident team, communications lead, compliance lead.", "Incident lead declares SEV1 and owns the response.", "forecast recovery passes half the tolerance"),
        ("Tolerance at risk", "Recovery within tolerance is no longer assured. Failover is untested or has failed.", "Executive on call, SMF holder, supplier executive contact.", "Executive on call, on options set out by the incident lead.", "a breach is likely before recovery"),
        ("Breach likely or confirmed", "The service will exceed, or has exceeded, its impact tolerance.", "Executive committee, board chair, supervisors through the regulatory lead.", "SMF holder and executive committee: remediation, redress and reporting.", "")], "Know your limits",
        note="Illustrative thresholds for a 4-hour tolerance. Set yours as fractions of each service's tolerance, so the same rule works for a 2-hour and a 2-day service. If in doubt, escalate.")
    b.raci("Decision rights", "Who decides, who acts, who is told", "Most delay in a crisis is waiting for someone to decide. Agree decision rights in advance and name a deputy for every accountable role.",
        ["Executive on call", "Incident lead", "IT and technology", "Comms", "Compliance", "SMF holder"], [
        ("Declare SEV1 and start the tolerance clock", ["I", "A", "C", "I", "I", "I"]),
        ("Engage the cloud provider and card processor", ["", "A", "R", "", "I", ""]),
        ("Decide failover or manual workaround", ["I", "A", "R", "I", "C", "I"]),
        ("Approve the first customer message", ["I", "A", "C", "R", "C", ""]),
        ("Early call to FCA and PRA supervisors", ["I", "C", "", "I", "R", "A"]),
        ("Escalate when tolerance is at risk", ["A", "R", "C", "I", "C", "C"]),
        ("Accept a likely breach and set remediation", ["R", "C", "C", "C", "C", "A"]),
        ("Media statement and spokesperson", ["A", "C", "", "R", "C", "I"]),
        ("Redress for customers who lost out", ["A", "C", "", "C", "R", "I"]),
        ("Formal incident reports to supervisors", ["I", "C", "C", "", "R", "A"]),
        ("Post-incident review and self-assessment", ["I", "R", "C", "C", "C", "A"])], "Know your limits",
        note="Illustrative. The executive on call leads the crisis team. The SMF holder is the senior manager responsible for operational resilience in your firm. One A per row, and every A has a named deputy who can act without waiting.")

    # ------------------------------------------------------------------ PART 02
    b.mark("02", "The first hour")
    b.opener("02", "The first<br>hour.", "What happens in the first sixty minutes decides whether you stay within tolerance.", [("01", "A T+ timeline and where it goes wrong"), ("02", "When email and chat are down too"), ("03", "Messages, outstanding actions and a decision log")])
    b.firsthour("First hour", "Cloud outage at 07:00", "A bank or payment firm whose app and cards depend on one cloud region. Owners are roles.", [
        ("T+00:00", "Alarms and complaints arrive together", "Monitoring shows failed card authorisations and app logins as the contact centre and social channels light up.", "Duty incident manager", 1),
        ("T+00:05", "Declare and page out of band", "Declare SEV1 provisionally. Page the team by SMS and voice, not email or chat, which may share the failed dependency.", "Duty incident manager", 1),
        ("T+00:10", "Open the bridge, start the clock", "Assign leads and a scribe. Record which important business services are hit, and when.", "Incident lead", 1),
        ("T+00:15", "Call the provider, do not wait for it", f"Raise a priority case. On 20 October the first public update came about two and a half hours after impact began.{R('gcp')}", "Supplier lead", 2),
        ("T+00:30", "First word to customers", "Holding message on the website, app and social channels. Contact centre script live. Flag customers who need urgent help.", "Communications lead", 2),
        ("T+00:45", "Decide on failover", "Invoke the tested move to another zone or region, or manual workarounds. Protect data integrity above speed.", "Technology lead", 1),
        ("T+01:00", "Tell the supervisor", f"Early call to FCA and PRA supervisors. Payment firms must report a major incident within 4 hours of detecting it.{R('ps262')}", "Regulatory lead", 2)], "The first hour")
    b.swimlane("Swimlane", "The same morning, lane by lane", "Who acts, who decides, where it goes wrong and how progress is watched, from the first failed payment to the second hour.",
        ["Executive and SMF holder", "Incident lead", "Technology and suppliers", "Comms and customers", "Compliance and regulators"],
        ["07:00", "07:05", "07:15", "07:30", "08:00", "09:00"], [
        (2, 0, "Card and app failures spike", "act"), (3, 0, "Contact centre calls surge", "mon"), (1, 0, "First page sent by chat, which is down", "risk"),
        (1, 1, "Declares SEV1, starts tolerance clock", "dec"), (1, 1, "Acknowledgements tracked; silence goes to deputies", "mon"), (0, 1, "Executive on call acknowledges by SMS", "act"),
        (2, 2, "Priority case raised with provider", "act"), (2, 2, "Team waits for the provider status page", "risk"), (4, 2, "Logs services hit and start times", "act"),
        (3, 3, "Holding message on web, social, phone line", "act"), (3, 3, "App banner used while the app is down", "risk"), (0, 3, "Briefed from the live task board", "mon"),
        (1, 4, "Approves failover to second region", "dec"), (2, 4, "Failover tasks timed against recovery target", "mon"), (0, 4, "Tolerance at risk: takes the escalation", "dec"), (4, 4, "Early call to FCA and PRA", "act"),
        (0, 5, "Executive sets the redress approach", "dec"), (2, 5, "Rerouted payments trip fraud rules", "risk"), (3, 5, "Hourly update, even with no news", "mon"), (4, 5, "Next supervisor update logged and due", "mon")], "The first hour",
        note="Illustrative. Each red box is a common failure point: coordination over a channel that shares the outage, waiting on a supplier, the wrong customer channel and an untested route. Plan the alternative before the day.")
    b.essay("Out of band", "When email and chat go down with everything else", [
        f"The FCA's March 2026 review found firms often had not considered in detail the alternatives or workarounds when their usual communication channels are unavailable, and little evidence that communications strategies are tested in scenario exercises.{R('fca1y')}",
        "In a cloud or identity outage, the tools a firm uses to coordinate may be the first casualties. If email, chat, the intranet and the incident ticketing system all sign in through the same identity provider or sit in the same cloud region, the response team cannot reach each other at the moment they most need to.",
        "Out-of-band means a route that shares no critical dependency with the systems that have failed. In practice that is a combination: an alerting service hosted separately from your estate, SMS and voice to personal and work mobiles, a fixed conference bridge with numbers printed in the plan, and an offline copy of contact lists and runbooks.",
        "Test it the way it would fail. Run an exercise in which email and chat are declared unavailable for the first two hours. Measure how long it takes to reach the full response team, how many acknowledge, and who you could not reach at all.",
        "The same thinking applies to customers. If the app is the channel that is down, the app banner cannot carry the message. Agree in advance which channels carry customer updates when the main one fails: the website status page, social accounts, SMS, branch staff, and the contact centre's recorded message.",
        "Finally, keep the regulator's contact details outside your normal systems. A supervisor's mobile number in a locked mailbox helps nobody."],
        "Out of band", "Out-of-band means a route that shares no critical dependency with the systems that have failed.")
    b.messages("Templates", "Six messages ready to send", "Fill the brackets with confirmed facts only. Agree sign-off rules in advance so messages are not held up.", [
        ("SMS", "Response team", "SEV1 declared 07:05. Cards and app down. Join bridge now: [number] PIN [pin]. Do not use email or Teams. Reply 1 to confirm, 2 if unavailable.", "No reply in 5 minutes: call the deputy."),
        ("App banner and web", "Customers", "Some customers can't use our app or cards right now. We're working to fix this and will update you here by [time]. Sorry for the disruption.", "Say money is safe only once confirmed."),
        ("Email and phone", "FCA and PRA supervisors", "Since [time] an operational incident has affected [service]. Likely cause: third-party cloud disruption. Customers affected: about [n]. Tolerance [x] hours, [y] elapsed. Next update [time]. Contact: [name, mobile].", "Formal reports follow the rules that apply."),
        ("SMS", "Branch and contact centre", "Cards and app disrupted. Use script v3. Don't speculate on cause. Log customers who need urgent cash or payments. Next brief [time].", ""),
        ("Email", "Critical supplier", "SEV1 affecting [service] since [time]. Within 15 minutes please confirm scope, your reference, a named engineer, an ETA and any workaround.", "Copy the contract owner."),
        ("Statement", "Media holding line", "We're aware some customers are having difficulty using our app and cards. We're working to restore services as quickly as possible and will update our website. We apologise to those affected.", "No supplier or cause until confirmed.")], "The first hour")
    b.compare("Customers and regulators", "Telling customers and regulators: what good looks like", "Most criticism after an outage is about silence and confusion, not the fault itself.", ["Moment", "What often happens", "What good looks like"], [
        ("First 30 minutes", "Silence while engineers diagnose the problem.", "A holding message on every channel you still control, within 30 minutes."),
        ("Supervisors", "First call made only once the cause is known.", f"An early heads-up, then formal reports to the clock. From 18 March 2027 most firms report within 24 hours of determining that a threshold is met.{R('ps262')}"),
        ("Vulnerable customers", "One generic message for everyone.", "Priority help for those who cannot reach cash, pay rent or complete a purchase that day."),
        ("Cause", "Early speculation, or blaming a supplier.", "Say what you know and what customers should do. Name the cause only when confirmed."),
        ("Updates", "Irregular, and only when there is news.", "A fixed cadence, such as every 60 minutes, even when nothing has changed."),
        ("Afterwards", "Close quietly and move on.", "Explain what happened, put right any financial loss and share the lessons.")], "The first hour")
    b.tracker("Outstanding actions", "Services back. The work is not finished.", "An illustrative board at 13:30, after recovery. Every open action has one owner, a time and a way to check it is really done.", [
        ("Customer update: services restored", "Communications lead", "13:30", "Done", "Published on web, app, social and phone line"),
        ("Confirm card authorisations are back to normal", "Technology lead", "14:00", "In progress", "Success rate against the normal baseline"),
        ("Update supervisors: recovery confirmed", "Regulatory lead", "14:30", "In progress", "Entry and reference in the notification log"),
        ("Call customers flagged as needing urgent help", "Contact centre lead", "13:00", "Overdue", "Call list ticked off; anyone unreached escalated"),
        ("Brief board chair and executive committee", "Executive on call", "16:00", "Open", "Briefing note filed with the incident record"),
        ("Preserve logs and timeline for the report", "Incident lead", "17:00", "In progress", "Timeline checked against the decision log"),
        ("Reconcile failed and duplicate payments", "Payments operations", "18:00", "Open", "Sample of reconciled accounts signed off"),
        ("Refund fees and charges caused by the outage", "Remediation lead", "Day 2", "Open", "Redress log reviewed by compliance"),
        ("Root cause and fix in writing from the provider", "Supplier lead", "Day 3", "Blocked", "Awaiting provider report; chased daily")], "The first hour",
        note="Review the board at a fixed time, such as every two hours, until every row is done or handed to the post-incident review. An overdue row escalates to the executive on call.")
    b.form("Decision log", "Decision log: write it down as you go", "Every material decision, in one place, with the time left against tolerance. It is the backbone of the timeline your board and supervisor will ask for.",
        [("Time", 0.8), ("Decision", 2.2), ("Options considered", 2), ("Decided by", 1.4), ("Time left to tolerance", 1.1), ("Evidence or reference", 1.3)], "The first hour", rows=14,
        example=("07:52", "Fail card authorisation over to the second region", "Wait for provider fix; manual fallback only", "Incident lead, advised by technology lead", "3h 08m", "Bridge note 4; task 14"),
        note="Illustrative example row, against a 4-hour tolerance. Record decisions not to act as well as decisions to act. The scribe keeps the log; the decision owner confirms each entry.")

    # ------------------------------------------------------------------ PART 03
    b.mark("03", "Prove it")
    b.opener("03", "Prove<br>it.", "Map what you depend on, test the severe days and keep the evidence a board can rely on.", [("01", "Where concentration hides"), ("02", "Three scenarios and a tabletop exercise"), ("03", "Post-incident review and your 90-day plan")])
    b.figpage("Concentration", "Four places concentration hides", f"The UK designated four cloud providers as critical third parties in July 2026. Regulated firms remain responsible for managing their own third-party arrangements.{R('hmt', 'boe')}", "hub", [
        ("One region, one zone", "Services described as resilient may still run in a single zone, or rely on regional control systems that a zone failure can disrupt."),
        ("Shared tooling", "Email, chat, identity and incident tooling often sit with the same provider as production. One outage removes both the service and the means to coordinate."),
        ("Your suppliers' suppliers", "A claims platform or core banking SaaS may run in the same cloud region you chose to avoid."),
        ("Payments chains and people", "Processors, scheme connections and fraud engines need tested alternatives. So do key teams working from a single site."),
        ], "Prove it")
    b.usecase("Scenarios", "Three severe days to rehearse", [
        ("server", "Retail bank", "A cloud zone fails at 07:00 on payday", [("The disruption", "App, card payments and online transfers degrade across the region, not just the failed zone."), ("Where it goes wrong", "Corporate email and chat run in the same region, so the first page never arrives."), ("Who decides", "The incident lead declares and approves failover. The executive on call owns escalation as tolerance nears."), ("Monitor and test", "One live board of acknowledgements, tasks and time left. Rehearse failover to another region without email and chat.")]),
        ("transfer", "Payments and e-money firm", "Card processor outage on Black Friday", [("The disruption", "Authorisations fail for 40 minutes at peak, leaving customers stuck at tills."), ("Where it goes wrong", "Traffic moves to the standby route and fraud rules block legitimate payments."), ("Who decides", "The incident lead switches route and reports within 4 hours. The head of fraud owns rule changes."), ("Monitor and test", "Success rate by route every five minutes. Prove the standby route carries peak volume, not a test transaction.")]),
        ("shield", "General insurer", "Claims supplier hit by ransomware during a storm", [("The disruption", "The claims platform is offline as storm claims peak. Brokers and the supervisor need telling early."), ("Where it goes wrong", "Claims taken by hand go missing, and vulnerable customers wait in the same queue."), ("Who decides", "The claims director invokes manual intake. Compliance leads on any data breach, which brings separate duties."), ("Monitor and test", "Manual claims logged centrally and reconciled daily. Rehearse a week of claims by hand and count what breaks.")])], "Prove it")
    b.steps("Testing and evidence", "Test the severe days, then write it down", "What the FCA's review of 2025 self-assessments rewards, turned into six steps.", [
        ("Choose scenarios that could break you", f"Vary the nature, severity and duration. The FCA questions self-assessments that claim no scenario could defeat the firm without severe testing to show it.{R('fca1y')}"),
        ("Include communications in every test", "Declare email and chat unavailable. Time how long it takes to reach the team, the customer channels and the supervisor."),
        ("Run the tolerance clock", "Record the start, each decision and the point of recovery against the tolerance for every affected service."),
        ("Plan for a breach", f"Where a scenario would breach a tolerance, document the longer-term remediation plan, with owners and dates.{R('fca1y')}"),
        ("Make the self-assessment decision-ready", f"Add confidence ratings, second and third line input, and a clear ask of the board, which must review and approve it.{R('fca1y', 'ss121')}"),
        ("Learn from real incidents", "Use 20 October as a case study. Map which of your services would have been hit, and how you would have known.")], "Prove it")
    b.exercise("Tabletop exercise", "Region down on payday: a three-hour tabletop", "A ready-to-run exercise built on the scenario in this playbook. Run it with the people who would really be called, and keep email and chat out of the room.",
        [("Duration", "Three hours, including a 30-minute debrief"), ("Participants", "Executive on call, SMF holder, incident, IT, comms, compliance, supplier leads"), ("Objective", "Keep card payments within tolerance without email or chat"), ("Facilitator", "Head of resilience, with an independent observer")], [
        ("07:00", "Card authorisations and app logins fail. Email and chat are declared unavailable for two hours.", "How do we reach the team? Who declares, and when did the tolerance clock start?"),
        ("07:20", "The provider status page still shows no incident. Contact centre waits pass 30 minutes.", "What do customers hear now, on which channels, and who approves it?"),
        ("07:50", "Failover to the second region is ready, but has never been run at peak volume.", "Who decides? What is the risk to data integrity, and who is told?"),
        ("08:30", "Rerouted payments start failing fraud checks. A journalist asks if customer data is affected.", "Who can change fraud rules? What can we say, and what must we not say?"),
        ("09:30", "Forecast recovery for card payments now runs past the impact tolerance.", "Who escalates to the executive and the SMF holder? What does the supervisor hear, and when?"),
        ("11:00", "Services are back. Many customers missed payments or were charged twice.", "How do we find them, put it right and record it for the review?")], "Prove it",
        note="Measure four things: time to reach the full team, time to the first customer message, time to the supervisor call, and decisions logged with an owner. Put the results and the gaps into the self-assessment.")
    b.pir("Post-incident review", "Post-incident review template", "Hold it soon, ideally within two weeks, while memories and logs are fresh. Blame-free, evidence-led and measured against the tolerance.", [
        ("The tolerance timeline", "When did harm start for customers, and when was it detected, declared and recovered? How close did each service come to its tolerance?"),
        ("Detection and declaration", "What told us first: monitoring, customers or the supplier? How long from first signal to declaration?"),
        ("Decisions and decision rights", "Which decisions were made, by whom, on what information? Did any wait for someone with authority?"),
        ("Reaching people", "How long to reach the response team out of band? Who could not be reached, and why?"),
        ("Customers and vulnerability", "What were customers told, when and where? Who needed urgent help, and did they get it?"),
        ("Third parties", "When did suppliers tell us, and what did they give us? Did a supplier's own supplier play a part?"),
        ("Regulatory reporting", "Which notifications were made, to whom, and were the clocks met? What follow-up is due?"),
        ("Actions and self-assessment", "What changes, who owns it and by when? What does this mean for our tolerances and self-assessment?")], "Prove it")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("This week", "Check that the response team can be reached without corporate email or chat. Print the bridge number and supervisor contacts into the plan.", "Head of resilience"),
        ("This week", "List every important business service that depends on a single cloud region or zone, including through suppliers.", "CIO or CTO"),
        ("This month", "Agree the severity ladder and first-hour roles. Load the six message templates and their sign-off rules.", "Head of resilience, communications lead"),
        ("This month", "Ask material suppliers how they notify you, how fast, and where their own dependencies sit.", "Third-party risk lead"),
        ("This quarter", "Run a severe scenario with communications channels unavailable. Time it against tolerance and record the evidence.", "Head of resilience"),
        ("This quarter", "Map incident reporting to the FCA and PRA rules that apply from 18 March 2027, and to DORA for EU entities.", "Chief risk officer, compliance")], "Prove it", "30mm 1fr 46mm")

    # ------------------------------------------------------------------ tools
    b.mark("", "Questions, checklist and templates")
    b.questions("For leaders", "Questions for your executive committee", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["If our cloud region failed at 07:00 tomorrow, which important business services would breach tolerance first?", "Could we reach the whole response team in ten minutes without email or chat?", "Who is authorised to send the first customer message, and how fast?"]),
        ("Evidence", ["Which scenario in our last test came closest to breaching a tolerance, and what are we doing about it?", "Did our last test include communications, suppliers and the supervisor call?", "Would our self-assessment convince a sceptical board member?"])], "Tools and templates")
    b.checklist("Checklist", "Are you ready to stay within tolerance?", "Tick what is true today. Anything blank is your next action.", [
        ("Important business services and tolerances approved by the board", "Reviewed in the last twelve months or after material change."),
        ("Every service mapped to people, systems and suppliers", "Including the cloud region and zone, and key fourth parties."),
        ("Severity ladder agreed and out-of-band alerting tested", "The team reachable without corporate email, chat or single sign-on."),
        ("Message templates loaded", "For customers, staff, supervisors, suppliers and the media, with sign-off rules."),
        ("Regulatory reporting clocks known", "Current rules, PSP four-hour reports, the 2027 regime and DORA where relevant."),
        ("Severe scenario tested this year", "With communications included and timings recorded against tolerance."),
        ("Self-assessment evidence ready", "Confidence ratings, remediation owners and second line challenge.")], "Tools and templates")
    b.form("Notification log", "Supervisor, supplier and scheme notification log", "One line for every notification made or received during the incident, so nobody has to rebuild who was told what from inboxes afterwards.",
        [("Time", 0.8), ("To or from", 1.4), ("Channel", 1), ("What was said", 2.6), ("Reference", 1), ("Next update due", 1), ("By", 1)], "Tools and templates", rows=11,
        example=("08:00", "FCA and PRA supervisors", "Phone, then email", "Card payments disrupted since 07:00; about [n] customers; cause under investigation", "Call note 3", "09:00", "Regulatory lead"),
        note=f"Illustrative example row. Formal reports follow the rules that apply to your firm: payment firms report a major incident within 4 hours of detecting it, and from 18 March 2027 most firms report within 24 hours of determining that a threshold is met.{R('ps262')} EU entities also follow DORA.")
    b.glossary("Words worth knowing", [
        ("Important business service", "A service provided to an external user which, if disrupted, could cause intolerable harm or risk to the firm or the wider system."),
        ("Impact tolerance", "The maximum tolerable level of disruption to an important business service, always including a time metric."),
        ("Mapping", "Identifying the people, processes, technology, facilities and information that support each important business service."),
        ("Severe but plausible scenario", "A demanding but realistic disruption used to test whether a firm can stay within tolerance."),
        ("Self-assessment", "The written record of a firm's compliance with the resilience rules, reviewed and approved by the board."),
        ("Critical third party", "A provider designated by HM Treasury whose services, if disrupted, could threaten UK financial stability or confidence."),
        ("Availability zone", "An isolated location within a cloud region, with its own power and networking."),
        ("Out-of-band", "A communication route that does not rely on the systems affected by the incident."),
        ("DORA", "The EU Digital Operational Resilience Act, applying to EU financial entities from 17 January 2025."),
        ("Material third party arrangement", "A supplier arrangement whose disruption could seriously affect a firm, which must be notified and registered under the 2027 regime.")])

    b.platform("How the modules work together in a financial services incident", "The cloud outage in this playbook, one module at a time, in the order the incident runs. Crises Control supports your plan; it does not replace it.", [
        ("A branch colleague reports customers cannot pay by card, with their location where supported, in one touch.", "SOS"),
        ("The incident team, executive on call and SMF holder are reached by SMS, voice and push; silence escalates to deputies.", "Ping"),
        ("Card payments is declared against its impact tolerance, with roles, the bridge and the decision log in one workspace.", "Incident Manager"),
        ("Failover, workarounds, customer messages and the supervisor call run as owned tasks with deadlines and escalation.", "Task Manager"),
        ("The executive sees tasks, acknowledgements and time left against tolerance without asking for a briefing.", "Control Centre"),
        ("A timestamped record of decisions and messages supports the incident report, the review and the self-assessment.", "Audit & Reporting"),
        ("CRAiG helps the incident lead find who has not responded and which tasks are still outstanding.", "CRAiG")])

    b.mark("", "Sources")
    src = {
        "gcp": "Google Cloud, Incident report: Multiple services were experiencing issues in the europe-west2 region (incident Xs2XTHzAVC9YnafnPyzj), preliminary report 22 October 2026, final report 4 November 2026, https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj",
        "reuters": "Reuters via Yahoo Finance, Europe's financial regulators query Google over cloud outage that hit banks, 21 October 2026, https://finance.yahoo.com/technology/articles/europes-financial-regulators-query-google-154104572.html",
        "yahoo": "Yahoo Finance UK, Power outage hits Google Cloud services, disrupting UK banks, 20 October 2026, https://uk.finance.yahoo.com/news/power-outage-hits-google-cloud-141629539.html",
        "hmt": "HM Treasury, UK financial system strengthened with new safeguards for major technology providers, 10 July 2026; and The Critical Third Parties (Designation) Regulations 2026 (SI 2026/777), https://www.gov.uk/government/news/uk-financial-system-strengthened-with-new-safeguards-for-major-technology-providers",
        "ps213": "FCA, PS21/3: Building operational resilience, 29 March 2021, https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience",
        "ss121": "PRA, SS1/21 Operational resilience: Impact tolerances for important business services, March 2021 (updated), https://www.bankofengland.co.uk/prudential-regulation/publication/2021/march/operational-resilience-impact-tolerances-for-important-business-services-ss",
        "fca1y": "FCA, Operational resilience: insights and observations one year on, 27 March 2026, https://www.fca.org.uk/publications/good-and-poor-practice/operational-resilience-insights-observations-one-year",
        "ps262": "FCA, PS26/2: Operational incident and third party reporting, 18 March 2026 (rules apply from 18 March 2027), https://www.fca.org.uk/publication/policy/ps26-2.pdf",
        "boe": "Bank of England, PRA and FCA, UK financial regulators to begin overseeing Critical Third Parties announced by HM Treasury, 10 July 2026, https://www.bankofengland.co.uk/news/2026/july/uk-financial-regulators-to-begin-overseeing-critical-third-parties-announced-by-hmt",
    }
    assert set(order) == set(src), (set(src) - set(order), set(order) - set(src))
    items = sorted((order[k], t) for k, t in src.items())
    b.sources([(f"{n:02d}", t) for n, t in items], "Sources were accessed in November 2026. Scenarios, templates and timings in this playbook are illustrative and should be adapted to your firm.")
    b.art_back("Stay within tolerance<br>on the worst day.", "Crises Control helps banks, insurers, payment and investment firms reach the right people in minutes, run the response from one place and keep the evidence supervisors ask for.", "Request a demo",
        next_title="Intelligence report No. 01 · Resilience, regulated")
    return b
