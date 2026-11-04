# Notes 10: Attacks at Machine Speed (researched 4 Nov 2026)

## VAPOR PANDA / ARTEX (CrowdStrike)
- CrowdStrike blog, 29 Oct 2026, "VAPOR PANDA Uses AI-Driven ARTEX to Scale a Global Espionage Campaign": https://www.crowdstrike.com/en-us/blog/vapor-panda-uses-artex-to-scale-global-campaign/
  - OverWatch saw a single ARTEX controller from 17 Oct 2026, 11-day window, 200+ distinct orgs, at least 14 countries.
  - Confirmed post-exploitation at NINE orgs (BLOODALCHEMY backdoor, follow-on spraying, scanning, recon); spraying/credential scanning against at least 12 more.
  - Telecoms in US, Belgium, Philippines; Greek government entity; foreign ministries (LatAm, Europe, Asia, Middle East); one European country's presidency, PM office, defence, justice, finance, intelligence; US pharma, semiconductor, defence, nuclear, financial; US think tanks.
  - Main agent + planner + worker agents over shared graph; one human controller ran many tasks; intervened at decision points; operator instructions in Chinese, CST timestamps.
  - Mainly DeepSeek, plus a subscription commercial LLM CrowdStrike could not confirm. ~1.4bn input tokens in one intrusion.
  - Access: unsigned SAML assertion + XXE (US pharma) -> IMDS -> enterprise admin; unauthenticated orchestration service (2nd US pharma) -> web shells, root in container, LAPS, RBCD; unrotated keys from 2022 directory export (Greek govt) -> forged admin token, mailboxes, VPN config/key from a May 2024 email leak; password spraying.
  - Operator told agents to "find Windows machines in the domain without Falcon".
  - Recs: rotate keys incl. old backups/exports; SAML signature validation; IMDSv2; limit role command rights; patch internet-facing appliances and long-lived Linux servers; EDR everywhere incl. non-internet servers; ARTEX hunting markers (artx/artex strings, C:\ProgramData\artx5v\).
  - Attribution: controller "linked" to VAPOR PANDA infrastructure (vendor assessment). Separate from Storm-0940.
- CyberScoop, 30 Oct 2026 (Matt Kapko): https://cyberscoop.com/china-vapor-panda-agentic-ai-artex-campaign-crowdstrike/
  - "about 140 sensitive targets compromised in 11 days"; ~70% of targets confirmed compromised or moderate-confidence intrusion (from CrowdStrike interview, not the blog).
  - Up to 40 commands/hour hands-on historically vs 1,500+ per hour with ARTEX; requests as often as every 10 seconds.
  - CrowdStrike saw ~45 agentic adversary attacks in Sep 2026, 126 so far in Oct (not used: counting method unclear).
  - Quote (Adam Meyers, CrowdStrike): "first time that we're seeing an agentic adversary nation-state threat actor at this scale" (not used; no individuals named in playbook).
- CSO Online, 3 Nov 2026: https://csoonline.com/article/4243816/armed-with-ai-hackers-target-endpoint-security-blind-spots-raising-stakes-for-cisos.html ; confirms nine, 200+, 14 countries, Falcon-coverage check.

## Storm-0940 / ConnectWise (Microsoft)
- Microsoft Security Blog, 21 Oct 2026: https://www.microsoft.com/en-us/security/blog/2026/10/21/storm-0940-uses-artex-agentic-ai-connectwise-supply-chain-compromise/
  - ARTEX: "open-source penetration testing framework that can use any AI model"; Go + Next.js; multilingual.
  - Storm-0940: China-state-aligned, active since 2021; ARTEX from Sept 2026 against hundreds of orgs; some privileged cloud access in under three hours.
  - 10-14 Oct spray: 327 accounts, 8 orgs, 151,000+ failures, peak 2,900/min; no success.
  - ConnectWise Cloud Backup multi-tenant app identities -> sign-in attempts to 2,250+ tenants; Graph recon, app credential changes, role changes; successful auth does not necessarily mean data access. ConnectWise advisory 16 Oct (advisory page returned 403, not read directly).
- CyberScoop, 21 Oct 2026: https://cyberscoop.com/microsoft-attributes-connectwise-supply-chain-attack-china-storm-0940/

## Precedent
- Anthropic, 13 Nov 2025 (edited 14 Nov): https://www.anthropic.com/news/disrupting-AI-espionage ; detected mid-Sep 2025; Chinese state-sponsored (high confidence, Anthropic's assessment); Claude Code against roughly 30 targets; succeeded in a small number; AI 80-90% of work; 4-6 human decision points; hallucinated credentials.

## UK context
- NCSC news, 3 Nov 2026 (State of the Cyber Nation): https://www.ncsc.gov.uk/news/cyber-chief-uk-facing-ai-powered-attacks-on-critical-infrastructure-in-two-years ; AI highly likely to increase scale/efficiency of ransomware, social engineering and vulnerability exploitation within two years; "don't connect technology to the internet unless it needs to be".
- NCSC blog, 20 Aug 2026, Managing the cyber risk of agentic AI: https://www.ncsc.gov.uk/blogs/managing-the-cyber-risk-of-agentic-ai (sandbox, own identity, least privilege short-lived creds, logging, human in/on loop, pull the plug, validating configs possibly with agentic tools).
- NCSC Early Warning: https://www.ncsc.gov.uk/information/early-warning-service
- NCSC Exercise in a Box: https://www.ncsc.gov.uk/information/exercise-in-a-box

## Left out (unverifiable or weak)
- CSO Online claims Google GTIG/Mandiant saw financially motivated actors using ARTEX in extortion, and that the original ARTEX open-source project was withdrawn in October: not found in Google/primary sources.
- BleepingComputer 2 Nov headline seen only in search; text not retrieved.
- 45 -> 126 agentic attacks per month trend (CrowdStrike via CyberScoop): counting method not explained.
- Specific CVEs: none named by CrowdStrike.
- No government (NCSC, CISA, FBI) statement specifically on VAPOR PANDA/ARTEX found.
