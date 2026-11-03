from rkit import RBook, S

SRC = {
    "lt_inc": "LiteLLM, Contained: Oct 21, 2026 LiteLLM release v1.107.0 Compromised (incident notice, updated 23 and 30 October), 21 October 2026, https://docs.litellm.ai/blog/security-incident-oct-21-2026",
    "dd": "Datadog Security Labs, LiteLLM supply chain compromise: What you need to know, 21 October 2026, https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/",
    "lt_chain": "LiteLLM, The attack chain behind the v1.107.0 LiteLLM release, 23 October 2026, https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain",
    "cur": "Cursor, Security Notice: Malicious Anthropic.claude-code Versions in the Cursor Marketplace, 29 October 2026 (updated 30 October), https://cursor.com/blog/claude-code-extension-security-notice",
    "ms": "Microsoft Security Blog, Inside a malicious Claude Code-branded extension and its persistent SSH backdoor, 30 October 2026, https://www.microsoft.com/en-us/security/blog/2026/10/30/inside-malicious-claude-code-branded-cursor-extension-persistent-ssh-backdoor/",
    "tl_gh": "Tensorlake, GitHub Security Advisory GHSA-8g63-53c9-65j2: Malicious tensorlake@0.5.144 published to npm, 8 October 2026, https://github.com/tensorlakeai/tensorlake/security/advisories/GHSA-8g63-53c9-65j2",
    "hns_lt": "Help Net Security, LiteLLM hit by second supply chain attack this year, users urged to rotate credentials, 22 October 2026, https://www.helpnetsecurity.com/2026/10/22/litellm-compromised-supply-chain-attack-pypi-docker/",
    "thn_cc": "The Hacker News, Official Claude Code Extension on Cursor Marketplace Trojanized with Persistent SSH Backdoor, 30 October 2026, https://thehackernews.com/2026/10/official-claude-code-vs-code-extension.html",
    "lt_mar": "LiteLLM, Security Update: Suspected Supply Chain Incident, 24 March 2026, https://docs.litellm.ai/blog/security-update-march-2026",
    "lt_change": "LiteLLM, What we are changing after October 21, 30 October 2026, https://docs.litellm.ai/blog/security-changes-after-oct-21-2026",
    "thn_tl": "The Hacker News, Tensorlake npm Package Compromised to Deliver Shai-Hulud Credential-Stealing Worm, 8 October 2026, https://thehackernews.com/2026/10/tensorlake-npm-package-compromised-to.html",
    "reg": "The Register, LiteLLM supply chain attack hoovers up passwords and secrets, 21 October 2026, https://www.theregister.com/a/5304548",
    "thn_lt": "The Hacker News, LiteLLM Suspects GitHub Token Leak in AI Gateway Logs Behind Malicious Package Release, 22 October 2026, https://thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html",
    "bc": "BleepingComputer, Malicious Claude Code extension on Cursor planted SSH backdoors, 30 October 2026, https://www.bleepingcomputer.com/news/security/malicious-claude-code-extension-on-cursor-planted-ssh-backdoors/",
    "hns_cc": "Help Net Security, Claude Code extension poisoned with persistent SSH backdoor, 30 October 2026, https://www.helpnetsecurity.com/2026/10/30/claude-code-extension-ssh-backdoor/",
    "sophos": "Sophos, Malicious Claude Code extension distributed through Cursor marketplace, October 2026, https://www.sophos.com/en-us/blog/malicious-claude-code-extension-distributed-through-cursor-marketplace",
    "cur_hard": "Cursor, Security and privacy hardening (documentation), accessed November 2026, https://cursor.com/docs/enterprise/security-hardening",
    "nx": "Nx (nrwl), GitHub Security Advisory GHSA-cxm3-wv7p-598c: Malicious versions of Nx and some supporting plugins were published, 27 August 2025, https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c",
    "step_nx": "StepSecurity, Supply chain security alert: popular Nx build system package compromised with data-stealing malware, August 2025, https://www.stepsecurity.io/blog/supply-chain-security-alert-popular-nx-build-system-package-compromised-with-data-stealing-malware",
    "cisa": "CISA, Widespread Supply Chain Compromise Impacting npm Ecosystem, 23 September 2025, https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem",
    "trivy": "Aqua Security, GitHub Security Advisory GHSA-8mr6-gf9x-j8qg: Malicious Trivy OpenVSX Extension Release (CVE-2026-28353), 27 February 2026, https://github.com/aquasecurity/trivy-vscode-extension/security/advisories/GHSA-8mr6-gf9x-j8qg",
    "glass": "The Hacker News, GlassWorm Supply-Chain Attack Abuses 72 Open VSX Extensions to Target Developers, 14 March 2026, https://thehackernews.com/2026/03/glassworm-supply-chain-attack-abuses-72.html",
    "ncsc_code": "DSIT and NCSC, Software Security Code of Practice, May 2025, https://assets.publishing.service.gov.uk/media/681a156fdf188ba858873aac/Software_Security_Code_of_Practice_Web_Accessible.pdf",
    "ncsc_sc": "NCSC, Supply chain security guidance, accessed November 2026, https://www.ncsc.gov.uk/collection/supply-chain-security",
}


def build():
    order = []

    def c(*keys):
        for k in keys:
            assert k in SRC, k
            if k not in order:
                order.append(k)
        return S(*[order.index(k) + 1 for k in keys])

    b = RBook("Poisoned Tools", 2, "circuit", "branches")
    b.how = "An evidence-based account of October 2026's attacks on AI developer tooling: what happened, how the attacks worked, why AI tools are such an attractive target, and what UK organisations should do now."
    b.rep_cover("Intelligence report · AI tooling supply chain", "Poisoned<br>tools.",
                "How attackers turned an AI gateway, a coding assistant extension and an AI SDK against the developers who trusted them in October 2026, and what it means for every organisation building with AI.",
                "November 2026")
    b.contents()

    b.mark("", "Executive summary")
    b.summary("October 2026 was the month the AI developer toolchain became a mainstream target.", [
        f"On 21 October a malicious release of LiteLLM, an open-source gateway that routes requests to many AI model providers, was published to PyPI and LiteLLM's Docker image tags for about two hours{c('lt_inc')}. It carried a credential stealer that ran whenever Python started, and it targeted cloud keys, model provider keys and AI tool sessions{c('dd')}. LiteLLM traced the breach to an administrative key left in public commit history since May{c('lt_chain')}.",
        f"On 29 October two tampered versions of the Claude Code extension were served through Cursor's extension marketplace for roughly 11 hours, planting an attacker's SSH key and persistence on Windows and macOS machines{c('cur')}. Cursor says the versions were not developed by Anthropic, and Microsoft confirmed the official Visual Studio Marketplace and npm channels were not affected{c('cur', 'ms')}. Earlier in the month a hijacked Tensorlake npm release carried a self-spreading worm that harvested AI tool and MCP configuration files{c('tl_gh')}.",
        "The common thread is not a single flaw. Each attack abused a trusted release channel, and each went after the credentials that AI work concentrates on developer laptops, build runners and gateways. Signatures and provenance did not stop them, because the attackers used the projects' own pipelines or listings."],
        "Treat AI gateways, coding assistants, extensions and MCP servers as privileged software. Know where they run, control how they are installed, keep keys scoped and short-lived, and be ready to rotate everything they could reach.")

    b.mark("", "Key findings")
    b.findings("Seven things the October incidents tell us", [
        ("Trusted channels were the route in, not software bugs.", f"The LiteLLM release was built by its own release workflow pointed at a lookalike fork, and the extension appeared under the Claude Code listing in Cursor's marketplace{c('lt_chain', 'cur')}."),
        ("Leaked secrets started the LiteLLM chain.", f"An admin key committed in May was deleted within hours but never revoked, and it led to the GitHub tokens used in October{c('lt_chain')}."),
        ("The payloads were built for AI environments.", f"Researchers describe stealers that looked for model provider keys, AI tool sessions and MCP configurations alongside cloud and source control credentials{c('dd', 'tl_gh')}."),
        ("Speed of detection limited the damage, but not to zero.", f"An external researcher flagged the LiteLLM release about 20 minutes after publication, yet stolen AWS credentials were being tested against Amazon Bedrock within hours, according to Wiz{c('lt_chain', 'hns_lt')}."),
        ("Signatures and provenance passed.", f"Compromised LiteLLM images carried a valid signature from the project's old key, and the Tensorlake release carried valid npm provenance{c('lt_inc', 'tl_gh')}."),
        ("Uninstalling was not enough.", f"Both the LiteLLM and extension payloads left startup files or persistence that survive removal of the package or extension{c('dd', 'cur')}."),
        ("This is a pattern, not a one-off.", f"LiteLLM was compromised for the second time in 2026, after a March incident linked to its CI security scanning tool{c('lt_mar')}.")])

    b.mark("", "At a glance")
    b.facts("October in six numbers", "Figures are from vendor advisories and named researchers. Some are estimates and are labelled as such.", [
        ("~2 hours", f"How long the malicious LiteLLM 1.107.0 was live on PyPI on 21 October, from 11:39 to 13:23 UTC{c('lt_inc')}."),
        ("23 million", f"Approximate weekly downloads of LiteLLM, as estimated by Datadog Security Labs{c('dd')}."),
        ("4+ months", f"How long the leaked admin key that began the LiteLLM chain stayed valid in public commit history{c('lt_chain')}."),
        ("~11 hours", f"How long the tampered Claude Code extension versions were available in Cursor's marketplace on 29 October{c('cur')}."),
        ("5,000", f"The maximum number of users Cursor said may have installed the tampered extension, as reported by The Hacker News{c('thn_cc')}."),
        ("4.5 hours", f"Time after exfiltration before stolen AWS credentials were tested against Amazon Bedrock, according to Wiz{c('hns_lt')}.")], "At a glance")

    b.mark("", "Timeline")
    b.timeline("How October unfolded", "All times UTC unless stated. Vendor timelines may still be revised.", [
        ("27 May", "A key is exposed", f"A configuration file holding an admin key for an internal LiteLLM platform is committed to a public repository and deleted three hours later, but stays in history{c('lt_chain')}."),
        ("8 Oct", "Tensorlake npm release hijacked", f"tensorlake 0.5.144 is live on npm from 01:12 to 02:54 with a self-spreading credential stealer{c('tl_gh')}."),
        ("10 Oct", "Tokens harvested", f"The attacker uses the key to obtain an organisation owner's GitHub CLI token, then exfiltrates CI secrets holding two more maintainers' tokens{c('lt_chain')}."),
        ("21 Oct, 11:39", "Poisoned LiteLLM published", f"Seven malicious 1.107.0 wheels reach PyPI, followed by Docker Hub and GHCR images at 11:46{c('lt_inc')}."),
        ("21 Oct, 12:06", "Detected and pulled", f"An external researcher reports the release. PyPI removes it by 13:23 and Docker tags are repointed by 14:20{c('lt_chain', 'lt_inc')}."),
        ("23 to 24 Oct", "Root cause and new signing key", f"LiteLLM publishes the attack chain, rotates its image signing key and ships clean releases signed with the new key{c('lt_chain', 'lt_inc')}."),
        ("29 Oct", "Tampered extension in Cursor", f"Claude Code extension 2.1.312 and 2.1.313 are served from about 09:27 to 20:35 UTC. Cursor removes them, shuts the marketplace, rotates keys and rebuilds{c('cur', 'sophos')}."),
        ("30 Oct", "Analysis and hardening", f"Cursor updates its indicators, Microsoft publishes an analysis and LiteLLM sets out its security changes{c('cur', 'ms', 'lt_change')}.")])

    # ---------------- Part 01
    b.mark("01", "Anatomy of the attacks")
    b.opener("01", "Anatomy of<br>the attacks.", "Three incidents, three routes in, one target: the credentials that AI work depends on.",
             [("01", "LiteLLM: from leaked key to poisoned release"), ("02", "The extension and the worm"), ("03", "The incidents compared")])
    b.essay("LiteLLM", "From a forgotten key to a poisoned release", [
        f"LiteLLM is popular because it simplifies AI work: one gateway, many model providers, with central management of keys and spend. That role is also what made its compromise serious. Datadog estimates the package sees about 23 million downloads a week{c('dd')}.",
        f"According to LiteLLM's root cause analysis, the chain began on 27 May 2026, when a configuration file containing an administrative key for an internal agent platform was committed to a public repository. The file was deleted about three hours later, but the commit stayed in public history and the key was never revoked{c('lt_chain')}.",
        f"On 10 October the attacker used that key against the platform's API. A request listing managed agents returned configuration that included the GitHub CLI token of one of two organisation owners. With it, the attacker ran temporary workflows that posted repository secrets, including two other maintainers' tokens, to an external endpoint, then deleted the runs{c('lt_chain')}.",
        f"On 21 October the attacker changed LiteLLM's private release workflow so it could build from a different source, overrode branch protection with the owner token and pointed it at a lookalike fork, Berri-AI/litellm. A second token approved the production gate, the poisoned wheels and images were published, and a third token deleted the run records{c('lt_chain')}. LiteLLM also notes it had temporarily widened release permissions that week for bugfix backports{c('lt_inc')}.",
        f"LiteLLM's initial notice also said it had seen Claude Code embed a user's GitHub CLI token in response bodies, which could then appear in gateway logs{c('lt_inc')}. That is LiteLLM's observation; The Hacker News noted it had not been independently verified, and we found no public response from Anthropic on the point{c('thn_lt')}.",
        f"The payload ran from Python startup files, so it executed whenever Python started, even if LiteLLM was never imported. It encrypted what it found and sent it to a lookalike domain, and an hourly loader was ready to fetch further code, although only test values were seen{c('dd')}. Wiz researchers counted 16 data-harvesting modules{c('reg')}. Enterprise customers on LiteLLM's private release were not affected{c('lt_inc')}."],
        "LiteLLM", "The key was deleted from the file within hours. It stayed valid for more than four months.")
    b.figpage("How it worked", "The LiteLLM attack chain in four moves",
              f"Each step used a legitimate credential or feature{c('lt_chain')}.", "branches",
              [("A public commit leaks an admin key", f"The file was deleted, but the key stayed in history and was never revoked{c('lt_chain')}."),
               ("Tokens are collected", f"The platform returned an owner's GitHub CLI token; rogue workflows leaked two more{c('lt_chain')}."),
               ("The pipeline is pointed at a fork", f"Protection was overridden and the release built from the lookalike Berri-AI/litellm{c('lt_chain')}."),
               ("The payload hunts AI-era secrets", f"Cloud keys, provider keys, AI tool sessions and LiteLLM's proxy database credentials{c('dd')}.")], "Anatomy of the attacks")
    b.essay("Extension and worm", "An extension, a worm and a familiar playbook", [
        f"The second major October incident hit developers' desktops. Between about 2:27am and 1:35pm Pacific time on 29 October, versions 2.1.312 and 2.1.313 of the Claude Code extension in Cursor's marketplace carried a malicious loader for Windows and macOS. Cursor states the versions were not developed by Anthropic{c('cur')}.",
        f"Microsoft's analysis found the loader ran when the extension loaded, before the normal extension code. It gathered host details and the names, not values, of environment variables that looked like secrets, appended an attacker's SSH key, tried to enable SSH and open a reverse tunnel, and set up persistence disguised as system monitoring{c('ms')}. BleepingComputer reported that coding errors meant SSH was not enabled on most macOS and Windows hosts, although key planting and reconnaissance could still occur{c('bc')}.",
        f"Cursor removed the versions, shut its entire marketplace as a precaution, audited access, rotated keys and rebuilt the marketplace before bringing it back{c('cur')}. Cursor told reporters at most 5,000 users were affected and that it would contact them directly{c('thn_cc')}. Anthropic staff said the official VS Code and Open VSX channels were unaffected and that Anthropic's systems were not compromised{c('thn_cc')}. How the attacker came to publish under the Claude Code listing has not been publicly explained{c('bc')}.",
        f"Early reports that Open VSX also carried the malicious version are disputed. One security firm said it found it there, while others, including Microsoft's analysis, place the incident in Cursor's marketplace only{c('hns_cc', 'ms')}.",
        f"The Tensorlake case on 8 October showed the same instinct in package form. A compromised maintainer account pushed code and published tensorlake 0.5.144 through the project's own workflow, so it carried valid npm provenance. Its install hook harvested tokens, cloud keys and AI tool and MCP configurations, then republished itself into other packages the victim could write to{c('tl_gh')}.",
        f"Tensorlake's payload also wrote Claude Code and VS Code settings files into repositories so it would run again when a project was opened{c('thn_tl')}, and its advisory warns that it installs a service that deletes the user's home directory if the stolen GitHub token is revoked before the service is removed{c('tl_gh')}."],
        "Extension and worm", "The extension did not need a vulnerability. It ran because extensions run.")
    b.figpage("How it worked", "Inside the tampered extension",
              f"The legitimate extension code was left in place, so the editor appeared to work normally while the loader ran first{c('bc')}.", "laptop",
              [("Load", f"The injected loader executed as soon as the editor loaded the extension, with no need to use Claude Code{c('ms', 'bc')}."),
               ("Reconnoitre", f"It collected hostname, user, Git email, public IP and up to 40 names of secret-looking environment variables{c('ms')}."),
               ("Plant access", f"It appended an SSH key labelled svc-telemetry and tried to open a reverse SSH tunnel to the attacker's server{c('cur')}."),
               ("Persist", f"A LaunchAgent on macOS or a scheduled task and Startup script on Windows kept retrying, so uninstalling the extension may not be enough{c('cur')}.")], "Anatomy of the attacks")
    b.table("Side by side", "The three October incidents compared", "Facts as reported by the vendors involved and named researchers.",
            ["", "LiteLLM 1.107.0", "Claude Code extension", "Tensorlake 0.5.144"],
            [("Route in", f"Leaked key, stolen GitHub tokens, release workflow pointed at a fork{c('lt_chain')}.", f"Tampered versions in Cursor's marketplace; method not disclosed{c('cur', 'bc')}.", f"Compromised maintainer account and the project's own workflow{c('tl_gh')}."),
             ("Exposure", f"About two hours on PyPI, longer on Docker tags, 21 October{c('lt_inc')}.", f"About 11 hours on 29 October{c('cur')}.", f"About 1 hour 40 minutes on 8 October{c('tl_gh')}."),
             ("Payload", f"Credential stealer plus hourly remote code loader{c('dd')}.", f"SSH key, reverse tunnel and reconnaissance{c('ms')}.", f"Credential stealer and self-spreading worm{c('tl_gh')}."),
             ("AI angle", f"Provider keys, AI tool sessions, gateway database{c('dd')}.", f"Impersonated a leading AI coding assistant{c('cur')}.", f"AI tool and MCP configs; wrote assistant settings into repos{c('tl_gh', 'thn_tl')}."),
             ("Survives removal", f"Yes: Python startup files{c('dd')}.", f"Yes: startup persistence{c('cur')}.", f"Yes: background service{c('tl_gh')}."),
             ("Vendor response", f"Pulled, keys rotated, new signing key, hardening plan{c('lt_inc', 'lt_change')}.", f"Removed, marketplace rebuilt, keys rotated, server taken down{c('cur')}.", f"Advisory, clean release path, rebuild guidance{c('tl_gh')}.")],
            "Anatomy of the attacks", "26mm 1fr 1fr 1fr")

    # ---------------- Part 02
    b.mark("02", "Why AI tooling is a target")
    b.opener("02", "Why AI tooling<br>is a target.", "AI work gathers keys, permissions and trust in exactly the places attackers can reach.",
             [("01", "What attackers want from AI teams"), ("02", "Four properties that raise the stakes"), ("03", "A pattern years in the making")])
    b.essay("The attraction", "Why the AI toolchain is worth attacking", [
        f"The October payloads read like shopping lists, and the lists are revealing. Alongside the usual cloud and source control credentials, researchers found the LiteLLM stealer looking for model provider API keys, sessions for Claude, Codex and Cursor, and the credentials LiteLLM's own proxy database holds for upstream providers{c('dd')}. Tensorlake's worm collected configuration and MCP files for several AI coding tools{c('thn_tl')}.",
        "The reason is concentration. An AI gateway exists to hold many provider keys in one place. A coding assistant runs with a developer's own access to code, shell and tokens. An MCP server is, by design, a bridge from an AI assistant into other systems. Compromise any one of them and you inherit its reach.",
        f"Those keys have direct value. Wiz reported that the attacker behind the LiteLLM release validated stolen AWS credentials from CI runners and Kubernetes nodes and checked access to models on Amazon Bedrock, behaviour it linked to LLMjacking, where stolen access is used to run models at the victim's expense{c('hns_lt')}.",
        "Pace adds risk. AI teams update gateways, SDKs and assistants often, to pick up new models and features, and many installs and container tags float to the newest version. A malicious release does not need to survive long if automated builds fetch it within minutes.",
        f"Trust adds more. Developers are used to approving extensions and packages from familiar names, and some protections that buyers rely on were not designed for this threat. LiteLLM's compromised images carried a valid signature from its old key, and Tensorlake's release had valid provenance, because both were produced by the projects' own release machinery{c('lt_inc', 'tl_gh')}.",
        f"Finally, AI agents themselves are being drafted in. Earlier attacks have tried to use locally installed AI coding tools to search machines for secrets, and Tensorlake's worm used assistant settings files to re-run itself{c('step_nx', 'thn_tl')}. The tools are both the target and, increasingly, the vehicle."],
        "The attraction", "Compromise an AI gateway and you inherit every key it holds.")
    b.table("The pattern", "October did not come from nowhere", "Earlier developer supply chain attacks rehearsed every technique seen in October.",
            ["Date", "Incident", "Technique", "Echo in October"],
            [("Aug 2025", f"Nx build system packages on npm{c('nx')}", f"Install script stole secrets; tried to use local AI coding CLIs with prompts disabled{c('step_nx')}.", "AI tools as both target and vehicle."),
             ("Sep 2025", f"Shai-Hulud npm worm{c('cisa')}", f"Self-replicating worm across 500+ packages stealing tokens and cloud keys{c('cisa')}.", "Tensorlake's Mini Shai-Hulud payload."),
             ("Feb 2026", f"Trivy extension on Open VSX{c('trivy')}", f"Release designed to use a local AI coding agent to collect and exfiltrate data{c('trivy')}.", "Poisoned editor extension."),
             ("Mar 2026", f"GlassWorm on Open VSX{c('glass')}", f"72+ malicious extensions, some mimicking AI coding assistants including Claude Code{c('glass')}.", "Impersonating trusted AI tools."),
             ("Mar 2026", f"LiteLLM 1.82.7 and 1.82.8{c('lt_mar')}", f"Believed to stem from a compromised CI scanning dependency; credential stealer via a startup file{c('lt_mar')}.", "Same project, same startup-file trick.")],
            "Why AI tooling is a target", "20mm 1fr 1.3fr 1fr")
    b.compare("Controls", "What helped, and what did not", "Controls that people rely on, measured against what actually happened in October.",
              ["Control", "What happened in October", "The lesson"],
              [("Signing", f"Malicious LiteLLM images carried a valid signature from the old key{c('lt_inc')}.", "Verify by digest against a known-good list, and rotate keys when tokens leak."),
               ("Provenance", f"Tensorlake's malicious release carried valid npm provenance{c('tl_gh')}.", "Provenance proves where code was built, not that the account was legitimate."),
               ("Private registry", f"LiteLLM enterprise customers on the private release were not affected{c('lt_inc')}.", "Controlled distribution and delayed promotion shrink exposure."),
               ("Branch protection", f"An owner token was used to override protection and force-push{c('lt_chain')}.", "Owner rights should sit on separate accounts with no API or CLI use."),
               ("Community detection", f"An external researcher spotted the LiteLLM release within about 20 minutes{c('lt_chain')}.", "A short cooling-off period lets others find problems first.")],
              "Why AI tooling is a target")

    # ---------------- Part 03
    b.mark("03", "What it means for UK organisations")
    b.opener("03", "What it means<br>for the UK.", "Most UK organisations are users of these tools, not builders. The exposure is real either way.",
             [("01", "The UK picture"), ("02", "Recommendations"), ("03", "Questions for boards")])
    b.essay("UK organisations", "What it means for UK organisations", [
        "Few UK businesses write their own AI gateways, but many now run one, often stood up quickly by a data or engineering team to give staff access to several models. Many more have developers using AI coding assistants and editor extensions on laptops that hold cloud and source control credentials. That makes these incidents relevant well beyond the technology sector.",
        f"The UK already has a framework for this. The NCSC's supply chain security guidance sets out 12 principles for gaining and keeping oversight of the suppliers your systems depend on{c('ncsc_sc')}. The Software Security Code of Practice, published by DSIT and the NCSC in May 2025, sets voluntary baseline expectations of software vendors, including how they secure their build environments and communicate with customers{c('ncsc_code')}. Open-source projects and extension marketplaces sit awkwardly in procurement, but the principles transfer.",
        "The most common gap we see is basic visibility. When an advisory lands, many organisations cannot say quickly which machines installed a given package version or extension, because developer tooling sits outside the asset and software inventories that IT maintains.",
        "The second gap is how credentials are held. Model provider keys are often long-lived, broadly scoped, shared between projects and stored in environment files. That turns a two-hour exposure window into a long-tail problem, because every key has to be found and replaced.",
        "The third is response. The October advisories were detailed and specific about order: do not start Python in an affected environment, remove persistence before revoking tokens, rotate from a clean machine. Teams that treated them as routine patch notices risked making things worse.",
        "Data protection matters too. If a compromised machine or gateway held personal data or credentials to systems that do, organisations need to assess whether a personal data breach has occurred and whether it must be reported to the ICO within 72 hours under UK GDPR."],
        "UK organisations", "The first question in every incident was the same: are we running it?")
    b.steps("Recommendations", "Six steps to keep AI tooling trustworthy", "In rough priority order. Most need policy and configuration, not new products.",
            [("Inventory AI tooling", "Gateways, SDKs, assistants, extensions and MCP servers, with an owner and what each can reach."),
             ("Pin, delay and mirror", "Pin by version and digest, hold new releases for a cooling-off period, and install from a private registry you can block."),
             ("Allow-list extensions and MCP servers", f"Use central admin controls; Cursor, for example, documents publisher allow-lists and install cooldowns{c('cur_hard')}."),
             ("Shrink the value of keys", "Per-application provider keys with spend limits, in a secrets manager, and short-lived tokens for source control and CI."),
             ("Separate admin from daily use", f"Owner and admin rights on dedicated accounts, as LiteLLM is now adopting{c('lt_change')}."),
             ("Watch behaviour and rehearse", "Alert on editors adding SSH keys or startup items, and practise cleaning and rotating in the order advisories prescribe.")], "What it means for UK organisations")
    b.questions("For the board", "Questions boards should ask", "Short questions that reveal whether AI tooling risk is being managed.",
                [("Exposure", ["Do we know which AI gateways, coding assistants, extensions and MCP servers we run, and who owns each?", "If a named version were compromised today, how long would it take us to know whether we ran it?", "How many systems could a single stolen model provider key or developer token reach?"]),
                 ("Assurance", ["Are new releases delayed and installed only from sources we control?", "When did we last rehearse rotating every key on a compromised developer machine?", "What do our key AI tooling suppliers commit to on release security and incident notice?"])], "What it means for UK organisations")
    b.glossary("Terms used in this report", [
        ("AI gateway", "Software that sits between applications and AI model providers, holding provider keys and routing requests."),
        ("Supply chain attack", "Compromising trusted software, such as a package or extension, to reach its users."),
        ("Release pipeline", "The automated workflow that builds, signs and publishes a project's packages and images."),
        ("Lookalike repository", "An account or repository named to resemble a legitimate one, such as Berri-AI for BerriAI."),
        ("Image digest", "A fixed fingerprint for a container image. Tags such as latest can be moved; digests cannot."),
        ("Provenance", "Signed evidence of where and how a release was built."),
        (".pth file", "A Python file processed when the interpreter starts, which can run code automatically."),
        ("Extension marketplace", "A store from which code editors install add-ons, such as Open VSX or Cursor's marketplace."),
        ("MCP server", "A connector using the Model Context Protocol that lets AI assistants use tools and data."),
        ("Reverse SSH tunnel", "A connection from the victim to the attacker that lets the attacker reach the victim's machine."),
        ("LLMjacking", "Using stolen credentials to run AI models at someone else's expense."),
        ("Worm", "Malware that spreads itself, here by republishing into packages the victim can write to.")], "Glossary")

    b.mark("", "Sources")
    items = [(f"{i+1:02d}", SRC[k]) for i, k in enumerate(order)]
    unused = [k for k in SRC if k not in order]
    assert not unused, unused
    half = (len(items) + 1) // 2
    b.sources(items[:half])
    b.sources(items[half:], note="Continued. Facts we could not verify against a primary or reputable source have been left out.")
    b.rep_back("Poisoned tools need<br>a practised response.", "We help UK organisations inventory their AI tooling, harden how it is installed and respond quickly when a supplier is compromised.",
               "Talk to our security team", "Companion playbook · Trust your tools")
    return b
