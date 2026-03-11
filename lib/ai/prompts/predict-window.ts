// lib/ai/prompts/predict-window.ts - Buying window prediction prompt
// Predicts optimal timing for sales engagement based on signal patterns.

export interface PredictWindowInput {
  companyName: string;
  industry?: string;
  companySize?: 'startup' | 'smb' | 'mid_market' | 'enterprise';
  fiscalYearEnd?: string;
  signals: Array<{
    category: string;
    subcategory?: string;
    title: string;
    publishedAt: string;
    actionability: string;
  }>;
  historicalPatterns?: {
    averageSalesCycleDays?: number;
    typicalBudgetCycle?: string;
    previousPurchaseDate?: string;
  };
  marketContext?: {
    economicClimate: 'expansion' | 'stable' | 'contraction' | 'recession';
    industryTrend: 'growing' | 'stable' | 'declining';
    competitorActivity: string;
  };
}

export interface PredictWindowOutput {
  optimalWindowStart: string;
  optimalWindowEnd: string;
  confidence: number;
  peakProbabilityDate: string;
  purchaseProbability: number;
  windowDrivers: Array<{
    factor: string;
    impact: 'accelerates' | 'delays' | 'neutral';
    explanation: string;
    weight: number;
  }>;
  budgetCycleAlignment: string;
  triggerEvents: Array<{
    event: string;
    expectedDate: string;
    probability: number;
    impact: string;
  }>;
  engagementTimeline: Array<{
    phase: string;
    startDate: string;
    endDate: string;
    activities: string[];
  }>;
  alternativeScenarios: Array<{
    scenario: string;
    probability: number;
    windowShift: string;
    requiredTrigger: string;
  }>;
}

export function buildPredictWindowPrompt(input: PredictWindowInput): string {
  const signalsList = input.signals
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.category}${s.subcategory ? '/' + s.subcategory : ''}] "${s.title}" (${s.publishedAt}) - Actionability: ${s.actionability}`
    )
    .join('\n');

  const today = new Date().toISOString().split('T')[0];

  return `You are a predictive analytics engine for B2B sales timing. Your job is to analyze signal patterns, company characteristics, and market context to predict the optimal buying window. Your predictions must be grounded in evidence, not speculation.

TODAY'S DATE: ${today}

COMPANY PROFILE:
- Name: ${input.companyName}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.companySize ? `- Size Segment: ${input.companySize}` : ''}
${input.fiscalYearEnd ? `- Fiscal Year End: ${input.fiscalYearEnd}` : ''}

CURRENT SIGNALS:
${signalsList}

${
  input.historicalPatterns
    ? `HISTORICAL PATTERNS:
- Average Sales Cycle: ${input.historicalPatterns.averageSalesCycleDays ? input.historicalPatterns.averageSalesCycleDays + ' days' : 'Unknown'}
- Typical Budget Cycle: ${input.historicalPatterns.typicalBudgetCycle || 'Unknown'}
- Previous Purchase Date: ${input.historicalPatterns.previousPurchaseDate || 'N/A'}`
    : ''
}

${
  input.marketContext
    ? `MARKET CONTEXT:
- Economic Climate: ${input.marketContext.economicClimate}
- Industry Trend: ${input.marketContext.industryTrend}
- Competitor Activity: ${input.marketContext.competitorActivity}`
    : ''
}

PREDICTION FRAMEWORK:

1. BUDGET CYCLE ANALYSIS:
   - Fiscal year end drives budget availability (+/- 3 months of FYE = prime window)
   - Q4 "use it or lose it" budget acceleration
   - Q1 new budget allocation period
   - Mid-year budget reviews (potential for unplanned purchases)
   - Enterprise: 6-12 month planning cycles
   - Mid-market: 3-6 month cycles
   - SMB/Startup: ad hoc, event-driven

2. SIGNAL-BASED TRIGGERS:
   - Funding round: Buying window opens 30-90 days post-announcement (time to hire, plan)
   - New executive: 60-120 days (listening tour, then new initiatives)
   - Technology adoption signal: 14-60 days (active evaluation)
   - Expansion announcement: 30-90 days (infrastructure needs)
   - Earnings beat: 30-60 days (confidence to invest)
   - Earnings miss: 60-120 days (cost optimization tools)
   - Security breach: 7-30 days (urgent response)
   - Layoffs: 60-180 days (efficiency/automation needs)

3. MARKET MODIFIERS:
   - Expansion economy: Shorten windows by 20%
   - Contraction economy: Lengthen windows by 40%
   - Industry growth: +10% purchase probability
   - Industry decline: -15% purchase probability, but efficiency tools gain

4. ENGAGEMENT TIMELINE:
   Based on the predicted window, work backwards to plan:
   - Awareness phase: Start 2x sales cycle before window
   - Education phase: Start 1.5x before
   - Evaluation support: Start 1x before
   - Decision support: During the window
   - Close: Peak probability date

INSTRUCTIONS:
1. Analyze all signals and their dates relative to today.
2. Identify the primary window driver (which factor most influences timing).
3. Calculate the optimal buying window (start and end dates).
4. Identify the peak probability date within the window.
5. Estimate purchase probability (0-1) at the peak date.
6. List all factors accelerating or delaying the window.
7. Identify upcoming trigger events that could shift the window.
8. Build a phased engagement timeline working backwards from the window.
9. Describe 2-3 alternative scenarios with different trigger outcomes.

All dates must be in YYYY-MM-DD format.

Respond in JSON format matching this schema:
{
  "optimalWindowStart": "<YYYY-MM-DD>",
  "optimalWindowEnd": "<YYYY-MM-DD>",
  "confidence": <number 0-1>,
  "peakProbabilityDate": "<YYYY-MM-DD>",
  "purchaseProbability": <number 0-1>,
  "windowDrivers": [
    { "factor": "<string>", "impact": "<accelerates|delays|neutral>", "explanation": "<string>", "weight": <number 0-1> }
  ],
  "budgetCycleAlignment": "<string>",
  "triggerEvents": [
    { "event": "<string>", "expectedDate": "<YYYY-MM-DD>", "probability": <number 0-1>, "impact": "<string>" }
  ],
  "engagementTimeline": [
    { "phase": "<string>", "startDate": "<YYYY-MM-DD>", "endDate": "<YYYY-MM-DD>", "activities": ["<string>"] }
  ],
  "alternativeScenarios": [
    { "scenario": "<string>", "probability": <number 0-1>, "windowShift": "<string>", "requiredTrigger": "<string>" }
  ]
}`;
}
