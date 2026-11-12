# Slide API

Content modules start with `from layouts import *` (this also imports everything from `kit`). Each layout returns a deferred slide; `build.py` fills in the series tag, slide number, total and the Swipe pill. Text arguments accept inline HTML: `<span class="b">` for bright-blue emphasis, `<br>` for a line break.

## Module variables

| Name | Required | Meaning |
|---|---|---|
| `SERIES` | yes | Header tag, top right, e.g. `"FinOps · Week 2"`, `"Cloud cost · Quick guide"` |
| `SLIDES` | yes | List of layouts, in order |
| `CAPTION` | yes | Post text, written to `caption.txt` |
| `NAME` | no | Output name; default is the file name |
| `TITLE` | no | Plain title for the review pack; default is the cover title |
| `NOTES` | no | Posting notes on the review pack |
| `A4` | no | `True` derive one-pager (default if a cover exists), `False` none, or a dict for `a4.onepager` |
| `VIDEO` | no | List of `(seconds, html)` scenes; otherwise derived from slides. Only used with `--video` |

## Layouts (`li/layouts.py`)

`cover(kicker, title, lede, ic="magnifier", extra="")`
Icon tile, blue label, 84px title, rule, lede. title: 2 lines of up to about 20 characters each, e.g. `'Is your cloud bill<br><span class="b">out of control?</span>'`. A longer title wraps to 3 lines, which still fits but loses punch; move the number or detail into the kicker ("Three signs"). lede: up to about 120 characters. Shows "Swipe" when the post has more than one slide.

`statement(kicker, text, sub="")`
Vertically centred 70px statement. text up to about 60 characters over 2 lines; sub one or two sentences.

`point(n, ic, title, a_lbl, a_txt, b_lbl="", b_txt="")`
Big gradient number `n` (01), icon tile, title one line (about 28 characters), card with a white first part and an optional grey second part. Typical label pairs: "What it looks like" / "Where to look", "The work" / "The question", "Do this" / "Using", "The sign" / "What to do". Each text about 110 characters.

`cta(title, sub, primary="Talk to Transputec", secondary="Follow for more", next_txt="", next_lbl="Next week")`
76px title (2 short lines), lede, solid and outline pills, optional teaser card. `secondary=""` hides the second pill.

`compare(kicker, title, lede, left, right)`
Single-image editorial. left/right = `(icon, name, line, detail)`; right card is highlighted. line about 40 characters with one blue phrase; detail about 60 characters.

`quote(text, attribution="Transputec")`
Large quote marks and a 62px quote, up to about 140 characters. Only quote real, attributable words; a Transputec point of view is attributed to "Transputec · topic".

`myth(kicker, title, rows, left_lbl="Myth", right_lbl="Reality")`
3 or 4 `(myth, reality)` rows, each under about 50 characters.

`framework(kicker, title, items, lede="")`
3 or 4 `(icon, title, text)` rows with icon tiles; text under about 55 characters. Works as a single image or a summary slide.

`checklist(kicker, title, items, primary="Ask us for a review", secondary="Save this post", note="")`
Up to 5 tick-box lines (about 32 characters each) and the call-to-action pills. Use as the last slide of a checklist carousel.

`raw(inner, bg="")`
Escape hatch for a custom slide: absolutely positioned HTML using kit classes (`h1 h2 lede body lbl tag card pill rule b`), within left/right 88px and y 200 to 1220.

## Kit helpers (`li/kit.py`)

- Colours: `NAVY CARD BLUE BRIGHT GREY WHITE`
- `glow(x, y, size, a=.22, col="44,114,219")` soft light for `bg=`
- `icon(name, size=120, col=BRIGHT, sw=2.6)`, `icon_tile(name, size=150)`, `arrow(size)`
- Icon names (`ICONS`): compass, loop, server, storage, transfer, flask, contract, tag, power, broom, bell, laptop, wrench, shield, recycle, eye, owner, sliders, truck, check, magnifier, pound, chart, lock, cloud, alert, calendar, people, target, key

## A4 (`li/a4.py`)

`onepager(series, kicker, title, lede, items, ic="magnifier", pull="", cta_title="", cta_text="", button="Talk to Transputec", foot="")`
items: 3 to 6 `(icon, title, text, (label, text) or None)`. One column up to 3 items, two columns from 4 (an odd last item spans both). `pull` is a short blue-ruled line under the lede. As a module variable: `A4 = dict(kicker=..., title=..., lede=..., items=[...], cta_title=..., cta_text=...)`; `series` defaults to `SERIES`.

`review(...)` is called by build.py; no need to call it yourself.

## Video (`li/video.py`)

`v_title(kicker, big, sub="")`, `v_point(n, ic, title, sub="")`, `v_cta(title, sub="", url="transputec.com")` each return scene HTML. `VIDEO = [(4.5, v_title("Cloud cost", 'Your bill is<br><span class="b">talking</span>.')), ...]`. The last scene does not fade out. Keep scenes 4 to 6 seconds and text to one idea; it must read with the sound off.

## Outputs (`li/out/<name>/`)

`<name>-NN.png`, `<name>-carousel.pdf` (3+ slides), `<name>-A4.pdf` + `<name>-A4.png` preview, `<name>-review.pdf`, `caption.txt`, and with `--video`: `<name>-1080x1920.mp4`, `video-scene-NN.jpg`. The `.html` and `job.json` files are intermediates.
