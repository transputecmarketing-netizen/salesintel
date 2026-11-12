"""Slide layouts for Transputec LinkedIn posts.

Every layout returns a deferred slide: a function build.py calls with (series, idx, total).
That way slide numbers, totals and the "Swipe" pill are filled in for you.
Use <span class="b">...</span> for blue emphasis and <br> for a deliberate line break.
"""
from kit import *


def _num(idx, total, carousel):
    return (idx, total) if carousel else (None, None)


def cover(kicker, title, lede, ic="magnifier", extra=""):
    """Carousel cover (or a standalone headline post). title: 2 lines, about 30 characters each."""
    def f(series, idx, total):
        inner = f'''
        <div style="position:absolute;left:88px;top:250px">{icon_tile(ic, 170)}</div>
        <div style="position:absolute;left:88px;right:88px;top:500px">
          <div class="lbl">{kicker}</div>
          <div class="h1" style="margin-top:26px">{title}</div>
          <div class="rule" style="width:180px;margin:44px 0 40px"></div>
          <div class="lede" style="max-width:820px">{lede}</div>{extra}</div>'''
        return slide(inner, series, swipe=total > 1, bg=glow(520, -360, 1000, .26) + glow(-420, 900, 900, .12, "59,139,255"))
    f.meta = dict(kind="cover", **{k: v for k, v in locals().items() if k != "f"})
    return f


def statement(kicker, text, sub=""):
    """Big centred statement. text: up to about 60 characters; sub: one or two sentences."""
    def f(series, idx, total):
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
          <div class="lbl">{kicker}</div><div class="h2" style="margin-top:30px;font-size:70px">{text}</div>
          {f'<div class="lede" style="margin-top:40px;max-width:820px">{sub}</div>' if sub else ''}</div>'''
        return slide(inner, series, idx, total, bg=glow(-300, 300, 1000, .14) + glow(600, 700, 900, .14, "59,139,255"))
    f.meta = dict(kind="statement", **{k: v for k, v in locals().items() if k != "f"})
    return f


def point(n, ic, title, a_lbl, a_txt, b_lbl="", b_txt=""):
    """Numbered point: big 01, icon tile, title (one line, up to about 28 characters), card with one or two labelled parts.
    a_txt and b_txt: one sentence each, up to about 110 characters."""
    def f(series, idx, total):
        second = (f'''<div style="height:1.5px;background:rgba(174,186,204,.14);margin:40px 0"></div>
            <div class="lbl" style="color:{GREY}">{b_lbl}</div><div class="body" style="margin-top:18px;font-size:32px;line-height:1.4">{b_txt}</div>''' if b_txt else '')
        inner = f'''
        <div style="position:absolute;left:88px;right:88px;top:210px;display:flex;justify-content:space-between;align-items:flex-start">
          <div style="font-weight:700;font-size:180px;line-height:.9;letter-spacing:-.06em;background:linear-gradient(180deg,{BRIGHT},{BLUE});-webkit-background-clip:text;color:transparent">{n:02d}</div>{icon_tile(ic, 160)}</div>
        <div style="position:absolute;left:88px;right:88px;top:470px">
          <div class="h2">{title}</div>
          <div class="card" style="margin-top:60px;padding:52px 52px">
            <div class="lbl">{a_lbl}</div><div class="body" style="margin-top:18px;color:{WHITE};font-size:36px;line-height:1.4">{a_txt}</div>{second}</div></div>'''
        return slide(inner, series, idx, total, bg=glow(600, -300, 820, .16))
    f.meta = dict(kind="point", **{k: v for k, v in locals().items() if k != "f"})
    return f


def cta(title, sub, primary="Talk to Transputec", secondary="Follow for more", next_txt="", next_lbl="Next week"):
    """Closing slide: title (2 short lines), one-sentence sub, two pills, optional 'Next week' teaser card."""
    def f(series, idx, total):
        nxt = (f'<div class="card" style="margin-top:100px;padding:32px 40px;display:flex;gap:24px;align-items:center"><div class="lbl" style="white-space:nowrap">{next_lbl}</div><div class="body" style="color:{WHITE};font-size:28px">{next_txt}</div></div>' if next_txt else '')
        sec = f'<span class="pill">{secondary}</span>' if secondary else ''
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:170px;bottom:200px;display:flex;flex-direction:column;justify-content:center">
          <div class="h2" style="font-size:76px">{title}</div>
          <div class="lede" style="margin-top:40px;max-width:840px">{sub}</div>
          <div style="margin-top:70px;display:flex;gap:18px;flex-wrap:wrap"><span class="pill solid">{primary} {arrow(22)}</span>{sec}</div>{nxt}</div>'''
        return slide(inner, series, idx, total, bg=glow(300, -380, 1100, .3))
    f.meta = dict(kind="cta", **{k: v for k, v in locals().items() if k != "f"})
    return f


def compare(kicker, title, lede, left, right):
    """Two-card editorial (single-image post). left/right = (icon, name, line, detail); the right card is highlighted.
    line: about 40 characters with one <span class="b"> phrase; detail: about 60 characters."""
    def card(c, hi):
        ic, name, line, detail = c
        style = f'background:linear-gradient(160deg,rgba(44,114,219,.28),{CARD} 70%);border-color:rgba(59,139,255,.4);' if hi else ''
        return f'''<div class="card" style="padding:48px 42px;min-height:500px;{style}">{icon(ic, 84)}<div style="font-weight:600;font-size:38px;margin-top:26px;letter-spacing:-.02em">{name}</div>
          <div class="body" style="margin-top:12px;color:{WHITE}">{line}</div><div class="body" style="margin-top:22px;font-size:24px">{detail}</div></div>'''
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:210px">
            <div class="lbl">{kicker}</div><div class="h1" style="margin-top:24px;font-size:80px">{title}</div>
            <div class="lede" style="margin-top:30px">{lede}</div></div>
          <div style="position:absolute;left:88px;right:88px;top:640px;display:grid;grid-template-columns:1fr 1fr;gap:28px">{card(left, False)}{card(right, True)}</div>'''
        return slide(inner, series, n, t, bg=glow(500, -340, 1000, .24))
    f.meta = dict(kind="compare", **{k: v for k, v in locals().items() if k != "f"})
    return f


def quote(text, attribution="Transputec"):
    """Quote card (single image). text: up to about 140 characters, with one or two <span class="b"> phrases."""
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
          <svg width="110" height="90" viewBox="0 0 110 90"><path d="M8 88V52C8 22 22 6 46 2l4 12C34 20 28 32 28 46h20v42zM62 88V52C62 22 76 6 100 2l4 12C88 20 82 32 82 46h20v42z" fill="{BLUE}"/></svg>
          <div style="font-weight:500;font-size:62px;line-height:1.16;letter-spacing:-.03em;margin-top:48px">{text}</div>
          <div class="rule" style="width:160px;margin:56px 0 28px"></div><div class="tag">{attribution}</div></div>'''
        return slide(inner, series, n, t, bg=glow(-400, -300, 1100, .2) + glow(500, 800, 900, .16, "59,139,255"))
    f.meta = dict(kind="quote", **{k: v for k, v in locals().items() if k != "f"})
    return f


def myth(kicker, title, rows, left_lbl="Myth", right_lbl="Reality"):
    """Myth vs reality table (single image). rows: 3 or 4 (myth, reality) pairs, each under about 50 characters."""
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        rr = "".join(f'''<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:30px 0;border-top:1.5px solid rgba(174,186,204,.14)">
          <div style="display:flex;gap:18px;align-items:flex-start"><svg width="34" height="34" viewBox="0 0 24 24" style="flex:none;margin-top:4px"><circle cx="12" cy="12" r="10" fill="none" stroke="{GREY}" stroke-width="1.8"/><path d="M8 8l8 8M16 8l-8 8" stroke="{GREY}" stroke-width="1.8" stroke-linecap="round"/></svg><div class="body" style="font-size:28px;text-decoration:line-through;text-decoration-color:rgba(174,186,204,.5)">{m}</div></div>
          <div style="display:flex;gap:18px;align-items:flex-start"><svg width="34" height="34" viewBox="0 0 24 24" style="flex:none;margin-top:4px"><circle cx="12" cy="12" r="10" fill="{BLUE}"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="body" style="font-size:28px;color:{WHITE}">{r}</div></div></div>''' for m, r in rows)
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:210px">
          <div class="lbl">{kicker}</div><div class="h1" style="margin-top:22px;font-size:78px">{title}</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:64px"><div class="tag">{left_lbl}</div><div class="tag" style="color:{BRIGHT}">{right_lbl}</div></div>
          <div style="margin-top:16px;border-bottom:1.5px solid rgba(174,186,204,.14)">{rr}</div></div>'''
        return slide(inner, series, n, t, bg=glow(520, -340, 1000, .22))
    f.meta = dict(kind="myth", **{k: v for k, v in locals().items() if k != "f"})
    return f


def framework(kicker, title, items, lede=""):
    """Icon list (single image or mid-carousel summary). items: 3 or 4 (icon, title, one-line text under about 55 characters)."""
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        rows = "".join(f'''<div style="display:flex;gap:30px;align-items:center;padding:30px 0;border-top:1.5px solid rgba(174,186,204,.14)">
            {icon_tile(ic, 104)}<div><div style="font-weight:600;font-size:36px;letter-spacing:-.02em">{a}</div><div class="body" style="font-size:26px;margin-top:6px">{b}</div></div></div>''' for ic, a, b in items)
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:200px">
          <div class="lbl">{kicker}</div><div class="h2" style="margin-top:22px">{title}</div>
          {f'<div class="lede" style="margin-top:22px;font-size:30px">{lede}</div>' if lede else ''}
          <div style="margin-top:44px;border-bottom:1.5px solid rgba(174,186,204,.14)">{rows}</div></div>'''
        return slide(inner, series, n, t, bg=glow(520, -340, 1000, .22))
    f.meta = dict(kind="framework", **{k: v for k, v in locals().items() if k != "f"})
    return f


def checklist(kicker, title, items, primary="Ask us for a review", secondary="Save this post", note=""):
    """Tick-box summary with call to action (last slide of a checklist carousel, or a single image). items: up to 5 short lines."""
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        rows = "".join(f'<div style="display:flex;gap:22px;align-items:center;padding:24px 0;border-top:1.5px solid rgba(174,186,204,.14)"><div style="width:44px;height:44px;border-radius:12px;border:2px solid {BRIGHT};flex:none"></div><div style="font-weight:500;font-size:32px;letter-spacing:-.01em">{x}</div></div>' for x in items)
        sec = f'<span class="pill">{secondary}</span>' if secondary else ''
        inner = f'''<div style="position:absolute;left:88px;right:88px;top:200px">
          <div class="lbl">{kicker}</div><div class="h2" style="margin-top:22px">{title}</div>
          <div style="margin-top:44px;border-bottom:1.5px solid rgba(174,186,204,.14)">{rows}</div>
          <div style="margin-top:56px;display:flex;gap:18px;flex-wrap:wrap"><span class="pill solid">{primary} {arrow(22)}</span>{sec}</div>
          {f'<div class="body" style="margin-top:40px;font-size:24px">{note}</div>' if note else ''}</div>'''
        return slide(inner, series, n, t, bg=glow(500, -360, 1000, .24))
    f.meta = dict(kind="checklist", **{k: v for k, v in locals().items() if k != "f"})
    return f


def raw(inner, bg=""):
    """Escape hatch: your own absolutely positioned HTML between header and footer, using kit classes."""
    def f(series, idx, total):
        n, t = _num(idx, total, total > 1)
        return slide(inner, series, n, t, bg=bg)
    f.meta = dict(kind="raw", **{k: v for k, v in locals().items() if k != "f"})
    return f
