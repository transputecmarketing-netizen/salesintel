# Notes 04: Transport and Logistics

Playbook: CC-04-Playbook-Keep-It-Moving.html (44 pages after round 3, 19 sources)
Report: CC-04-Report-The-Heathrow-Lesson.html (28 pages after round 3, 30 sources)

## Key verified facts
- North Hyde fire (NESO news, 1 Jul 2025):
  - The 275kV substation lost all supplies late on 20 Mar 2025.
  - Cause: a bushing failure, most likely from moisture. An elevated moisture reading from July 2018 was not acted on appropriately.
  - 66,919 customers were supplied directly by SSEN Distribution.
  - Losing one of Heathrow's three supply points cut power to some critical systems. Reconfiguring would take an estimated 10 to 12 hours.
  - NESO made 12 recommendations, and said "CNI facilities also have no priority within the electricity legal or regulatory framework".
- DESNZ government response (18 Nov 2025):
  - Maintenance protocols did not flag outstanding essential work.
  - The fire risk assessment had no site-level view.
  - There is no cross-sector requirement on CNI operators to keep running through power disruption.
- Ofgem opened an enforcement investigation into NGET on 2 Jul 2025. Opening it does not mean a breach has been found.
- Kelly Review (Heathrow, 28 May 2025):
  - The decision to close was right. Alternative choices would not have materially changed the outcome.
  - From the BCI: nearly all emergency power on the North Hyde supply would have been depleted, and the vulnerability was less well known outside the technical team.
  - From PA via The National: first F24 alert at 00:21, decision at 01:15, limited arrivals from 16:00, more than 270,000 passenger journeys disrupted. The CEO's phone was on silent, leading to the second means of contact recommendation. The report does not name individuals and refers only to "a senior leader".
- CAA review of the 28 Aug 2023 NATS failure (published 14 Nov 2024):
  - 34 recommendations and more than 700,000 passengers affected.
  - From PA: failure at 08:32, restrictions 11:00 to 18:03, and the engineer arrived 3 h 15 min after the failure began. The manufacturer was not contacted for more than 4 hours. Some organisations heard about the failure from the media.
- NATS, 8 Sep 2026:
  - The cause was a software defect (NATS preliminary report, 18 Sep 2026).
  - The CAA says more than 2,000 flights were delayed, cancelled or diverted. The CAA set the review scope on 25 Sep 2026, with the final report due by 8 Mar 2027.
- Collins Aerospace MUSE:
  - Disruption began on the evening of 19 Sep 2025. Brussels asked airlines to cancel about half of the 276 departures on Monday (AP).
  - ENISA confirmed ransomware on 22 Sep.
  - The NCA arrested a man in West Sussex on 23 Sep.
- JLR:
  - Phased restart from 8 Oct 2025. The supplier early-payment financing accelerates payment by up to 120 days.
  - £1.5bn loan guarantee announced on 28 Sep 2025.
  - The CMC put the UK cost at £1.9bn (range £1.6bn to £2.1bn), affecting more than 5,000 organisations, as a Category 3 event.
  - Cyber costs were £196m in Q2 FY26 and £64m in Q3. Production was back to normal by mid-November.
- Manchester ROC power loss on 6 Aug 2026: about 90 seconds, and backup did not start in time (UPI).
- Channel Tunnel power failure on 30 Dec 2025 (AFP).
- NIS Regulations reg 11: notification within 72 hours. The CSRB factsheet (updated 3 Nov 2026) proposes 24 hours, then a full report. The Bill was still before Parliament.
- HSE:
  - Lone working guidance says employers "must monitor your lone workers and keep in touch with them".
  - 2025/26 provisional figures: 126 worker deaths, 15 of them in transportation and storage.

## Left out as unverifiable or out of scope
- Exact time the North Hyde fire started (press reports differ), and flight counts for 21 Mar 2025 (estimates vary from 1,300 to 1,351).
- The full Kelly Review text, which could not be fetched. The recommendation count (reports say about 20 or 28) is not stated.
- Fire suppression status at North Hyde (reported as inoperable since 2022). Not checked against the NESO PDF, which was too large to fetch.
- Outcome of the Ofgem investigation, and whether all 34 CAA 2023 recommendations are closed (secondary sources conflict).
- Attribution of the Collins attack to a named group, and the ransomware strain.
- CSRB Commons stage and Royal Assent timing (Parliament site blocked).
- NATS 2026 cancellation totals beyond the CAA's "more than 2,000 flights".

## Round 2 revision (BRIEF2)
- New pages: network escalation levels (escalation), roles matrix with 6 roles and 11 rows (raci), hub power loss swimlane (Drivers, Hub and depots, Network control, Suppliers and partners, Customers and passengers), missed check-in escalation with times T+0/10/20/30 (escalation, replaces the old welfare flow page; HSE citations kept), driver and lone worker check-in log (form), partner and supplier notification log (form), tabletop exercise (planning system supplier cyber attack at night), outstanding actions tracker (morning after the hub power loss), post-incident review template (pir).
- Scenarios page rewritten around where it goes wrong, who decides and how it is monitored.
- Platform rows rewritten as 7 lifecycle outcomes (SOS to CRAiG); "Audit & Reporting" used; CRAiG limited to current capability (finding information).
- No new facts added; all 14 sources and citations unchanged. All times, roles and tracker items are labelled illustrative.

## Round 3 revision (BRIEF3: international, evergreen, standard toolkit)
- No retitles. "Keep it moving" and "The Heathrow lesson" are not tied to one country's law; Heathrow is labelled a UK case study.
- Playbook restructured to the standard order: Foreword, Executive summary, Introduction (narrative in the lede), 01 Before it hits (essay, six disruptions, two regions pages, readiness steps), 02 Incident scenarios (severity, first hour, swimlane, three scenarios, tracker), 03 Respond and recover (missed check-in escalation as an extra tool with tool=False, driver check-in log, rerouting, partners, partner notification log, week/month/quarter plan), 04 Practical toolkit (index, readiness, RACI, decision log with a hub power loss example, network escalation, six messages, tabletop exercise, PIR), questions/checklist/glossary, platform, sources.
- Contents has eleven entries, which overflowed the kit's TOC page; cp04 tightens row padding on its own instance only (kit not edited).
- Neutral wording: 999 replaced by "emergency services"; Met Office by "official weather warnings"; HSE line labelled "United Kingdom"; regulator message note points to the regional notes; time-bound "before winter" wording removed.
- Dropped from the playbook to keep sources on one page: Transport Scotland (Storm Eowyn) and HSE fatal injury statistics (both still in the report).

### Verified regional facts (primary sources read)
- UK: GOV.UK responder guidance: category 2 responders ("co-operating bodies", e.g. transport companies) have a lesser set of duties centred on co-operating and sharing information; local resilience forums. CCA 2004 Sch 1 Part 3 lists rail licence holders, TfL/LU, airport operators, harbour authorities, strategic highways company (read, not cited). NIS Regs Sch 1: competent authority for transport is the Secretary of State for Transport (air jointly with the CAA) (read, not cited).
- US: 49 CFR 390.23 (eCFR, 1 Oct 2026 version): HOS relief for direct emergency assistance (30 days presidential, 14 days regional, 5 days local); driver who needs immediate rest gets at least 10 consecutive hours off duty. TSA SD 1580-21-01E and 1582-21-01E (memo 9 Jan 2026): effective 16 Jan 2026 to 15 Jan 2027; report cyber incidents to CISA no later than 72 hours after identification (NOT 24 hours, as older secondary sources say); 24/7 cybersecurity coordinator; incident response plan exercised at least annually.
- EU: NIS2 Annex I transport (air, rail, water, road); Art 23: early warning 24 h, notification 72 h, final report one month; Art 41 apply from 18 Oct 2024. CER Annex transport (air, rail, water, road, public transport); Art 6: identify critical entities by 17 Jul 2026; Art 12 risk assessment within nine months of notification; Art 13 measures incl. crisis management and alert routines; Art 15 initial notification 24 h, detailed report within one month.
- UAE: AE/SCNS/NCEMA 7000:2021 clause 1.6 "applicable to all UAE entities"; 8.5.2 response structure (command and control, detection and immediate response, communication during disruptions...); 8.6.2 exercises at planned intervals.
- Saudi Arabia: NCA ECC-2:2024 scope: government entities and private entities owning, operating or hosting CNI; 2-13 incident response plans, escalation, classification, reporting to the NCA.
- Not included (not verified): GCAA and Saudi TGA incident rules, Qatar, CIRCIA final rule status, ORR-specific duties.
