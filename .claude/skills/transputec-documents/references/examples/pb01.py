from aikit import AIBook

def build():
    b = AIBook("The AI-Ready Organisation", num=1, art="silk", pos="78%")
    b.how = "Where Claude and other AI assistants earn their keep, team by team, and how to roll them out so the value is real and lasting."
    b.art_cover("Playbook No. 01 · AI at work", "The AI-ready", "organisation.", "Where Claude and modern AI tools actually earn their keep, team by team, and how to make the value stick.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("Most organisations are not short of AI. They are short of a plan for it.", [
        "AI assistants such as Claude, ChatGPT, Gemini and Microsoft Copilot are now good enough to change how everyday work gets done. Drafting, summarising, analysing, coding and answering questions are no longer experiments. They are capabilities your people can use this afternoon.",
        "Yet in many organisations the picture is uneven. A few enthusiasts get remarkable results, most colleagues try a tool once and drift away, and leaders cannot tell whether any of it is making a difference.",
        "This playbook is the practical middle path. It shows where AI assistants create real value, what good use looks like in each team, and how to roll them out in a way that is safe, measurable and sustainable."])
    b.mark("", "Introduction"); b.intro("Introduction", "The tools are ready. The question is whether you are.", "Modern AI assistants can read, write, reason over documents and work with data. The organisations that benefit most are not the ones with the most licences. They are the ones that are clear about where AI helps, who owns it and how it is used.",
        [("compass", "Start with the work, not the tool", "Find the tasks that are frequent, text-heavy and time-consuming. That is where assistants pay back first."),
         ("owner", "Give it an owner", "Someone needs to own adoption, guidance and results, or AI becomes everyone's side project and nobody's priority."),
         ("shield", "Make safe use the easy use", "Approved tools, clear data rules and a simple policy let people move fast without creating risk.")])
    b.statement("AI does not replace your people. It gives each of them a capable assistant.", "The question for leaders is how to make that assistant useful, safe and part of how work actually gets done.", "Introduction")
    b.mark("01", "What AI assistants are good at"); b.opener("01", "What it is<br>good at.", "A clear-eyed view of where today's assistants are strong, and where they still need a human.", [("01", "Strengths and limits"), ("02", "The four jobs AI does well"), ("03", "Where to be careful")])
    b.essay("Understanding the tools", "A capable colleague with no memory of yesterday", [
        "The easiest way to think about an AI assistant is as a very well-read colleague who works quickly, never tires and has no context about your business unless you give it. It can draft a proposal in seconds, but it does not know your pricing. It can summarise a contract, but it does not know which clauses your legal team worries about.",
        "That framing explains most of what goes right and wrong. When people give an assistant clear instructions, relevant documents and a defined outcome, results are often excellent. When they ask a vague question and accept the first answer, results are generic at best and wrong at worst.",
        "Modern assistants such as Claude can work with long documents, follow detailed instructions, write and review code, analyse spreadsheets and reason through multi-step problems. Many can now connect to the tools your people already use, such as email, documents and ticketing systems, which is where the biggest gains tend to come from.",
        "What they cannot do is guarantee they are right. Assistants can produce confident answers that are wrong, especially on facts, figures and recent events. Good use always keeps a person accountable for the output."],
        "Understanding the tools", "Treat AI output as a strong first draft from a capable colleague, not as a final answer.")
    b.grid("The four jobs", "Four jobs AI assistants do well", "Almost every valuable use case is a version of one of these four.",
        [("contract", "Draft", "First versions of emails, proposals, reports, policies and job descriptions, written to your brief."),
         ("magnifier", "Digest", "Summaries of long documents, meetings, threads and research, with the key points pulled out."),
         ("sliders", "Analyse", "Working through data, comparing options, spotting patterns and explaining the reasoning."),
         ("wrench", "Build", "Writing and reviewing code, formulas, scripts and automations, with a person checking the result.")], "Understanding the tools",
        "If a task involves reading or writing a lot of text, it is a strong candidate for AI assistance.")
    b.table("Strengths and limits", "Where to lean in, where to be careful", "A balanced view helps you set expectations before anyone is disappointed.", ["Area", "Lean in", "Be careful"],
        [("Writing", "Drafting, rewriting for tone, shortening, translating.", "Final wording for legal, financial or sensitive messages."),
         ("Research", "Summarising material you provide, comparing sources.", "Facts and figures it was not given. Always verify."),
         ("Analysis", "Structuring problems, exploring data, explaining trends.", "Calculations that matter. Check them independently."),
         ("Code", "Drafting, reviewing, explaining and testing code.", "Deploying anything to production without review."),
         ("Decisions", "Laying out options, risks and trade-offs.", "Delegating the decision itself. People stay accountable.")], "Understanding the tools")
    b.mark("02", "Use cases by team"); b.opener("02", "Use cases,<br>team by team.", "Where real organisations are getting value today, in every function.", [("01", "Sales and marketing"), ("02", "Operations, finance and HR"), ("03", "IT, service and leadership")])
    b.usecase("Use cases", "Sales and marketing", [
        ("contract", "Sales", "Account research and proposal drafts", [("The task", "Preparing for calls and writing tailored proposals."), ("How AI helps", "Summarises public information about a prospect and drafts proposals from your templates."), ("What good looks like", "Reps spend more time with customers and less time formatting."), ("Watch out", "Check every claim about the prospect. Never paste confidential deal terms into unapproved tools.")]),
        ("sliders", "Marketing", "Content that keeps a consistent voice", [("The task", "Blogs, social posts, emails and campaign variations."), ("How AI helps", "Drafts from a brief and a style guide, then adapts for each channel."), ("What good looks like", "More output, same quality bar, with editors focused on judgement."), ("Watch out", "Fact-check claims and avoid publishing unedited AI text.")])], "Use cases")
    b.usecase("Use cases", "Operations, finance and HR", [
        ("loop", "Operations", "Process documents and standard operating procedures", [("The task", "Writing and updating procedures nobody has time for."), ("How AI helps", "Turns rough notes or a recorded walkthrough into a clear, structured procedure."), ("What good looks like", "Procedures that are current, consistent and easy to follow."), ("Watch out", "The process owner signs off every procedure.")]),
        ("contract", "Finance", "Variance commentary and report narratives", [("The task", "Explaining what changed and why each month."), ("How AI helps", "Drafts commentary from the figures you provide and flags unusual movements."), ("What good looks like", "Faster month-end narratives that finance reviews, not writes from scratch."), ("Watch out", "Numbers come from your systems, never from the model.")]),
        ("owner", "HR", "Job descriptions, policies and onboarding", [("The task", "Drafting role profiles, policy updates and new starter guides."), ("How AI helps", "Produces consistent first drafts in your tone and structure."), ("What good looks like", "Quicker hiring cycles and clearer policies."), ("Watch out", "Keep personal data out of unapproved tools. Check for biased language.")])], "Use cases")
    b.usecase("Use cases", "IT, service and leadership", [
        ("wrench", "IT", "Scripts, troubleshooting and documentation", [("The task", "Writing scripts, diagnosing issues and documenting systems."), ("How AI helps", "Drafts and explains code, suggests fixes and writes runbooks."), ("What good looks like", "Engineers ship faster with better documentation."), ("Watch out", "Review and test before anything touches production.")]),
        ("bell", "Service desk", "Faster, more consistent answers", [("The task", "Answering repeat questions and triaging tickets."), ("How AI helps", "Suggests responses from your knowledge base and summarises long tickets."), ("What good looks like", "Quicker resolution and a knowledge base that keeps improving."), ("Watch out", "Agents check suggestions before sending.")]),
        ("compass", "Leadership", "Briefings and decision support", [("The task", "Digesting board packs, reports and market news."), ("How AI helps", "Summarises papers and lays out options and risks."), ("What good looks like", "Better prepared meetings and clearer decisions."), ("Watch out", "The decision and accountability stay with leaders.")])], "Use cases")
    b.matrix("Prioritise", "Where to start", "Plot candidate use cases by value and ease. Start top right, plan top left, and park the rest.", "Ease to adopt", "Value",
        [("Plan", "High value, harder", "Worth doing, but needs data, integration or process change first."), ("Start here", "High value, easy", "Frequent, text-heavy tasks with clear owners. Your quick wins."),
         ("Avoid", "Low value, hard", "Interesting projects that will not move the needle."), ("Let people explore", "Low value, easy", "Personal productivity. Allow it within the policy, but do not invest heavily.")], "Use cases")
    b.mark("03", "Rolling it out well"); b.opener("03", "Roll it out<br>well.", "Licences are the easy part. Adoption is where value is won or lost.", [("01", "Five principles"), ("02", "The rollout sequence"), ("03", "Measuring what matters")])
    b.principles("Principles", "Five principles for adoption that lasts", "Organisations that get lasting value from AI tend to follow the same rules.",
        [("Pick approved tools, then make them easy to get", "Choose business-grade tools with the right data protections, and remove friction to access them."),
         ("Teach the craft, not just the buttons", "Show people how to brief an assistant, check its work and use it in their own role."),
         ("Start with champions", "Find enthusiasts in every team, give them time, and let them share what works."),
         ("Keep a person accountable", "Every AI-assisted output has a human owner who checks it before it matters."),
         ("Measure and share results", "Track time saved and quality, tell the stories, and expand what works.")], "Rolling it out")
    b.flow("The sequence", "From pilot to everyday use", "A simple rollout sequence that builds evidence before scale.",
        [("compass", "Choose", "Select tools and agree a short acceptable use policy."), ("flask", "Pilot", "Run a focused pilot with champions on a handful of high-value use cases."),
         ("check", "Prove", "Measure results, collect examples and refine the guidance."), ("owner", "Scale", "Expand team by team, with training and a named owner in each."),
         ("loop", "Embed", "Build AI into processes and review usage and value every quarter.")], "Rolling it out", "Each step earns the right to the next. Skip proof, and scale stalls.")
    b.table("Measuring value", "What to measure", "Simple measures, tracked consistently, beat a complex scorecard nobody updates.", ["Measure", "What it tells you", "How to capture it"],
        [("Active use", "Whether people are actually using the tools.", "Usage reports from the platform."), ("Time saved", "Where capacity is being released.", "Short before-and-after estimates from users."),
         ("Quality", "Whether outputs are good enough to use.", "Reviewer sign-off and spot checks."), ("Stories", "What changed for real people.", "A monthly round-up from champions."),
         ("Risk events", "Whether guardrails are working.", "Policy breaches and near misses logged.")], "Rolling it out")
    b.steps("Common pitfalls", "Five ways AI rollouts stall", "Each is avoidable with a little planning.",
        [("Licences without training", "People try once, get a generic answer, and give up."), ("No approved route", "Staff use personal accounts, and data goes where it should not."),
         ("Pilots that never end", "Without success criteria, pilots drift and nothing scales."), ("Nobody owns it", "Adoption becomes everyone's side project."),
         ("Measuring nothing", "Without evidence, budgets get cut at the first review.")], "Rolling it out", "The fix for most of these is the same: a named owner, a short policy and a regular review.")
    b.questions("Before you start", "Questions for your leadership team", "Work through these together before you buy or expand anything.",
        [("Strategy", ["Which three tasks would we most like to take off our people's plates?", "Who will own AI adoption, and how will we know it is working?", "What does good look like in six months?"]),
         ("Safety", ["Which tools are approved, and what data can go into them?", "How will we train people to check AI output?", "How will we handle mistakes when they happen?"])], "Rolling it out")
    b.checklist("Checklist", "Are you AI-ready?", "Tick what is in place today. Anything left blank is your next step.",
        [("Approved AI tools are available to staff", "With business-grade data protections."), ("A short acceptable use policy is published", "Plain language, one or two pages."), ("A named owner for AI adoption", "With time and budget to do the job."),
         ("Champions in each team", "Sharing prompts, examples and results."), ("Training on briefing and checking AI work", "Not just how to log in."), ("Priority use cases chosen", "With success measures agreed."),
         ("A regular review of value and risk", "Quarterly is enough to start.")], "Rolling it out")
    b.glossary("Words worth knowing", [("AI assistant", "A tool such as Claude, ChatGPT, Gemini or Copilot that responds to instructions in plain language."), ("Large language model", "The type of AI model behind most assistants, trained on large amounts of text."),
        ("Prompt", "The instructions and context you give an assistant."), ("Context", "The documents, data and background an assistant can see when it answers."),
        ("Hallucination", "A confident answer that is wrong or made up."), ("Connector", "An integration that lets an assistant read or act in another tool, such as email or documents."),
        ("Agent", "An AI system that can take a series of actions towards a goal, not just answer."), ("Acceptable use policy", "The rules for how staff may use AI tools and data."),
        ("Champion", "A colleague who helps their team adopt AI well."), ("Human in the loop", "A person reviews AI output before it is used or acted on.")])
    b.art_back("Ready to make AI<br>work for you?", "We help organisations choose the right AI tools, set them up securely and build the habits that turn licences into results.", "Book an AI readiness session", "No. 02 · Adopt AI without the regret")
    return b
