from aikit import AIBook

def build():
    b = AIBook("Your Data, AI-Ready", num=12, art="ribbon", pos="70%")
    b.how = "Why AI answers are only as good as the information behind them, and a practical plan to get your documents, permissions and systems ready."
    b.art_cover("Playbook No. 12 · Data foundations", "Your data,", "AI-ready.", "Better answers start with better context. How to tidy, secure and connect the knowledge your AI tools depend on.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The model is rarely the problem. The context usually is.", [
        "When an AI assistant gives a poor answer about your business, the instinct is to blame the model. More often, the assistant found an out-of-date policy, three conflicting versions of the same price list, or nothing at all, because the information that mattered was locked in someone's inbox.",
        "Modern AI tools are very good at reading and reasoning over the material they are given. That makes the state of your documents, data and permissions far more important than it used to be. Untidy shared drives were once an annoyance. Connected to AI, they become a source of wrong answers and, sometimes, of data that should never have been seen.",
        "This playbook sets out what AI-ready data actually means, where to focus first and how to tell whether it is working. None of it needs a multi-year data programme. It needs ownership, a few clear rules and steady housekeeping."])
    b.mark("", "Introduction"); b.intro("Introduction", "Good answers need good material.", "AI assistants answer from two places: what they learned in training, and what you give them at the moment of asking. For questions about your business, the second matters most, and it is the part you control.",
        [("storage", "Know where knowledge lives", "Map the documents, systems and data your people rely on, and decide which ones AI should be able to use."),
         ("broom", "Tidy before you connect", "Remove duplicates, retire stale content and give every important source a named owner."),
         ("shield", "Fix permissions first", "Assistants can surface whatever a user can access. Make sure that is only what they should access.")])
    b.statement("AI does not make your information better. It makes it faster to find, good or bad.", "Connect an assistant to well-kept knowledge and it shines. Connect it to a messy shared drive and it will confidently repeat the mess.", "Introduction")

    b.mark("01", "Why context is everything"); b.opener("01", "Context is<br>everything.", "How AI tools use your information, and why the quality of that information decides the quality of the answer.", [("01", "Retrieval, explained simply"), ("02", "Structured and unstructured data"), ("03", "Four problems that spoil answers")])
    b.essay("How AI uses your data", "A brilliant reader with your filing cabinet", [
        "An AI model on its own knows a great deal about the world in general and almost nothing about your organisation. It has never seen your contracts, your product catalogue or last month's board pack. Ask it about them and it will either say it does not know or, worse, make a plausible guess.",
        "The usual fix is called retrieval-augmented generation, often shortened to RAG. The idea is simple. When someone asks a question, the system first searches your approved sources for the most relevant passages, then hands those passages to the model along with the question. The model writes its answer from what it has just been shown, ideally with references back to the source.",
        "Most business AI tools now work this way, whether they call it RAG, grounding, connectors or enterprise search. Assistants built into office suites search your files and email. Customer service tools search your knowledge base. Custom assistants search whatever collection your team has set up.",
        "The consequence is important. The answer can only be as good as what the search finds. If the right document is missing, the model cannot use it. If an old version ranks higher than the current one, the model will quote the old one. If two documents disagree, the model may pick either, or blend them.",
        "That is why AI readiness is mostly about information management: which sources are included, whether they are current, who owns them, how they are labelled and who is allowed to see them. These are not new disciplines, but AI raises the stakes and makes the gaps visible very quickly.",
        "The upside is that the work pays twice. Tidier, better-owned knowledge helps people find things without AI too, and it reduces the risk that an assistant shows someone information they should never have had."],
        "Why context is everything", "The model writes the answer, but your documents decide whether it is right.")
    b.flow("Retrieval explained", "What happens when someone asks a question", "A simplified view of how most business assistants find and use your information.",
        [("magnifier", "Ask", "A colleague asks a question in plain language, such as what our refund policy says about business customers."),
         ("check", "Check access", "The system works out who is asking and which sources that person is allowed to see."),
         ("storage", "Retrieve", "It searches those sources and pulls back the most relevant passages from documents, records or pages."),
         ("contract", "Generate", "The model reads the passages alongside the question and drafts an answer in plain English."),
         ("eye", "Cite and check", "Good tools show which sources were used, so the person can open them and verify the answer.")], "Why context is everything",
        "Every stage depends on your data: whether it is findable, current, correctly permissioned and clearly written.")
    b.compare("Two kinds of data", "Documents and databases need different handling", "Most organisations need AI to work with both. The preparation is different for each.", ["Aspect", "Unstructured", "Structured"],
        [("Examples", "Policies, contracts, emails, presentations, meeting notes.", "CRM records, finance ledgers, stock levels, ticket data."),
         ("How AI uses it", "Searches and reads passages, then summarises or answers.", "Queries the system or works through an export or connector."),
         ("Common problems", "Duplicates, old versions, unclear titles and no owner.", "Missing fields, inconsistent codes and duplicate records."),
         ("What helps", "Clear titles, version control, owners and review dates.", "Data standards, validation rules and clear definitions."),
         ("Main risk", "Oversharing through loose file permissions.", "Wrong figures presented confidently as fact."),
         ("Who owns it", "Often unclear, spread across teams and personal folders.", "Usually a system owner, though data quality may belong to the business.")], "Why context is everything")
    b.grid("What spoils answers", "Four problems that quietly ruin AI answers", "Fix these and answer quality improves more than any model upgrade.",
        [("recycle", "Duplicates and versions", "Five copies of the same policy, each slightly different, and no way to tell which is current."),
         ("bell", "Stale content", "Documents that were right two years ago and are still sitting in the place everyone searches."),
         ("owner", "No owner", "Nobody is responsible for keeping a source accurate, so errors persist and nobody notices."),
         ("eye", "Oversharing", "Sensitive files shared too widely, which an assistant will happily surface to anyone with access.")], "Why context is everything",
        "A useful test: if a new starter could not find the right answer in your files, an AI assistant probably cannot either.")

    b.mark("02", "Get your house in order"); b.opener("02", "Get your house<br>in order.", "Permissions, labels, hygiene and compliance: the groundwork that makes AI safe and useful.", [("01", "Permissions and oversharing"), ("02", "Classification and hygiene"), ("03", "UK GDPR and retention")])
    b.dive("01", "shield", "Assistants surface what users can access", "Most business assistants respect existing permissions. That is reassuring, until you look at what your permissions actually allow.",
        [("The risk", "Files shared with everyone, old team sites left open and inherited access mean people can reach far more than they realise."),
         ("Why AI changes it", "Before, overshared files were hard to find. An assistant can find and summarise them in seconds, for anyone who asks."),
         ("What to check first", "Sites and folders shared with the whole organisation, external sharing links, and sources holding HR, finance or legal data."),
         ("What good looks like", "Access based on role, reviewed regularly, with sensitive areas excluded from AI until they have been cleaned up.")], "Get your house in order", "IT lead, with data owners in each function")
    b.table("Classification", "Label it, then let the label decide", "A simple, four-level scheme most organisations can adopt. Adjust the names to match your own policy.", ["Label", "Typical examples", "Who can see it", "AI rule of thumb"],
        [("Public", "Website copy, published brochures, press releases.", "Anyone, inside or outside the organisation.", "Fine for any approved AI tool."),
         ("Internal", "Procedures, newsletters, general project documents.", "All staff, and approved contractors.", "Approved business AI tools only, never personal accounts."),
         ("Confidential", "Contracts, client data, unpublished financial results.", "Named teams or roles with a business need.", "Approved tools with access controls. Check output before sharing."),
         ("Highly confidential", "HR cases, health data, board papers, merger plans.", "Named individuals only, with access reviewed often.", "Excluded from AI by default unless a specific use is assessed and approved."),
         ("Unlabelled", "Most legacy files on shared drives.", "Often far more people than intended.", "Treat as internal at best. Label sensitive locations first.")], "Get your house in order")
    b.steps("Knowledge hygiene", "Six habits of a well-kept knowledge base", "Steady housekeeping beats a one-off clean-up that is out of date within a year.",
        [("Name an owner for every key source", "A person, not a team, who keeps it accurate and answers questions about it."),
         ("Keep one current version", "Archive or delete superseded copies so search finds the right one."),
         ("Add review dates", "Flag documents that have not been reviewed within an agreed period."),
         ("Write for the reader", "Clear titles, dates and plain summaries help people and AI alike."),
         ("Archive with intent", "Move old material out of the main search scope rather than leaving it to compete."),
         ("Close the feedback loop", "When an AI answer is wrong because of a document, fix the document.")], "Get your house in order")
    b.essay("Compliance", "UK GDPR, retention and doing it properly", [
        "If your AI tools touch personal data, and most will, UK data protection law applies in the same way as for any other processing. AI does not create a separate rulebook, but it does make some existing principles harder to ignore.",
        "Purpose limitation and data minimisation matter most. Connecting an assistant to every file you hold is unlikely to be justified. Be deliberate about which sources contain personal data, why the assistant needs them, and whether a narrower set would do.",
        "Where a new use of AI is likely to be high risk to individuals, for example processing special category data or making decisions that significantly affect people, a data protection impact assessment is expected before you start. Even when one is not strictly required, it is a useful discipline.",
        "Retention needs attention in two directions. First, your existing retention schedule: documents that should have been deleted years ago become newly visible once AI can search them. Second, the AI tools themselves: prompts, outputs, chat histories and logs are records too, and you need to decide how long to keep them.",
        "Check your suppliers' terms carefully. Understand where data is processed and stored, whether it is used to train models, which sub-processors are involved and how deletion works. Business and enterprise tiers often differ from consumer terms on these points.",
        "Data protection law and regulator guidance continue to develop, including recent amendments to UK law and the ICO's guidance on AI. Treat this page as orientation, not legal advice, and check the current position with your data protection lead."],
        "Get your house in order", "If it should have been deleted, AI will find it. Retention is now a quality issue as well as a legal one.")
    b.usecase("In practice", "Three data-ready assistants", [
        ("owner", "HR", "A policy assistant people can trust", [("The data", "Handbook, policies and FAQs, each with one current version and an owner."), ("The preparation", "Old versions archived, review dates added, case files kept out of scope."), ("What good looks like", "Staff get accurate, cited answers and HR fields fewer routine questions."), ("Watch out", "Never connect individual HR case records to a general assistant.")]),
        ("bell", "Service desk", "Answers from a living knowledge base", [("The data", "Knowledge articles, product guides and resolved ticket summaries."), ("The preparation", "Duplicate articles merged and each article tagged by product and owner."), ("What good looks like", "Agents get suggested answers with sources, and gaps feed new articles."), ("Watch out", "Strip customer personal data from ticket content before indexing it.")]),
        ("sliders", "Sales", "Account briefings from the CRM", [("The data", "CRM records, recent emails and proposal library, accessed through a connector."), ("The preparation", "Duplicate accounts merged, key fields made mandatory, stale opportunities closed."), ("What good looks like", "Reps get a reliable briefing before calls without digging through systems."), ("Watch out", "Figures must come from the system of record, never from the model.")])], "Get your house in order")

    b.mark("03", "Prove it works"); b.opener("03", "Prove it<br>works.", "Choose the right sources, connect them sensibly and measure whether answers are actually good.", [("01", "Where to start"), ("02", "Measuring answer quality"), ("03", "Your six-step plan")])
    b.matrix("Prioritise", "Which sources to connect first", "Plot each source by how much value it would add and how ready it is today.", "Readiness", "Value",
        [("Fix first", "High value, not ready", "Important but messy or overshared. Clean up permissions and versions before connecting."), ("Connect now", "High value, ready", "Owned, current, well permissioned sources. Your first wins."),
         ("Leave out", "Low value, not ready", "Old archives and unowned drives. Exclude them from AI search."), ("Nice to have", "Low value, ready", "Fine to include later once the core sources are working well.")], "Prove it works")
    b.table("Answer quality", "How to tell whether answers are good", "Measure from the start, so you can show improvement and catch problems early.", ["Measure", "What it tells you", "How to capture it"],
        [("Accuracy", "Whether answers are correct against the source.", "Regular spot checks of real questions by a subject expert."),
         ("Citations", "Whether answers point to the right, current document.", "Check that sources are shown and are the latest version."),
         ("Coverage", "How often the assistant cannot find an answer.", "Track 'not found' responses and the questions behind them."),
         ("User feedback", "Whether people find answers useful.", "Simple thumbs up or down, with a reason for down votes."),
         ("Access issues", "Whether anyone saw something they should not.", "Logged reports and periodic permission testing."),
         ("Test set", "Whether quality holds as content changes.", "A fixed list of questions with agreed answers, rerun monthly.")], "Prove it works")
    b.steps("Your plan", "A six-step readiness plan", "A sequence that builds confidence without boiling the ocean.",
        [("Pick the use cases", "Choose two or three questions people ask often and that matter to the business."),
         ("Map the sources", "List the documents and systems that hold the answers, with an owner for each."),
         ("Fix the permissions", "Review access on those sources and close any oversharing before connecting AI."),
         ("Clean and label", "Remove duplicates, retire stale content and apply sensitivity labels."),
         ("Connect and test", "Connect approved sources, then run a test set of real questions with expert checks."),
         ("Measure and extend", "Track quality, fix the content behind wrong answers and add sources gradually.")], "Prove it works")
    b.questions("Ask your team", "Questions before you connect AI to your data", "Work through these with IT, data owners and your data protection lead.",
        [("Readiness", ["Which sources would we trust an assistant to answer from today?", "Who owns each of those sources, and when were they last reviewed?", "How will we know if answers are wrong, and who fixes the cause?"]),
         ("Risk", ["Do we know which sites and folders are shared with everyone?", "Which data should be excluded from AI entirely, and is it labelled?", "Have we checked our AI suppliers' terms on data use, storage and retention?"])], "Prove it works")
    b.checklist("Checklist", "Is your data AI-ready?", "Tick what is in place today. Anything left blank is your next step.",
        [("Priority use cases and their sources identified", "With a named owner for each source."), ("Oversharing reviewed and fixed", "Especially organisation-wide and external sharing."),
         ("A simple classification scheme in use", "With sensitive locations labelled first."), ("Duplicates and stale content removed", "Or moved out of the AI search scope."),
         ("Retention rules applied", "To documents and to AI prompts, outputs and logs."), ("Data protection checks completed", "Including a DPIA where the use is high risk."),
         ("Answer quality measured", "With a test set of questions and regular spot checks.")], "Prove it works")
    b.glossary("Words worth knowing", [("Retrieval-augmented generation (RAG)", "Finding relevant passages in your sources and giving them to the model to answer from."), ("Grounding", "Tying an AI answer to specific, citable source material."),
        ("Connector", "An integration that lets an AI tool search or read another system."), ("Index", "The searchable catalogue an AI tool builds from your content."),
        ("Embedding", "A numerical representation of text that lets systems find passages by meaning, not just keywords."), ("System of record", "The authoritative source for a type of data, such as the CRM for customer details."),
        ("Sensitivity label", "A tag on a file or item that records how confidential it is and can drive protections."), ("Oversharing", "Access to content that is wider than the business needs."),
        ("Unstructured data", "Free-form content such as documents, emails and presentations."), ("Structured data", "Data in defined fields and tables, such as a database or spreadsheet."),
        ("Data protection impact assessment", "A process to identify and reduce data protection risks before high-risk processing begins."), ("Test set", "A fixed list of questions with agreed answers used to check quality over time.")])
    b.art_back("Give your AI<br>something good to read.", "We help organisations get their data and permissions ready for AI, from oversharing reviews and labelling to connecting the right sources securely.", "Book a data readiness review", "No. 13 · AI skills for every team")
    return b
