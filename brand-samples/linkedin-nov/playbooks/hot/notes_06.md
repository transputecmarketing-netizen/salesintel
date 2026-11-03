# Notes 06: the patch gap (researched 3 Nov 2026)

## Microsoft October 2026 Patch Tuesday (13 Oct 2026)
- Counts differ by method: Tenable 1,407 CVEs (69 Critical, 1,337 Important, 1 Low; EoP 47.9%, RCE 22.3%; second consecutive record month) https://www.tenable.com/blog/microsofts-october-2026-patch-tuesday-addresses-1407-cves-cve-2026-96951
- SecurityWeek 1,413 (1,102 Windows, 134 Office, 61 dev tools, 36 SharePoint); says October alone exceeded MS total for all of 2025; YTD > 4,000. CISA added CVE-2026-96951 to KEV on 13 Oct, due 16 Oct. Reported by Fujitsu, Anthropic and an independent expert. Publicly disclosed: CVE-2026-108398 (.NET WDAC bypass), CVE-2026-92707 (MessagePack DoS). MS introduced "risk cohorts". https://www.securityweek.com/microsoft-patches-record-1413-vulnerabilities-including-exploited-windows-zero-day/
- BleepingComputer counted 1,411 (headline only, page 403).
- Malwarebytes: CVE-2026-96951 CVSS 8.8 Windows Shell SFB, bypasses Mark of the Web, needs user to click link/open attachment. https://www.malwarebytes.com/blog/bugs/2026/10/update-windows-record-patch-tuesday-fixes-flaw-already-under-attack
- MSRC blog 13 Oct: risk cohorts, 15 illustrative cohorts; "As AI-assisted research contributes to vulnerability discovery, this kind of approach may become more useful"; cohorts "do not replace careful review of high-severity or actively exploited vulnerabilities". https://www.microsoft.com/en-us/msrc/blog/2026/10/using-risk-cohorts-to-prioritize-security-updates
- September 2026: 974 CVEs, record at the time, two exploited zero-days. https://www.securityweek.com/microsoft-patches-record-974-vulnerabilities-including-two-exploited-zero-days/
- Windows Experience Blog 9 Jul 2026: "customers will see a higher volume of security updates"; "stay current and take security updates as soon as possible"; move "from a time-based patching cadence to a more continuous, risk-based approach"; hotpatch via Autopatch/Intune, Azure Arc for servers. https://blogs.windows.com/windowsexperience/2026/07/09/evolving-windows-vulnerability-management-to-meet-the-speed-of-ai-powered-discovery/

## PHP2Shell (CVE-2026-109618, CVE-2026-109619)
- php.net: 20 Oct advance notice, release scheduled 21 Oct 14:00 UTC, both CVSS v4 9.2. 21 Oct: PHP 8.5.12, 8.4.27, 8.3.36, 8.2.35; "There are no complete mitigations, updating is the only safe choice"; PHP 8.1 and older receive no updates. 8.2 EOL 31 Dec 2026. https://www.php.net/ ; https://www.php.net/supported-versions.php
- Wiz 21 Oct: discovered 19 Aug, reported to PHP 24 Aug; affects back to 5.4; used Wiz Atlas, Gemini 4 Argon, GPT-5.6 Sol; one researcher, a week, previously months; "With AI this is no longer a barrier." https://www.wiz.io/blog/php2shell-php-rce
- AWS 21 Oct: MadPot attempt 17 Oct (4 days before disclosure); PoCs from ~02:00 UTC 21 Oct; "AI-assisted analysis makes it cheaper to turn a patch diff or advisory into a working exploit"; measure timelines for critical internet-facing vulns "in hours"; unknown whether early attempts would succeed. https://aws.amazon.com/blogs/security/amazon-threat-intelligence-identifies-php2shell-exploitation-prior-to-public-disclosure-in-madpot/
- Cloudflare 21 Oct: WAF rules from 03:02 UTC 21 Oct, ~9 hours before disclosure; free plans included; stopgap. https://blog.cloudflare.com/php-vulnerabilities-waf-protection/
- CISA alert 21 Oct (rev 26 Oct): inventory incl bundled PHP; patch internet-facing first; if cannot patch or on 8.1 or older, take offline; KEV added 26 Oct. https://www.cisa.gov/news-events/alerts/2026/10/21/critical-vulnerabilities-php-require-immediate-patching
- KEV JSON (catalogue 2026.10.30): PHP CVEs added 26 Oct due 29 Oct.
- NCSC 21 Oct: all versions may be affected; find all PHP, internet-facing first; mitigations; offline; check for compromise; track vendors bundling PHP. https://www.ncsc.gov.uk/news/critical-security-issue-affecting-php
- The Register 22 Oct: minister in Lords "32 government services are unavailable and four are partially unavailable", "largely ... precautionary"; NCSC sent 50,000 warnings; no confirmed compromise of central gov. https://www.theregister.com/security/2026/10/22/php2shell-puts-dozens-of-uk-government-services-out-of-service/5304840
- Tenable FAQ: release moved from 22 to 21 Oct after leak; Trail of Bits working exploits 26 Oct; KEV due 29 Oct. https://www.tenable.com/blog/php2shell-cve-2026-109618-cve-2026-109619-frequently-asked-questions-about-critical-php-remote
- CyberScoop 21 Oct: Calif found using OpenAI GPT-5.6 Sol; >1.3m exposed hosts estimate; VirusTotal ~758,000 version-disclosing servers on unsupported 5.4-8.1 vs 272,000 supported. https://cyberscoop.com/php-emergency-patches-php2shell-vulnerabilities/
- Help Net Security 21 Oct: mod_php highest risk; single unauthenticated request before app code runs. https://www.helpnetsecurity.com/2026/10/21/php2shell-php-vulnerabilities-patched-cve-2026-109618-cve-2026-109619/

## Oracle EBS CVE-2026-101767
- Horizon3: CVSS 9.8, unauth SQLi in TCF servlet /OA_HTML/AppsTCFServer, permitted by default URL firewall; EBS 12.2.3-12.2.15; reported 24 Jul; fixed in CPU 20 Oct; mitigations: remove servlet from allowlist, restrict web tier, monitor. https://horizon3.ai/attack-research/vulnerabilities/cve-2026-101767/
- Waratek: Oct 2026 CPU 1,295 patches; EBS 194, 31 remotely exploitable without auth; CVE-2026-101809 CVSS 10. https://waratek.com/news/oracle-releases-the-october-2026-critical-patch-update/
- THN / SecurityWeek 28 Oct: Defused decoys recorded exploratory exploits 27 Oct. Data at risk: financial, payroll, HR, procurement.
- Not in KEV as of catalogue 2026.10.30 (checked JSON).
- Cyber Daily 30 Oct: >670 internet-exposed EBS instances per researchers.
- Earlier: CVE-2025-61882 exploited as zero-day as early as 9 Aug 2025 (GTIG); KEV known ransomware use. CVE-2026-46817 KEV 15 Jul 2026.

## Time to exploit
- M-Trends 2026 (23 Mar 2026): mean TTE "an estimated -7 days"; exploits 32% of intrusions, top vector 6th year; "we do not consider 2025 to be the year where breaches were the direct result of AI". https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026
- VulnCheck 1H 2026 (28 Jul): 495 KEVs; 23.43% exploited on or before CVE publication day (28.93% in 2025); median CVE to KEV 80 days (120 in 2025); 14 of 1,061 AI-attributed vulns (1.3%) exploited. https://www.vulncheck.com/blog/state-of-exploitation-1h-2026
- Rapid7 Q3 2026 (21 Oct): avg ~3 days disclosure to exploitation of high-severity; 71% within 7 days; 34 of 43 needed no auth or user interaction; 8% of threat reporting cited AI. https://www.rapid7.com/blog/post/tr-q3-2026-threat-update-attackers-exploiting-vulnerabilities-within-3-days/
- CISA BOD 26-04 (10 Jun 2026): revokes BOD 22-01 and 19-02; four questions (exposure, KEV, exploit automation, technical impact); three-day timeline with forensic triage at top tier. https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk
- My analysis of KEV JSON: 282 additions in 2026 to 30 Oct vs 245 in 2025; Oct 2026 36 additions, 29 with 3-day due date, 7 with 14-day; 2024: 175 of 186 had 21-day; 8 Oct 2026 additions include CVE-2015-5477, CVE-2016-3081, CVE-2015-3306.
- NCSC (7 May 2025) Impact of AI on cyber threat to 2027: "The time between disclosure and exploitation has shrunk to days and AI will almost certainly reduce this further"; digital divide. https://www.ncsc.gov.uk/report/impact-ai-cyber-threat-now-2027
- Cyber Essentials v3.3 (April 2026): critical/high (CVSS 7+) within 14 days; unsupported software removed or isolated. https://www.ncsc.gov.uk/files/cyber-essentials-requirements-for-it-infrastructure-v3-3.pdf

## Left out (not verified)
- BleepingComputer 1,411 detail; MSRC release-notes count of 1,474; Shadowserver EBS figure detail; Sophos retraction; attacker use of AI to exploit PHP2Shell specifically (no confirmation); exact NCSC 50,000 wording from NCSC itself (via The Register only).
