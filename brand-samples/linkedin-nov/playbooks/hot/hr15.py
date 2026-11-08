from rkit import RBook, S

SRC = {
    "omni": "EUR-Lex, Regulation (EU) 2026/1744 (Digital Omnibus on AI), OJ L 24 July 2026, https://eur-lex.europa.eu/eli/reg/2026/1744/oj/eng",
    "aia": "EUR-Lex, Regulation (EU) 2024/1689 (Artificial Intelligence Act), OJ L 12 July 2024, https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng",
    "ec": "European Commission, AI Act: regulatory framework for AI, updated 19 October 2026, https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    "fresh": "Freshfields, EU AI Act unpacked #34: the final Digital Omnibus on AI, 10 July 2026, https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/eu-ai-act-unpacked-34-the-final-digital-omnibus-on-ai-key-amendments-to-the-a-102nber",
    "ep": "European Parliament, Legislative resolution of 16 June 2026 on the Digital Omnibus on AI, P10_TA(2026)0198, https://data.europarl.europa.eu/distribution/doc/TA-10-2026-0198_en.pdf",
    "sidley": "Sidley Austin, EU Digital Omnibus: the Commission proposes important changes to the EU's digital rulebook, 9 December 2025, https://datamatters.sidley.com/2025/12/09/eu-digital-omnibus-the-european-commission-proposes-important-changes-to-the-eus-digital-rulebook/",
    "cop": "European Commission, Code of Practice on marking and labelling of AI-generated content, 2026, https://digital-strategy.ec.europa.eu/en/policies/code-practice-ai-generated-content",
    "pw": "Paul, Weiss, EU finalises transparency rules for AI-generated content, 4 August 2026, https://www.paulweiss.com/insights/client-memos/eu-finalises-transparency-rules-for-ai-generated-content",
    "mb": "Mayer Brown, EU AI Act news: Digital Omnibus on AI, new guidance on risk classification, GPAI and transparency, 30 July 2026, https://www.mayerbrown.com/en/insights/publications/2026/07/eu-ai-act-news-digital-omnibus-on-ai-new-guidance-on-risk-classification-gpai-and-transparency-obligations",
    "draft": "European Commission, Draft guidelines on the classification of high-risk AI systems, 19 May 2026, https://digital-strategy.ec.europa.eu/en/library/draft-commission-guidelines-classification-high-risk-ai-systems",
    "en": "European Commission, First harmonised standard supporting the AI Act published in the Official Journal, 19 October 2026, https://digital-strategy.ec.europa.eu/en/library/first-harmonised-standard-supporting-ai-act-published-official-journal",
    "cen": "CEN-CENELEC, First ever European standard on AI published in the OJEU, 15 October 2026, https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-10-15-en-18286-2026-published-in-ojeu/",
    "orrick": "Orrick, EU AI Act update: Digital Omnibus finalizes 8 compliance changes, 29 July 2026, https://www.orrick.com/en/Insights/2026/07/EU-AI-Act-Update-Digital-Omnibus-Finalizes-8-Compliance-Changes",
    "uk": "GOV.UK, A pro-innovation approach to AI regulation: government response, 6 February 2024, https://www.gov.uk/government/consultations/ai-regulation-a-pro-innovation-approach-policy-proposals/outcome/a-pro-innovation-approach-to-ai-regulation-government-response",
    "ap": "GOV.UK, AI Opportunities Action Plan, 13 January 2025, https://www.gov.uk/government/publications/ai-opportunities-action-plan",
    "iapp": "IAPP, King's Speech signals diffuse UK digital policy agenda, but no AI bill, 14 May 2026, https://iapp.org/news/a/king-s-speech-signals-diffuse-uk-digital-policy-agenda-but-no-ai-bill",
    "duaa": "legislation.gov.uk, Data (Use and Access) Act 2025, section 80 (automated decision-making), https://www.legislation.gov.uk/ukpga/2025/18/contents",
}


def build():
    b = RBook("The AI Act's New Clock", 15, "prism", "riffle")
    order = {}
    def R(*k):
        for x in k: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in k))
    s1, s2, s3 = "What changed", "What did not change", "The UK view"

    b.how = "An evidence-based look at the EU AI Act after the Digital Omnibus on AI: which deadlines moved, which did not, what is still only draft or proposal, and what it means for UK organisations."
    b.rep_cover("Intelligence report · EU AI Act", "The AI Act's<br>new clock.",
        "The Digital Omnibus pushed back the AI Act's high-risk rules. Bans, general-purpose AI rules and transparency duties kept their dates. What changed, what did not, and what UK organisations should do now.", "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("The high-risk deadline moved. The rest of the Act kept running.", [
        "In July 2026 the EU amended its Artificial Intelligence Act through the Digital Omnibus on AI, Regulation (EU) 2026/1744." + R("omni") + " The main obligations for high-risk AI systems in Annex III uses such as recruitment, credit and education now apply from 2 December 2027 instead of 2 August 2026. Those for AI in regulated products move to 2 August 2028." + R("omni"),
        "Much of the Act did not move. Prohibited practices have applied since February 2025, rules for general-purpose AI models since August 2025, and the Article 50 transparency duties since 2 August 2026." + R("aia", "fresh") + " The date many reports give for transparency, 2 December 2026, is narrower than it sounds: it ends a grace period for machine-readable marking by generative AI systems already on the market before August 2026, and it is the start date of new bans on AI that creates non-consensual intimate images or child sexual abuse material." + R("omni"),
        "UK organisations are in scope when they place AI on the EU market or when their AI's output is used in the EU." + R("aia") + " The UK has chosen a different, principles-based path and has no AI bill before Parliament." + R("uk", "iapp") + " For many UK firms the Act will arrive through suppliers and customers as much as through regulators.",
        "This report separates adopted law from guidance, drafts and proposals, explains what the change means in practice and sets out recommendations for UK boards and IT leaders."],
        "Use the extra sixteen months to build the inventory, documentation and supplier evidence high-risk compliance needs. Meanwhile, treat the bans, transparency duties and AI literacy as live today, and finish the December 2026 items now.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence shows", [
        ("The delay is law, not a proposal.", "Regulation (EU) 2026/1744 was published on 24 July 2026 and the Commission records it in force from 27 July 2026." + R("omni", "ec")),
        ("Only the high-risk requirements moved.", "Sections 1 to 3 of Chapter III now apply from 2 December 2027 for Annex III uses and 2 August 2028 for Annex I products. The content of the duties is unchanged." + R("omni", "fresh")),
        ("Transparency started in August 2026.", "Article 50 applies from 2 August 2026. Only Article 50(2) marking for generative systems already on the market gained time, to 2 December 2026." + R("omni")),
        ("The Omnibus added as well as delayed.", "New bans on AI that generates non-consensual intimate imagery or child sexual abuse material apply from 2 December 2026." + R("omni")),
        ("AI literacy was softened, not removed.", "Providers and deployers must now take measures to support AI literacy, without guaranteeing any individual's level." + R("omni")),
        ("Key guidance is still unfinished.", "The high-risk classification guidelines remain a draft, and only one harmonised standard, for quality management, has been cited." + R("draft", "en")),
        ("UK firms are exposed through the market, not the map.", "The Act reaches providers placing AI on the EU market and UK providers or deployers whose output is used in the EU." + R("aia")),
    ])
    b.facts("The new clock, in six figures", "Each figure comes from the amended text of the AI Act or the European Commission.", [
        ("2 Dec 2027", "High-risk obligations for Annex III uses such as recruitment, credit and education. Previously 2 August 2026." + R("omni")),
        ("2 Aug 2028", "High-risk obligations for AI in products under EU safety law, listed in Annex I. Previously 2 August 2027." + R("omni")),
        ("2 Dec 2026", "End of the Article 50(2) marking grace period for older generative systems, and start of the new bans." + R("omni")),
        ("2 Aug 2030", "Deadline for high-risk systems intended for use by public authorities, including those already in service." + R("omni")),
        ("EUR 15m / 3%", "Maximum fine for breaching Article 50 transparency or deployer duties, whichever is higher. Prohibited practices: EUR 35m or 7%." + R("aia")),
        ("1", "Harmonised standard cited so far: EN 18286, on quality management, published in mid-October 2026." + R("en", "cen")),
    ], "Key findings")

    b.mark("", "Timeline")
    b.timeline("From the original Act to the new clock", "Key dated events. All entries are adopted measures or published documents unless marked as draft.", [
        ("1 Aug 2024", "AI Act enters into force", "Regulation (EU) 2024/1689 sets a staged timetable running to August 2027." + R("aia")),
        ("2 Feb 2025", "Bans and AI literacy apply", "Chapters I and II apply, including prohibited practices and the literacy duty." + R("aia")),
        ("2 Aug 2025", "General-purpose AI rules apply", "Obligations for GPAI model providers and the governance framework apply." + R("aia", "ec")),
        ("19 Nov 2025", "Commission proposes the Digital Omnibus", "Proposal COM(2025) 836 on AI, alongside a separate proposal on data, privacy and cyber rules." + R("ep", "sidley")),
        ("7 May 2026", "Political agreement", "Parliament and Council negotiators agree the AI Omnibus; on 19 May the Commission publishes draft high-risk guidelines." + R("ec", "draft")),
        ("16 to 29 Jun 2026", "Formal adoption", "Parliament adopts on 16 June; the Council gives final approval on 29 June. The transparency Code of Practice is finalised on 10 June." + R("ep", "fresh", "cop")),
        ("24 to 27 Jul 2026", "Published and in force", "Regulation (EU) 2026/1744 appears in the Official Journal; final Article 50 guidelines follow on 20 July." + R("omni", "ec", "pw")),
        ("2 Aug 2026", "Transparency and GPAI enforcement", "Article 50 applies, and the Commission's fining powers for GPAI providers become available." + R("mb")),
        ("Mid Oct 2026", "First harmonised standard", "EN 18286 on quality management is cited in the Official Journal." + R("en", "cen")),
    ])

    # PART 01
    b.mark("01", s1)
    b.opener("01", "What<br>changed.", "A sixteen-month reprieve for high-risk AI, a short grace for content marking, and some new bans.", [("01", "Why the dates moved"), ("02", "Before and after"), ("03", "How the grace periods work")])
    b.essay(s1, "Why Brussels moved the clock, and why it fixed the new dates", [
        "The Digital Omnibus on AI is explicit about its reason. The regulation says the late arrival of standards, common specifications and guidance, and the delayed setting up of national competent authorities, put the original 2 August 2026 date for high-risk rules at risk and threatened a significant rise in implementation costs." + R("omni"),
        "That was a fair description of the position. By mid-2026 no harmonised standard supporting the Act had been cited. The first, EN 18286 on quality management, only reached the Official Journal in October 2026, and it covers one requirement of many." + R("en") + " Without standards, providers of high-risk systems had no presumption of conformity to work towards.",
        "The Commission's original proposal of November 2025 tried to link the start of high-risk duties to a Commission decision that support measures were available, with long-stop dates of 2 December 2027 and 2 August 2028." + R("sidley") + " The adopted text dropped that sliding mechanism and simply fixed the long-stop dates in law." + R("omni") + " For businesses that is more useful: a known date beats a moving one.",
        "The substance of the high-risk regime was not reopened. Risk management, data governance, technical documentation, logging, human oversight, accuracy and robustness, and conformity assessment all remain." + R("fresh") + " Deployer duties under Article 26 sit in the same part of the Act, so they move to December 2027 too." + R("aia", "omni"),
        "The Omnibus also adjusted the edges. A new category of small mid-cap companies, with fewer than 750 staff, receives SME-style relief including simplified documentation and lower penalty caps." + R("orrick") + " Providers and deployers may process special category data to detect and correct bias where strictly necessary, with safeguards. National regulatory sandboxes must be running by 2 August 2027." + R("omni"),
        "The pattern is familiar from other EU digital laws: legislators protect the political settlement and adjust the timetable when the supporting machinery runs late. The lesson for organisations is to plan to the adopted dates, not to hope for another delay."],
        s1, "The adopted text replaced a sliding start date with fixed ones. A known deadline is easier to plan for than a moving one.")
    b.table(s1, "Before and after the Omnibus", "Main changes to the AI Act made by Regulation (EU) 2026/1744. All rows are adopted law." + R("omni"), ["Provision", "Before", "After"],
        [("Annex III high-risk", "Applied from 2 August 2026.", "Applies from 2 December 2027. Requirements unchanged."),
         ("Annex I high-risk", "Applied from 2 August 2027.", "Applies from 2 August 2028."),
         ("Article 50(2) marking", "Applied from 2 August 2026 to all.", "Generative systems on the market before 2 August 2026 have until 2 December 2026."),
         ("Prohibited practices", "Eight categories since February 2025.", "Adds non-consensual intimate imagery and CSAM generation from 2 December 2026."),
         ("AI literacy", "Ensure, to their best extent, a sufficient level.", "Take measures to support AI literacy. No guaranteed level."),
         ("Bias detection data", "Special category data allowed for high-risk providers.", "Open to providers and deployers of all AI systems where strictly necessary.")], s1, "40mm 1fr 1fr")
    b.figpage(s1, "How the grace periods work", "The amended Article 111 decides which existing systems must change, and when." + R("omni"), "slow",
        [("Legacy high-risk systems", "High-risk systems placed on the market before the new dates are caught only if their design changes significantly afterwards. The first unit of a type and model sets the date."),
         ("Public authorities", "Existing high-risk systems intended for public authorities must comply by 2 August 2030, even without design changes."),
         ("Generative content marking", "Generative AI systems on the market before 2 August 2026 have until 2 December 2026 to mark output machine-readably under Article 50(2)."),
         ("General-purpose AI models", "Models placed on the market before 2 August 2025 must comply by 2 August 2027, under the original Act." + R("aia"))], s1)

    # PART 02
    b.mark("02", s2)
    b.opener("02", "What did<br>not change.", "Bans, general-purpose AI rules and most transparency duties kept their dates. Some of the guidance is still unfinished.", [("01", "What applies today"), ("02", "Headlines against the law"), ("03", "Adopted, draft or proposed")])
    b.essay(s2, "Four obligations that are already live", [
        "The first is the list of prohibited practices. Since 2 February 2025 the Act has banned AI used for social scoring, manipulative or exploitative techniques that cause significant harm, untargeted scraping of facial images, and emotion recognition in workplaces and schools, among others." + R("aia") + " Breaches carry the Act's highest fines: up to EUR 35 million or 7% of worldwide turnover." + R("aia"),
        "The second is the regime for general-purpose AI models. Providers have had obligations on documentation, copyright policy and training content summaries since August 2025, and the Commission's power to fine them became available on 2 August 2026." + R("mb") + " Models already on the market before August 2025 must comply by August 2027." + R("aia"),
        "The third is transparency. Since 2 August 2026, providers must design chatbots so people know they are dealing with AI, and must mark generated audio, images, video and text in a machine-readable way. Deployers must label deepfakes and AI-generated text published to inform the public on matters of public interest." + R("pw") + " The Commission published final guidelines on 20 July 2026, and its voluntary Code of Practice, with an EU icon set for labels, was finalised in June." + R("ec", "cop"),
        "The Article 50(2) grace period is the source of the widely reported December date. It covers only machine-readable marking, and only generative systems already on the market before 2 August 2026." + R("omni") + " Chatbot disclosure and deepfake labelling were not deferred." + R("fresh"),
        "The fourth is AI literacy. The Omnibus softened the wording, but the duty to take measures supporting staff AI literacy still applies to every provider and deployer, whatever their risk tier." + R("omni"),
        "What most organisations get wrong is to read the headline delay as covering everything. Firms that paused AI governance work after July 2026 may already be behind on transparency, and may not know whether their marketing, customer service or product teams are using AI in ways the Act now governs."],
        s2, "The December 2026 date ends one narrow grace period. It does not mark the start of transparency.")
    b.compare(s2, "Headlines against the law", "Common readings of the change, checked against the amended text.", ["Claim", "What is said", "What the law says"],
        [("The AI Act is delayed", "The Act has been pushed back to 2027.", "Only high-risk requirements moved. Bans, GPAI and transparency apply now." + R("omni")),
         ("Transparency starts in December", "Labelling duties begin on 2 December 2026.", "Article 50 applies from 2 August 2026. December ends a marking grace for older generative systems."),
         ("Literacy was scrapped", "The AI literacy duty was removed.", "It was reworded to require supporting measures. It still applies." + R("omni")),
         ("Deployers can wait", "Users of AI have nothing to do until 2027.", "Deployers have transparency, literacy and prohibition duties today. High-risk deployer duties follow in 2027."),
         ("It does not touch the UK", "The Act is an EU matter.", "It reaches UK providers selling into the EU and output used in the EU." + R("aia"))], s2)
    b.table(s2, "Adopted, final, draft or proposed", "The status of the main instruments as of November 2026. Only adopted law creates obligations; guidance shows how regulators will read it.", ["Instrument", "Status", "What it means"],
        [("Regulation (EU) 2026/1744", "Adopted law, in force since July 2026.", "The new dates are binding." + R("omni")),
         ("Article 50 guidelines", "Final, July 2026. Not binding.", "The Commission's reading of transparency scope and exceptions." + R("pw")),
         ("Transparency Code of Practice", "Final, June 2026. Voluntary.", "A recognised route to show Article 50 compliance." + R("cop")),
         ("EN 18286 standard", "Cited in the Official Journal, October 2026.", "Presumption of conformity for quality management only." + R("en")),
         ("High-risk classification guidelines", "Draft, May 2026.", "Direction of travel. Examples may change before adoption." + R("draft")),
         ("Digital Omnibus on data and privacy", "Proposal, still under negotiation.", "Proposed GDPR changes are not law. Current rules apply." + R("sidley", "fresh"))], s2, "46mm 1fr 1fr")

    # PART 03
    b.mark("03", s3)
    b.opener("03", "What it means<br>for the UK.", "No AI Act at home, but plenty of the EU's Act at the border, in contracts and in the tools UK teams use.", [("01", "How UK firms are caught"), ("02", "Four exposure profiles"), ("03", "Two approaches side by side")])
    b.essay(s3, "Outside the EU, but not outside the Act", [
        "The AI Act follows AI into the EU market. It applies to providers placing AI systems or general-purpose models on the EU market wherever they are established, and to providers and deployers in third countries where the output of their AI system is used in the Union." + R("aia") + " A UK software firm selling an AI feature to EU customers, or a UK recruiter scoring candidates for EU roles, can be inside its scope.",
        "Providers outside the EU that offer high-risk systems must appoint an authorised representative in the Union by written mandate." + R("aia") + " For UK firms that is a contract, a cost and a lead time to plan before December 2027, not after.",
        "Most UK organisations will feel the Act indirectly. The AI products they buy from global vendors are being built to meet it, so instructions for use, content marking and transparency features will arrive whether or not the buyer is in scope. Contracts with EU customers will increasingly ask UK suppliers to confirm their role and their compliance.",
        "The UK has taken a different route. Its 2024 response to the AI regulation white paper set five cross-sector principles for existing regulators to apply within their remits, on a non-statutory footing." + R("uk") + " The January 2025 AI Opportunities Action Plan focused on growth and adoption." + R("ap") + " The King's Speech of May 2026 contained no AI bill." + R("iapp"),
        "That does not leave UK firms without rules. Data protection law already governs much AI use, and the Data (Use and Access) Act 2025 reformed the rules on automated decision-making." + R("duaa") + " Sector regulators expect firms to manage AI risk within existing duties.",
        "The practical answer for most UK organisations is one governance approach that meets the stricter regime where it applies and good practice everywhere else. Running separate UK and EU programmes for the same tools doubles the effort and invites gaps."],
        s3, "Most UK firms will meet the AI Act through their suppliers and customers before they meet a regulator.")
    b.grid(s3, "Four exposure profiles", "Where a UK organisation sits decides how much of the Act applies, and when.",
        [("tag", "Selling AI into the EU", "Provider duties. Transparency now; high-risk from December 2027 with an EU authorised representative; marking by 2 December 2026 for older generative products."),
         ("transfer", "Output used in the EU", "Scoring, screening or generating content for EU people or customers. Check whether the use is high-risk and who the provider is."),
         ("server", "Operating in the EU", "EU subsidiaries and branches are deployers established in the Union, with transparency, literacy and future high-risk duties."),
         ("truck", "Buying AI products", "Not directly in scope for UK-only use, but suppliers' documentation, labels and limits will shape contracts and controls.")], s3,
        "Many organisations fit more than one profile. Classify each AI system, not the company as a whole.")
    b.table(s3, "Two approaches side by side", "How the UK and EU regimes compare for an organisation deciding where to set its bar.", ["Topic", "EU AI Act", "UK approach"],
        [("Legal basis", "A single horizontal regulation with direct effect." + R("aia"), "Existing law plus five non-statutory principles." + R("uk")),
         ("Risk tiers", "Prohibited, high-risk, transparency, minimal; separate GPAI rules.", "No statutory tiers. Regulators judge risk in context."),
         ("Enforcement", "National authorities and the Commission's AI Office; fines up to 7%.", "Existing regulators within their remits, such as data protection and financial services."),
         ("Timetable", "Staged dates to 2028, and 2030 for public authority systems.", "No AI-specific compliance dates. No AI bill in the 2026 King's Speech." + R("iapp")),
         ("Practical bar", "Mandatory where in scope.", "A useful benchmark for good governance.")], s3)

    b.mark("", "Recommendations")
    b.steps("Recommendations", "Six steps for UK organisations", "In order of urgency. Each builds evidence you will need whichever regime applies.",
        [("Build and own an AI register now", "Every system built, bought or used, with role, risk tier, EU link and a named business owner."),
         ("Close the December 2026 items", "Confirm generative suppliers mark content, check for the new prohibited uses, and put deepfake labelling rules in place."),
         ("Treat high-risk as a 2027 project starting today", "Classify borderline cases with legal input, appoint an EU representative if needed and start documentation."),
         ("Put the Act into supplier contracts", "Ask for role, risk tier, instructions for use, marking approach, incident contacts and change notices."),
         ("Make AI literacy role-based and recorded", "Different guidance for recruiters, marketers, developers and approvers, with training records kept."),
         ("Choose a management system", "Use ISO/IEC 42001 as the governance backbone; EN 18286 is built to sit on top of it for high-risk providers." + R("en"))], "Recommendations")
    b.questions("Questions for boards", "Questions for the board", "Ask these at the next meeting. The answers show whether the organisation has used the extra time or lost it.",
        [("Exposure", ["Which of our AI systems touch the EU market, and are we provider or deployer for each?", "Do any of our uses fall into Annex III high-risk categories?", "Who is accountable for AI governance, and what has changed since July 2026?"]),
         ("Readiness", ["Are our chatbot disclosures, content marking and deepfake labels in place today?", "What evidence do our AI suppliers give us, and is it in our contracts?", "How do we know staff using AI have the guidance their role needs?"])], "Questions for boards")
    b.glossary("Terms used in this report", [
        ("AI Act", "Regulation (EU) 2024/1689, the EU's horizontal law on AI systems and general-purpose AI models."),
        ("Digital Omnibus on AI", "Regulation (EU) 2026/1744, which amended the AI Act's timetable and some duties from July 2026."),
        ("Annex III", "The list of high-risk use areas, such as employment, education, credit and essential services."),
        ("Annex I", "EU product safety laws whose products can contain high-risk AI as a safety component."),
        ("Provider", "The organisation that develops an AI system or model and places it on the market under its own name."),
        ("Deployer", "An organisation using an AI system under its authority in a professional context."),
        ("Article 50", "Transparency duties: chatbot disclosure, machine-readable marking, deepfake and public-interest text labelling."),
        ("Grace period", "Extra time for systems already on the market before a new rule applies, set out in Article 111."),
        ("Harmonised standard", "A European standard cited in the Official Journal that gives a presumption of conformity."),
        ("Small mid-cap", "A company that is not an SME, has fewer than 750 staff and meets turnover or balance sheet limits."),
    ])

    b.mark("", "Sources")
    items = [(order[k], SRC[k]) for k in sorted(order, key=order.get)]
    b.sources(items[:9], "Sources were accessed in November 2026. Primary legal texts were checked on EUR-Lex. Law firm commentary is used for dates and context not stated in official pages.")
    b.sources(items[9:], "Sources continued. This report is general analysis, not legal advice.")
    b.rep_back("Turn the new clock<br>into a plan.", "Transputec helps UK organisations map the AI they build and use, classify it against the AI Act, set up proportionate governance and hold suppliers to account.", "Book an AI governance review",
        "Ready for the AI Act · Playbook No. 15")
    return b
