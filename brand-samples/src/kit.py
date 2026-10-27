"""Shared page scaffolding for the research series."""
from common import DEFS, logo, gt as G, dots, ghost, badge_wall
from report import bg_dark
from case import CSS, head, src, ev


def mk(short, n_total):
    def page(n, body, dark=False, section="", folio=True):
        spine = f'<div class="spine">{short} &nbsp;·&nbsp; {section}</div>' if folio else ""
        gh = f'<div style="position:absolute;right:16mm;top:20mm">{ghost(section[:2], 40)}</div>' if folio and section[:2].isdigit() and not dark else ""
        run = (f'<div class="run">{logo("white" if dark else "blue", "3.6mm")}<span style="{"color:rgba(255,255,255,.5)" if dark else ""}">{section}</span></div>') if folio else ""
        fol = f'<div class="folio"><span>{short} · <b>2026</b></span><span><b>{n:02d}</b> / {n_total}</span></div>' if folio else ""
        return f'<section class="pg {"dark" if dark else ""}">{gh}{spine}{run}{body}{fol}</section>'
    return page


def contents(rows):
    li = ''.join(f'''<div style="display:flex;align-items:baseline;padding:4.4mm 0;border-bottom:.25mm solid var(--line)">
      <span class="mono" style="width:14mm;font-size:8pt;color:var(--blue)">{a}</span><span style="flex:1;font-size:15pt;font-weight:{500 if a else 400};letter-spacing:-.02em">{b}</span>
      <span class="mono" style="font-size:8pt;color:var(--mid)">{c:02d}</span></div>''' for a, b, c in rows)
    return f'<div class="eyebrow" style="margin-top:14mm">Contents</div><h2 style="margin-top:5mm">Inside.</h2><div style="margin-top:11mm;border-top:.35mm solid var(--navy)">{li}</div>'


def stat(num, lab, s, unit="", size=36):
    parts = [(num, 1.0)] + ([(unit, .5)] if unit else [])
    return f'<div>{G(parts, size)}<div style="font-size:8.6pt;line-height:1.5;color:var(--body);margin-top:3mm;max-width:38mm">{lab}<sup class="c">{s}</sup></div></div>'


def unit(n, lab, s=1):
    return (f'<div>{dots(10,10,n,pitch=4.1,d=2.7,unlit="#E1E7F1",halo=False)}<div style="margin-top:5mm">{G(f"{n}%",26,ls=-0.045)}</div>'
            f'<div style="font-size:8.4pt;line-height:1.45;margin-top:2.4mm;font-weight:500;max-width:40mm">{lab}<sup class="c">{s}</sup></div></div>')


def sources(refs, notes, extra=""):
    rows = ''.join(f'<div style="display:grid;grid-template-columns:10mm 1fr;gap:3mm;padding:3.4mm 0;border-bottom:.25mm solid var(--line)"><div class="mono" style="color:var(--blue);font-size:8.6pt;font-weight:500">{n}</div><div style="font-size:8.2pt;line-height:1.55;word-break:break-word">{t}</div></div>' for n, t in refs)
    return f'''{head("Sources and method", "Where this comes from.")}
    <div style="margin-top:9mm;border-top:.35mm solid var(--navy)">{rows}</div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:8mm;margin-top:8mm"><div class="eyebrow">Method notes</div><div>{notes}</div></div>'''


def back(lede, tag="", keys=("iso", "msmw", "mssec", "aws", "cisco"), visual=None):
    wall = badge_wall(list(keys), 6, h="19mm", gap="2.6mm", span={"iso": 2} if "iso" in keys else {})
    vis = visual if visual is not None else dots(10, 10, 100, pitch=11, d=6.6, halo=False)
    cap = f'<div class="mono" style="text-align:center;font-size:6.6pt;letter-spacing:.18em;color:var(--cyan);margin-top:5mm;text-transform:uppercase">{tag}</div>' if tag else ""
    return bg_dark('<div class="glow" style="left:30mm;top:20mm;width:150mm;height:150mm;background:radial-gradient(circle,rgba(0,184,219,.2) 0%,rgba(0,184,219,0) 66%)"></div>') + f'''
    <div style="position:absolute;left:50%;top:30mm;transform:translateX(-50%)">{vis}{cap}</div>
    <div style="position:absolute;left:0;right:0;top:158mm;text-align:center">{logo("white","7.4mm").replace('display:block','display:block;margin:0 auto')}
      <div class="lede" style="margin-top:7mm;font-size:12.5pt;color:#fff">{lede}</div></div>
    <div style="position:absolute;left:18mm;right:18mm;bottom:20mm">{wall}<div class="hair" style="margin:7mm 0 5mm"></div>
      <div style="display:flex;justify-content:space-between;font-family:'JetBrains Mono',monospace;font-size:7.2pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7)">
        <span>transputec.com</span><span>+44 (0) 20 8584 1400</span><span>London</span></div></div>'''


def cover(kicker, title_lines, grad_line, grad_pt, lede, visual, title_pt=44, vis_top="56mm", glow=""):
    tl = ''.join(f'<div style="font-weight:600;font-size:{title_pt}pt;line-height:1;letter-spacing:-.05em;{"margin-top:1mm" if i else ""}">{t}</div>' for i, t in enumerate(title_lines))
    return bg_dark(glow) + f'''
    <div style="position:absolute;left:18mm;top:18mm;right:18mm;display:flex;justify-content:space-between;align-items:center">{logo("white","5.2mm")}
      <span class="mono" style="font-size:6.8pt;letter-spacing:.16em;color:rgba(255,255,255,.55)">{kicker}</span></div>
    <div style="position:absolute;left:18mm;top:{vis_top}">{visual}</div>
    <div style="position:absolute;left:18mm;bottom:25mm;right:18mm">{tl}
      <div style="margin-top:1mm">{G(grad_line, grad_pt, weight=600, ls=-0.055)}</div>
      <div class="lede" style="margin-top:6mm;max-width:124mm;font-size:12.5pt">{lede}</div>
      <div class="hair" style="margin:8mm 0 4mm"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-family:'JetBrains Mono',monospace;font-size:6.6pt;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.55)">
        <span>Transputec Research</span><span class="tag" style="color:var(--cyan)">Sample edition</span></div></div>'''


def opener(chapter, big, big_pt, text, h2, glow_col="21,93,252"):
    return bg_dark(f'<div class="glow" style="right:-30mm;top:60mm;width:170mm;height:170mm;background:radial-gradient(circle,rgba({glow_col},.3) 0%,rgba({glow_col},0) 62%)"></div>') + f'''
    <div class="eyebrow" style="margin-top:14mm">{chapter}</div>
    <div style="position:absolute;left:18mm;top:52mm">{G(big, big_pt, ls=-0.07)}
      <div class="lede" style="margin-top:8mm;max-width:118mm;font-size:14pt;color:#fff;font-weight:300">{text}</div></div>
    <div style="position:absolute;left:18mm;bottom:30mm"><h2 style="font-size:34pt">{h2}</h2></div>'''
