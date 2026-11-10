# Writer brief template (Transputec)

Use this when you hand one document (or a playbook + report pair) to a parallel writer agent. Fill every `<placeholder>`, delete what does not apply, and paste the result as the agent's prompt. Give each writer different file names so they never touch the same file.

---

Transputec (UK managed IT, cloud, cybersecurity and AI services, transputec.com) is publishing <series name>. Readers are UK business and IT leaders. These are lead magnets, so titles must hook, but substance and accuracy come first.

Your topic: **<topic, with the news hook and any links the user gave>**.
Today is <date>.

## Files
Working dir: `<project>/studio/docs`
- Kits: `pbkit.py`, `aikit.py`, `rkit.py` (read all three fully). Page reference: `<skill>/references/page-api.md`. Example for depth, rhythm and tone: `<skill>/references/examples/<hp01.py | hr01.py | pb01.py>` (read it fully).
- Write ONLY `content/<name>.py` (and `content/<name2>.py` for the report), each with `build()` returning the book, plus research notes in `content/notes_<name>.md`. Touch no other files; other writers work in parallel.
- Constructor: `<HotBook("Short Title", NN, "<art2 name>", "<hairline fig>")>` / `<RBook(...)>`. Back page: `next_title=` / `companion=` "<the other document's title>".
- Build: `python3 build.py content/<name>.py`. QA: `python3 qa.py <name>.html --sheets <your scratch dir>` must pass, then open every contact sheet and fix overlap, crowding, text touching the footer, near-empty pages. Do not commit.

## Research first
WebSearch (mode "extended" for news) and WebFetch. Your training data predates these events; rely only on what you verify now. Verify each key fact against the most primary source available. Never invent numbers, quotes, dates, names or CVE IDs. Label preliminary or disputed figures. Leave out what you cannot verify.

## Structure
<paste the playbook and/or report recipe from SKILL.md, with the page count>

## Hard rules
1. No em dashes or en dashes. British spelling, plain English, no hype, not AI-sounding.
2. Accuracy over drama; balanced about vendors; do not name or blame individuals.
3. Transputec appears only on the closing page and lightly in CTAs.
4. Short hooky cover title (two short lines).

Report back briefly: HTML file names, page counts, qa.py result, confirmation you looked at every page, number of sources, and facts left out as unverifiable.
