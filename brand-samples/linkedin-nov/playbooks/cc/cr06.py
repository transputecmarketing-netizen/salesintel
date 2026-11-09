from cckit import CCReport, S


def build():
    b = CCReport("When the Lab Went Dark", 6, "terminal", "Healthcare", "14 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at the 2024 Synnovis ransomware attack and its long tail, what WannaCry taught the NHS, how the EPRR framework expects trusts to respond, and what UK healthcare providers should do before the next incident."
    b.rep_cover("Intelligence report", "When the lab<br>went dark.",
        "The Synnovis attack, two years on. What happens to patients, blood stocks and staff when a clinical system fails, and what the evidence says about getting the first hour right.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("One laboratory outage. Two years of recovery.", [
        f"On 3 June 2024 a ransomware attack on Synnovis, which provides pathology services to major hospitals in south east London, stopped normal blood testing. Guy's and St Thomas' and King's College Hospital declared a critical incident the next morning, with blood transfusions particularly affected.{R(2)} NHS England later reported that 10,152 acute outpatient appointments and 1,710 elective procedures were postponed at the two trusts.{R(1)}",
        f"The effects travelled far beyond the laboratory. NHS Blood and Transplant appealed for O type donors within a week and in July 2024 issued a national amber alert, saying the London hospitals had needed 94 per cent more O negative blood than a year earlier.{R(3,4)} The alert was not stood down until July 2025.{R(5)} In June 2025 King's College Hospital confirmed that a long wait for a blood test result caused by the attack was one of the factors that contributed to a patient's death.{R(6)}",
        f"The recovery was long. In early 2026 one mental health trust estimated that entering 161,560 pathology reports into patient records had been delayed, and patient data stolen in the attack was still being confirmed to trusts in 2026.{R(9,10)} Meanwhile trusts declared critical incidents for IT failures and heat-related cooling failures in the summer of 2026.{R(21,22)}",
        "This report sets out the evidence, compares it with the lessons of WannaCry and the NHS EPRR framework, and ends with practical recommendations."],
        "Assume that a clinical system will fail. Declare early in the agreed words, reach and confirm the right staff in minutes, run practised downtime procedures with your suppliers, and keep patients and partners informed until the last result is back in the record.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("A supplier incident is a clinical incident.", f"Synnovis is a pathology partner, not a trust, but the disruption landed on wards, clinics, GP practices and the blood supply.{R(2,1,4)}"),
        ("The harm was real and is now documented.", f"Reporting in June 2025 linked 170 cases of patient harm, most of them low harm, to nearly 600 incidents, and a trust confirmed the attack contributed to a death.{R(7,6)}"),
        ("Blood is the sharpest edge.", f"Without normal matching, hospitals relied on O type blood, and national O negative stocks fell to 1.6 days.{R(3,4)}"),
        ("Recovery takes far longer than response.", f"Almost two years on, one trust was still in business continuity for pathology results.{R(9)}"),
        ("The communication lessons of 2017 still apply.", f"After WannaCry the NAO found the local response plan had not been tested and staff fell back on personal phones and WhatsApp.{R(11)}"),
        ("Not every critical incident is cyber.", f"In 2026 trusts declared critical incidents over IT failures and heat-related cooling failures that stopped theatres and scanners.{R(21,22,23)}"),
        ("The rules are tightening.", f"Proposed UK law would require an initial incident notice within 24 hours, against 72 hours under the current NIS regime for health.{R(16,17)}")])

    b.facts("The lab outage, in six figures", "Each figure is sourced. Where sources measure different things, we say so in the analysis that follows.", [
        ("10,152", f"Acute outpatient appointments postponed at the two most affected trusts, according to NHS England.{R(1)}"),
        ("1,710", f"Elective procedures postponed at the same two trusts.{R(1)}"),
        ("94%", f"Increase in O negative blood needed by the affected London hospitals, against the same period a year earlier.{R(4)}"),
        ("170", f"Cases of patient harm linked to the attack, as reported in June 2025; most were classed as low harm.{R(7)}"),
        ("161,560", f"Pathology reports one trust estimated were delayed being entered into patient records, as of early January 2026.{R(9)}"),
        ("81 of 236", f"NHS trusts in England affected by WannaCry in 2017, as a minimum, according to the NAO.{R(11)}")], "At a glance")

    b.timeline("From WannaCry to a summer of critical incidents", "Key dates. Later reporting on long incidents can revise earlier figures.", [
        ("12 May 2017", "WannaCry", f"A worldwide ransomware outbreak disrupts at least 81 NHS trusts in England.{R(11)}"),
        ("July 2022", "EPRR framework, version 3", f"NHS England sets out business continuity, critical and major incident definitions.{R(12)}"),
        ("3 to 4 June 2024", "Synnovis attack", f"Critical incident declared at Guy's and St Thomas' and King's College Hospital.{R(2)}"),
        ("25 July 2024", "National amber alert", f"NHSBT asks hospitals to restrict O type blood to essential cases.{R(4)}"),
        ("26 November 2024", "Wirral major incident", f"A trust declares a major incident for cyber security reasons.{R(20)}"),
        ("June 2025", "Harm confirmed", f"A trust confirms the attack contributed to a patient's death.{R(6)}"),
        ("13 November 2025", "Review complete", f"Synnovis completes its investigation of the stolen data.{R(8)}"),
        ("June 2026", "Data and heat", f"A trust confirms data on 32,927 patients was stolen; heat forces critical incidents.{R(10,22)}"),
        ("29 July 2026", "IT critical incident", f"East Kent Hospitals declares a critical incident over IT problems.{R(21)}")])

    # PART 01
    b.mark("01", "The attack")
    b.opener("01", "The<br>attack.", "What happened when a pathology partner was hit, and how far the effects travelled.", [("01", "From laboratory to ward"), ("02", "How a supplier outage spreads"), ("03", "Reading the numbers")])
    b.essay("The attack", "From laboratory to ward in one morning", [
        f"Synnovis is a pathology partnership that runs laboratory services for hospitals and GP practices in south east London. On Monday 3 June 2024 a ransomware attack took its systems offline. By Tuesday morning Guy's and St Thomas' and King's College Hospital had declared a critical incident, and the chief executive of one trust told staff that blood transfusions were particularly affected.{R(2)}",
        f"Pathology sits underneath almost everything a hospital does. Without results, surgeons cannot confirm a patient is fit for theatre, emergency teams wait longer to rule conditions in or out, and GPs cannot manage long-term conditions. NHS England's tally of 10,152 outpatient appointments and 1,710 elective procedures postponed at the two trusts captures only part of that.{R(1)}",
        f"Blood was the most visible pressure. NHS Blood and Transplant said the affected hospitals could not match patients' blood at the usual frequency, so they relied on O type blood, which is safe for all patients.{R(3)} On 25 July it issued a national amber alert: O negative stocks stood at 1.6 days and the London hospitals had needed an extra 1.7 days of O negative since June.{R(4)} The alert was stood down from 21 July 2025, almost a year later.{R(5)}",
        f"Harm followed. Reporting in June 2025 described nearly 600 incidents linked to the attack, 170 of them involving harm to patients, most of it low harm.{R(7)} The same month King's College Hospital said a patient safety investigation had identified a long wait for a blood test result due to the attack as one of several contributing factors in a patient's death.{R(6)}",
        f"Then came the long tail. Synnovis said in November 2025 that its review of the stolen data was complete; it described the data as unstructured, incomplete and fragmented.{R(8)} In June 2026 Bedfordshire Hospitals confirmed that data on 32,927 of its patients had been taken.{R(10)} And in April 2026 one mental health trust in south London was still in business continuity, with 122 recorded patient safety incidents involving incorrect, unavailable or delayed results.{R(9)}",
        "None of this is a judgement on the people who responded. Clinicians, scientists and managers worked around the clock. It is a measure of how deeply one system runs through modern care."],
        "The attack", "Pathology sits underneath almost everything a hospital does.")
    b.figpage("How it spreads", "Four routes from one supplier to every patient", "How the Synnovis disruption travelled, as described by NHS England, NHSBT and the trusts.", "hub", [
        ("Results stop", f"Tests cannot be requested, processed or reported normally, so clinicians work blind or on paper.{R(2,3)}"),
        ("Planned care slows", f"Operations and clinics that depend on results are postponed and rebooked.{R(1)}"),
        ("Blood stocks fall", f"Hospitals use more universal O type blood, which puts pressure on the national supply.{R(3,4)}"),
        ("Records lag behind", f"Results reach patient records months later, and stolen data surfaces years later.{R(9,10)}")], "The attack")
    b.table("Reading the numbers", "What each figure actually counts", "Figures from long incidents change as reviews finish. None should be read as the full cost to patients.", ["Figure", "Source", "What it measures"], [
        ("10,152 and 1,710", f"NHS England{R(1)}", "Outpatient appointments and elective procedures postponed at the two most affected trusts. Excludes GP and other services."),
        ("94%", f"NHSBT, July 2024{R(4)}", "Extra O negative blood needed by the affected London hospitals since June, compared with the same period a year earlier."),
        ("170", f"HSJ via PA, June 2025{R(7)}", "Cases of harm among nearly 600 incidents linked to the attack. Severity counts differ between reports, so we give only the total."),
        ("161,560", f"Trust estimate via The Record{R(9)}", "Pathology reports whose entry into records at one trust had been delayed, as of early January 2026."),
        ("32,927", f"Bedfordshire Hospitals{R(10)}", "Patients whose data was stolen. Other trusts have published their own counts."),
        ("UK total", f"Synnovis{R(8)}", "Synnovis has not published how many people's data was affected.")], "The attack", "34mm 46mm 1fr")

    # PART 02
    b.mark("02", "The pattern")
    b.opener("02", "The<br>pattern.", "Synnovis was not the first major incident to start in IT, and it will not be the last.", [("01", "What WannaCry taught the NHS"), ("02", "Incidents since 2024"), ("03", "What the framework expects"), ("04", "Where providers fall short")])
    b.essay("The pattern", "What WannaCry taught, and what it did not", [
        f"On Friday 12 May 2017 the WannaCry ransomware spread worldwide. The National Audit Office found that at least 81 of the 236 trusts in England were affected, along with 603 primary care and other NHS organisations, including 595 GP practices.{R(11)} NHS England recorded 6,912 cancelled appointments and estimated that over 19,000 would have been cancelled in total. Five A&E departments diverted patients.{R(11)}",
        f"The NAO's findings on the response read as a checklist for today. The Department had a plan with defined roles, but had not tested it at a local level. Many local organisations could not reach national NHS bodies by email, and locally staff shared information through personal mobile devices, including WhatsApp.{R(11)}",
        f"The NAO also judged that the attack was relatively unsophisticated and could have been prevented by following basic IT security best practice.{R(11)} Since then the government has set a goal for all health and social care organisations to achieve cyber resilience no later than 2030.{R(24)}",
        f"Synnovis was different in one important way: the system that failed belonged to a partner. That pattern has repeated. An ICO penalty notice in March 2025 fined Advanced, a software supplier, about £3.07m after a 2022 ransomware attack that disrupted NHS 111 and exposed data, including details of how to gain entry to the homes of 890 people receiving care.{R(18)} In February 2025 HCRG Care Group, a large independent provider of NHS community services, confirmed it was investigating an IT security incident while services continued.{R(19)}",
        f"And not every critical incident is a cyber attack. In June 2026 a Portsmouth hospital declared a critical incident when chillers failed in a heatwave, affecting digital systems, theatres, cardiac catheter laboratories and scanning; another trust lost its MRI scanners to the heat.{R(22,23)} In July 2026 East Kent Hospitals declared one over IT problems without, at first, knowing the cause.{R(21)}",
        "The common thread is not the cause. It is the first hour: who declares, who is called in, how staff and patients are told, and whether care can carry on without the system."],
        "The pattern", "The common thread is not the cause. It is the first hour.")
    b.table("Since 2024", "UK healthcare incidents that started in technology", "A selection with public, sourced detail. Causes and impacts are as reported by the organisations or regulators.", ["Incident", "What happened", "What it shows"], [
        ("WannaCry, May 2017", f"Ransomware across the NHS; at least 81 trusts affected.{R(11)}", "Plans must be tested locally, with a fallback channel."),
        ("Synnovis, June 2024", f"Ransomware at a pathology partner; critical incident at two trusts.{R(2)}", "Supplier failure becomes clinical risk and a national blood issue."),
        ("Wirral, November 2024", f"Major incident declared for cyber security reasons; outpatients cancelled.{R(20)}", "Trusts do declare major incidents for cyber attacks."),
        ("HCRG Care Group, February 2025", f"Independent provider investigating an IT security incident; services continued.{R(19)}", "Independent providers face the same threat."),
        ("Advanced, fined March 2025", f"ICO fine of about £3.07m for a 2022 attack that disrupted NHS 111.{R(18)}", "Regulators now act against suppliers."),
        ("Heatwave, June 2026", f"Chillers fail; theatres, cath labs and scanning affected.{R(22,23)}", "Estates and digital failures arrive together."),
        ("East Kent, July 2026", f"Critical incident over IT problems of unknown cause.{R(21)}", "Declare first; find the cause later.")], "The pattern", "40mm 1fr 1fr")
    b.essay("The framework", "What the NHS framework expects", [
        f"Every NHS-funded organisation works to the NHS Emergency Preparedness, Resilience and Response Framework. Version 3, published in July 2022, defines a business continuity incident, a critical incident and a major incident, and sets incident response levels from 1, managed within one organisation, to 4, led nationally by NHS England.{R(12)}",
        f"A critical incident, in the framework's words, is any localised incident where the level of disruption results in an organisation temporarily or permanently losing its ability to deliver critical services, or where patients and staff may be at risk of harm. It is principally an internal escalation response, and the framework asks organisations to use the format “Critical Incident declared by (organisation)”.{R(12)}",
        f"The framework also sets out standard major incident messages, the METHANE and SBAR formats for sharing information, a 24/7 on-call system with a director able to allocate resources, and notification to the ICB, which informs NHS England through regional on-call. It expects a hot debrief within 48 hours of stand down and a structured debrief within 28 days.{R(12)}",
        f"Compliance is tested every year against the NHS Core Standards for EPRR. The NHS Standard Contract requires providers of NHS-funded services, including independent providers, to comply with EPRR guidance.{R(12)} NHS England grades organisations from fully compliant, meeting 100 per cent of the relevant standards, through substantial and partial to non-compliant, and its 2026/27 process keeps the approach of previous years.{R(13)} In the 2024 round, one acute trust reported assessing itself against 62 core standards, plus a deep dive of 11 standards on cyber security.{R(14)}",
        f"Cyber incidents carry extra duties. NHS trusts, foundation trusts, ICBs and certain independent providers are operators of essential services under the NIS Regulations, and must report network and information system incidents through the DSPT no later than 72 hours after becoming aware.{R(16)} The Cyber Security and Resilience Bill proposes an initial notice within 24 hours and a full report within 72 hours; those measures would follow Royal Assent and secondary legislation.{R(17)}",
        f"Pressure from demand is measured separately, through the OPEL framework, which makes declaring an incident a decision for the provider under the EPRR framework.{R(15)} The tools exist. The question is whether they are practised."],
        "The framework", "The tools exist. The question is whether they are practised.")
    b.compare("Common gaps", "Where providers fall short in the first hour", "The gap is rarely the plan. It is practice, people and partners.", ["Area", "What often happens", "What good looks like"], [
        ("Declaring", "Teams fix quietly and declare late, waiting for certainty.", "Written triggers, named roles with authority, the standard wording."),
        ("Calling staff in", "Phone trees and email; nobody knows who is coming.", "Role-based alerts on several channels, with acknowledgement and escalation."),
        ("Suppliers", "The lab, EPR or estates partner is not on the call list.", "Joint call lists, joint exercises and a shared incident log."),
        ("Downtime", "Folders exist but have not been used this year.", "Printed, practised procedures, including transfusion and results back-entry."),
        ("Communication", "Staff rely on personal messaging when email fails.", "An agreed out-of-band channel and fixed update times."),
        ("Recovery", "The incident is closed while results are still missing.", "A recovery cell and debriefs on the framework's timetable."),
        ("Staff welfare", "The same people work the first twelve hours and the next day.", "Rotas planned in the first hour, welfare checks and a clear stand down.")], "The pattern")

    # PART 03
    b.mark("03", "What to do")
    b.opener("03", "What to<br>do now.", "What the evidence means for UK healthcare providers, and the steps that close the gap.", [("01", "What it means for UK healthcare"), ("02", "Recommendations"), ("03", "Questions for the board")])
    b.essay("UK relevance", "What it means for UK organisations in healthcare", [
        f"For NHS trusts, the lesson of Synnovis is that resilience now runs through partners. Pathology networks, imaging, electronic records, estates and community services are often delivered by other organisations. If they are not on your incident call lists, and you are not on theirs, the first hour will be spent finding phone numbers.{R(2,8)}",
        f"For independent providers with NHS contracts, the expectations are the same. The NHS Standard Contract requires compliance with EPRR guidance, and certain independent providers are operators of essential services under the NIS Regulations.{R(12,16)} The 2025 attack on HCRG Care Group showed that the threat does not distinguish between sectors.{R(19)}",
        f"For boards, the question is not whether a plan exists. The NAO's finding after WannaCry was that the plan had not been tested locally.{R(11)} Annual EPRR assurance asks the question every year; boards should ask it more often, and ask for evidence: time to declare, time to confirm staff, time to first paper result.{R(13)}",
        f"For winter, the risks stack. An IT failure on a day at the highest OPEL level, with staff sickness and full emergency departments, leaves little slack. Linking OPEL levels to your incident triggers and call-in lists means the response grows with the pressure.{R(15)}",
        "For staff, long incidents are exhausting. Synnovis and its aftermath ran for months. Rotas, welfare checks and a clear stand down matter as much as the first alert.",
        "The practical test is simple. If your laboratory system went dark at 08:10 tomorrow, who would declare, how quickly would you know who was coming in, and could every ward get an urgent result on paper?"],
        "UK relevance", "If your laboratory system went dark at 08:10 tomorrow, who would declare?")
    b.steps("Recommendations", "Seven steps for healthcare providers", "In priority order. The first three can start this week.", [
        ("Write declaration triggers", f"Use the EPRR definitions and wording; name who can declare.{R(12)}"),
        ("Call staff in by role, and confirm", "Alerts by role on several channels, with acknowledgement and escalation."),
        ("Agree an out-of-band channel", f"Decide how staff talk if email is down or untrusted.{R(11)}"),
        ("Put suppliers on your incident lists", f"Pathology, imaging, EPR and estates, with joint exercises.{R(1,10)}"),
        ("Practise downtime, including blood", f"Paper requests, phoned results, O type use and back-entry.{R(3,9)}"),
        ("Link pressure and incident triggers", f"Tie OPEL levels and heat or cold alerts to your severity ladder.{R(15,22)}"),
        ("Debrief and report on time", f"Hot debrief within 48 hours, structured within 28 days.{R(12)}")], "What to do")
    b.questions("For the board", "Questions boards should ask this quarter", "Answers should be specific, dated and owned.", [
        ("Readiness", ["Who can declare a critical incident tonight, and when did we last test that they would?", "How long does it take us to confirm who is coming in after a call-in?", "Could every ward get an urgent blood result with no computers?"]),
        ("Partners and recovery", ["Which suppliers could stop clinical care, and are they in our incident plans?", "Would we know within 72 hours if we had to report a cyber incident, and who would do it?", "How do we look after the staff who carry a long incident?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("EPRR", "Emergency preparedness, resilience and response: the NHS England framework for incidents and emergencies."),
        ("Business continuity incident", "Disruption to normal service below acceptable levels that needs special arrangements."),
        ("Critical incident", "Localised loss of ability to deliver critical services, or risk of harm to patients and staff."),
        ("Major incident", "An event with serious consequences needing special arrangements by one or more responder agencies."),
        ("Core Standards", "The minimum EPRR requirements NHS-funded organisations assess themselves against each year."),
        ("OPEL", "Operational pressures escalation levels, from 1 to 4."),
        ("Pathology", "Laboratory testing of blood, tissue and other samples."),
        ("O negative", "The universal donor blood type, used when a patient's blood cannot be matched."),
        ("Ransomware", "Malicious software that locks or steals data to extort payment."),
        ("NIS Regulations", "The Network and Information Systems Regulations 2018, which set security and reporting duties for essential services."),
        ("DSPT", "The Data Security and Protection Toolkit, used to report incidents in health and care."),
        ("ICB", "Integrated care board, the NHS body that plans and coordinates services across a local area.")])

    b.mark("", "Sources")
    src = [
        "NHS England London, Latest media statement on Synnovis cyber-attack, https://www.england.nhs.uk/london/synnovis-ransomware-cyber-attack/latest-media-statement-on-synnovis-cyber-attack/",
        "The Register, Suspected cyberattack hits major London hospitals, 4 June 2024, https://www.theregister.com/2024/06/04/suspected_cyberattack_hits_major_london/",
        "NHS Blood and Transplant, O Positive and O Negative donors asked to urgently book appointments following London hospitals IT incident, 10 June 2024, https://www.nhsbt.nhs.uk/news/o-positive-and-o-negative-donors-asked-to-urgently-book-appointments-to-give-blood-following-london-hospitals-it-incident/",
        "NHS Blood and Transplant, NHS calls national blood shortage amber alert, 25 July 2024, https://www.nhsbt.nhs.uk/news/nhs-calls-national-blood-shortage-amber-alert/",
        "NHS Blood and Transplant, National blood shortage alert to be stood down from 21 July, 18 July 2025, https://www.nhsbt.nhs.uk/news/national-blood-shortage-alert-to-be-stood-down-from-21-july-following-amazing-response-from-donors-and-hospitals/",
        "The Record, Ransomware attack contributed to patient's death, says Britain's NHS, 25 June 2025, https://therecord.media/ransomware-attack-contributed-patient-death-uk-nhs",
        "Express and Star (PA), 170 patients harmed as a result of cyber attack, 18 June 2025, https://www.expressandstar.com/uk-news/2025/06/18/170-patients-harmed-as-a-result-of-cyber-attack",
        "The Register, NHS supplier ends probe into ransomware attack that contributed to patient death, 13 November 2025, https://www.theregister.com/2025/11/13/synnovis_qilin_investigation/",
        "The Record, Ransomware attack continues to disrupt healthcare in London nearly two years later, 17 April 2026, https://therecord.media/ransomware-nhs-cyberattack-disruption",
        "Digital Health, Almost 33,000 Bedfordshire patients had data stolen in cyber attack, June 2026, https://www.digitalhealth.net/2026/06/almost-33000-bedfordshire-patients-had-data-stolen-in-cyber-attack/",
        "National Audit Office, Investigation: WannaCry cyber attack and the NHS, 27 October 2017, https://www.nao.org.uk/reports/investigation-wannacry-cyber-attack-and-the-nhs/",
        "NHS England, NHS Emergency Preparedness, Resilience and Response Framework, version 3, July 2022, https://www.england.nhs.uk/wp-content/uploads/2022/07/B0900-NHS-Emergency-Preparedness-Resilience-and-Response-Framework-version-3.pdf",
        "NHS England, 2026/27 EPRR annual assurance process, https://www.england.nhs.uk/long-read/2026-27-eprr-annual-assurance-process/",
        "Oxford University Hospitals, EPRR Core Standards report 2024 (trust board paper TB2025.11), January 2025, https://www.ouh.nhs.uk/media/ca4h3l5n/tb202511-eprrcs-report.pdf",
        "NHS England, Integrated OPEL framework 2024 to 2026, https://www.england.nhs.uk/long-read/integrated-opel-framework-2024-to-2026/",
        "DHSC, The NIS Regulations 2018: guide for the health sector in England, updated 27 September 2023, https://www.gov.uk/government/publications/network-and-information-systems-regulations-2018-health-sector-guide",
        "DSIT, Cyber Security and Resilience Bill factsheet: incident reporting, updated 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/incident-reporting",
        "ICO, Software provider fined £3m following 2022 ransomware attack, March 2025, https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/03/software-provider-fined-3m-following-2022-ransomware-attack/",
        "TechCrunch, UK healthcare giant HCRG confirms hack after ransomware gang claims theft of sensitive data, 20 February 2025, https://techcrunch.com/2025/02/20/uk-healthcare-giant-hcrg-confirms-hack-after-ransomware-gang-claims-theft-of-sensitive-data",
        "The Record, British hospital group declares major incident following cyberattack, 26 November 2024, https://therecord.media/england-hospitals-cyberattack-nhs-wirral",
        "PublicTechnology, East Kent Hospitals declare critical incident over ongoing IT issues, 31 July 2026, https://www.publictechnology.net/2026/07/31/health-and-social-care/east-kent-hospitals-declare-critical-incident-over-ongoing-it-issues/",
        "ITV News Meridian, Hospital declares critical incident as heat causes cooling systems to fail, 24 June 2026, https://www.itv.com/news/meridian/2026-06-24/hospital-declares-critical-incident-as-heat-causes-cooling-systems-to-fail",
        "Digital Health, NHS hospitals declare critical incidents as heat causes IT failures, June 2026, https://www.digitalhealth.net/2026/06/nhs-hospitals-declare-critical-incidents-as-heat-causes-it-failures/",
        "DHSC, Cyber security strategy for health and social care: 2023 to 2030, 22 March 2023, https://www.gov.uk/government/publications/cyber-security-strategy-for-health-and-social-care-2023-to-2030",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    items = [(f"{n:02d}", t) for n, t in items]
    b.sources(items[:12], "Accessed November 2026. Early reporting on long incidents can change.")
    b.sources(items[12:], "Sources continued. Secondary reporting is used only where it adds detail.")
    b.rep_back("Ready before<br>the next outage?", "Crises Control helps NHS trusts and independent providers call staff in by role, see who has acknowledged, run downtime procedures as tasks and keep a full record for the debrief.", "Request a demo",
        companion="Crisis playbook No. 06 · Major incident, minute one")
    return b
