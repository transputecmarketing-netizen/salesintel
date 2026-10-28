from aikit import AIBook

def build():
    b = AIBook("Agents at Work", num=8, art="petals", pos="82%")
    b.how = "What AI agents are, where they already do useful work, and the permissions, approvals and checks that let them act on your behalf without nasty surprises."
    b.art_cover("Playbook No. 08 · AI agents", "Agents at work.", "Letting AI act, safely.", "AI that does not just answer but gets things done. Where agents earn their place today, and the guardrails that keep them on track.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The step from answering to acting is the biggest change in AI since the chatbot.", [
        "For most organisations, AI so far has meant an assistant that answers questions and drafts text. A person reads the output and decides what to do with it. Agents change that. They can look things up, update records, raise tickets, write and run code and work through a task from start to finish.",
        "That is a real opportunity. Much of the work that slows teams down is not hard thinking but the steps around it: gathering information, copying it between systems, chasing updates. Agents are well suited to exactly that kind of work.",
        "It also changes the risk. An assistant that gets something wrong produces a bad draft. An agent that gets something wrong can send the email, change the record or delete the file. This playbook shows how to get the benefit while keeping that risk small, visible and under your control."])
    b.mark("", "Introduction"); b.intro("Introduction", "Give AI a job, not just a question.", "An agent is AI with tools, a goal and permission to act. Done well, it takes routine work off your people's plates. Done carelessly, it creates a new kind of operational risk. The difference is almost entirely in how you set it up.",
        [("compass", "Start with narrow, repeatable work", "The best first agents do one well-defined job with clear inputs, clear outputs and a person who already owns the process."),
         ("sliders", "Set the level of autonomy deliberately", "Decide whether the agent suggests, acts with approval or acts within limits. Start low and earn the right to go higher."),
         ("shield", "Treat agents like new staff with system access", "Give them only the permissions they need, log what they do and review their work until they have proved themselves.")])
    b.statement("An agent should never be able to do more damage than the person who approved it.", "Least privilege, human approval at the moments that matter and a full audit trail. Those three habits make agents safe enough to be useful.", "Introduction")

    b.mark("01", "What agents are, and what they can do"); b.opener("01", "From answers<br>to actions.", "What makes something an agent, what agents are good at today, and how much freedom to give them.", [("01", "Anatomy of an agent"), ("02", "What they do well today"), ("03", "Levels of autonomy")])
    b.essay("Understanding agents", "Model, tools, goal, loop: the four parts of every agent", [
        "Strip away the marketing and every AI agent has four parts. There is a <b>model</b>, the language model that reads, reasons and decides what to do next. There are <b>tools</b>, the connections that let it search, read a file, query a database, call an API or update a system. There is a <b>goal</b>, the outcome you have asked for. And there is a <b>loop</b>: the agent takes a step, looks at the result and decides on the next step until the goal is met or it gets stuck.",
        "That loop is what separates an agent from an assistant. Ask an assistant to find overdue invoices and it will explain how. Ask an agent and it will query the finance system, compile the list, draft the reminders and, if permitted, send them.",
        "The tools are where the value and the risk both live. An agent with read-only access to a knowledge base is low risk. An agent that can issue refunds, change user accounts or push code to production needs the same care you would apply to a new employee with the same access.",
        "Agents are not magic. They can misread instructions, choose the wrong tool, loop without progress or report success when the job is only half done. They work best on tasks where the steps are fairly predictable, the result can be checked and a mistake can be caught and reversed.",
        "Agents also come in different shapes. Some are built into products you already use, such as service desk, CRM or coding tools, and switched on with a setting. Others are assembled on an AI platform for one specific process. A growing number of general assistants can act as agents too, carrying out multi-step tasks in a browser or in connected apps. The shape affects who builds it, who supports it and where its controls live.",
        "The practical question is therefore not whether to use agents, but which jobs, with which tools, at what level of autonomy. The rest of this playbook is about answering that question with confidence. Start narrow, keep a person accountable and widen the agent's freedom only when its track record justifies it."],
        "Understanding agents", "An assistant tells you what to do. An agent does it. That is why the setup matters so much more.")
    b.flow("The agent loop", "How an agent works through a task", "Every agent, however sophisticated, repeats a version of this cycle until the job is done.",
        [("compass", "Understand the goal", "The agent reads the request, the instructions it has been given and any context such as documents or ticket history."),
         ("sliders", "Plan the next step", "It decides what to do next: search, read, calculate, update a record or ask a person for help."),
         ("wrench", "Use a tool", "It calls one of the tools it has been granted, within the permissions that tool allows."),
         ("eye", "Check the result", "It reads what came back and judges whether it is closer to the goal or needs another approach."),
         ("check", "Finish or hand over", "It completes the task and reports what it did, or stops and passes the work to a person with a summary.")], "Understanding agents",
        "Good agents know when to stop. Build in clear hand-over points so an agent asks rather than guesses.")
    b.grid("Where agents help today", "Six jobs agents already do well", "Agents are strongest on multi-step work that follows a recognisable pattern and ends in something a person can check.",
        [("magnifier", "Research and triage", "Gathering information from several sources, sorting incoming requests and routing them to the right team with a summary."),
         ("transfer", "Data entry and updates", "Reading emails, forms or documents and updating the CRM, finance or HR system, with exceptions flagged for review."),
         ("wrench", "Coding and IT operations", "Writing and testing code changes, investigating alerts, gathering diagnostics and running approved fixes from a runbook."),
         ("bell", "Customer service workflows", "Looking up orders, checking policy, drafting replies and completing routine actions such as rebooking or resending documents.")], "Understanding agents",
        "If a capable new starter could do the task from a written procedure, an agent may be able to do it too, with the same supervision.")
    b.table("Levels of autonomy", "How much freedom should an agent have?", "Autonomy is a setting you choose, task by task. Most organisations should start at the top of this table and move down only with evidence.", ["Level", "What the agent does", "The person's role", "Good for"],
        [("Inform", "Gathers and summarises information. Changes nothing.", "Reads and decides.", "Research, monitoring, briefings."),
         ("Suggest", "Proposes an action or prepares a draft.", "Reviews, edits and carries it out.", "Replies, code changes, record updates."),
         ("Act with approval", "Prepares the action and waits for a yes.", "Approves or rejects each action.", "Refunds, account changes, outbound emails."),
         ("Act within limits", "Acts alone inside set boundaries and reports back.", "Sets limits and reviews logs.", "Routine, reversible, high-volume tasks."),
         ("Act freely", "Acts across systems with little oversight.", "Rarely appropriate today.", "Tightly sandboxed experiments only.")], "Understanding agents", widths="30mm 1fr 1fr 1fr")

    b.mark("02", "Choosing your first agents"); b.opener("02", "Your first<br>agents.", "Where agents are paying their way, and how to pick a first use case that builds confidence rather than risk.", [("01", "Use cases by function"), ("02", "Assistant or agent?"), ("03", "Picking the starting point")])
    b.usecase("Use cases", "Research, triage and data entry", [
        ("magnifier", "Sales and bids", "Account and tender research", [("The task", "Pulling together background on a prospect or a tender before a bid decision."), ("What the agent does", "Searches approved sources, reads the documents and compiles a structured brief."), ("Autonomy", "Inform. It changes nothing and a person makes the call."), ("Watch out", "Web content can be wrong or manipulated. Ask for sources and check key facts.")]),
        ("bell", "Shared inboxes", "Triage and routing", [("The task", "Sorting a busy shared mailbox or request queue."), ("What the agent does", "Classifies each request, adds a summary and routes it to the right team or queue."), ("Autonomy", "Act within limits. It can label and route, but not reply or delete."), ("Watch out", "Sample its decisions weekly and keep an easy route for misrouted items.")]),
        ("transfer", "Finance and operations", "Data entry from documents", [("The task", "Keying invoices, orders or forms into business systems."), ("What the agent does", "Extracts the details, matches them to records and prepares the entry."), ("Autonomy", "Act with approval at first, then within limits for clean matches."), ("Watch out", "Anything that moves money stays behind an approval step.")])], "Choosing agents")
    b.usecase("Use cases", "Coding, IT operations and customer service", [
        ("laptop", "Software teams", "Coding agents", [("The task", "Fixing bugs, writing tests and making routine code changes."), ("What the agent does", "Reads the codebase, makes the change, runs the tests and opens a pull request."), ("Autonomy", "Suggest. A developer reviews and merges every change."), ("Watch out", "No direct access to production or secrets. Normal code review still applies.")]),
        ("server", "IT operations", "Alert investigation and runbooks", [("The task", "Working out why an alert fired and what to do about it."), ("What the agent does", "Gathers logs and metrics, checks recent changes and proposes a fix from the runbook."), ("Autonomy", "Act with approval for fixes. Inform for diagnosis."), ("Watch out", "Limit it to named, reversible runbook actions and log every one.")]),
        ("contract", "Customer service", "End-to-end routine requests", [("The task", "Handling routine requests such as order status, rebooking or document resends."), ("What the agent does", "Checks the account, applies the policy, completes the action and confirms with the customer."), ("Autonomy", "Act within limits, with clear rules for when to hand over to a person."), ("Watch out", "Make escalation easy and tell customers when they are dealing with AI.")])], "Choosing agents")
    b.compare("Assistant or agent?", "Not every job needs an agent", "Agents add power and complexity. Often a well-briefed assistant, or a simple automation, is the better answer.", ["Question", "An assistant is enough when", "An agent earns its place when"],
        [("Steps", "The job is one step: draft, summarise, explain.", "The job takes several steps across tools or systems."),
         ("Systems", "Everything needed can be pasted in.", "It needs to look things up or update records itself."),
         ("Volume", "It happens occasionally, for one person.", "It happens often, in a queue, for a team."),
         ("Predictability", "Every case is different and needs judgement.", "Most cases follow a pattern, with clear exceptions."),
         ("Checking", "A person reads the output anyway.", "Results can be checked by rules, tests or sampling.")], "Choosing agents")
    b.matrix("Prioritise", "Where to start", "Plot candidate agent tasks by value and by how easily a mistake can be caught and undone. Begin top right.", "Ease of catching and reversing mistakes", "Value",
        [("Design carefully", "High value, hard to reverse", "Payments, customer commitments, production changes. Keep approval steps and go slowly."), ("Start here", "High value, reversible", "Triage, research, data preparation and drafts. Clear owners, easy to check, easy to undo."),
         ("Avoid for now", "Low value, hard to reverse", "Little to gain and real potential for harm. Revisit when tools and controls mature."), ("Learn safely", "Low value, reversible", "Good sandboxes for teams to build skills and test platforms.")], "Choosing agents")

    b.mark("03", "Running agents safely"); b.opener("03", "Safe by<br>design.", "The permissions, approvals, logs and tests that let you give agents real work with confidence.", [("01", "Guardrails that matter"), ("02", "Prompt injection and connections"), ("03", "Ownership and measurement")])
    b.principles("Guardrails", "Five guardrails for every agent", "These apply whatever platform you use. They are the agent equivalent of good access management.",
        [("Least privilege", "Grant only the tools and data the task needs. Read-only by default, with write access added deliberately and scoped tightly."),
         ("Human approval at the moments that matter", "Payments, deletions, external messages and changes to access go to a person first. Make approval quick so it is not bypassed."),
         ("A full audit trail", "Log every tool call, input and result, under an identity that clearly shows it was the agent. You need to know what happened and why."),
         ("Test before trust", "Run the agent on realistic cases, including awkward and hostile ones, before it touches live work. Retest after every change."),
         ("A clear off switch", "Anyone responsible must be able to pause the agent instantly, and there must be a manual fallback for the work it does.")], "Running safely")
    b.essay("Untrusted content", "Prompt injection: when the data gives the orders", [
        "Agents read things: emails, web pages, documents, tickets, chat messages. The model behind the agent cannot always tell the difference between content it should process and instructions it should follow. That opens a door called <b>prompt injection</b>, where text hidden in a document or web page tries to redirect the agent.",
        "A simple example: an agent summarising inbound emails meets a message containing hidden text telling it to forward the mailbox contents to an outside address. If the agent has permission to send email, there is a real risk it tries. AI providers are working hard on defences, but no one currently claims the problem is fully solved.",
        "The most reliable protection is not clever prompting. It is design. Keep agents that read untrusted content away from sensitive actions, or put a human approval step between them. Limit where an agent can send data. Do not combine access to private data, exposure to untrusted content and the ability to communicate externally in one agent unless there is a strong control in the middle.",
        "Testing should include this threat. When you build an agent's test set, add documents and messages that contain misleading or hostile instructions, and check that the agent ignores them or flags them for a person. Repeat those tests whenever the model, the tools or the instructions change, because behaviour that was safe last month is not guaranteed to stay safe.",
        "Connecting agents to tools is getting easier. The <b>Model Context Protocol (MCP)</b> is an open standard, originally introduced by Anthropic, that gives AI applications a common way to connect to tools and data sources. It is now supported by many AI tools and platforms, and many software vendors offer MCP connectors for their products.",
        "Standards like MCP are welcome because they reduce custom integration work. But each connector is still a piece of software with access to your systems. Treat it like any other integration: know who built it, review what it can do, approve it centrally and keep a list of what is connected to what. Remove connectors that are no longer needed, and be wary of connectors from unknown sources that ask for far broader access than the job requires."],
        "Running safely", "If an agent reads content you do not control, assume someone will eventually try to give it instructions.")
    b.dive("01", "shield", "Permissions and least privilege", "Most agent incidents are permission problems. Get the access model right and most other risks shrink with it.",
        [("Identity", "Give each agent its own named account or service identity, never a person's login, so actions are traceable and access can be revoked cleanly."),
         ("Scope", "List the exact tools and actions the task needs. Prefer narrow tools, such as update this field, over broad ones, such as run any command."),
         ("Limits", "Set boundaries in the system, not just in the prompt: value caps, record types, rate limits and approved recipients."),
         ("Review", "Recertify agent access on the same cycle as staff access, and remove tools that are no longer used.")], "Running safely", "IT or security, with the business process owner")
    b.steps("Going live", "Six steps from idea to trusted agent", "A deliberate path that builds evidence at each stage, so autonomy is earned rather than assumed.",
        [("Name the job and the owner", "Write down the task, the expected output and the person accountable for the agent's work."),
         ("Map tools and permissions", "List every system it touches and the minimum access needed. Get security sign-off."),
         ("Build a test set", "Collect realistic cases, including edge cases and deliberate attempts to mislead it."),
         ("Run in suggest mode", "Let it propose actions on live work while people compare its choices with their own."),
         ("Raise autonomy in steps", "Move to approval, then to limits, only when the results justify it."),
         ("Monitor and review", "Check logs, error rates and feedback regularly. Retest after any change to model, tools or instructions.")], "Running safely",
        "Ownership does not transfer to the agent. Every agent needs a named person who answers for what it does.")
    b.table("Measuring agents", "How to tell if an agent is working", "Measure the work, not the technology. These measures tell you whether to expand, adjust or retire an agent.", ["Measure", "What it tells you", "How to capture it"],
        [("Completion", "How often the agent finishes the task without help.", "Agent logs and hand-over counts."),
         ("Accuracy", "Whether what it did was right.", "Regular sampling and reviewer checks."),
         ("Time to outcome", "Whether work moves faster end to end.", "Ticket or case timestamps, before and after."),
         ("Escalations", "Where it gets stuck or hands over.", "Hand-over reasons, reviewed monthly."),
         ("Incidents", "Whether guardrails are holding.", "Blocked actions, near misses and errors logged."),
         ("User view", "Whether staff and customers trust it.", "Short feedback prompts and complaints.")], "Running safely")
    b.questions("Before you start", "Questions for your leadership team", "Agree the answers before any agent is given access to live systems.",
        [("Value and ownership", ["Which repetitive, multi-step processes cost us the most time today?", "Who will own each agent's results, and its mistakes?", "What evidence would let us give an agent more autonomy?"]),
         ("Control and risk", ["Which actions must always need a human approval?", "Can we see, in one place, what every agent can access and has done?", "If an agent misbehaved tonight, how quickly could we stop it?"])], "Running safely")
    b.checklist("Checklist", "Are you ready to let AI act?", "Tick what is in place. Gaps are your to-do list before the first agent goes live.",
        [("A named owner for each agent", "Accountable for its work, as for a team member's."), ("Agents run under their own identities", "Never under a person's account."), ("Least-privilege access, reviewed regularly", "Read-only by default, write access scoped tightly."),
         ("Approval steps for high-impact actions", "Payments, deletions, external messages, access changes."), ("Every action logged and reviewable", "With logs kept long enough to investigate issues."), ("A tested off switch and manual fallback", "Everyone involved knows how to use it."),
         ("A central register of agents and connectors", "Including what each one can reach.")], "Running safely")
    b.glossary("Words worth knowing", [("Agent", "An AI system that uses tools to take a series of actions towards a goal."), ("Tool", "A capability an agent can call, such as search, read a file or update a record."),
        ("Autonomy", "How much an agent may do without a person approving each step."), ("Least privilege", "Giving an agent only the access its task needs, and no more."),
        ("Human in the loop", "A person reviews or approves an agent's action before it takes effect."), ("Audit log", "A record of every action an agent took, with inputs and results."),
        ("Prompt injection", "Hidden or malicious instructions in content an agent reads, aiming to redirect it."), ("MCP", "Model Context Protocol, an open standard for connecting AI applications to tools and data."),
        ("Connector", "An integration that gives an assistant or agent access to another system."), ("Runbook", "A written procedure for a routine technical task, often a safe starting point for agents."),
        ("Sandbox", "An isolated environment where an agent can be tested without touching live systems.")])
    b.art_back("Ready to put agents<br>to work, safely?", "We help organisations choose the right first agents, connect them securely to the systems they need and build the controls that keep them trustworthy.", "Book an AI agents workshop", "No. 09 · Which AI, for which job?")
    return b
