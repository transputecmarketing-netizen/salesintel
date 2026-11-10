# Notes 01: Financial Services and Insurance (week of 9 November 2026)

Playbook: CC-01-Playbook-Within-Tolerance.html (38 pages after round 2, 9 sources)
Report: CC-01-Report-Resilience-Regulated.html (23 pages, 19 sources)

## Key verified facts
- Google Cloud europe-west2 incident (Xs2XTHzAVC9YnafnPyzj), from Google's final report of 4 Nov 2026 (status.cloud.google.com incidents.json):
  - Feed A was cut at 06:53 BST by an external cable fault. Feed B was open for repairs after a 14 Oct generator test. A PLC read live voltage on the isolated feed B, so the generators were never told to start. The UPS gives about 5 minutes of runtime.
  - Impact ran from 07:00 BST to 13:08 BST: 6 h 08 min. The preliminary report said 6 h 10 min, ending 13:10. Power was restored by 08:20. Platform services were fully available at 12:11.
  - 38 affected products are listed on the status page.
  - The earliest public update was at 08:35 UTC (09:35 BST).
  - The action list includes "automated alert-to-communication mechanism".
- Banks affected (Reuters, Yahoo UK): Lloyds, HSBC, Revolut. The FCA is "engaging with Google". The EBA asked Google for information. The Treasury Committee wrote to the BoE and the FCA.
- PS21/3 was published on 29 Mar 2021. The rules have applied since 31 Mar 2022, and the tolerance deadline was 31 Mar 2025 (FCA page).
- FCA "one year on" was published on 27 Mar 2026. The communications findings are quoted from the FCA page.
- PS26/2 and PS7/26 were published on 18 Mar 2026 and apply from 18 Mar 2027. Reporting periods, checked against the PS26/2 PDF:
  - Initial report: within 24 hours of determining a threshold.
  - PSPs: within 4 hours of first detecting.
  - Final report: 30 working days, with a 60 working day long stop.
- CTP designations were made under SI 2026/777 (made 8 Jul 2026, in force 13 Jul 2026): AWS EMEA, Google Cloud EMEA, Microsoft Ireland, Oracle UK. The BoE statement says firms "remain responsible".
- DORA has applied since 17 Jan 2025. Article 5 of the Delegated Regulation 2025/301 sets the reporting periods: 4 h from classification and no later than 24 h from awareness, then 72 h, then 1 month. The ESAs designated CTPPs on 18 Nov 2025.
- FCA FOI2026/01239: 446 major operational incidents were reported by retail banks in 2025. The leading drivers were change management (24.22%) and third-party failure (20.85%).
- Treasury Committee (Mar 2025): 158 incidents and 803 hours across nine banks and building societies, Jan 2023 to Feb 2025. Barclays reported 56% of online payments failed, with £5m to £7.5m in compensation.

## Left out as unverifiable or out of scope
- The contents of the BoE and FCA reply to the Treasury Committee (published 4 Nov 2026). The Parliament site was blocked to fetches.
- Details of the Treasury Committee's 20 Oct letter: the number of questions and the deadlines appear only in secondary reports.
- Press reports give a 06:08 GMT start time. Google's report was used instead.
- Halifax and other non-bank firms named by some outlets.
- Lloyds app outages in June and July 2026, and the Lloyds data exposure in March 2026. These were not checked against primary sources, or were off-angle.
- PRA-specific report timings under PS7/26. Not checked in the primary text, so not stated.

## Round 2 revision (BRIEF2, 10 November 2026)
New pages in the playbook (all illustrative, no new statistics, no new sources):
- Part 01: dependency map for retail card payments (depmap; tolerance values labelled illustrative, set by the firm; cites SS1/21 for time metric and peak); escalation workflow tied to time left against a 4-hour illustrative tolerance; decision rights RACI (Executive on call, Incident lead, IT and technology, Comms, Compliance, SMF holder).
- Part 02: swimlane of the 07:00 cloud outage (risk, decision, monitoring boxes); outstanding actions tracker at 13:30; decision log fill-in form.
- Part 03: tabletop exercise (Region down on payday, six injects); post-incident review template.
- Tools section: supervisor, supplier and scheme notification log form (cites PS26/2 for the 4-hour PSP and 2027 24-hour clocks).
Changed: scenario cards now cover where it goes wrong, who decides, and monitor and test; opener item lists; platform rows rewritten as seven lifecycle outcomes (SOS to CRAiG, "Audit & Reporting"; CRAiG described only as helping find who has not responded and what is outstanding); "mass notification service" in the out-of-band essay changed to "alerting service".
SMF holder is described generically ("the senior manager responsible for operational resilience in your firm"); no SMF number is stated, as it was not verified for this round.
