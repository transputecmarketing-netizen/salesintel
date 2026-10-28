from pbkit import Book

def w1():
    b = Book("Decision or delivery", "Week 1 · AWS")
    b.how = "A practical guide to buying the right kind of AWS help. Read it end to end, or jump to the worksheet before your next supplier conversation."
    b.cover("Week 1 · AWS", "Decision", "or delivery?", "AWS consultancy and AWS managed services sound alike. They are two different purchases. This playbook helps you buy the one you actually need.", ["compass", "loop", "server", "check"], "AWS playbook")
    b.contents()
    b.mark("", "Introduction"); b.intro("Introduction", "Two purchases that sound the same.", "Most AWS conversations start with a vague request for help. The first job is to decide which kind of help you are buying, because the contract, the team and the measure of success are all different.",
        [("compass", "Consultancy buys a decision", "Advice, design and a defined piece of work that ends with a clear recommendation or a finished change."),
         ("loop", "A managed service buys delivery", "A team that runs the estate every day: monitoring, patching, backups, support and cost reporting against agreed service levels."),
         ("contract", "Mixing them up is expensive", "Buy advice when you needed operations and nothing gets run. Buy operations when you needed a decision and you pay to run the wrong thing well.")])
    b.mark("01", "Know the difference"); b.opener("01", "Know the<br>difference.", "Side by side, the two look nothing alike once you ask what you get at the end.", [("01", "Consultancy vs managed service"), ("02", "When you need a consultancy"), ("03", "When you need a managed service")])
    b.compare("Side by side", "What you are actually buying", "Use this table to test any proposal. If the answers on the page do not match the column you meant to buy, stop and ask why.",
        ["", "Consultancy", "Managed service"],
        [("The outcome", "A decision, a design or a completed project.", "An estate that is run, watched and improved every day."),
         ("Duration", "Fixed. It has a start, an end and a handover.", "Ongoing. It renews and evolves with the business."),
         ("How it is priced", "By project, phase or day rate.", "By a recurring service fee, usually tied to scope."),
         ("Success looks like", "A clear recommendation you can act on.", "Service levels met, incidents handled, costs kept in check."),
         ("Who owns the outcome", "You own the decision. They own the quality of the advice.", "They own day to day operations. You own the priorities."),
         ("Typical deliverables", "Assessments, architecture, migration plans, a cost or security review.", "Monitoring, patching, backup, support desk, monthly reporting."),
         ("When it ends", "When the work is delivered and handed over.", "When you choose to exit, using the exit plan agreed up front.")], "Know the difference")
    b.grid("Signals", "When you need a consultancy", "You need a decision, a design or a one-off change, and you have, or will have, people to run what comes after.",
        [("compass", "You are planning a move", "A migration, a re-platform or a new region, and you need a plan the board can sign off."),
         ("magnifier", "Something needs a second opinion", "A cost, security or resilience review before you commit more budget."),
         ("sliders", "The architecture has drifted", "The estate grew project by project and nobody can explain the whole design any more."),
         ("check", "A decision is waiting on evidence", "Leaders want options, risks and a recommendation, not a running service.")],
        "Know the difference", "Ask: at the end of this work, what decision will we be able to make that we cannot make today?")
    b.grid("Signals", "When you need a managed service", "You know what the estate should look like. What is missing is the capacity to run it well, every day.",
        [("bell", "Alerts go unanswered", "Monitoring exists, but nobody is clearly responsible for acting on it out of hours."),
         ("shield", "Patching and backups slip", "Routine work loses to project work, and the gaps only show during an incident."),
         ("wrench", "Your team is firefighting", "Skilled engineers spend their week on tickets instead of the roadmap."),
         ("loop", "Cost needs watching, not fixing once", "Spend creeps back after every clean-up because nobody reviews it each month.")],
        "Know the difference", "Ask: who will run this at two in the morning, and how will we know it was handled?")
    b.mark("02", "Avoid the expensive mistakes"); b.opener("02", "Avoid the<br>costly mistakes.", "Most problems come from buying one kind of help and expecting the other.", [("01", "Five common mistakes"), ("02", "Questions to ask before you buy"), ("03", "Decision worksheet")])
    b.steps("Common mistakes", "Five ways the purchase goes wrong", "Each of these is common, and each is avoidable with one clear conversation before the contract is signed.",
        [("Expecting a consultancy to run things", "The report lands, the team leaves and nobody is responsible for the changes it recommended."),
         ("Expecting a managed service to set strategy", "The estate runs smoothly in the wrong direction because nobody owns the design decisions."),
         ("Scoping by hours, not outcomes", "Time gets used, but the decision or the service level you needed is never defined."),
         ("No handover or exit plan", "Knowledge leaves with the supplier, or switching later becomes painful and slow."),
         ("Nobody owns the cost", "Advice and operations both assume the other side is watching the bill.")], "Avoid the mistakes",
        "Many organisations need both, in sequence: a consultancy to decide what good looks like, then a managed service to keep it that way.")
    b.questions("Before you buy", "Questions to take into the room", "Ask these of any AWS partner. Clear, specific answers are a good sign. Vague ones tell you what you need to know.",
        [("Ask a consultancy", ["What decision or deliverable will we have at the end?", "Who on your team will do the work, and who will we hand over to?", "How will you leave us able to run what you design?", "What is explicitly out of scope?"]),
         ("Ask a managed service provider", ["What are the service levels, and how are they reported?", "Who responds out of hours, and how quickly?", "How do you report and control our AWS cost each month?", "What does exit look like if we part ways?"])], "Avoid the mistakes")
    b.checklist("Worksheet", "Which one do you need?", "Tick the statements that are true today. Mostly in the first group points to consultancy. Mostly in the second points to a managed service. A mix usually means both, in that order.",
        [("We do not yet know what the estate should look like", "Points to consultancy."), ("A board or leadership decision is waiting on options", "Points to consultancy."), ("We need an independent cost or security review", "Points to consultancy."),
         ("We know the target, but lack people to run it", "Points to a managed service."), ("Alerts, patching or backups are slipping", "Points to a managed service."), ("We need cover outside working hours", "Points to a managed service."),
         ("Cost creeps back after every clean-up", "Points to a managed service with monthly cost reporting.")], "Avoid the mistakes")
    b.back("Not sure which<br>you need?", "Start with a short conversation. We will help you work out whether you need a decision, someone to run the estate, or both.", "Talk to our AWS team")
    return b

def w2():
    b = Book("Where cloud cost hides", "Week 2 · FinOps")
    b.how = "Five places AWS spend hides, what each looks like, where to look in your own account and what to do first."
    b.cover("Week 2 · FinOps", "Five places your", "cloud cost hides.", "You cannot cut what you cannot see. A practical guide to the usual suspects behind a climbing AWS bill.", ["magnifier", "server", "storage", "transfer"], "FinOps playbook")
    b.contents()
    b.mark("", "Introduction"); b.intro("Introduction", "A climbing bill is rarely one big mistake.", "It is usually many small ones, running quietly where nobody is looking. The good news: they tend to hide in the same five places, and each one can be found with tools already in your AWS account.",
        [("eye", "Visibility comes first", "Before anything can be cut, someone has to see it, name it and know who owns it."),
         ("owner", "Every cost needs an owner", "Spend without an owner is spend nobody will question. Ownership turns a number into a decision."),
         ("loop", "Finding it once is not enough", "Waste returns. The habit of looking every month is what keeps the bill honest.")])
    b.mark("01", "The five usual suspects"); b.opener("01", "The five<br>usual suspects.", "Each one looks harmless on its own. Together they explain most surprise bills.", [("01", "Idle and oversized compute"), ("02", "Storage nobody deletes"), ("03", "Data on the move"), ("04", "Forgotten environments"), ("05", "Commitments that do not fit")])
    D = [("01", "server", "Idle and oversized compute", "Instances sized for a peak that never comes, or left running overnight and at weekends.",
          [("What it looks like", "Low utilisation week after week. Development servers running around the clock. Instance types chosen years ago and never revisited."),
           ("Why it happens", "Teams size for safety, and nobody is asked to size down once the system settles."),
           ("Where to look", "AWS Compute Optimizer recommendations, and CPU and memory utilisation in CloudWatch."),
           ("What to do first", "Schedule non-production to stop out of hours, then rightsize the clearest cases.")], "Engineering lead for each workload"),
         ("02", "storage", "Storage nobody deletes", "Volumes, snapshots and buckets that outlive the work they were created for.",
          [("What it looks like", "Unattached EBS volumes. Snapshots from servers long gone. Buckets with everything in the most expensive tier."),
           ("Why it happens", "Deleting feels risky, keeping feels free, and nobody owns the clean-up."),
           ("Where to look", "EBS volumes in the available state, the snapshot list sorted by age, and S3 Storage Lens."),
           ("What to do first", "Agree a retention rule, delete what is clearly orphaned and add lifecycle policies to buckets.")], "Platform or infrastructure team"),
         ("03", "transfer", "Data on the move", "Traffic between zones, regions and the internet that nobody designed to be costly.",
          [("What it looks like", "Data transfer lines growing faster than the services that cause them. NAT gateways processing more than expected."),
           ("Why it happens", "Architecture choices made for resilience or convenience, without a view of what moving data costs."),
           ("Where to look", "Cost Explorer grouped by usage type, filtered to data transfer and NAT gateway charges."),
           ("What to do first", "Find the top flows, then review VPC endpoints, placement and caching for the biggest ones.")], "Solution architect"),
         ("04", "flask", "Forgotten environments", "Test, demo and proof-of-concept stacks that outlived the project they were built for.",
          [("What it looks like", "Resources with no tags, unfamiliar names or a creator who has since left the business."),
           ("Why it happens", "Spinning up is easy and celebrated. Shutting down is nobody's job."),
           ("Where to look", "Untagged resources in Tag Editor, and stacks with no named owner or recent activity."),
           ("What to do first", "Tag or turn off. Anything with no owner after a fair notice period gets switched off.")], "Each project or product owner"),
         ("05", "contract", "Commitments that do not fit", "Paying on-demand rates for steady workloads, or committing to usage that has since moved.",
          [("What it looks like", "Steady, predictable workloads with no commitment at all, or Savings Plans that are no longer fully used."),
           ("Why it happens", "Commitments are bought once, then the estate changes underneath them."),
           ("Where to look", "Savings Plans and Reserved Instance coverage and utilisation reports in the Billing console."),
           ("What to do first", "Review coverage and utilisation before buying or renewing anything new.")], "Finance with engineering")]
    for d in D: b.dive(d[0], d[1], d[2], d[3], d[4], "The five usual suspects", d[5])
    b.mark("02", "Run your own cost hunt"); b.steps("Run it yourself", "A one-hour cost hunt", "Block an hour with one engineer and one person from finance. Work through the five suspects in this order and leave with named owners.",
        [("Open Cost Explorer and group by service", "Note the top services and anything that grew since last month."),
         ("Check compute utilisation", "List instances with consistently low use, and anything non-production running all week."),
         ("List orphaned storage", "Unattached volumes, old snapshots and buckets without lifecycle rules."),
         ("Look at data transfer lines", "Find the biggest flows and ask whether they were designed or accidental."),
         ("Review untagged resources and commitments", "Find what has no owner, then check commitment coverage and utilisation."),
         ("Assign an owner to every finding", "One name per item, with a date to come back to it.")], "Run your own cost hunt",
        "The goal of the first hour is not savings. It is a list of findings with an owner against each one.")
    b.checklist("Checklist", "The five suspects, ticked off", "Use this each month. Anything you cannot tick goes on the list with an owner.",
        [("Compute is sized to real use", "Non-production stops out of hours."), ("No unattached volumes or stale snapshots", "Retention rule agreed and applied."),
         ("Data transfer is understood", "Top flows reviewed and explained."), ("Every resource has an owner", "Untagged resources tagged or switched off."),
         ("Commitments match usage", "Coverage and utilisation checked before any purchase."), ("Findings have owners and dates", "Reviewed again next month.")], "Run your own cost hunt")
    b.back("Find yours before<br>the next invoice.", "Most estates have at least one of these. We can run the hunt with you and leave you with a clear, owned list.", "Ask for a cost review")
    return b

def w3():
    b = Book("FinOps, explained", "Week 3 · AWS · FinOps")
    b.how = "What FinOps really means, the four parts that make it work, who does what, and how to start in your first month."
    b.cover("Week 3 · AWS · FinOps", "FinOps is not a tool.", "It is a discipline.", "Visibility, accountability, optimisation and continuous review. What each one means, and how to make it a habit.", ["eye", "owner", "sliders", "loop"], "FinOps playbook")
    b.contents()
    b.mark("", "Introduction"); b.intro("Introduction", "Spending with intent, not just spending less.", "FinOps is how engineering, finance and the business work together so that every pound of cloud spend is seen, owned and deliberate. It is less about a product you install and more about how your teams behave.",
        [("eye", "It starts with seeing", "Clear, shared data on what is being spent, where and why."),
         ("owner", "It works through ownership", "Teams who build and run services also own what those services cost."),
         ("loop", "It lasts through habit", "A regular rhythm of review keeps decisions fresh as the estate changes.")])
    b.quote("FinOps is not a project with an end date. It is a habit your teams keep.", "Transputec · FinOps", "Introduction")
    b.mark("01", "The four parts"); b.opener("01", "Four parts,<br>one cycle.", "Each part supports the next. Skip one and the cycle stalls.", [("01", "Visibility"), ("02", "Accountability"), ("03", "Optimisation"), ("04", "Continuous review")])
    for n, i, t, l, q, o in [
        ("01", "eye", "Visibility", "See where every pound goes, in terms the business understands.", [("What it means", "Cost data that is timely, trusted and broken down by team, product and environment."), ("What good looks like", "Anyone can answer what a service costs and why it changed, without a spreadsheet hunt."), ("First step", "Agree a tagging standard and switch on cost allocation tags."), ("Watch out for", "Dashboards nobody opens. Visibility only counts if it is used.")], "Finance and platform team together"),
        ("02", "owner", "Accountability", "Every cost has a named owner who can explain it and act on it.", [("What it means", "The people who build and run a service also own what it costs."), ("What good looks like", "Owners see their own spend, and expect to be asked about it."), ("First step", "Map each account, product or tag to one accountable owner."), ("Watch out for", "Shared costs with no owner. Split them, or name a single owner.")], "Product and engineering leads"),
        ("03", "sliders", "Optimisation", "Spend with intent: right size, right pricing model, right time.", [("What it means", "Rightsizing, scheduling, clearing waste and matching commitments to steady use."), ("What good looks like", "Savings come from regular, small decisions rather than an annual panic."), ("First step", "Act on the clearest recommendations in Compute Optimizer and schedule non-production."), ("Watch out for", "Cutting what supports revenue. Optimise for value, not just for less.")], "Engineering, with finance input"),
        ("04", "loop", "Continuous review", "Check, adjust and repeat, on a rhythm everyone knows.", [("What it means", "A regular review of spend, anomalies, commitments and actions."), ("What good looks like", "A short monthly meeting with owners, and alerts that catch surprises between them."), ("First step", "Set AWS Budgets and Cost Anomaly Detection, then book a monthly review."), ("Watch out for", "Reviews that report but never decide. End each one with owned actions.")], "A named FinOps lead")]:
        b.dive(n, i, t, l, q, "The four parts", o)
    b.mark("02", "Myths and roles"); b.compare("Myth vs reality", "What FinOps is not", "Four common misunderstandings that stop FinOps before it starts.", ["", "Myth", "Reality"],
        [("Tooling", "FinOps is a tool you buy.", "It is a discipline your teams practise. Tools help, habits deliver."),
         ("Goal", "FinOps means cutting cost.", "It means spending with intent, which sometimes means spending more."),
         ("Ownership", "Finance owns it.", "Engineering, finance and the business share it."),
         ("Timeline", "It is a one-off project.", "It is a continuous cycle of review and improvement."),
         ("Who starts", "You need a big team first.", "One named lead and a monthly review is enough to begin.")], "Myths and roles")
    b.grid("Who does what", "Shared work, clear roles", "FinOps works when each group knows its part and meets the others regularly.",
        [("wrench", "Engineering", "Designs and runs services with cost in mind. Owns rightsizing, scheduling and clean-up."),
         ("contract", "Finance", "Owns budgets, forecasts and commitments. Turns cost data into planning."),
         ("compass", "Business leaders", "Set priorities and decide what is worth spending on."),
         ("owner", "FinOps lead", "Runs the rhythm: data, reviews, actions and follow-up.")], "Myths and roles",
        "If you only do one thing, name the FinOps lead. Everything else follows from someone owning the rhythm.")
    b.mark("03", "Your first month"); b.flow("Getting started", "Your first month of FinOps", "A simple sequence that gets the cycle turning without a big programme.",
        [("eye", "Week one: see it", "Turn on cost allocation tags, agree a tagging standard and build one shared view of spend."),
         ("owner", "Week two: own it", "Name an owner for each account or product, and share their spend with them."),
         ("sliders", "Week three: act on it", "Take the clearest optimisation actions: schedule non-production, clear orphaned storage."),
         ("loop", "Week four: review it", "Hold the first monthly review. Agree actions, owners and the next date.")], "Your first month", "Next month, repeat. That is the discipline.")
    b.back("Not a project.<br>A habit.", "We help teams set up the rhythm, the data and the ownership that make FinOps stick.", "Talk to us about FinOps")
    return b

def w4():
    b = Book("The real cost of a device fleet", "Week 4 · IT Procurement")
    b.how = "Why the purchase price is the smallest part of owning a device, and how to plan the whole lifecycle from day one."
    b.cover("Week 4 · IT Procurement", "The laptop is", "the cheap part.", "Buying the hardware is day one. The years after it, running and securing the fleet, are where the cost lives.", ["laptop", "truck", "shield", "recycle"], "Procurement playbook")
    b.contents()
    b.mark("", "Introduction"); b.intro("Introduction", "The invoice is only day one.", "A device fleet is judged at purchase on price. It is paid for over its whole life: every set-up, support call, security update, repair and, finally, a safe and certified retirement.",
        [("laptop", "Price is visible", "The purchase cost is on one invoice, so it gets the scrutiny."),
         ("wrench", "Running cost is scattered", "Support, repairs and lost hours are spread across teams and budgets, so they rarely get added up."),
         ("shield", "Risk is the hidden cost", "An unpatched, unencrypted or badly retired device can cost more than the fleet itself.")])
    b.mark("01", "The lifecycle"); b.opener("01", "Plan the<br>whole life.", "Every device passes through the same stages. Each one has a cost and an owner.", [("01", "The device lifecycle"), ("02", "Deploy, support, secure, retire"), ("03", "Buying vs managing")])
    b.flow("The lifecycle", "Six stages, one fleet", "Plan each stage before you buy, and the purchase decision changes.",
        [("contract", "Buy", "Choose devices against real roles and refresh cycles, not just the unit price."),
         ("truck", "Deploy", "Image, enrol, ship and get each person productive from their first day."),
         ("wrench", "Support", "Handle tickets, faults and warranty claims without people waiting on a fix."),
         ("shield", "Secure", "Patch, encrypt, protect and know where every device is."),
         ("recycle", "Retire", "Wipe data to a certified standard, then recycle or resell responsibly.")], "The lifecycle", "Ask of every quote: what happens to this device after it arrives?")
    for n, i, t, l, q, o in [
        ("01", "truck", "Deploy", "Getting a device from the box into a productive person's hands.", [("The work", "Imaging, enrolment into management tools, shipping and first-day set-up."), ("Hidden cost", "Engineer time per device, and the hours a new starter waits to begin."), ("Ask yourself", "Who sets up a new starter's device today, and how long does it take?"), ("Good looks like", "Devices arrive ready to use, enrolled and secured, wherever the person works.")], "IT service desk"),
        ("02", "wrench", "Support and repair", "Keeping people working when hardware fails.", [("The work", "Tickets, diagnosis, warranty claims, repairs and swap-out devices."), ("Hidden cost", "Lost working hours while people wait, and engineer time chasing warranty."), ("Ask yourself", "What happens when a laptop fails the day before a deadline?"), ("Good looks like", "A clear repair or replace route, with a spare ready to go.")], "IT support lead"),
        ("03", "shield", "Secure", "Every device is a door into your business.", [("The work", "Patching, disk encryption, endpoint protection and a plan for loss or theft."), ("Hidden cost", "The impact of a breach that starts on one unmanaged device."), ("Ask yourself", "Could you prove every device is encrypted and up to date today?"), ("Good looks like", "Central reporting that shows compliance across the whole fleet at a glance.")], "Security owner"),
        ("04", "recycle", "Retire", "The end of life is where data leaks and value is lost.", [("The work", "Certified data wiping, collection, responsible recycling or resale, and refresh planning."), ("Hidden cost", "Devices stored in cupboards, data left on drives, and residual value thrown away."), ("Ask yourself", "Where do your old devices go, and what is still on them?"), ("Good looks like", "A certificate for every wiped device, and value recovered where possible.")], "IT and compliance")]:
        b.dive(n, i, t, l, q, "The lifecycle", o)
    b.mark("02", "Buying well"); b.compare("Two approaches", "Buying devices vs managing a fleet", "The same hardware, two very different ways to own it.", ["", "Buying devices", "Managing a fleet"],
        [("Focus", "Unit price at purchase.", "Total cost and risk across the device's life."),
         ("Set-up", "Done in-house, device by device.", "Planned, repeatable and ready on arrival."),
         ("Support", "Handled as tickets come in.", "Agreed repair and replacement routes."),
         ("Security", "Checked when there is time.", "Reported centrally and continuously."),
         ("End of life", "Often an afterthought.", "Certified wiping, recycling or resale, planned up front.")], "Buying well")
    b.questions("Before you buy", "Questions to ask any supplier", "Use these to compare offers on the whole lifecycle, not just the price per device.",
        [("About the devices", ["How will these devices be set up and delivered to our people?", "What is the repair and replacement route, and how fast is it?", "How long will this model be supported with updates?"]),
         ("About the lifecycle", ["How do you report on security and compliance across the fleet?", "What happens to devices at end of life, and do we get certificates?", "Can you recover value from devices we retire?"])], "Buying well")
    b.checklist("Checklist", "Before you sign the order", "Tick each one before the purchase goes ahead.",
        [("Devices matched to roles", "Not one model for everyone by default."), ("Deployment plan agreed", "Who sets up, how, and how quickly."), ("Support and repair route defined", "Including spares and warranty handling."),
         ("Security baseline set", "Encryption, patching and protection from day one."), ("End-of-life plan agreed", "Certified wiping and recycling or resale."), ("Refresh cycle planned", "So the next purchase is a plan, not a surprise.")], "Buying well")
    b.back("Plan the lifecycle,<br>not just the purchase.", "From supply to secure retirement, one partner can manage the whole fleet for you.", "Talk to our procurement team")
    return b

def w5():
    b = Book("Your AWS cost-control checklist", "Week 5 · FinOps")
    b.how = "Five checks to review your own AWS cost each month, with the tools to use, how to tell it is working and a printable checklist."
    b.cover("Week 5 · FinOps", "Your AWS", "cost-control checklist.", "Five checks to review your own cloud cost. The useful takeaway, given away free.", ["check", "tag", "power", "bell"], "FinOps playbook")
    b.contents()
    b.mark("", "How to use it"); b.intro("How to use it", "Five checks. Every month.", "Run this checklist once a month with the people who own the spend. Each check takes minutes in the AWS console. The value comes from doing it every time, not from doing it perfectly once.",
        [("owner", "Bring the owners", "Invite the people who can act: an engineer, someone from finance and each budget owner."),
         ("check", "Work in order", "The checks build on each other. Ownership first makes everything after it faster."),
         ("loop", "End with actions", "Leave with a short list of actions, an owner for each and next month's date.")])
    b.mark("01", "The five checks"); b.opener("01", "The five<br>checks.", "In order, every month, with the people who own the spend.", [("01", "Give every resource an owner"), ("02", "Switch off what is idle"), ("03", "Clear out old storage"), ("04", "Match commitments to usage"), ("05", "Set alerts, then review")])
    for n, i, t, l, q, o in [
        ("01", "tag", "Give every resource an owner", "Spend without an owner is spend nobody will question.", [("Do this", "Tag by team, project and environment, then switch on cost allocation tags."), ("Using", "AWS Cost Allocation Tags and Tag Editor."), ("It is working when", "You can group the whole bill by owner, with little left untagged."), ("Common snag", "Tags applied by hand drift. Enforce them with policy where you can.")], "Platform team"),
        ("02", "power", "Switch off what is idle", "Pay for what you use, not for what is left running.", [("Do this", "Schedule non-production to stop out of hours, and rightsize from real utilisation."), ("Using", "Instance Scheduler and AWS Compute Optimizer."), ("It is working when", "Non-production is quiet at night and weekends, and sizes match real use."), ("Common snag", "Teams fear breaking things. Start with clearly non-critical systems.")], "Engineering leads"),
        ("03", "broom", "Clear out old storage", "What nobody deletes, everyone pays for.", [("Do this", "Delete unattached volumes and stale snapshots, and add lifecycle rules to buckets."), ("Using", "EBS and snapshot views, S3 lifecycle policies and S3 Storage Lens."), ("It is working when", "Storage grows with the business, not with time."), ("Common snag", "Uncertainty about what is safe to delete. Agree a retention rule first.")], "Infrastructure team"),
        ("04", "contract", "Match commitments to usage", "Commit to what is steady. Stay flexible on the rest.", [("Do this", "Check coverage and utilisation before you buy or renew anything."), ("Using", "Savings Plans and Reserved Instance coverage and utilisation reports."), ("It is working when", "Steady workloads are covered and commitments are fully used."), ("Common snag", "Buying on last year's estate. Review after big changes.")], "Finance with engineering"),
        ("05", "bell", "Set alerts, then review", "Catch surprises between reviews, not on the invoice.", [("Do this", "Put budgets and anomaly alerts in place, and review them with each owner."), ("Using", "AWS Budgets and AWS Cost Anomaly Detection."), ("It is working when", "Owners hear about spikes within days, and act on them."), ("Common snag", "Alerts sent to a shared inbox nobody reads. Route them to owners.")], "FinOps lead")]:
        b.dive(n, i, t, l, q, "The five checks", o)
    b.mark("02", "The monthly review"); b.steps("Monthly review", "A thirty-minute agenda", "Keep it short, keep it regular and always end with owned actions.",
        [("What changed", "Review the month's movement by service and by owner."), ("Anomalies", "Walk through any alerts and confirm each was explained or fixed."),
         ("Last month's actions", "Close what is done. Re-date what is not, with a reason."), ("The five checks", "Run the checklist and note anything you could not tick."),
         ("New actions", "One owner and one date for each, then book next month.")], "The monthly review", "Consistency beats depth. A short review every month does more than a deep one every year.")
    b.checklist("Printable checklist", "This month's review", "Print this page or copy it into your meeting notes. Tick each check, and note the owner for anything left open.",
        [("Every resource has an owner", "Owner for gaps: ______________"), ("Idle resources switched off or rightsized", "Owner for gaps: ______________"), ("Old storage cleared", "Owner for gaps: ______________"),
         ("Commitments match usage", "Owner for gaps: ______________"), ("Budgets and anomaly alerts reviewed", "Owner for gaps: ______________"), ("Actions agreed and next review booked", "Date: ______________")], "The monthly review")
    b.back("Five checks.<br>Every month.", "Want help running the first one? We can review your AWS cost with you and leave the habit in place.", "Ask for a cost review",
        '<div style="margin-top:14mm;padding:5mm 6mm;border:.3mm solid rgba(59,139,255,.4);border-radius:4mm;width:150mm;font-size:10pt;color:#fff"><span style="font-weight:600;color:#3B8BFF;letter-spacing:.18em;font-size:7pt;text-transform:uppercase">Coming in February</span><div style="margin-top:2mm">Our cost-control webinar brings the whole series together.</div></div>')
    return b

BOOKS = [w1, w2, w3, w4, w5]
