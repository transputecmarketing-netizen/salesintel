from aikit import AIBook

def build():
    b = AIBook("The Valley Effect", num=5, art="bloom", pos="75%")
    b.how = "Who is building the AI your business uses, how it reaches your desk, and how to keep your options open as the market settles."
    b.art_cover("Playbook No. 05 · The AI landscape", "The Valley effect.", "Who is shaping AI, and how it reaches you.", "A clear, balanced guide to the companies building today's AI, the forces driving them, and what it all means for a UK business that wants choice, not dependency.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("The AI you use is shaped by decisions made a long way from your office.", [
        "A small number of companies, most of them in the United States, build the models behind the assistants your people use every day. Their choices about pricing, features, data handling and safety arrive in your business through software updates you did not ask for and contracts you rarely read.",
        "That is not a reason for alarm. These companies have built remarkable tools, and competition between them has made those tools better and more widely available very quickly. But it is a reason for leaders to understand who the players are, how their incentives work and where the points of leverage sit.",
        "This playbook gives you that map. It explains who is shaping AI, how it reaches you through the platforms you already pay for, how governments are responding, and what a sensible UK business can do to stay flexible, keep control of its data and avoid being locked into a single supplier."])
    b.mark("", "Introduction"); b.intro("Introduction", "Know the map before you pick the route.", "AI arrives through a handful of channels: the productivity suite you already own, the cloud platform you build on, and the assistants your people choose for themselves. Understanding who sits behind each channel helps you make choices that still look sensible in three years.",
        [("compass", "Know who is behind your tools", "Most AI features are built on a small number of underlying model families. Knowing which ones you rely on is the first step to managing the risk."),
         ("sliders", "Treat models as replaceable parts", "The leading models leapfrog each other regularly. Design your use of AI so that swapping one model for another is a decision, not a project."),
         ("shield", "Keep your data on your terms", "Where data is processed, how it is retained and whether it is used for training are contract questions. Ask them before you sign, not after.")])
    b.statement("A few companies build the engines. Every business has to decide how to drive them.", "Concentration at the top of the market is a fact. Dependency in your own business is a choice.", "Introduction")

    b.mark("01", "Who is shaping AI"); b.opener("01", "The power<br>map.", "Who builds the frontier models, what drives them, and why so few firms sit at the top.", [("01", "Compute, capital and talent"), ("02", "The main players"), ("03", "Beyond Silicon Valley")])
    b.essay("Who is shaping AI", "Why so few firms sit at the frontier", [
        "Building a leading AI model takes three things in enormous quantity: computing power, capital and specialist talent. Training the largest models requires vast clusters of specialised chips running for long periods, in data centres that draw as much power as a small town. Very few organisations can marshal those resources, which is why the frontier is dominated by a short list of names.",
        "Compute is the tightest bottleneck. Nvidia's graphics processors and software have become the default foundation for training and running large models, and demand for them has shaped the whole industry. The large cloud providers, Microsoft, Amazon and Google, are building their own chips and data centres at huge scale, partly to reduce that reliance and partly to sell capacity to everyone else.",
        "Capital follows compute. The leading labs have formed deep partnerships with the cloud giants: OpenAI with Microsoft, Anthropic with Amazon and Google, while Google DeepMind and Meta draw on the resources of their parent companies. These partnerships matter to you because they influence which models appear first, and most smoothly, on which platforms.",
        "Talent is the third constraint. The researchers and engineers who can build and train frontier systems are a small community, concentrated in a few cities, and they move between labs often. Ideas spread quickly as a result, which is one reason no lab stays ahead for long.",
        "The outcome is a frontier race in which capabilities improve quickly and leadership changes hands regularly. For a business buyer, that is broadly good news: competition keeps quality rising and gives you alternatives. The risk is not that the technology stalls. It is that you build your processes so tightly around one supplier that you cannot take advantage when another moves ahead."],
        "Who is shaping AI", "The frontier changes hands often. Build so that you can change with it.")
    b.table("The main players", "Who builds what, and how it reaches you", "A simplified view of the companies most UK businesses will meet. Product names and partnerships change often, so check current details.", ["Company", "What they build", "How it usually reaches you"],
        [("OpenAI", "The GPT model family and the ChatGPT assistant.", "ChatGPT plans, its own API, and Microsoft's Azure platform."),
         ("Anthropic", "The Claude model family, with a strong focus on safety research.", "Claude apps, its own API, and the major cloud platforms."),
         ("Google DeepMind", "The Gemini model family, plus scientific AI research.", "Google Workspace, Android, Search and Google Cloud."),
         ("Meta", "The Llama family of open-weight models and the Meta AI assistant.", "WhatsApp, Instagram and Facebook, and as downloadable models."),
         ("Microsoft and Amazon", "Platforms that host many models, plus some models of their own.", "Microsoft 365 Copilot, Azure, and AWS services such as Bedrock."),
         ("xAI", "The Grok model family.", "The X platform, Grok apps and its own API.")], "Who is shaping AI", widths="36mm 1fr 1fr")
    b.grid("Beyond the Valley", "The challengers outside Silicon Valley", "The frontier is not only American. Strong alternatives come from Europe, China and the open-weight community.",
        [("compass", "Mistral, France", "A European lab offering both open-weight and commercial models, plus its own assistant. Often considered by firms who want a European supplier."),
         ("server", "DeepSeek, China", "Released capable open-weight models that drew wide attention for their efficiency, sharpening the debate about how much compute the frontier really needs."),
         ("storage", "Qwen, China", "Alibaba's model family, with many versions released as open weights and widely used by developers around the world."),
         ("transfer", "The open-weight ecosystem", "Thousands of adapted models built on releases from Meta, Mistral, Chinese labs and others, which firms can run on their own infrastructure.")], "Who is shaping AI",
        "Open-weight models from any country can be run in your own environment, but check licence terms and data handling with care before using them in the business.")

    b.mark("02", "How AI reaches you, and the rules around it"); b.opener("02", "How it<br>reaches you.", "AI rarely arrives as a purchase decision. It arrives inside the software you already use.", [("01", "Platform distribution"), ("02", "Built in or chosen"), ("03", "Regulation and safety"), ("04", "Open weights explained")])
    b.essay("Distribution", "The assistant arrives with the software you already own", [
        "For most businesses, the first serious AI tool was not chosen. It appeared in a menu. Microsoft has built Copilot into Microsoft 365 and Windows, Google has built Gemini into Workspace and Android, and Apple and Samsung are building assistants into phones. The model behind the button is often invisible to the user.",
        "This is the most powerful force in the market. A lab with an excellent model still needs distribution, and the companies that own the operating systems, office suites and cloud platforms control the most valuable shelf space. That is why partnerships between labs and platforms matter so much, and why the same model can feel quite different depending on where you meet it.",
        "Built-in assistants have real advantages. They sit inside your existing security boundary, they can see the documents and emails your people already have access to, and they are managed through admin tools your IT team knows. For many everyday tasks, that convenience wins.",
        "The trade-off is choice. When AI comes bundled with a suite, the suite owner decides which model you use, how it is priced and when features change. Specialist assistants such as Claude or ChatGPT, used directly, may be stronger for particular tasks such as long-document analysis, writing or coding, and give you a second option if the bundled tool falls short.",
        "Cloud platforms add a third route. Amazon Bedrock, Google Cloud Vertex AI and Microsoft's Azure AI services each offer models from several labs through one account. For businesses building their own AI features, that makes switching between models much easier than it would otherwise be.",
        "The practical lesson is to know which route each of your AI tools arrived by, and who controls it. That single inventory is the basis of every sensible decision in the rest of this playbook."],
        "Distribution", "The company that owns the menu decides which AI appears in it.")
    b.compare("Built in or chosen", "Bundled assistants and specialist tools", "Most organisations will end up using both. The question is which job goes where.", ["", "Built into your suite", "Chosen specialist assistant"],
        [("Best for", "Everyday tasks inside email, documents, meetings and chat.", "Deep work such as long analysis, complex writing, research and code."),
         ("Data access", "Sees what the user can already see in the suite.", "Sees what you give it, or what you connect it to."),
         ("Control", "Managed through the admin tools you already use.", "Needs its own admin settings, policy and licensing."),
         ("Choice of model", "Decided largely by the suite provider.", "You choose the model and can change it."),
         ("Main risk", "Lock-in and paying for features nobody uses.", "Sprawl, if teams buy tools without central oversight.")], "Built in or chosen")
    b.table("Rules and safety", "How governments are responding", "Approaches differ sharply by region and are changing fast. Treat this as orientation, not legal advice, and check the current position.", ["Region", "Broad approach", "What it means for you"],
        [("European Union", "The AI Act: a risk-based law with obligations phased in over several years, including rules for general-purpose models.", "Relevant if you sell into or operate in the EU, or use AI in high-risk areas."),
         ("United Kingdom", "A principles-based approach led by existing regulators, with UK GDPR and ICO guidance applying to personal data.", "Your sector regulator and data protection duties are the main guide."),
         ("United States", "No single federal AI law. Policy has shifted between administrations, and several states have passed their own rules.", "Supplier terms and features may change as US policy moves."),
         ("China", "Specific rules for generative AI and algorithms, with content and registration requirements.", "Relevant when using Chinese models or services. Check data flows."),
         ("Frontier safety", "Labs publish their own safety policies, and government AI security institutes test leading models.", "Ask suppliers how they test and govern their models.")], "Rules and safety", widths="34mm 1fr 1fr")
    b.dive("01", "transfer", "Open weights, explained", "Some models are released so anyone can download and run them. That brings real flexibility, and some responsibilities that hosted services handle for you.",
        [("What it means", "The trained model is published, so you can run it on your own servers or a cloud provider of your choice."),
         ("Why it helps", "Data can stay in an environment you control, costs are more predictable, and no single supplier can switch it off."),
         ("The trade-offs", "You take on hosting, security, updates and safety testing. Licences vary and some carry restrictions."),
         ("When to consider it", "Sensitive data, high volumes of routine tasks, or a need to fine-tune a model on your own material.")], "Open weights", "Your IT lead or managed service partner")

    b.mark("03", "What it means for a UK business"); b.opener("03", "Stay<br>flexible.", "Dependency, pricing power, choice and sovereignty, and how to keep your options open.", [("01", "Four exposures"), ("02", "Three real situations"), ("03", "Five rules for flexibility")])
    b.grid("Your exposures", "Four ways the Valley reaches your balance sheet", "Every business using AI carries some version of these. The aim is to see them clearly, not to avoid AI.",
        [("power", "Dependency", "If one supplier's assistant runs a core process, an outage, policy change or price rise lands directly on your operations."),
         ("tag", "Pricing power", "AI is often sold in bundles and tiers. Once workflows depend on it, your negotiating position weakens."),
         ("sliders", "Choice", "Bundled tools can crowd out better options for specific jobs. Keep the freedom to use the right tool for each task."),
         ("storage", "Sovereignty", "Where data is processed and stored, and under which legal regime, matters to clients, regulators and insurers.")], "What it means for you",
        "None of these is a reason to wait. They are reasons to buy with your eyes open and to keep an exit route.")
    b.usecase("In practice", "Three businesses, three sensible positions", [
        ("laptop", "Professional services", "A firm built on Microsoft 365", [("The situation", "Copilot is available across the suite and partners want a quick start."), ("The exposure", "Every AI workflow depends on one supplier's roadmap and pricing."), ("The flexible choice", "Use Copilot for everyday tasks and approve one specialist assistant for deep analysis."), ("Watch out", "Review licence counts against real use each quarter.")]),
        ("shield", "Regulated sector", "A firm with strict data residency needs", [("The situation", "Client contracts require UK or European data processing."), ("The exposure", "Some AI features process data in other regions by default."), ("The flexible choice", "Use enterprise plans with regional processing, or open-weight models in your own cloud."), ("Watch out", "Get data location and retention terms in writing.")]),
        ("wrench", "Software business", "A company building AI into its product", [("The situation", "Customer-facing features call a model through an API."), ("The exposure", "A price change or model retirement could break margins or features."), ("The flexible choice", "Access models through a layer that lets you swap providers, and test alternatives regularly."), ("Watch out", "Keep your own evaluation tests so you can compare models fairly.")])], "What it means for you")
    b.table("Staying flexible", "From exposure to sensible response", "Practical steps that cost little now and save a great deal later.", ["Concern", "What it looks like", "How to stay flexible"],
        [("Lock-in", "Processes, prompts and data built around one tool.", "Keep prompts, templates and data in formats you own and can move."),
         ("Price rises", "Per-seat AI add-ons creeping across the whole organisation.", "License by role and need, and review usage before renewal."),
         ("Model changes", "A model you rely on is updated or retired.", "Keep a short set of test tasks and rerun them when models change."),
         ("Data location", "Processing in regions your clients did not agree to.", "Choose plans with regional processing and confirm it contractually."),
         ("Supplier failure", "An outage or policy change stops a critical process.", "Have a second approved tool and a manual fallback for key work."),
         ("Shadow AI", "Staff using personal accounts because approved tools fall short.", "Offer good approved options and make them easy to reach.")], "What it means for you", widths="30mm 1fr 1fr")
    b.principles("Principles", "Five rules for staying in control", "The businesses that do well will use the best of the Valley without being owned by it.",
        [("Know your supply chain", "List every AI tool in use, the model behind it, and the company that controls it."),
         ("Own your assets", "Your prompts, templates, evaluation tests and data are yours. Store them where you can take them elsewhere."),
         ("Keep at least two options", "Approve a second assistant or model for important work, so a single change never stops you."),
         ("Read the data terms", "Confirm where data is processed, how long it is kept and whether it is used for training."),
         ("Review every year", "The market moves quickly. Revisit your choices at each renewal, with real usage and results in hand.")], "What it means for you")
    b.questions("Before you renew", "Questions to ask your suppliers and your board", "Use these at renewal time, or before adding any new AI tool.",
        [("For suppliers", ["Which model powers this feature, and will you tell us when it changes?", "Where is our data processed and stored, and is it used for training?", "What notice will we get of price or product changes?", "How do we export our data, prompts and settings if we leave?"]),
         ("For your board", ["Which critical processes depend on a single AI supplier?", "What would we do if that supplier changed its terms tomorrow?", "Are we paying for AI features that people do not use?"])], "What it means for you")
    b.checklist("Checklist", "Is your AI supply chain resilient?", "Tick what is true today. Anything blank is worth a conversation.",
        [("An inventory of AI tools and the models behind them", "Including features built into existing software."), ("Data processing terms confirmed for each tool", "Location, retention and training use."), ("A second approved option for critical work", "Tested, not just named."),
         ("Prompts and templates stored in a shared, portable library", "Not locked inside one product."), ("Licences matched to real usage", "Reviewed before each renewal."), ("A simple test set to compare models", "Rerun when suppliers change models."),
         ("A named owner for AI suppliers", "Who tracks changes in terms, pricing and regulation.")], "What it means for you")
    b.glossary("Words worth knowing", [("Frontier model", "One of the most capable AI models available at a given time, usually from a large lab."), ("Compute", "The processing power, mostly specialised chips, used to train and run AI models."),
        ("GPU", "A graphics processing unit. The chip type most widely used for AI work."), ("Open-weight model", "A model whose trained parameters are published, so others can download and run it."),
        ("Closed model", "A model available only as a hosted service from its developer or partners."), ("API", "A way for software to send requests to a model and receive answers."),
        ("Model family", "A set of related models from one lab, often in different sizes and speeds."), ("Data residency", "Where data is physically stored and processed."),
        ("Sovereignty", "Control over data and systems under the laws and jurisdiction you choose."), ("Lock-in", "When switching supplier becomes too costly or disruptive to be practical."),
        ("EU AI Act", "The European Union's risk-based law governing how AI systems are built and used."), ("Bundled AI", "AI features included in, or sold as add-ons to, software you already use.")])
    b.art_back("Use the best of AI,<br>on your terms.", "We help UK organisations choose AI tools with clear eyes, set them up securely, keep data where it belongs and stay free to change course as the market moves.", "Book an AI strategy session", "No. 06 · The first 90 days of AI")
    return b
