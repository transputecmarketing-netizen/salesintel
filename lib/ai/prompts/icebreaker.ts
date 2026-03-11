// lib/ai/prompts/icebreaker.ts - Icebreaker generation from social posts
// Creates natural conversation starters based on a prospect's social media activity.

export interface IcebreakerInput {
  prospectName: string;
  prospectTitle: string;
  prospectCompany: string;
  socialPosts: Array<{
    platform: 'linkedin' | 'twitter' | 'blog' | 'podcast' | 'conference';
    content: string;
    date: string;
    engagementMetrics?: {
      likes?: number;
      comments?: number;
      shares?: number;
    };
    url?: string;
  }>;
  companySignals?: Array<{
    category: string;
    title: string;
    publishedAt: string;
  }>;
  senderContext?: {
    productCategory: string;
    targetPainPoint: string;
  };
  count?: number;
}

export interface Icebreaker {
  text: string;
  type: 'observation' | 'question' | 'compliment' | 'shared_interest' | 'contrarian';
  sourcePost: string;
  naturalness: number;
  segueToProduct: string;
}

export interface IcebreakerOutput {
  icebreakers: Icebreaker[];
}

export function buildIcebreakerPrompt(input: IcebreakerInput): string {
  const count = input.count ?? 5;

  const postsList = input.socialPosts
    .map(
      (p, i) =>
        `  ${i + 1}. [${p.platform.toUpperCase()}] (${p.date})${p.engagementMetrics ? ` | ${p.engagementMetrics.likes || 0} likes, ${p.engagementMetrics.comments || 0} comments` : ''}
     "${p.content.slice(0, 500)}"${p.url ? `\n     URL: ${p.url}` : ''}`
    )
    .join('\n\n');

  const signalsList = input.companySignals
    ? input.companySignals
        .map((s, i) => `  ${i + 1}. [${s.category}] "${s.title}" (${s.publishedAt})`)
        .join('\n')
    : 'No company signals available.';

  return `You are a relationship intelligence specialist who crafts authentic conversation openers for B2B sales professionals. Your icebreakers feel like they come from someone who genuinely follows the prospect's work, not from a sales automation tool.

PROSPECT PROFILE:
- Name: ${input.prospectName}
- Title: ${input.prospectTitle}
- Company: ${input.prospectCompany}

RECENT SOCIAL ACTIVITY:
${postsList}

COMPANY SIGNALS:
${signalsList}

${
  input.senderContext
    ? `SENDER CONTEXT:
- Product Category: ${input.senderContext.productCategory}
- Target Pain Point: ${input.senderContext.targetPainPoint}`
    : ''
}

GENERATE ${count} ICEBREAKERS following these principles:

ICEBREAKER TYPES:
1. OBSERVATION: Reference something specific from their posts that shows you actually read it. Not just "Great post about AI" but "Your point about [specific detail] resonated because..."
2. QUESTION: Ask a thoughtful follow-up question to something they posted. The question should demonstrate domain expertise and genuine curiosity.
3. COMPLIMENT: Acknowledge a specific achievement, insight, or perspective. Must be specific enough that it couldn't apply to anyone else.
4. SHARED_INTEREST: Find a topic where your interests overlap. Reference your own experience or perspective on something they discussed.
5. CONTRARIAN: Respectfully offer an alternative perspective on something they posted. Must add value, not just disagree.

QUALITY CRITERIA:
- Each icebreaker must reference a SPECIFIC post or detail (not generic praise)
- Must feel natural in a first conversation (not forced or overly familiar)
- Should be 1-3 sentences max
- Rate naturalness 0.0-1.0 (1.0 = would say this at a conference networking event)
- Include a "segue to product" suggestion - a natural transition from the icebreaker to a business conversation. This is NOT part of the icebreaker itself; it's a coaching note for the sales rep.

ANTI-PATTERNS (NEVER DO THIS):
- "I loved your recent post about..." (too generic, sounds automated)
- "As a fellow [industry] professional..." (forced connection)
- Mentioning you "stumbled upon" their content (implies you were stalking)
- Over-quoting their exact words back to them (uncanny)
- Flattery without substance ("You're so inspiring")
- Making it about your product too quickly

Respond in JSON format:
{
  "icebreakers": [
    {
      "text": "<the icebreaker, 1-3 sentences>",
      "type": "<observation|question|compliment|shared_interest|contrarian>",
      "sourcePost": "<brief reference to which post inspired this>",
      "naturalness": <number 0-1>,
      "segueToProduct": "<coaching note for transitioning to business conversation>"
    }
  ]
}`;
}
