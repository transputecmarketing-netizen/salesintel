// lib/ai/prompts/score-intent.ts - Intent scoring prompt
// Scores buying intent based on accumulated signals for a company.

export interface ScoreIntentInput {
  companyName: string;
  industry?: string;
  employeeCount?: number;
  signals: Array<{
    category: string;
    title: string;
    description: string;
    publishedAt: string;
    confidence: number;
  }>;
  existingRelationship?: {
    status: string;
    lastContactDate?: string;
    currentProducts?: string[];
  };
  targetProduct?: string;
}

export interface ScoreIntentOutput {
  overallScore: number;
  buyingStage: 'unaware' | 'awareness' | 'consideration' | 'evaluation' | 'decision' | 'post_purchase';
  urgency: 'critical' | 'high' | 'medium' | 'low';
  signalStrength: number;
  recencyBoost: number;
  frequencyMultiplier: number;
  intentIndicators: Array<{
    indicator: string;
    weight: number;
    evidence: string;
  }>;
  recommendedAction: string;
  estimatedTimeline: string;
  riskFactors: string[];
  opportunitySize: 'enterprise' | 'mid_market' | 'smb' | 'unknown';
}

export function buildScoreIntentPrompt(input: ScoreIntentInput): string {
  const signalsList = input.signals
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.category}] "${s.title}" (${s.publishedAt}, confidence: ${s.confidence})\n     ${s.description.slice(0, 200)}`
    )
    .join('\n');

  return `You are a B2B sales intelligence scoring engine. Your task is to analyze accumulated signals for a company and produce a buying intent score with detailed rationale. You must be calibrated: avoid inflating scores without strong evidence.

COMPANY PROFILE:
- Name: ${input.companyName}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.employeeCount ? `- Employee Count: ~${input.employeeCount}` : ''}
${input.targetProduct ? `- Target Product/Solution: ${input.targetProduct}` : ''}
${
  input.existingRelationship
    ? `- Existing Relationship: ${input.existingRelationship.status}
  Last Contact: ${input.existingRelationship.lastContactDate || 'Unknown'}
  Current Products: ${input.existingRelationship.currentProducts?.join(', ') || 'None'}`
    : '- Existing Relationship: None / Unknown'
}

ACCUMULATED SIGNALS (${input.signals.length} total):
${signalsList}

SCORING METHODOLOGY:
Apply the following framework to calculate an intent score from 0-100:

1. SIGNAL STRENGTH (0-40 points):
   - funding_round: +15 (they have budget to spend)
   - executive_hire (CTO/CIO/CISO): +12 (new leader = new initiatives)
   - technology_adoption: +20 (actively evaluating solutions)
   - expansion/headcount_growth: +10 (scaling needs)
   - product_launch: +5 (may need supporting tools)
   - contract_win: +8 (revenue growth = budget growth)
   - layoffs_restructuring: -5 (tighter budgets, but possible efficiency tools need)
   - security_breach: +15 if selling security, -5 otherwise
   - earnings (positive): +8, (negative): -3

2. RECENCY BOOST (0-20 points):
   - Signal within 24 hours: +20
   - Within 3 days: +15
   - Within 1 week: +10
   - Within 2 weeks: +5
   - Within 1 month: +2
   - Older: 0

3. FREQUENCY MULTIPLIER (0-20 points):
   - 5+ signals in 30 days: +20 (high activity = high intent)
   - 3-4 signals: +12
   - 2 signals: +6
   - 1 signal: +2

4. RELATIONSHIP CONTEXT (0-20 points):
   - Active customer (upsell): +15
   - Former customer (winback): +10
   - In pipeline: +12
   - Net new: +5
   - Competitor customer: +8

BUYING STAGE HEURISTICS:
- "unaware": Score 0-15, no relevant signals
- "awareness": Score 16-30, general industry activity
- "consideration": Score 31-50, exploring solutions
- "evaluation": Score 51-70, comparing vendors
- "decision": Score 71-85, ready to purchase
- "post_purchase": Score 86-100, existing customer expansion

INSTRUCTIONS:
1. Calculate each component score using the methodology above.
2. Sum them for the overall score (cap at 100).
3. Determine the buying stage based on the overall score and signal patterns.
4. Identify specific intent indicators with supporting evidence.
5. Recommend a concrete next action for the sales team.
6. Estimate a purchasing timeline (e.g., "1-3 months", "3-6 months", "6-12 months").
7. List risk factors that could prevent a deal.
8. Estimate opportunity size based on company profile.

Respond in JSON format matching this schema:
{
  "overallScore": <number 0-100>,
  "buyingStage": "<string>",
  "urgency": "<critical|high|medium|low>",
  "signalStrength": <number 0-40>,
  "recencyBoost": <number 0-20>,
  "frequencyMultiplier": <number 0-20>,
  "intentIndicators": [
    { "indicator": "<string>", "weight": <number>, "evidence": "<string>" }
  ],
  "recommendedAction": "<string>",
  "estimatedTimeline": "<string>",
  "riskFactors": ["<string>"],
  "opportunitySize": "<enterprise|mid_market|smb|unknown>"
}`;
}
