# Crises Control: revision brief, round 3 (international, evergreen, standard toolkit)

The client is happy with design and depth. NO redesign. You revise ONE industry: the playbook `cc/cpNN.py` AND the report `cc/crNN.py`, plus notes in `cc/notes_NN.md`. Touch no other file. Today is 10 November 2026.

## Read first
1. This brief, fully.
2. `cc/CAPABILITIES.md` (what the product does: standard / configured / integration). Product claims must follow it exactly.
3. `ccprac.py` from the line `# ==== round 3` to the end (new page types), `cckit.py`, `ccextra.py`. Older page types: `rkit.py`, `aikit.py`, `pbkit.py`.
4. Your current `cc/cpNN.py`, `cc/crNN.py`, `cc/notes_NN.md`.

## 1. International relevance (UK, US, Europe, Middle East)
The audience is no longer UK-only. Readers are in the UK, the US, the EU/Europe and the Middle East (mainly GCC: UAE, Saudi Arabia, Qatar).
- Make the main operational guidance jurisdiction-neutral: roles, timelines, scenarios, templates and checklists must work anywhere. Replace UK-only terms in general guidance with neutral ones (for example "your regulator" or "the authorities", "emergency services", "health system"), unless the text is explicitly about the UK.
- Where regulation differs, use clearly labelled regional sections: `b.regions(ey, title, lede, items, sec)` with four cards: "United Kingdom", "United States", "European Union", "Middle East" (you may write "Middle East (UAE)" etc.). At least ONE regions page in the playbook and ONE in the report; add a second where the industry has two distinct regulatory topics (e.g. operational resilience AND incident reporting). Shorter regional asides inside other pages must start with the region name in bold, e.g. "<b>United States:</b> ...".
- Never imply a UK regulation applies elsewhere. UK material (FCA/PRA, Building Safety Act, Martyn's Law, NHS EPRR, etc.) stays where it is useful but is labelled UK.
- Research the equivalents properly (WebSearch "extended", WebFetch, primary sources: regulators, official journals, eur-lex.europa.eu, ecfr.gov / federalregister.gov, government and regulator sites in the UAE, Saudi Arabia, Qatar). Examples to check, not to assume: EU DORA, NIS2, CER Directive, GDPR breach notification; US FFIEC guidance, SEC cyber incident disclosure, CMS Emergency Preparedness Rule, Joint Commission emergency management standards, OSHA emergency action plans, NFPA standards, TSA directives, FTA/FRA/FMCSA; GCC: UAE NCEMA business continuity standard (AE/SCNS/NCEMA 7000), UAE Central Bank, Saudi Central Bank (SAMA) business continuity rules, Saudi NCA controls, Dubai Health Authority / Abu Dhabi DoH, Saudi MOH and CBAHI, Qatar Central Bank. Only state what you verify, cite with S(n), and qualify: "applies to ...", "in force from ...", "proposed", "guidance, not law".
- Every legal or regulatory claim: qualified (who it applies to, status) and sourced. The kit adds a "not legal advice" line to regions pages and the sources page; do not remove it.
- Sources page: playbook sources must still fit ONE page (shorten entries, 12 to 20). Reports may use two sources pages.

## 2. Evergreen
The covers no longer show dates (done in the kit). Remove time-bound wording from text: "this week", "this month's", "last month", "the coming winter", "November", "ahead of December". Dated events (e.g. "On 20 October 2026 ...") are fine as case studies. Use "this quarter" only in the week/month/quarter plan sense. If a cover title is tied to one country's law (e.g. "Ready for Martyn's Law", "The Protect Duty"), retitle it with a short, hooky, international two-line title and update `next_title` / `companion` labels in BOTH files to match. Keep the `CCBook(...)` week argument as it is (it is no longer printed).

## 3. Executive summary (playbook only)
Directly after the foreword: `b.mark("", "Executive summary")` then
`b.execsum(title, challenges, risks, recs, good, support=None)`: one page. challenges 3 points, risks 4 points (incidents and risks to prepare for), recs 4 to 5 points, good 3 to 4 points (what effective incident coordination looks like), each under ~22 words. `support` (how Crises Control supports the response): leave None for the standard text, or give 2 short lines specific to your industry that follow CAPABILITIES.md. It must fit one page: check the render.

## 4. Standard structure and Practical toolkit (playbook)
Use exactly this order and these contents entries (part titles 01 and 03 are yours; 02 and 04 are fixed):
1. art_cover, contents
2. `mark("", "Foreword")` foreword (3 paragraphs; first paragraph may open on a real incident)
3. `mark("", "Executive summary")` execsum
4. `mark("", "Introduction")` intro + statement. The intro lede or the statement must carry the narrative in your own words: most organisations can send alerts; few can manage incidents end-to-end.
5. `mark("01", "<your title>")` opener, then the context: essays, regions page(s), duties, depmap or industry analysis
6. `mark("02", "Incident scenarios")` opener, then severity, firsthour, swimlane, a usecase page with 3 scenarios (each naming the failure point, who decides and how it is monitored), tracker. Healthcare: this part must be clearly identifiable as the incident scenarios section (it is, by this title) and cover at least three distinct scenarios (e.g. cyber or IT downtime, mass casualty / surge, utility or building failure).
7. `mark("03", "<your title>")` opener, then response and recovery guidance, the week/month/quarter plan with owners, and industry-specific checklists / forms (you need at least two industry templates or checklists across the document; they may sit here)
8. `mark("04", "Practical toolkit")` then, in EXACTLY this order:
   `b.toolkit_index()`
   `b.readiness()` (Toolkit 01, filled automatically)
   `b.raci(..., tool=True)` (Toolkit 02, Roles and responsibilities matrix)
   `b.decisionlog(title, lede, example)` (Toolkit 03, Incident decision log; example = (time, decision, options considered, decided by, rationale, evidence), industry-specific)
   `b.escalation(..., tool=True)` (Toolkit 04, Escalation workflow)
   `b.messages(..., tool=True)` (Toolkit 05, Communication templates; 4 to 6 for staff, customers/residents/passengers/patients/guests, regulators, partners/suppliers, media)
   `b.exercise(..., tool=True)` (Toolkit 06, Tabletop exercise)
   `b.pir(..., tool=True)` (Toolkit 07, Post-incident review template)
   With `tool=True` the kit sets the standard eyebrow ("Toolkit 02 · Roles and responsibilities matrix") and running header; your `ey`/`sec` arguments are ignored, your title and content stay industry-specific. Do not call these with tool=True anywhere else. Extra industry tools (e.g. a second escalation for missed driver check-ins, a resident assistance register) stay in Part 02 or 03 with tool=False and plain names.
   Your old "Decision log" form becomes the decisionlog; remove duplicates.
9. `mark("", "Questions, checklist and glossary")` questions, checklist, glossary
10. `b.platform(...)` (two pages; rows must follow CAPABILITIES.md)
11. `mark("", "Sources")` sources
12. `b.art_back(...)` last
Positioning, use cases and buyer's guide are inserted automatically. Target 38 to 46 pages. Trim weaker pages if needed; keep the research-backed essays.
Use these resource names everywhere in your text (no synonyms): Readiness assessment, Roles and responsibilities matrix, Incident decision log, Escalation workflow, Communication templates, Tabletop exercise, Post-incident review template.

## 5. Positioning
Category: Operational Incident Coordination Platform. Narrative: "Most organisations can send alerts. Few can manage incidents end-to-end." Use this language (exact category name) wherever your text introduces Crises Control: intro/statement (narrative only, vendor-neutral), platform title/lede, art_back / rep_back text. Keep SEO terms where natural, e.g. "incident management software", "mass notification", "emergency communication", "business continuity". Do not call Crises Control "just" a notification tool.

## 6. Product accuracy
Check EVERY mention of Crises Control, its modules and capabilities in both files against CAPABILITIES.md:
- Distinguish standard functionality, capabilities that are configured (escalation rules, repeat notifications, groups, location targeting, templates and plans, location sharing where supported by device and settings) and third-party integrations (Microsoft Teams, Slack, directory sync, monitoring tools and other systems, only "where configured").
- Never imply the platform detects incidents by itself. Incidents are raised by people (SOS, app, web) or, where integrations are configured, by connected systems.
- Never imply unconfigured automation ("automatically escalates" becomes "escalates on no response, under the rules you configure").
- CRAiG: current capability only.
- No competitor names, no invented customers or statistics.

## 7. Reports (crNN)
- International: retitle "What it means for UK organisations" to "What it means for organisations in <industry>" with region-neutral guidance, and add at least one regions page. UK case studies stay, labelled as UK. Facts and timeline items that are UK-specific must say so.
- Evergreen wording; cover date removed by the kit; keep the dated events.
- Positioning and product accuracy as above. The shared pages are inserted automatically.

## Rules (unchanged)
No em or en dashes. British spelling. Crises Control name only, never Transputec. Not AI-sounding. No individuals named or blamed. Illustrative content labelled illustrative. Never invent numbers, quotes, dates, legal duties.

## Build and QA
`python3 build_cc.py cpNN crNN` then `node check.js <both html>` must print OK. Then `node hpdf.js <html>`; render every page (`pdftocairo -png -r 30 pdf/<name>.pdf <your scratch dir>/p`) and LOOK at every page; fix overlap, crowding, text touching the footer, near-empty pages, and check the executive summary and the toolkit index fit. If you retitled, the HTML filename changes; delete your old HTML and PDF only (your own number). Scratch files only in your scratch dir. Do not commit. Do not edit shared .py files; report kit bugs.

Report back (under 250 words): HTML names, page counts, check.js results, confirmation you viewed every page, regional frameworks added per region (with source numbers), retitles, product claims you changed, anything you could not verify.
