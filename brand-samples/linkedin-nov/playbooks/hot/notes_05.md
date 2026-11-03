# Notes 05: ASOS push notification hijack (October 2026)

## Confirmed by ASOS
- RNS "Update regarding cyber incident", 6 Oct 2026: unauthorised customer notification sent around 10am; investigating "unauthorised activity involving third-party platforms that we use to communicate with customers"; restricted access to notification platforms; working with specialist advisers and relevant authorities; "Basic personal information including name and contact details may have been accessed"; "We do not believe that payment-card information or account passwords, were impacted"; website and app operating normally; has cyber insurance; too early to quantify trading impact. https://www.investegate.co.uk/announcement/rns/asos--asc/update-regarding-cyber-incident-/9809595 ; Reuters via https://wtvbam.com/2026/10/06/uk-online-retailer-asos-shares-drop-on-hack-reports/
- Email to customers Tue 6 Oct evening: apologised, urged not to engage with links, app "operating as usual", not asking for password resets. Pinsent Masons https://www.pinsentmasons.com/out-law/news/asos-cyber-attack-leaves-uk-businesses-and-customers-reeling
- 8 Oct customer email/statement: "We're sorry for the unauthorised notification some of you received on 6 October"; unauthorised party gained access to an ASOS employee account "by impersonating a trusted contact to obtain log in credentials"; credentials "used to access information on certain third-party platforms used by ASOS"; platforms locked down; internal/external experts, law enforcement and regulators involved; personal info such as names and contact details plus "certain non-personal account related information"; no payment card or passwords; no action needed; be wary of unexpected messages/calls. Infosecurity https://www.infosecurity-magazine.com/news/asos-data-breach-stolen-employee/ ; LADbible https://www.ladbible.com/technology/asos-issues-statement-after-hack-message-shopping-925883-20261008 ; Yahoo/PA https://uk.finance.yahoo.com/news/asos-cyber-breach-not-caused-102151192.html
- Strengthened security controls; investigation continues over coming weeks; will contact customers directly where action is needed. Malwarebytes 9 Oct https://www.malwarebytes.com/blog/data-breaches/2026/10/asos-breach-update-hackers-stole-customer-details-and-shopping-searches

## "More data than first disclosed"
- BBC received sample: names, addresses, phone, email, customer numbers, dates of birth, website searches (eg "reclaimed vintage"), when customer started using ASOS. ASOS updated its account on 8 Oct after BBC contacted it. Silicon UK https://www.silicon.co.uk/cybersecurity/asos-customer-data-631835 ; Malwarebytes 9 Oct; TechCrunch https://techcrunch.com/2026/10/08/asos-confirms-breach-of-customer-data-after-hackers-send-rogue-app-notification/
- Infosecurity notes BBC did not say whether sample verified by experts.
- Customer count not disclosed. Android app 10m+ downloads (BBC, via Help Net https://www.helpnetsecurity.com/2026/10/07/asos-data-breach-app-notification/). ~16.5m customers (Pinsent Masons), 17m on website (TechCrunch).

## Notification text (attacker)
- "ASOS HACKED Dear Asos DPO and IT, we have fully compromised the Snowflake instance. Engage with us, or we will leak it" + Telegram link; "Xuanye group". Malwarebytes https://www.malwarebytes.com/blog/news/2026/10/asos-hackers-send-push-notifications-to-customers
- Two week deadline reported (Malwarebytes citing reporting, "reportedly").
- Attackers told BBC access via Simon AI (marketing platform on Snowflake; owned by Monetate since July). Unconfirmed. BankInfoSecurity https://www.bankinfosecurity.com/asos-hackers-claim-breach-snowflake-connected-simon-ai-a-33056 ; case study says Simon AI used by ASOS marketing to trigger push and emails. Researcher said Simon AI MFA not on by default: unverified claim.
- Screenshot shows 14.3GB file dated 9-28-2026 (BankInfoSecurity) - claimed.

## Snowflake
- 6 Oct: "no compromise of the Snowflake platform" (Reuters).
- 9 Oct: "did not in any way result from a vulnerability, weakness, flaw, or misconfiguration"; "No remediation is required for Snowflake customers." (Yahoo/PA; Infosecurity)

## Regulators
- NCSC 6 Oct: customers "should assume you are affected", do not click suspicious links incl push; suspicious messages can arrive later; Stop! Think Fraud; passkeys / 2SV. https://www.ncsc.gov.uk/news/incident-affecting-asos-customers
- ICO 6 Oct: had not received a report "at this stage"; not all breaches need reporting. MLex https://www.mlex.com/mlex/data-privacy-security/articles/2534427/no-asos-report-of-potential-breach-after-app-notification-uk-ico-says-update-
- ICO statement 7 Oct by chief executive: "We understand how unsettling it can be to receive a message from apparent hackers claiming to have access to your personal information." https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/10/asos-statement/ (page blocked to fetch; text via search snippet)
- Could NOT verify whether/when ASOS formally notified ICO. ASOS said it was working with regulators.

## Markets
- Shares fell ~10% on 6 Oct (Reuters). Other reports up to 13% intraday: not used.

## Related
- H&M 12 Oct investigating online claims; "have not found any indications that our data environment has been compromised". Drapers https://www.drapersonline.com/news/hm-investigates-potential-cyber-attack
- Betterment 9 Jan 2026: third-party platform for marketing and customer comms used to send fraudulent crypto offer; social engineering; names, emails, addresses, phones, DOB accessed; CrowdStrike found no accounts/passwords compromised; post incident report 30 Mar. https://www.betterment.com/customer-update
- Fast Company Sept 2022 hacked to send offensive Apple News notifications. https://techcrunch.com/2022/09/28/hacker-breaches-fast-company-systems-to-send-offensive-apple-news-notifications/
- Snowflake 2024 UNC5537: ~165 orgs notified; infostealer creds, no MFA, no rotation, no allow lists. https://cloud.google.com/blog/topics/threat-intelligence/unc5537-snowflake-data-theft-extortion
- Salesloft Drift Aug 2025: stolen OAuth tokens used to export Salesforce data 8 to 18 Aug 2025; tokens revoked 20 Aug. https://cloud.google.com/blog/topics/threat-intelligence/data-theft-salesforce-instances-via-salesloft-drift

## Retail context
- M&S: around £300m operating profit impact estimate before mitigation (CNBC 21 May 2025) https://www.cnbc.com/2025/05/21/ms-cyberattack-to-wipe-out-nearly-one-third-of-annual-profits.html
- Co-op: data of all 6.5m members taken (TechCrunch 16 Jul 2025) https://techcrunch.com/2025/07/16/uk-retail-giant-co-op-confirms-hackers-stole-all-6-5-million-customer-records/
- Harrods: ~430,000 records via third-party provider, Sept 2025 https://www.bleepingcomputer.com/news/security/harrods-suffers-new-data-breach-exposing-430-000-customer-records/
- NCA arrested four aged 17 to 20, July 2025 https://www.computing.co.uk/news/2025/security/four-arrested-over-m-s-co-op-and-harrods-cyberattacks
- CMC estimate £270m to £440m for M&S/Co-op event https://securityaffairs.com/179225/cyber-crime/the-financial-impact-of-marks-spencer-and-co-op-cyberattacks-could-reach-440m.html

## Law
- UK GDPR Art 33: notify Commissioner without undue delay, where feasible within 72 hours of becoming aware, unless unlikely to result in risk; processor notify controller without undue delay; document all breaches. https://www.legislation.gov.uk/eur/2016/679/article/33
- Art 34: high risk -> communicate to data subjects without undue delay. https://www.legislation.gov.uk/eur/2016/679/article/34

## Left out (unverified)
- How attackers accessed the push sending system specifically (ASOS did not say which platform).
- Whether ASOS formally notified the ICO and when.
- Number of affected customers; whether data was published after deadline.
- Simon AI as route in; MFA status of ASOS accounts.
- Grubhub Dec 2025 scam emails (could not verify primary source).
