"""A4 landscape playbook template, November 2026 palette."""
import sys; sys.path.insert(0, "..")
from kit import icon, NAVY, BLUE, BRIGHT, GREY
LOGO_W, LOGO_B = "../../assets/logo-white.svg", "../../assets/logo-blue.svg"
FONTS = "".join(f"@font-face{{font-family:Poppins;font-weight:{w};src:url(../../assets/fonts/poppins-{w}.woff2)}}" for w in (300, 400, 500, 600, 700))
CSS = FONTS + f"""@page{{size:210mm 297mm;margin:0}}*{{box-sizing:border-box;margin:0;padding:0}}
body{{font-family:Poppins;color:{NAVY};-webkit-print-color-adjust:exact}}
.pg{{width:210mm;height:297mm;position:relative;overflow:hidden;background:#fff;page-break-after:always;padding:30mm 18mm 24mm}}
.dark{{background:{NAVY};color:#fff}}
.run{{position:absolute;left:18mm;right:18mm;top:12mm;display:flex;justify-content:space-between;align-items:center;font-size:6.6pt;letter-spacing:.2em;text-transform:uppercase;color:#6B7A90;font-weight:500}}
.dark .run{{color:{GREY}}}
.folio{{position:absolute;left:18mm;right:18mm;bottom:10mm;display:flex;justify-content:space-between;font-size:6.6pt;letter-spacing:.06em;color:#6B7A90;border-top:.25mm solid #E3E8F0;padding-top:3mm}}
.dark .folio{{border-color:rgba(174,186,204,.18);color:{GREY}}}.folio b{{color:{BLUE};font-weight:600}}
.ey{{font-weight:600;font-size:7pt;letter-spacing:.22em;text-transform:uppercase;color:{BLUE}}}.dark .ey{{color:{BRIGHT}}}
h1{{font-weight:600;font-size:30pt;line-height:1.04;letter-spacing:-.035em}}h2{{font-weight:600;font-size:27pt;line-height:1.08;letter-spacing:-.03em}}
h3{{font-weight:600;font-size:13.5pt;letter-spacing:-.01em;line-height:1.25}}
.b{{color:{BLUE}}}.dark .b{{color:{BRIGHT}}}
.lede{{font-weight:300;font-size:12pt;line-height:1.5;color:#3A4559}}.dark .lede{{color:{GREY}}}
.tx{{font-size:10.2pt;line-height:1.6;color:#3A4559;font-weight:400}}.dark .tx{{color:{GREY}}}
.card{{background:#F4F6FA;border-radius:4mm;padding:8mm}}.dark .card{{background:#111A2B;border:.25mm solid rgba(174,186,204,.14)}}
.lab{{font-weight:600;font-size:6.6pt;letter-spacing:.2em;text-transform:uppercase;color:#6B7A90}}.dark .lab{{color:{GREY}}}
.tile{{width:12mm;height:12mm;border-radius:3mm;background:rgba(44,114,219,.1);display:flex;align-items:center;justify-content:center;flex:none}}
.dark .tile{{background:rgba(59,139,255,.14);border:.25mm solid rgba(59,139,255,.3)}}
.hair{{border-top:.25mm solid #E3E8F0}}.dark .hair{{border-color:rgba(174,186,204,.16)}}
.box{{width:5mm;height:5mm;border:.5mm solid {BLUE};border-radius:1.2mm;flex:none;margin-top:.6mm}}
.glow{{position:absolute;border-radius:50%;pointer-events:none}}
"""
def glow(x, y, s, a=.3, c="44,114,219"): return f'<div class="glow" style="left:{x}mm;top:{y}mm;width:{s}mm;height:{s}mm;background:radial-gradient(circle,rgba({c},{a}),rgba({c},0) 65%)"></div>'
def ic(name, mm=6.5, dark=False): return f'<div class="tile">{icon(name, mm*3.78, BRIGHT if dark else BLUE, 3)}</div>'

class Book:
    def __init__(s, short, series): s.short, s.series, s.pages, s.toc, s.how = short, series, [], [], ""
    def _wrap(s, body, dark=False, sec="", folio=True, bg="", run_dark=False):
        s.pages.append((body, dark, sec, folio, bg, run_dark))
    def html(s, offset=0, total=None):
        n = total or len(s.pages); out = []; s._off = offset
        for i, (body, dark, sec, folio, bg, rd) in enumerate(s.pages):
            i += offset
            if body == "__TOC__": body = s._toc()
            run = f'<div class="run" style="{"color:"+GREY if rd else ""}"><img src="{LOGO_W if dark or rd else LOGO_B}" style="height:3.4mm"><span>{sec}</span></div>' if folio else ""
            fol = f'<div class="folio"><span>{s.short} · {s.series}</span><span><b>{i+1:02d}</b> / {n:02d}</span></div>' if folio else ""
            out.append(f'<section class="pg {"dark" if dark else ""}">{bg}{body}{run}{fol}</section>')
        return "".join(out)
    def build(s, path):
        open(path, "w", encoding="utf8").write(f'<!doctype html><meta charset="utf8"><title>{s.short}</title><style>{CSS}</style>' + s.html())

    # ---------- page types (A4 portrait)
    def _hd(s, ey, title, lede, w="174mm"):
        return f'<div class="ey">{ey}</div><h2 style="margin-top:4mm;width:{w}">{title}</h2>' + (f'<div class="lede" style="margin-top:6mm;width:{w};font-size:12.5pt">{lede}</div>' if lede else "")
    def cover(s, kicker, t1, t2, lede, icons, tag):
        tiles = "".join(f'<div style="width:34mm;height:34mm;border-radius:8mm;background:rgba(59,139,255,{.08+.05*i});border:.3mm solid rgba(59,139,255,{.25+.12*i});display:flex;align-items:center;justify-content:center">{icon(n, 60, BRIGHT, 2.4)}</div>' for i, n in enumerate(icons))
        s._wrap(f'''<img src="{LOGO_W}" style="position:absolute;left:18mm;top:18mm;height:5.6mm">
        <span style="position:absolute;right:18mm;top:19mm;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:{GREY};font-weight:500">{tag}</span>
        <div style="position:absolute;right:26mm;top:52mm;display:grid;grid-template-columns:repeat(2,34mm);gap:7mm;transform:rotate(-8deg)">{tiles}</div>
        <div style="position:absolute;left:18mm;right:18mm;top:150mm"><div class="ey">{kicker}</div>
        <div style="font-weight:600;font-size:42pt;line-height:1.02;letter-spacing:-.045em;margin-top:6mm">{t1}<br><span class="b">{t2}</span></div>
        <div class="lede" style="margin-top:8mm;width:160mm;font-size:13pt">{lede}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:16mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:{GREY}"><span>A Transputec playbook</span><span>November 2026 · transputec.com</span></div>''',
        True, folio=False, bg=glow(40, -110, 260, .4) + glow(-90, 190, 220, .16, "59,139,255"))
    def contents(s):
        s._wrap("__TOC__", sec="Contents")
    def _toc(s):
        rows = "".join(f'<div style="display:flex;align-items:baseline;gap:6mm;padding:8mm 0;border-bottom:.25mm solid #E3E8F0"><span style="width:10mm;font-weight:600;font-size:9pt;color:{BLUE}">{a}</span><span style="flex:1;font-size:16pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span><span style="font-size:8pt;color:#6B7A90;font-weight:600">{c + s._off:02d}</span></div>' for a, b, c in s.toc)
        return f'<div class="ey">Inside</div><h1 style="margin-top:4mm">Contents</h1><div class="lede" style="margin-top:6mm;font-size:10.5pt;width:160mm">{s.how}</div><div style="border-top:.25mm solid #E3E8F0;margin-top:14mm">{rows}</div>'
    def mark(s, num, title): s.toc.append((num, title, len(s.pages) + 1))
    def intro(s, ey, title, lede, pts, sec="Introduction"):
        cards = "".join(f'<div class="card" style="display:flex;gap:6mm;padding:10mm 9mm">{ic(i)}<div><h3>{t}</h3><div class="tx" style="margin-top:2mm">{x}</div></div></div>' for i, t, x in pts)
        s._wrap(f'''<div class="ey">{ey}</div><h1 style="margin-top:4mm">{title}</h1><div class="lede" style="margin-top:8mm;font-size:13.5pt">{lede}</div>
        <div style="display:flex;flex-direction:column;gap:9mm;margin-top:22mm">{cards}</div>''', sec=sec)
    def opener(s, num, word, line, items):
        it = "".join(f'<div style="display:flex;gap:4mm;padding:4mm 0;border-top:.25mm solid rgba(174,186,204,.18);font-size:10pt"><span style="color:{BRIGHT};font-weight:600;width:9mm">{a}</span><span>{b}</span></div>' for a, b in items)
        s._wrap(f'''<div style="position:absolute;left:18mm;right:18mm;top:96mm"><div class="ey">Part {num}</div>
        <div style="font-weight:600;font-size:64pt;line-height:.98;letter-spacing:-.05em;margin-top:5mm">{word}</div>
        <div class="lede" style="margin-top:8mm;width:160mm;font-size:14pt;color:#fff">{line}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:30mm">{it}</div>''', True, f"Part {num}",
        bg=glow(40, -90, 240, .36) + f'<div style="position:absolute;right:10mm;top:14mm;font-weight:700;font-size:210pt;line-height:1;color:rgba(59,139,255,.08);letter-spacing:-.06em">{num}</div>')
    def compare(s, ey, title, lede, heads, rows, sec):
        hd = "".join(f'<div class="lab" style="{"color:"+BLUE if i==2 else ""}">{h}</div>' for i, h in enumerate(heads))
        rr = "".join(f'<div style="display:grid;grid-template-columns:36mm 1fr 1fr;gap:7mm;padding:6.6mm 0;border-top:.25mm solid #E3E8F0"><div style="font-weight:600;font-size:10.5pt">{r[0]}</div><div class="tx">{r[1]}</div><div class="tx" style="color:{NAVY}">{r[2]}</div></div>' for r in rows)
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:12mm;display:grid;grid-template-columns:36mm 1fr 1fr;gap:7mm;padding-bottom:3mm">{hd}</div><div style="border-bottom:.25mm solid #E3E8F0">{rr}</div>', sec=sec)
    def grid(s, ey, title, lede, cards, sec, note=""):
        cc = "".join(f'<div class="card" style="display:flex;flex-direction:column;gap:4mm;min-height:66mm">{ic(i)}<h3>{t}</h3><div class="tx">{x}</div></div>' for i, t, x in cards)
        nt = f'<div style="margin-top:8mm;padding:5mm 6mm;border-left:1mm solid {BLUE};background:rgba(44,114,219,.06);font-size:11pt;font-weight:500;line-height:1.5">{note}</div>' if note else ""
        s._wrap(s._hd(ey, title, lede) + f'<div style="display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:14mm">{cc}</div>{nt}', sec=sec)
    def dive(s, n, ico, title, line, quads, sec, owner=""):
        q = "".join(f'<div style="padding:7.4mm 0;border-top:.25mm solid #E3E8F0"><div class="lab" style="color:{BLUE};font-size:7.6pt">{a}</div><div class="tx" style="margin-top:3.4mm;font-size:12pt;line-height:1.55;color:{NAVY}">{b}</div></div>' for a, b in quads)
        ow = ""
        ob = f'<div style="position:absolute;left:18mm;right:18mm;bottom:28mm;display:flex;gap:6mm;align-items:center;padding:6mm 7mm;border-radius:4mm;background:#F4F6FA">{ic("owner")}<div><div class="lab" style="color:{BLUE}">Owner</div><div style="font-weight:600;font-size:12pt;margin-top:1.4mm">{owner}</div></div><div style="margin-left:auto;font-size:9.4pt;color:#6B7A90;text-align:right;width:62mm">Bring this to the monthly review, with a date for each action.</div></div>' if owner else ""
        s._wrap(f'''<div style="position:absolute;left:0;right:0;top:0;height:132mm;background:{NAVY};color:#fff;padding:34mm 18mm 0;overflow:hidden">{glow(90,-90,200,.34)}
          <div style="position:relative"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="font-weight:700;font-size:62pt;line-height:.9;letter-spacing:-.05em;color:{BRIGHT}">{n}</div><div class="tile" style="width:18mm;height:18mm;background:rgba(59,139,255,.14);border:.25mm solid rgba(59,139,255,.35)">{icon(ico, 40, BRIGHT, 2.6)}</div></div>
          <h2 style="margin-top:12mm;font-size:28pt">{title}</h2><div style="font-weight:300;font-size:13pt;line-height:1.5;color:{GREY};margin-top:4mm;width:165mm">{line}</div>{ow}</div></div>
          <div style="position:absolute;left:18mm;right:18mm;top:146mm;display:grid;grid-template-columns:1fr 1fr;gap:0 12mm;border-bottom:.25mm solid #E3E8F0">{q}</div>{ob}''', sec=sec, run_dark=True)
    def steps(s, ey, title, lede, items, sec, note=""):
        it = "".join(f'<div style="display:grid;grid-template-columns:13mm 1fr;gap:4mm;padding:7mm 0;border-top:.25mm solid #E3E8F0"><div style="font-weight:700;font-size:18pt;color:{BLUE};line-height:1">{i+1:02d}</div><div><h3>{t}</h3><div class="tx" style="margin-top:1.6mm">{x}</div></div></div>' for i, (t, x) in enumerate(items))
        nt = f'<div class="card" style="margin-top:8mm;background:{NAVY};color:#fff;font-size:11pt;line-height:1.55"><div class="lab" style="color:{BRIGHT};margin-bottom:2mm">Remember</div>{note}</div>' if note else ""
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:10mm;border-bottom:.25mm solid #E3E8F0">{it}</div>{nt}', sec=sec)
    def questions(s, ey, title, lede, cols, sec):
        cc = "".join(f'<div class="card"><div class="lab" style="color:{BRIGHT}">{h}</div>' + "".join(f'<div style="display:flex;gap:3mm;padding:5mm 0;border-top:.25mm solid rgba(174,186,204,.16);margin-top:{3 if j==0 else 0}mm;font-size:11.4pt;line-height:1.45"><span style="color:{BRIGHT};font-weight:600">?</span><span>{q}</span></div>' for j, q in enumerate(qs)) + '</div>' for h, qs in cols)
        s._wrap(s._hd(ey, title, lede) + f'<div style="display:flex;flex-direction:column;gap:6mm;margin-top:10mm">{cc}</div>', True, sec, bg=glow(70, -110, 230, .28))
    def checklist(s, ey, title, lede, items, sec, note=""):
        it = "".join(f'<div style="display:flex;gap:4mm;padding:6.4mm 0;border-top:.25mm solid #E3E8F0"><div class="box" style="width:6mm;height:6mm"></div><div><div style="font-weight:600;font-size:12pt">{t}</div>{f"<div class=tx style=margin-top:1mm>{x}</div>" if x else ""}</div></div>' for t, x in items)
        nt = f'<div style="margin-top:7mm;font-size:8.8pt;color:#6B7A90">{note}</div>' if note else ""
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:10mm;border-bottom:.25mm solid #E3E8F0">{it}</div>{nt}', sec=sec)
    def flow(s, ey, title, lede, stages, sec, foot=""):
        n = len(stages)
        line = '<div style="position:absolute;left:6mm;top:13mm;bottom:0;border-left:.5mm dashed ' + BLUE + ';opacity:.5"></div>'
        st = "".join(f'<div style="display:grid;grid-template-columns:12mm 1fr;gap:6mm;position:relative;padding-bottom:10mm">{ic(a)}<div><h3>{b}</h3><div class="tx" style="margin-top:1.6mm">{c}</div></div>{"" if i==n-1 else line}</div>' for i, (a, b, c) in enumerate(stages))
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:12mm">{st}</div>' + (f'<div style="margin-top:4mm;padding:5mm 6mm;border-left:1mm solid {BLUE};background:rgba(44,114,219,.06);font-size:9.6pt;font-weight:500">{foot}</div>' if foot else ""), sec=sec)
    def quote(s, text, who, sec):
        s._wrap(f'''<div style="position:absolute;left:18mm;right:24mm;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
        <svg width="70" height="56" viewBox="0 0 110 90"><path d="M8 88V52C8 22 22 6 46 2l4 12C34 20 28 32 28 46h20v42zM62 88V52C62 22 76 6 100 2l4 12C88 20 82 32 82 46h20v42z" fill="{BRIGHT}"/></svg>
        <div style="font-weight:500;font-size:28pt;line-height:1.2;letter-spacing:-.03em;margin-top:9mm">{text}</div>
        <div class="lab" style="margin-top:10mm;color:{GREY}">{who}</div></div>''', True, sec, bg=glow(60, -60, 240, .3))
    def back(s, title, lede, cta, extra=""):
        s._wrap(f'''<div style="position:absolute;left:18mm;right:18mm;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
        <img src="{LOGO_W}" style="height:6mm;align-self:flex-start"><div style="font-weight:600;font-size:34pt;line-height:1.06;letter-spacing:-.04em;margin-top:14mm">{title}</div>
        <div class="lede" style="margin-top:8mm;width:160mm">{lede}</div>
        <div style="margin-top:12mm;display:flex;gap:4mm"><span style="background:{BLUE};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:500;font-size:10pt">{cta}</span><span style="border:.3mm solid rgba(174,186,204,.4);border-radius:99px;padding:3.6mm 7mm;font-size:10pt">transputec.com</span></div>{extra}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:16mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:{GREY}"><span>Transputec · {s.series}</span><span>Cost control series</span></div>''',
        True, folio=False, bg=glow(60, -40, 260, .36) + glow(-90, 180, 200, .14, "59,139,255"))
