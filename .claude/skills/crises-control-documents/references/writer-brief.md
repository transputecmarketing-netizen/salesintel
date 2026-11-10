# Writer brief template (Crises Control)

Hand one industry (playbook + report pair) to each parallel writer agent. Fill every `<placeholder>` and paste as the agent's prompt.

---

Crises Control (crises-control.com) is an Operational Incident Coordination Platform. Each week it publishes, for one industry, a CRISIS PLAYBOOK and an INTELLIGENCE REPORT as downloadable lead magnets. Readers: UK (and some international) leaders in resilience, business continuity, security, operations, risk and compliance. The client wants stunning design and perfect content: accurate, specific, genuinely useful, beautifully written.

Your industry: **<industry>**, week of **<date>**, number **<NN>**. Today is <date>.
Constructors: `CCBook("<Playbook short title>", <NN>, "<hairline fig>", "<industry>", "<week>")` and `CCReport("<Report short title>", <NN>, "<hairline fig>", "<industry>", "<week>")`.
Industry-specific requirements: <list from SKILL.md or from the client>.

## Read first
1. `<skill>/SKILL.md` (recipes and rules) and `<skill>/references/framework-rules.md`.
2. `<skill>/references/page-api.md`, and the kits in `<project>/studio/docs`: `cckit.py`, `ccprac.py`, `ccextra.py` (and `rkit.py`, `aikit.py`, `pbkit.py` for inherited pages).
3. Examples: `<skill>/references/examples/cp01.py` and `cr01.py`, read fully.

## Files
- Write ONLY `content/cp<NN>.py` and `content/cr<NN>.py` (each with `build()` and `OUT = "CC-<NN>-Playbook-..."` / `"CC-<NN>-Report-..."`), plus notes in `content/notes_<NN>.md`. Touch no shared file; if a shared page type has a bug, report it.
- Build: `python3 build.py content/cp<NN>.py content/cr<NN>.py`. QA: `python3 qa.py <both html> --brand cc --sheets <your scratch dir>` must pass; then open EVERY contact sheet and fix overlap, crowding, text touching the footer, near-empty pages. Scratch files only in your scratch dir. Do not commit.

## Research first
WebSearch ("extended" for news and regulation) and WebFetch; primary sources (legislation.gov.uk, regulators, inquiries, NCSC, company statements, reputable press). Never invent numbers, quotes, dates, names or legal duties; label proposals and guidance as such; leave out what you cannot verify. Never invent Crises Control statistics, customers or features.

## Hard rules
0. Crises Control name only. Never mention Transputec.
1. No em or en dashes. British spelling. Not AI-sounding.
2. Accuracy over drama; balanced; no individuals named or blamed; no competitor names; CRAiG current capability only.
3. Crises Control appears only on the platform pages, auto-inserted pages, closing CTA and lightly in CTAs.
4. Short, hooky two-line cover titles.

Report back: both HTML names, page counts, qa.py result, confirmation you viewed every page, number of sources, facts left out as unverifiable.
