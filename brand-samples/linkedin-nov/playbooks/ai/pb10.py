from aikit import AIBook

def build():
    b = AIBook("The AI Business Case", num=10, art="sheen", pos="80%")
    b.how = "How to build an AI business case that survives scrutiny: where value really comes from, what it really costs, and how to prove it with a pilot and report it to the board."
    b.art_cover("Playbook No. 10 · Value", "The AI business case.", "Proving value without the hype.", "An honest method for estimating, testing and reporting the value of AI, so you invest with confidence and stop what is not working.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("Most AI business cases fail not because the value is missing, but because nobody measured it.", [
        "Boards are being asked to fund AI on the strength of demos, vendor claims and enthusiasm. Some of those investments are paying back handsomely. Others are quietly costing money with little to show. In many organisations, nobody can say which is which.",
        "The problem is rarely the technology. It is that the case was never framed in a way that could be tested: no baseline, no agreed measures, no point at which anyone would say this is not working.",
        "This playbook sets out a plain, honest method. Be specific about the type of value, count all the costs, estimate in ranges, prove it with a well-designed pilot and report it in terms a board recognises. It will not make every project succeed. It will make it clear, early, which ones are."])
    b.mark("", "Introduction"); b.intro("Introduction", "Real value, honestly counted.", "A good AI business case is not a big number. It is a clear story about what will change, how you will know and what it will cost to get there, built on assumptions anyone can challenge.",
        [("magnifier", "Name the value precisely", "Time released, better quality, faster service, more revenue or lower risk. Each is measured differently, so be specific."),
         ("tag", "Count every cost", "Licences are the visible part. Integration, training, change and governance often cost as much again."),
         ("check", "Prove it before you scale it", "A baseline, a pilot with success criteria agreed in advance and a willingness to stop if the evidence is not there.")])
    b.statement("Minutes saved are not money saved, until someone decides what to do with them.", "The most common mistake in AI business cases is counting released time as cash. Value is real only when it shows up in output, quality, service or cost.", "Introduction")

    b.mark("01", "Where the value comes from"); b.opener("01", "Value, and<br>what it costs.", "The six types of value AI creates, the full cost of getting it and how an honest case differs from a hopeful one.", [("01", "Why cases go wrong"), ("02", "Six types of value"), ("03", "The full cost picture")])
    b.essay("The problem", "Why so many AI business cases fall apart", [
        "Most weak AI business cases follow the same pattern. Someone estimates how many minutes a tool saves per person per day, multiplies by headcount and salary, and arrives at an impressive annual figure. The licences look cheap by comparison, and the case is approved.",
        "Twelve months later, nobody can find the savings. Headcount has not changed, costs have not fallen and the finance team is asking awkward questions. The tool may well have helped. But the case promised cash, and released time is not cash unless it is redeployed, removes cost or allows growth without extra hiring.",
        "The second common flaw is ignoring adoption. A business case that assumes everyone uses a tool well from day one is describing an organisation that does not exist. In practice, use builds slowly, varies widely between teams and depends heavily on training and leadership.",
        "The third is leaving out costs. Licences are easy to see. Connecting tools to your systems, preparing data, training people, changing processes and governing the whole thing are less visible, and they are often where projects run over.",
        "None of this means AI value is not real. It means value has to be named precisely, measured against a baseline and tied to a decision about what changes. The rest of this playbook shows how."],
        "Where value comes from", "If the case cannot say what will be different, for whom, and how you will see it, it is not a case yet.")
    b.table("Six types of value", "Be specific about the kind of value", "Each type of value is real, but each is evidenced differently. Pick the one or two that matter most for each use case.", ["Value type", "What it means", "How to evidence it"],
        [("Time released", "Work takes less effort, freeing capacity.", "Before-and-after task timings, plus what the time was used for."),
         ("Quality", "Fewer errors, more consistent output.", "Error rates, rework, reviewer scores, complaints."),
         ("Speed", "Customers and colleagues get answers sooner.", "Cycle times, response times, backlog size."),
         ("Revenue", "More proposals, better conversion, new services.", "Pipeline and win-rate changes, compared with a control group."),
         ("Risk reduction", "Fewer missed obligations or incidents.", "Incident counts, audit findings, compliance checks."),
         ("Employee experience", "Less drudgery, better retention.", "Pulse surveys, attrition, internal feedback.")], "Where value comes from")
    b.grid("The full cost", "Four kinds of cost to include", "Most cases undercount cost. Include all four, over the full life of the project, not just the first year.",
        [("tag", "Licences and usage", "Per-user subscriptions, plus usage-based charges for APIs and agents, which rise with volume and need monitoring and caps."),
         ("transfer", "Integration and data", "Connecting tools to your systems, preparing and cleaning data, and the engineering time to build and maintain it."),
         ("owner", "People and change", "Training, champions' time, process redesign and the dip in productivity while people learn new ways of working."),
         ("shield", "Governance and security", "Policy, risk assessments, access reviews, monitoring and the ongoing effort to keep it all safe and compliant.")], "Where value comes from",
        "A cheap licence on an expensive process change is not a cheap project. Cost the change, not just the tool.")
    b.compare("Honest or hopeful?", "What separates a credible case from a hopeful one", "Boards have seen enough optimistic cases. The credible one is usually the one that gets funded twice.", ["Element", "Hopeful case", "Honest case"],
        [("Value", "Minutes saved multiplied by salary.", "Named value types, with how released time will be used."),
         ("Adoption", "Everyone, fully, from day one.", "A realistic ramp, based on pilot evidence."),
         ("Costs", "Licences only.", "Licences, usage, integration, training, change and governance."),
         ("Estimates", "One confident number.", "A range, with the assumptions written down."),
         ("Exit", "Not mentioned.", "Clear criteria for scaling, adjusting or stopping.")], "Where value comes from")

    b.mark("02", "Building the case"); b.opener("02", "Build it<br>honestly.", "How to baseline, estimate in ranges and turn a use case into a case anyone can challenge.", [("01", "Baselining the work"), ("02", "Estimating with ranges"), ("03", "Worked examples")])
    b.steps("Baselining", "Six steps to a baseline you can trust", "Without a baseline, every result is an opinion. It need not be elaborate, but it must exist before the tool arrives.",
        [("Define the task precisely", "Name the process, where it starts and ends, and who does it."),
         ("Measure volume", "How many times it happens per week or month, from system data where possible."),
         ("Measure effort and time", "Sample how long it takes and how long customers or colleagues wait."),
         ("Measure quality", "Capture current error, rework or complaint rates."),
         ("Note the context", "Record staffing, seasonality and anything else that could skew comparisons."),
         ("Agree it with the owner", "The process owner signs off the baseline before the pilot starts.")], "Building the case",
        "A rough baseline taken before the pilot is worth far more than a precise one reconstructed afterwards.")
    b.essay("Estimating", "Ranges, assumptions and the discipline of saying what you do not know", [
        "A single number in a business case invites false confidence. A range invites the right conversation. For each benefit, estimate a cautious, an expected and an optimistic outcome, and write down the assumptions that drive each one.",
        "Start from the baseline. If a task happens <b>V</b> times a month and takes <b>T</b> minutes each time, the current effort is V multiplied by T. The pilot tells you the new time per task, and the share of tasks where the tool is actually used. Those two numbers, not a vendor's claim, drive your estimate.",
        "Then ask the question most cases skip: what happens to the released time? It might absorb growth without new hires, clear a backlog, shorten response times or fund more valuable work. Each of those has a different financial meaning. Only some of them reduce cost, and the case should say which.",
        "Build adoption into the numbers. Use will rise over months, not days, and will differ between teams. A realistic ramp, based on what the pilot showed, protects the case from the most common source of disappointment.",
        "Finally, test the assumptions. Which one, if wrong, would sink the case? Volume, time saved, adoption or cost per task? Name it, and plan to measure it early. Boards trust a case that knows its weak points far more than one that pretends it has none."],
        "Building the case", "Estimate in ranges. State every assumption. Name the one that matters most.")
    b.table("Worked example", "The method, step by step", "An illustrative service desk case. Letters are placeholders for your own figures: this shows the method, not a result.", ["Element", "How to work it out", "Illustrative placeholder"],
        [("Volume", "Tickets per month that suit AI-drafted replies.", "V tickets a month"),
         ("Time per ticket", "Baseline handling time, then time with the tool, from the pilot.", "From T1 to T2 minutes"),
         ("Adoption", "Share of eligible tickets where agents actually use the tool.", "A per cent, rising over the ramp"),
         ("Time released", "V multiplied by A, multiplied by the difference between T1 and T2.", "X hours a month"),
         ("Use of time", "What the team will do with X hours, and its value.", "Backlog cleared, or growth absorbed"),
         ("Total cost", "Licences, usage, integration, training and governance, for the term.", "C over the contract term")], "Building the case", widths="30mm 1fr 1fr")
    b.usecase("Worked examples", "Three use cases, three different value stories", [
        ("bell", "Service desk", "AI-suggested replies and ticket summaries", [("Main value", "Speed and capacity: faster resolution without adding staff as volume grows."), ("Baseline", "Handling time, first-contact resolution and backlog, from the ticketing system."), ("Leading indicator", "Share of tickets where agents use and accept suggestions."), ("Lagging indicator", "Resolution times, backlog and customer satisfaction over a quarter.")]),
        ("contract", "Finance", "Month-end commentary and reconciliations", [("Main value", "Quality and time: fewer errors and an earlier close."), ("Baseline", "Days to close, review comments and late adjustments."), ("Leading indicator", "Drafts produced with AI and accepted with light edits."), ("Lagging indicator", "Close timetable and audit or review findings.")]),
        ("compass", "Sales", "Proposal and tender drafting", [("Main value", "Revenue: more and better bids from the same team."), ("Baseline", "Bids submitted, time per bid and win rate."), ("Leading indicator", "Time to first draft and bids completed per person."), ("Lagging indicator", "Win rate and pipeline value, compared with similar teams.")])], "Building the case")

    b.mark("03", "Proving and reporting it"); b.opener("03", "Prove it,<br>then report it.", "Pilots that produce evidence, measures boards trust and the courage to stop what is not working.", [("01", "Designing the pilot"), ("02", "Reporting to the board"), ("03", "When to stop")])
    b.flow("Pilot design", "A pilot that produces a decision", "A pilot is an experiment, not a soft launch. Design it to answer a question, and agree in advance what answer would mean what.",
        [("compass", "Frame the question", "Write down what the pilot must show, for which process, and the decision it will inform."),
         ("check", "Set success criteria", "Agree the thresholds for scale, adjust or stop before the pilot starts, with the sponsor."),
         ("owner", "Choose participants", "Pick a representative group, not just enthusiasts, and a comparison group where you can."),
         ("flask", "Run for long enough", "Allow time for people to learn and for lagging measures to move, usually more than a few weeks."),
         ("sliders", "Decide and record", "Compare results with the criteria, make the call and write down why.")], "Proving it",
        "Agree the stop criteria at the start. It is much harder to set them once people are invested.")
    b.compare("Leading and lagging", "Measure early signals and final outcomes", "Lagging measures prove value but arrive late. Leading measures tell you early whether you are on track.", ["Aspect", "Leading indicators", "Lagging indicators"],
        [("What they show", "Whether the conditions for value are in place.", "Whether value has actually been delivered."),
         ("Examples", "Active use, acceptance rate, time per task, training completed.", "Cost per case, cycle time, error rate, revenue, retention."),
         ("When they move", "Within days or weeks.", "Over months or quarters."),
         ("What they are for", "Steering adoption and spotting problems early.", "Justifying continued investment and scale."),
         ("Trap to avoid", "Treating usage as if it were value.", "Waiting a year to find out it is not working.")], "Proving it")
    b.dive("01", "eye", "Reporting to the board", "Boards do not need the technology explained. They need to know what was promised, what has happened, what it cost and what you recommend next.",
        [("Promise and progress", "Restate the original case in one line, then show progress against the agreed measures, leading and lagging."),
         ("Cost to date", "Show all costs against budget, including usage-based charges, integration and people time, not just licences."),
         ("Risks and issues", "Report incidents, near misses and any data or compliance concerns, and what has been done about each."),
         ("Recommendation", "Scale, adjust or stop, with the evidence for it and the next decision point clearly dated.")], "Proving it", "The executive sponsor, supported by finance")
    b.matrix("Scale, fix or stop", "What to do with each AI project", "Review each project against two questions: is value showing up, and are people actually using it?", "Adoption", "Evidence of value",
        [("Fix adoption", "Value proven, low use", "It works where used. Invest in training, champions and process change before buying more."), ("Scale", "Value proven, high use", "Expand to more teams, renegotiate on volume and keep measuring."),
         ("Stop", "Little value, low use", "Close it, release the budget and record the lessons for the next project."), ("Rethink", "Little value, high use", "People like it but it does not move outcomes. Re-target it or reduce the spend.")], "Proving it")
    b.steps("Common traps", "Six traps that undermine AI business cases", "Every one of these is common, and every one is avoidable.",
        [("Counting minutes as cash", "Released time is capacity. It becomes money only through a decision about how it is used."),
         ("Ignoring adoption", "Value scales with real use, which builds slowly and unevenly."),
         ("Forgetting the hidden costs", "Integration, training, change and governance can match the licence bill."),
         ("No baseline", "Without one, results are anecdotes and every claim can be disputed."),
         ("Pilots that never end", "Without success criteria and a decision date, pilots drift indefinitely."),
         ("Never stopping", "Projects that are not working keep consuming budget and goodwill.")], "Proving it")
    b.questions("Before you approve", "Questions to ask of any AI business case", "Use these to test a proposal before it reaches the board, or when it does.",
        [("Value", ["Which type of value is this, and how will we evidence it?", "What will happen to any time released, and who decides?", "What is the baseline, and who signed it off?"]),
         ("Cost and control", ["Have all costs been included, including usage, integration and change?", "Which single assumption, if wrong, would sink this case?", "What result would make us stop, and when will we decide?"])], "Proving it")
    b.checklist("Checklist", "Is your AI business case board-ready?", "Tick what is in place. Gaps are where challenge will come from.",
        [("The value type is named and specific", "With a clear link to outcomes the business cares about."), ("A baseline exists and is signed off", "Taken before the tool is introduced."), ("All costs are included over the full term", "Licences, usage, integration, training, change and governance."),
         ("Estimates are ranges with stated assumptions", "And the most important assumption is named."), ("Pilot success criteria are agreed in advance", "Including what would trigger a stop."), ("Leading and lagging measures are defined", "With an owner and a reporting rhythm."),
         ("An executive sponsor owns the outcome", "And reports progress to the board.")], "Proving it")
    b.glossary("Words worth knowing", [("Business case", "A structured argument for investment, setting out value, cost, risk and how success will be judged."), ("Baseline", "A measurement of how a process performs before a change is made."),
        ("Time released", "Effort freed by a change. Capacity, not cash, until it is redeployed or removes cost."), ("Leading indicator", "An early measure that shows whether value is likely, such as active use."),
        ("Lagging indicator", "A later measure that shows whether value was delivered, such as cost per case."), ("Adoption ramp", "The gradual rise in real use of a tool over time."),
        ("Control group", "A comparable team not using the tool, used to separate its effect from other changes."), ("Usage-based pricing", "Charges that rise with how much a tool or API is used."),
        ("Total cost of ownership", "All costs over the life of a solution, not just the purchase price."), ("Success criteria", "Thresholds agreed in advance that decide whether to scale, adjust or stop."),
        ("Sponsor", "The senior leader accountable for a project delivering its intended value.")])
    b.art_back("Ready to prove<br>the value of AI?", "We help organisations pick use cases worth funding, design pilots that produce evidence and report results the board can trust.", "Book an AI value workshop", "No. 11 · Securing AI")
    return b
