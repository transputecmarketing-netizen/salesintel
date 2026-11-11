from cckit import CCReport, S


def build():
    b = CCReport("Safe in a Crowd", 5, "settle", "Hospitality", "7 December 2026")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted({order[x] for x in n}))
    b.how = "An evidence-based look at protecting guests and staff in crowded places: what the rules say in the UK, the US, the EU and the Middle East, what two UK inquiries found about the first minutes, and what hospitality leaders should do."
    b.rep_cover("Intelligence report", "Safe in<br>a crowd.",
        "Protecting guests and staff in hotels, bars, pubs, restaurants and venues. What the rules say in the UK, the US, the EU and the Middle East, what the evidence shows about the first minutes, and what to do now.")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("Protecting crowded places is mostly about people and procedures, and hospitality is at the heart of it.", [
        f"<b>United Kingdom:</b> the Terrorism (Protection of Premises) Act 2025, known as Martyn's Law, received Royal Assent on 3 April 2025.{R(1)} It will require the people in control of qualifying premises, including bars, pubs, restaurants, cafés, hotels and nightclubs, to take steps to protect the public from terrorism.{R(1,6)} Premises where 200 to 799 people can reasonably be expected at the same time fall into the standard tier, and those with 800 or more into the enhanced tier.{R(2)} The Security Industry Authority (SIA) will regulate, and expects the Act to come into force in spring 2027; no date has yet been set.{R(7,8)}",
        f"Elsewhere, most protective security advice for crowded places is guidance. In the United States, CISA asks owners and operators to Connect, Plan, Train and Report.{R(19)} In the European Union, the Commission's good practices ask operators for a security plan, a trained security lead and a crisis plan to alert, confine or evacuate; binding duties are national.{R(21)} In Dubai, regulation sets security conditions for hotels.{R(22)}",
        f"The evidence behind the law points to communication and preparation as much as physical security. The Manchester Arena Inquiry found that a concern about the attacker did not reach anyone who could act on it, and that on the night the emergency plans \"were not known by everyone who should have known about them\".{R(12,13)} At London Bridge and Borough Market, where attackers entered bars and restaurants, all eight people who died did so within 15 minutes of the attack beginning.{R(14)} Both are UK cases, and their lessons apply to any venue.",
        "This report sets out what applies where, what the inquiries found, and the practical steps for hospitality leaders in any country."],
        "Do not wait for a law. Count your peak numbers, write the four procedures, name a decision maker on every shift and make sure one alert reaches every member of staff, then rehearse it before your busiest season.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("In the UK, the law is enacted but not yet in force.", f"Martyn's Law received Royal Assent was on 3 April 2025, with an implementation period of at least 24 months. The SIA expects commencement in spring 2027 and will confirm the date ahead of time.{R(1,2,7)}"),
        ("Elsewhere, it is mostly guidance, with local exceptions.", f"US federal advice and the EU's good practices are guidance; in Dubai, luxury hotels must have round-the-clock security supervision and a surveillance room that can reach emergency services.{R(19,21,22)}"),
        ("For most venues, it is about procedures, not kit.", f"In the UK, standard tier premises need evacuation, invacuation, lockdown and communication procedures so far as is reasonably practicable; the Act does not require physical alterations or equipment.{R(3)}"),
        ("Plans fail when the people on shift do not know them.", f"The UK's Manchester Arena Inquiry found that plans were not known, not always clear, not always understood and not always put into practice.{R(13)}"),
        ("Communication breaks at single points.", f"A concern passed between stewards stalled on a busy radio channel, and a police declaration of Operation Plato was not passed to the other emergency services.{R(12,13)}"),
        ("The first minutes are decided on site.", f"At London Bridge and Borough Market the attack lasted about ten minutes, and all eight victims died within 15 minutes of it beginning.{R(14)}"),
        ("The same capability covers likelier emergencies.", f"Police received 6,732 spiking reports in a year, 80% in night-time economy venues; cyber incidents can take booking channels offline.{R(15,18)}")])

    b.facts("Protecting crowded places, in six figures", "Each figure is sourced. All six are from UK sources; the premises estimates are from the 2024 impact assessment and may change.", [
        ("3 April 2025", f"Royal Assent for the UK's Terrorism (Protection of Premises) Act 2025.{R(1)}"),
        ("200 and 800", f"People who can reasonably be expected at once, including staff, that mark the standard and enhanced tiers.{R(2)}"),
        ("154,600", f"Estimated UK standard tier premises, alongside 24,300 enhanced tier, mostly retail and hospitality.{R(11)}"),
        ("£18m or 5%", f"Maximum penalty for enhanced duty premises, of worldwide revenue. Standard duty: up to £10,000.{R(5)}"),
        ("149", f"Recommendations in Volume 2 of the Manchester Arena Inquiry, on the emergency response.{R(13)}"),
        ("6,732", f"UK spiking reports to police, May 2022 to April 2023, 80% in night-time economy venues.{R(15)}")], "At a glance")

    b.timeline("Attacks, inquiries and rules", "Key dates in the UK, the EU and the UAE. The UK commencement date has not yet been set.", [
        ("22 May 2017", "Manchester Arena attack", f"22 people are killed at the end of a concert.{R(7)}"),
        ("3 June 2017", "London Bridge and Borough Market", f"Attackers move through a restaurant courtyard, bars and a restaurant; eight people are killed.{R(14)}"),
        ("18 October 2017", "EU Action Plan", f"The Commission adopts an Action Plan to support the protection of public spaces.{R(21)}"),
        ("20 March 2019", "EU good practices", f"Good practices for operators, drawn up with a forum that included hospitality.{R(21)}"),
        ("17 June 2021", "Inquiry Volume 1", f"Security arrangements at the Arena; the chair sets out key elements of a Protect Duty.{R(12)}"),
        ("3 November 2022", "Inquiry Volume 2", f"The emergency response, with 149 recommendations.{R(13)}"),
        ("3 April 2025", "UK Royal Assent", f"The Terrorism (Protection of Premises) Act 2025 becomes law.{R(1)}"),
        ("14 April 2025", "Dubai hotel security", f"SIRA issues its Preventive Systems Manual, with conditions for luxury and tourist hotels.{R(22)}"),
        ("14 July 2026", "UK notification rules", f"Guidance sets three months from commencement for premises to notify the SIA.{R(9)}"),
        ("Spring 2027", "Expected UK commencement", f"The SIA's expectation. The date will be set by statutory instrument.{R(7,8)}")])

    # PART 01
    b.mark("01", "The rules")
    b.opener("01", "The<br>rules.", "What applies to crowded places in the UK, the US, the EU and the Middle East, and what the UK's Martyn's Law requires of hospitality, exactly.", [("01", "What applies where"), ("02", "United Kingdom: what the Act requires"), ("03", "United Kingdom: two tiers compared"), ("04", "United Kingdom: what the duty is, and is not")])
    b.regions("Regional notes", "Protecting crowded places: what applies where", "Venue security rules differ sharply. Some are law, some are guidance. Check each site against the rules where it operates.", [
        ("United Kingdom", f"Martyn's Law received Royal Assent on 3 April 2025 but is not yet in force; the SIA expects commencement in spring 2027.{R(1,7)} Premises where 200 or more people are expected at once will need evacuation, invacuation, lockdown and communication procedures.{R(2,3)}",
         "The following pages set out the Act. Count the busiest realistic night, staff included."),
        ("United States", f"Federal advice for crowded places is guidance, not law. CISA's action guide for mass gatherings asks owners and operators to Connect, Plan, Train and Report, including public address scripts and Run, Hide, Fight training.{R(19)} The SAFETY Act offers liability protections, by application, for approved anti-terrorism technologies and services.{R(20)}",
         "Plan with local law enforcement and fire services, and check state and local rules and OSHA's emergency action plan rule."),
        ("European Union", f"The Commission's 2017 Action Plan and 2019 good practices are guidance, not law. They ask operators, hospitality included, for vulnerability assessments, a security plan, a trained security lead with a backup, and a crisis plan to alert, confine or evacuate.{R(21)}",
         "Binding duties come from national law and vary by member state. The good practices also call for a spokesperson and key messages agreed in advance."),
        ("Middle East (UAE, Saudi Arabia)", f"<b>Dubai:</b> SIRA's Preventive Systems Manual (2025) requires luxury hotels to have a security operations manager or supervisor around the clock and a surveillance room that can reach guards, hotel officials and emergency services.{R(22)} <b>Saudi Arabia:</b> a tourism accommodation licence needs a valid Civil Defense permit and connection to the Shomoos platform.{R(23)}",
         "Requirements vary by emirate, star rating and licence. Confirm them with SIRA, the relevant emirate authorities, or the Saudi Ministry of Tourism and Civil Defense.")], "The rules")
    b.essay("United Kingdom", "United Kingdom: what the Act requires, and of whom", [
        f"<b>United Kingdom:</b> the Act's long title describes its purpose: to require persons with control of certain premises or events to take steps to reduce the vulnerability of the premises or event to, and the risk of physical harm to individuals arising from, acts of terrorism, and to confer related functions on the SIA.{R(1)}",
        f"It applies to premises wholly or mainly used for purposes in Schedule 1. Statutory guidance says the food and drink use \"includes bars, pubs, restaurants, cafés and food halls\", the hotels use includes hostels and holiday parks, and nightclubs sit under entertainment and leisure.{R(6)} The Home Office's own examples include a pub with a beer garden and a hotel with grounds used for dining and events.{R(2)}",
        f"Tier depends on numbers. Premises are in the standard tier where 200 or more people, including staff, can reasonably be expected to be present at the same time from time to time, and in the enhanced tier at 800 or more.{R(2)} Qualifying events have an 800-person threshold and further conditions.{R(2)}",
        f"Standard tier premises must notify the SIA and have, so far as is reasonably practicable, appropriate public protection procedures: evacuation, invacuation, lockdown and communication.{R(3)} The Home Office describes these as simple, low-cost steps.{R(2)} There is no statutory training requirement, but staff with responsibilities must know the procedures and their roles.{R(3)}",
        f"Enhanced tier premises must also have public protection measures relating to monitoring, movement, physical safety and security, and security of information; document compliance and give the document to the SIA; and, where the responsible person is an organisation, designate a senior individual.{R(4)}",
        f"The SIA will assess compliance through desk-based assessments and inspections, usually with at least 72 hours' notice.{R(7)} Penalties reach £10,000 for standard duty premises and £18m or 5% of worldwide revenue for enhanced duty premises, with daily penalties for continued failure.{R(5)}"],
        "The rules", "For most hospitality venues, the duty is a set of procedures that every shift can follow.")
    b.table("United Kingdom", "UK standard and enhanced tier, side by side", "As stated in Home Office factsheets and guidance. Status as at 9 November 2026.", ["", "Standard tier", "Enhanced tier"], [
        ("Threshold", f"200 to 799 people reasonably expected at once, including staff.{R(2)}", f"800 or more people reasonably expected at once.{R(2)}"),
        ("Core duty", f"Public protection procedures: evacuation, invacuation, lockdown, communication.{R(3)}", f"Procedures plus public protection measures on monitoring, movement, physical security and information.{R(4)}"),
        ("Paperwork", f"Notify the SIA within three months of commencement; changes within 28 days.{R(9)}", f"Notify the SIA; document compliance and send it to the SIA; name a senior individual.{R(4,9)}"),
        ("Penalties", f"Up to £10,000; up to £500 a day for continued failure.{R(5)}", f"£18m or 5% of worldwide revenue; up to £50,000 a day; restriction notices.{R(5)}"),
        ("Status", f"Not yet in force. Expected spring 2027.{R(7)}", f"Not yet in force. Expected spring 2027.{R(7)}")], "The rules", "30mm 1fr 1fr")
    b.compare("United Kingdom", "Martyn's Law: what the duty is, and what it is not", "Several claims about the UK law circulate in the trade. This is what the official UK sources say.", ["Claim", "What is often assumed", "What the sources say"], [
        ("Timing", "The law is already in force, or starts on a fixed date in April 2027.", f"It is not yet in force. The SIA expects spring 2027; the date will be set by statutory instrument.{R(7,8)}"),
        ("Equipment", "Every venue must buy barriers, scanners or new locks.", f"Standard tier premises are not required to make physical alterations or buy equipment.{R(2,3)}"),
        ("Training", "Staff must complete a specific accredited course.", f"There is no statutory training requirement, but staff must know the procedures and their role.{R(3)}"),
        ("Who counts", "Only seated customers count towards the threshold.", f"The numbers include staff, and are those reasonably expected at the same time from time to time.{R(2)}"),
        ("Who is responsible", "The security contractor carries the duty.", f"The responsible person is whoever controls the premises for the use that brings them into scope.{R(6)}"),
        ("Guidance", "There is nothing to read until the law starts.", f"Statutory guidance has been in force since 10 April 2026, with factsheets and notification guidance published.{R(6,9,10)}")], "The rules")

    # PART 02
    b.mark("02", "The lessons")
    b.opener("02", "The<br>lessons.", "What two UK inquiries, into Manchester Arena and London Bridge, found about the minutes that matter most in any venue.", [("01", "Manchester Arena: plans and messages"), ("02", "Four ways communication failed"), ("03", "Bars, restaurants and the first 15 minutes")])
    b.essay("UK case study", "Manchester Arena: when the plan and the message do not reach people", [
        f"On 22 May 2017, 22 people were killed in the attack at the end of a concert at Manchester Arena.{R(7)} The public inquiry reported in three volumes. Volume 1, published on 17 June 2021, found that the security arrangements should have prevented or minimised the devastating impact of the attack, and failed to do so.{R(12)}",
        f"One finding is directly relevant to every venue. A member of the public raised a concern about the attacker with a steward around 15 minutes before the concert ended. The steward had no radio. A colleague with a radio tried to report it, but someone else was talking on the channel, and the concern went no further. The inquiry found the efforts made were inadequate, and that there had been enough time to investigate and act.{R(12)}",
        f"Volume 2, published on 3 November 2022, examined the emergency response and made 149 recommendations.{R(13)} It found that significant aspects of the response went wrong. The police declaration of Operation Plato, the response to a suspected marauding terrorist attack, was not communicated to the other emergency services as the police plan required, and the fire service did not arrive until over two hours after the attack.{R(13)}",
        f"Its conclusion on planning applies far beyond the emergency services: plans \"were not known by everyone who should have known about them\", were not always clear, not always understood and not always put into practice.{R(13)} It also found single points of failure, and called for checks to make sure that what needed to be done had been done.{R(13)}",
        f"The inquiry recorded that venue staff acted quickly: the head of security instructed staff to divert people away from the scene, and a radio message asked staff with first aid skills to go there.{R(13)} It also called for more members of the public to have first responder skills.{R(13)}",
        f"Volume 1 explicitly anticipated a Protect Duty, an obligation for those responsible for publicly accessible locations to consider and implement security measures.{R(12)} Martyn's Law is that duty."],
        "The lessons", "The concern was raised in time. It did not reach anyone who could act on it.")
    b.figpage("How it fails", "Four ways communication fails on the night", "Drawn from the Manchester Arena Inquiry. Each has a direct equivalent in a busy bar, hotel or restaurant.", "relay", [
        ("No device, no route", f"A steward without a radio had to find someone who had one.{R(12)}"),
        ("A busy channel", f"A radio report could not get through because someone else was talking, and was not escalated another way.{R(12)}"),
        ("A declaration not shared", f"A critical declaration was not passed to partners who needed it, as the plan required.{R(13)}"),
        ("Plans not known", f"Responders on the night had little or no knowledge of the plans that applied to them.{R(13)}")], "The lessons")
    b.essay("UK case study", "London Bridge: bars, restaurants and the first 15 minutes", [
        f"On the evening of 3 June 2017 three attackers drove a van into pedestrians on London Bridge, crashed outside a pub and then attacked people at street level, in a restaurant courtyard and in bars and a restaurant on Stoney Street. Armed officers stopped them about ten minutes after the attack began.{R(14)}",
        f"The Chief Coroner found that the emergency operation was generally well managed, and that all eight people who died had suffered injuries that could not have been treated at the scene and died within 15 minutes of the attack beginning.{R(14)} He also recorded police evidence that a clear legal duty on private site owners would help, contrasting the extensive health and safety duties to visitors with the lack of any comparable duty to protect from terrorism.{R(14)}",
        "For hospitality, the lesson is about time. Before police arrive, what happens inside a bar or restaurant depends on staff: whether they recognise what is happening, lock the doors, move guests away from the entrance and tell everyone on site.",
        f"Terrorism is, thankfully, rare. Other emergencies are not. In the UK, the Home Office reported 6,732 police reports of spiking between May 2022 and April 2023, 80% of them in night-time economy venues and almost half in bars.{R(15)} The UK's Crime and Policing Act 2026 includes a new offence of administering a harmful substance, including by spiking; it is not yet in force.{R(16,17)}",
        f"Technology failures reach the front desk too. In September 2022 IHG told the stock exchange that unauthorised activity had significantly disrupted its booking channels and apps.{R(18)} A booking or payment outage on the busiest Saturday of the year is a crisis of a different kind, but it needs the same things: one decision maker, one instruction to every site and confirmation that it has been read."],
        "The lessons", "Before police arrive, what happens inside depends on the staff on shift.")

    # PART 03
    b.mark("03", "What to do now")
    b.opener("03", "What to<br>do now.", "What the evidence means for organisations in hospitality, wherever they operate, and the steps that close the gap.", [("01", "What it means for hospitality"), ("02", "Seven recommendations"), ("03", "Questions for the board")])
    b.essay("What it means", "What it means for organisations in Hospitality", [
        f"Wherever a venue operates, the hard part is the same: a varied, often temporary workforce that must know what to do on a noisy, crowded night. The rules around it differ. In the UK, Martyn's Law will make procedures a legal duty for venues of 200 or more.{R(2,3)} In the US and the EU, the core advice is guidance; in Dubai and Saudi Arabia, licensing and security conditions apply.{R(19,21,22,23)}",
        f"The guidance points the same way. CISA asks operators to plan, train staff and prepare public address scripts.{R(19)} The EU good practices ask for a trained security lead with a backup and a crisis plan to alert, confine or evacuate.{R(21)} The UK Home Office's restaurant example relies on a shift manager who enacts the procedures and an induction briefing for every new starter.{R(3)}",
        f"The UK inquiries show where it breaks. Concerns that do not reach a decision maker. Channels that are busy at the moment they are needed. Plans that exist but are not known.{R(12,13)} Each of these has a practical fix: a named decision maker on every shift, more than one way to raise and send an alert, and a way to confirm who has received it.",
        "Peak periods are the sharpest test. Venues are fuller, shifts are longer, many staff are new or temporary, and guests are spread across function rooms, terraces and bedrooms. A plan that works on a quiet weekday may not work on the busiest night of the year.",
        "Groups with venues in several countries face a second task: a single way of working that meets each country's rules. One severity scale, one set of roles and one way to alert every member of staff can sit on top of local duties, with a named owner for each country.",
        "The same capability serves every emergency. A venue that can lock down and tell every member of staff within a minute can also run a fire evacuation, respond to a spiking report or move to a paper booking list when systems fail. Building it is good practice whatever the law says."],
        "What it means", "A plan that works on a quiet weekday may not work on the busiest night of the year.")
    b.steps("Recommendations", "Seven steps for every venue", "In priority order. Most cost time, not money.", [
        ("Know the rules for every site", f"Security, fire, licensing and workplace duties, by country, each with a named owner.{R(2,21,22)}"),
        ("Count peak numbers for every site", f"Include staff and outside areas, and record the method. In the UK it sets your tier.{R(2,9)}"),
        ("Write the four procedures, one page per site", f"Evacuation, invacuation, lockdown and communication, with routes, safe areas and named roles.{R(3)}"),
        ("Give every shift a decision maker", "A duty manager who can declare a lockdown at once, known to all staff."),
        ("Make one alert reach everyone, and confirm it", f"More than one channel, with replies tracked and non-responders chased.{R(12)}"),
        ("Brief every starter, including seasonal staff", f"A short induction on the procedures and their own role.{R(3,21)}"),
        ("Rehearse before your busiest season", "A lockdown walk-through on a late shift, and a head office exercise across venues.")], "What to do")
    b.questions("For the board", "Questions boards should ask", "Answers should be specific, dated and owned.", [
        ("The duty", ["Which security, fire and licensing rules apply to each of our sites, in each country, and who owns them?", "In the UK: which sites are standard or enhanced tier, and who is the responsible person?", "Elsewhere: are our licence, civil defence and security conditions current at every site?"]),
        ("The night", ["Could every site evacuate, invacuate, lock down and communicate tonight, and when was it last practised?", "How long would it take to reach every member of staff on duty, and to know who had not replied?", "Are seasonal and agency staff briefed to the same standard as permanent staff?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("Crowded place", "A location that is easy to access and draws large numbers of people, such as a bar, hotel or venue."),
        ("Martyn's Law (UK)", "The Terrorism (Protection of Premises) Act 2025, named after Martyn Hett, who was killed at Manchester Arena."),
        ("Protect Duty (UK)", "The proposal, discussed in the Manchester Arena Inquiry, that became Martyn's Law."),
        ("Responsible person (UK)", "Whoever controls qualifying premises for the use that brings them into scope."),
        ("Standard and enhanced tier (UK)", "Premises where 200 to 799, or 800 or more, people can reasonably be expected at once."),
        ("Public protection procedures", "Evacuation, invacuation, lockdown and communication."),
        ("Invacuation", "Moving people away from danger to a safer place inside the premises."),
        ("SIA (UK)", "The Security Industry Authority, regulator for Martyn's Law."),
        ("Run, Hide, Fight (US)", "US guidance for staff and the public in an active attack; the UK equivalent is RUN, HIDE, TELL."),
        ("SAFETY Act (US)", "A US law offering liability protections, by application, for approved anti-terrorism technologies and services."),
        ("SIRA (Dubai)", "Dubai's Security Industry Regulatory Agency, which sets security conditions for hotels."),
        ("Commencement", "The date a provision of an Act comes into force, set by statutory instrument."),
        ("Operation Plato", "In 2017, the emergency services' designation for the response to a marauding terrorist firearms attack.")])

    b.mark("", "Sources")
    src = [
        "Terrorism (Protection of Premises) Act 2025 (c. 10), introductory text, legislation.gov.uk, https://www.legislation.gov.uk/ukpga/2025/10/introduction",
        "Home Office, Martyn's Law overarching and scope factsheets, updated July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Standard duty requirements factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Enhanced duty requirements factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, The regulator, sanctions and enforcement factsheet, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-factsheets",
        "Home Office, Statutory guidance (section 27), April 2026, presented 15 April 2026, https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance",
        "Security Industry Authority, Understanding Martyn's Law and the SIA's role as regulator, 17 July 2026, https://www.gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator",
        "Security Industry Authority, Martyn's Law: what comes next and how to get involved, 4 June 2026, https://www.gov.uk/government/news/martyns-law-what-comes-next-and-how-to-get-involved",
        "Home Office, Notification requirement guidance, 14 July 2026, https://www.gov.uk/government/publications/terrorism-protection-of-premises-act-2025-notification-requirement",
        "Terrorism (Protection of Premises) Act 2025 (Commencement No. 1) Regulations 2026, SI 2026/320, https://www.legislation.gov.uk/uksi/2026/320/made",
        "Regulatory Policy Committee, Opinion on the Martyn's Law impact assessment of 30 July 2024, 22 August 2024, https://assets.publishing.service.gov.uk/media/66e2f8da718edd817713169c/2024-08-22-RPC-HO-5254_2_-Terrorism__Protection_of_Premises__Bill_-_Martyns_Law.pdf",
        "Manchester Arena Inquiry, Volume 1: Security for the Arena (HC 279), 17 June 2021, paras 1.2, 1.52 to 1.57 and 8.27, https://assets.publishing.service.gov.uk/media/60cc659fe90e07438f7af765/CCS0321126370-002_MAI_Report_Volume_ONE_WebAccessible.pdf",
        "Manchester Arena Inquiry, Volume 2: Emergency Response (HC 757), 3 November 2022, Parts 10, 16 and 21, https://www.gov.uk/government/publications/manchester-arena-inquiry-volume-2-emergency-response",
        "Chief Coroner, Prevention of Future Deaths report, London Bridge and Borough Market attack, 1 November 2019, https://www.judiciary.uk/wp-content/uploads/2019/11/London-Bridge-Borough-Market-Terror-Attack-2019-0332.pdf",
        "Home Office, Understanding and tackling spiking, 19 December 2023, https://www.gov.uk/government/publications/understanding-and-tackling-spiking",
        "Crime and Policing Act 2026, section 134 (prospective, as at November 2026), https://www.legislation.gov.uk/ukpga/2026/20/section/134",
        "Crime and Policing Act 2026 (Commencement No. 3 and Saving Provisions) Regulations 2026, SI 2026/960, https://www.legislation.gov.uk/uksi/2026/960/made",
        "TechCrunch, report on IHG's London Stock Exchange filing of 6 September 2022, 7 September 2022, https://techcrunch.com/2022/09/07/ihg-hotels-outage-cyberattack/",
        "CISA, Mass Gatherings: Security Awareness for Soft Targets and Crowded Places, action guide, https://www.cisa.gov/sites/default/files/publications/Mass%20Gatherings%20-%20Security%20Awareness%20for%20ST-CP.PDF",
        "DHS SAFETY Act Office, Benefits to your company, https://www.safetyact.gov/about/benefits",
        "European Commission, Good practices to support the protection of public spaces, SWD(2019) 140 final, 20 March 2019 (accompanying COM(2019) 145; Action Plan COM(2017) 612 of 18 October 2017)",
        "Dubai Security Industry Regulatory Agency (SIRA), Administrative Resolution No. 13 of 2025 approving the Preventive Systems Manual, issued 14 April 2025, https://www.sira.gov.ae",
        "Saudi Ministry of Tourism, Tourism Accommodation Facility Regulations services guide, V.1 2022, https://mt.gov.sa",
    ]
    used = set(order)
    src_used = [(k, t) for k, t in enumerate(src, 1) if k in used]
    assert len(src_used) == len(order), (sorted(order), len(src))
    items = sorted((order[k], t) for k, t in src_used)
    items = [(f"{n:02d}", t) for n, t in items]
    half = (len(items) + 1) // 2
    b.sources(items[:half], "Accessed November 2026. Martyn's Law duties are not yet in force; check GOV.UK and the SIA for the commencement date. Regional rules change: confirm them locally.")
    b.sources(items[half:], "Sources continued.")
    b.rep_back("Safe in a crowd,<br>on every shift.", "Crises Control, an Operational Incident Coordination Platform, helps hotels, bars, restaurants and venues alert every member of staff, see who has acknowledged, run the incident and its tasks from one place, and keep a timestamped record for the review.", "Request a demo",
        companion="Crisis playbook No. 05 · Every guest. Every shift.")
    return b
