# Notes 13: DigiCert and Chainalysis supplier breaches (verified 8 Nov 2026)

## DigiCert (primary: Mozilla Bugzilla 2084460, "DigiCert: Unauthorized access to business system")
https://bugzilla.mozilla.org/show_bug.cgi?id=2084460
- Self-reported. Preliminary report filed 2026-10-20; full report later (comment 2, committed for 2026-11-03). Certificates affected: 0.
- 2025-02-04 infrastructure migration moved system from VPN-restricted segment to externally accessible availability zone.
- Root cause (Five Whys): CF1 migration "treated as an infrastructure change rather than a security change", no security review; CF2 monitoring not reassessed after migration; CF3 authorisation model let unassigned self-registered accounts read data. Self-registration flow did not use MFA.
- 2026-06-18 non-DigiCert accounts seen, concluded no data access, put behind WAF. 06-21 managed security (research) programme report. 06-24 verified external account creation. 06-27 to 07-02 data access window. 07-02 authorisation patch. 07-09 WAF restricted to VPN. 08-28 security sign-off policy for network changes. 08-31 pen test. 10-12 first suspects archive access. 10-15 file-access/request-volume monitoring. 10-17 all business system passwords reset. 10-19 reportable event determined. 10-24 self-registration deactivated, endpoints to private IPs. 10-29 single owner named. 10-30 least-privilege review.
- Data: mostly names, business emails, phones, business addresses; "small minority" also driver's licence, passport, utility bill or other doc. No counts published. Read-only, could not issue certificates. Comment 7: contacted affected customers; reported to law enforcement. Commenters asked for counts; not answered directly.
- BleepingComputer 5 Nov 2026: quote "The incident was initially handled as an account-creation issue rather than a data-access event." CA, CertCentral, DigiCert ONE not compromised; credentials and issued certs secure. https://www.bleepingcomputer.com/news/security/digicert-data-breach-exposes-customer-information-identity-documents/
- The Register 6 Nov 2026 "DigiCert admits 16-month security lapse...": notification email "We are completing a review of identification documents to determine the specific individuals involved." No count disclosed. https://www.theregister.com/security/2026/11/06/digicert-admits-16-month-security-lapse-exposed-customer-information/5308097

## Chainalysis (primary: https://www.chainalysis.com/blog/security-incident-october-30/)
- 30 Oct 2026 (Fri): external actor used "offensive agentic techniques" to access systems and internal tools. Accessed: user IDs, full names, emails, org role labels. No evidence of access to investigation content, clear-text passwords, MFA secrets, session tokens. Unrelated to Binance theft.
- 2 Nov: Reactor and Data Solutions taken offline as precaution; compliance products stayed online.
- 4 Nov 09:50 EST: "on-path attack" exposed a subset of customer passwords; accounts locked.
- 4 Nov 10:30 EST: KYT (UI and API), address screening and login page offline after abnormal activity.
- 4 Nov 23:00 EST: on Monday discovered names, usernames, password hashes and live tokens for all users exposed. No evidence investigations data accessed or attribution data manipulated. KYT customers with apparent unauthorised access notified directly. Plan: trusted IP allowlist, all users reset passwords and rotate API keys.
- 6 Nov 03:30 EST: KYT and Address Screening restored in phases.
- 7 Nov 13:50 EST: Reactor, KYT and Address Screening back online with enhanced security.
- THN 31 Oct https://thehackernews.com/2026/10/chainalysis-confirms-intrusion-into.html ; THN 6 Nov https://thehackernews.com/2026/11/chainalysis-breach-exposes-all-users.html (says attack resembled "many other tech platforms in recent weeks"; attacker not identified).

## UK law and enforcement
- UK GDPR Art 33(1) 72 hours to ICO; 33(2) processor notifies controller without undue delay. Art 28 processor contracts. Art 5(1)(e) storage limitation. legislation.gov.uk
- ICO fined Advanced Computer Software Group £3.07m (Mar 2025), 79,404 people, first fine on a processor; entry via customer account without MFA / incomplete MFA. Bleeping https://www.bleepingcomputer.com/news/security/uk-fines-software-provider-307-million-for-2022-ransomware-breach/
- ICO fined Capita £14m (15 Oct 2025): £8m Capita plc, £6m Capita Pension Solutions; 6.6m people; alert within 10 mins but 58 hours to quarantine; 325 of 600+ pension schemes affected. Hunton https://www.hunton.com/privacy-and-information-security-law/uk-ico-fines-capita-14-million-following-data-breach
- Cyber Security and Resilience (NIS) Bill: at Consideration of Lords amendments in Commons (bills-api lastUpdate 5 Nov 2026). Not yet law. https://bills.parliament.uk/bills/4035 . RMSP factsheet (updated 3 Nov 2026): medium and large MSPs, register, security duties, report significant incidents; regulator Information Commission (formerly ICO). https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets/relevant-managed-service-providers
- NCSC supply chain security guidance: 12 principles. https://www.ncsc.gov.uk/collection/supply-chain-security

## Pattern
- Snowflake 2024 (Mandiant, 10 Jun 2024): ~165 orgs notified; customer creds from infostealers, no MFA, no allow lists; no evidence Snowflake enterprise breached. https://cloud.google.com/blog/topics/threat-intelligence/unc5537-snowflake-data-theft-extortion
- MOVEit/Zellis 2023: BA, BBC, Boots staff data via payroll provider Zellis's MOVEit (The Register 5 Jun 2023) https://www.theregister.com/2023/06/05/british_airways_boots_moveit/
- Okta Oct 2023 support system: initially 134 customers; on 29 Nov 2023 said names and emails of all customer support system users stolen. Help Net https://www.helpnetsecurity.com/2023/11/29/okta-breach-customer-support/

## Left out (unverified)
- Number of DigiCert customers/individuals affected (not disclosed).
- Chainalysis attacker identity, number of customers, and how the on-path attack worked.
- Any ICO involvement in either case (none reported).
- Whether Data Solutions / Chain (Beta) restored.
