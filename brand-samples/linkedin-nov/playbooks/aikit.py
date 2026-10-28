"""AI playbook series template: A4 portrait, art covers. Extends pbkit.Book."""
from pbkit import Book, glow, ic, LOGO_W, LOGO_B, NAVY, BLUE, BRIGHT, GREY, icon
ART = "art/"

class AIBook(Book):
    def __init__(s, short, series="AI Playbook Series", num=1, art="silk", pos="70%"):
        super().__init__(short, series); s.num, s.art, s.pos = num, art, pos

    def art_cover(s, kicker, t1, t2, lede, tag="AI playbook"):
        s._wrap(f'''<div style="position:absolute;inset:0;background:url({ART}{s.art}.jpg) {s.pos} center/cover no-repeat"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,7,12,.55) 0%,rgba(5,7,12,0) 22%,rgba(5,7,12,0) 42%,rgba(5,7,12,.82) 66%,#05070C 100%)"></div>
        <img src="{LOGO_W}" style="position:absolute;left:18mm;top:18mm;height:5.4mm">
        <div style="position:absolute;right:18mm;top:17mm;text-align:right;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.75);font-weight:500">{tag}<div style="margin-top:1.6mm;color:{BRIGHT}">No. {s.num:02d}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:40mm"><div class="ey" style="color:{BRIGHT}">{kicker}</div>
        <div style="font-weight:600;font-size:46pt;line-height:1;letter-spacing:-.05em;margin-top:6mm">{t1}<br><span style="color:{BRIGHT}">{t2}</span></div>
        <div style="font-weight:300;font-size:13pt;line-height:1.5;color:rgba(255,255,255,.82);margin-top:8mm;width:158mm">{lede}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:16mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:{GREY};border-top:.25mm solid rgba(174,186,204,.25);padding-top:4mm"><span>{s.series}</span><span>transputec.com</span></div>''', True, folio=False)

    def art_back(s, title, lede, cta, next_title=""):
        nx = f'<div style="margin-top:16mm;padding-top:6mm;border-top:.25mm solid rgba(174,186,204,.25);width:150mm"><div class="lab" style="color:{BRIGHT}">Also in the series</div><div style="font-size:11pt;margin-top:2.4mm;color:#fff">{next_title}</div></div>' if next_title else ""
        s._wrap(f'''<div style="position:absolute;inset:0;background:url({ART}{s.art}.jpg) {s.pos} center/cover no-repeat;transform:scaleY(-1)"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,#05070C 0%,rgba(5,7,12,.86) 45%,rgba(5,7,12,.2) 100%)"></div>
        <div style="position:absolute;left:18mm;right:18mm;top:40mm"><img src="{LOGO_W}" style="height:6mm">
        <div style="font-weight:600;font-size:36pt;line-height:1.05;letter-spacing:-.04em;margin-top:22mm">{title}</div>
        <div style="font-weight:300;font-size:13pt;line-height:1.55;color:rgba(255,255,255,.82);margin-top:8mm;width:155mm">{lede}</div>
        <div style="margin-top:12mm;display:flex;gap:4mm"><span style="background:{BLUE};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:500;font-size:10pt">{cta}</span><span style="border:.3mm solid rgba(255,255,255,.4);border-radius:99px;padding:3.6mm 7mm;font-size:10pt">transputec.com</span></div>{nx}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:16mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)"><span>Transputec · {s.series} · No. {s.num:02d}</span><span>Managed IT · Cloud · Security · AI</span></div>''', True, folio=False)

    def foreword(s, title, paras, sign="The Transputec team"):
        p = "".join(f'<p class="tx" style="font-size:11pt;line-height:1.7;margin-top:{0 if i==0 else 5}mm">{t}</p>' for i, t in enumerate(paras))
        s._wrap(f'''<div class="ey">Foreword</div><h1 style="margin-top:4mm;width:170mm">{title}</h1>
        <div style="margin-top:12mm;width:160mm">{p}</div>
        <div style="margin-top:12mm;display:flex;gap:5mm;align-items:center"><div style="width:14mm;height:14mm;border-radius:50%;background:{NAVY};display:flex;align-items:center;justify-content:center"><img src="{LOGO_W}" style="width:10mm"></div><div><div style="font-weight:600;font-size:11pt">{sign}</div><div class="tx" style="font-size:9pt">Transputec</div></div></div>''', sec="Foreword")

    def essay(s, ey, title, paras, sec, pull=""):
        p = "".join(f'<p class="tx" style="font-size:10.4pt;line-height:1.7;margin-bottom:4.5mm">{t}</p>' for t in paras)
        pl = f'<div style="margin:2mm 0 8mm;padding:6mm 0 6mm 7mm;border-left:1.2mm solid {BLUE};font-weight:500;font-size:15pt;line-height:1.35;letter-spacing:-.015em">{pull}</div>' if pull else ""
        s._wrap(f'{s._hd(ey, title, "")}<div style="margin-top:10mm;columns:2;column-gap:10mm">{pl}{p}</div>', sec=sec)

    def usecase(s, ey, title, cases, sec):
        cc = "".join(f'''<div class="card" style="padding:7mm 8mm"><div style="display:flex;gap:4mm;align-items:center">{ic(i)}<div><div class="lab" style="color:{BLUE}">{team}</div><h3 style="margin-top:1mm">{t}</h3></div></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:3mm 8mm;margin-top:5mm">{"".join(f'<div><div class="lab" style="font-size:6.2pt">{a}</div><div class="tx" style="margin-top:1.2mm;font-size:9.4pt">{b}</div></div>' for a, b in qa)}</div></div>''' for i, team, t, qa in cases)
        s._wrap(f'{s._hd(ey, title, "")}<div style="display:flex;flex-direction:column;gap:6mm;margin-top:9mm">{cc}</div>', sec=sec)

    def table(s, ey, title, lede, heads, rows, sec, widths=None):
        n = len(heads); cols = widths or ("34mm " + " ".join(["1fr"] * (n - 1)))
        hd = "".join(f'<div class="lab" style="{"color:"+BLUE if i else ""}">{h}</div>' for i, h in enumerate(heads))
        rr = "".join(f'<div style="display:grid;grid-template-columns:{cols};gap:6mm;padding:5.4mm 0;border-top:.25mm solid #E3E8F0"><div style="font-weight:600;font-size:10pt">{r[0]}</div>' + "".join(f'<div class="tx" style="font-size:9.6pt">{c}</div>' for c in r[1:]) + '</div>' for r in rows)
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:11mm;display:grid;grid-template-columns:{cols};gap:6mm;padding-bottom:3mm">{hd}</div><div style="border-bottom:.25mm solid #E3E8F0">{rr}</div>', sec=sec)

    def matrix(s, ey, title, lede, xl, yl, quads, sec):
        q = "".join(f'<div style="background:{"#F4F6FA" if i!=1 else NAVY};color:{"#fff" if i==1 else NAVY};border-radius:4mm;padding:7mm"><div class="lab" style="color:{BRIGHT if i==1 else BLUE}">{a}</div><h3 style="margin-top:2mm">{b}</h3><div class="tx" style="margin-top:2mm;{"color:"+GREY if i==1 else ""}">{c}</div></div>' for i, (a, b, c) in enumerate(quads))
        s._wrap(s._hd(ey, title, lede) + f'''<div style="position:relative;margin-top:14mm;padding:0 0 10mm 10mm"><div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:68mm 68mm;gap:4mm">{q}</div>
        <div style="position:absolute;left:0;top:0;bottom:10mm;width:.5mm;background:{BLUE}"></div><div style="position:absolute;left:0;right:0;bottom:6mm;height:.5mm;background:{BLUE}"></div>
        <div class="lab" style="position:absolute;right:0;bottom:0">{xl} →</div><div class="lab" style="position:absolute;left:-2mm;top:-6mm">↑ {yl}</div></div>''', sec=sec)

    def statement(s, text, sub, sec):
        s._wrap(f'''<div style="position:absolute;left:18mm;right:22mm;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
        <div style="width:16mm;height:1.2mm;background:{BRIGHT};margin-bottom:12mm"></div>
        <div style="font-weight:600;font-size:34pt;line-height:1.1;letter-spacing:-.04em">{text}</div>
        <div class="lede" style="margin-top:10mm;font-size:13pt;width:150mm">{sub}</div></div>''', True, sec, bg=f'<div style="position:absolute;inset:0;background:url({ART}{s.art}.jpg) {s.pos} center/cover;opacity:.28"></div>' + glow(60, -60, 240, .2))

    def glossary(s, title, items, sec="Glossary"):
        it = "".join(f'<div style="padding:4.6mm 0;border-top:.25mm solid #E3E8F0;break-inside:avoid"><div style="font-weight:600;font-size:10.4pt">{a}</div><div class="tx" style="margin-top:1.2mm;font-size:9.4pt">{b}</div></div>' for a, b in items)
        s._wrap(f'{s._hd("Glossary", title, "")}<div style="margin-top:10mm;columns:2;column-gap:10mm">{it}</div>', sec=sec)

    def principles(s, ey, title, lede, items, sec):
        it = "".join(f'<div style="padding:6mm 0;border-top:.25mm solid rgba(174,186,204,.2);display:grid;grid-template-columns:16mm 1fr;gap:4mm"><div style="font-weight:700;font-size:20pt;color:{BRIGHT};line-height:1">{i+1:02d}</div><div><div style="font-weight:600;font-size:13pt">{t}</div><div class="tx" style="margin-top:1.6mm;font-size:10pt">{x}</div></div></div>' for i, (t, x) in enumerate(items))
        s._wrap(s._hd(ey, title, lede) + f'<div style="margin-top:10mm;border-bottom:.25mm solid rgba(174,186,204,.2)">{it}</div>', True, sec, bg=glow(80, -120, 240, .28))
