# Crises Control playbooks: revision brief (round 2)

The client is happy with the direction, design and content. NO redesign. Improve the existing playbook in your file `cc/cpNN.py` (the companion report `cc/crNN.py` is NOT to be edited; it gets shared updates automatically).

## Read first
1. `/home/user/salesintel/brand-samples/crises-control/framework.txt` — the Crises Control Company Operating Framework V4. Read Sections 1 to 4, 7, 9 and 11 closely. Language rules from it:
   - Crises Control is an **Operational Incident Coordination Platform**, not a mass notification system. Core line: "Most organisations can send alerts. Few can manage incidents end-to-end."
   - Lifecycle: SOS (escalate) → Ping (start/alert) → Incident Manager (coordinate) → Task Manager (execute) → Control Centre (operate/visibility) → Audit & Reporting (prove) → CRAiG (assist). Use the name "Audit & Reporting" (MODULES key "Audit Trail" is an alias and still works).
   - Five common failures: fragmented information, delayed decision making, uncoordinated response, lack of visibility, lack of accountability. Four pillars: alerting and activation, operational coordination, execution and visibility, proof and accountability.
   - CRAiG: describe ONLY current capability (helps users interact with the platform, retrieve information, assist with the incident). Never promise future features.
   - Never name competitors. Never quote internal material (ICP tiers, pricing, packages, KPIs, competitor views).
2. `ccprac.py` (NEW page types, read fully), `cckit.py`, `ccextra.py` (shared pages added automatically: positioning, platform pages, readiness assessment, buyer's guide; final page is now an industry demo CTA built automatically from art_back), plus `rkit.py`, `aikit.py`, `pbkit.py` for the older page types.
3. Your current `cc/cpNN.py` and `cc/notes_NN.md`.

## New page types (methods on the book)
- `b.raci(ey, title, lede, roles, rows, sec, note="")` rows: (activity, [R/A/C/I/'' per role]); up to 6 roles, 8 to 11 rows.
- `b.escalation(ey, title, lede, levels, sec, note="")` levels: (level name, trigger, who is alerted, who decides, escalate-if condition) ; 4 levels.
- `b.swimlane(ey, title, lede, lanes, times, events, sec, note="")` events: (lane idx, time idx, text, kind) kind in act/dec/risk/mon ('risk' = where it goes wrong, 'dec' = decision, 'mon' = how it is monitored). 4 to 5 lanes, 5 to 6 times, texts under ~9 words.
- `b.tracker(ey, title, lede, rows, sec, note="")` outstanding actions board: (action, owner, due, status, how it is checked); status Done/In progress/Open/Overdue/Blocked; 7 to 9 rows.
- `b.exercise(ey, title, lede, meta, injects, sec, note="")` tabletop exercise: meta (label, value) x4 (Duration, Participants, Objective, Facilitator); 5 to 6 injects (time, what happens, questions).
- `b.pir(ey, title, lede, sections, sec)` post-incident review template: 8 (heading, prompt) boxes.
- `b.form(ey, title, lede, cols, sec, rows=8, example=None, note="")` fill-in template, cols [(label, width fr)], an example row.
- `b.depmap(ey, title, lede, centre, nodes, tolerance, sec, note="")` dependency map: centre (service, description); exactly 6 nodes (category, items text); tolerance [(label, value)] 3 to 4 items.
- `b.platform(title, lede, rows)` now renders TWO visual pages (the lifecycle and the steps flowing through modules). Rewrite your rows: 6 to 7 rows, one per module in lifecycle order (SOS, Ping, Incident Manager, Task Manager, Control Centre, Audit & Reporting, optionally CRAiG), each an OUTCOME in your industry's scenario (under ~22 words). Title like "How the modules work together in a <industry> incident".
- Keep `b.art_back(...)` as the last call (it becomes the industry demo CTA automatically; next_title still names the companion report).

## What to add (the client's requests)
Practical tools readers can use (every playbook must include ALL of these, industry-specific):
1. a roles and responsibilities matrix (raci)
2. an incident escalation workflow (escalation)
3. at least two industry-specific checklists or fill-in templates (checklist / form)
4. a tabletop exercise (exercise)
5. a post-incident review template (pir)
6. the readiness assessment is added automatically; do not duplicate it.
Improved scenarios: keep the existing first-hour page and ADD one swimlane page for the main scenario showing where things go wrong (risk), who decides (dec), what actions happen and how they are monitored (mon); and ADD one outstanding-actions tracker page. Make the existing scenario/use-case text explain failure points, decision owners and monitoring.

Industry-specific requirements (do all for your industry):
- 01 Financial Services: an important business service example with dependencies and impact tolerance (depmap; e.g. retail card payments; label tolerance values as illustrative, set by the firm); strengthen escalation and decision making (escalation tied to tolerance, plus a decision-rights table or raci including executive, incident lead, IT, comms, compliance/SMF holder).
- 02 Property: resident communication, acknowledgements and assistance requirements (form: resident assistance register / acknowledgement log; flow or table of handling non-responders); multi-building incident and out-of-hours incident (swimlane or scenario covering several blocks at night).
- 03 Retail: store, regional manager and head office coordination (raci with Store manager, Regional manager, Head office incident lead, IT, Comms, Loss prevention); a multi-store scenario (swimlane across stores/region/HQ) and decision rights (who closes a store, who switches to cash, who speaks to media).
- 04 Transport: effects on drivers, depots, suppliers and the wider network (swimlane lanes like Drivers, Depot, Control/network, Suppliers/partners, Customers); driver check-ins (form: driver check-in log; escalation for missed check-ins with times).
- 05 Hospitality: a shift responsibility matrix (raci by shift role: Duty manager, Supervisor, Door/security, Front of house, Kitchen, Head office); guest communication considerations (table or grid: languages, accessibility, guests in rooms vs public areas, what not to say); scenarios with multiple venues (swimlane across venues and head office).
- 06 Healthcare: how clinical teams, management, digital teams and external partners coordinate in a major incident (swimlane lanes like Clinical, Site management / incident control, Digital / IT, External partners (ICB, ambulance, supplier), Comms); responsibilities (raci) ; outstanding actions (tracker); downtime procedures (checklist or form, e.g. downtime procedure checklist by department).

## Constraints
- Final playbook length 34 to 40 pages (cover to back). You may trim or merge weaker existing pages to make room, but keep the research-backed essays and sources.
- Keep every existing sourced fact and its S(n) citations accurate; if you add new facts, research and cite them (sources page must stay one page; shorten entries if needed). Illustrative examples must be labelled illustrative. No invented statistics.
- NO em or en dashes. British spelling. Crises Control name only (never Transputec). Do not name individuals.
- Build: `python3 build_cc.py cpNN` then `node check.js <html>` must print OK. Then `node hpdf.js <html>` and render EVERY page (`pdftocairo -png -r 30 pdf/<name>.pdf <your scratch dir>/p`) and LOOK at every page; fix overlap, crowding, text touching the footer, near-empty pages. Scratch files only in your own scratch directory. Do not commit. Do not edit any shared .py file; if a shared page type has a bug, report it.

Report: HTML name, page count, check.js result, confirmation you viewed every page, the list of new pages added, anything you could not do.
