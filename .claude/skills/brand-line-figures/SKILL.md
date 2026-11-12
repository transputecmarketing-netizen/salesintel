---
name: brand-line-figures
description: Isometric line illustrations in any brand palette. Exports any or all of the 33 hairline figures (padlock, router, vault, server rack, laptop, phone, satellite dish, patch panel, bar chart, filing drawer and more) as transparent PNG and standalone SVG, dark and light variants, at any size, and draws NEW custom isometric scenes in the same style (industries such as finance, healthcare, retail, transport, energy, or any object you describe). Includes a figure catalogue with business topics for each figure, a topic search, a palette maker and a contact sheet generator. Use this whenever the user wants line art, isometric icons, spot illustrations, hero or cover art, figures for a playbook, report, deck, LinkedIn post, web page or email, "a padlock image in our colours", "illustrations for these sections", "the hairline figures in brand X", or an illustration of an industry or object in the same line style, even if they do not say isometric or hairline.
---

# Brand line figures

Two engines, one look: fine isometric outlines on flat filled faces, one accent colour per picture.

- **Hairline figures** (`export_figures.js`): the 33 figures of the MIT-licensed npm package `@lucasmarkes/hairline` 0.5.1 (vendored in `engine/hairline/` with its LICENSE; keep the licence with any copy of `index.js`). They are interactive in the browser; the exporter plays each one for 1.2 s so it is caught mid-gesture (padlock open, drawer out, one antenna leaning), recolours it through the package's CSS variables and screenshots it.
- **isoart** (`isoart.py`): a small Python isometric engine for new subjects (industries, buildings, vehicles, objects). Six industry scenes are built in, `subjects/energy.py` is a worked extension, and you can add more.

## Workflow

1. **Set up** a project folder (once): `bash <this skill>/scripts/new_project.sh <project>`, then `cd <project>`. All commands below run there.
2. **Choose figures for relevance** (below): `python3 find_figure.py "your topic words"`, then read `references/catalogue.md` for what each figure literally shows.
3. **Pick or make a palette**: `transputec`, `crises-control` and `hairline` (neutral grey) are in `palettes.json`. For another brand run `make_palette.py` (below).
4. **Export**: `bash make_set.sh <palette> padlock router vault energy` (names of both kinds can be mixed; `all` exports everything). Output: `out/figures/<palette>/<dark|light>/<name>.png|svg`, `out/iso/<palette>/<theme>/<name>.png|svg`, and contact sheets `out/sheet_<palette>_dark.png` and `_light.png`.
5. **QA by looking**: open both contact sheets, then at least one full-size PNG per theme. Check: lines visible on the target background, exactly one accent per figure, nothing clipped, the dark variant sitting on its plate colour, and that every figure means what the text next to it says. Fix and re-export.
6. **Deliver** only the files used (PNG for documents and social, SVG for web or design tools). Never ship the contact sheets as assets.

For finer control call the engines directly:

```
node export_figures.js padlock vault --palette acme --theme dark --width 1200 --trim --svg --out out/figures
node export_figures.js all --palette acme --rest            # the calmer rest pose instead of mid-gesture
python3 isoart.py healthcare --palette acme --theme light --png --width 1600 --out out/iso
python3 isoart.py --list --module subjects/energy.py
python3 contact_sheet.py out/figures/acme/dark out/iso/acme/dark --out sheet.png
```

`export_figures.js` options: `--palette`, `--theme dark,light`, `--width` (output px; the frame is 5:4, default 2400 x 1920), `--trim` and `--pad 24` (crop to the drawing), `--svg` (standalone SVG with colours baked in), `--intensity 0.7` and `--t 1.2` (how far into its gesture each figure is caught), `--rest`, `--bg none|#hex`. `isoart.py` options: `--palette`, `--theme`, `--module file.py` (repeatable), `--width`, `--png`, `--weight 1.0|bold` (1.0 matches the hairline line weight; bold is the original heavier Crises Control cover look). isoart PNGs keep the full 5:4 frame, which keeps a set consistent on a page.

## Palettes

Each palette has two blocks with a dark and a light variant:

- `figures`: `plate` (face fill), `hi` (the one highlighted part), `edge` (silhouettes), `mid` (inner lines), `lo` (faint lines), `stroke` (px at 800 wide; 1.4 for print, 0.9 is the package default).
- `iso`: `top`, `side`, `side2` (face fills), `edge` (outlines), `det` (detail lines), `hi` (accent), `lit` (spare).

**The faces are filled, not transparent.** Only the background around the drawing is transparent, so set the dark `plate` (and iso `side`) to the exact background the PNG will sit on, and use the light variant on white or near-white pages. A dark figure on the wrong navy shows boxes.

Make a brand palette from its colours (writes into `palettes.json`; tune by hand afterwards):

```
python3 make_palette.py acme --label "Acme" --bg "#0F2A1F" --ink "#12261C" --primary "#2E8B57" \
    --bright "#5FD39A" --accent "#F2B134" --light "#F4F7F2" --grey "#4A5A50"
```

Worked examples already in the file: **Transputec** (navy `#0A0F1A` plate, edges `#3B8BFF`, inner `#2C72DB`, highlight `#E6F0FF`; light: ink `#0A0F1A`, highlight `#2C72DB`) and **Crises Control** (plate `#0B223C`, edges `#16A1ED`, inner `#1179BB`, faint `#0A3165`, highlight white; light: ink `#0B223C`, grey `#3A3A3A`, highlight red `#FF0000`, which is the alarm accent and should appear once, small). Choose an accent with strong contrast on both backgrounds; a pale yellow accent nearly vanishes on white.

## Choosing relevant figures

A figure earns its place only if a reader would connect it to the sentence beside it without a caption. Rules:

1. **Start from the claim, not the topic.** "Backups are your last line of defence" wants `vault`; "Most breaches start with a click" wants `keyboard` or `laptop`; "Your escalation path has gaps" wants `relay`. Search with the claim's nouns: `python3 find_figure.py escalation path`.
2. **Read `depicts` and `avoid`.** The pose matters: `padlock` is OPEN in every export, rest pose included (breach, unlocking, access); for "secured" use `vault` or `lockers`, or draw a closed lock as an isoart subject. `plot` and `basket` are empty: good for "no visibility", "no data", wrong for "growth".
3. **Literal beats clever.** Network edge is `router`; data centre is `cabinet`; mobile is `phone`; audit is `loupe`; dependency and supply chain risk is `rebuild`; a near-miss integration or outage is `plug`; filtering and triage is `sieve`; process and throughput is `slow`; disorder before consolidation is `settle`; layers and stacks are `stack` or `exploded`.
4. **No repeats within one piece**, and no two figures that look alike on the same spread (`hub`, `relay`, `settle`, `rebuild` are all tiles and links; use at most one per page).
5. **Industry or physical subjects** (a hospital, a lorry, a wind farm, a warehouse) are isoart scenes. If neither engine has it, draw a new subject (below) rather than forcing an unrelated figure.
6. **One theme per surface**: dark figures on dark pages, light on light. Keep a consistent size across a set (`--width` the same, `--trim` for all or none).

## Drawing a new subject

Write `subjects/<name>.py` in the project with a function decorated `@subject("name", "what it depicts")` and draw with `s.box`, `s.cyl`, `s.extrude`, `s.dome`, `s.wheel`, `s.poly`, `s.line`, `s.winx/winy`, `s.ground`. Full API, coordinate system and style rules: `references/isoart-api.md`; template: `engine/subjects/energy.py`. Key rules: draw far to near (increasing x + y), one ground plate, one accent in `t["hi"]`, outlines and flat faces only, recognisable at thumbnail size. Render dark and light, look at both, iterate. Add the subject to `catalogue.json` (name, kind `iso`, depicts, topics) and regenerate `references/catalogue.md` with `python3 find_figure.py --md`. To keep a good subject for future work, copy it into this skill's `engine/subjects/`.

## Text that goes with figures

If you write captions or alt text: British spelling, no em or en dashes, plain specific words, no invented statistics. Alt text says what is drawn ("Isometric line drawing of a vault door"), not what it symbolises.

## Files

- `engine/export_figures.js`, `fig.html`, `hairline/` (vendored package, LICENSE, NOTICE.md): hairline exporter.
- `engine/isoart.py`, `engine/subjects/`: custom scenes; `render_svg.js`: SVG to transparent PNG.
- `engine/palettes.json`, `make_palette.py`: palettes. `catalogue.json`, `find_figure.py`: catalogue and search. `contact_sheet.py`: sheets. `scripts/make_set.sh`: one-command set export.
- `references/catalogue.md` (all figures with topics), `references/isoart-api.md`, `references/examples/` (the original `cc_export_original.js` and `industry_art_original.py` scripts from the source projects).

## Troubleshooting

- `Cannot find module 'playwright'`: run `npm i playwright` in the project, or set `NODE_PATH` to the global node_modules.
- A blank or half-drawn hairline PNG: raise `--t` (the figure had not finished its entry), or use `--rest`.
- Boxes around a dark figure: the page background differs from the palette `plate`; fix the palette or use the light variant.
- Lines too thin when placed small: export at the size you need (`--width`) rather than shrinking a 2400 px PNG, or raise `stroke` in the palette.
- isoart face drawn on top of a nearer object: reorder the drawing calls (far to near).
- Port errors: the exporter picks a free port itself; if Chromium fails to launch, run `npx playwright install chromium`.
