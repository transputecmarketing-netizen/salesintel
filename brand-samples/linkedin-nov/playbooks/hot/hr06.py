from rkit import RBook, S

SRC = {
    "msrc": "Microsoft Security Response Center, Using risk cohorts to prioritize security updates, 13 October 2026, https://www.microsoft.com/en-us/msrc/blog/2026/10/using-risk-cohorts-to-prioritize-security-updates",
    "tenms": "Tenable, Microsoft's October 2026 Patch Tuesday addresses 1,407 CVEs (CVE-2026-96951), 13 October 2026, https://www.tenable.com/blog/microsofts-october-2026-patch-tuesday-addresses-1407-cves-cve-2026-96951",
    "swms": "SecurityWeek, Microsoft Patches Record 1,413 Vulnerabilities, Including Exploited Windows Zero-Day, 14 October 2026, https://www.securityweek.com/microsoft-patches-record-1413-vulnerabilities-including-exploited-windows-zero-day/",
    "kev": "CISA, Known Exploited Vulnerabilities Catalog (catalogue version 2026.10.30, data feed analysed by Transputec on 3 November 2026), https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
    "php": "The PHP Group, Security advisory: Critical remote code execution vulnerabilities, update now, and release notes for PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35, 20 to 21 October 2026, https://www.php.net/",
    "aws": "Amazon Web Services Security Blog, Amazon Threat Intelligence identifies PHP2Shell exploitation prior to public disclosure in MadPot, 21 October 2026, https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/",
    "reg": "The Register, PHP2Shell puts dozens of UK government services out of service, 22 October 2026, https://www.theregister.com/security/2026/10/22/php2shell-puts-dozens-of-uk-government-services-out-of-service/5304840",
    "h3": "Horizon3.ai, CVE-2026-101767: Oracle EBS SQL Injection RCE, October 2026, https://horizon3.ai/attack-research/vulnerabilities/cve-2026-101767/",
    "thn": "The Hacker News, Hackers Target Critical Oracle E-Business Suite RCE Flaw Days After Security Patch, 28 October 2026, https://thehackernews.com/2026/10/hackers-target-critical-oracle-e.html",
    "mtr": "Google Cloud (Mandiant), M-Trends 2026: Data, Insights, and Strategies From the Frontlines, 23 March 2026, https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026",
    "vc": "VulnCheck, State of Exploitation 1H 2026, 28 July 2026, https://www.vulncheck.com/blog/state-of-exploitation-1h-2026",
    "r7": "Rapid7, Q3 2026 Threat Update: Attackers Are Exploiting Vulnerabilities Within 3 Days, 21 October 2026, https://www.rapid7.com/blog/post/tr-q3-2026-threat-update-attackers-exploiting-vulnerabilities-within-3-days/",
    "win": "Microsoft Windows Experience Blog, Evolving Windows vulnerability management to meet the speed of AI-powered discovery, 9 July 2026, https://blogs.windows.com/windowsexperience/2026/07/09/evolving-windows-vulnerability-management-to-meet-the-speed-of-ai-powered-discovery/",
    "ncscai": "NCSC, Impact of AI on cyber threat from now to 2027, 7 May 2025, https://www.ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027",
    "wiz": "Wiz Research, PHP2Shell: AI uncovers critical RCE vulnerabilities affecting 70% of the Internet, 21 October 2026, https://www.wiz.io/blog/php2shell-php-rce",
    "tenphp": "Tenable, php2shell (CVE-2026-109618, CVE-2026-109619): Frequently asked questions, October 2026 (updated 28 October), https://www.tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote",
    "cf": "Cloudflare, Cloudflare deploys protections against php2shell vulnerability, 21 October 2026 (updated 23 October), https://blog.cloudflare.com/php-vulnerabilities-waf-protection/",
    "ncscphp": "NCSC, Critical security issue affecting PHP, 21 October 2026, https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php",
    "cisaphp": "CISA, Critical Vulnerabilities in PHP Require Immediate Patching, 21 October 2026 (revised 26 October), https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching",
    "sw974": "SecurityWeek, Microsoft Patches Record 974 Vulnerabilities, Including Two Exploited Zero-Days, 8 September 2026, https://www.securityweek.com/microsoft-patches-record-974-vulnerabilities-including-two-exploited-zero-days/",
    "mwb": "Malwarebytes, Update Windows: Record Patch Tuesday fixes flaw already under attack, 14 October 2026, https://www.malwarebytes.com/blog/bugs/2026/10/update-windows-record-patch-tuesday-fixes-flaw-already-under-attack",
    "cs": "CyberScoop, PHP releases emergency fixes for 2 critical vulnerabilities, 21 October 2026, https://cyberscoop.com/php-emergency-patches-php2shell-vulnerabilities/",
    "hns": "Help Net Security, PHP2Shell: Critical PHP vulnerabilities patched, update now!, 21 October 2026, https://www.helpnetsecurity.com/2026/10/21/php2shell-php-vulnerabilities-patched-cve-2026-109618-cve-2026-109619/",
    "phpsv": "The PHP Group, Supported Versions, accessed 3 November 2026, https://www.php.net/supported-versions.php",
    "war": "Waratek, Oracle Releases the October 2026 Critical Patch Update, October 2026, https://waratek.com/news/oracle-releases-the-october-2026-critical-patch-update/",
    "swor": "SecurityWeek, Hackers Start Probing Fresh Oracle EBS Vulnerability, 28 October 2026, https://www.securityweek.com/hackers-start-probing-fresh-oracle-ebs-vulnerability/",
    "cd": "Cyber Daily, Patch now! Hackers targeting 10-day-old Oracle E-Business Suite vulnerability, 30 October 2026, https://www.cyberdaily.au/security/14379-patch-now-hackers-targeting-ten-day-old-oracle-e-business-suite-vulnerability",
    "gtig": "Google Threat Intelligence Group, Oracle E-Business Suite zero-day exploited in widespread extortion campaign, October 2025, https://cloud.google.com/blog/topics/threat-intelligence/oracle-ebusiness-suite-zero-day-exploitation",
    "bod": "CISA, BOD 26-04: Prioritizing Security Updates Based on Risk, 10 June 2026, https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk",
    "ce": "NCSC, Cyber Essentials: Requirements for IT Infrastructure v3.3, April 2026, https://www.ncsc.gov.uk/files/cyber-essentials-requirements-for-it-infrastructure-v3-3.pdf",
}


def build():
    b = RBook("The Patch Gap", 6, "burst", "slow")
    order = {}

    def R(*keys):
        for k in keys:
            order.setdefault(k, len(order) + 1)
        return S(*sorted(order[k] for k in keys))

    b.how = "An evidence-based look at the October 2026 patch wave: Microsoft's record release, the PHP2Shell emergency and a fresh Oracle E-Business Suite flaw. What the data says about how fast attackers now move, and what UK organisations should change."
    b.rep_cover("Intelligence report · Vulnerability management", "The patch<br>gap.",
        "A record Patch Tuesday, an emergency PHP release and an Oracle flaw probed within a week. The window between fix and attack has collapsed. Here is the evidence, and what to do.", "November 2026")
    b.contents()

    # ---------- summary
    b.mark("", "Executive summary")
    b.summary("The fix and the attack now arrive in the same week. Sometimes the attack comes first.", [
        f"On 13 October 2026 Microsoft shipped the largest monthly security release in its history: between 1,407 and 1,413 CVEs, depending on how they are counted, including a Windows Shell flaw already being exploited.{R('tenms','swms')} CISA added it to its exploited list the same day and gave US federal agencies three days to fix it.{R('kev')}",
        f"Eight days later the PHP project released emergency fixes for two critical flaws, known as PHP2Shell, in the language behind a large share of the web.{R('php')} Amazon's honeypots had logged an exploitation attempt four days before disclosure.{R('aws')} In the UK, the technology minister told the House of Lords that 32 government services were unavailable, largely as a precaution.{R('reg')} Meanwhile Oracle's October update fixed an unauthenticated SQL injection in E-Business Suite, and decoy servers recorded exploit attempts within a week.{R('h3','thn')}",
        f"These are not isolated events. Mandiant estimates the mean time to exploit is now negative: on average, exploitation starts before a patch exists.{R('mtr')} VulnCheck found that almost a quarter of known exploited vulnerabilities in the first half of 2026 showed exploitation on or before the day the CVE was published.{R('vc')}",
        "AI is speeding up discovery on both sides. It is also why the volume of fixes is climbing. Monthly patching, tested at leisure, can no longer keep up with the threat."],
        "Patching is no longer a monthly chore. For anything exploited or internet-facing, it is an incident response activity measured in hours and days, and boards should ask for the numbers that prove it.")

    # ---------- findings
    b.mark("", "Key findings")
    b.findings("Seven things the October patch wave tells us", [
        ("Volume has reached a new scale.", f"Microsoft's October release was the second record month in a row, after 974 CVEs in September.{R('tenms','sw974')} Microsoft says AI-assisted discovery means more fixes per release.{R('win')}"),
        ("Exploitation can start before the patch.", f"Amazon logged a PHP2Shell attempt on 17 October, four days before the fixes were public.{R('aws')}"),
        ("A week is now a long time.", f"Oracle patched CVE-2026-101767 on 20 October. Exploratory attacks on decoys followed on 27 October.{R('h3','thn')}"),
        ("Regulators have moved to days, not weeks.", f"In October 2026, 29 of the 36 flaws CISA added to its exploited list carried a three-day federal deadline.{R('kev')}"),
        ("Old software is where the gap is widest.", f"PHP 8.1 and older get no official fix, yet researchers estimate unsupported branches still run on far more servers than supported ones.{R('php','cs')}"),
        ("AI helps both sides, but the evidence is mixed.", f"Researchers credit AI with finding PHP2Shell and building exploits in days. VulnCheck finds only 1.3% of AI-discovered flaws confirmed exploited so far.{R('wiz','vc')}"),
        ("Prioritisation beats raw speed.", f"Microsoft, CISA and the NCSC all point to the same order: exploited first, internet-facing first, then the rest.{R('msrc','bod','ncscphp')}"),
    ])

    # ---------- facts
    b.mark("", "At a glance")
    b.facts("The October patch wave in six numbers", "Every figure is sourced. Where counts differ, we give the range.", [
        ("1,407 to 1,413", f"CVEs in Microsoft's October 2026 release, depending on method. Tenable counts 69 as Critical.{R('tenms','swms')}"),
        ("4 days", f"Between the first PHP2Shell attempt Amazon observed and public disclosure on 21 October.{R('aws')}"),
        ("7 days", f"From Oracle's October patch for CVE-2026-101767 to the first recorded exploit attempts on decoys.{R('h3','thn')}"),
        ("3 days", f"Federal deadline on 29 of CISA's 36 exploited-list additions in October 2026.{R('kev')}"),
        ("32", f"UK government services unavailable on 22 October, with four partly unavailable, largely as a precaution.{R('reg')}"),
        ("23.43%", f"Share of known exploited vulnerabilities in 1H 2026 exploited on or before CVE publication day.{R('vc')}"),
    ], "At a glance")

    # ---------- timeline
    b.mark("", "Timeline")
    b.timeline("Three months, three patch emergencies", "Key dated events, from private disclosure to exploitation.", [
        ("24 Jul 2026", "Oracle EBS flaw reported", f"Horizon3.ai privately reports an unauthenticated SQL injection in Oracle E-Business Suite.{R('h3')}"),
        ("24 Aug 2026", "PHP flaws reported", f"Wiz reports the flaws later called PHP2Shell to the PHP project, five days after finding them.{R('wiz')}"),
        ("13 Oct 2026", "Record Patch Tuesday", f"Microsoft fixes over 1,400 CVEs. CISA lists CVE-2026-96951 as exploited, due 16 October.{R('swms','kev')}"),
        ("17 Oct 2026", "First PHP2Shell attempt", f"Amazon's MadPot honeypots record an exploitation attempt, four days before disclosure.{R('aws')}"),
        ("20 Oct 2026", "Oracle October update", f"Oracle fixes CVE-2026-101767. PHP gives advance notice of a critical release.{R('h3','php')}"),
        ("21 Oct 2026", "PHP emergency release", f"PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35 ship. NCSC and CISA urge immediate action.{R('php','ncscphp','cisaphp')}"),
        ("22 Oct 2026", "UK services offline", f"The minister tells the Lords 32 government services are unavailable.{R('reg')}"),
        ("26 Oct 2026", "PHP flaws listed as exploited", f"CISA adds both PHP CVEs to its exploited list, with a 29 October deadline.{R('kev','cisaphp')}"),
        ("27 Oct 2026", "Oracle flaw probed", f"Defused's decoy servers record exploratory attacks on CVE-2026-101767.{R('thn')}"),
    ])

    # ---------- part 01
    b.mark("01", "The October wave")
    b.opener("01", "The October<br>wave.", "Three vendors, three very different flaws, one lesson about timing.", [("01", "A record Patch Tuesday"), ("02", "PHP2Shell and Oracle EBS"), ("03", "How the attacks work")])
    b.essay("The October wave", "A record month, and one flaw already in use", [
        f"Microsoft's October 2026 security release was the largest it has published. Tenable counted 1,407 CVEs across 301 products and components, 69 of them rated Critical.{R('tenms')} SecurityWeek counted 1,413, with 1,102 affecting Windows and 134 affecting Office, and reported that October alone exceeded Microsoft's total for all of 2025.{R('swms')} The differences come from what each tracker includes, not from any dispute about the scale.",
        f"It followed September's release of 974 CVEs, itself a record at the time.{R('sw974')} Microsoft has been clear about why. In July it said advances in AI were changing the pace of vulnerability discovery and that customers \"will see a higher volume of security updates\" in each release.{R('win')}",
        f"Among the 1,400-plus fixes, one mattered more than the rest. CVE-2026-96951 is a Windows Shell security feature bypass, rated 8.8, that lets an attacker get around Mark of the Web, the warning Windows shows on downloaded files.{R('mwb')} It needs a user to click a link or open a file, which is exactly what phishing is designed to achieve.",
        f"CISA added it to its Known Exploited Vulnerabilities catalogue on 13 October, the day of release, and set US federal agencies a deadline of 16 October.{R('kev')} No details of the attacks have been published.{R('swms')}",
        f"Microsoft recognised that volume is now a problem in itself. Alongside the release it published an approach called risk cohorts, grouping CVEs that need a similar assessment of the customer's environment. It noted that this \"may become more useful\" as AI-assisted research contributes to discovery, and that cohorts \"do not replace careful review of high-severity or actively exploited vulnerabilities\".{R('msrc')}",
        "The practical point is simple. No organisation can test 1,400 fixes one by one in a fortnight. The ones that coped in October were those that already knew which handful of CVEs mattered to them, and had a fast path for those."],
        "The October Patch Tuesday was a test of prioritisation, not of effort.", pull="Out of more than 1,400 fixes, one was already being used. Finding it fast was the whole job.")
    b.essay("The October wave", "Two emergencies in two days", [
        f"On 20 October the PHP security team gave advance notice of a critical release, and on 21 October it shipped PHP 8.5.12, 8.4.27, 8.3.36 and 8.2.35. The two flaws, CVE-2026-109618 and CVE-2026-109619, are rated 9.2 and can allow unauthenticated remote code execution. PHP's guidance was blunt: \"There are no complete mitigations, updating is the only safe choice.\"{R('php')}",
        f"The flaws sit in PHP itself, so a single unauthenticated request can reach them before any application code runs.{R('hns')} Wiz, which reported them in August, says they affect releases back to PHP 5.4.{R('wiz')} PHP 8.1 and older receive no official update.{R('php')}",
        f"The embargo did not hold. Amazon recorded an exploitation attempt on 17 October, and proof-of-concept exploits appeared in the early hours of release day. Its advice was to measure fixes for critical internet-facing flaws \"in hours, not days or weeks\".{R('aws')} Cloudflare pushed firewall rules to all customers, including free plans, about nine hours before disclosure, and described them as a stopgap.{R('cf')}",
        f"CISA added both CVEs to its exploited list on 26 October with a 29 October deadline.{R('kev')} Tenable reports that the release was brought forward a day after details leaked.{R('tenphp')}",
        f"On 20 October Oracle's quarterly update fixed CVE-2026-101767, a 9.8-rated unauthenticated SQL injection in E-Business Suite 12.2.3 to 12.2.15. Horizon3.ai, which reported it in July, says the vulnerable endpoint is allowed by the default configuration and the flaw can be chained to run commands on the server.{R('h3')} On 27 October Defused's decoys recorded exploratory attacks. Data at stake includes financial, payroll, HR and procurement records.{R('thn')}",
        f"At the time of writing CVE-2026-101767 is not on CISA's exploited list, and the reported activity is probing rather than confirmed compromise.{R('kev','swor')} But Oracle E-Business Suite has been here before: CVE-2025-61882 was exploited as a zero-day in a 2025 extortion campaign.{R('gtig')}"],
        "The October wave", pull="PHP2Shell was attacked before it was announced. The Oracle flaw was probed within a week of its fix.")
    b.figpage("How it works", "How an unauthenticated web flaw becomes a breach", "PHP2Shell and the Oracle EBS flaw differ in detail, but both follow the same short path from one web request to control of a server.", "query",
        [("A request nobody has to log in for", f"Both flaws are reachable without credentials. In PHP the bug is in the runtime itself; in Oracle EBS it is a servlet allowed by default.{R('hns','h3')}"),
         ("Code or SQL runs on the server", f"PHP2Shell can lead to remote code execution. The EBS flaw runs SQL as the APPS database user, then commands as the application account.{R('php','h3')}"),
         ("Data and access follow", f"An attacker can read or change business data, plant web shells and move on. Wiz also showed leaks of process memory, which can expose passwords and keys.{R('wiz')}"),
         ("Patching does not undo a compromise", f"The NCSC and Amazon both advise checking for compromise, looking back at least to the earliest known attack date, not just patching.{R('ncscphp','aws')}")], "The October wave")
    b.table("Side by side", "Three flaws, three timelines", "What each October flaw is, how exposed it was and what fixed it.", ["Flaw", "What it is", "Exploitation", "Fix and fallback"],
        [("Windows Shell<br>CVE-2026-96951", f"Mark of the Web bypass, rated 8.8, triggered by a click.{R('mwb')}", "Exploited before release. Listed by CISA on day one.", "October update. User awareness and email filtering help, but only partly."),
         ("PHP2Shell<br>CVE-2026-109618/9", f"Unauthenticated remote code execution in PHP, rated 9.2.{R('php')}", "Attempt seen four days before disclosure. Listed 26 October.", f"Upgrade to a fixed release. Firewall rules are a stopgap only.{R('cf')}"),
         ("Oracle EBS<br>CVE-2026-101767", f"Unauthenticated SQL injection, rated 9.8, chainable to code execution.{R('h3')}", "Probing from 27 October. Not yet on CISA's list.", "October update. Block the servlet and restrict the web tier meanwhile."),
         ("Common thread", "Reachable from the internet or by email.", "Days, not months.", "Patch first. Mitigate and hunt where you cannot.")], "The October wave", widths="34mm 1fr 1fr 1fr")

    # ---------- part 02
    b.mark("02", "The shrinking window")
    b.opener("02", "The shrinking<br>window.", "What the data really says about how fast attackers move, and where AI fits.", [("01", "The evidence on time to exploit"), ("02", "Old assumptions, new reality"), ("03", "AI on both sides")])
    b.essay("The shrinking window", "What the evidence says about speed", [
        f"Time to exploit is hard to measure, and different studies measure different things. Read together, they point the same way.",
        f"Mandiant's M-Trends 2026 estimates the mean time to exploit has fallen to about minus seven days, meaning exploitation is routinely starting before a patch is released. Exploits were the most common way into networks for the sixth year running, at 32% of intrusions.{R('mtr')} This is an average. It does not mean every flaw is attacked early.",
        f"VulnCheck counted 495 known exploited vulnerabilities in the first half of 2026. Of these, 23.43% showed exploitation on or before the day the CVE was published, slightly down from 28.93% in 2025. Over the same period the median time from CVE publication to evidence of exploitation fell from 120 days to 80.{R('vc')}",
        f"Rapid7's third-quarter data puts the average gap between disclosure and exploitation of high-severity flaws at about three days, with 71% of tracked exploitation in the first week. It also found 34 of 43 newly exploited serious flaws needed no login and no user action.{R('r7')}",
        f"Regulators have followed the data. In June CISA replaced its old directive with BOD 26-04, which ranks flaws on exposure, known exploitation, whether attacks can be automated and impact. The most urgent tier must be fixed in three days, with a forensic check for compromise.{R('bod')} The effect shows in the catalogue: most 2024 additions carried a 21-day deadline, while 29 of 36 October 2026 additions carried three days.{R('kev')}",
        f"The UK view is consistent. In 2025 the NCSC judged that the time between disclosure and exploitation \"has shrunk to days and AI will almost certainly reduce this further\".{R('ncscai')}"],
        "The shrinking window", pull="The question is no longer whether attackers will use a new flaw. It is whether you fix it first.")
    b.compare("Old assumptions", "What patching was built for, and what it faces now", "Most patch processes were designed for a slower threat. These are the assumptions that no longer hold.", ["Area", "The old assumption", "What the evidence shows now"],
        [("Timing", "Attackers need weeks to reverse-engineer a patch.", f"Average time to exploit is negative; attempts can precede disclosure.{R('mtr','aws')}"),
         ("Cadence", "A monthly cycle with a 14 to 30 day window is enough.", f"Exploited flaws now get three-day federal deadlines.{R('bod')}"),
         ("Volume", "A few dozen fixes a month can each be assessed.", f"Over 1,400 Microsoft CVEs in one month.{R('tenms')}"),
         ("Severity", "A CVSS score tells you what to fix first.", f"Exposure and active exploitation matter more.{R('r7','msrc')}"),
         ("Old systems", "Legacy software is low risk because it is old.", f"Old flaws keep being exploited. CISA listed 2015 and 2016 CVEs as exploited on 8 October 2026.{R('kev')}"),
         ("The embargo", "Coordinated disclosure gives defenders a head start.", f"Amazon: \"An embargo protects defenders only until someone else finds the same bug.\"{R('aws')}")], "The shrinking window")
    b.essay("The shrinking window", "AI on both sides of the patch", [
        f"AI is changing the supply of vulnerabilities. Microsoft says it is scanning Windows with AI and expects more fixes per release as a result, calling the volume \"evidence that defenders are getting better at identifying and addressing issues\".{R('win')} The exploited Windows Shell flaw itself was reported by researchers including an AI company.{R('swms')}",
        f"PHP2Shell is the clearest case yet. Wiz says it used frontier models in discovery, exploit development and patch validation, and that one researcher did in a week what would once have taken a top team months. Its conclusion: what used to be a barrier to exploitation \"is no longer a barrier\".{R('wiz')} CyberScoop reports that a second firm, Calif, found one flaw using an OpenAI model.{R('cs')}",
        f"The same capability works for attackers. Amazon says AI-assisted analysis \"makes it cheaper to turn a patch diff or advisory into a working exploit\", one reason more actors can exploit flaws within hours of disclosure.{R('aws')} Rapid7 found AI cited as an operational component in 8% of the threat reporting it tracked in the third quarter.{R('r7')}",
        f"The evidence is not one-sided. VulnCheck found that of 1,061 vulnerabilities attributed to AI-assisted discovery, only 14, or 1.3%, have been confirmed as exploited.{R('vc')} Mandiant did not consider 2025 the year breaches were the direct result of AI, and says most intrusions still stem from basic failures.{R('mtr')} No source we found confirms that attackers used AI to exploit PHP2Shell.",
        "Two conclusions follow. First, AI will keep raising the number of fixes organisations must handle, so prioritisation has to be automated and ruthless. Second, the cost of turning a fix into an exploit is falling, so the window between them will keep shrinking for the flaws that matter.",
        "Defenders can use the same tools: to summarise advisories, map them to the estate, draft change requests and check logs. The organisations that do will close the gap faster than those that only add people."],
        "The shrinking window", pull="AI is finding flaws faster than ever. The patch process has to move at the same speed.")
    b.grid("Why organisations fall behind", "Four reasons the gap stays open", "In our experience, organisations rarely fall behind because they do not care. They fall behind for structural reasons.",
        [("magnifier", "They do not know what they run", f"PHP hides inside appliances and other products. CISA and the NCSC both start with finding every copy.{R('cisaphp','ncscphp')}"),
         ("recycle", "Old software has no fix", f"PHP 8.1 and older get no official update. Researchers count far more servers on unsupported branches than supported ones.{R('php','cs')}"),
         ("loop", "The process is built for a month", "Change boards, test cycles and maintenance windows assume weeks. An exploited flaw does not wait for the next window."),
         ("owner", "Nobody owns the number", "Few boards see patch latency. Without a measure and an owner, urgent fixes compete with everything else.")], "The shrinking window",
        "The fix for all four is the same: a known estate, a fast lane for urgent flaws and a number someone is accountable for.")

    # ---------- part 03
    b.mark("03", "What it means for UK organisations")
    b.opener("03", "What it means<br>for the UK.", "The October wave reached UK public services directly. The lessons apply to every organisation.", [("01", "The UK picture"), ("02", "How to prioritise"), ("03", "Recommendations")])
    b.essay("UK organisations", "A wake-up call that reached Whitehall", [
        f"PHP2Shell was the first patch emergency of 2026 to visibly disrupt UK public services. On 22 October the technology minister told the House of Lords that \"32 government services are unavailable and four are partially unavailable\", largely as a result of precautionary measures, and that the government was not aware of any confirmed compromise of central government systems. Peers named several councils whose services were reported offline.{R('reg')}",
        f"The NCSC's guidance set a clear order: find every PHP installation, internet-facing first; update; apply temporary mitigations; take systems offline if mitigations are not possible in time; and check for compromise if you cannot do any of these. It also asked organisations to track suppliers whose products bundle PHP.{R('ncscphp')} The Register reports the NCSC issued 50,000 warnings to UK organisations.{R('reg')}",
        "Taking services offline was a reasonable precaution. It also showed how many organisations could not quickly say where PHP ran, which version it was, or who could patch it. That is an inventory problem before it is a patching problem.",
        f"For most UK organisations the reference point is Cyber Essentials. Version 3.3, in force from April 2026, requires critical and high-risk updates to be installed within 14 days of release and unsupported software to be removed or isolated.{R('ce')} That remains the baseline. For exploited, internet-facing flaws, October showed it is a ceiling, not a target.",
        f"The NCSC has also warned of a \"digital divide\" between systems that keep pace with AI-enabled threats and those that do not.{R('ncscai')} Smaller organisations relying on a managed service provider should check that their contract includes an emergency route, not just monthly patching.",
        "The good news is that the steps are well understood. Inventory, prioritise by exposure and exploitation, run an emergency process, handle legacy honestly, and measure the result."],
        "UK organisations", pull="Fourteen days is the Cyber Essentials floor. For an exploited, internet-facing flaw, it is far too long.")
    b.matrix("Prioritise", "Where to spend the first 72 hours", "Rank each new flaw by two questions: is it exploited, and can attackers reach it? Severity scores come third.", "Exposure to the internet", "Known exploitation",
        [("Fix within days", "Exploited, internal", "Exploited flaws inside the network, such as the Windows Shell bypass. Patch fast, starting with high-value users."),
         ("Act now", "Exploited and exposed", "Emergency process. Patch or mitigate within hours to days, take offline if needed, and check for compromise."),
         ("Normal cycle", "Not exploited, internal", "Routine monthly updates, tested in rings. Track them so they do not slip past 14 days."),
         ("Fix fast", "Not exploited, exposed", "Critical flaws on internet-facing systems, such as Oracle EBS before probing began. Treat as near-urgent.")], "UK organisations")
    b.steps("Recommendations", "Seven steps to close the gap", "Practical actions for IT leaders, in priority order.",
        [("Know what you run", f"Keep a live inventory of software and versions, including PHP inside appliances and bundled products.{R('cisaphp')}"),
         ("Prioritise by exploitation and exposure", f"Track CISA's exploited list and NCSC alerts daily. Exploited and internet-facing comes first.{R('bod')}"),
         ("Set patch targets in days", "Agree targets by risk tier: hours to days for exploited and exposed, 14 days at most for critical and high."),
         ("Build an emergency lane", "A pre-approved process to test, deploy, mitigate or isolate within hours, without waiting for the change board."),
         ("Retire or ring-fence legacy", f"Upgrade unsupported software, or isolate it. Cyber Essentials already requires this.{R('ce')}"),
         ("Hunt after you patch", f"Look back to the earliest known attack date for signs of compromise.{R('aws')}"),
         ("Measure and report latency", "Report time to patch exploited and critical flaws to the board every month.")], "UK organisations")
    b.questions("For the board", "Questions boards should ask now", "Use these to test whether patching is fast enough for the threat.",
        [("Exposure and speed", ["How long did it take us to patch PHP2Shell and the October Windows zero-day?", "Do we know every internet-facing system we run, and who owns each one?", "What is our target time for exploited, internet-facing flaws, and do we meet it?"]),
         ("Legacy and suppliers", ["Which systems run software that no longer gets security fixes, and what is the plan?", "Can our managed service provider patch outside the monthly cycle, and how fast?", "Did we check for compromise, not just apply the patch?"])], "UK organisations")
    b.glossary("Words worth knowing", [
        ("CVE", "Common Vulnerabilities and Exposures. A unique ID for a publicly known flaw."),
        ("CVSS", "A 0 to 10 severity score. Useful, but it does not say whether a flaw is being exploited."),
        ("KEV catalogue", "CISA's list of vulnerabilities known to be exploited, with federal fix deadlines."),
        ("Patch Tuesday", "Microsoft's monthly security release, on the second Tuesday of the month."),
        ("Critical Patch Update", "Oracle's quarterly security release."),
        ("Zero-day", "A flaw exploited before the vendor has released a fix."),
        ("Time to exploit", "The gap between a fix or disclosure and the first exploitation."),
        ("Embargo", "The period when a flaw is known privately but not yet public."),
        ("Mark of the Web", "A Windows tag on downloaded files that triggers security warnings."),
        ("SQL injection", "Tricking an application into running an attacker's database commands."),
        ("Compensating control", "A measure that reduces risk when a patch cannot be applied yet."),
        ("End of life", "Software that no longer receives security fixes from its maker.")])

    b.mark("", "Sources")
    b.sources([(str(n), SRC[k]) for k, n in sorted(order.items(), key=lambda kv: kv[1])],
              "Sources were accessed between 1 and 3 November 2026. CVE counts for Microsoft's October release vary by tracker. Exploitation status for the Oracle flaw was still developing at the time of writing.")
    b.rep_back("Close the gap<br>before attackers do.", "We help UK organisations build a live view of their estate, prioritise the flaws that matter and patch at the speed the threat now demands.", "Book a patch gap review", "Companion playbook: Close the Gap")
    return b
