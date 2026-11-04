# Notes: hp09 Ransomware Gets an Upgrade

Output: HOT-09-Playbook-Ransomware-Gets-an-Upgrade.html (25 pages, check.js OK). 11 sources.

## Verified (primary unless noted)
- NCSC Annual Review 2026, published 3 Nov 2026, PDF subtitled "The State of the Cyber Nation"; covers 1 Sep 2025 to 31 Aug 2026. https://www.ncsc.gov.uk/collection/annual-review-2026 , PDF https://www.ncsc.gov.uk/sites/default/files/2026-11/ncsc-annual-review-2026.pdf
  - "It is also highly likely that between now and 2028, AI-powered malware will have been used in a ransomware attack on UK CNI." Also: "It is highly likely AI malware will be used in a ransomware attack on UK CNI."
  - AI "highly likely" to increase speed, scale and efficiency of existing methods "rather than autonomously conducting end-to-end attacks"; human operators highly likely remain essential.
  - Race to shorten patch timelines; widening divide; China highly likely best positioned re CNI.
  - IM team: 1,831 reports, 337 incidents supported, 80 nationally significant; 8,500 Early Warning notifications. 88% of large-org incidents from four access vectors.
- The Register 3 Nov 2026: NCSC CEO "invest with urgency"; NERV Centre £70m (not used in playbook).
- Bitdefender, Marius Baciu, 3 Nov 2026, "3AM Hits European Schools: A Hybrid AI Ransomware Attack, Part Human, Part Agentic Loop". UK school estate; 10 to 19 Sep 2026; Veeam credential script on three backup servers; Mimikatz; portable Python; accounts "library" and "svc_bkpmon" added to Domain Admins; finance files exfiltrated; two-way trusts between three domains 18 Sep; EDR removal blocked by anti-tamper; host.exe encryptor 05:07 to 05:33 on 19 Sep; ~50 machines reached, ~37 encrypted. Retry gaps 40 to 101 s. Model-generated commands "strongly supported"; agentic loop plausible but human copy-paste "cannot be excluded"; no human "unsupported". Initial access unknown. Hybrid reading is "the working model defenders should plan around, not ... an established fact".
- NCSC/ABI/BIBA/IUA payment guidance, 14 May 2024: decision rests with victim; involve technical staff; record decisions; sanctions risk; ICO: paying does not reduce penalty; tell insurer promptly.
- Home Office government response, 22 Jul 2025: three proposals (targeted ban for public sector incl. local government and regulated CNI; payment prevention regime requiring report of intent to pay; mandatory reporting, initial report in 72 hours, fuller in 28 days). The Register 22 Jul 2025 says NHS, councils and schools covered.
- OFSI Financial sanctions guidance for ransomware, updated 28 Jan 2026 (via search summary of gov.uk page).
- NCSC Mitigating malware and ransomware attacks; NCSC offline backups blog (13 Aug 2019); NCSC Exercise in a Box (free, includes ransomware).
- ICO: report notifiable breaches within 72 hours (ICO guide, via search on ico.org.uk; direct fetch blocked 403).

## Labelled / handled carefully
- AI involvement in the school attack stated as suspected, not proven; vendor interest noted.
- Ransom payment proposals labelled "Proposal, not yet law" as at early Nov 2026. I found no evidence of a bill containing them being introduced; secondary sources say timetable unannounced.
- Bitdefender headline says "European Schools"; body says UK school estate. Playbook says UK school estate.

## Left out (unverified or not needed)
- Secondary claim that "highly likely" equals 80 to 90%: not stated numerically.
- Hackread headline "37 UK school systems" (it was ~37 machines in one estate).
- Victim identity, ransom amount, data volume (not disclosed).
- Cyber Security and Resilience Bill stage (Parliament page 403); not used.
- Whether the payment ban would sit in any particular bill.
- Usecases are illustrative, not real organisations.
