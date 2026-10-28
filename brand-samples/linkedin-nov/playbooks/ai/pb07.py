from aikit import AIBook

def build():
    b = AIBook("Ask Better", num=7, art="line", pos="74%")
    b.how = "How to brief AI assistants like Claude the way you would brief a capable colleague, check what comes back, and turn good prompts into a shared team asset."
    b.art_cover("Playbook No. 07 · Prompting", "Ask better.", "Prompting is a management skill.", "The people who get the best from AI are not the most technical. They are the best at briefing. Here is how to do it, and how to make it a team habit.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The quality of the answer starts with the quality of the ask.", [
        "Two people can use the same AI assistant on the same task and get completely different results. One gets a generic paragraph that needs rewriting. The other gets a sharp, usable draft in the right tone, built on the right facts. The difference is rarely the tool. It is the brief.",
        "That is good news for business leaders, because briefing is a skill you already have. You brief new starters, agencies, consultants and colleagues every week. The same habits that get good work from people, a clear goal, the right background and a defined outcome, get good work from AI.",
        "This playbook shows how to apply those habits to assistants such as Claude, ChatGPT, Gemini and Copilot. It covers how to write a strong brief, how to iterate and check the result, and how to turn individual skill into shared templates your whole team can use."])
    b.mark("", "Introduction"); b.intro("Introduction", "Brief it like a capable colleague.", "An AI assistant is quick, well read and tireless, but it knows nothing about your business, your client or your standards unless you tell it. Most disappointing results come from a missing piece of the brief, not a weakness in the tool.",
        [("compass", "Say what good looks like", "Describe the goal, the audience and the outcome you need, not just the topic."),
         ("contract", "Give it the material", "Paste or attach the documents, data and examples it needs. Do not make it guess."),
         ("check", "Treat the first answer as a draft", "Ask for changes, ask it to critique itself, and check anything that matters before you use it.")])
    b.statement("Vague in, generic out. A good brief is the cheapest quality improvement you will ever make.", "Every minute spent on the ask saves several on the edit.", "Introduction")

    b.mark("01", "Write a better brief"); b.opener("01", "Write a<br>better brief.", "The six ingredients of a strong prompt, and what they look like on real business tasks.", [("01", "Why prompting is management"), ("02", "The six-part brief"), ("03", "Before and after, on real work")])
    b.essay("The brief", "The best prompters are good managers", [
        "Think about the last time you briefed someone new on an important piece of work. You probably explained why it mattered, who it was for, what you already knew, what to avoid and what the finished product should look like. You may have shown them an example of something similar that worked well.",
        "That is exactly what a good prompt contains. AI assistants are remarkably capable, but they start every task without your context. They do not know your client is sensitive about price, that your board prefers one page, or that your house style avoids jargon. Leave those things out and the assistant fills the gaps with safe, average assumptions.",
        "This is why prompting is a management skill rather than a technical one. Clear thinking about the outcome matters more than clever wording. If you cannot describe what good looks like, the assistant cannot produce it, and neither could a human colleague.",
        "Length is not the enemy. A prompt of several paragraphs with attached documents will usually beat a single line. The assistant can handle the detail, and every relevant fact you add narrows the range of possible answers towards the one you need.",
        "Good briefs also say what not to do. Tell the assistant to avoid certain claims, keep to a word count, stick to the facts in the attached report or flag anything it is unsure about. Constraints are not a limitation. They are how you get output you can use without heavy editing.",
        "Finally, expect a conversation. Even a strong brief rarely produces the perfect answer first time. The skill is in reviewing the draft, saying clearly what to change and building towards the result, just as you would with a colleague."],
        "The brief", "If you cannot describe what good looks like, neither the assistant nor a colleague can deliver it.")
    b.steps("The six-part brief", "Six ingredients of a prompt that works", "You will not need all six every time, but the more that matter to the task, the more you should include.",
        [("Goal", "What you are trying to achieve and why. A decision, a reply, a plan, a first draft."),
         ("Context", "The background the assistant cannot know: the client, the history, the documents and the facts."),
         ("Audience", "Who will read the output, what they already know and what they care about."),
         ("Constraints", "Length, tone, things to avoid, facts to stick to and anything that must be included."),
         ("Examples", "A past piece of work you liked, or a sample of the style and structure you want."),
         ("Format", "Bullets, table, email, one-page memo, headings. Say exactly how you want it laid out.")], "Write a better brief",
        "A quick test: would a capable new colleague have enough to do this well? If not, neither does the assistant.")
    b.usecase("Before and after", "Real tasks, weak and strong briefs", [
        ("contract", "Sales", "A follow-up email after a meeting", [("Before", "Write a follow-up email to a client."), ("After", "Draft a warm follow-up to a finance director. Recap the three points in my notes, propose two dates, under 150 words."), ("Why it works", "Audience, content, next step and length are all clear."), ("Check", "Names, dates and any commitments made on the call.")]),
        ("compass", "Leadership", "A board summary of a long report", [("Before", "Summarise this report."), ("After", "Summarise the attached report for our board in one page: three key findings, the main risk and a recommended decision."), ("Why it works", "Defines the reader, the structure and the purpose."), ("Check", "Every figure against the source document.")]),
        ("owner", "HR", "A job description", [("Before", "Write a job description for an office manager."), ("After", "Write a job description using the attached template and responsibilities list. Plain English, inclusive language, no jargon."), ("Why it works", "Gives the structure, content and standards to follow."), ("Check", "Salary, contract terms and anything legally sensitive.")])], "Write a better brief")
    b.usecase("Before and after", "More tasks, sharper briefs", [
        ("sliders", "Finance", "Explaining a monthly variance", [("Before", "Why are costs up?"), ("After", "Using the attached figures, explain the three largest cost variances for a non-finance reader. Flag anything that needs checking."), ("Why it works", "Supplies the data and asks for uncertainty to be flagged."), ("Check", "Recalculate every number in your own system.")]),
        ("bell", "Service", "Replying to an unhappy customer", [("Before", "Reply to this complaint."), ("After", "Draft a reply to the complaint below. Apologise once, explain the fix, offer a call. Calm, human, no corporate phrases."), ("Why it works", "Sets tone, structure and the outcome you want."), ("Check", "That promises match what you can actually deliver.")]),
        ("magnifier", "Marketing", "Turning a case study into posts", [("Before", "Write some LinkedIn posts about this."), ("After", "Write three LinkedIn posts from the attached case study, each with a different angle. Match the tone of the example post below."), ("Why it works", "Provides source material, quantity, variety and a style sample."), ("Check", "Client approval and any claims about results.")])], "Write a better brief")

    b.mark("02", "Work with the answer"); b.opener("02", "Work with<br>the answer.", "The first response is the start of the job. Iterate, challenge and verify before you rely on it.", [("01", "The iteration loop"), ("02", "Techniques that lift quality"), ("03", "Giving it your documents"), ("04", "Checking the output")])
    b.flow("The loop", "From first draft to something you can use", "Strong users treat AI as a back-and-forth, not a vending machine.",
        [("contract", "Brief", "Give the goal, context, audience, constraints, examples and format."),
         ("laptop", "Draft", "Let the assistant produce a first version. Read it as you would a junior colleague's work."),
         ("magnifier", "Critique", "Ask it to review its own draft against your brief and list weaknesses."),
         ("sliders", "Refine", "Say specifically what to change: shorter, firmer, more evidence, different structure."),
         ("check", "Verify", "Check facts, figures, names and anything that will reach a client or a decision.")], "Work with the answer", "Specific feedback beats starting again. Tell it what to keep as well as what to change.")
    b.compare("Techniques", "Small changes that lift the quality", "Each of these takes seconds to add and often makes the difference between usable and not.", ["Technique", "Instead of", "Try asking"],
        [("Role and tone", "Write about our new service.", "Write as an experienced adviser to a cautious finance director. Warm, plain, confident."),
         ("Reasoning", "Which option is best?", "Work through each option step by step against our criteria, then recommend one and explain why."),
         ("Critique", "Is this good?", "Act as a sceptical reviewer. List the five weakest points in this draft."),
         ("Questions first", "Write the plan.", "Before you start, ask me any questions you need answered to do this well."),
         ("Options", "Give me a headline.", "Give me five headlines in different styles, and say which you would choose.")], "Work with the answer")
    b.dive("01", "storage", "Give it the documents", "The single biggest improvement most people can make is to stop asking from memory and start giving the assistant the actual material.",
        [("What to include", "The source report, the email thread, the policy, the data or a past example. Approved tools only."),
         ("How to frame it", "Say what each document is and how to use it. Ask it to rely only on what you have provided."),
         ("What to leave out", "Personal or confidential data your policy does not allow, and anything irrelevant."),
         ("How to check", "Ask it to quote the passage behind each key point, then spot-check those quotes yourself.")], "Work with the answer", "Every user, guided by your AI policy")
    b.principles("Verify", "Five rules for checking AI output", "AI can be confidently wrong. These habits catch most problems before they matter.",
        [("Check every number", "Figures, dates and calculations come from your systems or sources, never from the assistant alone."),
         ("Ask for the source", "Where it states a fact, ask where it came from. Be wary of anything it cannot point to."),
         ("Read it as the recipient", "Would the client, the board or the regulator be happy with every sentence?"),
         ("Test the reasoning", "Ask it to argue the opposite case. Weak conclusions tend to show themselves quickly."),
         ("Keep a person accountable", "Whoever sends or uses the output owns it, whether or not AI drafted it.")], "Work with the answer")

    b.mark("03", "Make it a team habit"); b.opener("03", "Make it a<br>team habit.", "Turn individual skill into shared templates, standing instructions and a library everyone can use.", [("01", "From personal trick to team asset"), ("02", "A starter template library"), ("03", "Common mistakes")])
    b.essay("Team habits", "From personal trick to team capability", [
        "In most organisations, prompting skill is unevenly spread. A few people have worked out what gets great results, and the rest are still typing one-line questions. That gap is an opportunity: the best prompts in your business can be captured once and used by everyone.",
        "Start with templates for the tasks your teams do most often. A good template is a brief with blanks: the goal, context and format already written, with spaces for the specific client, document or figures. People fill in the blanks and get a consistent, high-quality starting point every time.",
        "Store templates in one shared library that everyone can find, with an owner who keeps it tidy. Note which tool each template was tested in, what it is good for and what to check in the output. Retire templates that stop working, because models change and so do your needs.",
        "Most business assistants also let you save standing instructions so you do not repeat yourself. Some group conversations, files and instructions into projects or shared workspaces, so an assistant always has your style guide, product details or client background to hand. Names and features vary by tool and change often, so check what yours offers.",
        "Use these features for the context that never changes: your tone of voice, your house style, your service descriptions and the standards every output should meet. That frees each prompt to focus on the task in hand.",
        "Finally, make sharing normal. Ask champions to post a good prompt each week, review the library quarterly and include prompting in new starter training. Skill that lives in a shared library survives people changing roles. Skill that lives in one person's head does not."],
        "Team habits", "Capture your best prompts once, and everyone starts from your best work.")
    b.table("Template library", "A starter library for any team", "Begin with five or six templates for frequent tasks, then grow the library from what people actually use.", ["Template", "Use it for", "Must include"],
        [("Meeting summary", "Notes, decisions and actions from a transcript.", "Attendees, decisions, owners and dates for each action."),
         ("Client email", "Replies and follow-ups in your tone of voice.", "Recipient, purpose, key points, length and style sample."),
         ("Document digest", "Summarising reports, contracts or papers.", "Reader, length, structure and a request to flag uncertainty."),
         ("Options paper", "Comparing choices for a decision.", "Options, criteria, constraints and a recommendation with reasons."),
         ("Policy or procedure", "Drafting or updating internal documents.", "Template, source notes, audience and owner for sign-off."),
         ("Critique", "Reviewing any draft before it goes out.", "The goal, the audience and what a sceptical reader would challenge.")], "Make it a team habit", widths="36mm 1fr 1fr")
    b.grid("Standing context", "Set it once, use it every time", "Store the context that rarely changes, so every prompt can focus on the task in hand.",
        [("sliders", "Standing instructions", "Your role, your organisation and how you like answers laid out, saved so you do not repeat them in every chat."),
         ("storage", "Projects and workspaces", "Shared files and instructions for a client, product or team, so the assistant always has the right background."),
         ("contract", "Style guide", "Tone of voice, banned phrases, spelling and formatting rules, written once and attached wherever useful."),
         ("owner", "Library owner", "One person keeps templates current, removes what no longer works and shares new examples.")], "Make it a team habit",
        "Only put information into shared projects that everyone with access is allowed to see.")
    b.steps("Common mistakes", "Six habits that hold teams back", "Each is easy to spot and quick to fix once people know to look for it.",
        [("The one-line ask", "A topic with no goal, audience or format produces a generic answer."),
         ("Asking from memory", "Expecting the assistant to know your facts instead of giving it the documents."),
         ("Accepting the first draft", "Stopping at version one instead of giving specific feedback."),
         ("Starting over too soon", "Abandoning a conversation that only needed one clear correction."),
         ("Trusting numbers and names", "Using figures, quotes or citations without checking them against a source."),
         ("Keeping good prompts private", "Great briefs stay in one inbox instead of the shared library.")], "Make it a team habit",
        "Most of these disappear with one hour of hands-on practice using real work, not generic examples.")
    b.questions("For your team", "Questions to raise your prompting game", "Use these in a team meeting or a champions session.",
        [("Individual practice", ["Which task do I do most often that an assistant could draft?", "What context do I keep forgetting to give it?", "How do I check the output before it leaves my hands?"]),
         ("Team practice", ["Which five templates would save us the most time?", "Where will our shared library live, and who owns it?", "What standing context should every prompt in our team start with?"])], "Make it a team habit")
    b.checklist("Checklist", "Before you press enter", "A quick check for any prompt that matters.",
        [("I have said what the output is for", "The goal and the decision or action it supports."), ("I have given the context it cannot know", "Documents, facts, history and constraints."), ("I have named the audience", "Who will read it and what they care about."),
         ("I have set the format and length", "Bullets, table, email or memo, and how long."), ("I have included an example if style matters", "A past piece of work or a sample."), ("I have used an approved tool for this data", "In line with our AI policy."),
         ("I will check the output before using it", "Facts, figures, names and tone.")], "Make it a team habit")
    b.glossary("Words worth knowing", [("Prompt", "The instructions, questions and material you give an AI assistant."), ("Brief", "A complete prompt covering goal, context, audience, constraints, examples and format."),
        ("Context", "The documents, data and background the assistant can see when it answers."), ("Context window", "How much text an assistant can take into account at once."),
        ("Iteration", "Improving an output through rounds of specific feedback."), ("Role prompt", "Asking the assistant to respond from a particular perspective or expertise."),
        ("Standing instructions", "Saved guidance an assistant applies to every conversation."), ("Project or workspace", "A space that groups chats, files and instructions for one purpose."),
        ("Template", "A reusable prompt with blanks for the details of each task."), ("Prompt library", "A shared, owned collection of tested templates for a team or organisation."),
        ("Hallucination", "A confident answer that is wrong or made up."), ("Grounding", "Asking the assistant to base its answer only on material you have provided.")])
    b.art_back("Better briefs,<br>better results.", "We help teams get real value from AI assistants, with practical prompting training, shared template libraries and the secure setup that makes good habits easy.", "Book a prompting workshop", "No. 08 · Agents at work")
    return b
