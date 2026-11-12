---
name: teams-backgrounds
description: Branded Microsoft Teams, Zoom and Google Meet virtual backgrounds (1920x1080 PNG) in four families, professional 3D offices and interiors, holographic HUD, designer gradients (with a gradient system sheet) and Apple-keynote style art, for any brand palette (Transputec by default, Crises Control included), with a contact sheet that shows a seated-person silhouette and automatic checks that the centre third stays calm. Use this whenever the user asks for Teams backgrounds, video call backgrounds, Zoom backgrounds, virtual office backgrounds, meeting backgrounds, webinar backdrops, branded wallpapers for calls, "a background pack for the team", "more backgrounds like the dark ones", or "backgrounds for Crises Control", even if they only say "do some call backgrounds". Not for slides, social posts or documents.
---

# Teams backgrounds

Generates branded virtual backgrounds for video calls. Each background is a 1920x1080 page (SVG, canvas or three.js) rendered to PNG with headless Chromium. The four families come from the Transputec background sets the client approved; colours, logo and fonts come from a brand file, so the same designs work for any brand.

What a good call background does: it makes the person look like they are somewhere considered, and then gets out of the way. The person, not the art, is the subject.

## Rules that matter for call backgrounds (why)

1. **1920x1080 PNG, 16:9.** Teams, Zoom and Meet all scale to this; anything else gets cropped unpredictably.
2. **Keep the centre third calm** (x 640 to 1280). The person sits there; detail behind the head competes with the face and confuses the background-segmentation edge, which then flickers. All designs place their feature in the right third (or left, with `"side": "left"`).
3. **Logo small, in a top corner**, never top centre where the head is. Default is the corner opposite the art. Office scenes carry the logo as a wall sign instead, high and to one side.
4. **Minimal text.** At most one short tag line under the logo (under 40 characters; build.py warns). A background is not a slide; people will not read it and it ages fast.
5. **Mirror-safe.** Teams mirrors your own self-view (others see it the right way round). Keep text away from the centre and in corners, so the mirrored self-view does not look odd and nothing important hides behind the person. HUD text stays readable when a design is flipped with `side`.
6. **Dark variants preferred.** The client prefers dark; faces are lit from the screen and read better against a darker field, and dark looks premium. sheet.py warns when overall luminance is above 0.45 or the centre is bright.
7. **No invented claims.** HUD readouts and tags must be true of the brand (do not write "24/7" or "ISO 27001" unless the brand really offers it). No em or en dashes; British spelling.

## Workflow

1. **Set up** (once per project folder):
   `bash <this skill>/scripts/new_project.sh <project>`
   The engine is self-contained (fonts, logos, three.js vendored). Needs Python 3 with Pillow, Node with `playwright` and Chromium.
2. **Pick the brand.** `brands/transputec.json` (default) and `brands/crises-control.json` exist. For another brand, copy one, change `colors`, `logo`, `wordmark`, fonts (put .woff2 files in `fonts/`, the logo SVG in `assets/<slug>/`). See Brand files below.
3. **Write a set file** `sets/<name>.json` listing the backgrounds (copy `sets/example-transputec.json` or `sets/example-crises-control.json`; full catalogue in `references/design-catalogue.md`). Mix families; a pack of 6 to 12 is typical. Include `gradient/system` first if the client should see the colour system.
4. **Build and render**: `bash <this skill>/scripts/make.sh <project> sets/<name>.json` (add `--mirror` for a mirrored self-view sheet too). Office scenes take 10 to 20 seconds each (software WebGL); the rest about 2 seconds.
5. **QA by looking.** Open `out/<prefix>-contact-sheet.png` and then a few full-size PNGs. The sheet overlays a person silhouette and dashed centre-third guides. Check: nothing interesting hidden behind or poking out of the head; logo crisp and clear of brackets or edges; colours on brand; no text in the centre. The printed table gives luminance, centre luminance and centre edge score; an amber dot marks warnings. Office scenes have a lit ceiling and keep slats and shelves out of the centre third (a felt feature panel sits behind the head in exec and library); if you add a scene, check that no rows near the top render black.
6. **Deliver** `out/*.png` (not the contact sheet unless asked; it is a review aid). Zip for a team: `cd out && zip pack.zip <prefix>-*.png -x '*contact*'`. Tell users: Teams, Video effects, Add new; for Zoom, Settings, Backgrounds and effects.

## Set file

```json
{"brand": "crises-control", "prefix": "cc-teams",
 "backgrounds": [
   {"id": "01-studio", "family": "office", "design": "studio"},
   {"id": "02-globe", "family": "hud", "design": "globe", "readouts": [["ALERTS", "READY", null], ["TEAMS", "ON CALL", 0.8]]},
   {"id": "03-mesh", "family": "gradient", "design": "mesh", "tag": "Ready when it matters"},
   {"id": "04-orbit", "family": "keynote", "design": "orbit", "side": "left"}]}
```

Keys per background: `id` (letters, digits, - and _; becomes `<prefix>-<id>.png`), `family`, `design`, optional `side` (`right` default, `left` mirrors the art), `logo` (`tl`, `tr`, `none`; defaults to the corner opposite the art, `none` for office), `tag` (one short line, uppercase-tracked under the logo). HUD extras: `readouts` (up to 4 rows of label, value, bar 0 to 1 or null), `place` (small caption), `core_label` (text on the core chip, default "AI"; use "" for none), `hubs` (list of [lat, lon] for the globe; first is home).

## Families (full list with notes in references/design-catalogue.md)

| Family | Designs | Character |
|---|---|---|
| `office` | exec, brandwall, library, meeting, studio | Photoreal dark interiors (three.js). Wall sign carries the logo. Most "real" looking; best for client calls. |
| `hud` | assistant, globe, visor, core | Holographic heads-up display, cyan glow, corner brackets, small readouts in the left third. Tech and AI themes. |
| `gradient` | mesh, ribbon, horizon, fluted, glass, rings, orb, beam, system | Designer gradients built from the brand's four gradients; `system` is the reference sheet. Calmest family. |
| `keynote` | silk, waves, line, liquid, bloom, petals, sheen, orbit | Apple-keynote style: deep black, one precise object, fine grain. |

## Brand files

`brands/<slug>.json`: `colors` with roles `ink` (darkest), `base` (background navy), `deep`, `primary`, `vivid`, `bright`, `cyan` (second hue for glows), `pale`, `glow` (near white), `muted` (tag text), `alert` (optional; Crises Control red appears only as one small alarm sector in HUD rings). `gradients`: four named lists of role names or hex. `logo` (white or light SVG, works on dark), `logo_height` px, `wordmark` (text set beside a symbol-only logo, e.g. "CRISES CONTROL"; empty for a wordmark logo), `font`/`font_files`, `mono`/`mono_file`, `hud_place`, optional `hud_readouts`.

- Transputec: navy `#0A0F1A`, deep `#16336E`, blue `#2C72DB`, vivid `#155DFC`, bright `#3B8BFF`, cyan `#00B8DB`, grey `#AEBACC`; Poppins and JetBrains Mono; wordmark logo.
- Crises Control: ink `#040C16`, navy `#0B223C`, panel `#0A3165`, blue `#1179BB`, sky `#16A1ED`, accent `#2D9CFA`, red `#FF0000` (alarm only), light `#F7F6F8`; Roboto and Roboto Mono; dial badge plus "CRISES CONTROL" wordmark.

## Changing or adding a design

Python SVG families live in `families/svgart.py` (functions `hud` and `keynote`); canvas gradients in `families/gradient.js` (object `R`); interiors in `families/office.js` (one `if (S === ...)` block per scene). Compose new art in the right third (x above about 1250), use only palette roles (never hex literals), add the design name to `DESIGNS` / `FAMILIES` in `build.py`, render, and check the contact sheet scores.

## Troubleshooting

- `FAILED ... Timeout` on an office scene: WebGL failed. render.js launches Chromium with SwiftShader flags; check the `ERR` lines. Run that one again with `node render.js <id>`.
- Fonts fall back to a system font: the brand's `font_files` paths are wrong, or you ran from outside the project folder.
- Logo missing in office scenes: the SVG needs a `viewBox` and width/height ratio; symbol-only logos need `wordmark` set or the sign looks empty.
- Art behind the head: move it right in that design or use `"side"`; do not just shrink it.
