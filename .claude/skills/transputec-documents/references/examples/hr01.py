from rkit import RBook, S


def build():
    b = RBook("The Edge Is the Breach", 1, "radar", "patch")
    order = {}
    def R(*n):
        for x in n: order.setdefault(x, len(order) + 1)
        return S(*sorted(order[x] for x in n))
    b.how = "An evidence-based look at FortiBleed and the October 2026 wave of edge-device attacks: what happened, how it works, why the edge is now the first target, and what UK organisations should do about it."
    b.rep_cover("Intelligence report · Edge-device security", "The edge<br>is the breach.",
        "FortiBleed, the Ivanti zero-days and a month of firewall and VPN attacks. What the evidence shows, and what UK organisations should do now.", "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("Attackers no longer need to break in. Increasingly, they log in through the firewall.", [
        f"On 6 October 2026 the FBI and the US Secret Service warned that FortiBleed, a credential-compromise campaign against internet-facing Fortinet FortiGate firewalls and SSL VPN gateways, was still active months after it was first exposed.{R(1)} The advisory cites SOCRadar's count of more than 86,644 compromised devices across 194 countries, and warns that some victims have been locked out of their own firewalls.{R(1,2)}",
        f"FortiBleed is not a new software flaw. Fortinet's own analysis is that attackers reused credentials from earlier incidents and brute-forced devices with weak passwords and no multi-factor authentication.{R(3)} The same month, Volexity found a previously unknown group chaining three zero-days to gain root on fully patched Ivanti Connect Secure VPN appliances, and US authorities flagged exploited flaws in Citrix NetScaler and Palo Alto Networks PAN-OS.{R(11,15,17)}",
        f"Two routes, one destination. Whether through stolen passwords or unpatched code, the device at the edge of the network is now where serious intrusions start. Verizon's 2026 breach report finds vulnerability exploitation is now the most common initial access vector, at 31% of breaches.{R(18)} The NCSC has been urging UK organisations to inventory, patch and replace their edge devices throughout 2026.{R(5,21)}",
        "This report sets out the evidence, explains the mechanics in plain terms, separates firm figures from preliminary ones and ends with practical recommendations for UK boards and IT leaders."],
        "Treat every firewall, VPN and gateway as a high-value system in its own right: inventoried, patched within days, protected by phishing-resistant MFA, managed off the internet, logged centrally and replaced before it goes out of support.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence tells us", [
        ("FortiBleed is a password problem at industrial scale.", f"Fortinet, CISA and the FBI all describe reused, leaked and cracked credentials, not a new vulnerability, as the root cause.{R(1,3,4)}"),
        ("The numbers are large but measure different things.", f"Counts range from about 74,000 devices with leaked credentials to 86,644 verified compromises; deeper analysis found far fewer confirmed network intrusions.{R(2,4,6)}"),
        ("Compromise does not end with a password reset.", f"Attackers create hidden admin accounts, harvest more credentials from traffic and, in some cases, lock out legitimate administrators.{R(1,8)}"),
        ("Access is being sold on to ransomware groups.", f"The FBI says brokers using FortiBleed access have supplied INC/Lynx and Payload ransomware affiliates.{R(1)}"),
        ("Patching alone did not protect Ivanti customers.", f"The Connect Secure chain worked against appliances that were fully up to date, and evaded Ivanti's own integrity checking tool.{R(11)}"),
        ("October was a pattern, not a one-off.", f"In the same month US authorities listed actively exploited flaws in Citrix NetScaler, Palo Alto PAN-OS and Cisco Secure Email Gateway.{R(15,17)}"),
        ("Organisations are patching more slowly, not faster.", f"Verizon found only 26% of known exploited vulnerabilities were fully fixed in 2025, with a median of 43 days to resolve.{R(18)}")])

    b.facts("FortiBleed and the edge, in six figures", "Each figure is sourced. Where sources measure different things, we say so in the analysis that follows.", [
        ("86,644", f"Fortinet devices SOCRadar says it verified as compromised, cited by the FBI and US Secret Service.{R(1,2)}"),
        ("194", f"Countries with affected devices. The NCSC reported some indications of potential UK impact.{R(1,5)}"),
        ("0", f"New Fortinet vulnerabilities involved. Fortinet says the campaign reuses credentials and brute force.{R(3)}"),
        ("3", f"Zero-days chained against fully patched Ivanti Connect Secure VPN appliances in October.{R(11,13)}"),
        ("31%", f"Share of breaches that began with vulnerability exploitation, now the top initial access vector.{R(18)}"),
        ("43 days", f"Median time for organisations to fully fix known exploited vulnerabilities in 2025, up from 32.{R(18)}")], "At a glance")

    b.timeline("From an exposed server to a federal warning", "Key dates, 2026. Exploitation dates are as reported by the researchers who observed them.", [
        ("February", "FortiBleed activity begins", f"SOCRadar says the campaign has been active since at least February 2026.{R(2)}"),
        ("16 June", "Campaign exposed", f"SOCRadar publishes its findings after the operators left their own back-end server open.{R(2,6)}"),
        ("18 June", "CISA and NCSC respond", f"Both agencies urge Fortinet customers to end sessions, reset passwords and enforce MFA.{R(4,5)}"),
        ("19 June", "Fortinet: no new flaw", f"Fortinet's PSIRT attributes the activity to credential reuse and brute force.{R(3)}"),
        ("27 August", "NCSC edge warning", f"The NCSC highlights disruptive activity against internet-exposed systems and edge devices.{R(21)}"),
        ("1 to 3 October", "Ivanti exploitation starts", f"Defused sees attempts from 1 October; Volexity observes the chain in use from 3 October.{R(11,13)}"),
        ("6 October", "FBI and USSS advisory", f"FortiBleed is still active, with reports of administrators locked out of their devices.{R(1)}"),
        ("13 to 14 October", "Ivanti fix, more KEV entries", f"Ivanti patches CVE-2026-104935; CISA lists exploited PAN-OS and Cisco flaws.{R(12,17)}"),
        ("29 to 30 October", "Chain fully patched", f"Ivanti fixes two further zero-days; CISA adds both to its exploited list.{R(13)}")])

    # PART 01
    b.mark("01", "The campaign")
    b.opener("01", "The<br>campaign.", "What FortiBleed is, how it works and how big it really is.", [("01", "A credential operation, not an exploit"), ("02", "How the attack chain works"), ("03", "Reading the numbers")])
    b.essay("The campaign", "A credential operation, not an exploit", [
        f"FortiBleed is the name researchers gave to an access-broker operation targeting Fortinet FortiGate firewalls and SSL VPN gateways. Its inner workings became visible only because the operators left their own back-end server open, exposing tooling, datasets and target lists.{R(1,6)}",
        f"The FBI describes a mature, multi-stage campaign. Attackers scanned the internet for exposed FortiGate portals, then tried credentials from earlier Fortinet leak dumps and infostealer logs. Password hashes taken from compromised devices were cracked on a rented GPU cluster, turning stored data into working passwords.{R(1)}",
        f"Fortinet has been clear that this is not a new vulnerability. Its PSIRT says the actors are reusing credentials from previous incidents and brute-forcing devices with weak password hygiene and no MFA.{R(3)} The FBI adds that legacy SHA-256 password storage made cracking easier, which is why it recommends the stronger PBKDF2 method on supported FortiOS versions.{R(1)}",
        f"That distinction matters. A patch cannot fix a password that has already leaked. Huntress researchers noted that attackers often logged in on the first attempt, so no failed-login alerts fired.{R(9)} To the device, the intruder looked like an administrator.",
        f"Once inside, the operators created new administrator accounts, enumerated Active Directory and sprayed passwords to find privileged users.{R(1)} Some victims found original accounts deleted or changed, locking them out of their own firewalls, which means recovery can take more than patching and password resets.{R(1,10)} The end product was access, packaged and sold: the FBI says brokers using the chain supplied INC/Lynx and Payload ransomware affiliates.{R(1)}",
        f"Attribution remains unsettled. Reporting has linked the operators to Russian-speaking actors, but CloudSEK found mixed-language artefacts and called the origin unresolved.{R(6,7)} We do not attribute the campaign to any state."],
        "The campaign", "A patch cannot fix a password that has already leaked.")
    b.figpage("How it works", "Four stages from scan to sale", "The FortiBleed chain, as described by the FBI and researchers who examined the operators' own server.", "router", [
        ("Find the door", f"Automated scans locate internet-facing FortiGate SSL VPN portals and exposed management interfaces.{R(1)}"),
        ("Try the keys", f"Credential stuffing and password spraying use leaked passwords and infostealer logs. Hashes from configuration exports are cracked offline on rented GPUs.{R(1,6)}"),
        ("Move in quietly", f"New admin accounts give persistence. On some networks, sniffers captured further authentication traffic for cracking.{R(1,6)}"),
        ("Sell the access", f"Validated targets are ranked by revenue and sold on, including to ransomware affiliates.{R(1)}")], "The campaign")
    b.table("Reading the numbers", "What each headline figure actually counts", "Figures for FortiBleed differ because they measure different things. None should be read as a count of breached organisations.", ["Figure", "Source", "What it measures"], [
        ("86,644", f"SOCRadar, cited by FBI and USSS{R(1,2)}", "Devices SOCRadar says it verified as compromised; it stresses this is not an exposure estimate."),
        ("About 74,000", f"CISA alert, June 2026{R(4)}", "Fortinet devices associated with the leaked credentials."),
        ("73,932", f"Hudson Rock, via The Hacker News{R(7)}", "Unique firewall URLs targeted, across 194 countries."),
        ("21,632", f"Hudson Rock; CloudSEK analysis{R(6,7)}", "Reported as affected domains; CloudSEK says these are Kerberos realm groupings, not companies."),
        ("148", f"CloudSEK{R(6)}", "Cases where it could confirm cracked Active Directory credentials. A floor, not a ceiling."),
        ("UK count", f"NCSC{R(5)}", "Not published. The NCSC reported some indications of potential impact in the UK.")], "The campaign", "30mm 50mm 1fr")

    # PART 02
    b.mark("02", "The pattern")
    b.opener("02", "The<br>pattern.", "FortiBleed was one of several edge-device attacks in October 2026. Together they show why attackers start at the edge.", [("01", "A month of edge attacks"), ("02", "Why the edge is the target"), ("03", "What most organisations get wrong")])
    b.essay("The pattern", "October: the month the edge gave way", [
        f"FortiBleed did not happen in isolation. In the first week of October, Volexity was investigating a customer incident and found a previously unknown actor, which it tracks as UTA0576, compromising an Ivanti Connect Secure VPN appliance that was fully patched at the time.{R(11)}",
        f"The attacker chained three flaws to gain root-level code execution without logging in. It deployed no malware and no web shell. Instead it re-ran the exploit for every command and deleted log entries, and Ivanti's Integrity Checker Tool did not detect the changes.{R(11)} The goal appeared to be credentials: service account passwords, local administrator passwords and BitLocker recovery keys.{R(11)}",
        f"Ivanti patched the first flaw, CVE-2026-104935, on 13 October and said a limited number of customers were affected.{R(12)} On 29 October it added CVE-2026-111357 and CVE-2026-118527 to the advisory, with fixed releases 25.1.1.3 and 22.8R2.6. Customers who had already patched once had to upgrade again, and CISA set US federal agencies deadlines of 2 and 13 November.{R(13,14)}",
        f"Other vendors were in the same position. CISA listed an exploited Citrix NetScaler flaw on 4 October, and on 14 October added a Palo Alto Networks PAN-OS management interface flaw and a Cisco Secure Email Gateway flaw, giving US federal agencies three days to fix them.{R(15,17)} Each vendor issued fixes or guidance; Palo Alto described exploitation as very limited.{R(17)}",
        f"The UK has seen the same pattern. In July the NCSC and 17 partner agencies warned that a unit of Russia's FSB was targeting routers with weak SNMP settings and known Cisco flaws.{R(22)} In August the NCSC warned of a wider pattern of disruptive activity against internet-exposed systems and edge devices.{R(21)}",
        "Different vendors, different flaws, different actors. The common factor is location: every one of these devices sits on the boundary, reachable from the internet and trusted by the network behind it."],
        "The pattern", "Different vendors, different flaws, different actors. The common factor is location.")
    b.table("October 2026", "Edge-device incidents in a single month", "A selection of edge-device issues with confirmed or reported exploitation. Vendors issued fixes or guidance in each case.", ["Product", "Issue", "Status"], [
        ("Fortinet FortiGate", f"FortiBleed credential campaign; lockouts and resale of access.{R(1)}", f"No new flaw. Reset, MFA, PBKDF2, restrict management.{R(3)}"),
        ("Ivanti Connect Secure", f"Three chained zero-days giving unauthenticated root.{R(11,13)}", f"Fixed in 25.1.1.3 and 22.8R2.6.{R(13)}"),
        ("Citrix NetScaler", f"CVE-2026-88779, memory flaw in SAML configurations, used for denial of service.{R(15,16)}", f"Fixed releases and IOC script available.{R(16)}"),
        ("Palo Alto PAN-OS", f"CVE-2026-0322, management interface code execution as root.{R(17)}", f"Fixed releases; restrict management access.{R(17)}"),
        ("Cisco Secure Email Gateway", f"CVE-2026-76519, crafted attachment leading to root.{R(17)}", f"Updated scanner tools fix it without restart.{R(17)}")], "The pattern", "38mm 1fr 1fr")
    b.essay("Why the edge", "Why attackers start at the edge", [
        f"Edge devices are the most valuable and the least watched systems most organisations own. A firewall or VPN gateway is, by design, reachable from the internet. It holds credentials, sees authentication traffic and is trusted by everything behind it. Compromise one, and the attacker is already past the front door.{R(1,11)}",
        f"They are also hard to see into. Many appliances cannot run the endpoint detection tools that protect laptops and servers. The Ivanti intrusion was found by network monitoring, not on the device, and it evaded the vendor's integrity checker.{R(11)} In 2025 the NCSC and Five Eyes partners published guidance asking manufacturers to build in better logging and forensic visibility for exactly this reason.{R(23)}",
        f"Patching is slower than the threat. Verizon's 2026 report found only 26% of known exploited vulnerabilities were fully remediated, and the median time to fix rose to 43 days.{R(18)} A year earlier, Verizon had reported that edge devices and VPNs made up 22% of vulnerability exploitation actions, up from 3%.{R(19)} Network assets such as VPNs, firewalls and routers rose to 5% of breaches where the asset was known, partly because of a change in how Verizon codes remote access cases.{R(18)}",
        f"Smaller organisations feel it most. Among SMB ransomware cases, Verizon found compromised credentials in 38% and unpatched edge devices in 29%.{R(18)} These attacks are opportunistic: scanners find whatever is exposed.",
        f"Finally, edge devices age quietly. A firewall that works is rarely replaced until it fails, and end-of-life kit gets no fixes at all. The NCSC's advice to retire end-of-life equipment is aimed squarely at this.{R(21)}",
        "None of this is a criticism of any one vendor. Every major edge vendor has issued urgent fixes in the past year. It is a structural problem: the boundary is exposed by design, and attackers have industrialised the work of finding the weak ones."],
        "Why the edge", "The boundary is exposed by design, and attackers have industrialised finding the weak ones.")
    b.compare("Common mistakes", "What most organisations get wrong", "The gap is rarely technology. It is ownership, visibility and follow-through.", ["Area", "What often happens", "What good looks like"], [
        ("Inventory", "Nobody holds a complete list of internet-facing devices and services.", "A maintained inventory, checked against an external scan such as NCSC Early Warning."),
        ("Management access", "Admin interfaces reachable from the internet for convenience.", "Management only from a trusted internal network or jump host."),
        ("Credentials", "Shared or old admin passwords, MFA on staff VPN only.", "Unique admin accounts, phishing-resistant MFA everywhere, regular rotation."),
        ("Patching", "Edge updates wait for the next maintenance window.", "Exploited edge flaws fixed within days, then checked for compromise."),
        ("After an incident", "Reset passwords and move on.", "Collect evidence, factory reset, rebuild and hunt for onward access."),
        ("Lifecycle", "Kit runs until it fails, sometimes years past support.", "Replacement planned and budgeted before end of support.")], "The pattern")

    # PART 03
    b.mark("03", "What UK organisations should do")
    b.opener("03", "What to<br>do now.", "What the evidence means for UK organisations, and the steps that close the gap.", [("01", "What it means for the UK"), ("02", "Recommendations"), ("03", "Questions for the board")])
    b.essay("UK relevance", "What it means for UK organisations", [
        f"The NCSC issued its own FortiBleed advice on 18 June 2026, noting some indications of potential impact in the UK.{R(5)} UK press reporting on the leaked dataset said it appeared to include logins linked to government departments, councils and NHS organisations, though that reporting was based on the alleged dataset, not confirmed breaches.{R(24)}",
        f"The NCSC's guidance goes further than a password reset. It tells organisations to confirm every Fortinet device is theirs, check for unauthorised accounts, isolate any compromised device, report the incident, collect logs and then factory reset, because changing credentials alone may not remove an attacker.{R(5)} It also asks organisations to check other edge devices that share the same credentials.{R(5)}",
        f"The wider message from the NCSC is consistent. Its August notice asks every organisation to keep an accurate inventory of internet-facing systems, understand what each edge device does, apply updates promptly, retire end-of-life equipment and monitor for unexpected configuration changes.{R(21)}",
        f"The NCSC's Annual Review, published on 3 November 2026, records 80 nationally significant incidents in the year to August, and says many state-linked incidents involved vulnerabilities for which patches were available but had not been deployed quickly enough.{R(20)}",
        f"For UK organisations, free help exists. The NCSC Early Warning service alerts registered organisations to exposed vulnerabilities and signs of compromise.{R(26)} Cyber Essentials covers firewalls, secure configuration and patching as a baseline, and the NCSC's zero trust principles describe how to reduce reliance on the network boundary.{R(21,25)}",
        "The practical test is simple. Could you list every device you expose to the internet today, who manages it, what version it runs and when it goes out of support? If not, that is the first job."],
        "UK relevance", "Could you list every device you expose to the internet today? If not, that is the first job.")
    b.grid("UK guidance", "The NCSC resources that matter most", "Free, authoritative and directly relevant to edge-device risk.", [
        ("bell", "Early Warning", f"Free alerts about exposed vulnerabilities and possible compromise affecting your registered assets.{R(26)}"),
        ("magnifier", "FortiBleed advice", f"Step-by-step checks, isolation, factory reset and hardening for Fortinet devices.{R(5)}"),
        ("shield", "Edge device notice", f"Inventory, patch, retire end-of-life kit and monitor configuration changes.{R(21)}"),
        ("compass", "Zero trust principles", f"Design guidance for authenticating every request, not trusting the network.{R(25)}")], "What to do",
        "Register for Early Warning this week. It costs nothing and tells you what attackers can already see.")
    b.steps("Recommendations", "Seven steps for UK organisations", "In priority order. The first four can start this week.", [
        ("Inventory the edge", f"List every firewall, VPN and gateway with owner, version and support date. Compare with an external view.{R(21,26)}"),
        ("Take management off the internet", f"Admin access from trusted hosts only. Remove internet administration where possible.{R(1,3)}"),
        ("Reset and harden credentials", f"End sessions, reset admin and VPN passwords, remove unknown accounts and API keys.{R(1,8)}"),
        ("Enforce phishing-resistant MFA", f"On every VPN and admin login, including service accounts.{R(1,5)}"),
        ("Patch exploited edge flaws in days", f"Track advisories and the KEV catalog, then verify and check for compromise.{R(13,18)}"),
        ("Log centrally and watch", f"Send logs off the device and alert on new accounts or changes.{R(1,21)}"),
        ("Plan for the bad day, and shrink the edge", f"Keep offline admin access and a tested rebuild. Retire end-of-life kit and move users to zero trust access.{R(5,8,21,25)}")], "What to do")
    b.questions("For the board", "Questions boards should ask this quarter", "Answers should be specific, dated and owned.", [
        ("Exposure", ["How many internet-facing devices do we have, and who owns each one?", "Are any management interfaces reachable from the internet today?", "Which edge devices go out of support in the next 18 months?"]),
        ("Response", ["How quickly did we apply the last critical edge-device fix, and did we check for compromise?", "If our firewall locked us out tomorrow, how would we regain control?", "Do our suppliers and managed service providers meet the same standard?"])], "What to do")
    b.glossary("Terms used in this report", [
        ("Edge device", "Hardware or software at the network boundary, such as a firewall, VPN gateway, router or email gateway."),
        ("SSL VPN", "A remote access service that lets staff connect to the internal network through a web browser or client."),
        ("Credential stuffing", "Trying usernames and passwords leaked from other breaches against a login page."),
        ("Password spraying", "Trying a few common passwords against many accounts to avoid lockouts."),
        ("Infostealer", "Malware that steals saved passwords and session cookies from infected computers."),
        ("PBKDF2", "A password storage method designed to make cracking stolen hashes slow and costly."),
        ("Initial access broker", "A criminal who breaks into networks and sells that access to others, often ransomware groups."),
        ("Zero-day", "A flaw exploited before the vendor has a fix available."),
        ("KEV catalog", "CISA's Known Exploited Vulnerabilities list, a useful priority signal for patching."),
        ("Zero trust", "An approach that authenticates every request rather than trusting anything inside the network.")])

    b.mark("", "Sources")
    src = [
        "FBI and US Secret Service, Joint Cybersecurity Advisory JCSA-20261006-01: FortiBleed Operations Continue Targeting Exposed Systems Leading to Reports of Lockouts, 6 October 2026, https://www.ic3.gov/CSA/2026/261006.pdf",
        "SOCRadar, FortiBleed: Fortinet firewalls compromised, 16 June 2026 (updated 3 September 2026), https://socradar.io/blog/fortibleed-fortinet-firewalls-compromised/",
        "Fortinet PSIRT, Analysis of Reported Credential Compromise of FortiGate Devices, 19 June 2026, https://www.fortinet.com/blog/psirt-blogs/analysis-of-reported-credential-compromise-of-fortigate-devices",
        "CISA, CISA Urges Hardening Fortinet Devices After Reports of Credential Exposure, 18 June 2026 (revised 22 June 2026), https://www.cisa.gov/news-events/alerts/2026/06/18/cisa-urges-hardening-fortinet-devices-after-reports-credential-exposure",
        "NCSC, Advice following global targeting of Fortinet firewalls and VPN gateways, 18 June 2026, https://www.ncsc.gov.uk/news/advice-following-global-targeting-of-fortinet-firewalls-and-vpn-gateways",
        "CloudSEK, Inside the FortiBleed open directory: a technical analysis of what the attacker left behind, 19 June 2026, https://www.cloudsek.com/blog/inside-the-fortibleed-open-directory-a-technical-analysis-of-what-the-attacker-left-behind",
        "The Hacker News, Attackers exploit three Fortinet flaws (includes FortiBleed disclosure, Hudson Rock figures and Fortinet response), 16 June 2026, https://thehackernews.com/2026/06/attackers-exploit-three-fortinet.html",
        "SOCRadar, FortiBleed still active, locking organisations out, 7 October 2026, https://socradar.io/blog/fortibleed-still-active-locking-organizations-out/",
        "The Hacker News, FBI Warns FortiBleed Remains Active After Amassing 86,644 Fortinet Device Credentials, 7 October 2026, https://thehackernews.com/2026/10/fbi-warns-fortibleed-remains-active.html",
        "Help Net Security, FortiBleed is still active, with attackers locking admins out of Fortinet firewalls, 7 October 2026, https://www.helpnetsecurity.com/2026/10/07/fortinet-fortibleed-campaign-fbi-advisory/",
        "Volexity, A Series of Unauthenticated Events: Chained Exploitation of Ivanti Connect Secure Zero-Days, 13 October 2026, https://www.volexity.com/blog/2026/10/13/a-series-of-unauthenticated-events-chained-exploitation-of-ivanti-connect-secure-zero-days/",
        "The Register, Ivanti patches Connect Secure zero-day after researchers confirm in-the-wild attacks, 14 October 2026, https://www.theregister.com/security/2026/10/14/ivanti-patches-connect-secure-zero-day-after-researchers-confirm-in-the-wild-attacks/5303095",
        "SecurityWeek, Ivanti Patches Two More Zero-Days Exploited in Connect Secure Attack Chain, 2 November 2026, https://www.securityweek.com/ivanti-patches-two-more-zero-days-exploited-in-connect-secure-attack-chain/",
        "Help Net Security, CISA to federal agencies: Remediate exploited Ivanti Connect Secure vulnerabilities (CVE-2026-111357, CVE-2026-118527), 2 November 2026, https://www.helpnetsecurity.com/2026/11/02/cisa-to-federal-agencies-remediate-exploited-ivanti-connect-secure-vulnerabilities-cve-2026-111357-cve-2026-118527/",
        "CISA, CISA Adds One Known Exploited Vulnerability to Catalog (CVE-2026-88779, Citrix NetScaler), 4 October 2026, https://www.cisa.gov/news-events/alerts/2026/10/04/cisa-adds-one-known-exploited-vulnerability-catalog",
        "Help Net Security, CISA flags new exploited NetScaler flaw as attackers crash appliances (CVE-2026-88779), 5 October 2026, https://www.helpnetsecurity.com/2026/10/05/cisa-flags-new-exploited-netscaler-flaw-as-attackers-crash-appliances-cve-2026-88779/",
        "Help Net Security, CISA flags exploited flaws in Palo Alto, Cisco and Ahsay products, 15 October 2026, https://www.helpnetsecurity.com/?p=388051",
        "Verizon, 2026 Data Breach Investigations Report, 2026, https://www.verizon.com/business/resources/T343/reports/2026-dbir-data-breach-investigations-report.pdf",
        "SecurityWeek, Verizon DBIR Flags Major Patch Delays on VPNs, Edge Appliances (2025 DBIR), 24 April 2025, https://www.securityweek.com/verizon-dbir-flags-major-patch-delays-on-vpns-edge-appliances/",
        "NCSC, Annual Review 2026: Incident management, 3 November 2026, https://www.ncsc.gov.uk/collection/annual-review-2026/understanding-threat/incident-management",
        "NCSC, Disruptive cyber activity highlights risk from internet-exposed systems and edge devices, 27 August 2026, https://www.ncsc.gov.uk/news/disruptive-cyber-activity-highlights-risk-from-internet-exposed-systems-and-edge-devices",
        "NCSC, UK and allies urge critical sectors to improve defences against Russian intelligence targeting, 13 July 2026, https://www.ncsc.gov.uk/news/uk-and-allies-urge-critical-sectors-to-improve-defences-against-russian-intelligence-targeting",
        "NCSC, Cyber agencies unveil new guidelines to secure edge devices from increasing threat, 4 February 2025, https://www.ncsc.gov.uk/news/cyber-agencies-unveil-new-guidelines-to-secure-edge-devices-from-increasing-threat",
        "Insurance Business UK, Russian hackers expose UK government logins in FortiBleed credential breach (reporting The Telegraph), 6 July 2026, https://www.insurancebusinessmag.com/uk/news/cyber/russian-hackers-expose-uk-government-logins-in-fortibleed-credential-breach-581332.aspx",
        "NCSC, Zero trust architecture design principles, reviewed 16 January 2026, https://www.ncsc.gov.uk/collection/zero-trust-architecture",
        "NCSC, Early Warning service, accessed November 2026, https://www.ncsc.gov.uk/section/active-cyber-defence/early-warning",
    ]
    assert len(order) == len(src), (sorted(order), len(src))
    items = sorted(((order[i+1], t) for i, t in enumerate(src)))
    items = [(f"{n:02d}", t) for n, t in items]
    b.sources(items[:13])
    b.sources(items[13:], "Sources continued. Secondary reporting is used only where it adds detail.")
    b.rep_back("Is your front door<br>really locked?", "Transputec helps UK organisations find every exposed device, harden firewalls and VPNs, monitor them around the clock and respond fast when something goes wrong.", "Book an edge security review",
        "Companion playbook: Lock the front door. A practical guide to securing firewalls, VPNs and other internet-facing devices.")
    return b
