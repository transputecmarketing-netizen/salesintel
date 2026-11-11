# Writer 03 notes: Retail, week of 23 November 2026

Outputs
- Playbook: CC-03-Playbook-Keep-the-Shutters-Up.html (38 pages after round 2), source cc/cp03.py, 14 sources
- Report: CC-03-Report-When-the-Tills-Go-Dark.html (24 pages), source cc/cr03.py, 27 sources over two pages
- Back pages cross-reference each other. check.js prints OK for both; every page rendered and inspected.
- No Transputec mentions; no en or em dashes.

Verified facts and where they come from
- M&S: cyber incident disclosed 22 April 2025; online orders paused 25 April for 46 days; access via staff at a third-party contractor (Reuters via Insurance Journal). £300m pre-mitigation estimate (FY25 results, 21 May 2025). Warehouse management systems disconnected, manual processes, stores traded throughout, online restored August 2025, £101.6m H1 costs, £100m insurance (interim results, 5 Nov 2025). £131.3m incident costs in FY26 (FY26 results).
- Co-op: at least £206m lost sales and £80m profit hit in H1 to 5 July 2025, £120m full-year expectation (Co-operative News, 25 Sep 2025). All 6.5m members' data taken, no financial data; NCA arrested four on 10 July 2025 (Food Manufacture, 18 Jul 2025).
- Ahold Delhaize: systems offline from 11 October 2026; Q4 net sales hit €200m to €250m and operating income €75m to €100m (company release, 4 Nov 2026). Albert Heijn online reopened 23 Oct, shelf label and loyalty scanner issues (Just Drinks).
- ASOS: unauthorised push notification 6 Oct 2026; credentials obtained by impersonating a trusted contact; names and contact details may be exposed, no cards or passwords (BleepingComputer). Shares fell as much as 15% intraday (Bloomberg via Insurance Journal).
- Refrigeration: CERT-FR alert CERTFR-2026-ALE-012 (12 Oct, updated 13 and 16 Oct). About 700 French supermarkets, €270,000 Alsace losses, Danfoss end-of-life statement (SecurityWeek). Second wave 2 Nov: Belgium, Sweden, Ireland (Le Monde Informatique); 13 SuperValu stores (RTÉ); UK meat suppliers and a wholesaler, NCSC says impact minimal, no UK supermarket confirmed (The Record, Retail Gazette). US joint advisory 5 Nov (Help Net Security).
- BRC Crime Report 2026 (24 Feb 2026, period Sep 2024 to Aug 2025): 1,617 a day, 590,000 a year, 118 a day physical, weapons 68 to 36 a day, 15% reported to police, 55% of physically violent incidents reported, 455 a day in 2019 to 2020. Usdaw survey of 9,481: 77% abused, 53% threatened, 10% assaulted.
- Crime and Policing Act 2026 (c. 20): Royal Assent 29 April 2026. s.45 assault of retail worker is prospective (not in force) on legislation.gov.uk as at 7 Nov 2026; summary only, up to six months (51 weeks after CJA 2003 s.281(5) commences). s.46 duty to make a criminal behaviour order; s.47 shop theft triable either way.
- Martyn's Law: Royal Assent 3 April 2025; implementation period at least 24 months; not yet in force. Standard tier 200 to 799 (notify SIA; evacuation, invacuation, lockdown, communication); enhanced 800+. Penalties up to £10,000 (standard) and £18m or 5% of worldwide revenue (enhanced). Shops are a Schedule 1 use.
- FSA: chilled food at 8°C or below is a legal requirement in England, Wales and Northern Ireland.

Left out as unverifiable or conflicting
- Any confirmed commencement date for s.45 or for Martyn's Law duties (none published; "spring 2027" only in secondary sources).
- Co-op later trading update figures (£285m revenue, £107m profit): announcement date and full text not confirmed.
- Any total count of UK organisations hit by the refrigeration attacks; the attacker's Snowflake claim against ASOS; attribution for any incident.
- Exact November CERT-FR updates (none found after 16 October).
- Named individuals' quotes deliberately not used.

Illustrative content
- The first-hour timeline and the three usecase scenarios are labelled illustrative; they are not real customers or events.

Round 2 revision (BRIEF2, 10 November 2026)
- Playbook now 38 pages; check.js OK; every page rendered and inspected. No redesign, no existing sourced fact changed, no new sources.
- New pages: RACI (Store manager, Regional manager, Head office incident lead, IT and security, Comms, Loss prevention); decision rights table (close a store, switch to cash, take systems offline, speak to media, evacuate or lock down, take chilled stock off sale, notify regulators and insurers); four-level escalation workflow (store, region, head office, executive crisis team); multi-store swimlane for the Black Friday scenario (stores, regional managers, head office lead, IT and payments, comms; risk, decision and monitoring marked); outstanding actions tracker at 11:00; store status log form; cold-chain quarantine record form (reuses the FSA 8°C citation); tabletop exercise (six injects); post-incident review template.
- Platform rows rewritten as seven lifecycle outcomes (SOS to CRAiG), using "Audit & Reporting"; CRAiG described only as helping the team find information.
- Scenario cards now explain where it goes wrong, who decides and how it is monitored; first-hour lede and the T+00:10 row name escalation of silent stores.
- Escalation times (10 and 30 minutes), the exercise, tracker, swimlane and form examples are suggestions or illustrative and labelled as such; no new statistics.

Round 3 revision (BRIEF3, 10 November 2026)
- Playbook CC-03-Playbook-Keep-the-Shutters-Up.html: 45 pages, 20 sources on one page. Report CC-03-Report-When-the-Tills-Go-Dark.html: 31 pages, 38 sources on two pages. No retitles. check.js OK for both; every page rendered and inspected.
- Playbook restructured to the standard order: foreword, executive summary, introduction (statement carries the alerts vs end-to-end narrative), 01 Ready for peak (essay, six threats, two regions pages, decision rights), 02 Incident scenarios (severity, first hour, swimlane, three scenarios incl. a late-night Ramadan outage, tracker, store status log), 03 Respond and recover (violence steps, four protective procedures with UK/US asides, cold-chain flow and record, peak readiness, plan), 04 Practical toolkit (index, readiness, RACI, decision log, escalation, six messages incl. regulator notice, exercise, PIR), questions/checklist/glossary, platform, sources, back.
- Removed from playbook to fit 20 sources: Co-op figures, ASOS citation, Retail Gazette, Just Drinks shelf-label detail, Crime and Policing Act s.45 (all remain in the report).
- Verified regional sources (primary text checked unless noted): UK GDPR Art 33 on legislation.gov.uk (from 30 Sept 2026 the text names the Information Commission, via S.I. 2026/386); EU GDPR Arts 33/34 (text checked via gdpr-info.eu mirror; EUR-Lex blocked automated access); FTC breach response guide (all states, DC, PR, VI have laws); PCI DSS 12.10.1 wording from a PCI SSC-hosted presentation (official standard PDF not reachable); UAE PDPL via DLA Piper summary (Executive Regulations not published as at Jan 2025; 2026 secondary sources say still unpublished); Saudi PDPL via Clyde & Co, 8 Oct 2026 (in force 14 Sept 2023, enforceable 14 Sept 2024, 72h where harm likely, draft amendment consultation 6 Oct to 5 Nov 2026); FDA Food Code 2022 3-501.16 (5°C/41°F, model code; 2026 edition now latest); Reg 852/2004 Annex II Ch IX (text via legislation.gov.uk retained copy, cited to EUR-Lex); Dubai Municipality Food Code 2013 (5°C / 60°C); 29 CFR 1910.38 on eCFR; Visa Ramadan 2024 analysis (March 2025); Khaleej Times on White Friday (21 Nov 2025).
- Not used (unverified): Saudi/other GCC food temperature limits; UAE Ramadan spending totals; any OSHA workplace violence standard; GCC equivalents of Martyn's Law.
- Product claims changed: "alert every store in seconds" removed; SOS described as press-and-hold for colleagues at risk with location where available; escalation "under rules you configure"; Control Centre shows acknowledgements, chosen responses and tasks (no claim it knows trading status); CRAiG (beta) answers questions within user permissions; "ICO" in platform row replaced by "regulators"; checklist no longer says "chased automatically".
- Kit issues: (1) cckit._html prefixes a <style> to the "__TOC__" page, so pbkit.html no longer swaps in the contents (literal __TOC__ printed). cp03 carries a no-op-when-fixed shim. (2) ccextra IND["Retail"]["good"] mentions "the ICO" (UK-only). (3) Sources override note drops the "not legal advice" line if a writer passes a custom note.
