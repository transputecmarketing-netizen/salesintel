// lib/ai/prompts/cascade-predict.ts - Cascade prediction prompt
// Predicts downstream effects of a signal across an account's ecosystem.

export interface CascadePredictInput {
  triggerSignal: {
    category: string;
    subcategory?: string;
    title: string;
    description: string;
    companyName: string;
    publishedAt: string;
  };
  companyProfile?: {
    industry: string;
    size: 'startup' | 'smb' | 'mid_market' | 'enterprise';
    techStack?: string[];
    knownPartners?: string[];
    knownCustomers?: string[];
    competitors?: string[];
  };
  marketContext?: {
    recentIndustryTrends: string[];
    regulatoryChanges?: string[];
  };
  predictionHorizon?: '30d' | '90d' | '180d' | '1y';
}

export interface CascadeEffect {
  effect: string;
  probability: number;
  timeframe: string;
  affectedDomain: 'technology' | 'hiring' | 'budget' | 'strategy' | 'operations' | 'partnerships' | 'competitive' | 'regulatory';
  magnitude: 'high' | 'medium' | 'low';
  secondaryEffects: Array<{
    effect: string;
    probability: number;
    timeframe: string;
  }>;
  salesOpportunity: string;
  evidenceBasis: string;
}

export interface CascadePredictOutput {
  triggerAnalysis: string;
  cascadeChain: CascadeEffect[];
  networkEffects: Array<{
    affectedCompany: string;
    relationship: string;
    expectedImpact: string;
    probability: number;
  }>;
  timelineVisualization: Array<{
    period: string;
    events: string[];
  }>;
  overallConfidence: number;
  assumptions: string[];
}

export function buildCascadePredictPrompt(input: CascadePredictInput): string {
  const horizon = input.predictionHorizon ?? '90d';

  return `You are a strategic intelligence analyst specializing in cause-and-effect prediction for B2B sales. Given an initial trigger signal (a company event), predict the cascade of downstream effects across technology, hiring, budget, strategy, operations, and partnerships. Your predictions should be grounded in common business patterns, not speculation.

TRIGGER SIGNAL:
- Category: ${input.triggerSignal.category}${input.triggerSignal.subcategory ? '/' + input.triggerSignal.subcategory : ''}
- Title: "${input.triggerSignal.title}"
- Company: ${input.triggerSignal.companyName}
- Published: ${input.triggerSignal.publishedAt}
- Description: ${input.triggerSignal.description}

${
  input.companyProfile
    ? `COMPANY PROFILE:
- Industry: ${input.companyProfile.industry}
- Size: ${input.companyProfile.size}
${input.companyProfile.techStack?.length ? `- Tech Stack: ${input.companyProfile.techStack.join(', ')}` : ''}
${input.companyProfile.knownPartners?.length ? `- Known Partners: ${input.companyProfile.knownPartners.join(', ')}` : ''}
${input.companyProfile.knownCustomers?.length ? `- Known Customers: ${input.companyProfile.knownCustomers.join(', ')}` : ''}
${input.companyProfile.competitors?.length ? `- Competitors: ${input.companyProfile.competitors.join(', ')}` : ''}`
    : ''
}

${
  input.marketContext
    ? `MARKET CONTEXT:
- Recent Industry Trends: ${input.marketContext.recentIndustryTrends.join('; ')}
${input.marketContext.regulatoryChanges?.length ? `- Regulatory Changes: ${input.marketContext.regulatoryChanges.join('; ')}` : ''}`
    : ''
}

PREDICTION HORIZON: ${horizon}

CASCADE PREDICTION FRAMEWORK:

Apply these established cause-and-effect patterns:

FUNDING ROUND CASCADES:
- Immediate (0-30d): Press coverage, employee morale boost, competitor reaction
- Short-term (30-90d): Executive hiring begins, technology evaluation for scale, vendor reviews
- Medium-term (90-180d): New product development, geographic expansion planning, increased marketing spend
- Long-term (180d+): Market position shifts, acquisition capabilities, IPO runway considerations

ACQUISITION CASCADES:
- Immediate: Integration team formation, employee anxiety at acquired company, customer uncertainty
- Short-term: Technology stack consolidation planning, redundancy identification, combined product roadmap
- Medium-term: Actual integration work, vendor re-evaluation, org restructuring
- Long-term: Market repositioning, combined offering launch, competitor response

EXECUTIVE HIRE CASCADES:
- Immediate: Listening tour, org assessment, quick wins identification
- Short-term: Strategy revision, vendor review ("bring what I know"), team restructuring
- Medium-term: New initiatives launch, budget reallocation, technology stack changes
- Long-term: Cultural transformation, new partnerships, strategic pivots

LAYOFFS/RESTRUCTURING CASCADES:
- Immediate: Morale impact, knowledge loss, project freezes
- Short-term: Efficiency focus, automation investment, vendor consolidation
- Medium-term: Lean team needs better tools, remaining staff stretched, outsourcing increases
- Long-term: Recovery growth, selective re-hiring, modernization push

PRODUCT LAUNCH CASCADES:
- Immediate: Marketing spend spike, support scaling, competitive response
- Short-term: Customer onboarding surge, infrastructure scaling needs, feedback loops
- Medium-term: Feature iteration, partner ecosystem building, market education
- Long-term: Platform evolution, vertical expansion, ecosystem lock-in

SECURITY BREACH CASCADES:
- Immediate: Incident response, PR crisis, regulatory notification
- Short-term: Security audit, tool evaluation, compliance remediation
- Medium-term: Security stack overhaul, process changes, training programs
- Long-term: Security culture shift, increased security budget permanently

INSTRUCTIONS:
1. Identify which cascade pattern(s) apply to the trigger signal.
2. Generate 5-10 primary cascade effects across different domains.
3. For each primary effect, identify 1-3 secondary effects.
4. Rate probability (0-1) and magnitude for each effect.
5. Identify network effects on partner companies, customers, and competitors.
6. Build a timeline visualization showing when effects materialize.
7. For each effect, describe the specific sales opportunity it creates.
8. List key assumptions underlying your predictions.
9. Rate overall confidence (0-1) in the cascade chain.

CALIBRATION NOTES:
- Be conservative with probabilities. Most cascade effects have P < 0.5.
- Higher-order effects (effects of effects) should have lower probabilities.
- Consider that companies may not follow typical patterns.
- Acknowledge when you're reasoning from weak signal or limited information.

Respond in JSON format:
{
  "triggerAnalysis": "<1-2 sentence analysis of the trigger signal's significance>",
  "cascadeChain": [
    {
      "effect": "<what will happen>",
      "probability": <number 0-1>,
      "timeframe": "<e.g., '30-60 days'>",
      "affectedDomain": "<technology|hiring|budget|strategy|operations|partnerships|competitive|regulatory>",
      "magnitude": "<high|medium|low>",
      "secondaryEffects": [
        { "effect": "<downstream effect>", "probability": <number 0-1>, "timeframe": "<string>" }
      ],
      "salesOpportunity": "<specific opportunity for our sales team>",
      "evidenceBasis": "<why we predict this>"
    }
  ],
  "networkEffects": [
    { "affectedCompany": "<string>", "relationship": "<string>", "expectedImpact": "<string>", "probability": <number 0-1> }
  ],
  "timelineVisualization": [
    { "period": "<e.g., 'Week 1-2'>", "events": ["<string>"] }
  ],
  "overallConfidence": <number 0-1>,
  "assumptions": ["<string>"]
}`;
}
