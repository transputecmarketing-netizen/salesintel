import re
from rkit import RBook, S

SRC = [
    "ASOS plc, Update regarding cyber incident (RNS), 6 October 2026, https://www.investegate.co.uk/announcement/rns/asos--asc/update-regarding-cyber-incident-/9809595",
    "Reuters (syndicated), UK online retailer ASOS shares drop on hack reports, 6 October 2026, https://wtvbam.com/2026/10/06/uk-online-retailer-asos-shares-drop-on-hack-reports/",
    "Malwarebytes, ASOS \"hackers\" send push notifications to customers, 6 October 2026, https://www.malwarebytes.com/blog/news/2026/10/asos-hackers-send-push-notifications-to-customers",
    "Help Net Security, ASOS confirms data breach after \"hacked\" app alert reaches shoppers, 7 October 2026, https://www.helpnetsecurity.com/2026/10/07/asos-data-breach-app-notification/",
    "National Cyber Security Centre, Incident affecting ASOS customers, 6 October 2026, https://www.ncsc.gov.uk/news/incident-affecting-asos-customers",
    "MLex, No Asos report of potential breach after app notification, UK ICO says, 6 October 2026, https://www.mlex.com/mlex/data-privacy-security/articles/2534427/no-asos-report-of-potential-breach-after-app-notification-uk-ico-says-update-",
    "Information Commissioner's Office, ASOS statement, 7 October 2026, https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/10/asos-statement/",
    "Pinsent Masons Out-Law, ASOS cyber attack leaves UK businesses and customers reeling, 7 October 2026, https://www.pinsentmasons.com/out-law/news/asos-cyber-attack-leaves-uk-businesses-and-customers-reeling",
    "Infosecurity Magazine, ASOS confirms data breach linked to stolen employee credentials, 8 October 2026 (updated 9 October), https://www.infosecurity-magazine.com/news/asos-data-breach-stolen-employee/",
    "LADbible, ASOS issues statement and explains how millions of customers got 'hack' message, 8 October 2026, https://www.ladbible.com/technology/asos-issues-statement-after-hack-message-shopping-925883-20261008",
    "Silicon UK, Asos acknowledges theft of detailed customer data, 9 October 2026, https://www.silicon.co.uk/cybersecurity/asos-customer-data-631835",
    "Malwarebytes, ASOS breach update: hackers stole customer details and shopping searches, 9 October 2026, https://www.malwarebytes.com/blog/data-breaches/2026/10/asos-breach-update-hackers-stole-customer-details-and-shopping-searches",
    "TechCrunch, Asos confirms breach of customer data after hackers send rogue app notification, 8 October 2026, https://techcrunch.com/2026/10/08/asos-confirms-breach-of-customer-data-after-hackers-send-rogue-app-notification/",
    "Yahoo Finance UK (syndicated), Asos cyber breach not caused by vulnerability in our platform, says Snowflake, 9 October 2026, https://uk.finance.yahoo.com/news/asos-cyber-breach-not-caused-102151192.html",
    "BankInfoSecurity, Asos hackers claim breach of Snowflake-connected Simon AI, 9 October 2026, https://www.bankinfosecurity.com/asos-hackers-claim-breach-snowflake-connected-simon-ai-a-33056",
    "Drapers, H&amp;M investigates potential cyber-attack, 12 October 2026, https://www.drapersonline.com/news/hm-investigates-potential-cyber-attack",
    "Betterment, Updates on Betterment January 9 security incident, January to March 2026, https://www.betterment.com/customer-update",
    "TechCrunch, Hacker breaches Fast Company systems to send offensive Apple News notifications, 28 September 2022, https://techcrunch.com/2022/09/28/hacker-breaches-fast-company-systems-to-send-offensive-apple-news-notifications/",
    "Google Cloud (Mandiant), UNC5537 targets Snowflake customer instances for data theft and extortion, 10 June 2024, https://cloud.google.com/blog/topics/threat-intelligence/unc5537-snowflake-data-theft-extortion",
    "Google Threat Intelligence Group, Widespread data theft targets Salesforce instances via Salesloft Drift, August 2025, https://cloud.google.com/blog/topics/threat-intelligence/data-theft-salesforce-instances-via-salesloft-drift",
    "CNBC, M&amp;S cyberattack to wipe out nearly one-third of annual profits, 21 May 2025, https://www.cnbc.com/2025/05/21/ms-cyberattack-to-wipe-out-nearly-one-third-of-annual-profits.html",
    "TechCrunch, UK retail giant Co-op confirms hackers stole all 6.5 million customer records, 16 July 2025, https://techcrunch.com/2025/07/16/uk-retail-giant-co-op-confirms-hackers-stole-all-6-5-million-customer-records/",
    "Security Affairs, The financial impact of Marks &amp; Spencer and Co-op cyberattacks could reach £440M, June 2025, https://securityaffairs.com/179225/cyber-crime/the-financial-impact-of-marks-spencer-and-co-op-cyberattacks-could-reach-440m.html",
    "Computing, Four arrested over M&amp;S, Co-op and Harrods cyberattacks, July 2025, https://www.computing.co.uk/news/2025/security/four-arrested-over-m-s-co-op-and-harrods-cyberattacks",
    "BleepingComputer, Harrods suffers new data breach exposing 430,000 customer records, September 2025, https://www.bleepingcomputer.com/news/security/harrods-suffers-new-data-breach-exposing-430-000-customer-records/",
    "legislation.gov.uk, UK GDPR Article 33: Notification of a personal data breach to the Commissioner, https://www.legislation.gov.uk/eur/2016/679/article/33",
    "legislation.gov.uk, UK GDPR Article 34: Communication of a personal data breach to the data subject, https://www.legislation.gov.uk/eur/2016/679/article/34",
]

def renumber(b):
    """Renumber citations in order of first use; return original source numbers in new order."""
    pat = re.compile(r'(<sup class="c"[^>]*>)([0-9,]+)(</sup>)')
    order = []
    for body, *_ in b.pages:
        for m in pat.finditer(body):
            for n in m.group(2).split(","):
                if int(n) not in order: order.append(int(n))
    new = {o: i + 1 for i, o in enumerate(order)}
    b.pages = [(pat.sub(lambda m: m.group(1) + ",".join(str(new[int(n)]) for n in m.group(2).split(",")) + m.group(3), body), *rest) for body, *rest in b.pages]
    unused = [i + 1 for i in range(len(SRC)) if i + 1 not in order]
    assert not unused, unused
    return order

def build():
    b = RBook("Your App, Their Voice", 5, "dots", "exploded")
    b.how = "What happened when attackers used ASOS's own app to message its customers, what is confirmed and what is not, how channel hijacks work, and what UK organisations should do."
    b.rep_cover("Intelligence report · Customer channels", "Your app,<br>their voice.", "In October 2026 attackers sent an \"ASOS HACKED\" alert to customers through the retailer's own app. What is confirmed, how these attacks work, and why every brand's messaging tools are now part of its attack surface.", "November 2026")
    b.contents()

    b.mark("", "Executive summary"); b.summary("A private extortion demand, delivered to customers' lock screens", [
        "At around 10am on 6 October 2026, ASOS app users received an unauthorised push notification headed \"ASOS HACKED\"." + S(1, 3) + " Addressed to the company's data protection officer and IT team, it claimed a Snowflake environment had been \"fully compromised\" and demanded engagement under threat of a leak." + S(3) + " ASOS said it was investigating unauthorised activity involving third-party platforms it uses to communicate with customers, and its shares fell around 10% that day." + S(1, 2),
        "ASOS first said basic personal information such as names and contact details may have been accessed." + S(1) + " On 8 October it said an intruder had obtained an employee's login details by impersonating a trusted contact, then used them to reach information on certain third-party platforms." + S(9, 10) + " The BBC reported that a sample sent by the attackers included addresses, dates of birth, customer numbers and search history, and ASOS gave a fuller account after it was approached." + S(11, 12) + " Snowflake said the incident did not result from any weakness in its platform." + S(14),
        "The incident fits a pattern seen across 2026: attackers using social engineering to reach marketing and messaging platforms, then using a brand's own channels to extort it or defraud its customers." + S(17) + " For UK organisations, the lesson is that every tool that can message customers belongs inside the security perimeter, and that incident communications must be ready before the first rogue message lands."],
        "Your customer channels are only as secure as the least protected account on the platforms behind them. Inventory them, enforce strong sign-in and approvals, and prepare to tell customers the truth within hours.")
    b.mark("", "Key findings"); b.findings("Seven things this incident shows", [
        ("The attack went public before the investigation began", "Because the message reached customers directly, ASOS had to respond in public within hours. Lawyers noted this leaves little time to investigate before communicating." + S(8)),
        ("The route in was a person, not a vulnerability", "ASOS said the intruder impersonated a trusted contact to get an employee's credentials." + S(9) + " Snowflake said there was no flaw or misconfiguration in its service." + S(14)),
        ("Third-party communication platforms were the target", "ASOS's own description points to platforms used to communicate with customers, not its core website or payment systems." + S(1, 10)),
        ("Early statements understated the data involved", "The first statement mentioned basic contact details. Two days later a fuller list emerged after the BBC reported seeing a data sample." + S(1, 11)),
        ("Some important facts remain unconfirmed", "ASOS has not said how many customers were affected or which platform sent the alert. The attackers' claim that a marketing platform was the route in is unverified." + S(12, 15)),
        ("Regulators moved quickly on public advice", "The NCSC told customers to assume they were affected. The ICO issued a statement the next day." + S(5, 7)),
        ("This is a pattern, not a one-off", "Betterment reported a similar abuse of a third-party marketing platform in January 2026, and credential-led attacks on SaaS platforms have been documented since 2024." + S(17, 19))])
    b.mark("", "At a glance"); b.facts("The incident in numbers", "Key figures from company statements, regulators and reputable reporting. Some are preliminary.", [
        ("~10am", "Time on 6 October 2026 when ASOS said the unauthorised customer notification was sent." + S(1)),
        ("~10%", "Fall in ASOS's share price on the day the incident was disclosed, according to Reuters." + S(2)),
        ("7", "Types of personal data the BBC reported seeing in the attackers' sample, including dates of birth and search history." + S(11)),
        ("10m+", "Google Play downloads of the ASOS Android app, as noted by the BBC. The number of affected customers has not been disclosed." + S(4)),
        ("72 hours", "Deadline, where feasible, for notifying the ICO of a reportable personal data breach under UK GDPR." + S(26)),
        ("165", "Organisations notified in the 2024 campaign that used stolen credentials against Snowflake customer accounts without MFA." + S(19))], "At a glance")
    b.mark("", "Timeline"); b.timeline("From lock screen to fuller disclosure", "Dated events from company statements, regulators and reporting. Attacker claims are labelled.", [
        ("28 Sep 2026", "Possible earlier activity (claimed)", "A screenshot posted by the attackers shows a file dated 28 September, suggesting activity from at least that date. This is unverified." + S(15)),
        ("6 Oct, ~10am", "Rogue push notification", "ASOS app users receive \"ASOS HACKED\" with a demand and a Telegram link." + S(1, 3)),
        ("6 Oct", "Stock exchange statement", "ASOS confirms unauthorised activity on third-party communication platforms and restricts access. Shares fall around 10%." + S(1, 2)),
        ("6 Oct", "NCSC advice; ICO not yet notified", "The NCSC tells customers to assume they are affected. The ICO says it has not received a report at this stage." + S(5, 6)),
        ("6 Oct, evening", "Customer email", "ASOS apologises by email and urges customers not to engage with related links." + S(8)),
        ("7 Oct", "ICO statement", "The ICO publishes a statement acknowledging how unsettling such messages are for the public." + S(7)),
        ("8 Oct", "Cause and fuller data list", "ASOS says an employee account was obtained by impersonation. The BBC reports a sample containing more than basic contact details." + S(9, 11)),
        ("9 Oct", "Snowflake statement", "Snowflake says the issue did not result from any vulnerability, weakness, flaw or misconfiguration in its service." + S(14)),
        ("12 Oct", "H&amp;M investigates claims", "H&amp;M says it is investigating online claims reportedly linked to the same group, and has found no sign of compromise." + S(16))])

    b.mark("01", "What happened"); b.opener("01", "What<br>happened.", "Separating what ASOS has confirmed from what attackers and commentators have claimed.", [("01", "The confirmed account"), ("02", "Confirmed, claimed and unknown"), ("03", "How the disclosure changed")])
    b.essay("The confirmed account", "One employee account, several platforms, millions of screens", [
        "The ASOS incident began, as far as the company has said, with a conversation rather than an exploit. In its 8 October update, ASOS said an unauthorised party gained access to an employee account \"by impersonating a trusted contact to obtain log in credentials\", and that those credentials were \"used to access information on certain third-party platforms used by ASOS\"." + S(9),
        "The visible result came on 6 October. A push notification appeared on customers' phones, addressed not to them but to ASOS's data protection officer and IT team. It claimed the attackers had compromised a Snowflake instance and warned: \"Engage with us, or we will leak it\"." + S(3) + " In effect, the attackers used ASOS's own audience as a loudspeaker for their demand.",
        "ASOS's first public statement, issued to the London Stock Exchange the same day, confirmed an unauthorised customer notification at around 10am and said the company had restricted access to the notification platforms and was working with specialist advisers and relevant authorities. It said it did not believe payment card information or account passwords were affected, and that the website and app were operating normally." + S(1),
        "The company has not said which platform sent the notification, and it is not known how the attackers reached the sending system." + S(13) + " The attackers later told the BBC they had reached the data through Simon AI, a marketing platform that runs on Snowflake, but neither ASOS nor independent researchers have confirmed this." + S(12, 15) + " Snowflake said there was no vulnerability, weakness, flaw or misconfiguration in its service and no remediation was required for its customers." + S(14),
        "On 8 October ASOS apologised to customers for the notification and \"any uncertainty this caused\", said the affected platforms had been locked down, and said it had involved cyber specialists, law enforcement and regulators." + S(10) + " It said customers needed to take no action on their accounts but should be wary of unexpected messages or calls claiming to be from ASOS.",
        "Key gaps remain. ASOS has not disclosed how many customers were affected. The attackers reportedly set a two-week deadline, and the company did not say how it would respond." + S(12)],
        "What happened", "ASOS said the intrusion began when someone impersonated a trusted contact. No software flaw has been identified.")
    b.table("Confirmed, claimed and unknown", "What we know, and how we know it", "Treat claims made by attackers as unverified until the company or investigators confirm them.", ["Topic", "Confirmed by ASOS or others", "Claimed, not confirmed", "Still unknown"],
        [("Entry point", "Employee account obtained by impersonating a trusted contact." + S(9), "Access via a Snowflake-based marketing platform." + S(15), "Whether MFA was in place on that account."),
         ("Platforms", "Third-party platforms used to communicate with customers." + S(1), "Attackers said a Snowflake instance was \"fully compromised\"." + S(3), "Which platform sent the push alert."),
         ("Snowflake", "Snowflake found no flaw in its platform." + S(14), "None beyond the attackers' message.", "How the data store was reached."),
         ("Data", "Names, contact details and certain account information." + S(10), "Fuller profiles in the BBC sample, not independently verified." + S(9, 11), "How many customers are affected."),
         ("Payments", "ASOS said no card data or passwords were accessed." + S(10), "Attackers also said payment data was not taken." + S(3), "None reported."),
         ("Regulator", "The ICO had not received a report on 6 October." + S(6), "None.", "Whether and when a formal report was made.")], "What happened", widths="24mm 1fr 1fr 1fr")
    b.compare("How the disclosure changed", "Day one versus day three", "The story changed within 48 hours. Early statements in live incidents often do.", ["Topic", "6 October", "8 October"],
        [("Cause", "\"Unauthorised activity involving third-party platforms that we use to communicate with customers.\"" + S(1), "An employee account was obtained by someone impersonating a trusted contact." + S(9)),
         ("Data", "\"Basic personal information including name and contact details may have been accessed.\"" + S(1), "Personal information such as names and contact details and \"certain non-personal account related information\". BBC reports a wider sample." + S(10, 11)),
         ("Payments", "Not believed to be affected." + S(1), "No payment card information or account passwords were accessed." + S(10)),
         ("Customer action", "Do not engage with the notification or its link." + S(8), "No action needed on accounts. Be wary of unexpected messages and calls." + S(10)),
         ("Who pushed the update", "ASOS, after attackers went public.", "ASOS, after the BBC reported receiving a data sample." + S(11))], "What happened")

    b.mark("02", "How channel hijacks work"); b.opener("02", "How it<br>works.", "The general pattern behind attacks that turn a brand's own channels against it.", [("01", "The anatomy of a channel hijack"), ("02", "Why marketing platforms are attractive"), ("03", "Other cases")])
    b.figpage("General pattern", "The anatomy of a channel hijack", "This describes how such attacks typically work. It is not a confirmed account of the ASOS intrusion.", "relay",
        [("Get a foothold through a person", "Phishing, phone calls posing as IT or a supplier, or passwords stolen by malware. In 2024 Mandiant traced a Snowflake campaign to infostealer credentials." + S(19)),
         ("Reach the SaaS platform", "Marketing and data platforms are often reached with a username and password, without single sign-on, and sometimes without MFA." + S(19)),
         ("Take the data and the audience", "The same platforms that store customer profiles can also send to them, so one login can deliver both data and reach."),
         ("Use the channel as leverage", "A message to customers turns a private demand into public pressure, as at ASOS, or delivers fraud, as at Betterment." + S(3, 17))], "How it works")
    b.essay("Why marketing platforms", "The soft spot between marketing and IT", [
        "Customer communication platforms have three features that attract attackers. They hold rich customer data, because personalisation needs it. They can send at scale, because that is their job. And they often sit outside the controls that protect core systems, because they were bought and configured by commercial teams.",
        "The 2024 campaign against Snowflake customers showed how this plays out. Mandiant found no breach of Snowflake's own environment. Instead, the attackers used credentials stolen by infostealer malware, often from contractor devices, against accounts without multi-factor authentication, with passwords that had not been rotated and no network allow lists. Around 165 organisations were notified." + S(19),
        "In August 2025, Google reported that attackers had used stolen OAuth tokens for the Salesloft Drift integration to export data from Salesforce environments, between at least 8 and 18 August, before the tokens were revoked." + S(20) + " The lesson there was that integrations can carry access for months without anyone looking at them.",
        "The ASOS incident adds a further step. Instead of only taking data quietly and contacting the victim privately, the attackers used the platform's sending ability to reach customers directly. That gives an attacker leverage that a ransom email does not: every customer, journalist and investor learns of the incident at once." + S(3, 8),
        "A security researcher quoted in reporting claimed that MFA is not required by default on the marketing platform the attackers named. That claim has not been confirmed and the provider had not commented publicly at the time of writing." + S(15) + " Whether or not it applies here, default settings on SaaS tools deserve a review.",
        "What most organisations get wrong is ownership. Marketing owns the platform, a supplier runs it, and IT assumes someone else checked the sign-in settings. The result is that a high-reach system ends up with weaker controls than an internal file share."],
        "How it works", "A platform that can both store customer data and message customers gives one login two kinds of power.")
    b.table("Other cases", "Brands' own channels used against them", "Verified examples of the pattern. Details vary, and some investigations are ongoing.", ["Case", "Channel abused", "What happened", "Source"],
        [("ASOS, Oct 2026", "App push via third-party platforms", "Extortion demand sent to customers. Employee account obtained by impersonation." + S(1, 9), "Company statements"),
         ("Betterment, Jan 2026", "Third-party marketing and communications platform", "Fraudulent crypto offer sent to some customers after social engineering. Contact data and birthdates accessed." + S(17), "Company updates"),
         ("Fast Company, Sep 2022", "Apple News push notifications", "Hacker breached internal systems and sent offensive notifications to readers." + S(18), "Reporting"),
         ("Salesforce customers, Aug 2025", "Connected app tokens", "Stolen integration tokens used to export CRM data at scale." + S(20), "Google advisory"),
         ("Snowflake customers, 2024", "Data platform accounts without MFA", "Stolen credentials used for data theft and extortion. About 165 organisations notified." + S(19), "Mandiant")], "How it works", widths="34mm 1fr 1fr 26mm")

    b.mark("03", "Trust and the UK picture"); b.opener("03", "Trust and<br>the UK.", "Retail has been a prime target since 2025. What this means for customer trust and for UK organisations.", [("01", "The retail context"), ("02", "The trust cost"), ("03", "What it means for UK organisations"), ("04", "Recommendations")])
    b.essay("The retail context", "Eighteen months of pressure on UK retail", [
        "ASOS was not the first UK retailer to face a damaging incident in this period. In spring 2025, Marks and Spencer estimated that a cyber attack would cost it around £300 million in operating profit for 2025/26 before mitigation." + S(21) + " Co-op later confirmed that the personal data of all 6.5 million of its members had been taken." + S(22),
        "The Cyber Monitoring Centre estimated the combined financial impact of the M&amp;S and Co-op incidents at between £270 million and £440 million." + S(23) + " In July 2025 the National Crime Agency arrested four people aged 17 to 20 in connection with the attacks on M&amp;S, Co-op and Harrods." + S(24),
        "In September 2025 Harrods said around 430,000 customer records had been taken from a third-party provider, a separate incident from an attempted intrusion earlier that year." + S(25) + " The theme of supplier and third-party exposure runs through these cases.",
        "In October 2026, days after the ASOS incident, H&amp;M said it was investigating online claims of a potential cyber incident, reportedly linked to the same group. It said it had found no indication that its data environment had been compromised." + S(16),
        "The common elements are social engineering of staff or suppliers, large stores of customer data, and a high public profile. Retailers hold exactly the kind of data that fuels follow-up fraud: names, addresses, dates of birth and purchase behaviour.",
        "What the ASOS case adds is a new form of pressure. Disruption and data theft are now joined by the public hijack of the brand's own voice."],
        "Trust and the UK", "Attackers have learned that customer trust is leverage. The channel that carries it is now a target.")
    b.grid("The trust cost", "Four ways a hijacked channel damages trust", "Harm extends well beyond the data itself.", [
        ("bell", "Every customer hears it", "A push alert reaches every device at once. Markets reacted within hours, with shares down around 10%." + S(2)),
        ("eye", "Doubt about genuine messages", "Customers may ignore real alerts or, worse, trust fake ones. The NCSC warned that suspicious messages can arrive long after a breach." + S(5)),
        ("magnifier", "Statements are tested in public", "When the media obtain data samples, any gap between early statements and the facts becomes the story." + S(11)),
        ("contract", "Faster legal exposure", "Lawyers expect data protection claims, including group claims, may follow more quickly than usual when customers know from day one." + S(8))], "Trust and the UK")
    b.essay("What it means for UK organisations", "Five implications for UK boards and IT leaders", [
        "First, the perimeter now includes every platform that can message customers. Push services, email service providers, SMS gateways, customer data platforms and social media tools should be in the asset register, with named owners and the same sign-in standards as finance systems.",
        "Second, social engineering of staff and suppliers remains the leading route in. ASOS, Betterment and the 2025 retail incidents all involved people being deceived." + S(9, 17) + " Phishing-resistant MFA, strict help desk verification and training on impersonation by trusted contacts matter more than any single tool.",
        "Third, the UK GDPR clock does not wait for certainty. Controllers must notify the ICO without undue delay and, where feasible, within 72 hours of becoming aware of a personal data breach, unless it is unlikely to result in a risk to individuals. Processors must tell controllers without undue delay." + S(26) + " Where the risk to individuals is high, they must be told directly without undue delay." + S(27),
        "Fourth, communications are part of the response, not an afterthought. In a channel hijack, the attacker tells customers first. Organisations need pre-approved holding statements, a way to update customers through trusted channels, and a habit of stating what is known and not yet known.",
        "Fifth, supplier contracts and settings deserve fresh attention. Ask every messaging provider whether MFA or single sign-on can be enforced, what audit logs are available, and how fast they will notify you of an incident. Then check the settings yourself.",
        "None of this requires new technology. It requires someone to own the question of who can speak to your customers, and to check the answer regularly."],
        "Trust and the UK", "The question is simple: who, today, can send a message to all of your customers? Most organisations cannot answer it.")
    b.steps("Recommendations", "Six steps to take this quarter", "Practical actions in priority order. The companion playbook gives owners and checks for each.",
        [("Inventory every customer channel", "Every platform that can message customers, with owners, users and API keys."),
         ("Enforce strong sign-in on all of them", "SSO where possible, MFA everywhere, and no leavers or stale agency logins."),
         ("Limit and approve mass sends", "A few named senders, and a second approver for large sends."),
         ("Monitor the platforms", "Alert on new admins, new keys, list exports and unusual send volumes."),
         ("Prepare to speak first", "Draft holding statements and rehearse a rogue message, including the ICO assessment."),
         ("Question your suppliers", "Confirm MFA enforcement, logging, breach notice timings and account change checks.")], "Trust and the UK")
    b.questions("For the board", "Questions boards should ask now", "Use these to test whether your organisation could cope with a channel hijack.",
        [("Exposure", ["Which platforms can send a message to all of our customers, and who owns each?", "How many people and suppliers hold send rights or API keys for them?", "Are MFA and single sign-on enforced on every one?"]),
         ("Response", ["How quickly could we stop a rogue message, and has anyone tested it?", "Do we have approved customer statements ready, and who signs them off?", "Who decides, within 72 hours, whether we report to the ICO?"])], "Trust and the UK")
    b.glossary("Words worth knowing", [
        ("Push notification", "A message sent by an app to a phone's notification screen, usually through a third-party service."),
        ("Customer data platform", "A system that gathers customer data and is often used to trigger personalised messages."),
        ("Snowflake", "A cloud data platform used by many organisations to store and analyse data."),
        ("Social engineering", "Deceiving people into giving access or information, for example by posing as a trusted contact."),
        ("Infostealer", "Malware that collects saved passwords and session data from an infected device."),
        ("OAuth token", "A credential that lets one application access another on a user's behalf."),
        ("MFA", "Multi-factor authentication: a second check beyond a password at sign-in."),
        ("RNS", "Regulatory News Service, used by listed companies to make stock exchange announcements."),
        ("Controller and processor", "Under UK GDPR, the controller decides how personal data is used; the processor handles it on the controller's behalf."),
        ("Extortion", "Demanding payment or engagement under threat, such as leaking stolen data.")])
    order = renumber(b)
    src = [SRC[o - 1] for o in order]; half = (len(src) + 1) // 2
    b.mark("", "Sources"); b.sources([(i + 1, t) for i, t in enumerate(src[:half])])
    b.sources([(i + 1 + half, t) for i, t in enumerate(src[half:])], "Continued. Attacker claims are reported as claims. Several pages were read through syndicated or secondary reports where the original was not accessible.")
    b.rep_back("Who else can speak<br>for your brand?", "We help UK organisations find and secure the platforms that reach their customers, monitor them for misuse and prepare incident communications that stand up to scrutiny.", "Book a channel security review", "Playbook No. 05 · Guard your voice")
    return b
