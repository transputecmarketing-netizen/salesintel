from cckit import CCReport, S


def build():
    b = CCReport("Resilience, Regulated", 1, "vault", "Financial Services and Insurance", "9 November 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at UK operational resilience regulation for banks, insurers, payment and investment firms: what the rules require, what the 20 October 2026 Google Cloud outage revealed, and what boards should do next."
    b.rep_cover("Operational resilience", "Resilience,<br>regulated.",
        "The impact tolerance deadline has passed, four cloud providers are now overseen as critical third parties, and a six-hour outage in London tested both. What the evidence shows, and what UK financial firms should do now.")
    b.contents()

    # ------------------------------------------------------------------ summary and findings
    b.mark("", "Executive summary")
    b.summary("The rules now assume disruption will happen. The question is whether firms can prove they stay within tolerance.", [
        f"On 20 October 2026 a power failure at a data centre hosting europe-west2-b, one of Google Cloud's London zones, disrupted services across the region for six hours and eight minutes, according to Google's final incident report.{R('gcp')} Customers of Lloyds, HSBC and Revolut reported problems with apps, payments and cash withdrawals.{R('yahoo', 'reuters')}",
        f"The outage landed in a regulatory regime that had just matured. Since 31 March 2025 UK banks, insurers, payment firms and other in-scope firms have been expected to remain within impact tolerances for each important business service.{R('ps213')} In July 2026 HM Treasury designated Google Cloud EMEA, Amazon Web Services EMEA, Microsoft Ireland Operations and Oracle Corporation UK as critical third parties.{R('hmt')} From 18 March 2027 new FCA and PRA incident and third-party reporting rules apply.{R('ps262', 'ps726')}",
        f"The FCA's review of 2025 self-assessments found progress, but also communications strategies rarely tested in exercises and few workarounds for losing usual channels.{R('fca1y')} Its own data shows retail banks reported 446 major operational incidents in 2025.{R('foi')}",
        "This report sets out what the rules require, what the October outage shows about concentration and redundancy, and what boards in financial services and insurance should ask for now."],
        "Oversight of cloud providers does not move responsibility. Each firm must still show, with evidence, that its important business services stay within tolerance when a critical supplier fails, and that it can reach staff, customers and supervisors when its usual channels are down.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("The deadline has passed. Supervisors now want evidence.", f"Firms had until 31 March 2025 to be able to remain within tolerance. The FCA is now reviewing annual self-assessments and questioning claims not backed by severe testing.{R('ps213', 'fca1y')}"),
        ("Communications are a weak link.", f"The FCA found limited evidence that communications strategies are tested in scenario exercises, and little detail on workarounds when usual channels are unavailable.{R('fca1y')}"),
        ("A zone failure became a regional problem.", f"Google reports that demand surges on neighbouring zones and control plane dependencies spread impact beyond europe-west2-b.{R('gcp')}"),
        ("Redundancy failed in combination.", f"One utility feed was out for repairs, the other failed, and a control system fault stopped generators starting before batteries ran out.{R('gcp')}"),
        ("Concentration is now overseen, but responsibility is not transferred.", f"Regulators say firms remain responsible for managing their own third-party arrangements under the critical third parties regime.{R('boe')}"),
        ("Reporting is getting faster and more uniform.", f"From March 2027 most FCA firms report within 24 hours of meeting a threshold; payment firms keep a 4-hour clock; DORA sets 4 and 24 hours.{R('ps262', 'dr301')}"),
        ("IT failures are routine, not rare.", f"Retail banks reported 446 major operational incidents to the FCA in 2025, led by change management and third-party failure.{R('foi')}")])

    b.facts("Operational resilience in six figures", "Each figure is sourced. Where sources measure different things, we say so in the analysis that follows.", [
        ("6h 08m", f"Duration of the main impact across Google Cloud's London region on 20 October 2026.{R('gcp')}"),
        ("38", f"Google Cloud products listed as affected on the incident's status page.{R('gcp')}"),
        ("446", f"Major operational incidents reported to the FCA by retail banks in 2025.{R('foi')}"),
        ("803 hours", f"Unplanned outages at nine major banks and building societies, January 2023 to February 2025.{R('tc25')}"),
        ("Over 40%", f"Share of cyber incidents reported to the FCA in 2025 that involved a third party.{R('fcanews')}"),
        ("4", f"Cloud providers designated as critical third parties by HM Treasury, effective 13 July 2026.{R('hmt', 'si777')}")], "At a glance")

    b.timeline("From policy to a real test", "Key dates in UK and EU operational resilience regulation, and the October 2026 outage.", [
        ("29 March 2021", "UK rules published", f"The FCA publishes PS21/3 and the PRA SS1/21. Rules apply from 31 March 2022.{R('ps213', 'ss121')}"),
        ("1 January 2025", "CTP regime in force", f"Rules for critical third parties take effect, ready for any designation by HM Treasury.{R('boe')}"),
        ("17 January 2025", "DORA applies", f"EU financial entities must report major ICT-related incidents under DORA.{R('cbi')}"),
        ("31 January 2025", "Barclays outage", f"Some customers lose access to services for up to three days, prompting Treasury Committee letters to banks.{R('tc25')}"),
        ("31 March 2025", "Transition ends", f"Firms must be able to remain within impact tolerances for each important business service.{R('ps213')}"),
        ("18 November 2025", "EU names critical providers", f"The European Supervisory Authorities designate critical ICT providers, including Google Cloud EMEA.{R('esas')}"),
        ("18 March 2026", "Reporting rules final", f"FCA PS26/2 and PRA PS7/26 set incident and third-party reporting rules, applying from 18 March 2027.{R('ps262', 'ps726')}"),
        ("13 July 2026", "First UK designations", f"AWS, Google Cloud, Microsoft and Oracle come under direct oversight.{R('hmt', 'si777')}"),
        ("20 October 2026", "London cloud outage", f"A power failure in europe-west2-b disrupts services across the region; banks report customer impact.{R('gcp', 'yahoo')}")])

    # ------------------------------------------------------------------ PART 01
    b.mark("01", "The rules")
    b.opener("01", "The<br>rules.", "Four overlapping regimes now shape how financial firms prepare for, report and recover from disruption.", [("01", "The UK regime four years on"), ("02", "Who must do what"), ("03", "Two reporting clocks")])
    b.essay("The rules", "The UK regime, four years on", [
        f"The UK approach, set out by the FCA in PS21/3 and the PRA in SS1/21, applies to banks, building societies, PRA-designated investment firms, insurers, recognised investment exchanges, enhanced scope SM&CR firms and payment and e-money firms.{R('ps213')} It asks each firm to identify its important business services, set an impact tolerance for each, map what supports them and test against severe but plausible scenarios.{R('ps213', 'ss121')}",
        f"The PRA is specific about tolerances. Each must include a time metric, applies at peak times as well as normal ones, and must hold whether or not a third party delivers part of the service. The board approves the services, the tolerances and the written self-assessment.{R('ss121')}",
        f"By 31 March 2025 firms had to have performed mapping and testing so they could remain within tolerance, and made the investments needed to operate consistently within it.{R('ps213')}",
        f"In March 2026 the FCA published what it found in firms' self-assessments. Good practice included annual reviews, non-time metrics such as transaction volumes and testing that covers cyber attacks and third-party failures. Weaknesses included tolerances that did not separate consumer harm from market integrity, mapping focused mainly on technology, and more work to do on third-party vulnerabilities.{R('fca1y')}",
        f"On communications, the FCA restated that firms must maintain an internal and external strategy that delivers clear, timely and relevant messaging. It found limited evidence of that strategy being tested, and firms not considering in detail what to do when usual channels are unavailable.{R('fca1y')}",
        f"It also challenged confidence. Some self-assessments stated there was no scenario the firm could not recover from, without evidence from sufficiently severe testing.{R('fca1y')}"],
        "The rules", "Some self-assessments claimed no scenario could defeat the firm, without severe testing to prove it.")
    b.table("At a glance", "Who must do what", "A simplified summary. Read the rules themselves for scope and detail.", ["Regime", "What it requires", "Status"], [
        ("Operational resilience (FCA PS21/3, PRA SS1/21)", f"Important business services, impact tolerances, mapping, scenario testing, communications strategy, board-approved self-assessment.{R('ps213', 'ss121')}", "In force since 31 March 2022; tolerance deadline 31 March 2025."),
        ("Critical third parties", f"Designated providers are overseen on the critical services they provide to the sector. Firms remain responsible for their own arrangements.{R('boe')}", "Rules from 1 January 2025; first designations from 13 July 2026."),
        ("Incident and third-party reporting (FCA PS26/2, PRA PS7/26)", f"One incident definition, thresholds, staged reports, notification of material third-party arrangements and an annual register.{R('ps262', 'ps726')}", "Published 18 March 2026; applies from 18 March 2027."),
        ("Current incident notification", f"Firms report incidents under SUP 15.3 and Principle 11. Payment service providers report major operational or security incidents within 4 hours of detection.{R('foi', 'ps262')}", "In force now. New regime from 18 March 2027; the 4-hour PSP clock continues."),
        ("EU DORA", f"ICT risk management, crisis communication plans, major incident reporting, register of information on ICT providers.{R('dora', 'dr301')}", "Applies from 17 January 2025 to EU financial entities, including UK groups' EU subsidiaries.")], "The rules", "44mm 1fr 52mm")
    b.compare("Reporting clocks", "Two reporting clocks to plan for", "Firms with EU entities may need to run both. Times are maximums; regulators expect reports as soon as practicable.", ["Stage", "UK FCA, from 18 March 2027", "EU DORA, now"], [
        ("Trigger", f"The incident meets one or more thresholds: intolerable consumer harm, market integrity, or safety and soundness.{R('ps262')}", f"The ICT-related incident is classified as major.{R('dr301')}"),
        ("Initial report", f"As soon as practicable and at most within 24 hours of determining a threshold is met. Payment service providers: within 4 hours of first detecting.{R('ps262')}", f"Within 4 hours of classification as major, and no later than 24 hours from becoming aware.{R('dr301')}"),
        ("Updates", f"Enhanced reporting firms give material updates as the incident develops.{R('ps262')}", f"Intermediate report within 72 hours of the initial notification.{R('dr301')}"),
        ("Final report", f"Enhanced firms: within 30 working days of resolution, 60 at the latest.{R('ps262')}", f"No later than one month after the latest intermediate report.{R('dr301')}"),
        ("Third parties", f"Notify new or significantly changed material arrangements; submit a register annually.{R('ps262')}", f"Maintain a register of information on all ICT service arrangements.{R('esas')}")], "The rules")

    # ------------------------------------------------------------------ PART 02
    b.mark("02", "The outage")
    b.opener("02", "The<br>outage.", "On 20 October 2026 one London data centre lost power. What happened next is a case study in concentration and redundancy.", [("01", "What Google's report says"), ("02", "How one zone became a region"), ("03", "A pattern, not a one-off")])
    b.essay("The outage", "What happened on 20 October", [
        f"Google's final incident report, published on 4 November 2026, is unusually detailed. The facility hosting europe-west2-b had two utility feeds. Feed B had been switched out for repairs after problems found in a generator load test on 14 October, so feed A carried the whole load.{R('gcp')}",
        f"At 06:53 BST an underground cable fault outside the site cut feed A. The control system that should have started the backup generators read live voltage on the isolated feed B and concluded mains power was healthy, so it never sent the start signal. Batteries carried the load for their roughly five minutes of runtime, and at 07:00 servers, storage and network equipment in the zone lost power.{R('gcp')}",
        f"Engineers restored power from a standby utility source by 08:20, but storage that had shut down uncleanly needed lengthy recovery. Platform services were fully available at 12:11 and most customer workloads at 13:08, six hours and eight minutes after impact began.{R('gcp')}",
        f"The impact did not stay in one zone. Google says demand surges on the other two London zones and control plane dependencies across zone boundaries caused unexpected impact for customers running in unaffected zones or across the region.{R('gcp')}",
        f"Customers of Revolut reported problems with card payments, transfers and cash withdrawals; Lloyds and HSBC said some customers had difficulties. Revolut said customers' money and data were safe.{R('yahoo', 'reuters')} The FCA said it was engaging with Google, the European Banking Authority sought information, and the Treasury Committee wrote to the Bank of England and the FCA.{R('reuters')}",
        f"Google's own action list includes a communications item: to bolster notification speed with an automated alert-to-communication mechanism. The earliest update in its published incident history is timestamped 09:35 BST, about two and a half hours after impact began.{R('gcp')}"],
        "The outage", "The control system read live voltage on a disconnected feed and decided mains power was healthy.")
    b.figpage("How it spread", "From one feed to a whole region", "The sequence as Google's incident report describes it. Times are BST on 20 October 2026.", "plug", [
        ("Two feeds become one", f"Feed B is out for repairs, so feed A alone supplies the site. At 06:53 a cable fault cuts it.{R('gcp')}"),
        ("Generators never start", f"Sensors read voltage on the isolated feed, so no start signal is sent. Batteries run out and the zone goes dark at 07:00.{R('gcp')}"),
        ("Failover overloads neighbours", f"Workloads shift to the other London zones, saturating capacity and producing errors across the region.{R('gcp')}"),
        ("Recovery takes hours, not minutes", f"Power returns by 08:20, but storage recovery and controlled re-admission run until 13:08.{R('gcp')}")], "The outage")
    b.table("Lessons", "What failed, and the lesson for financial firms", "Each failure point in Google's report has a parallel in a firm's own resilience plan.", ["Failure point", "What Google reports", "Lesson for firms"], [
        ("Planned maintenance", f"A temporary single-feed posture while repairs were made.{R('gcp')}", "Treat maintenance windows at critical suppliers as periods of higher risk, and ask to be told about them."),
        ("Untested automation", f"A control system misconfiguration stopped generators starting.{R('gcp')}", "Test failover end to end, including the parts you assume will work automatically."),
        ("Zone versus region", f"Demand surges and control plane dependencies spread impact beyond the failed zone.{R('gcp')}", "Do not assume multi-zone means resilient. Map regional dependencies and test a full regional loss."),
        ("Recovery time", f"Storage recovery meant hours between power returning and service.{R('gcp')}", "Set recovery assumptions from real incidents, not from supplier marketing."),
        ("Notification speed", f"Google lists faster automated customer notification as an action.{R('gcp')}", "Detect impact with your own monitoring. Do not wait for a status page.")], "The outage", "34mm 1fr 1fr")
    b.essay("The pattern", "A pattern, not a one-off", [
        f"October was not the first time technology failure has stopped customers paying or being paid. In early 2025 Barclays customers lost access to some services for up to three days from 31 January, the self-assessment tax deadline. Barclays told the Treasury Committee that 56% of online payments failed during the incident, and expected to pay between £5 million and £7.5 million in compensation.{R('tc25')}",
        f"The Committee's letters to nine banks and building societies found at least 158 IT failure incidents and at least 803 hours of unplanned outages between January 2023 and February 2025, more than 33 days. Firms cited third-party suppliers, system changes and internal software faults.{R('tc25')}",
        f"FCA data points the same way. Retail banks reported 446 major operational incidents in 2025. The top drivers were change management at 24.22% and third-party failure at 20.85%.{R('foi')} Across all firms, the FCA says over 40% of cyber incidents reported to it in 2025 involved a third party.{R('fcanews')}",
        f"Consumer groups are watching. In September 2026 Which? analysed FCA data on 21 banks and building societies and found Santander and its Cahoot brand reported the most incidents between April 2025 and March 2026, at 38.{R('which')}",
        f"Concentration is now a policy issue in its own right. The EU designated Google Cloud EMEA and others as critical ICT providers in November 2025; the UK followed in July 2026.{R('esas', 'hmt')} The October outage was the first major test of a newly designated UK critical third party.",
        "The lesson is not that cloud is unsafe. Google's report shows layers of redundancy that usually work. It is that rare combinations happen, and every firm relying on one region needs to know what its customers experience when they do."],
        "The pattern", "Rare combinations happen. Every firm relying on one region needs to know what its customers experience when they do.")

    # ------------------------------------------------------------------ PART 03
    b.mark("03", "What to do")
    b.opener("03", "What to<br>do now.", "What the evidence means for UK financial firms, and the steps that turn compliance into readiness.", [("01", "What it means for the UK"), ("02", "Recommendations"), ("03", "Questions for the board")])
    b.essay("UK relevance", "What it means for UK organisations in Financial Services and Insurance", [
        f"First, the critical third parties regime is a backstop, not a shield. The Bank of England, PRA and FCA describe it as complementing existing outsourcing and operational resilience rules, with regulated firms remaining responsible for managing their own third-party arrangements.{R('boe')} The PRA's expectation that firms stay within tolerance whether or not they use third parties still applies.{R('ss121')}",
        f"Second, the 18 March 2027 reporting rules will expose weak incident processes. Firms must decide quickly whether an incident meets a threshold and report within 24 hours of that decision; payment firms keep a 4-hour clock from detection. Material third-party arrangements must be notified and registered.{R('ps262', 'ps726')} That needs a severity model, named decision makers and data captured as the incident runs.",
        f"Third, communications deserve the same rigour as technology. The FCA's March 2026 findings point to untested strategies and no plan for losing usual channels.{R('fca1y')} DORA goes further for EU entities, requiring crisis communication plans for responsible disclosure of major incidents to clients, counterparts and, where appropriate, the public.{R('dora')}",
        f"Fourth, groups with EU subsidiaries must run two sets of clocks. DORA has applied since 17 January 2025, with initial notification within 4 hours of classifying a major incident and no later than 24 hours from awareness.{R('cbi', 'dr301')}",
        "Insurers should note that important business services include claims, which peak in exactly the events, such as storms and floods, that also stress suppliers and staff.",
        "The practical test for any board: take the 20 October timeline, overlay your own services, and ask when you would have known, who you would have told, and whether you would have stayed within tolerance."],
        "UK relevance", "Take the 20 October timeline, overlay your own services, and ask whether you would have stayed within tolerance.")
    b.steps("Recommendations", "Six steps for financial firms", "In priority order.", [
        ("Map cloud concentration to important business services", f"Record region and zone dependencies for each service, including through suppliers, and test a regional loss.{R('gcp', 'fca1y')}"),
        ("Build out-of-band communications", f"Reach the response team, customers and supervisors without corporate email, chat or single sign-on.{R('fca1y')}"),
        ("Test communications in every scenario", f"Include customer, staff, supplier and supervisor messages, timed against tolerance.{R('fca1y')}"),
        ("Prepare for the 2027 rules, and DORA", f"Agree thresholds, decision owners and data for a 24-hour initial report and a third-party register, in one model that also meets DORA clocks.{R('ps262', 'ps726', 'dr301')}"),
        ("Make supplier notification a contractual test", "Ask critical suppliers how fast and how they will tell you, including about maintenance windows."),
        ("Strengthen the self-assessment", f"Severe scenarios, confidence ratings, remediation owners and real incidents as evidence.{R('fca1y')}")], "What to do")
    b.questions("For the board", "Questions boards should ask this quarter", "Answers should be specific, dated and owned.", [
        ("Exposure", ["Which important business services depend on a single cloud region, directly or through a supplier?", "If our main region failed for six hours on payday, which tolerances would we breach?", "Which suppliers would tell us first, and how?"]),
        ("Readiness", ["Can we reach staff, customers and supervisors without email and chat?", "Are we ready to report within 24 hours of meeting a threshold from March 2027?", "Does our self-assessment show severe testing, or only confidence?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("Important business service", "A service to an external user which, if disrupted, could cause intolerable harm or risk to the firm or the wider system."),
        ("Impact tolerance", "The maximum tolerable level of disruption to an important business service, including a time metric."),
        ("Self-assessment", "A firm's written record of compliance with the resilience rules, approved by its board."),
        ("Critical third party (CTP)", "A provider designated by HM Treasury and overseen by the Bank of England, PRA and FCA."),
        ("CTPP", "Critical ICT third-party service provider, designated by the European Supervisory Authorities under DORA."),
        ("DORA", "The EU Digital Operational Resilience Act, Regulation (EU) 2022/2554, applying from 17 January 2025."),
        ("Availability zone", "An isolated location within a cloud region with its own power, cooling and networking."),
        ("Control plane", "The systems that manage and route cloud workloads, as distinct from the workloads themselves."),
        ("PLC", "Programmable logic controller: an industrial computer controlling equipment such as generators."),
        ("Material third party arrangement", "A supplier arrangement that must be notified and registered under the 2027 UK reporting rules."),
        ("Mapping", "Identifying the people, processes, technology, facilities and information behind each important business service."),
        ("Severe but plausible scenario", "A demanding but realistic disruption used to test whether a firm can stay within tolerance."),
        ("Change management", "The controls around updates to systems, the leading driver of major incidents at retail banks in 2025."),
        ("Register of information", "The DORA record of all contractual arrangements a financial entity has with ICT providers.")])

    b.mark("", "Sources")
    src = {
        "gcp": "Google Cloud, Incident report: Multiple services were experiencing issues in the europe-west2 region (incident Xs2XTHzAVC9YnafnPyzj), preliminary report 22 October 2026, final report 4 November 2026, https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj",
        "yahoo": "Yahoo Finance UK, Power outage hits Google Cloud services, disrupting UK banks, 20 October 2026, https://uk.finance.yahoo.com/news/power-outage-hits-google-cloud-141629539.html",
        "reuters": "Reuters via Yahoo Finance, Europe's financial regulators query Google over cloud outage that hit banks, 21 October 2026, https://finance.yahoo.com/technology/articles/europes-financial-regulators-query-google-154104572.html",
        "ps213": "FCA, PS21/3: Building operational resilience, 29 March 2021, https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience",
        "hmt": "HM Treasury, UK financial system strengthened with new safeguards for major technology providers, 10 July 2026, https://www.gov.uk/government/news/uk-financial-system-strengthened-with-new-safeguards-for-major-technology-providers",
        "ps262": "FCA, PS26/2: Operational incident and third party reporting, 18 March 2026, https://www.fca.org.uk/publication/policy/ps26-2.pdf",
        "ps726": "PRA, PS7/26 Operational resilience: Operational incident and third-party reporting, 18 March 2026, https://www.bankofengland.co.uk/prudential-regulation/publication/2026/march/operational-incident-and-third-party-reporting-policy-statement",
        "fca1y": "FCA, Operational resilience: insights and observations one year on, 27 March 2026, https://www.fca.org.uk/publications/good-and-poor-practice/operational-resilience-insights-observations-one-year",
        "foi": "FCA, Information on major operational incidents reported by retail banks (FOI2026/01239), 12 August 2026, https://www.fca.org.uk/freedom-information/information-major-operational-incidents-reported-retail-banks-august-2026",
        "boe": "Bank of England, PRA and FCA, UK financial regulators to begin overseeing Critical Third Parties announced by HM Treasury, 10 July 2026, https://www.bankofengland.co.uk/news/2026/july/uk-financial-regulators-to-begin-overseeing-critical-third-parties-announced-by-hmt",
        "dr301": "Commission Delegated Regulation (EU) 2025/301 on the content and time limits for major ICT-related incident reports, Article 5, OJ L 20 February 2025, https://eur-lex.europa.eu/eli/reg_del/2025/301/oj/eng",
        "tc25": "House of Commons Treasury Committee, More than one month's worth of IT failures at major banks and building societies in the last two years, March 2025, https://committees.parliament.uk/committee/158/treasury-committee/news/205611/",
        "fcanews": "FCA, FCA confirms new incident and third party rules to bolster resilience, 18 March 2026, https://www.fca.org.uk/news/news-stories/fca-confirms-new-incident-and-third-party-rules-bolster-resilience",
        "si777": "The Critical Third Parties (Designation) Regulations 2026, SI 2026/777, made 8 July 2026, https://www.legislation.gov.uk/uksi/2026/777/made",
        "ss121": "PRA, SS1/21 Operational resilience: Impact tolerances for important business services, March 2021 (as updated), https://www.bankofengland.co.uk/-/media/boe/files/prudential-regulation/supervisory-statement/2021/ss121-march-22.pdf",
        "cbi": "Central Bank of Ireland, Reporting major ICT-related incidents and significant cyber threats under DORA, accessed November 2026, https://www.centralbank.ie/regulation/digital-operational-resilience-act-dora/reporting-major-ict-related-incidents-and-significant-cyber-threats",
        "esas": "European Supervisory Authorities (EBA, EIOPA, ESMA), The ESAs designate critical ICT third-party providers under the Digital Operational Resilience Act, 18 November 2025, https://www.eba.europa.eu/publications-and-media/press-releases/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital",
        "dora": "Regulation (EU) 2022/2554 on digital operational resilience for the financial sector (DORA), Article 14 Communication, OJ L 333, 27 December 2022, https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng",
        "which": "Which?, Banking IT outages: find out how often your bank has gone down, 25 September 2026, https://www.which.co.uk/news/article/banking-it-outages-find-out-how-often-your-bank-has-gone-down-anI2M6R5x8Fr",
    }
    assert set(order) == set(src), (set(src) - set(order), set(order) - set(src))
    items = [(f"{n:02d}", t) for n, t in sorted((order[k], t) for k, t in src.items())]
    b.sources(items[:10])
    b.sources(items[10:], "Sources continued. Secondary reporting is used only where primary sources were not available.")
    b.rep_back("Ready for the<br>next six hours?", "Crises Control helps banks, insurers, payment and investment firms alert the right people in minutes, coordinate the response from one place and keep the evidence supervisors ask for.", "Request a demo",
        companion="Crisis playbook No. 01 · Within tolerance")
    return b
