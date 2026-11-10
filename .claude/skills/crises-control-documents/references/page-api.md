# Page API (Crises Control kits)

All page methods append one A4 page (210 x 297 mm). `sec` is the running-header label. Text accepts inline HTML and the `S(n)` citation helper (`from cckit import CCBook, CCReport, S`).
The kits are built on a shared engine (pbkit, aikit, rkit). `CCBook.build()` re-skins everything into the Crises Control brand at build time; never build a Crises Control document with the base classes directly.

## Contents

1. Constructors, covers and back pages
2. Crisis page types (cckit)
3. Practical tools (ccprac)
4. Pages added automatically (ccextra, ccuse)
5. Inherited pages (B1 to B4)
6. Assets

## 1. Constructors, covers and back pages

- Playbook: `b = CCBook(short_title, NN, fig, industry, week)`; report: `r = CCReport(short_title, NN, fig, industry, week)`.
  `industry` must match a key in the industry tables (see SKILL.md, "Adding a new industry") to get the industry cover art, shared pages and tailored demo. `week` like "9 November 2026". `fig` is a Hairline figure, used when there is no industry art and on report figure pages.
- `b.how = "..."` one sentence for the contents page.
- Playbook cover: `b.art_cover(kicker, t1, t2, lede)`: dark cover with the dial motif, industry art, incident ticker, T+ strip.
- Report cover: `r.rep_cover(kicker, title_with_<br>, sub)`.
- `b.contents()`, `b.mark(num, title)` (before the first page of each contents entry; "" for front matter and Sources, "01" to "03" for parts).
- `b.foreword(title, paras)`: signed "The Crises Control team".
- `b.opener(num, word, line, items)`: dark part opener with dial.
- Last call, always: playbook `b.art_back(title, lede, "Request a demo", next_title="Intelligence report No. NN · <report title>")`; report `r.rep_back(title, lede, "Request a demo", companion="Crisis playbook No. NN · <playbook title>")`. Both become the industry demonstration CTA page (lifecycle demo steps, clickable link, QR code).

## 2. Crisis page types (cckit)

- `b.firsthour(ey, title, lede, rows, sec)`: T+ timeline. rows: `(time "T+00:05", heading, text, owner, sev 1-4)`; 7 to 9 rows.
- `b.severity(ey, title, lede, levels, sec)`: SEV ladder. levels: `(n 1-4, name, criteria, who is alerted, channels)`; industry-specific triggers.
- `b.messages(ey, title, lede, msgs, sec)`: message cards. msgs: `(channel "SMS"/"Push"/"Email"/"Voice", audience, text, note)`; 4 to 6. SMS shows a character count; keep SMS under 160 characters.
- `b.platform(title, lede, rows, sec="Where Crises Control fits")`: renders TWO dark pages (lifecycle, then the scenario flowing through modules). rows: `(outcome, module)` (outcome text FIRST, module name second) 6 to 7, one per module in lifecycle order: SOS, Ping, Incident Manager, Task Manager, Control Centre, Audit & Reporting, optionally CRAiG. Outcome under ~22 words, written for this industry's scenario. Title like "How the modules work together in a <industry> incident". Place it near the end.

## 3. Practical tools (ccprac)

- `b.raci(ey, title, lede, roles, rows, sec, note="")`: roles up to 6; rows `(activity, [R/A/C/I/"" per role])`, 8 to 11 rows.
- `b.escalation(ey, title, lede, levels, sec, note="")`: 4 levels `(name, trigger, who is alerted, who decides, escalate if)`. Colours rise from sky blue to red by severity.
- `b.swimlane(ey, title, lede, lanes, times, events, sec, note="")`: 4 to 5 lanes, 5 to 6 times; events `(lane idx, time idx, text under ~9 words, kind)` with kind `act` (action), `dec` (decision), `risk` (where it goes wrong), `mon` (how it is monitored).
- `b.tracker(ey, title, lede, rows, sec, note="")`: outstanding actions `(action, owner, due, status, how it is checked)`; status Done / In progress / Open / Overdue / Blocked; 7 to 9 rows.
- `b.exercise(ey, title, lede, meta, injects, sec, note="")`: tabletop exercise. meta 4 x `(label, value)` (Duration, Participants, Objective, Facilitator); injects 5 to 6 `(time, what happens, questions)`.
- `b.pir(ey, title, lede, sections, sec)`: post-incident review template, 8 `(heading, prompt)` boxes.
- `b.form(ey, title, lede, cols, sec, rows=8, example=None, note="")`: fill-in template. cols `[(label, relative width number e.g. 1.4)]`; `example` one filled row (tuple of strings).
- `b.depmap(ey, title, lede, centre, nodes, tolerance, sec, note="")`: dependency map. centre `(service, description)`; exactly 6 nodes `(category, items text)`; tolerance 3 to 4 `(label, value)`. Label tolerance values as illustrative.

## 3b. Standard structure pages (round 3)

- `b.execsum(title, challenges, risks, recs, good, support=None)`: one-page executive summary. Lists of short points: challenges 3, risks 4, recs 4 to 5, good 3 to 4 (each under ~22 words). `support` defaults to standard positioning lines.
- `b.regions(ey, title, lede, items, sec, note="")`: regional notes page. items 4 x `(region, what applies, in practice)` with region "United Kingdom", "United States", "European Union", "Middle East" (or "Middle East (UAE)"). Adds a "not legal advice" line.
- `b.toolkit_index(title=..., lede=None)`: index of the seven tools with live page numbers.
- `b.readiness()`: Toolkit 01, filled in at build time with the industry readiness assessment.
- `b.decisionlog(title, lede, example, rows=12, note="")`: Toolkit 03, standard columns Time, Decision, Options considered, Decided by, Rationale, Evidence or reference; `example` is one row tuple.
- `tool=True` on `raci`, `escalation`, `messages`, `exercise`, `pir`: stamps the standard toolkit eyebrow and running header. Use once each, inside Part 04.
- `b.platform(...)` now adds a third page, "What is standard, what is configured" (reports get it automatically).

## 4. Pages added automatically

At build time, for industries in the tables, `ccextra.add_pages` inserts and fixes the contents numbering:
- **Positioning** (dark): "Most organisations can send alerts. Few can manage incidents end-to-end.", the five failures, the lifecycle, the positioning statement. Playbooks: before the platform pages.
- **Use cases** from `crises-control/use_cases.xlsx`, with an evidence tag on every card (Customer example, Customer requirement, Intended use, Suggested application, Illustrative).
- **Readiness assessment** (8 areas scored 0 to 3, three bands) and **Buyer's guide** (8 questions). Playbooks: after the platform pages. Reports: all of these before Sources.
Do not write these pages yourself and do not duplicate them.

## 5. Inherited pages

These come from the shared engine and are re-skinned automatically. `intro`, `statement`, `questions`, `checklist`, `glossary` also work exactly as below: `b.intro(ey, title, lede, pts)` with 3 `(icon, heading, text)`; `b.statement(text, sub, sec)`; `b.questions(ey, title, lede, cols, sec)` with cols `(heading, [questions])`; `b.checklist(ey, title, lede, items, sec, note="")` with `(item, detail)`; `b.glossary(title, items)` with `(term, definition)`.

### B1. Body pages (all classes)

- `b.opener(num, word, line, items)`: dark part opener. `word` is the big title (use `<br>`), `line` one sentence, `items` = `(nn, chapter title)` x 3 or 4.
- `b.compare(ey, title, lede, heads, rows, sec)`: 3 columns; `heads` = 3 labels; `rows` = `(label, left, right)` x 5 to 6.
- `b.grid(ey, title, lede, cards, sec, note="")`: 2 x 2 cards `(icon, heading, text)`.
- `b.dive(n, icon, title, line, quads, sec, owner="")`: deep-dive on one action. `n` like "01"; `quads` = 4 x `(label, text)`, e.g. Why / How / Check / Pitfall.
- `b.steps(ey, title, lede, items, sec, note="")`: numbered `(heading, text)` x 5 to 6.
- `b.flow(ey, title, lede, stages, sec, foot="")`: vertical flow `(icon, heading, text)` x 4 to 5.

### B2. Essay, table and figure pages

- `b.essay(ey, title, paras, sec, pull="")`: two-column essay, 6 paragraphs (330 to 420 words) plus optional pull quote.
- `b.usecase(ey, title, cases, sec)`: 3 cases; each case `(icon, who e.g. "Housing association", case title, [(label, text) x 4])`, labels like The gap / The fix / Owner / Result. Answers under ~22 words.
- `b.table(ey, title, lede, heads, rows, sec, widths=None)`: `heads` 3 to 4 labels; rows 5 to 6; cells under ~18 words. `widths` e.g. `"34mm 1fr 1fr 1fr"`.
- `b.matrix(ey, title, lede, xl, yl, quads, sec)`: 2 x 2; `xl`/`yl` axis labels; `quads` = 4 x `(label, heading, text)` in order top-left, top-right, bottom-left, bottom-right; top-right is highlighted (put the "act now" quadrant there).
- `b.principles(ey, title, lede, items, sec)`: dark; `(heading, text)` x 5 to 6.
- `b.figpage(ey, title, lede, fig, items, sec)` : large Hairline figure + 4 `(heading, text)` items explaining how something works.
- `b.sources(items, note=None)` : `items` = `(n, "Publisher, title, date, URL")`. Must fit one page for playbooks (8 to 16 entries); reports may use two pages (split the list over two calls).

### B3. Report-only pages (CCReport)

- `b.summary(title, paras, bottom_line, sec="Executive summary")`: 4 paragraphs + a dark "bottom line" box.
- `b.findings(title, items, sec="Key findings")`: 6 to 7 `(heading, text)`.
- `b.facts(title, lede, items, sec)`: dark "at a glance"; 6 `(big figure, explanation ending with S(n))`.
- `b.timeline(title, lede, events, sec="Timeline")`: 6 to 9 `(date, heading, text)`.
- `S(1)`, `S(2, 3)`: citation superscripts. Number sources in order of first use.

### B4. Length guide and fixing problems

- Overflow reported by check.js: shorten the text on that page first; split into two pages only if the content earns it.
- A page that looks thin in the contact sheet: add substance (an example, a check, an owner), never padding.
- Two-column essays that overflow spill into an invisible third column; check.js reports this as "column overflow".
- Titles: `h2` titles over ~60 characters wrap to three lines and push content down; tighten them.

## 6. Assets

- Industry cover art (isometric line SVGs, dark and light): `crises-control/assets/ind/` finance, property, retail, transport, hospitality, healthcare. Generated by `crises-control/industry_art.py`.
- Hairline figures re-coloured to the brand (`crises-control/assets/hl/dark|light`): riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack. Choose ones RELEVANT to the point (hub/relay for alerting chains, phone for mobile alerts, cabinet/terminal for IT outages, drawer for records and regulation, padlock/vault for security, elevator for buildings, rail for transport, basket for retail).
- Icons: compass loop server storage transfer flask contract tag power broom bell laptop wrench shield recycle eye owner sliders truck check magnifier. Only these.
- Logo `crises-control/assets/cc-logo.svg`; fonts Roboto and Roboto Mono in `crises-control/assets/fonts`.
