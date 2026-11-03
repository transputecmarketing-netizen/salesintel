from rkit import RBook, S

SRC = {
    "bill": "UK Parliament, Cyber Security and Resilience (NIS) Bill: stages and publications, 2025 to 2026, https://bills.parliament.uk/bills/4035",
    "wms": "UK Parliament, Written statement HLWS365, Artificial Intelligence Policy (Cabinet Office), 12 October 2026, https://questions-statements.parliament.uk/written-statements/detail/2026-10-12/hlws365",
    "rep": "Hansard (HL), Cyber Security and Resilience Bill, Report stage, 26 October 2026, https://hansard.parliament.uk/Lords/2026-10-26/debates/B413EFAE-E7D4-4742-986D-092884E0D8D1/CyberSecurityAndResilienceNetworkAndInformationSystemsBill",
    "hl62": "UK Parliament, HL Bill 62 (as amended on Report), 26 October 2026, https://bills.parliament.uk/publications/68323/documents/8980",
    "3r": "Hansard (HL), Cyber Security and Resilience Bill, Third Reading, 2 November 2026, https://hansard.parliament.uk/Lords/2026-11-02/debates/9A654131-98CE-48C2-86D6-65BFA9A71414/CyberSecurityAndResilienceNetworkAndInformationSystemsBill",
    "fs": "GOV.UK (DSIT), Cyber Security and Resilience Bill factsheets: Summary of the Bill; Relevant managed service providers; Data centres; Incident reporting; Enforcement; Designating critical suppliers, updated 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets",
    "agent": "GOV.UK, Agentic AI resilience measures (bill factsheet), 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/agentic-ai-resilience-measures",
    "pr25": "GOV.UK (DSIT), Tough new laws to strengthen the UK's defences against cyber attacks on NHS, transport and energy, 12 November 2025, https://www.gov.uk/government/news/tough-new-laws-to-strengthen-the-uks-defences-against-cyber-attacks-on-nhs-transport-and-energy",
    "pr26": "GOV.UK, Britain steps up national defences against growing AI risks, 12 October 2026, https://www.gov.uk/government/news/britain-steps-up-national-defences-against-growing-ai-risks",
    "reg": "The Register, UK keeps AI safeguards in the maybe pile for Cyber Security Bill, 15 October 2026, https://www.theregister.com/ai-and-ml/2026/10/15/uk-keeps-ai-safeguards-in-the-maybe-pile-for-cyber-security-bill/5303026",
    "nis2": "Official Journal of the EU, Directive (EU) 2022/2555 (NIS2), OJ L 333, 27 December 2022, Articles 20, 23, 34 and Annex I, https://eur-lex.europa.eu/eli/dir/2022/2555/oj (text checked via springlex.eu)",
    "ec": "European Commission, NIS2 Directive policy page, 2026, https://digital-strategy.ec.europa.eu/en/policies/nis2-directive",
    "cgc": "GOV.UK (DSIT), Cyber Governance Code of Practice, April 2025, https://www.gov.uk/government/publications/cyber-governance-code-of-practice",
}
ORDER = []
ALIAS = {k: "fs" for k in ("sum", "msp", "dc", "ir", "enf", "cs")}
def C(*keys):
    keys = list(dict.fromkeys(ALIAS.get(k, k) for k in keys))
    for k in keys:
        if k not in ORDER: ORDER.append(k)
    return S(*[ORDER.index(k) + 1 for k in keys])


def build():
    ORDER.clear()
    b = RBook("When Agents Go Rogue", 3, "contour", "drawer")
    b.how = "How the UK's cyber resilience bill reached its final stages, what the late AI amendments actually do, what is settled and what is still a proposal, and what it means for UK organisations and the suppliers they rely on."
    b.rep_cover("Intelligence report · UK cyber law and AI", "When agents<br>go rogue.",
        "The Cyber Security and Resilience Bill has cleared the Lords with new powers over AI agents that slip out of human control. Here is what is now in the text, what is still only proposed, and what it means for you and your suppliers.", "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("A cyber bill that started without AI is ending with it, but most of the detail is still to come.", [
        f"The Cyber Security and Resilience (Network and Information Systems) Bill was introduced on 12 November 2025 to update the UK's 2018 NIS Regulations.{C('bill','pr25')} It passed its Lords Third Reading on 2 November 2026 and has gone back to the Commons to consider Lords amendments.{C('3r')} No date for Royal Assent has been set.",
        f"The headline changes for most businesses are about scope and speed. Medium and large managed service providers (MSPs) and data centres above set thresholds come into the regime, regulators can designate critical suppliers, and significant incidents must be notified within 24 hours with a fuller report within 72 hours.{C('sum','ir')}",
        f"AI arrived late. On 12 October 2026 the government said it was considering how the regime could be strengthened against AI cyber and loss of control risks.{C('wms')} On 26 October peers agreed a government amendment that lets future regulations give the Secretary of State inspection and information powers where a compromise may be caused by loss of oversight or control of an AI agent.{C('rep','hl62')}",
        f"Much is still proposed rather than settled. The AI powers only bite once regulations are consulted on and approved.{C('agent')} Peers also inserted, against the government, a recurring review of the regime that must consider frontier AI and the powers of the AI Security Institute. The Commons may yet change or remove it.{C('rep')}"],
        "Do not wait for Royal Assent. If you run essential services, provide managed IT or host infrastructure, or depend on someone who does, the regime will reach you. Prepare now for 24 hour reporting, supplier evidence and logs that show what your AI agents did.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence shows", [
        ("The bill is close to the finish line, but not over it.", f"The Lords completed all stages on 2 November 2026 and returned the bill to the Commons with amendments, including two the government opposed.{C('3r','rep')}"),
        ("Scope widens to the supply chain.", f"Medium and large MSPs come into scope under the Information Commission, data centres under Ofcom, and regulators can designate critical suppliers.{C('msp','dc','cs')}"),
        ("Reporting gets faster and wider.", f"Initial notice within 24 hours and a full report within 72 hours, with the NCSC informed at the same time, and affected customers told and kept updated.{C('ir')}"),
        ("AI agent powers are enabling, not yet operative.", f"The new clause on loss of control of an AI agent lets regulations confer inspection, search and information powers. The detail, including what counts as an AI agent, comes later.{C('hl62','agent')}"),
        ("Peers rejected direct duties on AI developers.", f"A cross-party amendment requiring frontier AI developers to report incidents in 24 hours was defeated by 165 votes to 95.{C('rep')}"),
        ("A recurring scope review was forced on the government.", f"Amendment 163, agreed by 202 to 155, requires a review within 12 months of passing and further reviews at intervals of not more than 12 months.{C('rep','hl62')}"),
        ("Penalties now track turnover.", f"Serious breaches can attract up to £17 million or 4% of worldwide turnover, whichever is higher.{C('enf')}")])

    b.facts("The bill in six numbers", "Every figure is drawn from Parliament or GOV.UK.", [
        ("24h / 72h", f"Initial incident notification, then a full report, to the regulator with the NCSC sighted.{C('ir')}"),
        ("4%", f"Of worldwide turnover, or £17 million if higher, for the most serious breaches.{C('enf')}"),
        ("1 MW", f"Rated IT load at which a data centre comes into scope. Enterprise data centres: 10 MW.{C('dc')}"),
        ("3 months", f"For a relevant MSP to register with the Information Commission once the rules commence.{C('msp')}"),
        ("165 to 95", f"Lords vote rejecting reporting duties on frontier AI developers, 26 October 2026.{C('rep')}"),
        ("202 to 155", f"Lords vote inserting a recurring review covering frontier AI and AISI powers.{C('rep')}")], "At a glance")

    b.mark("", "Timeline")
    b.timeline("From a 2018 regime to an AI-era bill", "The key dates on the bill's path through Parliament.", [
        ("12 Nov 2025", "Bill introduced", f"First reading in the Commons. Government says MSPs will be regulated for the first time.{C('bill','pr25')}"),
        ("6 Jan 2026", "Commons second reading", f"Bill approved in principle and carried over into the next session.{C('bill')}"),
        ("16 Jun 2026", "Commons completes", f"Report stage and Third Reading on the same day after reintroduction in May.{C('bill')}"),
        ("1 to 7 Sep 2026", "Lords committee", f"Three committee days. Peers press repeatedly on the absence of AI in the text.{C('bill','rep')}"),
        ("12 Oct 2026", "AI written statement", f"Government says it is considering how to strengthen the regime against AI cyber and loss of control risks.{C('wms','pr26')}"),
        ("26 Oct 2026", "Lords Report", f"AI agent clause agreed. Developer reporting rejected. Recurring review and foreign powers register inserted against the government.{C('rep')}"),
        ("2 Nov 2026", "Lords Third Reading", f"Technical amendments agreed and the bill returned to the Commons.{C('3r')}"),
        ("3 Nov 2026", "Factsheets updated", f"GOV.UK publishes an agentic AI factsheet setting out four intended measures.{C('agent')}")])

    # ---------- Part 01
    b.mark("01", "The bill's journey")
    b.opener("01", "The long<br>road.", "Why the UK is rewriting its cyber resilience law, and who it now reaches.", [("01", "From NIS 2018 to the new bill"), ("02", "What is settled and what is not"), ("03", "How suppliers come into scope")])
    b.essay("The bill's journey", "A 2018 law meets a supply chain problem", [
        f"The NIS Regulations 2018 were the UK's only cross-sector cyber law. They covered operators of essential services in energy, transport, health, drinking water and digital infrastructure, plus some digital services such as cloud computing.{C('sum')} The government's own case for reform is that the threat moved faster than the rules.",
        f"Attackers increasingly go through suppliers. The government cites the June 2024 attack on Synnovis, a pathology supplier to the NHS, which disrupted more than 11,000 appointments and operations, with estimated losses of £32.7 million.{C('cs')} It also cites a May 2024 incident involving an MSP that exposed payroll data on around 270,000 armed forces personnel.{C('msp')}",
        f"The bill answers with three pillars: wider scope, more effective regulators and new powers for the government to act.{C('sum')} The scope pillar is the one most businesses will feel. MSPs, data centres, large load controllers and designated critical suppliers all come in.",
        f"It is also a framework bill. Most measures, including data centre duties, MSP duties, incident reporting and critical suppliers, start only when secondary legislation is made after Royal Assent.{C('sum')} That is why parts of the regime remain unclear even at this late stage.",
        f"That design shaped the AI debate. Peers argued throughout that a bill with cyber security in its title was silent on AI.{C('rep')} The government's answer was to add a power that future regulations can use, rather than detailed rules in the bill itself.",
        f"Regulators stay sector based. Twelve competent authorities oversee the regime, with the Information Commission for MSPs and digital services and Ofcom for data centres.{C('sum')} Expect differences in emphasis between sectors."],
        "The pull quote", "Most of the duties that matter start with secondary legislation, not with Royal Assent.")
    b.table("Settled and unsettled", "What is in the text, and what still depends on regulations", "Status as of 3 November 2026. The Commons can still amend Lords changes.", ["Measure", "Status", "What to watch"],
        [("MSPs in scope", f"In the bill. Medium and large firms; duties start via regulations.{C('msp')}", "Security requirements and incident thresholds in secondary legislation."),
         ("Data centres", f"In the bill. 1 MW threshold, 10 MW for enterprise sites.{C('dc')}", "Ofcom guidance and the code of practice."),
         ("24h and 72h reporting", f"In the bill; commences via regulations.{C('ir')}", "What counts as significant in each sector."),
         ("Customer notification", f"In the bill, strengthened on Report to cover ongoing updates.{C('rep')}", "How fast and how detailed updates must be."),
         ("AI agent powers", f"Enabling clause agreed on Report.{C('hl62')}", "Consultation on definitions and the four measures."),
         ("Recurring review", f"Inserted on Report against the government.{C('rep')}", "Whether the Commons keeps, changes or removes it.")], "The bill's journey", widths="34mm 1fr 1fr")
    b.figpage("How scope works", "How the regime reaches a business", "The bill regulates essential services, then follows the supply chain.", "hub",
        [("Directly, as an essential service", f"Energy, transport, health, water and digital infrastructure operators, plus cloud and similar services. Data centres above 1 MW join them.{C('sum','dc')}"),
         ("As a relevant managed service provider", f"A medium or large firm managing a customer's IT under contract, with access to its systems. Software sales and one-off installs are out.{C('msp')}"),
         ("As a designated critical supplier", f"A regulator can designate a supplier, even a small one, whose disruption could significantly harm the economy or society.{C('cs')}"),
         ("Through contracts, as a customer", f"Regulated firms will push security and reporting terms down to suppliers. Most organisations will feel the bill this way.")], "The bill's journey")

    # ---------- Part 02
    b.mark("02", "The AI amendments")
    b.opener("02", "The AI<br>clause.", "How a bill with no AI in it gained powers over AI agents in the space of a fortnight.", [("01", "From statement to amendment"), ("02", "How the agent power would work"), ("03", "The UK against NIS2")])
    b.essay("The AI amendments", "Two weeks from 'considering' to a new clause", [
        f"On 12 October 2026 the government told Parliament that, given how fast AI capabilities are advancing, it was considering how the regime could be strengthened so that AI cyber and loss of control risks are better understood. It named near miss reporting and learning from AI incidents as examples.{C('wms')}",
        f"The accompanying announcement described loss of control as autonomous AI systems evading human oversight.{C('pr26')} Three days later, The Register reported officials telling MPs they were still looking at whether the bill was the right vehicle.{C('reg')}",
        f"By Report stage on 26 October the government had tabled Amendment 70. It lets regulations confer functions on the Secretary of State where a compromise is or may be attributable to loss of oversight or control of an AI agent.{C('rep')} Those functions can include appointing inspectors, entering and searching premises, seizing documents and requiring information, including information held outside the UK.{C('hl62')}",
        f"The minister set out three further measures for secondary legislation: agent risk requirements, preserving information about agent malfunctions, and telling affected organisations such as suppliers.{C('rep')} The 3 November factsheet lists a fourth: post-incident review powers for ministers.{C('agent')}",
        f"Peers wanted more. A cross-party amendment would have required frontier AI developers to report unauthorised access to UK essential services within 24 hours. The government argued the bill places reporting duties on regulated entities, not developers, and peers rejected it by 165 to 95.{C('rep')}",
        f"Proposals for a statutory audit role for the AI Security Institute were not pressed to a vote. The government argued such a role would undermine its voluntary access to frontier models.{C('rep')}"],
        "The AI amendments", "The new clause is a power to make rules about AI agents. The rules themselves are still to be written.")
    b.figpage("How the agent power would work", "From rogue agent to lesson shared", "A simplified view. Every step depends on regulations not yet made.", "loupe",
        [("Monitor and detect", f"Proposed requirements could mandate monitoring of agent actions and agent risk assessments.{C('agent')}"),
         ("Report and notify", f"The operator reports within the normal timelines and, under a proposed measure, tells organisations the agent affected.{C('agent','ir')}"),
         ("Preserve the evidence", f"A proposed duty to keep records of agent actions and control attempts, such as chain of thought logs.{C('agent')}"),
         ("Inspect and learn", f"Inspectors could request information and run tests, then share remedies across the sector.{C('hl62','agent')}")], "The AI amendments")
    b.table("Scorecard", "Settled, proposed or rejected: the AI measures", "Where each AI related idea stood after the Lords had finished with the bill.", ["Idea", "Outcome", "Source of detail"],
        [("Powers over AI agent loss of control", f"Agreed. Government Amendment 70.{C('rep')}", "Regulations after consultation, affirmative procedure."),
         ("Agentic risk requirements, evidence, notification", f"Proposed for secondary legislation.{C('agent')}", "Consultation promised; no date given."),
         ("Voluntary near miss reporting", f"Committed by the minister on Report.{C('rep')}", "No primary legislation needed."),
         ("Data centre mandatory near miss reporting", f"Removed by government amendment.{C('rep')}", "Replaced by the voluntary route."),
         ("Frontier developer incident reporting", f"Rejected, 165 to 95.{C('rep')}", "Government says developer rules belong elsewhere."),
         ("Recurring review incl. AISI powers", f"Agreed, 202 to 155, against the government.{C('rep')}", "Commons consideration of Lords amendments.")], "The AI amendments", widths="40mm 1fr 1fr")
    b.compare("UK and EU", "How the UK bill compares with NIS2", f"Only provisions verified in the bill, GOV.UK factsheets and the NIS2 text are shown.{C('nis2')}", ["Topic", "EU NIS2 directive", "UK bill"],
        [("Status", f"In force; member states had until 17 October 2024 to transpose.{C('ec')}", "Awaiting final agreement between the Houses."),
         ("Reporting", f"24 hour early warning, 72 hour notification, final report within one month.{C('nis2')}", f"24 hour initial notice and 72 hour full report. A 28 day final report was proposed but not accepted.{C('ir','rep')}"),
         ("MSPs and data centres", f"Managed service, managed security and data centre providers listed in Annex I.{C('nis2')}", f"Relevant MSPs and data centres above set thresholds.{C('msp','dc')}"),
         ("Board duties", f"Management bodies approve and oversee measures, can be held liable, must train.{C('nis2')}", f"Proposed mandatory governance requirements, set in regulations.{C('rep')}"),
         ("Maximum fines", f"At least €10m or 2% for essential entities.{C('nis2')}", f"Up to £17m or 4% for serious breaches.{C('enf')}")], "The AI amendments")

    # ---------- Part 03
    b.mark("03", "What it means for UK organisations")
    b.opener("03", "What it<br>means.", "The practical consequences for UK organisations and the suppliers they depend on.", [("01", "Impact on organisations and suppliers"), ("02", "What most get wrong"), ("03", "What to do now")])
    b.essay("What it means", "The regime will reach you through your contracts", [
        f"Most UK organisations will never register with a regulator under this bill. But if you buy managed IT, host in a data centre or supply an essential service, the bill will reach you through those relationships. MSPs will have to report significant incidents and tell affected customers.{C('ir')}",
        f"That cuts both ways. Customers gain a right to know when their provider's incident has likely affected them, and to be kept updated while it continues.{C('ir','rep')} Providers will expect customers to have a contact, a process and a decision maker ready to receive that notice.",
        f"For MSPs the change is fundamental. Firms that have operated without sector regulation will register with the Information Commission, meet security requirements and face turnover based penalties.{C('msp','enf')} Expect them to tighten contracts, access and logging, and to ask more of customers.",
        f"For AI the signal is clear even though the rules are not. The government expects regulated firms to show they can monitor agents, keep records of their actions and explain what went wrong.{C('agent')} Any agent with access to production systems is now a governance question, not only an innovation one.",
        f"Boards should note the direction of travel. The minister proposed mandatory requirements on governance, including board level accountability and named, accredited individuals with senior responsibility.{C('rep')} The voluntary Cyber Governance Code of Practice already sets expectations for directors.{C('cgc')}",
        f"Timing remains uncertain. The Commons must still consider the Lords amendments, and most duties need secondary legislation and consultation first.{C('3r','sum')} That leaves a preparation window, but not a long one."],
        "What it means", "If you buy managed IT, you are part of this regime whether or not your name is on a register.")
    b.grid("Common mistakes", "Four things organisations get wrong", "Patterns we expect as the regime beds in.",
        [("magnifier", "Assuming they are out of scope", "Scope follows the supply chain. Critical supplier designation can catch small firms, and contracts will carry duties further."),
         ("bell", "Treating 24 hours as plenty", "The clock starts at awareness. Without a named decision maker and a template, a day passes quickly."),
         ("eye", "Running agents without a record", "Proposed rules point to logs of agent actions and control attempts. Many pilots keep neither."),
         ("contract", "Leaving MSP contracts unchanged", "Notification, evidence, access and AI use terms need updating before duties commence, not after an incident.")], "What it means",
        "The organisations that cope best will treat the bill as a supply chain project, not a compliance form.")
    b.steps("Recommendations", "Six steps to take now", "Ordered by how quickly they reduce risk.",
        [("Map your position", "Decide if you are an essential service, a digital or managed service, a likely critical supplier or a customer."),
         ("Rehearse the 24 hour notice", "Run a tabletop exercise that ends with a draft notice inside 24 hours and a fuller account at 72."),
         ("Inventory your AI agents", "List every agent with system access, what it can do, who owns it and how it is stopped."),
         ("Turn on the right logs", "Keep records of agent actions, permissions and overrides long enough to investigate."),
         ("Reopen supplier contracts", "Agree notification, evidence and AI use terms with MSPs and hosting providers."),
         ("Brief the board", "Name an accountable executive, set a reporting rhythm and track the consultations.")], "What it means")
    b.questions("For the boardroom", "Questions boards should ask", "Use these at your next risk or audit committee.",
        [("Scope and suppliers", ["Are we in scope directly, as a supplier, or only through our contracts?", "Which of our MSPs and hosting providers will be regulated, and what will they ask of us?", "Could any supplier's outage stop a service we cannot do without?"]),
         ("Readiness and AI", ["Could we send an accurate incident notice within 24 hours tonight?", "Which AI agents act on our systems, and who can stop them?", "Would our logs show what an agent did and why?"])], "What it means")
    b.glossary("Terms used in this report", [
        ("NIS Regulations 2018", "The UK's existing cross-sector cyber law for essential and some digital services."),
        ("Operator of essential services", "An organisation providing a service such as energy, water or health that the regime regulates."),
        ("Relevant managed service provider", "A medium or large firm providing ongoing IT management to customers with access to their systems."),
        ("Critical supplier", "A supplier a regulator designates because its disruption could cause significant harm."),
        ("Competent authority", "The sector regulator for NIS, such as Ofcom or the Information Commission."),
        ("Secondary legislation", "Regulations made under powers in an Act, often after consultation."),
        ("AI agent", "An AI system that can take actions, not just answer. The bill leaves the legal definition to regulations."),
        ("Loss of oversight or control", "When operators cannot adequately monitor or control an agent. Also defined later by regulations."),
        ("Near miss", "An event that could have caused an incident but did not. Reporting will be voluntary."),
        ("AISI", "The AI Security Institute, the government body that tests advanced AI models."),
        ("Ping-pong", "The exchange of amendments between the Commons and Lords before a bill can become law."),
        ("NIS2", "The EU's updated network and information security directive, Directive (EU) 2022/2555.")])

    b.mark("", "Sources")
    b.sources([(i + 1, SRC[k]) for i, k in enumerate(ORDER)],
        "All sources accessed on 3 November 2026. Parliamentary quotations are from Hansard. Statements by peers in debate are not treated as fact unless confirmed elsewhere. The Commons may still amend the bill.")
    b.rep_back("Get ready before<br>the rules land.", "We help UK organisations map their place in the new regime, prepare for 24 hour reporting and put the right controls around AI agents and suppliers.", "Book a readiness review", "Companion playbook · Ready for the rules")
    return b
