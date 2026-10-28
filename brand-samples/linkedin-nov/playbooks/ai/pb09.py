from aikit import AIBook

def build():
    b = AIBook("Which AI, for Which Job?", num=9, art="fluted", pos="72%")
    b.how = "How to make sense of the AI market, match tools to the work your people actually do, and choose vendors you will still be happy with in two years."
    b.art_cover("Playbook No. 09 · Choosing tools", "Which AI,", "for which job?", "A practical way to cut through the choice, test tools on your own work and pick the few that genuinely fit.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The hard part is no longer finding an AI tool. It is choosing well.", [
        "Every software product now claims AI features, and new tools appear every week. General assistants, assistants built into office suites, specialist tools for every function, platforms for building your own. The choice is wide and the sales pitches sound alike.",
        "Choosing badly is expensive in quiet ways. Overlapping licences, data spread across tools nobody approved, staff confused about which tool to use for what, and contracts that renew before anyone has checked whether they are delivering.",
        "This playbook gives you a simple, repeatable way to decide. Start from the job, test tools on your own work, check the terms that protect your data and keep the estate small enough to manage. The specific products will keep changing. The method will not."])
    b.mark("", "Introduction"); b.intro("Introduction", "Choose by the job, not by the headline.", "No single AI tool is best at everything, and the best-known name is not always the best fit. The organisations that choose well start with the work, test candidates on real tasks and weigh data protection and admin controls as heavily as clever features.",
        [("compass", "Know the categories", "General assistants, suite assistants, specialist tools, building platforms and open models each solve different problems."),
         ("flask", "Test on your own work", "Demos show the best case. A short, fair trial on your real tasks shows what you will actually get."),
         ("contract", "Read the terms, not just the brochure", "How your data is used, stored and protected matters as much as how good the answers are.")])
    b.statement("The best AI tool is the one your people will use well, on work that matters, under terms you can live with.", "Features change every few months. Fit, controls and contracts decide whether a tool is still worth paying for next year.", "Introduction")

    b.mark("01", "Making sense of the market"); b.opener("01", "Know your<br>options.", "Five categories of AI tool, what each is for, and how they fit together.", [("01", "The five categories"), ("02", "General or embedded?"), ("03", "Matching tools to jobs")])
    b.essay("The market", "Five kinds of AI tool, and why the distinction matters", [
        "The AI market looks crowded, but most products fall into one of five categories. Knowing which category you are buying from tells you a lot about what to expect, and what to ask.",
        "<b>General assistants</b> such as Claude, ChatGPT and Gemini are broad, capable tools for writing, analysis, research and coding. Business editions add admin controls, data protections and connections to everyday tools. They suit a wide range of roles and are often the best first purchase.",
        "<b>Suite assistants</b> such as Microsoft 365 Copilot and Gemini for Google Workspace live inside the email, documents and meetings your people already use. Their strength is context: they can work with your files and messages under your existing permissions. That makes good permissions hygiene essential before you switch them on.",
        "<b>Specialist tools</b> focus on one job, such as coding, meeting notes, writing, service desk or recruitment. They can be excellent at that job and fit neatly into a team's workflow, but each one adds a contract, a data flow and something else to manage.",
        "<b>APIs and platforms</b> let you build AI into your own products and processes, from a customer-facing assistant to an internal agent. <b>Open models</b>, whose weights are published for anyone to run, give you more control over where data goes, at the cost of more engineering and operational responsibility.",
        "The lines between categories are blurring. General assistants are adding connectors to email and documents, suites are adding agent features, and many specialist tools run on models from the same few providers. Focus on the job and the controls rather than the label: what will this tool do for us, with which data, under which terms, and who will manage it?",
        "Most organisations end up with a small mix: one general assistant, perhaps a suite assistant, a handful of specialist tools where they clearly earn their place, and a platform for anything you build. The skill is keeping that mix deliberate, and your options open."],
        "The market", "Start with one well-governed general assistant. Add specialists only where they clearly beat it on a specific job.")
    b.table("The five categories", "What each category is best for", "Product names and features change quickly. The categories, and the questions to ask of each, are more durable.", ["Category", "Examples", "Best for", "Watch out for"],
        [("General assistants", "Claude, ChatGPT, Gemini.", "Writing, analysis, research and coding across many roles.", "Use of personal accounts outside your controls."),
         ("Suite assistants", "Microsoft 365 Copilot, Gemini for Google Workspace.", "Working with your own email, files and meetings.", "Over-shared files becoming easy to find."),
         ("Specialist tools", "Coding, meetings, writing, service desk tools.", "Deep fit with one team's workflow.", "Sprawl, overlap and many separate data flows."),
         ("APIs and platforms", "Model APIs from major AI providers and cloud platforms.", "Building AI into your own products and processes.", "Usage-based costs and engineering effort."),
         ("Open models", "Openly published models you can host yourself.", "Strict data control or specialised needs.", "You own security, updates and performance.")], "The market", widths="32mm 1fr 1fr 1fr")
    b.compare("General or embedded?", "Stand-alone assistant or suite assistant?", "Many organisations end up with both. The question is which comes first, and for whom.", ["Factor", "General assistant", "Suite assistant"],
        [("Strength", "Breadth and depth of reasoning, writing and analysis.", "Works inside the apps and files people already use."),
         ("Context", "What you give it, plus any connectors you enable.", "Your email, documents and meetings, under your permissions."),
         ("Best users", "People who write, analyse, research or code a lot.", "People whose work lives in email, meetings and documents."),
         ("Preparation", "A clear policy and approved connectors.", "Tidying file permissions so it only finds what it should."),
         ("Risk to manage", "People pasting data into unapproved tools.", "Over-shared content surfacing to the wrong people.")], "The market")
    b.matrix("Matching tools to jobs", "Which category fits which job?", "Plot each job by how varied it is and how tightly it is tied to one system or workflow. The answer points to a category.", "Tied to one workflow or system", "Variety of the work",
        [("General assistant", "Varied work, loosely tied", "Drafting, analysis, research and problem solving across many topics and roles."), ("Suite assistant or build", "Varied work, tightly tied", "Work rooted in your own documents, email and systems, or in a process you build for."),
         ("Leave it manual for now", "Narrow, occasional work", "Rare or small tasks where any tool adds more overhead than it saves."), ("Specialist tool", "Narrow, repeatable work", "One well-defined job done often, such as meeting notes or service desk replies.")], "The market")

    b.mark("02", "Evaluating tools fairly"); b.opener("02", "Test it on<br>your work.", "The criteria that matter, how to run a fair trial and what to check before data goes anywhere.", [("01", "Jobs and tool choices"), ("02", "Eight evaluation criteria"), ("03", "Data protection terms")])
    b.usecase("Matching in practice", "Three common jobs, three different answers", [
        ("contract", "Across the business", "Drafting, summarising and analysis", [("The job", "Everyday writing, research and analysis in most roles."), ("Likely fit", "A business edition of a general assistant, with approved connectors."), ("What to test", "Quality on your real documents, ease of use and admin controls."), ("Watch out", "Make the approved tool easy to get, or personal accounts fill the gap.")]),
        ("bell", "Meetings", "Notes, actions and follow-ups", [("The job", "Capturing decisions and actions from internal and client meetings."), ("Likely fit", "Your suite assistant's meeting features, or a specialist note-taker."), ("What to test", "Accuracy, speaker handling and where recordings and transcripts are stored."), ("Watch out", "Consent and notice when recording. Check retention settings.")]),
        ("wrench", "Service desk", "Faster, consistent answers", [("The job", "Suggesting replies and summarising tickets for support agents."), ("Likely fit", "AI features in your service desk platform, or a build on an AI platform."), ("What to test", "Answers grounded in your knowledge base, and how it handles gaps."), ("Watch out", "Keep agents reviewing replies until accuracy is proven.")])], "Evaluating tools")
    b.usecase("Matching in practice", "When to look beyond the obvious", [
        ("laptop", "Software teams", "Coding help", [("The job", "Writing, reviewing, testing and explaining code."), ("Likely fit", "A dedicated coding tool or the coding features of a general assistant."), ("What to test", "Results on your own codebase and how it works with your repositories."), ("Watch out", "Code and secrets leaving approved environments. Keep normal review.")]),
        ("server", "Product and operations", "AI inside your own process", [("The job", "An assistant in your product or an agent in a core workflow."), ("Likely fit", "An AI platform or model API, built by your team or a partner."), ("What to test", "Quality, latency and cost per task at realistic volumes."), ("Watch out", "Usage costs grow with volume. Monitor and cap them.")]),
        ("shield", "Sensitive data", "Highly confidential or regulated work", [("The job", "Analysis of data that must stay under tight control."), ("Likely fit", "Enterprise terms with regional hosting, or a self-hosted open model."), ("What to test", "Where data is processed and stored, and who can access it."), ("Watch out", "Self-hosting moves security and maintenance onto you.")])], "Evaluating tools")
    b.table("Evaluation criteria", "Eight things to check before you buy", "Weigh these together. A brilliant tool with weak data terms is not a good choice for business use.", ["Criterion", "What to ask", "What good looks like"],
        [("Quality on your tasks", "How well does it do our real work?", "Clear wins on our own test tasks, not just the demo."),
         ("Data and training use", "Is our data used to train models? Who can see it?", "Business data not used for training by default, in writing."),
         ("Admin and SSO", "Can we manage users, settings and sign-in centrally?", "Single sign-on, user provisioning and role-based settings."),
         ("Retention and audit", "How long is data kept? Can we see usage?", "Configurable retention, audit logs and data export."),
         ("Integrations", "Does it connect to the systems we use?", "Supported, admin-controlled connectors to core tools."),
         ("Cost and support", "How is it priced, and who helps when it breaks?", "Predictable pricing, usage controls and a clear support route.")], "Evaluating tools")
    b.dive("01", "contract", "Data protection and training terms", "The terms behind the tool decide where your data goes. They differ between consumer and business editions, and they change, so always check the current version.",
        [("Training use", "Confirm in the contract whether your prompts, files and outputs can be used to train or improve models, and what the default is."),
         ("Location and processors", "Know where data is processed and stored, which sub-processors are involved, and how international transfers are covered."),
         ("Retention and deletion", "Check how long prompts, outputs and files are kept, whether you can shorten it and how deletion is confirmed."),
         ("Certifications and DPIA", "Ask for independent security certifications and the information you need for your own data protection impact assessment.")], "Evaluating tools", "Your data protection lead, with IT and procurement")

    b.mark("03", "Choosing and contracting well"); b.opener("03", "Choose,<br>then commit.", "A fair trial, a simple scoring template, sensible contracts and a tool estate you can actually manage.", [("01", "Running a fair trial"), ("02", "Scoring and contract questions"), ("03", "Avoiding tool sprawl")])
    b.steps("A fair trial", "Six steps to a trial you can trust", "A short, structured trial on your own work beats any number of demos and comparison articles.",
        [("Pick the jobs", "Choose three to five real tasks the tool must handle, each with an owner."),
         ("Build a test set", "Gather realistic documents, tickets or code, with sensitive data removed or approved."),
         ("Agree how to score", "Define good before anyone sees results, so the loudest voice does not win."),
         ("Test side by side", "Run the same tasks through each tool, with the same people and instructions."),
         ("Check the fine print in parallel", "IT, security and procurement review terms, controls and pricing while users test."),
         ("Decide and record why", "Score, choose and record the reasons, so the decision can be revisited later.")], "Choosing well",
        "Include sceptics as well as enthusiasts. Together they predict real adoption.")
    b.table("Scoring template", "A simple scoring sheet", "Score each shortlisted tool from one to five on each line, and agree the weighting before you start. Copy this structure into a spreadsheet.", ["Criterion", "Weighting", "How to score it"],
        [("Quality on test tasks", "Usually the highest weighting.", "Average reviewer score across your test set."),
         ("Data protection terms", "A pass or fail gate, then scored.", "Data protection lead's assessment of the terms."),
         ("Admin, SSO and audit", "High for wide rollouts.", "IT check against your control requirements."),
         ("Integrations", "Depends on the job.", "Do the connectors you need exist and work?"),
         ("Usability", "High for broad adoption.", "Trial users' rating and observed uptake."),
         ("Total cost and support", "Medium to high.", "Licences, usage, set-up and support, over the contract term.")], "Choosing well")
    b.essay("Tool sprawl", "Fewer tools, used well, beat many tools used a little", [
        "Tool sprawl creeps in quietly. A team buys a meeting note-taker on a credit card, another signs up for a writing tool, a third starts using a free coding assistant. Each choice makes sense locally. Together they create overlapping costs, scattered data and no clear answer to the question of which tool to use for what.",
        "The fix is not to ban everything. It is to make the approved route the easy route. Publish a short list of approved tools, say what each one is for and make access quick. When people can get a good tool in a day, far fewer go looking elsewhere.",
        "Give every new request a light but real review. Can an existing tool already do this job well enough? If not, does the new tool pass the data protection gate? Who owns it, and when will it be reviewed? A simple form and a regular decision meeting are usually enough. Keep a register of every approved tool, its owner, the data it may hold and its renewal date.",
        "Watch for AI features arriving inside software you already own. Vendors regularly add AI capabilities to existing products, sometimes switched on by default, sometimes at extra cost. Each deserves the same quick check as a new tool: what data does it use, where is it processed, and is it worth paying for when you already have an approved assistant?",
        "Contracts deserve the same discipline. AI products change fast, so prefer terms that let you adjust as you learn: shorter initial commitments, the ability to change licence numbers, clear usage caps for anything billed by consumption, and exit terms that let you take your data with you.",
        "Finally, review the estate regularly. Look at usage, cost and value for every tool. Retire what nobody uses, consolidate where two tools do the same job and renegotiate where usage has grown. A small, well-used estate is cheaper, safer and easier to support. Share what you decide and why, so teams understand the choices."],
        "Choosing well", "Make the approved route the easy route. It is the most effective control you have.")
    b.questions("Contract questions", "Questions to put to every AI vendor", "Ask in writing, and check the answers against the contract, not just the sales deck.",
        [("Data and security", ["Is our data used to train or improve your models, and can we opt out in the contract?", "Where is our data processed and stored, and by which sub-processors?", "How long is data retained, and how do we delete it?"]),
         ("Commercials and change", ["How is pricing calculated, and how do we cap usage-based costs?", "What happens to our terms when you change models or features?", "How do we leave, and how do we take our data with us?"])], "Choosing well")
    b.checklist("Checklist", "Are you choosing AI tools well?", "Tick what is in place. Anything left blank is worth fixing before your next purchase or renewal.",
        [("A short list of approved AI tools, with what each is for", "Published and easy to find."), ("A data protection gate for every new tool", "Training use, location, retention and certifications checked."), ("Trials run on your own test tasks", "Scored against criteria agreed in advance."),
         ("Single sign-on and admin controls in place", "For every tool used with business data."), ("A named owner for each tool", "Responsible for adoption, value and renewal."), ("Usage-based costs monitored and capped", "With alerts before budgets are reached."),
         ("A regular review of the tool estate", "Retire, consolidate or renegotiate.")], "Choosing well")
    b.glossary("Words worth knowing", [("General assistant", "A broad AI tool such as Claude, ChatGPT or Gemini, used for many kinds of task."), ("Suite assistant", "An AI assistant built into an office suite, working with your email, files and meetings."),
        ("Specialist tool", "An AI product focused on one job, such as coding, meeting notes or service desk."), ("API", "A way for software to call an AI model directly, usually billed by usage."),
        ("Open model", "A model whose weights are published, so you can run it on infrastructure you control."), ("Token", "A small unit of text that AI providers often use to measure and price usage."),
        ("SSO", "Single sign-on: staff use their work identity to log in, under central control."), ("Retention", "How long a provider keeps your prompts, files and outputs."),
        ("Sub-processor", "A third party a vendor uses to process your data on its behalf."), ("DPIA", "Data protection impact assessment, used to assess risks from processing personal data."),
        ("Tool sprawl", "Many overlapping tools adopted piecemeal, with scattered costs and data.")])
    b.art_back("Need help choosing<br>the right AI?", "We help organisations shortlist, trial and secure the AI tools that fit their work, and keep the estate lean as the market moves.", "Book an AI tool review", "No. 10 · The AI business case")
    return b
