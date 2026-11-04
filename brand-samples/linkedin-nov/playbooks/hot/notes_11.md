# No. 11 · The Code That Opens the Door (device code phishing)

Output: HOT-11-Playbook-The-Code-That-Opens-the-Door.html (25 pages, check.js OK). Art: frames, fig: lockers (figpage uses keyboard).

## Verified facts used (source number)
- Device code flow: user has 15 minutes by default (expires_in); tokens go to the polling client [1].
- Storm-2372: Microsoft blog 13 Feb 2025; fake Teams invites after rapport on WhatsApp/Signal/Teams; sectors incl. government, NGOs, defence, health, energy; 14 Feb 2025 update on Authentication Broker client ID and device registration; 31 Jul 2026 update assesses it as an initial access sub-cluster of Midnight Blizzard [2].
- Proofpoint 18 Dec 2025: widespread campaigns by Sept 2025; TA2723 salary lures; fake OneDrive on Cloudflare Workers; recommends CA block and compliant/registered devices [3].
- EvilTokens: 12,000+ inboxes, 10,000+ orgs, UK among top countries; 15-minute live code generated on click; 44 lure themes; revoke and consider disabling as access tokens can last up to an hour [4]. Disruption 22 Sep 2026; Met Police arrested two men (11 Sep 2026) [5]. Individuals deliberately not named.
- MadApe (Group-IB, 29 Oct 2026): 155 root domains, 97 with device code components; PDF lures; SharePoint/OneDrive/Teams/Adobe/DocuSign templates [6]. Note: Group-IB's article title is also "The Code That Opens the Door".
- THN weekly recap 2 Nov 2026 lists device-code phishing (MadApe) [7].
- Huntress/THN 25 Mar 2026: 340+ orgs in US, Canada, Australia, NZ, Germany; lures incl. construction bids, DocuSign, voicemail, Microsoft Forms; "Continue to Microsoft" button [9].
- Microsoft Learn: block policy steps and report-only [8]; authentication protocol filter, protocol tracking, Device Registration Service exclusion [10]; Microsoft-managed "Block device code flow" policy, enabled no less than 30 days after report-only [11]; Teams devices exceptions, account-scoped [12]; token protection supports Exchange, SharePoint, Teams native apps on Windows/macOS/iOS [13]; revoke sessions, 1-hour access token default [14]. CA licensing: Entra ID P1 / Business Premium [11,12].

## Judgement calls
- Stated plainly that phishing-resistant MFA does not by itself stop device code phishing (victim signs in on the real page); kept as Microsoft-recommended hygiene.

## Left out as unverifiable or weakly sourced
- CrowdStrike "15-fold increase" (Dark Reading, page 403) and Barracuda "7 million attacks in four weeks" (secondary only).
- THN's "first observed 7 Jan 2026" for MadApe (not in Group-IB's own report; Group-IB's earliest dates are June to August 2026).
- Skyw4lker campaign (Aviatrix, 28 Oct 2026): less established source, not used.
- Any NCSC guidance specific to device code phishing: none found.
- Revenue/pricing figures for EvilTokens and suspect names: not needed / names withheld by rule.
