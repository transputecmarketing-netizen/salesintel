/**
 * Signal Keyword Pattern Registry
 *
 * 150+ regex patterns organized by signal type and severity level.
 * Used as Stage 1 of the hybrid classification pipeline for instant
 * keyword-based signal classification.
 */

import type { SignalType, SignalSeverity } from '@/types/signal';

export interface KeywordPattern {
  pattern: RegExp;
  subtype: string;
  severity: SignalSeverity;
  intentScore: number;
  whyItMatters: string;
}

export type KeywordRegistry = Record<SignalType, KeywordPattern[]>;

export const SIGNAL_KEYWORDS: KeywordRegistry = {
  // ---------------------------------------------------------------------------
  // FUNDING
  // ---------------------------------------------------------------------------
  funding: [
    // Critical
    { pattern: /\braises?\s+\$?\d+\s*(billion|B)\b/i, subtype: 'mega_round', severity: 'critical', intentScore: 95, whyItMatters: 'Billion-dollar raise signals massive expansion budget and new vendor evaluation cycles' },
    { pattern: /\bIPO\s+(filing|announced|plans?|set)\b/i, subtype: 'ipo', severity: 'critical', intentScore: 92, whyItMatters: 'IPO preparation drives infrastructure and compliance spending' },
    { pattern: /\bseries\s+[D-Z]\s+(funding|round|raise)\b/i, subtype: 'late_stage', severity: 'critical', intentScore: 90, whyItMatters: 'Late-stage funding typically funds sales and growth infrastructure' },
    { pattern: /\bgoes?\s+public\b/i, subtype: 'ipo', severity: 'critical', intentScore: 92, whyItMatters: 'Public listing triggers enterprise-grade tooling requirements' },
    { pattern: /\bSPAC\s+(merger|deal|acquisition)\b/i, subtype: 'spac', severity: 'critical', intentScore: 88, whyItMatters: 'SPAC transactions unlock substantial capital for technology investments' },
    { pattern: /\bsecures?\s+\$?\d{3,}\s*M/i, subtype: 'large_round', severity: 'critical', intentScore: 90, whyItMatters: 'Hundred-million+ raises fund multi-year technology transformation' },
    // High
    { pattern: /\bseries\s+[A-C]\s+(funding|round|raise)\b/i, subtype: 'growth_stage', severity: 'high', intentScore: 78, whyItMatters: 'Growth-stage funding often allocated to building out technology stack' },
    { pattern: /\braises?\s+\$?\d+\s*(million|M)\b/i, subtype: 'funding_round', severity: 'high', intentScore: 75, whyItMatters: 'New capital means budget availability for solutions' },
    { pattern: /\bfunding\s+round\s+(closed?|completed?|announced)\b/i, subtype: 'round_close', severity: 'high', intentScore: 75, whyItMatters: 'Completed round means funds are available for deployment' },
    { pattern: /\bventure\s+(capital|funding|backed)\b/i, subtype: 'vc_backed', severity: 'high', intentScore: 70, whyItMatters: 'VC backing drives growth imperative and tool adoption' },
    { pattern: /\bprivate\s+equity\s+(investment|acquisition|deal)\b/i, subtype: 'pe_investment', severity: 'high', intentScore: 72, whyItMatters: 'PE investment triggers operational efficiency initiatives' },
    { pattern: /\bdebt\s+(financing|facility|raise)\b/i, subtype: 'debt_financing', severity: 'high', intentScore: 65, whyItMatters: 'Debt financing often funds specific growth or infrastructure projects' },
    // Medium
    { pattern: /\bseed\s+(funding|round|stage)\b/i, subtype: 'seed', severity: 'medium', intentScore: 45, whyItMatters: 'Seed funding indicates early-stage company building initial stack' },
    { pattern: /\bpre-seed\s+(funding|round)\b/i, subtype: 'pre_seed', severity: 'medium', intentScore: 35, whyItMatters: 'Pre-seed companies are selecting foundational tools' },
    { pattern: /\bangel\s+(investment|round|funding)\b/i, subtype: 'angel', severity: 'medium', intentScore: 38, whyItMatters: 'Angel-funded companies are building initial technology foundation' },
    { pattern: /\bcrowdfund(ing|ed)\b/i, subtype: 'crowdfunding', severity: 'medium', intentScore: 30, whyItMatters: 'Crowdfunding success indicates growth trajectory' },
    { pattern: /\bgrant\s+(awarded|received|funding)\b/i, subtype: 'grant', severity: 'medium', intentScore: 40, whyItMatters: 'Grant funding may be allocated to technology capabilities' },
    { pattern: /\bbridge\s+(round|financing|loan)\b/i, subtype: 'bridge', severity: 'medium', intentScore: 42, whyItMatters: 'Bridge round signals upcoming larger raise and potential spend' },
  ],

  // ---------------------------------------------------------------------------
  // LEADERSHIP
  // ---------------------------------------------------------------------------
  leadership: [
    // Critical
    { pattern: /\b(appoints?|names?|hires?)\s+(new\s+)?C[A-Z]O\b/i, subtype: 'c_suite_hire', severity: 'critical', intentScore: 92, whyItMatters: 'New C-level executive triggers 90-day evaluation window for vendors' },
    { pattern: /\bnew\s+(CEO|CTO|CIO|CFO|CRO|CMO|COO|CISO)\b/i, subtype: 'c_suite_change', severity: 'critical', intentScore: 92, whyItMatters: 'New C-suite leader brings new vendor preferences and budget authority' },
    { pattern: /\bchief\s+(executive|technology|information|financial|revenue|marketing|operating|security)\s+officer\b/i, subtype: 'c_suite_mention', severity: 'critical', intentScore: 88, whyItMatters: 'C-level leadership change opens strategic vendor conversations' },
    { pattern: /\b(CEO|CTO|CIO)\s+(steps?\s+down|resigns?|departs?|leaves?)\b/i, subtype: 'c_suite_departure', severity: 'critical', intentScore: 85, whyItMatters: 'Executive departure signals incoming leadership with new priorities' },
    { pattern: /\bboard\s+of\s+directors?\s+(appoints?|names?|elects?)\b/i, subtype: 'board_change', severity: 'critical', intentScore: 82, whyItMatters: 'Board changes influence strategic direction and vendor selection' },
    { pattern: /\bfounding\s+(CEO|CTO)\s+(transition|succession)\b/i, subtype: 'founder_transition', severity: 'critical', intentScore: 90, whyItMatters: 'Founder transition marks strategic inflection point' },
    // High
    { pattern: /\b(VP|vice\s+president)\s+of\s+(sales|engineering|product|marketing|IT|operations)\b/i, subtype: 'vp_hire', severity: 'high', intentScore: 78, whyItMatters: 'VP-level hire signals departmental budget and initiative changes' },
    { pattern: /\b(SVP|EVP|senior\s+vice\s+president)\b/i, subtype: 'svp_hire', severity: 'high', intentScore: 80, whyItMatters: 'Senior VP appointment indicates strategic investment in function' },
    { pattern: /\bhead\s+of\s+(engineering|product|sales|marketing|IT|security|data)\b/i, subtype: 'head_hire', severity: 'high', intentScore: 76, whyItMatters: 'New department head evaluates and replaces existing tools' },
    { pattern: /\b(promotes?|promoted)\s+to\s+(VP|director|head)\b/i, subtype: 'promotion', severity: 'high', intentScore: 68, whyItMatters: 'Internal promotion may shift priorities and vendor relationships' },
    { pattern: /\bmanagement\s+(shakeup|restructur|overhaul)\b/i, subtype: 'reorg', severity: 'high', intentScore: 75, whyItMatters: 'Management restructuring creates vendor re-evaluation opportunities' },
    { pattern: /\bleadership\s+(transition|change|team)\b/i, subtype: 'leadership_change', severity: 'high', intentScore: 70, whyItMatters: 'Leadership changes open doors for new vendor conversations' },
    // Medium
    { pattern: /\b(director|senior\s+director)\s+of\s+(IT|engineering|product|sales|marketing)\b/i, subtype: 'director_hire', severity: 'medium', intentScore: 55, whyItMatters: 'Director-level hire indicates team growth and potential tool needs' },
    { pattern: /\bexecutive\s+(hire|appointment|recruitment)\b/i, subtype: 'exec_hire', severity: 'medium', intentScore: 58, whyItMatters: 'Executive recruitment signals organizational investment' },
    { pattern: /\bco-founder\s+(joins|appointed|named)\b/i, subtype: 'cofounder', severity: 'medium', intentScore: 55, whyItMatters: 'Co-founder addition signals strategic expansion' },
    { pattern: /\badvisory\s+board\s+(adds?|appoints?|welcomes?)\b/i, subtype: 'advisory', severity: 'medium', intentScore: 45, whyItMatters: 'Advisory additions signal strategic focus areas' },
    { pattern: /\b(joins?|joined)\s+as\s+(senior|lead|principal)\b/i, subtype: 'senior_hire', severity: 'medium', intentScore: 50, whyItMatters: 'Senior IC hires indicate team building and tool adoption' },
  ],

  // ---------------------------------------------------------------------------
  // EXPANSION
  // ---------------------------------------------------------------------------
  expansion: [
    // Critical
    { pattern: /\b(acquires?|acquisition\s+of|to\s+acquire)\s+/i, subtype: 'acquisition', severity: 'critical', intentScore: 90, whyItMatters: 'Acquisitions trigger technology integration and consolidation' },
    { pattern: /\bmerger\s+(with|between|announced|completed)\b/i, subtype: 'merger', severity: 'critical', intentScore: 90, whyItMatters: 'Mergers create need for platform consolidation and standardization' },
    { pattern: /\b(opens?|launches?|establishes?)\s+(new\s+)?(headquarters|HQ|campus)\b/i, subtype: 'new_hq', severity: 'critical', intentScore: 85, whyItMatters: 'New headquarters means large-scale infrastructure procurement' },
    { pattern: /\bglobal\s+expansion\s+(plan|strategy|announced)\b/i, subtype: 'global_expansion', severity: 'critical', intentScore: 88, whyItMatters: 'Global expansion requires scalable technology infrastructure' },
    { pattern: /\benters?\s+(new\s+)?(market|region|country|territory)\b/i, subtype: 'market_entry', severity: 'critical', intentScore: 82, whyItMatters: 'New market entry drives technology localization and scaling needs' },
    { pattern: /\b(doubles?|triples?)\s+(revenue|headcount|team|workforce)\b/i, subtype: 'rapid_growth', severity: 'critical', intentScore: 85, whyItMatters: 'Rapid scaling requires proportional technology investment' },
    // High
    { pattern: /\b(opens?|launches?)\s+(new\s+)?offic(e|es)\s+in\b/i, subtype: 'new_office', severity: 'high', intentScore: 72, whyItMatters: 'New offices require technology provisioning and infrastructure' },
    { pattern: /\bexpand(s|ing)?\s+(into|to|across)\b/i, subtype: 'geographic_expansion', severity: 'high', intentScore: 70, whyItMatters: 'Geographic expansion drives distributed technology needs' },
    { pattern: /\bscal(e|ing)\s+(operations?|team|infrastructure)\b/i, subtype: 'scaling', severity: 'high', intentScore: 72, whyItMatters: 'Scaling operations requires proportional tooling investment' },
    { pattern: /\bnew\s+(division|business\s+unit|subsidiary)\b/i, subtype: 'new_division', severity: 'high', intentScore: 68, whyItMatters: 'New divisions build independent technology stacks' },
    { pattern: /\bexpansion\s+(plans?|strategy|initiative)\b/i, subtype: 'expansion_plan', severity: 'high', intentScore: 65, whyItMatters: 'Expansion planning signals upcoming procurement cycles' },
    { pattern: /\brestructur(e|ing|es)\s+(operations?|business)\b/i, subtype: 'restructuring', severity: 'high', intentScore: 70, whyItMatters: 'Restructuring creates vendor consolidation opportunities' },
    // Medium
    { pattern: /\b(relocat|mov)(e|es|ing)\s+(to|headquarters|office)\b/i, subtype: 'relocation', severity: 'medium', intentScore: 50, whyItMatters: 'Office relocation may trigger infrastructure refresh' },
    { pattern: /\bremote[\s-]first\s+(policy|strategy|company)\b/i, subtype: 'remote_first', severity: 'medium', intentScore: 48, whyItMatters: 'Remote-first policies drive collaboration and security tool adoption' },
    { pattern: /\bhybrid\s+work(place|force|space|ing)?\b/i, subtype: 'hybrid_work', severity: 'medium', intentScore: 45, whyItMatters: 'Hybrid work models require new technology infrastructure' },
    { pattern: /\bco-?working\s+(space|partnership)\b/i, subtype: 'coworking', severity: 'medium', intentScore: 35, whyItMatters: 'Coworking adoption may signal growth-stage tooling needs' },
    { pattern: /\bnew\s+(warehouse|facility|data\s+center|lab)\b/i, subtype: 'new_facility', severity: 'medium', intentScore: 55, whyItMatters: 'New facilities require technology provisioning' },
  ],

  // ---------------------------------------------------------------------------
  // TECHNOLOGY
  // ---------------------------------------------------------------------------
  technology: [
    // Critical
    { pattern: /\b(RFP|request\s+for\s+proposal)\s+(issued|released|published|seeking)\b/i, subtype: 'rfp', severity: 'critical', intentScore: 98, whyItMatters: 'Active RFP means decision-ready buyer with allocated budget' },
    { pattern: /\b(vendor|platform|solution)\s+(evaluation|selection|comparison|shortlist)\b/i, subtype: 'vendor_eval', severity: 'critical', intentScore: 95, whyItMatters: 'Active vendor evaluation signals imminent purchase decision' },
    { pattern: /\breplac(e|es|ing)\s+(existing|current|legacy)\s+(system|platform|vendor|solution)\b/i, subtype: 'vendor_replacement', severity: 'critical', intentScore: 92, whyItMatters: 'Vendor replacement opens immediate competitive opportunity' },
    { pattern: /\bdigital\s+transformation\s+(initiative|program|strategy|roadmap)\b/i, subtype: 'digital_transformation', severity: 'critical', intentScore: 88, whyItMatters: 'Digital transformation programs drive multi-year technology investment' },
    { pattern: /\bmigrat(e|es|ing)\s+(to|from)\s+(cloud|AWS|Azure|GCP)\b/i, subtype: 'cloud_migration', severity: 'critical', intentScore: 90, whyItMatters: 'Cloud migration creates need for cloud-native tooling' },
    { pattern: /\bRFI\s+(issued|released|published)\b/i, subtype: 'rfi', severity: 'critical', intentScore: 88, whyItMatters: 'RFI indicates active research into vendor solutions' },
    // High
    { pattern: /\badopts?\s+(new|latest)\s+(technology|platform|framework|stack)\b/i, subtype: 'tech_adoption', severity: 'high', intentScore: 72, whyItMatters: 'Technology adoption decisions signal openness to new vendors' },
    { pattern: /\b(implements?|deploying|rolls?\s+out)\s+(new\s+)?(system|platform|software|solution|tool)\b/i, subtype: 'tech_implementation', severity: 'high', intentScore: 75, whyItMatters: 'Active implementation creates integration and complementary tool needs' },
    { pattern: /\b(moderniz|upgrad)(e|es|ing)\s+(infrastructure|systems?|stack|platform)\b/i, subtype: 'modernization', severity: 'high', intentScore: 78, whyItMatters: 'Infrastructure modernization opens adjacent procurement' },
    { pattern: /\btech\s+stack\s+(overhaul|refresh|update|change)\b/i, subtype: 'stack_change', severity: 'high', intentScore: 80, whyItMatters: 'Stack changes create window for new vendor entry' },
    { pattern: /\b(AI|artificial\s+intelligence|machine\s+learning|ML)\s+(initiative|adoption|strategy|investment)\b/i, subtype: 'ai_initiative', severity: 'high', intentScore: 75, whyItMatters: 'AI initiatives drive data infrastructure and tooling spend' },
    { pattern: /\bautomation\s+(initiative|strategy|platform|investment)\b/i, subtype: 'automation', severity: 'high', intentScore: 70, whyItMatters: 'Automation initiatives signal process improvement budget' },
    // Medium
    { pattern: /\b(evaluating|considering|exploring|piloting)\s+(new\s+)?(tool|software|platform|solution)\b/i, subtype: 'tool_exploration', severity: 'medium', intentScore: 58, whyItMatters: 'Tool exploration indicates openness to vendor conversations' },
    { pattern: /\bopen[\s-]source\s+(adoption|migration|strategy)\b/i, subtype: 'oss_adoption', severity: 'medium', intentScore: 48, whyItMatters: 'Open source shifts may indicate vendor evaluation' },
    { pattern: /\bdata\s+(warehouse|lake|platform|pipeline)\s+(migration|upgrade|build)\b/i, subtype: 'data_platform', severity: 'medium', intentScore: 55, whyItMatters: 'Data platform changes create complementary tooling needs' },
    { pattern: /\bAPI\s+(integration|platform|gateway|strategy)\b/i, subtype: 'api_strategy', severity: 'medium', intentScore: 50, whyItMatters: 'API strategy signals integration and platform decisions' },
    { pattern: /\bcybersecurity\s+(investment|upgrade|initiative|overhaul)\b/i, subtype: 'security_initiative', severity: 'medium', intentScore: 55, whyItMatters: 'Security initiatives drive specialized tool procurement' },
    { pattern: /\bDevOps\s+(adoption|transformation|initiative)\b/i, subtype: 'devops', severity: 'medium', intentScore: 52, whyItMatters: 'DevOps transformation drives toolchain modernization' },
  ],

  // ---------------------------------------------------------------------------
  // HIRING
  // ---------------------------------------------------------------------------
  hiring: [
    // Critical
    { pattern: /\bhiring\s+(spree|surge|blitz|wave)\b/i, subtype: 'hiring_surge', severity: 'critical', intentScore: 85, whyItMatters: 'Hiring surge signals budget availability and rapid team scaling' },
    { pattern: /\b(plans?\s+to\s+)?hir(e|es|ing)\s+\d{3,}\b/i, subtype: 'mass_hiring', severity: 'critical', intentScore: 88, whyItMatters: 'Mass hiring requires proportional tooling investment per employee' },
    { pattern: /\brecruit(s|ing)?\s+(hundreds?|thousands?)\b/i, subtype: 'mass_recruiting', severity: 'critical', intentScore: 85, whyItMatters: 'Large-scale recruitment signals major operational expansion' },
    { pattern: /\b(50|100|200|500|1000)\+?\s+open\s+(positions?|roles?|jobs?)\b/i, subtype: 'many_openings', severity: 'critical', intentScore: 82, whyItMatters: 'Many open roles indicate significant growth and tool scaling needs' },
    { pattern: /\bdoubl(e|es|ing)\s+(team|headcount|workforce|staff)\b/i, subtype: 'team_doubling', severity: 'critical', intentScore: 85, whyItMatters: 'Workforce doubling creates urgent need for scalable tools' },
    // High
    { pattern: /\bhiring\s+(for\s+)?(engineering|sales|product|data|security)\s+team\b/i, subtype: 'team_hiring', severity: 'high', intentScore: 72, whyItMatters: 'Team-specific hiring indicates departmental growth and tool needs' },
    { pattern: /\b(seeks?|looking\s+for|hiring)\s+(senior|staff|principal|lead)\s+(engineer|developer|architect)\b/i, subtype: 'senior_tech_hire', severity: 'high', intentScore: 75, whyItMatters: 'Senior technical hires influence tool selection decisions' },
    { pattern: /\bgrowing\s+(team|headcount|workforce)\s+by\b/i, subtype: 'team_growth', severity: 'high', intentScore: 68, whyItMatters: 'Team growth drives proportional technology investment' },
    { pattern: /\bnew\s+(engineering|development|R&D)\s+center\b/i, subtype: 'new_dev_center', severity: 'high', intentScore: 78, whyItMatters: 'New development centers require full technology stack provisioning' },
    { pattern: /\b(talent|recruitment)\s+(drive|initiative|campaign)\b/i, subtype: 'talent_drive', severity: 'high', intentScore: 65, whyItMatters: 'Recruitment campaigns signal growth trajectory and budget' },
    { pattern: /\bbuilding\s+(a|the|new)\s+(team|squad|group)\b/i, subtype: 'team_building', severity: 'high', intentScore: 70, whyItMatters: 'New team formation creates greenfield tool adoption opportunity' },
    // Medium
    { pattern: /\bjob\s+(posting|listing|opening|vacancy)\b/i, subtype: 'job_posting', severity: 'medium', intentScore: 45, whyItMatters: 'Job postings reveal technology stack and priorities' },
    { pattern: /\b(hiring|recruiting)\s+(manager|coordinator|specialist)\b/i, subtype: 'recruiter_hire', severity: 'medium', intentScore: 48, whyItMatters: 'Recruiter hires signal planned headcount growth' },
    { pattern: /\bintern(ship)?\s+(program|opening|positions?)\b/i, subtype: 'internship', severity: 'medium', intentScore: 30, whyItMatters: 'Internship programs indicate team investment trajectory' },
    { pattern: /\bremote\s+(position|role|job|engineer)\b/i, subtype: 'remote_hiring', severity: 'medium', intentScore: 42, whyItMatters: 'Remote hiring signals distributed team tool requirements' },
    { pattern: /\bcontract(or)?\s+(position|role|hire|engagement)\b/i, subtype: 'contractor', severity: 'medium', intentScore: 40, whyItMatters: 'Contractor engagement signals project-specific tool needs' },
  ],

  // ---------------------------------------------------------------------------
  // COMPETITIVE
  // ---------------------------------------------------------------------------
  competitive: [
    // Critical
    { pattern: /\b(switches?|switched|switching)\s+(from|away\s+from)\s+/i, subtype: 'vendor_switch', severity: 'critical', intentScore: 95, whyItMatters: 'Active vendor switch means budget allocated and decision imminent' },
    { pattern: /\b(drops?|dropped|dumped?|ditche[sd])\s+(vendor|supplier|provider|platform)\b/i, subtype: 'vendor_churn', severity: 'critical', intentScore: 92, whyItMatters: 'Vendor churn creates immediate replacement opportunity' },
    { pattern: /\b(dissatisf|unhappy|frustrated)\w*\s+with\s+(current|existing)\s+(vendor|provider|platform|solution)\b/i, subtype: 'vendor_dissatisfaction', severity: 'critical', intentScore: 90, whyItMatters: 'Vendor dissatisfaction is strongest buying signal for competitors' },
    { pattern: /\bcontract\s+(expir|end|terminat|cancel)\w*\b/i, subtype: 'contract_end', severity: 'critical', intentScore: 88, whyItMatters: 'Contract expiration creates natural evaluation window' },
    { pattern: /\breplac(e|es|ing)\s+(Salesforce|SAP|Oracle|Microsoft|Adobe|HubSpot)\b/i, subtype: 'named_replacement', severity: 'critical', intentScore: 95, whyItMatters: 'Named vendor replacement indicates active evaluation with budget' },
    // High
    { pattern: /\bcompetitor\s+(wins?|lost|deal|announcement)\b/i, subtype: 'competitor_move', severity: 'high', intentScore: 72, whyItMatters: 'Competitor activity may trigger defensive vendor evaluation' },
    { pattern: /\b(vs|versus|compared?\s+to|alternative\s+to)\s+\w+\b/i, subtype: 'comparison', severity: 'high', intentScore: 65, whyItMatters: 'Active comparison indicates evaluation phase' },
    { pattern: /\bmarket\s+share\s+(loss|decline|shift)\b/i, subtype: 'market_shift', severity: 'high', intentScore: 70, whyItMatters: 'Market share pressure drives technology differentiation investment' },
    { pattern: /\bbenchmark(s|ing)?\s+(against|versus|vs)\b/i, subtype: 'benchmarking', severity: 'high', intentScore: 68, whyItMatters: 'Benchmarking signals competitive assessment and potential switch' },
    { pattern: /\bcompetitive\s+(threat|pressure|landscape|analysis)\b/i, subtype: 'competitive_pressure', severity: 'high', intentScore: 65, whyItMatters: 'Competitive pressure drives urgency in vendor decisions' },
    { pattern: /\blost\s+(deal|contract|bid)\s+to\b/i, subtype: 'lost_deal', severity: 'high', intentScore: 72, whyItMatters: 'Lost deals to competitors increase willingness to try new vendors' },
    // Medium
    { pattern: /\bpeer\s+(comparison|review|analysis)\b/i, subtype: 'peer_comparison', severity: 'medium', intentScore: 48, whyItMatters: 'Peer comparison suggests evaluation mindset' },
    { pattern: /\bindustry\s+(report|analysis|benchmark)\b/i, subtype: 'industry_analysis', severity: 'medium', intentScore: 42, whyItMatters: 'Industry analysis often precedes vendor evaluation' },
    { pattern: /\b(G2|Gartner|Forrester|IDC)\s+(report|review|ranking|quadrant)\b/i, subtype: 'analyst_report', severity: 'medium', intentScore: 50, whyItMatters: 'Analyst research consumption indicates evaluation activity' },
    { pattern: /\bmagic\s+quadrant\b/i, subtype: 'analyst_report', severity: 'medium', intentScore: 52, whyItMatters: 'Magic Quadrant research strongly correlated with purchase intent' },
    { pattern: /\bvendor\s+(landscape|overview|comparison)\b/i, subtype: 'vendor_research', severity: 'medium', intentScore: 50, whyItMatters: 'Vendor landscape research indicates early evaluation stage' },
  ],

  // ---------------------------------------------------------------------------
  // FINANCIAL
  // ---------------------------------------------------------------------------
  financial: [
    // Critical
    { pattern: /\b(revenue|sales)\s+(surges?|soars?|skyrockets?|jumps?)\s+\d+%/i, subtype: 'revenue_surge', severity: 'critical', intentScore: 82, whyItMatters: 'Revenue surge enables increased technology investment' },
    { pattern: /\brecord\s+(revenue|profit|quarter|earnings|year)\b/i, subtype: 'record_performance', severity: 'critical', intentScore: 80, whyItMatters: 'Record financial performance unlocks technology budgets' },
    { pattern: /\bprofitab(le|ility)\s+(for\s+the\s+first\s+time|milestone|achieved)\b/i, subtype: 'profitability', severity: 'critical', intentScore: 85, whyItMatters: 'Profitability milestone shifts focus from survival to investment' },
    { pattern: /\bbudget\s+(increase|expansion|boost|growth)\b/i, subtype: 'budget_increase', severity: 'critical', intentScore: 88, whyItMatters: 'Direct budget increase signals procurement opportunities' },
    { pattern: /\bIT\s+(budget|spend|investment)\s+(increase|grow|expand|double)\b/i, subtype: 'it_budget_growth', severity: 'critical', intentScore: 92, whyItMatters: 'IT budget growth directly creates vendor opportunity' },
    // High
    { pattern: /\b(revenue|sales)\s+(grows?|grew|increase[sd]?)\s+(by\s+)?\d+%/i, subtype: 'revenue_growth', severity: 'high', intentScore: 70, whyItMatters: 'Revenue growth indicates healthy budget environment' },
    { pattern: /\bbeats?\s+(estimates?|expectations?|forecast|consensus)\b/i, subtype: 'beat_estimates', severity: 'high', intentScore: 68, whyItMatters: 'Beating estimates suggests excess capital for investment' },
    { pattern: /\b(cost|expense)\s+(cutting|reduction|optimization)\b/i, subtype: 'cost_cutting', severity: 'high', intentScore: 65, whyItMatters: 'Cost cutting drives vendor consolidation conversations' },
    { pattern: /\bfiscal\s+year\s+(end|planning|budget)\b/i, subtype: 'fiscal_year', severity: 'high', intentScore: 72, whyItMatters: 'Fiscal year transitions create use-it-or-lose-it budget windows' },
    { pattern: /\bQ[1-4]\s+(results?|earnings?|report|numbers)\b/i, subtype: 'quarterly_results', severity: 'high', intentScore: 60, whyItMatters: 'Quarterly reporting reveals financial health and spending capacity' },
    { pattern: /\b(annual|yearly)\s+(revenue|report|results)\b/i, subtype: 'annual_results', severity: 'high', intentScore: 62, whyItMatters: 'Annual results reveal budget trajectory for coming year' },
    // Medium
    { pattern: /\bfinancial\s+(results|report|statement|update)\b/i, subtype: 'financial_report', severity: 'medium', intentScore: 45, whyItMatters: 'Financial reporting reveals organizational priorities' },
    { pattern: /\bmargin\s+(improvement|expansion|growth)\b/i, subtype: 'margin_improvement', severity: 'medium', intentScore: 48, whyItMatters: 'Margin improvement indicates capacity for vendor investment' },
    { pattern: /\bcash\s+(position|reserves?|flow)\s+(strong|healthy|improve)\b/i, subtype: 'cash_position', severity: 'medium', intentScore: 50, whyItMatters: 'Strong cash position supports technology procurement' },
    { pattern: /\bvaluation\s+(increase|milestone|growth)\b/i, subtype: 'valuation', severity: 'medium', intentScore: 45, whyItMatters: 'Valuation growth indicates market confidence and investment capacity' },
    { pattern: /\b(ARR|MRR)\s+(grows?|increase|milestone|reach)\b/i, subtype: 'recurring_revenue', severity: 'medium', intentScore: 50, whyItMatters: 'Recurring revenue growth signals healthy SaaS buying environment' },
  ],

  // ---------------------------------------------------------------------------
  // TENDER
  // ---------------------------------------------------------------------------
  tender: [
    // Critical
    { pattern: /\b(RFP|request\s+for\s+proposal)\s+(open|issued|published|released|deadline)\b/i, subtype: 'rfp', severity: 'critical', intentScore: 98, whyItMatters: 'Open RFP is highest-intent buying signal with set timeline' },
    { pattern: /\b(RFQ|request\s+for\s+quot(e|ation))\b/i, subtype: 'rfq', severity: 'critical', intentScore: 95, whyItMatters: 'RFQ indicates pricing stage of procurement process' },
    { pattern: /\btender\s+(announced|issued|published|open|notice)\b/i, subtype: 'tender_notice', severity: 'critical', intentScore: 95, whyItMatters: 'Public tender creates defined procurement opportunity' },
    { pattern: /\bprocurement\s+(notice|opportunity|contract|award)\b/i, subtype: 'procurement', severity: 'critical', intentScore: 90, whyItMatters: 'Procurement notice signals budget-approved purchase' },
    { pattern: /\b(bid|bidding)\s+(invitation|opportunity|deadline|submission)\b/i, subtype: 'bid_invitation', severity: 'critical', intentScore: 92, whyItMatters: 'Bid invitation means allocated budget and defined requirements' },
    { pattern: /\bgovernment\s+(contract|procurement|tender|RFP)\b/i, subtype: 'gov_procurement', severity: 'critical', intentScore: 90, whyItMatters: 'Government procurement has defined timelines and budgets' },
    // High
    { pattern: /\bsolicitation\s+(notice|number|posted)\b/i, subtype: 'solicitation', severity: 'high', intentScore: 78, whyItMatters: 'Solicitation indicates formal procurement process underway' },
    { pattern: /\bcontract\s+(awarded?|won|granted)\b/i, subtype: 'contract_award', severity: 'high', intentScore: 72, whyItMatters: 'Contract award signals competitor win or sub-contracting opportunity' },
    { pattern: /\bpurchase\s+(order|requisition)\b/i, subtype: 'purchase_order', severity: 'high', intentScore: 75, whyItMatters: 'Purchase orders indicate active buying cycle' },
    { pattern: /\bvendor\s+registration\s+(open|required|portal)\b/i, subtype: 'vendor_registration', severity: 'high', intentScore: 70, whyItMatters: 'Vendor registration opening signals upcoming procurement' },
    { pattern: /\bsupplier\s+(qualification|selection|panel)\b/i, subtype: 'supplier_selection', severity: 'high', intentScore: 72, whyItMatters: 'Supplier qualification process creates entry opportunity' },
    // Medium
    { pattern: /\bexpression\s+of\s+interest\b/i, subtype: 'eoi', severity: 'medium', intentScore: 55, whyItMatters: 'EOI indicates early-stage procurement exploration' },
    { pattern: /\bmarket\s+soundings?\b/i, subtype: 'market_sounding', severity: 'medium', intentScore: 50, whyItMatters: 'Market sounding precedes formal procurement process' },
    { pattern: /\bpre-?qualification\b/i, subtype: 'prequalification', severity: 'medium', intentScore: 52, whyItMatters: 'Pre-qualification indicates upcoming tender process' },
    { pattern: /\bdraft\s+(RFP|specification|requirements)\b/i, subtype: 'draft_rfp', severity: 'medium', intentScore: 58, whyItMatters: 'Draft RFP indicates procurement planning underway' },
    { pattern: /\bbuying\s+(committee|group|panel)\b/i, subtype: 'buying_committee', severity: 'medium', intentScore: 55, whyItMatters: 'Buying committee formation signals structured evaluation' },
  ],

  // ---------------------------------------------------------------------------
  // PRODUCT LAUNCH
  // ---------------------------------------------------------------------------
  product_launch: [
    // Critical
    { pattern: /\blaunches?\s+(new|major|flagship|revolutionary)\s+(product|platform|service|solution)\b/i, subtype: 'major_launch', severity: 'critical', intentScore: 80, whyItMatters: 'Major product launch drives supporting technology procurement' },
    { pattern: /\b(announces?|unveils?|introduces?)\s+(new|next[\s-]gen|breakthrough)\s+(product|platform|service)\b/i, subtype: 'product_announcement', severity: 'critical', intentScore: 78, whyItMatters: 'New product announcements signal R&D investment and tool needs' },
    { pattern: /\b(v2|2\.0|major\s+release|next\s+generation)\s+(launch|release|announced)\b/i, subtype: 'major_version', severity: 'critical', intentScore: 75, whyItMatters: 'Major version launches drive infrastructure and tooling updates' },
    { pattern: /\bgeneral\s+availability\s+(announced|launch|release)\b/i, subtype: 'ga_release', severity: 'critical', intentScore: 78, whyItMatters: 'GA release signals product maturity and scaling infrastructure needs' },
    { pattern: /\bplatform\s+(launch|relaunch|rebrand)\b/i, subtype: 'platform_launch', severity: 'critical', intentScore: 76, whyItMatters: 'Platform launch creates ecosystem and integration opportunities' },
    // High
    { pattern: /\bbeta\s+(launch|release|program|access)\b/i, subtype: 'beta_launch', severity: 'high', intentScore: 65, whyItMatters: 'Beta programs signal upcoming scaling needs' },
    { pattern: /\b(feature|capability)\s+(release|launch|announcement)\b/i, subtype: 'feature_release', severity: 'high', intentScore: 58, whyItMatters: 'Feature releases indicate product investment trajectory' },
    { pattern: /\bproduct[\s-]market\s+fit\b/i, subtype: 'pmf', severity: 'high', intentScore: 68, whyItMatters: 'PMF signals shift from building to scaling and investment' },
    { pattern: /\bopen\s+(beta|preview|early\s+access)\b/i, subtype: 'open_beta', severity: 'high', intentScore: 60, whyItMatters: 'Open beta indicates scaling phase and infrastructure needs' },
    { pattern: /\bnew\s+(API|SDK|integration|plugin)\s+(released|available|launched)\b/i, subtype: 'api_launch', severity: 'high', intentScore: 62, whyItMatters: 'API/SDK launches signal platform ecosystem expansion' },
    // Medium
    { pattern: /\bproduct\s+(update|improvement|enhancement)\b/i, subtype: 'product_update', severity: 'medium', intentScore: 42, whyItMatters: 'Product updates indicate active development investment' },
    { pattern: /\broadmap\s+(update|announcement|reveal)\b/i, subtype: 'roadmap', severity: 'medium', intentScore: 48, whyItMatters: 'Roadmap reveals signal strategic direction and future needs' },
    { pattern: /\b(pilot|proof\s+of\s+concept|PoC)\s+(program|launch|start)\b/i, subtype: 'pilot', severity: 'medium', intentScore: 52, whyItMatters: 'Pilot programs indicate technology evaluation and potential adoption' },
    { pattern: /\bprivate\s+(beta|preview|alpha)\b/i, subtype: 'private_beta', severity: 'medium', intentScore: 45, whyItMatters: 'Private beta signals early product development trajectory' },
    { pattern: /\bproduct\s+(demo|webinar|showcase)\b/i, subtype: 'product_demo', severity: 'medium', intentScore: 40, whyItMatters: 'Product demonstrations indicate market engagement strategy' },
  ],

  // ---------------------------------------------------------------------------
  // PARTNERSHIP
  // ---------------------------------------------------------------------------
  partnership: [
    // Critical
    { pattern: /\bstrategic\s+(partnership|alliance|collaboration)\s+(with|announced|signed)\b/i, subtype: 'strategic_partnership', severity: 'critical', intentScore: 80, whyItMatters: 'Strategic partnerships signal technology alignment and integration' },
    { pattern: /\bjoint\s+venture\s+(announced|launched|formed|with)\b/i, subtype: 'joint_venture', severity: 'critical', intentScore: 82, whyItMatters: 'Joint ventures create new technology stack requirements' },
    { pattern: /\b(partners?|teamed)\s+with\s+(Microsoft|Google|Amazon|AWS|Salesforce|Oracle|SAP)\b/i, subtype: 'major_tech_partnership', severity: 'critical', intentScore: 85, whyItMatters: 'Major tech partnership reveals platform strategy and integration needs' },
    { pattern: /\bexclusive\s+(partnership|agreement|deal)\b/i, subtype: 'exclusive_deal', severity: 'critical', intentScore: 78, whyItMatters: 'Exclusive partnerships reshape vendor ecosystem decisions' },
    { pattern: /\b(signs?|signed)\s+(multi[\s-]year|multi[\s-]million)\s+(deal|contract|agreement|partnership)\b/i, subtype: 'major_deal', severity: 'critical', intentScore: 85, whyItMatters: 'Multi-year/million deals signal deep technology commitment' },
    // High
    { pattern: /\bpartnership\s+(announced|formed|established|expanded)\b/i, subtype: 'partnership', severity: 'high', intentScore: 65, whyItMatters: 'New partnerships create integration and complementary tool needs' },
    { pattern: /\b(channel|reseller|distribution)\s+partner(ship)?\b/i, subtype: 'channel_partnership', severity: 'high', intentScore: 60, whyItMatters: 'Channel partnerships expand market reach and technology needs' },
    { pattern: /\btechnology\s+partner(ship)?\s+(with|announced)\b/i, subtype: 'tech_partnership', severity: 'high', intentScore: 68, whyItMatters: 'Technology partnerships drive integration and tooling decisions' },
    { pattern: /\bintegration\s+partner(ship)?\b/i, subtype: 'integration_partnership', severity: 'high', intentScore: 65, whyItMatters: 'Integration partnerships create complementary tool opportunities' },
    { pattern: /\b(OEM|white[\s-]label|co[\s-]brand)\s+(agreement|deal|partnership)\b/i, subtype: 'oem_deal', severity: 'high', intentScore: 70, whyItMatters: 'OEM deals signal deep technology integration and scaling' },
    // Medium
    { pattern: /\bcollaborat(e|es|ion|ing)\s+with\b/i, subtype: 'collaboration', severity: 'medium', intentScore: 42, whyItMatters: 'Collaborations indicate openness to external technology relationships' },
    { pattern: /\bMOU\s+(signed|executed|announced)\b/i, subtype: 'mou', severity: 'medium', intentScore: 48, whyItMatters: 'MOUs signal early-stage partnership and potential technology alignment' },
    { pattern: /\baffiliate\s+(program|partnership|agreement)\b/i, subtype: 'affiliate', severity: 'medium', intentScore: 38, whyItMatters: 'Affiliate programs indicate market expansion strategy' },
    { pattern: /\b(academic|university|research)\s+partnership\b/i, subtype: 'academic_partnership', severity: 'medium', intentScore: 40, whyItMatters: 'Academic partnerships signal R&D direction and innovation focus' },
    { pattern: /\becosystem\s+(partner|expansion|growth)\b/i, subtype: 'ecosystem', severity: 'medium', intentScore: 45, whyItMatters: 'Ecosystem expansion reveals platform strategy direction' },
  ],

  // ---------------------------------------------------------------------------
  // EARNINGS
  // ---------------------------------------------------------------------------
  earnings: [
    // Critical
    { pattern: /\bearnings\s+(beat|surpass|exceed|crush)\b/i, subtype: 'earnings_beat', severity: 'critical', intentScore: 78, whyItMatters: 'Earnings beat signals healthy finances and investment capacity' },
    { pattern: /\b(raises?|increases?)\s+(guidance|outlook|forecast)\b/i, subtype: 'raised_guidance', severity: 'critical', intentScore: 80, whyItMatters: 'Raised guidance indicates confidence and increased spending capacity' },
    { pattern: /\brecord\s+(earnings|profit|EBITDA|revenue)\b/i, subtype: 'record_earnings', severity: 'critical', intentScore: 82, whyItMatters: 'Record earnings unlock discretionary technology budgets' },
    { pattern: /\b(EPS|earnings\s+per\s+share)\s+(beats?|exceeds?|surpass)\b/i, subtype: 'eps_beat', severity: 'critical', intentScore: 78, whyItMatters: 'EPS beat confirms financial health and investment runway' },
    { pattern: /\bupward\s+(revision|guidance|estimate|forecast)\b/i, subtype: 'upward_revision', severity: 'critical', intentScore: 76, whyItMatters: 'Upward revision signals improving business conditions' },
    // High
    { pattern: /\bearnings\s+(call|report|release|announcement)\b/i, subtype: 'earnings_report', severity: 'high', intentScore: 60, whyItMatters: 'Earnings reports reveal strategic priorities and spending plans' },
    { pattern: /\b(quarterly|annual)\s+earnings\b/i, subtype: 'periodic_earnings', severity: 'high', intentScore: 58, whyItMatters: 'Periodic earnings reveal financial health trajectory' },
    { pattern: /\bprofit\s+(margin|growth|increase)\b/i, subtype: 'profit_growth', severity: 'high', intentScore: 65, whyItMatters: 'Profit growth indicates reinvestment capacity' },
    { pattern: /\bEBITDA\s+(growth|increase|improvement)\b/i, subtype: 'ebitda_growth', severity: 'high', intentScore: 65, whyItMatters: 'EBITDA growth signals operational efficiency and investment capacity' },
    { pattern: /\boperating\s+(income|profit)\s+(grows?|increase|improve)\b/i, subtype: 'operating_income', severity: 'high', intentScore: 62, whyItMatters: 'Operating income growth supports technology investment decisions' },
    // Medium
    { pattern: /\bearnings\s+(miss|disappoint|fall\s+short)\b/i, subtype: 'earnings_miss', severity: 'medium', intentScore: 40, whyItMatters: 'Earnings miss may drive cost-optimization vendor conversations' },
    { pattern: /\b(lowers?|cuts?|reduces?)\s+(guidance|outlook|forecast)\b/i, subtype: 'lowered_guidance', severity: 'medium', intentScore: 38, whyItMatters: 'Lowered guidance may shift focus to efficiency-driven purchases' },
    { pattern: /\banalyst\s+(estimate|consensus|expectation)\b/i, subtype: 'analyst_estimate', severity: 'medium', intentScore: 42, whyItMatters: 'Analyst estimates provide context for company financial health' },
    { pattern: /\bshareholder\s+(meeting|vote|letter)\b/i, subtype: 'shareholder', severity: 'medium', intentScore: 35, whyItMatters: 'Shareholder communications reveal strategic direction' },
    { pattern: /\bdividend\s+(increase|announced|declared)\b/i, subtype: 'dividend', severity: 'medium', intentScore: 38, whyItMatters: 'Dividend policy indicates capital allocation philosophy' },
  ],

  // ---------------------------------------------------------------------------
  // SOCIAL
  // ---------------------------------------------------------------------------
  social: [
    // Critical
    { pattern: /\b(viral|trending)\s+(post|tweet|content|video)\b/i, subtype: 'viral_content', severity: 'critical', intentScore: 60, whyItMatters: 'Viral content about pain points signals immediate engagement opportunity' },
    { pattern: /\bpublic(ly)?\s+(complain|criticiz|frustrat)\w*\s+(about|with)\b/i, subtype: 'public_complaint', severity: 'critical', intentScore: 75, whyItMatters: 'Public complaints about vendors create competitive displacement opportunity' },
    { pattern: /\b(CEO|CTO|CIO)\s+(posts?|shares?|tweets?|announces?)\b/i, subtype: 'exec_social', severity: 'critical', intentScore: 70, whyItMatters: 'Executive social activity reveals priorities and decision-making signals' },
    { pattern: /\b(looking\s+for|seeking|evaluating)\s+(recommendations?|suggestions?|alternatives?)\b/i, subtype: 'recommendation_request', severity: 'critical', intentScore: 85, whyItMatters: 'Public recommendation requests indicate active buying intent' },
    { pattern: /\bwho\s+(uses?|recommends?|suggests?)\s+(a|the|good)\b/i, subtype: 'recommendation_seek', severity: 'critical', intentScore: 80, whyItMatters: 'Social recommendation seeking signals evaluation stage' },
    // High
    { pattern: /\blinkedin\s+(post|article|update)\s+(about|regarding|mentioning)\b/i, subtype: 'linkedin_post', severity: 'high', intentScore: 55, whyItMatters: 'LinkedIn content reveals professional focus and engagement' },
    { pattern: /\bthought\s+leadership\s+(post|article|content)\b/i, subtype: 'thought_leadership', severity: 'high', intentScore: 50, whyItMatters: 'Thought leadership signals expertise areas and strategic focus' },
    { pattern: /\bconference\s+(speaker|presentation|keynote|talk)\b/i, subtype: 'conference', severity: 'high', intentScore: 55, whyItMatters: 'Conference participation reveals technology focus areas' },
    { pattern: /\bwebinar\s+(host|speaker|presentation|attending)\b/i, subtype: 'webinar', severity: 'high', intentScore: 52, whyItMatters: 'Webinar engagement signals active learning and evaluation' },
    { pattern: /\bpodcast\s+(guest|appearance|interview|episode)\b/i, subtype: 'podcast', severity: 'high', intentScore: 48, whyItMatters: 'Podcast appearances reveal executive priorities and interests' },
    // Medium
    { pattern: /\b(blog|article)\s+(post|published|written|authored)\b/i, subtype: 'blog_post', severity: 'medium', intentScore: 38, whyItMatters: 'Blog content reveals organizational priorities and expertise' },
    { pattern: /\bsocial\s+media\s+(campaign|strategy|presence)\b/i, subtype: 'social_strategy', severity: 'medium', intentScore: 35, whyItMatters: 'Social strategy signals marketing investment direction' },
    { pattern: /\b(engag|interact|comment)\w*\s+(with|on)\s+(post|content|article)\b/i, subtype: 'engagement', severity: 'medium', intentScore: 40, whyItMatters: 'Social engagement reveals interest areas and potential needs' },
    { pattern: /\bcommunity\s+(launch|forum|group|event)\b/i, subtype: 'community', severity: 'medium', intentScore: 38, whyItMatters: 'Community engagement signals ecosystem and tooling preferences' },
    { pattern: /\b(award|recognition|honor)\s+(winner|finalist|recipient|nominated)\b/i, subtype: 'award', severity: 'medium', intentScore: 35, whyItMatters: 'Awards signal company growth trajectory and market validation' },
  ],
};
