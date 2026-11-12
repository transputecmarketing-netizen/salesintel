"""A4 variants of a LinkedIn post.

onepager(...)  one printable A4 page with the same story (cover line, numbered points, call to action).
               Use it as a downloadable "save this" PDF, a comment attachment or an event handout.
from_slides()  derives the onepager arguments from the carousel (cover + points/framework + cta/checklist).
review(...)    A4 sign-off pack: caption, hashtags, notes and slide thumbnails, for approval before posting.
"""
import re
from kit import NAVY, CARD, BLUE, BRIGHT, GREY, WHITE, FONTS, LOGO_WHITE, icon

CSS = FONTS + f"""@page{{size:210mm 297mm;margin:0}}*{{box-sizing:border-box;margin:0;padding:0}}body{{background:{NAVY};-webkit-font-smoothing:antialiased}}
.p{{width:210mm;height:297mm;position:relative;overflow:hidden;background:{NAVY};color:{WHITE};font-family:Poppins,sans-serif;page-break-after:always}}
.g{{position:absolute;border-radius:50%;pointer-events:none}}
.top{{position:absolute;left:56px;right:56px;top:42px;display:flex;justify-content:space-between;align-items:center;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:{GREY};font-weight:500}}
.bot{{position:absolute;left:56px;right:56px;bottom:30px;display:flex;justify-content:space-between;font-size:9px;color:{GREY};letter-spacing:.04em}}
.lbl{{font-weight:600;font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:{BRIGHT}}}
h1{{font-weight:600;font-size:42px;line-height:1.05;letter-spacing:-.035em;margin-top:10px}}.b{{color:{BRIGHT}}}
.card{{background:{CARD};border:1px solid rgba(174,186,204,.14);border-radius:14px;padding:18px 20px}}
.t{{font-size:12px;line-height:1.6;color:{GREY};font-weight:300}}.t b{{color:{WHITE};font-weight:500}}
.copy{{font-size:11.5px;line-height:1.62;color:{WHITE};font-weight:300;white-space:pre-line}}
.chip{{display:inline-block;padding:4px 10px;border-radius:99px;border:1px solid rgba(59,139,255,.5);font-size:9.5px;color:{BRIGHT};margin:0 5px 5px 0;font-weight:500}}
.pill{{display:inline-flex;align-items:center;padding:9px 18px;border-radius:99px;background:{BLUE};font-weight:500;font-size:12px;color:#fff}}
.sl img{{width:100%;display:block;border-radius:8px;border:1px solid rgba(174,186,204,.18)}}
.cap{{font-size:10px;color:{GREY};margin-top:6px}}.cap b{{color:{BRIGHT};font-weight:600;margin-right:6px}}
"""


def g(x, y, s, a=.2):
    return f'<div class="g" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;background:radial-gradient(circle,rgba(44,114,219,{a}),rgba(44,114,219,0) 65%)"></div>'


def _doc(pages, title):
    return f'<!doctype html><html><head><meta charset="utf-8"><title>{title}</title><style>{CSS}</style></head><body>{"".join(pages)}</body></html>'


def _plain(html):
    return re.sub(r"<br\s*/?>", " ", html)


def from_slides(slides):
    """Build onepager kwargs from the deferred slides' metadata. Returns None if there is no cover."""
    metas = [getattr(s, "meta", {}) for s in slides]
    cov = next((m for m in metas if m.get("kind") == "cover"), None)
    if not cov:
        return None
    items = []
    for m in metas:
        if m.get("kind") == "point":
            items.append((m["ic"], m["title"], m["a_txt"], (m["b_lbl"], m["b_txt"]) if m.get("b_txt") else None))
        elif m.get("kind") == "framework":
            items += [(ic, a, b, None) for ic, a, b in m["items"]]
    st = next((m for m in metas if m.get("kind") == "statement"), None)
    end = next((m for m in metas if m.get("kind") in ("cta", "checklist")), {})
    return dict(kicker=cov["kicker"], title=cov["title"], lede=cov["lede"], ic=cov["ic"], items=items,
                pull=_plain(st["text"]) if st else "",
                cta_title=_plain(end.get("title", "Want a second pair of eyes?")),
                cta_text=end.get("sub", "Talk to Transputec about a review of your own estate."),
                button=end.get("primary", "Talk to Transputec"))


def onepager(series, kicker, title, lede, items, ic="magnifier", pull="", cta_title="", cta_text="", button="Talk to Transputec", foot=""):
    """items: 3 to 6 tuples (icon, title, text, (label, text) or None). Two columns from 4 items."""
    two = len(items) > 3
    big = len(items) <= 3  # fewer items: larger type, cards share the height
    fs = (17, 13.5, 11.5, 36, 34) if big else (14.5, 11.5, 10.5, 26, 30)
    def card(i, it):
        ic_, t, txt, extra = it
        span = "grid-column:1 / -1;" if two and len(items) % 2 and i == len(items) else ""
        ex = f'<div class="t" style="margin-top:10px;font-size:{fs[2]}px"><b style="color:{GREY};font-weight:600;letter-spacing:.14em;text-transform:uppercase;font-size:8.5px">{extra[0]}</b><br>{extra[1]}</div>' if extra else ''
        return f'''<div class="card" style="{span}display:flex;gap:16px;align-items:center;padding:{22 if big else 16}px {26 if big else 18}px">
          <div style="flex:none;width:{56 if big else 44}px"><div style="font-weight:700;font-size:{fs[3]}px;line-height:1;letter-spacing:-.04em;color:{BRIGHT}">{i:02d}</div><div style="margin-top:8px">{icon(ic_, fs[4])}</div></div>
          <div><div style="font-weight:600;font-size:{fs[0]}px;letter-spacing:-.01em;line-height:1.25">{t}</div><div class="t" style="margin-top:6px;color:{WHITE};font-size:{fs[1]}px">{txt}</div>{ex}</div></div>'''
    grid = "".join(card(i + 1, it) for i, it in enumerate(items))
    cols = "1fr 1fr" if two else "1fr"
    pull_html = f'<div style="margin-top:22px;padding-left:16px;border-left:3px solid {BLUE};font-weight:500;font-size:16px;line-height:1.35;letter-spacing:-.01em">{pull}</div>' if pull else ''
    page = f'''<div class="p">{g(330,-380,900,.3)}{g(-380,760,800,.14)}
      <div class="top"><img src="{LOGO_WHITE}" style="height:14px"><span>{series}</span></div>
      <div style="position:absolute;left:56px;right:56px;top:104px;bottom:178px;display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:20px">
          <div><div class="lbl">{kicker}</div><h1>{title}</h1></div>
          <div style="flex:none;width:74px;height:74px;border-radius:18px;background:linear-gradient(160deg,rgba(59,139,255,.16),rgba(44,114,219,.04));border:1px solid rgba(59,139,255,.32);display:flex;align-items:center;justify-content:center">{icon(ic, 40)}</div></div>
        <div class="t" style="font-size:14px;margin-top:14px;max-width:560px">{lede}</div>{pull_html}
        <div class="grid" style="flex:1;min-height:0;display:grid;grid-template-columns:{cols};grid-auto-rows:{'1fr' if big or len(items) > 4 else 'auto'};align-content:{'stretch' if big or len(items) > 4 else 'start'};gap:14px;margin-top:26px">{grid}</div></div>
      <div style="position:absolute;left:56px;right:56px;bottom:62px;border-radius:16px;padding:22px 24px;background:linear-gradient(120deg,rgba(44,114,219,.35),{CARD} 70%);border:1px solid rgba(59,139,255,.4);display:flex;justify-content:space-between;align-items:center;gap:20px">
        <div><div style="font-weight:600;font-size:19px;letter-spacing:-.02em;line-height:1.2">{cta_title}</div><div class="t" style="margin-top:4px;font-size:11.5px">{cta_text}</div></div>
        <span class="pill" style="flex:none">{button} &rarr;</span></div>
      <div class="bot"><span>{foot or "Transputec · managed IT, cloud and cybersecurity"}</span><span>transputec.com</span></div></div>'''
    return _doc([page], "A4 one-pager")


def review(series, title, pngs, caption, notes="", fmt=""):
    """Sign-off pack: page 1 caption and notes, then slide thumbnails six to a page. pngs are file names next to the HTML."""
    body = caption.strip()
    tags = re.findall(r"#\w+", body)
    first = f'''<div class="p">{g(380,-380,900)}<div class="top"><img src="{LOGO_WHITE}" style="height:13px"><span>{series}</span></div>
      <div style="position:absolute;left:56px;right:56px;top:100px">
        <div class="lbl">LinkedIn post pack · for sign-off</div><h1 style="font-size:34px">{title}</h1>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:22px">
          <div class="card"><div class="lbl" style="font-size:8.5px">Format</div><div class="t" style="margin-top:6px;color:{WHITE}">{fmt}</div></div>
          <div class="card"><div class="lbl" style="font-size:8.5px">Posting notes</div><div class="t" style="margin-top:6px;font-size:11px">{notes or "Upload the PDF as a document post so it swipes. Single images upload as PNG."}</div></div></div>
        <div style="display:grid;grid-template-columns:1fr 230px;gap:14px;margin-top:14px;align-items:start">
          <div class="card"><div class="lbl" style="font-size:8.5px">Caption</div><div class="copy" style="margin-top:10px">{body}</div>
            <div style="margin-top:12px">{"".join(f'<span class="chip">{h}</span>' for h in tags)}</div></div>
          <div class="sl"><img src="{pngs[0]}"><div class="cap"><b>01</b>Lead image</div></div></div></div>
      <div class="bot"><span>Transputec · LinkedIn</span><span>01</span></div></div>'''
    pages = [first]
    for s in range(0, len(pngs), 6):
        chunk = pngs[s:s + 6]
        cells = "".join(f'<div class="sl"><img src="{p}"><div class="cap"><b>{s + k + 1:02d}</b>{p}</div></div>' for k, p in enumerate(chunk))
        pages.append(f'''<div class="p">{g(380,-380,900)}<div class="top"><img src="{LOGO_WHITE}" style="height:13px"><span>{series}</span></div>
          <div style="position:absolute;left:56px;right:56px;top:96px"><div class="lbl">Slides {s + 1} to {s + len(chunk)} of {len(pngs)} · 1080 x 1350</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px 18px;margin-top:18px">{cells}</div></div>
          <div class="bot"><span>Transputec · LinkedIn</span><span>{len(pages) + 1:02d}</span></div></div>''')
    return _doc(pages, "Post pack")
