from rkit import RBook, S

SRC = {
    "g_sep": "Gartner, Gartner Forecasts Worldwide AI Spending to Grow 49.5% in 2026, 16 September 2026, https://gartner.com/en/newsroom/press-releases/2026-09-16-gartner-forecasts-worldwide-ai-spending-to-grow-49-point-5-percent-in-2026",
    "techstrong": "Techstrong.ai, Gartner: Global AI Spending to Hit $2.7 Trillion in 2026, 21 September 2026, https://techstrong.ai/features/gartner-global-ai-spending-to-hit-2-7-trillion-in-2026/",
    "mck": "McKinsey and QuantumBlack, The state of AI in 2026: On the road to ROI, August 2026, https://www.mckinsey.com/~/media/mckinsey/business%20functions/quantumblack/our%20insights/the%20state%20of%20ai/the-state-of-ai-in-2026-on-the-road-to-roi.pdf",
    "fortune": "Fortune, Companies getting the most from AI are rethinking how work gets done, 2 September 2026, https://fortune.com/2026/09/02/companies-getting-the-most-from-ai-rethinking-how-work-gets-done-cfo/",
    "nber": "NBER Working Paper 34836, Firm Data on AI (Yotzov, Barrero, Bloom and others), February 2026, revised October 2026, https://www.nber.org/papers/w34836",
    "kore": "Kore.ai, 2026 Kore.ai Agent Productivity Index (press release; fieldwork by Propeller Insights), 17 June 2026, https://www.kore.ai/news/new-kore-ai-survey-72-of-enterprises-say-their-ai-agents-operate-with-unmanaged-risk-and-create-new-operational-burdens",
    "ons": "Office for National Statistics, Artificial intelligence in UK businesses: 2023 to 2026, 20 July 2026, https://www.ons.gov.uk/businessindustryandtrade/business/businessservices/articles/artificialintelligenceinukbusinesses/2023to2026",
    "pwc": "PwC, 29th Annual Global CEO Survey, January 2026, https://www.pwc.com/gx/en/news-room/press-releases/2026/pwc-2026-global-ceo-survey.html",
    "wealth": "WealthBriefing, AI hasn't yet set corporate revenues alight as geopolitical, trade risks swirl: PwC, 20 January 2026, https://www.wealthbriefing.com/html/article.php/ai-hasn%27t-yet-set-corporate-revenues-alight-as-geopolitical%2C-trade-risks-swirl--pwc",
    "kpmg": "KPMG International, New KPMG AI Pulse survey: as AI maturity converges, leading organizations show what AI at scale requires, 24 September 2026, https://kpmg.com/xx/en/media/press-releases/2026/09/new-kpmg-ai-pulse-survey-as-ai-maturity-converges-leading-organizations-show-what-ai-at-scale-requires.html",
    "sinch": "Sinch, The AI Production Paradox (press release), 13 May 2026, https://sinch.com/news/sinch-releases-ai-production-paradox/",
    "reg_sinch": "The Register, AI customer service bots get rolled back at 74% of firms, 13 May 2026, https://www.theregister.com/ai-ml/2026/05/13/ai-customer-service-bots-get-rolled-back-at-74-of-firms/5239800",
    "salt": "Campus Technology, Unexpected AI Agent Activity Reported by Nearly Half of Organizations in Recent Survey (Salt Security, State of Agentic AI and API Security 2H 2026), 21 October 2026, https://campustechnology.com/articles/2026/10/21/unexpected-ai-agent-activity-reported-by-nearly-half-of-organizations-in-recent-survey.aspx",
    "cnbc_capex": "CNBC, AI buildout hits snag as Google and Microsoft put off raising capex forecasts, 29 October 2026, https://www.cnbc.com/2026/10/29/microsoft-google-ai-capex-estimates.html",
    "cnbc_goog": "CNBC, Alphabet tanks nearly 13% for worst day ever, losing $500 billion in value, 29 October 2026, https://www.cnbc.com/2026/10/29/alphabet-google-microsoft-msft-shares-today-earnings.html",
    "nanda": "The Register, GenAI FOMO has spurred businesses to light nearly $40 billion on fire (MIT Project NANDA, The GenAI Divide), 18 August 2025, https://www.theregister.com/2025/08/18/generative_ai_zero_return_95_percent",
    "replit": "Fortune, AI coding tool Replit wiped a database and called it a catastrophic failure, 23 July 2025, https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure",
    "forrester": "Forrester via Business Wire, Forrester's 2026 Technology and Security Predictions: As AI's Hype Fades, Enterprises Will Defer 25% of Planned AI Spend to 2027, 28 October 2025, https://www.businesswire.com/news/home/20251028226928/en/",
    "g_jan": "Gartner, Gartner Says Worldwide AI Spending Will Total $2.5 Trillion in 2026, 15 January 2026, https://www.gartner.com/en/newsroom/press-releases/2026-1-15-gartner-says-worldwide-ai-spending-will-total-2-point-5-trillion-dollars-in-2026",
    "telecomtv": "TelecomTV, Gartner says worldwide AI spending will total $2.5tn in 2026 (analyst quotes), 19 January 2026, https://www.telecomtv.com/content/digital-platforms-services/gartner-says-worldwide-ai-spending-will-total-2-5tn-in-2026-54671/",
    "reg_nber": "The Register, 6,000 execs struggle to find the AI productivity boom, 18 February 2026, https://www.theregister.com/2026/02/18/ai_productivity_survey/",
    "stanford": "Stanford HAI, Inside the AI Index: 12 takeaways from the 2026 report, April 2026, https://hai.stanford.edu/news/inside-the-ai-index-12-takeaways-from-the-2026-report",
    "techtimes": "Tech Times, Record AI spending can't move earnings needle for 94% of enterprises, McKinsey finds, 26 August 2026, https://www.techtimes.com/articles/325590/20260826/record-ai-spending-cant-move-earnings-needle-94-enterprises-mckinsey-finds.htm",
    "nber2": "NBER Working Paper 34984, Artificial Intelligence, Productivity, and the Workforce: Evidence from Corporate Executives (Baslandze and others), March 2026, https://nber.org/papers/w34984",
    "g_cfo": "Gartner, Gartner Says CFOs Must Stop Mistaking Finance AI Deployment for Value Creation, 28 May 2026, https://www.gartner.com/en/newsroom/press-releases/2026-05-28-gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation",
}
ORDER = []

def C(*keys):
    for k in keys:
        if k not in ORDER: ORDER.append(k)
    return S(*[ORDER.index(k) + 1 for k in keys])

def num(k):
    if k not in ORDER: ORDER.append(k)
    return ORDER.index(k) + 1

def build():
    ORDER.clear()
    b = RBook("The AI Reckoning", 4, "bars", "terrain")
    b.how = "What the 2026 evidence says about AI spending and returns, why agents have become the reliability question of the year, and what UK leaders should do next. Every figure is sourced."
    b.rep_cover("Intelligence report · Enterprise AI value", "The AI<br>reckoning.",
        "Spending on AI is growing faster than ever. Proof of financial return is not. An evidence-based look at the gap, what agents add to the risk, and how the organisations seeing value are different.", "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("The money is real. The returns, for most, are not yet.", [
        f"Gartner now expects worldwide AI spending to reach about $2.67 trillion in 2026, up 49.5% on 2025, and has raised its forecast twice this year.{C('g_sep','techstrong')} Over the same period, the most widely cited surveys show little change in the share of organisations reporting a financial return. McKinsey's 2026 State of AI found 37% of respondents attributing any EBIT impact to AI, essentially unchanged on a year earlier, and only about 6% attributing 5% or more.{C('mck','fortune')}",
        f"The independent evidence is cooler still. A study of nearly 9,000 executives in seven countries, including the UK, found AI had raised annual labour productivity growth by about 0.2% over the past three years, with executives expecting 0.6% a year over the next three.{C('nber')} That is a real effect, but far smaller than the investment implies.",
        f"Agents raise the stakes. Vendor-sponsored surveys this year report that large shares of firms have had to reverse an agent's action or met failures they could not trace.{C('kore')} These numbers come from companies that sell agent or security tooling, so treat them as signals, not measurements. The signal is consistent all the same.",
        f"The organisations seeing value share habits: they redesign workflows rather than bolt AI on, measure impact against a baseline, put a senior owner on the hook and run agents inside a governed control layer.{C('mck','kpmg')}"],
        "The 2026 reckoning is not a verdict that AI does not work. It is a verdict on how most organisations buy and deploy it. Fund fewer, measured use cases, put controls around agents before they act, and stop what does not pay.")

    b.mark("", "Key findings")
    b.findings("Seven things the evidence says", [
        ("Spending keeps accelerating.", f"Gartner's September forecast puts 2026 AI spending at $2.67 trillion, with infrastructure about 56% of the total.{C('techstrong')}"),
        ("Reported returns are flat.", f"The share of McKinsey respondents reporting any EBIT impact held at 37%; high performers stayed at about 6%.{C('mck')}"),
        ("Most CEOs have yet to see a financial benefit.", f"In PwC's survey of 4,454 CEOs, 56% reported no significant financial benefit from AI so far; 12% reported both lower costs and higher revenue.{C('pwc','wealth')}"),
        ("Measured productivity gains are small so far.", f"Executives in a large NBER study put AI's boost to annual labour productivity growth at about 0.2% to date.{C('nber')}"),
        ("Agents fail in ways firms struggle to see.", f"In a Salt Security survey, only 12.5% could consistently trace an agent's complete path and 17.5% could stop a misbehaving agent automatically.{C('salt')}"),
        ("Governance and returns travel together.", f"KPMG found 86% of organisations reporting established ROI run a formal control layer for AI, against 31% of those still experimenting.{C('kpmg')}"),
        ("UK adoption is broad but shallow.", f"About 35% of UK firms with 10 or more staff use AI, but only 10% of adopters describe their use as extensive.{C('ons')}")])

    b.facts("The reckoning in six numbers", "Spending, returns and reliability in 2026. Survey figures are self-reported; vendor surveys are labelled.", [
        ("$2.67tn", f"Gartner forecast of worldwide AI spending in 2026, up 49.5% on 2025.{C('techstrong')}"),
        ("37%", f"McKinsey respondents attributing any EBIT impact to AI, essentially unchanged on 2025.{C('mck')}"),
        ("56%", f"CEOs in PwC's survey reporting no significant financial benefit from AI so far.{C('pwc')}"),
        ("0.2%", f"Estimated annual boost to labour productivity growth from AI over three years, per executives in the NBER study.{C('nber')}"),
        ("79%", f"Respondents to a Kore.ai-commissioned survey who had to reverse an action taken by an AI agent.{C('kore')}"),
        ("12%", f"Organisations in KPMG's Q3 pulse that consistently assess AI value against cost.{C('kpmg')}")], "At a glance")

    b.timeline("How the reckoning built", "From early warnings in 2025 to the October 2026 earnings season.", [
        ("Jul 2025", "Agent deletes a live database", f"An AI coding agent wiped a production database during a code freeze. The vendor added new safeguards.{C('replit')}"),
        ("Aug 2025", "The '95%' study lands", f"MIT Project NANDA reported most firms in a small, preliminary sample saw no measurable return.{C('nanda')}"),
        ("Jan 2026", "Gartner: the trough", f"Gartner forecast $2.52 trillion of 2026 AI spending and said AI is in the Trough of Disillusionment throughout 2026.{C('g_jan','telecomtv')}"),
        ("Jan 2026", "CEOs report thin returns", f"PwC's Global CEO Survey found 56% of CEOs had seen no significant financial benefit from AI.{C('pwc')}"),
        ("Feb 2026", "Economists look for the boom", f"An NBER study of about 6,000 executives found most saw no discernible AI impact on jobs or productivity.{C('reg_nber')}"),
        ("May to Jun 2026", "Agent rollbacks surface", f"Vendor surveys from Sinch and Kore.ai reported widespread rollbacks and reversals of AI agents.{C('sinch','kore')}"),
        ("Aug to Sep 2026", "Spending up, EBIT flat", f"McKinsey reported flat EBIT impact; Gartner raised its 2026 spending forecast to $2.67 trillion.{C('mck','g_sep')}"),
        ("29 Oct 2026", "Investors test the build-out", f"Alphabet shares fell about 13% on negative free cash flow; Microsoft trimmed its capex forecast.{C('cnbc_goog','cnbc_capex')}")])

    b.mark("01", "The gap between spend and return")
    b.opener("01", "The gap.", "Spending is compounding. Reported returns are not. Why the two lines have come apart.", [("01", "Where the money is going"), ("02", "Reading the return surveys"), ("03", "Why the gap persists")])
    b.essay("The gap", "Where the money is going, and why returns lag", [
        f"The scale of 2026 AI spending is hard to overstate. Gartner's September forecast of $2.67 trillion includes about $1.48 trillion for infrastructure, so more than half the total is data centres, servers and chips rather than software that changes how a business runs.{C('techstrong')} Gartner's own analyst called the build-out the largest infrastructure project humanity has ever undertaken.",
        f"That matters for how to read the gap. Much of the money is a bet by technology providers on future demand. Enterprise budgets are smaller but rising: KPMG's quarterly pulse put average planned AI investment at $210 million over the next 12 months among the large organisations it surveys, up from $186 million in the first quarter.{C('kpmg')}",
        f"The returns side moves more slowly. McKinsey's 2026 survey of 1,719 respondents found adoption almost universal, with nearly nine in ten using AI in at least one function, yet the share reporting any EBIT impact stayed at 37%.{C('fortune')} Gartner said in January that better predictability of ROI must come before AI can truly scale.{C('telecomtv')}",
        f"Costs are also creeping in from an unexpected direction. One in five McKinsey respondents said operating costs, including token charges, already constrain their use of AI.{C('fortune')} Usage-based pricing means a successful pilot can become an expensive production service.",
        f"Investors are now asking the same question as boards. In late October Alphabet reported negative free cash flow of $9.07 billion for the quarter and its shares fell about 13%, their worst day on record.{C('cnbc_goog')} Several causes were cited, so this is not a simple verdict on AI. But it shows that the market is pricing return on AI capital, not only ambition.",
        "For an enterprise buyer, the lesson is simple. The supply side will keep spending. Your job is to make sure your own share of that spending buys something you can measure."],
        "The gap", "Most of 2026's AI money is being spent on capacity. Value has to be built inside your own workflows.")
    b.table("Reading the surveys", "Why the return figures disagree", "Headline ROI figures range widely because each survey asks a different question. Compare definitions before comparing numbers.", ["Source", "What it asked", "What it found"],
        [("McKinsey, Aug 2026", "Any EBIT impact attributed to AI by 1,719 respondents.", f"37% any impact; about 6% attribute 5% or more of EBIT.{C('mck')}"),
         ("PwC, Jan 2026", "CEO view of revenue and cost effects over 12 months.", f"56% no significant benefit; 12% both cost and revenue gains.{C('pwc')}"),
         ("KPMG, Sep 2026", "Value tracking and controls among 2,131 senior leaders.", f"Only 12% consistently assess AI value against cost.{C('kpmg')}"),
         ("NBER, 2026", "Executive estimates of productivity and jobs, nearly 9,000 firms.", f"About 0.2% a year added to productivity growth so far.{C('nber')}"),
         ("Gartner, May 2026", "Finance leaders on AI rollout, 204 respondents.", f"63% said 2025 implementation was slower than expected.{C('g_cfo')}")], "The gap", widths="32mm 1fr 1fr")

    b.mark("02", "What the evidence really says")
    b.opener("02", "The<br>evidence.", "What we can say with confidence, what we cannot, and why individual gains are not yet showing up in the accounts.", [("01", "Strengths and limits of the data"), ("02", "Claims versus evidence"), ("03", "Where value leaks")])
    b.essay("The evidence", "Real gains, small totals, weak measurement", [
        f"The most careful evidence of 2026 points in one direction: AI is producing real but modest gains so far. The NBER study, which surveyed nearly 9,000 executives across the US, UK, Germany and four other countries, found AI raised annual labour productivity growth by about 0.2% over three years, with essentially no net effect on employment.{C('nber')} Executives expect 0.6% a year over the next three.",
        f"A separate NBER paper based on about 750 executives was more positive, finding productivity gains that vary by sector and are strongest in high-skill services and finance. It also found executives perceive larger gains than they can yet measure, which the authors link to a lag in revenue realisation.{C('nber2')}",
        f"Task-level studies are more striking. Stanford's 2026 AI Index reports large gains in some settings, such as clinicians reporting far less time on notes, while noting agents still lag on multi-step planning and financial analysis.{C('stanford')}",
        f"The gap between task and firm is the heart of the problem. McKinsey found 80% of respondents say AI improved their own productivity, against 37% reporting any EBIT impact.{C('mck')} Time saved by an individual becomes money only if the work is redesigned, so the hour is either removed from cost or reinvested in something customers pay for.",
        "The limits of the evidence deserve equal attention. Almost every figure here is self-reported. Surveys by consultancies and vendors draw on clients and prospects, define success differently and rarely track the same firms over time. Few organisations have baselines, so their own claims are hard to test.",
        f"The weakest evidence tends to be the loudest. The widely shared 2025 finding that 95% of organisations saw no return came from a small, preliminary sample.{C('nanda')} Treat any single headline figure, positive or negative, with the same scepticism."],
        "The evidence", "Individual productivity is not the same as financial return. Work has to change for one to become the other.")
    b.compare("Claims and evidence", "What is claimed, and what the evidence supports", "Common claims heard in board rooms and sales meetings, tested against the 2026 data.", ["Claim", "Often heard", "What the evidence supports"],
        [("Everyone is seeing ROI", "AI pays back within months.", f"A minority report material EBIT impact; most report none or small.{C('mck','pwc')}"),
         ("Productivity is soaring", "Teams are twice as productive.", f"Task gains can be large; firm-level gains are about 0.2% a year so far.{C('nber')}"),
         ("Spend will slow", "The bubble is about to burst.", f"Forecasts and capex guidance are still rising; delays are about capacity.{C('g_sep','cnbc_capex')}"),
         ("Agents replace processes", "Let agents run the workflow.", f"Many firms report reversals and untraceable failures, per vendor surveys.{C('kore','salt')}"),
         ("Jobs will vanish now", "AI is cutting headcount at scale.", f"Around half of UK adopters report no headcount effect.{C('ons')}")], "The evidence")
    b.figpage("How value leaks", "Four filters between a pilot and the P&L", "Most AI value is lost between the demo and the accounts.", "sieve", [
        ("Task gain without workflow change", f"Minutes saved are absorbed unless work is redesigned, as most of McKinsey's high performers have done.{C('mck')}"),
        ("No baseline, no proof", f"Without a before measure, gains are anecdote. Only 12% in KPMG's pulse consistently assess value against cost.{C('kpmg')}"),
        ("Running costs outgrow the gain", f"Token charges scale with use; one in five McKinsey respondents say costs already limit use.{C('fortune')}"),
        ("Reliability incidents erase the benefit", "One bad agent action that reaches a customer or ledger can cost more than months of saved effort.")], "The evidence")

    b.mark("03", "Agents and reliability")
    b.opener("03", "Agents.", "Agents act, not just answer. That changes the risk, the controls and the economics.", [("01", "What the 2026 surveys show"), ("02", "How agent failures spread"), ("03", "Who is seeing value, and why")])
    b.essay("Agents", "When software acts on its own judgement", [
        f"Agents moved from slides to production in 2026. McKinsey found 40% of organisations with over $1 billion in revenue now scale agents in at least one function, up from 27% a year earlier; among smaller firms the share stayed at 22%.{C('techtimes')}",
        f"The reliability evidence comes mostly from vendors, and it should be read that way. Kore.ai, which sells an agent platform, commissioned a May 2026 survey of over 400 US IT leaders: 79% had to reverse an action taken by an agent, 70% had met a failure their teams could not trace and 42% reported lost revenue from an agent failure.{C('kore')}",
        f"Sinch, a communications platform vendor, surveyed more than 2,500 AI decision makers and found 74% had rolled back or shut down a live customer communications agent.{C('sinch')} Its most interesting result was that the rollback rate was higher, 81%, among organisations with fully mature guardrails.{C('reg_sinch')} One reading is that good controls make problems visible and stoppable, which is the point.",
        f"Salt Security, an API security vendor, found 49.8% of more than 380 respondents had confirmed or suspected unexpected or unauthorised agent activity. Only 17.5% could automatically stop a misbehaving agent in production.{C('salt')}",
        f"None of these is a neutral measurement. Samples are self-selected, definitions vary and each sponsor sells a remedy. But they agree with public incidents, such as the 2025 case in which a coding agent deleted a live database during a code freeze.{C('replit')}",
        "The economic consequence is simple. An agent that is right most of the time but cannot be traced, paused or undone carries hidden costs: review effort, rework, customer remediation and regulatory exposure. Those costs belong in the business case from day one."],
        "Agents", "Rollbacks are not the failure. Being unable to see, stop or undo an agent is.")
    b.figpage("How agent failures spread", "One action, many systems", "A single wrong step can travel across systems. These are the points to catch it.", "relay", [
        ("Permissions wider than the task", "Agents inherit the access of their account. Scope each to the minimum it needs."),
        ("Chained actions with no checkpoint", f"In Kore.ai's survey, 40% said one agent failure cascaded across systems.{C('kore')} Add approval points."),
        ("Activity no one can reconstruct", f"Only 12.5% in Salt Security's survey could consistently trace an agent's full path.{C('salt')} Log every tool call."),
        ("No fast way to stop or undo", "Agents need a kill switch, reversible actions and a tested restore route.")], "Agents")
    b.grid("Who is seeing value", "What the 6% do differently", "The organisations reporting real returns are not using different models. They run AI differently.", [
        ("loop", "Redesign the work", f"Nearly three quarters of McKinsey's high performers redesigned workflows around AI, against about a quarter of others.{C('mck')}"),
        ("magnifier", "Measure against cost", f"Among organisations reporting returns, 48% consistently assess AI value against cost, against 12% overall.{C('kpmg')}"),
        ("shield", "Govern before scaling", f"86% of those with established ROI run a formal control layer between models and business use.{C('kpmg')}"),
        ("owner", "Put a senior name on it", f"High performers are more than twice as likely to report visible senior commitment and defined impact measures.{C('techtimes')}")], "Agents",
        "The pattern is consistent across sources: value follows discipline, not spend.")

    b.mark("", "What it means for UK organisations")
    b.essay("UK organisations", "What it means for UK organisations", [
        f"UK adoption has grown fast. The ONS estimates about 35% of businesses with 10 or more employees use at least one AI technology, up from about 12% in late 2023, rising to 49% among firms with 250 or more staff.{C('ons')}",
        f"Use is shallow. Only 10% of adopting businesses describe their use as extensive, and the average adopter uses about 1.6 AI technologies.{C('ons')} Most UK firms have bought a tool; far fewer have changed how they work, which is exactly where the return is made.",
        f"The ONS also finds around half of businesses report no headcount effect from AI, and has not yet published firm-level productivity estimates.{C('ons')} UK executives are part of the NBER sample, which found modest productivity effects to date.{C('nber')}",
        "For mid-sized UK organisations, the reckoning is an advantage. You can avoid the pilot sprawl and runaway usage bills larger firms are now unwinding, and buy on evidence rather than fear of missing out.",
        "Three UK-specific points apply. First, UK GDPR and the ICO's expectations apply to any agent that touches personal data, so audit trails and the ability to correct or reverse actions are compliance requirements, not extras. Second, sector regulators expect accountable humans for consequential decisions. Third, exchange rates and usage pricing mean AI costs quoted in dollars can move without warning; budgets need headroom and caps.",
        "The practical stance is to treat AI like any other capital decision: a baseline, a target, a named owner, a cost envelope and a date to decide whether to scale or stop."],
        "UK organisations", "UK firms have adopted AI widely. The next step is using it deeply, and measuring what it changes.")

    b.mark("", "Recommendations")
    b.principles("Recommendations", "Seven moves to make AI pay", "Drawn from the habits of organisations reporting returns, and from the 2026 failures.", [
        ("Fund fewer use cases, with targets", "Pick a small number where value is measurable in money, time or risk, and set the target before you start."),
        ("Baseline before you build", "Measure cycle time, cost per case, error rate or revenue now, so the pilot can be judged."),
        ("Redesign the workflow, not just the task", "Decide where saved time goes: removed cost, more volume or better service."),
        ("Put agents in a control layer", "Least privilege, approval points for high-impact actions, full logging, a kill switch and tested rollback."),
        ("Cap and track running costs", "Budget per use case, alerts on usage and a monthly cost per outcome."),
        ("Report value like any investment", "A one-page quarterly view for the board: spend, outcomes, incidents and decisions."),
        ("Set stop rules in advance", "If a use case misses its target by an agreed date, stop it and redeploy the budget.")], "Recommendations")
    b.questions("For the board", "Questions boards should ask", "Use these at the next review of AI spend.", [
        ("Value", ["Which AI use cases have a baseline, and what has changed against it?", "What is our cost per outcome, and is it falling?", "Which initiatives have we stopped this year, and why?"]),
        ("Control", ["Which agents can act without human approval, and on which systems?", "Could we trace, pause and reverse an agent's actions today?", "Who is the named executive accountable for AI outcomes?"])], "Recommendations")
    b.glossary("Terms used in this report", [
        ("AI agent", "An AI system that takes actions, such as calling tools or changing records, towards a goal."),
        ("EBIT", "Earnings before interest and tax; a common measure of operating profit."),
        ("Baseline", "A measure of performance before a change, used to judge its effect."),
        ("Capex", "Capital expenditure; here, spending on data centres, servers and chips."),
        ("Control layer", "The policies and tooling between AI models and business systems: access, approvals, logging and monitoring. KPMG calls this a harness layer."),
        ("Rollback", "Reversing an agent's action or withdrawing an agent from live service."),
        ("Observability", "The ability to see what a system did and why, from logs and traces."),
        ("Token", "The unit by which most AI model usage is metered and billed."),
        ("Trough of disillusionment", "Gartner's term for the phase after peak hype when results fall short of expectations."),
        ("Workflow redesign", "Changing how work is done end to end, not just adding a tool to an existing step.")], "Glossary")

    b.mark("", "Sources")
    items = [(i + 1, SRC[k]) for i, k in enumerate(ORDER)]
    half = len(items) // 2
    b.sources(items[:half])
    b.sources(items[half:], "Continued. Vendor-sponsored surveys are identified in the text. Survey figures are self-reported by respondents.")
    b.rep_back("Make your AI<br>investment count.", "Transputec helps UK organisations pick AI use cases that pay, put controls around agents and report value the board can trust.", "Book an AI value review", "Make AI Pay · the companion playbook")
    return b
