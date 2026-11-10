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

## Playbook recipe (34 to 40 pages)

art_cover, contents, foreword, intro, statement, three parts (each `mark` + `opener`, then a varied mix), questions, checklist, glossary, `platform()` (two pages, near the end), `mark("", "Sources")` + sources (one page), `art_back` (last call; becomes the demo CTA).

Every playbook must include, written for its industry:
- one `firsthour()` (realistic T+ timeline of the industry's worst day) and one `swimlane()` for the same scenario showing actions, decisions, where it goes wrong and how it is monitored
- one `severity()` ladder with industry triggers and one `escalation()` workflow
- one `raci()` roles and responsibilities matrix (decision rights: who closes, who switches to fallback, who speaks to media)
- one `messages()` page: 4 to 6 ready-to-send templates for staff, customers/residents/passengers/patients/guests, regulators, suppliers, a media holding line
- at least two industry checklists or fill-in `form()` templates
- one `exercise()` tabletop, one `pir()` post-incident review, one `tracker()` outstanding actions board
- at least one essay, one usecase page with 3 scenarios that name failure points, decision owners and monitoring, one table, and a week / month / quarter plan with owners
- industry specifics (e.g. `depmap()` with impact tolerance for financial services; non-responders and assistance registers for housing; store / region / head office for retail; driver check-ins for transport; shift roles and multi-venue for hospitality; downtime procedures and clinical / digital / partner coordination for healthcare)

The positioning page, use cases, readiness assessment and buyer's guide are **inserted automatically**; do not write them.

## Report recipe (24 to 30 pages)

rep_cover, contents, summary (bottom line), findings (6 to 7), facts (6 sourced figures), timeline (6 to 9 dated events), 2 to 3 analysis parts (opener, essays with citations, tables, figpage, compare / matrix), "What it means for UK organisations in <industry>", recommendations, questions for the board, glossary, sources (15 to 30, two pages allowed), rep_back (becomes the demo CTA). Shared pages are inserted before Sources automatically.

## Brand (official brand sheet)

Ink `#0B223C`, panel navy `#0A3165`, blue `#1179BB`, sky `#16A1ED`, accent blue `#2D9CFA`, red `#FF0000` (alarm accent only), light `#F7F6F8`, text grey `#3A3A3A`. Roboto, with Roboto Mono for timestamps and labels. The motif is the dial from the Crises Control badge: a ring of ticks, a blue arc, a red sector, and the T+ incident strip. Logo `cc-logo.svg`. All of this is applied by `CCBook.build()`; do not hand-code colours.

**Brand separation**: these are Crises Control documents only. Never mention Transputec anywhere (text, sources labels, footers, file names). The engine shares code with the Transputec kits and swaps the brand at build time, which is why you must always build through `CCBook` / `CCReport` and run `qa.py --brand cc`.

## Writing rules

1. **No em dashes or en dashes.** British spelling. Plain, confident, specific; not AI-sounding (avoid "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness", "landscape is evolving", "navigate the complexities", "robust", "seamless").
2. **Never invent** numbers, quotes, dates, names or legal duties. State legal requirements exactly as the law or regulator states them; label proposals, consultations and guidance as such. Label illustrative examples and tolerance values as illustrative.
3. **Never invent Crises Control statistics, customers or features.** Product descriptions come only from `MODULES` / `LIFE` in the kits and the use-case register. Illustrative use cases are never presented as customer deployments (the evidence tags handle this on the use-case page; keep the same honesty in your own text).
4. **CRAiG**: describe only current capability (helps users interact with the platform, retrieve information and assist with the incident). Never promise future features.
5. **No competitor names.** Never quote internal framework material (ICP tiers, pricing, packages, KPIs, competitor views).
6. Crises Control appears as the helpful partner on the platform pages, the auto-inserted pages, the closing CTA and lightly in CTAs. Everything else is vendor-neutral expertise. Location features are described "where supported".
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
- `references/framework.txt`: the full Company Operating Framework V4 text (internal; read sections 1 to 4, 7, 9 and 11; never quote internal sections).
- `references/use_cases.txt`: the use-case register in text form (the build reads `crises-control/use_cases.xlsx`).
- `references/examples/`: cp01, cr01, cp06 as built and delivered.
- `references/writer-brief.md`: template for parallel writers.
