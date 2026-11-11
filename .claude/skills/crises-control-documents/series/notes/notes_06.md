# Notes 06: Healthcare (week of 14 December 2026)

Playbook: CC-06-Playbook-Major-Incident-Minute-One.html (38 pages after round 2, 13 sources)
Report: CC-06-Report-When-the-Lab-Went-Dark.html (23 pages, 24 sources)
Back pages cross-refer: playbook -> "Intelligence report No. 06 · When the lab went dark"; report -> "Crisis playbook No. 06 · Major incident, minute one".

## Key verified facts
- EPRR definitions are quoted from the NHS EPRR Framework v3, July 2022 (PDF text extracted). They cover:
  - Business continuity, critical and major incidents (the major incident definition is from the Cabinet Office/JESIP).
  - The "Critical Incident declared by (organisation)" format.
  - The four standard major incident messages, METHANE and SBAR.
  - The 24/7 on-call duty, with a director able to allocate resources.
  - Notification to the ICB, then to NHS England via regional on-call.
  - Response levels 1 to 4.
  - Debriefs: a hot debrief within 48 h of stand down, a structured debrief within 28 days, a multi-agency debrief within 8 weeks.
  - The Standard Contract SC30 requires providers to comply with EPRR guidance.
  - No newer national version was found.
- Synnovis:
  - Attacked on 3 June 2024. A critical incident was declared on 4 June (The Register).
  - 10,152 outpatient appointments and 1,710 elective procedures were postponed. The figures are from NHS England London's "latest media statement" and are confirmed by The Record (17 Apr 2026). The england.nhs.uk HTML was blocked to fetches.
- NHSBT:
  - 10 June 2024: appeal for O type donors.
  - 25 July 2024: amber alert. O negative stocks were at 1.6 days. The London hospitals needed an extra 1.7 days of O negative, a 94% increase.
  - 18 July 2025: the alert was stood down from 21 July.
- Harm and the long tail:
  - King's confirmed a patient death with the attack as a contributing factor (The Record, 25 Jun 2025).
  - 170 harm cases from nearly 600 incidents (HSJ via PA, 18 Jun 2025). Severity splits conflict between reports, so only the total is used.
  - SLaM: 161,560 reports delayed and 122 safety incidents as of Jan 2026 (The Record, Apr 2026).
  - Bedfordshire: data on 32,927 patients (Digital Health, Jun 2026).
  - Synnovis completed its review on 13 Nov 2025 (The Register).
- WannaCry: from the NAO report of 27 Oct 2017. At least 81 of 236 trusts were affected, plus 603 other organisations, including 595 GP practices. 6,912 appointments were cancelled, with an estimated 19,000+. Five A&Es diverted patients. The plan had not been tested locally. Staff used personal phones and WhatsApp.
- EPRR assurance 2026/27: the approach is consistent with previous years. The rating bands (Fully 100%, Substantial 89 to 99%, Partial 77 to 88%, Non-compliant) come from search snippets of the NHS England pages. 62 standards plus an 11-standard cyber deep dive come from the OUH board paper (2024 round).
- NIS health guide (updated 27 Sep 2023): reporting via the DSPT within 72 h. CSR Bill factsheet (updated 3 Nov 2026): 24 h initial notice and 72 h full report proposed, after Royal Assent and secondary legislation.
- Other incidents:
  - Wirral major incident, 26 Nov 2024.
  - HCRG, 20 Feb 2025.
  - ICO fine on Advanced, about £3.07m, Mar 2025. 890 home care entry details were exposed.
  - QA Portsmouth chiller critical incident, 24 Jun 2026.
  - NNUH MRI failure, Jun 2026.
  - East Kent IT critical incident, 29 Jul 2026.
- RCN: 14.5% of NHS staff experienced physical violence from patients or the public (2025 staff survey, published Mar 2026). The playbook says "about one in seven".

## Left out as unverifiable
- The exact date of NHS England's final Synnovis statement, and whether "six boroughs" of GP services were affected.
- Severe and moderate harm splits, which conflict between Bloomberg/ICB, HSJ and PA. Also the ~900,000 people estimate, which is an industry estimate not confirmed by Synnovis.
- Current CSR Bill parliamentary stage, since bills.parliament.uk was blocked. It is described only as proposed.
- Exact OPEL level definitions and the 2026/27 core standards count.
- The cause of the East Kent incident, which was not disclosed.
- Wording on the NHS England cyber operations phone line beyond "monitored 24/7", which was verified only via search snippets of digital.nhs.uk.
- The WannaCry £92m cost estimate, which was not checked.

## Round 2 revision (BRIEF2)
New pages in cp06.py (no new facts or sources; all practical content is labelled illustrative):
- Part 01: escalation workflow (department, business continuity, critical, system response; tied to the SEV ladder and the ICB notification route, S8) and a RACI (executive on call, incident lead, clinical leads, digital, comms, ICB and partners; 11 rows).
- Part 02: swimlane across clinical teams, site management/incident control, digital, partners (ICB, ambulance, supplier) and comms, with risk/decision/monitoring cards (WannaCry WhatsApp point re-cites S12). First-hour rows now name escalation and action review; the three use cases now read where it fails / who decides / what happens / how it is monitored.
- Part 03: downtime procedure checklist by department (table) and a downtime results and back-entry log (form; example row uses an NHS test-range number); outstanding actions tracker (day one, 16:00).
- New Part 04 "Rehearse and review": tabletop exercise (6 injects), post-incident review template (hot debrief 48 h, structured 28 days, multi-agency 8 weeks, S8), then the existing plan, questions and checklist.
- Platform rows rewritten in lifecycle order (SOS to CRAiG, current CRAiG capability only); "Audit & Reporting" name used. Glossary adds RACI and back-entry.

## Round 3 revision (BRIEF3): international, evergreen, standard toolkit
Titles unchanged (both already international). Playbook 45 pages, 18 sources (one page). Report 29 pages, 35 sources (two pages).

Playbook restructure: foreword (UK Synnovis labelled, US Ascension, UK heat critical incident), executive summary, introduction (narrative in own words), Part 01 Declare and decide (generic incident levels table with a labelled UK row, essay with UK/US asides, TWO regions pages: emergency preparedness; cyber/data incident reporting), Part 02 Incident scenarios (severity, three-scenarios table, first hour, swimlane, usecase with Scenario 1 cyber/IT downtime, 2 mass casualty at night, 3 cooling/power failure; call-in rules; tracker), Part 03 Keep patients safe (downtime essay, downtime checklist, results log form with a non-NHS illustrative ID, partners grid, long incidents, first week/month/quarter plan), Part 04 Practical toolkit in the fixed order (RACI, decision log with O type example, escalation, six messages incl. regulator, supplier and media, exercise, PIR). General guidance now says hospital/health system, incident command, emergency operations centre, regional health authority, ambulance service, suppliers; NHS/ICB/EPRR only in UK-labelled text.

New verified facts (all fetched):
- 42 CFR 482.15 (Cornell LII): all-hazards program; plan, policies, communication plan, training and testing each reviewed "at least every 2 years"; training at least every 2 years; exercises "at least twice per year"; events and exercises analysed and documented.
- Joint Commission revised EM standards: effective July 2022 for accredited hospitals and CAHs (ASPR TRACIE listing; jointcommission.org itself returned 403).
- HICS Guidebook 5th edition, May 2014, California EMSA (ASPR TRACIE).
- HIPAA 45 CFR 164.404(b): individuals within 60 calendar days of discovery; 164.408: 500+ to HHS contemporaneously.
- NIS2 (European Commission FAQ): early warning 24 h from awareness, notification within 72 h, final report one month later; transposition 17 Oct 2024; health a high-criticality sector. EUR-Lex itself could not be fetched.
- CER (Commission Home Affairs page): health among 11 sectors; transposition 17 Oct 2024; risk assessment 17 Jan 2026; critical entities identified by 17 Jul 2026; critical entities take resilience measures and notify incidents. A 24 h CER deadline was NOT verified, so not stated.
- Civil Contingencies Act 2004 Sch. 1 Part 1: NHS England, ICBs, foundation trusts providing ambulance or A&E services are Category 1 responders.
- DHA framework DHA/PHPD/MA-01 (PDF text extracted): issued 14 Nov 2024, effective 14 Jan 2025; applies to DHA-licensed facilities; annual HVA (7.x/6.2), focal point preferably from incident command, 24/7 phone and email for DHA (7.2, 7.3), EOC for hospitals (7.4), at least one exercise a year with report to DHA (7.13).
- Abu Dhabi Media Office, 8 May 2025: ADCMC and DoH launched the Abu Dhabi Standard for Business Continuity in Healthcare Activities, applying to all healthcare providers.
- AE/SCNS/NCEMA 7000:2021 named as the national BCMS standard (ENEC page); report only.
- CBAHI: Cureus 2025 narrative review says accreditation is explicitly linked to hospital operating licence renewal.
- JCI 8th edition hospital standards published 1 July 2024, effective 1 January 2025 (PR Newswire via AAP).
- Ascension (AP, 10 May 2024): 140 hospitals in 19 states; several diverted ambulances; EHR and MyChart offline; paper records; downtime procedures "for some time".
- Change Healthcare (Healthcare Dive, 27 Jan 2025): Feb 2024 attack; about 190 million people; providers could not get reimbursed, verify insurance or file prior authorisations.

Not used / could not verify: ADHICS (DoH Abu Dhabi cyber standard) details and incident reporting windows (doh.gov.ae returned 503); Saudi MOH and NCA requirements for hospitals; GDPR text (EUR-Lex blocked); Joint Commission EM chapter detail beyond effective date; CER 24 h notification. Removed from the playbook: RCN staff survey figure, OPEL, NHS cyber operations centre line, WannaCry WhatsApp point (kept in the report), NHSBT donor appeal (kept in the report).
Product claims changed: platform rows rewritten to CAPABILITIES.md (escalation "under the rules you configure", location "where available", Incident Manager launched by an authorised user, Audit & Reporting PDF/CSV export, CRAiG beta current capability only); exec summary support lines specific to healthcare.
