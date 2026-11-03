# Notes 01: FortiBleed and October 2026 edge-device attacks (verified 3 Nov 2026)

## FortiBleed
- FBI + USSS joint CSA JCSA-20261006-01, "FortiBleed Operations Continue Targeting Exposed Systems Leading to Reports of Lockouts", 6 Oct 2026, TLP:CLEAR. https://www.ic3.gov/CSA/2026/261006.pdf
  - "active, global credential-compromise campaign" vs internet-facing FortiGate firewalls and SSL VPN gateways; SOCRadar verified >86,644 compromised devices across 194 countries.
  - Exploits reused/leaked credentials and legacy SHA-256 password storage. Attackers continue to scan with previously obtained creds.
  - Chain: scan for SSL VPN portals; credential stuffing + password spraying from prior Fortinet leak dumps and infostealer logs; hashes dumped and cracked on rented GPU cluster (Hashcat, Hashtopolis); filter honeypots, rank by revenue; create new admin accounts; AD enumeration, spraying; sell access (initial access broker).
  - Lockout: delete or change passwords of original accounts (T1531). Remediation beyond patching and password resets.
  - IABs supplied INC/Lynx and Payload ransomware affiliates.
  - Mitigations: restrict external management (trusted hosts good, local-in policy better, remove internet admin best); terminate sessions and reset creds; phishing-resistant MFA; validate config vs known good; review logs; PBKDF2 (FortiOS 7.2.11+); review REST API keys; SSH may have been exploited if open. IR: isolate, hunt, report, CISA Eviction Strategies Tool, harden.
- SOCRadar first blog 16 Jun 2026 (upd 3 Sep): active since at least Feb 2026; 86,644; 80,000+ IPs; 22,405 domains; telecom most hit; generic admin + system accounts majority. https://socradar.io/blog/fortibleed-fortinet-firewalls-compromised/
- SOCRadar 7 Oct 2026: count is confirmed compromised, not exposure; out-of-band recovery; rogue API key survives password reset. https://socradar.io/blog/fortibleed-still-active-locking-organizations-out/
- Fortinet PSIRT (Carl Windsor) 19 Jun 2026: "This is not a new Fortinet vulnerability"; reuse of creds from earlier incidents + brute force vs weak hygiene, no MFA. Recs: terminate sessions, reset, MFA, upgrade to 7.4/7.6/8.0 for PBKDF2, review config, logs, restrict management. https://www.fortinet.com/blog/psirt-blogs/analysis-of-reported-credential-compromise-of-fortigate-devices
- CISA 18 Jun 2026 (rev 22 Jun): ~74,000 devices associated with leaked creds. https://www.cisa.gov/news-events/alerts/2026/06/18/cisa-urges-hardening-fortinet-devices-after-reports-credential-exposure
- NCSC 18 Jun 2026 (mod 22 Jun): "some indications of potential impact in the UK"; check domains with SOCRadar/Hudson Rock checkers; factory reset after collecting artefacts; check other edge devices sharing creds; harden. https://www.ncsc.gov.uk/news/advice-following-global-targeting-of-fortinet-firewalls-and-vpn-gateways
- CloudSEK 19 Jun 2026: open directory, 319 files; Hashtopolis on 36 rented GPUs (article also says ~45); hashes from config exports from exposed mgmt interfaces; 21,632 "domains" are Kerberos realm groupings; only 148 confirmed AD compromises; dataset includes non-Fortinet devices; Russian-language artefacts but origin unresolved. https://www.cloudsek.com/blog/inside-the-fortibleed-open-directory-a-technical-analysis-of-what-the-attacker-left-behind
- THN 16 Jun 2026: Hudson Rock 73,932 firewall URLs, 194 countries; Diachenko 1.16bn attempts vs 320,777 FortiGate targets; Beaumont: mgmt interface internet-exposed in most cases. https://thehackernews.com/2026/06/attackers-exploit-three-fortinet.html
- THN 7 Oct 2026: Huntress: attackers log in first try without failed-login alerts; rebuild may need physical factory reset. https://thehackernews.com/2026/10/fbi-warns-fortibleed-remains-active.html
- Insurance Business UK 6 Jul 2026 (reporting The Telegraph): UK logins in dataset reportedly incl. Foreign Office staff, councils, NHS orgs; "No evidence of direct state involvement". https://www.insurancebusinessmag.com/uk/news/cyber/russian-hackers-expose-uk-government-logins-in-fortibleed-credential-breach-581332.aspx

## Ivanti Connect Secure
- Volexity 13 Oct 2026: UTA0576; exploitation from 3 Oct; investigation from 5 Oct; fully patched 22.8R2.4; unauth root via chain; no malware/web shell; re-exploit per command; log deletion; Integrity Checker missed it; stole service account creds, LAPS, BitLocker keys; low-confidence criminal. https://www.volexity.com/blog/2026/10/13/a-series-of-unauthenticated-events-chained-exploitation-of-ivanti-connect-secure-zero-days/
- The Register 14 Oct: CVE-2026-104935 CVSS 8.6, patched 13 Oct, "limited number of customers"; third year running of ICS zero-days. https://www.theregister.com/security/2026/10/14/ivanti-patches-connect-secure-zero-day-after-researchers-confirm-in-the-wild-attacks/5303095
- SecurityWeek 2 Nov: CVE-2026-111357 (8.8) and CVE-2026-118527 (4.3) added 29 Oct; fixed 25.1.1.3 and 22.8R2.6; KEV 30 Oct; Defused saw attempts from 1 Oct. https://www.securityweek.com/ivanti-patches-two-more-zero-days-exploited-in-connect-secure-attack-chain/
- Help Net 2 Nov: KEV deadlines 2 Nov and 13 Nov. 

## Other October edge
- CISA 4 Oct: CVE-2026-88779 Citrix NetScaler KEV. Help Net 5 Oct: DoS in SAML configs, deadline 7 Oct.
- Help Net 15 Oct: KEV 14 Oct: PAN-OS CVE-2026-0322 mgmt interface RCE (8.6, "very limited exploitation"); Cisco SEG CVE-2026-76519 (9.8); deadline 17 Oct.

## Context
- Verizon 2026 DBIR: exploitation 31% top initial access vector, creds 13%; 26% of KEV vulns fully remediated (38% prior); median 43 days (32 prior); Network assets 5% of breaches (1.5%, partly recoding); SMB ransomware victims: creds 38%, unpatched edge devices 29%.
- Verizon 2025 DBIR via SecurityWeek 24 Apr 2025: edge/VPN 22% of exploitation, up from 3%.
- NCSC Annual Review 2026 (3 Nov 2026): 1,831 reports, 337 incidents, 80 nationally significant; patches available but not deployed timely.
- NCSC 27 Aug 2026: inventory internet-facing systems, apply updates, retire EOL, disable SNMPv1/2 and Telnet, monitor config changes; Early Warning.
- NCSC 13 Jul 2026: 18 agencies, FSB Centre 16 targeting routers, weak SNMP, Cisco Smart Install.
- NCSC 4 Feb 2025: Five Eyes edge device forensic guidance.
- NCSC zero trust architecture design principles (reviewed 16 Jan 2026).

## Not used (unverified / conflicting)
- Insurance Business's date of 5 July for NCSC alert (NCSC page says 18 June).
- "SantaAd" handle / $60,000 price (single secondary source).
- Ransomware deployment counts ("at least 12") from a single secondary source.
- SonicWall SMA October KEV (not confirmed).
