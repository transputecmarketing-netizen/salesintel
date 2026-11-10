# Page API (Transputec kits)

All page methods append one A4 page (210 x 297 mm) to the book. `sec` is the running-header label shown top right.
Text arguments accept inline HTML (`<b>`, `<br>`, `<span class="b">` for brand blue) and the `S(n)` citation helper.

## Contents

1. Classes and constructors
2. Front and back matter
3. Body pages (all classes)
4. AIBook / HotBook extras
5. Report-only pages (RBook)
6. Assets: art, figures, icons
7. Length guide

## 1. Classes and constructors

| Class | Import | Use for | Constructor |
|---|---|---|---|
| `Book` | `from pbkit import Book` | Short weekly A4 playbooks with icon-tile cover | `Book(short, series)` |
| `AIBook` | `from aikit import AIBook` | Long-form playbook series with full-bleed art cover | `AIBook(short, series="AI Playbook Series", num=1, art="silk", pos="70%")` |
| `HotBook` | `from rkit import HotBook, S` | News-led playbook: art2 background + Hairline figure on cover, sources page | `HotBook(short, num, art, fig, series="Hot Topics · Playbook")` |
| `RBook` | `from rkit import RBook, S` | White editorial intelligence report | `RBook(short, num, art, fig, series="Hot Topics · Intelligence Report")` |

- `short` is the short title, printed in every folio. `num` prints as "No. 01".
- `art` is a file stem from `art/` (AIBook) or `art2/` (HotBook, RBook). `fig` is a Hairline figure name (section 6).
- Set `b.how = "..."` to the one-sentence description shown on the contents page.
- `b.build("Name.html")` writes the HTML. Prefer `python3 build.py content/x.py`, which does this for you.

## 2. Front and back matter

- `b.cover(kicker, t1, t2, lede, icons, tag)` (Book): dark cover, 4 rotated icon tiles. `icons` is a list of 4 icon names.
- `b.art_cover(kicker, t1, t2, lede, tag=...)` (AIBook/HotBook): full-bleed art cover. `t1` white line, `t2` blue line. Keep each to 1 to 3 short words.
- `b.rep_cover(kicker, title, sub, dateline)` (RBook): `title` may contain `<br>`; `dateline` like "November 2026".
- `b.contents()`: placeholder, filled at build time from `mark()` calls.
- `b.mark(num, title)`: call immediately BEFORE the first page of each contents entry. `num` is "" for front matter and Sources, "01", "02", "03" for parts.
- `b.foreword(title, paras, sign="The Transputec team")`: 3 paragraphs.
- `b.intro(ey, title, lede, pts, sec="Introduction")`: `pts` = 3 x `(icon, heading, text)`.
- `b.statement(text, sub, sec)`: full-page dark statement. One sentence, under ~14 words.
- `b.quote(text, who, sec)`: dark pull-quote page.
- `b.questions(ey, title, lede, cols, sec)`: dark page; `cols` = list of `(heading, [question, ...])`, usually 2 columns x 4 questions.
- `b.checklist(ey, title, lede, items, sec, note="")`: `items` = `(item, detail)`; 7 to 9 items.
- `b.glossary(title, items, sec="Glossary")`: `items` = `(term, definition)`; 10 to 14 terms, definitions under ~25 words.
- `b.back(title, lede, cta, extra="")` (Book) / `b.art_back(title, lede, cta, next_title="")` (AIBook/HotBook) / `b.rep_back(title, lede, cta, companion="")` (RBook). If `next_title` contains "report" the label reads "Read the companion report".

## 3. Body pages (all classes)

- `b.opener(num, word, line, items)`: dark part opener. `word` is the big title (use `<br>`), `line` one sentence, `items` = `(nn, chapter title)` x 3 or 4.
- `b.compare(ey, title, lede, heads, rows, sec)`: 3 columns; `heads` = 3 labels; `rows` = `(label, left, right)` x 5 to 6.
- `b.grid(ey, title, lede, cards, sec, note="")`: 2 x 2 cards `(icon, heading, text)`.
- `b.dive(n, icon, title, line, quads, sec, owner="")`: deep-dive on one action. `n` like "01"; `quads` = 4 x `(label, text)`, e.g. Why / How / Check / Pitfall.
- `b.steps(ey, title, lede, items, sec, note="")`: numbered `(heading, text)` x 5 to 6.
- `b.flow(ey, title, lede, stages, sec, foot="")`: vertical flow `(icon, heading, text)` x 4 to 5.

## 4. AIBook / HotBook extras

- `b.essay(ey, title, paras, sec, pull="")`: two-column essay, 6 paragraphs (330 to 420 words) plus optional pull quote.
- `b.usecase(ey, title, cases, sec)`: 3 cases; each case `(icon, who e.g. "Housing association", case title, [(label, text) x 4])`, labels like The gap / The fix / Owner / Result. Answers under ~22 words.
- `b.table(ey, title, lede, heads, rows, sec, widths=None)`: `heads` 3 to 4 labels; rows 5 to 6; cells under ~18 words. `widths` e.g. `"34mm 1fr 1fr 1fr"`.
- `b.matrix(ey, title, lede, xl, yl, quads, sec)`: 2 x 2; `xl`/`yl` axis labels; `quads` = 4 x `(label, heading, text)` in order top-left, top-right, bottom-left, bottom-right; top-right is highlighted (put the "act now" quadrant there).
- `b.principles(ey, title, lede, items, sec)`: dark; `(heading, text)` x 5 to 6.
- `b.figpage(ey, title, lede, fig, items, sec)` (HotBook/RBook): large Hairline figure + 4 `(heading, text)` items explaining how something works.
- `b.sources(items, note=None)` (HotBook/RBook): `items` = `(n, "Publisher, title, date, URL")`. Must fit one page for playbooks (8 to 16 entries); reports may use two pages (split the list over two calls).

## 5. Report-only pages (RBook)

- `b.summary(title, paras, bottom_line, sec="Executive summary")`: 4 paragraphs + a dark "bottom line" box.
- `b.findings(title, items, sec="Key findings")`: 6 to 7 `(heading, text)`.
- `b.facts(title, lede, items, sec)`: dark "at a glance"; 6 `(big figure, explanation ending with S(n))`.
- `b.timeline(title, lede, events, sec="Timeline")`: 6 to 9 `(date, heading, text)`.
- `S(1)`, `S(2, 3)`: citation superscripts. Number sources in order of first use.

## 6. Assets

**art/** (AIBook covers): silk waves line liquid bloom petals sheen orbit fluted ribbon mesh glass rings horizon beam.

**art2/** (HotBook/RBook backgrounds): contour shards radar circuit dots burst bars grid storm nodes frames frost prism lattice pulse scan.
New art2 backgrounds can be generated with `studio/art-tools/art2.html?d=<name>` (canvas, 1920 x 1080) and a Playwright screenshot.

**Hairline figures** (`hl/dark`, `hl/light`, Transputec blues): riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack.
Pick the figure that illustrates the point: router/patch for network edge, padlock/vault for security, branches/rebuild for software supply chain, terminal for code and patching, phone for apps, plot/terrain for value and cost, cabinet for servers, drawer for records and regulation, laptop for endpoints, hub/relay for networks and reporting chains, sieve for filtering, loupe for inspection, stack for platforms, lockers for access.

**Icons** (`ic()`, cards, intro, grid, flow, dive): compass loop server storage transfer flask contract tag power broom bell laptop wrench shield recycle eye owner sliders truck check magnifier. Only these exist.

## 7. Length guide and fixing problems

- Overflow reported by check.js: shorten the text on that page first; split into two pages only if the content earns it.
- A page that looks thin in the contact sheet: add substance (an example, a check, an owner), never padding.
- Two-column essays that overflow spill into an invisible third column; check.js reports this as "column overflow".
- Titles: `h2` titles over ~60 characters wrap to three lines and push content down; tighten them.
