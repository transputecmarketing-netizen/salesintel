# Crises Control industry series: brief for writers

Crises Control (crises-control.com, operated by Transputec Ltd) is an incident management platform for operational resilience: mass alerting, coordination, task execution, live visibility and audit reporting. Each week it publishes, for one industry, a CRISIS PLAYBOOK and an INTELLIGENCE REPORT as downloadable lead magnets. Readers: UK (and some international) leaders in resilience, business continuity, security, operations, risk and compliance. The client has asked for stunning design and PERFECT content: accurate, specific, genuinely useful, beautifully written.

## Files
Working dir: /home/user/salesintel/brand-samples/linkedin-nov/playbooks
- Template: `cckit.py` (classes CCBook for playbooks, CCReport for reports, helper S(n)). It builds on `rkit.py`, `aikit.py` and `pbkit.py`. READ ALL FOUR FULLY. CCBook/CCReport have every page type from those kits PLUS four crisis page types: `firsthour()` (T+ incident timeline with owners and severity dots), `severity()` (SEV1 to SEV4 ladder), `messages()` (alert templates as message cards; SMS shows a character count, keep SMS under 160 characters), `platform()` (where Crises Control modules fit; uses only the module names in MODULES).
- Reference for depth and tone: `hot/hp01.py` (playbook) and `hot/hr01.py` (report). Read both fully.
- Write ONLY `cc/cpNN.py` (playbook) and `cc/crNN.py` (report), each with `build()` returning the book, and notes in `cc/notes_NN.md`. Touch no other files; other writers work in parallel.
- Build: `python3 build_cc.py cpNN crNN`. QA: `node check.js <both HTML files>` must print OK. ALSO render and LOOK at every page: `node hpdf.js <html>` writes pdf/<name>.pdf; then `pdftocairo -png -r 30 pdf/<name>.pdf <scratch dir>/<prefix>` and read the images; fix any overlap, crowding, empty half-pages or awkward breaks (check.js misses boxes that touch the footer). Put screenshots in your own scratch directory, never in the repo. Do not git commit.

## Constructors
- Playbook: `CCBook(short_title, NN, fig, industry, week)`; report: `CCReport(short_title, NN, fig, industry, week)`. Use the fig names given in your task (hairline figures re-coloured for Crises Control). For figpage() choose RELEVANT figures from: riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack.
- Playbook cover: `b.art_cover(kicker, t1, t2, lede)`; back: `b.art_back(title, lede, "Request a demo", next_title=<the report title, e.g. "Intelligence report No. 01 · Resilience, regulated">)`.
- Report cover: `r.rep_cover(kicker, title_with_<br>, sub)`; back: `r.rep_back(title, lede, "Request a demo", companion=<"Crisis playbook No. 01 · ...">)`.

## Research first (thoroughly)
- WebSearch (mode "extended" for news and regulation) and WebFetch. Today is 9 November 2026. Your training data is older; verify everything now.
- Use primary sources: legislation.gov.uk, gov.uk, Parliament, regulators (FCA, PRA, ICO, HSE, SIA, Building Safety Regulator, Housing Ombudsman, NHS England, CQC, ORR, CAA, DfT), official inquiry reports, company statements, NCSC, reputable press (BBC, Reuters, FT, The Guardian, The Register).
- Never invent numbers, quotes, dates, names or legal duties. State legal requirements exactly as the law or regulator states them; label proposals, consultations and guidance as such. Leave out what you cannot verify.
- Never invent Crises Control statistics or customers. Product descriptions come only from MODULES in cckit.py.

## Playbook (22 to 25 pages)
art_cover, contents, foreword, intro, statement, three parts (mark+opener, then a varied mix), questions, checklist, glossary, platform() page (one, near the end: map 5 to 7 of your playbook's steps to modules), mark("", "Sources") + sources() (one page, every source cited with S(n)), art_back.
Must include: one firsthour() page (a realistic T+ timeline for this industry's worst day), one severity() page (industry-specific triggers), one messages() page (4 to 6 ready-to-use templates for real audiences: staff, customers or residents or passengers or patients, regulators, suppliers, media holding line), at least one essay, one usecase page with 3 scenarios, one table, a week/month/quarter plan with owners.

## Report (20 to 24 pages)
rep_cover, contents, mark+summary (bottom line), mark+findings (6 to 7), facts (6 sourced figures, each with S(n)), timeline (6 to 9 dated events), 2 to 3 parts (mark+opener; essays with citations, tables, figpage, compare/matrix), "What it means for UK organisations in <industry>", recommendations (steps or principles), questions for the board, glossary, mark("", "Sources") + sources() (15 to 30 sources; numbered in order of first use; two pages allowed), rep_back.

## Hard rules
1. NO em dashes or en dashes anywhere. British spelling. Plain, confident, specific; not AI-sounding (avoid "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness", "landscape is evolving", "navigate the complexities", "robust", "seamless").
2. Accuracy over drama; balanced; do not name or blame individuals.
3. Crises Control appears as a helpful partner only on the platform() page, the closing pages and lightly in CTAs; the rest is vendor-neutral, practical expertise.
4. Short, hooky cover titles (two short lines).

Report back briefly: both HTML filenames, page counts, check.js results, that you visually checked every page, number of sources, and facts left out as unverifiable.
