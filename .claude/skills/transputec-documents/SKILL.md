---
name: transputec-documents
description: Transputec's house design system for A4 playbooks, intelligence reports and lead-magnet guides, rendered to print-quality PDF (Python kits + Playwright). Use this whenever the user asks for a Transputec playbook, report, guide, white paper, e-book, lead magnet, "hot topics" piece, weekly playbook series or any branded A4 PDF document for Transputec, even if they only say "make a playbook on X" or "do a report on this news" without naming the brand. It covers covers, contents, essays, tables, figures, sources pages, research and citation rules, QA and packaging. Do NOT use it for Crises Control documents (use crises-control-documents).
---

# Transputec documents

Transputec (UK managed IT, cloud, cybersecurity and AI services, transputec.com) publishes practical **playbooks** and evidence-based **intelligence reports** as gated lead magnets for UK business and IT leaders. This skill bundles the exact design engine used for the AI Playbook Series, the Hot Topics series and the weekly cloud-cost playbooks, so every new document looks like part of the same family.

What the reader should feel: "this is the most useful thing I have read on this topic, and it looks expensive". Substance and accuracy come first; the design makes it easy to read and worth keeping.

## Workflow

1. **Set up the engine** (once per project folder):
   `bash <this skill>/scripts/new_project.sh <project folder>`
   Then work inside `<project folder>/studio/docs`. Keep the folder layout: kits resolve fonts and logos through `../../assets`.
2. **Research** (section below). Keep notes with source URLs in `content/notes_<name>.md`.
3. **Write a content module** `content/<name>.py` with a `build()` function that returns the book. Start by reading one example in `references/examples/` fully (`hp01.py` playbook, `hr01.py` report, `pb01.py` long-form AI playbook) and `references/page-api.md`. Optional module variables: `OUT = "HOT-17-Playbook-My-Title"` (output name) or `PREFIX = "HOT"`.
4. **Build**: `python3 build.py content/<name>.py` writes `<name>.html` next to the kits.
5. **QA**: `python3 qa.py <name>.html --sheets <scratch dir>`. It runs the overflow check, a text lint (dashes, AI-sounding phrases, wrong brand), renders `pdf/<name>.pdf` and writes contact sheets (6 pages per PNG). **Open and look at every contact sheet.** Automatic checks miss boxes touching the footer, near-empty pages, awkward breaks and figures that do not fit the point. Fix, rebuild, re-check until clean.
6. **Deliver**: the PDFs in `pdf/`. For a series, combine with `pdfunite a.pdf b.pdf all.pdf` and zip with a short schedule or index. Put scratch files (contact sheets) outside the repo.

Several documents at once: brief parallel writer agents with `references/writer-brief.md` (fill in the placeholders), one content module per writer, then QA every result yourself.

## Choosing the document type

| Request | Class | Typical length |
|---|---|---|
| Playbook on a current news topic | `HotBook` (art2 background + Hairline figure cover, sources page) | 22 to 25 pages |
| Intelligence / research report | `RBook` (white editorial cover, findings, facts, timeline, sources) | 20 to 24 pages |
| Evergreen long-form playbook (AI, cloud, strategy) | `AIBook` (full-bleed art cover) | 22 to 25 pages |
| Short weekly or campaign playbook | `Book` (icon-tile cover) | 8 to 12 pages |

Playbook and report on the same topic are a pair: each back page names the other (`next_title=` / `companion=`).

## Page recipes

**Playbook (HotBook / AIBook)**: art_cover, contents, foreword, intro, statement, then three parts (each `mark` + `opener`, then a varied mix of essay, figpage, steps, flow, table, usecase with 3 cases, dive, matrix, principles, grid), questions, checklist, glossary, `mark("", "Sources")` + sources (HotBook), art_back. Make it practical: what to do this week, this month, this quarter; owners; checks; supplier questions; pitfalls; what good looks like.

**Report (RBook)**: rep_cover, contents, summary (with bottom line), findings (6 to 7), facts (6 sourced figures), timeline (6 to 9 dated events), 2 to 3 analysis parts (opener, essays with citations, table, figpage explaining how the issue works, compare or matrix), "What it means for UK organisations", recommendations (steps or principles), questions for the board, glossary, sources (15 to 35, numbered in order of first use), rep_back. Analysis must add insight: why it happened, what pattern it fits, what most organisations get wrong, what to do now.

Vary the rhythm: alternate light and dark pages, text-heavy and visual pages. Never put two essays back to back without a visual page between them.

## Brand

- Palette: navy `#0A0F1A`, card `#111A2B`, blue `#2C72DB`, bright blue `#3B8BFF`, grey `#AEBACC`, light `#F4F7FB`. Font Poppins (300 to 700), JetBrains Mono for small labels. Logos in `assets/logo-white.svg`, `assets/logo-blue.svg`.
- These are set in the kits; do not hand-code colours in content modules. Use `<span class="b">` for blue emphasis.
- Covers: titles are short and hooky, two lines (`t1` white, `t2` blue), e.g. "Lock the / front door.", "The edge / is the breach." Choose cover art and Hairline figures that relate to the topic (see the asset lists in `references/page-api.md`).
- Transputec appears as the helpful partner on the closing page and lightly in CTAs. The rest of the document is vendor-neutral expertise; that is what makes it credible.
- Dark designs are preferred for anything decorative (backgrounds, covers).

## Writing rules

These exist because the documents carry Transputec's name to senior readers; one invented number or one breathless sentence costs more trust than the document earns.

1. **No em dashes or en dashes**, anywhere. Use commas, colons, full stops or "to" for ranges ("2 to 4 weeks"). qa.py flags them.
2. British spelling, plain English, confident and specific. Avoid AI-sounding filler: "in today's fast-paced world", "unlock", "delve", "game-changer", "revolutionise", "harness the power", "landscape is evolving", "navigate", "seamless", "robust".
3. **Never invent** numbers, quotes, dates, names, CVE IDs or legal duties. If it cannot be verified, leave it out. Label preliminary or disputed figures as such. Label illustrative examples as illustrative.
4. Balanced about vendors involved: state facts and their fixes; no disparaging claims. Do not name or blame individuals.
5. Every factual claim in a report carries `S(n)`; every source cited appears on the sources page as "Publisher, title, date, URL".

## Research

Your training data is older than the events these documents cover. Research before writing: WebSearch (`extended` mode for news), WebFetch, and verify each key fact against the most primary source available (vendor advisories, NCSC, CISA, ICO, gov.uk, legislation.gov.uk, regulators, company statements; reputable press such as BBC, Reuters, FT, The Register, BleepingComputer, The Record, Computer Weekly). Where sources disagree, say so in the text.

## Hairline figures

The isometric line figures (33 of them) come from the Hairline library (github.com/lucasmarkes/hairline), exported as PNG in Transputec blues to `hl/dark` and `hl/light`. Use only figures that illustrate the specific point on the page; a padlock on a page about cost is worse than no figure. If a new palette is needed, the exporter lives in the repo at `brand-samples/hairline/` (`fig.html`, `fig.js`, `cc_export.js` shows how to export with a custom palette).

## Troubleshooting

- `check.js` says overflow on page N: shorten that page's text (see the length guide in page-api.md). Contents page numbers are computed from `mark()` calls, so adding or removing pages is safe.
- Fonts look wrong in the PDF: you built outside `studio/docs` or moved files; the relative `../../assets` path must resolve.
- Wrong running-header label: it is the `sec` argument of that page.
