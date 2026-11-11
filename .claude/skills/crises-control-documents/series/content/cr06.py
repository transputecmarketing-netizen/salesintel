from cckit import CCReport, S


def build():
    b = CCReport("When the Lab Went Dark", 6, "terminal", "Healthcare", "14 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at the 2024 Synnovis attack in the UK and its long tail, set beside US cases and the rules in the UK, US, EU and Middle East, with lessons for hospitals and health systems anywhere."
    b.rep_cover("Intelligence report", "When the lab<br>went dark.",
        "A UK pathology outage, two years on, and what it teaches hospitals everywhere. What happens to patients, blood stocks and staff when a clinical system fails, and how to get the first hour right.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("One laboratory outage. Two years of recovery.", [
        f"<b>United Kingdom:</b> on 3 June 2024 a ransomware attack on Synnovis, which provides pathology services to major hospitals in south east London, stopped normal blood testing. Guy's and St Thomas' and King's College Hospital declared a critical incident the next morning, with blood transfusions particularly affected.{R(2)} NHS England later reported that 10,152 acute outpatient appointments and 1,710 elective procedures were postponed at the two trusts.{R(1)}",
        f"The effects travelled far beyond the laboratory. The national blood service appealed for O type donors within a week and in July 2024 issued a national amber alert, saying the London hospitals had needed 94 per cent more O negative blood than a year earlier.{R(3,4)} In June 2025 King's College Hospital confirmed that a long wait for a blood test result caused by the attack was one of the factors that contributed to a patient's death.{R(6)} Almost two years on, one provider was still in business continuity for pathology.{R(9)}",
        f"The pattern is international. <b>United States:</b> in 2024 a ransomware attack on Change Healthcare disrupted claims and payments for providers and, UnitedHealth later estimated, affected the data of about 190 million people; an attack on Ascension forced several hospitals to divert ambulances and move to paper records.{R(26,25)} And not every incident is cyber: in 2026 English hospitals declared critical incidents over IT failures and heat-related cooling failures.{R(21,22)}",
        "This report sets out the evidence, compares it with earlier lessons and the rules in the UK, the US, the EU and the Middle East, and ends with practical recommendations for any hospital or health system."],
        "Assume that a clinical system will fail. Declare early in agreed words, reach and confirm the right staff in minutes, run practised downtime procedures with your suppliers, and keep patients and partners informed until the last result is back in the record.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("A supplier incident is a clinical incident.", f"In the UK case, Synnovis was a pathology partner, not a hospital, but the disruption landed on wards, clinics, GP practices and the blood supply.{R(2,1,4)}"),
        ("The harm was real and is now documented.", f"UK reporting in June 2025 linked 170 cases of patient harm, most of them low harm, to nearly 600 incidents, and a hospital confirmed the attack contributed to a death.{R(7,6)}"),
        ("Blood is the sharpest edge.", f"Without normal matching, the London hospitals relied on O type blood, and national O negative stocks fell to 1.6 days.{R(3,4)}"),
        ("Recovery takes far longer than response.", f"Almost two years on, one UK provider was still in business continuity for pathology results.{R(9)}"),
        ("It is not only a UK problem.", f"In the US, the Change Healthcare and Ascension attacks in 2024 disrupted payments, patient records and ambulance flows.{R(26,25)}"),
        ("Not every critical incident is cyber.", f"In 2026 English hospitals declared critical incidents over IT failures and heat-related cooling failures that stopped theatres and scanners.{R(21,22,23)}"),
        ("Reporting clocks are short, and they differ.", f"Under the EU's NIS2, an early warning is due within 24 hours; in England, NIS reporting for health is 72 hours, with 24 hours proposed.{R(31,16,17)}")])

    b.facts("The outage and its echoes, in six figures", "Each figure is sourced. Where sources measure different things, we say so in the analysis that follows.", [
        ("10,152", f"Acute outpatient appointments postponed at the two most affected London trusts (UK), according to NHS England.{R(1)}"),
        ("1,710", f"Elective procedures postponed at the same two trusts.{R(1)}"),
        ("94%", f"Increase in O negative blood needed by the affected London hospitals, against the same period a year earlier.{R(4)}"),
        ("170", f"Cases of patient harm linked to the Synnovis attack, as reported in June 2025; most were classed as low harm.{R(7)}"),
        ("161,560", f"Pathology reports one UK provider estimated were delayed being entered into patient records, as of early January 2026.{R(9)}"),
        ("190m", f"People whose data UnitedHealth estimated was affected by the 2024 Change Healthcare attack in the US.{R(26)}")], "At a glance")

    b.timeline("From WannaCry to a summer of critical incidents", "Key dates, UK unless marked. Later reporting on long incidents can revise earlier figures.", [
        ("12 May 2017", "WannaCry", f"A worldwide ransomware outbreak disrupts at least 81 NHS trusts in England.{R(11)}"),
        ("February 2024", "Change Healthcare (US)", f"Ransomware disrupts claims and payments for US providers.{R(26)}"),
        ("May 2024", "Ascension (US)", f"Several hospitals divert ambulances; staff move to paper records.{R(25)}"),
        ("3 to 4 June 2024", "Synnovis attack", f"Critical incident declared at Guy's and St Thomas' and King's College Hospital.{R(2)}"),
        ("25 July 2024", "National amber alert", f"The national blood service asks hospitals to restrict O type blood to essential cases.{R(4)}"),
        ("26 November 2024", "Wirral major incident", f"A trust declares a major incident for cyber security reasons.{R(20)}"),
        ("June 2025", "Harm confirmed", f"A trust confirms the attack contributed to a patient's death.{R(6)}"),
        ("June 2026", "Data and heat", f"A trust confirms data on 32,927 patients was stolen; heat forces critical incidents.{R(10,22)}"),
        ("29 July 2026", "IT critical incident", f"East Kent Hospitals declares a critical incident over IT problems.{R(21)}")])

    # PART 01
    b.mark("01", "The attack")
    b.opener("01", "The<br>attack.", "What happened when a UK pathology partner was hit, and how far the effects travelled.", [("01", "From laboratory to ward"), ("02", "How a supplier outage spreads"), ("03", "Reading the numbers")])
    b.essay("The attack", "From laboratory to ward in one morning", [
        f"Synnovis is a pathology partnership that runs laboratory services for hospitals and GP practices in south east London, in the UK. On Monday 3 June 2024 a ransomware attack took its systems offline. By Tuesday morning Guy's and St Thomas' and King's College Hospital had declared a critical incident, and the chief executive of one trust told staff that blood transfusions were particularly affected.{R(2)}",
        f"Pathology sits underneath almost everything a hospital does. Without results, surgeons cannot confirm a patient is fit for theatre, emergency teams wait longer to rule conditions in or out, and family doctors cannot manage long-term conditions. NHS England's tally of 10,152 outpatient appointments and 1,710 elective procedures postponed at the two trusts captures only part of that.{R(1)}",
        f"Blood was the most visible pressure. NHS Blood and Transplant said the affected hospitals could not match patients' blood at the usual frequency, so they relied on O type blood, which is safe for all patients.{R(3)} On 25 July it issued a national amber alert: O negative stocks stood at 1.6 days and the London hospitals had needed an extra 1.7 days of O negative since June.{R(4)} The alert was stood down from 21 July 2025, almost a year later.{R(5)}",
        f"Harm followed. Reporting in June 2025 described nearly 600 incidents linked to the attack, 170 of them involving harm to patients, most of it low harm.{R(7)} The same month King's College Hospital said a patient safety investigation had identified a long wait for a blood test result due to the attack as one of several contributing factors in a patient's death.{R(6)}",
        f"Then came the long tail. Synnovis said in November 2025 that its review of the stolen data was complete; it described the data as unstructured, incomplete and fragmented.{R(8)} In June 2026 Bedfordshire Hospitals confirmed that data on 32,927 of its patients had been taken.{R(10)} And in April 2026 one mental health trust in south London was still in business continuity, with 122 recorded patient safety incidents involving incorrect, unavailable or delayed results.{R(9)}",
        "None of this is a judgement on the people who responded. Clinicians, scientists and managers worked around the clock. It is a measure of how deeply one system runs through modern care, in any country."],
        "The attack", "Pathology sits underneath almost everything a hospital does.")
    b.figpage("How it spreads", "Four routes from one supplier to every patient", "How the Synnovis disruption travelled, as described by NHS England, NHS Blood and Transplant and the trusts (UK).", "hub", [
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
    b.opener("02", "The<br>pattern.", "Synnovis was not the first major incident to start in IT, and it will not be the last, in the UK or anywhere else.", [("01", "What WannaCry taught"), ("02", "Incidents in the UK and the US"), ("03", "What the UK framework expects"), ("04", "How the rules differ by region"), ("05", "Where providers fall short")])
    b.essay("The pattern", "What WannaCry taught, and what it did not", [
        f"On Friday 12 May 2017 the WannaCry ransomware spread worldwide. In England, the National Audit Office found that at least 81 of the 236 NHS trusts were affected, along with 603 primary care and other NHS organisations, including 595 GP practices.{R(11)} NHS England recorded 6,912 cancelled appointments and estimated that over 19,000 would have been cancelled in total. Five A&E departments diverted patients.{R(11)}",
        f"The NAO's findings on the response read as a checklist for today. The Department of Health had a plan with defined roles, but had not tested it at a local level. Many local organisations could not reach national bodies by email, and locally staff shared information through personal mobile devices, including WhatsApp.{R(11)}",
        f"Synnovis was different in one important way: the system that failed belonged to a partner. That pattern repeats. <b>United States:</b> the February 2024 attack on Change Healthcare, a claims and payments business, left providers unable to get paid, verify insurance or file prior authorisations.{R(26)} <b>United Kingdom:</b> an ICO penalty notice in March 2025 fined Advanced, a software supplier, about £3.07m after a 2022 ransomware attack that disrupted NHS 111.{R(18)}",
        f"Hospital systems are hit directly too. In May 2024 a cyber attack on Ascension, which operates 140 hospitals in 19 US states, took its electronic records offline; several hospitals diverted ambulances and staff moved to paper.{R(25)} In the UK, Wirral declared a major incident for cyber security reasons in November 2024.{R(20)}",
        f"And not every critical incident is a cyber attack. In June 2026 a Portsmouth hospital declared a critical incident when chillers failed in a heatwave, affecting digital systems, theatres, cardiac catheter laboratories and scanning; another trust lost its MRI scanners to the heat.{R(22,23)} In July 2026 East Kent Hospitals declared one over IT problems without, at first, knowing the cause.{R(21)}",
        "The common thread is not the cause. It is the first hour: who declares, who is called in, how staff and patients are told, and whether care can carry on without the system."],
        "The pattern", "The common thread is not the cause. It is the first hour.")
    b.table("Since 2017", "Healthcare incidents that started in technology or the plant room", "A selection with public, sourced detail. Causes and impacts are as reported by the organisations or regulators.", ["Incident", "What happened", "What it shows"], [
        ("WannaCry, UK, May 2017", f"Ransomware across the NHS; at least 81 trusts affected.{R(11)}", "Plans must be tested locally, with a fallback channel."),
        ("Change Healthcare, US, Feb 2024", f"Ransomware at a claims and payments business; data of about 190 million people affected.{R(26)}", "A supplier far from the ward can stop the business of care."),
        ("Ascension, US, May 2024", f"Records offline; several hospitals divert ambulances; paper working.{R(25)}", "Downtime procedures are needed at scale, for weeks."),
        ("Synnovis, UK, June 2024", f"Ransomware at a pathology partner; critical incident at two trusts.{R(2)}", "Supplier failure becomes clinical risk and a national blood issue."),
        ("Wirral, UK, November 2024", f"Major incident declared for cyber security reasons; outpatients cancelled.{R(20)}", "Hospitals do declare major incidents for cyber attacks."),
        ("Advanced, UK, fined March 2025", f"ICO fine of about £3.07m for a 2022 attack that disrupted NHS 111.{R(18)}", "Regulators now act against suppliers."),
        ("Heatwave, UK, June 2026", f"Chillers fail; theatres, cath labs and scanning affected.{R(22,23)}", "Estates and digital failures arrive together."),
        ("East Kent, UK, July 2026", f"Critical incident over IT problems of unknown cause.{R(21)}", "Declare first; find the cause later.")], "The pattern", "44mm 1fr 1fr")
    b.essay("The UK framework", "United Kingdom: what NHS England's framework expects", [
        f"This page describes England. Every NHS-funded organisation there works to the NHS Emergency Preparedness, Resilience and Response Framework. Version 3, published in July 2022, defines a business continuity incident, a critical incident and a major incident, and sets incident response levels from 1, managed within one organisation, to 4, led nationally by NHS England.{R(12)}",
        f"A critical incident, in the framework's words, is any localised incident where the level of disruption results in an organisation temporarily or permanently losing its ability to deliver critical services, or where patients and staff may be at risk of harm. It is principally an internal escalation response, and the framework asks organisations to use the format “Critical Incident declared by (organisation)”.{R(12)}",
        f"The framework also sets out standard major incident messages, the METHANE and SBAR formats for sharing information, a 24/7 on-call system with a director able to allocate resources, and notification to the integrated care board, which informs NHS England through regional on-call. It expects a hot debrief within 48 hours of stand down and a structured debrief within 28 days.{R(12)}",
        f"Compliance is tested every year against the NHS Core Standards for EPRR. The NHS Standard Contract requires providers of NHS-funded services, including independent providers, to comply with EPRR guidance.{R(12)} NHS England grades organisations from fully compliant, meeting 100 per cent of the relevant standards, through substantial and partial to non-compliant, and its 2026/27 process keeps the approach of previous years.{R(13)} In the 2024 round, one acute trust reported assessing itself against 62 core standards, plus a deep dive of 11 standards on cyber security.{R(14)}",
        f"Cyber incidents carry extra duties. NHS trusts, foundation trusts, integrated care boards and certain independent providers are operators of essential services under the NIS Regulations, and must report network and information system incidents through the DSPT no later than 72 hours after becoming aware.{R(16)} The Cyber Security and Resilience Bill proposes an initial notice within 24 hours and a full report within 72 hours; those measures would follow Royal Assent and secondary legislation.{R(17)}",
        f"Pressure from demand is measured separately, through the OPEL framework, which leaves declaring an incident as a decision for the provider under the EPRR framework.{R(15)} The tools exist. The question is whether they are practised."],
        "The UK framework", "The tools exist. The question is whether they are practised.")
    b.regions("Regional notes", "How the rules differ: preparedness and reporting", "The first hour looks the same everywhere. The rules around it do not. A summary of what applies to hospitals in each region, and how fast a cyber or data incident must be reported.", [
        ("United Kingdom", f"<b>England:</b> NHS-funded providers work to the EPRR Framework and annual Core Standards assurance.{R(12,13)} Operators of essential services in health report network and information system incidents through the DSPT within 72 hours; a Bill proposes a 24-hour initial notice.{R(16,17)}",
         "Scotland, Wales and Northern Ireland have their own arrangements. Data breaches can need a separate report to the data protection regulator."),
        ("United States", f"Medicare and Medicaid hospitals must meet the CMS emergency preparedness rule, 42 CFR 482.15: all-hazards plan, communication plan, training and testing, reviewed at least every 2 years, with exercises twice a year.{R(27)} The Joint Commission's revised Emergency Management standards apply to accredited hospitals from July 2022.{R(28)} HIPAA breach notices to individuals are due within 60 days of discovery.{R(30)}",
         f"Many hospitals run their response with the Hospital Incident Command System (HICS).{R(29)}"),
        ("European Union", f"Preparedness is set nationally. Under NIS2, health is a sector of high criticality: an early warning within 24 hours of becoming aware of a significant incident, a notification within 72 hours and a final report within one month.{R(31)} The CER Directive covers health; critical entities were to be identified by 17 July 2026.{R(32)}",
         "Both directives work through national law, transposed from 17 October 2024. Check your hospital's status with your national authority."),
        ("Middle East (UAE and Saudi Arabia)", f"<b>Dubai:</b> the DHA healthcare emergencies framework, effective 14 January 2025, requires annual hazard analysis, an emergency operations centre for hospitals, a 24/7 contact for DHA and at least one exercise a year.{R(33)} <b>Abu Dhabi</b> launched a healthcare business continuity standard in May 2025.{R(34)} The UAE national standard is AE/SCNS/NCEMA 7000:2021.{R(35)}",
         f"<b>Saudi Arabia:</b> CBAHI accreditation is linked to hospital licence renewal.{R(36)} JCI surveys use its 8th edition hospital standards from 1 January 2025.{R(37)}")], "The pattern")
    b.compare("Common gaps", "Where providers fall short in the first hour", "The gap is rarely the plan. It is practice, people and partners.", ["Area", "What often happens", "What good looks like"], [
        ("Declaring", "Teams fix quietly and declare late, waiting for certainty.", "Written triggers, named roles with authority, agreed wording."),
        ("Calling staff in", "Phone trees and email; nobody knows who is coming.", "Role-based alerts on several channels, with acknowledgement and escalation."),
        ("Suppliers", "The lab, record or estates partner is not on the call list.", "Joint call lists, joint exercises and a shared incident log."),
        ("Downtime", "Folders exist but have not been used this year.", "Printed, practised procedures, including transfusion and results back-entry."),
        ("Communication", "Staff rely on personal messaging when email fails.", "An agreed out-of-band channel and fixed update times."),
        ("Recovery", "The incident is closed while results are still missing.", "A recovery cell and debriefs on a set timetable."),
        ("Staff welfare", "The same people work the first twelve hours and the next day.", "Rotas planned in the first hour, welfare checks and a clear stand down.")], "The pattern")

    # PART 03
    b.mark("03", "What to do")
    b.opener("03", "What to<br>do now.", "What the evidence means for hospitals and health systems, and the steps that close the gap.", [("01", "What it means for organisations in healthcare"), ("02", "Recommendations"), ("03", "Questions for the board")])
    b.essay("What it means", "What it means for organisations in healthcare", [
        f"For hospitals, the first lesson is that resilience now runs through partners. Pathology networks, imaging, electronic records, claims and payments, estates and community services are often delivered by other organisations. If they are not on your incident call lists, and you are not on theirs, the first hour will be spent finding phone numbers.{R(2,26)}",
        f"For health systems, the second lesson is scale. Ascension's attack took offline the electronic records of a system with 140 hospitals in 19 states; Synnovis touched every hospital and practice that relied on one laboratory.{R(25,1)} Incident command has to work across sites, with one picture of who is coming in and what is still open.",
        f"For boards, the question is not whether a plan exists. The NAO's finding after WannaCry was that the plan had not been tested locally.{R(11)} Regulators and accreditors ask for exercises; in the US, CMS expects at least two a year.{R(27)} Boards should ask for evidence: time to declare, time to confirm staff, time to the first paper result.",
        "For seasonal peaks, the risks stack. An IT failure on a day of full emergency departments and staff sickness leaves little slack. Linking your escalation levels to incident triggers and call-in lists means the response grows with the pressure.",
        f"For compliance, the clocks are short and they differ: 24 hours for an early warning under NIS2, 72 hours under England's NIS rules, 60 days for HIPAA breach notices to individuals.{R(31,16,30)} Know which apply before the day.",
        "The practical test is simple. If your laboratory system went dark at 08:10 tomorrow, who would declare, how quickly would you know who was coming in, and could every ward get an urgent result on paper?"],
        "What it means", "If your laboratory system went dark at 08:10 tomorrow, who would declare?")
    b.steps("Recommendations", "Seven steps for hospitals and health systems", "In priority order. The first three can start straight away.", [
        ("Write declaration triggers", "Use your framework's definitions and wording; name who can declare."),
        ("Call staff in by role, and confirm", "Alerts by role on several channels, with acknowledgement and escalation."),
        ("Agree an out-of-band channel", f"Decide how staff talk if email is down or untrusted.{R(11)}"),
        ("Put suppliers on your incident lists", f"Laboratory, imaging, records, payments and estates, with joint exercises.{R(1,26)}"),
        ("Practise downtime, including blood", f"Paper requests, phoned results, O type use and back-entry.{R(3,9)}"),
        ("Know your reporting clocks", f"Cyber, data protection and health regulator, by region.{R(31,30)}"),
        ("Debrief and report on time", "Hot debrief within 48 hours, then a structured review with dated actions.")], "What to do")
    b.questions("For the board", "Questions boards should ask", "Answers should be specific, dated and owned.", [
        ("Readiness", ["Who can declare a critical incident tonight, and when did we last test that they would?", "How long does it take us to confirm who is coming in after a call-in?", "Could every ward get an urgent blood result with no computers?"]),
        ("Partners and recovery", ["Which suppliers could stop clinical care or payments, and are they in our incident plans?", "Which cyber and data reports would we owe, to whom, and how fast?", "How do we look after the staff who carry a long incident?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("EPRR", "Emergency preparedness, resilience and response: the NHS England framework for incidents (UK)."),
        ("Business continuity incident", "Disruption to normal service below acceptable levels that needs special arrangements."),
        ("Critical incident", "Localised loss of ability to deliver critical services, or risk of harm to patients and staff."),
        ("Major incident", "An event with serious consequences needing special arrangements by one or more responder agencies."),
        ("HICS", "Hospital Incident Command System: an incident command framework for hospitals, used widely in the US."),
        ("Core Standards", "The minimum EPRR requirements NHS-funded organisations in England assess themselves against each year."),
        ("Pathology", "Laboratory testing of blood, tissue and other samples."),
        ("O negative", "The universal donor blood type, used when a patient's blood cannot be matched."),
        ("Ransomware", "Malicious software that locks or steals data to extort payment."),
        ("NIS and NIS2", "UK regulations and an EU directive that set security and incident reporting duties for essential services, including health."),
        ("DSPT", "The Data Security and Protection Toolkit, used to report incidents in health and care in England."),
        ("JCI and CBAHI", "Joint Commission International and Saudi Arabia's national accreditation body for healthcare.")])

    b.mark("", "Sources")
    src = [
        "NHS England London, Synnovis media statement, https://www.england.nhs.uk/london/synnovis-ransomware-cyber-attack/latest-media-statement-on-synnovis-cyber-attack/",
        "The Register, 4 June 2024, https://www.theregister.com/2024/06/04/suspected_cyberattack_hits_major_london/",
        "NHSBT, 10 June 2024, https://www.nhsbt.nhs.uk/news/o-positive-and-o-negative-donors-asked-to-urgently-book-appointments-to-give-blood-following-london-hospitals-it-incident/",
        "NHSBT, amber alert, 25 July 2024, https://www.nhsbt.nhs.uk/news/nhs-calls-national-blood-shortage-amber-alert/",
        "NHSBT, alert stood down, 18 July 2025, https://www.nhsbt.nhs.uk/news/national-blood-shortage-alert-to-be-stood-down-from-21-july-following-amazing-response-from-donors-and-hospitals/",
        "The Record, 25 June 2025, https://therecord.media/ransomware-attack-contributed-patient-death-uk-nhs",
        "Express and Star (PA), 18 June 2025, https://www.expressandstar.com/uk-news/2025/06/18/170-patients-harmed-as-a-result-of-cyber-attack",
        "The Register, 13 November 2025, https://www.theregister.com/2025/11/13/synnovis_qilin_investigation/",
        "The Record, 17 April 2026, https://therecord.media/ransomware-nhs-cyberattack-disruption",
        "Digital Health, June 2026, https://www.digitalhealth.net/2026/06/almost-33000-bedfordshire-patients-had-data-stolen-in-cyber-attack/",
        "National Audit Office, WannaCry and the NHS, 27 October 2017, https://www.nao.org.uk/reports/investigation-wannacry-cyber-attack-and-the-nhs/",
        "NHS England, EPRR Framework v3, July 2022, https://www.england.nhs.uk/wp-content/uploads/2022/07/B0900-NHS-Emergency-Preparedness-Resilience-and-Response-Framework-version-3.pdf",
        "NHS England, 2026/27 EPRR annual assurance, https://www.england.nhs.uk/long-read/2026-27-eprr-annual-assurance-process/",
        "Oxford University Hospitals, EPRR Core Standards report, January 2025, https://www.ouh.nhs.uk/media/ca4h3l5n/tb202511-eprrcs-report.pdf",
        "NHS England, Integrated OPEL framework 2024 to 2026, https://www.england.nhs.uk/long-read/integrated-opel-framework-2024-to-2026/",
        "DHSC, NIS Regulations 2018: health sector guide, https://www.gov.uk/government/publications/network-and-information-systems-regulations-2018-health-sector-guide",
        "DSIT, Cyber Security and Resilience Bill: incident reporting, updated 3 November 2026, https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/incident-reporting",
        "ICO, March 2025, https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/03/software-provider-fined-3m-following-2022-ransomware-attack/",
        "(unused)",
        "The Record, 26 November 2024, https://therecord.media/england-hospitals-cyberattack-nhs-wirral",
        "PublicTechnology, 31 July 2026, https://www.publictechnology.net/2026/07/31/health-and-social-care/east-kent-hospitals-declare-critical-incident-over-ongoing-it-issues/",
        "ITV News Meridian, 24 June 2026, https://www.itv.com/news/meridian/2026-06-24/hospital-declares-critical-incident-as-heat-causes-cooling-systems-to-fail",
        "Digital Health, June 2026, https://www.digitalhealth.net/2026/06/nhs-hospitals-declare-critical-incidents-as-heat-causes-it-failures/",
        "(unused)",
        "AP via News4JAX, 10 May 2024, https://www.news4jax.com/health/2024/05/10/a-cyberattack-forces-a-big-us-health-system-to-divert-ambulances-and-take-records-offline/",
        "Healthcare Dive, 27 January 2025, https://www.healthcaredive.com/news/change-healthcare-cyberattack-affects-190-million-unitedhealth/738351/",
        "42 CFR 482.15 (Cornell LII), https://www.law.cornell.edu/cfr/text/42/482.15",
        "ASPR TRACIE, Joint Commission EM standards, https://asprtracie.hhs.gov/technical-resources/resource/10609/new-and-revised-emncy-management-standards",
        "ASPR TRACIE, HICS Guidebook, 5th edition, https://asprtracie.hhs.gov/technical-resources/resource/2735/hospital-incident-command-system-hics-guidebook-fifth-edition-may-2014",
        "45 CFR 164.404 (Cornell LII), https://www.law.cornell.edu/cfr/text/45/164.404",
        "European Commission, NIS2 FAQs, https://digital-strategy.ec.europa.eu/en/faqs/directive-measures-high-common-level-cybersecurity-across-union-nis2-directive-faqs",
        "European Commission, CER Directive, https://home-affairs.ec.europa.eu/policies/internal-security/counter-terrorism-and-radicalisation/protection/critical-infrastructure-resilience_en",
        "DHA, Healthcare Emergencies, Crises and Disasters Management Framework, https://www.dha.gov.ae/uploads/112024/DHA%20Healthcare%20Emergencies%20Crises%20&%20Disasters%20Management%20Framework2024112683.pdf",
        "Abu Dhabi Media Office, 8 May 2025, https://www.mediaoffice.abudhabi/en/health/emergencies-crises-and-disasters-management-centre-abu-dhabi-and-department-of-health-abu-dhabi-launch-business-continuity-management-standard-for-healthcare-activities/",
        "ENEC, Business continuity management (NCEMA 7000), https://www.enec.ae/about-us/leadership-and-governance/-business-continuity-management/",
        "Cureus, CBAHI narrative review, 2025, https://pmc.ncbi.nlm.nih.gov/articles/PMC12635948/",
        "JCI via PR Newswire, 1 July 2024, https://www.aap.com.au/aapreleases/cision20240701ae51644",
    ]
    items = sorted((order[i+1], t) for i, t in enumerate(src) if i+1 in order)
    assert len(items) == len(order) == len([t for t in src if t != "(unused)"]), (sorted(order), len(src))
    items = [(f"{n:02d}", t) for n, t in items]
    h = (len(items) + 1) // 2
    b.sources(items[:h])
    b.sources(items[h:], "Sources continued. Secondary reporting is used only where it adds detail.")
    b.rep_back("Ready before<br>the next outage?", "Crises Control helps hospitals and health systems call staff in by role, see who has acknowledged, run downtime procedures as tasks and keep a full record for the debrief.", "Request a demo",
        companion="Crisis playbook No. 06 · Major incident, minute one")
    return b
