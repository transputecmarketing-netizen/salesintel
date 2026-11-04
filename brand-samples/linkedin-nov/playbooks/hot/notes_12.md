# Notes 12: Refrigeration controller attacks, Europe and US (verified 4 Nov 2026)

## France, 11 October 2026
- CERT-FR CERTFR-2026-ALE-012, first 12 Oct, updated 13 Oct (more equipment) and 16 Oct (recommendations). Products: Danfoss AK-SC and AK-SM series, Copeland xweb, Dixell xweb. Numerous compromises; attacks probably ongoing; EOL device left exposed very likely compromised; factory reset alone insufficient. Recs: remove internet exposure (check insurance terms before cutting contractor data feed), review config esp. defrost schedules, restore access only via secure VPN (contractor IP filtering emergency only), firmware, Danfoss security level Strict, change default passwords; compromised: restart/factory reset, reconfigure. https://cert.cyber.gouv.fr/alerte/CERTFR-2026-ALE-012/
- THN Oct 2026: night of 11 Oct; Les Mousquetaires at least 300 (AFP) or ~150 (Reuters); Coopérative U 80 of 2,000; Carrefour 80; Monoprix ~30; E.Leclerc several. Intermarché: some units reached 50°C. Fires. Cotillard expects tens of millions EUR losses. Paris prosecutor inquiry (OFAC). ANSSI head Vincent Strubel: take off internet or tightly filter. Danfoss: "aware of incidents in France affecting a limited number"; most units AK-SM 800 (EOL May 2021) and AK-SC 355 (phased out 2016); some AK-SM 800A on old firmware. Access route not established at the time. https://thehackernews.com/2026/10/attackers-heat-french-supermarket.html
- Scale differs by source: ~350 (Nextgov, BBC link), "hundreds", up to ~700 (Economy Minister Lescure per SentinelLABS; Wikipedia). Used "hundreds" in text.

## Second wave, 2 November 2026
- NBC/Reuters 2 Nov: Sweden, NL, Belgium, Ireland, Luxembourg, Estonia. Ahold Delhaize "IT incident"; Sabcobel CEO Stephan Moelans (to Belga): cyberattack, evaporators switched to defrost. Colruyt: 5 Spar franchise stores. Carrefour Belgium 15 of 700+, "extremely limited impact". IKEA Mons. ICA central systems unaffected, small number of stores via external supplier; ICA Kvantum Sjöbo set to 50°C. Coop Sweden 6 (Aftonbladet). Musgrave: 13 SuperValu; "Our monitoring systems alerted us to the issue and we took immediate action." Swedish NCSC head: cannot speculate; "quite a lot of exposed operational technology devices in Sweden". https://www.nbcnews.com/world/europe/european-supermarkets-hit-new-fridge-cyberattack-rcna606972
- THN 3 Nov: adds Netherlands (at least 17 businesses per Danfoss; default passwords, not on secure network), Portugal Intermarché 7, Italy Coop Sicily 4+, Finland Kesko few, Estonia Selver 1 (fixed in ~10 min, no loss). Danfoss to VTM: weakness mainly outdated software; non-updated customers hit. Belgian federal prosecutor criminal investigation. Belgian CCB: perpetrators unknown, "may never be determined". Shared method does not prove same actors. https://thehackernews.com/2026/11/second-wave-of-cyberattacks-hits.html
- TechCrunch 2 Nov: researchers linked to Danfoss units no longer getting updates; Claroty warned in August 2026. https://techcrunch.com/2026/11/02/a-fresh-wave-of-cyberattacks-has-hit-europes-supermarket-refrigerators-destroying-food-across-countries/

## UK
- BBC (McMahon, Vallance) 3 Nov via Yahoo syndication: NCSC aware of "a couple of instances where vulnerable technology had been exploited in the UK"; Horne: NCSC "worked through the night", "too early to say" who; Chichester: "At the moment, the impact is minimal". AIMS: some members affected, one saw 100C, units empty, no produce lost. https://www.yahoo.com/news/world/articles/uk-affected-supermarket-fridge-hacks-094349012.html

## US military commissaries
- Nextgov 29 Oct (two articles): ~6 commissaries, August; Fort Huachuca freezer entered defrost mode; Cyber Command and DoD law enforcement investigating; French authorities in contact; cause not conclusively determined. Iran-linked suspicion from two anonymous people; not confirmed. Access method unclear. https://www.nextgov.com/cybersecurity/2026/10/pentagon-investigates-suspected-cyberattack-behind-military-freezer-failures/416926/ and .../officials-suspect-iran-series-cyberattacks-military-base-freezers/416934/

## Analysis and vulnerabilities
- SentinelLABS 3 Nov "Defrost and Disrupt": ANSSI assessment pointed to internet-exposed admin interfaces and weak passwords in France; ANSSI says Claroty flaws were not the ones exploited; November and US access path unknown; attribution unresolved. Recs: preserve logs before reset, safety first, remove exposure, VPN, hardening, replace EOL, alert on setpoint/defrost deviations, segment, MFA, view-only remote accounts, scan own ranges, config backups, manual operation practice. https://www.sentinelone.com/labs/defrost-and-disrupt-an-assessment-of-europe-s-refrigeration-attacks/
- CISA ICSA-25-140-03: Danfoss AK-SM 8xxA; CVE-2025-41450 date/time-based password auth bypass (<R4.2); CVE-2025-41451 command injection and -41452 DoS (<4.3.1). 20 May 2025, Update A 26 Aug 2025. Credit Claroty Team82.

## NCSC guidance
- Secure connectivity principles for OT, 21 Jan 2026 (NCSC-NZ date), with ACSC, Cyber Centre, CISA, FBI, BSI, NCSC-NL, NCSC-NZ. Eight principles (from PDF): 1 Balance the risks and opportunities; 2 Limit the exposure of your connectivity; 3 Centralise and standardise network connections; 4 Use standardised and secure protocols; 5 Harden your OT boundary; 6 Limit the impact of compromise; 7 Ensure all connectivity is logged and monitored; 8 Establish an isolation plan. Goals, not minimum requirements. Playbook compresses to six rows (5+6 and 7+8 merged).
- Creating and maintaining a definitive view of your OT architecture: five principles incl. "Understand and document third-party risks to your OT system". Page date unclear ("Reviewed 18 March 2024"), so no date given.

## Left out (unverified or weak)
- Wikipedia claim of "admin" plus current date as password, and Kevin Beaumont exposure counts (not checked at source).
- Exposure counts (2,765 / 4,500+ Shodan): differing scans.
- Horne "just the foothills" quote and "three meat processors": not found in a source I could read.
- Copeland statement on EOL supervisory controllers: not read at source.
- Computer Weekly "UK abattoirs" article: 403. Axios, BleepingComputer, CNN: blocked.
- Claroty "code of the day" DEF CON details and the AI reproduction experiment.
- Loss totals in euros beyond "tens of millions" expectation; fires at specific stores.
