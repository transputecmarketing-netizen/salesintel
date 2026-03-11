// lib/ai/prompts/analyze-earnings.ts - Earnings call analysis prompt
// Extracts sales intelligence from earnings reports and call transcripts.

export interface AnalyzeEarningsInput {
  companyName: string;
  ticker?: string;
  quarter: string;
  year: number;
  earningsData?: {
    revenue?: number;
    revenueGrowthYoY?: number;
    netIncome?: number;
    eps?: number;
    epsEstimate?: number;
    guidance?: string;
  };
  transcriptExcerpts?: string[];
  pressReleaseText?: string;
  previousQuarterContext?: {
    revenue?: number;
    keyInitiatives?: string[];
    guidanceGiven?: string;
  };
  sellerContext?: {
    productCategory: string;
    targetBuyerPersona: string;
    relevantKeywords: string[];
  };
}

export interface AnalyzeEarningsOutput {
  summary: string;
  financialHealth: 'strong' | 'stable' | 'weakening' | 'distressed';
  beatOrMiss: 'beat' | 'met' | 'missed' | 'unknown';
  growthTrajectory: 'accelerating' | 'stable' | 'decelerating' | 'declining';
  keyMetrics: Array<{
    metric: string;
    value: string;
    trend: 'up' | 'flat' | 'down';
    significance: string;
  }>;
  strategicInitiatives: Array<{
    initiative: string;
    budget_signal: 'increasing' | 'stable' | 'decreasing' | 'unknown';
    timeline: string;
    salesRelevance: string;
  }>;
  technologyMentions: Array<{
    technology: string;
    context: 'investing' | 'evaluating' | 'reducing' | 'neutral';
    quote?: string;
  }>;
  painPoints: Array<{
    painPoint: string;
    evidence: string;
    productFit: string;
  }>;
  competitorMentions: Array<{
    competitor: string;
    context: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
  hiringSignals: {
    headcountTrend: 'growing' | 'stable' | 'shrinking';
    keyRolesmentioned: string[];
    investmentAreas: string[];
  };
  salesImplications: Array<{
    implication: string;
    urgency: 'immediate' | 'near_term' | 'long_term';
    action: string;
  }>;
  riskFactors: string[];
  sentimentScore: number;
}

export function buildAnalyzeEarningsPrompt(input: AnalyzeEarningsInput): string {
  const earningsSection = input.earningsData
    ? `FINANCIAL DATA:
- Revenue: ${input.earningsData.revenue ? '$' + (input.earningsData.revenue / 1e6).toFixed(1) + 'M' : 'N/A'}
- Revenue Growth YoY: ${input.earningsData.revenueGrowthYoY ? input.earningsData.revenueGrowthYoY.toFixed(1) + '%' : 'N/A'}
- Net Income: ${input.earningsData.netIncome ? '$' + (input.earningsData.netIncome / 1e6).toFixed(1) + 'M' : 'N/A'}
- EPS: ${input.earningsData.eps ? '$' + input.earningsData.eps.toFixed(2) : 'N/A'}
- EPS Estimate: ${input.earningsData.epsEstimate ? '$' + input.earningsData.epsEstimate.toFixed(2) : 'N/A'}
- Forward Guidance: ${input.earningsData.guidance || 'N/A'}`
    : '';

  const transcriptSection = input.transcriptExcerpts?.length
    ? `EARNINGS CALL TRANSCRIPT EXCERPTS:\n${input.transcriptExcerpts.map((t, i) => `--- Excerpt ${i + 1} ---\n${t}`).join('\n\n')}`
    : '';

  const pressReleaseSection = input.pressReleaseText
    ? `PRESS RELEASE:\n${input.pressReleaseText.slice(0, 3000)}`
    : '';

  const prevQuarterSection = input.previousQuarterContext
    ? `PREVIOUS QUARTER CONTEXT:
- Revenue: ${input.previousQuarterContext.revenue ? '$' + (input.previousQuarterContext.revenue / 1e6).toFixed(1) + 'M' : 'N/A'}
- Key Initiatives: ${input.previousQuarterContext.keyInitiatives?.join(', ') || 'N/A'}
- Guidance Given: ${input.previousQuarterContext.guidanceGiven || 'N/A'}`
    : '';

  return `You are a financial intelligence analyst specializing in extracting B2B sales signals from earnings reports and call transcripts. Your analysis should go beyond financial metrics to identify technology investments, strategic pivots, pain points, and buying triggers that a sales team can act on.

COMPANY: ${input.companyName}${input.ticker ? ` (${input.ticker})` : ''}
PERIOD: ${input.quarter} ${input.year}

${earningsSection}

${prevQuarterSection}

${transcriptSection}

${pressReleaseSection}

${
  input.sellerContext
    ? `SELLER CONTEXT (what we sell):
- Product Category: ${input.sellerContext.productCategory}
- Target Buyer Persona: ${input.sellerContext.targetBuyerPersona}
- Relevant Keywords to Watch: ${input.sellerContext.relevantKeywords.join(', ')}`
    : ''
}

ANALYSIS FRAMEWORK:

1. FINANCIAL HEALTH ASSESSMENT:
   - Compare actual vs. estimates (beat/met/missed)
   - Analyze revenue growth trajectory (YoY and QoQ trends)
   - Assess profitability and margin trends
   - Evaluate cash position and runway implications
   - Rate overall financial health: strong, stable, weakening, distressed

2. STRATEGIC INITIATIVE EXTRACTION:
   - Identify all mentioned strategic initiatives, transformations, or investments
   - For each initiative, assess budget trajectory (increasing/stable/decreasing)
   - Estimate timeline (this quarter, next quarter, next year)
   - Rate sales relevance (how well does this align with what we sell?)

3. TECHNOLOGY MENTIONS:
   - Extract all technology, platform, or tool references from transcripts
   - Categorize context: investing (buying/building), evaluating, reducing spend, neutral mention
   - Pull direct quotes when available

4. PAIN POINT IDENTIFICATION:
   - Read between the lines of management commentary
   - Identify challenges, headwinds, or areas of underperformance
   - Map pain points to potential product fit

5. COMPETITIVE INTELLIGENCE:
   - Extract all competitor mentions (direct or indirect)
   - Note context and management sentiment toward competitors
   - Identify competitive dynamics (gaining/losing share, new entrants)

6. HIRING & INVESTMENT SIGNALS:
   - Headcount trends (growing, stable, shrinking)
   - Specific roles or departments being invested in
   - Areas of increased/decreased investment

7. SALES IMPLICATIONS:
   - Derive specific, actionable implications for the sales team
   - Rank by urgency (immediate, near-term, long-term)
   - Suggest concrete next steps

8. SENTIMENT SCORE:
   - Overall management sentiment about the business (0.0 = very negative, 1.0 = very positive)
   - Based on language, tone, forward-looking statements

Respond in JSON format matching the schema:
{
  "summary": "<2-3 sentence overview>",
  "financialHealth": "<strong|stable|weakening|distressed>",
  "beatOrMiss": "<beat|met|missed|unknown>",
  "growthTrajectory": "<accelerating|stable|decelerating|declining>",
  "keyMetrics": [
    { "metric": "<string>", "value": "<string>", "trend": "<up|flat|down>", "significance": "<string>" }
  ],
  "strategicInitiatives": [
    { "initiative": "<string>", "budget_signal": "<increasing|stable|decreasing|unknown>", "timeline": "<string>", "salesRelevance": "<string>" }
  ],
  "technologyMentions": [
    { "technology": "<string>", "context": "<investing|evaluating|reducing|neutral>", "quote": "<string or null>" }
  ],
  "painPoints": [
    { "painPoint": "<string>", "evidence": "<string>", "productFit": "<string>" }
  ],
  "competitorMentions": [
    { "competitor": "<string>", "context": "<string>", "sentiment": "<positive|neutral|negative>" }
  ],
  "hiringSignals": {
    "headcountTrend": "<growing|stable|shrinking>",
    "keyRolesmentioned": ["<string>"],
    "investmentAreas": ["<string>"]
  },
  "salesImplications": [
    { "implication": "<string>", "urgency": "<immediate|near_term|long_term>", "action": "<string>" }
  ],
  "riskFactors": ["<string>"],
  "sentimentScore": <number 0-1>
}`;
}
