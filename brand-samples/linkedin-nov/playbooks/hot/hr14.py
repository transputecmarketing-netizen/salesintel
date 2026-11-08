from rkit import RBook, S

REFS = {
    "ad": "Ahold Delhaize, Ahold Delhaize reports resilient Q3 2026 results and updates 2026 guidance to reflect business disruption caused by recent cybersecurity incident, 4 Nov 2026, https://newsroom.aholddelhaize.com/ahold-delhaize-reports-resilient-q3-2026-results-and-updates-2026-guidance-to-reflect-business-disruption-caused-by-recent-cybersecurity-incident/",
    "dn": "DutchNews, Albert Heijn and sister chains abroad hit by likely cyberattack, 13 Oct 2026, https://www.dutchnews.nl/2026/10/albert-heijn-and-sister-chains-abroad-hit-by-likely-cyberattack/",
    "ib": "IBTimes UK, Supermarket cyber incident leaves online shoppers facing at least 11 days without deliveries, Oct 2026, https://www.ibtimes.co.uk/albert-heijn-deliveries-resume-after-cyber-incident-1826826",
    "nl13": "NL Times, Albert Heijn parent Ahold Delhaize finds no evidence of data theft after cyber incident, 13 Oct 2026, https://nltimes.nl/2026/10/13/albert-heijn-parent-ahold-delhaize-finds-evidence-data-theft-cyber-incident",
    "reg1": "The Register, M&S cyberattack disruption (fiscal 2025 results), 21 May 2025, https://www.theregister.com/2025/05/21/ms_cyberattack_disruption/",
    "reg2": "The Register, M&S pegs cyberattack cleanup costs, 5 Nov 2025, https://theregister.com/2025/11/05/ms_pegs_cyberattack_cleanup_costs/",
    "coop": "Co-op, Co-op navigates headwinds and looks forward with confidence, clarity and purpose, 26 Mar 2026, https://www.co-operative.coop/media/news-releases/co-op-navigates-headwinds-and-looks-forward-with-confidence-clarity-and",
    "jlr": "JLR, JLR performance impacted in challenging quarter, 14 Nov 2025, https://media.jlr.com/corporate/news/2025/11/jlr-performance-impacted-challenging-quarter",
    "rec": "The Record, Jaguar Land Rover cyberattack economic impact, 22 Oct 2025, https://therecord.media/jaguar-land-rover-cyberattack-economic-impact",
    "nos19": "NOS, Moederbedrijf Albert Heijn doet na ruim een week aangifte van cyberaanval, 19 Oct 2026, https://nos.nl/artikel/2635852-moederbedrijf-albert-heijn-doet-na-ruim-een-week-aangifte-van-cyberaanval",
    "esm": "ESM Magazine (Reuters), M&S resumes online orders after 46-day cyberattack pause, 10 Jun 2025, https://www.esmmagazine.com/technology/ms-resumes-online-orders-after-46-day-cyberattack-pause-290083",
    "info": "Infosecurity Magazine, JLR hack UK's costliest ever, hitting economy with £1.9bn loss, 22 Oct 2025, https://www.infosecurity-magazine.com/news/jlr-hack-uk-costliest-ever-19bn/",
    "csbs": "DSIT, Cyber security breaches survey 2025/2026, 30 Apr 2026, https://www.gov.uk/government/statistics/cyber-security-breaches-survey-20252026/cyber-security-breaches-survey-20252026",
    "nos4": "NOS, Ahold Delhaize ziet schade van tientallen miljoenen door cyberaanval, 4 Nov 2026, https://nos.nl/artikel/2637977-ahold-delhaize-ziet-schade-van-tientallen-miljoenen-door-cyberaanval",
    "nl4": "NL Times, Cyberattack cost Albert Heijn parent Ahold Delhaize estimated €250 million, 4 Nov 2026, https://nltimes.nl/2026/11/04/cyberattack-cost-albert-heijn-parent-ahold-delhaize-estimated-eu250-million",
    "sw": "SecurityWeek, Ahold Delhaize confirms data stolen in ransomware attack, 18 Apr 2025, https://www.securityweek.com/ahold-delhaize-confirms-data-stolen-in-ransomware-attack/",
    "rcoop": "The Record, Cyberattack on British retailer the Co-op shaved about $275 million from revenues, 25 Sep 2025, https://therecord.media/retailer-the-co-op-cyberattack-lost-revenue",
    "ncsc": "NCSC, UK experiencing four 'nationally significant' cyber attacks every week, 14 Oct 2025, https://www.ncsc.gov.uk/news/uk-experiencing-four-nationally-significant-cyber-attacks-weekly",
    "letter": "GOV.UK, Ministerial letter on cyber security to leading UK companies, 13 Oct 2025, https://www.gov.uk/government/publications/ministerial-letter-on-cyber-security-to-leading-uk-companies/ministerial-letter-on-cyber-security",
    "code": "techUK, Government publishes Cyber Governance Code of Practice, 8 Apr 2025, https://www.techuk.org/insights/news/government-publishes-cyber-governance-code-of-practice",
}


class Cite:
    """Numbers sources in order of first use."""
    def __init__(s, refs): s.refs, s.order = refs, []
    def __call__(s, *keys):
        for k in keys:
            if k not in s.order: s.order.append(k)
        return S(*[s.order.index(k) + 1 for k in keys])
    def items(s): return [(i + 1, s.refs[k]) for i, k in enumerate(s.order)]


def build():
    C = Cite(REFS)
    b = RBook("The 250 Million Question", 14, "pulse", "basket")
    b.how = "An evidence-based look at the Ahold Delhaize cyber incident of October 2026, how it compares with Marks and Spencer, Co-op and Jaguar Land Rover, where the money is really lost, and what UK boards should do now."
    b.rep_cover("Intelligence report · The business cost of cyber incidents", "The €250 million<br>question.",
                "Ahold Delhaize expects its October cyber incident to cut fourth-quarter sales by up to €250 million, while the cost of the IT response is marginal. What that tells boards about where cyber losses really come from.",
                "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("The IT bill was marginal. The trading bill was up to €250 million.", [
        f"On Sunday 11 October 2026, Ahold Delhaize, owner of Albert Heijn, Delhaize, Food Lion and Stop & Shop, began taking systems offline after a cybersecurity incident.{C('dn', 'ib')} Online ordering stopped in the Netherlands and the United States, several Dutch distribution centres halted and some Albert Heijn shelves emptied.{C('nl13')}",
        f"On 4 November the company said the incident is expected to cut fourth-quarter net sales by €200 million to €250 million and operating income by €75 million to €100 million. In the same statement it said incremental response and remediation costs would have only a marginal impact on its 2026 results.{C('ad')}",
        f"That contrast is the story, and it is not new. Marks and Spencer first expected a £300 million hit to operating profit, against direct costs it later put at about £136 million.{C('reg1', 'reg2')} Co-op estimated £285 million of lost revenue.{C('coop')} Jaguar Land Rover booked £196 million of cyber costs, while an independent estimate put the cost to the UK economy at £1.9 billion.{C('jlr', 'rec')}",
        "Most cyber risk models still start with the IT bill: forensics, rebuilding, legal fees, perhaps a fine. Those costs are real, but in each case above they were the smaller part. The larger part is trade that never happens while systems are down, and the margin that goes with it."],
        "Price cyber risk in lost trading days, not IT invoices. A board that knows what a week without its core systems would cost, and has rehearsed working through it, will spend its security budget better.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence shows", [
        ("The headline figure is a range, and an estimate.", f"Ahold Delhaize gave €200 million to €250 million of lost fourth-quarter sales \"based on current estimations\". Up to €250 million is the top of that range.{C('ad')}"),
        ("Lost trade dwarfed the response bill.", f"The company expects €75 million to €100 million less operating income, while response and remediation costs are described as marginal.{C('ad')}"),
        ("Containment caused much of the damage.", f"The company took systems offline to protect its environment, which stopped online orders and, in the Benelux, parts of the supply chain.{C('ad', 'nos19')}"),
        ("Two weeks was enough to move a full-year forecast.", f"Most disruption was contained within two weeks, yet guidance for underlying earnings per share growth fell from mid-to-high single digits to low single digits.{C('ad')}"),
        ("UK retail saw the same shape in 2025.", f"M&S lost 46 days of online orders, and Co-op estimated £285 million of lost revenue after restricting its own systems.{C('esm', 'coop')}"),
        ("The wider economy pays too.", f"The Cyber Monitoring Centre estimated the JLR incident cost the UK £1.9 billion and affected over 5,000 organisations, mostly through lost manufacturing output.{C('rec', 'info')}"),
        ("Most UK boards are not set up to see this.", f"Only 31% of UK businesses have board-level responsibility for cyber security, and 25% have a formal incident response plan.{C('csbs')}")])

    b.mark("", "At a glance")
    b.facts("The numbers behind the story", "Ahold Delhaize's figures are the company's current estimates and may change when it reports full-year results.", [
        ("€200m to €250m", f"Expected reduction in Ahold Delhaize's fourth-quarter 2026 net sales from the October incident.{C('ad')}"),
        ("€75m to €100m", f"Expected reduction in underlying and IFRS operating income from the same incident.{C('ad')}"),
        ("2 weeks", f"Time the company says it took to contain most of the disruption. Full restoration was still under way on 4 November.{C('ad')}"),
        ("£285m", f"Co-op's unaudited estimate of the direct revenue impact of its 2025 cyber attack.{C('coop')}"),
        ("£1.9bn", f"Cyber Monitoring Centre estimate of the UK economic impact of the 2025 JLR incident.{C('rec')}"),
        ("25%", f"UK businesses with a formal incident response plan, in the government's 2025/26 survey.{C('csbs')}")], "At a glance")

    b.mark("", "Timeline")
    b.timeline("Three weeks from switch-off to price tag", "The Ahold Delhaize incident as reported by the company and the Dutch and UK press.", [
        ("11 Oct 2026", "Systems go offline", f"Ahold Delhaize detects suspicious activity and begins taking systems offline on Sunday afternoon.{C('dn', 'ib')}"),
        ("12 Oct", "Online services down on two continents", f"Albert Heijn, Etos and Gall & Gall websites and apps go down. US chain websites, including Stop & Shop and Food Lion, follow.{C('dn')}"),
        ("13 Oct", "No evidence of data theft so far", f"The company says it has found no evidence that customer, employee or partner data was stolen. Several distribution centres have stopped.{C('nl13')}"),
        ("15 Oct", "Distribution resumes", f"Dutch distribution centres are operating again and regular deliveries to stores restart nationwide.{C('ib')}"),
        ("18 Oct", "Police report and websites back", f"The company files a police report, having notified the Dutch NCSC within 24 hours. Albert Heijn's website and app return.{C('nos19', 'ib')}"),
        ("23 Oct", "Home deliveries restart", f"Albert Heijn begins restarting online grocery deliveries after cancelling orders up to 22 October.{C('ib')}"),
        ("4 Nov", "The cost is published", f"Third-quarter results put the expected hit at €200 million to €250 million of sales and €75 million to €100 million of operating income.{C('ad')}")])

    # Part 01
    b.mark("01", "Anatomy of a loss")
    b.opener("01", "Anatomy<br>of a loss.", "What happened at Ahold Delhaize, what the company has said, and what it has not.",
             [("01", "What happened"), ("02", "The outlook, before and after"), ("03", "How downtime becomes lost sales")])
    b.essay("What happened", "Two weeks offline, one quarter dented", [
        f"Ahold Delhaize is one of the largest food retailers in the world, with more than 9,000 supermarkets in nine countries.{C('nos4')} Its brands include Albert Heijn in the Netherlands, Delhaize in Belgium, and Food Lion, Stop & Shop, Giant Food and Hannaford in the United States. It has been here before: a November 2024 incident disrupted some US brands, and the company later confirmed files had likely been taken.{C('sw')}",
        f"The trouble began on the afternoon of Sunday 11 October.{C('dn')} The company described a cybersecurity incident, brought in external experts and took certain systems offline.{C('nl13')} Within a day Dutch and US websites and apps were down.",
        f"The effects reached the shop floor. Several Dutch distribution centres stopped, fresh products ran short, and for nearly two weeks electronic shelf labels could not always show correct prices.{C('nl13', 'nl4')} Stores stayed open. Distribution centres were running again by 15 October, but home deliveries did not restart until 23 October.{C('ib')}",
        f"On the nature of the attack the company has said little. It called it a malicious action by third parties and filed a police report on 18 October.{C('nos19')} It has not said whether ransomware was involved, and no group has been confirmed as responsible. In mid-October it had found no evidence of data theft.{C('nl13')} We do not speculate beyond that.",
        f"The numbers came on 4 November: €200 million to €250 million less fourth-quarter net sales, €75 million to €100 million less operating income, and a lower full-year outlook.{C('ad')} The chief executive said most of the disruption was contained within two weeks, but that work to fully restore normal operations continues.",
        f"One line in the release deserves more attention than it got. Incremental response and remediation costs, the bills most people picture when they think of a cyber attack, are expected to have a marginal impact on 2026 operating income.{C('ad')} The money was lost at the till and in the supply chain."],
        "What happened", "The bills most people picture when they think of a cyber attack were the marginal part.")
    b.table("Before and after", "How the 2026 outlook changed", f"Ahold Delhaize's guidance before and after the incident. All figures are from the company's third-quarter release.{C('ad')}",
            ["Measure", "Before", "After, 4 Nov 2026"],
            [("Q4 net sales", "No incident effect.", "Reduced by €200m to €250m, on current estimates."),
             ("Q4 operating income", "No incident effect.", "Reduced by €75m to €100m, underlying and IFRS."),
             ("Underlying operating margin", "Around 4.0%.", "Approaching 4.0%."),
             ("Underlying EPS growth", "Mid to high single digits.", "Low single digits."),
             ("Free cash flow", "At least €2.3bn.", "Around €2.1bn, also reflecting new Serbian supplier payment rules."),
             ("Response and remediation", "Not applicable.", "Marginal impact on 2026 IFRS operating income.")], "What happened", widths="44mm 1fr 1fr")
    b.figpage("How it works", "How downtime becomes lost sales", "A ransom or a rebuild is not where most of the money goes. This is the chain that turns days offline into a hole in the quarter.", "rail",
              [("Containment switches things off", "Taking systems offline limits the attacker but also stops ordering, picking and pricing. It is usually the right call, and it has a price."),
               ("Dependent processes stall", "Distribution, replenishment and online fulfilment run on shared systems. When they stop, stock stops moving and shelves thin."),
               ("Customers go elsewhere", "Cancelled deliveries and gaps on the shelf send shoppers to competitors. Some of that trade does not come back."),
               ("Fixed costs keep running", "Rent, wages and energy continue while sales fall, so much of the lost revenue drops straight through to profit.")], "What happened")

    # Part 02
    b.mark("02", "Not the first time")
    b.opener("02", "Not the<br>first time.", "Marks and Spencer, Co-op and Jaguar Land Rover show the same pattern: the trading loss is the big number.",
             [("01", "Four incidents side by side"), ("02", "Where the money really goes"), ("03", "The four lines of cost")])
    b.table("Comparison", "Four incidents, one pattern", "Figures are company estimates unless stated. Measures differ between companies, so compare the shape, not the totals.",
            ["Incident", "Disruption", "Trading impact", "Direct and IT costs"],
            [("Ahold Delhaize, Oct 2026", f"Systems offline from 11 Oct; most disruption contained in two weeks.{C('ad')}", "€200m to €250m lower Q4 sales; €75m to €100m lower operating income.", "Response and remediation: marginal impact."),
             ("M&S, Apr 2025", f"Online orders paused for 46 days.{C('esm')}", f"Initial estimate of about £300m off operating profit, before mitigation.{C('reg1')}", f"About £136m direct costs; £100m maximum insurance claim.{C('reg2')}"),
             ("Co-op, Apr 2025", f"Systems restricted; food availability reduced.{C('rcoop')}", f"£285m direct revenue impact; £107m impact to profitability (unaudited).{C('coop')}", "Underlying operating loss includes an estimated £86m direct cyber impact."),
             ("JLR, Sep 2025", f"Global systems shut down; phased restart from 8 Oct.{C('jlr')}", "Q2 revenue down 24% to £4.9bn, also reflecting tariffs and the Jaguar wind-down.", "£196m of cyber costs booked as exceptional items."),
             ("UK economy, JLR", f"Over 5,000 UK organisations affected.{C('rec')}", f"£1.9bn estimated impact, mostly lost manufacturing output.{C('info')}", "Category 3 of 5 on the Cyber Monitoring Centre scale.")],
            "Not the first time", widths="30mm 1fr 1fr 1fr")
    b.essay("Analysis", "Where the money really goes", [
        "Put the four incidents side by side and a pattern appears. The costs that sit naturally with IT, such as forensics, rebuilding systems and specialist advice, are significant but bounded. The costs that sit with the business, lost sales, wasted stock, lost margin and the knock-on to partners, are larger and harder to cap.",
        f"M&S is the clearest example because it reported both. In May 2025 it expected the attack to reduce operating profit by about £300 million before mitigation.{C('reg1')} Six months later it put total direct costs at about £136 million, of which £83 million was systems response and recovery, and claimed the £100 million maximum on its cyber insurance. UK online sales fell 42.9% in the half.{C('reg2')}",
        f"Co-op shows the cost of containment. Its food business was hit hardest, with availability reduced as systems were proactively taken offline.{C('rcoop')} By March 2026 it put the direct revenue impact at £285 million and the impact on profitability at £107 million, figures it described as unaudited.{C('coop')}",
        f"JLR shows how far the damage travels. The company booked £196 million of cyber costs and arranged a £500 million supplier financing scheme and a £1.5 billion loan guaranteed by UK Export Finance.{C('jlr')} The Cyber Monitoring Centre put the UK impact at £1.9 billion, mostly lost output at JLR and its suppliers.{C('rec', 'info')}",
        f"Ahold Delhaize fits the same shape. On our calculation from its own ranges, each euro of lost sales cost roughly 37 to 40 cents of operating income.{C('ad')} That is roughly nine to ten times the group's operating margin of around 4%, because rent, wages and energy carry on when the tills go quiet.",
        "The lesson is not that IT costs are trivial. It is that a risk model built on IT costs alone will understate the exposure by a wide margin, and will steer investment towards tools rather than towards the ability to keep trading."],
        "Not the first time", "Each euro of lost sales cost Ahold Delhaize roughly 37 to 40 cents of operating income.")
    b.grid("Cost lines", "The four lines of cost", "Every major incident produces costs in four places. Most risk registers count only the third.",
           [("tag", "Lost trading", "Sales that do not happen while ordering, picking or production is down. Usually the largest line, and the least modelled."),
            ("truck", "Supply chain and waste", "Stock that cannot move, fresh food written off, and partners and suppliers who cannot operate."),
            ("wrench", "Response and recovery", "Forensics, rebuild, specialist advisers and overtime. Real money, but usually the smaller part."),
            ("contract", "Customers, legal and regulatory", "Refunds and compensation for cancelled orders, legal advice, and regulatory exposure if personal data is involved.")],
           "Not the first time", "Ask finance to estimate each line for a two-week outage. The first line is usually the biggest and the least understood.")

    # Part 03
    b.mark("03", "What it means for UK organisations")
    b.opener("03", "What it means<br>for the UK.", "UK boards have been asked, in writing, to plan for destructive incidents. Few have put a price on one.",
             [("01", "The UK picture"), ("02", "What boards count, and what they miss"), ("03", "Recommendations")])
    b.essay("The UK picture", "Asked to plan, still not pricing", [
        f"The UK has had its own warnings. The NCSC handled 204 nationally significant incidents in the year to August 2025, up from 89 the year before, and 18 were highly significant.{C('ncsc')} Its chief executive said cyber security is now a matter of business survival.",
        f"In October 2025 ministers, the NCSC and the National Crime Agency wrote to the chief executives and chairs of leading UK companies, including the FTSE 350. They asked boards to use the Cyber Governance Code of Practice, join the NCSC's Early Warning service and require Cyber Essentials in their supply chains, and to plan and exercise how they would continue operations and rebuild after a destructive incident.{C('letter')}",
        "That last request is the one the Ahold Delhaize figures speak to. Continuing operations is a business problem, not an IT one. It depends on whether stores, warehouses and service teams can keep working in some reduced form while core systems are rebuilt.",
        f"The evidence suggests many organisations are not there yet. The government's 2025/26 survey found board-level responsibility for cyber security in 31% of businesses and a formal incident response plan in 25%. Some 47% had cyber insurance of some kind, but only 10% held a specific cyber policy, and 15% reviewed risks from their immediate suppliers.{C('csbs')}",
        f"Self-reported costs in the same survey are low, with a median of zero for the most disruptive breach.{C('csbs')} That is not proof that incidents are cheap. It suggests most organisations do not measure the cost of disruption, and what is not measured tends not to be funded.",
        f"The Cyber Governance Code, published in April 2025, gives boards a structure built on five principles: risk management, strategy, people, incident planning, response and recovery, and assurance and oversight.{C('code')} What most boardrooms still lack is a number: what a week without core systems would cost."],
        "What it means for the UK", "What is not measured tends not to be funded.")
    b.compare("The blind spot", "What boards count, and what they miss", "Most cyber risk reporting stops at the left-hand column. The money is in the right-hand one.",
              ["Cost line", "What is usually counted", "What is usually missed"],
              [("Downtime", "Time to restore IT systems.", "Lost sales per day, per channel, until normal trading returns."),
               ("Supply chain", "Rarely counted at all.", "Stock that cannot move, perishable waste, partners who cannot trade."),
               ("Margin", "Revenue at risk, if anything.", "Fixed costs that continue, so most lost revenue falls to profit."),
               ("Customers", "Notification costs after a data breach.", "Compensation, lost loyalty and customers who switch and stay away."),
               ("Insurance", "The headline policy limit.", "Waiting periods, sub-limits and how business interruption is calculated."),
               ("Recovery", "When systems come back.", "When normal trading comes back, which can be weeks later.")], "What it means for the UK")
    b.principles("Recommendations", "Six things boards should do now", "Each one turns cyber risk from a technical worry into a business number the board can act on.", [
        ("Put a price on a day of downtime", "Work with finance to estimate lost sales and margin per day for each critical service, and use it in every cyber investment decision."),
        ("Run a business impact analysis, not just an IT one", "Map which processes stop when which systems stop, and how long each can survive on manual workarounds."),
        ("Exercise with finance and operations in the room", "Rehearse a two-week outage. Record what keeps trading, what stops and what it costs."),
        ("Read the insurance policy against the scenario", "Compare your modelled loss with the limits, waiting periods and sub-limits. Know the gap you are carrying."),
        ("Rank resilience spending by value", "Prioritise what shortens an outage or keeps trading going, measured in days avoided times cost per day."),
        ("Report cyber risk in money", "Replace traffic lights with ranges: the loss from a plausible severe scenario, and what reduces it.")], "What it means for the UK")
    b.questions("For the board", "Questions to ask at the next meeting", "If the answers are not to hand, that is the finding.",
                [("Exposure", ["What would a week without our core systems cost in lost sales and margin?", "Which processes stop first, and how long can each run manually?", "Which suppliers could halt our trading if they were hit?"]),
                 ("Readiness", ["When did we last rehearse a destructive incident with finance and operations present?", "What would our cyber insurance actually pay for a two-week outage?", "How would we explain the cost to investors, customers and staff?"])], "What it means for the UK")
    b.glossary("Words worth knowing", [
        ("Business impact analysis", "A structured look at which processes matter most, what they depend on and what an outage of each would cost."),
        ("Business interruption cover", "Insurance that pays for lost profit and extra costs while operations are disrupted."),
        ("Containment", "Action to stop an attack spreading, often by taking systems or connections offline."),
        ("Cost of downtime", "Lost sales, lost margin and extra costs for each day a service is unavailable."),
        ("Cyber Governance Code of Practice", "UK government guidance, published in April 2025, setting out what boards should do about cyber risk."),
        ("Early Warning", "A free NCSC service that alerts organisations to potential attacks on their networks."),
        ("Operating income", "Profit from trading before interest and tax. Ahold Delhaize reports underlying and IFRS measures."),
        ("Ransomware", "Malicious software that encrypts or steals data so criminals can demand payment."),
        ("Recovery time objective", "The maximum time a service can be down before the damage becomes unacceptable."),
        ("Waiting period", "The time an insurance policy requires before business interruption cover starts to pay.")])
    b.mark("", "Sources")
    it = C.items()
    b.sources(it[:12])
    b.sources(it[12:], note="Sources continued.")
    b.rep_back("Know your number<br>before you need it.", "Transputec helps UK organisations put a price on cyber risk, test how they would keep trading through an outage and invest where it shortens downtime most.",
               "Book a cyber resilience review", "Playbook No. 14 · Count the Cost: the companion playbook")
    return b
