from aikit import AIBook

def build():
    b = AIBook("Open Weights, Open Questions", num=3, art="liquid", pos="72%")
    b.how = "What open-weight models really are, how to run them, what they cost to look after, how to keep them safe and when they are the right choice for your business."
    b.art_cover("Playbook No. 03 · Open-source AI", "Open weights,", "open questions.", "A practical guide to running open models in your business: the licences, the hardware, the hidden work and the cases where it genuinely pays.")
    b.contents()
    b.mark("", "Foreword"); b.foreword("Free to download is not the same as free to run.", [
        "Open-weight AI models have become genuinely capable. Families such as Llama, Mistral, Qwen, DeepSeek and Gemma can be downloaded, run on infrastructure you choose and adapted to your own work. For some organisations that is exactly what they need: data that never leaves their control, predictable costs at high volume and freedom from any single supplier.",
        "But open models arrive with questions that hosted services quietly answer for you. Which licence applies, and does it allow your use? Where will the model run, and on what hardware? Who keeps it patched, monitored and safe? Is the file you downloaded really what it claims to be?",
        "This playbook works through those questions in plain English. It is not a case for or against open models. It is a guide to running them well, if you decide they fit. Our companion playbook, No. 04, covers how to choose between open and frontier models in the first place."])
    b.mark("", "Introduction"); b.intro("Introduction", "Control comes with responsibility attached.", "With a hosted AI service, the provider runs the model, secures it, scales it and updates it. With an open-weight model, those jobs become yours or your partner's. The prize is control. The price is work that has to be planned, staffed and paid for.",
        [("contract", "Read the licence first", "Open-weight licences range from fully permissive to tightly restricted. Your use case has to fit the terms."),
         ("server", "Choose where it runs", "On your own hardware, in a private cloud or through a managed endpoint. Each shifts cost and effort differently."),
         ("shield", "Treat models as software", "Check where they came from, scan the files, test the behaviour and keep them updated like any other dependency.")])
    b.statement("An open model gives you the keys. You still have to look after the car.", "The freedom to run AI on your own terms is real. So is the maintenance, security and skills bill that comes with it.", "Introduction")

    b.mark("01", "What open really means"); b.opener("01", "What open<br>means.", "Open weights, open source and the licences in between, plus the main model families.", [("01", "Weights versus source"), ("02", "The licence spectrum"), ("03", "Model families and licence checks")])
    b.essay("Definitions", "Open weights are not the same as open source", [
        "An AI model is, in simple terms, a large file of numbers called weights, produced by training on vast amounts of data. When a developer publishes those weights for anyone to download, the model is described as open-weight. You can run it yourself, inspect how it behaves and adapt it.",
        "That is not the same as open source in the traditional software sense. Open source normally means you can use, study, change and share the work for any purpose, under a recognised licence. Many open-weight models do not meet that bar. The training data is rarely published, the training code may be withheld, and the licence may restrict how, where or by whom the model can be used.",
        "The Open Source Initiative has published a definition of open source AI that asks for more than the weights alone, including enough information about the training data and code to understand and rebuild the model. Few popular models fully meet it. In everyday use, people often say open source when they mean open-weight, so it pays to ask exactly what has been released.",
        "Licences are where this matters most. Some models are released under permissive licences such as Apache 2.0 or MIT, which allow commercial use with few conditions. Others use bespoke licences written by the developer, which may include acceptable use policies, conditions for very large companies or requirements to credit the model in your product. A few are released for research or non-commercial use only.",
        "Terms also change between versions. A developer may release one model under a permissive licence and the next under its own terms, or update an acceptable use policy after release. Treat every model, and every version, as needing its own check.",
        "None of this makes open-weight models a poor choice. It means the word open tells you less than it seems, and your legal and technical teams need to look at the actual terms before anything reaches production."],
        "What open means", "Always ask what has been released: the weights, the code, the data, or just a download link and a licence.")
    b.table("The licence spectrum", "From permissive to restricted", "Licence terms vary by model family and often by version. This is orientation, not legal advice, so read the actual licence for every model you use.", ["Licence type", "What it typically allows", "What to check"],
        [("Permissive", "Commercial use, modification and redistribution, such as Apache 2.0 or MIT.", "Attribution and notice requirements, and any patent terms."),
         ("Developer's own licence", "Commercial use under the developer's terms and acceptable use policy.", "Restricted uses, size thresholds, naming and credit requirements."),
         ("Non-commercial or research", "Experimentation, study and research only.", "Whether your pilot quietly becomes commercial use."),
         ("Fully open source AI", "Weights, code and training data information released under open terms.", "Rare in practice. Confirm what has actually been published."),
         ("Fine-tuned derivatives", "Usually inherit the base model's licence, plus any extra terms.", "The base model's licence and the derivative author's terms.")], "What open means", "44mm 1fr 1fr")
    b.grid("Model families", "The main open-weight families, in brief", "Each family spans several sizes and versions, and releases arrive often. Capabilities and licences change, so check the current position before you choose.",
        [("server", "Llama", "From Meta. Widely used and well supported by tools and hosts. Released under Meta's own licence and acceptable use policy."),
         ("compass", "Mistral", "From a French company. Some models under permissive licences, others under commercial or research terms."),
         ("transfer", "Qwen and DeepSeek", "From Chinese developers, with strong models and many under permissive licences. Weigh provenance, and do not confuse the weights with their hosted apps."),
         ("laptop", "Gemma and others", "Google's Gemma has its own terms of use. OpenAI, Microsoft and IBM, among others, also publish open-weight models.")], "What open means",
        "Running downloaded weights in your own environment is different from using a developer's hosted app. Data protection questions differ for each.")
    b.dive("01", "contract", "Licence checks before you build", "A short, documented licence check avoids the painful discovery that a product you have built is not allowed to ship.",
        [("Find the real licence", "Read the licence attached to the exact model and version, not a summary on a blog or a model hub listing."),
         ("Check your use", "Confirm that commercial use, your sector, your user numbers and any customer-facing use are all permitted."),
         ("Follow the chain", "For fine-tuned models, check both the base licence and the terms added by whoever fine-tuned it."),
         ("Record and revisit", "Keep a copy of the licence and acceptable use policy in your AI register, and recheck at every model upgrade.")], "What open means", "Your legal lead, with the technical owner of the model")

    b.mark("02", "Running open models"); b.opener("02", "Run it<br>well.", "Where to host, what hardware it needs, how to adapt it and how to keep the supply chain clean.", [("01", "Deployment options and costs"), ("02", "Retrieval or fine-tuning?"), ("03", "From download to production, safely")])
    b.table("Deployment options", "Four places an open model can run", "The same model can run in very different ways. Choose by data sensitivity, volume, skills and how much infrastructure you want to own.", ["Option", "How it works", "Suits", "Trade-offs"],
        [("On-premises", "Your own servers with suitable GPUs, in your own data centre.", "Strict data control and steady, high volume.", "Upfront hardware, power, cooling and specialist skills."),
         ("Private cloud", "GPU instances you rent and manage in your cloud account.", "Control without buying hardware.", "You still manage the stack. GPU costs need watching."),
         ("Managed endpoint", "A cloud service such as Amazon Bedrock, Azure or Google Cloud hosts the model for you.", "Fast start, less operations work.", "Less control over the stack. Model choice and terms vary."),
         ("Laptop or edge", "Small models running on a device or on-site box.", "Offline, low-latency or experimental use.", "Limited capability. Harder to manage at scale.")], "Running it", "30mm 1fr 1fr 1fr")
    b.essay("Hardware and running costs", "Where the money really goes", [
        "Downloading an open model costs nothing. Running it well does. The biggest cost is usually compute: AI models need graphics processors, or GPUs, with enough memory to hold the model and serve requests quickly. Larger models need more memory, and often several GPUs working together.",
        "The size of the model drives almost everything. Small models can run on a single modest GPU or even a capable laptop. Mid-sized models need data centre GPUs. The largest open models need serious, expensive hardware. Techniques such as quantisation shrink models so they need less memory, usually with some loss of quality that you should test rather than assume.",
        "Utilisation decides whether the economics work. A GPU you own or rent costs roughly the same whether it is busy or idle. If your workload is steady and high volume, that fixed cost can compare well with paying per request for a hosted service. If demand is occasional or spiky, you pay for a lot of idle capacity. Managed endpoints that charge by usage avoid that problem, at the cost of some control.",
        "Then come the costs that rarely appear in the first estimate. Engineers to set up and tune serving software. Monitoring, logging and security tooling. Testing every new model version before it goes live. Redundancy, so that one failed server does not take your service down. Power and cooling, if you run your own kit.",
        "GPU prices, availability and cloud pricing all move quickly, so build your estimate from current quotes and revisit it at least yearly. Compare like with like: the same task, at the same quality, at realistic volumes.",
        "The honest summary is that open models tend to pay off at scale, with steady demand and in-house skills. For smaller or uncertain workloads, a managed endpoint or a hosted service is often cheaper once everything is counted."],
        "Running it", "An idle GPU costs the same as a busy one. Volume and steadiness decide whether self-hosting pays.")
    b.compare("Adapting a model", "Retrieval or fine-tuning?", "Two ways to make a general model useful for your business. Most organisations should start with retrieval and fine-tune only for a clear reason.", ["Question", "Retrieval (RAG)", "Fine-tuning"],
        [("What it does", "Finds relevant documents and gives them to the model with each question.", "Further trains the model on your examples to change how it behaves."),
         ("Best for", "Answering from your policies, products, contracts and knowledge base.", "A consistent style, format or narrow, repetitive task."),
         ("Keeping current", "Update the documents and answers change straight away.", "Needs retraining when your material or needs change."),
         ("Effort and cost", "Mostly data preparation and search quality.", "Curated training data, compute and careful evaluation."),
         ("Risks", "Poor search gives poor answers. Access controls on documents matter.", "Training data can leak into outputs. Quality can drop elsewhere.")], "Running it")
    b.flow("Download to production", "From download to production, step by step", "A repeatable path keeps open models safe and supportable. Rerun it for every new model or version.",
        [("magnifier", "Source", "Download from the developer's official channel or a verified organisation on a trusted model hub."),
         ("shield", "Verify and scan", "Check file hashes, prefer safe formats such as safetensors and scan files before loading them."),
         ("flask", "Evaluate", "Test quality on your own tasks, plus behaviour on harmful, biased or off-topic requests."),
         ("server", "Deploy with guardrails", "Isolated environment, least-privilege access, input and output filtering, logging."),
         ("loop", "Monitor and update", "Watch quality, cost and misuse. Track new versions and security notices for each model.")], "Running it", "Keep a record of every model in use: source, version, licence, hash, owner and the date it was last tested.")
    b.grid("Supply chain", "Four supply chain risks to manage", "An open model is third-party code and data inside your environment. Treat it with the same care as any other dependency, and some extra.",
        [("magnifier", "Provenance", "Copies and look-alike uploads appear on public hubs. Confirm you have the genuine model from its real developer."),
         ("storage", "Unsafe file formats", "Some older model formats can run hidden code when loaded. Prefer formats designed to hold only data, and scan files."),
         ("eye", "Hidden behaviour", "A tampered or poorly trained model can behave badly only in specific situations. Test widely and monitor outputs."),
         ("wrench", "Software around it", "Serving tools, libraries and containers carry their own vulnerabilities. Patch them like any other software.")], "Running it",
        "Our playbook No. 11, Securing AI, covers wider AI security. These are the risks specific to bringing model files in-house.")

    b.mark("03", "Deciding if it is right for you"); b.opener("03", "Is it<br>for you?", "When open models make sense, the full cost of ownership and the skills you will need.", [("01", "Three real situations"), ("02", "When it pays, and when it does not"), ("03", "Total cost and skills")])
    b.usecase("In practice", "Three organisations, three open-model decisions", [
        ("contract", "Professional services", "Searching confidential client files", [("The need", "Answers from sensitive documents that must not leave a controlled environment."), ("The approach", "A mid-sized open model with retrieval, hosted in their private cloud."), ("What good looks like", "Fast, sourced answers, with access respecting existing document permissions."), ("Watch out", "Search quality matters more than model size. Test with real questions.")]),
        ("truck", "Manufacturing", "Help on the factory floor", [("The need", "Guidance for technicians at sites with patchy connectivity."), ("The approach", "A small model on an on-site server, grounded in equipment manuals."), ("What good looks like", "Quick answers that work offline, with manuals as the source of truth."), ("Watch out", "Someone has to update and patch every site's server.")]),
        ("sliders", "Online retailer", "Tagging product data at volume", [("The need", "Classifying and tidying large volumes of product descriptions every day."), ("The approach", "A fine-tuned small model on rented GPUs, running in batches."), ("What good looks like", "Consistent tags at a steady, predictable cost per item."), ("Watch out", "Compare against a hosted model first. Small volumes rarely justify the effort.")])], "Is it for you?")
    b.matrix("When it pays", "When an open model makes sense", "Two factors predict success more than any other: how much control you need over data and behaviour, and whether you have steady volume and the skills to run it.", "Volume and in-house skills", "Need for control",
        [("Managed open endpoint", "High control, low volume", "Data rules matter but volume is modest. A managed endpoint in your chosen region often fits."), ("Self-host", "High control, high volume", "Sensitive data, steady demand and a capable team. The strongest case for running your own."),
         ("Use a hosted service", "Low control, low volume", "Everyday or occasional use. A business-grade hosted assistant or API is simpler and usually cheaper."), ("Test both", "Low control, high volume", "Cost may favour open models at scale. Compare total cost and quality on your own tasks.")], "Is it for you?")
    b.table("Total cost of ownership", "What to count before you commit", "The model is free. These are not. Put a figure against each line, over three years, before comparing with a hosted alternative.", ["Cost line", "What it includes", "Often forgotten"],
        [("Compute", "GPUs bought or rented, plus storage and networking.", "Idle capacity, redundancy and test environments."),
         ("People", "Engineers to deploy, tune, monitor and support the model.", "Cover for holidays, sickness and staff leaving."),
         ("Operations", "Monitoring, logging, security tooling and patching.", "Out-of-hours support for anything customer-facing."),
         ("Evaluation", "Building test sets and testing every new version.", "Retesting when your data, prompts or use change."),
         ("Facilities", "Power, cooling and space for on-premises hardware.", "Hardware refresh as models outgrow it."),
         ("Governance", "Licence checks, DPIAs, records and reviews.", "Legal time when licence terms change.")], "Is it for you?")
    b.steps("Skills", "The skills you will need, in-house or from a partner", "Running open models is a team sport. You may not need all of these full-time, but someone must cover each.",
        [("Machine learning engineering", "Choosing, evaluating, quantising and, where needed, fine-tuning models."),
         ("Platform and infrastructure", "Running GPUs, containers and serving software reliably and efficiently."),
         ("Data engineering", "Preparing documents and data for retrieval, and keeping them current."),
         ("Security", "Supply chain checks, access control, monitoring and incident response."),
         ("Product ownership", "Defining the job, measuring quality and deciding when the model is good enough."),
         ("Legal and data protection", "Licence checks, DPIAs and supplier terms for any managed services.")], "Is it for you?",
        "If several of these are gaps, start with a managed endpoint or a partner, and build skills before you build infrastructure.")
    b.questions("Ask your team", "Questions before you go open", "Clear answers to these predict a smooth project. Vague ones predict surprises.",
        [("Purpose and fit", ["What specific job will the model do, and why does a hosted service not fit?", "Does the licence allow our use today, and who will recheck it at each upgrade?", "How will we know the model is good enough, and on which test set?"]),
         ("Running and owning it", ["Where will it run, and what will it cost over three years, people included?", "Who patches, monitors and supports it, including out of hours?", "How do we verify the model files are genuine and safe to load?"])], "Is it for you?")
    b.checklist("Checklist", "Ready to run an open model?", "Tick what is in place. Gaps are best closed before the first model reaches production.",
        [("A clear use case and reason to go open", "Control, cost at volume or customisation."), ("Licence checked for the exact model and version", "Recorded in your AI register."), ("A deployment option chosen", "On-premises, private cloud or managed endpoint."),
         ("A three-year cost estimate", "Including people, operations and evaluation."), ("Model files verified and scanned", "From an official source, in a safe format."), ("An evaluation set built from your own work", "Rerun for every new version."),
         ("Named owners for operations and security", "With cover and an escalation route.")], "Is it for you?", "Licence terms change. Treat this as a starting point and take legal advice on your specific use.")
    b.glossary("Words worth knowing", [("Weights", "The learned numbers that make up a trained AI model."), ("Open-weight model", "A model whose weights are published for others to download and run."),
        ("Open source AI", "A model released with weights, code and training data information under open terms."), ("Permissive licence", "A licence such as Apache 2.0 or MIT that allows broad commercial use."),
        ("Acceptable use policy", "A developer's list of uses its licence does not allow."), ("GPU", "A graphics processor, the main hardware used to run AI models."),
        ("Quantisation", "Shrinking a model so it needs less memory, usually with some loss of quality."), ("Inference", "Running a trained model to produce answers, as opposed to training it."),
        ("RAG", "Retrieval-augmented generation: giving the model relevant documents with each question."), ("Fine-tuning", "Further training a model on your own examples to change its behaviour."),
        ("Safetensors", "A model file format designed to store weights without running hidden code."), ("Managed endpoint", "A cloud service that hosts a model for you and charges for use.")])
    b.art_back("Run open models<br>with your eyes open.", "We help organisations decide whether open models fit, choose where to run them, and set them up securely with the monitoring and support they need.", "Book an open-model review", "No. 04 · Open vs frontier: the honest comparison")
    return b
