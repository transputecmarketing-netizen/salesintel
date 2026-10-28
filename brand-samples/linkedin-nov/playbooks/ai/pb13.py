from aikit import AIBook

def build():
    b = AIBook("AI Skills for Every Team", num=13, art="mesh", pos="80%")
    b.how = "The skills that make AI genuinely useful, how to build them across every role, and how to bring people with you honestly."
    b.art_cover("Playbook No. 13 · People", "AI skills", "for every team.", "Tools are easy to buy. Capability is built. How to help every colleague use AI well, safely and with confidence.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The difference is not the tool. It is the person using it.", [
        "Give two colleagues the same AI assistant and you will often see very different results. One gets a vague, generic answer and decides the tool is overrated. The other gives clear context, pushes back on the first draft, checks the facts and ends up with something genuinely useful in a fraction of the usual time.",
        "That gap is a skills gap, and it is the single biggest factor in whether AI investment pays off. It is also very fixable. The skills involved are learnable, mostly common sense, and closer to good management and good writing than to anything technical.",
        "This playbook sets out the skills that matter, how to build them for different roles, how to support people who are worried about what AI means for their jobs, and how to keep capability current as the tools keep changing."])
    b.mark("", "Introduction"); b.intro("Introduction", "Capability, not just access.", "Rolling out licences gives people access. Capability comes from practice, good examples, honest conversations and support close to the work. That takes deliberate effort, but far less than most leaders expect.",
        [("compass", "Teach judgement, not tricks", "Prompt formulas date quickly. The lasting skills are briefing clearly, judging output and knowing when not to use AI."),
         ("owner", "Learn close to the work", "People learn fastest on their own tasks, with colleagues who do the same job showing them what works."),
         ("eye", "Be honest about change", "People adopt AI faster when leaders talk openly about what will change, what will not and how they will be supported.")])
    b.statement("Every colleague now manages an assistant. Few have been shown how.", "Briefing, reviewing and taking responsibility for AI work are management skills. They can be taught to everyone, not just managers.", "Introduction")

    b.mark("01", "The skills that matter"); b.opener("01", "The skills<br>that matter.", "What good AI use looks like in practice, and the five skills that make the difference.", [("01", "Why skills beat tools"), ("02", "Five core skills"), ("03", "Learning paths by role")])
    b.essay("Why skills matter", "The same tool, very different results", [
        "Most organisations that roll out AI see the same pattern. A small group of enthusiasts quickly gets impressive results. A larger group tries the tool a few times, gets something mediocre and quietly goes back to old habits. Leaders look at overall usage and wonder whether the investment was worth it.",
        "The difference between those groups is rarely intelligence or seniority. It is a handful of practical habits. The enthusiasts give the assistant context: who the audience is, what good looks like, what to avoid. They treat the first answer as a draft. They ask follow-up questions. They check anything that matters before they use it.",
        "None of this is technical. It is much closer to briefing a capable new colleague than to programming a computer. That is good news, because it means almost everyone can learn it, and the people who are good at delegating, writing and reviewing work tend to pick it up fastest.",
        "There is also a skill that rarely gets taught: knowing when not to use AI. Some tasks need original judgement, sensitive handling or a personal touch. Some involve data that should not go into any tool. Good users can tell the difference, and that is what keeps AI use safe as well as productive.",
        "The tools will keep changing. New features arrive constantly and today's tips can be obsolete within months. Build your learning around durable skills and real work, not around a particular interface, and your people will adapt as the tools evolve.",
        "Finally, skills spread socially. People copy what respected colleagues do. A champion in the team who shares a good example on a Monday morning often does more for adoption than a formal course."],
        "The skills that matter", "Using AI well is less like programming and more like delegating to a capable new colleague.")
    b.principles("Core skills", "Five skills every colleague needs", "These apply whatever the tool, the role or the level of experience.",
        [("Briefing", "Give clear context, the audience, the goal, examples of good and any constraints. Better input, better output."),
         ("Judging output", "Read critically. Is it accurate, complete, on tone and actually useful, or just fluent?"),
         ("Verifying", "Check facts, figures, quotes and references against reliable sources before anything goes out."),
         ("Knowing when not to", "Recognise tasks that need human judgement, care or confidentiality, and leave AI out of them."),
         ("Data care", "Know which tools are approved and what information can and cannot go into them.")], "The skills that matter")
    b.table("Learning paths", "Different roles, different depths", "Everyone needs the basics. Some roles need much more. Match the learning to the job.", ["Group", "What they need", "Good formats"],
        [("Everyone", "The five core skills, the AI policy and what approved tools can do.", "A short hands-on session on their own work, plus a prompt library."),
         ("Managers", "How to lead AI use in their team, review AI-assisted work and handle concerns.", "Workshops with peers and a simple guide to team conversations."),
         ("Power users", "Advanced techniques, reusable prompts, connecting tools and spotting new use cases.", "Champion network, show-and-tell sessions and early access to features."),
         ("Builders", "Designing assistants and automations, testing, security and data handling.", "Technical training, sandboxes and review by IT and security."),
         ("Leaders", "Where AI creates value, the risks, governance and how to model good use.", "Briefings, peer discussion and using AI visibly in their own work.")], "The skills that matter")

    b.mark("02", "Building capability"); b.opener("02", "Build<br>capability.", "Champions, formats and examples that turn occasional users into confident ones.", [("01", "A champions network"), ("02", "Learning formats that work"), ("03", "Addressing fear honestly")])
    b.dive("01", "owner", "A champions network that actually works", "Champions are the fastest way to spread good practice, provided they have time, support and a clear role.",
        [("Who to pick", "Respected colleagues who do the day job well and are curious about AI. Enthusiasm matters more than technical skill."),
         ("What they do", "Share examples, help colleagues one to one, collect questions and feed back what is and is not working."),
         ("What they need", "Protected time, early access to features, a direct line to IT and a regular forum with other champions."),
         ("How to sustain it", "Recognise the role in objectives, rotate people over time and share their wins with the wider business.")], "Building capability", "AI adoption lead, with a sponsor on the leadership team")
    b.grid("Learning formats", "Formats that build real skill", "People learn AI by doing it on their own work. Slide decks alone rarely change behaviour.",
        [("laptop", "Hands-on sessions", "Short workshops where people bring a real task and finish it with AI, with a coach in the room."),
         ("bell", "Show-and-tell", "Regular slots where colleagues demonstrate something that worked, including what they had to fix."),
         ("tag", "Prompt libraries", "A shared, curated collection of proven prompts and examples for common tasks in each team."),
         ("magnifier", "Office hours", "Drop-in time with a champion or expert for questions, troubleshooting and ideas.")], "Building capability",
        "Aim for little and often. A monthly habit of sharing examples beats a single day of training.")
    b.usecase("In practice", "What good looks like in three teams", [
        ("sliders", "Finance", "From reluctance to routine", [("Starting point", "A team cautious about accuracy and wary of putting figures into AI tools."), ("What helped", "Clear data rules, then sessions on commentary drafting using figures from their own systems."), ("The skill built", "Briefing with context, and verifying every number against the source."), ("What changed", "Month-end narratives start as AI drafts, with finance reviewing rather than writing.")]),
        ("bell", "Customer service", "Consistent answers, confident agents", [("Starting point", "Agents unsure whether AI suggestions were safe to send to customers."), ("What helped", "Champions shared side-by-side examples of good and poor suggestions each week."), ("The skill built", "Judging output quickly and knowing when a human reply is needed."), ("What changed", "Agents use suggestions as drafts and escalate sensitive cases themselves.")]),
        ("contract", "Sales", "Better preparation, less admin", [("Starting point", "A few enthusiasts with great results, most of the team not using AI at all."), ("What helped", "A shared library of call preparation and proposal prompts from top performers."), ("The skill built", "Reusing proven prompts and adapting them to each account."), ("What changed", "Preparation became more consistent across the team, not just the enthusiasts.")])], "Building capability")
    b.essay("Fear and job concerns", "Talk about jobs honestly, early and often", [
        "Many people have mixed feelings about AI at work. Some are excited. Many are worried: about being replaced, about being judged for not keeping up, or about being blamed when AI gets something wrong. Ignoring those worries does not make them go away. It just pushes them underground, where they slow adoption.",
        "The most effective leaders talk about it directly. They are honest about what they know and what they do not. They explain how the organisation intends to use AI, which tasks it is likely to change, and how people will be supported. Vague reassurance that nothing will change is rarely believed, and rarely true.",
        "Be specific where you can. If the aim is to remove repetitive work so people can spend more time with customers, say so and show it happening. If roles will change, explain how, give people time and invest in helping them move with it.",
        "Make it safe to learn. People need permission to experiment, to admit they are unsure and to get things wrong while they practise. Leaders who use AI openly, including sharing their own mistakes, do a great deal to lower the temperature.",
        "Be equally clear about accountability. AI-assisted work is still the person's work. That is not a threat. It is a statement that judgement and responsibility remain human, which is often what worried colleagues most want to hear.",
        "Finally, listen. Frontline staff often spot both the best uses and the real risks before anyone else. A regular, genuine channel for feedback turns concern into contribution."],
        "Building capability", "People do not resist AI. They resist uncertainty about what it means for them.")

    b.mark("03", "Making it stick"); b.opener("03", "Make it<br>stick.", "Change management, measurement and keeping skills current as the tools move on.", [("01", "Leading the change"), ("02", "Measuring capability"), ("03", "Jobs, hiring and staying current")])
    b.flow("Leading the change", "A change journey people can follow", "Treat AI adoption as a change programme, not a software rollout.",
        [("compass", "Explain why", "Set out what AI is for in your organisation, what will change and what will not."),
         ("flask", "Show it working", "Start with champions on real tasks, and share concrete examples from familiar teams."),
         ("laptop", "Equip everyone", "Provide approved tools, the core skills training and a prompt library for each team."),
         ("owner", "Lead by example", "Managers and leaders use AI visibly and talk about how they use it."),
         ("loop", "Reinforce", "Recognise good use, fix friction quickly and build AI into how processes are designed.")], "Making it stick",
        "Change sticks when people can see it helping colleagues like them, not when it is announced.")
    b.matrix("Measuring capability", "Confidence and competence are not the same", "Plot teams by how confident they feel and how well they actually use AI. Each quadrant needs a different response.", "Competence", "Confidence",
        [("Overconfident", "High confidence, low competence", "Using AI a lot but checking too little. Focus on verifying and judging output."), ("Capable", "High confidence, high competence", "Using AI well and safely. Make them champions and capture their examples."),
         ("Not started", "Low confidence, low competence", "Hesitant or unaware. Start with hands-on sessions on their own work."), ("Quietly capable", "Low confidence, high competence", "Doing well but unsure. Recognise their work and encourage them to share it.")], "Making it stick")
    b.compare("Jobs and hiring", "What changes in job design and hiring", "AI changes the shape of many roles. Plan for it rather than letting it happen by accident.", ["Area", "Before AI", "With AI"],
        [("Job design", "Roles defined by the tasks people do.", "Roles defined by outcomes, judgement and the work AI supports."),
         ("Entry-level roles", "Learning through routine drafting and research.", "Deliberate ways to build judgement, as routine tasks shrink."),
         ("Hiring", "Experience with specific tasks and tools.", "Judgement, curiosity, communication and ability to verify work."),
         ("Interviews", "Questions about past tasks.", "Clear rules on AI use, and exercises that test reasoning."),
         ("Performance", "Volume of output.", "Quality, outcomes and responsible use of AI.")], "Making it stick")
    b.steps("Staying current", "Keeping skills fresh as the tools change", "AI tools change faster than most training programmes. Build in renewal from the start.",
        [("Refresh the prompt library", "Champions retire stale prompts and add new ones each quarter."),
         ("Share what changed", "A short monthly note on new features that matter to your teams, and what to ignore."),
         ("Revisit the policy", "Review your AI policy regularly as tools, risks and guidance develop."),
         ("Re-run the basics", "Include AI skills in induction and refresh them for existing staff."),
         ("Learn from mistakes", "Share near misses and errors openly, so everyone learns from them.")], "Making it stick",
        "Capability is a habit, not a course. Keep the habit going and the skills keep up with the tools.")
    b.questions("Ask your team", "Questions for leaders and HR", "Use these to shape your AI skills plan and test whether it is working.",
        [("Capability", ["Which teams are getting real value from AI, and what are they doing differently?", "Does every colleague know which tools are approved and what data can go in them?", "Do our champions have the time and support to do the role well?"]),
         ("People", ["Have we talked honestly with staff about how AI will change their work?", "How are we building judgement in entry-level roles as routine tasks change?", "Are our job descriptions and interviews ready for AI-assisted work?"])], "Making it stick")
    b.checklist("Checklist", "Are your people AI-ready?", "Tick what is in place today. Anything left blank is your next step.",
        [("Core AI skills training for everyone", "Briefing, judging, verifying, knowing when not to and data care."), ("Role-based learning paths", "For managers, power users, builders and leaders."),
         ("An active champions network", "With protected time and a regular forum."), ("Prompt libraries for key teams", "Curated, current and easy to find."),
         ("Honest communication about jobs and change", "With a genuine channel for questions and feedback."), ("Capability measured, not just usage", "Confidence and competence, team by team."),
         ("AI skills in induction and job design", "So capability keeps pace as people join and roles change.")], "Making it stick")
    b.glossary("Words worth knowing", [("AI literacy", "A working understanding of what AI tools can and cannot do, and how to use them responsibly."), ("Briefing", "Giving an AI assistant the context, goal and constraints it needs to do a task well."),
        ("Prompt", "The instructions and context you give an AI assistant."), ("Prompt library", "A shared collection of proven prompts and examples for common tasks."),
        ("Champion", "A colleague who helps their team adopt AI well and shares what works."), ("Power user", "Someone who uses AI tools heavily and in advanced ways."),
        ("Builder", "Someone who designs assistants, automations or integrations for others to use."), ("Verification", "Checking AI output against reliable sources before it is used."),
        ("Hallucination", "A confident AI answer that is wrong or made up."), ("Human in the loop", "A person reviews AI output before it is used or acted on."),
        ("Change management", "The structured approach to helping people adopt new ways of working."), ("Acceptable use policy", "The rules for how staff may use AI tools and data.")])
    b.art_back("Build AI skills<br>that last.", "We help organisations equip their people to use AI well, from approved tools and policies to hands-on training and champion networks that keep momentum going.", "Book an AI skills workshop", "Back to No. 01 · The AI-ready organisation")
    return b
