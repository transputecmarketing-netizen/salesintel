# Hot Topics wave 2: playbook-only brief

Transputec (UK managed IT, cloud, cybersecurity and AI services, transputec.com) is publishing practical PLAYBOOKS on this week's news (early November 2026). Readers: UK business and IT leaders. Lead magnets: hooky titles, but accuracy and usefulness first.

## Files
Working dir: /home/user/salesintel/brand-samples/linkedin-nov/playbooks
- Template: `rkit.py` class HotBook (now with a `sources()` page method and S(n) citation helper), built on `aikit.py` and `pbkit.py`. READ ALL THREE FULLY. Reference playbooks for depth and tone: `hot/hp01.py` and `ai/pb01.py` (read one of them fully).
- Write ONLY `hot/hpNN.py` (your number) with `build()` returning the HotBook, and notes in `hot/notes_NN.md`. Touch no other files; other writers work in parallel.
- Build: `python3 build_hot.py hpNN`. QA: `node check.js <your HTML>` must print OK. Fix and repeat. Do not run pdf.js/hpdf.js; do not git commit.

## Research first
- WebSearch (mode "extended" for news) and WebFetch. Today is 4 November 2026; rely only on what you verify now. Prefer primary sources (NCSC, CISA, Microsoft, Google, vendor status pages and incident reports, ICO, gov.uk, reputable press: BBC, Reuters, The Register, BleepingComputer, The Record, Computer Weekly).
- Never invent numbers, quotes, dates, names or CVE IDs. Label preliminary or disputed facts. Leave out what you cannot verify.

## The playbook (22 to 25 pages)
`b = HotBook(short_title, num, art, fig)`. Order: art_cover, contents, foreword, intro, statement, then a short "What happened" part grounded in the news (an essay with S(n) citations, and a figpage or table), then two practical parts (each mark+opener then a varied mix: essay, figpage, steps, flow, table, usecase with 3 cases, dive, matrix, principles, grid), questions (board and supplier questions), checklist, glossary, mark("", "Sources") + `b.sources([(n, "Publisher, title, date, URL"), ...])` (one page; 8 to 16 sources, numbered in order of first use, every one cited with S(n)), art_back (next_title: another playbook in this wave, given below).
- Practical: what to do this week, this month, this quarter; owners; checks; supplier questions; pitfalls; what good looks like.

## API reminders
- `b.mark(num, title)` right before the first page of each contents entry ("" for front matter and Sources; "01","02","03" for parts).
- figpage(ey, title, lede, fig, items, sec): pick a RELEVANT hairline figure: riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack. 4 items.
- Icons: compass, loop, server, storage, transfer, flask, contract, tag, power, broom, bell, laptop, wrench, shield, recycle, eye, owner, sliders, truck, check, magnifier. Only these.
- Lengths: essay 6 paragraphs (330 to 420 words) plus pull quote; table cells under ~18 words, 5-6 rows; usecase answers under ~22 words. Shorten on overflow; add substance if thin. The sources list must fit one page (shorten entries if needed).

## Hard rules
1. NO em dashes or en dashes anywhere. British spelling, plain English, no hype, not AI-sounding (avoid "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness the power", "landscape is evolving", "navigate").
2. Accuracy over drama; balanced about vendors; do not name or blame individuals.
3. Transputec appears only on the closing page and lightly in CTAs.
4. Short hooky cover title (two short lines).

Report back briefly: HTML filename, page count, check.js result, number of sources, and facts left out as unverifiable.
