# Notes 07: North Korea, Binance and the business of social engineering (researched 3 Nov 2026)

## Binance incident (29 Oct 2026)
- Drain began ~20:05 UTC 29 Oct (TRM via Cointelegraph); Chainalysis: ~4:20pm ET. https://cointelegraph.com/news/recap-binances-record-63b-hack-unfolded
- Binance preliminary, unaudited estimate ~$6.3bn; ~$3bn frozen on-chain. Initial investigation "may involve a compromised DevOps engineer's laptop" -> access to a service container -> unauthorised withdrawal transactions; no evidence of private key leak; postmortem promised. https://finance.yahoo.com/markets/crypto/articles/binance-says-compromised-engineer-laptop-161203953.html (Binance post: https://x.com/binance/status/2115993361517891592, not read directly)
- Co-CEO later: additional points of breach; "not carried out by one person"; EIP-7702 delegation "did not pass through our normal approval controls"; self-destruct tooling. SecurityWeek 2 Nov 2026 https://www.securityweek.com/fbi-flags-over-600-addresses-tied-to-north-koreas-binance-heist/
- Chainalysis 30 Oct: ~$6.4bn; valid signed authorisations let a hot wallet run attacker-deployed code; $325m stablecoins -> $285m ETH in ~20 minutes; automation, 1 TRX pattern; commingling with Bitget funds -> TraderTraitor. https://www.chainalysis.com/blog/binance-exploit-latest-findings-and-response/
- TRM: high confidence TraderTraitor; theft ~20 minutes (TechCrunch) https://techcrunch.com/2026/10/30/north-korean-hackers-blamed-for-stealing-record-6-3b-in-binance-breach/
- Elliptic: $6.43bn across 11 chains; $2.85bn frozen/seized; attacker holds ~$3.25bn (SecurityWeek).
- FBI 31 Oct alert "North Korea Responsible for $6 Billion+ Binance Attack": TraderTraitor; converting primarily into ETH; 628 addresses (608 ETH, 19 BTC, 1 SOL); with USSS and IRS-CI; asks node operators, DeFi, swaps to block. https://www.fbi.gov/investigate/cyber/alerts/2026/north-korea-responsible-for-6-billion-binance-attack (403; via SecurityWeek, ABC/AP)
- US President, 31 Oct: "We don't know if it's North Korea" (ABC/AP) https://abcnews.com/Business/wireStory/fbi-blames-north-korea-stolen-billions-binance-biggest-137741287
- Binance 31 Oct: replenished 90%; set aside ~$6.34bn (NBC/Reuters) https://www.nbcnews.com/business/business-news/fbi-says-north-korea-was-6-billion-binance-crypto-hack-rcna606758 ; later ~95% (SecurityWeek); phased withdrawals from 1 Nov; ~$4.6bn withdrawals/$1bn deposits.
- North Korea denial, "absurd rhetoric", KCNA via Reuters 2 Nov https://www.usnews.com/news/world/articles/2026-11-02/north-korea-says-claims-linking-it-to-binance-heist-are-absurd-rhetoric-kcna-says
- Bitget 24 Sep 2026: initial $351.6m, revised ~$390m; backend wallet system compromised, spoofed transaction data; suspected DPRK. https://thehackernews.com/2026/09/bitget-says-suspected-north-korean.html

## Pattern
- CISA/FBI/Treasury AA22-108A (18 Apr 2022): TraderTraitor; recruitment-themed spearphishing of sysadmin/DevOps staff at crypto firms; trojanised apps. https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-108a
- DMM Bitcoin: 4,502.9 BTC (~$308m), May 2024; LinkedIn "recruiter" -> Ginco employee -> malicious Python "pre-employment test" on GitHub (FBI/DC3/NPA 23 Dec 2024) https://www.fbi.gov/news/press-releases/fbi-dc3-and-npa-identification-of-north-korean-cyber-actors-tracked-as-tradertraitor-responsible-for-theft-of-308-million-from-bitcoindmmcom ; https://cointelegraph.com/news/fbi-reveals-dmm-crypto-hack-300m-north-korea
- Bybit ~$1.5bn, 21 Feb 2025, FBI PSA 26 Feb 2025 https://www.ic3.gov/PSA/2025/PSA250226 ; Safe{Wallet} developer Mac compromised 4 Feb 2025 via Docker project likely social engineering; AWS session tokens hijacked https://thehackernews.com/2025/03/safewallet-confirms-north-korean.html
- FBI PSA 3 Sep 2024 I-090324-PSA indicators/mitigations https://www.ic3.gov/psa/2024/psa240903
- WaterPlum/Contagious Interview joint advisory 18 Sep 2026 (NPA, NCO, FBI, DC3, ASD's ACSC, BND, BfV): 30,000+ devices, 100+ countries, Dec 2025-Jul 2026; 7,000+ wallets; JPY1.7bn ($10.71m); npm packages; BeaverTail, InvisibleFerret, OtterCookie, OtterCandy, StoatWaffle (VS Code tasks.json auto-run); face-swap interviews; laptop farm dismantled in Japan; same IPs as IT workers; 313 General Bureau. https://www.ic3.gov/CSA/2026/260918.pdf
- Chainalysis 18 Dec 2025: DPRK at least $2.02bn in 2025; IT workers embedded "principal attack vector" https://www.chainalysis.com/blog/crypto-hacking-stolen-funds-2026/
- MSMT 2nd report Oct 2025 (11 states incl UK): at least $1.65bn Jan-Sep 2025 (AFP via Gulf News) https://gulfnews.com/world/asia/north-korea-using-crypto-it-workers-to-dodge-un-sanctions-report-1.500319510

## IT workers / UK
- OFSI advisory 12 Sep 2024: "almost certain" UK firms targeted; civil penalties without need to show knowledge; criminal up to 7 years; SAR reference "OFSI – DPRK IT Workers Advisory – 0924"; red flags & mitigations. https://www.gov.uk/government/publications/north-korean-it-workers-advisory-signs-to-watch-for
- Treasury OFAC 12 Mar 2026: schemes generated nearly $800m in 2024. https://home.treasury.gov/news/press-releases/sb0416
- DOJ 30 Jun 2025: 29 laptop farms, 16 states; 100+ US companies; ITAR data; $900k crypto theft. https://www.justice.gov/opa/pr/justice-department-announces-coordinated-nationwide-actions-combat-north-korean-remote
- FBI PSA 23 Jan 2025 data extortion. https://www.ic3.gov/PSA/2025/PSA250123
- Google GTIG 1 Apr 2025: expansion to Europe; UK projects; laptop meant for New York operating in London; facilitators in UK. https://cloud.google.com/blog/topics/threat-intelligence/dprk-it-workers-expanding-scope-scale
- Joint alert 31 Jul 2026, 11 countries incl UK (Baker McKenzie 14 Aug 2026) https://sanctionsnews.bakermckenzie.com/multiple-governments-issue-joint-alert-on-north-korean-it-workers/
- NCSC 25 Jul 2024 Andariel advisory https://www.ncsc.gov.uk/news/ncsc-partners-vigilant-dprk-sponsored-cyber-campaign

## Not verified / left out
- Claim that FCA is investigating the Binance incident (only on Wikipedia). Left out.
- Any link between the Binance laptop compromise and a fake job offer: NOT reported. Do not claim.
- Viral "spy romance" story: fact-checked as unsupported. Left out.
- Exact freeze timings from Tether/Circle (Wikipedia only). Left out.
