# Notes 02 · Property, Housing and Facilities · week of 16 November 2026

Files: `cc/cp02.py` -> `CC-02-Playbook-Every-Resident-Reached.html` (25 pages); `cc/cr02.py` -> `CC-02-Report-Safe-Homes-Clear-Duties.html` (24 pages). Both pass `node check.js`; every page rendered and inspected.

## Verified (primary sources)
- Awaab's Law, SI 2025/1042: made 23 Sep 2025, in force 27 Oct 2025; emergency hazard definition (reg 3), investigation and safety work within 24 hours (reg 5), written findings within 3 working days (reg 9), progress updates (reg 14), alternative accommodation (reg 16). legislation.gov.uk.
- Phase 2 (Amendment) Regulations 2026: laid 12 Jul 2026, Lords approved 14 Oct, Commons 20 Oct 2026 (Parliament procedure site). Due to apply 30 Nov 2026 (MHCLG guidance, updated 31 Jul 2026), adding excess cold and heat, falls, structural collapse, fire and explosions, electrical, domestic hygiene. Communal fire hazards covered by the Fire Safety Order are excluded (guidance s8.1.1).
- Fire Safety (England) Regulations 2022, SI 2022/547, in force 23 Jan 2023: regs 4 to 10 (information box, plans, monthly lift checks, report faults not fixed in 24 hours, wayfinding, resident instructions every 12 months, fire doors, 3-monthly communal door checks above 11m).
- Fire Safety (Residential Evacuation Plans) (England) Regulations 2025, SI 2025/797, in force 6 Apr 2026; scope 18m/7 storeys or over 11m with simultaneous evacuation; regs 5 to 13.
- Building Safety Act 2022 s91 (residents' engagement strategy) and s87 (occurrence reporting).
- BSR standalone from HSE on 27 Jan 2026 (gov.uk news).
- Grenfell Phase 2 Report (4 Sep 2024): paras 2.67, 2.68, 2.95 to 2.98, 2.103 to 2.107 (Vol 1, ch 2) and 113.72 to 113.83 (Vol 7). Government response 26 Feb 2025: all 58 accepted, 49 in full, 9 in principle; evacuation alert systems in new blocks over 18m.
- Housing Ombudsman Annual Complaints Review 2025-26: 62% maladministration, 2% severe, repairs in 80% of cases, poor communication and record keeping as cross-cutting failures, early Awaab's Law cases.
- CERT-FR CERTFR-2026-ALE-012 (12 Oct 2026, updated 13 and 16 Oct); CISA/FBI/HHS/USDA/DoT fact sheet 5 Nov 2026; Censys 5 Nov 2026 (second wave 2 Nov; exposed controllers 6,695 to 3,124, down 53%).
- NCSC statements via The Record (3 Nov 2026) and PA Media (chief executive named heating and refrigeration controls). No standalone NCSC publication on the attacks was found, so these are labelled as reported remarks.

## Left out as unverifiable or contested
- Number of French supermarkets affected (reports range from about 350 to 700).
- An alleged Sauter BMS incident in Italy (27 Oct 2026) and BACnet exposure counts: secondary blog sources only.
- Any confirmed attack on a UK building management system or residential building: none found; the report says so.
- Grenfell death toll and "every death was avoidable" wording: not found in the Phase 2 text we checked, so not used.
- Count of registered higher-risk buildings: no current official figure found.
- Phase 2 significant-hazard timescale (10 vs 15 working days): sources conflict, so not stated.

## Notes
- Named individuals avoided; NCSC officials referred to by role.
- Building, landlord and street names in playbook templates and timeline are fictional (stated in the sources note).
- No Transputec references.

## Round 2 revision (BRIEF2) · playbook now 38 pages
Build: `python3 build_cc.py cp02` -> `CC-02-Playbook-Every-Resident-Reached.html`, 38 pages, `node check.js` OK; PDF rendered and every page viewed.

New pages (all illustrative, labelled as such; no new statistics or sources):
- Part 01: escalation route tied to the severity ladder (4 levels, decision owner per level, timed escalate-if conditions); resident assistance register (form, cites SI 2025/797); roles and responsibilities matrix (raci: duty manager, building safety lead, head of housing, welfare lead, comms, contractors; 11 activities).
- Part 02: handling non-responders (timed table T+0 to stand-down); acknowledgement and follow-up log (form); multi-building, out-of-hours swimlane (three blocks on one estate at night, with risk, decision and monitoring points).
- Part 03: outstanding actions tracker (morning after; note cites Awaab's Law 24 hours and the FSR 2022 lift fault rule); night-time tabletop exercise (6 injects); post-incident review template (8 boxes).
Changed: use-case cards now show where it goes wrong, who decides, how it is monitored and the proof (existing citations kept); platform rows rewritten as seven outcomes in lifecycle order (SOS to CRAiG, "Audit & Reporting"); CRAiG row limited to retrieving information from the incident (current capability only). Part opener lists updated.
Shared-file issue to report: on the second platform page (ccprac.platform), the background dial's red sector crosses the "ACCOUNTABILITY" box at bottom right. Not editable from cp02.

## Round 3 revision (BRIEF3) · international, evergreen, standard toolkit
Build: `python3 build_cc.py cp02 cr02` -> `CC-02-Playbook-Every-Resident-Reached.html` (44 pages), `CC-02-Report-Safe-Homes-Clear-Duties.html` (30 pages). `node check.js` OK on both; PDFs made; every page rendered and viewed. No retitles (titles are not tied to one country's law).

Playbook structure: Foreword (3 paras) > Executive summary (execsum, custom support lines) > Introduction (narrative in intro lede) > 01 Know your building (essay, 2 regions pages: fire and evacuation duties; response clocks and resident communication; six emergencies; resident assistance register) > 02 Incident scenarios (severity, firsthour, swimlane, usecase, tracker) > 03 Reach, record, recover (strategy change, non-responders, acknowledgement log, out of hours, records, first week/month/quarter) > 04 Practical toolkit (index, readiness, raci, decisionlog, escalation, messages, exercise, pir, all tool=True) > questions, checklist, glossary > platform > sources (20, one page) > back.

### Regional frameworks verified (playbook source numbers; report has its own numbering)
- US: OSHA 29 CFR 1910.38 (osha.gov text read: written plan, reporting, evacuation, accounting for employees, alarm system, training, review); NFPA 101 (NFPA fact sheet: model code, used with or without a building code; adoption by jurisdiction); NFPA 1660 (2024, combines 1600, 1616, 1620; voluntary); HUD NSPIRE Smoke Alarm standard v3.0 (hud.gov PDF read: life-threatening, 24-hour correction).
- EU: Regulation (EU) 2024/3110 (recitals 25 and 26 keep construction-works requirements with member states; main part applies 8 January 2026 per Commission page); Directive 89/391/EEC Art 8 (osha.europa.eu); EECC Art 110 (legislation.gov.uk copy of the directive text read: by 21 June 2022). EUR-Lex itself was blocked by a WAF challenge, so EU texts were read through these mirrors and Commission/Parliament summaries.
- Middle East: UAE Fire and Life Safety Code of Practice (2018 edition listed by Dubai Civil Defence; official PDF not retrievable, so only described as the national fire code issued by Civil Defence); Dubai Law No. 4 of 2025 (full text read on dlp.dubai.gov.ae: Art 15 designated person keeps occupants informed; Art 17 owner duties; issued 7 April 2025, in force on Gazette publication, date not stated); Saudi SBC 801-CR-2024 (official sbc.gov.sa PDF, table of contents read: Ch 4 emergency planning, 404 evacuation plans, 405 drills, 406 employee training, 917 mass notification); NCEMA 7000:2021 (standard PDF read; report only, applicability left to sector).

### Not stated (could not verify)
- SBC 801 2024 effective date (secondary sources say 30 June or 1 July 2025). UAE code amendments after 2018. HUD NSPIRE voucher-programme compliance date (secondary sources only). Qatar requirements not researched to primary level, so not included.

### Product claims changed
- SOS row: press-and-hold, location where available (was "one touch, with the building and floor attached").
- Ping: re-alerting "under the rules you configure" (was "silence is chased"). Task Manager: no automatic escalation of missed deadlines. Control Centre: acknowledgements by configured groups. CRAiG marked beta, answers questions about data the user can see.
- Removed "alerted automatically" (first hour, escalation note, deputy) and "automatic resend". Back covers: "in seconds" removed; category named.

### Kit issues to report (shared files, not edited)
- Contents page overflows with the round 3 structure (11 entries; also on CC-01). Worked around in cp02 with a scoped style in `b.how` that reduces TOC row padding; remove it if the kit is fixed.
- ccextra IND["Property, Housing and Facilities"] readiness "good looks like" row 5 says "Awaab's Law and fire safety actions run as tasks": UK-only wording on a toolkit page.
