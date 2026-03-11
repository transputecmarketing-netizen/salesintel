// lib/ai/prompts/classify-signal.ts - Signal classification prompt
// Classifies raw news/events into actionable sales signal categories.

export type SignalCategory =
  | 'funding_round'
  | 'acquisition'
  | 'ipo_spac'
  | 'executive_hire'
  | 'executive_departure'
  | 'product_launch'
  | 'expansion'
  | 'partnership'
  | 'earnings_report'
  | 'layoffs_restructuring'
  | 'regulatory_action'
  | 'security_breach'
  | 'technology_adoption'
  | 'contract_win'
  | 'real_estate_move'
  | 'legal_action'
  | 'market_entry'
  | 'sustainability_initiative'
  | 'customer_milestone'
  | 'other';

export interface ClassifySignalInput {
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  existingCategories?: string[];
}

export interface ClassifySignalOutput {
  category: SignalCategory;
  subcategory: string;
  confidence: number;
  reasoning: string;
  companyMentions: string[];
  relevanceScore: number;
  actionability: 'high' | 'medium' | 'low' | 'none';
  timeDecay: 'urgent' | 'timely' | 'standard' | 'evergreen';
}

export function buildClassifySignalPrompt(input: ClassifySignalInput): string {
  return `You are a sales intelligence analyst for a B2B SaaS platform. Your job is to classify raw news articles and events into actionable sales signal categories. You must be precise, consistent, and avoid false positives.

CLASSIFICATION TAXONOMY:
- funding_round: Any venture capital, private equity, or debt financing announcement. Subcategories: seed, series_a, series_b, series_c, series_d_plus, growth_equity, debt_financing, grant.
- acquisition: Company acquires or merges with another entity. Subcategories: full_acquisition, majority_stake, asset_purchase, merger, acqui_hire.
- ipo_spac: Initial public offering or SPAC transaction. Subcategories: ipo_filing, ipo_pricing, spac_merger, direct_listing.
- executive_hire: New C-suite or VP-level executive appointment. Subcategories: ceo, cto, cfo, cmo, cro, ciso, vp_engineering, vp_sales, vp_product, board_member.
- executive_departure: Senior executive leaving or being replaced. Subcategories: resignation, termination, retirement, transition.
- product_launch: New product, feature, or major version release. Subcategories: new_product, major_update, beta_launch, ga_release, platform_expansion.
- expansion: Geographic expansion, new office, or market entry. Subcategories: new_office, new_region, new_market, headcount_growth.
- partnership: Strategic partnership, integration, or alliance. Subcategories: technology_integration, channel_partnership, strategic_alliance, joint_venture, reseller_agreement.
- earnings_report: Quarterly or annual financial results. Subcategories: quarterly_earnings, annual_report, revenue_guidance, profit_warning.
- layoffs_restructuring: Workforce reduction or organizational restructuring. Subcategories: layoffs, restructuring, cost_cutting, division_closure.
- regulatory_action: Government regulation, compliance, or enforcement. Subcategories: new_regulation, compliance_requirement, enforcement_action, investigation, approval.
- security_breach: Cybersecurity incident or data breach. Subcategories: data_breach, ransomware, vulnerability, compliance_failure.
- technology_adoption: Company adopting new technology or platform. Subcategories: cloud_migration, ai_adoption, digital_transformation, platform_switch.
- contract_win: Major contract or deal announcement. Subcategories: enterprise_deal, government_contract, multi_year_agreement.
- real_estate_move: Office lease, HQ relocation, or facility change. Subcategories: hq_relocation, new_lease, facility_closure, coworking.
- legal_action: Lawsuit, patent dispute, or legal settlement. Subcategories: patent_lawsuit, antitrust, class_action, settlement, ip_dispute.
- market_entry: Entering a new market segment or vertical. Subcategories: vertical_expansion, international_entry, segment_pivot.
- sustainability_initiative: ESG, sustainability, or social responsibility initiative. Subcategories: carbon_neutral, dei_initiative, social_impact, esg_report.
- customer_milestone: Customer count, ARR milestone, or usage metric. Subcategories: customer_count, arr_milestone, usage_milestone, case_study.
- other: Does not fit any category above.

SIGNAL METADATA:
- Title: ${input.title}
- Description: ${input.description}
- Source: ${input.source}
- Published: ${input.publishedAt}
${input.existingCategories?.length ? `- Existing Tags: ${input.existingCategories.join(', ')}` : ''}

INSTRUCTIONS:
1. Read the title and description carefully.
2. Identify the PRIMARY signal category (choose the most specific match).
3. Assign a subcategory from the allowed list for that category.
4. Rate your confidence (0.0 to 1.0) in the classification.
5. Provide brief reasoning for your classification (1-2 sentences).
6. Extract all company names mentioned (proper names only, not generic terms).
7. Score the relevance to B2B sales teams (0.0 to 1.0).
8. Rate actionability: "high" means a sales rep should act within 48 hours, "medium" within a week, "low" is informational, "none" is not relevant.
9. Assess time decay: "urgent" = value drops significantly after 24h, "timely" = within a week, "standard" = within a month, "evergreen" = long-term value.

Respond in JSON format matching this schema:
{
  "category": "<SignalCategory>",
  "subcategory": "<string>",
  "confidence": <number 0-1>,
  "reasoning": "<string>",
  "companyMentions": ["<string>", ...],
  "relevanceScore": <number 0-1>,
  "actionability": "<high|medium|low|none>",
  "timeDecay": "<urgent|timely|standard|evergreen>"
}`;
}
