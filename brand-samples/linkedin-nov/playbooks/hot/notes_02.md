# Notes 02: AI developer supply chain, October 2026

## LiteLLM v1.107.0 (21 Oct 2026)
- LiteLLM incident post (21 Oct, updates 23 and 30 Oct): https://docs.litellm.ai/blog/security-incident-oct-21-2026
  - PyPI litellm==1.107.0, seven wheels, live 11:39:51 to 13:23 UTC 21 Oct. Docker Hub tags v1.107.0, latest, main-latest, main-stable 11:46:56 to 14:20 UTC. GHCR same tags unavailable by 13:51.
  - Compiled malware "steals credentials and loads remote-code execution tools". Official GitHub tag source clean; artifacts built from attacker-controlled repo.
  - Enterprise customers on private enterprise release not affected.
  - IOCs: litellm-1.107.0.dist-info, cook.pth, sitecustomize.py. Don't run pip in affected env first. Reinstall 1.106.2. Assume exfiltration if outbound internet. Rotate IAM role, every provider key in proxy DB, master and virtual keys, DATABASE_URL, any env secret. Review CloudTrail GetCallerIdentity.
  - Release permissions temporarily widened Monday for two engineers for backports. Three sets of developer GitHub CLI credentials. LiteLLM says Claude Code can embed user's GitHub CLI OAuth token in response bodies which may land in LiteLLM logs (LiteLLM's claim; THN notes not independently verified, no Anthropic statement).
  - Lookalike Berri-AI/litellm vs BerriAI/litellm.
  - Cosign signing key believed exposed; rotated 23 Oct; first new-key releases 24 Oct (v1.103.8, v1.104.6, v1.105.4, v1.106.3). v1.107.0 images carry a valid signature from the old key: verify by digest.
- Attack chain post (23 Oct): https://docs.litellm.ai/blog/security-incident-oct-21-2026-attack-chain
  - 27 May 2026: opencode.json with admin key for internal Agent Platform committed to public repo, deleted ~3h later, stayed in history until 22 Oct, never revoked (4+ months).
  - 10 Oct: key used against Agent Platform API; list managed agents returned config incl GitHub CLI OAuth token of an org owner. Branch workflows posted six repo secrets to webhook.site, incl GH_TOKEN (2nd maintainer). RELEASE_PLEASE_TOKEN (3rd maintainer). Runs deleted.
  - 21 Oct: commit added source_owner input to release workflow; branch protection rejected, attacker disabled protection with owner token; staging from Berri-AI fork; production gate approved with 2nd token 11:11:18; PyPI 11:39:51; Docker 11:46:56; run records deleted 11:53; history rewritten 12:09 to 12:24.
  - Detected ~20 minutes after publication by an external researcher (Upwind Security) via GitHub issue at 12:06:41 UTC. Live ~2 hours.
- Changes post (30 Oct): https://docs.litellm.ai/blog/security-changes-after-oct-21-2026
  - Dedicated owner accounts, no API/CLI; "Regular users can use agents. Regular users can never be owners or admins."; identity-aware proxy; phishing-resistant MFA; secret scanning + push protection; GitHub Apps / fine-grained expiring tokens; env-restricted secrets; audit logs to Splunk (complete); post-publish verifier outside GitHub (planned Dec 2026).
- Datadog Security Labs (21 Oct): https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/
  - Targets cloud creds, SSH/GPG, Git/npm/PyPI tokens, .env, LLM provider keys, Claude/Codex/Cursor sessions, browser data, LiteLLM proxy DB creds. AES-256 + RSA-4096, sent to www.litellm[.]dev/healthcheck. cook.pth/cook.py/sitecustomize.py; hourly loader checks GitHub-hosted file for a domain; only test values seen. ~23 million weekly downloads (also Socket via HNS). Second LiteLLM compromise of 2026; no link established to first.
  - Datadog gives PyPI quarantine 13:20 UTC and Docker removal 13:53 (differs from LiteLLM's 13:23 / 14:20).
- Help Net Security (22 Oct): https://www.helpnetsecurity.com/2026/10/22/litellm-compromised-supply-chain-attack-pypi-docker/
  - Wiz: attacker tested stolen AWS credentials from CI runners and K8s nodes ~4.5 hours after exfiltration, checked Amazon Bedrock model access (LLMjacking pattern); in some envs listed IAM roles/users/keys. Socket: seven builds macOS/Linux/Windows. ~23m weekly downloads.
- The Register (21 Oct): https://www.theregister.com/a/5304548 (infostealer 16 modules per Wiz).
- The Hacker News (22 Oct): https://thehackernews.com/2026/10/litellm-suspects-github-token-leak-in.html

## LiteLLM March 2026 (pattern)
- LiteLLM (24 Mar 2026): https://docs.litellm.ai/blog/security-update-march-2026 — 1.82.7 and 1.82.8 on PyPI, from 10:39 UTC ~40 minutes before quarantine; believed origin Trivy dependency in CI/CD scanning; credential stealer; 1.82.8 added litellm_init.pth. Mandiant engaged.
- Trivy VS Code extension 1.8.12 on OpenVSX, GHSA published 27 Feb 2026, CVE-2026-28353: "designed to leverage local AI coding agent to collect and exfiltrate sensitive information". https://github.com/aquasecurity/trivy-vscode-extension/security/advisories/GHSA-8mr6-gf9x-j8qg

## Claude Code extension in Cursor marketplace (29 Oct 2026)
- Cursor notice (29 Oct, updated 30 Oct 11:30 PT): https://cursor.com/blog/claude-code-extension-security-notice
  - Anthropic.claude-code 2.1.312 and 2.1.313, Windows and macOS, ~2:27am to 1:35pm PT 29 Oct. "not developed by Anthropic". Audited access, no other extensions tampered. Shut down marketplace, rotated keys, rebuilt, back online. Server taken down.
  - Payload: host info, env var names, Git email, public IP; add SSH key (svc-telemetry), enable SSH, reverse tunnel (generally fails without admin); LaunchAgent / SYSTEM scheduled task + Startup fallback; retries ~60s. "Uninstalling the extension may not be sufficient".
- Microsoft Security Blog (30 Oct): https://www.microsoft.com/en-us/security/blog/2026/10/30/inside-malicious-claude-code-branded-cursor-extension-persistent-ssh-backdoor/
  - Never published to Visual Studio Marketplace or npm @anthropic-ai/claude-code. Anthropic told Microsoft its systems were not compromised. Env var names up to 40 matches (KEY, TOKEN, SECRET...). Recommend approved publishers + install cooldown per Cursor hardening guidance.
- BleepingComputer (30 Oct): https://www.bleepingcomputer.com/news/security/malicious-claude-code-extension-on-cursor-planted-ssh-backdoors/ — ~11 hours; coding errors stop SSH on macOS (systemsetup needs admin) and Windows (/bin/sh). Early reports of npm/Open VSX/VS Marketplace refuted. How published under Anthropic name not explained.
- The Hacker News (30 Oct): https://thehackernews.com/2026/10/official-claude-code-vs-code-extension.html — Cursor: "at most 5,000 users". Anthropic staff: official channels incl VS Code and Open VSX not affected; Anthropic systems and employee laptops not compromised. Cursor will contact affected users.
- Help Net Security (30 Oct): https://www.helpnetsecurity.com/2026/10/30/claude-code-extension-ssh-backdoor/ — Phorion said it found it on Open VSX; disputed. Treat as disputed.
- Cursor hardening docs: https://cursor.com/docs/enterprise/security-hardening — allowlist publishers, install cooldown (extensions.installCooldownHours), Open VSX signature verification for enterprise.

## Tensorlake npm (8 Oct 2026)
- GHSA-8g63-53c9-65j2: https://github.com/tensorlakeai/tensorlake/security/advisories/GHSA-8g63-53c9-65j2 — tensorlake@0.5.144 live 01:12 to 02:54 UTC 8 Oct; compromised maintainer account, published through project's own release workflow so carried valid npm provenance; preinstall hook; harvests GitHub/npm tokens, AWS/GCP, K8s/Vault, SSH/GPG, .env, browser, wallets, AI tool and MCP configurations; self-propagates; "Mini Shai-Hulud"; gh-token-monitor service deletes home dir if GitHub token revoked: remove before rotating.
- THN (8 Oct): https://thehackernews.com/2026/10/tensorlake-npm-package-compromised-to.html — TypeScript SDK for Tensorlake apps, sandboxes and cloud services; harvests config and MCP files for Claude, Cursor, Kiro, Windsurf, Zed; writes .claude/settings.json and .vscode/tasks.json into repos for re-execution.

## Earlier pattern
- CISA (23 Sep 2025) Shai-Hulud: >500 npm packages, self-replicating, GitHub PATs and cloud keys. https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem
- Nx advisory (27 Aug 2025): https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c — malicious versions 26 Aug 2025; postinstall; Nx Console VS Code extension could trigger. Prompt for a "file-search agent".
- StepSecurity Nx analysis: https://www.stepsecurity.io/blog/supply-chain-security-alert-popular-nx-build-system-package-compromised-with-data-stealing-malware — checked for Claude Code, Gemini CLI, Amazon Q and ran with permission-bypass flags.
- GlassWorm (THN 14 Mar 2026): https://thehackernews.com/2026/03/glassworm-supply-chain-attack-abuses-72.html — 72+ malicious Open VSX extensions since 31 Jan 2026, some mimicking AI coding assistants including Claude Code; extensionPack/extensionDependencies trick.

## UK
- NCSC/DSIT Software Security Code of Practice, 7 May 2025: https://www.ncsc.gov.uk/blog-post/software-code-of-practice-building-a-secure-digital-future ; PDF https://assets.publishing.service.gov.uk/media/681a156fdf188ba858873aac/Software_Security_Code_of_Practice_Web_Accessible.pdf (14 principles, voluntary)
- NCSC Supply chain security guidance (12 principles): https://www.ncsc.gov.uk/collection/supply-chain-security

## Left out (unverified or disputed)
- @atlisp/mcp malicious (OSV record withdrawn; disputed). "106 malicious packages" batch (single secondary source). Apex Accelerator, MALFEX AGENTS.md (secondary only). March 2026 LiteLLM "153GB archive / 2,488 domains" (secondary only). How the Cursor extension was published (not disclosed). Open VSX distribution of 2.1.313 (disputed).
