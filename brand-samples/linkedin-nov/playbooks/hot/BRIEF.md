# Hot Topics series: shared brief for writers

Transputec (UK managed IT, cloud, cybersecurity and AI services, transputec.com) is publishing a "Hot Topics" series for November 2026: for each current news topic, one practical PLAYBOOK and one evidence-based INTELLIGENCE REPORT. Readers are UK business and IT leaders. These are lead magnets, so titles must hook, but substance and accuracy come first.

## Files
Working dir: /home/user/salesintel/brand-samples/linkedin-nov/playbooks
- Templates: `rkit.py` (HotBook for playbooks, RBook for reports, helper S(n) for citation superscripts), built on `aikit.py` and `pbkit.py`. READ ALL THREE FULLY before writing.
- Reference for depth, rhythm and tone: `ai/pb01.py` (read it). Playbook structure follows it.
- Write `hot/hpNN.py` (playbook) and `hot/hrNN.py` (report), each with `build()` returning the book. Touch no other files (six other writers work in parallel on other numbers).
- Build: `python3 build_hot.py hpNN hrNN`. QA: `node check.js <the two HTML files>` must print OK for both. Fix and repeat. Do not run pdf.js or hpdf.js, do not git commit.
- Keep your research notes in `hot/notes_NN.md` (facts with source URLs). This is allowed.

## Research (do this first, thoroughly)
- Use WebSearch (mode "extended" for news) and WebFetch. Today is 3 November 2026. Your training data predates these events; rely only on what you verify now.
- Verify each key fact against the most primary source available (vendor advisories, government/agency statements such as NCSC, CISA, FBI, ICO, UK Parliament, company statements, reputable outlets such as BBC, Reuters, The Register, BleepingComputer, The Record). Where sources disagree or figures are preliminary, say so in the text.
- Never invent numbers, quotes, dates, names or CVE IDs. If you cannot verify something, leave it out.

## Report (RBook) — 20 to 24 pages
`b = RBook(short_title, num, art, fig)`. Suggested order: rep_cover, contents, mark+summary (executive summary with bottom line), mark+findings (6-7), facts (6 sourced figures or short facts; every item ends with S(n)), timeline (6-9 dated events, cited), then 2-3 parts each with mark+opener and analysis pages (essay pages with citations, table, figpage explaining how the attack/issue works using a relevant figure, compare/matrix/grid as fits), a "What it means for UK organisations" section, a recommendations page (steps or principles), questions (for boards), glossary, mark+sources (every source cited, numbered, "Publisher, title, date, URL"), rep_back (companion = the playbook title).
- Every factual claim about the event carries S(n). Number sources in order of first use. 15 to 35 sources is typical.
- Analysis must add insight: why it happened, what pattern it fits, what most organisations get wrong, what to do now.

## Playbook (HotBook) — 20 to 24 pages
`b = HotBook(short_title, num, art, fig)`. Structure like ai/pb01: art_cover, contents, foreword, intro, statement, three parts (mark+opener then a varied mix: essay, figpage, steps, flow, table, usecase with 3 cases, dive, matrix, principles, grid), questions, checklist, glossary, art_back (next_title = the report title, labelled as the companion report). Practical: what to do this week, this month, this quarter; owners; checks; supplier questions; pitfalls. Light references to the news are fine; keep detailed citations for the report (if you cite a figure in the playbook, use S(n) and state the source in the text).

## Page API reminders
- `b.mark(num, title)` right before the first page of each contents entry ("" for front matter like Summary/Foreword/Introduction, "01","02","03" for parts, "" for Sources).
- figpage(ey, title, lede, fig, items, sec): fig is a hairline figure name; available: riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack. Choose ones RELEVANT to the point being made (router/patch for network edge, padlock/vault for security, branches/rebuild for software supply chain, terminal for patching/code, phone for apps, plot/terrain for value, cabinet for servers, drawer for records/regulation, laptop for endpoints, hub/relay for networks and reporting chains). 4 items with figpage.
- Icons for ic()/cards: compass, loop, server, storage, transfer, flask, contract, tag, power, broom, bell, laptop, wrench, shield, recycle, eye, owner, sliders, truck, check, magnifier. Only these.
- Length guide: essay 6 paragraphs, about 330 to 420 words, plus pull quote; table cells under ~18 words, 5-6 rows; findings 6-7 items of 1-2 sentences; timeline items 1-2 sentences; usecase answers under ~22 words. On overflow, shorten. If a page looks thin, add substance.

## Hard rules
1. NO em dashes or en dashes anywhere. British spelling, plain English, confident, no hype, not AI-sounding (avoid "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness the power", "landscape is evolving", "navigate").
2. Accuracy over drama. Clearly label preliminary or disputed figures. No speculation presented as fact. Do not name or blame individuals.
3. Balanced about vendors involved: state facts, note their fixes/advisories, no disparaging claims.
4. Transputec appears as the helpful partner only on closing pages and lightly in CTAs.
5. Hooky titles, e.g. "The edge is the breach", "Lock the front door". Make each cover title short (two short lines).

Report back briefly: both HTML filenames, page counts, check.js results, number of sources, and any facts you could not verify and therefore left out.
