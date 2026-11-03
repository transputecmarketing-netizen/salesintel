"""Hot Topics series: dark playbooks (HotBook) and white editorial intelligence reports (RBook)."""
from aikit import AIBook
from pbkit import glow, ic, LOGO_W, LOGO_B, NAVY, BLUE, BRIGHT, GREY, icon
FIGS = "riffle terrain exploded phosphor slow turntable keyboard elevator phone laptop terminal cabinet branches vault lockers padlock patch dish router loupe sieve rail plug query drawer basket plot hub relay settle format rebuild stack".split()
def S(*n): return '<sup class="c" style="font-size:.6em;color:#2C72DB;font-weight:600;margin-left:.15em">' + ",".join(str(x) for x in n) + '</sup>'

class HotBook(AIBook):
    """Playbook with art2 background and a hairline figure on the cover."""
    def __init__(s, short, num, art, fig, series="Hot Topics · Playbook"):
        super().__init__(short, series, num, art, "80%"); s.fig = fig
    def art_cover(s, kicker, t1, t2, lede, tag="Playbook"):
        s._wrap(f'''<div style="position:absolute;inset:0;background:url(art2/{s.art}.jpg) 82% center/cover"></div>
        <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(5,7,12,.3),rgba(5,7,12,.1) 30%,rgba(5,7,12,.85) 62%,#05070C)"></div>
        <img src="hl/dark/{s.fig}.png" style="position:absolute;left:30mm;right:30mm;top:30mm;width:150mm">
        <img src="{LOGO_W}" style="position:absolute;left:18mm;top:16mm;height:5.2mm">
        <div style="position:absolute;right:18mm;top:15mm;text-align:right;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:{GREY};font-weight:500">Hot topics · {tag}<div style="margin-top:1.6mm;color:{BRIGHT}">No. {s.num:02d} · November 2026</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:38mm"><div class="ey" style="color:{BRIGHT}">{kicker}</div>
        <div style="font-weight:600;font-size:42pt;line-height:1.02;letter-spacing:-.05em;margin-top:5mm">{t1}<br><span style="color:{BRIGHT}">{t2}</span></div>
        <div style="font-weight:300;font-size:12.5pt;line-height:1.5;color:rgba(255,255,255,.82);margin-top:7mm;width:160mm">{lede}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:15mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:{GREY};border-top:.25mm solid rgba(174,186,204,.25);padding-top:4mm"><span>Transputec playbook</span><span>transputec.com</span></div>''', True, folio=False)
    def art_back(s, title, lede, cta, next_title=""):
        nx = f'<div style="margin-top:14mm;padding-top:6mm;border-top:.25mm solid rgba(174,186,204,.25);width:150mm"><div class="lab" style="color:{BRIGHT}">Read the companion report</div><div style="font-size:11pt;margin-top:2.4mm;color:#fff">{next_title}</div></div>' if next_title else ""
        s._wrap(f'''<div style="position:absolute;inset:0;background:url(art2/{s.art}.jpg) 82% center/cover;opacity:.55"></div>{glow(40,-60,240,.25)}
        <img src="hl/dark/{s.fig}.png" style="position:absolute;right:-10mm;bottom:20mm;width:120mm;mix-blend-mode:screen;opacity:.6">
        <div style="position:absolute;left:18mm;right:18mm;top:44mm"><img src="{LOGO_W}" style="height:6mm">
        <div style="font-weight:600;font-size:34pt;line-height:1.05;letter-spacing:-.04em;margin-top:20mm">{title}</div>
        <div style="font-weight:300;font-size:12.5pt;line-height:1.55;color:rgba(255,255,255,.82);margin-top:7mm;width:150mm">{lede}</div>
        <div style="margin-top:11mm;display:flex;gap:4mm"><span style="background:{BLUE};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:500;font-size:10pt">{cta}</span><span style="border:.3mm solid rgba(255,255,255,.4);border-radius:99px;padding:3.6mm 7mm;font-size:10pt">transputec.com</span></div>{nx}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:15mm;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)">Transputec · Hot Topics · No. {s.num:02d}</div>''', True, folio=False)
    def figpage(s, ey, title, lede, fig, items, sec):
        it = "".join(f'<div style="padding:5mm 0;border-top:.25mm solid #E3E8F0;display:grid;grid-template-columns:10mm 1fr;gap:3mm"><div style="font-weight:700;color:{BLUE};font-size:12pt">{i+1:02d}</div><div><div style="font-weight:600;font-size:11pt">{t}</div><div class="tx" style="margin-top:1.2mm;font-size:9.6pt">{x}</div></div></div>' for i, (t, x) in enumerate(items))
        s._wrap(s._hd(ey, title, lede) + f'<img src="hl/light/{fig}.png" style="display:block;width:120mm;margin:6mm auto 2mm">' + f'<div style="border-bottom:.25mm solid #E3E8F0">{it}</div>', sec=sec)

class RBook(HotBook):
    """White editorial intelligence report."""
    def __init__(s, short, num, art, fig):
        super().__init__(short, num, art, fig, "Hot Topics · Intelligence Report")
    def rep_cover(s, kicker, title, sub, dateline):
        s._wrap(f'''<div style="position:absolute;left:0;right:0;top:0;height:7mm;background:linear-gradient(90deg,{NAVY},{BLUE},{BRIGHT})"></div>
        <img src="{LOGO_B}" style="position:absolute;left:18mm;top:18mm;height:5mm">
        <div style="position:absolute;right:18mm;top:17mm;text-align:right;font-size:7pt;letter-spacing:.2em;text-transform:uppercase;color:#6B7A90;font-weight:600">Intelligence report<div style="margin-top:1.6mm;color:{BLUE}">No. {s.num:02d} · {dateline}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;top:38mm;height:110mm;border-radius:5mm;overflow:hidden;background:#fff;border:.3mm solid #E3E8F0"><img src="hl/light/{s.fig}.png" style="position:absolute;left:50%;top:50%;width:132mm;transform:translate(-50%,-50%)"></div>
        <div style="position:absolute;left:18mm;right:18mm;top:162mm"><div class="ey">{kicker}</div>
        <div style="font-weight:600;font-size:38pt;line-height:1.03;letter-spacing:-.045em;margin-top:5mm;color:{NAVY}">{title}</div>
        <div class="lede" style="margin-top:7mm;width:165mm;font-size:12.5pt">{sub}</div></div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:15mm;display:flex;justify-content:space-between;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:#6B7A90;border-top:.25mm solid #E3E8F0;padding-top:4mm"><span>Evidence-based analysis · Every figure sourced</span><span>transputec.com</span></div>''', folio=False)
    def summary(s, title, paras, bottom_line, sec="Executive summary"):
        p = "".join(f'<p class="tx" style="font-size:11pt;line-height:1.7;margin-top:{0 if i==0 else 4.5}mm">{t}</p>' for i, t in enumerate(paras))
        s._wrap(f'''<div class="ey">Executive summary</div><h1 style="margin-top:4mm;width:170mm">{title}</h1><div style="margin-top:10mm;width:165mm">{p}</div>
        <div style="margin-top:10mm;background:{NAVY};color:#fff;border-radius:4mm;padding:7mm 8mm"><div class="lab" style="color:{BRIGHT}">The bottom line</div><div style="font-weight:500;font-size:12.5pt;line-height:1.5;margin-top:2.6mm">{bottom_line}</div></div>''', sec=sec)
    def findings(s, title, items, sec="Key findings"):
        it = "".join(f'<div style="display:grid;grid-template-columns:14mm 1fr;gap:4mm;padding:5.4mm 0;border-top:.25mm solid #E3E8F0"><div style="font-weight:700;font-size:18pt;color:{BLUE};line-height:1">{i+1:02d}</div><div><div style="font-weight:600;font-size:11.5pt;line-height:1.35">{h}</div><div class="tx" style="margin-top:1.6mm;font-size:9.8pt">{t}</div></div></div>' for i, (h, t) in enumerate(items))
        s._wrap(f'{s._hd("Key findings", title, "")}<div style="margin-top:9mm;border-bottom:.25mm solid #E3E8F0">{it}</div>', sec=sec)
    def facts(s, title, lede, items, sec):
        it = "".join(f'<div style="padding:7mm 0;border-top:.25mm solid rgba(174,186,204,.2)"><div style="font-weight:600;font-size:30pt;letter-spacing:-.04em;color:{BRIGHT};line-height:1">{big}</div><div style="font-size:10pt;line-height:1.5;color:{GREY};margin-top:2.6mm">{lab}</div></div>' for big, lab in items)
        s._wrap(s._hd("At a glance", title, lede) + f'<div style="margin-top:9mm;display:grid;grid-template-columns:1fr 1fr;gap:0 12mm">{it}</div>', True, sec, bg=f'<div style="position:absolute;inset:0;background:url(art2/{s.art}.jpg) 80% center/cover;opacity:.3"></div>')
    def timeline(s, title, lede, events, sec="Timeline"):
        ev = "".join(f'<div style="display:grid;grid-template-columns:30mm 6mm 1fr;gap:4mm;padding-bottom:6mm"><div style="font-weight:600;font-size:9.4pt;color:{BLUE};text-align:right;padding-top:.4mm">{d}</div><div style="position:relative"><div style="width:4mm;height:4mm;border-radius:50%;background:#fff;border:1mm solid {BLUE};position:relative;z-index:1"></div></div><div><div style="font-weight:600;font-size:10.6pt">{t}</div><div class="tx" style="margin-top:1mm;font-size:9.4pt">{x}</div></div></div>' for d, t, x in events)
        s._wrap(s._hd("Timeline", title, lede) + f'<div style="margin-top:10mm;position:relative"><div style="position:absolute;left:38mm;top:2mm;bottom:8mm;border-left:.6mm solid #C9D3E3"></div>{ev}</div>', sec=sec)
    def sources(s, items, note="Sources were accessed in November 2026. Where reports differ, we say so in the text. Early reporting on live incidents can change."):
        it = "".join(f'<div style="display:grid;grid-template-columns:9mm 1fr;gap:3mm;padding:3.2mm 0;border-top:.25mm solid #E3E8F0;break-inside:avoid"><div style="font-weight:600;color:{BLUE};font-size:8.6pt">{n}</div><div style="font-size:8.2pt;line-height:1.5;color:#3A4559;word-break:break-word">{t}</div></div>' for n, t in items)
        s._wrap(f'{s._hd("Sources", "Sources and notes", note)}<div style="margin-top:8mm;columns:2;column-gap:9mm">{it}</div>', sec="Sources")
    def rep_back(s, title, lede, cta, companion=""):
        cp = f'<div style="margin-top:14mm;padding-top:6mm;border-top:.25mm solid #E3E8F0;width:150mm"><div class="lab" style="color:{BLUE}">Put it into practice</div><div style="font-size:11pt;margin-top:2.4mm">{companion}</div></div>' if companion else ""
        s._wrap(f'''<div style="position:absolute;left:0;right:0;bottom:0;height:7mm;background:linear-gradient(90deg,{NAVY},{BLUE},{BRIGHT})"></div>
        <img src="hl/light/{s.fig}.png" style="position:absolute;right:14mm;top:24mm;width:90mm;opacity:.9">
        <div style="position:absolute;left:18mm;right:18mm;top:120mm"><img src="{LOGO_B}" style="height:6mm">
        <div style="font-weight:600;font-size:32pt;line-height:1.06;letter-spacing:-.04em;margin-top:14mm;color:{NAVY}">{title}</div>
        <div class="lede" style="margin-top:7mm;width:150mm">{lede}</div>
        <div style="margin-top:11mm;display:flex;gap:4mm"><span style="background:{BLUE};color:#fff;border-radius:99px;padding:3.6mm 7mm;font-weight:500;font-size:10pt">{cta}</span><span style="border:.3mm solid #C9D3E3;border-radius:99px;padding:3.6mm 7mm;font-size:10pt">transputec.com</span></div>{cp}</div>
        <div style="position:absolute;left:18mm;right:18mm;bottom:15mm;font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:#6B7A90">Transputec · Hot Topics · Intelligence report No. {s.num:02d}</div>''', folio=False)
