from aikit import AIBook

def build():
    b = AIBook("The First 90 Days of AI", num=6, art="horizon", pos="50%")
    b.how = "A week-by-week plan that takes AI from a leadership decision to an everyday habit, with the roles, training, communications and board reporting to match."
    b.art_cover("Playbook No. 06 · Rollout", "The first 90 days", "of AI.", "A practical, week-by-week plan to move from decision to everyday use, with clear owners, safe settings and results your board will believe.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The decision to adopt AI takes a meeting. Making it stick takes a plan.", [
        "Most leadership teams have already agreed that AI matters. The harder question is what happens on Monday morning. Who does what, in which order, and how will anyone know whether it is working?",
        "Ninety days is long enough to set solid foundations, run a proper pilot and prove value, and short enough to keep energy high. It also fits neatly into a quarter, which makes it easier to report and to fund.",
        "This playbook is the execution plan. Our first playbook covered where AI helps and the principles of good adoption. This one turns those principles into weeks, owners, outputs and decisions, so you can start with confidence and finish the quarter with evidence."])
    b.mark("", "Introduction"); b.intro("Introduction", "Three months, three jobs.", "Each month has one purpose. Get the foundations right, test with real people on real work, then prove the value and scale what works. Rushing a stage almost always costs more time later.",
        [("shield", "Days 1 to 30: Foundations", "Name an owner, agree a policy, choose tools, configure security and recruit champions."),
         ("flask", "Days 31 to 60: Pilot", "Train a pilot group, run focused use cases and measure results against a baseline."),
         ("check", "Days 61 to 90: Prove and scale", "Decide what scales, extend access team by team and build AI into how work is done.")])
    b.statement("Ninety days from now, AI should be part of how work gets done, not a project people talk about.", "Every week in this plan has an owner, an output and a reason. Keep to the rhythm and the results follow.", "Introduction")

    b.mark("01", "Days 1 to 30: Foundations"); b.opener("01", "Days 1<br>to 30.", "Foundations first. Decisions made this month save weeks of rework later.", [("01", "Why the first month matters"), ("02", "Weeks 1 to 4"), ("03", "Security settings to switch on")])
    b.essay("Foundations", "The first month is about decisions, not demos", [
        "It is tempting to start with a showcase: a room full of people watching an assistant write a proposal in seconds. Demos create excitement, but excitement without foundations leads to the same pattern every time. People try the tool, use personal accounts when the approved one is slow to arrive, and the organisation loses track of where its data has gone.",
        "The first thirty days should instead settle five things. Who owns AI adoption. What the rules are. Which tools are approved. How those tools are configured. And who in each team will help colleagues get started. None of these needs to be perfect, but each needs a clear, written answer.",
        "The owner matters most. Pick a senior person with enough authority to make decisions and enough time to follow through. They do not need to be technical. They need to be organised, credible with colleagues and willing to report honestly on what is and is not working.",
        "The policy should be short. Two pages that people actually read are worth more than twenty that nobody opens. Cover which tools are approved, what data can and cannot be used, who checks AI output before it matters, and how to raise a concern.",
        "Tool choice and security settings belong together. Business plans from the major providers offer controls that consumer plans do not: single sign-on, admin consoles, data retention settings and assurances on training use. Turn these on before anyone logs in, not after.",
        "Finally, recruit champions. Look for people who are curious, respected by their peers and good at explaining things. They will carry the pilot next month, so give them early access now and ask them to collect questions from their teams."],
        "Foundations", "Settle the owner, the rules and the settings before you invite anyone in.")
    b.table("Weeks 1 to 4", "The foundations month, week by week", "Each week ends with something written down. If an output is missing, the next week waits.", ["Week", "Focus", "Done when"],
        [("Week 1", "Appoint the AI owner and agree the quarter's goals with the leadership team.", "Owner named, three goals written, budget confirmed."),
         ("Week 2", "Draft the acceptable use policy and choose approved tools.", "Policy drafted, tool shortlist agreed with IT and data protection."),
         ("Week 3", "Configure tools: sign-on, admin roles, data settings, logging.", "Security settings checked and signed off by IT."),
         ("Week 4", "Recruit champions, pick pilot use cases, set baselines.", "Champions named in each pilot team, use cases and measures agreed."),
         ("Throughout", "Brief the leadership team, answer early questions and log decisions.", "A short weekly note from the owner to leaders, with decisions recorded.")], "Days 1 to 30", widths="26mm 1fr 1fr")
    b.dive("01", "shield", "Security settings to switch on first", "Business plans include controls that protect your data. They only work if someone configures them before the pilot begins.",
        [("Identity", "Connect the tool to single sign-on and multi-factor authentication. Remove access automatically when people leave."),
         ("Data", "Confirm business data is not used for model training. Set retention to match your policy."),
         ("Access", "Limit admin rights. Check that connected email and files respect existing permissions."),
         ("Visibility", "Turn on audit logs and usage reports, and decide who reviews them and how often.")], "Days 1 to 30", "Your IT lead, with data protection sign-off")

    b.mark("02", "Days 31 to 60: Pilot"); b.opener("02", "Days 31<br>to 60.", "A focused pilot with real people, real work and a clear way of measuring results.", [("01", "Running the pilot"), ("02", "Pilot use cases"), ("03", "Training plan"), ("04", "Communications plan")])
    b.steps("Weeks 5 to 8", "Run a pilot that produces evidence", "Keep the group small enough to support well and varied enough to learn from.",
        [("Week 5: Launch and train", "Give the pilot group access, run hands-on training and share the policy in person."),
         ("Week 6: Work the use cases", "Each pilot member applies AI to agreed tasks and notes time taken and quality."),
         ("Week 7: Check in and adjust", "Champions run a short session to share what works, fix problems and refine prompts."),
         ("Week 8: Measure and capture", "Compare results with the baseline, collect examples and record risks or near misses."),
         ("Every week: Keep a log", "One shared place for wins, problems, questions and good prompts, owned by the champions.")], "Days 31 to 60",
        "A pilot without a baseline produces opinions. A pilot with one produces evidence.")
    b.usecase("Pilot use cases", "Choosing pilot work you can measure", [
        ("contract", "Client services", "Drafting replies to common requests", [("The task", "Answering routine client questions by email."), ("Baseline", "Average time per reply and how often a reply needs rework."), ("Measure", "Time saved per reply and reviewer quality scores."), ("Done when", "Most drafts need only light edits before sending.")]),
        ("magnifier", "Finance", "Month-end commentary", [("The task", "Writing variance explanations for the management pack."), ("Baseline", "Hours spent drafting commentary each month."), ("Measure", "Hours saved and number of corrections at review."), ("Done when", "Commentary is drafted faster with no loss of accuracy.")]),
        ("owner", "Operations", "Meeting notes and actions", [("The task", "Turning internal meetings into notes and action lists."), ("Baseline", "Time to circulate notes and how often actions are missed."), ("Measure", "Speed of circulation and completeness of actions."), ("Done when", "Notes go out the same day and attendees trust them.")])], "Days 31 to 60")
    b.table("Training plan", "Who learns what, and when", "Training is where most rollouts succeed or fail. Teach the craft, not just the buttons.", ["Audience", "Format", "What they learn"],
        [("Leadership team", "One working session.", "What AI can and cannot do, the policy, and how to read the results."),
         ("AI owner", "Ongoing, with your provider.", "Admin settings, usage reports and how to run the pilot."),
         ("Champions", "Two hands-on sessions.", "Briefing an assistant well, checking output and coaching colleagues."),
         ("Pilot group", "Hands-on workshop plus drop-ins.", "Their own use cases, safe data handling and how to verify answers."),
         ("Team leaders", "Short briefing, then regular check-ins.", "How to spot good use cases, support their people and review AI-assisted work."),
         ("Everyone else", "Short briefing before access.", "The policy, approved tools and where to get help.")], "Days 31 to 60", widths="34mm 34mm 1fr")
    b.compare("Communications plan", "What to say, and when to say it", "People fill silence with worry. A few clear messages at the right moments keep trust high.", ["Moment", "What to say", "Who says it"],
        [("The decision", "Why we are adopting AI, what it is for and what it is not for.", "Chief executive or managing director."),
         ("Policy launch", "The rules in plain English, and why they protect everyone.", "The AI owner, with IT."),
         ("Pilot start", "Who is involved, what they are testing and how to follow along.", "The AI owner and champions."),
         ("Pilot results", "What worked, what did not and what happens next.", "The AI owner, with real examples."),
         ("Wider rollout", "When each team gets access, and what training comes with it.", "Team leaders, supported by champions."),
         ("Day 90 and after", "What changed, what we learned and how AI will be supported from here.", "The executive sponsor.")], "Days 31 to 60")

    b.mark("03", "Days 61 to 90: Prove, scale, embed"); b.opener("03", "Days 61<br>to 90.", "Prove the value, extend what works and make AI part of the routine.", [("01", "Weeks 9 to 13"), ("02", "Deciding what scales"), ("03", "Roles and risks"), ("04", "What to tell the board")])
    b.flow("Weeks 9 to 13", "From pilot results to everyday use", "The final month turns evidence into decisions and decisions into habits.",
        [("check", "Week 9: Review the evidence", "Score each use case against its baseline. Keep, adjust or stop."),
         ("compass", "Week 10: Decide the next wave", "Choose the teams and use cases for wider rollout, with owners and dates."),
         ("owner", "Week 11: Extend access", "Train the next wave, led by champions who were in the pilot."),
         ("loop", "Week 12: Embed in process", "Write AI steps into procedures, templates and onboarding."),
         ("bell", "Week 13: Report and reset", "Present results to the board and agree the next quarter's plan.")], "Days 61 to 90", "Stopping a use case that did not work is a good result. It frees time for the ones that did.")
    b.essay("Prove and scale", "Deciding what earns a place in the routine", [
        "By day sixty you will have a pile of evidence: time logs, quality scores, examples and a few stories. The temptation is to declare success and roll everything out. Resist it. The value of the pilot is that it lets you choose.",
        "Score each use case on three things. Did it save meaningful time or improve quality against the baseline? Did people keep using it once the novelty wore off? And did it stay within the policy without constant supervision? A use case that passes all three is ready to scale. One that passes two may need better prompts or training. One that passes fewer should usually stop.",
        "Scaling works best in waves. Pick the next two or three teams, give each a named lead and a champion from the pilot, and repeat the training that worked. Resist giving everyone access on the same day. Support spreads thin, early problems multiply and the good stories get lost in the noise.",
        "Embedding is the step most rollouts skip. If a task now starts with an AI draft, the procedure should say so, along with who checks the output and what good looks like. Templates, prompt libraries and onboarding materials should be updated to match. That is how AI stops depending on enthusiasts and becomes part of the job.",
        "Finally, keep the owner in place beyond day ninety. The plan ends, but the work does not. Models change, new features arrive and people move roles. A light quarterly rhythm of review, training and reporting keeps the gains from fading.",
        "Be honest about what you learned along the way. Some use cases will have disappointed, some risks will have proved smaller than feared and others larger. Recording those lessons, and sharing them openly, builds the credibility you will need when you ask for the next round of time and budget."],
        "Prove and scale", "Scale what passed the test. Fix what nearly did. Stop the rest.")
    b.table("Roles", "Who does what in the first 90 days", "Small teams can combine roles, but every one of these jobs needs a name against it.", ["Role", "Responsible for", "Time needed"],
        [("Executive sponsor", "Sets direction, removes blockers and champions the plan at the top.", "An hour a week, plus key meetings."),
         ("AI owner", "Runs the plan, reports progress and makes day-to-day decisions.", "A significant part of their week."),
         ("IT lead", "Tool setup, security settings, access and support.", "Heavy in month one, lighter after."),
         ("Data protection lead", "Reviews the policy, data settings and supplier terms.", "Focused effort in month one."),
         ("Champions", "Coach colleagues, run check-ins and keep the shared log.", "A few hours a week during the pilot."),
         ("Team leaders", "Pick use cases, free up time and support their people.", "Regular check-ins with the owner.")], "Days 61 to 90", widths="36mm 1fr 52mm")
    b.matrix("Risks", "The risks worth planning for", "Plot rollout risks by how likely they are and how much damage they would do. Plan hardest for the top right.", "Likelihood", "Impact",
        [("Prevent", "Sensitive data in the wrong tool", "Less common with good settings, but serious. Approved tools, clear rules and logging."), ("Plan hardest", "Adoption fades after launch", "The most common failure. Champions, training and visible results keep use alive."),
         ("Monitor", "A supplier changes terms or features", "Rare in a single quarter. Note it and review at renewal."), ("Manage", "Uneven quality of AI output", "Frequent but contained. Human review and shared prompts raise the floor.")], "Days 61 to 90")
    b.grid("Board reporting", "What to report to the board at day 90", "Boards want a short, honest picture: what changed, what it cost, what is next and what could go wrong.",
        [("check", "Results against goals", "The three goals set in week one, with evidence for each and an honest view of any gaps."),
         ("sliders", "Value and adoption", "Time saved, quality changes and active use, with two or three real examples from staff."),
         ("shield", "Risk and compliance", "Incidents or near misses, how they were handled and any changes to policy or settings."),
         ("compass", "The next quarter", "Which teams and use cases come next, the support needed and the budget required.")], "Days 61 to 90",
        "Keep it to two pages. A board that trusts the report will back the next stage.")
    b.questions("Before day one", "Questions to settle before you start the clock", "Agree these answers as a leadership team, then write them down.",
        [("Ownership and goals", ["Who owns this plan, and do they have the time to run it?", "What three results would make this quarter a success?", "Which teams will pilot, and why them?"]),
         ("Safety and support", ["Which tools are approved, and are their security settings in place?", "Who checks AI output before it reaches a client or a decision?", "Who will people ask when they get stuck?"])], "Days 61 to 90")
    b.checklist("Checklist", "Your 90-day rollout at a glance", "Use this as the agenda for the owner's weekly check-in.",
        [("Owner, sponsor and goals agreed", "By the end of week one."), ("Policy published and tools approved", "Plain language, signed off by data protection."), ("Security settings configured and checked", "Before anyone outside IT logs in."),
         ("Champions recruited and trained", "At least one in each pilot team."), ("Baselines captured for each pilot use case", "Time and quality, before the pilot starts."), ("Pilot reviewed and next wave chosen", "Keep, adjust or stop for every use case."),
         ("Board report delivered and next quarter planned", "With an owner in place beyond day ninety.")], "Days 61 to 90")
    b.glossary("Words worth knowing", [("Executive sponsor", "The senior leader who backs the plan and removes obstacles."), ("AI owner", "The person accountable for running the rollout and reporting results."),
        ("Champion", "A colleague who helps their team adopt AI and shares what works."), ("Pilot", "A time-limited test with a small group, designed to produce evidence."),
        ("Baseline", "How long a task takes, and how good the result is, before AI is introduced."), ("Use case", "A specific task where AI is applied, with a clear owner and measure."),
        ("Acceptable use policy", "The rules for how staff may use AI tools and data."), ("Single sign-on", "Logging in to many tools with one company account, managed centrally."),
        ("Audit log", "A record of who used a tool, when and how, for review and investigation."), ("Data retention", "How long a tool keeps your prompts, files and outputs."),
        ("Wave", "A group of teams given access together during a staged rollout."), ("Human in the loop", "A person reviews AI output before it is used or acted on.")])
    b.art_back("Ready to start<br>the clock?", "We help organisations plan and run their first 90 days of AI: tool selection, secure configuration, champion training and the reporting that keeps boards on side.", "Plan your 90-day rollout", "No. 07 · Ask better")
    return b
