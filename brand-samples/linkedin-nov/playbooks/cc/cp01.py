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
    b.opener("01", "Know your<br>limits.", "Before a crisis, decide which services matter most and how much disruption is too much.", [("01", "Services, tolerances and mapping"), ("02", "Important business services by firm type"), ("03", "A severity ladder for financial services")])
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
    b.severity("Severity", "A severity ladder for financial services", "Agree the triggers in advance so nobody debates the level while customers wait. If in doubt, declare higher and step down.", [
        (1, "Critical", "An important business service is down or badly degraded and its impact tolerance is at risk. Customers cannot pay, be paid, reach cash or make a claim. Data integrity in doubt, or a suspected cyber attack on core systems.", "Crisis team, executive on call, regulatory lead and communications lead. Board chair informed.", "Push, SMS, voice call · escalate after 5 minutes"),
        (2, "Major", "An important business service is degraded but a tested workaround is holding. One channel is down, such as the app but not cards. A material supplier declares an incident.", "Incident team, service owners, supplier manager. Communications lead on standby.", "Push and SMS · bridge opened"),
        (3, "Moderate", "Internal system failure with little or no customer impact. Failover worked as designed. Elevated error rates under investigation.", "Technology on call and the service owner.", "Push and email"),
        (4, "Watch", "Supplier advisory, risky change window, severe weather warning or a peak day such as payday or month end ahead.", "Duty manager logs it and briefs the next shift.", "Email and incident log")], "Know your limits")

    # ------------------------------------------------------------------ PART 02
    b.mark("02", "The first hour")
    b.opener("02", "The first<br>hour.", "What happens in the first sixty minutes decides whether you stay within tolerance.", [("01", "A T+ timeline for a cloud outage"), ("02", "When email and chat are down too"), ("03", "Messages for customers, staff and regulators")])
    b.firsthour("First hour", "A cloud zone fails at 07:00 on a weekday", "A realistic sequence for a bank or payment firm whose app and card services depend on one cloud region. Owners are roles, not job titles.", [
        ("T+00:00", "Alarms and complaints arrive together", "Monitoring shows failed card authorisations and app logins. The contact centre and social channels light up at the same time.", "Duty incident manager", 1),
        ("T+00:05", "Declare and page out of band", "Declare SEV1 provisionally. Page the response team by SMS and voice, not corporate email or chat, which may share the failed dependency.", "Duty incident manager", 1),
        ("T+00:10", "Open the bridge, assign roles", "Incident lead, technology lead, communications lead, regulatory lead, supplier lead and a scribe. One decision log from now on.", "Incident lead", 1),
        ("T+00:15", "Call the provider, do not wait for it", f"Raise a priority case and use your account contacts. On 20 October the first public update came about two and a half hours after impact began.{R('gcp')}", "Supplier lead", 2),
        ("T+00:20", "Start the tolerance clock", "Name each important business service affected, record the start time and estimate customers and payments at risk.", "Service owners", 1),
        ("T+00:30", "First word to customers", "Holding message on the app, website and social channels. Contact centre script live. Flag vulnerable customers who need cash or urgent payments.", "Communications lead", 2),
        ("T+00:45", "Decide on failover", "Invoke the tested move to another zone or region, or manual workarounds. Protect data integrity: a fast restore that corrupts records is worse.", "Technology lead", 1),
        ("T+01:00", "Tell the supervisor", f"Early informal contact with your FCA and PRA supervisors. Payment service providers must report a major incident within 4 hours of first detecting it.{R('ps262')}", "Regulatory lead", 2)], "The first hour")
    b.essay("Out of band", "When email and chat go down with everything else", [
        f"The FCA's March 2026 review found firms often had not considered in detail the alternatives or workarounds when their usual communication channels are unavailable, and little evidence that communications strategies are tested in scenario exercises.{R('fca1y')}",
        "In a cloud or identity outage, the tools a firm uses to coordinate may be the first casualties. If email, chat, the intranet and the incident ticketing system all sign in through the same identity provider or sit in the same cloud region, the response team cannot reach each other at the moment they most need to.",
        "Out-of-band means a route that shares no critical dependency with the systems that have failed. In practice that is a combination: a mass notification service hosted separately from your estate, SMS and voice to personal and work mobiles, a fixed conference bridge with numbers printed in the plan, and an offline copy of contact lists and runbooks.",
        "Test it the way it would fail. Run an exercise in which email and chat are declared unavailable for the first two hours. Measure how long it takes to reach the full response team, how many acknowledge, and who you could not reach at all.",
        "The same thinking applies to customers. If the app is the channel that is down, the app banner cannot carry the message. Agree in advance which channels carry customer updates when the main one fails: the website status page, social accounts, SMS, branch staff, and the contact centre's recorded message.",
        "Finally, keep the regulator's contact details outside your normal systems. A supervisor's mobile number in a locked mailbox helps nobody."],
        "Out of band", "Out-of-band means a route that shares no critical dependency with the systems that have failed.")
    b.messages("Templates", "Six messages ready to send", "Fill the brackets, keep the facts you have confirmed and nothing more. Agree sign-off rules in advance so messages are not held up.", [
        ("SMS", "Response team", "SEV1 declared 07:05. Cards and app down. Join bridge now: [number] PIN [pin]. Do not use email or Teams. Reply 1 to confirm, 2 if unavailable.", "Escalate by voice call to the deputy if no reply in 5 minutes."),
        ("App banner and web", "Customers", "Some customers can't use our app or make card payments right now. We're working to fix this. We'll update you here by [time]. We're sorry for the disruption.", "Only add that money is safe once the technology lead has confirmed it."),
        ("Email and phone", "FCA and PRA supervisors", "Initial notice: since [time] we have an operational incident affecting [service]. Early indications point to a third-party cloud disruption. Estimated customers affected: [n]. Tolerance [x] hours, [y] elapsed. Next update by [time]. Contact: [name, mobile].", "Formal reports follow the applicable rules and clocks."),
        ("SMS", "Branch and contact centre", "Cards and app disrupted. Use script v3. Don't speculate on cause. Log customers who need urgent cash or payments. Next brief [time].", "Gives frontline staff a consistent answer within minutes."),
        ("Email", "Critical supplier", "We have declared a SEV1 affecting [service] since [time]. Within 15 minutes please confirm scope, your reference, a named engineer, an ETA and any workaround.", "Copy the contract owner. Record every reply in the decision log."),
        ("Statement", "Media holding line", "We're aware some customers are having difficulty using our app and cards this morning. We're working to restore services as quickly as possible and will share updates on our website. We apologise to customers affected.", "Do not name a supplier or a cause until confirmed.")], "The first hour")
    b.compare("Customers and regulators", "Telling customers and regulators: what good looks like", "Most criticism after an outage is about silence and confusion, not the fault itself.", ["Moment", "What often happens", "What good looks like"], [
        ("First 30 minutes", "Silence while engineers diagnose the problem.", "A holding message on every channel you still control, within 30 minutes."),
        ("Supervisors", "First call made only once the cause is known.", f"An early heads-up, then formal reports to the clock. From 18 March 2027 most firms report within 24 hours of determining that a threshold is met.{R('ps262')}"),
        ("Vulnerable customers", "One generic message for everyone.", "Priority help for those who cannot reach cash, pay rent or complete a purchase that day."),
        ("Cause", "Early speculation, or blaming a supplier.", "Say what you know and what customers should do. Name the cause only when confirmed."),
        ("Updates", "Irregular, and only when there is news.", "A fixed cadence, such as every 60 minutes, even when nothing has changed."),
        ("Afterwards", "Close quietly and move on.", "Explain what happened, put right any financial loss and share the lessons.")], "The first hour")

    # ------------------------------------------------------------------ PART 03
    b.mark("03", "Prove it")
    b.opener("03", "Prove<br>it.", "Map what you depend on, test the severe days and keep the evidence a board can rely on.", [("01", "Where concentration hides"), ("02", "Three scenarios to test"), ("03", "Evidence and your 90-day plan")])
    b.figpage("Concentration", "Five places concentration hides", f"The UK designated four cloud providers as critical third parties in July 2026. Regulated firms remain responsible for managing their own third-party arrangements.{R('hmt', 'boe')}", "hub", [
        ("One region, one zone", "Services described as resilient may still run in a single zone, or rely on regional control systems that a zone failure can disrupt."),
        ("Shared tooling", "Email, chat, identity and incident tooling often sit with the same provider as production. One outage removes both the service and the means to coordinate."),
        ("Your suppliers' suppliers", "A claims platform or core banking SaaS may run in the same cloud region you chose to avoid."),
        ("Payments chains", "Processors, scheme connections and fraud engines are single points of failure unless each has a tested alternative."),
        ("People in one place", f"The FCA notes firms reducing risk from staff concentrated in single locations. Check where key teams and their deputies sit.{R('fca1y')}")], "Prove it")
    b.usecase("Scenarios", "Three severe but plausible days to rehearse", [
        ("server", "Retail bank", "A cloud zone fails at 07:00 on payday", [("The disruption", "App, card payments and online transfers degrade across the region, not just the failed zone."), ("The first hour", "SEV1 by SMS and voice, bridge open, customer holding message by T+00:30, supervisor called by T+01:00."), ("The test", "Fail over to another region in a live-like environment and time it against the tolerance."), ("Watch out", "Corporate email and chat run in the same region. Run the exercise without them.")]),
        ("transfer", "Payments and e-money firm", "Card processor outage on Black Friday", [("The disruption", "Authorisations fail for 40 minutes at peak. Customers are stranded at tills and fuel pumps."), ("The first hour", "Switch to the standby route or stand-in processing, push in-app guidance, report within 4 hours as a PSP."), ("The test", "Prove the standby route carries peak volume, not just a test transaction."), ("Watch out", "Fraud rules may block legitimate payments once traffic moves.")]),
        ("shield", "General insurer", "Claims supplier hit by ransomware during a storm", [("The disruption", "The claims platform is offline just as storm claims peak. Policyholders cannot report damage."), ("The first hour", "Activate a manual intake script, extend contact centre hours, tell brokers and the supervisor."), ("The test", "Run a week of claims on paper and spreadsheets in a tabletop and count what breaks."), ("Watch out", "Customer data may be compromised, which brings separate notification duties.")])], "Prove it")
    b.steps("Testing and evidence", "Test the severe days, then write it down", "What the FCA's review of 2025 self-assessments rewards, turned into six steps.", [
        ("Choose scenarios that could break you", f"Vary the nature, severity and duration. The FCA questions self-assessments that claim no scenario could defeat the firm without severe testing to show it.{R('fca1y')}"),
        ("Include communications in every test", "Declare email and chat unavailable. Time how long it takes to reach the team, the customer channels and the supervisor."),
        ("Run the tolerance clock", "Record the start, each decision and the point of recovery against the tolerance for every affected service."),
        ("Plan for a breach", f"Where a scenario would breach a tolerance, document the longer-term remediation plan, with owners and dates.{R('fca1y')}"),
        ("Make the self-assessment decision-ready", f"Add confidence ratings, second and third line input, and a clear ask of the board, which must review and approve it.{R('fca1y', 'ss121')}"),
        ("Learn from real incidents", "Use 20 October as a case study. Map which of your services would have been hit, and how you would have known.")], "Prove it")
    b.table("Your plan", "This week, this month, this quarter", "Owners are suggestions. Adjust them to your structure.", ["When", "Actions", "Owner"], [
        ("This week", "Check that the response team can be reached without corporate email or chat. Print the bridge number and supervisor contacts into the plan.", "Head of resilience"),
        ("This week", "List every important business service that depends on a single cloud region or zone, including through suppliers.", "CIO or CTO"),
        ("This month", "Agree the severity ladder and first-hour roles. Load the six message templates and their sign-off rules.", "Head of resilience, communications lead"),
        ("This month", "Ask material suppliers how they notify you, how fast, and where their own dependencies sit.", "Third-party risk lead"),
        ("This quarter", "Run a severe scenario with communications channels unavailable. Time it against tolerance and record the evidence.", "Head of resilience"),
        ("This quarter", "Map incident reporting to the FCA and PRA rules that apply from 18 March 2027, and to DORA for EU entities.", "Chief risk officer, compliance")], "Prove it", "30mm 1fr 46mm")

    # ------------------------------------------------------------------ tools
    b.mark("", "Questions and checklist")
    b.questions("For leaders", "Questions for your executive committee", "Ask them out loud. Vague answers are the finding.", [
        ("Readiness", ["If our cloud region failed at 07:00 tomorrow, which important business services would breach tolerance first?", "Could we reach the whole response team in ten minutes without email or chat?", "Who is authorised to send the first customer message, and how fast?"]),
        ("Evidence", ["Which scenario in our last test came closest to breaching a tolerance, and what are we doing about it?", "Did our last test include communications, suppliers and the supervisor call?", "Would our self-assessment convince a sceptical board member?"])], "Questions and checklist")
    b.checklist("Checklist", "Are you ready to stay within tolerance?", "Tick what is true today. Anything blank is your next action.", [
        ("Important business services and tolerances approved by the board", "Reviewed in the last twelve months or after material change."),
        ("Every service mapped to people, systems and suppliers", "Including the cloud region and zone, and key fourth parties."),
        ("Severity ladder agreed and used", "With triggers specific to your services and peak days."),
        ("Out-of-band alerting tested", "The response team reachable without corporate email, chat or single sign-on."),
        ("Message templates loaded", "For customers, staff, supervisors, suppliers and the media, with sign-off rules."),
        ("Regulatory reporting clocks known", "Current rules, PSP four-hour reports, the 2027 regime and DORA where relevant."),
        ("Severe scenario tested this year", "With communications included and timings recorded against tolerance."),
        ("Self-assessment evidence ready", "Confidence ratings, remediation owners and second line challenge.")], "Questions and checklist")
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

    b.platform("Where Crises Control fits", "Seven steps in this playbook, and the modules that support them. Crises Control supports your plan; it does not replace it.", [
        ("Page the response team by SMS, voice and push when email and chat are down, and escalate to deputies when nobody acknowledges.", "Ping"),
        ("Run one workspace per incident, with the bridge, decision log and approved message templates in one place.", "Incident Manager"),
        ("Turn failover and manual workaround runbooks into tasks with owners, deadlines and escalation.", "Task Manager"),
        ("Watch tasks, communications and escalations live against the tolerance clock for each affected service.", "Control Centre"),
        ("Keep timestamped timelines as evidence for supervisors, the post-incident review and the self-assessment.", "Audit Trail"),
        ("Let branch and frontline staff raise an urgent issue with their location in one touch.", "SOS"),
        ("Draft role-specific updates for customers, staff and supervisors, then review before sending.", "CRAiG")])

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
