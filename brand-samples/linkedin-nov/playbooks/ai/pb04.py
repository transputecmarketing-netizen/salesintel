from aikit import AIBook

def build():
    b = AIBook("Open vs Frontier", num=4, art="orbit", pos="74%")
    b.how = "How open-weight models really compare with frontier models such as Claude, GPT and Gemini, how to choose by use case, how to combine both, and how to test the choice on your own work."
    b.art_cover("Playbook No. 04 · Choosing models", "Open vs frontier.", "The honest comparison.", "Capability, cost, control and risk, weighed fairly, so you can pick the right model for each job rather than one model for everything.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The right answer is rarely one model for everything.", [
        "The debate about open and frontier AI is often framed as a contest with a winner. Advocates of open models point to control, privacy and cost. Advocates of frontier models point to capability, safety work and ease of use. Both are partly right, and both tend to leave out the inconvenient parts.",
        "For a business, the useful question is narrower and more practical. For this job, with this data, at this volume, which kind of model gives the result we need at a cost and risk we can accept? Asked that way, many organisations find the answer is a mix: frontier models where quality matters most, smaller open models where the work is simple and plentiful.",
        "This playbook gives you a fair comparison, a decision framework by use case and a way to test the choice on your own work. It complements playbook No. 03, which covers how to run open models once you have decided they fit. The models themselves change every few months, so the method matters more than any snapshot."])
    b.mark("", "Introduction"); b.intro("Introduction", "Compare on your work, not on the headlines.", "Public leaderboards and launch announcements tell you how models perform on someone else's tests. What matters is how they perform on your tasks, with your data, at your volumes and under your constraints. That is a question you can answer, cheaply, with a small test set and an afternoon of reviewing.",
        [("compass", "Start from the job", "Hard reasoning, high-volume routine work and sensitive data each point towards different answers."),
         ("sliders", "Weigh all the factors", "Capability, cost, privacy, control, latency, support and lock-in all matter. Rarely do all point the same way."),
         ("flask", "Prove it with your own tests", "A test set built from your real work turns opinions into evidence, and lets you revisit the choice as models improve.")])
    b.statement("Use the most capable model where it matters, and the cheapest one that is good enough everywhere else.", "Matching the model to the job, rather than picking a side, is how leading teams get quality and control without overspending.", "Introduction")

    b.mark("01", "The real differences"); b.opener("01", "The real<br>differences.", "What separates open and frontier models today, and which differences are likely to last.", [("01", "The capability gap"), ("02", "Factor by factor"), ("03", "Four myths to drop")])
    b.essay("Capability", "The gap is real, it moves, and it depends on the task", [
        "Frontier models are the most capable models offered by the leading AI developers, such as Anthropic's Claude, OpenAI's GPT models and Google's Gemini. They are usually available only as hosted services. Open-weight models are published for anyone to download and run, from developers including Meta, Mistral, Alibaba, DeepSeek and Google.",
        "On the hardest work, frontier models have generally led. Long chains of reasoning, complex coding, careful analysis of long documents, subtle writing and multi-step agent tasks are where the difference tends to show. Frontier developers also add capabilities such as tool use, long context and multimodal input early, and refine them quickly.",
        "The gap has not stood still. Strong open models have repeatedly arrived within months of capabilities first seen at the frontier, and for many everyday tasks the difference is small or invisible. Summarising a document, classifying a ticket, extracting fields from an invoice or drafting a routine reply rarely needs the most capable model available.",
        "This is why general rankings are a poor guide. A model that leads a public benchmark may not lead on your contracts, your customer emails or your codebase. Benchmarks can also be gamed or leaked into training data, and they measure what is easy to measure rather than what you care about.",
        "Size matters too. The largest open models can be close to frontier quality but need serious hardware to run. Smaller open models are cheap and fast but noticeably weaker on hard tasks. Comparing a small open model with a frontier model, or a giant open model with a fast frontier model, can make either side look better than it is.",
        "The practical conclusion is to stop asking which is better in general. Ask which is good enough for this specific job, test it, and expect the answer to change as both sides release new models."],
        "The real differences", "The question is not which model is best. It is which model is good enough for this job.")
    b.compare("Factor by factor", "How the two compare, honestly", "Generalisations, with exceptions on both sides. The specific models and providers you consider will vary.", ["Factor", "Frontier models", "Open-weight models"],
        [("Capability", "Usually strongest on hard reasoning, coding and agent tasks.", "Often close on everyday tasks. Largest models need heavy hardware."),
         ("Cost", "Pay per use. Simple to start, can grow with volume.", "Low or no licence cost, but you pay for compute, people and operations."),
         ("Privacy and control", "Data goes to the provider under contract. Business terms vary.", "Can run entirely in your environment, if you host it yourself."),
         ("Customisation", "Prompting, retrieval and, for some models, managed fine-tuning.", "Full control, including fine-tuning and changing how it is served."),
         ("Latency", "Depends on the provider's service and your network route.", "Small models can be very fast on local hardware."),
         ("Support", "A provider and contract stand behind the service.", "Community support, unless you buy it from a host or partner.")], "The real differences")
    b.table("Beyond the obvious", "Five factors that are easy to overlook", "These rarely feature in launch announcements, but they often decide whether a choice still looks good a year later.", ["Factor", "Frontier models", "Open-weight models", "What it means for you"],
        [("Reliability", "Provider handles uptime, with occasional outages and rate limits.", "Uptime is as good as your own hosting.", "Plan for failover either way."),
         ("Safety features", "Extensive safety training and filtering, maintained by the provider.", "Varies widely. Safeguards may be lighter or removable.", "Add your own filtering and testing for open models."),
         ("Model changes", "Providers update and retire models on their timetable.", "A version you host stays fixed until you change it.", "Frontier needs retesting. Open needs upgrading."),
         ("Vendor lock-in", "Prompts and features can tie you to one provider.", "Freedom to switch hosts, but tied to your own stack.", "Keep prompts and tests portable."),
         ("Compliance", "Provider certifications and data terms to review.", "You own the controls, records and assurance.", "Either way, your DPIA and register.")], "The real differences", "28mm 1fr 1fr 1fr")
    b.grid("Myths", "Four myths worth dropping", "Each contains a grain of truth, which is why they persist. Each leads to poor decisions if taken at face value.",
        [("tag", "Open models are free", "The weights may be free. Compute, engineering, monitoring and testing are not, and often cost more than expected."),
         ("shield", "Frontier means your data is exposed", "Business terms typically limit how providers use your data. Read them, but do not assume the worst."),
         ("server", "Self-hosting is automatically private", "Only if the environment is secured, access is controlled and logs are managed. Privacy is a property of the set-up."),
         ("compass", "One model should do everything", "Different jobs have different needs. A mix, matched to each job, usually beats a single choice.")], "The real differences",
        "Both open and frontier models are improving quickly. Any comparison, including this one, has a short shelf life.")

    b.mark("02", "Choosing by use case"); b.opener("02", "Choose by<br>the job.", "A simple framework for matching models to work, and how it plays out in practice.", [("01", "Difficulty and volume"), ("02", "A decision framework by use case"), ("03", "Privacy, compliance and examples")])
    b.matrix("Difficulty and volume", "Two questions that point to an answer", "Plot each use case by how hard the task is and how many times a day it runs. The quadrant suggests where to start testing.", "Volume of requests", "Difficulty of the task",
        [("Frontier model", "Hard, low volume", "Complex analysis, drafting and coding. Quality matters most and cost per task is small in total."), ("Route by difficulty", "Hard, high volume", "Send hard cases to a frontier model and simple ones to a smaller, cheaper model."),
         ("Whatever is simplest", "Easy, low volume", "Use your existing approved assistant. Optimising here is rarely worth the effort."), ("Smaller or open model", "Easy, high volume", "Classification, extraction and routine replies. Cost and speed dominate, so test cheaper models.")], "Choosing by use case")
    b.table("Decision framework", "Starting points by use case", "Defaults to test, not rules to follow. Your own test set has the final say.", ["Use case", "Likely starting point", "Why", "Test for"],
        [("Strategy, analysis, complex drafting", "Frontier.", "Quality of reasoning and writing matters most.", "Accuracy and judgement on real examples."),
         ("Software development", "Frontier, sometimes alongside small local models.", "Hard coding tasks benefit from the strongest models.", "Results on your own codebase."),
         ("Customer-facing chat", "Frontier or a strong open model, with retrieval.", "Tone, accuracy and safety in front of customers.", "Wrong answers, refusals and tone."),
         ("Classification and extraction", "Smaller or open model.", "Simple, repetitive and high volume.", "Accuracy against labelled examples."),
         ("Highly sensitive data", "Self-hosted open model, or frontier under strict terms.", "Control over where data is processed.", "Quality versus the frontier on safe samples."),
         ("Offline or on-site", "Small open model.", "No reliable connection to a hosted service.", "Speed and accuracy on local hardware.")], "Choosing by use case", "34mm 1fr 1fr 1fr")
    b.usecase("In practice", "Three organisations, three sensible mixes", [
        ("contract", "Law firm", "Contract review and research", [("The work", "Reviewing contracts and summarising case material for lawyers."), ("Their choice", "A frontier model under enterprise terms, with a regional data commitment."), ("Why", "Reasoning quality on long, subtle documents mattered more than cost."), ("Watch out", "Confirm data terms in the contract, and keep lawyers checking every output.")]),
        ("bell", "Insurer", "Claims triage at volume", [("The work", "Sorting incoming claims and extracting key details from forms and letters."), ("Their choice", "A small open model for extraction, with complex claims sent to a frontier model."), ("Why", "Most claims are routine. Hard cases are few but need better judgement."), ("Watch out", "Monitor routing so complex claims are not handled by the cheaper model.")]),
        ("laptop", "Software company", "AI features in their product", [("The work", "Summaries and suggestions inside a product used by thousands of customers."), ("Their choice", "Frontier for premium features, an open model for high-volume basics."), ("Why", "Balances quality where customers notice it with cost at scale."), ("Watch out", "Keep prompts and tests portable so either model can be swapped.")])], "Choosing by use case")
    b.dive("01", "shield", "Privacy and compliance, without the myths", "Data protection does not automatically favour either side. It depends on the terms, the set-up and the controls around the model.",
        [("Frontier under business terms", "Check whether data is used for training, how long it is kept, where it is processed and which sub-processors are involved."),
         ("Open in your environment", "Data can stay with you, but you are responsible for security, access, logging and retention, and for proving it."),
         ("Open through a host", "A managed endpoint is still a third party. The same supplier checks apply as for a frontier provider."),
         ("Either way", "Personal data needs a lawful basis, a DPIA where risk is high and an entry in your AI register.")], "Choosing by use case", "Your data protection lead, with IT and the business owner")

    b.mark("03", "Hybrid strategies and testing"); b.opener("03", "Mix, route<br>and test.", "How to combine open and frontier models, and how to prove each choice on your own work.", [("01", "Hybrid and routing"), ("02", "Building your own test set"), ("03", "Rules for honest evaluation")])
    b.essay("Hybrid strategies", "Use both, and let the task decide", [
        "Many organisations that use AI seriously end up with more than one model. The reason is simple economics. A frontier model may be the best choice for a complex analysis, but using it to sort thousands of routine emails is like sending every parcel by courier when most could go second class.",
        "The simplest hybrid is a division of labour by use case. Staff use a frontier assistant for drafting, analysis and coding, while a smaller model, open or hosted, handles a specific high-volume process such as tagging documents or extracting data from forms. Each choice is made once and reviewed periodically.",
        "A more advanced approach is routing. A lightweight step looks at each request and decides where it should go: simple requests to a fast, cheap model, harder ones to a frontier model. Some teams use a cascade instead, trying the cheaper model first and escalating when its answer looks uncertain or fails a check.",
        "Routing brings real savings at volume, but it adds moving parts. Someone has to decide the rules, monitor how many requests go each way and check that hard cases are not slipping through to the weaker model. Without that monitoring, quality can quietly fall while costs look healthy.",
        "Hybrid set-ups also reduce lock-in. If your applications call models through a common layer, with prompts and tests stored separately from any one provider, switching or adding a model becomes a configuration change rather than a rebuild. Several cloud platforms and open-source tools offer this kind of layer, so you rarely need to build it yourself.",
        "Keep it as simple as the job allows. One approved frontier assistant plus one well-chosen model for a high-volume task is a sensible hybrid. Sophisticated routing earns its place only when volumes are large enough for the savings to outweigh the extra work."],
        "Hybrid and testing", "Send each request to the cheapest model that can do it well. Check that the routing keeps getting it right.")
    b.flow("Routing in practice", "How a routed set-up handles a request", "A simple pattern for high-volume work. Start with clear rules and refine them using what the monitoring tells you.",
        [("transfer", "Receive", "A request arrives from a user, a form or another system, with its context."),
         ("sliders", "Classify", "Simple rules or a small model judge how hard and how sensitive the request is."),
         ("server", "Route", "Routine requests go to the smaller model. Hard or high-stakes ones go to the frontier model."),
         ("check", "Check", "Outputs are validated. Uncertain or failed answers escalate to the stronger model or a person."),
         ("loop", "Learn", "Track routing, quality and cost per request, and adjust the rules regularly.")], "Hybrid and testing", "Sensitive data needs its own rule: decide in advance which models are allowed to see it, whatever the difficulty.")
    b.steps("Your own test set", "Build a test set in six steps", "The most valuable asset in model choice is a set of real tasks with known good answers. It outlasts any model you choose.",
        [("Collect real examples", "Gather typical and tricky cases from the actual work, with sensitive data removed or approved."),
         ("Write down what good looks like", "Record the correct answer, or the criteria a good answer must meet, for each example."),
         ("Include the awkward cases", "Ambiguous requests, edge cases and things the model should refuse or escalate."),
         ("Run every candidate the same way", "Same prompts, same examples, same settings, with cost and speed recorded."),
         ("Score blind where you can", "Reviewers judge outputs without knowing which model produced them."),
         ("Rerun when anything changes", "New models, new versions, new prompts or a provider update.")], "Hybrid and testing",
        "Start small. A few dozen well-chosen examples tell you far more than any public leaderboard.")
    b.principles("Principles", "Five rules for an honest comparison", "Most unfair comparisons are accidental. These rules keep yours fair, whichever way the answer falls.",
        [("Compare like with like", "Similar effort on prompts and set-up for every model, not a polished favourite against a rushed rival."),
         ("Count the full cost", "Include compute, people, operations and testing, not just licence or per-use prices."),
         ("Measure what matters to you", "Accuracy on your tasks, error types, speed and safety, not general rankings."),
         ("Look at the failures", "Read the wrong answers. How a model fails often matters more than how often."),
         ("Expect to revisit", "Both sides improve fast. Rerun your tests regularly and change course when the evidence does.")], "Hybrid and testing")
    b.questions("Ask your team", "Questions before you choose", "Use these to test any recommendation, whether it favours open, frontier or a mix.",
        [("The job and the evidence", ["Which tasks need the strongest model, and which only need a good enough one?", "What test set did we use, and did it include our awkward cases?", "What did each option cost in total, at realistic volumes?"]),
         ("Control and change", ["Which data can each model see, and under what terms?", "How easily could we switch models if prices, terms or quality changed?", "Who reruns the tests when a provider updates or retires a model?"])], "Hybrid and testing")
    b.checklist("Checklist", "Are you choosing models well?", "Tick what is in place. Gaps are worth closing before your next model decision or renewal.",
        [("Use cases sorted by difficulty, volume and sensitivity", "Each with a named owner."), ("A test set built from your own work", "With known good answers and awkward cases."), ("Full-cost comparisons", "Compute, people, operations and testing included."),
         ("Data rules per model", "Which models may see which data, in writing."), ("Prompts and tests kept portable", "Not tied to one provider's tools."), ("Routing monitored, where used", "Quality and cost per request tracked."),
         ("A regular review of model choices", "Rerun tests as models change.")], "Hybrid and testing")
    b.glossary("Words worth knowing", [("Frontier model", "One of the most capable models from leading developers, usually offered as a hosted service."), ("Open-weight model", "A model whose weights are published, so it can be downloaded and run by others."),
        ("Benchmark", "A standard public test used to compare models. Useful, but not a substitute for your own tests."), ("Test set", "Your own collection of real tasks with known good answers, used to compare models."),
        ("Routing", "Sending each request to a different model depending on its difficulty or sensitivity."), ("Cascade", "Trying a cheaper model first and escalating to a stronger one when needed."),
        ("Latency", "How long a model takes to respond."), ("Rate limit", "A cap a provider sets on how many requests you can make in a period."),
        ("Lock-in", "Dependence on one provider that makes switching costly or slow."), ("Context window", "How much text a model can consider at once."),
        ("Model retirement", "When a provider withdraws an older model, requiring you to move to a newer one."), ("Guardrails", "Filters and checks that limit what a model accepts or produces.")])
    b.art_back("Pick the right model<br>for every job.", "We help organisations compare open and frontier models on their own work, design sensible hybrid set-ups and keep the choice under review as the market moves.", "Book a model selection review", "No. 05 · The Valley effect")
    return b
