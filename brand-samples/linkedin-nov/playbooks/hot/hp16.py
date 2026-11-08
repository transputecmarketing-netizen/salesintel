from rkit import HotBook, S


def build():
    b = HotBook("Trust, but Verify", 16, "scan", "query")
    b.how = "A practical guide to AI impersonation and AI-fabricated content: what happened, then how to build verification into payments, approvals and professional work this week, this month and this quarter."
    b.art_cover("Hot topics · AI impersonation and fabricated content", "Trust,", "but verify.",
        "A familiar voice on the phone, a familiar face on a video call, a confident citation in a draft. All three can now be fake. A practical playbook for building checks into the moments that matter.")
    b.contents()

    b.mark("", "Foreword")
    b.foreword("Seeing and hearing is no longer believing.", [
        "In early November 2026, federal prosecutors in New York announced charges against three men accused of using AI to mimic the voices, and sometimes the faces, of chief executives and lawyers. Prosecutors allege the scheme took more than $129 million from companies including hospital systems, banks and a UK fintech firm. The charges are allegations and have not been proved.",
        "In the same week, courts in England and India were dealing with something quieter but related: legal documents that cited cases that do not exist. One was filed by a prosecutor, another by a government authority. Neither involved criminals. Both involved people trusting material that looked right and was not.",
        "The two problems share a root. Generative AI makes convincing content cheap, whether that content is a cloned voice or a plausible paragraph of law. The answer in both cases is the same discipline: decide in advance where you will check, and make the check part of the process rather than a matter of instinct. This playbook shows how."])

    b.mark("", "Introduction")
    b.intro("Introduction", "Three habits stop most of the damage.", "None of these needs new technology. They need clear rules, practised in advance, that hold even when the person on the screen looks and sounds exactly like your chief executive.",
        [("transfer", "Verify money on a second channel", "Any new payment, urgent transfer or change of bank details is confirmed by calling back on a number you already hold, and approved by two people."),
         ("eye", "Treat voice and video as claims, not proof", "A call can be faked. Use code words, call-backs and a pause before acting on any unusual request from a senior person."),
         ("magnifier", "Check AI work before it leaves", "Every citation, figure, quote and name in AI-assisted work is checked against a source by a named person before it goes to a client, court or regulator.")])
    b.statement("If a request only makes sense because of who seems to be asking, check who is asking.", "Impersonation works by borrowing authority. Verification works by refusing to lend it without proof.", "Introduction")

    # Part 01
    b.mark("01", "What happened")
    b.opener("01", "What<br>happened.", "An alleged $129 million impersonation scheme, a run of fake legal citations, and why they belong in the same conversation.",
             [("01", "The cases in brief"), ("02", "How the alleged scheme worked"), ("03", "What they have in common")])
    b.essay("The news", "Fake bosses, fake lawyers, fake law", [
        f"On 5 November 2026, the US Attorney's Office for the Southern District of New York announced an indictment against three men. Prosecutors allege that between July 2024 and February 2026 they used AI to impersonate the voices and images of executives and lawyers at major firms, and took more than $129 million from companies worldwide.{S(1)} Two were arrested in Spain and one in the UK; extradition requests are pending.{S(2)} All are presumed innocent.",
        f"The alleged method was simple. An email, supposedly from the chief executive, asked someone in accounts to help with a confidential transaction. A phone or video call followed in which AI mimicked the executive's voice and sometimes face. The employee was then passed to a supposed lawyer, also fake, who gave the payment instructions.{S(2)} Named victims include hospital systems, banks and a UK fintech firm.{S(1)}",
        f"This is not new in shape. In 2024 the engineering firm Arup confirmed that an employee in Hong Kong made 15 transfers totalling HK$200 million, about $25 million, after a video call with what appeared to be senior colleagues. Arup said fake voices and images were used and none of its internal systems were compromised.{S(3)}",
        f"Fabricated content is reaching courts too. In early November a High Court judgment in England recorded that a prosecutor had cited a Court of Appeal case that does not exist; the court found the explanation unsatisfactory but said it did not change the outcome.{S(4)} In 2025 the High Court warned that freely available AI tools are not capable of reliable legal research.{S(5)}",
        f"A public database of court decisions involving AI-fabricated material listed 2,266 cases worldwide by 5 November 2026, about 90 of them in the UK.{S(11)} The Solicitors Regulation Authority issued a formal warning notice in August 2026 after 42 reports of potential AI misuse.{S(6)}",
        "The thread joining these stories is trust in what looks and sounds right. The fix is to stop relying on that feeling and build checks into the process instead."],
        "What happened", "In both stories, nobody broke a system. People trusted content that looked right.")
    b.figpage("How the alleged scheme worked", "Four steps from an email to a wire transfer", "As described by prosecutors and reported by the press. These are allegations.", "phone", [
        ("The pretext email", f"A message appearing to come from the chief executive asks accounts staff to help with a confidential financial transaction.{S(2)}"),
        ("The cloned call", f"A phone or video call follows in which AI mimics the executive's voice and sometimes image, lending the request authority.{S(2)}"),
        ("The fake adviser", f"Staff are passed to a supposed lawyer at a major firm, also impersonated, who supplies payment instructions.{S(1)}"),
        ("The fast exit", f"Money is wired to accounts around the world and, prosecutors allege, converted to cryptocurrency to hide where it went.{S(2)}")], "What happened")

    # Part 02
    b.mark("02", "Protect payments and approvals")
    b.opener("02", "Protect<br>the money.", "Controls that still work when the voice, the face and the email all look genuine.",
             [("01", "The payment change control"), ("02", "Verifying voice and video"), ("03", "Training that sticks")])
    b.flow("The control", "The payment and bank details check", "Use this every time a payment is new, urgent, unusual or follows a change of bank details. No exceptions for seniority.",
        [("bell", "Pause", "Any request that is urgent, confidential or outside normal process triggers the check, whoever appears to be asking."),
         ("transfer", "Call back on a known number", "Ring the requester or supplier on a number already held in your records, never one given in the request."),
         ("owner", "Second approver", "A second person, who was not on the original call or email thread, approves the payment in the banking system."),
         ("check", "Confirm the payee", "Use your bank's Confirmation of Payee result and treat a mismatch as a stop, not a warning."),
         ("contract", "Record it", "Log who verified, how and when. The record protects staff who said no and helps if money must be recovered.")], "Protect payments and approvals",
        f"The NCSC advises verifying important email requests using a second type of communication.{S(9)} The same logic applies to calls and video.")
    b.table("Match the check to the request", "Which verification for which request", "Higher risk requests need stronger checks. Agree this table with finance and put it on one page.", ["Request", "Minimum check", "Red flags"],
        [("New supplier or payee", "Call back on an independently sourced number; two-person approval.", "Pressure to skip onboarding; personal or overseas account."),
         ("Change of bank details", "Call back on number held before the change; wait period for large sums.", "Change arrives by email only, or close to a payment date."),
         ("Urgent executive request", "Call back on the executive's known mobile; code word; second approver.", "Secrecy, unusual hours, a third party taking over instructions."),
         ("Request on a video call", "End the call and ring back on a known number before acting.", "Camera issues, short call, refusal to switch channel."),
         ("Instructions from a lawyer or adviser", "Verify the firm and person through its public switchboard.", "New contact, personal email, unfamiliar escrow or holding accounts.")], "Protect payments and approvals", widths="40mm 1fr 1fr")
    b.steps("Voice and video", "Five rules for verifying a call", "Assume a voice or face can be copied. These rules work regardless of how good the fake is.",
        [("Agree code words for executives", f"Senior leaders and their finance and executive assistants share a phrase that is never written in email or chat. The FBI recommends a secret word for the same reason.{S(8)}"),
         ("Hang up and call back", f"For any unusual request, end the call and ring a number you already hold. The FBI gives the same advice for suspected voice cloning.{S(8)}"),
         ("Ask something only they would know", "A recent internal meeting, not a fact found online. Public profiles feed the fakes."),
         ("Never move money on one channel alone", "A request made on a call is confirmed in writing through a known system, and the other way round."),
         ("Make it safe to say no", "Leaders state publicly that they will never be offended by a call-back, and that staff who pause will be backed.")], "Protect payments and approvals",
        "If the request is real, a two-minute check costs nothing. If it is fake, it saves everything.")
    b.usecase("In practice", "Three scenarios to rehearse", [
        ("transfer", "Finance team", "The chief executive on video", [("The scenario", "A video call from the chief executive asks for an urgent, confidential transfer to complete an acquisition."), ("The right move", "Pause, end the call, ring the executive's known mobile and ask for the code word."), ("What good looks like", "The payment waits for a second approver, whatever the deadline."), ("Pitfall", "Accepting a callback number or meeting link supplied in the request itself.")]),
        ("contract", "Accounts payable", "The supplier's new bank account", [("The scenario", "A trusted supplier emails new bank details a day before a large invoice is due."), ("The right move", "Call the supplier on the number held before the change and confirm the details verbally."), ("What good looks like", "The change is held until verified, and the check is logged."), ("Pitfall", "Replying to the email to confirm. The attacker may control that thread.")]),
        ("owner", "Executive assistants", "The lawyer who needs it today", [("The scenario", "A caller says they are a partner at a well-known firm acting on a confidential deal."), ("The right move", "Ring the firm's public switchboard and ask for the person by name before sharing anything."), ("What good looks like", "No information or payment moves until the firm confirms the instruction."), ("Pitfall", "Being reassured by a convincing name, accent or email signature.")])], "Protect payments and approvals")
    b.dive("01", "transfer", "Owning the payment control", "Payment verification fails when it belongs to everyone. Give it a single owner and test it like any other control.",
        [("This week", "Brief finance, accounts and assistants on the call-back rule. Agree executive code words."),
         ("This month", "Write the one-page verification table. Enforce two-person approval in the banking platform."),
         ("This quarter", "Run an unannounced test call. Review every exception and near miss with the board."),
         ("How you know it works", "Every payment change has a logged check, and staff can describe the rule without notes.")], "Protect payments and approvals", "Finance director, with IT and security")
    b.grid("Training", "Training that changes behaviour", "Annual click-through modules do not prepare people for a convincing call from their boss.", [
        ("flask", "Use realistic scenarios", "Rehearse the three scenarios in this playbook with the people who handle money, using your own executives' names."),
        ("bell", "Practise the pause", "Teach one reflex: urgency plus secrecy plus money means stop and verify. Make the pause a habit, not a judgement call."),
        ("owner", "Include leaders", "Executives should know they are the ones being copied, limit what they post, and model the call-back themselves."),
        ("loop", "Repeat and refresh", "Short sessions every quarter, with real examples from the news and from your own near misses.")], "Protect payments and approvals",
        "Reward the person who stopped a payment that turned out to be real. That is how the habit survives.")

    # Part 03
    b.mark("03", "Check the work AI does")
    b.opener("03", "Check the<br>work.", "Fabricated content does not need a criminal. It only needs a busy person and an unchecked draft.",
             [("01", "Why fabricated content gets through"), ("02", "A checking routine"), ("03", "Policy and incidents")])
    b.essay("Fabricated content", "Why confident errors slip past good people", [
        "AI assistants write fluent, well-structured text. That fluency is the problem. A made-up case name in the right format, with a plausible year and court, reads exactly like a real one. A figure with one decimal place looks more precise than a rounded guess, even when it was invented.",
        f"Courts have seen this repeatedly. In 2025 the High Court in London dealt with two cases in which lawyers had put fake authorities before the court, one involving 45 fake citations or quotations, and said freely available tools are not capable of reliable legal research.{S(5)} In August 2026 the Solicitors Regulation Authority warned that individuals remain responsible for the work they produce, whether or not AI is used.{S(6)}",
        f"The judiciary applies the same rule to itself. Guidance for judges in England and Wales says they are personally responsible for material produced in their name and warns that AI tools can invent cases and quotations.{S(7)}",
        "The risk is not limited to lawyers. Consultants, accountants, surveyors, HR teams and anyone producing reports for clients or regulators face the same failure: a draft that looks finished, a deadline, and no clear rule about who checks what.",
        "Most errors get through for organisational reasons, not technical ones. Nobody is named as the checker. Juniors assume seniors will review; seniors assume juniors checked. Approved tools are not distinguished from public chatbots. And when an error is found, a second AI prompt is used to explain it, which can make it worse.",
        "The fix is a routine that treats every factual element in AI-assisted work as unverified until a named person has traced it to a source."],
        "Check the work AI does", "AI output is a first draft from a fast, fluent colleague who sometimes invents things.")
    b.grid("A checking routine", "Four things to check before anything goes out", "Apply this to any AI-assisted document going to a client, court, regulator, board or the public.", [
        ("magnifier", "Citations and references", "Open every case, statute, standard or paper in an authoritative source. If you cannot find it, it does not go out."),
        ("sliders", "Figures and calculations", "Trace each number to your own systems or a published source. Recalculate anything that drives a decision."),
        ("contract", "Quotes and attributions", "Check that quoted words appear in the source and that the person or body actually said them."),
        ("owner", "Names, dates and facts", "Confirm people, organisations, dates and events. AI often blends similar names or shifts dates.")], "Check the work AI does",
        "Record who checked and how. A short sign-off line on the file is enough.")
    b.principles("Policy", "Five rules for AI in professional advice", "A short policy, applied consistently, does more than a long one nobody reads.",
        [("Use approved tools only", "Business-grade tools with suitable data protections. No client data in public chatbots."),
         ("A named person owns every output", "The author signs off the content as if they wrote every word, because professionally they did."),
         ("Verify before you rely", "No citation, figure or quotation leaves the building until it has been traced to a source."),
         ("Supervisors check the checking", "Reviewers ask how facts were verified, not just whether the draft reads well."),
         ("Be open about use", "Tell clients and courts when AI was used where rules or contracts require it, and keep a record.")], "Check the work AI does")
    b.steps("When it goes wrong", "Incident steps for fakes and fabrications", "Speed matters for payments. Candour matters for fabricated content. Agree both routes now.",
        [("Payment sent to a fraudster", "Call your bank immediately to try to stop or recall the funds, then report to Action Fraud or Police Scotland."),
         ("Suspected deepfake call or message", "Do not act. Preserve the call log, messages and any recording, and alert security and finance."),
         ("Fabricated content found after release", "Tell the recipient promptly, correct the record and identify every other document from the same source."),
         ("Court or regulator involved", "Inform the court or regulator quickly and honestly. Check whether you have a duty to self-report."),
         ("Learn and fix", "Review what failed: the control, the training or the tool. Update the process and share lessons.")], "Check the work AI does",
        "Do not use an AI tool to explain an AI error. Go back to the source.")
    b.table("The plan", "This week, this month, this quarter", "A realistic sequence for a mid-sized UK organisation. Adjust owners to suit.", ["When", "Payments and approvals", "AI-assisted work", "Owner"],
        [("This week", "Brief finance on call-back rule; agree executive code words.", "Remind staff: no unchecked AI citations or figures go out.", "Finance director, heads of practice"),
         ("This month", "Publish verification table; enforce two-person approval in banking.", "Publish a short AI use policy and checking routine.", "Finance, risk, legal"),
         ("This quarter", "Run a test call; review exceptions and near misses.", "Audit a sample of AI-assisted outputs for errors.", "Internal audit, security"),
         ("Ongoing", "Quarterly scenario training for money handlers and assistants.", "Supervisor checks recorded on each file.", "HR, team leaders")], "Check the work AI does", widths="26mm 1fr 1fr 34mm")

    b.questions("Questions to ask", "Questions for the board and your suppliers", "Ask for evidence that the controls exist and are used.", [
        ("For the board", ["Could one person, on one call, move a large sum of our money today?", "Do our executives have code words, and have we tested them?", "Who checks AI-assisted work before it reaches clients, courts or regulators?"]),
        ("For suppliers and advisers", ["How do you verify a change to our bank details before acting on it?", "Do you use AI in work you deliver to us, and how is it checked?", "What will you tell us if AI-fabricated content is found in your work for us?"])], "Questions to ask")
    b.checklist("Checklist", "Are your checks in place?", "Tick what exists today. Anything left blank is your next action.",
        [("Call-back on a known number for every payment change", "Never a number supplied in the request."), ("Two-person approval enforced in the banking platform", "Not just written in a policy."),
         ("Code words agreed for senior leaders", "Shared with assistants and finance, never written in email."), ("Scenario training for staff who handle money", "Repeated at least quarterly."),
         ("A short AI use policy covering professional work", "Approved tools, data rules and sign-off."), ("A checking routine for citations, figures and quotes", "With a named checker on each file."),
         ("Incident steps for fraud and fabricated content", "Including bank, Action Fraud and regulator contacts.")], "Checklist")
    b.glossary("Words worth knowing", [
        ("Deepfake", "Audio, image or video generated or altered by AI to make someone appear to say or do something they did not."),
        ("Voice cloning", "Using AI to copy a person's voice from recordings so new speech sounds like them."),
        ("Hallucination", "A confident AI output that is wrong or made up, such as a case that does not exist."),
        ("CEO fraud", "A scam in which criminals pose as a senior executive to get staff to make payments or share data."),
        ("Mandate fraud", "Tricking an organisation into changing a supplier's bank details to an account the criminal controls."),
        ("Call-back", "Verifying a request by contacting the person on a number already held, not one supplied in the request."),
        ("Code word", "A pre-agreed phrase used to confirm identity on calls, never shared in writing."),
        ("Confirmation of Payee", "A UK banking check that compares the account name you enter with the name on the account."),
        ("Two-person approval", "A control requiring a second, independent person to approve a payment."),
        ("Authorised push payment fraud", "When a victim is tricked into authorising a payment to a fraudster.")])

    b.mark("", "Sources")
    b.sources([
        (1, "NBC News, 3 foreign nationals allegedly used AI to mimic CEOs in $129M scheme, DOJ says, 6 Nov 2026. nbcnews.com/news/us-news/3-foreign-nationals-allegedly-used-ai-mimic-ceos-129m-scheme-doj-says-rcna607818"),
        (2, "CBS News (AP), 3 allegedly used AI to steal some $129 million from companies by impersonating executives and lawyers, 6 Nov 2026. cbsnews.com/news/3-ai-steal-129-million-companies-impersonating-executives-lawyers"),
        (3, "CNN, British engineering giant Arup revealed as $25 million deepfake scam victim, 16 May 2024. edition.cnn.com/2024/05/16/tech/arup-deepfake-scam-loss-hong-kong-intl-hnk"),
        (4, "The Telegraph (via Yahoo News), Prosecutor cites fake case in court after using AI, 3 Nov 2026. yahoo.com/news/world/articles/prosecutor-cites-fake-case-court-142958367.html"),
        (5, "Legal Futures, Court issues stark warning to lawyers over AI-generated fake cases (Ayinde and Al-Haroun, [2025] EWHC 1383 (Admin)), 6 Jun 2025. legalfutures.co.uk/latest-news/court-issues-stark-warning-to-lawyers-over-ai-generated-fake-cases"),
        (6, "Legal IT Insider, SRA issues AI usage warning notice, 17 Aug 2026; SRA warning notice: sra.org.uk/solicitors/guidance/misuse-ai. legaltechnology.com/sra-issues-ai-usage-warning-notice"),
        (7, "Courts and Tribunals Judiciary, Artificial Intelligence (AI) guidance for judicial office holders, Oct 2025. judiciary.uk/wp-content/uploads/2025/10/Artificial-Intelligence-AI-Guidance-for-Judicial-Office-Holders-1.pdf"),
        (8, "FBI IC3, Criminals use generative artificial intelligence to facilitate financial fraud (I-120324-PSA), 3 Dec 2024. ic3.gov/PSA/2024/PSA241203"),
        (9, "NCSC, Phishing attacks: defending your organisation. ncsc.gov.uk/guidance/phishing"),
        (11, "D. Charlotin, AI Hallucination Cases database, accessed 8 Nov 2026 (2,266 cases as of 5 Nov 2026). damiencharlotin.com/hallucinations")])

    b.art_back("Build the check<br>into the process.", "Transputec helps UK organisations harden payment and approval controls, train staff with realistic impersonation scenarios and put safe, checked AI use into everyday work.", "Book a verification review",
        "Companion report: Fakes at scale")
    return b
