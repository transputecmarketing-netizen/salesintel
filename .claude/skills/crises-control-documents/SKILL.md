---
name: crises-control-documents
description: Crises Control's design system for A4 crisis playbooks, intelligence reports and industry lead magnets (crises-control.com), rendered to print-quality PDF with the official brand sheet, the dial motif, industry cover art, practical crisis tools (RACI, escalation, swimlane, tabletop exercise, post-incident review, templates) and a demo CTA with QR code. Use this whenever the user asks for anything for Crises Control, such as a crisis or incident playbook, an industry report, a weekly industry pack, a business continuity or operational resilience guide, a lead magnet or e-book, even if they just say "do the next week for crisis control" or "make one for the energy sector". Do NOT use it for Transputec documents (use transputec-documents).
---

# Crises Control documents

Crises Control (crises-control.com) publishes, one industry per week, a **crisis playbook** and an **intelligence report** as downloadable lead magnets for UK (and some international) leaders in resilience, business continuity, security, operations, risk and compliance. The six delivered so far (Financial Services and Insurance, Property Housing and Facilities, Retail, Transport and Logistics, Hospitality, Healthcare) were built with this engine.

The documents have three jobs, and every page should serve at least one:
1. **Lead generation**: readers trade their details for something genuinely useful, then book a demo.
2. **Commercial positioning**: Crises Control is an **Operational Incident Coordination Platform**, not a mass notification tool.
3. **Educational value**: practical tools a resilience lead can use on Monday.

## Workflow

1. **Set up the engine** (once per project folder): `bash <this skill>/scripts/new_project.sh <project folder>`, then work inside `<project folder>/studio/docs`. Keep the layout: the kits resolve brand assets through `../../crises-control/assets`.
2. **Read** `references/framework-rules.md` (the positioning rules, distilled from the Company Operating Framework V4) and one example fully: `references/examples/cp01.py` (playbook), `cr01.py` (report), `cp06.py` (healthcare playbook). Page reference: `references/page-api.md`.
3. **Research** (below). Notes with URLs in `content/notes_<NN>.md`.
4. **Write** `content/cp<NN>.py` and `content/cr<NN>.py`, each with `build()` returning the book. Set `OUT = "CC-NN-Playbook-Short-Title"` (and Report) in each module.
5. **Build**: `python3 build.py content/cp<NN>.py content/cr<NN>.py`.
6. **QA**: `python3 qa.py <both html> --brand cc --sheets <scratch dir>`, then **open and look at every contact sheet**. qa.py checks overflow, dashes, AI-sounding phrases and any mention of Transputec; it cannot see crowding, boxes touching the footer, near-empty pages or a figure that does not fit. Fix and repeat until clean.
7. **Deliver** each week separately: `pdf/Crises-Control-Playbook-NN-<Industry>.pdf` and `Crises-Control-Report-NN-<Industry>.pdf` (rename from `pdf/`), in a week folder; for a set, also a combined PDF (`pdfunite`) and a zip with the weekly schedule.

For several industries at once, brief one writer agent per industry with `references/writer-brief.md`, then QA every result yourself.

## Audience and evergreen rule

Readers are in the **UK, US, Europe and the Middle East**. Write the operational guidance so it works anywhere; put law and regulation in clearly labelled regional material (`b.regions()` pages with United Kingdom, United States, European Union and Middle East cards, or short asides that start with the bold region name). Never imply that a UK regulation applies elsewhere; label UK material as UK. Every legal or regulatory claim is qualified (who it applies to, status: in force, proposed, guidance) and sourced. Healthcare is written for hospitals and health systems anywhere, with NHS terms only in UK-labelled text.

Documents are **evergreen**: covers carry no dates (the kit handles this), the text avoids "this week", "this month's", seasonal hooks, and the back matter shows "Last reviewed: <month year>" (set `REVIEWED` in `ccprac.py` when you review the series). Dated events are fine as case studies. Cover titles must not depend on one country's law.

## Playbook recipe (standard structure, 40 to 46 pages)

Every playbook uses the same structure so the series feels like one product:
1. art_cover, contents
2. `mark("", "Foreword")` foreword
3. `mark("", "Executive summary")` `execsum(title, challenges, risks, recs, good)`: one page covering the operational challenges, incidents and risks to prepare for, key recommendations, what effective incident coordination looks like, and how Crises Control supports the response
4. `mark("", "Introduction")` intro + statement (carry the narrative: most organisations can send alerts, few can manage incidents end-to-end)
5. `mark("01", <your title>)` context, regulation (`regions()` pages), industry analysis (e.g. `depmap()` for financial services)
6. `mark("02", "Incident scenarios")` (fixed title): severity, firsthour, swimlane, a usecase page with 3 scenarios (failure point, who decides, how it is monitored), tracker
7. `mark("03", <your title>)` response and recovery, the week / month / quarter plan with owners, at least two industry checklists or `form()` templates
8. `mark("04", "Practical toolkit")` (fixed title), in this exact order: `toolkit_index()`, `readiness()`, `raci(..., tool=True)`, `decisionlog(title, lede, example)`, `escalation(..., tool=True)`, `messages(..., tool=True)`, `exercise(..., tool=True)`, `pir(..., tool=True)`. With `tool=True` the kit stamps the standard numbered names: Toolkit 01 Readiness assessment, 02 Roles and responsibilities matrix, 03 Incident decision log, 04 Escalation workflow, 05 Communication templates, 06 Tabletop exercise, 07 Post-incident review template. Use exactly these names in text; titles and content stay industry-specific.
9. `mark("", "Questions, checklist and glossary")` questions, checklist, glossary
10. `platform()` (now three pages: the lifecycle, the scenario through the modules, and "What is standard, what is configured")
11. `mark("", "Sources")` sources (one page), then `art_back()` last (becomes the demo CTA)

Positioning, use cases and buyer's guide are **inserted automatically**; the readiness assessment is filled in where `readiness()` is called. Do not write them yourself.

## Report recipe (26 to 32 pages)

rep_cover, contents, summary (bottom line), findings (6 to 7), facts (6 sourced figures), timeline (6 to 9 dated events), 2 to 3 analysis parts (opener, essays with citations, tables, figpage, compare / matrix) including at least one `regions()` page, "What it means for organisations in <industry>", recommendations, questions for the board, glossary, sources (15 to 40, two pages allowed; start the second note with "Sources continued"), rep_back (becomes the demo CTA). Positioning, the capability page, use cases, readiness assessment and buyer's guide are inserted before Sources automatically.

## Positioning (use consistently)

Category: **Operational Incident Coordination Platform**. Strategic narrative: **"Most organisations can send alerts. Few can manage incidents end-to-end."** Use both in introductions (narrative), product sections and closing pages; the kit already carries them on the positioning, platform, capability and CTA pages. Keep SEO terms where natural: incident management software, mass notification, emergency communication, business continuity.

## Brand (official brand sheet)

Ink `#0B223C`, panel navy `#0A3165`, blue `#1179BB`, sky `#16A1ED`, accent blue `#2D9CFA`, red `#FF0000` (alarm accent only), light `#F7F6F8`, text grey `#3A3A3A`. Roboto, with Roboto Mono for timestamps and labels. The motif is the dial from the Crises Control badge: a ring of ticks, a blue arc, a red sector, and the T+ incident strip. Logo `cc-logo.svg`. All of this is applied by `CCBook.build()`; do not hand-code colours.

**Brand separation**: these are Crises Control documents only. Never mention Transputec anywhere (text, sources labels, footers, file names). The engine shares code with the Transputec kits and swaps the brand at build time, which is why you must always build through `CCBook` / `CCReport` and run `qa.py --brand cc`.

## Writing rules

1. **No em dashes or en dashes.** British spelling. Plain, confident, specific; not AI-sounding (avoid "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness", "landscape is evolving", "navigate the complexities", "robust", "seamless").
2. **Never invent** numbers, quotes, dates, names or legal duties. State legal requirements exactly as the law or regulator states them; label proposals, consultations and guidance as such. Label illustrative examples and tolerance values as illustrative.
3. **Never invent Crises Control statistics, customers or features.** Every product claim follows `references/capabilities.md`: distinguish standard functionality, configured capabilities (plans, groups, targeting, escalation rules and timings, cascading) and third-party integrations (directory sync, SSO, the Teams app, monitoring triggers "where configured"). Never imply the platform detects incidents by itself or escalates without configured rules. Do not name Slack, ServiceNow or an API, or claim offline app use, geofencing or conference bridges, unless the client confirms them. Illustrative use cases are never presented as customer deployments (the evidence tags handle this on the use-case page; keep the same honesty in your own text).
4. **CRAiG** (beta): answers questions and summarises the customer's own incident data within each user's permissions. It does not decide, act, launch or detect incidents. Never promise future features.
5. **No competitor names.** Never quote internal framework material (ICP tiers, pricing, packages, KPIs, competitor views).
6. Crises Control appears as the helpful partner on the platform pages, the auto-inserted pages, the closing CTA and lightly in CTAs. Everything else is vendor-neutral expertise. Location is described "where available".
7. Do not name or blame individuals. Short, hooky two-line cover titles ("Within / tolerance.", "Keep it / moving.").

## Research

Your training data is older than current events and regulation. Use WebSearch (`extended` for news and regulation) and WebFetch. Prefer primary sources: legislation.gov.uk, gov.uk, Parliament, regulators (FCA, PRA, ICO, HSE, SIA, Building Safety Regulator, Housing Ombudsman, NHS England, CQC, ORR, CAA, DfT), official inquiry reports, company statements, NCSC; reputable press (BBC, Reuters, FT, The Guardian, The Register). Cite with `S(n)`, numbered in order of first use; every source appears on the sources page as "Publisher, title, date, URL".

## Adding a new industry

The six launch industries are fully wired. For a new one (e.g. "Education", "Energy and Utilities", "Manufacturing", "Public Sector"), add entries so the cover art, shared pages and demo CTA are tailored:
1. `cckit.py` `INDART`: map the industry to an art name; draw the isometric SVG in `crises-control/industry_art.py` (same style as the existing six, dark and light) and write it to `crises-control/assets/ind/{dark,light}/<name>.svg`. Without it the cover falls back to the Hairline `fig`.
2. `ccextra.py` `IND`: `short`, `example` (a sentence on why alerting alone fails in this industry), `good` lines and scenarios to bring. Without it the positioning, readiness and buyer's guide pages are skipped.
3. `ccprac.py` `DEMO` (title + 7 lifecycle steps in the industry's words) and `LANDING` (the matching crises-control.com page; check it exists). Without them a generic demo and the home page are used.
4. `ccuse.py` `MAP`, if the use-case register has rows for the industry under a different label.
Edit these in the project copy; if the user wants the new industry kept for future work, also update the skill's `engine/` copy.

## Reference files

- `references/page-api.md`: every page method and argument shape.
- `references/framework-rules.md`: positioning, lifecycle, pillars, failures, demo flow, language rules.
- `references/capabilities.md`: what the product does (standard / configured / integration) and what never to claim.
- `references/revision-brief-round3.md`: the brief used to bring the six playbooks to the current standard; reuse it as the writer brief.
- `references/framework.txt`: the full Company Operating Framework V4 text (internal; read sections 1 to 4, 7, 9 and 11; never quote internal sections).
- `references/use_cases.txt`: the use-case register in text form (the build reads `crises-control/use_cases.xlsx`).
- `references/examples/`: cp01, cr01, cp06 as built and delivered.
- `references/writer-brief.md`: template for parallel writers.
