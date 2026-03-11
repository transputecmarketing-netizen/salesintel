// lib/ai/prompts/synthesize-brief.ts - Intelligence brief generation prompt
// Synthesizes multiple signals into a concise, actionable intelligence brief.

export interface SynthesizeBriefInput {
  companyName: string;
  industry?: string;
  signals: Array<{
    category: string;
    subcategory?: string;
    title: string;
    description: string;
    source: string;
    publishedAt: string;
    actionability: string;
  }>;
  intentScore?: number;
  buyingStage?: string;
  recipientRole?: string;
  previousBriefDate?: string;
  accountContext?: {
    dealStage?: string;
    accountOwner?: string;
    currentProducts?: string[];
    annualContractValue?: number;
  };
}

export interface SynthesizeBriefOutput {
  headline: string;
  executiveSummary: string;
  keyDevelopments: Array<{
    title: string;
    significance: string;
    salesImplication: string;
  }>;
  competitiveContext: string;
  recommendedActions: Array<{
    priority: number;
    action: string;
    rationale: string;
    deadline: string;
  }>;
  talkingPoints: string[];
  riskAlerts: string[];
  briefConfidence: number;
}

export function buildSynthesizeBriefPrompt(input: SynthesizeBriefInput): string {
  const signalsList = input.signals
    .map(
      (s, i) =>
        `  ${i + 1}. [${s.category}${s.subcategory ? '/' + s.subcategory : ''}] "${s.title}"
     Source: ${s.source} | Published: ${s.publishedAt} | Actionability: ${s.actionability}
     ${s.description.slice(0, 300)}`
    )
    .join('\n\n');

  return `You are a senior sales intelligence analyst preparing a briefing document for a B2B sales team. Your brief must be concise, actionable, and directly tied to revenue outcomes. Avoid generic advice; every recommendation must be specific to the signals provided.

ACCOUNT OVERVIEW:
- Company: ${input.companyName}
${input.industry ? `- Industry: ${input.industry}` : ''}
${input.intentScore !== undefined ? `- Intent Score: ${input.intentScore}/100` : ''}
${input.buyingStage ? `- Buying Stage: ${input.buyingStage}` : ''}
${input.recipientRole ? `- Brief Recipient Role: ${input.recipientRole}` : ''}
${input.previousBriefDate ? `- Previous Brief: ${input.previousBriefDate}` : ''}
${
  input.accountContext
    ? `- Account Context:
    Deal Stage: ${input.accountContext.dealStage || 'N/A'}
    Owner: ${input.accountContext.accountOwner || 'Unassigned'}
    Products: ${input.accountContext.currentProducts?.join(', ') || 'None'}
    ACV: ${input.accountContext.annualContractValue ? '$' + input.accountContext.annualContractValue.toLocaleString() : 'Unknown'}`
    : ''
}

RAW SIGNALS (${input.signals.length}):
${signalsList}

BRIEF REQUIREMENTS:

1. HEADLINE: A single compelling sentence that captures the most important development. Should create urgency when relevant. Max 120 characters.

2. EXECUTIVE SUMMARY: 2-3 sentences covering what happened, why it matters for our sales effort, and what should happen next. Write for a busy VP of Sales who reads 50 briefs a day.

3. KEY DEVELOPMENTS: For each significant signal cluster:
   - Title: What happened (factual, concise)
   - Significance: Why this matters in the context of this account
   - Sales Implication: How this affects our sales motion (specific to deal stage)

4. COMPETITIVE CONTEXT: Based on the signals, infer any competitive dynamics. Are competitors being mentioned? Is the company evaluating alternatives? Is there a technology shift that opens or closes doors?

5. RECOMMENDED ACTIONS: Ranked by priority (1 = most urgent):
   - Action: Specific step (e.g., "Schedule call with new CTO within 48 hours")
   - Rationale: Why this action, tied to a specific signal
   - Deadline: When this should happen (specific date or relative timeframe)

6. TALKING POINTS: 3-5 conversation starters that reference the signals naturally. These should feel informed, not stalky. They should demonstrate awareness of the company's challenges.

7. RISK ALERTS: Any signals that suggest risk to the deal (budget cuts, leadership turnover, competitor momentum, negative earnings).

8. CONFIDENCE: Self-assess the quality of this brief (0.0-1.0) based on signal quantity, recency, and consistency.

STYLE GUIDELINES:
- Use active voice and strong verbs
- Quantify when possible (dollar amounts, percentages, headcounts)
- No filler words or hedging language
- Reference specific signals by quoting titles when relevant
- Time-box all recommendations

Respond in JSON format matching this schema:
{
  "headline": "<string max 120 chars>",
  "executiveSummary": "<string>",
  "keyDevelopments": [
    { "title": "<string>", "significance": "<string>", "salesImplication": "<string>" }
  ],
  "competitiveContext": "<string>",
  "recommendedActions": [
    { "priority": <number>, "action": "<string>", "rationale": "<string>", "deadline": "<string>" }
  ],
  "talkingPoints": ["<string>"],
  "riskAlerts": ["<string>"],
  "briefConfidence": <number 0-1>
}`;
}
