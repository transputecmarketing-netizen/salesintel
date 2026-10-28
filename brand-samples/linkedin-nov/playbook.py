from kit import NAVY, CARD, BLUE, BRIGHT, GREY, WHITE, FONTS, icon
L = "../assets/logo-white.svg"
CSS = FONTS + f"""@page{{size:1920px 1080px;margin:0}}*{{box-sizing:border-box;margin:0}}body{{background:{NAVY}}}
.p{{width:1920px;height:1080px;position:relative;overflow:hidden;background:{NAVY};color:{WHITE};font-family:Poppins;page-break-after:always;padding:110px 120px}}
.g{{position:absolute;border-radius:50%;pointer-events:none}}
.top{{position:absolute;left:120px;right:120px;top:56px;display:flex;justify-content:space-between;align-items:center;font-size:16px;letter-spacing:.2em;text-transform:uppercase;color:{GREY};font-weight:500}}
.bot{{position:absolute;left:120px;right:120px;bottom:48px;display:flex;justify-content:space-between;font-size:16px;color:{GREY}}}
.lbl{{font-weight:600;font-size:16px;letter-spacing:.22em;text-transform:uppercase;color:{BRIGHT}}}
h1{{font-weight:600;font-size:72px;line-height:1.05;letter-spacing:-.035em;margin-top:18px}}.b{{color:{BRIGHT}}}
.card{{background:{CARD};border:1.5px solid rgba(174,186,204,.14);border-radius:22px;padding:30px 34px}}
.t{{font-size:21px;line-height:1.55;color:{GREY};font-weight:300}}.t b{{color:{WHITE};font-weight:500}}
.copy{{font-size:19px;line-height:1.6;color:{WHITE};font-weight:300;white-space:pre-line}}
.th img{{border-radius:12px;border:1px solid rgba(174,186,204,.18);display:block}}
.chip{{display:inline-block;padding:7px 16px;border-radius:99px;border:1.5px solid rgba(59,139,255,.5);font-size:15px;color:{BRIGHT};margin:0 8px 8px 0;font-weight:500}}
"""
def g(x, y, s, a=.2): return f'<div class="g" style="left:{x}px;top:{y}px;width:{s}px;height:{s}px;background:radial-gradient(circle,rgba(44,114,219,{a}),rgba(44,114,219,0) 65%)"></div>'
def pg(inner, n, sec=""):
    return f'<div class="p">{g(1100,-500,1300)}<div class="top"><img src="{L}" style="height:22px"><span>{sec}</span></div>{inner}<div class="bot"><span>November 2026 LinkedIn playbook</span><span>{n:02d}</span></div></div>'

W = [
 dict(w=1, d="Mon 2 to Fri 6 Nov", svc="AWS", t="AWS consultancy vs managed services", fmt="Editorial + optional quote card",
      ang="Which are you actually buying, a decision, or someone to run the estate? Getting it wrong is common and expensive.",
      imgs=["w1-01", "w1-02"],
      copy="Consultancy or managed service? They sound alike. They are not the same purchase.\n\nConsultancy buys you a decision: the right architecture, the right migration path, a plan with an end date.\n\nA managed service buys you someone to run the estate: monitoring, patching and support, every day, against agreed service levels.\n\nBuying one when you needed the other is common, and expensive. Before your next AWS conversation, ask a simple question: do we need a decision, or do we need someone to run it?",
      tags="#AWS #CloudStrategy #ManagedServices #CloudCosts", note="Lead with the editorial. Use the quote card as a second post mid-week or as the first comment image."),
 dict(w=2, d="Mon 9 to Fri 13 Nov", svc="FinOps", t="Five places your cloud cost hides", fmt="Carousel, 8 slides",
      ang="You cannot cut what you cannot see. The five usual suspects behind a climbing AWS bill.",
      imgs=[f"w2-0{i}" for i in range(1, 9)],
      copy="You cannot cut what you cannot see.\n\nA climbing AWS bill is rarely one big mistake. It is usually five quiet ones: idle compute, storage nobody deletes, data on the move, forgotten environments and commitments that no longer fit.\n\nSwipe through to see what each looks like, and exactly where to look in your own account.\n\nWhich one would you find first?",
      tags="#FinOps #AWS #CloudCostOptimisation #CloudCosts", note="Upload the PDF as a document post so it swipes. Any figures belong in the caption, with a source."),
 dict(w=3, d="Mon 16 to Fri 20 Nov", svc="AWS / FinOps", t="What FinOps actually is", fmt="36s vertical video (muted-safe) + myth vs reality card",
      ang="FinOps is not a tool, it is a discipline: visibility, accountability, optimisation and continuous review.",
      imgs=["w3-01"], video=True,
      copy="FinOps is not a tool you buy. It is a discipline your teams practise.\n\nFour parts, one cycle:\nVisibility: see where every pound goes.\nAccountability: every cost has a named owner.\nOptimisation: spend with intent, not by default.\nContinuous review: check, adjust, repeat.\n\nNot a project. A habit.",
      tags="#FinOps #AWS #CloudFinance #CloudGovernance", note="Video reads fully with sound off. Add captions file only if a voiceover is added later. Myth vs reality card works as a follow-up post."),
 dict(w=4, d="Mon 23 to Fri 27 Nov", svc="IT Procurement", t="The real cost of a device fleet", fmt="Editorial + carousel, 7 slides",
      ang="Buying the hardware is the cheap part. The four years after it, running and securing it, are the cost.",
      imgs=["w4_editorial-01"] + [f"w4-0{i}" for i in range(1, 8)],
      copy="The laptop is the cheap part.\n\nThe invoice is only day one. After that, every device has to be deployed, supported, secured, repaired and, eventually, retired safely with its data wiped.\n\nThat is where the real cost of a fleet lives, and it rarely shows up in the purchase decision.\n\nPlan the lifecycle, not just the purchase. [Offer line to confirm]",
      tags="#ITProcurement #DeviceLifecycle #EndpointSecurity #ITManagement", note="CONFIRM FIRST: the procurement offer (supply-and-manage / lifecycle / resale). Slide 7 is written neutrally until confirmed. No Lenovo or Dell logos on the images; brand names can go in the caption if approved."),
 dict(w=5, d="Mon 30 Nov onward", svc="FinOps", t="Your AWS cost-control checklist", fmt="Carousel, 8 slides",
      ang="The five-point plan to review your own cloud cost. The useful takeaway, given away free.",
      imgs=[f"w5-0{i}" for i in range(1, 9)],
      copy="A free checklist for your next monthly cloud review.\n\n1. Give every resource an owner\n2. Switch off what is idle\n3. Clear out old storage\n4. Match commitments to usage\n5. Set alerts, then review\n\nEach check takes minutes in the AWS console. The value is in doing it every month. Save this, and share it with whoever owns your AWS bill.\n\nMore on this in our February cost-control webinar.",
      tags="#FinOps #AWS #CloudCosts #Checklist", note="Designed to be saved and shared. Use as the bridge into February webinar promotion."),
]
pages = []
pages.append(f'''<div class="p">{g(700,-700,1800,.32)}{g(-500,500,1200,.14)}
 <img src="{L}" style="position:absolute;left:120px;top:90px;height:34px">
 <div style="position:absolute;left:120px;top:330px"><div class="lbl">LinkedIn content playbook</div>
 <div style="font-weight:600;font-size:132px;line-height:1;letter-spacing:-.045em;margin-top:28px">November <span class="b">2026</span></div>
 <div class="t" style="font-size:32px;margin-top:36px;max-width:1000px">Five weeks. Three services. One cost-control story, building to the February webinar.</div>
 <div style="margin-top:60px">{"".join(f'<span class="chip" style="font-size:19px;padding:10px 22px">{s}</span>' for s in ["AWS", "FinOps", "IT Procurement"])}</div></div>
 <div class="th" style="position:absolute;right:100px;top:360px;display:flex;gap:24px;transform:rotate(-4deg)">{"".join(f'<img src="out/{i}.png" style="width:210px">' for i in ["w2-01", "w1-01", "w5-01"])}</div>
 <div class="bot"><span>Draft for review. Final copy supplied separately.</span><span>transputec.com</span></div></div>''')
cal = "".join(f'''<div class="card" style="display:grid;grid-template-columns:120px 300px 220px 1fr 380px;gap:30px;align-items:center;padding:24px 34px;margin-bottom:16px">
 <div style="font-weight:700;font-size:44px;color:{BRIGHT}">W{x["w"]}</div><div class="t" style="font-size:18px">{x["d"]}</div><div class="lbl" style="font-size:14px">{x["svc"]}</div>
 <div style="font-weight:600;font-size:26px;letter-spacing:-.01em">{x["t"]}</div><div class="t" style="font-size:18px">{x["fmt"]}</div></div>''' for x in W)
pages.append(pg(f'<div class="lbl">The month at a glance</div><h1>Calendar</h1><div style="margin-top:50px">{cal}</div>', 2, "Overview"))
rules = [("Colours", "Navy #0A0F1A. Blue #2C72DB and #3B8BFF. Grey #AEBACC."), ("Type", "Poppins throughout. Semibold headlines, light body."),
         ("Sizes", "Carousel and single image 1080 x 1350. Video 1080 x 1920 vertical."), ("Copy", "No em dashes. Short sentences. British spelling."),
         ("Numbers", "No figures or stats on the image. They go in the post, with a source."), ("Logos", "No third-party product logos. AWS service names as text only."),
         ("Video", "Reads fully with the sound off. On-screen text throughout."), ("Series", "Every asset carries the service and week tag, top right.")]
rg = "".join(f'<div class="card"><div class="lbl" style="font-size:14px">{a}</div><div class="t" style="margin-top:12px;color:{WHITE}">{b}</div></div>' for a, b in rules)
pages.append(pg(f'<div class="lbl">Guardrails</div><h1>Design rules</h1><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:56px">{rg}</div>', 3, "Overview"))
n = 4
for x in W:
    k = len(x["imgs"]); wd = 200 if k > 4 else 300
    th = "".join(f'<img src="out/{i}.png" style="width:{wd}px">' for i in x["imgs"])
    vid = f'<div class="card" style="margin-top:24px;display:flex;gap:20px;align-items:center;padding:20px 28px"><svg width="40" height="40" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="#3B8BFF" stroke-width="1.6"/><path d="M10 8l6 4-6 4z" fill="#3B8BFF"/></svg><div class="t" style="font-size:18px"><b>Video:</b> out/w3-finops-explainer-1080x1920.mp4 · 36s · 30fps · muted-safe</div></div>' if x.get("video") else ""
    pages.append(pg(f'''<div style="display:grid;grid-template-columns:1fr 640px;gap:70px;height:100%">
     <div><div class="lbl">Week {x["w"]} · {x["d"]} · {x["svc"]}</div><h1 style="font-size:60px">{x["t"]}</h1>
      <div class="t" style="margin-top:20px;max-width:900px">{x["ang"]}</div>
      <div class="th" style="display:flex;flex-wrap:wrap;gap:14px;margin-top:40px">{th}</div>{vid}</div>
     <div style="display:flex;flex-direction:column;gap:20px"><div class="card" style="flex:1"><div class="lbl" style="font-size:14px">Draft post copy</div><div class="copy" style="margin-top:14px">{x["copy"]}</div>
      <div style="margin-top:18px">{"".join(f'<span class="chip">{h}</span>' for h in x["tags"].split())}</div></div>
      <div class="card" style="{'border-color:rgba(59,139,255,.6)' if x['w']==4 else ''}"><div class="lbl" style="font-size:14px">Format · posting notes</div><div class="t" style="font-size:18px;margin-top:10px"><b>{x["fmt"]}.</b> {x["note"]}</div></div></div></div>''', n, f"Week {x['w']}"))
    n += 1
conf = [("Week 4 offer", "Which procurement offer leads: supply-and-manage, full lifecycle, or resale. Slide 7 and the post's final line are neutral until this is set."),
        ("Final copy", "Draft copy here is for layout. Swap in the approved copy before scheduling. Keep it free of em dashes."),
        ("Stats in captions", "Any figures added to captions need a named, dated source."),
        ("Webinar link", "Week 5 teases February. Add the registration link once live.")]
cc = "".join(f'<div class="card"><div style="display:flex;gap:16px;align-items:center">{icon("check",38)}<div style="font-weight:600;font-size:26px">{a}</div></div><div class="t" style="margin-top:14px">{b}</div></div>' for a, b in conf)
pages.append(pg(f'<div class="lbl">Before scheduling</div><h1>Confirm first</h1><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:56px">{cc}</div>', n, "Sign-off"))
fl = "\n".join(f"out/{i}.png" for x in W for i in x["imgs"])
open("playbook.html", "w", encoding="utf8").write(f'<!doctype html><meta charset="utf8"><style>{CSS}</style>' + "".join(pages))
