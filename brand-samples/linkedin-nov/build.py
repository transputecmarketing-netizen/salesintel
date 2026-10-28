from kit import *

def cover(series, kicker, title, lede, ic, total, extra=""):
    inner = f'''
    <div style="position:absolute;left:88px;top:250px">{icon_tile(ic, 170)}</div>
    <div style="position:absolute;left:88px;right:88px;top:500px">
      <div class="lbl">{kicker}</div>
      <div class="h1" style="margin-top:26px">{title}</div>
      <div class="rule" style="width:180px;margin:44px 0 40px"></div>
      <div class="lede" style="max-width:820px">{lede}</div>{extra}</div>'''
    return slide(inner, series, swipe=True, bg=glow(520, -360, 1000, .26) + glow(-420, 900, 900, .12, "59,139,255"))

def point(series, n, total, ic, title, a_lbl, a_txt, b_lbl, b_txt, idx):
    inner = f'''
    <div style="position:absolute;left:88px;right:88px;top:210px;display:flex;justify-content:space-between;align-items:flex-start">
      <div style="font-weight:700;font-size:180px;line-height:.9;letter-spacing:-.06em;background:linear-gradient(180deg,{BRIGHT},{BLUE});-webkit-background-clip:text;color:transparent">{n:02d}</div>{icon_tile(ic, 160)}</div>
    <div style="position:absolute;left:88px;right:88px;top:470px">
      <div class="h2">{title}</div>
      <div class="card" style="margin-top:60px;padding:52px 52px">
        <div class="lbl">{a_lbl}</div><div class="body" style="margin-top:18px;color:{WHITE};font-weight:300;font-size:36px;line-height:1.4">{a_txt}</div>
        <div style="height:1.5px;background:rgba(174,186,204,.14);margin:40px 0"></div>
        <div class="lbl" style="color:{GREY}">{b_lbl}</div><div class="body" style="margin-top:18px;font-size:32px;line-height:1.4">{b_txt}</div></div></div>'''
    return slide(inner, series, idx, total, bg=glow(600, -300, 820, .16))

def statement(series, idx, total, kicker, text, sub=""):
    inner = f'''<div style="position:absolute;left:88px;right:88px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
      <div class="lbl">{kicker}</div><div class="h2" style="margin-top:30px;font-size:70px">{text}</div>
      {f'<div class="lede" style="margin-top:40px;max-width:820px">{sub}</div>' if sub else ''}</div>'''
    return slide(inner, series, idx, total, bg=glow(-300, 300, 1000, .14) + glow(600, 700, 900, .14, "59,139,255"))

def cta(series, idx, total, title, sub, next_txt):
    inner = f'''<div style="position:absolute;left:88px;right:88px;top:300px">
      <div class="h2" style="font-size:76px">{title}</div>
      <div class="lede" style="margin-top:40px;max-width:840px">{sub}</div>
      <div style="margin-top:70px;display:flex;gap:18px;flex-wrap:wrap"><span class="pill" style="background:{BLUE};border-color:{BLUE}">Talk to Transputec {arrow(22)}</span><span class="pill">Follow for the series</span></div>
      <div class="card" style="margin-top:110px;padding:32px 40px;display:flex;gap:24px;align-items:center"><div class="lbl" style="white-space:nowrap">Next week</div><div class="body" style="color:{WHITE};font-size:28px">{next_txt}</div></div></div>'''
    return slide(inner, series, idx, total, bg=glow(300, -380, 1100, .3))

out = {}
# =============================================================== WEEK 1 · AWS
S1 = "AWS · Week 1"
w1_editorial = slide(f'''
  <div style="position:absolute;left:88px;right:88px;top:210px">
    <div class="lbl">Cost control series</div>
    <div class="h1" style="margin-top:24px;font-size:80px">Consultancy or<br><span class="b">managed service?</span></div>
    <div class="lede" style="margin-top:30px">Know which one you are actually buying.</div></div>
  <div style="position:absolute;left:88px;right:88px;top:640px;display:grid;grid-template-columns:1fr 1fr;gap:28px">
    <div class="card" style="padding:48px 42px;min-height:500px">{icon("compass", 84)}<div style="font-weight:600;font-size:38px;margin-top:26px;letter-spacing:-.02em">Consultancy</div>
      <div class="body" style="margin-top:12px;color:{WHITE}">You are buying<br>a <span class="b" style="font-weight:500">decision</span>.</div>
      <div class="body" style="margin-top:22px;font-size:24px">Advice, design and a defined project with an end.</div></div>
    <div class="card" style="padding:48px 42px;min-height:500px;background:linear-gradient(160deg,rgba(44,114,219,.28),{CARD} 70%);border-color:rgba(59,139,255,.4)">{icon("loop", 84)}<div style="font-weight:600;font-size:38px;margin-top:26px;letter-spacing:-.02em">Managed service</div>
      <div class="body" style="margin-top:12px;color:{WHITE}">You are buying someone to <span class="b" style="font-weight:500">run the estate</span>.</div>
      <div class="body" style="margin-top:22px;font-size:24px">Monitoring, patching and support, every day.</div></div></div>''', S1, bg=glow(500, -340, 1000, .24))
w1_quote = slide(f'''
  <div style="position:absolute;left:88px;right:88px;top:0;bottom:0;display:flex;flex-direction:column;justify-content:center">
    <svg width="110" height="90" viewBox="0 0 110 90"><path d="M8 88V52C8 22 22 6 46 2l4 12C34 20 28 32 28 46h20v42zM62 88V52C62 22 76 6 100 2l4 12C88 20 82 32 82 46h20v42z" fill="{BLUE}"/></svg>
    <div style="font-weight:500;font-size:62px;line-height:1.16;letter-spacing:-.03em;margin-top:48px">Buy consultancy when you need a <span class="b">decision</span>. Buy a managed service when you need someone to <span class="b">run it</span>.</div>
    <div class="rule" style="width:160px;margin:56px 0 28px"></div><div class="tag" style="color:{GREY}">Transputec · AWS</div></div>''', S1, bg=glow(-400, -300, 1100, .2) + glow(500, 800, 900, .16, "59,139,255"))
out["w1"] = [w1_editorial, w1_quote]

# =============================================================== WEEK 2 · FinOps carousel
S2, T2 = "FinOps · Week 2", 8
out["w2"] = [
    cover(S2, "Cost control series", 'Five places your<br><span class="b">cloud cost hides</span>', "You cannot cut what you cannot see. The usual suspects behind a climbing AWS bill.", "magnifier", T2),
    statement(S2, 2, T2, "Start here", 'A climbing bill is rarely<br>one big mistake.', "It is usually many small ones, running quietly where nobody is looking."),
    point(S2, 1, T2, "server", "Idle and oversized compute", "What it looks like", "Instances sized for a peak that never comes, or left running overnight and at weekends.", "Where to look", "AWS Compute Optimizer and utilisation in CloudWatch.", 3),
    point(S2, 2, T2, "storage", "Storage nobody deletes", "What it looks like", "Unattached volumes, old snapshots and buckets with no lifecycle rules.", "Where to look", "EBS volumes in the available state, and S3 Storage Lens.", 4),
    point(S2, 3, T2, "transfer", "Data on the move", "What it looks like", "Traffic between zones and regions, and NAT gateways processing more than anyone expected.", "Where to look", "Cost Explorer, grouped by usage type.", 5),
    point(S2, 4, T2, "flask", "Forgotten environments", "What it looks like", "Test and proof-of-concept stacks that outlived the project they were built for.", "Where to look", "Untagged resources, and stacks with no named owner.", 6),
    point(S2, 5, T2, "contract", "Commitments that do not fit", "What it looks like", "On-demand rates for steady workloads, or Savings Plans bought for usage that has since moved.", "Where to look", "Savings Plans coverage and utilisation reports.", 7),
    cta(S2, 8, T2, 'Find yours before<br>the next invoice.', "Most estates have at least one of these. The fix starts with seeing it.", "What FinOps actually is."),
]

# =============================================================== WEEK 3 · Myth vs reality card
S3 = "AWS · FinOps · Week 3"
rows = [("FinOps is a tool you buy.", "It is a discipline your teams practise."), ("FinOps means cutting cost.", "It means spending with intent."),
        ("Finance owns it.", "Engineering, finance and the business share it."), ("It is a one-off project.", "It is a cycle of continuous review.")]
rr = "".join(f'''<div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;padding:30px 0;border-top:1.5px solid rgba(174,186,204,.14)">
   <div style="display:flex;gap:18px;align-items:flex-start"><svg width="34" height="34" viewBox="0 0 24 24" style="flex:none;margin-top:4px"><circle cx="12" cy="12" r="10" fill="none" stroke="{GREY}" stroke-width="1.8"/><path d="M8 8l8 8M16 8l-8 8" stroke="{GREY}" stroke-width="1.8" stroke-linecap="round"/></svg><div class="body" style="font-size:28px;text-decoration:line-through;text-decoration-color:rgba(174,186,204,.5)">{m}</div></div>
   <div style="display:flex;gap:18px;align-items:flex-start"><svg width="34" height="34" viewBox="0 0 24 24" style="flex:none;margin-top:4px"><circle cx="12" cy="12" r="10" fill="{BLUE}"/><path d="M7.5 12.5l3 3 6-6.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg><div class="body" style="font-size:28px;color:{WHITE}">{r}</div></div></div>''' for m, r in rows)
w3_myth = slide(f'''
  <div style="position:absolute;left:88px;right:88px;top:210px">
    <div class="lbl">FinOps</div><div class="h1" style="margin-top:22px;font-size:78px">Myth <span style="color:{GREY};font-weight:300">vs</span> <span class="b">reality</span></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:64px"><div class="tag">Myth</div><div class="tag" style="color:{BRIGHT}">Reality</div></div>
    <div style="margin-top:16px;border-bottom:1.5px solid rgba(174,186,204,.14)">{rr}</div></div>''', S3, bg=glow(520, -340, 1000, .22))
out["w3"] = [w3_myth]

# =============================================================== WEEK 4 · Device fleet
S4, T4 = "IT Procurement · Week 4", 7
labels = ["Deploy", "Support", "Secure", "Repair", "Retire"]
segs = "".join(f'<div style="flex:1;height:100%;border-left:1.5px solid rgba(10,15,26,.5);display:flex;align-items:flex-end;padding:0 0 22px 18px;font-weight:500;font-size:24px;color:{WHITE}">{l}</div>' for l in labels)
w4_editorial = slide(f'''
  <div style="position:absolute;left:88px;right:88px;top:210px">
    <div class="lbl">The real cost of a device fleet</div>
    <div class="h1" style="margin-top:24px;font-size:84px">The laptop is<br>the <span class="b">cheap part</span>.</div>
    <div class="lede" style="margin-top:34px;max-width:840px">The years after it, running and securing the fleet, are where the cost lives.</div></div>
  <div style="position:absolute;left:88px;right:88px;top:840px">
    <div style="display:flex;height:220px;border-radius:24px;overflow:hidden">
      <div style="width:120px;background:{BRIGHT};display:flex;align-items:flex-end;justify-content:center;padding-bottom:22px;font-weight:600;font-size:22px;color:{NAVY}">Buy</div>
      <div style="flex:1;display:flex;background:linear-gradient(90deg,{BLUE},#1B3E86 60%,#16233F)">{segs}</div></div>
    <div style="display:flex;justify-content:space-between;margin-top:18px" class="tag"><span>Day one</span><span>End of life</span></div></div>''', S4, bg=glow(520, -340, 1000, .22))
out["w4_editorial"] = [w4_editorial]
out["w4"] = [
    cover(S4, "IT procurement", 'The real cost of<br><span class="b">a device fleet</span>', "Buying the hardware is the cheap part. Running and securing it for years is the cost.", "laptop", T4),
    statement(S4, 2, T4, "The price tag", 'The invoice is<br>only day one.', "Every device then needs setting up, supporting, protecting and, one day, retiring safely."),
    point(S4, 1, T4, "truck", "Deploy", "The work", "Imaging, enrolment, shipping and getting each person productive on day one.", "The question", "Who sets up a new starter's device, and how long does it take?", 3),
    point(S4, 2, T4, "wrench", "Support and repair", "The work", "Tickets, faults, warranty claims and the hours people lose while they wait.", "The question", "What happens when a laptop fails the day before a deadline?", 4),
    point(S4, 3, T4, "shield", "Secure", "The work", "Patching, encryption, endpoint protection and a plan for lost or stolen devices.", "The question", "Could you prove every device is encrypted and up to date today?", 5),
    point(S4, 4, T4, "recycle", "Retire", "The work", "Certified data wiping, responsible disposal or resale, and planning the next refresh.", "The question", "Where do your old devices go, and what is still on them?", 6),
    cta(S4, 7, T4, 'Plan the lifecycle,<br>not just the purchase.', "From supply to secure retirement, one partner can manage the whole fleet.", "Your AWS cost-control checklist."),
]

# =============================================================== WEEK 5 · Checklist carousel
S5, T5 = "FinOps · Week 5", 8
def check(n, title, a, b, idx):
    return point(S5, n, T5, ["tag", "power", "broom", "contract", "bell"][n - 1], title, "Do this", a, "Using", b, idx)
summary_rows = "".join(f'<div style="display:flex;gap:22px;align-items:center;padding:24px 0;border-top:1.5px solid rgba(174,186,204,.14)"><div style="width:44px;height:44px;border-radius:12px;border:2px solid {BRIGHT};flex:none"></div><div style="font-weight:500;font-size:32px;letter-spacing:-.01em">{t}</div></div>' for t in ["Give every resource an owner", "Switch off what is idle", "Clear out old storage", "Match commitments to usage", "Set alerts, then review"])
out["w5"] = [
    cover(S5, "Free checklist", 'Your AWS<br><span class="b">cost-control checklist</span>', "Five checks to review your own cloud cost. Save this for your next monthly review.", "check", T5),
    statement(S5, 2, T5, "How to use it", 'Run it once a month,<br>with the people who own the spend.', "Each check takes minutes in the AWS console. The value is in doing it every time."),
    check(1, "Give every resource an owner", "Tag by team, project and environment, then switch on cost allocation tags.", "AWS Cost Allocation Tags and Tag Editor.", 3),
    check(2, "Switch off what is idle", "Schedule non-production to stop out of hours, and rightsize from real utilisation.", "Instance Scheduler and Compute Optimizer.", 4),
    check(3, "Clear out old storage", "Delete unattached volumes and stale snapshots, and add lifecycle rules to buckets.", "EBS, snapshots and S3 lifecycle policies.", 5),
    check(4, "Match commitments to usage", "Check coverage and utilisation before you buy or renew anything.", "Savings Plans and Reserved Instance reports.", 6),
    check(5, "Set alerts, then review", "Put budgets and anomaly alerts in place, and review them with each owner.", "AWS Budgets and Cost Anomaly Detection.", 7),
    slide(f'''<div style="position:absolute;left:88px;right:88px;top:200px">
      <div class="lbl">The checklist</div><div class="h2" style="margin-top:22px">Five checks. Every month.</div>
      <div style="margin-top:44px;border-bottom:1.5px solid rgba(174,186,204,.14)">{summary_rows}</div>
      <div style="margin-top:56px;display:flex;gap:18px;flex-wrap:wrap"><span class="pill" style="background:{BLUE};border-color:{BLUE}">Ask us for a cost review {arrow(22)}</span><span class="pill">Save this post</span></div>
      <div class="body" style="margin-top:40px;font-size:24px">Coming in February: our cost-control webinar.</div></div>''', S5, 8, T5, bg=glow(500, -360, 1000, .24)),
]

import json
for k, v in out.items():
    open(f"{k}.html", "w", encoding="utf8").write(page(v, k))
json.dump({k: len(v) for k, v in out.items()}, open("manifest.json", "w"))
print({k: len(v) for k, v in out.items()})
