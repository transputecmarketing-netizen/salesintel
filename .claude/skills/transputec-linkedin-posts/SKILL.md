---
name: transputec-linkedin-posts
description: Transputec's LinkedIn design system for branded social content, rendered with Python and Playwright. Makes 1080 x 1350 carousels exported as PNG slides plus a LinkedIn-ready PDF document post, single-image posts (editorial comparison, quote card, myth vs reality, framework, checklist), an A4 one-page version of the same story, a sign-off review pack, an optional short vertical video, and the post caption (hook, value, CTA, hashtags). Use this whenever the user asks for a Transputec LinkedIn post, carousel, swipe post, document post, social graphic, quote card, weekly LinkedIn series, "next week's LinkedIn", a one-pager to go with a post, or social copy for Transputec, even if they only give a topic such as "do a carousel on cloud costs". Do NOT use it for A4 playbooks or reports (use transputec-documents) or for Crises Control content.
---

# Transputec LinkedIn posts

Transputec (UK managed IT, cloud, cybersecurity and AI services, transputec.com) posts practical, vendor-neutral advice on LinkedIn for UK business and IT leaders: cost control, AWS, FinOps, IT procurement, security. This skill bundles the exact slide kit used for the November 2026 series (navy, blues, Poppins, line icons, soft blue glow) so every new post looks like part of the same feed.

What the reader should feel when the slide appears in their feed: "that is useful, and it is from people who know what they are doing". One idea per slide, big type, lots of navy space. The design is quiet so the point lands.

## Workflow

1. **Set up** (once per project folder):
   `bash <this skill>/scripts/new_project.sh <project folder>`
   Then work in `<project folder>/li`. The kit finds fonts and logos in `<project folder>/assets` from its own location, so keep `assets/` and `li/` side by side.
2. **Plan the post.** Pick the format (table below), one clear promise for the cover, and the 3 to 5 points that deliver it. Research facts you will state (see Content rules).
3. **Write a content module** `content/<name>.py` (start from `content/example_cloud_cost_hides.py`; full argument list in `references/slide-api.md`). It sets `SERIES`, `SLIDES`, `CAPTION`, and optionally `NOTES`, `A4`, `VIDEO`.
4. **Build and render**: `bash ../build.sh content/<name>.py` (add `--video` for an MP4). Everything lands in `out/<name>/`.
5. **QA by looking.** The build prints `WARN` lines (dashes, US spelling, filler words, caption rules) and `OVERFLOW` lines (text reaching the footer or margin). Fix all of them, then **open every PNG and the A4 PNG with the Read tool**. Check: nothing cramped against the footer, no orphan word on its own line in a title, the blue emphasis falls on the key phrase, icons fit the point, slide numbers run 01 to NN. Shorten text rather than shrinking type; these are read on phones.
6. **Deliver** from `out/<name>/`: `<name>-NN.png` (single images, or for scheduling tools that take images), `<name>-carousel.pdf` (upload to LinkedIn as a document post so it swipes; built when there are 3 or more slides), `<name>-A4.pdf` (one-pager), `<name>-review.pdf` (caption plus thumbnails for sign-off), `caption.txt`, and `<name>-1080x1920.mp4` if requested. Put contact sheets and scratch files outside the repo.

## Choosing the format

| Goal | Format | Slides |
|---|---|---|
| Teach a list (signs, places, steps, checks) | Carousel: `cover`, `statement`, 3 to 5 `point`, `cta` or `checklist` | 5 to 8 |
| One sharp idea or contrast | Single image: `compare` (A or B), `quote`, `myth`, `framework` | 1 |
| Save-worthy checklist | Carousel ending in `checklist` summary | 6 to 8 |
| Printable handout or "download the one-pager" | A4 one-pager, derived from the carousel automatically | 1 page |
| Muted autoplay video | `--video`: scenes derived from the carousel, about 4.5 s each | 25 to 40 s |

A 5-slide carousel is: cover, then 3 points, then cta (centred, with an optional "Next week" teaser) (put the "why it matters" line in the cover lede). Use `statement` when the list needs a framing beat. Do not exceed 10 slides; completion drops.

## Brand and design tokens

- Palette (set in `li/kit.py`, never hand-code others): navy `#0A0F1A` background, card `#111A2B`, blue `#2C72DB` (buttons, rules), bright blue `#3B8BFF` (emphasis, labels, numbers), grey `#AEBACC` (body and secondary text), white `#F4F7FB` (headlines).
- Type: Poppins only. Semibold 600 headlines with tight tracking, light 300 body, 17px spaced capitals for labels. Sizes are fixed per layout; do not override them to fit more words.
- Frame: logo top left, series tag top right (`SERIES`, e.g. "FinOps · Week 2", up to about 26 characters so it clears the logo), `transputec.com` bottom left, slide number or Swipe pill bottom right. Margins 88px; keep content between y 200 and y 1220.
- Emphasis: one `<span class="b">phrase</span>` per headline, on the words that carry the promise. Use `<br>` to break titles into balanced lines.
- Icons: `icon_tile(name)` / `icon(name)` line icons; names listed in `references/slide-api.md`. Choose one that literally depicts the point; if none fits, `check` or `target` beats a misleading one. Add a new icon by adding a 64-grid SVG path to `kit.icon`.
- No vendor or partner logos on slides unless the user confirms permission; names may go in the caption.

## Content rules

The posts carry Transputec's name to senior buyers; one invented number costs more trust than the post earns.

1. **No em dashes or en dashes**, anywhere (slides and caption). Use commas, colons, full stops, or "to" for ranges.
2. British spelling, plain specific English. Avoid AI filler: "unlock", "delve", "game-changer", "seamless", "robust", "in today's fast-paced world", "elevate".
3. **Never invent statistics, quotes or claims.** If you use a figure, verify it from a primary or reputable source (vendor docs, NCSC, ICO, gov.uk, Gartner press releases, reputable press) and put the source in the caption, not on the slide. Practical, checkable advice ("look in Cost Explorer, grouped by usage type") is better than a number.
4. Vendor-neutral expertise on the slides; Transputec appears only on the closing slide and lightly in the caption CTA.
5. Slide text budget: cover title 2 lines of about 20 characters (put "Three signs" or "Five places" in the kicker if it does not fit); point title one line (about 28 characters); card text one sentence of about 110 characters. Over budget means the OVERFLOW check or your eyes will catch it.

## Writing the caption

`CAPTION` in the content module becomes `caption.txt` and goes on the review pack. Structure:

1. **Hook**, first line, under about 140 characters, because LinkedIn truncates at "see more". A plain, specific claim or question the slides pay off ("Your cloud bill is telling you something. Three signs it is out of control.") Not a "Did you know" or a fake statistic.
2. Blank line, then **3 to 5 short lines of value**: the points in one line each, or the single insight with one practical step. Short paragraphs, one idea each, white space between.
3. **CTA**: one line. Either an engagement question ("Which one would you find first?") or a soft offer ("If you want a second pair of eyes on your bill, message us."). Point to the carousel ("Swipe through for where to look.") when it is a document post.
4. **3 to 5 hashtags** on the last line, specific before generic: `#FinOps #AWS #CloudCosts #ManagedServices`.
5. No em dashes, no emojis unless the user asks, no hashtag stuffing inside sentences. If a figure appears, add "Source: publisher, year" on its own line before the hashtags.

The build checks dashes, hook length, hashtag count and the 3000 character limit.

## Single-image posts

A content module with one slide renders one PNG (no PDF, no slide number). Set `A4 = False` unless you want a one-pager. Two images (e.g. editorial plus quote card) render two PNGs for two posts or post plus first comment. See `references/examples/myth_finops_single.py`.

## A4 one-pager and review pack

- `A4 = True` (default when there is a cover) builds `<name>-A4.pdf` from the cover, statement, points or framework items and the closing slide. For different wording pass a dict of `a4.onepager` arguments (see slide-api.md). 3 to 6 items fit; the build flags points running into the CTA band.
- The review pack is always built: caption, hashtags, posting notes (`NOTES`) and thumbnails, for the approver.

## Video (optional)

`bash ../build.sh content/<name>.py --video` renders a 1080 x 1920 MP4 (30 fps, muted-safe, progress bar) from the slides, plus `video-scene-NN.jpg` storyboard stills to Read for QA. It needs `ffmpeg` on the PATH and takes about a minute per 30 seconds of video (`--fps 24` is faster). For custom scenes set `VIDEO = [(seconds, v_title(...)), (seconds, v_point(...)), (seconds, v_cta(...))]` after `from video import *`.

## Troubleshooting

- `OVERFLOW slide N`: shorten that slide's text, or move the second card part (`b_lbl`, `b_txt`) to the caption.
- Fonts look like a fallback (wider, rounder letters): `assets/` is not next to `li/`; recreate the project with `new_project.sh`.
- `Cannot find module 'playwright'`: Playwright is expected globally; run `npm i playwright` in the project folder if missing.
- LinkedIn shows the PDF as a link instead of slides: upload it via "Add a document", not as an attachment, and give it a title.
- Wrong numbering: slide numbers come from list order in `SLIDES`; the `n` argument of `point` is the point number, not the slide number.
- Want a light slide: do not. The feed system is dark navy; use `transputec-documents` for light editorial pages.

## Files

- `engine/li/kit.py` tokens, CSS, `glow`, `icon`, `icon_tile`, `slide`, `page`
- `engine/li/layouts.py` slide layouts; `a4.py` one-pager and review pack; `video.py` scenes; `build.py` + `render.js` build, checks and export
- `references/slide-api.md` every layout's arguments and text budgets
- `references/examples/` `cloud_cost_hides.py` (8-slide carousel), `myth_finops_single.py` (single image), `nov2026_build.py` (the original November 2026 build script, for layout ideas)
