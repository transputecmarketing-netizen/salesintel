"""Use-case page built from the client's Crises Control Industry Use Cases register (customer names removed by the client).
Evidence status is shown on every card so illustrative scenarios are never presented as customer deployments."""
import openpyxl
XLSX = "../../crises-control/use_cases.xlsx"
MAP = {"Financial Services & Insurance": "Financial Services and Insurance", "Property, Housing & Facilities": "Property, Housing and Facilities",
       "Retail": "Retail", "Transport & Aviation": "Transport and Logistics", "Hospitality": "Hospitality", "Healthcare": "Healthcare"}
TAG = [("customer use examples", "Customer example", "#1179BB", "#fff"), ("customer requirements", "Customer requirement", "#0A3165", "#fff"),
       ("aviation examples", "Customer example", "#1179BB", "#fff"), ("supplied examples", "Customer example", "#1179BB", "#fff"),
       ("Intended use case", "Intended use", "#F7F6F8", "#0B223C"), ("Suggested application", "Suggested application", "#F7F6F8", "#0B223C"),
       ("Illustrative", "Illustrative", "#F7F6F8", "#0B223C")]

def rows_for(industry):
    ws = openpyxl.load_workbook(XLSX, data_only=True)["Industry Use Cases"]
    out = []
    for r in ws.iter_rows(min_row=2, values_only=True):
        if r[0] and MAP.get(r[0].strip()) == industry: out.append([("" if c is None else str(c).strip()) for c in r[:6]])
    return out

def tag(status):
    for k, label, bg, fg in TAG:
        if k.lower() in status.lower(): return label, bg, fg
    return "Illustrative", "#F7F6F8", "#0B223C"

def page(b):
    rows = rows_for(b.industry)
    if not rows: return None
    n = len(rows); dense = n > 6
    cards = ""
    for uc, trig, how, caps, ev in [(r[1], r[2], r[3], r[4], r[5]) for r in rows]:
        lab, bg, fg = tag(ev)
        chips = "".join(f'<span style="display:inline-block;font-family:Roboto Mono;font-size:6.2pt;padding:.5mm 1.6mm;border:.25mm solid #1179BB55;border-radius:1mm;color:#1179BB;margin:0 1mm 1mm 0">{c.strip().replace("Audit Trail", "Audit &amp; Reporting")}</span>' for c in caps.split(";") if c.strip())
        cards += f'''<div style="border:.3mm solid #3A3A3A26;border-radius:2.6mm;padding:{2 if dense else 3.4}mm 3.2mm;break-inside:avoid;margin-bottom:{2 if dense else 3.4}mm">
          <div style="display:flex;justify-content:space-between;gap:2mm;align-items:start"><div style="font-weight:700;font-size:{8.8 if dense else 10.2}pt;line-height:1.25;color:#0B223C">{uc}</div>
          <span style="flex:none;font-family:Roboto Mono;font-size:5.8pt;letter-spacing:.06em;padding:.6mm 1.6mm;border-radius:1mm;background:{bg};color:{fg};border:.25mm solid {'#3A3A3A33' if bg=='#F7F6F8' else bg}">{lab.upper()}</span></div>
          <div style="font-size:{7 if dense else 8}pt;line-height:1.3;color:#3A3A3A;margin-top:1.2mm"><span style="font-family:Roboto Mono;font-size:6pt;letter-spacing:.08em;color:#FF0000">TRIGGER </span>{trig}</div>
          <div style="font-size:{7.3 if dense else 8.6}pt;line-height:1.35;color:#0B223C;margin-top:1.2mm">{how}</div>
          <div style="margin-top:1.6mm">{chips}</div></div>'''
    note = ("Customer examples are based on how customers use Crises Control today; customer names have been removed. Customer requirements describe needs raised by customers or in evaluations. "
            "Intended, suggested and illustrative use cases show how the platform can be applied and are not presented as existing customer deployments. Capabilities marked 'where configured' or 'where supported' depend on each organisation's set-up.")
    body = b._hd("Use cases", f"How organisations use Crises Control in {b.industry.lower().replace('and insurance', 'and insurance')}",
                 "" if dense else "From the first alert to the final record: the incidents this platform is used for, and how the modules work together in each.") + \
        f'<div style="margin-top:{3 if dense else 5}mm;columns:2;column-gap:4mm">{cards}</div><div style="margin-top:1mm;font-size:{6.6 if dense else 7.2}pt;line-height:1.4;color:#3A3A3ABF">{note}</div>'
    return dict(body=body, dark=False, sec="Use cases")
