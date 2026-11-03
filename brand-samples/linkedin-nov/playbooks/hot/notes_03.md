# Notes 03: Cyber Security and Resilience (NIS) Bill and AI amendments

All checked 3 November 2026.

## Bill passage (bills API, https://bills.parliament.uk/bills/4035)
- Commons 1R 12 Nov 2025; 2R 6 Jan 2026 (carry-over motion); Public Bill Committee 3 Feb to 26 Feb 2026; reintroduced new session 14 May 2026; Report + 3R 16 Jun 2026.
- Lords 1R 17 Jun 2026; 2R 14 Jul 2026; Committee 1, 3, 7 Sep 2026; Report 26 Oct 2026; 3R 2 Nov 2026 ("Bill passed and returned to the Commons with amendments").
- Royal Assent: no date. Commons must consider Lords amendments (ping-pong). Not verifiable; left as "no date set".
- Legislative consent: Scottish Parliament 7 Oct, NI Assembly 19 Oct, Senedd 20 Oct 2026 (publications list).

## Written statement HLWS365, 12 Oct 2026 (Cabinet Office, "Artificial Intelligence Policy")
https://questions-statements.parliament.uk/written-statements/detail/2026-10-12/hlws365 (text via questions-statements API)
- Lords repeat of statement by Minister for AI.
- "Given how fast AI capabilities are advancing, we are considering how the regime can be strengthened so that AI cyber and loss of control risks are better understood and protected against. For instance, how near misses can be identified and reported, how AI-driven risk across organisations is reduced, and looking at how AI incidents can be properly understood..."
- Agentic AI incident response capability with NCSC, DCMS and AISI.
- Two pilots: 1,352 vulnerabilities across 548 code repositories in 18 departments.
- AISI: more than 100 technical specialists.
## GOV.UK press release 12 Oct 2026 "Britain steps up national defences against growing AI risks"
https://www.gov.uk/government/news/britain-steps-up-national-defences-against-growing-ai-risks
- "AI loss of control risk, where autonomous AI systems evade human oversight". "We will legislate wherever necessary."
## The Register 15 Oct 2026 (Lindsay Clark): officials told BIST Committee they were still "looking at" amendments; committee chair: "You can't consider something in a bill."
https://www.theregister.com/ai-and-ml/2026/10/15/uk-keeps-ai-safeguards-in-the-maybe-pile-for-cyber-security-bill/5303026

## Lords Report 26 Oct 2026 (Hansard, https://hansard.parliament.uk/Lords/2026-10-26/debates/B413EFAE-E7D4-4742-986D-092884E0D8D1/...; text via hansard-api)
- Amendment 70 (government) agreed: new clause "Functions of the Secretary of State: loss of control of artificial intelligence agent" (clause 32 in HL Bill 62). Regulations may confer functions where a compromise "is or may be attributable to loss of oversight or control of an AI agent"; "AI agent" and "loss of oversight or control" defined by future regulations; may include inspectors, entering/inspecting/searching premises, seizing documents, requiring information (incl. outside UK), tests or interviews, requiring steps. Consultation required (clause 43).
- Minister: three further measures via secondary legislation (agentic risk SRRs; preservation of information; telling affected organisations e.g. suppliers); voluntary near-miss framework; consultation on incident reporting incl. AI.
- Amendment 41 (frontier AI developer reporting 24h/72h/14 days, cross-party) disagreed on division 95 to 165.
- Amendment 66 (AISI pre-deployment audit) and 65 (last resort powers), 67 (red lines) not moved. Government opposed statutory regulatory role for AISI.
- Amendment 163 (non-government, crossbench) agreed on division 202 to 155: review of effectiveness within 12 months of passing, then further reviews at intervals of not more than 12 months; must consider frontier AI, cloud/SaaS/CDN, and AISI powers (audit before deployment, standards, inspection, remedial action incl. suspension). Clause 66 in HL Bill 62.
- Amendment 164 (opposition) agreed 194 to 155: register of foreign powers.
- Incident reporting (government): data centre mandatory near-miss reporting to Ofcom removed; incident definition = actual adverse impact; voluntary near-miss mechanism for all regulated entities; duty to keep affected customers updated while incident ongoing (data centres, RDSPs, RMSPs); OES factors aligned. 28-day final report amendments not accepted.
- Governance: minister proposed mandatory SRRs on governance incl. board-level accountability, skilled and accredited individuals with senior accountability, evidence of compliance, CAF recommended. Cyber Governance Code of Practice: quarterly reporting.
- Coverage: mechanism for Information Commission to bring high-risk small/micro DSPs and MSPs into scope (via clause 29, consultation). Critical suppliers consultation 2027. Statement of strategic priorities within a year of commencement.
## Lords 3R 2 Nov 2026: four technical government amendments (incl. "data centre services"); passed, returned to Commons.

## GOV.UK factsheets (updated 3 Nov 2026) https://www.gov.uk/government/publications/cyber-security-and-resilience-network-and-information-systems-bill-factsheets
- Agentic AI factsheet: four intended measures (SRRs for agentic loss of control, affected party notification, evidence preservation e.g. agent actions and chain of thought logs, post-incident review powers); affirmative procedure; consultation; not a comprehensive AI governance framework.
- RMSP: medium and large MSPs; defined (ongoing management under contract with access to customer systems); ICO/Information Commission regulator; register within 3 months; UK representative if overseas; examples in/out of scope. Small/micro can be designated critical suppliers.
- Data centres: RITL >= 1MW in scope; enterprise >= 10MW; Ofcom; notify within 3 months of designation.
- Incident reporting: 24h initial, 72h full, NCSC at same time; customers notified; kept updated.
- Enforcement: higher band up to £17m or 4% worldwide turnover; standard band £10m or 2%. Current max £17m.
- Implementation: phased; most via secondary legislation; Day 1 future proofing and PIR; Month 2 SSP and info sharing.
- Critical suppliers: Synnovis June 2024, over 11,000 appointments and operations disrupted, £32.7m estimated losses.
- RMSP case study: May 2024 MSP incident, MOD payroll, around 270,000 personnel.
## Press release 12 Nov 2025 "Tough new laws..." average significant attack cost over £190,000; £14.7bn a year.

## NIS2, Directive (EU) 2022/2555 (OJ L 333, 27.12.2022), text via springlex.eu reproduction
- Art 23(4): early warning 24h; incident notification 72h; final report not later than one month after notification.
- Art 34: essential entities max at least EUR 10m or 2%; important EUR 7m or 1.4%.
- Art 20: management bodies approve risk measures, oversee, can be held liable; training required.
- Annex I: data centre service providers; managed service providers; managed security service providers.
- Commission page: transposition deadline 17 Oct 2024; 18 critical sectors.

## Left out (could not verify against primary source)
- Peers' claims in debate about specific model withdrawals from AISI, OpenAI/Medicare, "Black October" PHP, £120m AISI funding.
- Any Royal Assent date.
- Secondary-source vote tallies not matching Hansard.
